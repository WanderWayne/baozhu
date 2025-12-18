// 拖拽系统 V2 - 移动端优化 + 门靠近/献上检测
class DragSystem {
    constructor(game) {
        this.game = game;
        this.synthesisArea = document.getElementById('synthesis-area');
        this.inventoryArea = document.getElementById('inventory-area');
        this.doorContainer = document.getElementById('door-container');
        this.activeItem = null;
        this.offset = { x: 0, y: 0 };
        this.collisionThreshold = 65; // 稍微增大触摸设备的碰撞检测范围
        this.doorProximityThreshold = 120; // 门靠近检测距离
        this.isDragging = false;
        
        // 长按检测
        this.longPressTimer = null;
        this.longPressDelay = 500; // 长按阈值（毫秒）
        this.isLongPress = false;
        this.longPressTarget = null;
        
        // 触摸反馈
        this.lastTapTime = 0;
        this.hapticFeedback = 'vibrate' in navigator;
        
        // 防止触摸后的鼠标事件重复
        this.lastTouchTime = 0;
        this.touchMouseDelay = 500; // 触摸后500ms内忽略鼠标事件

        this.initEvents();
    }

    // 触觉反馈（如果支持）
    vibrate(duration = 10) {
        if (this.hapticFeedback) {
            try {
                navigator.vibrate(duration);
            } catch (e) {
                // 忽略错误
            }
        }
    }

    initEvents() {
        // 绑定方法
        this.boundDragStart = this.dragStart.bind(this);
        this.boundDrag = this.drag.bind(this);
        this.boundDragEnd = this.dragEnd.bind(this);
        
        // 触摸事件（优先级更高）
        document.addEventListener('touchstart', this.boundDragStart, { passive: false });
        document.addEventListener('touchmove', this.boundDrag, { passive: false });
        document.addEventListener('touchend', this.boundDragEnd);
        
        // 鼠标事件
        document.addEventListener('mousedown', this.boundDragStart);
        document.addEventListener('mousemove', this.boundDrag);
        document.addEventListener('mouseup', this.boundDragEnd);
    }

    getEventCoords(e) {
        if (e.type.startsWith('touch')) {
            return {
                x: e.touches[0]?.clientX || e.changedTouches[0]?.clientX,
                y: e.touches[0]?.clientY || e.changedTouches[0]?.clientY
            };
        }
        return { x: e.clientX, y: e.clientY };
    }

    dragStart(e) {
        // 防止重复触发（触摸+鼠标事件同时触发的情况）
        if (this.isDragging || this.activeItem) return;
        
        // 如果是长按触发的，不进入拖拽
        if (this.isLongPress) return;
        
        // 检测事件类型，防止触摸后的鼠标事件
        const isTouch = e.type.startsWith('touch');
        if (isTouch) {
            this.lastTouchTime = Date.now();
        } else {
            // 如果是鼠标事件，检查是否刚刚有触摸事件
            if (Date.now() - this.lastTouchTime < this.touchMouseDelay) {
                return; // 忽略触摸后紧跟的鼠标事件
            }
        }
        
        const target = e.target.closest('.game-item');
        if (!target) return;

        // 如果正在合成中，不可拖拽
        if (target.querySelector('.timer-overlay')) return;
        
        // 如果物品还未揭晓，取消揭晓
        if (this.game && this.game.cancelRevealForItem) {
            this.game.cancelRevealForItem(target);
        }

        e.preventDefault();
        
        // 启动长按检测
        this.longPressTarget = target;
        this.longPressTimer = setTimeout(() => {
            this.handleLongPress(target);
        }, this.longPressDelay);
        
        this.isDragging = true;
        
        // 触觉反馈
        this.vibrate(5);

        const coords = this.getEventCoords(e);
        const rect = target.getBoundingClientRect();

        // 计算鼠标相对于元素中心的偏移
        this.offset.x = coords.x - rect.left;
        this.offset.y = coords.y - rect.top;

        // 记录来源
        this.fromInventory = target.classList.contains('in-inventory');

        // 如果从物品栏拖出，克隆一个新的
        if (this.fromInventory) {
            this.activeItem = target.cloneNode(true);
            this.activeItem.classList.remove('in-inventory');
            this.activeItem.dataset.name = target.dataset.name;
            // 直接添加到body
            document.body.appendChild(this.activeItem);
        } else {
            // 从合成区域拖拽，直接使用原元素
            this.activeItem = target;
            // 先从父元素移除再添加到body，避免复制
            this.activeItem.remove();
            document.body.appendChild(this.activeItem);
        }

        // 统一处理：使用视口坐标定位
        this.activeItem.style.position = 'fixed';
        this.activeItem.style.left = rect.left + 'px';
        this.activeItem.style.top = rect.top + 'px';
        this.activeItem.style.zIndex = '1000';
        this.activeItem.style.transition = 'transform 0.1s, box-shadow 0.1s';
        this.activeItem.style.transform = 'scale(1.1)';
        this.activeItem.style.boxShadow = '0 12px 30px rgba(0,0,0,0.2)';
    }
    
