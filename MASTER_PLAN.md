# 🎮 Minecraft Clone - Master Development Plan
## Luanti Features + Massive World Implementation

---

## 📊 Proje Durumu

| Faz | Durum | Açıklama |
|-----|-------|----------|
| Faz 0 | ✅ Tamamlandı | Temel oyun, shader, particle, audio, caves |
| Faz 1 | ⏳ Bekliyor | Yeni Bloklar & Bitkiler |
| Faz 2 | ⏳ Bekliyor | Devasa Harita & Chunk Sistemi |
| Faz 3 | ⏳ Bekliyor | Biome Sistemi |
| Faz 4 | ⏳ Bekliyor | Ağaç & Bitki Üretimi |
| Faz 5 | ⏳ Bekliyor | Cevher & Maden Sistemi |
| Faz 6 | ⏳ Bekliyor | Gelişmiş Envanter |
| Faz 7 | ⏳ Bekliyor | Crafting Sistemi |
| Faz 8 | ⏳ Bekliyor | Entity/Mob Sistemi |
| Faz 9 | ⏳ Bekliyor | Final Optimizasyonlar |

---

## 🔧 FAZ 1: Yeni Bloklar & Bitkiler
**Tahmini Süre:** 1-2 saat

### 1.1 Yeni Solid Bloklar
```
Eklenecek Bloklar:
├── 🪨 Cobblestone (kırılan stone'dan düşer)
├── 🧱 Brick
├── 🪵 Oak Planks
├── 🪵 Pine Planks  
├── 🪵 Jungle Planks
├── 📦 Crafting Table
├── 🔥 Furnace
├── 📦 Chest
├── 🛏️ Bed (2 blok)
├── ❄️ Ice
├── ❄️ Snow Block
├── 🏜️ Sandstone
├── 🌑 Obsidian
├── 💎 Diamond Block
├── 🥇 Gold Block
├── 🔩 Iron Block
└── �ite Clay
```

### 1.2 Cevher Blokları (Ores)
```
Cevherler:
├── Coal Ore (y: 0-128, yaygın)
├── Iron Ore (y: 0-64, orta)
├── Gold Ore (y: 0-32, nadir)
├── Diamond Ore (y: 0-16, çok nadir)
├── Redstone Ore (y: 0-16, nadir)
├── Lapis Ore (y: 0-32, nadir)
├── Emerald Ore (y: 0-32, çok nadir, sadece dağlarda)
└── Copper Ore (y: 0-96, orta)
```

### 1.3 Plantlike Bloklar (Bitkiler)
```
Bitkiler:
├── 🌸 Rose (kırmızı çiçek)
├── 🌼 Dandelion (sarı çiçek)
├── 🌷 Tulip (çeşitli renkler)
├── 💐 Blue Orchid
├── 🌿 Fern
├── 🌿 Tall Grass
├── 🌿 Double Tall Grass
├── 🍄 Red Mushroom
├── 🍄 Brown Mushroom
├── 🌵 Cactus
├── 🎋 Sugar Cane
├── 🌾 Wheat (4 aşama)
├── 🎃 Pumpkin
└── 🍉 Melon
```

### 1.4 Teknik Detaylar
```javascript
// Plantlike render için billboard sprite kullanılacak
// Her bitki için:
// - texture atlas pozisyonu
// - spawn biome'u
// - spawn olasılığı
// - ışık gereksinimi
// - walkable: false
// - collision: false
```

---

## 🌍 FAZ 2: Devasa Harita & Chunk Sistemi
**Tahmini Süre:** 3-4 saat
**KRİTİK PERFORMANS FAZI**

### 2.1 Chunk Mimarisi
```
Dünya Yapısı:
├── Chunk Boyutu: 16x256x16 blok
├── Render Distance: 4-12 chunk (ayarlanabilir)
├── World Size: Teorik olarak sınırsız (integer limit)
├── Chunk Loading: Lazy loading (ihtiyaç halinde)
└── Chunk Unloading: LRU cache ile
```

