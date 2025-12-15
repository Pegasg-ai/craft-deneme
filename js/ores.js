// ========================================
// ORES.JS - Cevher Damarları ve Mining Sistemi
// Gerçekçi cevher dağılımı ve damar oluşumu
// ========================================

// Cevher tanımları
const ORE_TYPES = {
    coal: {
        id: 21,
        name: 'Coal Ore',
        minY: 0,
        maxY: 128,
        veinSize: { min: 8, max: 17 },
        veinsPerChunk: 20,
        rarity: 1.0  // En yaygın
    },
    iron: {
        id: 22,
        name: 'Iron Ore',
        minY: 0,
        maxY: 64,
        veinSize: { min: 4, max: 9 },
        veinsPerChunk: 12,
        rarity: 0.85
    },
    gold: {
        id: 23,
        name: 'Gold Ore',
        minY: 0,
        maxY: 32,
        veinSize: { min: 4, max: 8 },
        veinsPerChunk: 4,
        rarity: 0.5
    },
    diamond: {
        id: 24,
        name: 'Diamond Ore',
        minY: 0,
        maxY: 16,
        veinSize: { min: 2, max: 8 },
        veinsPerChunk: 2,
        rarity: 0.15
    },
    emerald: {
        id: 25,
        name: 'Emerald Ore',
        minY: 4,
        maxY: 32,
        veinSize: { min: 1, max: 2 },  // Çok küçük damarlar
        veinsPerChunk: 1,
        rarity: 0.05,
        biomes: [BIOME_TYPE.SNOWY]  // Sadece dağlarda
    },
    redstone: {
        id: 26,
        name: 'Redstone Ore',
        minY: 0,
        maxY: 16,
        veinSize: { min: 4, max: 8 },
        veinsPerChunk: 8,
        rarity: 0.6
    },
    lapis: {
        id: 27,
        name: 'Lapis Lazuli Ore',
        minY: 0,
        maxY: 30,
        veinSize: { min: 2, max: 7 },
        veinsPerChunk: 2,
        rarity: 0.25,
        // Lapis en çok Y=14'te bulunur (Minecraft benzeri)
        peakY: 14
    },
    copper: {
        id: 28,
        name: 'Copper Ore',
        minY: 0,
        maxY: 96,
        veinSize: { min: 6, max: 12 },
        veinsPerChunk: 16,
        rarity: 0.9,
        peakY: 48
    }
};

// Nadir bloklar (cevher değil ama yer altında)
const UNDERGROUND_FEATURES = {
    gravel: {
        id: 9,      // Gravel
        minY: 1,
        maxY: 64,
        veinSize: { min: 16, max: 33 },
        veinsPerChunk: 8
    },
    dirt: {
        id: 2,      // Dirt
        minY: 1,
        maxY: 64,
        veinSize: { min: 16, max: 33 },
        veinsPerChunk: 10
    },
    granite: {
        id: 29,     // Granite
        minY: 0,
        maxY: 80,
        veinSize: { min: 33, max: 64 },
        veinsPerChunk: 10
    },
    diorite: {
        id: 30,     // Diorite
        minY: 0,
        maxY: 80,
        veinSize: { min: 33, max: 64 },
        veinsPerChunk: 10
    },
    andesite: {
        id: 31,     // Andesite
        minY: 0,
        maxY: 80,
        veinSize: { min: 33, max: 64 },
        veinsPerChunk: 10
    }
};

// Deterministic random for ore placement
function oreRandom(x, y, z, seed) {
    const n = Math.sin(x * 12.9898 + y * 78.233 + z * 45.164 + seed * 93.9893) * 43758.5453;
    return n - Math.floor(n);
}

// Damar şekli oluştur (blob-benzeri)
function generateVein(getBlock, setBlock, startX, startY, startZ, oreId, size, seed) {
    let placed = 0;
    const positions = [];
    
    // Başlangıç noktası
    positions.push({ x: startX, y: startY, z: startZ });
    
    let attempts = 0;
    const maxAttempts = size * 4;
    
    while (placed < size && positions.length > 0 && attempts < maxAttempts) {
        attempts++;
        
        // Rastgele bir pozisyon seç
        const idx = Math.floor(oreRandom(startX, attempts, startZ, seed) * positions.length);
        const pos = positions[idx];
        
        // Bu pozisyonda taş var mı kontrol et
        const currentBlock = getBlock(pos.x, pos.y, pos.z);
        if (currentBlock === 3) { // Stone
            setBlock(pos.x, pos.y, pos.z, oreId);
            placed++;
            
            // Komşu pozisyonları ekle
            const dirs = [
                { x: 1, y: 0, z: 0 },
                { x: -1, y: 0, z: 0 },
                { x: 0, y: 1, z: 0 },
                { x: 0, y: -1, z: 0 },
                { x: 0, y: 0, z: 1 },
                { x: 0, y: 0, z: -1 }
            ];
            
            for (const dir of dirs) {
                const nx = pos.x + dir.x;
                const ny = pos.y + dir.y;
                const nz = pos.z + dir.z;
                
                // Yayılma olasılığı
                if (oreRandom(nx, ny, nz, seed + attempts) < 0.6) {
                    positions.push({ x: nx, y: ny, z: nz });
                }
            }
        }
        
        // Kullanılan pozisyonu kaldır
        positions.splice(idx, 1);
    }
    
    return placed;
}

