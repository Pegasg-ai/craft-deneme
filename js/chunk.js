// ========================================
// CHUNK.JS - Chunk Yönetim Sistemi
// Lazy loading, frustum culling, LOD
// ========================================

const CHUNK_SIZE = 16;      // 16x16 blok
const CHUNK_HEIGHT = 64;    // Yükseklik (daha yüksek harita için 64)
const RENDER_DISTANCE = 8;  // Chunk render mesafesi
const LOAD_DISTANCE = 10;   // Chunk yükleme mesafesi
const UNLOAD_DISTANCE = 12; // Chunk unload mesafesi

// Chunk durumları
const CHUNK_STATE = {
    UNLOADED: 0,
    LOADING: 1,
    LOADED: 2,
    MESHED: 3
};

// Chunk storage
const chunks = new Map();           // key: "cx,cz" => ChunkData
const chunkMeshes = new Map();      // key: "cx,cz" => THREE.Mesh
const chunkQueue = [];              // Yüklenecek chunk'lar

// Oyuncu chunk pozisyonu
let playerChunkX = 0;
let playerChunkZ = 0;

// Chunk sınıfı
class ChunkData {
    constructor(cx, cz) {
        this.cx = cx;
        this.cz = cz;
        this.key = `${cx},${cz}`;
        this.state = CHUNK_STATE.UNLOADED;
        this.blocks = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);
        this.mesh = null;
        this.plantInstances = []; // Bitki instance'ları
        this.lastAccess = performance.now();
    }
    
    // Blok index hesapla (x,y,z lokal koordinatlar)
    getIndex(x, y, z) {
        return x + z * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE;
    }
    
    // Blok al
    getBlock(x, y, z) {
        if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) {
            return 0;
        }
        return this.blocks[this.getIndex(x, y, z)];
    }
    
    // Blok koy
    setBlock(x, y, z, type) {
        if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) {
            return false;
        }
        this.blocks[this.getIndex(x, y, z)] = type;
        return true;
    }
    
    // Chunk world koordinatları
    getWorldX() { return this.cx * CHUNK_SIZE; }
    getWorldZ() { return this.cz * CHUNK_SIZE; }
}

// World koordinatlarından chunk koordinatlarını al
function worldToChunk(x, z) {
    return {
        cx: Math.floor(x / CHUNK_SIZE),
        cz: Math.floor(z / CHUNK_SIZE)
    };
}

// World koordinatlarından lokal chunk koordinatlarını al
function worldToLocal(x, z) {
    return {
        lx: ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE,
        lz: ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE
    };
}

// Chunk'ı al veya oluştur
function getOrCreateChunk(cx, cz) {
    const key = `${cx},${cz}`;
    if (!chunks.has(key)) {
        chunks.set(key, new ChunkData(cx, cz));
    }
    return chunks.get(key);
}

// Chunk'ı yükle (terrain generate) - BIOME BASED
function generateChunk(chunk) {
    if (chunk.state !== CHUNK_STATE.UNLOADED) return;
    chunk.state = CHUNK_STATE.LOADING;
    
    const wx = chunk.getWorldX();
    const wz = chunk.getWorldZ();
    
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        for (let lz = 0; lz < CHUNK_SIZE; lz++) {
            const x = wx + lx;
            const z = wz + lz;
            
            // Multi-octave noise for height
            let n1 = noise2D(x / 60, z / 60);
            let n2 = noise2D(x / 20, z / 20) * 0.2;
            let n = (n1 + n2);
            
            // Height 4-20 (daha yüksek dağlar)
            let h = Math.floor((n + 1) * 8) + 4;
            h = Math.min(h, CHUNK_HEIGHT - 1);
            
            // Biyom belirleme
            const biomeType = typeof getBiomeAt === 'function' ? getBiomeAt(x, z) : BIOME_TYPE.PLAINS;
            const biome = typeof getBiomeInfo === 'function' ? getBiomeInfo(biomeType) : null;
            
            // Biyom varsa ona göre generate et
            if (biome) {
                // Bedrock
                chunk.setBlock(lx, 0, lz, 63);
                
                // Fill layers
                for (let y = 1; y < h; y++) {
                    let type = biome.fillerBlock || 3; // Stone default
                    
                    // Cave generation
                    if (y > 1 && y < h - 2) {
                        const caveNoise = noise3D(x / 20, y / 20, z / 20);
                        if (caveNoise > 0.4) continue;
                    }
                    
                    // Ore generation
                    if (y < h - 3 && type === 3) {
                        const oreRoll = Math.abs((x * 7919 + y * 6997 + z * 5653) % 10000) / 10000;
                        if (y <= 16 && oreRoll < 0.002) type = 24; // Diamond
                        else if (y <= 16 && oreRoll < 0.010) type = 26; // Redstone
                        else if (y <= 32 && oreRoll < 0.006) type = 23; // Gold
                        else if (y <= 64 && oreRoll < 0.015) type = 22; // Iron
                        else if (oreRoll < 0.020) type = 21; // Coal
                    }
                    
                    // Surface layers - biyoma göre
                    if (y === h - 1) {
                        type = biome.surfaceBlock;
                    } else if (y >= h - 4) {
                        type = biome.underBlock;
                    }
                    
                    chunk.setBlock(lx, y, lz, type);
                }
                
                // Su seviyesi (ocean/swamp için)
                if (h <= biome.waterLevel) {
                    for (let y = h; y <= biome.waterLevel; y++) {
                        chunk.setBlock(lx, y, lz, 6); // Water
                    }
                } else {
                    // Decorations - biyom bitkileri ve ağaçları
                    decorateBiomeChunk(chunk, lx, lz, h, biomeType, biome);
                }
            } else {
                // Fallback - eski sistem (biomes.js yüklenmemişse)
                generateChunkLegacy(chunk, lx, lz, h, x, z);
            }
        }
    }
    
    chunk.state = CHUNK_STATE.LOADED;
}