### 2.2 Chunk Manager Sistemi
```javascript
class ChunkManager {
  constructor() {
    this.loadedChunks = new Map();  // "x,z" -> Chunk
    this.chunkMeshes = new Map();   // "x,z" -> THREE.Mesh
    this.loadQueue = [];            // Yüklenecek chunklar
    this.unloadQueue = [];          // Boşaltılacak chunklar
    this.workerPool = [];           // Web Worker'lar
  }
  
  // Kritik metodlar:
  getChunkAt(worldX, worldZ) {}
  loadChunk(cx, cz) {}
  unloadChunk(cx, cz) {}
  updateVisibleChunks(playerPos) {}
  rebuildChunkMesh(cx, cz) {}
}
```

### 2.3 Web Worker Terrain Generation
```
Worker Sistemi:
├── Main Thread: Render, input, physics
├── Worker 1-4: Terrain generation
├── Worker 5: Mesh building
└── SharedArrayBuffer: Chunk data paylaşımı
```

### 2.4 Level of Detail (LOD)
```
LOD Seviyeleri:
├── LOD 0 (0-2 chunk): Full detail, tüm bloklar
├── LOD 1 (2-4 chunk): Reduced detail, basitleştirilmiş
├── LOD 2 (4-8 chunk): Minimal detail, sadece outline
└── LOD 3 (8+ chunk): Billboard/impostor
```

### 2.5 Frustum Culling
```javascript
// Kamera görüş açısı dışındaki chunkları render etme
function updateVisibleChunks(camera) {
  frustum.setFromProjectionMatrix(
    camera.projectionMatrix.clone()
      .multiply(camera.matrixWorldInverse)
  );
  
  for (const [key, mesh] of chunkMeshes) {
    mesh.visible = frustum.intersectsBox(mesh.boundingBox);
  }
}
```

### 2.6 Greedy Meshing Optimizasyonu
```
Mevcut: Her blok için 6 face kontrol
Yeni: Greedy meshing ile bitişik aynı blokları birleştir

Örnek:
10x1x1 stone sırası:
- Eski: 60 triangle
- Yeni: 12 triangle (tek uzun face)

Performans Kazancı: %60-80 daha az triangle
```

### 2.7 Instanced Rendering
```javascript
// Aynı blok türleri için InstancedMesh kullan
// Örnek: 1000 stone blok = 1 draw call
const stoneInstances = new THREE.InstancedMesh(
  stoneGeometry,
  stoneMaterial,
  maxStoneCount
);
```

---

## 🏔️ FAZ 3: Biome Sistemi
**Tahmini Süre:** 2-3 saat

### 3.1 Biome Türleri
```
Biome Listesi:
├── 🌲 Forest (Orman)
│   ├── temperature: 0.5-0.8
│   ├── humidity: 0.4-0.7
│   ├── surface: grass
│   ├── trees: oak, birch
│   └── flora: flowers, ferns
│
├── 🌳 Jungle (Tropikal)
│   ├── temperature: 0.8-1.0
│   ├── humidity: 0.8-1.0
│   ├── surface: grass (koyu)
│   ├── trees: jungle tree (büyük)
│   └── flora: vines, ferns, melons
│
├── 🏜️ Desert (Çöl)
│   ├── temperature: 0.9-1.0
│   ├── humidity: 0.0-0.2
│   ├── surface: sand
│   ├── trees: yok
│   └── flora: cactus, dead bush
│
├── ❄️ Snowy Tundra (Kar)
│   ├── temperature: 0.0-0.2
│   ├── humidity: 0.3-0.5
│   ├── surface: snow, ice
│   ├── trees: spruce (seyrek)
│   └── flora: yok
│
├── 🌲 Taiga (Çam Ormanı)
│   ├── temperature: 0.2-0.4
│   ├── humidity: 0.5-0.7
│   ├── surface: grass, podzol
│   ├── trees: spruce
│   └── flora: ferns, sweet berries
│
├── 🏔️ Mountains (Dağlar)
│   ├── temperature: 0.2-0.4
│   ├── humidity: 0.3-0.5
│   ├── surface: stone, gravel
│   ├── trees: oak (seyrek)
│   └── flora: yok
│   └── special: emerald ore
│
├── 🌊 Ocean (Okyanus)
│   ├── y_max: 63 (sea level)
│   ├── surface: sand, gravel, clay
│   ├── depth: 20-50 blok
│   └── flora: kelp, seagrass
│
├── 🏖️ Beach (Kumsal)
│   ├── width: 3-8 blok
│   ├── surface: sand
│   └── transition biome
│
├── 🌾 Plains (Düzlük)
│   ├── temperature: 0.5-0.7
│   ├── humidity: 0.3-0.5
│   ├── surface: grass
│   ├── trees: oak (çok seyrek)
│   └── flora: tall grass, flowers
│
└── 🍂 Savanna (Savan)
    ├── temperature: 0.8-0.9
    ├── humidity: 0.2-0.4
    ├── surface: grass (sarı)
    ├── trees: acacia
    └── flora: tall grass
```