    // 处理长按
    handleLongPress(target) {
        this.isLongPress = true;
        this.vibrate(30);
        
        // 取消拖拽状态
        if (this.activeItem) {
            // 如果已经开始拖拽，恢复物品位置
            if (!this.fromInventory) {
                this.activeItem.style.position = 'absolute';
                this.activeItem.style.transform = '';
                this.activeItem.style.boxShadow = '';
                this.activeItem.style.zIndex = '';
                this.activeItem.style.transition = '';
                this.synthesisArea.appendChild(this.activeItem);
            } else {
                this.activeItem.remove();
            }
            this.activeItem = null;
        }
        this.isDragging = false;
        
        // 调用游戏的长按处理
        if (this.game && this.game.onItemLongPress) {
            this.game.onItemLongPress(target);
        }
    }
    
    // 取消长按检测
    cancelLongPress() {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        this.longPressTarget = null;
    }

    drag(e) {
        if (!this.activeItem || !this.isDragging) return;
        
        // 如果移动了，取消长按检测
        this.cancelLongPress();

        e.preventDefault();

        const coords = this.getEventCoords(e);
        const x = coords.x - this.offset.x;
        const y = coords.y - this.offset.y;

        this.activeItem.style.left = x + 'px';
        this.activeItem.style.top = y + 'px';

        // 碰撞检测高亮
        this.checkCollisionHighlight();
        
        // 门靠近检测
        this.checkDoorProximity();
    }
    
    // 检测是否靠近门
    checkDoorProximity() {
        if (!this.doorContainer || !this.activeItem) return;
        
        const doorRect = this.doorContainer.getBoundingClientRect();
        const itemRect = this.activeItem.getBoundingClientRect();
        
        const doorCenter = {
            x: doorRect.left + doorRect.width / 2,
            y: doorRect.top + doorRect.height / 2
        };
        const itemCenter = {
            x: itemRect.left + itemRect.width / 2,
            y: itemRect.top + itemRect.height / 2
        };
        
        const distance = Math.hypot(doorCenter.x - itemCenter.x, doorCenter.y - itemCenter.y);
        
        if (distance < this.doorProximityThreshold) {
            this.doorContainer.classList.add('door-nearby');
        } else {
            this.doorContainer.classList.remove('door-nearby');
        }
    }

