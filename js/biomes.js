// ========================================
// BIOMES.JS - Biyom Sistemi
// Sıcaklık + Nem bazlı 10 farklı biyom
// ========================================

// Biyom tipleri
const BIOME_TYPE = {
    OCEAN: 0,
    BEACH: 1,
    DESERT: 2,
    SAVANNA: 3,
    PLAINS: 4,
    FOREST: 5,
    TAIGA: 6,        // Spruce ormanı
    TUNDRA: 7,       // Soğuk çayır
    SNOWY: 8,        // Karlı dağ
    JUNGLE: 9,       // Tropikal orman
    SWAMP: 10        // Bataklık
};

// Biyom tanımları
const BIOMES = {
    [BIOME_TYPE.OCEAN]: {
        name: 'Ocean',
        surfaceBlock: 7,   // Sand
        underBlock: 7,     // Sand
        fillerBlock: 3,    // Stone
        waterLevel: 5,
        trees: [],
        plants: [],
        temperature: 0.5,
        humidity: 1.0,
        fogColor: 0x4A90D9,
        grassColor: 0x4CAF50
    },
    [BIOME_TYPE.BEACH]: {
        name: 'Beach',
        surfaceBlock: 7,   // Sand
        underBlock: 7,     // Sand
        fillerBlock: 3,    // Stone
        waterLevel: 5,
        trees: [],
        plants: [{ id: 46, chance: 0.01 }], // DeadBush (rare)
        temperature: 0.8,
        humidity: 0.4,
        fogColor: 0x87CEEB,
        grassColor: 0x91BD59
    },
    [BIOME_TYPE.DESERT]: {
        name: 'Desert',
        surfaceBlock: 7,   // Sand
        underBlock: 7,     // Sand (sandstone would be nice)
        fillerBlock: 3,    // Stone
        waterLevel: 3,
        trees: [],
        plants: [
            { id: 49, chance: 0.02 },  // Cactus
            { id: 46, chance: 0.03 }   // DeadBush
        ],
        temperature: 1.0,
        humidity: 0.0,
        fogColor: 0xF4E8C1,
        grassColor: 0xBFB755
    },
    [BIOME_TYPE.SAVANNA]: {
        name: 'Savanna',
        surfaceBlock: 1,   // Grass
        underBlock: 2,     // Dirt
        fillerBlock: 3,    // Stone
        waterLevel: 5,
        trees: [{ type: 'acacia', chance: 0.008 }],
        plants: [
            { id: 44, chance: 0.25 },  // TallGrass (common)
            { id: 37, chance: 0.02 }   // Dandelion
        ],
        temperature: 0.9,
        humidity: 0.2,
        fogColor: 0xD4C896,
        grassColor: 0xBFB755
    },
    [BIOME_TYPE.PLAINS]: {
        name: 'Plains',
        surfaceBlock: 1,   // Grass
        underBlock: 2,     // Dirt
        fillerBlock: 3,    // Stone
        waterLevel: 5,
        trees: [{ type: 'oak', chance: 0.003 }], // Rare trees
        plants: [
            { id: 44, chance: 0.20 },  // TallGrass
            { id: 36, chance: 0.03 },  // Poppy
            { id: 37, chance: 0.03 },  // Dandelion
            { id: 41, chance: 0.01 }   // Cornflower
        ],
        temperature: 0.6,
        humidity: 0.4,
        fogColor: 0x87CEEB,
        grassColor: 0x91BD59
    },
    [BIOME_TYPE.FOREST]: {
        name: 'Forest',
        surfaceBlock: 1,   // Grass
        underBlock: 2,     // Dirt
        fillerBlock: 3,    // Stone
        waterLevel: 5,
        trees: [
            { type: 'oak', chance: 0.06 },
            { type: 'birch', chance: 0.02 }
        ],
        plants: [
            { id: 44, chance: 0.15 },  // TallGrass
            { id: 45, chance: 0.05 },  // Fern
            { id: 47, chance: 0.02 },  // RedMushroom
            { id: 48, chance: 0.02 },  // BrownMushroom
            { id: 36, chance: 0.02 }   // Poppy
        ],
        temperature: 0.5,
        humidity: 0.6,
        fogColor: 0x7BA854,
        grassColor: 0x79C05A
    },
    [BIOME_TYPE.TAIGA]: {
        name: 'Taiga',
        surfaceBlock: 1,   // Grass (could use podzol if added)
        underBlock: 2,     // Dirt
        fillerBlock: 3,    // Stone
        waterLevel: 5,
        trees: [{ type: 'spruce', chance: 0.08 }],
        plants: [
            { id: 45, chance: 0.10 },  // Fern
            { id: 44, chance: 0.08 },  // TallGrass
            { id: 48, chance: 0.03 }   // BrownMushroom
        ],
        temperature: 0.25,
        humidity: 0.6,
        fogColor: 0x5D8AA8,
        grassColor: 0x596651
    },
    [BIOME_TYPE.TUNDRA]: {
        name: 'Tundra',
        surfaceBlock: 1,   // Grass (sparse)
        underBlock: 2,     // Dirt
        fillerBlock: 3,    // Stone
        waterLevel: 5,
        trees: [],
        plants: [
            { id: 44, chance: 0.05 }   // Sparse TallGrass
        ],
        temperature: 0.1,
        humidity: 0.3,
        fogColor: 0xA0B8C8,
        grassColor: 0x80B497
    },
    [BIOME_TYPE.SNOWY]: {
        name: 'Snowy Mountains',
        surfaceBlock: 8,   // Snow
        underBlock: 8,     // Snow
        fillerBlock: 3,    // Stone
        waterLevel: 5,
        trees: [{ type: 'spruce', chance: 0.02 }], // Rare spruce
        plants: [],
        temperature: 0.0,
        humidity: 0.5,
        fogColor: 0xFFFFFF,
        grassColor: 0x80B497
    },
    [BIOME_TYPE.JUNGLE]: {
        name: 'Jungle',
        surfaceBlock: 1,   // Grass
        underBlock: 2,     // Dirt
        fillerBlock: 3,    // Stone
        waterLevel: 5,
        trees: [
            { type: 'jungle', chance: 0.12 },
            { type: 'oak', chance: 0.03 }
        ],
        plants: [
            { id: 44, chance: 0.30 },  // TallGrass (very common)
            { id: 45, chance: 0.15 },  // Fern
            { id: 51, chance: 0.08 },  // Bamboo
            { id: 38, chance: 0.03 },  // BlueOrchid
            { id: 47, chance: 0.02 }   // RedMushroom
        ],
        temperature: 0.95,
        humidity: 0.9,
        fogColor: 0x5BA85B,
        grassColor: 0x59C93C
    },
    [BIOME_TYPE.SWAMP]: {
        name: 'Swamp',
        surfaceBlock: 1,   // Grass (darker)
        underBlock: 2,     // Dirt
        fillerBlock: 15,   // Clay
        waterLevel: 6,     // Higher water
        trees: [{ type: 'oak', chance: 0.04 }], // Swamp oak
        plants: [
            { id: 44, chance: 0.20 },  // TallGrass
            { id: 47, chance: 0.05 },  // RedMushroom
            { id: 48, chance: 0.05 },  // BrownMushroom
            { id: 52, chance: 0.10 }   // Seagrass (if water nearby)
        ],
        temperature: 0.6,
        humidity: 0.9,
        fogColor: 0x6A7039,
        grassColor: 0x6A7039
    }
};

