// =====================================================
// ANA MENÜ SİSTEMİ - JavaScript
// Voxel Velocity - Game Mode Selection & Menu Logic
// =====================================================

// Oyun Durumu
const GameState = {
    MAIN_MENU: 'main-menu',
    MODE_SELECT: 'mode-select',
    SETTINGS: 'settings',
    PLAYING: 'playing',
    PAUSED: 'paused'
};

let currentGameState = GameState.MAIN_MENU;
let currentGameMode = null; // 'minecraft' veya 'valotto'

// =====================================================
// MENÜ HTML OLUŞTURMA
// =====================================================

function createMainMenuHTML() {
    // Ana Menü Overlay
    const mainMenu = document.createElement('div');
    mainMenu.id = 'main-menu-overlay';
    mainMenu.innerHTML = `
        <div class="main-menu-logo">VOXEL <span>VELOCITY</span></div>
        <div class="main-menu-buttons">
            <button class="menu-btn primary" id="btn-play">▶ OYNA</button>
            <button class="menu-btn" id="btn-load" disabled>📂 YÜKLE</button>
            <button class="menu-btn" id="btn-settings">⚙ SEÇENEKLER</button>
            <button class="menu-btn exit" id="btn-exit">🚪 ÇIKIŞ</button>
        </div>
    `;
    document.body.appendChild(mainMenu);

    // Çıkış Onay Popup
    const exitPopup = document.createElement('div');
    exitPopup.id = 'exit-confirm-popup';
    exitPopup.innerHTML = `
        <div class="exit-popup-box">
            <h3>Oyundan Çıkmak İstiyor musun?</h3>
            <div class="exit-popup-buttons">
                <button class="exit-btn confirm" id="btn-exit-confirm">ÇIKIŞ</button>
                <button class="exit-btn cancel" id="btn-exit-cancel">ELİM KAYDI</button>
            </div>
        </div>
    `;
    document.body.appendChild(exitPopup);

    // Oyun Modu Seçim Ekranı
    const modeSelect = document.createElement('div');
    modeSelect.id = 'mode-select-overlay';
    modeSelect.innerHTML = `
        <button class="back-button" id="btn-mode-back">← GERİ</button>
        <div class="mode-select-title">OYUN MODU SEÇ</div>
        <div class="game-modes-container">
            <div class="game-mode-card minecraft" id="mode-minecraft">
                <div class="game-mode-bg"></div>
                <div class="game-mode-content">
                    <div class="game-mode-name">Minecraft</div>
                    <div class="game-mode-desc">Klasik sandbox deneyimi. İnşa et, keşfet, hayatta kal!</div>
                </div>
            </div>
            <div class="game-mode-card fivemto" id="mode-fivemto">
                <div class="game-mode-bg"></div>
                <div class="game-mode-content">
                    <div class="game-mode-name">FiveM To</div>
                    <div class="game-mode-desc">GTA tarzı yarış! Face to Face, Sprint, Drag Race ve daha fazlası!</div>
                </div>
            </div>
            <div class="game-mode-card valotto disabled" id="mode-valotto">
                <div class="coming-soon-badge">Yakında</div>
                <div class="game-mode-bg"></div>
                <div class="game-mode-content">
                    <div class="game-mode-name">Valotto</div>
                    <div class="game-mode-desc">Taktiksel FPS savaşları. Takımını kur, düşmanı yen!</div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modeSelect);

    // Seçenekler Overlay - Tam Ekran Modern Tasarım
    const settingsOverlay = document.createElement('div');
    settingsOverlay.id = 'settings-overlay';
    settingsOverlay.innerHTML = `
        <div class="settings-fullscreen">
            <div class="settings-header-bar">
                <div class="settings-title-section">
                    <span class="settings-gear">⚙</span>
                    <h2>SEÇENEKLER</h2>
                </div>
                <button class="settings-close-btn" id="btn-settings-close">✕</button>
            </div>
            
            <div class="settings-tabs-bar">
                <div class="settings-tab active" data-stab="stab-profile">PROFİL</div>
                <div class="settings-tab" data-stab="stab-graphics">GRAFİK</div>
                <div class="settings-tab" data-stab="stab-audio">SES</div>
                <div class="settings-tab" data-stab="stab-controls">KONTROL</div>
            </div>
            
            <div class="settings-body">
                <!-- Profil Sekmesi -->
                <div id="stab-profile" class="settings-section active">
                    <div class="setting-card">
                        <div class="setting-info">
                            <div class="setting-label">Oyuncu İsmi</div>
                            <div class="setting-desc">Diğer oyuncuların göreceği isim</div>
                        </div>
                        <input type="text" id="settings-nick" class="setting-input" value="Oyuncu" maxlength="20" placeholder="İsminizi girin...">
                    </div>
                    
                    <div class="setting-card">
                        <div class="setting-info">
                            <div class="setting-label">Karakter Rengi</div>
                            <div class="setting-desc">Karakterinizin temel rengi</div>
                        </div>
                        <div class="color-picker-wrapper">
                            <input type="color" id="settings-color" value="#00a8ff">
                            <span class="color-preview" id="color-preview-text">#00a8ff</span>
                        </div>
                    </div>
                </div>
                
                <!-- Grafik Sekmesi -->
                <div id="stab-graphics" class="settings-section">
                    <div class="setting-label-big">Grafik Kalitesi</div>
                    <div class="quality-cards">
                        <div class="quality-card" data-quality="low">
                            <div class="quality-icon">⚡</div>
                            <div class="quality-name">DÜŞÜK</div>
                            <div class="quality-info">Maksimum performans</div>
                            <ul class="quality-features">
                                <li>40m görüş mesafesi</li>
                                <li>Animasyonlar kapalı</li>
                                <li>60+ FPS hedefi</li>
                            </ul>
                        </div>
                        <div class="quality-card active" data-quality="medium">
                            <div class="quality-badge">ÖNERİLEN</div>
                            <div class="quality-icon">⚖️</div>
                            <div class="quality-name">ORTA</div>
                            <div class="quality-info">Dengeli deneyim</div>
                            <ul class="quality-features">
                                <li>90m görüş mesafesi</li>
                                <li>Temel animasyonlar</li>
                                <li>45+ FPS hedefi</li>
                            </ul>
                        </div>
                        <div class="quality-card" data-quality="high">
                            <div class="quality-icon">✨</div>
                            <div class="quality-name">YÜKSEK</div>
                            <div class="quality-info">En iyi görsellik</div>
                            <ul class="quality-features">
                                <li>160m görüş mesafesi</li>
                                <li>Tüm animasyonlar</li>
                                <li>30+ FPS hedefi</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <!-- Ses Sekmesi -->
                <div id="stab-audio" class="settings-section">
                    <div class="setting-card">
                        <div class="setting-info">
                            <div class="setting-label">Ana Ses</div>
                            <div class="setting-desc">Tüm seslerin genel seviyesi</div>
                        </div>
                        <div class="slider-wrapper">
                            <input type="range" id="volume-master" class="setting-slider" min="0" max="100" value="80">
                            <span class="slider-value">80%</span>
                        </div>
                    </div>
                    
                    <div class="setting-card">
                        <div class="setting-info">
                            <div class="setting-label">Efekt Sesleri</div>
                            <div class="setting-desc">Blok kırma, yürüme vb.</div>
                        </div>
                        <div class="slider-wrapper">
                            <input type="range" id="volume-sfx" class="setting-slider" min="0" max="100" value="100">
                            <span class="slider-value">100%</span>
                        </div>
                    </div>
                    
                    <div class="setting-card">
                        <div class="setting-info">
                            <div class="setting-label">Müzik</div>
                            <div class="setting-desc">Arka plan müziği</div>
                        </div>
                        <div class="slider-wrapper">
                            <input type="range" id="volume-music" class="setting-slider" min="0" max="100" value="50">
                            <span class="slider-value">50%</span>
                        </div>
                    </div>
                </div>
                
                <!-- Kontrol Sekmesi -->
                <div id="stab-controls" class="settings-section">
                    <div class="setting-card">
                        <div class="setting-info">
                            <div class="setting-label">Fare Hassasiyeti</div>
                            <div class="setting-desc">Bakış hızı</div>
                        </div>
                        <div class="slider-wrapper">
                            <input type="range" id="mouse-sensitivity" class="setting-slider" min="1" max="100" value="50">
                            <span class="slider-value">50</span>
                        </div>
                    </div>
                    
                    <div class="setting-card">
                        <div class="setting-info">
                            <div class="setting-label">Y Ekseni Ters</div>
                            <div class="setting-desc">Yukarı bakma yönünü tersle</div>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="invert-y">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    
                    <div class="controls-list">
                        <div class="control-item">
                            <span class="control-key">W A S D</span>
                            <span class="control-action">Hareket</span>
                        </div>
                        <div class="control-item">
                            <span class="control-key">SPACE</span>
                            <span class="control-action">Zıpla</span>
                        </div>
                        <div class="control-item">
                            <span class="control-key">SHIFT</span>
                            <span class="control-action">Koş</span>
                        </div>
                        <div class="control-item">
                            <span class="control-key">E</span>
                            <span class="control-action">Envanter</span>
                        </div>
                        <div class="control-item">
                            <span class="control-key">SOL TIK</span>
                            <span class="control-action">Kır / Saldır</span>
                        </div>
                        <div class="control-item">
                            <span class="control-key">SAĞ TIK</span>
                            <span class="control-action">Yerleştir</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="settings-footer-bar">
                <button class="settings-action-btn secondary" id="btn-settings-reset">VARSAYILANA DÖN</button>
                <button class="settings-action-btn primary" id="btn-settings-save">KAYDET VE KAPAT</button>
            </div>
        </div>
    `;
    document.body.appendChild(settingsOverlay);
}

// =====================================================
// MENÜ KONTROL FONKSİYONLARI
// =====================================================

function showMainMenu() {
    currentGameState = GameState.MAIN_MENU;
    document.getElementById('main-menu-overlay').style.display = 'flex';
    document.getElementById('mode-select-overlay').style.display = 'none';
    document.getElementById('settings-overlay').style.display = 'none';
    document.getElementById('exit-confirm-popup').style.display = 'none';
    
    // Eski menüyü gizle
    const oldMenu = document.getElementById('menu-overlay');
    if (oldMenu) oldMenu.style.display = 'none';
    
    // HUD gizle
    hideGameUI();
}

function showModeSelect() {
    currentGameState = GameState.MODE_SELECT;
    document.getElementById('main-menu-overlay').style.display = 'none';
    document.getElementById('mode-select-overlay').style.display = 'block';
}

function showSettings(fromPause = false) {
    settingsOpenedFrom = fromPause ? 'pause' : 'main';
    currentGameState = GameState.SETTINGS;
    
    // Eğer pause'dan açıyorsa, pause menüyü gizle
    if (fromPause) {
        const pauseMenu = document.getElementById('menu-overlay');
        if (pauseMenu) pauseMenu.style.display = 'none';
    } else {
        document.getElementById('main-menu-overlay').style.display = 'none';
    }
    
    document.getElementById('settings-overlay').style.display = 'flex';
    
    // Mevcut ayarları yükle
    loadCurrentSettings();
}

function loadCurrentSettings() {
    // LocalStorage'dan ayarları yükle
    let savedSettings = null;
    try {
        const saved = localStorage.getItem('voxel-settings');
        if (saved) savedSettings = JSON.parse(saved);
    } catch (e) {
        console.warn('Ayarlar yüklenemedi:', e);
    }
    
    const nickInput = document.getElementById('settings-nick');
    const colorInput = document.getElementById('settings-color');
    const colorPreview = document.getElementById('color-preview-text');
    
    // Profil
    if (nickInput) {
        if (savedSettings && savedSettings.nick) {
            nickInput.value = savedSettings.nick;
        } else if (typeof myNick !== 'undefined') {
            nickInput.value = myNick;
        }
    }
    if (colorInput) {
        if (savedSettings && savedSettings.color) {
            colorInput.value = savedSettings.color;
            if (colorPreview) colorPreview.textContent = savedSettings.color.toUpperCase();
        } else if (typeof myCol !== 'undefined') {
            colorInput.value = myCol;
            if (colorPreview) colorPreview.textContent = myCol.toUpperCase();
        }
    }
    
    // Grafik kalitesi kartını seç
    const quality = savedSettings?.graphics || (typeof graphicsQuality !== 'undefined' ? graphicsQuality : 'medium');
    document.querySelectorAll('#stab-graphics .quality-card').forEach(c => c.classList.remove('active'));
    const card = document.querySelector(`#stab-graphics .quality-card[data-quality="${quality}"]`);
    if (card) card.classList.add('active');
    
    // Ses ayarları
    if (savedSettings?.audio) {
        const masterVolume = document.getElementById('volume-master');
        const sfxVolume = document.getElementById('volume-sfx');
        const musicVolume = document.getElementById('volume-music');
        
        if (masterVolume) {
            masterVolume.value = Math.round(savedSettings.audio.master * 100);
            masterVolume.dispatchEvent(new Event('input'));
        }
        if (sfxVolume) {
            sfxVolume.value = Math.round(savedSettings.audio.sfx * 100);
            sfxVolume.dispatchEvent(new Event('input'));
        }
        if (musicVolume) {
            musicVolume.value = Math.round(savedSettings.audio.music * 100);
            musicVolume.dispatchEvent(new Event('input'));
        }
    }
    
    // Kontrol ayarları
    if (savedSettings) {
        const sensitivity = document.getElementById('mouse-sensitivity');
        const invertY = document.getElementById('invert-y');
        
        if (sensitivity && savedSettings.sensitivity !== undefined) {
            sensitivity.value = savedSettings.sensitivity;
            sensitivity.dispatchEvent(new Event('input'));
        }
        if (invertY && savedSettings.invertY !== undefined) {
            invertY.checked = savedSettings.invertY;
        }
    }
}

