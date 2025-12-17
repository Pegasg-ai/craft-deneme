// =====================================================
// FIVEM TO - MULTIPLAYER VE HARİTA SİSTEMİ
// =====================================================

// =====================================================
// MULTIPLAYER SİSTEMİ - GELİŞTİRİLMİŞ
// =====================================================

class RaceMultiplayer {
    constructor(racingSystem) {
        this.racing = racingSystem;
        this.peer = null;
        this.connections = new Map();
        this.isHost = false;
        this.playerId = null;
        this.players = new Map();
        this.syncInterval = null;
        this.remoteVehicles = new Map(); // Remote araçların Three.js mesh'leri
    }
    
    init() {
        // PeerJS kullan
        if (typeof Peer === 'undefined') {
            console.warn('PeerJS yüklenmedi!');
            return;
        }
        
        this.peer = new Peer();
        
        this.peer.on('open', (id) => {
            this.playerId = id;
            console.log('Racing Peer ID:', id);
            
            const idDisplay = document.getElementById('race-player-id');
            if (idDisplay) idDisplay.textContent = id;
        });
        
        this.peer.on('connection', (conn) => {
            this.handleConnection(conn);
        });
        
        this.peer.on('error', (err) => {
            console.error('Peer error:', err);
        });
        
        // UI event'leri
        this.setupUIEvents();
    }
    
    setupUIEvents() {
        // Sunucu ol
        document.getElementById('btn-race-host')?.addEventListener('click', () => {
            this.hostGame();
        });
        
        // Katıl
        document.getElementById('btn-race-join')?.addEventListener('click', () => {
            const hostId = document.getElementById('race-join-id')?.value;
            if (hostId) {
                this.joinGame(hostId);
            }
        });
    }
    
    hostGame() {
        this.isHost = true;
        const playerName = document.getElementById('race-player-name')?.value || 'Host';
        const selectedVehicle = this.racing.selectedVehicle || 'sport_gt';
        
        // Kendini ekle
        this.players.set(this.playerId, {
            id: this.playerId,
            name: playerName,
            isHost: true,
            ready: true,
            vehicle: selectedVehicle,
            position: { x: 0, y: 1, z: 0 },
            rotation: 0,
            speed: 0,
            lap: 1,
            checkpoint: 0,
            finished: false,
            finishTime: 0
        });
        
        this.updateLobbyPlayers();
        this.showHostInfo();
    }
    
    showHostInfo() {
        const lobbyPlayers = document.getElementById('race-lobby-players');
        if (lobbyPlayers) {
            // Eski bilgiyi temizle
            const oldInfo = lobbyPlayers.querySelector('.host-info-box');
            if (oldInfo) oldInfo.remove();
            
            const infoDiv = document.createElement('div');
            infoDiv.className = 'host-info-box';
            infoDiv.innerHTML = `
                <div style="background: linear-gradient(135deg, rgba(72, 219, 251, 0.2), rgba(72, 219, 251, 0.1)); 
                            border: 1px solid rgba(72, 219, 251, 0.5); 
                            border-radius: 10px; 
                            padding: 15px; 
                            margin-bottom: 15px;
                            text-align: center;">
                    <div style="color: #48dbfb; font-weight: bold; margin-bottom: 8px;">🎮 SUNUCU OLUŞTURULDU!</div>
                    <div style="color: white; font-size: 0.9rem; margin-bottom: 10px;">Bu ID'yi arkadaşlarınla paylaş:</div>
                    <div style="background: rgba(0,0,0,0.4); padding: 10px; border-radius: 8px; font-family: monospace; color: #feca57; font-size: 1.1rem; user-select: all; cursor: pointer;" 
                         onclick="navigator.clipboard.writeText('${this.playerId}'); this.innerHTML='📋 Kopyalandı!';"
                         title="Kopyalamak için tıkla">
                        ${this.playerId}
                    </div>
                </div>
            `;
            lobbyPlayers.insertBefore(infoDiv, lobbyPlayers.firstChild);
        }
    }
    
    joinGame(hostId) {
        const playerName = document.getElementById('race-player-name')?.value || 'Player';
        const selectedVehicle = this.racing.selectedVehicle || 'sport_gt';
        
        console.log('Sunucuya bağlanılıyor:', hostId);
        
        const conn = this.peer.connect(hostId, { reliable: true });
        
        conn.on('open', () => {
            console.log('Sunucuya bağlandı!');
            this.connections.set(hostId, conn);
            
            // Katılım mesajı gönder
            conn.send({
                type: 'join',
                id: this.playerId,
                name: playerName,
                vehicle: selectedVehicle
            });
            
            // Kendi bilgilerimi kaydet
            this.players.set(this.playerId, {
                id: this.playerId,
                name: playerName,
                isHost: false,
                ready: true,
                vehicle: selectedVehicle,
                position: { x: 0, y: 1, z: 0 },
                rotation: 0,
                speed: 0,
                lap: 1,
                checkpoint: 0,
                finished: false,
                finishTime: 0
            });
        });
        
        conn.on('data', (data) => {
            this.handleData(data, conn);
        });
        
        conn.on('close', () => {
            console.log('Bağlantı kapandı');
            this.connections.delete(hostId);
        });
        
        conn.on('error', (err) => {
            console.error('Bağlantı hatası:', err);
        });
    }
    
