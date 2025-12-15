// ========================================
// MOBS.JS - Mob Sistemi
// Hayvanlar, düşmanlar, AI, spawning
// ========================================

// Mob tipleri
const MOB_TYPE = {
    // Passive (Hayvanlar)
    PIG: 'pig',
    COW: 'cow',
    SHEEP: 'sheep',
    CHICKEN: 'chicken',
    RABBIT: 'rabbit',
    
    // Neutral
    WOLF: 'wolf',
    BEE: 'bee',
    
    // Hostile (Düşmanlar)
    ZOMBIE: 'zombie',
    SKELETON: 'skeleton',
    CREEPER: 'creeper',
    SPIDER: 'spider',
    ENDERMAN: 'enderman'
};

// Mob tanımları
const MOB_DEFINITIONS = {
    [MOB_TYPE.PIG]: {
        name: 'Pig',
        health: 10,
        speed: 2.0,
        hostile: false,
        drops: [{ id: 79, count: 2, name: 'Raw Porkchop' }],
        size: { w: 0.9, h: 0.9, d: 0.9 },
        color: 0xF5A9B8,
        biomes: [BIOME_TYPE.PLAINS, BIOME_TYPE.FOREST, BIOME_TYPE.SAVANNA],
        spawnWeight: 10
    },
    [MOB_TYPE.COW]: {
        name: 'Cow',
        health: 10,
        speed: 2.0,
        hostile: false,
        drops: [
            { id: 80, count: 2, name: 'Raw Beef' },
            { id: 81, count: 1, name: 'Leather' }
        ],
        size: { w: 0.9, h: 1.4, d: 0.9 },
        color: 0x8B4513,
        biomes: [BIOME_TYPE.PLAINS, BIOME_TYPE.FOREST],
        spawnWeight: 8
    },
    [MOB_TYPE.SHEEP]: {
        name: 'Sheep',
        health: 8,
        speed: 2.0,
        hostile: false,
        drops: [
            { id: 82, count: 1, name: 'Raw Mutton' },
            { id: 32, count: 1, name: 'Wool' }
        ],
        size: { w: 0.9, h: 1.3, d: 0.9 },
        color: 0xF5F5DC,
        biomes: [BIOME_TYPE.PLAINS, BIOME_TYPE.FOREST, BIOME_TYPE.TUNDRA],
        spawnWeight: 12
    },
    [MOB_TYPE.CHICKEN]: {
        name: 'Chicken',
        health: 4,
        speed: 2.5,
        hostile: false,
        drops: [
            { id: 83, count: 1, name: 'Raw Chicken' },
            { id: 84, count: 1, name: 'Feather' }
        ],
        size: { w: 0.4, h: 0.7, d: 0.4 },
        color: 0xFFFFFF,
        biomes: [BIOME_TYPE.PLAINS, BIOME_TYPE.FOREST, BIOME_TYPE.JUNGLE],
        spawnWeight: 10
    },
    [MOB_TYPE.RABBIT]: {
        name: 'Rabbit',
        health: 3,
        speed: 4.0,
        hostile: false,
        drops: [{ id: 85, count: 1, name: 'Rabbit Hide' }],
        size: { w: 0.4, h: 0.5, d: 0.4 },
        color: 0xD2B48C,
        biomes: [BIOME_TYPE.DESERT, BIOME_TYPE.TUNDRA, BIOME_TYPE.SNOWY],
        spawnWeight: 6
    },
    [MOB_TYPE.WOLF]: {
        name: 'Wolf',
        health: 8,
        speed: 3.5,
        hostile: false,  // Neutral
        damage: 4,
        drops: [],
        size: { w: 0.6, h: 0.85, d: 0.6 },
        color: 0x808080,
        biomes: [BIOME_TYPE.FOREST, BIOME_TYPE.TAIGA],
        spawnWeight: 4
    },
    [MOB_TYPE.ZOMBIE]: {
        name: 'Zombie',
        health: 20,
        speed: 2.3,
        hostile: true,
        damage: 3,
        drops: [{ id: 86, count: 1, name: 'Rotten Flesh' }],
        size: { w: 0.6, h: 1.95, d: 0.6 },
        color: 0x5C8A4E,
        biomes: null,  // Gece spawn
        spawnWeight: 100,
        nightOnly: true
    },
    [MOB_TYPE.SKELETON]: {
        name: 'Skeleton',
        health: 20,
        speed: 2.5,
        hostile: true,
        damage: 4,
        ranged: true,
        drops: [
            { id: 87, count: 1, name: 'Bone' },
            { id: 88, count: 1, name: 'Arrow' }
        ],
        size: { w: 0.6, h: 1.99, d: 0.6 },
        color: 0xC8C8C8,
        biomes: null,
        spawnWeight: 80,
        nightOnly: true
    },
    [MOB_TYPE.CREEPER]: {
        name: 'Creeper',
        health: 20,
        speed: 2.5,
        hostile: true,
        damage: 0,  // Patlama hasarı
        explodes: true,
        explosionRadius: 3,
        drops: [{ id: 21, count: 1, name: 'Gunpowder' }],  // Coal olarak
        size: { w: 0.6, h: 1.7, d: 0.6 },
        color: 0x4CAF50,
        biomes: null,
        spawnWeight: 60,
        nightOnly: true
    },
    [MOB_TYPE.SPIDER]: {
        name: 'Spider',
        health: 16,
        speed: 3.0,
        hostile: true,  // Gece hostile
        damage: 2,
        canClimb: true,
        drops: [{ id: 89, count: 1, name: 'String' }],
        size: { w: 1.4, h: 0.9, d: 1.4 },
        color: 0x3D3D3D,
        biomes: null,
        spawnWeight: 70,
        nightOnly: false  // Gündüz neutral
    },
    [MOB_TYPE.ENDERMAN]: {
        name: 'Enderman',
        health: 40,
        speed: 4.0,
        hostile: false,  // Bakınca hostile
        damage: 7,
        teleports: true,
        drops: [{ id: 90, count: 1, name: 'Ender Pearl' }],
        size: { w: 0.6, h: 2.9, d: 0.6 },
        color: 0x161616,
        biomes: null,
        spawnWeight: 10,
        nightOnly: true
    }
};

