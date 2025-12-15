// ========================================
// CRAFTING.JS - Crafting Sistemi
// 2x2 ve 3x3 crafting grid, 50+ tarif
// ========================================

// Crafting tarif tipleri
const RECIPE_TYPE = {
    SHAPED: 0,      // Belirli şekil gerekli
    SHAPELESS: 1    // Sadece malzemeler yeterli
};

// Crafting tarifleri
// key = output item ID
// ingredients: 2D array (2x2 veya 3x3), 0 = boş
// count: output miktarı
const CRAFTING_RECIPES = [
    // ============ TEMEL TARIFLER (2x2) ============
    
    // Logs -> Planks (4)
    {
        type: RECIPE_TYPE.SHAPELESS,
        ingredients: [4],  // OakLog
        output: { id: 10, count: 4 }  // Planks
    },
    {
        type: RECIPE_TYPE.SHAPELESS,
        ingredients: [11], // BirchLog
        output: { id: 10, count: 4 }
    },
    {
        type: RECIPE_TYPE.SHAPELESS,
        ingredients: [12], // SpruceLog
        output: { id: 10, count: 4 }
    },
    
    // Planks -> Sticks (4)
    {
        type: RECIPE_TYPE.SHAPED,
        pattern: [
            [10, 0],
            [10, 0]
        ],
        output: { id: 64, count: 4 }  // Sticks (yeni ID gerekebilir)
    },
    
    // Planks -> Crafting Table
    {
        type: RECIPE_TYPE.SHAPED,
        pattern: [
            [10, 10],
            [10, 10]
        ],
        output: { id: 65, count: 1 }  // CraftingTable
    },
    
    // Cobblestone -> Furnace
    {
        type: RECIPE_TYPE.SHAPED,
        pattern: [
            [13, 13, 13],
            [13, 0, 13],
            [13, 13, 13]
        ],
        output: { id: 66, count: 1 }  // Furnace
    },
    
    // Planks -> Chest
    {
        type: RECIPE_TYPE.SHAPED,
        pattern: [
            [10, 10, 10],
            [10, 0, 10],
            [10, 10, 10]
        ],
        output: { id: 67, count: 1 }  // Chest
    },
    
    // ============ YAPI BLOKLARI ============
    
    // Cobblestone -> Stone Bricks (4)
    {
        type: RECIPE_TYPE.SHAPED,
        pattern: [
            [13, 13],
            [13, 13]
        ],
        output: { id: 14, count: 4 }  // Bricks (Stone Bricks olarak kullan)
    },
    
    // Sand -> Glass (Furnace'ta normalde)
    {
        type: RECIPE_TYPE.SHAPELESS,
        ingredients: [7, 21],  // Sand + Coal
        output: { id: 17, count: 1 }  // Glass
    },
    
    // Clay -> Bricks (4)
    {
        type: RECIPE_TYPE.SHAPED,
        pattern: [
            [15, 15],
            [15, 15]
        ],
        output: { id: 14, count: 4 }
    },
    
    // Dirt + Seeds -> Grass (oyun için)
    {
        type: RECIPE_TYPE.SHAPELESS,
        ingredients: [2, 44],  // Dirt + TallGrass
        output: { id: 1, count: 1 }
    },
    
    // Snow Block (4 snow)
    {
        type: RECIPE_TYPE.SHAPED,
        pattern: [
            [8, 8],
            [8, 8]
        ],
        output: { id: 68, count: 1 }  // Packed Snow/Ice
    },
    
    // ============ ALETLER (TOOLS) ============
    // ID 100+ = Tools
    
    // Wooden Pickaxe
    {
        type: RECIPE_TYPE.SHAPED,
        pattern: [
            [10, 10, 10],
            [0, 64, 0],
            [0, 64, 0]
        ],
        output: { id: 100, count: 1 }
    },
    
    // Stone Pickaxe
    {
        type: RECIPE_TYPE.SHAPED,
        pattern: [
            [13, 13, 13],
            [0, 64, 0],
            [0, 64, 0]
        ],
        output: { id: 101, count: 1 }
    },
    
    // Iron Pickaxe
    {
        type: RECIPE_TYPE.SHAPED,
        pattern: [
            [22, 22, 22],
            [0, 64, 0],
            [0, 64, 0]
        ],
        output: { id: 102, count: 1 }
    },
    
    // Diamond Pickaxe
    {
        type: RECIPE_TYPE.SHAPED,
        pattern: [
            [24, 24, 24],
            [0, 64, 0],
            [0, 64, 0]
        ],
        output: { id: 103, count: 1 }
    },
    
    // Wooden Axe
    {
        type: RECIPE_TYPE.SHAPED,
        pattern: [
            [10, 10, 0],
            [10, 64, 0],
            [0, 64, 0]
        ],
        output: { id: 110, count: 1 }
    },
    
    // Stone Axe
    {
        type: RECIPE_TYPE.SHAPED,
        pattern: [
            [13, 13, 0],
            [13, 64, 0],
            [0, 64, 0]
        ],
        output: { id: 111, count: 1 }
    },
    
    // Wooden Shovel
    {
        type: RECIPE_TYPE.SHAPED,
        pattern: [
            [0, 10, 0],
            [0, 64, 0],
            [0, 64, 0]
        ],
        output: { id: 120, count: 1 }
    },
    
    // Stone Shovel
    {
        type: RECIPE_TYPE.SHAPED,
        pattern: [
            [0, 13, 0],
            [0, 64, 0],
            [0, 64, 0]
        ],
        output: { id: 121, count: 1 }
    },
    
    // Wooden Sword
    {
        type: RECIPE_TYPE.SHAPED,
        pattern: [
            [0, 10, 0],
            [0, 10, 0],
            [0, 64, 0]
        ],
        output: { id: 130, count: 1 }
    },
    
    // Stone Sword
    {
        type: RECIPE_TYPE.SHAPED,
        pattern: [
            [0, 13, 0],
            [0, 13, 0],
            [0, 64, 0]
        ],
        output: { id: 131, count: 1 }
    },
    
    // Iron Sword
    {
        type: RECIPE_TYPE.SHAPED,
        pattern: [
            [0, 22, 0],
            [0, 22, 0],
            [0, 64, 0]
        ],
        output: { id: 132, count: 1 }
    },
    
    // Diamond Sword
    {
        type: RECIPE_TYPE.SHAPED,
        pattern: [
            [0, 24, 0],
            [0, 24, 0],
            [0, 64, 0]
        ],
        output: { id: 133, count: 1 }
    },
    
    // ============ ZIRH (ARMOR) ============
    // ID 200+ = Armor
    
    // Leather Helmet (kömür yerine - basit)
    {
        type: RECIPE_TYPE.SHAPED,
        pattern: [
            [21, 21, 21],
            [21, 0, 21],
            [0, 0, 0]
        ],
        output: { id: 200, count: 1 }
    },
    
    // Iron Helmet
    {
        type: RECIPE_TYPE.SHAPED,
        pattern: [
            [22, 22, 22],
            [22, 0, 22],
            [0, 0, 0]
        ],
        output: { id: 201, count: 1 }
    },
    
    // Diamond Helmet
    {
        type: RECIPE_TYPE.SHAPED,
        pattern: [
            [24, 24, 24],
            [24, 0, 24],
            [0, 0, 0]
        ],
        output: { id: 202, count: 1 }
    },
    
    // Iron Chestplate
    {
        type: RECIPE_TYPE.SHAPED,
        pattern: [
            [22, 0, 22],
            [22, 22, 22],
            [22, 22, 22]
        ],
        output: { id: 211, count: 1 }
    },
    
    // Diamond Chestplate
    {
        type: RECIPE_TYPE.SHAPED,
        pattern: [
            [24, 0, 24],
            [24, 24, 24],
            [24, 24, 24]
        ],
        output: { id: 212, count: 1 }
    },
    
    // Iron Leggings
    {
        type: RECIPE_TYPE.SHAPED,
        pattern: [
            [22, 22, 22],
            [22, 0, 22],
            [22, 0, 22]
        ],
        output: { id: 221, count: 1 }
    },
    
    // Iron Boots
    {
        type: RECIPE_TYPE.SHAPED,
        pattern: [
            [0, 0, 0],
            [22, 0, 22],
            [22, 0, 22]
        ],
        output: { id: 231, count: 1 }
    },
    
    // ============ DEKORATIF ============
    
    // Torch (stick + coal)
    {
        type: RECIPE_TYPE.SHAPED,
        pattern: [
            [21],
            [64]
        ],
        output: { id: 69, count: 4 }  // Torch
    },
    
    // Ladder
    {
        type: RECIPE_TYPE.SHAPED,
        pattern: [
            [64, 0, 64],
            [64, 64, 64],
            [64, 0, 64]
        ],
        output: { id: 70, count: 3 }  // Ladder
    },
    
    // Fence
    {
        type: RECIPE_TYPE.SHAPED,
        pattern: [
            [10, 64, 10],
            [10, 64, 10]
        ],
        output: { id: 71, count: 3 }  // Fence
    },
    
    // Door
    {
        type: RECIPE_TYPE.SHAPED,
        pattern: [
            [10, 10],
            [10, 10],
            [10, 10]
        ],
        output: { id: 72, count: 3 }  // Door
    },
    
    // Bed (wool + planks)
    {
        type: RECIPE_TYPE.SHAPED,
        pattern: [
            [32, 32, 32],  // Wool (white)
            [10, 10, 10]
        ],
        output: { id: 73, count: 1 }  // Bed
    },
    
    // Bookshelf
    {
        type: RECIPE_TYPE.SHAPED,
        pattern: [
            [10, 10, 10],
            [18, 18, 18],  // Oak sapling olarak paper yerine
            [10, 10, 10]
        ],
        output: { id: 74, count: 1 }
    },
    
    // TNT
    {
        type: RECIPE_TYPE.SHAPED,
        pattern: [
            [7, 21, 7],
            [21, 7, 21],
            [7, 21, 7]
        ],
        output: { id: 75, count: 1 }
    },
    
    // Bucket (iron)
    {
        type: RECIPE_TYPE.SHAPED,
        pattern: [
            [22, 0, 22],
            [0, 22, 0]
        ],
        output: { id: 76, count: 1 }
    },
    
    // Wool (4 string - simplified)
    {
        type: RECIPE_TYPE.SHAPED,
        pattern: [
            [50, 50],  // Vines as string
            [50, 50]
        ],
        output: { id: 32, count: 1 }
    }
];

