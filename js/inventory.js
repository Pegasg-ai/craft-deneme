// Inventory System (Survival Style Visuals + Creative Functionality)

let isInventoryOpen = false;
const HOTBAR_SIZE = 9;
const INVENTORY_SIZE = 27;

// Data
let hotbar = new Array(HOTBAR_SIZE).fill(0);
let mainInventory = new Array(INVENTORY_SIZE).fill(0); // The 3x9 grid

// Hover state
let hoveredSlot = null; // { index: number, type: 'inv' | 'hot' }

function initInventoryData() {
    // Initialize hotbar
    // Initialize main inventory with all available blocks
    if (typeof BLOCKS !== 'undefined') {
        // Fill main inventory with blocks
        for(let i=1; i<BLOCKS.length; i++) {
            if (i-1 < INVENTORY_SIZE) {
                mainInventory[i-1] = i;
            }
        }
    }
}

function initInventoryUI() {
    // Create Inventory DOM
    const overlay = document.createElement('div');
    overlay.id = 'inventory-overlay';
    overlay.style.display = 'none';
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.75)';
    overlay.style.zIndex = '200';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.backdropFilter = 'blur(2px)';
    
    // Main Container (Survival Style)
    const container = document.createElement('div');
    container.className = 'inventory-container';
    container.style.background = '#c6c6c6';
    container.style.padding = '8px';
    container.style.borderRadius = '4px';
    container.style.border = '2px solid #fff'; // Outer light
    container.style.borderRight = '2px solid #555'; // Outer dark
    container.style.borderBottom = '2px solid #555'; // Outer dark
    container.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '8px';
    container.style.width = '352px'; // Approx MC scale
    
    // --- TOP SECTION (Armor, Character, Crafting) ---
    const topSection = document.createElement('div');
    topSection.style.display = 'flex';
    topSection.style.gap = '8px';
    topSection.style.height = '140px'; // Approx
    
    // Armor Slots (Left)
    const armorCol = document.createElement('div');
    armorCol.style.display = 'flex';
    armorCol.style.flexDirection = 'column';
    armorCol.style.gap = '2px';
    for(let i=0; i<4; i++) {
        const s = createSlotElement(-1, 'armor'); // Placeholder
        armorCol.appendChild(s);
    }
    topSection.appendChild(armorCol);
    
    // Character Preview (Black Box)
    const charBox = document.createElement('div');
    charBox.style.background = '#000';
    charBox.style.width = '70px';
    charBox.style.border = '2px solid #8b8b8b';
    charBox.style.borderTop = '2px solid #373737';
    charBox.style.borderLeft = '2px solid #373737';
    charBox.style.borderBottom = '2px solid #fff';
    charBox.style.borderRight = '2px solid #fff';
    // Add a simple text or icon
    charBox.style.display = 'flex';
    charBox.style.justifyContent = 'center';
    charBox.style.alignItems = 'center';
    charBox.style.color = '#fff';
    charBox.style.fontSize = '10px';
    charBox.innerText = 'PREVIEW';
    topSection.appendChild(charBox);
    
    // Crafting Area (Right)
    const craftingArea = document.createElement('div');
    craftingArea.style.display = 'flex';
    craftingArea.style.flexDirection = 'column';
    craftingArea.style.marginLeft = 'auto';
    
    const craftLabel = document.createElement('div');
    craftLabel.innerText = 'Crafting';
    craftLabel.style.fontSize = '10px';
    craftLabel.style.color = '#404040';
    craftLabel.style.marginBottom = '2px';
    craftingArea.appendChild(craftLabel);
    
    const craftRow = document.createElement('div');
    craftRow.style.display = 'flex';
    craftRow.style.alignItems = 'center';
    craftRow.style.gap = '10px';
    
    // 2x2 Grid
    const craftGrid = document.createElement('div');
    craftGrid.style.display = 'grid';
    craftGrid.style.gridTemplateColumns = 'repeat(2, 36px)';
    craftGrid.style.gap = '2px';
    for(let i=0; i<4; i++) craftGrid.appendChild(createSlotElement(-1, 'craft'));
    craftRow.appendChild(craftGrid);
    
    // Arrow
    const arrow = document.createElement('div');
    arrow.innerText = '→';
    arrow.style.fontSize = '20px';
    arrow.style.color = '#404040';
    craftRow.appendChild(arrow);
    
    // Result Slot
    const resultSlot = createSlotElement(-1, 'result');
    craftRow.appendChild(resultSlot);
    
    craftingArea.appendChild(craftRow);
    topSection.appendChild(craftingArea);
    
    container.appendChild(topSection);
    
    // --- MIDDLE SECTION (Main Inventory) ---
    const midSection = document.createElement('div');
    const invLabel = document.createElement('div');
    invLabel.innerText = 'Inventory';
    invLabel.style.fontSize = '10px';
    invLabel.style.color = '#404040';
    invLabel.style.marginBottom = '2px';
    midSection.appendChild(invLabel);
    
    const invGrid = document.createElement('div');
    invGrid.style.display = 'grid';
    invGrid.style.gridTemplateColumns = 'repeat(9, 36px)';
    invGrid.style.gap = '2px';
    
    for(let i=0; i<INVENTORY_SIZE; i++) {
        const slot = createSlotElement(i, 'inv');
        invGrid.appendChild(slot);
    }
    midSection.appendChild(invGrid);
    container.appendChild(midSection);
    
    // --- BOTTOM SECTION (Hotbar) ---
    const botSection = document.createElement('div');
    // Spacer
    botSection.style.marginTop = '4px';
    
    const hotbarGrid = document.createElement('div');
    hotbarGrid.style.display = 'grid';
    hotbarGrid.style.gridTemplateColumns = 'repeat(9, 36px)';
    hotbarGrid.style.gap = '2px';
    
    for(let i=0; i<HOTBAR_SIZE; i++) {
        const slot = createSlotElement(i, 'hot');
        hotbarGrid.appendChild(slot);
    }
    botSection.appendChild(hotbarGrid);
    container.appendChild(botSection);
    
    overlay.appendChild(container);
    document.body.appendChild(overlay);
    
    updateHudHotbar();
    
    // Key Listener for Hover Swap
    document.addEventListener('keydown', (e) => {
        if (!isInventoryOpen) return;
        
        const key = parseInt(e.key);
        if (!isNaN(key) && key >= 1 && key <= 9) {
            const targetHotbarIndex = key - 1;
            
            if (hoveredSlot) {
                handleHotbarSwap(hoveredSlot, targetHotbarIndex);
            }
        }
    });
}

