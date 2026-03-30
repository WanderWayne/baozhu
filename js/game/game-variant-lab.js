(function () {
    if (!window.Game || !window.DragSystem) return;

    const MODE_ID = 'variant_lab';
    const HOTBAR_SIZE = 8;

    const LAB_CONFIG = {
        worldWidth: 2400,
        worldHeight: 980,
        outer: { x: 80, y: 110, w: 2240, h: 620 },
        lockLineX: 1040,
        viewPreviewRight: 80,
        inventorySafeGap: 16,
        roomMarginTop: 22,
        roomMarginBottom: 26,
        roomMarginX: 16,
        overscrollDamping: 0.35,
        overscrollMax: 92,
        debugGridStep: 34,
        judgeTolerance: 8,
        walls: [
            { x: 1460, y: 185, w: 260, h: 180 },
            { x: 1460, y: 460, w: 260, h: 180 }
        ],
        safeDrop: { x: 430, y: 430 }
    };

    const originalStartGame = window.Game.prototype.startGame;
    window.Game.prototype.startGame = function () {
        originalStartGame.call(this);
        if (this.levelData && this.levelData.specialMode === MODE_ID) {
            this.initVariantLabMode();
        }
    };

    const originalAddToInventory = window.Game.prototype.addToInventoryIfNotExists;
    window.Game.prototype.addToInventoryIfNotExists = function (itemName) {
        if (!this.variantLab) {
            return originalAddToInventory.call(this, itemName);
        }
        this.variantAddOwnedItem(itemName);
    };

    const originalCreateSugarSparkle = window.Game.prototype.createSugarSparkle;
    window.Game.prototype.createSugarSparkle = function () {
        if (!this.variantLab || !this.variantLab.world || !this.variantLab.viewport) {
            return originalCreateSugarSparkle.call(this);
        }

        const sparkle = document.createElement('div');
        sparkle.className = 'sugar-sparkle variant-sugar-sparkle';

        const vp = this.variantLab.viewport;
        const visibleLeft = -this.variantLab.mapX;
        const visibleTop = -this.variantLab.mapY;
        const visibleRight = visibleLeft + vp.clientWidth;
        const visibleBottom = visibleTop + vp.clientHeight;

        // 在当前可视区域内随机生成（避开极边缘）
        const x = visibleLeft + (visibleRight - visibleLeft) * (0.1 + Math.random() * 0.8);
        const y = visibleTop + (visibleBottom - visibleTop) * (0.1 + Math.random() * 0.7);

        sparkle.style.left = x + 'px';
        sparkle.style.top = y + 'px';

        const size = 10 + Math.random() * 8;
        sparkle.style.width = size + 'px';
        sparkle.style.height = size + 'px';

        this.variantLab.world.appendChild(sparkle);
        setTimeout(() => sparkle.remove(), 2500);
    };

    const originalTryOfferToDoor = window.Game.prototype.tryOfferToDoor;
    window.Game.prototype.tryOfferToDoor = function (itemEl) {
        if (this.variantLab) return false;
        return originalTryOfferToDoor.call(this, itemEl);
    };

    const originalDragStart = window.DragSystem.prototype.dragStart;
    window.DragSystem.prototype.dragStart = function (e) {
        if (this.game && this.game.variantLab && this.game.variantLab.backpackOpen) {
            return;
        }
        const result = originalDragStart.call(this, e);
        if (this.game && this.game.variantLab && this.activeItem) {
            const rect = this.activeItem.getBoundingClientRect();
            this.variantLastAllowed = { left: rect.left, top: rect.top };
            this.variantLastAllowedWorld = null;
        } else {
            this.variantLastAllowed = null;
            this.variantLastAllowedWorld = null;
        }
        return result;
    };

    const originalDrag = window.DragSystem.prototype.drag;
    window.DragSystem.prototype.drag = function (e) {
        const result = originalDrag.call(this, e);
        if (!this.game || !this.game.variantLab || !this.activeItem || !this.isDragging) {
            return result;
        }
        // 从物品栏（背包换入热栏后的来源）拖出的物品：拖动过程不做卡边，松手再判定
        if (this.fromInventory) {
            return result;
        }

        const game = this.game;
        const rect = this.activeItem.getBoundingClientRect();
        const halfW = rect.width * 0.5;
        const halfH = rect.height * 0.5;
        const candidateLeft = parseFloat(this.activeItem.style.left) || rect.left;
        const candidateTop = parseFloat(this.activeItem.style.top) || rect.top;
        const candidateCenter = game.variantWorldFromClient(candidateLeft + halfW, candidateTop + halfH);
        const padX = Math.ceil(halfW);
        const padY = Math.ceil(halfH);

        const isAllowed = game.variantIsPointAllowed(candidateCenter.x, candidateCenter.y, padX, padY);
        if (isAllowed) {
            this.variantLastAllowed = { left: candidateLeft, top: candidateTop };
            this.variantLastAllowedWorld = {
                left: candidateCenter.x - halfW,
                top: candidateCenter.y - halfH
            };
            return result;
        }

        const start = this.variantLastAllowed || { left: candidateLeft, top: candidateTop };
        let best = { left: start.left, top: start.top };
        let lo = 0;
        let hi = 1;
        for (let i = 0; i < 10; i += 1) {
            const mid = (lo + hi) * 0.5;
            const testLeft = start.left + (candidateLeft - start.left) * mid;
            const testTop = start.top + (candidateTop - start.top) * mid;
            const testCenter = game.variantWorldFromClient(testLeft + halfW, testTop + halfH);
            if (game.variantIsPointAllowed(testCenter.x, testCenter.y, padX, padY)) {
                best = { left: testLeft, top: testTop };
                lo = mid;
            } else {
                hi = mid;
            }
        }

        this.activeItem.style.left = best.left + 'px';
        this.activeItem.style.top = best.top + 'px';
        this.variantLastAllowed = best;
        const bestCenter = game.variantWorldFromClient(best.left + halfW, best.top + halfH);
        this.variantLastAllowedWorld = {
            left: bestCenter.x - halfW,
            top: bestCenter.y - halfH
        };
        return result;
    };

    const originalDragEnd = window.DragSystem.prototype.dragEnd;
    window.DragSystem.prototype.dragEnd = function (e) {
        const draggedRef = this.activeItem;
        const lastAllowedWorld = this.variantLastAllowedWorld
            ? { left: this.variantLastAllowedWorld.left, top: this.variantLastAllowedWorld.top }
            : null;

        const result = originalDragEnd.call(this, e);

        if (this.game && this.game.variantLab && draggedRef && draggedRef.parentElement === this.synthesisArea && lastAllowedWorld) {
            draggedRef.dataset.variantLastAllowedLeft = String(lastAllowedWorld.left);
            draggedRef.dataset.variantLastAllowedTop = String(lastAllowedWorld.top);
        }
        this.variantLastAllowed = null;
        this.variantLastAllowedWorld = null;
        return result;
    };

    window.Game.prototype.initVariantLabMode = function () {
        if (this.variantLab) return;

        document.body.classList.add('variant-lab-active');
        this.variantLab = {
            hotbar: new Array(HOTBAR_SIZE).fill(null),
            ownedItems: [],
            selectedRef: null,
            backpackOpen: false,
            lockOpened: false,
            fragmentCount: 0,
            mechanismActivated: false,
            tradeTimes: 0,
            tradePool: ['可可', '果酱', '香草', '菌种']
        };

        const identity = document.getElementById('identity-plaque');
        const levelInfo = document.querySelector('.level-info');
        const doorStatus = document.getElementById('door-status');
        const doorContainer = document.getElementById('door-container');
        if (identity) identity.style.display = 'none';
        if (levelInfo) levelInfo.style.display = 'none';
        if (doorStatus) doorStatus.style.display = 'none';
        if (doorContainer) doorContainer.style.display = 'none';

        this.variantSetupMapShell();
        this.variantSetupCamera();
        this.variantSetupNodes();
        this.variantSetupInventoryAndBackpack();
        this.variantBindGlobalHandlers();
        this.variantRenderAll();
    };

    window.Game.prototype.variantSetupMapShell = function () {
        const inventory = document.getElementById('inventory-area');
        const doorArea = document.getElementById('door-area');
        const synthesis = document.getElementById('synthesis-area');
        const milkFog = document.getElementById('milk-fog-container');
        const backBtn = document.getElementById('back-btn');
        if (!inventory || !doorArea || !synthesis) return;

        const viewport = document.createElement('div');
        viewport.id = 'variant-map-viewport';
        const world = document.createElement('div');
        world.id = 'variant-map-world';
        viewport.appendChild(world);
        document.body.insertBefore(viewport, inventory);

        // 把奶雾层放进游玩区，让它随地图移动
        if (milkFog) {
            world.appendChild(milkFog);
        }

        // 扩展底色画布：覆盖外边界外至少 500px，避免暗红区出现“没贴合地图底色”的断层感
        const worldBackdrop = document.createElement('div');
        worldBackdrop.className = 'variant-world-backdrop';
        worldBackdrop.style.left = (LAB_CONFIG.outer.x - 500) + 'px';
        worldBackdrop.style.top = (LAB_CONFIG.outer.y - 500) + 'px';
        worldBackdrop.style.width = (LAB_CONFIG.outer.w + 1000) + 'px';
        worldBackdrop.style.height = (LAB_CONFIG.outer.h + 1000) + 'px';
        world.appendChild(worldBackdrop);

        world.appendChild(doorArea);
        world.appendChild(synthesis);
        this.variantLab.viewport = viewport;
        this.variantLab.world = world;

        // 拆分 UI 层：返回按钮固定，不跟随地图移动
        if (backBtn) {
            const uiLayer = document.createElement('div');
            uiLayer.id = 'variant-ui-layer';
            document.body.appendChild(uiLayer);
            uiLayer.appendChild(backBtn);
            this.variantLab.uiLayer = uiLayer;
        }

        const outer = document.createElement('div');
        outer.className = 'variant-outer-boundary';
        outer.style.left = LAB_CONFIG.outer.x + 'px';
        outer.style.top = LAB_CONFIG.outer.y + 'px';
        outer.style.width = LAB_CONFIG.outer.w + 'px';
        outer.style.height = LAB_CONFIG.outer.h + 'px';
        world.appendChild(outer);

        const overlap = 2;
        const outerRedZones = [
            { cls: 'top', left: LAB_CONFIG.outer.x - overlap, top: LAB_CONFIG.outer.y - 500, width: LAB_CONFIG.outer.w + overlap * 2, height: 500 + overlap },
            { cls: 'bottom', left: LAB_CONFIG.outer.x - overlap, top: LAB_CONFIG.outer.y + LAB_CONFIG.outer.h - overlap, width: LAB_CONFIG.outer.w + overlap * 2, height: 500 + overlap },
            { cls: 'left', left: LAB_CONFIG.outer.x - 500, top: LAB_CONFIG.outer.y - 500 - overlap, width: 500 + overlap, height: LAB_CONFIG.outer.h + 1000 + overlap * 2 },
            { cls: 'right', left: LAB_CONFIG.outer.x + LAB_CONFIG.outer.w - overlap, top: LAB_CONFIG.outer.y - 500 - overlap, width: 500 + overlap, height: LAB_CONFIG.outer.h + 1000 + overlap * 2 }
        ];
        this.variantLab.outerRedZoneEls = [];
        outerRedZones.forEach((z) => {
            const el = document.createElement('div');
            el.className = 'variant-outer-redzone ' + z.cls;
            el.style.left = z.left + 'px';
            el.style.top = z.top + 'px';
            el.style.width = z.width + 'px';
            el.style.height = z.height + 'px';
            world.appendChild(el);
            this.variantLab.outerRedZoneEls.push(el);
        });

        const line = document.createElement('div');
        line.className = 'variant-boundary-line';
        line.style.left = (LAB_CONFIG.lockLineX - 7) + 'px';
        line.style.top = (LAB_CONFIG.outer.y + 24) + 'px';
        line.style.height = (LAB_CONFIG.outer.h - 48) + 'px';
        world.appendChild(line);
        this.variantLab.lockLineEl = line;

        LAB_CONFIG.walls.forEach((wall) => {
            const wallEl = document.createElement('div');
            wallEl.className = 'variant-wall-line';
            wallEl.style.left = wall.x + 'px';
            wallEl.style.top = wall.y + 'px';
            wallEl.style.width = wall.w + 'px';
            wallEl.style.height = wall.h + 'px';
            world.appendChild(wallEl);
        });
    };

    window.Game.prototype.variantSetupCamera = function () {
        const state = this.variantLab;
        if (!state || !state.viewport || !state.world) return;

        state.mapX = -LAB_CONFIG.outer.x;
        state.mapY = -LAB_CONFIG.outer.y;

        const collapseRange = (lower, upper) => {
            if (lower <= upper) return { min: lower, max: upper };
            const center = (lower + upper) * 0.5;
            return { min: center, max: center };
        };

        const axisRange = (contentStart, contentEnd, viewStart, viewEnd) => {
            // mapTranslate 的合法区间：
            // 1) contentEnd + t <= viewEnd  => t <= viewEnd - contentEnd
            // 2) contentStart + t >= viewStart => t >= viewStart - contentStart
            const lower = viewEnd - contentEnd;
            const upper = viewStart - contentStart;
            return collapseRange(lower, upper);
        };

        const getBounds = () => {
            const viewportRect = state.viewport.getBoundingClientRect();
            const inventoryRect = document.getElementById('inventory-area').getBoundingClientRect();
            const usableHeight = Math.max(0, inventoryRect.top - viewportRect.top - LAB_CONFIG.inventorySafeGap);

            const roomLeft = LAB_CONFIG.outer.x;
            const roomRight = state.lockOpened ? (LAB_CONFIG.outer.x + LAB_CONFIG.outer.w) : (LAB_CONFIG.lockLineX + LAB_CONFIG.viewPreviewRight);
            const roomTop = LAB_CONFIG.outer.y;
            const roomBottom = LAB_CONFIG.outer.y + LAB_CONFIG.outer.h;

            const xRange = axisRange(
                roomLeft,
                roomRight,
                LAB_CONFIG.roomMarginX,
                state.viewport.clientWidth - LAB_CONFIG.roomMarginX
            );
            const yRange = axisRange(
                roomTop,
                roomBottom,
                LAB_CONFIG.roomMarginTop,
                usableHeight - LAB_CONFIG.roomMarginBottom
            );

            return {
                minX: xRange.min,
                maxX: xRange.max,
                minY: yRange.min,
                maxY: yRange.max
            };
        };

        const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
        const withElastic = (value, min, max) => {
            if (value < min) {
                const soft = min - (min - value) * LAB_CONFIG.overscrollDamping;
                return Math.max(min - LAB_CONFIG.overscrollMax, soft);
            }
            if (value > max) {
                const soft = max + (value - max) * LAB_CONFIG.overscrollDamping;
                return Math.min(max + LAB_CONFIG.overscrollMax, soft);
            }
            return value;
        };

        const springBack = () => {
            const b = getBounds();
            const targetX = clamp(state.mapX, b.minX, b.maxX);
            const targetY = clamp(state.mapY, b.minY, b.maxY);
            const startX = state.mapX;
            const startY = state.mapY;
            const duration = 280;
            const start = performance.now();

            const frame = (now) => {
                const t = Math.min(1, (now - start) / duration);
                const eased = 1 - Math.pow(1 - t, 3);
                state.mapX = startX + (targetX - startX) * eased;
                state.mapY = startY + (targetY - startY) * eased;
                state.world.style.transform = 'translate(' + state.mapX + 'px, ' + state.mapY + 'px)';
                if (t < 1) {
                    requestAnimationFrame(frame);
                }
            };
            requestAnimationFrame(frame);
        };

        const clampAndApply = () => {
            const b = getBounds();
            state.mapX = clamp(state.mapX, b.minX, b.maxX);
            state.mapY = clamp(state.mapY, b.minY, b.maxY);
            state.world.style.transform = 'translate(' + state.mapX + 'px, ' + state.mapY + 'px)';
        };

        state.clampAndApply = clampAndApply;
        clampAndApply();
        window.addEventListener('resize', clampAndApply);

        let pan = null;
        let velX = 0;
        let velY = 0;
        let lastMoveTime = 0;
        let lastMoveX = 0;
        let lastMoveY = 0;
        let inertiaRaf = 0;

        const stopInertia = () => {
            if (inertiaRaf) {
                cancelAnimationFrame(inertiaRaf);
                inertiaRaf = 0;
            }
        };

        state.viewport.addEventListener('pointerdown', (e) => {
            if (state.backpackOpen) return;
            if (e.target.closest('.game-item')) return;
            stopInertia();
            pan = { x: e.clientX, y: e.clientY, mapX: state.mapX, mapY: state.mapY };
            velX = 0;
            velY = 0;
            lastMoveX = e.clientX;
            lastMoveY = e.clientY;
            lastMoveTime = performance.now();
            state.viewport.setPointerCapture(e.pointerId);
        });

        state.viewport.addEventListener('pointermove', (e) => {
            if (!pan) return;
            const now = performance.now();
            const dt = Math.max(1, now - lastMoveTime);
            const dx = e.clientX - lastMoveX;
            const dy = e.clientY - lastMoveY;
            velX = dx / dt * 1000;
            velY = dy / dt * 1000;
            lastMoveX = e.clientX;
            lastMoveY = e.clientY;
            lastMoveTime = now;

            const b = getBounds();
            const nextX = pan.mapX + (e.clientX - pan.x);
            const nextY = pan.mapY + (e.clientY - pan.y);
            state.mapX = withElastic(nextX, b.minX, b.maxX);
            state.mapY = withElastic(nextY, b.minY, b.maxY);
            state.world.style.transform = 'translate(' + state.mapX + 'px, ' + state.mapY + 'px)';
        });

        const runInertia = () => {
            const friction = 0.92;
            const minSpeed = 8;
            let prevTime = performance.now();

            const tick = (now) => {
                const dt = Math.min(32, now - prevTime) / 16.67;
                prevTime = now;
                velX *= Math.pow(friction, dt);
                velY *= Math.pow(friction, dt);

                const speed = Math.hypot(velX, velY);
                if (speed < minSpeed) {
                    inertiaRaf = 0;
                    springBack();
                    return;
                }

                const b = getBounds();
                const nextX = state.mapX + (velX / 1000) * 16.67 * dt;
                const nextY = state.mapY + (velY / 1000) * 16.67 * dt;
                state.mapX = withElastic(nextX, b.minX, b.maxX);
                state.mapY = withElastic(nextY, b.minY, b.maxY);

                const overX = state.mapX < b.minX || state.mapX > b.maxX;
                const overY = state.mapY < b.minY || state.mapY > b.maxY;
                if (overX) velX *= 0.4;
                if (overY) velY *= 0.4;

                state.world.style.transform = 'translate(' + state.mapX + 'px, ' + state.mapY + 'px)';
                inertiaRaf = requestAnimationFrame(tick);
            };
            inertiaRaf = requestAnimationFrame(tick);
        };

        const endPan = () => {
            if (!pan) return;
            const timeSinceLastMove = performance.now() - lastMoveTime;
            pan = null;

            if (timeSinceLastMove < 80 && Math.hypot(velX, velY) > 60) {
                runInertia();
            } else {
                springBack();
            }
        };
        state.viewport.addEventListener('pointerup', endPan);
        state.viewport.addEventListener('pointercancel', endPan);
    };

    window.Game.prototype.variantSetupNodes = function () {
        const world = this.variantLab.world;
        if (!world) return;

        const nodes = [
            { id: 'fragment', icon: '🧿', x: 1280, y: 160 },
            { id: 'mechanism', icon: '⚙️', x: 1760, y: 350 },
            { id: 'trade', icon: '♻️', x: 1280, y: 540 }
        ];

        this.variantLab.nodeElements = {};
        nodes.forEach((node) => {
            const zone = document.createElement('div');
            zone.className = 'variant-zone';
            zone.style.left = node.x + 'px';
            zone.style.top = node.y + 'px';
            zone.dataset.zone = node.id;
            zone.innerHTML = '<div class="variant-node">' + node.icon + '</div>';
            world.appendChild(zone);
            this.variantLab.nodeElements[node.id] = zone;
        });
    };

    window.Game.prototype.variantSetupInventoryAndBackpack = function () {
        const inventory = document.getElementById('inventory-area');
        inventory.classList.add('variant-hotbar');
        inventory.innerHTML = '';

        const openBtn = document.createElement('button');
        openBtn.className = 'variant-lab-open-btn';
        openBtn.type = 'button';
        openBtn.textContent = '背包';
        openBtn.addEventListener('click', () => this.variantToggleBackpack(!this.variantLab.backpackOpen));
        document.body.appendChild(openBtn);
        this.variantLab.openBtn = openBtn;

        const uniqueInitial = [];
        (this.levelData.initialItems || []).forEach((name) => {
            if (!uniqueInitial.includes(name)) uniqueInitial.push(name);
        });
        uniqueInitial.forEach((name) => this.variantAddOwnedItem(name, true));
    };

    window.Game.prototype.variantBindGlobalHandlers = function () {
        const state = this.variantLab;
        if (!state) return;

        this._variantValidatePending = false;
        this._variantPostDropValidate = () => {
            if (this._variantValidatePending) return;
            this._variantValidatePending = true;
            setTimeout(() => {
                this._variantValidatePending = false;
                this.variantEnforceItemBounds();
                this.variantTryNodeConsume();
            }, 0);
        };
        document.addEventListener('pointerup', this._variantPostDropValidate);
        document.addEventListener('mouseup', this._variantPostDropValidate);
        document.addEventListener('touchend', this._variantPostDropValidate, { passive: true });

        const inventory = document.getElementById('inventory-area');
        inventory.addEventListener('click', (e) => {
            const item = e.target.closest('.game-item');
            const slot = e.target.closest('.variant-slot');
            if (!item && !slot) return;
            const index = Number((item || slot).dataset.slotIndex);
            this.variantHandleSelect({ type: 'hotbar', index });
        });
    };

    window.Game.prototype.variantWorldFromClient = function (x, y) {
        const state = this.variantLab;
        const rect = state.viewport.getBoundingClientRect();
        return {
            x: x - rect.left - state.mapX,
            y: y - rect.top - state.mapY
        };
    };

    window.Game.prototype.variantNodeWorldCenter = function (zoneEl) {
        const rect = zoneEl.getBoundingClientRect();
        return this.variantWorldFromClient(rect.left + rect.width * 0.5, rect.top + rect.height * 0.5);
    };


    window.Game.prototype.variantIsPointAllowed = function (x, y, padX = 0, padY = 0) {
        const tol = LAB_CONFIG.judgeTolerance;
        const effPadX = Math.max(0, padX - tol);
        const effPadY = Math.max(0, padY - tol);
        const minX = LAB_CONFIG.outer.x + effPadX;
        const maxX = LAB_CONFIG.outer.x + LAB_CONFIG.outer.w - effPadX;
        const minY = LAB_CONFIG.outer.y + effPadY;
        const maxY = LAB_CONFIG.outer.y + LAB_CONFIG.outer.h - effPadY;

        const inOuter = x >= minX && x <= maxX && y >= minY && y <= maxY;
        if (!inOuter) return false;
        if (!this.variantLab.lockOpened && x >= (LAB_CONFIG.lockLineX - effPadX + tol)) return false;
        for (const wall of LAB_CONFIG.walls) {
            const inWall = x >= (wall.x - effPadX + tol) && x <= (wall.x + wall.w + effPadX - tol) &&
                y >= (wall.y - effPadY + tol) && y <= (wall.y + wall.h + effPadY - tol);
            if (inWall) return false;
        }
        return true;
    };

    window.Game.prototype.variantIsRectAllowed = function (left, top, width, height) {
        const tol = LAB_CONFIG.judgeTolerance;
        const rectLeft = left;
        const rectTop = top;
        const rectRight = left + width;
        const rectBottom = top + height;

        // 必须完全处于外边界内
        if (rectLeft < LAB_CONFIG.outer.x - tol) return false;
        if (rectRight > LAB_CONFIG.outer.x + LAB_CONFIG.outer.w + tol) return false;
        if (rectTop < LAB_CONFIG.outer.y - tol) return false;
        if (rectBottom > LAB_CONFIG.outer.y + LAB_CONFIG.outer.h + tol) return false;

        // 关线未开时，整颗物品不能越过
        if (!this.variantLab.lockOpened && rectRight > (LAB_CONFIG.lockLineX + tol)) return false;

        // 与墙线矩形相交即非法
        for (const wall of LAB_CONFIG.walls) {
            const overlapX = rectLeft < (wall.x + wall.w - tol) && rectRight > (wall.x + tol);
            const overlapY = rectTop < (wall.y + wall.h - tol) && rectBottom > (wall.y + tol);
            if (overlapX && overlapY) return false;
        }
        return true;
    };

    window.Game.prototype.variantMoveItemToSafeDrop = function (itemEl) {
        const synthesis = document.getElementById('synthesis-area');
        if (!synthesis) return;
        const relX = LAB_CONFIG.safeDrop.x;
        const relY = LAB_CONFIG.safeDrop.y;
        itemEl.style.left = Math.max(8, relX) + 'px';
        itemEl.style.top = Math.max(8, relY) + 'px';
        if (itemEl.parentElement !== synthesis) {
            synthesis.appendChild(itemEl);
        }
    };

    window.Game.prototype.variantEnforceItemBounds = function () {
        const synthesis = document.getElementById('synthesis-area');
        if (!synthesis) return;
        const items = Array.from(synthesis.querySelectorAll('.game-item'));
        items.forEach((item) => {
            // 优先使用世界内绝对坐标（实验室已将 synthesis-area 铺满世界）
            const left = parseFloat(item.style.left);
            const top = parseFloat(item.style.top);
            const width = item.offsetWidth || 84;
            const height = item.offsetHeight || 84;

            let allowed = false;
            if (Number.isFinite(left) && Number.isFinite(top)) {
                allowed = this.variantIsRectAllowed(left, top, width, height);
            } else {
                // 回退：坐标缺失时用屏幕坐标转世界点判定
                const rect = item.getBoundingClientRect();
                const center = this.variantWorldFromClient(rect.left + rect.width * 0.5, rect.top + rect.height * 0.5);
                const padX = Math.ceil(rect.width * 0.5);
                const padY = Math.ceil(rect.height * 0.5);
                allowed = this.variantIsPointAllowed(center.x, center.y, padX, padY);
            }

            if (!allowed) {
                const fallbackLeft = Number(item.dataset.variantLastAllowedLeft);
                const fallbackTop = Number(item.dataset.variantLastAllowedTop);
                if (Number.isFinite(fallbackLeft) && Number.isFinite(fallbackTop)) {
                    item.style.left = Math.max(0, fallbackLeft) + 'px';
                    item.style.top = Math.max(0, fallbackTop) + 'px';
                } else {
                    this.variantMoveItemToSafeDrop(item);
                }
            }
        });
        // 按需求：回退到合法位置时不播放 error 音效
    };

    window.Game.prototype.variantTryNodeConsume = function () {
        const synthesis = document.getElementById('synthesis-area');
        if (!synthesis) return;
        const targetName = this.levelData.target;
        const candidates = Array.from(synthesis.querySelectorAll('.game-item')).filter((el) => el.dataset.name === targetName);
        if (!candidates.length) return;

        const nearThreshold = 96;
        for (const item of candidates) {
            const rect = item.getBoundingClientRect();
            const center = this.variantWorldFromClient(rect.left + rect.width * 0.5, rect.top + rect.height * 0.5);
            const fragmentNode = this.variantLab.nodeElements.fragment;
            const mechanismNode = this.variantLab.nodeElements.mechanism;
            const tradeNode = this.variantLab.nodeElements.trade;

            const fragCenter = this.variantNodeWorldCenter(fragmentNode);
            const mechCenter = this.variantNodeWorldCenter(mechanismNode);
            const tradeCenter = this.variantNodeWorldCenter(tradeNode);

            const distFrag = Math.hypot(center.x - fragCenter.x, center.y - fragCenter.y);
            const distMech = Math.hypot(center.x - mechCenter.x, center.y - mechCenter.y);
            const distTrade = Math.hypot(center.x - tradeCenter.x, center.y - tradeCenter.y);

            if (distFrag < nearThreshold) {
                item.remove();
                this.variantLab.fragmentCount += 1;
                if (!this.variantLab.lockOpened && this.variantLab.fragmentCount >= 3) {
                    this.variantOpenBoundaryLine();
                }
                this.variantUpdateNodeNotes();
                return;
            }

            if (distMech < nearThreshold && !this.variantLab.mechanismActivated) {
                item.remove();
                this.variantLab.mechanismActivated = true;
                this.variantUpdateNodeNotes();
                return;
            }

            if (distTrade < nearThreshold) {
                item.remove();
                this.variantLab.tradeTimes += 1;
                const reward = this.variantLab.tradePool[(this.variantLab.tradeTimes - 1) % this.variantLab.tradePool.length];
                this.variantAddOwnedItem(reward);
                this.variantUpdateNodeNotes();
                this.variantShowRewardSequence([reward]);
                return;
            }
        }
    };

    window.Game.prototype.variantOpenBoundaryLine = function () {
        this.variantLab.lockOpened = true;
        if (this.variantLab.lockLineEl) {
            this.variantLab.lockLineEl.classList.add('opened');
        }
        if (this.variantLab.clampAndApply) {
            this.variantLab.clampAndApply();
        }
        const rewards = ['可可', '果酱', '香草'].filter((name) => this.variantAddOwnedItem(name));
        if (rewards.length) {
            this.variantShowRewardSequence(rewards);
        }
    };

    window.Game.prototype.variantUpdateNodeNotes = function () {
        // 实验室不展示节点文案提示，保留空函数以兼容调用链。
    };

    window.Game.prototype.variantAddOwnedItem = function (itemName, silent) {
        if (!this.variantLab) return false;
        if (this.variantLab.ownedItems.includes(itemName)) return false;
        this.variantLab.ownedItems.push(itemName);

        if (!this.variantLab.hotbar.includes(itemName)) {
            const emptyIdx = this.variantLab.hotbar.indexOf(null);
            if (emptyIdx !== -1) {
                this.variantLab.hotbar[emptyIdx] = itemName;
            }
        }

        this.variantRenderAll();
        return true;
    };

    window.Game.prototype.variantRenderAll = function () {
        this.variantRenderHotbar();
        if (this.variantLab.backpackOpen) {
            this.variantRenderBackpackPanel();
        }
        this.variantUpdateNodeNotes();
    };

    window.Game.prototype.variantRenderHotbar = function () {
        const inventory = document.getElementById('inventory-area');
        inventory.innerHTML = '';
        for (let i = 0; i < HOTBAR_SIZE; i += 1) {
            const slot = document.createElement('div');
            slot.className = 'variant-slot';
            slot.dataset.slotIndex = String(i);
            const itemName = this.variantLab.hotbar[i];
            if (itemName) {
                const itemEl = this.createItemElement(itemName);
                itemEl.classList.add('in-inventory');
                itemEl.dataset.slotIndex = String(i);
                if (this.variantLab.selectedRef && this.variantLab.selectedRef.type === 'hotbar' && this.variantLab.selectedRef.index === i) {
                    itemEl.classList.add('variant-selected');
                }
                slot.appendChild(itemEl);
            } else if (this.variantLab.selectedRef && this.variantLab.selectedRef.type === 'hotbar' && this.variantLab.selectedRef.index === i) {
                slot.classList.add('variant-selected');
            }
            inventory.appendChild(slot);
        }
    };

    window.Game.prototype.variantToggleBackpack = function (open) {
        this.variantLab.backpackOpen = open;
        const backBtn = document.getElementById('back-btn');
        if (this.variantLab.openBtn) {
            this.variantLab.openBtn.textContent = open ? '关闭' : '背包';
        }
        if (backBtn) {
            backBtn.classList.toggle('variant-back-btn-blur', open);
        }
        if (open) {
            this.variantRenderBackpackPanel();
            return;
        }
        if (this.variantLab.backdropEl) {
            this.variantLab.backdropEl.remove();
            this.variantLab.backdropEl = null;
        }
        if (this.variantLab.backpackEl) {
            this.variantLab.backpackEl.remove();
            this.variantLab.backpackEl = null;
        }
    };

    window.Game.prototype.variantRenderBackpackPanel = function () {
        if (this.variantLab.backdropEl) this.variantLab.backdropEl.remove();
        if (this.variantLab.backpackEl) this.variantLab.backpackEl.remove();

        const backdrop = document.createElement('div');
        backdrop.className = 'variant-lab-backdrop';
        backdrop.addEventListener('click', () => this.variantToggleBackpack(false));
        document.body.appendChild(backdrop);
        this.variantLab.backdropEl = backdrop;

        const panel = document.createElement('div');
        panel.className = 'variant-lab-backpack';
        panel.innerHTML = '<div class="variant-lab-backpack-title">背包（已拥有）</div><div class="variant-lab-backpack-grid"></div>';
        const grid = panel.querySelector('.variant-lab-backpack-grid');
        this.variantLab.ownedItems.forEach((itemName, index) => {
            const wrap = document.createElement('div');
            wrap.className = 'variant-backpack-item';
            wrap.dataset.backpackIndex = String(index);
            const itemEl = this.createItemElement(itemName);
            itemEl.dataset.backpackIndex = String(index);
            if (this.variantLab.selectedRef && this.variantLab.selectedRef.type === 'backpack' && this.variantLab.selectedRef.index === index) {
                itemEl.classList.add('variant-selected');
            }
            wrap.appendChild(itemEl);
            wrap.addEventListener('click', () => this.variantHandleSelect({ type: 'backpack', index }));
            grid.appendChild(wrap);
        });
        document.body.appendChild(panel);
        this.variantLab.backpackEl = panel;
    };

    window.Game.prototype.variantHandleSelect = function (ref) {
        const selected = this.variantLab.selectedRef;
        if (!selected) {
            this.variantLab.selectedRef = ref;
            this.variantRenderAll();
            return;
        }

        if (selected.type === ref.type && selected.index === ref.index) {
            this.variantLab.selectedRef = null;
            this.variantRenderAll();
            return;
        }

        this.variantSwapRefs(selected, ref);
        this.variantLab.selectedRef = null;
        this.variantRenderAll();
    };

    window.Game.prototype.variantSwapRefs = function (a, b) {
        if (a.type === 'hotbar' && b.type === 'hotbar') {
            const tmp = this.variantLab.hotbar[a.index];
            this.variantLab.hotbar[a.index] = this.variantLab.hotbar[b.index];
            this.variantLab.hotbar[b.index] = tmp;
            return;
        }

        if (a.type === 'backpack' && b.type === 'backpack') {
            const tmp = this.variantLab.ownedItems[a.index];
            this.variantLab.ownedItems[a.index] = this.variantLab.ownedItems[b.index];
            this.variantLab.ownedItems[b.index] = tmp;
            return;
        }

        const hotRef = a.type === 'hotbar' ? a : b;
        const bagRef = a.type === 'backpack' ? a : b;
        const bagItem = this.variantLab.ownedItems[bagRef.index];
        const hotItem = this.variantLab.hotbar[hotRef.index];

        const existedIndex = this.variantLab.hotbar.findIndex((name, idx) => name === bagItem && idx !== hotRef.index);
        if (existedIndex !== -1) {
            this.variantLab.hotbar[existedIndex] = hotItem || null;
            this.variantLab.hotbar[hotRef.index] = bagItem;
            return;
        }
        this.variantLab.hotbar[hotRef.index] = bagItem;
    };

    window.Game.prototype.variantShowRewardSequence = function (rewards) {
        // 玩法实验室关闭额外提示弹字，奖励仅进入热栏/背包。
        if (!rewards || !rewards.length) return;
    };
})();
