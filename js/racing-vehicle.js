// =====================================================
// FIVEM TO - ARAÇ SİSTEMİ
// Cannon.js fizikli araç kontrolü
// =====================================================

// =====================================================
// FIVEM TO - ARAÇ SİSTEMİ
// Cannon.js fizikli araç kontrolü
// =====================================================

// Araç Kategorileri
const VehicleCategory = {
    SPORT: 'sport',
    SUPER: 'super',
    SUV: 'suv',
    OFFROAD: 'offroad',
    SERVICE: 'service',
    CLASSIC: 'classic'
};

// Araç Listesi (Detaylı)
const VehicleStats = {
    // --- SPORT KATEGORİSİ ---
    'sport_gt': {
        name: 'Sport GT',
        category: VehicleCategory.SPORT,
        maxSpeed: 250,
        acceleration: 28,
        braking: 22,
        handling: 2.5,
        mass: 1200,
        color: 0xe74c3c,
        type: 'sport'
    },
    'opel_calibra': {
        name: 'Opel Calibra',
        category: VehicleCategory.SPORT,
        maxSpeed: 240,
        acceleration: 26,
        braking: 21,
        handling: 2.4,
        mass: 1250,
        color: 0x3498db,
        type: 'sport'
    },
    'muscle_car': {
        name: 'Muscle King',
        category: VehicleCategory.SPORT,
        maxSpeed: 260,
        acceleration: 32,
        braking: 20,
        handling: 2.0,
        mass: 1500,
        color: 0x2c3e50,
        type: 'muscle'
    },
    'rally_evo': {
        name: 'Rally Evo',
        category: VehicleCategory.SPORT,
        maxSpeed: 230,
        acceleration: 30,
        braking: 24,
        handling: 2.8,
        mass: 1300,
        color: 0x9b59b6,
        type: 'rally'
    },

    // --- SUPER KATEGORİSİ ---
    'super_zentorno': {
        name: 'Zentorno',
        category: VehicleCategory.SUPER,
        maxSpeed: 300,
        acceleration: 38,
        braking: 30,
        handling: 3.0,
        mass: 1100,
        color: 0xf1c40f,
        type: 'super'
    },
    'super_adder': {
        name: 'Adder',
        category: VehicleCategory.SUPER,
        maxSpeed: 320,
        acceleration: 35,
        braking: 28,
        handling: 2.8,
        mass: 1200,
        color: 0xe67e22,
        type: 'super'
    },

    // --- SUV KATEGORİSİ ---
    'suv_baller': {
        name: 'Baller',
        category: VehicleCategory.SUV,
        maxSpeed: 180,
        acceleration: 22,
        braking: 26,
        handling: 1.8,
        mass: 2000,
        color: 0x2ecc71,
        type: 'suv'
    },
    'suv_granger': {
        name: 'Granger',
        category: VehicleCategory.SUV,
        maxSpeed: 170,
        acceleration: 20,
        braking: 24,
        handling: 1.7,
        mass: 2200,
        color: 0x34495e,
        type: 'suv'
    },

    // --- OFFROAD KATEGORİSİ ---
    'offroad_brawler': {
        name: 'Brawler',
        category: VehicleCategory.OFFROAD,
        maxSpeed: 160,
        acceleration: 24,
        braking: 22,
        handling: 1.5,
        mass: 1800,
        color: 0xd35400,
        type: 'offroad'
    },
    'offroad_monster': {
        name: 'Monster',
        category: VehicleCategory.OFFROAD,
        maxSpeed: 140,
        acceleration: 28,
        braking: 20,
        handling: 1.2,
        mass: 2500,
        color: 0x27ae60,
        type: 'offroad'
    },

    // --- SERVICE KATEGORİSİ ---
    'police_cruiser': {
        name: 'Polis Aracı',
        category: VehicleCategory.SERVICE,
        maxSpeed: 250,
        acceleration: 30,
        braking: 26,
        handling: 2.2,
        mass: 1600,
        color: 0x2c3e50,
        type: 'police'
    },
    'taxi_cab': {
        name: 'Taksi',
        category: VehicleCategory.SERVICE,
        maxSpeed: 200,
        acceleration: 20,
        braking: 20,
        handling: 1.9,
        mass: 1400,
        color: 0xf39c12,
        type: 'taxi'
    },
    'truck_hauler': {
        name: 'Kamyon',
        category: VehicleCategory.SERVICE,
        maxSpeed: 120,
        acceleration: 16,
        braking: 16,
        handling: 1.0,
        mass: 3500,
        color: 0x7f8c8d,
        type: 'truck'
    },

    // --- CLASSIC KATEGORİSİ ---
    'classic_gt': {
        name: 'Klasik GT',
        category: VehicleCategory.CLASSIC,
        maxSpeed: 180,
        acceleration: 18,
        braking: 16,
        handling: 1.6,
        mass: 1450,
        color: 0x8e44ad,
        type: 'classic'
    },
    'compact_panto': {
        name: 'Panto',
        category: VehicleCategory.CLASSIC,
        maxSpeed: 160,
        acceleration: 20,
        braking: 22,
        handling: 2.4,
        mass: 1000,
        color: 0x1abc9c,
        type: 'compact'
    }
};

