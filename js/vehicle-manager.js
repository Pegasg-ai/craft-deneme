// =====================================================
// FIVEM TO - ARAÇ YÖNETİM SİSTEMİ (Vehicle Manager)
// Merkezi araç registry, yükleme, doğrulama ve önizleme
// =====================================================

(function () {
    'use strict';

    const VEHICLES_JSON_PATH = './assets/vehicles/vehicles.json';
    const VEHICLES_DIR = './assets/vehicles/';

    // =====================================================
    // VEHICLE MANAGER CLASS
    // =====================================================
    class VehicleManager {
        constructor() {
            this.data = null;           // Ham JSON verisi
            this.categories = {};       // Kategori tanımları
            this.vehicles = new Map();  // id -> vehicle data
            this.loaded = false;
            this.loading = null;
            this.errors = [];
            this.warnings = [];
            
            // 3D önizleme için
            this.previewScene = null;
            this.previewCamera = null;
            this.previewRenderer = null;
            this.previewModel = null;
            this.previewAnimationId = null;
        }

        // =====================================================
        // YÜKLEME
        // =====================================================
        async load() {
            if (this.loaded) return true;
            if (this.loading) return this.loading;

            this.loading = this._doLoad();
            return this.loading;
        }

        async _doLoad() {
            try {
                const response = await fetch(VEHICLES_JSON_PATH, { cache: 'no-store' });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                this.data = await response.json();
                this._parseData();
                this._validateAll();
                this._syncToLegacy();
                
                this.loaded = true;
                console.log(`[VehicleManager] ${this.vehicles.size} araç yüklendi`);
                return true;
            } catch (err) {
                console.error('[VehicleManager] Yükleme hatası:', err);
                this.errors.push(`Yükleme hatası: ${err.message}`);
                this.loaded = true; // Hata olsa da "loaded" say, fallback çalışsın
                return false;
            }
        }

        _parseData() {
            // Kategorileri oku
            if (this.data.categories) {
                this.categories = { ...this.data.categories };
            } else {
                // Varsayılan kategoriler
                this.categories = this._getDefaultCategories();
            }

            // Araçları parse et
            if (Array.isArray(this.data.vehicles)) {
                for (const v of this.data.vehicles) {
                    if (!v.id) continue;
                    if (v.enabled === false) continue; // Devre dışı araçları atla
                    
                    const parsed = this._parseVehicle(v);
                    this.vehicles.set(v.id, parsed);
                }
            }
        }

        _parseVehicle(raw) {
            const categoryKey = raw.category || 'sport';
            const categoryDef = this.categories[categoryKey] || this.categories.sport || {};
            const defaults = categoryDef.defaults || {};

            // Stats'ı kategori varsayılanlarıyla birleştir
            const stats = { ...defaults, ...(raw.stats || {}) };

            return {
                id: raw.id,
                name: raw.name || raw.id,
                year: raw.year || null,
                manufacturer: raw.manufacturer || null,
                category: categoryKey,
                categoryName: categoryDef.name || categoryKey,
                categoryIcon: categoryDef.icon || '🚗',
                model: raw.model || `${raw.id}.glb`,
                modelPath: VEHICLES_DIR + (raw.model || `${raw.id}.glb`),
                thumbnail: raw.thumbnail ? VEHICLES_DIR + raw.thumbnail : null,
                color: this._parseColor(raw.color, stats.color || 0x3498db),
                description: raw.description || null,
                
                // İstatistikler
                maxSpeed: stats.maxSpeed || 200,
                acceleration: stats.acceleration || 20,
                braking: stats.braking || 20,
                handling: stats.handling || 2.0,
                mass: stats.mass || 1500,
                
                // Ekstra
                wheels: raw.wheels || { count: 4, radius: 0.35 },
                sounds: raw.sounds || {},
                
                // Orijinal veri (debug için)
                _raw: raw
            };
        }

        _parseColor(value, fallback) {
            if (typeof value === 'number') return value;
            if (typeof value === 'string') {
                const v = value.trim();
                if (v.startsWith('0x')) return parseInt(v.slice(2), 16);
                if (v.startsWith('#')) return parseInt(v.slice(1), 16);
            }
            return fallback;
        }

        _getDefaultCategories() {
            return {
                sport: { name: 'Spor', icon: '🏎️', defaults: { maxSpeed: 250, acceleration: 28, braking: 22, handling: 2.5, mass: 1300 } },
                super: { name: 'Süper', icon: '🚀', defaults: { maxSpeed: 320, acceleration: 38, braking: 30, handling: 3.0, mass: 1150 } },
                suv: { name: 'SUV', icon: '🚙', defaults: { maxSpeed: 185, acceleration: 22, braking: 25, handling: 1.8, mass: 2200 } },
                offroad: { name: 'Arazi', icon: '🏔️', defaults: { maxSpeed: 200, acceleration: 24, braking: 24, handling: 2.1, mass: 2000 } },
                service: { name: 'Hizmet', icon: '🚛', defaults: { maxSpeed: 160, acceleration: 16, braking: 26, handling: 1.5, mass: 3000 } },
                classic: { name: 'Klasik', icon: '🚗', defaults: { maxSpeed: 220, acceleration: 22, braking: 20, handling: 2.0, mass: 1500 } },
                motorcycle: { name: 'Motosiklet', icon: '🏍️', defaults: { maxSpeed: 280, acceleration: 42, braking: 28, handling: 3.2, mass: 220 } }
            };
        }

        // =====================================================
        // DOĞRULAMA
        // =====================================================
        _validateAll() {
            for (const [id, vehicle] of this.vehicles) {
                this._validateVehicle(id, vehicle);
            }
        }

        _validateVehicle(id, vehicle) {
            // Model dosyası kontrolü (async olarak yapılabilir ama şimdilik uyarı)
            // Bu kontrolü gerçek zamanlı yapmak için ayrı bir metod eklenebilir
            
            if (!vehicle.name) {
                this.warnings.push(`[${id}] İsim eksik`);
            }
            if (vehicle.maxSpeed < 50 || vehicle.maxSpeed > 500) {
                this.warnings.push(`[${id}] maxSpeed olağandışı: ${vehicle.maxSpeed}`);
            }
        }

        async validateModelExists(id) {
            const vehicle = this.vehicles.get(id);
            if (!vehicle) return { exists: false, error: 'Araç bulunamadı' };

            try {
                const response = await fetch(vehicle.modelPath, { method: 'HEAD' });
                return { exists: response.ok, path: vehicle.modelPath };
            } catch {
                return { exists: false, error: 'Ağ hatası' };
            }
        }

        // =====================================================
        // LEGACY SYNC (VehicleStats & VehicleCategory)
        // =====================================================
        _syncToLegacy() {
            // VehicleCategory güncelle
            if (!window.VehicleCategory) window.VehicleCategory = {};
            for (const key of Object.keys(this.categories)) {
                window.VehicleCategory[key.toUpperCase()] = key;
            }

            // VehicleStats güncelle
            if (!window.VehicleStats) window.VehicleStats = {};
            for (const [id, v] of this.vehicles) {
                window.VehicleStats[id] = {
                    name: v.name,
                    category: window.VehicleCategory[v.category.toUpperCase()] || v.category,
                    maxSpeed: v.maxSpeed,
                    acceleration: v.acceleration,
                    braking: v.braking,
                    handling: v.handling,
                    mass: v.mass,
                    color: v.color,
                    type: v.category
                };
            }
        }

        // =====================================================
        // SORGULAMA
        // =====================================================
        getVehicle(id) {
            return this.vehicles.get(id) || null;
        }

        getAllVehicles() {
            return Array.from(this.vehicles.values());
        }

        getVehiclesByCategory(category) {
            return this.getAllVehicles().filter(v => v.category === category);
        }

        getCategories() {
            return Object.entries(this.categories).map(([key, data]) => ({
                id: key,
                ...data
            }));
        }

        getCategoryVehicleCount(category) {
            return this.getVehiclesByCategory(category).length;
        }

        searchVehicles(query) {
            const q = query.toLowerCase();
            return this.getAllVehicles().filter(v => 
                v.name.toLowerCase().includes(q) ||
                v.id.toLowerCase().includes(q) ||
                (v.manufacturer && v.manufacturer.toLowerCase().includes(q))
            );
        }

        getRandomVehicle(category = null) {
            const list = category ? this.getVehiclesByCategory(category) : this.getAllVehicles();
            if (list.length === 0) return null;
            return list[Math.floor(Math.random() * list.length)];
        }

        // =====================================================
        // 3D ÖNİZLEME
        // =====================================================
        initPreview(containerElement) {
            if (!containerElement || !window.THREE) return false;

            const width = containerElement.clientWidth || 300;
            const height = containerElement.clientHeight || 200;

            // Scene
            this.previewScene = new THREE.Scene();
            this.previewScene.background = new THREE.Color(0x1a1a2e);

            // Camera
            this.previewCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
            this.previewCamera.position.set(4, 2, 4);
            this.previewCamera.lookAt(0, 0, 0);

            // Renderer
            this.previewRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            this.previewRenderer.setSize(width, height);
            this.previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            containerElement.innerHTML = '';
            containerElement.appendChild(this.previewRenderer.domElement);

            // Lights
            const ambient = new THREE.AmbientLight(0xffffff, 0.6);
            this.previewScene.add(ambient);
            
            const directional = new THREE.DirectionalLight(0xffffff, 0.8);
            directional.position.set(5, 10, 5);
            this.previewScene.add(directional);

            // Ground
            const groundGeom = new THREE.PlaneGeometry(10, 10);
            const groundMat = new THREE.MeshStandardMaterial({ color: 0x2d2d44, roughness: 0.8 });
            const ground = new THREE.Mesh(groundGeom, groundMat);
            ground.rotation.x = -Math.PI / 2;
            ground.position.y = -0.5;
            this.previewScene.add(ground);

            // Animation loop
            this._animatePreview();

            return true;
        }

        _animatePreview() {
            if (!this.previewRenderer) return;
            
            this.previewAnimationId = requestAnimationFrame(() => this._animatePreview());

            // Model döndür
            if (this.previewModel) {
                this.previewModel.rotation.y += 0.005;
            }

            this.previewRenderer.render(this.previewScene, this.previewCamera);
        }

        async loadPreviewModel(vehicleId) {
            const vehicle = this.vehicles.get(vehicleId);
            if (!vehicle || !this.previewScene) return false;

            // Eski modeli kaldır
            if (this.previewModel) {
                this.previewScene.remove(this.previewModel);
                this.previewModel = null;
            }

            // Yeni modeli yükle
            if (typeof THREE.GLTFLoader === 'undefined') {
                console.warn('[VehicleManager] GLTFLoader yok, önizleme yapılamıyor');
                return false;
            }

            return new Promise((resolve) => {
                const loader = new THREE.GLTFLoader();
                loader.load(vehicle.modelPath, (gltf) => {
                    const model = gltf.scene;
                    
                    // Boyutlandır
                    const box = new THREE.Box3().setFromObject(model);
                    const size = box.getSize(new THREE.Vector3());
                    const maxDim = Math.max(size.x, size.y, size.z);
                    const scale = 2.5 / maxDim;
                    model.scale.setScalar(scale);

                    // Merkeze al
                    box.setFromObject(model);
                    const center = box.getCenter(new THREE.Vector3());
                    model.position.sub(center);
                    model.position.y += 0.3;

                    this.previewModel = model;
                    this.previewScene.add(model);
                    resolve(true);
                }, undefined, (err) => {
                    console.warn('[VehicleManager] Model yüklenemedi:', err);
                    resolve(false);
                });
            });
        }

        disposePreview() {
            if (this.previewAnimationId) {
                cancelAnimationFrame(this.previewAnimationId);
                this.previewAnimationId = null;
            }
            if (this.previewRenderer) {
                this.previewRenderer.dispose();
                this.previewRenderer = null;
            }
            this.previewScene = null;
            this.previewCamera = null;
            this.previewModel = null;
        }

        // =====================================================
        // YARDIMCILAR
        // =====================================================
        getStatsAsPercent(vehicle, statName) {
            const ranges = {
                maxSpeed: [100, 400],
                acceleration: [10, 50],
                braking: [10, 40],
                handling: [1, 4],
                mass: [150, 5000]
            };
            const range = ranges[statName] || [0, 100];
            const value = vehicle[statName] || 0;
            const percent = ((value - range[0]) / (range[1] - range[0])) * 100;
            return Math.max(0, Math.min(100, percent));
        }

        formatSpeed(kmh) {
            return `${Math.round(kmh)} km/h`;
        }

        // =====================================================
        // DEV TOOLS
        // =====================================================
        printReport() {
            console.group('[VehicleManager] Rapor');
            console.log('Toplam Araç:', this.vehicles.size);
            console.log('Kategoriler:', Object.keys(this.categories).length);
            
            console.groupCollapsed('Kategori Dağılımı');
            for (const cat of Object.keys(this.categories)) {
                console.log(`${cat}: ${this.getCategoryVehicleCount(cat)} araç`);
            }
            console.groupEnd();

            if (this.warnings.length > 0) {
                console.groupCollapsed('Uyarılar');
                this.warnings.forEach(w => console.warn(w));
                console.groupEnd();
            }

            if (this.errors.length > 0) {
                console.groupCollapsed('Hatalar');
                this.errors.forEach(e => console.error(e));
                console.groupEnd();
            }

            console.groupEnd();
        }

        exportJSON() {
            return JSON.stringify(this.data, null, 2);
        }
    }

    // =====================================================
    // SINGLETON & LEGACY UYUMLULUK
    // =====================================================
    const manager = new VehicleManager();

    // Global erişim
    window.VehicleManager = manager;

    // Eski VehicleRegistry uyumluluğu
    window.VehicleRegistry = {
        ensureLoaded: () => manager.load()
    };

})();
