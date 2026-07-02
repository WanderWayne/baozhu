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
        this.longPressDelay = 800; // 长按阈值（毫秒）
        this.isLongPress = false;
        this.longPressTarget = null;
        
        // 触摸反馈
        this.lastTapTime = 0;
        this.hapticFeedback = 'vibrate' in navigator;
        
        // 防止触摸后的鼠标事件重复
        this.lastTouchTime = 0;
        this.touchMouseDelay = 500; // 触摸后500ms内忽略鼠标事件
        this.userHasInteracted = false; // 用户是否已交互（用于振动API）

        this.initEvents();
    }

    // 触觉反馈（如果支持）
    vibrate(duration = 10) {
        // 只有在用户已交互且设备支持时才调用
        if (this.hapticFeedback && this.userHasInteracted && typeof navigator.vibrate === 'function') {
            // 使用 try-catch 包裹，避免任何错误
            try {
                // 检查页面是否有焦点
                if (document.hasFocus()) {
                    navigator.vibrate(duration);
                }
            } catch (e) {
                // 静默忽略错误
            }
        }
    }
    
    // 标记用户已交互（首次触摸/点击后启用振动）
    markUserInteracted() {
        this.userHasInteracted = true;
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
        // 标记用户已交互（启用振动反馈）
        this.markUserInteracted();

        // 关卡切换与自动献上期间禁止拖拽
        if (this.game && (this.game.isTransitioning || this.game._offeringInProgress)) return;
        
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

        if (target.classList.contains('offering-flight-lock')) return;
        if (target.dataset.locked === '1' && !target.classList.contains('brewing-item')) return;

        // 如果物品还未揭晓，取消揭晓
        if (this.game && this.game.cancelRevealForItem) {
            this.game.cancelRevealForItem(target);
        }

        e.preventDefault();
        
        this.isDragging = true;
        
        // 播放拿起音效
        if (window.AudioManager) {
            window.AudioManager.playSFX('pickup');
        }
        
        // 触觉反馈
        this.vibrate(5);

        const coords = this.getEventCoords(e);
        const rect = target.getBoundingClientRect();

        // 计算鼠标相对于元素中心的偏移
        this.offset.x = coords.x - rect.left;
        this.offset.y = coords.y - rect.top;

        // 记录来源
        this.fromInventory = target.classList.contains('in-inventory');

        // 保存原始位置信息（用于放回物品栏）
        this.originRect = rect;
        this.originParent = target.parentElement;
        this.sourceElement = target;

        if (this.fromInventory) {
            this.activeItem = target.cloneNode(true);
            this.activeItem.classList.remove('in-inventory');
            this.activeItem.dataset.name = target.dataset.name;
            document.body.appendChild(this.activeItem);
            
            target.classList.add('placeholder');
            target.style.transition = 'none';
            target.style.opacity = '0';
            target.style.pointerEvents = 'none';
        } else {
            this.activeItem = target;
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

        // 启动长按检测（延迟显示进度弧线，避免拖拽时闪现）；酿造中仅允许拖动，不触发长按卡片
        this.longPressTarget = target;
        this._longPressOrigin = { x: coords.x, y: coords.y };
        this._longPressCancelled = false;
        if (!target.classList.contains('brewing-item')) {
            this._longPressRingDelay = setTimeout(() => {
                if (!this._longPressCancelled) {
                    this._startLongPressRing(this.activeItem);
                }
            }, 200);
            this.longPressTimer = setTimeout(() => {
                this._completeLongPressRing(this.activeItem);
                this.handleLongPress(target);
            }, this.longPressDelay);
        } else {
            this._longPressRingDelay = null;
            this.longPressTimer = null;
        }
    }
    
    // 处理长按
    handleLongPress(target) {
        this.isLongPress = true;
        this.vibrate(30);
        
        // 取消拖拽状态
        if (this.activeItem) {
            if (!this.fromInventory) {
                this.activeItem.style.position = 'absolute';
                this.activeItem.style.transform = '';
                this.activeItem.style.boxShadow = '';
                this.activeItem.style.zIndex = '';
                this.activeItem.style.transition = '';
                this.synthesisArea.appendChild(this.activeItem);
            } else {
                this.activeItem.remove();
                // Restore the original inventory item
                if (this.sourceElement) {
                    this.sourceElement.classList.remove('placeholder');
                    this.sourceElement.style.opacity = '';
                    this.sourceElement.style.pointerEvents = '';
                }
            }
            this.activeItem = null;
        }
        this.isDragging = false;
        
        // 调用游戏的长按处理
        if (this.game && this.game.onItemLongPress) {
            this.game.onItemLongPress(target);
        }
    }
    
    cancelLongPress() {
        if (this._longPressRingDelay) {
            clearTimeout(this._longPressRingDelay);
            this._longPressRingDelay = null;
        }
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        if (this.activeItem) this._removeLongPressRing(this.activeItem);
        if (this.longPressTarget) this._removeLongPressRing(this.longPressTarget);
        this.longPressTarget = null;
    }

    _startLongPressRing(target) {
        const existing = target.querySelector('.lp-ring-svg');
        if (existing) existing.remove();

        const size = target.offsetWidth || 85;
        const r = (size / 2) - 2;
        const C = 2 * Math.PI * r;
        const delay = this.longPressDelay;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'lp-ring-svg');
        svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
        svg.style.cssText = `
            position:absolute; inset:0; width:100%; height:100%;
            pointer-events:none; z-index:20;
            transform: rotate(-90deg);
            overflow: visible;
        `;

        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
        filter.setAttribute('id', 'lp-glow');
        filter.setAttribute('x', '-40%'); filter.setAttribute('y', '-40%');
        filter.setAttribute('width', '180%'); filter.setAttribute('height', '180%');
        const blur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
        blur.setAttribute('stdDeviation', '3');
        blur.setAttribute('result', 'blur');
        const merge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
        const m1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
        m1.setAttribute('in', 'blur');
        const m2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
        m2.setAttribute('in', 'SourceGraphic');
        merge.appendChild(m1); merge.appendChild(m2);
        filter.appendChild(blur); filter.appendChild(merge);
        defs.appendChild(filter);
        svg.appendChild(defs);

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', size / 2);
        circle.setAttribute('cy', size / 2);
        circle.setAttribute('r', r);
        circle.setAttribute('fill', 'none');
        circle.setAttribute('stroke', '#E8C873');
        circle.setAttribute('stroke-width', '3.5');
        circle.setAttribute('stroke-linecap', 'round');
        circle.setAttribute('filter', 'url(#lp-glow)');
        circle.style.strokeDasharray = C;
        circle.style.strokeDashoffset = C;
        svg.appendChild(circle);
        target.appendChild(svg);

        // Force layout, then start transition
        circle.getBoundingClientRect();
        circle.style.transition = `stroke-dashoffset ${delay}ms linear`;
        circle.style.strokeDashoffset = '0';
    }

    _completeLongPressRing(target) {
        if (!target) return;
        target.classList.add('lp-gold-burst');
        const svg = target.querySelector('.lp-ring-svg');
        if (svg) svg.remove();
        setTimeout(() => target.classList.remove('lp-gold-burst'), 800);
    }

    _removeLongPressRing(target) {
        if (!target) return;
        const svg = target.querySelector('.lp-ring-svg');
        if (svg) svg.remove();
    }

    drag(e) {
        if (!this.activeItem || !this.isDragging) return;
        if (this.game && (this.game.isTransitioning || this.game._offeringInProgress)) return;

        e.preventDefault();

        const coords = this.getEventCoords(e);

        // Allow small jitter without cancelling long press (12px threshold)
        if (this.longPressTimer && !this._longPressCancelled && this._longPressOrigin) {
            const dx = coords.x - this._longPressOrigin.x;
            const dy = coords.y - this._longPressOrigin.y;
            if (Math.abs(dx) <= 12 && Math.abs(dy) <= 12) {
                return;
            }
            this._longPressCancelled = true;
            this.cancelLongPress();
        }

        const x = coords.x - this.offset.x;
        const y = coords.y - this.offset.y;

        this.activeItem.style.left = x + 'px';
        this.activeItem.style.top = y + 'px';

        if (this.game && this.game._brewingDragPair && this.activeItem.classList.contains('brewing-item')) {
            const synthRect = this.synthesisArea.getBoundingClientRect();
            const ar = this.activeItem.getBoundingClientRect();
            const relX = ar.left - synthRect.left;
            const relY = ar.top - synthRect.top;
            this.game._syncBrewingPartnerToSynthCoords(relX, relY, this.activeItem);
        }

        // 碰撞检测高亮
        this.checkCollisionHighlight();
        
        // 门靠近检测
        this.checkDoorProximity();

        // 交易站靠近检测
        this.checkTradeProximity();
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

    // 交易站靠近检测（遍历所有物品交易台，钻石交易台不参与拖拽）
    checkTradeProximity() {
        const stations = this.game.tradeStations;
        if (!stations || !this.activeItem) return;
        const itemRect = this.activeItem.getBoundingClientRect();
        const ix = itemRect.left + itemRect.width / 2;
        const iy = itemRect.top + itemRect.height / 2;
        stations.forEach(ts => {
            if (ts.type === 'gem' || ts.restocking || ts.soldOut) return;
            const boxRect = ts.box.getBoundingClientRect();
            const dx = (boxRect.left + boxRect.width / 2) - ix;
            const dy = (boxRect.top + boxRect.height / 2) - iy;
            if (Math.hypot(dx, dy) < 80) {
                ts.box.classList.add('trade-hover');
            } else {
                ts.box.classList.remove('trade-hover');
            }
        });
    }

    // 检测物品是否落在任一物品交易站上
    checkTradeHit(itemCenter) {
        const stations = this.game.tradeStations;
        if (!stations) return false;
        return stations.some(ts => {
            if (ts.type === 'gem' || ts.restocking || ts.soldOut) return false;
            const boxRect = ts.box.getBoundingClientRect();
            const dx = (boxRect.left + boxRect.width / 2) - itemCenter.x;
            const dy = (boxRect.top + boxRect.height / 2) - itemCenter.y;
            return Math.hypot(dx, dy) < 80;
        });
    }

    dragEnd(e) {
        if (this.game && (this.game.isTransitioning || this.game._offeringInProgress)) {
            this.cancelLongPress();
            this.isLongPress = false;
            if (this.activeItem) {
                if (this.fromInventory) this.returnToInventory();
                else this.activeItem.remove();
            }
            this.clearAllHighlights();
            this.activeItem = null;
            this.isDragging = false;
            this.fromInventory = false;
            this.originRect = null;
            this.originParent = null;
            this.sourceElement = null;
            return;
        }

        // 取消长按检测
        this.cancelLongPress();
        this.isLongPress = false;
        
        if (!this.activeItem || !this.isDragging) return;

        this.isDragging = false;
        
        // 清除门靠近状态
        if (this.doorContainer) {
            this.doorContainer.classList.remove('door-nearby');
        }
        // 清除所有交易站高亮
        if (this.game.tradeStations) {
            this.game.tradeStations.forEach(ts => {
                if (ts.box) ts.box.classList.remove('trade-hover');
            });
        }
        
        const synthesisRect = this.synthesisArea.getBoundingClientRect();
        const inventoryRect = this.inventoryArea.getBoundingClientRect();
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
                // 献上成功，物品会被动画处理
                // 恢复物品栏中的占位符
                if (this.fromInventory) {
                    this.removePlaceholder();
                }
                this.clearAllHighlights();
                this.activeItem = null;
                return;
            }
        }
        
        // 检查是否落在交易站上
        if (this.checkTradeHit(itemCenter)) {
            if (this.game.tradeStations) {
                this.game.tradeStations.forEach(ts => {
                    if (ts.box) ts.box.classList.remove('trade-hover');
                });
            }

            const traded = this.game.executeTrade(this.activeItem);
            if (traded) {
                if (this.fromInventory) this.removePlaceholder();
                this.clearAllHighlights();
                this.activeItem = null;
                return;
            }
        }

        // 检查是否放回物品栏
        const isInInventory = (
            itemCenter.y >= inventoryRect.top &&
            itemCenter.y <= inventoryRect.bottom &&
            itemCenter.x >= inventoryRect.left &&
            itemCenter.x <= inventoryRect.right
        );

        // 检查是否在合成区域内（竖直方向在物品栏之上，且落点在合成区矩形内）
        const isInSynthesisArea = (
            !isInInventory &&
            itemCenter.x >= synthesisRect.left &&
            itemCenter.x <= synthesisRect.right &&
            itemCenter.y >= synthesisRect.top &&
            itemCenter.y < inventoryRect.top
        );

        /** 酿造叠放：按松手位置放进合成区并拉拢伴侣（勿用 originRect，否则会回到拖拽起点） */
        const placeBrewingStackFromRelease = () => {
            const synthRect = this.synthesisArea.getBoundingClientRect();
            let relX = itemRect.left - synthRect.left;
            let relY = itemRect.top - synthRect.top;
            const iw = this.activeItem.offsetWidth || itemRect.width || 85;
            const ih = this.activeItem.offsetHeight || itemRect.height || 85;
            relX = Math.max(0, Math.min(relX, synthRect.width - iw));
            relY = Math.max(0, Math.min(relY, synthRect.height - ih));
            this.activeItem.style.transition = 'none';
            this.activeItem.style.position = 'absolute';
            this.activeItem.style.left = relX + 'px';
            this.activeItem.style.top = relY + 'px';
            this.activeItem.style.transform = '';
            this.activeItem.style.boxShadow = '';
            this.activeItem.style.zIndex = '';
            this.activeItem.offsetHeight;
            this.activeItem.style.transition = '';
            if (this.activeItem.parentElement !== this.synthesisArea) {
                this.synthesisArea.appendChild(this.activeItem);
            }
            if (this.game) this.game._syncBrewingPartnerToSynthCoords(relX, relY, this.activeItem);
        };

        if (isInInventory && this.fromInventory) {
            // 放回物品栏 - 回到原位置
            this.returnToInventory();
        } else if (isInInventory && this.activeItem.classList.contains('brewing-item')) {
            placeBrewingStackFromRelease();
            if (window.AudioManager) window.AudioManager.playSFX('drop');
        } else if (isInSynthesisArea) {
            // 播放放下音效
            if (window.AudioManager) {
                window.AudioManager.playSFX('drop');
            }
            
            // 转换坐标到 synthesis-area 相对坐标，并限制在可见范围内
            const relX = itemRect.left - synthesisRect.left;
            let relY = itemRect.top - synthesisRect.top;
            const maxY = synthesisRect.height - itemRect.height;
            if (relY > maxY) relY = maxY;
            
            // 重置样式并移动到 synthesis-area（先禁用过渡避免弹跳）
            this.activeItem.style.transition = 'none';
            this.activeItem.style.position = 'absolute';
            this.activeItem.style.left = relX + 'px';
            this.activeItem.style.top = relY + 'px';
            this.activeItem.style.transform = '';
            this.activeItem.style.boxShadow = '';
            this.activeItem.style.zIndex = '';
            this.activeItem.offsetHeight;
            this.activeItem.style.transition = '';
            
            if (this.activeItem.parentElement !== this.synthesisArea) {
                this.synthesisArea.appendChild(this.activeItem);
            }
            
            // 恢复物品栏中的占位符为正常显示
            if (this.fromInventory) {
                this.removePlaceholder();
            }

            // 检查碰撞并执行合成
            this.checkCollisionAndSynthesize();

            if (this.game && this.game._brewingDragPair && this.activeItem.classList.contains('brewing-item')) {
                const ar = this.activeItem.getBoundingClientRect();
                const relX2 = ar.left - synthesisRect.left;
                let relY2 = ar.top - synthesisRect.top;
                const maxY2 = synthesisRect.height - ar.height;
                if (relY2 > maxY2) relY2 = maxY2;
                this.game._syncBrewingPartnerToSynthCoords(relX2, relY2, this.activeItem);
            }

            // 第二关首次放物品到合成区时，引导长按查看属性
            if (this.game && this.game.levelId === 102
                && !localStorage.getItem('tut_longPress')
                && window.TutorialGuide && !window.TutorialGuide._active) {
                localStorage.setItem('tut_longPress', '1');
                const itemRef = this.activeItem;
                setTimeout(() => {
                    if (!itemRef || !itemRef.parentElement) return;
                    window.TutorialGuide.show({
                        target: itemRef,
                        text: '长按物品可以查看属性',
                        position: 'top',
                        padding: 10,
                        borderRadius: 50
                    });
                }, 400);
            }
        } else if (this.fromInventory) {
            // 不在任何有效区域，但是从物品栏拖出的 -> 回到物品栏
            this.returnToInventory();
        } else if (this.activeItem.classList.contains('brewing-item')) {
            placeBrewingStackFromRelease();
            if (window.AudioManager) window.AudioManager.playSFX('drop');
        } else {
            // 从合成区拖出且不在有效区域，销毁
            this.activeItem.remove();
        }

        // 清除所有高亮
        this.clearAllHighlights();
        
        this.activeItem = null;
        this.fromInventory = false;
        this.originRect = null;
        this.originParent = null;
        this.sourceElement = null;
    }
    
    // 放回物品栏（恢复占位符）
    returnToInventory() {
        // 恢复占位符为正常状态
        if (this.sourceElement && this.fromInventory) {
            this.sourceElement.classList.remove('placeholder');
            this.sourceElement.style.opacity = '';
            this.sourceElement.style.pointerEvents = '';
        }
        
        // 移除拖拽的克隆物品
        if (this.activeItem) {
            this.activeItem.remove();
        }
    }
    
    // 恢复占位符显示（物品成功放到合成区后，带淡入动画）
    removePlaceholder() {
        if (this.sourceElement && this.fromInventory) {
            this.sourceElement.classList.remove('placeholder');
            this.sourceElement.style.pointerEvents = '';
            
            // 淡入动画 - 慢一点让玩家看清楚
            this.sourceElement.style.transition = 'opacity 0.6s ease';
            this.sourceElement.style.opacity = '1';
            
            // 动画结束后清理 transition
            setTimeout(() => {
                if (this.sourceElement) {
                    this.sourceElement.style.transition = '';
                }
            }, 600);
        }
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
        if (!this.activeItem || this.activeItem.classList.contains('brewing-item') || this.activeItem.dataset.locked === '1') return;
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
            if (item.classList.contains('brewing-item')) continue;
            if (item.dataset.locked === '1') continue;

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
        if (!this.activeItem || this.activeItem.classList.contains('brewing-item') || this.activeItem.dataset.locked === '1') return;
        const draggedRect = this.activeItem.getBoundingClientRect();
        const draggedCenter = {
            x: draggedRect.left + draggedRect.width / 2,
            y: draggedRect.top + draggedRect.height / 2
        };

        for (const item of items) {
            if (item === this.activeItem) continue;
            if (item.querySelector('.timer-overlay')) continue;
            if (item.classList.contains('brewing-item')) continue;
            if (item.dataset.locked === '1') continue;

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
