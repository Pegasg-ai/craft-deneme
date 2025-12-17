// =====================================================
// FIVEM TO - YARIŞ MODU
// GTA 5/FiveM tarzı yarış sistemi
// =====================================================

// Yarış Durumları
const RaceState = {
    LOBBY: 'lobby',
    COUNTDOWN: 'countdown',
    RACING: 'racing',
    FINISHED: 'finished'
};

// Yarış Modları
const RaceMode = {
    FACE_TO_FACE: 'face-to-face',
    SPRINT: 'sprint',
    CIRCUIT: 'circuit',
    DRAG: 'drag'
};

// Kamera Modları
const CameraMode = {
    FIRST_PERSON: 'fps',
    THIRD_PERSON: 'tps'
};

// =====================================================
// ANA YARIŞ SİSTEMİ
// =====================================================

class RacingSystem {
    constructor() {
        // Three.js referansları
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        
        // Cannon.js fizik dünyası
        this.world = null;
        this.physicsBodies = [];
        
        // Yarış durumu
        this.raceState = RaceState.LOBBY;
        this.raceMode = RaceMode.FACE_TO_FACE;
        this.cameraMode = CameraMode.THIRD_PERSON; // Varsayılan 3. şahıs
        
        // GTA 5 tarzı kamera değişkenleri
        // cameraYaw/cameraPitch: anlık (smooth uygulanmış) değerler
        // cameraYawTarget/cameraPitchTarget: mouse input ile hedeflenen değerler
        this.cameraYaw = 0;
        this.cameraPitch = 0;
        this.cameraYawTarget = 0;
        this.cameraPitchTarget = 0;

        // Hassasiyet ve yumuşatma
        this.cameraSensitivityX = 0.0016;
        this.cameraSensitivityY = 0.0012;
        this.cameraInputSmooth = 0.12;

        // GTA tarzı takip ayarları
        this.cameraIdleSeconds = 2.0;           // input yoksa kaç sn sonra follow başlasın
        this.cameraSoftFollowStrength = 0.006;  // sürüşte çok hafif takip
        this.cameraHardFollowStrength = 0.04;   // idle sonrası daha belirgin takip

        // Bazı araç modellerinde ileri yön ters olabiliyor.
        // Auto-follow her zaman "arabanın arkası"na gelsin diye yaw'a PI offset uyguluyoruz.
        this.cameraBehindYawOffset = Math.PI;

        // Başlangıç açıları (GTA gibi hafif yukarıdan)
        this.cameraPitch = 0.15;
        this.cameraPitchTarget = this.cameraPitch;
        this.cameraDistance = 8; // Araca uzaklık
        this.cameraHeight = 3;   // Yükseklik
        this.cameraSmooth = 0.1; // Yumuşatma faktörü
        this.cameraAutoRotate = true; // Mouse bırakınca araca dönsün mü
        this.cameraAutoTimer = 0; // Mouse hareketsiz kalınca timer
        
        // Oyuncu ve araçlar
        this.localPlayer = null;
        this.players = new Map();
        this.vehicles = [];
        
        // Yarış verileri
        this.checkpoints = [];
        this.currentCheckpoint = 0;
        this.lapCount = 1;
        this.currentLap = 1;
        this.raceTime = 0;
        this.bestLapTime = Infinity;
        
        // Multiplayer
        this.isHost = false;
        this.peer = null;
        this.connections = new Map();
        
        // Harita
        this.currentMap = null;
        this.maps = new Map();
        
        // Performans
        this.lastTime = 0;
        this.deltaTime = 0;
        this.fixedTimeStep = 1 / 60;
        
        // Input
        this.keys = {};
        this.mouseMovement = { x: 0, y: 0 };
    }

    // Mesh'in dünya yöneliminden (quaternion) güvenilir yaw çıkarır.
    // rotation.y bazı durumlarda (özellikle model forward'ı ters ise) sağ/sol takip yönünü ters gösterebilir.
    getVehicleYaw(mesh) {
        if (!mesh) return 0;
        if (!this._tmpForward) this._tmpForward = new THREE.Vector3();

        // Three.js'de ileri yön varsayılanı -Z'dir.
        this._tmpForward.set(0, 0, -1).applyQuaternion(mesh.quaternion);

        // 0 => -Z yönü, + => sağa dönüş (yaklaşık)
        return Math.atan2(-this._tmpForward.x, -this._tmpForward.z);
    }
    