// Geriye dönük uyumluluk için VehicleType
const VehicleType = {
    SPORT: 'sport_gt',
    MUSCLE: 'muscle_car',
    SUV: 'suv_baller',
    SUPER: 'super_zentorno',
    OFFROAD: 'offroad_brawler'
};

// =====================================================
// ARAÇ SINIFI
// =====================================================

class RaceVehicle {
    constructor(id, scene, world) {
        this.id = id;
        this.stats = VehicleStats[id] || VehicleStats['sport_gt'];
        this.type = this.stats.type || 'sport'; // Görünüm tipi
        this.scene = scene;
        this.world = world;
        
        // Fizik değişkenleri
        this.speed = 0;
        this.steerAngle = 0;
        this.throttle = 0;
        this.brake = 0;
        this.handbrake = false;
        
        // Drift değişkenleri
        this.driftFactor = 0;
        this.isDrifting = false;
        
        // Mesh ve body
        this.mesh = null;
        this.body = null;
        this.wheels = [];
        
        // Oluştur
        this.create();
    }
    
    create() {
        // Detaylı araç mesh'i oluştur
        this.createDetailedMesh();
        
        // Fizik body (Cannon.js varsa)
        if (this.world) {
            this.createPhysicsBody();
        }
        
        // GLTF Model yüklemeyi dene (Varsa)
        this.tryLoadGLTF();
    }
    
    tryLoadGLTF() {
        // Eğer GLTFLoader varsa ve assets klasöründe model varsa yükle
        if (typeof THREE.GLTFLoader !== 'undefined') {
            const loader = new THREE.GLTFLoader();
            // Önce ID ile dene (örn: opel_calibra.glb), yoksa tip ile dene (örn: sport.glb)
            const modelPath = `./assets/vehicles/${this.id}.glb`;
            
            console.log(`Model yükleniyor: ${modelPath}`);
            
            loader.load(modelPath, (gltf) => {
                console.log(`BAŞARILI: ${this.id} modeli yüklendi!`);
                this.applyModel(gltf);
            }, (xhr) => {
                // Progress
                // console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
            }, (error) => {
                console.warn(`Model bulunamadı (${modelPath}), tip modeline bakılıyor...`);
                
                // ID ile bulunamadı, tip ile dene
                const typePath = `./assets/vehicles/${this.type}.glb`;
                loader.load(typePath, (gltf) => {
                    console.log(`${this.type} tip modeli yüklendi`);
                    this.applyModel(gltf);
                }, undefined, (err) => {
                    console.log(`Tip modeli de bulunamadı (${typePath}), prosedürel araç kullanılıyor.`);
                });
            });
        } else {
            console.error("HATA: THREE.GLTFLoader bulunamadı! Lütfen internet bağlantınızı kontrol edin veya GLTFLoader.js dosyasını ekleyin.");
        }
    }
    
