// ========================================
// TREES.JS - Gelişmiş Ağaç Sistemi
// L-System benzeri prosedürel ağaçlar
// ========================================

// Ağaç tipleri ve özellikleri
const TREE_TYPES = {
    oak: {
        name: 'Oak',
        logId: 4,      // OakLog
        leafId: 5,     // OakLeaves
        minHeight: 4,
        maxHeight: 6,
        leafRadius: 2,
        style: 'round'
    },
    birch: {
        name: 'Birch',
        logId: 11,     // BirchLog
        leafId: 57,    // BirchLeaves
        minHeight: 5,
        maxHeight: 7,
        leafRadius: 2,
        style: 'round'
    },
    spruce: {
        name: 'Spruce',
        logId: 12,     // SpruceLog
        leafId: 58,    // SpruceLeaves
        minHeight: 6,
        maxHeight: 10,
        leafRadius: 3,
        style: 'conifer'
    },
    jungle: {
        name: 'Jungle',
        logId: 4,      // Will use 59 if available
        leafId: 5,     // Will use 60 if available
        minHeight: 10,
        maxHeight: 18,
        leafRadius: 3,
        style: 'tall',
        vines: true
    },
    acacia: {
        name: 'Acacia',
        logId: 4,      // Will use unique if available
        leafId: 5,     // Will use unique if available
        minHeight: 5,
        maxHeight: 7,
        leafRadius: 4,
        style: 'umbrella'
    },
    darkOak: {
        name: 'Dark Oak',
        logId: 4,      // DarkOakLog
        leafId: 5,     // DarkOakLeaves
        minHeight: 4,
        maxHeight: 6,
        leafRadius: 3,
        style: 'thick',
        trunkWidth: 2
    },
    cherry: {
        name: 'Cherry',
        logId: 4,
        leafId: 42,    // PinkTulip color as placeholder
        minHeight: 4,
        maxHeight: 6,
        leafRadius: 3,
        style: 'weeping'
    }
};

// Deterministic random based on position
function treeRandom(x, z, seed) {
    const n = Math.sin(x * 12.9898 + z * 78.233 + seed * 43758.5453) * 43758.5453;
    return n - Math.floor(n);
}

// Gelişmiş ağaç generator (chunk bağımsız - world coords)
function generateAdvancedTree(setBlockFunc, wx, wy, wz, treeType, seed) {
    const config = TREE_TYPES[treeType] || TREE_TYPES.oak;
    const rand = treeRandom(wx, wz, seed || 0);
    
    const height = config.minHeight + Math.floor(rand * (config.maxHeight - config.minHeight + 1));
    
    switch(config.style) {
        case 'conifer':
            generateConiferTree(setBlockFunc, wx, wy, wz, config, height, rand);
            break;
        case 'tall':
            generateJungleTree(setBlockFunc, wx, wy, wz, config, height, rand);
            break;
        case 'umbrella':
            generateAcaciaTree(setBlockFunc, wx, wy, wz, config, height, rand);
            break;
        case 'thick':
            generateThickTree(setBlockFunc, wx, wy, wz, config, height, rand);
            break;
        case 'weeping':
            generateWeepingTree(setBlockFunc, wx, wy, wz, config, height, rand);
            break;
        default:
            generateRoundTree(setBlockFunc, wx, wy, wz, config, height, rand);
    }
}

// Yuvarlak ağaç (Oak, Birch)
function generateRoundTree(setBlock, x, y, z, config, height, rand) {
    // Gövde
    for (let i = 0; i < height; i++) {
        setBlock(x, y + i, z, config.logId);
    }
    
    // Yapraklar - küresel
    const leafStart = height - 2;
    for (let dy = leafStart; dy <= height + 1; dy++) {
        const layerRadius = dy === height + 1 ? 1 : config.leafRadius;
        for (let dx = -layerRadius; dx <= layerRadius; dx++) {
            for (let dz = -layerRadius; dz <= layerRadius; dz++) {
                if (Math.abs(dx) === layerRadius && Math.abs(dz) === layerRadius) {
                    if (treeRandom(x + dx, z + dz, dy) > 0.5) continue;
                }
                if (dx === 0 && dz === 0 && dy < height) continue;
                setBlock(x + dx, y + dy, z + dz, config.leafId);
            }
        }
    }
}