    // =====================================================
    // BAŞLATMA
    // =====================================================
    
    init() {
        console.log('FiveM To yarış modu başlatılıyor...');
        
        // Three.js sahne oluştur
        this.initThreeJS();
        
        // Fizik dünyası oluştur
        this.initPhysics();
        
        // Input sistemi
        this.initInput();
        
        // UI oluştur
        this.initUI();
        
        // Varsayılan haritayı yükle
        this.loadDefaultMaps();
        
        // Yarış lobisini göster
        this.showRaceLobby();
        
        // Ana döngüyü başlat
        this.animate();
        
        console.log('FiveM To hazır!');
    }
    
    initThreeJS() {
        // Sahne
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 100, 500);
        
        // Kamera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 10);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Canvas'ı ekle
        const container = document.getElementById('racing-container');
        if (container) {
            container.appendChild(this.renderer.domElement);
        } else {
            document.body.appendChild(this.renderer.domElement);
        }
        
        // Işıklar
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // Pencere boyutu değişikliği
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    initPhysics() {
        // Cannon.js dünyası
        if (typeof CANNON === 'undefined') {
            console.warn('[Racing] Cannon.js yüklenmedi, basit fizik kullanılacak');
            return;
        }
        
        console.log('[Racing] Cannon.js fizik dünyası oluşturuluyor...');
        
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.defaultContactMaterial.friction = 0.5;
        this.world.defaultContactMaterial.restitution = 0.3;
        
        // Zemin
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({ mass: 0 });
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        this.world.addBody(groundBody);
        
        console.log('[Racing] Fizik dünyası hazır! World:', !!this.world);
    }
    
