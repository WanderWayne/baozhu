(function () {
    if (!window.Game || !window.DragSystem) return;

    const MODE_ID = 'abyss';

    const ABYSS_CONFIG = {
        worldWidth: 1200,
        worldHeight: 1600,
        roomCenter: { x: 600, y: 580 },
        doorSize: { w: 88, h: 110 },
        chestSize: { w: 80, h: 56 },
        overscrollDamping: 0.3,
        overscrollMax: 70,
        tutorialDelay: 900
    };

    // ==================== SVG Templates ====================

    const SVG_DOOR_CLOSED = `<svg viewBox="0 0 88 110" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="doorFrame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#a09a92"/>
          <stop offset="100%" stop-color="#8a8580"/>
        </linearGradient>
        <linearGradient id="doorInner" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stop-color="#0e0e14"/>
          <stop offset="100%" stop-color="#08080c"/>
        </linearGradient>
        <radialGradient id="doorVoid" cx="0.5" cy="0.4" r="0.6">
          <stop offset="0%" stop-color="#0a0a10"/>
          <stop offset="100%" stop-color="#050508"/>
        </radialGradient>
        <filter id="doorShadow">
          <feDropShadow dx="0" dy="3" stdDeviation="4" flood-opacity="0.12" flood-color="#4a4540"/>
        </filter>
      </defs>
      <rect x="0" y="20" width="88" height="90" fill="url(#doorFrame)" filter="url(#doorShadow)"/>
      <path d="M8,20 L8,100 L80,100 L80,20 Q80,4 44,4 Q8,4 8,20 Z" fill="url(#doorInner)"/>
      <path d="M12,24 L12,96 L76,96 L76,24 Q76,10 44,10 Q12,10 12,24 Z" fill="url(#doorVoid)"/>
      <rect x="38" y="56" width="12" height="3" fill="#2a2a30" opacity="0.5"/>
    </svg>`;

    const SVG_DOOR_OPEN = `<svg viewBox="0 0 88 110" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="doorFrameOpen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#b8a880"/>
          <stop offset="100%" stop-color="#9a8e70"/>
        </linearGradient>
        <radialGradient id="doorAbyss" cx="0.5" cy="0.45" r="0.55">
          <stop offset="0%" stop-color="#08080f"/>
          <stop offset="60%" stop-color="#040408"/>
          <stop offset="100%" stop-color="#020204"/>
        </radialGradient>
        <radialGradient id="doorGlowInner" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stop-color="rgba(218,185,107,0.15)"/>
          <stop offset="100%" stop-color="rgba(218,185,107,0)"/>
        </radialGradient>
        <filter id="doorShadowOpen">
          <feDropShadow dx="0" dy="2" stdDeviation="6" flood-opacity="0.18" flood-color="#dab96b"/>
        </filter>
      </defs>
      <rect x="0" y="20" width="88" height="90" fill="url(#doorFrameOpen)" filter="url(#doorShadowOpen)"/>
      <path d="M8,20 L8,100 L80,100 L80,20 Q80,4 44,4 Q8,4 8,20 Z" fill="url(#doorAbyss)"/>
      <path d="M12,24 L12,96 L76,96 L76,24 Q76,10 44,10 Q12,10 12,24 Z" fill="url(#doorAbyss)"/>
      <ellipse cx="44" cy="55" rx="28" ry="35" fill="url(#doorGlowInner)"/>
    </svg>`;

    const SVG_CHEST_CLOSED = `<svg viewBox="0 0 80 56" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="chestBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#9a7e58"/>
          <stop offset="100%" stop-color="#7a6040"/>
        </linearGradient>
        <linearGradient id="chestLid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#b8986a"/>
          <stop offset="100%" stop-color="#9a7e58"/>
        </linearGradient>
        <filter id="chestShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.1" flood-color="#5a4a30"/>
        </filter>
      </defs>
      <path d="M6,24 L2,56 L78,56 L74,24 Z" fill="url(#chestBody)" filter="url(#chestShadow)"/>
      <path d="M4,24 L76,24 L72,8 L8,8 Z" fill="url(#chestLid)"/>
      <rect x="35" y="22" width="10" height="8" fill="#8b7355"/>
      <rect x="37" y="24" width="6" height="4" fill="#6b5a3e"/>
    </svg>`;

    const SVG_CHEST_OPEN = `<svg viewBox="0 0 80 70" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="chestBodyOpen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#8a7050"/>
          <stop offset="100%" stop-color="#7a6040"/>
        </linearGradient>
        <linearGradient id="chestLidOpen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#b8986a"/>
          <stop offset="100%" stop-color="#a08860"/>
        </linearGradient>
        <linearGradient id="chestInner" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stop-color="#5a4a30"/>
          <stop offset="100%" stop-color="#3a2e1e"/>
        </linearGradient>
        <radialGradient id="chestGlow" cx="0.5" cy="0.3" r="0.5">
          <stop offset="0%" stop-color="rgba(218,185,107,0.2)"/>
          <stop offset="100%" stop-color="rgba(218,185,107,0)"/>
        </radialGradient>
      </defs>
      <path d="M6,38 L2,70 L78,70 L74,38 Z" fill="url(#chestBodyOpen)"/>
      <path d="M8,38 L72,38 L68,42 L12,42 Z" fill="url(#chestInner)"/>
      <rect x="10" y="42" width="60" height="24" fill="url(#chestInner)"/>
      <ellipse cx="40" cy="42" rx="24" ry="12" fill="url(#chestGlow)"/>
      <path d="M4,38 L76,38 L74,22 L72,8 L8,8 L6,22 Z" fill="url(#chestLidOpen)" transform="rotate(-25, 40, 38) translate(0, -6)"/>
    </svg>`;

    // ==================== Hooks ====================

    const originalStartGame = window.Game.prototype.startGame;
    window.Game.prototype.startGame = function () {
        originalStartGame.call(this);
        if (this.levelData && this.levelData.specialMode === MODE_ID) {
            this.initAbyssMode();
        }
    };

    const originalTryOfferToDoor = window.Game.prototype.tryOfferToDoor;
    window.Game.prototype.tryOfferToDoor = function (itemEl) {
        if (this.abyss) return false;
        return originalTryOfferToDoor.call(this, itemEl);
    };

    const originalCheckLevelCompletion = window.Game.prototype.checkLevelCompletion;
    window.Game.prototype.checkLevelCompletion = function (newItemName) {
        if (this.abyss) {
            this.abyssOnSynthesis(newItemName);
            return;
        }
        return originalCheckLevelCompletion.call(this, newItemName);
    };

    const originalCreateMilkFog = window.Game.prototype.createMilkFogParticles;
    window.Game.prototype.createMilkFogParticles = function () {
        if (this.abyss) return;
        return originalCreateMilkFog.call(this);
    };

    const originalCreateSugarSparkle = window.Game.prototype.createSugarSparkle;
    window.Game.prototype.createSugarSparkle = function () {
        if (this.abyss) return;
        return originalCreateSugarSparkle.call(this);
    };

    // ==================== Init ====================

    window.Game.prototype.initAbyssMode = function () {
        if (this.abyss) return;
        document.body.classList.add('abyss-active');

        this.abyss = {
            phase: 'init',
            chestOpened: false,
            doorReady: false,
            doorOpen: false,
            mapX: 0,
            mapY: 0
        };

        const hide = (sel) => { const el = typeof sel === 'string' ? document.querySelector(sel) : sel; if (el) el.style.display = 'none'; };
        hide('#identity-plaque');
        hide('.level-info');
        hide('#door-status');
        hide('#door-container');
        hide('#milk-fog-container');

        const inventory = document.getElementById('inventory-area');
        if (inventory) inventory.innerHTML = '';

        this.abyssSetupMapShell();
        this.abyssCreateParticles();
        this.abyssCreateDoor();
        this.abyssCreateChest();
        this.abyssSetupCamera();

        setTimeout(() => this.abyssStartTutorial(), ABYSS_CONFIG.tutorialDelay);
    };

    // ==================== Map Shell ====================

    window.Game.prototype.abyssSetupMapShell = function () {
        const inventory = document.getElementById('inventory-area');
        const synthesis = document.getElementById('synthesis-area');
        const backBtn = document.getElementById('back-btn');

        const viewport = document.createElement('div');
        viewport.id = 'abyss-viewport';
        const world = document.createElement('div');
        world.id = 'abyss-world';
        world.style.width = ABYSS_CONFIG.worldWidth + 'px';
        world.style.height = ABYSS_CONFIG.worldHeight + 'px';
        viewport.appendChild(world);
        document.body.insertBefore(viewport, inventory);

        if (synthesis) world.appendChild(synthesis);

        this.abyss.viewport = viewport;
        this.abyss.world = world;

        if (backBtn) {
            const uiLayer = document.createElement('div');
            uiLayer.id = 'abyss-ui-layer';
            document.body.appendChild(uiLayer);
            uiLayer.appendChild(backBtn);
            this.abyss.uiLayer = uiLayer;
        }
    };

    // ==================== Particles ====================

    window.Game.prototype.abyssCreateParticles = function () {
        const world = this.abyss.world;
        const container = document.createElement('div');
        container.className = 'abyss-particles';

        // Dust motes (small, white/cream, slow)
        for (let i = 0; i < 14; i++) {
            const p = document.createElement('div');
            p.className = 'abyss-particle abyss-dust';
            const size = 3 + Math.random() * 5;
            p.style.width = size + 'px';
            p.style.height = size + 'px';
            p.style.left = (Math.random() * 100) + '%';
            p.style.top = (Math.random() * 100) + '%';
            const opacity = 0.15 + Math.random() * 0.25;
            const r = Math.random();
            if (r < 0.6) {
                p.style.background = 'rgba(255,255,255,' + opacity + ')';
            } else if (r < 0.85) {
                p.style.background = 'rgba(200,195,188,' + opacity + ')';
            } else {
                p.style.background = 'rgba(218,185,107,' + (opacity * 1.2) + ')';
            }
            const dur = 10 + Math.random() * 12;
            const delay = Math.random() * -20;
            p.style.animationDuration = dur + 's';
            p.style.animationDelay = delay + 's';
            container.appendChild(p);
        }

        // Fog wisps (large, very low opacity, blurred)
        for (let i = 0; i < 4; i++) {
            const f = document.createElement('div');
            f.className = 'abyss-particle abyss-fog';
            const w = 40 + Math.random() * 50;
            const h = 12 + Math.random() * 16;
            f.style.width = w + 'px';
            f.style.height = h + 'px';
            f.style.left = (Math.random() * 80 + 10) + '%';
            f.style.top = (20 + Math.random() * 60) + '%';
            const dur = 16 + Math.random() * 10;
            const delay = Math.random() * -20;
            f.style.animationDuration = dur + 's';
            f.style.animationDelay = delay + 's';
            container.appendChild(f);
        }

        world.appendChild(container);
    };

    // ==================== Door ====================

    window.Game.prototype.abyssCreateDoor = function () {
        const world = this.abyss.world;
        const cx = ABYSS_CONFIG.roomCenter.x;
        const cy = ABYSS_CONFIG.roomCenter.y - 70;

        const door = document.createElement('div');
        door.className = 'abyss-door closed';
        door.id = 'abyss-door';
        door.style.left = (cx - ABYSS_CONFIG.doorSize.w / 2) + 'px';
        door.style.top = (cy - ABYSS_CONFIG.doorSize.h / 2) + 'px';
        door.style.width = ABYSS_CONFIG.doorSize.w + 'px';
        door.style.height = ABYSS_CONFIG.doorSize.h + 'px';
        door.innerHTML = SVG_DOOR_CLOSED;

        door.addEventListener('click', () => this.abyssOnDoorClick());
        world.appendChild(door);
        this.abyss.doorEl = door;
    };

    // ==================== Chest ====================

    window.Game.prototype.abyssCreateChest = function () {
        const world = this.abyss.world;
        const config = this.levelData.abyssConfig || { chestPosition: { x: 0.5, y: 1.4 }, chestItems: ['牛奶', '酿造'] };
        const cx = ABYSS_CONFIG.worldWidth * config.chestPosition.x;
        const cy = ABYSS_CONFIG.roomCenter.y + 300;

        const chest = document.createElement('div');
        chest.className = 'abyss-chest';
        chest.id = 'abyss-chest';
        chest.style.left = (cx - ABYSS_CONFIG.chestSize.w / 2) + 'px';
        chest.style.top = cy + 'px';
        chest.style.width = ABYSS_CONFIG.chestSize.w + 'px';
        chest.style.height = ABYSS_CONFIG.chestSize.h + 'px';
        chest.innerHTML = SVG_CHEST_CLOSED;

        chest.addEventListener('click', () => this.abyssOnChestClick());
        world.appendChild(chest);
        this.abyss.chestEl = chest;
        this.abyss.chestItems = config.chestItems;
    };

    // ==================== Camera ====================

    window.Game.prototype.abyssSetupCamera = function () {
        const state = this.abyss;
        if (!state.viewport || !state.world) return;

        const vpW = state.viewport.clientWidth;
        const vpH = state.viewport.clientHeight;
        const invH = document.getElementById('inventory-area')?.offsetHeight || 60;
        const effectiveH = vpH - invH;

        state.mapX = -(ABYSS_CONFIG.roomCenter.x - vpW / 2);
        state.mapY = -(ABYSS_CONFIG.roomCenter.y - effectiveH / 2 - 30);
        state.world.style.transform = 'translate(' + state.mapX + 'px,' + state.mapY + 'px)';

        const collapse = (lo, hi) => lo <= hi ? { min: lo, max: hi } : { min: (lo + hi) / 2, max: (lo + hi) / 2 };
        const getBounds = () => {
            const vr = state.viewport.getBoundingClientRect();
            const ih = document.getElementById('inventory-area')?.offsetHeight || 60;
            return {
                minX: collapse(vr.width - ABYSS_CONFIG.worldWidth, 0).min,
                maxX: collapse(vr.width - ABYSS_CONFIG.worldWidth, 0).max,
                minY: collapse(vr.height - ih - ABYSS_CONFIG.worldHeight, 0).min,
                maxY: collapse(vr.height - ih - ABYSS_CONFIG.worldHeight, 0).max
            };
        };

        const withElastic = (val, min, max) => {
            if (val < min) return min - Math.min((min - val) * ABYSS_CONFIG.overscrollDamping, ABYSS_CONFIG.overscrollMax);
            if (val > max) return max + Math.min((val - max) * ABYSS_CONFIG.overscrollDamping, ABYSS_CONFIG.overscrollMax);
            return val;
        };

        const springBack = () => {
            const b = getBounds();
            const tx = Math.max(b.minX, Math.min(b.maxX, state.mapX));
            const ty = Math.max(b.minY, Math.min(b.maxY, state.mapY));
            if (Math.abs(tx - state.mapX) < 0.5 && Math.abs(ty - state.mapY) < 0.5) {
                state.mapX = tx; state.mapY = ty;
                state.world.style.transform = 'translate(' + tx + 'px,' + ty + 'px)';
                return;
            }
            state.mapX += (tx - state.mapX) * 0.18;
            state.mapY += (ty - state.mapY) * 0.18;
            state.world.style.transform = 'translate(' + state.mapX + 'px,' + state.mapY + 'px)';
            requestAnimationFrame(springBack);
        };

        let pan = null, velX = 0, velY = 0, lastT = 0, lastX = 0, lastY = 0, raf = 0;
        const stopInertia = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };

        state.viewport.addEventListener('pointerdown', (e) => {
            if (e.target.closest('.game-item') || e.target.closest('.abyss-chest') || e.target.closest('.abyss-door')) return;
            stopInertia();
            pan = { x: e.clientX, y: e.clientY, mx: state.mapX, my: state.mapY };
            velX = 0; velY = 0;
            lastX = e.clientX; lastY = e.clientY; lastT = performance.now();
            state.viewport.setPointerCapture(e.pointerId);
        });

        state.viewport.addEventListener('pointermove', (e) => {
            if (!pan) return;
            const now = performance.now();
            const dt = Math.max(1, now - lastT);
            velX = (e.clientX - lastX) / dt * 1000;
            velY = (e.clientY - lastY) / dt * 1000;
            lastX = e.clientX; lastY = e.clientY; lastT = now;
            const b = getBounds();
            state.mapX = withElastic(pan.mx + (e.clientX - pan.x), b.minX, b.maxX);
            state.mapY = withElastic(pan.my + (e.clientY - pan.y), b.minY, b.maxY);
            state.world.style.transform = 'translate(' + state.mapX + 'px,' + state.mapY + 'px)';
            if (this.abyss.phase === 'drag_hint') this.abyssCheckChestVisible();
        });

        const runInertia = () => {
            let prev = performance.now();
            const tick = (now) => {
                const dt = Math.min(32, now - prev) / 16.67; prev = now;
                velX *= Math.pow(0.92, dt); velY *= Math.pow(0.92, dt);
                if (Math.hypot(velX, velY) < 8) { raf = 0; springBack(); return; }
                const b = getBounds();
                state.mapX = withElastic(state.mapX + velX / 1000 * 16.67 * dt, b.minX, b.maxX);
                state.mapY = withElastic(state.mapY + velY / 1000 * 16.67 * dt, b.minY, b.maxY);
                if (state.mapX < b.minX || state.mapX > b.maxX) velX *= 0.4;
                if (state.mapY < b.minY || state.mapY > b.maxY) velY *= 0.4;
                state.world.style.transform = 'translate(' + state.mapX + 'px,' + state.mapY + 'px)';
                if (this.abyss.phase === 'drag_hint') this.abyssCheckChestVisible();
                raf = requestAnimationFrame(tick);
            };
            raf = requestAnimationFrame(tick);
        };

        const endPan = () => {
            if (!pan) return;
            const dt = performance.now() - lastT;
            pan = null;
            if (dt < 80 && Math.hypot(velX, velY) > 60) runInertia();
            else springBack();
        };
        state.viewport.addEventListener('pointerup', endPan);
        state.viewport.addEventListener('pointercancel', endPan);
    };

    // ==================== Tutorial ====================

    window.Game.prototype.abyssStartTutorial = function () {
        this.abyss.phase = 'drag_hint';
        this.abyssShowHint('拖动画面探索');
    };

    window.Game.prototype.abyssShowHint = function (text) {
        let hint = document.getElementById('abyss-hint');
        if (!hint) {
            hint = document.createElement('div');
            hint.id = 'abyss-hint';
            hint.className = 'abyss-hint';
            (this.abyss.uiLayer || document.body).appendChild(hint);
        }
        hint.textContent = text;
        hint.classList.remove('hidden', 'fade-out');
        void hint.offsetWidth;
        hint.classList.add('visible');
    };

    window.Game.prototype.abyssHideHint = function () {
        const hint = document.getElementById('abyss-hint');
        if (!hint) return;
        hint.classList.add('fade-out');
        setTimeout(() => hint.classList.remove('visible'), 500);
    };

    window.Game.prototype.abyssCheckChestVisible = function () {
        if (this.abyss.phase !== 'drag_hint') return;
        const chest = this.abyss.chestEl;
        if (!chest) return;
        const vpRect = this.abyss.viewport.getBoundingClientRect();
        const chestRect = chest.getBoundingClientRect();
        const invEl = document.getElementById('inventory-area');
        const invTop = invEl ? invEl.getBoundingClientRect().top : vpRect.bottom;
        if (chestRect.top < invTop && chestRect.bottom > vpRect.top) {
            this.abyss.phase = 'chest_hint';
            this.abyssShowHint('点击宝箱');
        }
    };

    // ==================== Chest ====================

    window.Game.prototype.abyssOnChestClick = function () {
        if (this.abyss.chestOpened) return;
        this.abyss.chestOpened = true;
        const chest = this.abyss.chestEl;
        chest.classList.add('opened');
        chest.innerHTML = SVG_CHEST_OPEN;
        if (window.AudioManager) window.AudioManager.playSFX('craft-normal');
        this.abyssHideHint();
        const items = this.abyss.chestItems || ['牛奶', '酿造'];
        this.abyssShowChestRewards(items);
    };

    window.Game.prototype.abyssShowChestRewards = function (items) {
        const chest = this.abyss.chestEl;
        items.forEach((itemName, i) => {
            setTimeout(() => {
                const el = this.createItemElement(itemName);
                el.classList.add('in-inventory', 'new-item');
                document.getElementById('inventory-area').appendChild(el);
                this.updateInventoryLayout();

                const label = document.createElement('div');
                label.className = 'abyss-reward-label';
                label.textContent = itemName;
                label.style.left = (parseFloat(chest.style.left) + ABYSS_CONFIG.chestSize.w / 2) + 'px';
                label.style.top = (parseFloat(chest.style.top) - 10 - i * 28) + 'px';
                this.abyss.world.appendChild(label);
                setTimeout(() => label.remove(), 2200);

                if (i === items.length - 1) {
                    setTimeout(() => {
                        this.abyss.phase = 'synth_hint';
                        this.abyssShowHint('将两个材料拖到画面中合成');
                    }, 600);
                }
            }, i * 500);
        });
    };

    // ==================== Synthesis ====================

    window.Game.prototype.abyssOnSynthesis = function (newItemName) {
        if (newItemName !== this.levelData.target) return;
        this.abyss.doorReady = true;
        this.abyss.phase = 'door_ready';
        this.abyssHideHint();

        const synthesis = document.getElementById('synthesis-area');
        const targetEl = synthesis.querySelector('.game-item[data-name="' + newItemName + '"]');
        const door = this.abyss.doorEl;
        if (!targetEl || !door) return;

        targetEl.classList.add('abyss-golden-glow');
        door.classList.add('ready');

        setTimeout(() => this.abyssFlyItemToDoor(targetEl), 1200);
    };

    window.Game.prototype.abyssFlyItemToDoor = function (itemEl) {
        const door = this.abyss.doorEl;
        const world = this.abyss.world;
        const itemRect = itemEl.getBoundingClientRect();
        const worldRect = world.getBoundingClientRect();
        const doorCX = parseFloat(door.style.left) + ABYSS_CONFIG.doorSize.w / 2;
        const doorCY = parseFloat(door.style.top) + ABYSS_CONFIG.doorSize.h / 2;

        const clone = itemEl.cloneNode(true);
        clone.className = 'abyss-flying-item';
        clone.style.left = (itemRect.left - worldRect.left) + 'px';
        clone.style.top = (itemRect.top - worldRect.top) + 'px';
        clone.style.width = itemRect.width + 'px';
        clone.style.height = itemRect.height + 'px';
        world.appendChild(clone);
        itemEl.remove();

        requestAnimationFrame(() => {
            clone.style.transition = 'all 0.8s cubic-bezier(0.4,0,0.2,1)';
            clone.style.left = (doorCX - itemRect.width / 2) + 'px';
            clone.style.top = (doorCY - itemRect.height / 2) + 'px';
            clone.style.transform = 'scale(0.2)';
            clone.style.opacity = '0.3';
        });

        setTimeout(() => {
            clone.remove();
            this.abyssOpenDoor();
        }, 900);
    };

    window.Game.prototype.abyssOpenDoor = function () {
        this.abyss.doorOpen = true;
        const door = this.abyss.doorEl;
        door.classList.remove('closed', 'ready');
        door.classList.add('open');
        door.innerHTML = SVG_DOOR_OPEN;
        if (window.AudioManager) window.AudioManager.playSFX('craft-target');
        setTimeout(() => {
            this.abyss.phase = 'enter_hint';
            this.abyssShowHint('进入深渊');
        }, 600);
    };

    window.Game.prototype.abyssOnDoorClick = function () {
        if (!this.abyss.doorOpen || this.abyss.phase === 'entering') return;
        this.abyss.phase = 'entering';
        this.abyssHideHint();
        if (window.AudioManager) window.AudioManager.playSFX('craft-fragment');

        const overlay = document.createElement('div');
        overlay.className = 'abyss-transition-overlay';
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('active'));

        setTimeout(() => {
            this.abyssShowHint('深渊的入口已打开...');
        }, 1500);
    };

})();