### 3.2 Biome Noise Sistemi
```javascript
// 2D Simplex noise ile biome seçimi
function getBiome(worldX, worldZ) {
  const temperature = (noise2D(worldX * 0.001, worldZ * 0.001) + 1) / 2;
  const humidity = (noise2D(worldX * 0.001 + 1000, worldZ * 0.001 + 1000) + 1) / 2;
  
  // Whittaker diagram benzeri seçim
  return selectBiomeFromClimate(temperature, humidity);
}
```

### 3.3 Biome Blending
```
Biome geçişleri için:
- 8 blok blend mesafesi
- Lerp ile surface blok karışımı
- Smooth height transition
```

---

## 🌳 FAZ 4: Ağaç & Bitki Üretimi
**Tahmini Süre:** 2 saat

### 4.1 Ağaç Türleri
```
Ağaç Şablonları:
├── Oak Tree
│   ├── Gövde: 4-6 blok yükseklik
│   ├── Yaprak: Küresel, 5x5x4
│   └── Spawn: Forest, Plains
│
├── Birch Tree
│   ├── Gövde: 5-7 blok (ince)
│   ├── Yaprak: Oval, 3x3x4
│   └── Spawn: Forest, Birch Forest
│
├── Spruce Tree (Çam)
│   ├── Gövde: 6-10 blok
│   ├── Yaprak: Konik, üçgen
│   └── Spawn: Taiga, Snowy
│
├── Jungle Tree
│   ├── Gövde: 10-25 blok (2x2 trunk)
│   ├── Yaprak: Büyük, sarkan
│   ├── Vines: Gövde ve yapraklarda
│   └── Spawn: Jungle
│
├── Acacia Tree
│   ├── Gövde: 5-8 blok, eğik
│   ├── Yaprak: Düz, şemsiye
│   └── Spawn: Savanna
│
└── Dark Oak Tree
    ├── Gövde: 6-8 blok (2x2 trunk)
    ├── Yaprak: Geniş, yoğun
    └── Spawn: Dark Forest
```

### 4.2 L-System Ağaçlar (İleri Seviye)
```javascript
// Prosedürel ağaç üretimi için L-System
const oakRules = {
  axiom: "F",
  rules: {
    "F": "FF+[+F-F-F]-[-F+F+F]"
  },
  angle: 25,
  iterations: 4
};
```

### 4.3 Bitki Dağılımı
```javascript
// Her chunk için bitki spawn
function decorateChunk(chunk, biome) {
  const decorations = biome.getDecorations();
  
  for (const deco of decorations) {
    const count = Math.floor(deco.density * CHUNK_SIZE * CHUNK_SIZE);
    for (let i = 0; i < count; i++) {
      const x = random(0, CHUNK_SIZE);
      const z = random(0, CHUNK_SIZE);
      const y = getTerrainHeight(x, z);
      
      if (canPlace(deco, x, y, z)) {
        placeDecoration(deco, x, y, z);
      }
    }
  }
}
```

