// 游戏核心逻辑 - 核心模块
// ================================================

class Game {
    constructor() {
        // 检查是否是自由模式
        const params = new URLSearchParams(window.location.search);
        this.isFreeMode = params.get('mode') === 'free';
        
        if (this.isFreeMode) {
            this.initFreeMode();
            return;
        }
        
        this.levelId = this.getLevelFromUrl();
        this.levelData = window.LevelManager.getLevelData(this.levelId);
        
        if (!this.levelData) {
            alert('关卡不存在');
            if (window.navigateTo) window.navigateTo('levels.html');
            else window.location.href = 'levels.html';
            return;
        }

        // 章节系统 - Monument Valley 风格
        this.chapterId = this.levelData.chapterId || null;
        this.objectiveIndex = this.levelData.objectiveIndex || 0;
        this.chapterData = this.chapterId ? window.CHAPTERS[this.chapterId] : null;
        this.isTransitioning = false; // 防止过渡期间重复触发

        // 门状态：0=初始, 1=微光, 2=震动, 3=打开(等待献上)
        this.doorStage = 0;
        this.discoveredTriggers = new Set();
        this.synthesizedItems = new Set();
        
        // 目标是否已合成（等待献上）
        this.targetReady = false;
        
        // 静置揭晓相关
        this.revealTimers = new Map(); // itemElement -> timerId
        
        // 空闲计时器
        this.idleTimer = null;
        this.idleTimeout = 12000; // 12秒（增加空闲等待时间）

        // 如果是基础关卡，启动计时器
        const basicLevels = window.LevelManager.getBasicLevelIds();
        if (basicLevels.includes(this.levelId)) {
            window.LevelManager.startBasicLevelTimer();
        }

        // 不再显示教学动画，直接开始游戏
        this.hideTutorialImmediately();
        this.startGame();
        
        window.GameInstance = this;
    }
    
    // 初始化自由探索模式
    initFreeMode() {
        this.synthesizedItems = new Set();
        this.revealTimers = new Map();
        this.idleTimer = null;
        this.idleTimeout = 15000;
        
        // 应用默认主题和生成奶雾粒子
        document.body.classList.add('theme-dairy');
        this.createMilkFogParticles();
        
        // 隐藏教学动画
        this.hideTutorialImmediately();
        
        // 设置自由模式UI
        this.setupFreeModeUI();
        
        // 初始化拖拽系统
        this.dragSystem = new window.DragSystem(this);
        
        window.GameInstance = this;
    }
    
    // 设置自由模式UI
    setupFreeModeUI() {
        // 修改门区域显示
        const doorContainer = document.getElementById('door-container');
        const levelName = document.getElementById('level-name');
        const doorIcon = document.getElementById('door-icon');
        
        if (doorContainer) doorContainer.className = 'door-container free-mode';
        if (levelName) levelName.textContent = '自由探索';
        this.updateTargetDisplay(null, true); // 自由模式
        if (doorIcon) doorIcon.textContent = '🧪';
        
        // 初始化物品栏 - 所有基础原料
        this.initFreeModeInventory();
        
        // 更新身份铭牌
        this.updateIdentityPlaque();
        
        // 绑定返回按钮
        document.getElementById('back-btn').addEventListener('click', () => {
            if (window.AudioManager) {
                window.AudioManager.playClickBack();
                window.AudioManager.stopBGM();
            }
            if (window.navigateTo) window.navigateTo('index.html');
            else window.location.href = 'index.html';
        });
        
        // 显示自由模式提示
        setTimeout(() => {
            this.showToast('自由探索模式：尝试任意组合！', 3000);
        }, 500);
    }
    
    // 初始化自由模式物品栏
    initFreeModeInventory() {
        const inventory = document.getElementById('inventory-area');
        inventory.innerHTML = '';
        
        // 获取所有基础原料
        const baseItems = Object.entries(window.ITEMS)
            .filter(([name, data]) => data.type === 'base' || data.type === 'tool')
            .map(([name]) => name);
        
        baseItems.forEach(itemName => {
            const el = this.createItemElement(itemName);
            el.classList.add('in-inventory');
            inventory.appendChild(el);
        });
    }

    // 检查是否已看过教学
    hasSeenTutorial() {
        // 支持 URL 参数 ?tutorial=reset 强制重置教学
        const params = new URLSearchParams(window.location.search);
        if (params.get('tutorial') === 'reset') {
            localStorage.removeItem('baozhu_tutorial_seen');
            return false;
        }
        return localStorage.getItem('baozhu_tutorial_seen') === 'true';
    }

    // 标记已看过教学
    markTutorialSeen() {
        localStorage.setItem('baozhu_tutorial_seen', 'true');
    }