    handleConnection(conn) {
        console.log('Yeni bağlantı:', conn.peer);
        this.connections.set(conn.peer, conn);
        
        conn.on('open', () => {
            console.log('Bağlantı açıldı:', conn.peer);
        });
        
        conn.on('data', (data) => {
            this.handleData(data, conn);
        });
        
        conn.on('close', () => {
            console.log('Oyuncu ayrıldı:', conn.peer);
            this.removeRemoteVehicle(conn.peer);
            this.players.delete(conn.peer);
            this.connections.delete(conn.peer);
            this.updateLobbyPlayers();
            this.broadcastPlayers();
        });
    }
    
    handleData(data, conn) {
        switch (data.type) {
            case 'join':
                console.log('Oyuncu katıldı:', data.name);
                // Yeni oyuncu katıldı
                this.players.set(data.id, {
                    id: data.id,
                    name: data.name,
                    isHost: false,
                    ready: true,
                    vehicle: data.vehicle || 'sport_gt',
                    position: { x: 0, y: 1, z: 0 },
                    rotation: 0,
                    speed: 0,
                    lap: 1,
                    checkpoint: 0,
                    finished: false,
                    finishTime: 0
                });
                this.updateLobbyPlayers();
                this.broadcastPlayers();
                break;
                
            case 'players':
                // Oyuncu listesi güncellendi
                console.log('Oyuncu listesi alındı:', data.players.length, 'oyuncu');
                data.players.forEach(p => {
                    if (p.id !== this.playerId) {
                        this.players.set(p.id, p);
                    }
                });
                this.updateLobbyPlayers();
                break;
                
            case 'start':
                // Yarış başlıyor
                console.log('Yarış başlıyor!');
                if (this.racing) {
                    this.racing.startRace();
                }
                break;
                
            case 'sync':
                // Oyuncu pozisyonu güncellendi
                this.handleSync(data);
                break;
                
            case 'finish':
                // Oyuncu bitirdi
                const finishedPlayer = this.players.get(data.id);
                if (finishedPlayer) {
                    finishedPlayer.finished = true;
                    finishedPlayer.finishTime = data.time;
                }
                break;
        }
    }
    
    handleSync(data) {
        // Kendi kendimizi güncellemeyelim
        if (data.id === this.playerId) return;
        
        let player = this.players.get(data.id);
        if (!player) {
            // Yeni oyuncu - oluştur
            player = {
                id: data.id,
                name: data.name || 'Oyuncu',
                vehicle: data.vehicleType || 'sport_gt',
                position: data.position,
                rotation: data.rotation,
                speed: data.speed,
                lap: data.lap || 1,
                checkpoint: data.checkpoint || 0
            };
            this.players.set(data.id, player);
        } else {
            // Mevcut oyuncuyu güncelle
            player.position = data.position;
            player.rotation = data.rotation;
            player.speed = data.speed;
            player.lap = data.lap;
            player.checkpoint = data.checkpoint;
        }
        
        // Remote aracı oluştur veya güncelle
        this.updateRemoteVehicle(data.id, player);
    }
    