// Biyom dekorasyonları chunk için
function decorateBiomeChunk(chunk, lx, lz, height, biomeType, biome) {
    const wx = chunk.getWorldX() + lx;
    const wz = chunk.getWorldZ() + lz;
    
    // Ağaç kontrolü
    for (const treeConfig of biome.trees) {
        const treeRoll = Math.abs((wx * 3571 + wz * 2953) % 10000) / 10000;
        if (treeRoll < treeConfig.chance) {
            generateTree(chunk, lx, height, lz, treeConfig.type);
            return; // Ağaç varsa bitki koyma
        }
    }
    
    // Bitki kontrolü
    for (const plantConfig of biome.plants) {
        const plantRoll = Math.abs((wx * 7877 + wz * 6991) % 10000) / 10000;
        if (plantRoll < plantConfig.chance) {
            chunk.setBlock(lx, height, lz, plantConfig.id);
            return;
        }
    }
}

// Eski terrain sistemi (fallback)
function generateChunkLegacy(chunk, lx, lz, h, x, z) {
    chunk.setBlock(lx, 0, lz, 63); // Bedrock
    
    for (let y = 1; y < h; y++) {
        let type = 3; // Stone
        
        if (y > 1 && y < h - 2) {
            const caveNoise = noise3D(x / 20, y / 20, z / 20);
            if (caveNoise > 0.4) continue;
        }
        
        if (y === h - 1) {
            if (h <= 5) type = 7;
            else if (h > 16) type = 8;
            else type = 1;
        } else if (y >= h - 4) {
            type = 2;
        }
        
        chunk.setBlock(lx, y, lz, type);
    }
}