// Sıcaklık ve nem'den biyom belirleme
function getBiomeAt(x, z) {
    // Büyük ölçekli noise - biyom bölgeleri
    const tempNoise = noise2D(x / 300 + 1000, z / 300 + 1000);
    const humidNoise = noise2D(x / 300 - 1000, z / 300 - 1000);
    
    // -1 to 1 -> 0 to 1
    const temperature = (tempNoise + 1) / 2;
    const humidity = (humidNoise + 1) / 2;
    
    // Yükseklik faktörü
    const heightNoise = noise2D(x / 60, z / 60);
    const height = Math.floor((heightNoise + 1) * 8) + 4;
    
    // Biyom seçimi
    // Düşük alan = su/kumsal
    if (height <= 4) {
        return BIOME_TYPE.OCEAN;
    }
    if (height <= 5) {
        return BIOME_TYPE.BEACH;
    }
    
    // Yüksek dağlar = kar
    if (height > 18) {
        return BIOME_TYPE.SNOWY;
    }
    
    // Sıcaklık ve nem bazlı biyom
    if (temperature > 0.8) {
        // Sıcak
        if (humidity < 0.3) {
            return BIOME_TYPE.DESERT;
        } else if (humidity < 0.5) {
            return BIOME_TYPE.SAVANNA;
        } else {
            return BIOME_TYPE.JUNGLE;
        }
    } else if (temperature > 0.4) {
        // Ilıman
        if (humidity < 0.4) {
            return BIOME_TYPE.PLAINS;
        } else if (humidity < 0.7) {
            return BIOME_TYPE.FOREST;
        } else {
            return BIOME_TYPE.SWAMP;
        }
    } else if (temperature > 0.2) {
        // Soğuk
        if (humidity > 0.5) {
            return BIOME_TYPE.TAIGA;
        } else {
            return BIOME_TYPE.TUNDRA;
        }
    } else {
        // Çok soğuk
        return BIOME_TYPE.SNOWY;
    }
}