---

## 💎 FAZ 5: Cevher & Maden Sistemi
**Tahmini Süre:** 1-2 saat

### 5.1 Ore Distribution
```
Cevher Dağılımı (y koordinatı):
├── Coal Ore
│   ├── y: 0-128
│   ├── vein size: 4-16
│   ├── attempts per chunk: 20
│   └── drop: coal (1-2)
│
├── Iron Ore
│   ├── y: 0-64
│   ├── vein size: 4-8
│   ├── attempts per chunk: 15
│   └── drop: raw iron (1)
│
├── Gold Ore
│   ├── y: 0-32
│   ├── vein size: 4-8
│   ├── attempts per chunk: 4
│   └── drop: raw gold (1)
│
├── Diamond Ore
│   ├── y: 0-16
│   ├── vein size: 1-4
│   ├── attempts per chunk: 1
│   └── drop: diamond (1)
│
├── Redstone Ore
│   ├── y: 0-16
│   ├── vein size: 4-8
│   ├── attempts per chunk: 8
│   └── drop: redstone dust (4-5)
│
├── Lapis Ore
│   ├── y: 0-32 (peak at 16)
│   ├── vein size: 4-8
│   ├── attempts per chunk: 2
│   └── drop: lapis lazuli (4-9)
│
├── Emerald Ore
│   ├── y: 0-32
│   ├── vein size: 1 (tek blok)
│   ├── attempts per chunk: 1
│   ├── biome: Mountains only
│   └── drop: emerald (1)
│
└── Copper Ore
    ├── y: 0-96 (peak at 48)
    ├── vein size: 4-10
    ├── attempts per chunk: 16
    └── drop: raw copper (2-5)
```

### 5.2 Ore Vein Generation
```javascript
function generateOreVein(chunk, oreType, startX, startY, startZ) {
  const veinSize = randomRange(oreType.minVein, oreType.maxVein);
  
  for (let i = 0; i < veinSize; i++) {
    // Blob/sphere pattern
    const offsetX = randomRange(-1, 1);
    const offsetY = randomRange(-1, 1);
    const offsetZ = randomRange(-1, 1);
    
    const x = startX + offsetX;
    const y = startY + offsetY;
    const z = startZ + offsetZ;
    
    if (chunk.getBlock(x, y, z) === STONE) {
      chunk.setBlock(x, y, z, oreType.blockId);
    }
  }
}
```

---

## 🎒 FAZ 6: Gelişmiş Envanter
**Tahmini Süre:** 2-3 saat

### 6.1 Envanter Yapısı
```
Envanter Layout:
├── Hotbar: 9 slot (mevcut)
├── Main Inventory: 27 slot (3x9)
├── Armor Slots: 4 slot
│   ├── Helmet
│   ├── Chestplate
│   ├── Leggings
│   └── Boots
├── Offhand: 1 slot
├── Craft Grid: 4 slot (2x2)
└── Craft Output: 1 slot

Toplam: 46 slot
```

### 6.2 Item Stack Sistemi
```javascript
class ItemStack {
  constructor(itemId, count = 1, metadata = {}) {
    this.itemId = itemId;
    this.count = count;
    this.metadata = metadata; // durability, enchants, etc.
  }
  
  // Stack limit kontrolü
  getMaxStackSize() {
    const item = Items[this.itemId];
    return item.stackable ? 64 : 1;
  }
  
  // Durability (araçlar için)
  getDurability() {
    return this.metadata.durability || 0;
  }
}
```

### 6.3 UI Etkileşimleri
```
Mouse Etkileşimleri:
├── Sol Tık: Tüm stack'i al/bırak
├── Sağ Tık: Yarı stack al / tek item bırak
├── Shift + Sol Tık: Quick move
├── Çift Tık: Aynı itemları topla
├── Drag: Slot üzerinde sürükle-bırak
├── 1-9 Tuşları: Hotbar'a quick assign
└── Q Tuşu: Seçili item'ı at
```