    initInput() {
        // Klavye
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // V tuşu - Kamera değiştir
            if (e.code === 'KeyV') {
                this.toggleCameraMode();
            }
            
            // ESC - Pause
            if (e.code === 'Escape') {
                this.togglePause();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Fare - GTA 5 tarzı kamera kontrolü
        document.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement && this.cameraMode === CameraMode.THIRD_PERSON) {
                // Yatay dönüş (yaw) - daha az hassas
                this.cameraYawTarget -= e.movementX * this.cameraSensitivityX;
                
                // Dikey açı (pitch)
                // PointerLock'ta movementY: aşağı +, yukarı -
                // İstediğimiz: mouse yukarı -> kamera yukarı baksın => pitch azalmalı
                this.cameraPitchTarget += e.movementY * this.cameraSensitivityY;
                // Pitch limitleri: aşağı bakma +, yukarı bakma -
                this.cameraPitchTarget = Math.max(-0.55, Math.min(0.85, this.cameraPitchTarget));
                
                // Auto-rotate timer'ı sıfırla
                this.cameraAutoTimer = 0;
                this.cameraAutoRotate = false;
            }
            this.mouseMovement.x = e.movementX;
            this.mouseMovement.y = e.movementY;
        });
        
        // Mouse bırakıldığında auto-rotate'i aç
        document.addEventListener('mouseup', () => {
            this.cameraAutoTimer = 0;
        });
        
        // Scroll ile kamera zoom
        document.addEventListener('wheel', (e) => {
            if (this.cameraMode === CameraMode.THIRD_PERSON) {
                this.cameraDistance += e.deltaY * 0.01;
                this.cameraDistance = Math.max(4, Math.min(20, this.cameraDistance)); // 4 ile 20 arası
            }
        });
        
        // Pointer lock
        this.renderer.domElement.addEventListener('click', () => {
            if (this.raceState === RaceState.RACING) {
                this.renderer.domElement.requestPointerLock();
            }
        });
    }
    
    // =====================================================
    // KAMERA SİSTEMİ
    // =====================================================
    
    toggleCameraMode() {
        if (this.cameraMode === CameraMode.FIRST_PERSON) {
            this.cameraMode = CameraMode.THIRD_PERSON;
            console.log('3. Şahıs kamera (GTA 5 tarzı)');
            // Kamerayı aracın arkasına sıfırla
            if (this.localPlayer && this.localPlayer.vehicle) {
                const yaw = this.getVehicleYaw(this.localPlayer.vehicle.mesh) + this.cameraBehindYawOffset;
                this.cameraYaw = yaw;
                this.cameraYawTarget = yaw;
            }
        } else {
            this.cameraMode = CameraMode.FIRST_PERSON;
            console.log('1. Şahıs kamera');
        }
    }
    
    updateCamera() {
        if (!this.localPlayer || !this.localPlayer.vehicle) return;
        
        const vehicle = this.localPlayer.vehicle;
        const vehiclePos = vehicle.mesh.position;
        const vehicleRot = vehicle.mesh.rotation;
        const dt = this.deltaTime || 0.016;
        
        if (this.cameraMode === CameraMode.FIRST_PERSON) {
            // 1. Şahıs - Araç içinden bakış
            const offset = new THREE.Vector3(0, 1.2, 0.3);
            offset.applyEuler(vehicleRot);
            this.camera.position.copy(vehiclePos).add(offset);
            
            // Bakış yönü
            const lookDir = new THREE.Vector3(0, 0, 10); // +Z ileri
            lookDir.applyEuler(vehicleRot);
            this.camera.lookAt(vehiclePos.clone().add(lookDir));
            
        } else {
            // =====================================================
            // GTA 5 TARZI SERBEST KAMERA
            // Fare ile kamera döner, araç ayrı hareket eder
            // 2 saniye hareketsizlik sonrası yumuşak takip
            // =====================================================
            
            // Sürüş hızı (km/h)
            const speedKmh = (typeof vehicle.getSpeed === 'function') ? vehicle.getSpeed() : 0;

            // Auto-rotate timer güncelle
            this.cameraAutoTimer += dt;

            // 50 km/h altındayken kamera sadece mouse ile dönsün:
            // araç sağa/sola kırınca kamera onunla beraber toparlamasın.
            const allowAutoFollow = speedKmh >= 50;

            // Input yoksa belirli süre sonra auto-follow (sadece allowAutoFollow ise)
            if (allowAutoFollow && this.cameraAutoTimer > this.cameraIdleSeconds) {
                this.cameraAutoRotate = true;
            }
            if (!allowAutoFollow) {
                this.cameraAutoRotate = false;
            }
            
            // =====================================================
            // GTA TAKİP MANTIĞI
            // - Mouse ile bakarken: kamera serbest (takip yok)
            // - Mouse bırakınca ama araç gidiyorsa: çok hafif yumuşak takip
            // - 2sn input yoksa: daha belirgin yumuşak takip (aracın arkasına toplar)
            // =====================================================

            const targetYaw = this.getVehicleYaw(vehicle.mesh) + this.cameraBehindYawOffset;

            // Açı farkını hesapla (-PI..PI)
            let diff = targetYaw - this.cameraYawTarget;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;

            // Sürüş hızı (km/h) -> 0..1
            const speedFactor = Math.max(0, Math.min(1, speedKmh / 120));

            // Follow gücü seçimi (50 km/h altı: tamamen kapalı)
            if (allowAutoFollow) {
                if (this.cameraAutoRotate) {
                    // idle sonrası: daha belirgin takip
                    this.cameraYawTarget += diff * this.cameraHardFollowStrength;
                } else {
                    // sürüşte: çok hafif takip (araç dönünce kamera azıcık gelir)
                    const soft = this.cameraSoftFollowStrength * speedFactor;
                    this.cameraYawTarget += diff * soft;
                }
            }

            // Input smoothing (şak diye dönmeyi keser)
            this.cameraYaw = THREE.MathUtils.lerp(this.cameraYaw, this.cameraYawTarget, this.cameraInputSmooth);
            this.cameraPitch = THREE.MathUtils.lerp(this.cameraPitch, this.cameraPitchTarget, this.cameraInputSmooth);
            
            // Kamera pozisyonu hesapla
            const distance = this.cameraDistance;
            const pitchAngle = this.cameraPitch;

            // Orbit: pitchAngle < 0 => yukarı bakma (kamera alçalır), pitchAngle > 0 => aşağı bakma (kamera yükselir)
            const horizontalDist = Math.cos(pitchAngle) * distance;
            const verticalOffset = Math.sin(pitchAngle) * distance;
            const height = this.cameraHeight + verticalOffset;
            
            // Kamera dünya pozisyonu
            const camX = vehiclePos.x - Math.sin(this.cameraYaw) * horizontalDist;
            const camY = vehiclePos.y + height;
            const camZ = vehiclePos.z - Math.cos(this.cameraYaw) * horizontalDist;
            
            const targetPos = new THREE.Vector3(camX, camY, camZ);
            
            // Kamera pozisyonunu yumuşak interpole et
            // (0.08 = yumuşak takip, araca gecikmeyle gelir)
            this.camera.position.lerp(targetPos, 0.08);
            
            // Araca bak (biraz yukarısına)
            const lookTarget = vehiclePos.clone();
            lookTarget.y += 1.0;
            this.camera.lookAt(lookTarget);
        }
    }
}