// Chunk için cevher damarları oluştur
function generateOresForChunk(chunk, chunkSeed) {
    const wx = chunk.getWorldX();
    const wz = chunk.getWorldZ();
    
    // Blok erişim fonksiyonları
    const getBlock = (x, y, z) => {
        const lx = x - wx;
        const lz = z - wz;
        return chunk.getBlock(lx, y, lz);
    };
    
    const setBlock = (x, y, z, type) => {
        const lx = x - wx;
        const lz = z - wz;
        if (lx >= 0 && lx < CHUNK_SIZE && lz >= 0 && lz < CHUNK_SIZE) {
            chunk.setBlock(lx, y, lz, type);
        }
    };
    
    // Her cevher tipi için damarlar oluştur
    for (const [oreName, ore] of Object.entries(ORE_TYPES)) {
        const veins = Math.floor(ore.veinsPerChunk * ore.rarity);
        
        for (let v = 0; v < veins; v++) {
            const veinSeed = chunkSeed + v * 1000 + ore.id * 100;
            
            // Damar başlangıç pozisyonu
            const lx = Math.floor(oreRandom(wx, v, wz, veinSeed) * CHUNK_SIZE);
            const lz = Math.floor(oreRandom(wz, v, wx, veinSeed + 1) * CHUNK_SIZE);
            
            // Y pozisyonu - peak varsa ona göre dağıt
            let y;
            if (ore.peakY) {
                // Gaussian-benzeri dağılım peak etrafında
                const spread = (ore.maxY - ore.minY) / 4;
                y = ore.peakY + (oreRandom(lx, lz, v, veinSeed + 2) - 0.5) * spread * 2;
                y = Math.max(ore.minY, Math.min(ore.maxY, Math.floor(y)));
            } else {
                y = ore.minY + Math.floor(oreRandom(lx, lz, v, veinSeed + 2) * (ore.maxY - ore.minY));
            }
            
            // Damar boyutu
            const veinSize = ore.veinSize.min + 
                Math.floor(oreRandom(lx, y, lz, veinSeed + 3) * (ore.veinSize.max - ore.veinSize.min));
            
            // Damari oluştur
            generateVein(getBlock, setBlock, wx + lx, y, wz + lz, ore.id, veinSize, veinSeed);
        }
    }
    
    // Yer altı özellikleri (kil, çakıl, granit vb.)
    for (const [featureName, feature] of Object.entries(UNDERGROUND_FEATURES)) {
        const veins = feature.veinsPerChunk;
        
        for (let v = 0; v < veins; v++) {
            const veinSeed = chunkSeed + v * 2000 + feature.id * 200;
            
            const lx = Math.floor(oreRandom(wx, v, wz, veinSeed) * CHUNK_SIZE);
            const lz = Math.floor(oreRandom(wz, v, wx, veinSeed + 1) * CHUNK_SIZE);
            const y = feature.minY + Math.floor(oreRandom(lx, lz, v, veinSeed + 2) * (feature.maxY - feature.minY));
            
            const veinSize = feature.veinSize.min + 
                Math.floor(oreRandom(lx, y, lz, veinSeed + 3) * (feature.veinSize.max - feature.veinSize.min));
            
            generateVein(getBlock, setBlock, wx + lx, y, wz + lz, feature.id, veinSize, veinSeed);
        }
    }
}