    // 显示教学动画
    showTutorial() {
        const overlay = document.getElementById('tutorial-overlay');
        const tutorialIcon = document.getElementById('tutorial-door-icon');
        const tutorialTarget = document.getElementById('tutorial-target-name');
        const skipBtn = document.getElementById('tutorial-skip-btn');
        
        // 设置教学动画中的目标物品
        const targetItem = window.ITEMS[this.levelData.target];
        if (tutorialIcon) tutorialIcon.textContent = targetItem?.icon || '🍨';
        if (tutorialTarget) tutorialTarget.textContent = this.levelData.target;
        
        // 显示教学覆盖层
        overlay.classList.remove('hidden');
        
        // 绑定跳过/继续按钮
        skipBtn.addEventListener('click', () => {
            this.dismissTutorial();
        });
        
        // 也允许点击任意位置跳过（延迟绑定，避免误触）
        setTimeout(() => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay || e.target.closest('.tutorial-content')) {
                    this.dismissTutorial();
                }
            }, { once: true });
        }, 2500);
    }

    // 关闭教学动画
    dismissTutorial() {
        const overlay = document.getElementById('tutorial-overlay');
        
        // 标记已看过
        this.markTutorialSeen();
        
        // 播放缩小动画
        overlay.classList.add('zoom-out');
        
        // 动画结束后隐藏并开始游戏
        setTimeout(() => {
            overlay.classList.add('fade-out');
            setTimeout(() => {
                overlay.classList.add('hidden');
                this.startGame();
            }, 300);
        }, 800);
    }

    // 立即隐藏教学（非第一关或已看过）
    hideTutorialImmediately() {
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) overlay.classList.add('hidden');
    }

    // 开始游戏（初始化UI和交互）
    startGame() {
        this.applyChapterTheme();
        this.createMilkFogParticles();
        this.initBgDecor();

        this._firedTriggers = new Set();
        this._skipPostInit = true;
        this.initUI();
        this.initDragSystem();
        this.startSugarSparkles();

        if (window.AudioManager) {
            window.AudioManager.playBGM('bgm-game');
        }

        this.showLevelIntro().then(() => {
            this._skipPostInit = false;
            this.startIdleTimer();
            if (!this.levelData.isSpecialArea && !this._recipeBookPhaseActive) {
                this.flashTargetDisplay();
            }
            this._playLevelDialogs();
        });
    }

    showLevelIntro() {
        return new Promise(resolve => {
            const ld = this.levelData;
            if (!ld || !ld.name) { resolve(); return; }

            const existing = document.getElementById('level-intro-overlay');
            if (existing) existing.remove();

            const overlay = document.createElement('div');
            overlay.id = 'level-intro-overlay';
            overlay.className = 'level-intro-overlay';

            const levelNum = (ld.objectiveIndex != null) ? ld.objectiveIndex + 1 : '';
            const displayName = levelNum ? `第${levelNum}关 · ${ld.name}` : ld.name;
            const targetText = ld.target ? `目标：${ld.target}` : '';
            const descText = ld.description || ld.storyIntro || '';

            overlay.innerHTML = `
                <div class="level-intro-content">
                    <div class="intro-level-name">${displayName}</div>
                    <div class="intro-separator"></div>
                    ${targetText ? `<div class="intro-target">${targetText}</div>` : ''}
                    ${descText ? `<div class="intro-desc">${descText}</div>` : ''}
                </div>
            `;

            document.body.appendChild(overlay);
            overlay.offsetHeight;

            requestAnimationFrame(() => {
                overlay.classList.add('visible');
            });

            const dismiss = () => {
                overlay.classList.remove('visible');
                overlay.classList.add('fade-out');
                setTimeout(() => {
                    overlay.remove();
                    resolve();
                }, 600);
            };

            setTimeout(() => {
                const onClick = () => {
                    overlay.removeEventListener('click', onClick);
                    clearTimeout(autoTimer);
                    dismiss();
                };
                overlay.addEventListener('click', onClick);
                const autoTimer = setTimeout(() => {
                    overlay.removeEventListener('click', onClick);
                    dismiss();
                }, 3000);
            }, 800);
        });
    }
    
    // 应用章节主题色
    applyChapterTheme() {
        const worldId = this.levelData?.worldId || 1;
        const themeMap = {
            1: 'theme-dairy',
            2: 'theme-floral',
            3: 'theme-fruit',
            4: 'theme-grain',
            5: 'theme-temperature',
            6: 'theme-ultimate'
        };
        const themeClass = themeMap[worldId] || 'theme-dairy';
        document.body.classList.add(themeClass);
    }
    
    // 生成随机奶雾粒子 (2-5个)
    createMilkFogParticles() {
        const container = document.getElementById('milk-fog-container');
        if (!container) return;
        
        // 随机2-5个粒子
        const count = 2 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'milk-fog-particle';
            
            // 随机大小 50-120px
            const size = 50 + Math.random() * 70;
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            
            // 随机位置（边缘区域，不遮挡中心）
            const side = Math.random() > 0.5; // true=左侧, false=右侧
            const x = side ? (2 + Math.random() * 15) : (83 + Math.random() * 15);
            const y = 15 + Math.random() * 70;
            particle.style.left = x + '%';
            particle.style.top = y + '%';
            
            // 随机动画时长和延迟
            const duration = 8 + Math.random() * 6; // 8-14秒
            const delay = Math.random() * -duration;
            particle.style.animation = `milkFogFloat ${duration}s ease-in-out ${delay}s infinite`;
            
            container.appendChild(particle);
        }
    }
    
    // 背景装饰（奶酪谷 — 小草、奶酪块、灰尘、风）
    initBgDecor() {
        const container = document.getElementById('bg-decor');
        if (!container) return;
        container.innerHTML = '';

        const r = (lo, hi) => lo + Math.random() * (hi - lo);
        const ri = (lo, hi) => Math.floor(r(lo, hi));

        const grassColors = [
            '#7A9A3A', '#8DAA45', '#6B8C30', '#A0AD50',
            '#B5A855', '#C4B060', '#A89840', '#8B7D30',
            '#9BA64A', '#BDB26A', '#7E8E35', '#C2A050',
        ];
        const pickGrassColor = () => grassColors[ri(0, grassColors.length)];

        // ---- 固定网格：每个格子中心放一个，小幅随机偏移 ----
        const gCols = 3, gRows = 4;
        const gCellW = 100 / gCols, gCellH = 100 / gRows;
        const jitter = 0.25;

        // ---- 小草撮：每个格子 60% 概率放一丛 (约 7-8 丛) ----
        for (let row = 0; row < gRows; row++) {
            for (let col = 0; col < gCols; col++) {
                if (Math.random() < 0.35) continue;
                const centerX = (col + 0.5) * gCellW;
                const centerY = (row + 0.5) * gCellH;
                const gx = centerX + r(-gCellW * jitter, gCellW * jitter);
                const gy = centerY + r(-gCellH * jitter, gCellH * jitter);

                const blades = 3 + ri(0, 3);
                let paths = '';
                for (let b = 0; b < blades; b++) {
                    const bh = r(14, 26);
                    const bw = r(2.5, 4);
                    const angle = r(-30, 30);
                    const ox = b * r(2, 4) - (blades - 1) * 1.5;
                    const sway = r(4, 10);
                    const dur = r(3, 6);
                    paths += `<rect x="${ox}" y="${-bh}" width="${bw}" height="${bh}" rx="0.8"
                        fill="${pickGrassColor()}"
                        style="transform-origin:${ox + bw / 2}px 0px;
                               --base-rot:${angle}deg; --sway:${sway}deg;
                               animation: windSway ${dur}s ease-in-out ${r(0, -dur)}s infinite"/>`;
                }
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.setAttribute('width', '60');
                svg.setAttribute('height', '50');
                svg.setAttribute('viewBox', '-30 -35 60 40');
                svg.style.left = gx + '%';
                svg.style.top = gy + '%';
                svg.style.opacity = String(r(0.35, 0.55));
                svg.innerHTML = paths;
                container.appendChild(svg);
            }
        }

        // ---- 奶酪块 emoji：2×2 网格，每格 55% 概率放置 (约 2-3 个) ----
        const cCols = 2, cRows = 2;
        const cCellW = 100 / cCols, cCellH = 100 / cRows;
        for (let row = 0; row < cRows; row++) {
            for (let col = 0; col < cCols; col++) {
                if (Math.random() < 0.45) continue;
                const cx = (col + 0.5) * cCellW + r(-cCellW * 0.2, cCellW * 0.2);
                const cy = (row + 0.5) * cCellH + r(-cCellH * 0.2, cCellH * 0.2);
                const size = r(22, 36);
                const el = document.createElement('div');
                el.style.cssText = `
                    position:absolute; left:${cx}%; top:${cy}%;
                    font-size:${size}px; line-height:1;
                    pointer-events:none; user-select:none;
                    opacity:${r(0.35, 0.5)};
                    transform:rotate(${r(-15, 15)}deg);
                `;
                el.textContent = '🧀';
                container.appendChild(el);
            }
        }

        // ---- 灰尘 / 风粒子 (持续生成) ----
        this._dustInterval = setInterval(() => {
            if (document.hidden) return;
            const dust = document.createElement('div');
            dust.className = 'bg-dust';
            const startX = r(0, 100);
            const startY = r(5, 95);
            dust.style.left = startX + '%';
            dust.style.top = startY + '%';
            const dx = r(50, 150) + 'px';
            const dy = r(-20, -60) + 'px';
            const dur = r(4, 8);
            dust.style.setProperty('--dx', dx);
            dust.style.setProperty('--dy', dy);
            const sz = r(2, 5);
            dust.style.width = sz + 'px';
            dust.style.height = sz + 'px';
            dust.style.animation = `dustDrift ${dur}s ease-out forwards`;
            container.appendChild(dust);
            setTimeout(() => dust.remove(), dur * 1000 + 100);
        }, 700);
    }

    // 糖晶微闪粒子系统
    startSugarSparkles() {
        // 每6-10秒创建1-2个糖晶闪光
        const createSparkle = () => {
            const count = Math.random() > 0.5 ? 2 : 1;
            for (let i = 0; i < count; i++) {
                setTimeout(() => this.createSugarSparkle(), i * 300);
            }
            // 下一次闪光在6-10秒后
            const nextDelay = 6000 + Math.random() * 4000;
            setTimeout(createSparkle, nextDelay);
        };
        // 初始延迟3秒后开始
        setTimeout(createSparkle, 3000);
    }
    
    createSugarSparkle() {
        const sparkle = document.createElement('div');
        sparkle.className = 'sugar-sparkle';
        
        // 随机位置（避开底部物品栏区域）
        const x = 10 + Math.random() * 80; // 10%-90% 水平位置
        const y = 10 + Math.random() * 60; // 10%-70% 垂直位置
        
        sparkle.style.left = x + '%';
        sparkle.style.top = y + '%';
        
        // 随机大小 - 更大更明显
        const size = 10 + Math.random() * 8; // 10-18px
        sparkle.style.width = size + 'px';
        sparkle.style.height = size + 'px';
        
        document.body.appendChild(sparkle);
        
        // 动画结束后移除
        setTimeout(() => sparkle.remove(), 2500);
    }

    getLevelFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return parseInt(params.get('level')) || 1;
    }

    initUI() {
        this.doorStates = [];
        this._recipeBookPhaseActive = !!this.levelData.recipeBookPhase;
        const doorRow = document.getElementById('door-row');

        if (this.levelData.isSpecialArea) {
            doorRow.style.display = 'none';
        } else if (this.levelData.doors && this.levelData.doors.length > 1) {
            this.isDualDoor = true;
            doorRow.classList.add('dual-doors');
            this.initDualDoors();
        } else {
            this.isDualDoor = false;
            const showTarget = !this._recipeBookPhaseActive;
            const targetItem = showTarget && this.levelData.target ? window.ITEMS[this.levelData.target] : null;
            const doorIcon = document.getElementById('door-icon');
            if (doorIcon) doorIcon.textContent = showTarget ? (targetItem?.icon || '') : '';
            if (showTarget && this.levelData.target) {
                this.updateTargetDisplay(this.levelData.target);
            }
            if (this._recipeBookPhaseActive) {
                this._hideTargetDisplay();
            }
            this.doorStates.push({
                idx: 0,
                target: this.levelData.target,
                stage: 0,
                done: false,
                container: document.getElementById('door-container'),
                wrapper: document.getElementById('door-wrapper-0')
            });
        }

        const levelNameEl = document.getElementById('level-name');
        if (levelNameEl) levelNameEl.textContent = this.levelData.name;

        const synthesisArea = document.getElementById('synthesis-area');
        if (synthesisArea) {
            synthesisArea.innerHTML = '';
        }

        if (this._recipeBookPhaseActive) {
            // Phase 1: no items, no trade station, inventory empty
            const inventory = document.getElementById('inventory-area');
            if (inventory) inventory.innerHTML = '';
            this.updateInventoryLayout();
        } else {
            this.initInventory();
            if (!this.levelData.isSpecialArea) {
                this.initTradeStation();
            }
        }
        this.initGemDisplay();
        this.updateIdentityPlaque();
        this._autoShowRecipeBook();

        const backBtn = document.getElementById('back-btn');
        if (backBtn && window.LevelManager && window.LevelManager.hasAnyClaimableTask()) {
            if (!backBtn.querySelector('.claimable-dot')) {
                const dot = document.createElement('span');
                dot.className = 'claimable-dot';
                backBtn.appendChild(dot);
            }
        }
        backBtn.addEventListener('click', () => {
            if (window.AudioManager) {
                window.AudioManager.playClickBack();
                window.AudioManager.stopBGM();
            }
            const worldId = this.levelData.worldId || 1;
            const url = `levels.html?world=${worldId}`;
            if (window.navigateTo) window.navigateTo(url);
            else window.location.href = url;
        });

        if (this.levelData.isTutorial) {
            this.showTutorialHint();
        }
        
        if (this.levelData.levelHints && this.levelData.levelHints.length > 0) {
            this.showLevelHints();
        }

        if (!this._skipPostInit) {
            if (!this.levelData.isSpecialArea && !this._recipeBookPhaseActive) {
                setTimeout(() => this.flashTargetDisplay(), 400);
            }
            this._playLevelDialogs();
        }
    }

    _playLevelDialogs() {
        const dialogs = this.levelData.dialogs;
        const isSpecial = this.levelData.isSpecialArea;
        const isRecipePhase = this._recipeBookPhaseActive;

        if (!dialogs || dialogs.length === 0) {
            if (isRecipePhase) {
                this._initRecipeBookTrade();
            }
            if (isSpecial) {
                this.initTradeStation();
                this._initSpecialAreaCenterTrade();
            }
            return;
        }

        this._dialogSide = null;
        let chain = new Promise(r => setTimeout(r, 600));

        for (const d of dialogs) {
            chain = chain.then(() => this.showDialog(d.text));
        }

        chain = chain.then(() => this.dismissAllDialogs());

        if (isRecipePhase) {
            chain = chain.then(() => this._initRecipeBookTrade());
        }

        if (isSpecial) {
            chain = chain.then(() => {
                this.initTradeStation();
                this._initSpecialAreaCenterTrade();
            });
        }
    }

    playCompletionDialogs() {
        const dialogs = this.levelData.completionDialogs;
        if (!dialogs || dialogs.length === 0) return Promise.resolve();

        let chain = new Promise(r => setTimeout(r, 600));

        for (const d of dialogs) {
            chain = chain.then(() => this.showDialog(d.text));
        }

        chain = chain.then(() => this.dismissAllDialogs());
        return chain;
    }

    checkTriggerDialogs(event, itemName) {
        const triggers = this.levelData.triggerDialogs;
        if (!triggers) return;

        let lines = null;
        let triggerKey = '';

        if (event === 'onSynthesize' && triggers.onSynthesize && triggers.onSynthesize[itemName]) {
            triggerKey = `synth_${itemName}`;
            lines = triggers.onSynthesize[itemName];
        } else if (event === 'onFailedSynthesis' && triggers.onFailedSynthesis) {
            triggerKey = 'failedSynth';
            lines = triggers.onFailedSynthesis;
        }

        if (!lines || this._firedTriggers.has(triggerKey)) return;
        this._firedTriggers.add(triggerKey);

        for (const line of lines) {
            this.showTriggerDialog(line.text);
        }
    }

    _initSpecialAreaCenterTrade() {
        // 将交易台移到合成区中央，缩放出现
        if (this.tradeStations) {
            this.tradeStations.forEach(ts => {
                if (ts.el) {
                    ts.el.classList.add('special-area-center');
                    ts.el.style.opacity = '0';
                    ts.el.style.transform = 'translate(-50%, -50%) scale(0)';
                    ts.el.offsetHeight;
                    ts.el.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.175,0.885,0.32,1.275)';
                    ts.el.style.opacity = '1';
                    ts.el.style.transform = 'translate(-50%, -50%) scale(1)';
                }
            });
        }

        // 添加"继续前进"按钮
        setTimeout(() => {
            const btn = document.createElement('div');
            btn.className = 'special-area-continue';
            btn.textContent = '继续前进 →';
            document.getElementById('synthesis-area').appendChild(btn);
            btn.offsetHeight;
            btn.classList.add('visible');
            const go = () => {
                btn.removeEventListener('click', go);
                btn.removeEventListener('touchend', go);
                btn.remove();
                this._specialAreaProceed();
            };
            btn.addEventListener('click', go);
            btn.addEventListener('touchend', go);
        }, 1500);
    }

    _initRecipeBookTrade() {
        const cfg = this.levelData.recipeBookTradeStation;
        if (!cfg) return;

        const configs = [cfg];
        this.tradeStations = [];
        configs.forEach((c, i) => {
            const ts = this._createTradeStation(c, i);
            this.tradeStations.push(ts);
        });
        if (this.tradeStations.length === 1) {
            this.tradeStation = this.tradeStations[0];
        }

        this.tradeStations.forEach(ts => {
            if (ts.el) {
                ts.el.classList.add('special-area-center');
                ts.el.style.opacity = '0';
                ts.el.style.transform = 'translate(-50%, -50%) scale(0)';
                ts.el.offsetHeight;
                ts.el.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.175,0.885,0.32,1.275)';
                ts.el.style.opacity = '1';
                ts.el.style.transform = 'translate(-50%, -50%) scale(1)';
            }
        });

        this._maybeShowTradeStationTutorial();
    }

    _autoShowRecipeBook() {
        if (this._recipeBookPhaseActive) return;
        const discovered = window.LevelManager.currentProgress.discoveredItems || [];
        if (discovered.includes('配方书')) {
            this.showRecipeBookButton();
        }
    }

    _revealRecipeBookPhase2() {
        this._recipeBookPhaseActive = false;

        // Hide trade station
        if (this.tradeStations) {
            this.tradeStations.forEach(ts => {
                if (ts.el) {
                    ts.el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                    ts.el.style.opacity = '0';
                    ts.el.style.transform = 'translate(-50%, -50%) scale(0)';
                    setTimeout(() => ts.el.remove(), 500);
                }
            });
            this.tradeStations = [];
            this.tradeStation = null;
        }

        setTimeout(() => {
            const targetItem = window.ITEMS[this.levelData.target];
            const doorIcon = document.getElementById('door-icon');
            if (doorIcon) {
                doorIcon.textContent = targetItem?.icon || '';
                doorIcon.style.opacity = '0';
                doorIcon.offsetHeight;
                doorIcon.style.transition = 'opacity 0.6s ease';
                doorIcon.style.opacity = '1';
            }
            this._showTargetDisplay();
            if (this.levelData.target) {
                this.updateTargetDisplay(this.levelData.target);
            }
            setTimeout(() => this.flashTargetDisplay(), 200);

            // Init inventory with items
            this.initInventory();
            this.updateInventoryLayout();

            // Init regular trade stations if any
            this.initTradeStation();
        }, 600);
    }

    _specialAreaProceed() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        // 交易台缩小消失
        if (this.tradeStations) {
            this.tradeStations.forEach(ts => {
                if (ts.el) {
                    ts.el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                    ts.el.style.opacity = '0';
                    ts.el.style.transform = 'scale(0)';
                }
            });
        }

        setTimeout(() => {
            this.performGoldenGlowTransition();
        }, 500);
    }

    // 目标行金光发散动画（进入每关时吸引注意力）
    flashTargetDisplay() {
        document.querySelectorAll('.level-target-display').forEach(el => {
            el.classList.remove('target-entry-pulse');
            el.offsetHeight;
            el.classList.add('target-entry-pulse');
            el.addEventListener('animationend', () => el.classList.remove('target-entry-pulse'), { once: true });
        });
    }

    // 初始化双门布局
    initDualDoors() {
        const doorRow = document.getElementById('door-row');
        // 清空默认的单门 wrapper
        doorRow.innerHTML = '';

        this.levelData.doors.forEach((doorCfg, idx) => {
            const targetItem = window.ITEMS[doorCfg.target];
            const wrapper = document.createElement('div');
            wrapper.className = 'door-wrapper';
            wrapper.id = 'door-wrapper-' + idx;
            wrapper.innerHTML = `
                <div class="door-container stage-0" id="door-container-${idx}">
                    <div class="door-aura"></div>
                    <div class="door-frame">
                        <div class="door-glow">
                            <div class="door-fog"></div>
                            <div class="door-target-silhouette" id="door-icon-${idx}">${targetItem?.icon || doorCfg.icon || '?'}</div>
                        </div>
                    </div>
                    <div class="door-offer-hint">献上</div>
                </div>
                <div class="level-info">
                    <div class="level-target-display">
                        <span class="target-label">目标</span>
                        <span class="target-name">${doorCfg.target}</span>
                    </div>
                </div>
            `;
            doorRow.appendChild(wrapper);

            this.doorStates.push({
                idx,
                target: doorCfg.target,
                doorTriggers: doorCfg.doorTriggers,
                stage: 0,
                done: false,
                discoveredTriggers: new Set(),
                container: null,
                wrapper: null
            });
        });

        // 缓存 DOM 引用
        this.doorStates.forEach((ds, idx) => {
            ds.container = document.getElementById('door-container-' + idx);
            ds.wrapper = document.getElementById('door-wrapper-' + idx);
        });
    }
    
    // 显示关卡专属提示（循环显示）
    showLevelHints() {
        const hints = this.levelData.levelHints;
        let hintIndex = 0;
        
        // 先显示第一条提示（延迟3秒）
        setTimeout(() => {
            this.showToast('💡 ' + hints[hintIndex], 5000);
            hintIndex++;
        }, 3000);
        
        // 之后每隔15秒显示下一条提示（如果玩家还没通关）
        this.levelHintInterval = setInterval(() => {
            if (hintIndex < hints.length) {
                this.showToast('💡 ' + hints[hintIndex], 5000);
                hintIndex++;
            } else {
                // 循环回到第一条
                hintIndex = 0;
            }
        }, 15000);
    }
    
    // 显示教学关卡特定提示
    showTutorialHint() {
        const focus = this.levelData.tutorialFocus;
        let hintText = '';
        
        switch (focus) {
            case 'approach_and_offer':
                setTimeout(() => {
                    this.showToast('💡 提示：合成后，把物品拖到门上', 5000);
                }, 5000);
                break;
            case 'pause_wait':
                setTimeout(() => {
                    this.showToast('💡 提示：有些合成需要等待', 5000);
                }, 5000);
                break;
            case 'extract_longpress':
                setTimeout(() => {
                    this.showToast('💡 提示：长按物品可以查看信息或提取', 5000);
                }, 3000);
                break;
        }
    }
    
    updateIdentityPlaque() { }

    // 创建单个交易站 DOM，返回 state 对象
    _createTradeStation(cfg, index) {
        const synthArea = document.getElementById('synthesis-area');
        const isGem = cfg.type === 'gem';
        const outputItem = window.ITEMS[cfg.output] || {};

        const el = document.createElement('div');
        el.className = 'trade-station';
        el.dataset.tsIndex = index;

        let inputContent, inputName;
        if (isGem) {
            inputContent = `<span class="ts-gem-cost">${cfg.cost}<span class="ts-gem-icon">💎</span></span>`;
            inputName = '';
        } else {
            const inputItem = window.ITEMS[cfg.input] || {};
            inputContent = `<span class="ts-ghost-icon">${inputItem.icon || '?'}</span>`;
            inputName = `<span class="ts-slot-name">${inputItem.name || cfg.input}</span>`;
        }

        const outputName = `<span class="ts-slot-name">${outputItem.name || cfg.output}</span>`;

        el.innerHTML = `
            <div class="ts-body">
                <div class="ts-slot ts-slot-input">${inputContent}${inputName}</div>
                <div class="ts-middle">
                    <span class="ts-arrow">→</span>
                    <span class="ts-label">交易</span>
                </div>
                <div class="ts-slot ts-slot-output">${outputItem.icon || '?'}${outputName}</div>
            </div>
            <div class="trade-station-hitbox"></div>
            <div class="trade-restock-overlay">
                <span class="trade-restock-title">进货中</span>
                <span class="trade-restock-countdown">15</span>
                <span class="trade-restock-unit">秒</span>
            </div>
        `;
        synthArea.appendChild(el);

        const ts = {
            el: el,
            box: el.querySelector('.trade-station-hitbox'),
            inputSlot: el.querySelector('.ts-slot-input'),
            outputSlot: el.querySelector('.ts-slot-output'),
            overlay: el.querySelector('.trade-restock-overlay'),
            countdownEl: el.querySelector('.trade-restock-countdown'),
            input: cfg.input || null,
            output: cfg.output,
            cost: cfg.cost || 0,
            type: isGem ? 'gem' : 'item',
            maxUses: cfg.maxUses || Infinity,
            usesLeft: cfg.maxUses || Infinity,
            soldOut: false,
            restocking: false,
            restockTimeout: null
        };

        el.addEventListener('click', (e) => {
            if (ts.restocking || ts.soldOut) return;
            e.stopPropagation();
            this.showTradeConfirm(ts);
        });

        return ts;
    }

    // 初始化交易站（支持单个或多个）
    initTradeStation() {
        // 清理旧的
        if (this.tradeStations) {
            this.tradeStations.forEach(ts => {
                if (ts.restockTimeout) clearTimeout(ts.restockTimeout);
            });
        }
        document.querySelectorAll('.trade-station').forEach(el => el.remove());
        const oldDialog = document.getElementById('trade-confirm');
        if (oldDialog) oldDialog.remove();
        this.tradeStations = [];
        this.tradeStation = null;

        // 支持 tradeStation（单个）或 tradeStations（数组）
        let configs = this.levelData.tradeStations || [];
        if (configs.length === 0 && this.levelData.tradeStation) {
            configs = [this.levelData.tradeStation];
        }
        if (configs.length === 0) return;

        configs.forEach((cfg, i) => {
            const ts = this._createTradeStation(cfg, i);
            this.tradeStations.push(ts);
        });

        // 多交易站布局：沿右侧纵向排列，居中于合成区中部（门底到物品栏顶之间）
        if (this.tradeStations.length > 1) {
            const n = this.tradeStations.length;
            const scale = n >= 3 ? 0.82 : 1;
            const stationH = 72 * scale;
            const gap = n >= 3 ? 18 : 22;
            const totalH = n * stationH + (n - 1) * gap;
            const doorArea = document.getElementById('door-area');
            const invArea = document.getElementById('inventory-area');
            const synthArea = document.getElementById('synthesis-area');
            const synthRect = synthArea ? synthArea.getBoundingClientRect() : { top: 0, bottom: window.innerHeight };
            const doorBottom = doorArea ? doorArea.getBoundingClientRect().bottom : synthRect.top;
            const invTop = invArea ? invArea.getBoundingClientRect().top : synthRect.bottom;
            const midY = (doorBottom + invTop) / 2;
            const synthTop = synthRect.top;
            const offsetY = midY - synthTop - totalH / 2;
            this.tradeStations.forEach((ts, i) => {
                ts.el.style.top = `${offsetY + i * (stationH + gap)}px`;
                ts.el.style.transform = scale < 1 ? `scale(${scale})` : '';
                ts.el.style.transformOrigin = 'right center';
            });
        }

        // 向后兼容：单个时也挂到 this.tradeStation
        if (this.tradeStations.length === 1) {
            this.tradeStation = this.tradeStations[0];
        }

        this._maybeShowTradeStationTutorial();
    }

    _maybeShowTradeStationTutorial() {
        if (!window.TutorialGuide) return;
        if (localStorage.getItem('tut_tradeStation')) return;
        if (!this.tradeStations || this.tradeStations.length === 0) return;

        const firstTs = this.tradeStations[0].el;
        if (!firstTs) return;

        localStorage.setItem('tut_tradeStation', '1');

        setTimeout(() => {
            window.TutorialGuide.show({
                target: firstTs,
                text: '将物品放入/点击交易台以交易',
                position: 'bottom',
                padding: 8,
                borderRadius: 14
            });
        }, 600);
    }

    // 交易站断货 — 显示"断货"遮罩
    _markSoldOut(ts) {
        ts.soldOut = true;
        ts.el.classList.add('trade-sold-out');
        const overlay = ts.overlay;
        if (overlay) {
            overlay.innerHTML = '<span class="trade-restock-title">断货</span>';
            overlay.classList.add('active');
        }
    }

    startTradeRestock(ts) {
        if (!ts) ts = this.tradeStation;
        if (!ts) return;

        // 如果有使用次数限制
        if (ts.maxUses !== Infinity) {
            ts.usesLeft--;
            if (ts.usesLeft <= 0) {
                this._markSoldOut(ts);
                return;
            }
        }

        ts.restocking = true;
        if (ts.restockTimeout) clearTimeout(ts.restockTimeout);

        const overlay = ts.overlay;
        const countdownEl = ts.countdownEl;
        const duration = 15;
        let remaining = duration;

        if (overlay) {
            overlay.classList.add('active');
            if (countdownEl) countdownEl.textContent = remaining;
        }

        const tick = () => {
            remaining--;
            if (remaining <= 0) {
                ts.restocking = false;
                if (overlay) overlay.classList.remove('active');
                ts.restockTimeout = null;
                return;
            }
            if (countdownEl) countdownEl.textContent = remaining;
            ts.restockTimeout = setTimeout(tick, 1000);
        };
        ts.restockTimeout = setTimeout(tick, 1000);
    }

    initInventory() {
        const inventory = document.getElementById('inventory-area');
        inventory.innerHTML = '';
        
        this.levelData.initialItems.forEach(itemName => {
            const el = this.createItemElement(itemName);
            el.classList.add('in-inventory');
            inventory.appendChild(el);
        });
        
        // 更新物品栏布局
        this.updateInventoryLayout();
    }
    
    // 珠宝显示
    initGemDisplay() {
        if (document.getElementById('gem-display')) return;
        const el = document.createElement('div');
        el.id = 'gem-display';
        el.className = 'gem-display';
        el.innerHTML = '<span class="gem-icon">💎</span><span class="gem-count" id="gem-count">0</span>';
        document.body.appendChild(el);
        // 元素创建后立即定位，静默初始化（不触发动画）
        this._updateGemPosition();
        this.updateGemDisplay(true);

        // 监听物品栏尺寸变化，同步珠宝位置（含高度过渡动画期间）
        const inventory = document.getElementById('inventory-area');
        if (inventory && typeof ResizeObserver !== 'undefined') {
            this._gemResizeObserver = new ResizeObserver(() => this._updateGemPosition());
            this._gemResizeObserver.observe(inventory);
        }
        window.addEventListener('resize', this._boundUpdateGemPosition = () => this._updateGemPosition());
    }

    _updateGemPosition() {
        const gemEl = document.getElementById('gem-display');
        const inventory = document.getElementById('inventory-area');
        if (!gemEl || !inventory) return;
        const invRect = inventory.getBoundingClientRect();
        gemEl.style.bottom = (window.innerHeight - invRect.top + 6) + 'px';
    }

    _refreshBackBtnDot() {
        const backBtn = document.getElementById('back-btn');
        if (!backBtn) return;
        const has = window.LevelManager && window.LevelManager.hasAnyClaimableTask();
        const existing = backBtn.querySelector('.claimable-dot');
        if (has && !existing) {
            const dot = document.createElement('span');
            dot.className = 'claimable-dot';
            backBtn.appendChild(dot);
        } else if (!has && existing) {
            existing.remove();
        }
    }

    updateGemDisplay(silent = false) {
        const countEl = document.getElementById('gem-count');
        if (!countEl) {
            console.warn('[Gems] #gem-count element not found');
            return;
        }
        const gems = window.LevelManager.getGems();
        const old = parseInt(countEl.textContent) || 0;
        console.log('[Gems] updateGemDisplay — old:', old, '→ new:', gems, silent ? '(silent)' : '');
        countEl.textContent = gems;

        this._refreshBackBtnDot();
        if (!silent && gems > old) {
            const diff = gems - old;
            countEl.classList.remove('gem-bump');
            countEl.offsetHeight;
            countEl.classList.add('gem-bump');
            // 珠宝飞行动画 + "+N" 标注
            if (this._lastDoorRect) {
                console.log('[Gems] showGemFlyAnimation from', this._lastDoorRect);
                this.showGemFlyAnimation(this._lastDoorRect, diff);
                this._lastDoorRect = null;
            } else {
                console.warn('[Gems] _lastDoorRect is null — fly animation skipped');
            }
            this.showGemPlusLabel(diff);
        }
    }

    // 从门飞向珠宝显示区的动画
    showGemFlyAnimation(fromRect, amount) {
        console.log('[Gems] showGemFlyAnimation start, amount:', amount);
        const gemEl = document.getElementById('gem-display');
        if (!gemEl) return;
        // 飞行前先强制同步珠宝框位置（暂停过渡，确保读到最终坐标）
        gemEl.style.transition = 'none';
        this._updateGemPosition();
        gemEl.offsetHeight; // 强制应用
        const toRect = gemEl.getBoundingClientRect();
        gemEl.style.transition = ''; // 恢复过渡
        const toX = toRect.left + toRect.width / 2;
        const toY = toRect.top + toRect.height / 2;
        const fromX = fromRect.left + fromRect.width / 2;
        const fromY = fromRect.top + fromRect.height / 2;
        const count = 10;
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const gem = document.createElement('div');
                gem.textContent = '💎';
                gem.style.cssText = `
                    position: fixed;
                    left: ${fromX - 10}px;
                    top: ${fromY - 10}px;
                    width: 20px; height: 20px;
                    font-size: 16px; line-height: 20px; text-align: center;
                    pointer-events: none; z-index: 3000;
                    opacity: 1; transform: scale(1.3);
                    transition:
                        left 0.85s cubic-bezier(0.4, 0, 0.2, 1),
                        top  0.85s cubic-bezier(0.4, 0, 0.2, 1),
                        transform 0.85s ease-out,
                        opacity 0.25s ease-in 0.6s;
                `;
                document.body.appendChild(gem);
                gem.offsetHeight;
                const jx = (Math.random() - 0.5) * 36;
                const jy = (Math.random() - 0.5) * 20;
                gem.style.left = (toX - 10 + jx) + 'px';
                gem.style.top  = (toY - 10 + jy) + 'px';
                gem.style.transform = 'scale(0.7)';
                gem.style.opacity = '0';
                setTimeout(() => gem.remove(), 950);
            }, i * 75);
        }
    }

    // 珠宝增加时在显示区上方飘出 "+N"
    showGemPlusLabel(amount) {
        console.log('[Gems] showGemPlusLabel +' + amount);
        const gemEl = document.getElementById('gem-display');
        if (!gemEl) return;
        const rect = gemEl.getBoundingClientRect();
        const label = document.createElement('div');
        label.className = 'gem-plus-label';
        label.textContent = '+' + amount;
        label.style.left = (rect.left + rect.width / 2 - 20) + 'px';
        label.style.top  = (rect.top - 6) + 'px';
        document.body.appendChild(label);
        setTimeout(() => label.remove(), 1300);
    }

    // 在交易站位置产出物品（物品交易 & 珠宝交易共用）
    _spawnTradeOutput(ts) {
        if (!ts) ts = this.tradeStation;
        const synthArea = document.getElementById('synthesis-area');
        const synthRect = synthArea.getBoundingClientRect();

        let spawnX, spawnY;
        if (ts.outputSlot) {
            const slotRect = ts.outputSlot.getBoundingClientRect();
            spawnX = slotRect.left - synthRect.left + slotRect.width / 2 - 25;
            spawnY = slotRect.top - synthRect.top + slotRect.height / 2 - 25;
        } else {
            const stationRect = ts.el.getBoundingClientRect();
            spawnX = stationRect.left - synthRect.left + stationRect.width / 2 - 25;
            spawnY = stationRect.top - synthRect.top + 20;
        }

        const newItem = this.createItemElement(ts.output);
        newItem.classList.add('new-item');
        newItem.style.position = 'absolute';
        newItem.style.left = spawnX + 'px';
        newItem.style.top = spawnY + 'px';
        newItem.style.transform = 'scale(0)';
        newItem.style.opacity = '0';
        newItem.style.transition = 'transform 0.4s cubic-bezier(0, 0, 0.2, 1.2), opacity 0.3s ease-out';
        newItem.style.zIndex = '15';
        synthArea.appendChild(newItem);

        requestAnimationFrame(() => {
            newItem.style.transform = 'scale(1)';
            newItem.style.opacity = '1';
        });

        this.synthesizedItems.add(ts.output);
        window.LevelManager.discoverItem(ts.output);
        this.checkDoorProgress(ts.output);
        this.checkLevelCompletion(ts.output, newItem);
        this.startTradeRestock(ts);

        const outputData = window.ITEMS[ts.output];
        if (outputData && outputData.isRecipeBook) {
            if (!localStorage.getItem('tut_recipeBook')) {
                localStorage.setItem('tut_recipeBook', '1');
                setTimeout(() => {
                    if (!window.TutorialGuide || window.TutorialGuide._active) return;
                    window.TutorialGuide.show({
                        target: newItem,
                        text: '发蓝光的物品拥有特殊能力\n长按它来激活',
                        position: 'bottom',
                        padding: 10,
                        borderRadius: 50
                    });
                }, 800);
            }
        }
    }

    // 找到接受该物品的物品交易台（遍历所有交易站）
    _findItemTradeStation(itemName) {
        if (!this.tradeStations) return null;
        return this.tradeStations.find(ts =>
            ts.type === 'item' && !ts.restocking && !ts.soldOut && ts.input === itemName
        ) || null;
    }

    // 执行物品交易（拖拽到交易台时的兼容入口）
    executeTrade(itemEl) {
        const itemName = itemEl.dataset.name;
        const ts = this._findItemTradeStation(itemName);

        if (!ts) {
            if (this.tradeStations) {
                this.tradeStations.forEach(s => {
                    if (s.type === 'item' && !s.soldOut) {
                        s.box.classList.add('trade-wrong');
                        setTimeout(() => s.box.classList.remove('trade-wrong'), 500);
                    }
                });
            }
            return false;
        }

        if (window.AudioManager) window.AudioManager.playSFX('craft-normal');
        this._animateInputToSlot(itemEl, ts, () => this._spawnTradeOutput(ts));
        return true;
    }

    // 交易确认弹窗（统一物品/珠宝）
    showTradeConfirm(ts) {
        if (ts.restocking || ts.soldOut) return;

        const old = document.getElementById('trade-confirm');
        if (old) old.remove();

        const isGem = ts.type === 'gem';
        const outputItem = window.ITEMS[ts.output] || {};

        let inputLabel, canTrade, noteText = '';
        if (isGem) {
            const gems = window.LevelManager.getGems();
            inputLabel = `${ts.cost} 💎`;
            canTrade = gems >= ts.cost;
            if (!canTrade) noteText = `珠宝不足 (${gems}/${ts.cost})`;
        } else {
            const inputItem = window.ITEMS[ts.input] || {};
            inputLabel = `${inputItem.icon || '?'} ${inputItem.name || ts.input}`;
            const hasItem = !!document.querySelector(`.game-item[data-name="${ts.input}"]`);
            canTrade = hasItem;
            if (!canTrade) noteText = `缺少${inputItem.name || ts.input}`;
        }

        const outputLabel = `${outputItem.icon || '?'} ${outputItem.name || ts.output}`;

        const dialog = document.createElement('div');
        dialog.id = 'trade-confirm';
        dialog.className = 'trade-confirm-overlay';
        dialog.innerHTML = `
            <div class="trade-confirm-backdrop"></div>
            <div class="trade-confirm-box">
                <div class="trade-confirm-text">
                    确认用 <span class="trade-confirm-input-name">${inputLabel}</span>
                    交易 <span class="trade-confirm-output-name">${outputLabel}</span> 吗？
                </div>
                <div class="trade-confirm-btns">
                    <button class="trade-confirm-cancel">取消</button>
                    <button class="trade-confirm-ok ${canTrade ? '' : 'disabled'}">确认</button>
                </div>
                ${noteText ? `<div class="trade-confirm-note">${noteText}</div>` : ''}
            </div>
        `;
        document.body.appendChild(dialog);

        const dismiss = () => dialog.remove();
        dialog.querySelector('.trade-confirm-cancel').addEventListener('click', dismiss);
        dialog.querySelector('.trade-confirm-backdrop').addEventListener('click', dismiss);

        if (canTrade) {
            dialog.querySelector('.trade-confirm-ok').addEventListener('click', () => {
                dismiss();
                this._executeTradeAnimated(ts);
            });
        }
    }

    // 执行交易（带动画）
    _executeTradeAnimated(ts) {
        const isGem = ts.type === 'gem';

        if (isGem) {
            window.LevelManager.addGems(-ts.cost);
            this.updateGemDisplay(true);
        }

        if (window.AudioManager) window.AudioManager.playSFX('craft-normal');

        if (!isGem) {
            const itemEl = document.querySelector(`.game-item[data-name="${ts.input}"]`);
            if (itemEl) {
                this._animateInputToSlot(itemEl, ts, () => this._spawnTradeOutput(ts));
                return;
            }
        }

        this._spawnTradeOutput(ts);
    }

    // 输入物品飞向交易台左侧圆圈的动画
    _animateInputToSlot(itemEl, ts, onDone) {
        const slotRect = ts.inputSlot.getBoundingClientRect();
        const itemRect = itemEl.getBoundingClientRect();

        const clone = itemEl.cloneNode(true);
        clone.style.position = 'fixed';
        clone.style.left = itemRect.left + 'px';
        clone.style.top = itemRect.top + 'px';
        clone.style.width = itemRect.width + 'px';
        clone.style.height = itemRect.height + 'px';
        clone.style.zIndex = '200';
        clone.style.pointerEvents = 'none';
        clone.style.transition = 'all 0.45s cubic-bezier(0.4, 0, 0.2, 1)';
        document.body.appendChild(clone);

        itemEl.remove();
        this.updateInventoryLayout();

        requestAnimationFrame(() => {
            const targetX = slotRect.left + slotRect.width / 2 - itemRect.width / 2;
            const targetY = slotRect.top + slotRect.height / 2 - itemRect.height / 2;
            clone.style.left = targetX + 'px';
            clone.style.top = targetY + 'px';
            clone.style.transform = 'scale(0.4)';
            clone.style.opacity = '0.2';
        });

        setTimeout(() => {
            clone.remove();
            if (onDone) onDone();
        }, 500);
    }

    // 根据物品数量更新物品栏高度（平滑过渡）
    updateInventoryLayout() {
        const inventory = document.getElementById('inventory-area');
        const itemCount = inventory.querySelectorAll('.game-item').length;
        const itemsPerRow = 4;
        const rows = Math.ceil(itemCount / itemsPerRow);
        
        inventory.classList.remove('rows-0', 'rows-1', 'rows-2', 'rows-3-plus');
        
        if (rows === 0) {
            inventory.classList.add('rows-0');
        } else if (rows <= 1) {
            inventory.classList.add('rows-1');
        } else if (rows === 2) {
            inventory.classList.add('rows-2');
        } else {
            inventory.classList.add('rows-3-plus');
        }

        // 同步珠宝显示位置（在物品栏上方）
        this._updateGemPosition();
        // 物品栏高度有 0.35s 过渡，过渡结束后再更新一次
        setTimeout(() => this._updateGemPosition(), 400);
    }

    initDragSystem() {
        this.dragSystem = new window.DragSystem(this);
    }

    // ==================== 门的对话气泡 ====================

    _getDoorRect() {
        const door = document.getElementById('door-container');
        if (!door) return null;
        return door.getBoundingClientRect();
    }

    _calcDuration(text) {
        return Math.min(Math.max(text.length * 280, 3000), 7000);
    }

    _splitDialogText(text, maxLen = 20) {
        if (text.length <= maxLen) return [text];
        const chunks = [];
        const puncts = /([，。！？、；：…—])/;
        let remaining = text;
        while (remaining.length > maxLen) {
            let cutAt = -1;
            for (let i = Math.min(maxLen, remaining.length) - 1; i >= Math.floor(maxLen * 0.5); i--) {
                if (puncts.test(remaining[i])) { cutAt = i + 1; break; }
            }
            if (cutAt === -1) cutAt = maxLen;
            chunks.push(remaining.slice(0, cutAt));
            remaining = remaining.slice(cutAt);
        }
        if (remaining) chunks.push(remaining);
        return chunks;
    }

    _dialogSide = null;

    _pickBubbleSide() {
        if (this._dialogSide) return this._dialogSide;
        const doorRect = this._getDoorRect();
        if (!doorRect) return 'right';
        const doorCx = doorRect.left + doorRect.width / 2;
        const screenCx = window.innerWidth / 2;
        this._dialogSide = doorCx < screenCx ? 'right' : 'left';
        return this._dialogSide;
    }

    showDoorBubble(text) {
        const doorRect = this._getDoorRect();
        const gameArea = document.querySelector('.game-container') || document.body;
        if (!doorRect) return null;

        const side = this._pickBubbleSide();
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const pad = 6;
        const gap = 16 + Math.random() * 10;

        let availW;
        if (side === 'right') {
            availW = screenW - doorRect.right - gap - pad;
        } else {
            availW = doorRect.left - gap - pad;
        }
        availW = Math.max(availW, 80);
        const maxW = Math.min(300, screenW * 0.44, availW);

        const bubble = document.createElement('div');
        bubble.className = 'door-bubble';
        bubble.classList.add(side === 'left' ? 'tail-right' : 'tail-left');
        bubble.textContent = text;
        bubble.style.maxWidth = maxW + 'px';

        gameArea.appendChild(bubble);

        const bw = bubble.offsetWidth;
        const bh = bubble.offsetHeight;

        const doorCy = doorRect.top + doorRect.height / 2;
        const yJitter = (Math.random() - 0.5) * Math.min(doorRect.height * 0.6, 40);
        let y = doorCy - bh / 2 + yJitter;

        let x;
        if (side === 'right') {
            x = doorRect.right + gap;
        } else {
            x = doorRect.left - bw - gap;
        }

        x = Math.max(pad, Math.min(x, screenW - bw - pad));
        y = Math.max(pad, Math.min(y, screenH - bh - pad));

        bubble.style.left = x + 'px';
        bubble.style.top = y + 'px';

        const dur = this._calcDuration(text);
        setTimeout(() => {
            bubble.classList.add('fade-out');
            setTimeout(() => bubble.remove(), 900);
        }, dur);

        return bubble;
    }

    showDialog(text) {
        const lines = this._splitDialogText(text);
        let chain = Promise.resolve();
        for (const line of lines) {
            chain = chain.then(() => new Promise(resolve => {
                this.showDoorBubble(line);
                const dur = this._calcDuration(line);
                this._dialogTimer = setTimeout(() => {
                    this._dialogTimer = null;
                    resolve();
                }, dur);
            }));
        }
        return chain;
    }

    showTriggerDialog(text) {
        const lines = this._splitDialogText(text);
        for (const line of lines) {
            this.showDoorBubble(line);
        }
    }

    dismissAllDialogs() {
        return new Promise(resolve => {
            if (this._dialogTimer) {
                clearTimeout(this._dialogTimer);
                this._dialogTimer = null;
            }
            this._dialogSide = null;
            document.querySelectorAll('.door-bubble:not(.fade-out)').forEach(b => {
                b.classList.add('fade-out');
            });
            setTimeout(() => {
                document.querySelectorAll('.door-bubble').forEach(b => b.remove());
                this.dialogActive = false;
                resolve();
            }, 900);
        });
    }

    createItemElement(itemName) {
        const itemData = window.ITEMS[itemName] || { icon: '❓', type: 'unknown' };
        const el = document.createElement('div');
        el.className = 'game-item';
        if (itemData.type) {
            el.classList.add(`type-${itemData.type}`);
        }

        // 有长按效果的物品标记 has-effect（配方书、可提取物品等）
        if (itemData.isRecipeBook || itemData.extracts) {
            el.classList.add('has-effect');
        }

        el.dataset.name = itemName;
        el.innerHTML = `
            <div class="icon">${itemData.icon}</div>
            <div class="name">${itemName}</div>
        `;
        return el;
    }

    // 新增：添加到物品栏
    addToInventoryIfNotExists(itemName) {
        const inventory = document.getElementById('inventory-area');
        // 检查是否已存在
        const existing = Array.from(inventory.children).find(el => el.dataset.name === itemName);
        
        if (!existing) {
            const newItem = this.createItemElement(itemName);
            newItem.classList.add('in-inventory');
            newItem.classList.add('new-item'); // 复用弹出动画
            inventory.appendChild(newItem);
            
            // 更新物品栏布局
            this.updateInventoryLayout();
            
            // 滚动到最新的物品（垂直滚动）
            setTimeout(() => {
                inventory.scrollTo({
                    top: inventory.scrollHeight,
                    behavior: 'smooth'
                });
            }, 100);
        }
    }
    
    // ==================== 章节系统方法 ====================
    
    // 检查是否有下一个目标
    hasNextObjective() {
        if (!this.chapterData) return false;
        return this.objectiveIndex < this.chapterData.objectives.length - 1;
    }
    
    // 获取下一个目标的关卡ID
    getNextObjectiveLevelId() {
        if (!this.hasNextObjective()) return null;
        return this.chapterData.objectives[this.objectiveIndex + 1];
    }
    
    // 获取过渡文字
    getTransitionText() {
        if (!this.chapterData || !this.chapterData.transitionTexts) return '';
        return this.chapterData.transitionTexts[this.objectiveIndex] || '';
    }
    
    // 过渡到下一个目标
    transitionToNextObjective() {
        const nextLevelId = this.getNextObjectiveLevelId();
        if (!nextLevelId) return;
        
        const nextLevelData = window.LevelManager.getLevelData(nextLevelId);
        if (!nextLevelData) return;
        
        // 保存当前目标进度
        window.LevelManager.saveObjectiveProgress(this.chapterId, this.objectiveIndex);
        
        // 更新内部状态
        this.levelId = nextLevelId;
        this.levelData = nextLevelData;
        this.objectiveIndex = nextLevelData.objectiveIndex;
        
        // 重置游戏状态
        this.doorStage = 0;
        this.discoveredTriggers = new Set();
        this.synthesizedItems = new Set();
        this.targetReady = false;
        this._firedTriggers = new Set();
        
        // 清理提示计时器
        if (this.levelHintInterval) {
            clearInterval(this.levelHintInterval);
            this.levelHintInterval = null;
        }
        
        // 重新初始化UI（不重新绑定事件）
        this.refreshUIForNextObjective();
    }
    
    // 刷新UI以显示下一个目标
    refreshUIForNextObjective() {
        this._recipeBookPhaseActive = !!this.levelData.recipeBookPhase;
        const hideTarget = this._recipeBookPhaseActive;

        const targetItem = hideTarget ? null : window.ITEMS[this.levelData.target];
        const doorIcon = document.getElementById('door-icon');
        if (doorIcon) doorIcon.textContent = hideTarget ? '' : (targetItem?.icon || '?');
        
        const levelName = document.getElementById('level-name');
        if (levelName) levelName.textContent = this.levelData.name;

        if (hideTarget) {
            this._hideTargetDisplay();
        } else {
            this.updateTargetDisplay(this.levelData.target);
        }
        
        const doorContainer = document.getElementById('door-container');
        if (doorContainer) {
            doorContainer.className = 'door-container stage-0';
        }
        
        const synthesisArea = document.getElementById('synthesis-area');
        if (synthesisArea) {
            synthesisArea.innerHTML = '';
        }
        
        if (hideTarget) {
            const inventory = document.getElementById('inventory-area');
            if (inventory) inventory.innerHTML = '';
            this.updateInventoryLayout();
        } else {
            this.initInventory();
        }
        
        this.startIdleTimer();
        this._autoShowRecipeBook();
        
        if (this.levelData.levelHints && this.levelData.levelHints.length > 0) {
            this.showLevelHints();
        }

        if (this._recipeBookPhaseActive) {
            this._playLevelDialogs();
        }
    }
    
    _hideTargetDisplay() {
        const el = document.querySelector('.level-target-display');
        if (el) el.style.display = 'none';
    }

    _showTargetDisplay() {
        const el = document.querySelector('.level-target-display');
        if (el) el.style.display = '';
    }

    // 更新目标显示
    updateTargetDisplay(targetName, isFreeMode = false) {
        const targetNameEl = document.getElementById('target-name');
        const targetLabelEl = document.querySelector('.level-target-display .target-label');
        
        if (isFreeMode) {
            // 自由模式
            if (targetNameEl) targetNameEl.textContent = '发现新配方';
            if (targetLabelEl) targetLabelEl.textContent = '自由';
        } else if (targetName) {
            if (targetNameEl) targetNameEl.textContent = targetName;
            if (targetLabelEl) targetLabelEl.textContent = '目标';
        }
    }
}

// 导出到全局
window.Game = Game;