// Tool ve Armor isimleri
const TOOL_NAMES = {
    64: 'Stick',
    65: 'Crafting Table',
    66: 'Furnace',
    67: 'Chest',
    68: 'Packed Ice',
    69: 'Torch',
    70: 'Ladder',
    71: 'Fence',
    72: 'Door',
    73: 'Bed',
    74: 'Bookshelf',
    75: 'TNT',
    76: 'Bucket',
    
    // Tools
    100: 'Wooden Pickaxe',
    101: 'Stone Pickaxe',
    102: 'Iron Pickaxe',
    103: 'Diamond Pickaxe',
    110: 'Wooden Axe',
    111: 'Stone Axe',
    112: 'Iron Axe',
    113: 'Diamond Axe',
    120: 'Wooden Shovel',
    121: 'Stone Shovel',
    122: 'Iron Shovel',
    123: 'Diamond Shovel',
    130: 'Wooden Sword',
    131: 'Stone Sword',
    132: 'Iron Sword',
    133: 'Diamond Sword',
    
    // Armor
    200: 'Leather Helmet',
    201: 'Iron Helmet',
    202: 'Diamond Helmet',
    210: 'Leather Chestplate',
    211: 'Iron Chestplate',
    212: 'Diamond Chestplate',
    220: 'Leather Leggings',
    221: 'Iron Leggings',
    222: 'Diamond Leggings',
    230: 'Leather Boots',
    231: 'Iron Boots',
    232: 'Diamond Boots'
};