// Global instance
window.racingSystem = null;

// Başlatma fonksiyonu
function initRacingMode() {
    // Racing container oluştur
    let container = document.getElementById('racing-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'racing-container';
        container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:50;';
        document.body.appendChild(container);
    }
    container.style.display = 'block';
    
    // Racing UI oluştur
    createRacingUI();
    document.getElementById('racing-ui').style.display = 'block';
    
    // Sistemi başlat
    window.racingSystem = new RacingSystem();
    window.racingSystem.init();
}

// RacingSystem'e eksik metodları ekle
RacingSystem.prototype.initUI = function() {
    // UI zaten createRacingUI ile oluşturuluyor
};

RacingSystem.prototype.loadDefaultMaps = function() {
    // Varsayılan haritaları yükle
    if (typeof DefaultMaps !== 'undefined') {
        Object.keys(DefaultMaps).forEach(key => {
            this.maps.set(key, new RaceMap(key, DefaultMaps[key]));
        });
    }
};

RacingSystem.prototype.showRaceLobby = function() {
    this.raceState = RaceState.LOBBY;
    
    document.getElementById('race-lobby').style.display = 'flex';
    document.getElementById('race-countdown').style.display = 'none';
    document.getElementById('race-hud').style.display = 'none';
    document.getElementById('race-finish').style.display = 'none';
    
    // Multiplayer başlat
    if (typeof RaceMultiplayer !== 'undefined') {
        this.multiplayer = new RaceMultiplayer(this);
        this.multiplayer.init();
    }
};

RacingSystem.prototype.startRace = function() {
    // Haritayı yükle
    const mapKey = this.getMapKeyForMode(this.raceMode);
    this.currentMap = this.maps.get(mapKey);
    
    if (this.currentMap) {
        this.currentMap.load(this.scene);
    }
    
    // Aracı oluştur
    this.createPlayerVehicle();
    
    // Geri sayımı başlat
    this.startCountdown();
    
    // Multiplayer sync başlat
    if (this.multiplayer) {
        this.multiplayer.broadcastStart();
        this.multiplayer.startSync();
    }
};

RacingSystem.prototype.getMapKeyForMode = function(mode) {
    switch(mode) {
        case RaceMode.FACE_TO_FACE: return 'face-to-face-1';
        case RaceMode.SPRINT: return 'sprint-1';
        case RaceMode.CIRCUIT: return 'circuit-1';
        case RaceMode.DRAG: return 'drag-1';
        default: return 'sprint-1';
    }
};