// Biyom bilgisi al
function getBiomeInfo(biomeType) {
    return BIOMES[biomeType] || BIOMES[BIOME_TYPE.PLAINS];
}

// Biyom'a göre arazi generate
function generateTerrainForBiome(chunk, lx, lz, height, biomeType) {
    const biome = getBiomeInfo(biomeType);
    
    // Bedrock
    chunk.setBlock(lx, 0, lz, 63);
    
    // Fill layers
    for (let y = 1; y < height; y++) {
        let type = biome.fillerBlock; // Stone default
        
        // Cave generation
        const wx = chunk.getWorldX() + lx;
        const wz = chunk.getWorldZ() + lz;
        if (y > 1 && y < height - 2) {
            const caveNoise = noise3D(wx / 20, y / 20, wz / 20);
            if (caveNoise > 0.4) continue;
        }
        
        // Ore generation
        if (y < height - 3 && type === 3) {
            const oreRoll = Math.abs((wx * 7919 + y * 6997 + wz * 5653) % 10000) / 10000;
            if (y <= 16 && oreRoll < 0.002) type = 24; // Diamond
            else if (y <= 16 && oreRoll < 0.010) type = 26; // Redstone
            else if (y <= 32 && oreRoll < 0.006) type = 23; // Gold
            else if (y <= 64 && oreRoll < 0.015) type = 22; // Iron
            else if (oreRoll < 0.020) type = 21; // Coal
        }
        
        // Surface layers
        if (y === height - 1) {
            type = biome.surfaceBlock;
        } else if (y >= height - 4) {
            type = biome.underBlock;
        }
        
        chunk.setBlock(lx, y, lz, type);
    }
    
    return biome;
}

// Biyom'a göre dekorasyon (bitkiler, ağaçlar)
function decorateBiome(chunk, lx, lz, height, biomeType) {
    const biome = getBiomeInfo(biomeType);
    const wx = chunk.getWorldX() + lx;
    const wz = chunk.getWorldZ() + lz;
    
    // Su altında dekorasyon yok
    if (height <= biome.waterLevel) return;
    
    // Ağaç kontrolü
    for (const treeConfig of biome.trees) {
        const treeRoll = Math.abs((wx * 3571 + wz * 2953) % 10000) / 10000;
        if (treeRoll < treeConfig.chance) {
            // Ağaç yerleştir (generateTree fonksiyonu chunk.js'de)
            if (typeof generateTree === 'function') {
                generateTree(chunk, lx, height, lz, treeConfig.type);
            }
            return; // Ağaç varsa bitki koyma
        }
    }
    
    // Bitki kontrolü
    for (const plantConfig of biome.plants) {
        const plantRoll = Math.abs((wx * 7877 + wz * 6991) % 10000) / 10000;
        if (plantRoll < plantConfig.chance) {
            chunk.setBlock(lx, height, lz, plantConfig.id);
            return; // Bir bitki yeterli
        }
    }
}

// Biyom rengini al (debug/minimap için)
function getBiomeColor(biomeType) {
    const colors = {
        [BIOME_TYPE.OCEAN]: 0x0066CC,
        [BIOME_TYPE.BEACH]: 0xF5DEB3,
        [BIOME_TYPE.DESERT]: 0xEDC9AF,
        [BIOME_TYPE.SAVANNA]: 0xBDB76B,
        [BIOME_TYPE.PLAINS]: 0x7CFC00,
        [BIOME_TYPE.FOREST]: 0x228B22,
        [BIOME_TYPE.TAIGA]: 0x2F4F4F,
        [BIOME_TYPE.TUNDRA]: 0x708090,
        [BIOME_TYPE.SNOWY]: 0xFFFAFA,
        [BIOME_TYPE.JUNGLE]: 0x006400,
        [BIOME_TYPE.SWAMP]: 0x2F4F2F
    };
    return colors[biomeType] || 0x7CFC00;
}

console.log("[Biomes] Loaded " + Object.keys(BIOMES).length + " biome types");
