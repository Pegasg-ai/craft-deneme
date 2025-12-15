// ========================================
// BLOCKS.JS - Genişletilmiş Blok Sistemi
// FAZ 1: 30+ Blok, Çiçekler, Bitkiler, Cevherler
// ========================================

// Blok Tipleri
const BLOCK_TYPE = {
    SOLID: 'solid',      // Normal küp blok
    PLANT: 'plant',      // X-şeklinde bitki (çapraz 2 düzlem)
    LIQUID: 'liquid',    // Su, lav
    TRANSPARENT: 'trans' // Cam, yaprak
};

// Genişletilmiş Blok Tanımları
// ID: 0 = Air (boş)
const BLOCKS = [
    null, // 0: Air
    
    // === TEMEL BLOKLAR (1-15) ===
    { id: 1, name: 'Grass', col: 0x4CAF50, top: 0x66BB6A, side: 0x5D4037, type: BLOCK_TYPE.SOLID },
    { id: 2, name: 'Dirt', col: 0x6D4C41, top: 0x795548, side: 0x5D4037, type: BLOCK_TYPE.SOLID },
    { id: 3, name: 'Stone', col: 0x757575, top: 0x9E9E9E, side: 0x616161, type: BLOCK_TYPE.SOLID },
    { id: 4, name: 'OakLog', col: 0x5D4037, top: 0x8D6E63, side: 0x4E342E, type: BLOCK_TYPE.SOLID },
    { id: 5, name: 'Leaf', col: 0x43A047, top: 0x66BB6A, side: 0x2E7D32, type: BLOCK_TYPE.TRANSPARENT, animated: true },
    { id: 6, name: 'Brick', col: 0xC62828, top: 0xE53935, side: 0xB71C1C, type: BLOCK_TYPE.SOLID },
    { id: 7, name: 'Sand', col: 0xFFEB3B, top: 0xFFF176, side: 0xFDD835, type: BLOCK_TYPE.SOLID },
    { id: 8, name: 'Snow', col: 0xECEFF1, top: 0xFFFFFF, side: 0xE0E0E0, type: BLOCK_TYPE.SOLID },
    { id: 9, name: 'Water', col: 0x1E88E5, top: 0x42A5F5, side: 0x1976D2, type: BLOCK_TYPE.LIQUID, animated: true },
    { id: 10, name: 'Cobble', col: 0x607D8B, top: 0x78909C, side: 0x546E7A, type: BLOCK_TYPE.SOLID },
    { id: 11, name: 'BirchLog', col: 0xDCCFA3, top: 0xDCCFA3, side: 0xDCCFA3, type: BLOCK_TYPE.SOLID },
    { id: 12, name: 'SpruceLog', col: 0x3B271D, top: 0x3B271D, side: 0x3B271D, type: BLOCK_TYPE.SOLID },
    { id: 13, name: 'Glass', col: 0xE3F2FD, top: 0xE3F2FD, side: 0xBBDEFB, type: BLOCK_TYPE.TRANSPARENT, opacity: 0.3 },
    { id: 14, name: 'Gravel', col: 0x9E9E9E, top: 0xBDBDBD, side: 0x757575, type: BLOCK_TYPE.SOLID },
    { id: 15, name: 'Clay', col: 0xA1887F, top: 0xBCAAA4, side: 0x8D6E63, type: BLOCK_TYPE.SOLID },
    
    // === AHŞAP TİPLERİ (16-20) ===
    { id: 16, name: 'OakPlanks', col: 0xBA8C63, top: 0xBA8C63, side: 0xA0714C, type: BLOCK_TYPE.SOLID },
    { id: 17, name: 'BirchPlanks', col: 0xD5C98E, top: 0xD5C98E, side: 0xC4B87A, type: BLOCK_TYPE.SOLID },
    { id: 18, name: 'SprucePlanks', col: 0x6B4423, top: 0x6B4423, side: 0x5A3A1D, type: BLOCK_TYPE.SOLID },
    { id: 19, name: 'JungleLog', col: 0x6B4423, top: 0x9E7C4E, side: 0x553311, type: BLOCK_TYPE.SOLID },
    { id: 20, name: 'JunglePlanks', col: 0xB57E55, top: 0xB57E55, side: 0xA16B42, type: BLOCK_TYPE.SOLID },
    
    // === CEVHERLER (21-28) ===
    { id: 21, name: 'CoalOre', col: 0x3C3C3C, top: 0x4A4A4A, side: 0x2C2C2C, type: BLOCK_TYPE.SOLID, ore: true },
    { id: 22, name: 'IronOre', col: 0xD4A373, top: 0xE5B896, side: 0xC29060, type: BLOCK_TYPE.SOLID, ore: true },
    { id: 23, name: 'GoldOre', col: 0xFFD700, top: 0xFFE44D, side: 0xE6C200, type: BLOCK_TYPE.SOLID, ore: true },
    { id: 24, name: 'DiamondOre', col: 0x4DD0E1, top: 0x80DEEA, side: 0x26C6DA, type: BLOCK_TYPE.SOLID, ore: true },
    { id: 25, name: 'EmeraldOre', col: 0x4CAF50, top: 0x66BB6A, side: 0x43A047, type: BLOCK_TYPE.SOLID, ore: true },
    { id: 26, name: 'RedstoneOre', col: 0xE53935, top: 0xEF5350, side: 0xD32F2F, type: BLOCK_TYPE.SOLID, ore: true },
    { id: 27, name: 'LapisOre', col: 0x3949AB, top: 0x5C6BC0, side: 0x303F9F, type: BLOCK_TYPE.SOLID, ore: true },
    { id: 28, name: 'CopperOre', col: 0xE67E22, top: 0xF39C12, side: 0xD35400, type: BLOCK_TYPE.SOLID, ore: true },
    
    // === MİNERAL BLOKLARI (29-35) ===
    { id: 29, name: 'CoalBlock', col: 0x1C1C1C, top: 0x2A2A2A, side: 0x0E0E0E, type: BLOCK_TYPE.SOLID },
    { id: 30, name: 'IronBlock', col: 0xDADADA, top: 0xE8E8E8, side: 0xC0C0C0, type: BLOCK_TYPE.SOLID },
    { id: 31, name: 'GoldBlock', col: 0xFFD700, top: 0xFFE44D, side: 0xE6C200, type: BLOCK_TYPE.SOLID },
    { id: 32, name: 'DiamondBlock', col: 0x4DD0E1, top: 0x80DEEA, side: 0x26C6DA, type: BLOCK_TYPE.SOLID },
    { id: 33, name: 'EmeraldBlock', col: 0x2ECC71, top: 0x58D68D, side: 0x27AE60, type: BLOCK_TYPE.SOLID },
    { id: 34, name: 'RedstoneBlock', col: 0xC0392B, top: 0xE74C3C, side: 0xA93226, type: BLOCK_TYPE.SOLID },
    { id: 35, name: 'LapisBlock', col: 0x2980B9, top: 0x3498DB, side: 0x2471A3, type: BLOCK_TYPE.SOLID },
    
    // === ÇİÇEKLER (36-43) - PLANT TİPİ ===
    { id: 36, name: 'Poppy', col: 0xE53935, type: BLOCK_TYPE.PLANT, plantHeight: 0.6 },
    { id: 37, name: 'Dandelion', col: 0xFFEB3B, type: BLOCK_TYPE.PLANT, plantHeight: 0.5 },
    { id: 38, name: 'BlueOrchid', col: 0x29B6F6, type: BLOCK_TYPE.PLANT, plantHeight: 0.6 },
    { id: 39, name: 'Tulip', col: 0xF48FB1, type: BLOCK_TYPE.PLANT, plantHeight: 0.6 },
    { id: 40, name: 'Rose', col: 0xC62828, type: BLOCK_TYPE.PLANT, plantHeight: 0.65 },
    { id: 41, name: 'Cornflower', col: 0x5C6BC0, type: BLOCK_TYPE.PLANT, plantHeight: 0.6 },
    { id: 42, name: 'Sunflower', col: 0xFFC107, type: BLOCK_TYPE.PLANT, plantHeight: 1.2, doublePlant: true },
    { id: 43, name: 'Lilac', col: 0xCE93D8, type: BLOCK_TYPE.PLANT, plantHeight: 1.2, doublePlant: true },
    
    // === BİTKİLER VE MANTARLAR (44-52) ===
    { id: 44, name: 'TallGrass', col: 0x7CB342, type: BLOCK_TYPE.PLANT, plantHeight: 0.7, animated: true },
    { id: 45, name: 'Fern', col: 0x558B2F, type: BLOCK_TYPE.PLANT, plantHeight: 0.6 },
    { id: 46, name: 'DeadBush', col: 0x8D6E63, type: BLOCK_TYPE.PLANT, plantHeight: 0.5 },
    { id: 47, name: 'RedMushroom', col: 0xE53935, type: BLOCK_TYPE.PLANT, plantHeight: 0.4 },
    { id: 48, name: 'BrownMushroom', col: 0x8D6E63, type: BLOCK_TYPE.PLANT, plantHeight: 0.35 },
    { id: 49, name: 'Cactus', col: 0x4CAF50, top: 0x66BB6A, side: 0x388E3C, type: BLOCK_TYPE.SOLID, special: 'cactus' },
    { id: 50, name: 'SugarCane', col: 0x81C784, type: BLOCK_TYPE.PLANT, plantHeight: 1.0 },
    { id: 51, name: 'Bamboo', col: 0x7CB342, type: BLOCK_TYPE.PLANT, plantHeight: 1.0 },
    { id: 52, name: 'Seagrass', col: 0x26A69A, type: BLOCK_TYPE.PLANT, plantHeight: 0.5, underwater: true },
    
    // === FİDANLAR (53-56) ===
    { id: 53, name: 'OakSapling', col: 0x4CAF50, type: BLOCK_TYPE.PLANT, plantHeight: 0.7, sapling: 'oak' },
    { id: 54, name: 'BirchSapling', col: 0x8BC34A, type: BLOCK_TYPE.PLANT, plantHeight: 0.7, sapling: 'birch' },
    { id: 55, name: 'SpruceSapling', col: 0x2E7D32, type: BLOCK_TYPE.PLANT, plantHeight: 0.6, sapling: 'spruce' },
    { id: 56, name: 'JungleSapling', col: 0x33691E, type: BLOCK_TYPE.PLANT, plantHeight: 0.7, sapling: 'jungle' },
    
    // === YAPRAK TİPLERİ (57-60) ===
    { id: 57, name: 'BirchLeaf', col: 0x8BC34A, top: 0xAED581, side: 0x7CB342, type: BLOCK_TYPE.TRANSPARENT, animated: true },
    { id: 58, name: 'SpruceLeaf', col: 0x2E7D32, top: 0x388E3C, side: 0x1B5E20, type: BLOCK_TYPE.TRANSPARENT, animated: true },
    { id: 59, name: 'JungleLeaf', col: 0x33691E, top: 0x558B2F, side: 0x1B5E20, type: BLOCK_TYPE.TRANSPARENT, animated: true },
    { id: 60, name: 'AcaciaLeaf', col: 0x7CB342, top: 0x9CCC65, side: 0x689F38, type: BLOCK_TYPE.TRANSPARENT, animated: true },
    
    // === ÖZEL BLOKLAR (61-65) ===
    { id: 61, name: 'Lava', col: 0xFF5722, top: 0xFF7043, side: 0xE64A19, type: BLOCK_TYPE.LIQUID, animated: true, emissive: true },
    { id: 62, name: 'Obsidian', col: 0x1A1A2E, top: 0x16213E, side: 0x0F0F1A, type: BLOCK_TYPE.SOLID },
    { id: 63, name: 'Bedrock', col: 0x2C2C2C, top: 0x383838, side: 0x1E1E1E, type: BLOCK_TYPE.SOLID, unbreakable: true },
    { id: 64, name: 'Moss', col: 0x6D8B3A, top: 0x7D9B4A, side: 0x5D7B2A, type: BLOCK_TYPE.SOLID },
    { id: 65, name: 'MossyCobble', col: 0x5D7B5A, top: 0x6D8B6A, side: 0x4D6B4A, type: BLOCK_TYPE.SOLID }
];