// Kozalaklı ağaç (Spruce)
function generateConiferTree(setBlock, x, y, z, config, height, rand) {
    // Gövde
    for (let i = 0; i < height; i++) {
        setBlock(x, y + i, z, config.logId);
    }
    
    // Yapraklar - koni şekli
    let radius = 0;
    for (let dy = height; dy >= height - Math.floor(height * 0.7); dy--) {
        const layerFromTop = height - dy;
        radius = Math.min(Math.floor(layerFromTop / 2) + 1, config.leafRadius);
        
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dz = -radius; dz <= radius; dz++) {
                const dist = Math.abs(dx) + Math.abs(dz);
                if (dist > radius + 1) continue;
                if (dx === 0 && dz === 0 && dy < height) continue;
                
                // Kenar randomizasyonu
                if (dist === radius + 1 && treeRandom(x + dx, z + dz, dy) > 0.3) continue;
                
                setBlock(x + dx, y + dy, z + dz, config.leafId);
            }
        }
    }
    
    // Tepe
    setBlock(x, y + height, z, config.leafId);
    setBlock(x, y + height + 1, z, config.leafId);
}

// Jungle ağacı (Uzun)
function generateJungleTree(setBlock, x, y, z, config, height, rand) {
    // Ana gövde
    for (let i = 0; i < height; i++) {
        setBlock(x, y + i, z, config.logId);
    }
    
    // Destek kökler (buttress)
    if (height > 12) {
        const roots = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        for (const [dx, dz] of roots) {
            if (treeRandom(x + dx, z + dz, 99) > 0.5) {
                for (let i = 0; i < 3; i++) {
                    setBlock(x + dx, y + i, z + dz, config.logId);
                }
            }
        }
    }
    
    // Büyük yaprak baldachino
    const canopyStart = height - 4;
    for (let dy = canopyStart; dy <= height; dy++) {
        const layerRadius = dy === height ? 2 : config.leafRadius;
        for (let dx = -layerRadius; dx <= layerRadius; dx++) {
            for (let dz = -layerRadius; dz <= layerRadius; dz++) {
                const dist = Math.sqrt(dx * dx + dz * dz);
                if (dist > layerRadius + 0.5) continue;
                if (dx === 0 && dz === 0 && dy < height) continue;
                setBlock(x + dx, y + dy, z + dz, config.leafId);
            }
        }
    }
    
    // Sarmaşıklar (vines)
    if (config.vines) {
        const vinePositions = [
            [config.leafRadius + 1, 0],
            [-config.leafRadius - 1, 0],
            [0, config.leafRadius + 1],
            [0, -config.leafRadius - 1]
        ];
        for (const [dx, dz] of vinePositions) {
            if (treeRandom(x + dx, z + dz, 123) > 0.4) {
                const vineLength = 3 + Math.floor(treeRandom(x + dx, z + dz, 456) * 4);
                for (let i = 0; i < vineLength; i++) {
                    // Vine block ID 50 kullan (varsa)
                    setBlock(x + dx, y + height - 2 - i, z + dz, 50);
                }
            }
        }
    }
}

// Acacia ağacı (Şemsiye)
function generateAcaciaTree(setBlock, x, y, z, config, height, rand) {
    // Eğik gövde
    let currentX = x;
    let currentZ = z;
    const bendDir = rand > 0.5 ? 1 : -1;
    const bendAxis = rand > 0.75 ? 'x' : 'z';
    
    for (let i = 0; i < height; i++) {
        setBlock(currentX, y + i, currentZ, config.logId);
        
        // Gövde eğimi (ortada)
        if (i === Math.floor(height / 2)) {
            if (bendAxis === 'x') currentX += bendDir;
            else currentZ += bendDir;
        }
    }
    
    // Düz şemsiye baldachino
    const canopyY = y + height;
    for (let dx = -config.leafRadius; dx <= config.leafRadius; dx++) {
        for (let dz = -config.leafRadius; dz <= config.leafRadius; dz++) {
            const dist = Math.abs(dx) + Math.abs(dz);
            if (dist > config.leafRadius + 1) continue;
            
            // Üst katman
            setBlock(currentX + dx, canopyY, currentZ + dz, config.leafId);
            
            // Alt katman (daha küçük)
            if (dist <= config.leafRadius - 1) {
                setBlock(currentX + dx, canopyY - 1, currentZ + dz, config.leafId);
            }
        }
    }
}