function createSlotElement(index, type) {
    const div = document.createElement('div');
    div.className = 'inv-slot';
    div.style.width = '36px';
    div.style.height = '36px';
    div.style.border = '2px solid #373737'; // Top/Left Dark
    div.style.borderBottom = '2px solid #fff'; // Bot/Right Light
    div.style.borderRight = '2px solid #fff';
    div.style.backgroundColor = '#8b8b8b';
    div.style.display = 'flex';
    div.style.justifyContent = 'center';
    div.style.alignItems = 'center';
    div.style.cursor = 'pointer';
    
    if (index !== -1) {
        div.dataset.index = index;
        div.dataset.type = type;
        
        div.onmouseenter = () => { 
            div.style.backgroundColor = '#c6c6c6'; // Highlight
            hoveredSlot = { index, type };
        };
        div.onmouseleave = () => { 
            div.style.backgroundColor = '#8b8b8b'; 
            hoveredSlot = null;
        };
        
        div.onclick = () => handleSlotClick(index, type);
    }
    
    return div;
}

function updateInventoryUI() {
    // Update Main Inventory
    const invSlots = document.querySelectorAll('.inv-slot[data-type="inv"]');
    invSlots.forEach((slot, i) => {
        const itemId = mainInventory[i];
        renderItemInSlot(slot, itemId);
    });
    
    // Update Hotbar
    const hotSlots = document.querySelectorAll('.inv-slot[data-type="hot"]');
    hotSlots.forEach((slot, i) => {
        const itemId = hotbar[i];
        renderItemInSlot(slot, itemId);
    });
    
    // Also update main HUD hotbar
    updateHudHotbar();
}