// Ayarların nereden açıldığını takip et
let settingsOpenedFrom = null;

function hideSettings() {
    document.getElementById('settings-overlay').style.display = 'none';
    
    // Nereden açıldıysa oraya dön
    if (settingsOpenedFrom === 'pause') {
        currentGameState = GameState.PAUSED;
        const pauseMenu = document.getElementById('menu-overlay');
        if (pauseMenu) pauseMenu.style.display = 'flex';
    } else {
        currentGameState = GameState.MAIN_MENU;
        document.getElementById('main-menu-overlay').style.display = 'flex';
    }
    settingsOpenedFrom = null;
}

function showExitConfirm() {
    document.getElementById('exit-confirm-popup').style.display = 'flex';
}

function hideExitConfirm() {
    document.getElementById('exit-confirm-popup').style.display = 'none';
}

function quitGame() {
    // Tauri ortamında mı kontrol et
    if (window.__TAURI__) {
        window.close();
    } else {
        // Normal tarayıcıda pencereyi kapat
        window.close();
        // Eğer kapatılamazsa (popup olmayan pencere)
        window.location.href = 'about:blank';
    }
}

function hideGameUI() {
    const hud = document.getElementById('hud');
    const hotbar = document.getElementById('hotbar');
    const crosshair = document.getElementById('crosshair');
    
    if (hud) hud.style.display = 'none';
    if (hotbar) hotbar.style.display = 'none';
    if (crosshair) crosshair.style.display = 'none';
}