// Kalın ağaç (Dark Oak - 2x2 gövde)
function generateThickTree(setBlock, x, y, z, config, height, rand) {
    const w = config.trunkWidth || 2;
    
    // 2x2 gövde
    for (let i = 0; i < height; i++) {
        for (let dx = 0; dx < w; dx++) {
            for (let dz = 0; dz < w; dz++) {
                setBlock(x + dx, y + i, z + dz, config.logId);
            }
        }
    }
    
    // Geniş yaprak
    const cx = x + 0.5;
    const cz = z + 0.5;
    for (let dy = height - 2; dy <= height + 1; dy++) {
        const layerRadius = dy === height + 1 ? 2 : config.leafRadius;
        for (let dx = -layerRadius; dx <= layerRadius + 1; dx++) {
            for (let dz = -layerRadius; dz <= layerRadius + 1; dz++) {
                const dist = Math.sqrt(dx * dx + dz * dz);
                if (dist > layerRadius + 1) continue;
                
                // Gövde alanını atla
                if (dx >= 0 && dx < w && dz >= 0 && dz < w && dy < height) continue;
                
                setBlock(x + dx, y + dy, z + dz, config.leafId);
            }
        }
    }
}

// Sarkık ağaç (Cherry - weeping)
function generateWeepingTree(setBlock, x, y, z, config, height, rand) {
    // Normal gövde
    for (let i = 0; i < height; i++) {
        setBlock(x, y + i, z, config.logId);
    }
    
    // Ana yaprak kubbesi
    const leafStart = height - 2;
    for (let dy = leafStart; dy <= height; dy++) {
        const radius = config.leafRadius;
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dz = -radius; dz <= radius; dz++) {
                const dist = Math.sqrt(dx * dx + dz * dz);
                if (dist > radius + 0.5) continue;
                if (dx === 0 && dz === 0 && dy < height) continue;
                setBlock(x + dx, y + dy, z + dz, config.leafId);
            }
        }
    }
    
    // Sarkık dallar
    const hangPositions = [];
    const radius = config.leafRadius;
    for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist > radius - 0.5 && dist <= radius + 0.5) {
                hangPositions.push([dx, dz]);
            }
        }
    }
    
    for (const [dx, dz] of hangPositions) {
        if (treeRandom(x + dx, z + dz, 789) > 0.6) {
            const hangLength = 1 + Math.floor(treeRandom(x + dx, z + dz, 321) * 3);
            for (let i = 0; i < hangLength; i++) {
                setBlock(x + dx, y + leafStart - 1 - i, z + dz, config.leafId);
            }
        }
    }
}

// Büyük ağaç (Giant tree - 4-6 chunk span)
function generateGiantTree(setBlock, x, y, z, treeType, seed) {
    const config = TREE_TYPES[treeType] || TREE_TYPES.oak;
    const height = 20 + Math.floor(treeRandom(x, z, seed) * 15);
    
    // 3x3 gövde
    for (let i = 0; i < height; i++) {
        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                // Köşeleri yontulmuş
                if (i > height * 0.7 && Math.abs(dx) === 1 && Math.abs(dz) === 1) continue;
                setBlock(x + dx, y + i, z + dz, config.logId);
            }
        }
    }
    
    // Dallar
    const branchCount = 4 + Math.floor(treeRandom(x, z, seed + 1) * 4);
    for (let b = 0; b < branchCount; b++) {
        const branchY = Math.floor(height * 0.5 + treeRandom(x, z, seed + b) * height * 0.4);
        const angle = (b / branchCount) * Math.PI * 2;
        const length = 4 + Math.floor(treeRandom(x, z, seed + b + 100) * 4);
        
        for (let i = 0; i < length; i++) {
            const bx = Math.round(Math.cos(angle) * i);
            const bz = Math.round(Math.sin(angle) * i);
            setBlock(x + bx, y + branchY + Math.floor(i * 0.3), z + bz, config.logId);
            
            // Dal uçlarında yapraklar
            if (i >= length - 2) {
                for (let dx = -2; dx <= 2; dx++) {
                    for (let dz = -2; dz <= 2; dz++) {
                        for (let dy = -1; dy <= 2; dy++) {
                            if (Math.abs(dx) + Math.abs(dz) + Math.abs(dy) <= 3) {
                                setBlock(x + bx + dx, y + branchY + Math.floor(i * 0.3) + dy, z + bz + dz, config.leafId);
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Tepe yaprakları
    for (let dx = -4; dx <= 4; dx++) {
        for (let dz = -4; dz <= 4; dz++) {
            for (let dy = -2; dy <= 3; dy++) {
                const dist = Math.sqrt(dx * dx + dz * dz + dy * dy * 0.5);
                if (dist <= 5) {
                    setBlock(x + dx, y + height + dy, z + dz, config.leafId);
                }
            }
        }
    }
}

console.log("[Trees] Loaded " + Object.keys(TREE_TYPES).length + " tree types with advanced generation");