    updateRemoteVehicle(playerId, player) {
        if (!this.racing || !this.racing.scene) return;
        
        let vehicleMesh = this.remoteVehicles.get(playerId);
        
        // Eğer araç yoksa oluştur
        if (!vehicleMesh && player.position) {
            console.log('Remote araç oluşturuluyor:', player.name);
            
            // Basit araç mesh'i oluştur
            const group = new THREE.Group();
            
            // Ana gövde
            const bodyGeo = new THREE.BoxGeometry(2.2, 0.8, 4.4);
            const bodyMat = new THREE.MeshPhongMaterial({ 
                color: this.getPlayerColor(playerId),
                shininess: 100
            });
            const body = new THREE.Mesh(bodyGeo, bodyMat);
            body.position.y = 0.5;
            body.castShadow = true;
            group.add(body);
            
            // Kabin
            const cabinGeo = new THREE.BoxGeometry(1.8, 0.5, 2.2);
            const cabinMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
            const cabin = new THREE.Mesh(cabinGeo, cabinMat);
            cabin.position.set(0, 1.0, -0.2);
            group.add(cabin);
            
            // Tekerlekler
            const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.35, 16);
            const wheelMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
            const wheelPositions = [
                [-1.1, 0.4, 1.4], [1.1, 0.4, 1.4],
                [-1.1, 0.4, -1.4], [1.1, 0.4, -1.4]
            ];
            wheelPositions.forEach(pos => {
                const wheel = new THREE.Mesh(wheelGeo, wheelMat);
                wheel.rotation.z = Math.PI / 2;
                wheel.position.set(pos[0], pos[1], pos[2]);
                group.add(wheel);
            });
            
            // İsim etiketi
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(0, 0, 256, 64);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(player.name || 'Oyuncu', 128, 42);
            
            const nameTexture = new THREE.CanvasTexture(canvas);
            const nameMaterial = new THREE.SpriteMaterial({ map: nameTexture });
            const nameSprite = new THREE.Sprite(nameMaterial);
            nameSprite.scale.set(5, 1.25, 1);
            nameSprite.position.y = 2.5;
            group.add(nameSprite);
            
            // Sahneye ekle
            group.position.set(player.position.x, player.position.y, player.position.z);
            this.racing.scene.add(group);
            this.remoteVehicles.set(playerId, group);
            vehicleMesh = group;
            
            console.log('Remote araç oluşturuldu:', player.name, 'Pozisyon:', player.position);
        }
        