// 2x2 grid'den crafting kontrolü
function getCraftingResult(grid) {
    if (!grid || grid.length === 0) return null;
    
    // Grid'i ID array'e dönüştür
    const gridIds = grid.map(item => item ? item.id : 0);
    
    // Her tarifi kontrol et
    for (const recipe of CRAFTING_RECIPES) {
        if (recipe.type === RECIPE_TYPE.SHAPELESS) {
            if (matchShapeless(gridIds, recipe.ingredients)) {
                return createStack(recipe.output.id, recipe.output.count);
            }
        } else if (recipe.type === RECIPE_TYPE.SHAPED) {
            if (matchShaped(gridIds, recipe.pattern)) {
                return createStack(recipe.output.id, recipe.output.count);
            }
        }
    }
    
    return null;
}

// Shapeless tarif eşleştirme
function matchShapeless(grid, ingredients) {
    const gridItems = grid.filter(id => id !== 0);
    const needed = [...ingredients];
    
    if (gridItems.length !== needed.length) return false;
    
    for (const item of gridItems) {
        const idx = needed.indexOf(item);
        if (idx === -1) return false;
        needed.splice(idx, 1);
    }
    
    return needed.length === 0;
}

// Shaped tarif eşleştirme
function matchShaped(grid, pattern) {
    const gridSize = Math.sqrt(grid.length);
    const patternH = pattern.length;
    const patternW = pattern[0].length;
    
    // Pattern'i grid'e sığdırmaya çalış
    for (let offsetY = 0; offsetY <= gridSize - patternH; offsetY++) {
        for (let offsetX = 0; offsetX <= gridSize - patternW; offsetX++) {
            if (matchPatternAt(grid, gridSize, pattern, offsetX, offsetY)) {
                // Ayrıca grid'in geri kalanının boş olduğunu kontrol et
                if (isRestEmpty(grid, gridSize, pattern, offsetX, offsetY)) {
                    return true;
                }
            }
        }
    }
    
    return false;
}