// Aktif moblar
let mobs = [];
const MAX_MOBS = 50;
const MOB_SPAWN_RADIUS = 24;
const MOB_DESPAWN_RADIUS = 48;

// Mob sınıfı
class Mob {
    constructor(type, x, y, z) {
        this.type = type;
        this.def = MOB_DEFINITIONS[type];
        
        this.x = x;
        this.y = y;
        this.z = z;
        
        this.health = this.def.health;
        this.maxHealth = this.def.health;
        
        this.vx = 0;
        this.vy = 0;
        this.vz = 0;
        
        this.rotation = Math.random() * Math.PI * 2;
        this.targetRotation = this.rotation;
        
        this.state = 'idle';  // idle, walking, fleeing, attacking, following
        this.stateTimer = 0;
        
        this.target = null;  // Hedef (oyuncu veya başka mob)
        this.attackCooldown = 0;
        
        this.mesh = null;
        this.createMesh();
        
        this.id = Math.random().toString(36).substr(2, 9);
    }
    
    createMesh() {
        const def = this.def;
        const geometry = new THREE.BoxGeometry(def.size.w, def.size.h, def.size.d);
        const material = new THREE.MeshLambertMaterial({ color: def.color });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(this.x, this.y + def.size.h / 2, this.z);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Gözler (hostile için kırmızı)
        if (def.hostile) {
            const eyeGeom = new THREE.BoxGeometry(0.1, 0.1, 0.1);
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
            const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
            const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
            leftEye.position.set(-0.15, def.size.h * 0.3, def.size.d / 2 + 0.05);
            rightEye.position.set(0.15, def.size.h * 0.3, def.size.d / 2 + 0.05);
            this.mesh.add(leftEye);
            this.mesh.add(rightEye);
        }
        
        if (typeof scene !== 'undefined') {
            scene.add(this.mesh);
        }
    }
    
    update(dt, playerPos) {
        this.stateTimer -= dt;
        this.attackCooldown -= dt;
        
        const distToPlayer = this.distanceTo(playerPos);
        
        // Despawn kontrolü
        if (distToPlayer > MOB_DESPAWN_RADIUS) {
            this.remove();
            return false;
        }
        
        // AI State machine
        this.updateAI(dt, playerPos, distToPlayer);
        
        // Fizik
        this.applyPhysics(dt);
        
        // Mesh güncelle
        this.updateMesh();
        
        return true;
    }
    
