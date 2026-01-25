// 开场序列系统 - 物品系统模块
// ================================================

IntroSystem.prototype.createItem = function(name, icon, isGolden = false) {
    // 根据屏幕尺寸调整物品大小（iPad Air: 1180x820）
    const isLargeScreen = window.innerWidth >= 800 && window.innerHeight >= 700;
    const itemWidth = isLargeScreen ? 70 : 75;
    const itemHeight = isLargeScreen ? 70 : 75;
    
    // 统一物品栏高度为 180px
    const inventoryHeight = 180;
    
    // 计算物品栏中的位置 - 只计算还在物品栏区域的物品（左上角开始排列）
    // 判断物品是否在物品栏区域：y坐标在物品栏范围内
    const inventoryTop = this.canvas.height - inventoryHeight;
    const itemsInInventory = this.items.filter(item => {
        return item.y >= inventoryTop - 50; // 在物品栏区域或附近
    });
    const itemIndex = itemsInInventory.length; // 新物品放在已有物品之后
    
    const gap = 15;
    const padding = 25;
    // 每行放 4 个（如果需要的话，目前教学只有几个）
    const itemsPerRow = 4;
    const col = itemIndex % itemsPerRow;
    const row = Math.floor(itemIndex / itemsPerRow);
    
    const startX = padding;
    const startY = this.canvas.height - inventoryHeight + padding;
    
    const item = {
        name,
        icon,
        isGolden,
        x: startX + col * (itemWidth + gap),
        y: startY + row * (itemHeight + gap),
        // 保存原始位置，用于放回
        originX: startX + col * (itemWidth + gap),
        originY: startY + row * (itemHeight + gap),
        width: itemWidth,
        height: itemHeight,
        isDragging: false,
        isInSynthesisArea: false,
        animPhase: null,
        animTarget: null,
        spinAngle: 0,
        spinStart: 0,
        el: null,
        pulseInterval: null
    };
    
    // 创建 DOM 元素
    const el = document.createElement('div');
    el.className = `intro-item ${isGolden ? 'golden' : ''}`;
    el.innerHTML = `
        <span class="item-icon">${icon}</span>
        <span class="item-name">${name}</span>
    `;
    el.style.left = item.x + 'px';
    el.style.top = item.y + 'px';
    el.style.width = itemWidth + 'px';
    el.style.height = itemHeight + 'px';
    
    const screen = document.getElementById('intro-screen');
    if (screen) {
        screen.appendChild(el);
    }
    
    item.el = el;
    this.items.push(item);
    
    // 弹出动画
    setTimeout(() => {
        el.classList.add('visible');
    }, 50);
    
    // 如果是金色，发射光波
    if (isGolden) {
        this.startGoldenPulse(item);
    }
    
    return item;
};

IntroSystem.prototype.startGoldenPulse = function(item) {
    const pulse = () => {
        if (item.isGolden && this.items.includes(item)) {
            // 从物品中心发射
            const centerX = item.x + item.width / 2;
            const centerY = item.y + item.height / 2;
            this.emitPulseWave(centerX, centerY, false);
        }
    };
    
    // 立即发射第一次
    setTimeout(pulse, 300);
    
    // 定期发射
    item.pulseInterval = setInterval(() => {
        if (item.isGolden && this.items.includes(item)) {
            const centerX = item.x + item.width / 2;
            const centerY = item.y + item.height / 2;
            this.emitPulseWave(centerX, centerY, false);
        } else {
            clearInterval(item.pulseInterval);
        }
    }, 2000);
};

IntroSystem.prototype.updateItemVisual = function(item) {
    if (item.el) {
        item.el.classList.toggle('golden', item.isGolden);
    }
    // 停止光波
    if (!item.isGolden && item.pulseInterval) {
        clearInterval(item.pulseInterval);
    }
};

IntroSystem.prototype.createSynthesisResult = function(name, icon, x, y) {
    // 根据屏幕尺寸调整
    const isLargeScreen = window.innerWidth >= 800 && window.innerHeight >= 700;
    const size = isLargeScreen ? 75 : 80;
    
    const item = {
        name,
        icon,
        x: x - size / 2,
        y: y - size / 2,
        width: size,
        height: size,
        isDragging: false,
        animPhase: null,
        animTarget: null,
        el: null
    };
    
    const el = document.createElement('div');
    el.className = 'intro-item synthesis-result';
    el.innerHTML = `
        <span class="item-icon">${icon}</span>
        <span class="item-name">${name}</span>
    `;
    el.style.left = item.x + 'px';
    el.style.top = item.y + 'px';
    el.style.width = item.width + 'px';
    el.style.height = item.height + 'px';
    
    const screen = document.getElementById('intro-screen');
    if (screen) {
        screen.appendChild(el);
    }
    
    item.el = el;
    
    // 弹出动画
    setTimeout(() => {
        el.classList.add('visible');
    }, 50);
    
    return item;
};

IntroSystem.prototype.flashWhite = function(x, y) {
    const flash = document.createElement('div');
    flash.className = 'synthesis-flash';
    flash.style.left = x + 'px';
    flash.style.top = y + 'px';
    
    document.getElementById('intro-screen').appendChild(flash);
    
    setTimeout(() => flash.remove(), 400);
};

// ==================== 拖拽系统 ====================

