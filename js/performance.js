// ========================================
// PERFORMANCE.JS - Performans Optimizasyon
// FPS monitoring, LOD, frustum culling, object pooling
// ========================================

// Performance monitoring
const perfStats = {
    fps: 60,
    frameTime: 16.67,
    drawCalls: 0,
    triangles: 0,
    chunks: 0,
    mobs: 0,
    plants: 0,
    lastUpdate: performance.now()
};

let fpsHistory = [];
const FPS_HISTORY_SIZE = 60;

// FPS hesapla
function updatePerformanceStats(dt) {
    const now = performance.now();
    
    // FPS
    perfStats.frameTime = dt * 1000;
    perfStats.fps = Math.round(1 / dt);
    
    fpsHistory.push(perfStats.fps);
    if (fpsHistory.length > FPS_HISTORY_SIZE) {
        fpsHistory.shift();
    }
    
    // Stats
    if (typeof chunks !== 'undefined') {
        perfStats.chunks = chunks.size;
    }
    if (typeof mobs !== 'undefined') {
        perfStats.mobs = mobs.length;
    }
    
    perfStats.lastUpdate = now;
}

// Ortalama FPS
function getAverageFPS() {
    if (fpsHistory.length === 0) return 60;
    return Math.round(fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length);
}

// Düşük FPS tespit
function isPerformanceLow() {
    return getAverageFPS() < 30;
}

// ============ LOD SYSTEM ============

const LOD_LEVELS = {
    HIGH: 0,
    MEDIUM: 1,
    LOW: 2,
    ULTRA_LOW: 3
};

let currentLOD = LOD_LEVELS.HIGH;

// LOD mesafeleri
const LOD_DISTANCES = {
    [LOD_LEVELS.HIGH]: 32,
    [LOD_LEVELS.MEDIUM]: 64,
    [LOD_LEVELS.LOW]: 96,
    [LOD_LEVELS.ULTRA_LOW]: 128
};

function getLODLevel(distanceToCamera) {
    if (distanceToCamera < LOD_DISTANCES[LOD_LEVELS.HIGH]) return LOD_LEVELS.HIGH;
    if (distanceToCamera < LOD_DISTANCES[LOD_LEVELS.MEDIUM]) return LOD_LEVELS.MEDIUM;
    if (distanceToCamera < LOD_DISTANCES[LOD_LEVELS.LOW]) return LOD_LEVELS.LOW;
    return LOD_LEVELS.ULTRA_LOW;
}

// Otomatik LOD ayarla (FPS'e göre)
function autoAdjustLOD() {
    const avgFPS = getAverageFPS();
    
    if (avgFPS < 20) {
        // Çok düşük - acil optimizasyon
        setRenderDistance(4);
        setPlantDensity(0.3);
    } else if (avgFPS < 30) {
        setRenderDistance(6);
        setPlantDensity(0.5);
    } else if (avgFPS < 45) {
        setRenderDistance(8);
        setPlantDensity(0.7);
    } else {
        // İyi FPS - tam kalite
        setRenderDistance(10);
        setPlantDensity(1.0);
    }
}

function setRenderDistance(dist) {
    if (typeof RENDER_DISTANCE !== 'undefined') {
        window.RENDER_DISTANCE = dist;
    }
    if (typeof LOAD_DISTANCE !== 'undefined') {
        window.LOAD_DISTANCE = dist + 2;
    }
}

function setPlantDensity(density) {
    window.PLANT_DENSITY_MULTIPLIER = density;
}

// ============ FRUSTUM CULLING ============

let frustum = null;
let frustumMatrix = null;

function initFrustumCulling(camera) {
    frustum = new THREE.Frustum();
    frustumMatrix = new THREE.Matrix4();
}

function updateFrustum(camera) {
    if (!frustum || !camera) return;
    
    frustumMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(frustumMatrix);
}

