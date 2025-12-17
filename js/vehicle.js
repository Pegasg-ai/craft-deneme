// Vehicle System Logic

function spawnVehicle(x, y, z) {
    const vehicle = new THREE.Group();
    vehicle.position.set(x, y, z);
    
    // Car body - Üst açık convertible tasarım
    const bodyGeo = new THREE.BoxGeometry(2, 0.6, 3);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x2244cc });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.5;
    vehicle.add(body);
    
    // Front/back panels
    const frontGeo = new THREE.BoxGeometry(2, 0.4, 0.1);
    const front = new THREE.Mesh(frontGeo, bodyMat);
    front.position.set(0, 0.7, 1.5);
    vehicle.add(front);
    
    const back = new THREE.Mesh(frontGeo, bodyMat);
    back.position.set(0, 0.7, -1.5);
    vehicle.add(back);
    
    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const wheelPositions = [
        [-0.8, 0.3, 1.2], [0.8, 0.3, 1.2],  // Front
        [-0.8, 0.3, -1.2], [0.8, 0.3, -1.2] // Rear
    ];
    
    vehicle.wheels = [];
    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(...pos);
        vehicle.add(wheel);
        vehicle.wheels.push(wheel);
    });
    
    // Seat meshes (4 visible seats)
    const seatGeo = new THREE.BoxGeometry(0.4, 0.2, 0.4);
    const seatMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const seatBackGeo = new THREE.BoxGeometry(0.4, 0.4, 0.1);
    
    const seatPositions = [
        { pos: [0.5, 0.9, 0.6], name: 'driver' },      // Driver (front left)
        { pos: [-0.5, 0.9, 0.6], name: 'passenger' },  // Front right
        { pos: [0.5, 0.9, -0.6], name: 'backLeft' },   // Back left
        { pos: [-0.5, 0.9, -0.6], name: 'backRight' }  // Back right
    ];
    
    vehicle.seatMeshes = [];
    seatPositions.forEach(({pos, name}, index) => {
        const seatGroup = new THREE.Group();
        // Store metadata for raycasting
        seatGroup.userData = { isSeat: true, vehicle: vehicle, seatIndex: index, seatName: name };
        
        // Seat cushion
        const cushion = new THREE.Mesh(seatGeo, seatMat);
        seatGroup.add(cushion);
        
        // Seat back
        const back = new THREE.Mesh(seatBackGeo, seatMat);
        back.position.set(0, 0.2, -0.15);
        seatGroup.add(back);
        
        seatGroup.position.set(...pos);
        vehicle.add(seatGroup);
        vehicle.seatMeshes.push(seatGroup);
    });
    
    // Seat positions (4 seats)
    vehicle.seats = [
        { pos: new THREE.Vector3(0.5, 0.9, 0.6), occupied: null },   // Driver (front left)
        { pos: new THREE.Vector3(-0.5, 0.9, 0.6), occupied: null },  // Front right
        { pos: new THREE.Vector3(0.5, 0.9, -0.6), occupied: null },  // Back left
        { pos: new THREE.Vector3(-0.5, 0.9, -0.6), occupied: null }  // Back right
    ];
    
    // Vehicle physics properties
    vehicle.velocity = new THREE.Vector3();
    vehicle.rotation.y = 0;
    vehicle.onGround = false;
    vehicle.id = Date.now() + Math.random();
    
    scene.add(vehicle);
    vehicles.push(vehicle);
    return vehicle;
}

function enterVehicle(vehicle, seatIndex = -1) {
    // Find first available seat
    if (seatIndex === -1) {
        seatIndex = vehicle.seats.findIndex(s => s.occupied === null);
        if (seatIndex === -1) return; // No seats available
    }
    
    // Occupy seat
    vehicle.seats[seatIndex].occupied = myId;
    currentVehicle = vehicle;
    currentVehicleSeat = seatIndex;
    
    // Only driver (seat 0) can control
    if (seatIndex === 0) {
        // Driver view
        vehicleControls.isDriver = true;
    } else {
        vehicleControls.isDriver = false;
    }
    
    // Broadcast vehicle entry
    Broadcast({ t: 'vehicleEnter', vid: vehicle.id, pid: myId, seat: seatIndex });
}

function exitVehicle() {
    if (!currentVehicle) return;
    
    // Free the seat
    if (currentVehicleSeat !== -1) {
        currentVehicle.seats[currentVehicleSeat].occupied = null;
    }
    
    // Broadcast vehicle exit
    Broadcast({ t: 'vehicleExit', vid: currentVehicle.id, pid: myId, seat: currentVehicleSeat });
    
    // Place player next to vehicle
    const exitPos = new THREE.Vector3(3, 1, 0);
    const upVector = new THREE.Vector3(0, 1, 0);
    exitPos.applyAxisAngle(upVector, currentVehicle.rotation.y);
    controls.getObject().position.copy(currentVehicle.position).add(exitPos);
    controls.getObject().position.y += 2;
    
    currentVehicle = null;
    currentVehicleSeat = -1;
    vehicleControls.isDriver = false;
    
    // Lock controls only if not already locked
    if (!document.pointerLockElement) {
        setTimeout(() => controls.lock(), 100);
    }
}

