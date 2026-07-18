// 游戏核心逻辑 - 核心模块
// @feature game-layout synthesis @see docs/FEATURE_INDEX.md
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
        /** @type {[HTMLElement, HTMLElement]|null} 酿造倒计时期间成对的两个 DOM，用于同步拖拽位移 */
        this._brewingDragPair = null;

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
        if (window.GameTaskToast) window.GameTaskToast.initBaseline();
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
        if (window.GameTaskToast) window.GameTaskToast.initBaseline();
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
        if (doorIcon) doorIcon.textContent = '🧪'; // free mode keeps emoji
        
        // 初始化物品栏 - 所有基础原料
        this.initFreeModeInventory();
        
        // 更新身份铭牌
        this.updateIdentityPlaque();

        const backIcon = document.getElementById('back-btn-icon');
        if (backIcon) Game.setIconContent(backIcon, '_home', '🏠');

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

    // 标记已看过教学

    // 显示教学动画

    // 关闭教学动画

    // 立即隐藏教学（非第一关或已看过）

    // 开始游戏（初始化UI和交互）
    startGame() {
        this.applyChapterTheme();
        this.createMilkFogParticles();
        this.initBgDecor();

        this._firedTriggers = new Set();
        this._synthCount = 0;
        this._synthRouteSteps = [];
        this._levelWasAlreadyCompletedOnEntry =
            !this.isFreeMode && window.LevelManager && window.LevelManager.isLevelCompleted(this.levelId);
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
            this._maybeShowTradeStationTutorial();
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
    
    // 背景装饰（奶酪谷 — 小草撮、灰尘、风）
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
                    const bh = r(9, 17);
                    const bw = r(1.8, 3.2);
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
                svg.setAttribute('width', '42');
                svg.setAttribute('height', '36');
                svg.setAttribute('viewBox', '-30 -35 60 40');
                svg.style.left = gx + '%';
                svg.style.top = gy + '%';
                svg.style.opacity = String(r(0.35, 0.55));
                svg.innerHTML = paths;
                container.appendChild(svg);
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


    _playLevelDialogs() {
        const isRecipePhase = this._recipeBookPhaseActive;
        const isSpecial = this.levelData.isSpecialArea;

        const runOpeningDialogs = () => {
            return Promise.resolve();
        };

        if (isRecipePhase) {
            runOpeningDialogs().then(() => this._initRecipeBookTrade());
            return;
        }

        if (isSpecial) {
            runOpeningDialogs().then(() => {
                this.initTradeStation();
                this._initSpecialAreaCenterTrade();
            });
            return;
        }

        runOpeningDialogs();
    }

    playCompletionDialogs() {
        return Promise.resolve();
    }

    checkTriggerDialogs(event, itemName) {
        // 深色背景白字门对白已统一关闭。
    }







    // 目标行金光发散动画（进入每关时吸引注意力）

    // 初始化双门布局
    
    // 显示关卡专属提示（循环显示）
    
    // 显示教学关卡特定提示
    
    updateIdentityPlaque() { }

    // 创建单个交易站 DOM，返回 state 对象

    // 初始化交易站（支持单个或多个）


    // 交易站断货 — 显示"断货"遮罩


    
    // 钻石显示




    // 从门飞向钻石显示区的动画

    // 钻石增加时在显示区上方飘出 "+N"

    // 在交易站位置产出物品（物品交易 & 钻石交易共用）


    /** 合成台无限物料：与物品栏新进场的 item-pop-in 一致（泡沫 + 音效） */

    /** 第 105 关等：首次进入时在合成台错位弹出无限物料 */

    /** 合成台一次性物料（不进物品栏）；与章节过渡里的 benchStart 对齐时可传 320 */







    /** 合成成功后：章节计时台词（102 / 104） */

    /** 合成失败也算「有尝试」，重置 102 闲置计时；104 等待双酪时重置 10 秒计时 */

    // 找到接受该物品的物品交易台（遍历所有交易站）

    // 执行物品交易（拖拽到交易台时的兼容入口）

    // 交易确认弹窗（统一物品/钻石）

    // 执行交易（带动画）

    // 输入物品飞向交易台左侧圆圈的动画

    // 根据物品数量更新物品栏高度（平滑过渡）
    // opts.impliedItemCount：关卡转场等场景下可传入「即将达到的物品数量」，以便提前增高换行


    /**
     * 物品栏变高会与合成区叠层（z-index）盖住台上的卡牌：把与之相交的合成区物品
     * 沿「朝上 ±22.5°」（共 45° 锥形）随机弹出到物品栏顶缘之上。
     */

    initDragSystem() {
        this.dragSystem = new window.DragSystem(this);
    }

    // ==================== 门的对话气泡 ====================




    _dialogSide = null;






    // ========== 门点击交互 ==========
    _doorClickLines = {
        101: { hints: [], chat: [] },
        102: {
            hints: ['鲜奶发酵成酸奶，滤布收成酪。'],
            chat: ['...', '别乱碰。', '老老实实做出奶酪。']
        },
        103: {
            hints: ['四种，我全都要。'],
            chat: ['...', '还没齐呢。', '别偷懒。']
        },
        104: {
            hints: ['也许跟它的名字有关。'],
            chat: ['...', '自己想。', '别看我。']
        },
        105: {
            hints: ['翻翻配方书。'],
            chat: ['...', '花挑错了可不行。', '别浪费雪酪。']
        },
        106: {
            hints: ['在考试呢，想什么呢。'],
            chat: ['...', '这是最后一关了。', '步骤不少。', '冷静。']
        },
        _default: {
            hints: [],
            chat: ['...', '嗯？', '别戳了。', '有事？', '去合成。']
        }
    };

    _doorClickCooldown = 0;
    _doorClickChatIdx = 0;



    /** 逼近目标：光波 + 门框成熟梯度（边缘更亮、纹样递进到 data-synth-maturity） */

    /** 合成产物相对当前关卡目标更近时，门泛起光波（与点击门同款动画） */



    // 设置门/容器等元素的图标（优先 SVG，回退 emoji）

    // 新增：添加到物品栏
    
    // ==================== 章节系统方法 ====================
    
    // 检查是否有下一个目标
    
    // 获取下一个目标的关卡ID
    
    // 获取过渡文字
    
    // 过渡到下一个目标
    
    // 刷新UI以显示下一个目标
    


    // 更新目标显示

    // ==================== 多目标门系统 ====================






}

