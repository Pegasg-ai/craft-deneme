// ========================================
// INVENTORY.JS - 46-Slot Envanter Sistemi
// Minecraft tarzı Survival envanter
// ========================================

let isInventoryOpen = false;

// Slot sayıları
const HOTBAR_SIZE = 9;
const INVENTORY_SIZE = 27;  // 3x9 ana envanter
const ARMOR_SIZE = 4;       // Kask, Göğüslük, Pantolon, Bot
const OFFHAND_SIZE = 1;     // Sol el
const CRAFTING_SIZE = 4;    // 2x2 crafting grid
const CRAFTING_OUTPUT = 1;  // Crafting sonucu

// Total: 9 + 27 + 4 + 1 + 4 + 1 = 46 slots

// Envanter verileri
let hotbar = new Array(HOTBAR_SIZE).fill(null);
let mainInventory = new Array(INVENTORY_SIZE).fill(null);
let armorSlots = new Array(ARMOR_SIZE).fill(null);
let offhandSlot = null;
let craftingGrid = new Array(CRAFTING_SIZE).fill(null);
let craftingOutput = null;

// Stack sistemi - her slot { id: number, count: number, data?: any }
function createStack(id, count = 1, data = null) {
    if (!id || id === 0) return null;
    return { id, count, data };
}

// Max stack boyutları
const MAX_STACK_SIZE = {
    default: 64,
    tool: 1,      // Aletler stacklenmiyor
    armor: 1,     // Zırhlar stacklenmiyor
    bucket: 16,
    snowball: 16,
    egg: 16,
    enderpearl: 16
};

function getMaxStackSize(itemId) {
    // Tool ve armor kontrolü (ID bazlı)
    if (itemId >= 100 && itemId < 200) return 1; // Tools
    if (itemId >= 200 && itemId < 300) return 1; // Armor
    return MAX_STACK_SIZE.default;
}

// Hover state
let hoveredSlot = null;
let heldItem = null; // Tuttuğumuz item (drag için)

function initInventoryData() {
    // Creative mod - tüm blokları envantere ekle
    if (typeof BLOCKS !== 'undefined') {
        for (let i = 1; i < Math.min(BLOCKS.length, INVENTORY_SIZE + 1); i++) {
            mainInventory[i - 1] = createStack(i, 64);
        }
    }
    
    // Başlangıç hotbar
    hotbar[0] = createStack(3, 64);  // Stone
    hotbar[1] = createStack(10, 64); // Planks
    hotbar[2] = createStack(14, 64); // Bricks
    hotbar[3] = createStack(4, 64);  // OakLog
    hotbar[4] = createStack(1, 64);  // Grass
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
        const item = mainInventory[i];
        renderItemInSlot(slot, item);
    });
    
    // Update Hotbar
    const hotSlots = document.querySelectorAll('.inv-slot[data-type="hot"]');
    hotSlots.forEach((slot, i) => {
        const item = hotbar[i];
        renderItemInSlot(slot, item);
    });
    
    // Update Armor slots
    const armorSlotsElem = document.querySelectorAll('.inv-slot[data-type="armor"]');
    armorSlotsElem.forEach((slot, i) => {
        const item = armorSlots[i];
        renderItemInSlot(slot, item);
    });
    
    // Update Crafting slots
    const craftSlots = document.querySelectorAll('.inv-slot[data-type="craft"]');
    craftSlots.forEach((slot, i) => {
        const item = craftingGrid[i];
        renderItemInSlot(slot, item);
    });
    
    // Update Crafting result
    const resultSlot = document.querySelector('.inv-slot[data-type="result"]');
    if (resultSlot) {
        renderItemInSlot(resultSlot, craftingOutput);
    }
    
    // Also update main HUD hotbar
    updateHudHotbar();
}