function switchSeat(targetSeatIndex) {
    if (!currentVehicle) return;
    
    // Check if target seat is valid and empty
    if (targetSeatIndex >= 0 && targetSeatIndex < currentVehicle.seats.length) {
        if (currentVehicle.seats[targetSeatIndex].occupied === null) {
            // Leave current seat
            if (currentVehicleSeat !== -1) {
                currentVehicle.seats[currentVehicleSeat].occupied = null;
                // Broadcast exit from old seat (to update others)
                Broadcast({ t: 'vehicleExit', vid: currentVehicle.id, pid: myId, seat: currentVehicleSeat });
            }
            
            // Enter new seat
            currentVehicle.seats[targetSeatIndex].occupied = myId;
            currentVehicleSeat = targetSeatIndex;
            
            // Update driver status
            vehicleControls.isDriver = (targetSeatIndex === 0);
            
            // Broadcast entry to new seat
            Broadcast({ t: 'vehicleEnter', vid: currentVehicle.id, pid: myId, seat: targetSeatIndex });
            
            console.log("Switched to seat:", targetSeatIndex, targetSeatIndex === 0 ? "(Driver)" : "(Passenger)");
        } else {
            console.log("Seat occupied");
        }
    }
}

function updateVehiclePhysics(dt) {
    const v = currentVehicle;
    if (!v) return;
    
    // Update player camera position to seat (but keep free look)
    if (currentVehicleSeat !== -1 && v.seats[currentVehicleSeat]) {
        const seatPos = v.seats[currentVehicleSeat].pos.clone();
        // Add sitting eye height offset (seat center 0.9 + offset)
        seatPos.y += 0.8;
        const upVector = new THREE.Vector3(0, 1, 0);
        seatPos.applyAxisAngle(upVector, v.rotation.y);
        const worldSeatPos = v.position.clone().add(seatPos);
        controls.getObject().position.copy(worldSeatPos);
    }
    
    // Only driver can control vehicle
    if (!vehicleControls.isDriver || currentVehicleSeat !== 0) {
        return; // Passengers don't control vehicle
    }
    
    // Vehicle controls (driver only)
    const accel = 15 * dt;
    const turnSpeed = 2 * dt;
    const maxSpeed = 10 * dt;
    
    // Forward/backward
    if (vehicleControls.w) {
        v.velocity.z = Math.min(v.velocity.z + accel, maxSpeed);
    } else if (vehicleControls.s) {
        v.velocity.z = Math.max(v.velocity.z - accel, -maxSpeed * 0.5);
    } else {
        v.velocity.z *= 0.95; // Friction
    }
    
    // Steering (only when moving)
    if (Math.abs(v.velocity.z) > 0.01) {
        if (vehicleControls.a) v.rotation.y += turnSpeed * Math.sign(v.velocity.z);
        if (vehicleControls.d) v.rotation.y -= turnSpeed * Math.sign(v.velocity.z);
    }
    
    // Gravity
    v.velocity.y -= GRAVITY * dt;
    
    // Jump (only when on ground)
    if (vehicleControls.space && v.onGround) {
        v.velocity.y = JUMP;
        v.onGround = false;
    }
    
    // Apply movement
    const forward = new THREE.Vector3(0, 0, 1);
    const upVector = new THREE.Vector3(0, 1, 0);
    forward.applyAxisAngle(upVector, v.rotation.y);
    
    v.position.x += forward.x * v.velocity.z;
    v.position.z += forward.z * v.velocity.z;
    
    // Collision check horizontal
    if (checkVehicleCollision(v)) {
        v.position.x -= forward.x * v.velocity.z;
        v.position.z -= forward.z * v.velocity.z;
        v.velocity.z = 0;
    }
    
    // Apply vertical movement
    v.position.y += v.velocity.y * dt;
    v.onGround = false;
    
    // Collision check vertical
    if (checkVehicleCollision(v)) {
        v.position.y -= v.velocity.y * dt;
        if (v.velocity.y < 0) v.onGround = true;
        v.velocity.y = 0;
    }
    
    // Wheel rotation animation
    if (v.wheels) {
        const wheelRot = v.velocity.z * 5;
        v.wheels.forEach(wheel => {
            wheel.rotation.x += wheelRot;
        });
    }
    
    // Broadcast vehicle position
    if (myId && conns.length > 0) {
        Broadcast({ 
            t: 'v', 
            i: v.id, 
            x: v.position.x, 
            y: v.position.y, 
            z: v.position.z, 
            ry: v.rotation.y 
        });
    }
}

function checkVehicleCollision(vehicle) {
    // Check 4 corners and center of vehicle base
    const checkPoints = [
        new THREE.Vector3(-0.9, 0, 1.4),
        new THREE.Vector3(0.9, 0, 1.4),
        new THREE.Vector3(-0.9, 0, -1.4),
        new THREE.Vector3(0.9, 0, -1.4),
        new THREE.Vector3(0, 0, 0)
    ];
    
    for (const point of checkPoints) {
        const upVector = new THREE.Vector3(0, 1, 0);
        const worldPoint = point.clone().applyAxisAngle(upVector, vehicle.rotation.y).add(vehicle.position);
        const bx = Math.floor(worldPoint.x);
        const by = Math.floor(worldPoint.y);
        const bz = Math.floor(worldPoint.z);
        
        const k = `${bx},${by},${bz}`;
        if (voxelData.has(k)) {
            const blockInfo = voxelData.get(k);
            const blockDef = BLOCKS[blockInfo.type];
            if (blockDef && blockDef.type === BLOCK_TYPE.PLANT) continue;
            return true;
        }
    }
    return false;
}

function tryEnterNearbyVehicle() {
    const playerPos = controls.getObject().position;
    const cameraDir = new THREE.Vector3();
    controls.getDirection(cameraDir);
    
    // Raycast to find vehicle player is looking at
    const raycaster = new THREE.Raycaster(playerPos, cameraDir, 0, 5);
    
    for (const vehicle of vehicles) {
        // Check if looking at vehicle and close enough
        const dist = playerPos.distanceTo(vehicle.position);
        if (dist < 5) {
            // Check if vehicle has empty seats
            const hasEmptySeat = vehicle.seats.some(s => s.occupied === null);
            if (hasEmptySeat) {
                enterVehicle(vehicle);
                return;
            }
        }
    }
}