IntroSystem.prototype.onPointerDown = function(e) {
    if (this.state !== 'waitRicePlaced' && 
        this.state !== 'waitSynthesis' && 
        this.state !== 'waitOffer') return;
    
    const x = e.clientX;
    const y = e.clientY;
    
    // 构建可点击物品列表
    let clickableItems = [...this.items];
    if (this.synthesisResult) {
        clickableItems.push(this.synthesisResult);
    }
    
    // 检查点击的物品
    const clickedItem = clickableItems.find(item => {
        if (!item.el) return false;
        const rect = item.el.getBoundingClientRect();
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    });
    
    if (clickedItem) {
        const rect = clickedItem.el.getBoundingClientRect();
        
        // 检查是否在物品栏区域（用原始位置判断）
        const isLargeScreen = window.innerWidth >= 800 && window.innerHeight >= 700;
        const inventoryHeight = isLargeScreen ? 180 : 110;
        const isInInventory = clickedItem.originY !== undefined;
        
        // 直接拖动原物品（开场关物品拖出后不生成新的）
        this.draggedItem = clickedItem;
        this.draggedItem.isDragging = true;
        this.draggedItem.dragOffsetX = x - rect.left;
        this.draggedItem.dragOffsetY = y - rect.top;
        this.draggedItem.isClone = false;
        
        // 如果是金色物品，拖出时去掉金边和光波
        if (clickedItem.isGolden) {
            clickedItem.el.classList.remove('golden');
            if (clickedItem.pulseInterval) {
                clearInterval(clickedItem.pulseInterval);
                clickedItem.pulseInterval = null;
            }
            clickedItem.isGolden = false;
        }
        
        if (clickedItem.el) {
            clickedItem.el.classList.add('dragging');
        }
        
        e.preventDefault();
    }
};

IntroSystem.prototype.onPointerMove = function(e) {
    if (!this.draggedItem) return;
    
    const x = e.clientX - this.draggedItem.dragOffsetX;
    const y = e.clientY - this.draggedItem.dragOffsetY;
    
    this.draggedItem.x = x;
    this.draggedItem.y = y;
    
    if (this.draggedItem.el) {
        this.draggedItem.el.style.left = x + 'px';
        this.draggedItem.el.style.top = y + 'px';
    }
    
    // 检查是否在合成区域
    const inSynthesisArea = e.clientY < this.canvas.height - 150;
    this.draggedItem.isInSynthesisArea = inSynthesisArea;
    
    // 检查是否靠近门
    if (this.synthesisResult && this.draggedItem === this.synthesisResult) {
        const doorRect = this.doorEl?.getBoundingClientRect();
        if (doorRect) {
            const itemCenterX = x + this.draggedItem.width / 2;
            const itemCenterY = y + this.draggedItem.height / 2;
            const inDoorArea = itemCenterX > doorRect.left && itemCenterX < doorRect.right &&
                               itemCenterY > doorRect.top && itemCenterY < doorRect.bottom + 50;
            if (this.doorEl) {
                this.doorEl.classList.toggle('hover', inDoorArea);
            }
        }
    }
};

IntroSystem.prototype.onPointerUp = function(e) {
    if (!this.draggedItem) return;
    
    const item = this.draggedItem;
    const isLargeScreen = window.innerWidth >= 800 && window.innerHeight >= 700;
    const inventoryHeight = isLargeScreen ? 180 : 110;
    const inventoryTop = this.canvas.height - inventoryHeight;
    
    // 检查是否放在合成区域（屏幕中央偏上）
    const isInSynthesisArea = item.y < this.canvas.height - 200;
    // 检查是否放回物品栏
    const isInInventoryArea = item.y > inventoryTop - 50;
    
    if (item.el) {
        item.el.classList.remove('dragging');
    }
    
    // 状态判断
    if (this.state === 'waitRicePlaced' && item.name === '糯米') {
        // 检查是否放在合成区域（屏幕中央偏上）
        if (isInSynthesisArea) {
            item.isInSynthesisArea = true;
            this.setState('ricePlacedPulse');
        }
    } else if (this.state === 'waitSynthesis') {
        // 检查两物品是否靠近
        const rice = this.items.find(i => i.name === '糯米');
        const brewing = this.items.find(i => i.name === '酿造');
        
        if (rice && brewing) {
            const riceCenterX = rice.x + rice.width / 2;
            const riceCenterY = rice.y + rice.height / 2;
            const brewingCenterX = brewing.x + brewing.width / 2;
            const brewingCenterY = brewing.y + brewing.height / 2;
            
            const dx = riceCenterX - brewingCenterX;
            const dy = riceCenterY - brewingCenterY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // 必须真正触碰（距离小于两个物品半径之和的50%）
            if (dist < (rice.width + brewing.width) / 2 * 0.5) {
                this.setState('firstSynthesis');
            }
        }
    } else if (this.state === 'waitOffer' && item === this.synthesisResult) {
        // 检查是否在门区域
        const doorCenterY = this.centerY - 60;
        const itemCenterX = item.x + item.width / 2;
        const itemCenterY = item.y + item.height / 2;
        const dx = itemCenterX - this.centerX;
        const dy = itemCenterY - doorCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 130) {
            if (this.doorEl) this.doorEl.classList.remove('hover');
            this.setState('offerToDoor');
        }
    }
    
    this.draggedItem.isDragging = false;
    this.draggedItem = null;
};