    applyModel(gltf) {
        console.log("Model uygulanıyor...", gltf);
        
        // Yeni modeli al
        const model = gltf.scene;
        
        // Model boyutunu hesapla
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        console.log("Model boyutu:", size);
        
        // Modeli uygun boyuta ölçekle (araç yaklaşık 4.5 birim uzunluğunda olmalı)
        const targetLength = 4.5;
        const maxDimension = Math.max(size.x, size.y, size.z);
        const scale = targetLength / maxDimension;
        model.scale.set(scale, scale, scale);
        
        // Modeli merkeze al
        box.setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        
        // X ve Z'yi merkeze al
        model.position.x -= center.x;
        model.position.z -= center.z;
        
        // Y eksenini ayarla: Aracın altı, physics body'nin altına denk gelmeli
        // Physics body height = 0.5 * 2 = 1.0
        // Body center (0,0,0) -> Bottom is -0.5
        // Model bottom (after centering Y) would be -size.y/2 * scale
        // We want model bottom to be at -0.5
        // Current Y center is center.y. We shift by -center.y to make it 0.
        // Then we shift up/down.
        
        // Önce modeli Y ekseninde ortala (0 noktasına)
        model.position.y -= center.y;
        
        // Şimdi body'nin altına hizalamak için kaydır
        // Modelin yüksekliği: size.y * scale
        // Body'nin yüksekliği: 1.0
        // Eğer modelin altı -0.5'te olmalıysa:
        // Şu an modelin altı -(size.y * scale)/2 'de.
        // Fark: -0.5 - (-(size.y * scale)/2) = (size.y * scale)/2 - 0.5
        
        const yOffset = (size.y * scale / 2) - 0.5;
        model.position.y += yOffset;
        
        // Modeldeki tüm parçaları logla (Debug)
        console.log("GLTF Model yüklendi, parça sayısı:", model.children.length);
        
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        // GLTF modeli için tekerlek animasyonunu devre dışı bırak
        this.isGLTF = true;
        this.wheels = []; // Boş bırak - GLTF modelde tekerlek animasyonu yok
        
        // Mevcut prosedürel parçaları temizle
        while(this.mesh.children.length > 0) {
            this.mesh.remove(this.mesh.children[0]);
        }
        
        // Yeni modeli ekle
        this.mesh.add(model);
        this.mesh.visible = true;
        
        console.log("Model başarıyla uygulandı!");
    }