Game._synthGoalDistCache = new Map();

/** 按 RECIPES 从每个目标反向 BFS：值为「至少还需多少次合成」才能得到某一目标（多目标取更小） */
Game.buildStepsToTargetsDistMap = function(goalNames) {
    const recipes = window.RECIPES || [];
    const dist = new Map();
    const queue = [];
    for (let i = 0; i < goalNames.length; i++) {
        const g = goalNames[i];
        if (!g || dist.has(g)) continue;
        dist.set(g, 0);
        queue.push(g);
    }
    let qi = 0;
    while (qi < queue.length) {
        const res = queue[qi++];
        const d = dist.get(res);
        for (let ri = 0; ri < recipes.length; ri++) {
            const r = recipes[ri];
            if (r.result !== res) continue;
            const ings = r.ingredients || [];
            for (let ii = 0; ii < ings.length; ii++) {
                const ing = ings[ii];
                const nd = d + 1;
                if (!dist.has(ing) || nd < dist.get(ing)) {
                    dist.set(ing, nd);
                    queue.push(ing);
                }
            }
        }
    }
    return dist;
};

Game.getStepsToTargetsDistMapCached = function(goalNames) {
    const key = [...goalNames].filter(Boolean).sort().join('\u0001');
    if (!key) return new Map();
    if (!Game._synthGoalDistCache.has(key)) {
        Game._synthGoalDistCache.set(key, Game.buildStepsToTargetsDistMap(goalNames));
    }
    return Game._synthGoalDistCache.get(key);
};

/** 合成逼近目标时门框「成熟」梯度档位上限（见 data-synth-maturity） */
Game.DOOR_SYNTH_MATURITY_MAX = 5;

Game.resetDoorSynthMaturity = function(dc) {
    if (dc && dc.dataset) delete dc.dataset.synthMaturity;
};

// 导出到全局
window.Game = Game;