RacingSystem.prototype.createPlayerVehicle = function() {
    const vehicleType = this.selectedVehicle || 'sport';
    
    if (typeof RaceVehicle !== 'undefined') {
        const vehicle = new RaceVehicle(vehicleType, this.scene, this.world);
        
        // Spawn pozisyonu
        if (this.currentMap) {
            const spawn = this.currentMap.getSpawnPoint(0);
            vehicle.setPosition(spawn.x, spawn.y, spawn.z);
            vehicle.setRotation(spawn.rotation);
            
            // Kamerayı aracın arkasına ayarla
            this.cameraYaw = (spawn.rotation || 0) + this.cameraBehindYawOffset;
            this.cameraYawTarget = this.cameraYaw;
        } else {
            this.cameraYaw = 0;
            this.cameraYawTarget = 0;
        }
        
        this.localPlayer = {
            vehicle: vehicle,
            lap: 1,
            checkpoint: 0,
            finished: false,
            finishTime: 0
        };
        
        this.vehicles.push(vehicle);
    }
};

RacingSystem.prototype.startCountdown = function() {
    this.raceState = RaceState.COUNTDOWN;
    
    document.getElementById('race-lobby').style.display = 'none';
    document.getElementById('race-countdown').style.display = 'flex';
    
    const countdownEl = document.querySelector('.countdown-number');
    let count = 3;
    
    const countdown = setInterval(() => {
        if (count > 0) {
            countdownEl.textContent = count;
            countdownEl.style.animation = 'none';
            countdownEl.offsetHeight; // Reflow
            countdownEl.style.animation = 'countdownPulse 1s ease-in-out';
            count--;
        } else if (count === 0) {
            countdownEl.textContent = 'BAŞLA!';
            countdownEl.style.color = '#00ff00';
            count--;
        } else {
            clearInterval(countdown);
            this.beginRacing();
        }
    }, 1000);
};

RacingSystem.prototype.beginRacing = function() {
    this.raceState = RaceState.RACING;
    this.raceTime = 0;
    
    document.getElementById('race-countdown').style.display = 'none';
    document.getElementById('race-hud').style.display = 'block';
    
    // Pointer lock
    this.renderer.domElement.requestPointerLock();
};

RacingSystem.prototype.animate = function() {
    requestAnimationFrame(() => this.animate());
    
    const now = performance.now();
    this.deltaTime = (now - this.lastTime) / 1000;
    this.lastTime = now;
    
    // Maksimum delta
    if (this.deltaTime > 0.1) this.deltaTime = 0.1;
    
    // Fizik güncelle
    if (this.world) {
        this.world.step(this.fixedTimeStep, this.deltaTime, 3);
    }
    
    // Yarış güncelle
    if (this.raceState === RaceState.RACING) {
        this.updateRace();
    }
    
    // Render
    if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
    }
};

RacingSystem.prototype.updateRace = function() {
    // Pause durumunda güncelleme yapma
    if (this.isPaused) return;
    
    // Süre güncelle
    this.raceTime += this.deltaTime;
    this.updateTimer();
    
    // Araç güncelle
    if (this.localPlayer && this.localPlayer.vehicle) {
        this.localPlayer.vehicle.update(this.deltaTime, this.keys);
        this.updateCamera();
        this.updateHUD();
        this.checkCheckpoints();
    }
    
    // Diğer oyuncuları güncelle
    this.updateRemotePlayers();
};

RacingSystem.prototype.updateTimer = function() {
    const timeEl = document.getElementById('race-time');
    if (timeEl) {
        timeEl.textContent = this.formatTime(this.raceTime);
    }
};

RacingSystem.prototype.formatTime = function(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
};

RacingSystem.prototype.updateHUD = function() {
    if (!this.localPlayer || !this.localPlayer.vehicle) return;
    
    const speed = this.localPlayer.vehicle.getSpeed();
    
    // Hız göstergesi (max 350 km/h için ölçeklendirildi)
    document.getElementById('speed-number').textContent = Math.round(speed);
    document.getElementById('speed-fill').style.width = `${Math.min(100, speed / 3.5)}%`;
    
    // Tur
    document.getElementById('current-lap').textContent = this.currentLap;
    document.getElementById('total-laps').textContent = this.lapCount;
    
    // Kamera modu
    document.getElementById('camera-mode-text').textContent = 
        this.cameraMode === CameraMode.FIRST_PERSON ? '1. Şahıs (V ile değiştir)' : '3. Şahıs (V ile değiştir)';
};

