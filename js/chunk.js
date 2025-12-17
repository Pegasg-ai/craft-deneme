// ========================================
// CHUNK.JS - Chunk Yönetim Sistemi
// Lazy loading, frustum culling, LOD
// ========================================

const CHUNK_SIZE = 16;      // 16x16 blok
const CHUNK_HEIGHT = 64;    // Yükseklik (daha yüksek harita için 64)
let RENDER_DISTANCE = 8;    // Chunk render mesafesi (değiştirilebilir)
let LOAD_DISTANCE = 10;     // Chunk yükleme mesafesi
let UNLOAD_DISTANCE = 12;   // Chunk unload mesafesi

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

// Progressive loading state
let isInitialLoad = true;
let initialLoadRadius = 1;  // Başlangıçta 1 chunk ile başla
let maxInitialRadius = 3;   // Maksimum başlangıç yarıçapı (düşürüldü)
let chunksLoadedThisFrame = 0;
let lastChunkLoadTime = 0;

// Yükleme hızı ayarları - daha yumuşak yükleme
const CHUNKS_PER_FRAME_INITIAL = 1;  // Başlangıç: 1 chunk/frame
const CHUNKS_PER_FRAME_NORMAL = 1;   // Normal: 1 chunk/frame (düşürüldü - daha az kasma)
const CHUNK_LOAD_DELAY = 8;          // ms - frame bütçesi (daha kısa)

// Asenkron yükleme flag
let isChunkLoadPending = false;

// Web Worker Kurulumu
const chunkWorker = new Worker('js/worker.js');
const pendingWorkerJobs = new Map(); // jobId => {cx, cz, resolve}

chunkWorker.onmessage = function(e) {
    const { cx, cz, blocks, jobId } = e.data;
    
    // Job'ı bul
    if (pendingWorkerJobs.has(jobId)) {
        const job = pendingWorkerJobs.get(jobId);
        pendingWorkerJobs.delete(jobId);
        
        // Chunk verisini güncelle
        const chunk = getOrCreateChunk(cx, cz);
        chunk.blocks = blocks; // Transfer edilen array
        chunk.state = CHUNK_STATE.LOADED;
        
        // Mesh oluştur (Main thread'de yapılmak zorunda)
        buildChunkMesh(chunk);
        
        // Promise'i çöz
        if (job.resolve) job.resolve();
    }
};

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

// Chunk'ı yükle (terrain generate) - WORKER KULLANARAK
function generateChunk(chunk) {
    if (chunk.state !== CHUNK_STATE.UNLOADED) return Promise.resolve();
    chunk.state = CHUNK_STATE.LOADING;
    
    return new Promise((resolve) => {
        const jobId = Math.random().toString(36).substr(2, 9);
        pendingWorkerJobs.set(jobId, { cx: chunk.cx, cz: chunk.cz, resolve });
        
        chunkWorker.postMessage({
            cx: chunk.cx,
            cz: chunk.cz,
            jobId: jobId
        });
    });
}

/* ESKİ SENKRON GENERATE KODU - YEDEK
function generateChunkSync(chunk) {
    // ... eski kod ...
}
*/

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