function showGameUI() {
    const hud = document.getElementById('hud');
    const hotbar = document.getElementById('hotbar');
    const crosshair = document.getElementById('crosshair');
    
    if (hud) hud.style.display = 'block';
    if (hotbar) hotbar.style.display = 'flex';
    if (crosshair) crosshair.style.display = 'block';
}

// =====================================================
// OYUN MODU BAŞLATMA
// =====================================================

function startGameMode(mode) {
    currentGameMode = mode;
    currentGameState = GameState.PLAYING;
    
    // Tüm menüleri gizle
    document.getElementById('main-menu-overlay').style.display = 'none';
    document.getElementById('mode-select-overlay').style.display = 'none';
    document.getElementById('settings-overlay').style.display = 'none';
    
    // Eski menüyü de gizle
    const oldMenu = document.getElementById('menu-overlay');
    if (oldMenu) oldMenu.style.display = 'none';
    
    // Oyun UI'ını göster
    showGameUI();
    
    if (mode === 'minecraft') {
        console.log('Minecraft modu başlatılıyor...');
        
        // Oyun motorunu başlat (ilk kez)
        if (typeof initGameEngine === 'function') {
            initGameEngine();
        }
        
        // Ayarları al
        const nickInput = document.getElementById('settings-nick');
        const colorInput = document.getElementById('settings-color');
        
        if (nickInput && typeof myNick !== 'undefined') {
            myNick = nickInput.value || 'Oyuncu';
        }
        if (colorInput && typeof myCol !== 'undefined') {
            myCol = colorInput.value;
        }
        
        // Oyunu başlat - resumeGame fonksiyonunu kullan
        setTimeout(() => {
            if (typeof resumeGame === 'function') {
                resumeGame();
            }
        }, 100);
    } else if (mode === 'valotto') {
        console.log('Valotto modu henüz hazır değil!');
        // TODO: Valotto modu implementasyonu
    } else if (mode === 'fivemto') {
        console.log('FiveM To modu başlatılıyor...');
        
        // Racing modunu başlat
        if (typeof initRacingMode === 'function') {
            initRacingMode();
        } else {
            console.error('Racing modu yüklenemedi!');
        }
    }
}