// Blok adına göre ID bul
function getBlockIdByName(name) {
    for (let i = 1; i < BLOCKS.length; i++) {
        if (BLOCKS[i] && BLOCKS[i].name === name) return i;
    }
    return 0;
}

// Blok bilgisi al
function getBlockInfo(id) {
    return BLOCKS[id] || null;
}

// Blok tipi kontrol
function isPlantBlock(id) {
    const block = BLOCKS[id];
    return block && block.type === BLOCK_TYPE.PLANT;
}

function isSolidBlock(id) {
    const block = BLOCKS[id];
    return block && (block.type === BLOCK_TYPE.SOLID || block.type === BLOCK_TYPE.TRANSPARENT);
}

function isLiquidBlock(id) {
    const block = BLOCKS[id];
    return block && block.type === BLOCK_TYPE.LIQUID;
}

function isAnimatedBlock(id) {
    const block = BLOCKS[id];
    return block && block.animated === true;
}

function isOreBlock(id) {
    const block = BLOCKS[id];
    return block && block.ore === true;
}

// Çiçek ve bitki ID'leri listesi (spawn için)
const FLOWER_IDS = [36, 37, 38, 39, 40, 41]; // Tek çiçekler
const DOUBLE_PLANT_IDS = [42, 43]; // Çift yükseklikli
const GRASS_PLANT_IDS = [44, 45]; // Çimen/eğrelti
const MUSHROOM_IDS = [47, 48];
const SAPLING_IDS = [53, 54, 55, 56];

// Cevher spawn derinlikleri
const ORE_SPAWN_CONFIG = {
    21: { minY: 0, maxY: 128, chance: 0.015, veinSize: 8 },   // Coal
    22: { minY: 0, maxY: 64, chance: 0.012, veinSize: 6 },    // Iron
    23: { minY: 0, maxY: 32, chance: 0.005, veinSize: 5 },    // Gold
    24: { minY: 0, maxY: 16, chance: 0.002, veinSize: 4 },    // Diamond
    25: { minY: 4, maxY: 32, chance: 0.001, veinSize: 1 },    // Emerald (mountain only)
    26: { minY: 0, maxY: 16, chance: 0.008, veinSize: 5 },    // Redstone
    27: { minY: 0, maxY: 32, chance: 0.004, veinSize: 6 },    // Lapis
    28: { minY: 0, maxY: 96, chance: 0.010, veinSize: 10 }    // Copper
};

console.log("[Blocks] Loaded " + (BLOCKS.length - 1) + " block types");
