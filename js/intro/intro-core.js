// 开场序列系统 - 核心模块
// ================================================

class IntroSystem {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.textDotTargets = []; // 从 PNG 采样的目标坐标
        this.state = 'idle'; // 状态机
        this.stateData = {};
        this.door = null;
        this.items = []; // 教学物品
        this.draggedItem = null;
        this.synthesisResult = null;
        this.breathCount = 0;
        this.lastTime = 0;
        this.cyanOverlayAlpha = 0;
        this.pulseWaves = [];
        
        // 配置 - 调整参数
        this.config = {
            minParticles: 200,
            ambientParticles: 150,
            linkedClusterCount: 8,
            linkedClusterSpacing: 25,
            extraParticlesForText: 80,
            doorBreathDuration: 2000,
            doorBreathCount: 3,
            particleBaseSize: 1.5,
            particleMaxSize: 2.5,
            textParticleSize: 5,
            particleAlpha: 0.4,
        };

        this.isSmallScreen = window.innerWidth <= 450 && window.innerHeight <= 950;
        // 粒子大小从共用配置读取（与主界面保持一致，见 main-particles.js 顶部 BAOZHU_TITLE_CONFIG）
        const titleCfg = window.BAOZHU_TITLE_CONFIG;
        this.config.textParticleSize = this.isSmallScreen
            ? titleCfg.textParticleSize.small
            : titleCfg.textParticleSize.normal;
        if (this.isSmallScreen) {
            this.config.ambientParticles = 144;
            this.config.linkedClusterCount = 4;
        }
        
        this.init();
    }
    
    init() {
        this.createDOM();
        this.setupCanvas();
        this.loadTextDots();
        this.bindEvents();
        this.setState('dotIdle');
        this.animate();
    }
    
    createDOM() {
        // 创建开场容器
        const introScreen = document.getElementById('intro-screen');
        if (!introScreen) return;
        
        // Canvas 层
        this.canvas = document.getElementById('intro-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 其他 DOM 元素引用
        this.doorEl = document.getElementById('intro-door');
        this.doorIconEl = document.getElementById('intro-door-icon');
        this.inventoryEl = document.getElementById('intro-inventory');
        this.narrativeEl = document.getElementById('intro-narrative');
        this.startBtnEl = document.getElementById('intro-start-btn');
        this.titleEl = document.getElementById('intro-title');
        
        // 教学门内留白，不显示剪影图案
        this._setupDoorIcon();
    }
    
    _setupDoorIcon() {
        if (!this.doorIconEl) return;
        this.doorIconEl.innerHTML = '';
        this.doorIconEl.classList.remove('door-icon-svg');
        this.doorIconEl.classList.add('door-icon-empty');
    }
    
    setupCanvas() {
        const resize = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.centerX = this.canvas.width / 2;
            this.centerY = this.canvas.height / 2;
        };
        resize();
        window.addEventListener('resize', resize);
    }
    
    bindEvents() {
        const screen = document.getElementById('intro-screen');
        
        // 点击白点
        screen.addEventListener('click', (e) => {
            if (this.state === 'dotIdle') {
                this.setState('doorExpand');
            }
        });
        
        // 拖拽事件
        screen.addEventListener('pointerdown', this.onPointerDown.bind(this));
        screen.addEventListener('pointermove', this.onPointerMove.bind(this));
        screen.addEventListener('pointerup', this.onPointerUp.bind(this));
        screen.addEventListener('pointercancel', this.onPointerUp.bind(this));
        
        // 开场的开始按钮不再使用（改用主界面的按钮）
        // 保留元素但不绑定事件
    }
    
    // ==================== 状态机 ====================
    setState(newState, data = {}) {
        console.log(`Intro state: ${this.state} → ${newState}`);
        this.state = newState;
        this.stateData = { startTime: performance.now(), ...data };
        
        switch (newState) {
            case 'dotIdle':
                this.initDotIdle();
                break;
            case 'doorExpand':
                this.initDoorExpand();
                break;
            case 'doorBreath':
                this.initDoorBreath();
                break;
            case 'spawnRice':
                this.initSpawnRice();
                break;
            case 'waitRicePlaced':
                // 等待玩家放置糯米
                break;
            case 'ricePlacedPulse':
                this.initRicePlacedPulse();
                break;
            case 'spawnBrewing':
                this.initSpawnBrewing();
                break;
            case 'waitSynthesis':
                // 等待玩家合成
                this.showNarrative('把它们放在一起...');
                break;
            case 'firstSynthesis':
                this.initFirstSynthesis();
                break;
            case 'waitOffer':
                // 等待玩家献上
                break;
            case 'offerToDoor':
                this.initOfferToDoor();
                break;
            case 'blueWash':
                this.initBlueWash();
                break;
            case 'storyNarration':
                this.initStoryNarration();
                break;
            case 'riseUp':
                this.initRiseUp();
                break;
            case 'gatherToText':
                this.initGatherToText();
                break;
            case 'showStartButton':
                this.initShowStartButton();
                break;
            case 'storyTransition':
                this.initStoryTransition();
                break;
        }
    }
}

// 导出到全局
window.IntroSystem = IntroSystem;