function renderItemInSlot(slot, item) {
    slot.innerHTML = ''; // Clear
    
    if (item && item.id && BLOCKS[item.id]) {
        const b = BLOCKS[item.id];
        const itemDiv = document.createElement('div');
        itemDiv.style.width = '32px';
        itemDiv.style.height = '32px';
        itemDiv.style.position = 'relative';
        
        const url = window.getBlockTextureUrl ? window.getBlockTextureUrl(b) : null;
        
        if (url) {
            itemDiv.style.backgroundImage = `url('${url}')`;
            itemDiv.style.backgroundSize = 'contain';
            itemDiv.style.imageRendering = 'pixelated';
            itemDiv.style.backgroundRepeat = 'no-repeat';
            itemDiv.style.backgroundPosition = 'center';
        } else {
            const col = '#' + b.col.toString(16).padStart(6, '0');
            itemDiv.style.backgroundColor = col;
            itemDiv.style.boxShadow = 'inset -2px -2px 0 rgba(0,0,0,0.2), inset 2px 2px 0 rgba(255,255,255,0.2)';
            itemDiv.style.border = '1px solid rgba(0,0,0,0.5)';
        }
        
        // Stack count görüntüle
        if (item.count > 1) {
            const countDiv = document.createElement('div');
            countDiv.className = 'item-count';
            countDiv.style.position = 'absolute';
            countDiv.style.bottom = '-2px';
            countDiv.style.right = '-2px';
            countDiv.style.color = '#fff';
            countDiv.style.fontSize = '12px';
            countDiv.style.fontWeight = 'bold';
            countDiv.style.textShadow = '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000';
            countDiv.style.fontFamily = 'monospace';
            countDiv.innerText = item.count;
            itemDiv.appendChild(countDiv);
        }
        
        slot.appendChild(itemDiv);
        slot.title = b.name + (item.count > 1 ? ` (${item.count})` : '');
    }
}