function matchPatternAt(grid, gridSize, pattern, offsetX, offsetY) {
    for (let py = 0; py < pattern.length; py++) {
        for (let px = 0; px < pattern[0].length; px++) {
            const gridIdx = (offsetY + py) * gridSize + (offsetX + px);
            const expected = pattern[py][px];
            const actual = grid[gridIdx] || 0;
            
            if (expected !== actual) return false;
        }
    }
    return true;
}

function isRestEmpty(grid, gridSize, pattern, offsetX, offsetY) {
    const patternH = pattern.length;
    const patternW = pattern[0].length;
    
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            // Pattern alanı dışında mı?
            const inPatternX = x >= offsetX && x < offsetX + patternW;
            const inPatternY = y >= offsetY && y < offsetY + patternH;
            
            if (!inPatternX || !inPatternY) {
                // Bu alan pattern dışında, boş olmalı
                const idx = y * gridSize + x;
                if (grid[idx] !== 0) return false;
            }
        }
    }
    return true;
}

// 3x3 Crafting Table için
function getCraftingResult3x3(grid) {
    if (!grid || grid.length !== 9) return null;
    
    const gridIds = grid.map(item => item ? item.id : 0);
    
    for (const recipe of CRAFTING_RECIPES) {
        if (recipe.type === RECIPE_TYPE.SHAPELESS) {
            if (matchShapeless(gridIds, recipe.ingredients)) {
                return createStack(recipe.output.id, recipe.output.count);
            }
        } else if (recipe.type === RECIPE_TYPE.SHAPED) {
            if (matchShaped(gridIds, recipe.pattern)) {
                return createStack(recipe.output.id, recipe.output.count);
            }
        }
    }
    
    return null;
}

// Item adını al
function getItemName(itemId) {
    if (TOOL_NAMES[itemId]) return TOOL_NAMES[itemId];
    if (typeof BLOCKS !== 'undefined' && BLOCKS[itemId]) return BLOCKS[itemId].name;
    return 'Unknown';
}

// Furnace smelting tarifleri
const SMELTING_RECIPES = {
    22: { output: 77, time: 10 },  // Iron Ore -> Iron Ingot
    23: { output: 78, time: 10 },  // Gold Ore -> Gold Ingot
    7:  { output: 17, time: 10 },  // Sand -> Glass
    13: { output: 3, time: 10 },   // Cobblestone -> Stone
    4:  { output: 21, time: 5 },   // Log -> Charcoal (coal ID)
    2:  { output: 14, time: 10 }   // Dirt -> Terracotta (brick olarak)
};

// Yakıt değerleri (saniye)
const FUEL_VALUES = {
    4: 15,   // Log
    10: 15,  // Planks
    64: 5,   // Stick
    21: 80,  // Coal
    76: 100  // Bucket (Lava Bucket olsa)
};

function getSmeltingResult(inputId) {
    return SMELTING_RECIPES[inputId] || null;
}

function getFuelValue(itemId) {
    return FUEL_VALUES[itemId] || 0;
}

console.log("[Crafting] Loaded " + CRAFTING_RECIPES.length + " recipes");