// =====================================================
// EVENT LISTENERS
// =====================================================

function initMainMenu() {
    // Menü HTML'ini oluştur
    createMainMenuHTML();
    
    // Ana Menü Butonları
    document.getElementById('btn-play').addEventListener('click', () => {
        showModeSelect();
    });
    
    document.getElementById('btn-load').addEventListener('click', () => {
        // TODO: Kayıt yükleme sistemi
        console.log('Yükleme sistemi henüz aktif değil');
    });
    
    document.getElementById('btn-settings').addEventListener('click', () => {
        showSettings(false); // false = ana menüden açıldı
    });
    
    document.getElementById('btn-exit').addEventListener('click', () => {
        showExitConfirm();
    });
    
    // Çıkış Popup Butonları
    document.getElementById('btn-exit-confirm').addEventListener('click', () => {
        quitGame();
    });
    
    document.getElementById('btn-exit-cancel').addEventListener('click', () => {
        hideExitConfirm();
    });
    
    // Mod Seçim Butonları
    document.getElementById('btn-mode-back').addEventListener('click', () => {
        showMainMenu();
    });
    
    document.getElementById('mode-minecraft').addEventListener('click', () => {
        startGameMode('minecraft');
    });
    
    document.getElementById('mode-fivemto').addEventListener('click', () => {
        startGameMode('fivemto');
    });
    
    document.getElementById('mode-valotto').addEventListener('click', () => {
        // Valotto henüz hazır değil
        console.log('Valotto modu yakında!');
    });
    
    // Seçenekler Kapat Butonu
    document.getElementById('btn-settings-close').addEventListener('click', () => {
        hideSettings();
    });
    
    // Kaydet ve Kapat butonu - Event delegation ile
    document.addEventListener('click', (e) => {
        if (e.target.id === 'btn-settings-save' || e.target.closest('#btn-settings-save')) {
            saveSettings();
            hideSettings();
        }
        if (e.target.id === 'btn-settings-reset' || e.target.closest('#btn-settings-reset')) {
            resetSettings();
        }
    });
    
    // Ayarlar sekmesi listener'ları
    setupSettingsTabListeners();
    
    // Settings overlay dışına tıklama
    document.getElementById('settings-overlay').addEventListener('click', (e) => {
        if (e.target.id === 'settings-overlay') {
            hideSettings();
        }
    });
    
    // Exit popup dışına tıklama
    document.getElementById('exit-confirm-popup').addEventListener('click', (e) => {
        if (e.target.id === 'exit-confirm-popup') {
            hideExitConfirm();
        }
    });
    
    // Eski menüyü gizle
    const oldMenu = document.getElementById('menu-overlay');
    if (oldMenu) oldMenu.style.display = 'none';
    
    // Pause menü event listener'larını ayarla
    setupPauseMenuListeners();
    
    // Ana menüyü göster
    showMainMenu();
    
    console.log('Ana menü sistemi yüklendi!');
}

