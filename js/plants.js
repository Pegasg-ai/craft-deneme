// ========================================
// PLANTS.JS - Bitki Render Sistemi
// X-shaped cross rendering for flowers/plants
// ========================================

// Plant mesh storage - ayrı InstancedMesh kullanıyoruz
let plantMeshes = {};
let plantInstanceCounts = {};
let plantInstanceKeys = [];
const MAX_PLANT_INSTANCES = 50000;

// Plant geometrisi oluştur (X-şeklinde çapraz 2 düzlem)
function createPlantGeometry(height = 0.6, width = 0.8) {
    const geo = new THREE.BufferGeometry();
    const hw = width / 2;
    const h = height;
    
    // 2 çapraz düzlem (X şeklinde)
    // Plane 1: köşegen /
    // Plane 2: köşegen \
    const vertices = new Float32Array([
        // Plane 1
        -hw, 0, -hw,  hw, 0, hw,  hw, h, hw,
        -hw, 0, -hw,  hw, h, hw,  -hw, h, -hw,
        // Back face
        hw, 0, hw,  -hw, 0, -hw,  -hw, h, -hw,
        hw, 0, hw,  -hw, h, -hw,  hw, h, hw,
        
        // Plane 2
        -hw, 0, hw,  hw, 0, -hw,  hw, h, -hw,
        -hw, 0, hw,  hw, h, -hw,  -hw, h, hw,
        // Back face
        hw, 0, -hw,  -hw, 0, hw,  -hw, h, hw,
        hw, 0, -hw,  -hw, h, hw,  hw, h, -hw,
    ]);
    
    // UV coords
    const uvs = new Float32Array([
        // Plane 1
        0, 0,  1, 0,  1, 1,
        0, 0,  1, 1,  0, 1,
        1, 0,  0, 0,  0, 1,
        1, 0,  0, 1,  1, 1,
        // Plane 2
        0, 0,  1, 0,  1, 1,
        0, 0,  1, 1,  0, 1,
        1, 0,  0, 0,  0, 1,
        1, 0,  0, 1,  1, 1,
    ]);
    
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.computeVertexNormals();
    
    return geo;
}

// Plant texture oluştur
function createPlantTexture(block) {
    const size = 32; // Smaller for plants
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    
    // Transparan arka plan
    ctx.clearRect(0, 0, size, size);
    
    const col = block.col;
    const r = (col >> 16) & 0xFF;
    const g = (col >> 8) & 0xFF;
    const b = col & 0xFF;
    
    // Çiçek/bitki türüne göre procedural çizim
    if (block.name.includes('Grass') || block.name === 'Fern') {
        // Çimen/eğrelti - dikey çizgiler
        for (let i = 0; i < 8; i++) {
            const x = 2 + i * 4;
            const h = 8 + Math.random() * 20;
            ctx.fillStyle = `rgba(${r + Math.random()*30 - 15}, ${g + Math.random()*30 - 15}, ${b}, 1)`;
            ctx.fillRect(x, size - h, 2, h);
        }
    } else if (block.name.includes('Mushroom')) {
        // Mantar
        const capColor = block.name === 'RedMushroom' ? '#E53935' : '#8D6E63';
        // Sap
        ctx.fillStyle = '#E0E0E0';
        ctx.fillRect(12, 16, 8, 16);
        // Şapka
        ctx.fillStyle = capColor;
        ctx.beginPath();
        ctx.arc(16, 12, 10, Math.PI, 0, false);
        ctx.fill();
        // Lekeler (red mushroom)
        if (block.name === 'RedMushroom') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(12, 8, 3, 3);
            ctx.fillRect(18, 6, 2, 2);
            ctx.fillRect(10, 12, 2, 2);
        }
    } else if (block.name.includes('Sapling')) {
        // Fidan - küçük ağaç
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(14, 16, 4, 16);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(8, 4, 16, 14);
        ctx.fillRect(10, 2, 12, 4);
    } else if (block.name === 'DeadBush') {
        // Ölü çalı - kahverengi dallar
        ctx.strokeStyle = '#6D4C41';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(16, 32);
        ctx.lineTo(16, 16);
        ctx.lineTo(8, 4);
        ctx.moveTo(16, 16);
        ctx.lineTo(24, 6);
        ctx.moveTo(16, 20);
        ctx.lineTo(6, 14);
        ctx.moveTo(16, 20);
        ctx.lineTo(26, 12);
        ctx.stroke();
    } else if (block.name === 'Cactus' || block.name === 'SugarCane' || block.name === 'Bamboo') {
        // Dikey sütun tipi
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(4, 0, 24, 32);
        // Highlight
        ctx.fillStyle = `rgba(255, 255, 255, 0.2)`;
        ctx.fillRect(6, 0, 4, 32);
    } else {
        // Çiçek - varsayılan
        // Sap
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(14, 16, 4, 16);
        // Yapraklar
        ctx.fillStyle = '#388E3C';
        ctx.fillRect(8, 22, 6, 4);
        ctx.fillRect(18, 24, 6, 4);
        // Çiçek başı
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.beginPath();
        ctx.arc(16, 10, 8, 0, Math.PI * 2);
        ctx.fill();
        // Çiçek merkezi
        ctx.fillStyle = '#FFC107';
        ctx.beginPath();
        ctx.arc(16, 10, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    
    return texture;
}

// Tüm bitki mesh'lerini başlat
function initPlantMeshes() {
    const plantDummy = new THREE.Object3D();
    
    for (let i = 1; i < BLOCKS.length; i++) {
        const block = BLOCKS[i];
        if (!block || block.type !== BLOCK_TYPE.PLANT) continue;
        
        const height = block.plantHeight || 0.6;
        const geo = createPlantGeometry(height, 0.7);
        
        const texture = createPlantTexture(block);
        const mat = new THREE.MeshLambertMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.5,
            side: THREE.DoubleSide,
            depthWrite: true
        });
        
        // Animasyonlu bitkiler için shader
        if (block.animated) {
            mat.onBeforeCompile = (shader) => {
                shader.uniforms.time = { value: 0 };
                shader.uniforms.windStrength = { value: 0.3 };
                mat.userData.shader = shader;
                
                shader.vertexShader = shader.vertexShader.replace(
                    '#include <common>',
                    `#include <common>
                    uniform float time;
                    uniform float windStrength;`
                );
                
                shader.vertexShader = shader.vertexShader.replace(
                    '#include <begin_vertex>',
                    `#include <begin_vertex>
                    if (windStrength > 0.0 && position.y > 0.1) {
                        vec4 wp = instanceMatrix * vec4(position, 1.0);
                        float wind = sin(time * 2.0 + wp.x * 0.8 + wp.z * 0.8) * windStrength;
                        transformed.x += wind * 0.1 * position.y;
                        transformed.z += wind * 0.08 * position.y;
                    }`
                );
            };
            
            // Global listeye ekle
            if (typeof animatedMaterials !== 'undefined') {
                animatedMaterials.push(mat);
            }
        }
        
        const mesh = new THREE.InstancedMesh(geo, mat, MAX_PLANT_INSTANCES);
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        mesh.count = 0;
        mesh.frustumCulled = true;
        mesh.userData.blockId = i;
        
        plantMeshes[i] = mesh;
        plantInstanceCounts[i] = 0;
        
        scene.add(mesh);
    }
    
    console.log("[Plants] Initialized " + Object.keys(plantMeshes).length + " plant types");
}