function isInFrustum(position, radius) {
    if (!frustum) return true;
    
    const sphere = new THREE.Sphere(position, radius);
    return frustum.intersectsSphere(sphere);
}

function isChunkInFrustum(cx, cz, chunkSize) {
    if (!frustum) return true;
    
    const centerX = cx * chunkSize + chunkSize / 2;
    const centerZ = cz * chunkSize + chunkSize / 2;
    const center = new THREE.Vector3(centerX, 32, centerZ);  // Orta yükseklik
    const radius = chunkSize * 1.5;  // Chunk diagonal
    
    return isInFrustum(center, radius);
}

// ============ OBJECT POOLING ============

class ObjectPool {
    constructor(createFunc, resetFunc, initialSize = 10) {
        this.createFunc = createFunc;
        this.resetFunc = resetFunc;
        this.pool = [];
        this.active = [];
        
        // Pre-populate
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFunc());
        }
    }
    
    get() {
        let obj;
        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else {
            obj = this.createFunc();
        }
        this.active.push(obj);
        return obj;
    }
    
    release(obj) {
        const idx = this.active.indexOf(obj);
        if (idx !== -1) {
            this.active.splice(idx, 1);
            this.resetFunc(obj);
            this.pool.push(obj);
        }
    }
    
    releaseAll() {
        while (this.active.length > 0) {
            this.release(this.active[0]);
        }
    }
    
    getActiveCount() {
        return this.active.length;
    }
    
    getPoolSize() {
        return this.pool.length;
    }
}

// Particle pool örneği
let particlePool = null;

function initParticlePool() {
    particlePool = new ObjectPool(
        () => {
            const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
            const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
            return new THREE.Mesh(geometry, material);
        },
        (mesh) => {
            mesh.visible = false;
            mesh.position.set(0, -1000, 0);
        },
        50
    );
}

// ============ RENDER OPTIMIZATIONS ============

// Batch renderer için mesh birleştirme
function mergeChunkGeometries(geometries) {
    if (geometries.length === 0) return null;
    return THREE.BufferGeometryUtils.mergeGeometries(geometries);
}

// Instance count optimizasyonu
function optimizeInstances() {
    // Kullanılmayan instance'ları temizle
    if (typeof instanceCounts !== 'undefined') {
        for (const [key, count] of Object.entries(instanceCounts)) {
            if (count === 0) {
                // Bu blok tipi için instance yok, mesh'i gizle
                const mesh = meshes[parseInt(key)];
                if (mesh) mesh.visible = false;
            }
        }
    }
}

// ============ MEMORY MANAGEMENT ============

function getMemoryUsage() {
    if (performance.memory) {
        return {
            used: Math.round(performance.memory.usedJSHeapSize / 1048576),
            total: Math.round(performance.memory.totalJSHeapSize / 1048576),
            limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
        };
    }
    return null;
}

function cleanupUnusedResources() {
    // Eski chunk mesh'lerini temizle
    if (typeof chunkMeshes !== 'undefined') {
        for (const [key, mesh] of chunkMeshes) {
            if (!mesh.visible) {
                mesh.geometry.dispose();
                mesh.material.dispose();
                chunkMeshes.delete(key);
            }
        }
    }
    
    // Renderer cache temizle
    if (typeof renderer !== 'undefined' && renderer.info) {
        // Three.js otomatik yönetir ama logla
        console.log('[Perf] Geometries:', renderer.info.memory.geometries);
        console.log('[Perf] Textures:', renderer.info.memory.textures);
    }
}

// ============ PERFORMANCE OVERLAY ============

let perfOverlay = null;