// Chunk mesh oluştur - Occlusion Culling ile optimize edilmiş
function buildChunkMesh(chunk) {
    if (chunk.state !== CHUNK_STATE.LOADED) return null;
    
    const wx = chunk.getWorldX();
    const wz = chunk.getWorldZ();
    
    // Chunk'daki blokları mevcut sisteme ekle - OCCLUSION CULLING ile
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        for (let lz = 0; lz < CHUNK_SIZE; lz++) {
            for (let y = 0; y < CHUNK_HEIGHT; y++) {
                const type = chunk.getBlock(lx, y, lz);
                if (type === 0) continue;
                
                // OCCLUSION CULLING: Tamamen gömülü blokları atla
                // Solid bloklar için tüm 6 komşuyu kontrol et
                const block = BLOCKS[type];
                const isSolid = block && block.type === BLOCK_TYPE.SOLID;
                
                if (isSolid && isBlockFullyOccluded(chunk, lx, y, lz)) {
                    // Bu blok tamamen gömülü, görünmüyor - ATLANDI
                    continue;
                }
                
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

// Occlusion check: Blok tamamen gömülü mü?
function isBlockFullyOccluded(chunk, lx, y, lz) {
    // 6 yöndeki komşuları kontrol et
    // Eğer hepsi solid bloksa, bu blok görünmüyor
    const neighbors = [
        [lx + 1, y, lz],
        [lx - 1, y, lz],
        [lx, y + 1, lz],
        [lx, y - 1, lz],
        [lx, y, lz + 1],
        [lx, y, lz - 1]
    ];
    
    for (const [nx, ny, nz] of neighbors) {
        // Sınır dışı - görünüyor olabilir
        if (ny < 0 || ny >= CHUNK_HEIGHT) return false;
        
        // Chunk sınırı - komşu chunk'a bakmalıyız ama basitlik için görünüyor say
        if (nx < 0 || nx >= CHUNK_SIZE || nz < 0 || nz >= CHUNK_SIZE) return false;
        
        const neighborType = chunk.getBlock(nx, ny, nz);
        if (neighborType === 0) return false; // Boş - görünüyor
        
        const neighborBlock = BLOCKS[neighborType];
        // Saydam veya sıvı blok varsa, bu blok görünüyor
        if (neighborBlock && (
            neighborBlock.type === BLOCK_TYPE.TRANSPARENT ||
            neighborBlock.type === BLOCK_TYPE.LIQUID ||
            neighborBlock.type === BLOCK_TYPE.PLANT
        )) {
            return false;
        }
    }
    
    return true; // Tüm komşular solid - görünmüyor
}

// Chunk unload (memory temizle) - OPTİMİZE
function unloadChunk(chunk) {
    const wx = chunk.getWorldX();
    const wz = chunk.getWorldZ();
    
    // Batch işlem için liste topla
    const blocksToRemove = [];
    
    // Chunk'daki blokları topla
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        for (let lz = 0; lz < CHUNK_SIZE; lz++) {
            for (let y = 0; y < CHUNK_HEIGHT; y++) {
                const type = chunk.getBlock(lx, y, lz);
                if (type === 0) continue;
                
                const x = wx + lx;
                const z = wz + lz;
                blocksToRemove.push({ x, y, z, type });
            }
        }
    }
    
    // Batch kaldırma işlemi
    for (const { x, y, z, type } of blocksToRemove) {
        const key = `${x},${y},${z}`;
        
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
    
    chunk.state = CHUNK_STATE.UNLOADED;
    chunk.blocks.fill(0);
}

// Kamera yönünü al (frustum için)
let cameraDirection = new THREE.Vector3(0, 0, -1);
let cameraPosition = new THREE.Vector3(0, 0, 0);

function updateCameraInfo(camera) {
    if (!camera) return;
    camera.getWorldDirection(cameraDirection);
    cameraPosition.copy(camera.position);
}

// Chunk'ın kameranın görüş alanında olup olmadığını kontrol et - GELİŞTİRİLMİŞ
function isChunkInView(cx, cz, playerX, playerZ) {
    const chunkCenterX = cx * CHUNK_SIZE + CHUNK_SIZE / 2;
    const chunkCenterZ = cz * CHUNK_SIZE + CHUNK_SIZE / 2;
    
    // Chunk'ın oyuncuya göre yönü
    const dirX = chunkCenterX - playerX;
    const dirZ = chunkCenterZ - playerZ;
    const dist = Math.sqrt(dirX * dirX + dirZ * dirZ);
    
    // Çok yakınsa her zaman yükle (2 chunk = 32 blok)
    if (dist < CHUNK_SIZE * 2) return { inView: true, priority: 0 };
    
    // Normalize et
    const normX = dirX / dist;
    const normZ = dirZ / dist;
    
    // Kamera yönü ile dot product
    const dot = normX * cameraDirection.x + normZ * cameraDirection.z;
    
    // Görüş açısı kontrolü (FOV ~100 derece = dot > -0.35)
    // Arkadaki chunk'lar çok düşük öncelikli ama yine de yüklenebilir
    const inFrontOfPlayer = dot > -0.35;
    
    // Öncelik hesaplama:
    // - Önde ve yakın = en yüksek öncelik (düşük değer)
    // - Arkada = çok düşük öncelik (yüksek değer)
    let priority;
    if (inFrontOfPlayer) {
        // Önde: mesafe * (1 - dot) - dot 1'e yakınsa öncelik düşer
        priority = dist * (1.5 - dot);
    } else {
        // Arkada: çok yüksek öncelik değeri
        priority = dist * 5;
    }
    
    return { inView: inFrontOfPlayer, priority };
}

// Chunk yönetim döngüsü (her frame çağrılır) - OPTİMİZE EDİLMİŞ
function updateChunks(playerX, playerZ, camera) {
    const { cx: pcx, cz: pcz } = worldToChunk(playerX, playerZ);
    const now = performance.now();
    
    // Kamera bilgisini güncelle
    if (camera) updateCameraInfo(camera);
    
    // Oyuncu yeni chunk'a girdiyse veya kuyruk boşsa yeniden hesapla
    const needsQueueUpdate = pcx !== playerChunkX || pcz !== playerChunkZ || chunkQueue.length === 0;
    
    if (needsQueueUpdate) {
        playerChunkX = pcx;
        playerChunkZ = pcz;
        
        // Kuyruğu temizle ve yeniden oluştur
        chunkQueue.length = 0;
        
        // Yeni chunk'ları yükleme kuyruğuna ekle (öncelik sırasıyla)
        const loadDist = isInitialLoad ? Math.min(initialLoadRadius, maxInitialRadius) : LOAD_DISTANCE;
        
        for (let dx = -loadDist; dx <= loadDist; dx++) {
            for (let dz = -loadDist; dz <= loadDist; dz++) {
                const dist = Math.sqrt(dx * dx + dz * dz);
                if (dist > loadDist) continue;
                
                const cx = pcx + dx;
                const cz = pcz + dz;
                const key = `${cx},${cz}`;
                
                if (!chunks.has(key) || chunks.get(key).state === CHUNK_STATE.UNLOADED) {
                    const viewInfo = isChunkInView(cx, cz, playerX, playerZ);
                    chunkQueue.push({ 
                        cx, 
                        cz, 
                        dist,
                        priority: viewInfo.priority,
                        inView: viewInfo.inView
                    });
                }
            }
        }
        
        // Önceliğe göre sırala (görüş alanındakiler önce, sonra mesafe)
        chunkQueue.sort((a, b) => {
            // Önce görüş alanındakileri yükle
            if (a.inView && !b.inView) return -1;
            if (!a.inView && b.inView) return 1;
            // Sonra önceliğe göre
            return a.priority - b.priority;
        });
        
        // Uzak chunk'ları unload et - her 500ms'de bir (performans için)
        if (now - lastUnloadCheck > 500) {
            lastUnloadCheck = now;
            visibleChunkCount = 0;
            
            for (const [key, chunk] of chunks) {
                const dx = chunk.cx - pcx;
                const dz = chunk.cz - pcz;
                const dist = Math.sqrt(dx * dx + dz * dz);
                
                if (dist > UNLOAD_DISTANCE && chunk.state === CHUNK_STATE.MESHED) {
                    unloadChunk(chunk);
                } else if (chunk.state === CHUNK_STATE.MESHED) {
                    // Görünür chunk sayısı
                    const viewInfo = isChunkInView(chunk.cx, chunk.cz, playerX, playerZ);
                    if (viewInfo.inView) visibleChunkCount++;
                }
            }
        }
    }
    
    // Async chunk yükleme - requestIdleCallback veya microtask
    if (chunkQueue.length > 0 && !isChunkLoadPending) {
        isChunkLoadPending = true;
        
        // requestIdleCallback varsa kullan, yoksa setTimeout
        const loadChunkAsync = (deadline) => {
            // Zaman bütçesi kontrolü (4ms max - 60fps için)
            const timeLimit = deadline ? deadline.timeRemaining() : 4;
            let loaded = 0;
            
            while (chunkQueue.length > 0 && loaded < 2) {
                const { cx, cz, inView } = chunkQueue.shift();
                
                // Görüş alanı dışındaki chunk'ları ertele (yoğunsa)
                if (!inView && !isInitialLoad && chunkQueue.length > 10) {
                    chunkQueue.push({ cx, cz, dist: 999, priority: 999, inView: false });
                    continue;
                }
                
                const chunk = getOrCreateChunk(cx, cz);
                
                if (chunk.state === CHUNK_STATE.UNLOADED) {
                    // Worker ile asenkron yükle
                    generateChunk(chunk).then(() => {
                        chunksLoadedThisFrame++;
                    });
                    
                    loaded++; // Worker'a iş gönderildi, bu frame için yeterli
                    lastChunkLoadTime = now;
                }
                
                // Zaman bütçesi dolduysa dur
                if (deadline && deadline.timeRemaining() < 1) break;
            }
            
            isChunkLoadPending = false;
            
            // Hala kuyrukta varsa devam et
            if (chunkQueue.length > 0) {
                scheduleChunkLoad();
            }
        };
        
        // Scheduler seçimi
        const scheduleChunkLoad = () => {
            if (typeof requestIdleCallback !== 'undefined') {
                requestIdleCallback(loadChunkAsync, { timeout: 100 });
            } else {
                setTimeout(() => loadChunkAsync(null), 16);
            }
        };
        
        scheduleChunkLoad();
    }
    
    // Progressive loading: başlangıç yarıçapını artır
    if (isInitialLoad && chunkQueue.length === 0 && initialLoadRadius <= maxInitialRadius) {
        initialLoadRadius++;
        if (initialLoadRadius > maxInitialRadius) {
            isInitialLoad = false;
            console.log('[Chunks] Initial load complete, switching to normal mode');
        }
    }
}

// Son unload kontrolü zamanı
let lastUnloadCheck = 0;

// Chunk sistemini başlat
function initChunkSystem() {
    console.log("[Chunks] System initialized");
    console.log(`[Chunks] Chunk size: ${CHUNK_SIZE}x${CHUNK_HEIGHT}x${CHUNK_SIZE}`);
    console.log(`[Chunks] Render distance: ${RENDER_DISTANCE} chunks`);
    
    // Progressive loading sıfırla
    isInitialLoad = true;
    initialLoadRadius = 1;
    chunksLoadedThisFrame = 0;
    chunkQueue.length = 0;
}

// Render mesafesini değiştir
function setChunkRenderDistance(distance) {
    RENDER_DISTANCE = Math.max(2, Math.min(16, distance));
    LOAD_DISTANCE = RENDER_DISTANCE + 2;
    UNLOAD_DISTANCE = RENDER_DISTANCE + 4;
    console.log(`[Chunks] Render distance set to ${RENDER_DISTANCE}`);
}

// Görünür chunk sayacı
let visibleChunkCount = 0;

// Chunk yükleme durumu
function getChunkLoadingStatus() {
    return {
        isInitialLoad,
        loadRadius: initialLoadRadius,
        queueLength: chunkQueue.length,
        loadedChunks: chunks.size,
        chunksThisFrame: chunksLoadedThisFrame,
        visibleChunks: visibleChunkCount
    };
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