### 6.4 Chest/Container UI
```javascript
// Chest açıldığında çift envanter görünümü
class ChestInventory extends Inventory {
  constructor(chestBlock) {
    super();
    this.chestSlots = 27; // 3x9
    this.playerSlots = 36; // hotbar + main
  }
  
  render() {
    // Üst: Chest inventory (27 slot)
    // Alt: Player inventory (27 slot + 9 hotbar)
  }
}
```

---

## ⚒️ FAZ 7: Crafting Sistemi
**Tahmini Süre:** 2-3 saat

### 7.1 Crafting Grid Türleri
```
Crafting Alanları:
├── Player Inventory: 2x2 grid
├── Crafting Table: 3x3 grid
└── Furnace: 1 input + 1 fuel -> 1 output
```

### 7.2 Temel Tarifler
```
Shaped Recipes (2x2):
├── Oak Planks: 1 Oak Log -> 4 Oak Planks
├── Sticks: 2 Planks (vertical) -> 4 Sticks
├── Crafting Table: 4 Planks (2x2) -> 1 Crafting Table
├── Furnace: 8 Cobblestone (ring) -> 1 Furnace
└── Torch: Coal + Stick -> 4 Torches

Shaped Recipes (3x3):
├── Wooden Pickaxe: 3 Planks + 2 Sticks
├── Stone Pickaxe: 3 Cobble + 2 Sticks
├── Iron Pickaxe: 3 Iron Ingot + 2 Sticks
├── Diamond Pickaxe: 3 Diamond + 2 Sticks
├── Wooden Sword: 2 Planks + 1 Stick
├── Chest: 8 Planks (ring)
├── Ladder: 7 Sticks (H pattern) -> 3 Ladders
├── Bucket: 3 Iron Ingots (V pattern)
└── Bed: 3 Wool + 3 Planks

Smelting Recipes:
├── Iron Ore -> Iron Ingot (10 sec)
├── Gold Ore -> Gold Ingot (10 sec)
├── Raw Copper -> Copper Ingot (10 sec)
├── Sand -> Glass (10 sec)
├── Cobblestone -> Stone (10 sec)
├── Log -> Charcoal (10 sec)
└── Raw Food -> Cooked Food (10 sec)
```

### 7.3 Recipe Matching
```javascript
class CraftingManager {
  constructor() {
    this.recipes = [];
  }
  
  // Recipe kayıt
  registerRecipe(recipe) {
    this.recipes.push(recipe);
  }
  
  // Grid ile eşleşen tarif bul
  findMatchingRecipe(grid, gridSize) {
    for (const recipe of this.recipes) {
      if (recipe.matches(grid, gridSize)) {
        return recipe;
      }
    }
    return null;
  }
}

// Shaped recipe örnek
const pickaxeRecipe = {
  pattern: [
    ["planks", "planks", "planks"],
    [null, "stick", null],
    [null, "stick", null]
  ],
  output: { itemId: "wooden_pickaxe", count: 1 }
};
```

---

## 🐷 FAZ 8: Entity/Mob Sistemi
**Tahmini Süre:** 4-5 saat

### 8.1 Entity Base Class
```javascript
class Entity {
  constructor(world, x, y, z) {
    this.world = world;
    this.position = new THREE.Vector3(x, y, z);
    this.velocity = new THREE.Vector3();
    this.rotation = new THREE.Euler();
    this.health = 20;
    this.maxHealth = 20;
    this.dead = false;
    this.mesh = null;
  }
  
  update(deltaTime) {
    this.applyPhysics(deltaTime);
    this.updateAI(deltaTime);
    this.updateMesh();
  }
  
  applyPhysics(dt) {
    // Gravity
    this.velocity.y -= 20 * dt;
    
    // Collision detection
    this.handleCollisions();
    
    // Apply velocity
    this.position.add(this.velocity.clone().multiplyScalar(dt));
  }
}
```