// =====================================================
// AYARLAR SEKMESİ LISTENERS
// =====================================================

function setupSettingsTabListeners() {
    // Tab değiştirme
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.getAttribute('data-stab');
            
            // Tüm tabları deaktive et
            document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
            
            // Seçilen tabı aktive et
            tab.classList.add('active');
            const targetSection = document.getElementById(targetId);
            if (targetSection) targetSection.classList.add('active');
        });
    });
    
    // Grafik kalitesi kartları
    document.querySelectorAll('#stab-graphics .quality-card').forEach(card => {
        card.addEventListener('click', () => {
            const quality = card.getAttribute('data-quality');
            
            // Tüm kartları deaktive et
            document.querySelectorAll('#stab-graphics .quality-card').forEach(c => c.classList.remove('active'));
            
            // Seçilen kartı aktive et
            card.classList.add('active');
            
            // Grafik ayarını kaydet
            if (typeof graphicsQuality !== 'undefined') {
                graphicsQuality = quality;
            }
        });
    });
    
    // Slider value güncellemeleri
    document.querySelectorAll('.setting-slider').forEach(slider => {
        const valueSpan = slider.parentElement.querySelector('.slider-value');
        
        slider.addEventListener('input', () => {
            if (valueSpan) {
                const isPercent = slider.id.includes('volume');
                valueSpan.textContent = isPercent ? slider.value + '%' : slider.value;
            }
        });
    });
    
    // Renk seçici preview güncellemesi
    const colorPicker = document.getElementById('settings-color');
    const colorPreview = document.getElementById('color-preview-text');
    if (colorPicker && colorPreview) {
        colorPicker.addEventListener('input', () => {
            colorPreview.textContent = colorPicker.value.toUpperCase();
        });
    }
}