RacingSystem.prototype.checkCheckpoints = function() {
    if (!this.currentMap || !this.localPlayer) return;
    
    const vehicle = this.localPlayer.vehicle;
    const pos = vehicle.mesh.position;
    
    // Tüm checkpoint'leri kontrol et
    this.currentMap.checkpoints.forEach((cp, index) => {
        if (cp.passed) return; // Zaten geçilmiş
        
        const distance = pos.distanceTo(cp.position);
        const checkDistance = (cp.width || 15) / 2 + 5;
        
        if (distance < checkDistance) {
            // Checkpoint'e ulaşıldı!
            cp.passed = true;
            
            console.log('Checkpoint geçildi:', index, cp.type);
            
            // Araba simgesi checkpoint ise - simgeyi gizle
            if (cp.type === 'car' && cp.mesh) {
                cp.mesh.visible = false;
            }
            
            // Checkpoint animasyonu
            const indicator = document.getElementById('checkpoint-indicator');
            if (indicator) {
                indicator.textContent = cp.isFinish ? '🏁 FİNİŞ!' : '✓ CHECKPOINT';
                indicator.style.display = 'block';
                indicator.style.background = cp.isFinish ? 'rgba(255,215,0,0.9)' : 'rgba(0,255,0,0.8)';
                setTimeout(() => { indicator.style.display = 'none'; }, 1000);
            }
            
            // Araç değiştir (Face to Face modunda)
            if (this.currentMap.config.vehicleChangeOnCheckpoint && cp.type === 'car') {
                this.changeVehicleRandomly();
            }
            
            // Finish kontrolü
            if (cp.isFinish) {
                if (this.currentLap >= this.lapCount) {
                    this.finishRace();
                } else {
                    this.currentLap++;
                    // Checkpoint'leri resetle (araba simgeleri hariç)
                    this.currentMap.checkpoints.forEach(c => {
                        if (c.type !== 'car') c.passed = false;
                    });
                }
            }
        }
    });
    
    // Araba checkpoint simgelerini döndür (animasyon)
    this.animateCheckpointIcons();
};

// Checkpoint simgelerini döndür
RacingSystem.prototype.animateCheckpointIcons = function() {
    if (!this.currentMap) return;
    
    const time = performance.now() * 0.001;
    
    this.currentMap.checkpoints.forEach(cp => {
        if (cp.mesh && cp.mesh.visible) {
            // Döndür
            cp.mesh.rotation.y += cp.mesh.userData.rotationSpeed || 0.02;
            
            // Yukarı aşağı hareket
            const floatOffset = cp.mesh.userData.floatOffset || 0;
            cp.mesh.position.y = 2 + Math.sin(time * 2 + floatOffset) * 0.3;
        }
    });
};

// Rastgele araç değiştir
RacingSystem.prototype.changeVehicleRandomly = function() {
    if (!this.localPlayer || !this.localPlayer.vehicle) return;
    
    const vehicleKeys = Object.keys(VehicleStats);
    const randomKey = vehicleKeys[Math.floor(Math.random() * vehicleKeys.length)];
    
    // Mevcut pozisyon ve hızı kaydet
    const currentPos = this.localPlayer.vehicle.mesh.position.clone();
    const currentRot = this.localPlayer.vehicle.mesh.rotation.y;
    const currentSpeed = this.localPlayer.vehicle.speed;
    
    // Eski aracı kaldır
    this.localPlayer.vehicle.destroy();
    
    // Yeni araç oluştur
    const newVehicle = new RaceVehicle(randomKey, this.scene, this.world);
    newVehicle.setPosition(currentPos.x, currentPos.y + 0.5, currentPos.z);
    newVehicle.setRotation(currentRot);
    newVehicle.speed = currentSpeed * 0.8; // Biraz hız kaybı
    
    this.localPlayer.vehicle = newVehicle;
    
    // Bildirim göster
    this.showNotification(`🚗 Yeni Araç: ${VehicleStats[randomKey].name}`);
    
    console.log('Araç değişti:', randomKey);
};