### 8.2 Mob Türleri
```
Pasif Moblar:
├── 🐷 Pig
│   ├── Health: 10
│   ├── Drop: Raw Porkchop (1-3)
│   ├── Spawn: Grass, daylight
│   └── AI: Wander, flee when hit
│
├── 🐄 Cow
│   ├── Health: 10
│   ├── Drop: Raw Beef (1-3), Leather (0-2)
│   ├── Spawn: Grass, daylight
│   └── AI: Wander, herd behavior
│
├── 🐑 Sheep
│   ├── Health: 8
│   ├── Drop: Wool (1), Raw Mutton (1-2)
│   ├── Spawn: Grass, daylight
│   ├── Shearable: Yes
│   └── AI: Wander, eat grass
│
├── 🐔 Chicken
│   ├── Health: 4
│   ├── Drop: Raw Chicken (1), Feather (0-2)
│   ├── Spawn: Grass, daylight
│   ├── Lays eggs randomly
│   └── AI: Wander, slow fall
│
└── 🐰 Rabbit
    ├── Health: 3
    ├── Drop: Rabbit Hide, Raw Rabbit
    ├── Spawn: Various biomes
    └── AI: Hop, flee

Düşman Moblar:
├── 🧟 Zombie
│   ├── Health: 20
│   ├── Damage: 3-4
│   ├── Drop: Rotten Flesh (0-2)
│   ├── Spawn: Dark areas, night
│   ├── Burns in sunlight
│   └── AI: Chase player, attack
│
├── 💀 Skeleton
│   ├── Health: 20
│   ├── Damage: 2-4 (arrow)
│   ├── Drop: Bones (0-2), Arrows (0-2)
│   ├── Spawn: Dark areas, night
│   ├── Burns in sunlight
│   └── AI: Ranged attack, strafe
│
├── 🕷️ Spider
│   ├── Health: 16
│   ├── Damage: 2-3
│   ├── Drop: String (0-2), Spider Eye (0-1)
│   ├── Spawn: Dark areas, night
│   ├── Neutral in daylight
│   └── AI: Climb walls, leap attack
│
├── 💚 Creeper
│   ├── Health: 20
│   ├── Damage: Explosion (variable)
│   ├── Drop: Gunpowder (0-2)
│   ├── Spawn: Dark areas, night
│   ├── NO sunlight burn
│   └── AI: Sneak, explode near player
│
└── 🧱 Enderman
    ├── Health: 40
    ├── Damage: 4-7
    ├── Drop: Ender Pearl (0-1)
    ├── Spawn: Dark areas, rare
    ├── Teleports
    └── AI: Neutral, aggro if looked at
```

### 8.3 Mob AI Sistemi
```javascript
class MobAI {
  constructor(entity) {
    this.entity = entity;
    this.currentGoal = null;
    this.goals = [];
  }
  
  // Goal örnekleri
  addGoals() {
    this.goals.push(new WanderGoal(this.entity, 0.5));
    this.goals.push(new FleeGoal(this.entity, Player, 1.0));
    this.goals.push(new LookAtPlayerGoal(this.entity, 0.3));
  }
  
  update(dt) {
    // En yüksek öncelikli, aktif goal'ı seç
    this.selectBestGoal();
    
    if (this.currentGoal) {
      this.currentGoal.execute(dt);
    }
  }
}
```

### 8.4 Mob Rendering (Low Poly)
```
Mob Model Yaklaşımı:
├── Box-based geometry (Minecraft style)
├── Per-mob texture atlas
├── Animated limbs (simple rotation)
├── Billboard nametag
└── Shadow projection
```

---

## 🚀 FAZ 9: Final Optimizasyonlar
**Tahmini Süre:** 2-3 saat

### 9.1 Memory Management
```javascript
// Chunk pool - reuse chunk objects
class ChunkPool {
  constructor(size = 100) {
    this.pool = [];
    for (let i = 0; i < size; i++) {
      this.pool.push(new Chunk());
    }
  }
  
  acquire() {
    return this.pool.pop() || new Chunk();
  }
  
  release(chunk) {
    chunk.reset();
    this.pool.push(chunk);
  }
}
```