function saveSettings() {
    // Profil ayarları
    const nickInput = document.getElementById('settings-nick');
    const colorInput = document.getElementById('settings-color');
    
    if (nickInput && typeof myNick !== 'undefined') {
        myNick = nickInput.value || 'Oyuncu';
        // inp-nick varsa güncelle
        const inpNick = document.getElementById('inp-nick');
        if (inpNick) inpNick.value = myNick;
    }
    if (colorInput && typeof myCol !== 'undefined') {
        myCol = colorInput.value;
    }
    
    // Ses ayarları
    const masterVolume = document.getElementById('volume-master');
    const sfxVolume = document.getElementById('volume-sfx');
    const musicVolume = document.getElementById('volume-music');
    
    if (masterVolume) window.audioSettings = window.audioSettings || {};
    if (masterVolume) window.audioSettings.master = parseInt(masterVolume.value) / 100;
    if (sfxVolume) window.audioSettings.sfx = parseInt(sfxVolume.value) / 100;
    if (musicVolume) window.audioSettings.music = parseInt(musicVolume.value) / 100;
    
    // Kontrol ayarları
    const sensitivity = document.getElementById('mouse-sensitivity');
    const invertY = document.getElementById('invert-y');
    
    if (sensitivity && typeof mouseSensitivity !== 'undefined') {
        window.mouseSensitivity = parseInt(sensitivity.value) / 50; // 0-2 arası
    }
    if (invertY) {
        window.invertYAxis = invertY.checked;
    }
    
    // Grafik kalitesi al
    const activeCard = document.querySelector('#stab-graphics .quality-card.active');
    if (activeCard) {
        const quality = activeCard.getAttribute('data-quality');
        if (typeof graphicsQuality !== 'undefined') {
            graphicsQuality = quality;
        }
    }
    
    // Grafik ayarı uygula
    if (typeof graphicsQuality !== 'undefined' && typeof applyGraphicsSettings === 'function') {
        applyGraphicsSettings();
    }
    
    // LocalStorage'a kaydet
    try {
        const settings = {
            nick: nickInput ? nickInput.value : 'Oyuncu',
            color: colorInput ? colorInput.value : '#00a8ff',
            graphics: graphicsQuality || 'medium',
            audio: window.audioSettings || { master: 0.8, sfx: 1, music: 0.5 },
            sensitivity: sensitivity ? parseInt(sensitivity.value) : 50,
            invertY: invertY ? invertY.checked : false
        };
        localStorage.setItem('voxel-settings', JSON.stringify(settings));
    } catch (e) {
        console.warn('Ayarlar kaydedilemedi:', e);
    }
    
    console.log('Ayarlar kaydedildi!');
}