function updateHudHotbar() {
    const hb = document.getElementById('hotbar');
    if(!hb) return;
    hb.innerHTML = '';
    
    for (let i = 0; i < Math.min(hotbar.length, 9); i++) {
        const item = hotbar[i];
        const div = document.createElement('div');
        div.className = (i + 1 === selectedSlot) ? 'slot active' : 'slot';
        div.id = `slot-${i+1}`;
        
        if (item && item.id && BLOCKS[item.id]) {
            const b = BLOCKS[item.id];
            const col = document.createElement('div');
            col.className = 'slot-color';
            col.style.position = 'relative';
            
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
                const topCol = '#' + (b.top ? b.top : b.col).toString(16).padStart(6, '0');
                col.style.background = `linear-gradient(135deg, ${topCol} 0%, ${baseCol} 100%)`;
            }
            
            // Stack count in HUD
            if (item.count > 1) {
                const countSpan = document.createElement('span');
                countSpan.style.position = 'absolute';
                countSpan.style.bottom = '0';
                countSpan.style.right = '2px';
                countSpan.style.fontSize = '10px';
                countSpan.style.fontWeight = 'bold';
                countSpan.style.color = '#fff';
                countSpan.style.textShadow = '1px 1px 0 #000';
                countSpan.innerText = item.count;
                col.appendChild(countSpan);
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

// Slot array'ini tipine göre al
function getSlotArray(type) {
    switch(type) {
        case 'inv': return mainInventory;
        case 'hot': return hotbar;
        case 'armor': return armorSlots;
        case 'craft': return craftingGrid;
        default: return null;
    }
}

function handleSlotClick(index, type) {
    // Crafting output özel işlem
    if (type === 'result') {
        if (craftingOutput) {
            // Crafting sonucunu al ve envantere ekle
            addItemToInventory(craftingOutput);
            craftingOutput = null;
            // Crafting grid'i temizle
            for (let i = 0; i < craftingGrid.length; i++) {
                if (craftingGrid[i] && craftingGrid[i].count > 0) {
                    craftingGrid[i].count--;
                    if (craftingGrid[i].count <= 0) craftingGrid[i] = null;
                }
            }
            updateCraftingResult();
            updateInventoryUI();
        }
        return;
    }
    
    if (selectedSlotIndex === -1) {
        // Slot seç
        const arr = getSlotArray(type);
        if (!arr || !arr[index]) return; // Boş slot seçilemez
        
        selectedSlotIndex = index;
        selectedSlotType = type;
        // Visual feedback
        const slot = document.querySelector(`.inv-slot[data-type="${type}"][data-index="${index}"]`);
        if(slot) slot.style.borderColor = '#ffff00';
    } else {
        // Swap veya stack birleştirme
        const sourceArr = getSlotArray(selectedSlotType);
        const targetArr = getSlotArray(type);
        
        if (!sourceArr || !targetArr) {
            resetSlotSelection();
            return;
        }
        
        const sourceItem = sourceArr[selectedSlotIndex];
        const targetItem = targetArr[index];
        
        // Aynı item mi? Stack birleştir
        if (sourceItem && targetItem && sourceItem.id === targetItem.id) {
            const maxStack = getMaxStackSize(sourceItem.id);
            const canAdd = maxStack - targetItem.count;
            const toAdd = Math.min(canAdd, sourceItem.count);
            
            targetItem.count += toAdd;
            sourceItem.count -= toAdd;
            
            if (sourceItem.count <= 0) {
                sourceArr[selectedSlotIndex] = null;
            }
        } else {
            // Normal swap
            sourceArr[selectedSlotIndex] = targetItem;
            targetArr[index] = sourceItem;
        }
        
        resetSlotSelection();
        updateCraftingResult();
        updateInventoryUI();
    }
}

function resetSlotSelection() {
    const prevSlot = document.querySelector(`.inv-slot[data-type="${selectedSlotType}"][data-index="${selectedSlotIndex}"]`);
    if(prevSlot) {
        prevSlot.style.border = '2px solid #373737';
        prevSlot.style.borderBottom = '2px solid #fff';
        prevSlot.style.borderRight = '2px solid #fff';
    }
    selectedSlotIndex = -1;
    selectedSlotType = null;
}

// Envantere item ekle (first available slot)
function addItemToInventory(item) {
    if (!item) return false;
    
    const maxStack = getMaxStackSize(item.id);
    let remaining = item.count;
    
    // Önce mevcut stack'lere ekle
    for (let i = 0; i < hotbar.length && remaining > 0; i++) {
        if (hotbar[i] && hotbar[i].id === item.id && hotbar[i].count < maxStack) {
            const canAdd = Math.min(maxStack - hotbar[i].count, remaining);
            hotbar[i].count += canAdd;
            remaining -= canAdd;
        }
    }
    for (let i = 0; i < mainInventory.length && remaining > 0; i++) {
        if (mainInventory[i] && mainInventory[i].id === item.id && mainInventory[i].count < maxStack) {
            const canAdd = Math.min(maxStack - mainInventory[i].count, remaining);
            mainInventory[i].count += canAdd;
            remaining -= canAdd;
        }
    }
    
    // Boş slotlara ekle
    for (let i = 0; i < hotbar.length && remaining > 0; i++) {
        if (!hotbar[i]) {
            const toAdd = Math.min(maxStack, remaining);
            hotbar[i] = createStack(item.id, toAdd);
            remaining -= toAdd;
        }
    }
    for (let i = 0; i < mainInventory.length && remaining > 0; i++) {
        if (!mainInventory[i]) {
            const toAdd = Math.min(maxStack, remaining);
            mainInventory[i] = createStack(item.id, toAdd);
            remaining -= toAdd;
        }
    }
    
    return remaining === 0;
}

function handleHotbarSwap(hovered, targetHotbarIndex) {
    const sourceArr = getSlotArray(hovered.type);
    if (!sourceArr) return;
    
    const sourceIndex = hovered.index;
    const temp = sourceArr[sourceIndex];
    sourceArr[sourceIndex] = hotbar[targetHotbarIndex];
    hotbar[targetHotbarIndex] = temp;
    
    updateInventoryUI();
}
// Crafting sonucunu güncelle (crafting.js entegrasyonu)
function updateCraftingResult() {
    // Crafting.js varsa onu kullan
    if (typeof getCraftingResult === 'function') {
        craftingOutput = getCraftingResult(craftingGrid);
    } else {
        craftingOutput = null;
    }
}

// Seçili blok ID'sini al (block yerleştirme için)
function getSelectedBlockId() {
    const item = hotbar[selectedSlot - 1];
    return item ? item.id : 0;
}

// Seçili slottan 1 adet item azalt
function consumeSelectedItem() {
    const item = hotbar[selectedSlot - 1];
    if (item && item.count > 0) {
        item.count--;
        if (item.count <= 0) {
            hotbar[selectedSlot - 1] = null;
        }
        updateHudHotbar();
    }
}

console.log("[Inventory] 46-slot inventory system loaded");