// Ağaç generate (biyoma göre farklı tipler)
function generateTree(chunk, lx, y, lz, type) {
    // Ağaç tipine göre log ve yaprak ID
    let logId, leafId, height, style;
    
    switch(type) {
        case 'birch':
            logId = 11;   // BirchLog
            leafId = 57;  // BirchLeaves
            height = 5 + Math.floor(Math.random() * 2);
            style = 'standard';
            break;
        case 'spruce':
            logId = 12;   // SpruceLog
            leafId = 58;  // SpruceLeaves
            height = 6 + Math.floor(Math.random() * 3);
            style = 'conifer';
            break;
        case 'jungle':
            logId = 4;    // OakLog (jungle log olsa güzel)
            leafId = 5;   // JungleLeaves olsa güzel
            height = 8 + Math.floor(Math.random() * 6);
            style = 'tall';
            break;
        case 'acacia':
            logId = 4;    // AcaciaLog olsa güzel
            leafId = 5;   // AcaciaLeaves olsa güzel
            height = 5 + Math.floor(Math.random() * 2);
            style = 'acacia';
            break;
        default: // oak
            logId = 4;
            leafId = 5;
            height = 4 + Math.floor(Math.random() * 2);
            style = 'standard';
    }
    
    // Gövde
    for (let i = 0; i < height; i++) {
        if (y + i < CHUNK_HEIGHT) {
            chunk.setBlock(lx, y + i, lz, logId);
        }
    }
    
    // Yapraklar - stile göre
    if (style === 'conifer') {
        // Spruce - koni şekli
        for (let layer = 0; layer < 4; layer++) {
            const layerY = y + height - 3 + layer;
            const radius = 2 - Math.floor(layer / 2);
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dz = -radius; dz <= radius; dz++) {
                    const nx = lx + dx;
                    const nz = lz + dz;
                    if (nx < 0 || nx >= CHUNK_SIZE || nz < 0 || nz >= CHUNK_SIZE) continue;
                    if (layerY >= CHUNK_HEIGHT) continue;
                    if (Math.abs(dx) === radius && Math.abs(dz) === radius && layer < 3) continue;
                    if (chunk.getBlock(nx, layerY, nz) === 0) {
                        chunk.setBlock(nx, layerY, nz, leafId);
                    }
                }
            }
        }
        // Tepede tek yaprak
        if (y + height < CHUNK_HEIGHT) {
            chunk.setBlock(lx, y + height, lz, leafId);
        }
    } else if (style === 'tall') {
        // Jungle - uzun ve geniş
        for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) {
                for (let dy = height - 3; dy <= height; dy++) {
                    const nx = lx + dx;
                    const nz = lz + dz;
                    const ny = y + dy;
                    if (nx < 0 || nx >= CHUNK_SIZE || nz < 0 || nz >= CHUNK_SIZE) continue;
                    if (ny >= CHUNK_HEIGHT) continue;
                    const dist = Math.abs(dx) + Math.abs(dz);
                    if (dist > 3) continue;
                    if (chunk.getBlock(nx, ny, nz) === 0) {
                        chunk.setBlock(nx, ny, nz, leafId);
                    }
                }
            }
        }
    } else if (style === 'acacia') {
        // Acacia - şemsiye şekli (düz üst)
        const topY = y + height;
        for (let dx = -3; dx <= 3; dx++) {
            for (let dz = -3; dz <= 3; dz++) {
                const nx = lx + dx;
                const nz = lz + dz;
                if (nx < 0 || nx >= CHUNK_SIZE || nz < 0 || nz >= CHUNK_SIZE) continue;
                if (topY >= CHUNK_HEIGHT) continue;
                const dist = Math.abs(dx) + Math.abs(dz);
                if (dist > 4) continue;
                if (chunk.getBlock(nx, topY, nz) === 0) {
                    chunk.setBlock(nx, topY, nz, leafId);
                }
                // Alt katman daha küçük
                if (dist <= 2 && topY - 1 >= 0 && chunk.getBlock(nx, topY - 1, nz) === 0) {
                    chunk.setBlock(nx, topY - 1, nz, leafId);
                }
            }
        }
    } else {
        // Standard (oak/birch) - küresel
        for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) {
                for (let dy = height - 2; dy <= height + 1; dy++) {
                    const nx = lx + dx;
                    const nz = lz + dz;
                    const ny = y + dy;
                    
                    if (nx < 0 || nx >= CHUNK_SIZE || nz < 0 || nz >= CHUNK_SIZE) continue;
                    if (ny >= CHUNK_HEIGHT) continue;
                    if (Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;
                    if (chunk.getBlock(nx, ny, nz) === 0) {
                        chunk.setBlock(nx, ny, nz, leafId);
                    }
                }
            }
        }
    }
}

// Chunk mesh oluştur (Greedy Meshing için hazırlık - şimdilik basit)
function buildChunkMesh(chunk) {
    if (chunk.state !== CHUNK_STATE.LOADED) return null;
    
    const wx = chunk.getWorldX();
    const wz = chunk.getWorldZ();
    
    // Chunk'daki blokları mevcut sisteme ekle
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        for (let lz = 0; lz < CHUNK_SIZE; lz++) {
            for (let y = 0; y < CHUNK_HEIGHT; y++) {
                const type = chunk.getBlock(lx, y, lz);
                if (type === 0) continue;
                
                const x = wx + lx;
                const z = wz + lz;
                
                // Mevcut setBlock sistemini kullan (broadcast=false)
                setBlock(x, y, z, type, false);
            }
        }
    }
    
    chunk.state = CHUNK_STATE.MESHED;
    return true;
}