// Bildirim göster
RacingSystem.prototype.showNotification = function(message) {
    let notif = document.getElementById('race-notification');
    if (!notif) {
        notif = document.createElement('div');
        notif.id = 'race-notification';
        notif.style.cssText = `
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: #feca57;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
            z-index: 1000;
            transition: opacity 0.3s;
        `;
        document.body.appendChild(notif);
    }
    
    notif.textContent = message;
    notif.style.opacity = '1';
    notif.style.display = 'block';
    
    setTimeout(() => {
        notif.style.opacity = '0';
        setTimeout(() => { notif.style.display = 'none'; }, 300);
    }, 2000);
};

RacingSystem.prototype.finishRace = function() {
    this.raceState = RaceState.FINISHED;
    this.localPlayer.finished = true;
    this.localPlayer.finishTime = this.raceTime;
    
    document.exitPointerLock();
    document.getElementById('race-hud').style.display = 'none';
    document.getElementById('race-finish').style.display = 'flex';
    
    // Sonuçları göster
    const resultsList = document.getElementById('finish-results-list');
    resultsList.innerHTML = `
        <div class="result-row">
            <span>🥇 1.</span>
            <span>${document.getElementById('race-player-name')?.value || 'Oyuncu'}</span>
            <span>${this.formatTime(this.raceTime)}</span>
        </div>
    `;
    
    // Multiplayer bildir
    if (this.multiplayer) {
        this.multiplayer.sendFinish(this.raceTime);
        this.multiplayer.stopSync();
    }
};

RacingSystem.prototype.updateRemotePlayers = function() {
    // Multiplayer remote araç güncellemesi artık RaceMultiplayer içinde yapılıyor
    // Bu fonksiyon sadece çarpışma kontrolü için
    if (!this.multiplayer) return;
    
    // Çarpışma kontrolü
    this.checkVehicleCollisions();
};

// Araçlar arası çarpışma kontrolü
RacingSystem.prototype.checkVehicleCollisions = function() {
    if (!this.localPlayer || !this.localPlayer.vehicle) return;
    if (!this.multiplayer || !this.multiplayer.remoteVehicles) return;
    
    const myVehicle = this.localPlayer.vehicle;
    const myPos = myVehicle.mesh.position;
    const myRadius = 2.5; // Araç yarıçapı
    
    this.multiplayer.remoteVehicles.forEach((remoteMesh, playerId) => {
        const remotePos = remoteMesh.position;
        const distance = myPos.distanceTo(remotePos);
        
        // Çarpışma mesafesi
        if (distance < myRadius * 2) {
            // Çarpışma var!
            this.handleVehicleCollision(myVehicle, remoteMesh, distance);
        }
    });
};

// Çarpışma işleme
RacingSystem.prototype.handleVehicleCollision = function(myVehicle, remoteVehicle, distance) {
    const myPos = myVehicle.mesh.position;
    const remotePos = remoteVehicle.position;
    
    // Çarpışma yönü
    const collisionDir = new THREE.Vector3()
        .subVectors(myPos, remotePos)
        .normalize();
    
    // Penetrasyon miktarı
    const penetration = 5 - distance;
    if (penetration <= 0) return;
    
    // Geri itme kuvveti
    const pushForce = penetration * 2;
    
    // Kendi aracımızı geri it
    if (myVehicle.body) {
        myVehicle.body.position.x += collisionDir.x * pushForce * 0.1;
        myVehicle.body.position.z += collisionDir.z * pushForce * 0.1;
        
        // Hız azalt
        myVehicle.speed *= 0.9;
        
        // Eğer rakip arkadan çarptıysa biraz yukarı zıpla (itme efekti)
        const myForward = new THREE.Vector3(0, 0, 1).applyEuler(myVehicle.mesh.rotation);
        const dotProduct = collisionDir.dot(myForward);
        
        if (dotProduct < -0.5) {
            // Arkadan çarpma - yukarı it
            myVehicle.body.position.y += 0.3;
            myVehicle.body.velocity.y = 2;
        }
    }
};