    updateAI(dt, playerPos, distToPlayer) {
        const def = this.def;
        
        if (def.hostile && distToPlayer < 16) {
            // Hostile - oyuncuya saldır
            this.state = 'attacking';
            this.target = playerPos;
            this.moveTowards(playerPos, def.speed);
            
            // Saldırı mesafesi
            if (distToPlayer < 1.5 && this.attackCooldown <= 0) {
                this.attack();
            }
        } else if (this.state === 'idle' || this.stateTimer <= 0) {
            // Rastgele hareket
            if (Math.random() < 0.3) {
                this.state = 'walking';
                this.targetRotation = Math.random() * Math.PI * 2;
                this.stateTimer = 2 + Math.random() * 3;
            } else {
                this.state = 'idle';
                this.stateTimer = 1 + Math.random() * 2;
            }
        }
        
        if (this.state === 'walking') {
            // Yön doğru yürü
            this.vx = Math.sin(this.rotation) * def.speed * 0.5;
            this.vz = Math.cos(this.rotation) * def.speed * 0.5;
        } else if (this.state === 'idle') {
            this.vx *= 0.9;
            this.vz *= 0.9;
        }
        
        // Rotasyonu yavaşça hedef rotasyona döndür
        const rotDiff = this.targetRotation - this.rotation;
        this.rotation += rotDiff * 0.1;
    }
    
    moveTowards(target, speed) {
        const dx = target.x - this.x;
        const dz = target.z - this.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        if (dist > 0.1) {
            this.vx = (dx / dist) * speed * 0.5;
            this.vz = (dz / dist) * speed * 0.5;
            this.targetRotation = Math.atan2(dx, dz);
        }
    }
    
    applyPhysics(dt) {
        // Yerçekimi
        this.vy -= 20 * dt;
        
        // Pozisyon güncelle
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.z += this.vz * dt;
        
        // Zemin çarpışması (basit)
        const groundY = this.getGroundLevel();
        if (this.y < groundY) {
            this.y = groundY;
            this.vy = 0;
        }
        
        // Blok çarpışması
        this.handleBlockCollision();
    }
    
    getGroundLevel() {
        // Basit zemin hesabı - chunk sisteminden
        if (typeof noise2D !== 'undefined') {
            let n = noise2D(this.x / 60, this.z / 60);
            let h = Math.floor((n + 1) * 8) + 4;
            return h;
        }
        return 10;
    }
    
    handleBlockCollision() {
        // Basit AABB kontrolü
        const hw = this.def.size.w / 2;
        const hd = this.def.size.d / 2;
        
        // Blok var mı kontrol et (world'den)
        if (typeof getBlockAt === 'function') {
            const checkPositions = [
                [this.x + hw, this.y, this.z],
                [this.x - hw, this.y, this.z],
                [this.x, this.y, this.z + hd],
                [this.x, this.y, this.z - hd]
            ];
            
            for (const [cx, cy, cz] of checkPositions) {
                const block = getBlockAt(Math.floor(cx), Math.floor(cy + 1), Math.floor(cz));
                if (block && block !== 0 && block !== 6) {  // Air ve Water değilse
                    // Geri it
                    this.x -= this.vx * 0.1;
                    this.z -= this.vz * 0.1;
                    
                    // Zıpla
                    if (this.vy <= 0) {
                        this.vy = 5;
                    }
                    break;
                }
            }
        }
    }
    
    updateMesh() {
        if (this.mesh) {
            this.mesh.position.set(this.x, this.y + this.def.size.h / 2, this.z);
            this.mesh.rotation.y = this.rotation;
        }
    }
    
    attack() {
        this.attackCooldown = 1.0;
        
        // Oyuncuya hasar ver
        if (typeof playerHealth !== 'undefined' && typeof damagePlayer === 'function') {
            damagePlayer(this.def.damage);
        }
        
        console.log(`${this.def.name} attacks for ${this.def.damage} damage!`);
    }
    
    takeDamage(amount, knockbackDir) {
        this.health -= amount;
        
        // Knockback
        if (knockbackDir) {
            this.vx += knockbackDir.x * 5;
            this.vy += 3;
            this.vz += knockbackDir.z * 5;
        }
        
        // Flash kırmızı
        if (this.mesh) {
            this.mesh.material.color.setHex(0xFF0000);
            setTimeout(() => {
                if (this.mesh) this.mesh.material.color.setHex(this.def.color);
            }, 100);
        }
        
        if (this.health <= 0) {
            this.die();
        }
        
        // Kaç (passive moblar için)
        if (!this.def.hostile) {
            this.state = 'fleeing';
            this.stateTimer = 3;
        }
    }
    