function renderItemInSlot(slot, itemId) {
    slot.innerHTML = ''; // Clear
    if (itemId && BLOCKS[itemId]) {
        const b = BLOCKS[itemId];
        const itemDiv = document.createElement('div');
        itemDiv.style.width = '32px';
        itemDiv.style.height = '32px';
        
        const url = window.getBlockTextureUrl ? window.getBlockTextureUrl(b) : null;
        
        if (url) {
            itemDiv.style.backgroundImage = `url('${url}')`;
            itemDiv.style.backgroundSize = 'contain';
            itemDiv.style.imageRendering = 'pixelated';
            itemDiv.style.backgroundRepeat = 'no-repeat';
            itemDiv.style.backgroundPosition = 'center';
        } else {
            const col = '#' + b.col.toString(16).padStart(6, '0');
            // 3D-ish look css
            itemDiv.style.backgroundColor = col;
            itemDiv.style.boxShadow = 'inset -2px -2px 0 rgba(0,0,0,0.2), inset 2px 2px 0 rgba(255,255,255,0.2)';
            itemDiv.style.border = '1px solid rgba(0,0,0,0.5)';
        }
        
        slot.appendChild(itemDiv);
        slot.title = b.name;
    }
}

function updateHudHotbar() {
    const hb = document.getElementById('hotbar');
    if(!hb) return;
    hb.innerHTML = '';
    
    for (let i = 0; i < Math.min(hotbar.length, 9); i++) {
        const itemId = hotbar[i];
        const div = document.createElement('div');
        div.className = (i + 1 === selectedSlot) ? 'slot active' : 'slot';
        div.id = `slot-${i+1}`;
        
        if (itemId && BLOCKS[itemId]) {
            const b = BLOCKS[itemId];
            const col = document.createElement('div');
            col.className = 'slot-color';
            
            // Use texture if available
            const url = window.getBlockTextureUrl ? window.getBlockTextureUrl(b) : null;
            
            if (url) {
                col.style.backgroundImage = `url('${url}')`;
                col.style.backgroundSize = 'contain';
                col.style.imageRendering = 'pixelated';
                col.style.backgroundColor = 'transparent';
                col.style.boxShadow = 'none';
            } else {
                const baseCol = '#' + b.col.toString(16).padStart(6, '0');
                const topCol = '#' + (BLOCKS[itemId] && BLOCKS[itemId].top ? BLOCKS[itemId].top : b.col).toString(16).padStart(6, '0');
                col.style.background = `linear-gradient(135deg, ${topCol} 0%, ${baseCol} 100%)`;
            }
            
            div.appendChild(col);
            div.title = b.name;
        }
        
        div.onclick = () => selectSlot(i + 1);
        hb.appendChild(div);
    }
}

function toggleInventory() {
    isInventoryOpen = !isInventoryOpen;
    const overlay = document.getElementById('inventory-overlay');
    
    if (isInventoryOpen) {
        overlay.style.display = 'flex';
        updateInventoryUI();
        document.exitPointerLock();
    } else {
        overlay.style.display = 'none';
        controls.lock();
    }
}

// Simple click to swap
let selectedSlotIndex = -1;
let selectedSlotType = null;

function handleSlotClick(index, type) {
    if (selectedSlotIndex === -1) {
        // Select
        selectedSlotIndex = index;
        selectedSlotType = type;
        // Visual feedback
        const slot = document.querySelector(`.inv-slot[data-type="${type}"][data-index="${index}"]`);
        if(slot) slot.style.borderColor = '#ffff00';
    } else {
        // Swap
        const sourceArr = selectedSlotType === 'inv' ? mainInventory : hotbar;
        const targetArr = type === 'inv' ? mainInventory : hotbar;
        
        const temp = sourceArr[selectedSlotIndex];
        sourceArr[selectedSlotIndex] = targetArr[index];
        targetArr[index] = temp;
        
        // Reset selection
        // Reset border color of previous selection
        const prevSlot = document.querySelector(`.inv-slot[data-type="${selectedSlotType}"][data-index="${selectedSlotIndex}"]`);
        if(prevSlot) {
            prevSlot.style.border = '2px solid #373737';
            prevSlot.style.borderBottom = '2px solid #fff';
            prevSlot.style.borderRight = '2px solid #fff';
        }
        
        selectedSlotIndex = -1;
        selectedSlotType = null;
        updateInventoryUI();
    }
}

function handleHotbarSwap(hovered, targetHotbarIndex) {
    const sourceArr = hovered.type === 'inv' ? mainInventory : hotbar;
    const sourceIndex = hovered.index;
    
    // Target is always hotbar
    const targetArr = hotbar;
    const targetIndex = targetHotbarIndex;
    
    // Swap
    const temp = sourceArr[sourceIndex];
    sourceArr[sourceIndex] = targetArr[targetIndex];
    targetArr[targetIndex] = temp;
    
    updateInventoryUI();
}