function createPerformanceOverlay() {
    perfOverlay = document.createElement('div');
    perfOverlay.id = 'perf-overlay';
    perfOverlay.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        background: rgba(0,0,0,0.7);
        color: #0f0;
        font-family: monospace;
        font-size: 12px;
        padding: 10px;
        border-radius: 4px;
        z-index: 1000;
        pointer-events: none;
        display: none;
    `;
    document.body.appendChild(perfOverlay);
}

function updatePerformanceOverlay() {
    if (!perfOverlay) return;
    
    const mem = getMemoryUsage();
    
    // Chunk loading status
    let chunkStatus = '';
    if (typeof getChunkLoadingStatus === 'function') {
        const status = getChunkLoadingStatus();
        if (status.isInitialLoad) {
            chunkStatus = `<div style="color:#ff0">Loading... (${status.loadRadius}/${4})</div>`;
        }
        chunkStatus += `<div>Queue: ${status.queueLength}</div>`;
    }
    
    let html = `
        <div style="color:${perfStats.fps < 30 ? '#f00' : '#0f0'}">FPS: ${perfStats.fps} (avg: ${getAverageFPS()})</div>
        <div>Frame: ${perfStats.frameTime.toFixed(2)}ms</div>
        <div>Chunks: ${perfStats.chunks}</div>
        ${chunkStatus}
        <div>Mobs: ${perfStats.mobs}</div>
    `;
    
    if (mem) {
        html += `<div>Memory: ${mem.used}/${mem.total} MB</div>`;
    }
    
    perfOverlay.innerHTML = html;
}

function togglePerformanceOverlay() {
    if (!perfOverlay) createPerformanceOverlay();
    perfOverlay.style.display = perfOverlay.style.display === 'none' ? 'block' : 'none';
}

// ============ QUALITY PRESETS ============

const QUALITY_PRESETS = {
    ultra: {
        renderDistance: 12,
        shadowMapSize: 2048,
        antialias: true,
        plantDensity: 1.0,
        mobLimit: 50,
        particleLimit: 200
    },
    high: {
        renderDistance: 10,
        shadowMapSize: 1024,
        antialias: true,
        plantDensity: 0.8,
        mobLimit: 40,
        particleLimit: 150
    },
    medium: {
        renderDistance: 8,
        shadowMapSize: 512,
        antialias: false,
        plantDensity: 0.5,
        mobLimit: 30,
        particleLimit: 100
    },
    low: {
        renderDistance: 6,
        shadowMapSize: 256,
        antialias: false,
        plantDensity: 0.3,
        mobLimit: 20,
        particleLimit: 50
    },
    potato: {
        renderDistance: 4,
        shadowMapSize: 0,  // Gölge yok
        antialias: false,
        plantDensity: 0.1,
        mobLimit: 10,
        particleLimit: 20
    }
};

function applyQualityPreset(presetName) {
    const preset = QUALITY_PRESETS[presetName];
    if (!preset) return;
    
    setRenderDistance(preset.renderDistance);
    setPlantDensity(preset.plantDensity);
    
    if (typeof MAX_MOBS !== 'undefined') {
        window.MAX_MOBS = preset.mobLimit;
    }
    
    // Shadow map
    if (typeof renderer !== 'undefined' && renderer.shadowMap) {
        if (preset.shadowMapSize > 0) {
            renderer.shadowMap.enabled = true;
            // Shadow map size değiştirmek için light'ı yeniden oluşturmak gerekir
        } else {
            renderer.shadowMap.enabled = false;
        }
    }
    
    console.log(`[Perf] Applied ${presetName} quality preset`);
}

// Otomatik kalite ayarı
function autoQuality() {
    const avgFPS = getAverageFPS();
    
    if (avgFPS < 15) {
        applyQualityPreset('potato');
    } else if (avgFPS < 25) {
        applyQualityPreset('low');
    } else if (avgFPS < 40) {
        applyQualityPreset('medium');
    } else if (avgFPS < 55) {
        applyQualityPreset('high');
    } else {
        applyQualityPreset('ultra');
    }
}

// F3 tuşu ile debug overlay
document.addEventListener('keydown', (e) => {
    if (e.key === 'F3') {
        e.preventDefault();
        togglePerformanceOverlay();
    }
});

console.log("[Performance] Optimization system loaded");