// Bitki instance ekle
function addPlantInstance(x, y, z, blockId) {
    const mesh = plantMeshes[blockId];
    if (!mesh) return false;
    
    const count = plantInstanceCounts[blockId];
    if (count >= MAX_PLANT_INSTANCES) return false;
    
    const dummy = new THREE.Object3D();
    dummy.position.set(x + 0.5, y, z + 0.5);
    // Rastgele rotasyon (çeşitlilik için)
    dummy.rotation.y = Math.random() * Math.PI * 2;
    dummy.updateMatrix();
    
    mesh.setMatrixAt(count, dummy.matrix);
    mesh.count = count + 1;
    plantInstanceCounts[blockId] = count + 1;
    mesh.instanceMatrix.needsUpdate = true;
    
    // Key kaydet (kaldırma için)
    const key = `${x},${y},${z}`;
    plantInstanceKeys.push({ key, blockId, index: count });
    
    return true;
}

// Bitki instance kaldır (rebuild gerektirir - TODO: optimize)
function removePlantInstance(x, y, z) {
    const key = `${x},${y},${z}`;
    const idx = plantInstanceKeys.findIndex(p => p.key === key);
    if (idx === -1) return false;
    
    const { blockId } = plantInstanceKeys[idx];
    plantInstanceKeys.splice(idx, 1);
    
    // Full rebuild for this type (basit yöntem)
    rebuildPlantInstances(blockId);
    return true;
}

// Bitki türü için instance'ları yeniden oluştur
function rebuildPlantInstances(blockId) {
    const mesh = plantMeshes[blockId];
    if (!mesh) return;
    
    const dummy = new THREE.Object3D();
    let count = 0;
    
    for (const entry of plantInstanceKeys) {
        if (entry.blockId !== blockId) continue;
        
        const [x, y, z] = entry.key.split(',').map(Number);
        dummy.position.set(x + 0.5, y, z + 0.5);
        dummy.rotation.y = (x * 123 + z * 456) % (Math.PI * 2); // Deterministic
        dummy.updateMatrix();
        
        mesh.setMatrixAt(count, dummy.matrix);
        entry.index = count;
        count++;
    }
    
    mesh.count = count;
    plantInstanceCounts[blockId] = count;
    mesh.instanceMatrix.needsUpdate = true;
}

// Tüm bitkileri güncelle (animasyon)
function updatePlants(time) {
    for (const id in plantMeshes) {
        const mesh = plantMeshes[id];
        if (mesh.material.userData.shader) {
            mesh.material.userData.shader.uniforms.time.value = time;
        }
    }
}

console.log("[Plants] System loaded");