RacingSystem.prototype.togglePause = function() {
    if (this.raceState === RaceState.RACING) {
        // Pause menüsünü göster
        let pauseMenu = document.getElementById('race-pause-menu');
        
        if (!pauseMenu) {
            // Pause menüsü yoksa oluştur
            pauseMenu = document.createElement('div');
            pauseMenu.id = 'race-pause-menu';
            pauseMenu.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            `;
            pauseMenu.innerHTML = `
                <h1 style="color: white; font-size: 48px; margin-bottom: 30px;">DURAKLATILDI</h1>
                <button id="resume-btn" style="padding: 15px 40px; font-size: 20px; margin: 10px; cursor: pointer; background: #27ae60; color: white; border: none; border-radius: 5px;">Devam Et</button>
                <button id="restart-btn" style="padding: 15px 40px; font-size: 20px; margin: 10px; cursor: pointer; background: #3498db; color: white; border: none; border-radius: 5px;">Yeniden Başlat</button>
                <button id="exit-race-btn" style="padding: 15px 40px; font-size: 20px; margin: 10px; cursor: pointer; background: #e74c3c; color: white; border: none; border-radius: 5px;">Lobiye Dön</button>
            `;
            document.body.appendChild(pauseMenu);
            
            // Event listeners
            document.getElementById('resume-btn').onclick = () => {
                pauseMenu.style.display = 'none';
                this.isPaused = false;
            };
            document.getElementById('restart-btn').onclick = () => {
                pauseMenu.style.display = 'none';
                this.isPaused = false;
                this.restartRace();
            };
            document.getElementById('exit-race-btn').onclick = () => {
                pauseMenu.style.display = 'none';
                this.isPaused = false;
                this.returnToLobby();
            };
        }
        
        // Toggle pause
        if (pauseMenu.style.display === 'none' || pauseMenu.style.display === '') {
            pauseMenu.style.display = 'flex';
            this.isPaused = true;
            document.exitPointerLock();
        } else {
            pauseMenu.style.display = 'none';
            this.isPaused = false;
        }
    }
};

// =====================================================
// YENİDEN BAŞLATMA ve LOBİYE DÖN
// =====================================================

RacingSystem.prototype.restartRace = function() {
    console.log('Yarış yeniden başlatılıyor...');
    
    // Bitiş ekranını gizle
    document.getElementById('race-finish').style.display = 'none';
    
    // Yarış verilerini sıfırla
    this.raceTime = 0;
    this.currentLap = 1;
    this.currentCheckpoint = 0;
    
    // Checkpoint'leri sıfırla
    if (this.currentMap) {
        this.currentMap.checkpoints.forEach(cp => cp.passed = false);
    }
    
    // Aracı başlangıç pozisyonuna taşı
    if (this.localPlayer && this.localPlayer.vehicle) {
        const startPos = this.currentMap?.startPositions?.[0] || { x: 0, y: 2, z: 0 };
        this.localPlayer.vehicle.reset(startPos);
    }
    
    // Yarışı başlat
    this.startRace();
};

RacingSystem.prototype.returnToLobby = function() {
    console.log('Lobiye dönülüyor...');
    
    // Bitiş ekranını gizle
    document.getElementById('race-finish').style.display = 'none';
    document.getElementById('race-hud').style.display = 'none';
    
    // Lobiyi göster
    document.getElementById('race-lobby').style.display = 'flex';
    
    // Yarış verilerini sıfırla
    this.raceTime = 0;
    this.currentLap = 1;
    this.currentCheckpoint = 0;
    this.raceState = RaceState.LOBBY;
    
    // Checkpoint'leri sıfırla
    if (this.currentMap) {
        this.currentMap.checkpoints.forEach(cp => cp.passed = false);
    }
    
    // Aracı sil (yeni araç seçilebilir)
    if (this.localPlayer && this.localPlayer.vehicle) {
        if (this.localPlayer.vehicle.mesh) {
            this.scene.remove(this.localPlayer.vehicle.mesh);
        }
        if (this.localPlayer.vehicle.chassisBody && this.world) {
            this.world.removeBody(this.localPlayer.vehicle.chassisBody);
        }
        this.localPlayer.vehicle = null;
    }
    
    // Pointer lock'u kapat
    document.exitPointerLock();
    
    console.log('Lobiye dönüldü');
};

// Global erişim
window.initRacingMode = initRacingMode;
window.racingSystem = racingSystem;
window.RacingSystem = RacingSystem;