    die() {
        // Drop items
        for (const drop of this.def.drops) {
            const count = drop.count + Math.floor(Math.random() * 2);
            console.log(`Dropped ${count}x ${drop.name}`);
            
            // Envantere ekle
            if (typeof addItemToInventory === 'function') {
                addItemToInventory(createStack(drop.id, count));
            }
        }
        
        this.remove();
    }
    
    remove() {
        if (this.mesh && typeof scene !== 'undefined') {
            scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
        
        const idx = mobs.indexOf(this);
        if (idx !== -1) {
            mobs.splice(idx, 1);
        }
    }
    
    distanceTo(pos) {
        const dx = pos.x - this.x;
        const dy = pos.y - this.y;
        const dz = pos.z - this.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
}

// Mob spawn sistemi
function spawnMob(type, x, y, z) {
    if (mobs.length >= MAX_MOBS) return null;
    
    const mob = new Mob(type, x, y, z);
    mobs.push(mob);
    return mob;
}

// Doğal spawn (gündüz/gece)
function updateMobSpawning(playerPos, isNight) {
    if (mobs.length >= MAX_MOBS) return;
    
    // Her 2-5 saniyede bir spawn şansı
    if (Math.random() > 0.01) return;
    
    // Spawn pozisyonu (oyuncudan uzak ama çok da değil)
    const angle = Math.random() * Math.PI * 2;
    const dist = MOB_SPAWN_RADIUS * (0.5 + Math.random() * 0.5);
    
    const spawnX = playerPos.x + Math.cos(angle) * dist;
    const spawnZ = playerPos.z + Math.sin(angle) * dist;
    
    // Zemin yüksekliği
    let spawnY = 10;
    if (typeof noise2D !== 'undefined') {
        let n = noise2D(spawnX / 60, spawnZ / 60);
        spawnY = Math.floor((n + 1) * 8) + 5;
    }
    
    // Biyom al
    let biomeType = BIOME_TYPE.PLAINS;
    if (typeof getBiomeAt === 'function') {
        biomeType = getBiomeAt(spawnX, spawnZ);
    }
    
    // Uygun mob seç
    const candidates = [];
    
    for (const [type, def] of Object.entries(MOB_DEFINITIONS)) {
        // Gece/gündüz kontrolü
        if (def.nightOnly && !isNight) continue;
        if (!def.nightOnly && isNight && def.hostile) continue;
        
        // Biyom kontrolü
        if (def.biomes && !def.biomes.includes(biomeType)) continue;
        
        // Weight'e göre ekle
        for (let i = 0; i < def.spawnWeight; i++) {
            candidates.push(type);
        }
    }
    
    if (candidates.length > 0) {
        const selectedType = candidates[Math.floor(Math.random() * candidates.length)];
        spawnMob(selectedType, spawnX, spawnY, spawnZ);
    }
}

// Tüm mobları güncelle
function updateMobs(dt, playerPos) {
    for (let i = mobs.length - 1; i >= 0; i--) {
        const mob = mobs[i];
        if (!mob.update(dt, playerPos)) {
            // Mob silindi
        }
    }
}

// Mob'a vur
function hitMob(x, y, z, damage, knockbackDir) {
    for (const mob of mobs) {
        const dx = mob.x - x;
        const dy = mob.y - y;
        const dz = mob.z - z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (dist < 2) {
            mob.takeDamage(damage, knockbackDir);
            return mob;
        }
    }
    return null;
}

// Gece mi kontrolü (basit - gerçek oyunda gün döngüsü)
let gameTime = 0;
const DAY_LENGTH = 600;  // 10 dakika = 1 gün

function isNightTime() {
    const timeOfDay = (gameTime % DAY_LENGTH) / DAY_LENGTH;
    return timeOfDay > 0.5;  // Yarısından sonrası gece
}

function updateGameTime(dt) {
    gameTime += dt;
}

console.log("[Mobs] Loaded " + Object.keys(MOB_DEFINITIONS).length + " mob types");