### 9.2 Object Pooling
```javascript
// Particle, entity mesh pooling
const particlePool = new ObjectPool(ParticleMesh, 500);
const entityMeshPool = new ObjectPool(EntityMesh, 100);
```

### 9.3 Occlusion Culling
```javascript
// Görünmeyen blokları skip et
function shouldRenderFace(block, neighbor, face) {
  // Transparent blok kontrolü
  if (neighbor.isTransparent()) return true;
  
  // Solid-solid interface = render etme
  if (block.isSolid() && neighbor.isSolid()) return false;
  
  return true;
}
```

### 9.4 Graphics Quality Presets
```javascript
const QUALITY_PRESETS = {
  potato: {
    renderDistance: 4,
    shadows: false,
    particles: 2,
    mobCap: 10,
    waterReflections: false,
    foliageDetail: 'low',
    chunkUpdatesPerFrame: 1
  },
  low: {
    renderDistance: 6,
    shadows: false,
    particles: 6,
    mobCap: 20,
    waterReflections: false,
    foliageDetail: 'medium',
    chunkUpdatesPerFrame: 2
  },
  medium: {
    renderDistance: 8,
    shadows: true,
    particles: 12,
    mobCap: 40,
    waterReflections: true,
    foliageDetail: 'high',
    chunkUpdatesPerFrame: 4
  },
  high: {
    renderDistance: 12,
    shadows: true,
    particles: 24,
    mobCap: 60,
    waterReflections: true,
    foliageDetail: 'ultra',
    chunkUpdatesPerFrame: 8
  }
};
```

### 9.5 Performance Monitoring
```javascript
class PerformanceMonitor {
  constructor() {
    this.fps = 0;
    this.frameTime = 0;
    this.drawCalls = 0;
    this.triangles = 0;
    this.chunksLoaded = 0;
    this.entitiesActive = 0;
  }
  
  update() {
    // FPS counter
    // Auto-adjust quality if FPS drops
    if (this.fps < 30 && currentQuality !== 'potato') {
      this.reduceQuality();
    }
  }
}
```

---

## 📈 Performans Hedefleri

| Metrik | Potato PC | Normal PC | Gaming PC |
|--------|-----------|-----------|-----------|
| FPS | 30+ | 60+ | 120+ |
| Render Distance | 4 chunk | 8 chunk | 16 chunk |
| Max Entities | 10 | 40 | 100 |
| Memory Usage | <500MB | <1GB | <2GB |
| Load Time | <10s | <5s | <3s |

---

## 🛠️ Teknoloji Stack

```
Frontend:
├── Three.js r150+ (3D rendering)
├── Simplex Noise (terrain gen)
├── Web Workers (async generation)
└── IndexedDB (world save)

Ses:
├── Web Audio API (procedural)
└── Howler.js (optional, for music)

State Management:
├── Vanilla JS classes
└── Event system for updates

Build:
├── Vite (bundler)
└── ESBuild (minification)
```

---

## 📅 Tahmini Zaman Çizelgesi

```
Toplam Tahmini Süre: 20-25 saat

Hafta 1:
├── Faz 1: Yeni Bloklar (2 saat)
├── Faz 2: Chunk Sistemi (4 saat)
└── Faz 3: Biome Sistemi (3 saat)

Hafta 2:
├── Faz 4: Ağaç Üretimi (2 saat)
├── Faz 5: Cevherler (2 saat)
└── Faz 6: Envanter (3 saat)

Hafta 3:
├── Faz 7: Crafting (3 saat)
├── Faz 8: Moblar (5 saat)
└── Faz 9: Optimizasyon (3 saat)
```

---

## ✅ Başlangıç Komutu

Bu planı onaylıyorsan, "BAŞLA" yaz ve Faz 1'den itibaren implement etmeye başlayalım!

Her faz sonunda test edilecek ve commit atılacak.
