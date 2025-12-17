// ========================================
// WORKER.JS - Arka Plan Chunk Hesaplayıcısı
// ========================================

// Sabitler (chunk.js ile aynı olmalı)
const CHUNK_SIZE = 16;
const CHUNK_HEIGHT = 64;

// Basit Simplex Noise implementasyonu (Worker içinde harici kütüphane yüklemek yerine)
// Hızlı ve hafif bir noise fonksiyonu
const Perm = new Uint8Array(512);
const Grad = new Int8Array([
    1,1,0, -1,1,0, 1,-1,0, -1,-1,0,
    1,0,1, -1,0,1, 1,0,-1, -1,0,-1,
    0,1,1, 0,-1,1, 0,1,-1, 0,-1,-1
]);

function seed(s) {
    for(let i=0; i<256; i++) Perm[i] = i;
    for(let i=0; i<256; i++) {
        const r = (Math.random()*256)|0;
        const t = Perm[i]; Perm[i] = Perm[r]; Perm[r] = t;
    }
    for(let i=0; i<256; i++) Perm[i+256] = Perm[i];
}
seed(Date.now());

function dot(g, x, y) { return g[0]*x + g[1]*y; }
function dot3(g, x, y, z) { return g[0]*x + g[1]*y + g[2]*z; }

function noise2D(x, y) {
    const F2 = 0.5*(Math.sqrt(3.0)-1.0);
    const G2 = (3.0-Math.sqrt(3.0))/6.0;
    let n0, n1, n2;
    let s = (x+y)*F2;
    let i = Math.floor(x+s);
    let j = Math.floor(y+s);
    let t = (i+j)*G2;
    let X0 = i-t;
    let Y0 = j-t;
    let x0 = x-X0;
    let y0 = y-Y0;
    let i1, j1;
    if(x0>y0) {i1=1; j1=0;} else {i1=0; j1=1;}
    let x1 = x0 - i1 + G2;
    let y1 = y0 - j1 + G2;
    let x2 = x0 - 1.0 + 2.0 * G2;
    let y2 = y0 - 1.0 + 2.0 * G2;
    let ii = i & 255;
    let jj = j & 255;
    let gi0 = (Perm[ii+Perm[jj]] % 12)*3;
    let gi1 = (Perm[ii+i1+Perm[jj+j1]] % 12)*3;
    let gi2 = (Perm[ii+1+Perm[jj+1]] % 12)*3;
    let t0 = 0.5 - x0*x0 - y0*y0;
    if(t0<0) n0 = 0.0;
    else {t0 *= t0; n0 = t0 * t0 * dot([Grad[gi0], Grad[gi0+1]], x0, y0);}
    let t1 = 0.5 - x1*x1 - y1*y1;
    if(t1<0) n1 = 0.0;
    else {t1 *= t1; n1 = t1 * t1 * dot([Grad[gi1], Grad[gi1+1]], x1, y1);}
    let t2 = 0.5 - x2*x2 - y2*y2;
    if(t2<0) n2 = 0.0;
    else {t2 *= t2; n2 = t2 * t2 * dot([Grad[gi2], Grad[gi2+1]], x2, y2);}
    return 70.0 * (n0 + n1 + n2);
}

function noise3D(x, y, z) {
    // Basit 3D noise (mağaralar için)
    // Tam implementasyon uzun olduğu için basitleştirilmiş versiyon
    return Math.sin(x) * Math.cos(y) * Math.sin(z); 
}

// Biyom verileri (chunk.js'den kopyalandı)
const BIOME_TYPE = {
    PLAINS: 0,
    DESERT: 1,
    SNOW: 2,
    FOREST: 3,
    MOUNTAINS: 4
};