        // Pozisyonu güncelle (interpolasyon)
        if (vehicleMesh && player.position) {
            const targetPos = new THREE.Vector3(
                player.position.x,
                player.position.y,
                player.position.z
            );
            vehicleMesh.position.lerp(targetPos, 0.3);
            
            if (player.rotation !== undefined) {
                // Açı interpolasyonu
                let targetRot = player.rotation;
                let currentRot = vehicleMesh.rotation.y;
                
                // En kısa yolu bul
                let diff = targetRot - currentRot;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                
                vehicleMesh.rotation.y += diff * 0.3;
            }
        }
    }
    
    removeRemoteVehicle(playerId) {
        const mesh = this.remoteVehicles.get(playerId);
        if (mesh && this.racing && this.racing.scene) {
            this.racing.scene.remove(mesh);
            this.remoteVehicles.delete(playerId);
        }
    }
    
    broadcastPlayers() {
        if (!this.isHost) return;
        
        const playerList = Array.from(this.players.values());
        console.log('Oyuncu listesi yayınlanıyor:', playerList.length);
        
        this.connections.forEach(conn => {
            if (conn.open) {
                conn.send({
                    type: 'players',
                    players: playerList
                });
            }
        });
    }
    
    broadcastStart() {
        console.log('Yarış başlatılıyor, bağlantı sayısı:', this.connections.size);
        
        this.connections.forEach(conn => {
            if (conn.open) {
                conn.send({ type: 'start' });
            }
        });
    }
    
    syncPosition(position, rotation, speed, lap, checkpoint) {
        const data = {
            type: 'sync',
            id: this.playerId,
            name: this.players.get(this.playerId)?.name || 'Oyuncu',
            vehicleType: this.racing?.selectedVehicle || 'sport_gt',
            position: { x: position.x, y: position.y, z: position.z },
            rotation: rotation,
            speed: speed,
            lap: lap,
            checkpoint: checkpoint
        };
        
        this.connections.forEach(conn => {
            if (conn.open) {
                conn.send(data);
            }
        });
    }
    
    sendFinish(time) {
        const data = {
            type: 'finish',
            id: this.playerId,
            time: time
        };
        
        this.connections.forEach(conn => {
            if (conn.open) {
                conn.send(data);
            }
        });
    }
    
    updateLobbyPlayers() {
        const container = document.getElementById('race-lobby-players');
        if (!container) return;
        
        // Host info box'ı koru
        const hostInfoBox = container.querySelector('.host-info-box');
        container.innerHTML = '';
        if (hostInfoBox) container.appendChild(hostInfoBox);
        
        this.players.forEach(player => {
            const div = document.createElement('div');
            div.className = 'lobby-player';
            div.innerHTML = `
                <span class="player-name">${player.name}</span>
                <span class="player-vehicle" style="color: #aaa; font-size: 0.8rem;">${player.vehicle || 'sport_gt'}</span>
                <span class="player-status">${player.isHost ? '👑 Host' : '✓ Hazır'}</span>
            `;
            div.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                background: rgba(255,255,255,0.05);
                border-radius: 5px;
                margin-bottom: 5px;
                color: white;
            `;
            container.appendChild(div);
        });
    }
    
    startSync() {
        // Her frame senkronizasyon - 30 FPS
        if (this.syncInterval) clearInterval(this.syncInterval);
        
        this.syncInterval = setInterval(() => {
            if (this.racing && this.racing.localPlayer && this.racing.localPlayer.vehicle) {
                const v = this.racing.localPlayer.vehicle;
                this.syncPosition(
                    v.mesh.position,
                    v.mesh.rotation.y,
                    v.getSpeed(),
                    this.racing.currentLap,
                    this.racing.currentCheckpoint
                );
            }
        }, 33); // ~30 FPS
    }
    
    stopSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }
    
    // Remote araçların fizik body'lerini al (çarpışma için)
    getRemoteVehicleBodies() {
        const bodies = [];
        this.remoteVehicles.forEach((mesh, id) => {
            bodies.push({
                id: id,
                position: mesh.position.clone(),
                rotation: mesh.rotation.y
            });
        });
        return bodies;
    }
    
    getPlayerColor(playerId) {
        // ID'den renk üret
        let hash = 0;
        for (let i = 0; i < playerId.length; i++) {
            hash = playerId.charCodeAt(i) + ((hash << 5) - hash);
        }
        const colors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12, 0x9b59b6, 0x1abc9c, 0xe67e22, 0x34495e];
        return colors[Math.abs(hash) % colors.length];
    }
}

// =====================================================
// HARİTA SİSTEMİ
// =====================================================

class RaceMap {
    constructor(name, config) {
        this.name = name;
        this.config = config;
        this.checkpoints = [];
        this.spawnPoints = [];
        this.ground = null;
        this.decorations = [];
    }
    
    load(scene) {
        // Zemin oluştur
        this.createGround(scene);
        
        // Checkpoint'leri oluştur
        this.createCheckpoints(scene);
        
        // Engelleri oluştur (yeni)
        this.createObstacles(scene);
        
        // Dekorasyonları ekle
        this.createDecorations(scene);
        
        return this;
    }
    
    createGround(scene) {
        // Ana zemin
        const groundGeometry = new THREE.PlaneGeometry(
            this.config.width || 500,
            this.config.length || 500
        );
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: this.config.groundColor || 0x333333
        });
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        scene.add(this.ground);
        
        // Pist çizgileri (opsiyonel)
        if (this.config.trackPath) {
            this.createTrack(scene);
        }
    }
    
    createTrack(scene) {
        // Pist yolu
        const trackGeometry = new THREE.PlaneGeometry(
            this.config.trackWidth || 20,
            this.config.length || 400
        );
        const trackMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x444444
        });
        const track = new THREE.Mesh(trackGeometry, trackMaterial);
        track.rotation.x = -Math.PI / 2;
        track.position.y = 0.01;
        scene.add(track);
        
        // Orta çizgi
        const lineGeometry = new THREE.PlaneGeometry(0.3, this.config.length || 400);
        const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const centerLine = new THREE.Mesh(lineGeometry, lineMaterial);
        centerLine.rotation.x = -Math.PI / 2;
        centerLine.position.y = 0.02;
        scene.add(centerLine);
    }
    
    createCheckpoints(scene) {
        if (!this.config.checkpoints) return;
        
        this.config.checkpoints.forEach((cp, index) => {
            const checkpoint = this.createCheckpoint(scene, cp, index);
            this.checkpoints.push(checkpoint);
        });
    }
    
    createCheckpoint(scene, config, index) {
        const width = config.width || 15;
        const height = config.height || 5;
        const cpType = config.type || 'gate';
        
        let checkpointMesh = null;
        
        if (cpType === 'car') {
            // =====================================================
            // ARABA SİMGESİ CHECKPOINT
            // =====================================================
            checkpointMesh = this.createCarCheckpointIcon(config);
            scene.add(checkpointMesh);
            
        } else if (cpType === 'finish' || config.isFinish) {
            // =====================================================
            // FİNİŞ ÇİZGİSİ
            // =====================================================
            // Sol direk
            const poleGeometry = new THREE.CylinderGeometry(0.4, 0.4, height, 8);
            const poleMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
            
            const leftPole = new THREE.Mesh(poleGeometry, poleMaterial);
            leftPole.position.set(config.x - width/2, height/2, config.z);
            scene.add(leftPole);
            
            const rightPole = new THREE.Mesh(poleGeometry.clone(), poleMaterial);
            rightPole.position.set(config.x + width/2, height/2, config.z);
            scene.add(rightPole);
            
            // Üst bar
            const barGeometry = new THREE.BoxGeometry(width, 0.6, 0.6);
            const barMaterial = new THREE.MeshLambertMaterial({ color: 0xffd700 });
            const topBar = new THREE.Mesh(barGeometry, barMaterial);
            topBar.position.set(config.x, height, config.z);
            scene.add(topBar);
            
            // Damalı bayrak
            const flagGeometry = new THREE.PlaneGeometry(width, 3);
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            
            const squareSize = 16;
            for (let x = 0; x < canvas.width; x += squareSize) {
                for (let y = 0; y < canvas.height; y += squareSize) {
                    ctx.fillStyle = ((x + y) / squareSize) % 2 === 0 ? '#000' : '#fff';
                    ctx.fillRect(x, y, squareSize, squareSize);
                }
            }
            
            const flagTexture = new THREE.CanvasTexture(canvas);
            const flagMaterial = new THREE.MeshBasicMaterial({ 
                map: flagTexture, 
                side: THREE.DoubleSide 
            });
            const flag = new THREE.Mesh(flagGeometry, flagMaterial);
            flag.position.set(config.x, height - 2, config.z);
            scene.add(flag);
            
            // Yerde damalı çizgi
            const groundFlag = new THREE.Mesh(
                new THREE.PlaneGeometry(width, 4),
                flagMaterial.clone()
            );
            groundFlag.rotation.x = -Math.PI / 2;
            groundFlag.position.set(config.x, 0.05, config.z);
            scene.add(groundFlag);
            
        } else {
            // =====================================================
            // NORMAL GATE CHECKPOINT
            // =====================================================
            const poleGeometry = new THREE.CylinderGeometry(0.3, 0.3, height, 8);
            const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
            
            const leftPole = new THREE.Mesh(poleGeometry, poleMaterial);
            leftPole.position.set(config.x - width/2, height/2, config.z);
            scene.add(leftPole);
            
            const rightPole = new THREE.Mesh(poleGeometry.clone(), poleMaterial);
            rightPole.position.set(config.x + width/2, height/2, config.z);
            scene.add(rightPole);
            
            const barGeometry = new THREE.BoxGeometry(width, 0.5, 0.5);
            const barMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
            const topBar = new THREE.Mesh(barGeometry, barMaterial);
            topBar.position.set(config.x, height, config.z);
            scene.add(topBar);
        }
        
        return {
            index: index,
            position: new THREE.Vector3(config.x, 0, config.z),
            width: width,
            type: cpType,
            mesh: checkpointMesh,  // Araba simgesi için referans (gizlemek için)
            isFinish: config.isFinish || false,
            passed: false
        };
    }
    
    // Araba simgesi checkpoint
    createCarCheckpointIcon(config) {
        const group = new THREE.Group();
        
        // Holografik araba simgesi (yarı saydam, parlayan)
        // Ana gövde
        const bodyGeo = new THREE.BoxGeometry(2, 0.6, 3.5);
        const hologramMat = new THREE.MeshBasicMaterial({ 
            color: 0x00ffff, 
            transparent: true, 
            opacity: 0.6,
            wireframe: false
        });
        const body = new THREE.Mesh(bodyGeo, hologramMat);
        body.position.y = 0.5;
        group.add(body);
        
        // Kabin
        const cabinGeo = new THREE.BoxGeometry(1.6, 0.4, 1.8);
        const cabin = new THREE.Mesh(cabinGeo, hologramMat);
        cabin.position.set(0, 0.9, -0.2);
        group.add(cabin);
        
        // Tekerlekler (daire)
        const wheelGeo = new THREE.TorusGeometry(0.35, 0.1, 8, 16);
        const wheelMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8 });
        const wheelPositions = [[-0.9, 0.35, 1.2], [0.9, 0.35, 1.2], [-0.9, 0.35, -1.2], [0.9, 0.35, -1.2]];
        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.rotation.y = Math.PI / 2;
            wheel.position.set(pos[0], pos[1], pos[2]);
            group.add(wheel);
        });
        
        // Parlama efekti (ışık halkası)
        const glowGeo = new THREE.RingGeometry(3, 4, 32);
        const glowMat = new THREE.MeshBasicMaterial({ 
            color: 0x00ffff, 
            transparent: true, 
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.rotation.x = -Math.PI / 2;
        glow.position.y = 0.1;
        group.add(glow);
        
        // Yukarı bakan ok
        const arrowShape = new THREE.Shape();
        arrowShape.moveTo(0, 1.5);
        arrowShape.lineTo(-0.8, 0);
        arrowShape.lineTo(-0.3, 0);
        arrowShape.lineTo(-0.3, -1);
        arrowShape.lineTo(0.3, -1);
        arrowShape.lineTo(0.3, 0);
        arrowShape.lineTo(0.8, 0);
        arrowShape.lineTo(0, 1.5);
        
        const arrowGeo = new THREE.ShapeGeometry(arrowShape);
        const arrow = new THREE.Mesh(arrowGeo, new THREE.MeshBasicMaterial({ 
            color: 0x00ff00, 
            transparent: true, 
            opacity: 0.8,
            side: THREE.DoubleSide
        }));
        arrow.rotation.x = -Math.PI / 2;
        arrow.position.set(0, 0.15, 0);
        arrow.scale.set(1.5, 1.5, 1);
        group.add(arrow);
        
        // Pozisyon ve havada dönen animasyon için
        group.position.set(config.x, 2, config.z);
        group.userData.rotationSpeed = 0.02;
        group.userData.floatOffset = Math.random() * Math.PI * 2;
        
        return group;
    }
    
    createDecorations(scene) {
        // Kenar bariyerleri
        const barrierMaterial = new THREE.MeshLambertMaterial({ color: 0xff3333 });
        
        if (this.config.barriers) {
            this.config.barriers.forEach(b => {
                // Uzun bariyer - yol kenarı
                const barrierGeometry = new THREE.BoxGeometry(0.5, 1.2, b.length || 10);
                const barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
                barrier.position.set(b.x, 0.6, b.z || 0);
                barrier.rotation.y = b.rotation || 0;
                barrier.castShadow = true;
                scene.add(barrier);
                this.decorations.push(barrier);
                
                // Üst şerit (beyaz-kırmızı)
                const stripeGeo = new THREE.BoxGeometry(0.55, 0.1, b.length || 10);
                const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
                const stripe = new THREE.Mesh(stripeGeo, stripeMat);
                stripe.position.set(b.x, 1.25, b.z || 0);
                scene.add(stripe);
                this.decorations.push(stripe);
            });
        }
        
        // Ağaçlar
        if (this.config.trees) {
            this.config.trees.forEach(t => {
                const tree = this.createTree(t.x, t.z);
                scene.add(tree);
                this.decorations.push(tree);
            });
        }
    }
    
    // Engel oluşturma sistemi
    createObstacles(scene) {
        if (!this.config.obstacles) return;
        
        this.config.obstacles.forEach(obs => {
            let obstacle = null;
            
            switch(obs.type) {
                case 'barrier':
                    obstacle = this.createBarrierObstacle(obs);
                    break;
                case 'ramp':
                    obstacle = this.createRamp(obs);
                    break;
                case 'cone':
                    obstacle = this.createCones(scene, obs);
                    return; // Koniler ayrı ekleniyor
                case 'narrowing':
                    obstacle = this.createNarrowing(scene, obs);
                    return; // Ayrı ekleniyor
            }
            
            if (obstacle) {
                obstacle.position.set(obs.x, 0, obs.z);
                scene.add(obstacle);
                this.decorations.push(obstacle);
            }
        });
    }
    
    createBarrierObstacle(config) {
        const group = new THREE.Group();
        
        const width = config.width || 4;
        const height = config.height || 1;
        
        // Ana bariyer
        const barrierGeo = new THREE.BoxGeometry(width, height, 1);
        const barrierMat = new THREE.MeshPhongMaterial({ color: 0xff6600 });
        const barrier = new THREE.Mesh(barrierGeo, barrierMat);
        barrier.position.y = height / 2;
        barrier.castShadow = true;
        group.add(barrier);
        
        // Uyarı şeritleri
        const stripeCanvas = document.createElement('canvas');
        stripeCanvas.width = 64;
        stripeCanvas.height = 64;
        const ctx = stripeCanvas.getContext('2d');
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#000';
        for (let i = -64; i < 128; i += 16) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + 32, 64);
            ctx.lineTo(i + 40, 64);
            ctx.lineTo(i + 8, 0);
            ctx.fill();
        }
        const stripeTexture = new THREE.CanvasTexture(stripeCanvas);
        stripeTexture.wrapS = THREE.RepeatWrapping;
        stripeTexture.wrapT = THREE.RepeatWrapping;
        stripeTexture.repeat.set(width / 2, 1);
        
        const stripeMat = new THREE.MeshBasicMaterial({ map: stripeTexture });
        const stripeGeo = new THREE.BoxGeometry(width, height * 0.3, 1.02);
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.y = height - height * 0.15;
        group.add(stripe);
        
        return group;
    }
    
    createRamp(config) {
        const group = new THREE.Group();
        const width = config.width || 5;
        
        // Rampa şekli
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.lineTo(4, 0);
        shape.lineTo(4, 0.8);
        shape.lineTo(0, 0);
        
        const extrudeSettings = { depth: width, bevelEnabled: false };
        const rampGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        const rampMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
        const ramp = new THREE.Mesh(rampGeo, rampMat);
        ramp.rotation.y = Math.PI / 2;
        ramp.position.x = -width / 2;
        ramp.castShadow = true;
        group.add(ramp);
        
        // Sarı şeritler
        const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        for (let i = -width/2 + 0.5; i < width/2; i += 1) {
            const stripeGeo = new THREE.BoxGeometry(0.1, 0.05, 3);
            const stripe = new THREE.Mesh(stripeGeo, stripeMat);
            stripe.position.set(i, 0.5, 2);
            stripe.rotation.x = -0.2;
            group.add(stripe);
        }
        
        return group;
    }
    
    createCones(scene, config) {
        const count = config.count || 3;
        const spacing = 2;
        
        for (let i = 0; i < count; i++) {
            const coneGroup = new THREE.Group();
            
            // Koni gövdesi
            const coneGeo = new THREE.ConeGeometry(0.3, 0.8, 8);
            const coneMat = new THREE.MeshPhongMaterial({ color: 0xff6600 });
            const cone = new THREE.Mesh(coneGeo, coneMat);
            cone.position.y = 0.4;
            cone.castShadow = true;
            coneGroup.add(cone);
            
            // Beyaz şerit
            const ringGeo = new THREE.TorusGeometry(0.22, 0.03, 8, 16);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2;
            ring.position.y = 0.5;
            coneGroup.add(ring);
            
            // Taban
            const baseGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 8);
            const baseMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
            const base = new THREE.Mesh(baseGeo, baseMat);
            base.position.y = 0.05;
            coneGroup.add(base);
            
            // Pozisyon
            const offsetX = (i - (count - 1) / 2) * spacing;
            coneGroup.position.set(config.x + offsetX, 0, config.z);
            
            scene.add(coneGroup);
            this.decorations.push(coneGroup);
        }
    }
    
    createNarrowing(scene, config) {
        const width = config.width || 15;
        const gap = 10; // Geçiş için boşluk
        
        // Sol bariyer
        const leftBarrier = this.createBarrierObstacle({ width: (width - gap) / 2, height: 1.2 });
        leftBarrier.position.set(config.x - gap/2 - (width - gap)/4, 0, config.z);
        scene.add(leftBarrier);
        this.decorations.push(leftBarrier);
        
        // Sağ bariyer
        const rightBarrier = this.createBarrierObstacle({ width: (width - gap) / 2, height: 1.2 });
        rightBarrier.position.set(config.x + gap/2 + (width - gap)/4, 0, config.z);
        scene.add(rightBarrier);
        this.decorations.push(rightBarrier);
    }
    
    createTree(x, z) {
        const group = new THREE.Group();
        
        // Gövde
        const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, 3, 8);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 1.5;
        group.add(trunk);
        
        // Yapraklar
        const leavesGeometry = new THREE.ConeGeometry(2, 4, 8);
        const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = 5;
        group.add(leaves);
        
        group.position.set(x, 0, z);
        return group;
    }
    
    getSpawnPoint(index) {
        if (this.config.spawnPoints && this.config.spawnPoints[index]) {
            return this.config.spawnPoints[index];
        }
        // Varsayılan spawn
        return { x: index * 5, y: 0.5, z: 0, rotation: 0 };
    }
    
    checkCheckpoint(position, currentCheckpoint) {
        const cp = this.checkpoints[currentCheckpoint];
        if (!cp) return -1;
        
        const distance = position.distanceTo(cp.position);
        if (distance < cp.width / 2 + 5) {
            return currentCheckpoint;
        }
        return -1;
    }
    
    unload(scene) {
        if (this.ground) scene.remove(this.ground);
        this.checkpoints.forEach(cp => {
            // Checkpoint mesh'lerini kaldır (eğer referans tutuluyorsa)
        });
        this.decorations.forEach(d => scene.remove(d));
        this.decorations = [];
    }
}

// =====================================================
// VARSAYILAN HARİTALAR - GELİŞTİRİLMİŞ
// =====================================================

const DefaultMaps = {
    'face-to-face-1': {
        name: 'Face to Face - Engelli Parkur',
        mode: 'face-to-face',
        width: 60,          // İnce harita
        length: 800,        // Uzun harita
        trackWidth: 25,
        groundColor: 0x1a1a2e,
        trackPath: true,
        
        // Oyuncular karşı karşıya spawn olacak
        spawnPoints: [
            { x: 0, y: 1.5, z: 350, rotation: Math.PI },   // Oyuncu 1 - Güneyde, kuzeye bakıyor
            { x: 0, y: 1.5, z: -350, rotation: 0 }          // Oyuncu 2 - Kuzeyde, güneye bakıyor
        ],
        
        // Ara checkpointler (araba simgesi olacak)
        checkpoints: [
            { x: 0, z: 200, width: 25, type: 'car', playerSpawn: 1 },    // Oyuncu 1'in checkpoint'i
            { x: 0, z: 100, width: 25, type: 'car', playerSpawn: 1 },
            { x: 0, z: 0, width: 25, type: 'finish', isFinish: true },   // Ortada buluşma/bitiş
            { x: 0, z: -100, width: 25, type: 'car', playerSpawn: 2 },
            { x: 0, z: -200, width: 25, type: 'car', playerSpawn: 2 }    // Oyuncu 2'nin checkpoint'i
        ],
        
        // Engeller - Rastgele dağılmış
        obstacles: [
            // Oyuncu 1 tarafı engeller
            { x: -8, z: 280, type: 'barrier', width: 6, height: 1.5 },
            { x: 6, z: 240, type: 'ramp', width: 5 },
            { x: -5, z: 180, type: 'cone', count: 3 },
            { x: 8, z: 150, type: 'barrier', width: 4, height: 1 },
            { x: 0, z: 120, type: 'narrowing', width: 15 },  // Yol daralması
            { x: -7, z: 80, type: 'barrier', width: 5, height: 1.2 },
            { x: 5, z: 50, type: 'cone', count: 4 },
            
            // Oyuncu 2 tarafı engeller (simetrik)
            { x: 8, z: -280, type: 'barrier', width: 6, height: 1.5 },
            { x: -6, z: -240, type: 'ramp', width: 5 },
            { x: 5, z: -180, type: 'cone', count: 3 },
            { x: -8, z: -150, type: 'barrier', width: 4, height: 1 },
            { x: 0, z: -120, type: 'narrowing', width: 15 },
            { x: 7, z: -80, type: 'barrier', width: 5, height: 1.2 },
            { x: -5, z: -50, type: 'cone', count: 4 }
        ],
        
        // Kenar bariyerleri
        barriers: [
            { x: -14, z: 0, length: 750, rotation: 0 },
            { x: 14, z: 0, length: 750, rotation: 0 }
        ],
        
        // Checkpoint aldığında araç değişsin mi?
        vehicleChangeOnCheckpoint: true
    },
    
    'sprint-1': {
        name: 'Sprint - Şehir',
        mode: 'sprint',
        width: 100,
        length: 1200,
        trackWidth: 30,
        groundColor: 0x333333,
        trackPath: true,
        spawnPoints: [
            { x: -6, y: 1.5, z: 550, rotation: Math.PI },
            { x: 6, y: 1.5, z: 550, rotation: Math.PI },
            { x: -6, y: 1.5, z: 560, rotation: Math.PI },
            { x: 6, y: 1.5, z: 560, rotation: Math.PI }
        ],
        checkpoints: [
            { x: 0, z: 350, width: 30, type: 'gate' },
            { x: 0, z: 100, width: 30, type: 'gate' },
            { x: 0, z: -150, width: 30, type: 'gate' },
            { x: 0, z: -400, width: 30, type: 'gate' },
            { x: 0, z: -550, width: 30, type: 'finish', isFinish: true }
        ],
        obstacles: [
            { x: -8, z: 450, type: 'barrier', width: 6, height: 1.5 },
            { x: 8, z: 300, type: 'cone', count: 5 },
            { x: 0, z: 200, type: 'ramp', width: 6 },
            { x: -10, z: 0, type: 'barrier', width: 5, height: 1 },
            { x: 10, z: -100, type: 'barrier', width: 5, height: 1 },
            { x: 0, z: -250, type: 'narrowing', width: 18 },
            { x: -6, z: -350, type: 'cone', count: 4 },
            { x: 6, z: -480, type: 'barrier', width: 4, height: 1.2 }
        ],
        barriers: [
            { x: -18, z: 0, length: 1150, rotation: 0 },
            { x: 18, z: 0, length: 1150, rotation: 0 }
        ]
    },
    
    'circuit-1': {
        name: 'Circuit - Oval',
        mode: 'circuit',
        width: 200,
        length: 400,
        trackWidth: 30,
        groundColor: 0x3d6b3d,
        trackPath: true,
        spawnPoints: [
            { x: -6, y: 1.5, z: 150, rotation: Math.PI },
            { x: 6, y: 1.5, z: 150, rotation: Math.PI },
            { x: -6, y: 1.5, z: 160, rotation: Math.PI },
            { x: 6, y: 1.5, z: 160, rotation: Math.PI }
        ],
        checkpoints: [
            { x: 0, z: 80, width: 35, type: 'gate' },
            { x: 0, z: -80, width: 35, type: 'gate' },
            { x: 0, z: 150, width: 35, type: 'finish', isFinish: true }
        ]
    },
    
    'drag-1': {
        name: 'Drag Race - 400m',
        mode: 'drag',
        width: 50,
        length: 600,
        trackWidth: 16,
        groundColor: 0x222222,
        trackPath: true,
        spawnPoints: [
            { x: -3, y: 1.5, z: 250, rotation: Math.PI },
            { x: 3, y: 1.5, z: 250, rotation: Math.PI }
        ],
        checkpoints: [
            { x: 0, z: -250, width: 16, type: 'finish', isFinish: true }
        ],
        barriers: [
            { x: -10, z: 0, length: 550, rotation: 0 },
            { x: 10, z: 0, length: 550, rotation: 0 }
        ]
    }
};

// Global
window.RaceMultiplayer = RaceMultiplayer;
window.RaceMap = RaceMap;
window.DefaultMaps = DefaultMaps;