function resetSettings() {
    // Profil
    const nickInput = document.getElementById('settings-nick');
    const colorInput = document.getElementById('settings-color');
    const colorPreview = document.getElementById('color-preview-text');
    
    if (nickInput) nickInput.value = 'Oyuncu';
    if (colorInput) colorInput.value = '#00a8ff';
    if (colorPreview) colorPreview.textContent = '#00A8FF';
    
    // Grafik - Orta seç
    document.querySelectorAll('#stab-graphics .quality-card').forEach(c => c.classList.remove('active'));
    const mediumCard = document.querySelector('#stab-graphics .quality-card[data-quality="medium"]');
    if (mediumCard) mediumCard.classList.add('active');
    if (typeof graphicsQuality !== 'undefined') graphicsQuality = 'medium';
    
    // Ses slider'ları
    const masterVolume = document.getElementById('volume-master');
    const sfxVolume = document.getElementById('volume-sfx');
    const musicVolume = document.getElementById('volume-music');
    
    if (masterVolume) { masterVolume.value = 80; masterVolume.dispatchEvent(new Event('input')); }
    if (sfxVolume) { sfxVolume.value = 100; sfxVolume.dispatchEvent(new Event('input')); }
    if (musicVolume) { musicVolume.value = 50; musicVolume.dispatchEvent(new Event('input')); }
    
    // Kontrol slider'ları
    const sensitivity = document.getElementById('mouse-sensitivity');
    const invertY = document.getElementById('invert-y');
    
    if (sensitivity) { sensitivity.value = 50; sensitivity.dispatchEvent(new Event('input')); }
    if (invertY) invertY.checked = false;
    
    console.log('Ayarlar varsayılana döndürüldü!');
}

// =====================================================
// PAUSE MENÜ EVENT LISTENERS
// =====================================================