// Mining - blok kırma sistemi
const BLOCK_HARDNESS = {
    // Yumuşak bloklar (1 = anında)
    1: 0.6,   // Grass
    2: 0.5,   // Dirt
    7: 0.5,   // Sand
    9: 0.6,   // Gravel
    5: 0.2,   // Leaves
    44: 0,    // TallGrass
    
    // Orta sertlik
    4: 2.0,   // Wood
    10: 2.0,  // Planks
    11: 2.0,  // BirchLog
    12: 2.0,  // SpruceLog
    
    // Sert bloklar
    3: 1.5,   // Stone
    13: 2.0,  // Cobblestone
    14: 1.5,  // Bricks
    
    // Cevherler
    21: 3.0,  // Coal
    22: 3.0,  // Iron
    23: 3.0,  // Gold
    24: 3.0,  // Diamond
    25: 3.0,  // Emerald
    26: 3.0,  // Redstone
    27: 3.0,  // Lapis
    28: 3.0,  // Copper
    
    // Çok sert
    16: 50,   // Obsidian
    63: -1,   // Bedrock (kırılamaz)
    
    // Default
    default: 1.0
};

// Tool tiplerine göre hız çarpanları
const TOOL_EFFICIENCY = {
    hand: 1.0,
    woodenPickaxe: 2.0,
    stonePickaxe: 4.0,
    ironPickaxe: 6.0,
    goldenPickaxe: 12.0,
    diamondPickaxe: 8.0,
    
    woodenAxe: 2.0,
    stoneAxe: 4.0,
    ironAxe: 6.0,
    goldenAxe: 12.0,
    diamondAxe: 8.0,
    
    woodenShovel: 2.0,
    stoneShovel: 4.0,
    ironShovel: 6.0,
    goldenShovel: 12.0,
    diamondShovel: 8.0
};

// Hangi alet hangi bloklara etkili
const TOOL_EFFECTIVE = {
    pickaxe: [3, 13, 14, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 16],  // Taş, cevherler
    axe: [4, 10, 11, 12, 5, 57, 58],  // Ahşap
    shovel: [1, 2, 7, 9, 8, 15]  // Toprak, kum, kar
};

// Blok kırma süresi hesapla
function getBreakTime(blockId, tool) {
    const hardness = BLOCK_HARDNESS[blockId] ?? BLOCK_HARDNESS.default;
    
    if (hardness < 0) return Infinity; // Kırılamaz
    if (hardness === 0) return 0; // Anında
    
    let efficiency = TOOL_EFFICIENCY[tool] || TOOL_EFFICIENCY.hand;
    
    // Alet etkili mi kontrol et
    const toolType = tool.replace(/wooden|stone|iron|golden|diamond/i, '').toLowerCase();
    const effectiveBlocks = TOOL_EFFECTIVE[toolType] || [];
    
    if (!effectiveBlocks.includes(blockId) && tool !== 'hand') {
        efficiency = 1.0; // Yanlış alet = elle aynı
    }
    
    // Kırma süresi (saniye)
    return hardness / efficiency;
}

// Blok kırıldığında düşen item
const BLOCK_DROPS = {
    3: [{ id: 13, count: 1 }],  // Stone -> Cobblestone
    21: [{ id: 21, count: 1, minCount: 0, maxCount: 2, exp: 1 }],  // Coal -> Coal + XP
    22: [{ id: 22, count: 1 }],  // Iron Ore (needs smelting)
    23: [{ id: 23, count: 1 }],  // Gold Ore (needs smelting)
    24: [{ id: 24, count: 1, exp: 5 }],  // Diamond
    25: [{ id: 25, count: 1, exp: 10 }], // Emerald
    26: [{ id: 26, count: 4, maxCount: 5, exp: 2 }], // Redstone dust
    27: [{ id: 27, count: 4, maxCount: 8, exp: 3 }], // Lapis lazuli
    28: [{ id: 28, count: 2, maxCount: 3, exp: 1 }], // Copper
    1: [{ id: 2, count: 1 }],  // Grass -> Dirt
    5: [{ id: 0, count: 0, chance: 0.05, altId: 18 }], // Leaves -> Maybe Sapling
};

function getBlockDrops(blockId, tool) {
    const drops = BLOCK_DROPS[blockId];
    if (!drops) return [{ id: blockId, count: 1 }]; // Default: kendisi
    
    const result = [];
    for (const drop of drops) {
        // Şans kontrolü
        if (drop.chance && Math.random() > drop.chance) {
            if (drop.altId) {
                result.push({ id: drop.altId, count: 1 });
            }
            continue;
        }
        
        let count = drop.count;
        if (drop.maxCount) {
            count = drop.minCount ?? drop.count;
            count += Math.floor(Math.random() * (drop.maxCount - count + 1));
        }
        
        if (count > 0) {
            result.push({ id: drop.id, count: count });
        }
    }
    
    return result;
}

console.log("[Ores] Loaded " + Object.keys(ORE_TYPES).length + " ore types with vein generation");
