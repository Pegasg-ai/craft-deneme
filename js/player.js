// Player Viewmodel (Hands/Weapon)
// Handles the first-person weapon/hand rendering and animation (sway, bobbing)

let weaponGroup;
let weaponBobTimer = 0;
let lastCameraQuat = new THREE.Quaternion();

function initPlayerModel(camera) {
    weaponGroup = new THREE.Group();
    
    // --- Voxel Pistol Design ---
    const gunColor = 0x2d3436; // Dark grey
    const accentColor = 0x0984e3; // Blue accent (Valorant-ish)
    const skinColor = 0xffccaa; // Skin tone

    const gunMat = new THREE.MeshLambertMaterial({ color: gunColor });
    const accentMat = new THREE.MeshLambertMaterial({ color: accentColor });
    const armMat = new THREE.MeshLambertMaterial({ color: skinColor });

    // 1. Barrel (Main body)
    const barrelGeo = new THREE.BoxGeometry(0.08, 0.08, 0.4);
    const barrel = new THREE.Mesh(barrelGeo, gunMat);
    barrel.position.set(0.25, -0.2, -0.4); 
    weaponGroup.add(barrel);

    // 2. Top Slide (Accent)
    const slideGeo = new THREE.BoxGeometry(0.082, 0.02, 0.4);
    const slide = new THREE.Mesh(slideGeo, accentMat);
    slide.position.set(0.25, -0.16, -0.4);
    weaponGroup.add(slide);

    // 3. Grip/Handle
    const gripGeo = new THREE.BoxGeometry(0.07, 0.15, 0.08);
    const grip = new THREE.Mesh(gripGeo, gunMat);
    grip.position.set(0.25, -0.3, -0.25);
    grip.rotation.x = 0.2; // Slight angle
    weaponGroup.add(grip);

    // 4. Right Arm (Visible part)
    const armGeo = new THREE.BoxGeometry(0.1, 0.1, 0.6);
    const arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(0.3, -0.3, 0.1); // Coming from bottom right
    arm.rotation.y = -0.1;
    arm.rotation.x = -0.1;
    weaponGroup.add(arm);

    // Add to camera so it stays fixed to view
    camera.add(weaponGroup);
    
    // Initialize quaternion for sway calculation
    lastCameraQuat.copy(camera.quaternion);
}

function updatePlayerModel(dt, isMoving, isSprinting) {
    if (!weaponGroup) return;

    // --- Weapon Sway (Mouse Movement) ---
    // Calculate rotation difference
    const currentQuat = camera.quaternion;
    // This is a simplified sway approximation based on camera rotation changes
    // Ideally we'd use mouse delta, but this works without hooking into input directly
    
    // (Skipping complex quaternion math for now, simple bobbing is more important for "feel")

    // --- Weapon Bobbing (Movement) ---
    if (isMoving) {
        const speed = isSprinting ? 15 : 10;
        weaponBobTimer += dt * speed;
        
        // Bob Y (Up/Down) - Figure 8 pattern
        const bobY = Math.sin(weaponBobTimer) * 0.005;
        const bobX = Math.cos(weaponBobTimer * 0.5) * 0.005;
        
        weaponGroup.position.y = bobY;
        weaponGroup.position.x = bobX;
    } else {
        // Return to rest (Breathing effect)
        weaponBobTimer += dt * 2;
        const breathY = Math.sin(weaponBobTimer) * 0.001;
        
        weaponGroup.position.y = THREE.MathUtils.lerp(weaponGroup.position.y, breathY, dt * 5);
        weaponGroup.position.x = THREE.MathUtils.lerp(weaponGroup.position.x, 0, dt * 5);
    }
}