    dragEnd(e) {
        // 取消长按检测
        this.cancelLongPress();
        this.isLongPress = false;
        
        if (!this.activeItem || !this.isDragging) return;

        this.isDragging = false;
        
        // 清除门靠近状态
        if (this.doorContainer) {
            this.doorContainer.classList.remove('door-nearby');
        }
        
        const synthesisRect = this.synthesisArea.getBoundingClientRect();
        const itemRect = this.activeItem.getBoundingClientRect();
        const itemCenter = {
            x: itemRect.left + itemRect.width / 2,
            y: itemRect.top + itemRect.height / 2
        };
        
        // 优先检查：是否在门区域内（献上检测）
        if (this.checkDoorHit(itemCenter)) {
            // 尝试献上到门
            const offered = this.game.tryOfferToDoor(this.activeItem);
            if (offered) {
                // 献上成功，物品会被动画处理，不需要手动清除
                this.clearAllHighlights();
                this.activeItem = null;
                return;
            }
        }

        // 检查是否在合成区域内
        const isInSynthesisArea = (
            itemCenter.y >= synthesisRect.top &&
            itemCenter.y <= synthesisRect.bottom &&
            itemCenter.x >= synthesisRect.left &&
            itemCenter.x <= synthesisRect.right
        );

        if (isInSynthesisArea) {
            // 转换坐标到 synthesis-area 相对坐标
            const relX = itemRect.left - synthesisRect.left;
            const relY = itemRect.top - synthesisRect.top;
            
            // 重置样式并移动到 synthesis-area
            this.activeItem.style.position = 'absolute';
            this.activeItem.style.left = relX + 'px';
            this.activeItem.style.top = relY + 'px';
            this.activeItem.style.transform = '';
            this.activeItem.style.boxShadow = '';
            this.activeItem.style.zIndex = '';
            this.activeItem.style.transition = '';
            
            if (this.activeItem.parentElement !== this.synthesisArea) {
                this.synthesisArea.appendChild(this.activeItem);
            }

            // 检查碰撞并执行合成
            this.checkCollisionAndSynthesize();
        } else {
            // 不在合成区域，销毁
            this.activeItem.remove();
        }

        // 清除所有高亮
        this.clearAllHighlights();
        
        this.activeItem = null;
    }
    
    // 检测是否命中门区域
    checkDoorHit(itemCenter) {
        if (!this.doorContainer) return false;
        
        const doorRect = this.doorContainer.getBoundingClientRect();
        const doorCenter = {
            x: doorRect.left + doorRect.width / 2,
            y: doorRect.top + doorRect.height / 2
        };
        
        const distance = Math.hypot(doorCenter.x - itemCenter.x, doorCenter.y - itemCenter.y);
        
        // 使用门的半径作为命中检测
        const doorRadius = doorRect.width / 2;
        return distance < doorRadius + 30; // 稍微放宽一点
    }

    checkCollisionHighlight() {
        const items = Array.from(this.synthesisArea.querySelectorAll('.game-item'));
        const draggedRect = this.activeItem.getBoundingClientRect();
        const draggedCenter = {
            x: draggedRect.left + draggedRect.width / 2,
            y: draggedRect.top + draggedRect.height / 2
        };

        // 清除之前的高亮
        items.forEach(item => item.classList.remove('highlight'));
        this.activeItem.classList.remove('highlight');

        // 查找最近的可碰撞元素
        for (const item of items) {
            if (item === this.activeItem) continue;
            if (item.querySelector('.timer-overlay')) continue;

            const rect = item.getBoundingClientRect();
            const center = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };

            const distance = Math.hypot(center.x - draggedCenter.x, center.y - draggedCenter.y);

            if (distance < this.collisionThreshold) {
                item.classList.add('highlight');
                this.activeItem.classList.add('highlight');
                break;
            }
        }
    }

    checkCollisionAndSynthesize() {
        const items = Array.from(this.synthesisArea.querySelectorAll('.game-item'));
        const draggedRect = this.activeItem.getBoundingClientRect();
        const draggedCenter = {
            x: draggedRect.left + draggedRect.width / 2,
            y: draggedRect.top + draggedRect.height / 2
        };

        for (const item of items) {
            if (item === this.activeItem) continue;
            if (item.querySelector('.timer-overlay')) continue;

            const rect = item.getBoundingClientRect();
            const center = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };

            const distance = Math.hypot(center.x - draggedCenter.x, center.y - draggedCenter.y);

            if (distance < this.collisionThreshold) {
                // 触觉反馈 - 合成时更强的反馈
                this.vibrate(15);
                
                // 触发合成
                this.game.handleSynthesis(this.activeItem, item);
                return;
            }
        }
    }

    clearAllHighlights() {
        document.querySelectorAll('.game-item.highlight').forEach(item => {
            item.classList.remove('highlight');
        });
    }
}

window.DragSystem = DragSystem;