// Ana thread'den mesaj gelince
self.onmessage = function(e) {
    const { cx, cz, jobId } = e.data;
    
    // Chunk verisini oluştur
    const blocks = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);
    const wx = cx * CHUNK_SIZE;
    const wz = cz * CHUNK_SIZE;
    
    // Terrain Generation
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        for (let lz = 0; lz < CHUNK_SIZE; lz++) {
            const x = wx + lx;
            const z = wz + lz;
            
            // Multi-octave noise
            let n1 = noise2D(x / 60, z / 60);
            let n2 = noise2D(x / 20, z / 20) * 0.2;
            let n = (n1 + n2);
            
            // Height calculation
            let h = Math.floor((n + 1) * 8) + 4;
            h = Math.min(h, CHUNK_HEIGHT - 1);
            h = Math.max(1, h);
            
            // Basit Biyom Belirleme (Sıcaklık/Nem simülasyonu)
            let temp = noise2D(x/200, z/200);
            let biome = BIOME_TYPE.PLAINS;
            if (h > 25) biome = BIOME_TYPE.MOUNTAINS;
            else if (temp > 0.3) biome = BIOME_TYPE.DESERT;
            else if (temp < -0.3) biome = BIOME_TYPE.SNOW;
            else if (Math.random() > 0.5) biome = BIOME_TYPE.FOREST;
            
            // Bedrock
            blocks[lx + 0 * CHUNK_SIZE * CHUNK_SIZE + lz * CHUNK_SIZE] = 63; // Bedrock
            
            // Katmanları doldur
            for (let y = 1; y < h; y++) {
                let type = 3; // Stone default
                
                // Mağara (basit)
                if (y > 1 && y < h - 2) {
                    // 3D noise yerine basit matematiksel mağara
                    if (Math.abs(Math.sin(x/5) * Math.cos(y/5) * Math.sin(z/5)) > 0.8) {
                        continue; // Hava (mağara)
                    }
                }
                
                // Yüzey blokları
                if (y === h - 1) {
                    if (biome === BIOME_TYPE.DESERT) type = 7; // Sand
                    else if (biome === BIOME_TYPE.SNOW) type = 8; // Snow
                    else if (biome === BIOME_TYPE.MOUNTAINS) type = 3; // Stone
                    else type = 1; // Grass
                } else if (y >= h - 4) {
                    if (biome === BIOME_TYPE.DESERT) type = 7; // Sand
                    else type = 2; // Dirt
                }
                
                // Ore generation (basit)
                if (type === 3) {
                    const r = Math.random();
                    if (y < 16 && r < 0.002) type = 24; // Diamond
                    else if (y < 32 && r < 0.006) type = 23; // Gold
                    else if (y < 48 && r < 0.015) type = 22; // Iron
                    else if (r < 0.020) type = 21; // Coal
                }
                
                blocks[lx + y * CHUNK_SIZE * CHUNK_SIZE + lz * CHUNK_SIZE] = type;
            }
            
            // Su seviyesi
            const WATER_LEVEL = 6;
            if (h <= WATER_LEVEL) {
                for (let y = h; y <= WATER_LEVEL; y++) {
                    blocks[lx + y * CHUNK_SIZE * CHUNK_SIZE + lz * CHUNK_SIZE] = 9; // Water
                }
            }
            
            // Ağaçlar (Basit - detaylı ağaçlar main thread'de eklenebilir veya buraya taşınabilir)
            // Şimdilik sadece yer işaretliyoruz, main thread ağaçları dikecek
            // Veya basit ağaçları burada yapabiliriz
            if (biome === BIOME_TYPE.FOREST && h > WATER_LEVEL && Math.random() < 0.05) {
                // Ağaç kökü işareti (Main thread bunu algılayıp ağaç dikebilir)
                // Veya direkt kütük koyalım
                if (h < CHUNK_HEIGHT - 5) {
                    // Basit ağaç
                    for(let i=0; i<4; i++) {
                        blocks[lx + (h+i) * CHUNK_SIZE * CHUNK_SIZE + lz * CHUNK_SIZE] = 4; // Log
                    }
                    // Yapraklar
                    for(let dx=-2; dx<=2; dx++) {
                        for(let dz=-2; dz<=2; dz++) {
                            for(let dy=2; dy<=4; dy++) {
                                if (Math.abs(dx)+Math.abs(dz) > 2) continue;
                                const nx = lx + dx;
                                const nz = lz + dz;
                                const ny = h + dy;
                                if (nx>=0 && nx<CHUNK_SIZE && nz>=0 && nz<CHUNK_SIZE && ny<CHUNK_HEIGHT) {
                                    const idx = nx + ny * CHUNK_SIZE * CHUNK_SIZE + nz * CHUNK_SIZE;
                                    if (blocks[idx] === 0) blocks[idx] = 5; // Leaf
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Sonucu geri gönder (Transferable object kullanarak hızlı transfer)
    self.postMessage({ cx, cz, blocks, jobId }, [blocks.buffer]);
};