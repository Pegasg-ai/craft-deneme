// =====================================================
// FIVEM TO - YARIŞ UI VE HUD
// =====================================================

function createRacingUI() {
    // Ana container zaten var mı kontrol et
    if (document.getElementById('racing-ui')) return;
    
    const uiContainer = document.createElement('div');
    uiContainer.id = 'racing-ui';
    uiContainer.innerHTML = `
        <!-- Yarış Lobisi -->
        <div id="race-lobby" class="race-overlay">
            <div class="race-lobby-panel">
                <h1 class="race-lobby-title">🏎️ FIVEM TO</h1>
                <div class="race-mode-select">
                    <h3>YARIŞ MODU SEÇ</h3>
                    <div class="race-mode-buttons">
                        <button class="race-mode-btn active" data-mode="face-to-face">
                            <span class="mode-icon">🔄</span>
                            <span class="mode-name">Face to Face</span>
                            <span class="mode-desc">Karşılıklı yarış, araç değiştir!</span>
                        </button>
                        <button class="race-mode-btn" data-mode="sprint">
                            <span class="mode-icon">🏁</span>
                            <span class="mode-name">Sprint</span>
                            <span class="mode-desc">A'dan B'ye en hızlı ol!</span>
                        </button>
                        <button class="race-mode-btn" data-mode="circuit">
                            <span class="mode-icon">🔁</span>
                            <span class="mode-name">Circuit</span>
                            <span class="mode-desc">Tur yarışı, lap'leri tamamla!</span>
                        </button>
                        <button class="race-mode-btn" data-mode="drag">
                            <span class="mode-icon">⚡</span>
                            <span class="mode-name">Drag Race</span>
                            <span class="mode-desc">Düz çizgide hızlan!</span>
                        </button>
                    </div>
                </div>
                
                <div class="race-vehicle-select">
                    <h3>ARAÇ SEÇ</h3>
                    <div class="vehicle-categories" id="vehicle-categories">
                        <!-- Categories injected by JS -->
                    </div>
                    <div class="vehicle-select-layout">
                        <div id="vehicle-list-container" class="vehicle-cards">
                            <!-- Vehicles injected by JS -->
                        </div>
                        <div id="vehicle-preview-3d" class="vehicle-preview-3d">
                            <!-- 3D önizleme burada render edilecek -->
                        </div>
                    </div>
                </div>
                
                <div class="race-multiplayer-section">
                    <h3>ÇOK OYUNCULU</h3>
                    <div class="multiplayer-options">
                        <input type="text" id="race-player-name" placeholder="Oyuncu İsmi" value="Racer">
                        <div class="multiplayer-buttons">
                            <button id="btn-race-host" class="race-btn">SUNUCU OL</button>
                            <input type="text" id="race-join-id" placeholder="Sunucu ID">
                            <button id="btn-race-join" class="race-btn primary">KATIL</button>
                        </div>
                        <div id="race-lobby-players" class="lobby-players"></div>
                    </div>
                </div>
                
                <div class="race-lobby-actions">
                    <button id="btn-race-back" class="race-btn secondary">← GERİ</button>
                    <button id="btn-race-start" class="race-btn primary large">YARIŞI BAŞLAT</button>
                </div>
            </div>
        </div>
        
        <!-- Geri Sayım -->
        <div id="race-countdown" class="race-overlay" style="display:none;">
            <div class="countdown-number">3</div>
        </div>
        
        <!-- Oyun İçi HUD -->
        <div id="race-hud" style="display:none;">
            <!-- Hız göstergesi -->
            <div class="speedometer">
                <div class="speed-value"><span id="speed-number">0</span></div>
                <div class="speed-unit">KM/H</div>
                <div class="speed-bar">
                    <div class="speed-fill" id="speed-fill"></div>
                </div>
            </div>
            
            <!-- Pozisyon ve Tur -->
            <div class="race-info">
                <div class="race-position">
                    <span class="position-number" id="race-position">1</span>
                    <span class="position-suffix">st</span>
                </div>
                <div class="race-lap">
                    <span>TUR</span>
                    <span id="current-lap">1</span>/<span id="total-laps">3</span>
                </div>
            </div>
            
            <!-- Zaman -->
            <div class="race-timer">
                <div class="timer-current">
                    <span>SÜRE</span>
                    <span id="race-time">00:00.000</span>
                </div>
                <div class="timer-best">
                    <span>EN İYİ</span>
                    <span id="best-lap-time">--:--.---</span>
                </div>
            </div>
            
            <!-- Mini Harita -->
            <div class="minimap">
                <canvas id="minimap-canvas" width="150" height="150"></canvas>
            </div>
            
            <!-- Checkpoint göstergesi -->
            <div class="checkpoint-indicator" id="checkpoint-indicator" style="display:none;">
                <span>✓ CHECKPOINT</span>
            </div>
            
            <!-- Kamera modu -->
            <div class="camera-mode-indicator">
                <span id="camera-mode-text">1. Şahıs (V ile değiştir)</span>
            </div>
            
            <!-- Kontroller bilgisi -->
            <div class="controls-info">
                <span>W/S: Gaz/Fren | A/D: Direksiyon | SPACE: El Freni | V: Kamera</span>
            </div>
        </div>
        
        <!-- Yarış Sonu -->
        <div id="race-finish" class="race-overlay" style="display:none;">
            <div class="finish-panel">
                <h1 class="finish-title">🏆 YARIŞ BİTTİ!</h1>
                <div class="finish-results">
                    <div class="result-row header">
                        <span>SIRA</span>
                        <span>OYUNCU</span>
                        <span>SÜRE</span>
                    </div>
                    <div id="finish-results-list"></div>
                </div>
                <div class="finish-actions">
                    <button id="btn-race-again" class="race-btn primary">TEKRAR YARIŞ</button>
                    <button id="btn-race-lobby" class="race-btn">LOBİYE DÖN</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(uiContainer);
    
    // CSS ekle
    addRacingStyles();
    
    // Event listener'ları ekle
    setupRacingUIEvents();
}

function addRacingStyles() {
    if (document.getElementById('racing-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'racing-styles';
    styles.textContent = `
        /* Racing UI Genel */
        #racing-ui {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 100;
            font-family: 'Segoe UI', sans-serif;
        }
        
        #racing-ui * {
            pointer-events: auto;
        }
        
        .race-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, rgba(15, 15, 30, 0.95) 0%, rgba(30, 30, 60, 0.95) 100%);
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        /* Lobi Panel */
        .race-lobby-panel {
            background: rgba(0, 0, 0, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 30px;
            max-width: 900px;
            width: 90%;
            max-height: 85vh;
            overflow-y: auto;
        }
        
        .race-lobby-title {
            text-align: center;
            font-size: 3rem;
            color: #ff6b6b;
            margin-bottom: 20px;
            text-shadow: 0 0 30px rgba(255, 107, 107, 0.5);
        }
        
        /* Mod Seçimi */
        .race-mode-select h3,
        .race-vehicle-select h3,
        .race-multiplayer-section h3 {
            color: #48dbfb;
            font-size: 1.2rem;
            margin-bottom: 15px;
            border-bottom: 2px solid rgba(72, 219, 251, 0.3);
            padding-bottom: 10px;
        }
        
        .race-mode-buttons {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 25px;
        }
        
        .race-mode-btn {
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 20px 15px;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
        }
        
        .race-mode-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.3);
            transform: translateY(-3px);
        }
        
        .race-mode-btn.active {
            background: linear-gradient(135deg, rgba(255, 107, 107, 0.2) 0%, rgba(255, 107, 107, 0.1) 100%);
            border-color: #ff6b6b;
            box-shadow: 0 0 20px rgba(255, 107, 107, 0.3);
        }
        
        .mode-icon {
            font-size: 2rem;
        }
        
        .mode-name {
            color: white;
            font-weight: bold;
            font-size: 1rem;
        }
        
        .mode-desc {
            color: rgba(255, 255, 255, 0.5);
            font-size: 0.75rem;
            text-align: center;
        }
        
        /* Araç Seçimi */
        .vehicle-select-layout {
            display: grid;
            grid-template-columns: 1fr 300px;
            gap: 20px;
            margin-bottom: 25px;
        }
        
        .vehicle-cards {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 12px;
            max-height: 320px;
            overflow-y: auto;
            padding-right: 10px;
        }
        
        .vehicle-preview-3d {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border-radius: 15px;
            border: 2px solid rgba(72, 219, 251, 0.3);
            min-height: 250px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(255, 255, 255, 0.3);
            font-size: 0.9rem;
        }
        
        .vehicle-preview-3d canvas {
            border-radius: 13px;
        }
        
        @media (max-width: 800px) {
            .vehicle-select-layout {
                grid-template-columns: 1fr;
            }
            .vehicle-preview-3d {
                display: none;
            }
        }
        
        .vehicle-card {
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 12px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .vehicle-card:hover {
            transform: translateY(-3px);
            border-color: rgba(255, 255, 255, 0.3);
        }
        
        .vehicle-card.active {
            border-color: #48dbfb;
            box-shadow: 0 0 20px rgba(72, 219, 251, 0.3);
        }
        
        .vehicle-preview {
            height: 50px;
            border-radius: 8px;
            margin-bottom: 8px;
        }
        
        .vehicle-preview.sport { background: linear-gradient(135deg, #ff4444, #cc0000); }
        .vehicle-preview.muscle { background: linear-gradient(135deg, #4444ff, #0000cc); }
        .vehicle-preview.super { background: linear-gradient(135deg, #ffff00, #cccc00); }
        .vehicle-preview.suv { background: linear-gradient(135deg, #44ff44, #00cc00); }
        
        .vehicle-info {
            margin-bottom: 8px;
        }
        
        .vehicle-manufacturer {
            font-size: 0.65rem;
            color: rgba(255, 255, 255, 0.5);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .vehicle-name {
            color: white;
            font-weight: bold;
            font-size: 0.9rem;
        }
        
        .no-vehicles {
            grid-column: 1 / -1;
            text-align: center;
            color: rgba(255, 255, 255, 0.4);
            padding: 40px;
        }
        
        .vehicle-stats .stat {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 4px;
            font-size: 0.7rem;
            color: rgba(255, 255, 255, 0.7);
        }
        
        .vehicle-stats .stat > span:first-child {
            min-width: 65px;
        }
        
        .stat-value {
            min-width: 30px;
            text-align: right;
            font-weight: bold;
            color: #48dbfb;
        }
        
        .stat-bar {
            flex: 1;
            height: 6px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
            overflow: hidden;
        }
        
        .stat-bar div {
            height: 100%;
            background: linear-gradient(90deg, #48dbfb, #0abde3);
            border-radius: 3px;
        }
        
        /* Multiplayer */
        .multiplayer-options {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .multiplayer-buttons {
            display: flex;
            gap: 10px;
        }
        
        #race-player-name,
        #race-join-id {
            flex: 1;
            padding: 12px 15px;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            color: white;
            font-size: 1rem;
        }
        
        .lobby-players {
            margin-top: 10px;
            padding: 10px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
            min-height: 40px;
        }
        
        /* Butonlar */
        .race-btn {
            padding: 12px 25px;
            border: none;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
            background: rgba(255, 255, 255, 0.1);
            color: white;
        }
        
        .race-btn:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
        }
        
        .race-btn.primary {
            background: linear-gradient(135deg, #ff6b6b, #ee5253);
        }
        
        .race-btn.primary:hover {
            background: linear-gradient(135deg, #ff8787, #ff6b6b);
            box-shadow: 0 5px 20px rgba(255, 107, 107, 0.4);
        }
        
        .race-btn.large {
            padding: 15px 40px;
            font-size: 1.2rem;
        }
        
        .race-lobby-actions {
            display: flex;
            justify-content: space-between;
            margin-top: 25px;
        }
        
        /* Geri Sayım */
        .countdown-number {
            font-size: 15rem;
            font-weight: 900;
            color: white;
            text-shadow: 0 0 50px rgba(255, 107, 107, 0.8);
            animation: countdownPulse 1s ease-in-out;
        }
        
        @keyframes countdownPulse {
            0% { transform: scale(0.5); opacity: 0; }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); opacity: 1; }
        }
        
        /* HUD */
        #race-hud {
            pointer-events: none;
        }
        
        /* Hız göstergesi */
        .speedometer {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: rgba(0, 0, 0, 0.7);
            border: 2px solid rgba(255, 107, 107, 0.5);
            border-radius: 15px;
            padding: 20px;
            text-align: center;
            min-width: 120px;
        }
        
        .speed-value {
            font-size: 3rem;
            font-weight: 900;
            color: #ff6b6b;
        }
        
        .speed-unit {
            font-size: 0.9rem;
            color: rgba(255, 255, 255, 0.6);
            margin-top: -5px;
        }
        
        .speed-bar {
            margin-top: 10px;
            height: 8px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            overflow: hidden;
        }
        
        .speed-fill {
            height: 100%;
            background: linear-gradient(90deg, #ff6b6b, #feca57);
            width: 0%;
            transition: width 0.1s;
        }
        
        /* Pozisyon ve Tur */
        .race-info {
            position: fixed;
            top: 30px;
            right: 30px;
            display: flex;
            gap: 20px;
        }
        
        .race-position {
            background: rgba(0, 0, 0, 0.7);
            border: 2px solid #feca57;
            border-radius: 10px;
            padding: 10px 20px;
        }
        
        .position-number {
            font-size: 2.5rem;
            font-weight: 900;
            color: #feca57;
        }
        
        .position-suffix {
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.6);
        }
        
        .race-lap {
            background: rgba(0, 0, 0, 0.7);
            border: 2px solid #48dbfb;
            border-radius: 10px;
            padding: 10px 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .race-lap span:first-child {
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.6);
        }
        
        /* Zaman */
        .race-timer {
            position: fixed;
            top: 30px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 30px;
            background: rgba(0, 0, 0, 0.7);
            border-radius: 10px;
            padding: 10px 25px;
        }
        
        .timer-current, .timer-best {
            text-align: center;
        }
        
        .timer-current span:first-child,
        .timer-best span:first-child {
            display: block;
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.5);
        }
        
        #race-time {
            font-size: 1.5rem;
            font-weight: bold;
            color: white;
        }
        
        #best-lap-time {
            font-size: 1.2rem;
            color: #48dbfb;
        }
        
        /* Mini Harita */
        .minimap {
            position: fixed;
            bottom: 30px;
            left: 30px;
            background: rgba(0, 0, 0, 0.7);
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            padding: 5px;
        }
        
        #minimap-canvas {
            border-radius: 5px;
        }
        
        /* Checkpoint */
        .checkpoint-indicator {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(72, 219, 251, 0.9);
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 1.5rem;
            font-weight: bold;
            color: white;
            animation: checkpointFlash 0.5s ease-out;
        }
        
        @keyframes checkpointFlash {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
            50% { transform: translate(-50%, -50%) scale(1.1); }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        
        /* Kamera ve Kontrol bilgisi */
        .camera-mode-indicator {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.5);
            padding: 8px 15px;
            border-radius: 5px;
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.85rem;
        }
        
        .controls-info {
            position: fixed;
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
            color: rgba(255, 255, 255, 0.4);
            font-size: 0.75rem;
        }
        
        /* Bitiş Ekranı */
        .finish-panel {
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #feca57;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            min-width: 500px;
        }
        
        .finish-title {
            font-size: 3rem;
            color: #feca57;
            margin-bottom: 30px;
        }
        
        .finish-results {
            margin-bottom: 30px;
        }
        
        .result-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .result-row.header {
            color: rgba(255, 255, 255, 0.5);
            font-size: 0.85rem;
        }
        
        .finish-actions {
            display: flex;
            gap: 15px;
            justify-content: center;
        }

        /* Kategori Seçimi */
        .vehicle-categories {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            overflow-x: auto;
            padding-bottom: 5px;
        }
        
        .category-btn {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: rgba(255, 255, 255, 0.7);
            padding: 8px 15px;
            border-radius: 20px;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.2s;
            font-size: 0.9rem;
        }
        
        .category-btn:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        
        .category-btn.active {
            background: #feca57;
            color: #000;
            border-color: #feca57;
            font-weight: bold;
        }
        
        /* Responsive */
        @media (max-width: 900px) {
            .race-mode-buttons,
            .vehicle-cards {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    `;
    document.head.appendChild(styles);
}

function initVehiclePreview() {
    // 3D araç önizleme paneli
    const previewContainer = document.getElementById('vehicle-preview-3d');
    if (previewContainer && window.VehicleManager) {
        window.VehicleManager.initPreview(previewContainer);
    }
}

function renderCategories() {
    const container = document.getElementById('vehicle-categories');
    if (!container) return;
    
    container.innerHTML = '';
    
    // VehicleManager varsa ondan al, yoksa legacy VehicleCategory
    let categories = [];
    if (window.VehicleManager && window.VehicleManager.loaded) {
        categories = window.VehicleManager.getCategories();
    } else if (typeof VehicleCategory !== 'undefined') {
        categories = Object.values(VehicleCategory).map(id => ({ id, name: id, icon: '🚗' }));
    }
    
    categories.forEach((cat, index) => {
        const catId = cat.id || cat;
        const catName = cat.name || catId;
        const catIcon = cat.icon || '🚗';
        
        const btn = document.createElement('button');
        btn.className = `category-btn ${index === 0 ? 'active' : ''}`;
        btn.innerHTML = `<span class="cat-icon">${catIcon}</span> ${catName}`;
        btn.dataset.category = catId;
        
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderVehicleList(catId);
        });
        
        container.appendChild(btn);
    });
    
    // İlk kategoriyi render et
    if (categories.length > 0) {
        const firstCat = categories[0].id || categories[0];
        renderVehicleList(firstCat);
    }
}

function renderVehicleList(category) {
    const container = document.getElementById('vehicle-list-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // VehicleManager varsa ondan al, yoksa legacy
    let vehicles = [];
    if (window.VehicleManager && window.VehicleManager.loaded) {
        vehicles = window.VehicleManager.getVehiclesByCategory(category);
    } else if (typeof VehicleStats !== 'undefined') {
        vehicles = Object.entries(VehicleStats)
            .filter(([id, stats]) => stats.category === category)
            .map(([id, stats]) => ({ id, ...stats }));
    }
    
    if (vehicles.length === 0) {
        container.innerHTML = '<div class="no-vehicles">Bu kategoride araç yok</div>';
        return;
    }
    
    vehicles.forEach((v, index) => {
        const card = document.createElement('div');
        card.className = `vehicle-card ${index === 0 ? 'active' : ''}`;
        card.dataset.vehicle = v.id;
        
        // İstatistikleri hesapla (VehicleManager varsa daha iyi hesap)
        let speedPercent, accelPercent, handlingPercent;
        if (window.VehicleManager) {
            speedPercent = window.VehicleManager.getStatsAsPercent(v, 'maxSpeed');
            accelPercent = window.VehicleManager.getStatsAsPercent(v, 'acceleration');
            handlingPercent = window.VehicleManager.getStatsAsPercent(v, 'handling');
        } else {
            speedPercent = Math.min(100, (v.maxSpeed / 300) * 100);
            accelPercent = Math.min(100, (v.acceleration / 50) * 100);
            handlingPercent = Math.min(100, (v.handling / 4) * 100);
        }
        
        const yearText = v.year ? ` (${v.year})` : '';
        const manufacturerText = v.manufacturer ? `<span class="vehicle-manufacturer">${v.manufacturer}</span>` : '';
        
        card.innerHTML = `
            <div class="vehicle-preview" style="background-color: ${typeof v.color === 'number' ? '#' + v.color.toString(16).padStart(6, '0') : (v.color || '#3498db')}"></div>
            <div class="vehicle-info">
                ${manufacturerText}
                <div class="vehicle-name">${v.name}${yearText}</div>
            </div>
            <div class="vehicle-stats">
                <div class="stat"><span>🚀 Hız</span><div class="stat-bar"><div style="width:${speedPercent}%"></div></div><span class="stat-value">${v.maxSpeed || 0}</span></div>
                <div class="stat"><span>⚡ İvme</span><div class="stat-bar"><div style="width:${accelPercent}%"></div></div><span class="stat-value">${v.acceleration || 0}</span></div>
                <div class="stat"><span>🎯 Kontrol</span><div class="stat-bar"><div style="width:${handlingPercent}%"></div></div><span class="stat-value">${(v.handling || 0).toFixed(1)}</span></div>
            </div>
        `;
        
        card.addEventListener('click', () => {
            document.querySelectorAll('.vehicle-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            if (window.racingSystem) {
                window.racingSystem.selectedVehicle = v.id;
            }
            // 3D önizleme güncelle
            if (window.VehicleManager && window.VehicleManager.previewScene) {
                window.VehicleManager.loadPreviewModel(v.id);
            }
        });
        
        container.appendChild(card);
    });
    
    // İlk aracı seçili olarak ayarla
    if (vehicles.length > 0) {
        const firstVehicle = vehicles[0];
        if (window.racingSystem) {
            window.racingSystem.selectedVehicle = firstVehicle.id;
        }
        // 3D önizleme
        if (window.VehicleManager && window.VehicleManager.previewScene) {
            window.VehicleManager.loadPreviewModel(firstVehicle.id);
        }
    }
}

function setupRacingUIEvents() {
    // Kategorileri ve araçları yükle
    // VehicleManager varsa önce onu yükle (vehicles.json -> VehicleStats merge)
    if (window.VehicleManager && typeof window.VehicleManager.load === 'function') {
        window.VehicleManager.load().finally(() => {
            renderCategories();
            initVehiclePreview();
        });
    } else if (window.VehicleRegistry && typeof window.VehicleRegistry.ensureLoaded === 'function') {
        window.VehicleRegistry.ensureLoaded().finally(() => {
            renderCategories();
        });
    } else {
        renderCategories();
    }

    // Mod seçimi
    document.querySelectorAll('.race-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.race-mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (racingSystem) {
                racingSystem.raceMode = btn.dataset.mode;
            }
        });
    });
    
    // Geri butonu
    document.getElementById('btn-race-back')?.addEventListener('click', () => {
        exitRacingMode();
    });
    
    // Yarış başlat
    document.getElementById('btn-race-start')?.addEventListener('click', () => {
        if (racingSystem) {
            racingSystem.startRace();
        }
    });
    
    // Tekrar Yarış butonu
    document.getElementById('btn-race-again')?.addEventListener('click', () => {
        if (racingSystem) {
            racingSystem.restartRace();
        }
    });
    
    // Lobiye Dön butonu
    document.getElementById('btn-race-lobby')?.addEventListener('click', () => {
        if (racingSystem) {
            racingSystem.returnToLobby();
        }
    });
}

function exitRacingMode() {
    // Racing sistemini temizle
    if (racingSystem) {
        racingSystem.cleanup();
    }
    
    // Racing UI'ı gizle
    const container = document.getElementById('racing-container');
    if (container) container.style.display = 'none';
    
    const ui = document.getElementById('racing-ui');
    if (ui) ui.style.display = 'none';
    
    // Ana menüye dön
    if (typeof showMainMenu === 'function') {
        showMainMenu();
    }
}

// Global
window.createRacingUI = createRacingUI;
window.exitRacingMode = exitRacingMode;