function setupPauseMenuListeners() {
    // Devam Et butonu
    const btnResume = document.getElementById('btn-resume');
    if (btnResume) {
        btnResume.addEventListener('click', () => {
            hidePauseMenu();
            if (typeof resumeGame === 'function') {
                resumeGame();
            }
        });
    }
    
    // Pause menüden Ayarlar butonu - Ana menüdeki güzel ayarlar menüsünü aç
    const btnPauseSettings = document.getElementById('btn-pause-settings');
    if (btnPauseSettings) {
        btnPauseSettings.addEventListener('click', () => {
            // Pause menüyü gizle
            const pauseMenu = document.getElementById('menu-overlay');
            if (pauseMenu) pauseMenu.style.display = 'none';
            
            // Ana menüdeki güzel ayarlar menüsünü aç
            showSettings(true); // true = oyun içinden açıldı
        });
    }
    
    // Ana Menüye Dön butonu
    const btnBackToMenu = document.getElementById('btn-back-to-menu');
    if (btnBackToMenu) {
        btnBackToMenu.addEventListener('click', () => {
            backToMainMenu();
        });
    }
    
    // Pause menü tab'ları
    document.querySelectorAll('.pause-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.getAttribute('data-tab');
            
            // Tüm tab'ları deaktive et
            document.querySelectorAll('.pause-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.pause-content').forEach(c => c.classList.remove('active'));
            
            // Seçilen tab'ı aktive et
            tab.classList.add('active');
            const targetContent = document.getElementById(targetId);
            if (targetContent) targetContent.classList.add('active');
        });
    });
    
    // Grafik kartları
    document.querySelectorAll('.graphics-card').forEach(card => {
        card.addEventListener('click', () => {
            const quality = card.getAttribute('data-quality');
            
            // Tüm kartları deaktive et
            document.querySelectorAll('.graphics-card').forEach(c => c.classList.remove('active'));
            
            // Seçilen kartı aktive et
            card.classList.add('active');
            
            // Grafik ayarını uygula
            if (typeof graphicsQuality !== 'undefined') {
                graphicsQuality = quality;
                if (typeof applyGraphicsSettings === 'function') {
                    applyGraphicsSettings();
                }
            }
        });
    });
}

// =====================================================
// PAUSE MENÜSÜ (Oyun içi ESC)
// =====================================================

function isPauseMenuActive() {
    return currentGameState === GameState.PAUSED;
}

function togglePauseMenu() {
    if (currentGameState === GameState.PLAYING) {
        // Oyunu duraklat
        currentGameState = GameState.PAUSED;
        
        // Eski menüyü göster (pause menu olarak)
        const oldMenu = document.getElementById('menu-overlay');
        if (oldMenu) {
            oldMenu.style.display = 'flex';
        }
        
        if (typeof controls !== 'undefined' && controls.isLocked) {
            controls.unlock();
        }
    } else if (currentGameState === GameState.PAUSED) {
        // Oyuna devam et
        currentGameState = GameState.PLAYING;
        
        const oldMenu = document.getElementById('menu-overlay');
        if (oldMenu) {
            oldMenu.style.display = 'none';
        }
        
        if (typeof resumeGame === 'function') {
            resumeGame();
        }
    }
}

function showPauseMenu() {
    currentGameState = GameState.PAUSED;
    const pauseMenu = document.getElementById('menu-overlay');
    if (pauseMenu) {
        pauseMenu.style.display = 'flex';
    }
    hideGameUI();
}

function hidePauseMenu() {
    currentGameState = GameState.PLAYING;
    const pauseMenu = document.getElementById('menu-overlay');
    if (pauseMenu) {
        pauseMenu.style.display = 'none';
    }
    showGameUI();
}

function backToMainMenu() {
    // Oyunu tamamen durdur ve ana menüye dön
    currentGameState = GameState.MAIN_MENU;
    currentGameMode = null;
    
    // Pause menüyü gizle
    const pauseMenu = document.getElementById('menu-overlay');
    if (pauseMenu) {
        pauseMenu.style.display = 'none';
    }
    
    // Ana menüyü göster
    showMainMenu();
    
    // Pointer lock'u kaldır
    if (typeof controls !== 'undefined' && controls.isLocked) {
        controls.unlock();
    }
}

// Global erişim için
window.initMainMenu = initMainMenu;
window.showMainMenu = showMainMenu;
window.showPauseMenu = showPauseMenu;
window.hidePauseMenu = hidePauseMenu;
window.backToMainMenu = backToMainMenu;
window.currentGameState = () => currentGameState;
window.GameState = GameState;