    createDetailedMesh() {
        this.mesh = new THREE.Group();
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        const mainColor = new THREE.MeshPhongMaterial({ 
            color: this.stats.color,
            shininess: 100,
            specular: 0x444444
        });
        
        const blackMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
        const glassMat = new THREE.MeshPhongMaterial({ 
            color: 0x111111, 
            shininess: 200,
            specular: 0xffffff,
            transparent: true,
            opacity: 0.9
        });
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffcc });
        const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const chromeMat = new THREE.MeshPhongMaterial({ color: 0xcccccc, shininess: 200 });

        // Araç tipine göre tasarım
        switch(this.type) {
            case 'super':
                this.createSuperCar(mainColor, blackMat, glassMat, lightMat, tailLightMat);
                break;
            case 'suv':
            case 'offroad':
            case 'truck':
                this.createSUV(mainColor, blackMat, glassMat, lightMat, tailLightMat);
                break;
            case 'rally':
            case 'police':
            case 'taxi':
                this.createSportCar(mainColor, blackMat, glassMat, lightMat, tailLightMat);
                break;
            case 'classic':
            case 'compact':
            case 'muscle':
            case 'sport':
            default: 
                this.createSportCar(mainColor, blackMat, glassMat, lightMat, tailLightMat);
                break;
        }

        // Tekerlekler
        this.createWheels();

        this.scene.add(this.mesh);
    }

    createSportCar(bodyMat, blackMat, glassMat, lightMat, tailMat) {
        // Alt Gövde
        const chassisGeo = new THREE.BoxGeometry(2.2, 0.6, 4.4);
        const chassis = new THREE.Mesh(chassisGeo, bodyMat);
        chassis.position.y = 0.5;
        chassis.castShadow = true;
        this.mesh.add(chassis);

        // Üst Gövde (Kabin)
        const cabinGeo = new THREE.BoxGeometry(1.8, 0.5, 2.2);
        const cabin = new THREE.Mesh(cabinGeo, bodyMat);
        cabin.position.set(0, 1.0, -0.2);
        cabin.castShadow = true;
        this.mesh.add(cabin);

        // Ön Cam
        const windshieldGeo = new THREE.BoxGeometry(1.7, 0.05, 0.8);
        const windshield = new THREE.Mesh(windshieldGeo, glassMat);
        windshield.position.set(0, 1.0, 1.0);
        windshield.rotation.x = -Math.PI / 4;
        this.mesh.add(windshield);

        // Arka Cam
        const rearWindowGeo = new THREE.BoxGeometry(1.7, 0.05, 0.8);
        const rearWindow = new THREE.Mesh(rearWindowGeo, glassMat);
        rearWindow.position.set(0, 1.0, -1.4);
        rearWindow.rotation.x = Math.PI / 4;
        this.mesh.add(rearWindow);

        // Yan Camlar
        const sideWindowGeo = new THREE.BoxGeometry(1.82, 0.4, 1.8);
        const sideWindow = new THREE.Mesh(sideWindowGeo, glassMat);
        sideWindow.position.set(0, 1.0, -0.2);
        this.mesh.add(sideWindow);

        // Farlar
        const headLightGeo = new THREE.BoxGeometry(0.4, 0.2, 0.1);
        const hlLeft = new THREE.Mesh(headLightGeo, lightMat);
        hlLeft.position.set(-0.7, 0.6, 2.2);
        this.mesh.add(hlLeft);
        const hlRight = new THREE.Mesh(headLightGeo, lightMat);
        hlRight.position.set(0.7, 0.6, 2.2);
        this.mesh.add(hlRight);

        // Stoplar
        const tlLeft = new THREE.Mesh(headLightGeo, tailMat);
        tlLeft.position.set(-0.7, 0.6, -2.2);
        this.mesh.add(tlLeft);
        const tlRight = new THREE.Mesh(headLightGeo, tailMat);
        tlRight.position.set(0.7, 0.6, -2.2);
        this.mesh.add(tlRight);

        // Opel Calibra Özel Detaylar
        if (this.id === 'opel_calibra') {
            // Daha aerodinamik burun
            const noseGeo = new THREE.BoxGeometry(2.0, 0.1, 0.5);
            const nose = new THREE.Mesh(noseGeo, bodyMat);
            nose.position.set(0, 0.7, 2.2);
            nose.rotation.x = 0.2;
            this.mesh.add(nose);
            
            // İnce spoiler
            const spoilerGeo = new THREE.BoxGeometry(2.0, 0.05, 0.3);
            const spoiler = new THREE.Mesh(spoilerGeo, bodyMat);
            spoiler.position.set(0, 0.85, -2.2);
            this.mesh.add(spoiler);
        } 
        // Diğer Sport araçlar için standart spoiler
        else if (this.type === 'sport' || this.type === 'rally') {
            const spoilerLegGeo = new THREE.BoxGeometry(0.1, 0.3, 0.1);
            const leg1 = new THREE.Mesh(spoilerLegGeo, bodyMat);
            leg1.position.set(-0.8, 0.9, -2.0);
            this.mesh.add(leg1);
            const leg2 = new THREE.Mesh(spoilerLegGeo, bodyMat);
            leg2.position.set(0.8, 0.9, -2.0);
            this.mesh.add(leg2);
            
            const spoilerGeo = new THREE.BoxGeometry(2.2, 0.1, 0.4);
            const spoiler = new THREE.Mesh(spoilerGeo, bodyMat);
            spoiler.position.set(0, 1.1, -2.0);
            this.mesh.add(spoiler);
        }
    }

    createSuperCar(bodyMat, blackMat, glassMat, lightMat, tailMat) {
        // Daha alçak ve geniş gövde
        const chassisGeo = new THREE.BoxGeometry(2.4, 0.5, 4.6);
        const chassis = new THREE.Mesh(chassisGeo, bodyMat);
        chassis.position.y = 0.4;
        chassis.castShadow = true;
        this.mesh.add(chassis);

        // Kokpit
        const cockpitGeo = new THREE.BoxGeometry(1.6, 0.4, 2.0);
        const cockpit = new THREE.Mesh(cockpitGeo, blackMat);
        cockpit.position.set(0, 0.8, -0.1);
        this.mesh.add(cockpit);

        // Ön kaput eğimi
        const hoodGeo = new THREE.BoxGeometry(2.2, 0.1, 1.5);
        const hood = new THREE.Mesh(hoodGeo, bodyMat);
        hood.position.set(0, 0.6, 1.5);
        hood.rotation.x = 0.1;
        this.mesh.add(hood);

        // Büyük Spoiler
        const spoilerLegGeo = new THREE.BoxGeometry(0.2, 0.4, 0.2);
        const leg1 = new THREE.Mesh(spoilerLegGeo, blackMat);
        leg1.position.set(-0.6, 0.8, -2.0);
        this.mesh.add(leg1);
        const leg2 = new THREE.Mesh(spoilerLegGeo, blackMat);
        leg2.position.set(0.6, 0.8, -2.0);
        this.mesh.add(leg2);
        
        const spoilerGeo = new THREE.BoxGeometry(2.4, 0.1, 0.6);
        const spoiler = new THREE.Mesh(spoilerGeo, bodyMat);
        spoiler.position.set(0, 1.0, -2.1);
        this.mesh.add(spoiler);

        // Farlar (Şerit led)
        const headLightGeo = new THREE.BoxGeometry(0.8, 0.1, 0.1);
        const hlLeft = new THREE.Mesh(headLightGeo, lightMat);
        hlLeft.position.set(-0.8, 0.5, 2.3);
        hlLeft.rotation.z = 0.1;
        this.mesh.add(hlLeft);
        const hlRight = new THREE.Mesh(headLightGeo, lightMat);
        hlRight.position.set(0.8, 0.5, 2.3);
        hlRight.rotation.z = -0.1;
        this.mesh.add(hlRight);
    }

    createSUV(bodyMat, blackMat, glassMat, lightMat, tailMat) {
        // Yüksek ve küt gövde
        const chassisGeo = new THREE.BoxGeometry(2.4, 0.8, 4.6);
        const chassis = new THREE.Mesh(chassisGeo, bodyMat);
        chassis.position.y = 0.8;
        chassis.castShadow = true;
        this.mesh.add(chassis);

        // Kabin
        const cabinGeo = new THREE.BoxGeometry(2.2, 0.7, 3.0);
        const cabin = new THREE.Mesh(cabinGeo, bodyMat);
        cabin.position.set(0, 1.5, -0.2);
        this.mesh.add(cabin);

        // Camlar
        const windowGeo = new THREE.BoxGeometry(2.25, 0.5, 2.8);
        const windows = new THREE.Mesh(windowGeo, glassMat);
        windows.position.set(0, 1.5, -0.2);
        this.mesh.add(windows);

        // Tamponlar
        const bumperGeo = new THREE.BoxGeometry(2.4, 0.3, 0.2);
        const frontBumper = new THREE.Mesh(bumperGeo, blackMat);
        frontBumper.position.set(0, 0.6, 2.3);
        this.mesh.add(frontBumper);
        
        const rearBumper = new THREE.Mesh(bumperGeo, blackMat);
        rearBumper.position.set(0, 0.6, -2.3);
        this.mesh.add(rearBumper);

        // Farlar
        const headLightGeo = new THREE.BoxGeometry(0.5, 0.3, 0.1);
        const hlLeft = new THREE.Mesh(headLightGeo, lightMat);
        hlLeft.position.set(-0.8, 1.0, 2.3);
        this.mesh.add(hlLeft);
        const hlRight = new THREE.Mesh(headLightGeo, lightMat);
        hlRight.position.set(0.8, 1.0, 2.3);
        this.mesh.add(hlRight);
    }

    createWheels() {
        const wheelRadius = (this.type === VehicleType.SUV || this.type === VehicleType.OFFROAD) ? 0.5 : 0.4;
        const wheelWidth = 0.35;
        
        const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 24);
        const wheelMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.6, wheelRadius * 0.6, wheelWidth + 0.02, 12);
        const rimMat = new THREE.MeshPhongMaterial({ color: 0xdddddd, shininess: 100 });

        const wheelY = (this.type === VehicleType.SUV || this.type === VehicleType.OFFROAD) ? 0.5 : 0.4;
        const wheelZ = 1.4;
        const wheelX = 1.1;

        const positions = [
            { x: -wheelX, y: wheelY, z: wheelZ },   // Ön Sol
            { x: wheelX, y: wheelY, z: wheelZ },    // Ön Sağ
            { x: -wheelX, y: wheelY, z: -wheelZ },  // Arka Sol
            { x: wheelX, y: wheelY, z: -wheelZ }    // Arka Sağ
        ];

        positions.forEach((pos, i) => {
            const wheelGroup = new THREE.Group();
            
            const tire = new THREE.Mesh(wheelGeo, wheelMat);
            tire.rotation.z = Math.PI / 2;
            tire.castShadow = true;
            wheelGroup.add(tire);

            const rim = new THREE.Mesh(rimGeo, rimMat);
            rim.rotation.z = Math.PI / 2;
            wheelGroup.add(rim);

            wheelGroup.position.set(pos.x, pos.y, pos.z);
            this.mesh.add(wheelGroup);
            this.wheels.push(wheelGroup);
        });
    }
    
    createPhysicsBody() {
        // Daha stabil fizik body
        const shape = new CANNON.Box(new CANNON.Vec3(1.1, 0.5, 2.2));
        this.body = new CANNON.Body({
            mass: this.stats.mass,
            shape: shape,
            linearDamping: 0.3,
            angularDamping: 0.5
        });
        
        // ÖNEMLI: Sleep modunu devre dışı bırak!
        this.body.allowSleep = false;
        this.body.sleepState = 0; // AWAKE
        
        // Body'yi zemin üzeri yüksekliğine taşı (gömülmesin)
        this.body.position.set(
            this.mesh.position.x,
            Math.max(this.mesh.position.y, 1.5), // En az 1.5 birim yukarıda
            this.mesh.position.z
        );
        
        this.world.addBody(this.body);
        console.log("[Vehicle] Fizik body oluşturuldu. Mass:", this.stats.mass, "Pos:", this.body.position);
    }
    
    // =====================================================
    // ARAÇ KONTROLÜ
    // =====================================================
    
    update(dt, keys) {
        // Gaz/Fren input
        this.throttle = 0;
        this.brake = 0;
        this.steerAngle = 0;
        
        if (keys['KeyW'] || keys['ArrowUp']) {
            this.throttle = 1;
        }
        if (keys['KeyS'] || keys['ArrowDown']) {
            if (this.speed > 1) {
                this.brake = 1;
            } else {
                this.throttle = -0.5; // Geri vites
            }
        }
        if (keys['KeyA'] || keys['ArrowLeft']) {
            this.steerAngle = -1; // Sol
        }
        if (keys['KeyD'] || keys['ArrowRight']) {
            this.steerAngle = 1; // Sağ
        }
        if (keys['Space']) {
            this.handbrake = true;
        } else {
            this.handbrake = false;
        }
        
        // Fizik güncelleme
        if (this.body) {
            this.updatePhysics(dt);
        } else {
            this.updateSimple(dt);
        }
        
        // Tekerlek animasyonu (sadece prosedürel araçlar için)
        this.updateWheels(dt);
    }
    
    updateSimple(dt) {
        // Basit fizik (Cannon.js yoksa)
        const acceleration = this.stats.acceleration * this.throttle;
        const braking = this.stats.braking * this.brake;
        
        // Hız hesapla
        this.speed += acceleration * dt;
        this.speed -= braking * dt;
        this.speed *= 0.99; // Sürtünme
        
        // Maksimum hız
        const maxSpeed = this.stats.maxSpeed / 3.6; // km/h -> m/s
        this.speed = Math.max(-maxSpeed * 0.3, Math.min(maxSpeed, this.speed));
        
        // El freni
        if (this.handbrake && Math.abs(this.speed) > 0.5) {
            this.isDrifting = true;
            this.driftFactor = Math.min(1, this.driftFactor + dt * 3);
            this.speed *= 0.98;
        } else {
            this.isDrifting = false;
            this.driftFactor = Math.max(0, this.driftFactor - dt * 2);
        }
        
        // Dönüş
        const turnSpeed = this.stats.handling * this.steerAngle * dt * 2;
        const turnMultiplier = Math.min(1, Math.abs(this.speed) / 5);
        
        if (this.isDrifting) {
            this.mesh.rotation.y -= turnSpeed * turnMultiplier * 1.5;
        } else {
            this.mesh.rotation.y -= turnSpeed * turnMultiplier;
        }
        
        // Hareket - pozitif Z ileri
        const direction = new THREE.Vector3(0, 0, 1);
        direction.applyEuler(this.mesh.rotation);
        
        // Drift kayması
        if (this.isDrifting) {
            const slideDir = new THREE.Vector3(1, 0, 0);
            slideDir.applyEuler(this.mesh.rotation);
            slideDir.multiplyScalar(this.driftFactor * this.steerAngle * 0.5);
            direction.add(slideDir);
        }
        
        direction.multiplyScalar(this.speed * dt);
        this.mesh.position.add(direction);
        
        // Minimum yükseklik
        if (this.mesh.position.y < 0.5) {
            this.mesh.position.y = 0.5;
        }
    }
    
    updatePhysics(dt) {
        // Basitleştirilmiş fizik - direkt rotasyon ve pozisyon kontrolü
        const maxSpeed = this.stats.maxSpeed / 3.6; // km/h -> m/s
        
        // Mevcut yön (Y rotasyonundan)
        const euler = new CANNON.Vec3();
        this.body.quaternion.toEuler(euler);
        let currentYaw = euler.y;
        
        // DÖNÜŞ - Sadece hareket halindeyken
        if (Math.abs(this.speed) > 0.3) {
            // Hıza göre dönüş miktarı - düşük hızda keskin, yüksek hızda yumuşak
            const speedRatio = Math.abs(this.speed) / maxSpeed;
            const turnMultiplier = 1.5 - speedRatio * 0.5; // 1.5 -> 1.0 arası
            const turnRate = this.stats.handling * turnMultiplier * dt;
            
            // Direksiyon yönüne göre dön
            if (this.steerAngle !== 0) {
                // Geri giderken direksiyon ters çalışır
                const steerDirection = this.speed >= 0 ? -1 : 1;
                currentYaw += this.steerAngle * turnRate * steerDirection;
            }
        }
        
        // Quaternion'u güncelle (sadece Y rotasyonu)
        this.body.quaternion.setFromEuler(0, currentYaw, 0);
        
        // İleri yön vektörü (+Z)
        const forward = new CANNON.Vec3(
            Math.sin(currentYaw),
            0,
            Math.cos(currentYaw)
        );
        
        // HIZLANMA
        if (this.throttle !== 0) {
            const accelPower = this.stats.acceleration * dt * 2;
            this.speed += this.throttle * accelPower;
        }
        
        // FREN
        if (this.brake > 0) {
            this.speed *= 0.92;
        }
        
        // SÜRTÜNME (gaz/fren yokken)
        if (this.throttle === 0 && this.brake === 0) {
            this.speed *= 0.995;
        }
        
        // Hız limitleri
        this.speed = Math.max(-maxSpeed * 0.3, Math.min(maxSpeed, this.speed));
        
        // Çok düşük hızı sıfırla
        if (Math.abs(this.speed) < 0.1) {
            this.speed = 0;
        }
        
        // EL FRENİ - Drift
        if (this.handbrake && Math.abs(this.speed) > 2) {
            this.isDrifting = true;
            this.driftFactor = Math.min(1, this.driftFactor + dt * 5);
            this.speed *= 0.98;
            // Drift sırasında daha hızlı dönüş
            if (this.steerAngle !== 0) {
                currentYaw += this.steerAngle * this.stats.handling * dt * 2;
                this.body.quaternion.setFromEuler(0, currentYaw, 0);
            }
        } else {
            this.isDrifting = false;
            this.driftFactor = Math.max(0, this.driftFactor - dt * 3);
        }
        
        // POZİSYON GÜNCELLE
        this.body.position.x += forward.x * this.speed * dt;
        this.body.position.z += forward.z * this.speed * dt;
        
        // Yükseklik kontrolü
        if (this.body.position.y < 0.5) {
            this.body.position.y = 0.5;
        }
        this.body.velocity.y = 0; // Zıplamayı engelle
        
        // Angular velocity sıfırla (fizik motorunun karışmasını engelle)
        this.body.angularVelocity.set(0, 0, 0);
        this.body.velocity.x = forward.x * this.speed;
        this.body.velocity.z = forward.z * this.speed;
        
        // Mesh'i güncelle
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);
    }
    
    updateWheels(dt) {
        // Tekerlek dönüşü
        const wheelRotation = this.speed * dt * 5;
        
        if (this.isGLTF && this.wheels.length > 0) {
            // GLTF Model Tekerlekleri
            this.wheels.forEach((wheel, i) => {
                // Dönme (Local X ekseni varsayımı)
                // Not: GLTF modellerinde eksenler farklı olabilir, genelde X ekseni etrafında dönerler
                wheel.rotation.x += wheelRotation;
                
                // Ön tekerlekler direksiyon (Z sıralamasına göre ilk yarısı ön kabul edilir)
                // Genelde 4 tekerlek varsa ilk 2'si öndür (sıralama yaptık)
                if (i < 2) { 
                    wheel.rotation.y = -this.steerAngle * 0.5;
                }
            });
        } else {
            // Prosedürel Tekerlekler
            this.wheels.forEach((wheel, i) => {
                // Dönme animasyonu
                wheel.children[0].rotation.x += wheelRotation; // Tire
                wheel.children[1].rotation.x += wheelRotation; // Rim
                
                // Ön tekerlekler direksiyon
                if (i < 2) {
                    wheel.rotation.y = -this.steerAngle * 0.5; // Görsel dönüş açısı artırıldı
                }
            });
        }
    }
    
    // =====================================================
    // YARDIMCI METODLAR
    // =====================================================
    
    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
        if (this.body) {
            this.body.position.set(x, y, z);
        }
    }
    
    setRotation(y) {
        this.mesh.rotation.y = y;
        if (this.body) {
            this.body.quaternion.setFromEuler(0, y, 0);
        }
    }
    
    getSpeed() {
        return Math.abs(this.speed) * 3.6; // m/s -> km/h
    }
    
    reset(position, rotation) {
        this.speed = 0;
        this.steerAngle = 0;
        this.throttle = 0;
        this.brake = 0;
        this.driftFactor = 0;
        this.isDrifting = false;
        
        this.setPosition(position.x, position.y, position.z);
        this.setRotation(rotation);
        
        if (this.body) {
            this.body.velocity.set(0, 0, 0);
            this.body.angularVelocity.set(0, 0, 0);
        }
    }
    
    destroy() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }
        if (this.body && this.world) {
            this.world.removeBody(this.body);
        }
    }
}

// Global erişim
window.RaceVehicle = RaceVehicle;
window.VehicleType = VehicleType;
window.VehicleStats = VehicleStats;