// Chunk unload (memory temizle)
function unloadChunk(chunk) {
    const wx = chunk.getWorldX();
    const wz = chunk.getWorldZ();
    
    // Chunk'daki blokları kaldır
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        for (let lz = 0; lz < CHUNK_SIZE; lz++) {
            for (let y = 0; y < CHUNK_HEIGHT; y++) {
                const type = chunk.getBlock(lx, y, lz);
                if (type === 0) continue;
                
                const x = wx + lx;
                const z = wz + lz;
                const key = `${x},${y},${z}`;
                
                // voxelData'dan sil
                if (voxelData.has(key)) {
                    const old = voxelData.get(key);
                    const block = BLOCKS[old.type];
                    if (block && block.type === BLOCK_TYPE.PLANT) {
                        removePlantInstance(x, y, z);
                    } else if (imeshes[old.type]) {
                        removeInstance(old.type, old.index);
                    }
                    voxelData.delete(key);
                }
            }
        }
    }
    
    chunk.state = CHUNK_STATE.UNLOADED;
    chunk.blocks.fill(0);
}

// Chunk yönetim döngüsü (her frame çağrılır)
function updateChunks(playerX, playerZ) {
    const { cx: pcx, cz: pcz } = worldToChunk(playerX, playerZ);
    
    // Oyuncu yeni chunk'a girdiyse
    if (pcx !== playerChunkX || pcz !== playerChunkZ) {
        playerChunkX = pcx;
        playerChunkZ = pcz;
        
        // Yeni chunk'ları yükleme kuyruğuna ekle
        for (let dx = -LOAD_DISTANCE; dx <= LOAD_DISTANCE; dx++) {
            for (let dz = -LOAD_DISTANCE; dz <= LOAD_DISTANCE; dz++) {
                const dist = Math.sqrt(dx * dx + dz * dz);
                if (dist > LOAD_DISTANCE) continue;
                
                const cx = pcx + dx;
                const cz = pcz + dz;
                const key = `${cx},${cz}`;
                
                if (!chunks.has(key) || chunks.get(key).state === CHUNK_STATE.UNLOADED) {
                    chunkQueue.push({ cx, cz, dist });
                }
            }
        }
        
        // Uzak chunk'ları unload et
        for (const [key, chunk] of chunks) {
            const dx = chunk.cx - pcx;
            const dz = chunk.cz - pcz;
            const dist = Math.sqrt(dx * dx + dz * dz);
            
            if (dist > UNLOAD_DISTANCE && chunk.state === CHUNK_STATE.MESHED) {
                unloadChunk(chunk);
            }
        }
        
        // Kuyruğu mesafeye göre sırala (yakın chunk'lar önce)
        chunkQueue.sort((a, b) => a.dist - b.dist);
    }
    
    // Frame başına 1-2 chunk yükle (kasma önleme)
    const chunksPerFrame = 2;
    for (let i = 0; i < chunksPerFrame && chunkQueue.length > 0; i++) {
        const { cx, cz } = chunkQueue.shift();
        const chunk = getOrCreateChunk(cx, cz);
        
        if (chunk.state === CHUNK_STATE.UNLOADED) {
            generateChunk(chunk);
            buildChunkMesh(chunk);
        }
    }
}

// Chunk sistemini başlat
function initChunkSystem() {
    console.log("[Chunks] System initialized");
    console.log(`[Chunks] Chunk size: ${CHUNK_SIZE}x${CHUNK_HEIGHT}x${CHUNK_SIZE}`);
    console.log(`[Chunks] Render distance: ${RENDER_DISTANCE} chunks`);
}

// Chunk içinde blok koy (dış erişim için)
function setBlockInChunk(x, y, z, type) {
    const { cx, cz } = worldToChunk(x, z);
    const { lx, lz } = worldToLocal(x, z);
    
    const chunk = getOrCreateChunk(cx, cz);
    chunk.setBlock(lx, y, lz, type);
    
    // Eğer chunk mesh'lenmişse, instance güncelle
    if (chunk.state === CHUNK_STATE.MESHED) {
        setBlock(x, y, z, type, true);
    }
}

// Chunk içinden blok al
function getBlockFromChunk(x, y, z) {
    const { cx, cz } = worldToChunk(x, z);
    const { lx, lz } = worldToLocal(x, z);
    const key = `${cx},${cz}`;
    
    if (!chunks.has(key)) return 0;
    return chunks.get(key).getBlock(lx, y, lz);
}

console.log("[Chunk] Module loaded");
