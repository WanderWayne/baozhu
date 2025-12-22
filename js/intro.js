// 开场序列系统 - 白点→拱门→粒子→教学→粒子拼字
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
            minParticles: 180, // 拼字用（再增加）
            ambientParticles: 130, // 初始环境粒子（再增加）
            linkedClusterCount: 8, // 连线粒子组数量
            linkedClusterSpacing: 25, // 连线粒子间距
            extraParticlesForText: 60, // 拼字时额外飞入的粒子（再增加）
            doorBreathDuration: 2000, // 呼吸周期 ms
            doorBreathCount: 3,
            particleBaseSize: 1.5, // 基础粒子大小（漂浮时小）
            particleMaxSize: 2.5, // 最大粒子大小
            textParticleSize: 9, // 拼字粒子大小（缩小1/4）
            particleAlpha: 0.4, // 粒子透明度
        };
        
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
        this.inventoryEl = document.getElementById('intro-inventory');
        this.narrativeEl = document.getElementById('intro-narrative');
        this.startBtnEl = document.getElementById('intro-start-btn');
        this.titleEl = document.getElementById('intro-title');
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
    
    // 手动定义点阵数据 - "宝珠奶酪" 四个字
    loadTextDots() {
        // 每个字 10x10 点阵，0=无点，1=有点
        const dotMatrices = {
            '宝': [
                [0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,2,0,0,0,0,0],
                [0,1,1,1,1,1,1,1,1,0],
                [0,1,0,0,0,0,0,0,1,0],
                [0,0,2,2,2,2,2,0,0,0],
                [0,0,0,0,2,0,0,0,0,0],
                [0,0,2,2,2,2,2,0,0,0],
                [0,0,0,0,2,0,0,0,0,0],
                [0,2,2,2,2,2,2,2,0,0],
                [0,0,0,0,0,0,0,0,0,0],
                
            ],
            '珠': [
                [0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,1,0,0],
                [4,4,4,0,1,0,1,0,0],
                [0,4,0,0,1,1,1,1,0],
                [4,4,4,0,0,0,1,0,0],
                [0,4,0,0,1,1,1,1,1],
                [4,4,4,0,0,3,1,0,0],
                [0,0,0,4,1,0,1,1,1],
                [0,0,0,0,0,0,1,0,0],
                [0,0,0,0,0,0,0,0,0],
                
            ],
            '奶': [
                [0,0,0,0,0,0,0,0,0,0],
                [0,3,0,0,0,0,0,0,0,0],
                [0,3,0,3,2,2,2,2,0,0],
                [3,3,3,3,3,2,0,2,0,0],
                [0,3,0,3,0,2,0,2,2,0],
                [0,3,0,3,0,2,0,0,2,0],
                [0,3,0,3,0,2,0,0,2,0],
                [0,3,3,3,3,2,0,0,2,0],
                [0,0,0,3,0,0,0,2,2,0],
                [0,0,0,0,0,0,0,0,0,0],
                
            ],
            '酪': [
                [0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0],
                [0,1,1,1,1,1,0,2,0,0,0],
                [0,0,1,0,1,0,0,1,1,0,0],
                [0,1,1,1,1,1,2,3,4,-2,0],
                [0,1,0,1,0,1,0,0,1,0,0],
                [0,1,1,0,1,1,2,2,0,1,1],
                [0,1,3,3,3,1,0,3,3,3,0],
                [0,1,0,0,0,1,0,3,0,3,0],
                [0,0,0,0,0,0,0,3,3,3,0],
                
            ],
        };
        
        this.generateDotsFromMatrices(dotMatrices);
    }
    
    generateDotsFromMatrices(matrices) {
        const chars = ['宝', '珠', '奶', '酪'];
        const dotSize = 12;      // 每个点的间距（缩小1/4）
        const charGap = 20;      // 字之间的间隔（缩小）
        const gridSize = 10;     // 点阵网格大小（与矩阵匹配）
        
        const charWidth = gridSize * dotSize;
        const totalWidth = chars.length * charWidth + (chars.length - 1) * charGap;
        const startX = this.centerX - totalWidth / 2;
        const startY = this.centerY - (gridSize * dotSize) / 2;
        
        this.textDotTargets = [];
        
        chars.forEach((char, charIndex) => {
            const matrix = matrices[char];
            if (!matrix) return;
            
            const charOffsetX = startX + charIndex * (charWidth + charGap);
            
            for (let row = 0; row < matrix.length; row++) {
                for (let col = 0; col < matrix[row].length; col++) {
                    const val = matrix[row][col];
                    if (val === 0) continue; // 无点
                    
                    let x = charOffsetX + col * dotSize;
                    let y = startY + row * dotSize;
                    
                    const absVal = Math.abs(val);
                    const sign = val < 0 ? -1 : 1;
                    
                    if (absVal === 1) {
                        // 正常位置
                    } else if (absVal === 2) {
                        // 往右偏移半格（负数往左）
                        x += sign * dotSize / 2;
                    } else if (absVal === 3) {
                        // 往下偏移半格（负数往上）
                        y += sign * dotSize / 2;
                    } else if (absVal === 4) {
                        // 往右+往下各偏移半格（负数反向）
                        x += sign * dotSize / 2;
                        y += sign * dotSize / 2;
                    }
                    
                    this.textDotTargets.push({ x, y });
                }
            }
        });
        
        console.log(`点阵生成了 ${this.textDotTargets.length} 个目标点`);
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
        
        // 开始游戏按钮
        if (this.startBtnEl) {
            this.startBtnEl.addEventListener('click', () => {
                this.setState('storyTransition');
            });
        }
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
    
    // ==================== 各状态初始化 ====================
    
    initDotIdle() {
        // 白点呼吸动画由 CSS 处理
        const dotEl = document.getElementById('intro-dot');
        if (dotEl) dotEl.classList.add('visible');
    }
    
    initDoorExpand() {
        // 白点渐隐
        const dotEl = document.getElementById('intro-dot');
        if (dotEl) {
            dotEl.style.transition = 'opacity 0.2s ease';
            dotEl.style.opacity = '0';
        }
        
        // 屏幕闪白
        const flashEl = document.getElementById('intro-flash');
        if (flashEl) {
            flashEl.classList.add('flash');
        }
        
        // 闪白期间，门和粒子先隐藏
        if (this.doorEl) {
            this.doorEl.style.opacity = '0';
        }
        
        // 0.7秒后白色开始渐变消失，同时显示门和粒子
        setTimeout(() => {
            // 显示门和粒子
            if (this.doorEl) {
                this.doorEl.style.opacity = '1';
            }
            this.createAllParticles();
            
            if (flashEl) {
                flashEl.classList.remove('flash');
                flashEl.classList.add('fade-out');
            }
        }, 700);
        
        // 渐变完成后（2.2秒），开始呼吸
        setTimeout(() => {
            this.showNarrative('这是...?');
            this.setState('doorBreath');
        }, 2200);
    }
    
    createAllParticles() {
        // 一次性创建所有粒子（无动画）
        for (let i = 0; i < this.config.ambientParticles; i++) {
            this.addParticle(false);
        }
        for (let i = 0; i < this.config.linkedClusterCount; i++) {
            this.addLinkedCluster();
        }
    }
    
    startParticleSpawning() {
        // 逐渐生成粒子（从中心向外扩散）
        let spawned = 0;
        const totalToSpawn = this.config.ambientParticles + this.config.linkedClusterCount * 3;
        
        const spawnInterval = setInterval(() => {
            if (spawned < this.config.ambientParticles) {
                this.addParticle(true);
            } else if (spawned < totalToSpawn) {
                if ((spawned - this.config.ambientParticles) % 3 === 0) {
                    this.addLinkedCluster();
                }
            } else {
                clearInterval(spawnInterval);
            }
            spawned++;
        }, 25);
    }
    
    initDoorBreath() {
        // 开始呼吸
        if (this.doorEl) {
            this.doorEl.classList.add('breathing');
        }
        
        // 呼吸3次后显示物品栏
        setTimeout(() => {
            this.hideNarrative();
            if (this.inventoryEl) {
                this.inventoryEl.classList.add('visible');
            }
            
            // 物品栏出现后弹出糯米
            setTimeout(() => {
                this.setState('spawnRice');
            }, 800);
        }, 6000); // 3次呼吸 = 6秒
    }
    
    initSpawnRice() {
        // 创建糯米物品
        this.createItem('糯米', '🍚', true);
        
        // 显示提示文字
        this.showNarrative('拖动它...');
        
        this.setState('waitRicePlaced');
    }
    
    initRicePlacedPulse() {
        // 糯米放下时的最强光波
        const rice = this.items.find(i => i.name === '糯米');
        if (rice) {
            // 从物品中心发射光波
            const centerX = rice.x + rice.width / 2;
            const centerY = rice.y + rice.height / 2;
            this.emitPulseWave(centerX, centerY, true);
            
            rice.isGolden = false;
            this.updateItemVisual(rice);
        }
        
        // 显示 "...很好......."
        setTimeout(() => {
            this.showNarrative('...很好.......');
            
            setTimeout(() => {
                this.setState('spawnBrewing');
            }, 1200);
        }, 600);
    }
    
    initSpawnBrewing() {
        // 创建酿造物品（普通样式）
        this.createItem('酿造', '🫗', false);
        
        setTimeout(() => {
            this.hideNarrative();
            this.setState('waitSynthesis');
        }, 300);
    }
    
    initFirstSynthesis() {
        this.hideNarrative();
        
        // 首次发现合成动画
        const rice = this.items.find(i => i.name === '糯米');
        const brewing = this.items.find(i => i.name === '酿造');
        if (!rice || !brewing) return;
        
        // 动画阶段 - 使用当前位置计算中心
        const riceCenterX = rice.x + rice.width / 2;
        const riceCenterY = rice.y + rice.height / 2;
        const brewingCenterX = brewing.x + brewing.width / 2;
        const brewingCenterY = brewing.y + brewing.height / 2;
        
        const centerX = (riceCenterX + brewingCenterX) / 2;
        const centerY = (riceCenterY + brewingCenterY) / 2;
        
        // 保存合成中心点
        this.synthesisCenterX = centerX;
        this.synthesisCenterY = centerY;
        
        // 阶段1：弹开（距离缩小）
        const popDistance = 50;
        const angle = Math.atan2(brewingCenterY - riceCenterY, brewingCenterX - riceCenterX);
        
        rice.animTarget = {
            x: centerX - Math.cos(angle) * popDistance - rice.width / 2,
            y: centerY - Math.sin(angle) * popDistance - rice.height / 2
        };
        brewing.animTarget = {
            x: centerX + Math.cos(angle) * popDistance - brewing.width / 2,
            y: centerY + Math.sin(angle) * popDistance - brewing.height / 2
        };
        rice.animPhase = 'popApart';
        brewing.animPhase = 'popApart';
        rice.spinAngle = 0;
        brewing.spinAngle = 0;
        
        // 250ms 后开始旋转
        setTimeout(() => {
            rice.animPhase = 'spinning';
            brewing.animPhase = 'spinning';
            rice.spinStart = performance.now();
            brewing.spinStart = performance.now();
            
            // 旋转结束后（600ms，2圈）冲刺
            setTimeout(() => {
                rice.animPhase = 'dash';
                brewing.animPhase = 'dash';
                rice.animTarget = { x: centerX - rice.width / 2, y: centerY - rice.height / 2 };
                brewing.animTarget = { x: centerX - brewing.width / 2, y: centerY - brewing.height / 2 };
                
                // 冲刺完成后白闪（200ms）
                setTimeout(() => {
                    this.flashWhite(centerX, centerY);
                    
                    // 移除原物品DOM
                    if (rice.el) rice.el.remove();
                    if (brewing.el) brewing.el.remove();
                    
                    // 移除原物品，创建酒酿
                    this.items = this.items.filter(i => i.name !== '糯米' && i.name !== '酿造');
                    this.synthesisResult = this.createSynthesisResult('酒酿', '🍶', centerX, centerY);
                    
                    // 门变活跃
                    setTimeout(() => {
                        if (this.doorEl) {
                            this.doorEl.classList.add('active');
                        }
                        this.showNarrative('快...放进来...');
                        this.setState('waitOffer');
                    }, 300);
                }, 200);
            }, 600);  // 改为600ms匹配旋转时间
        }, 250);  // 改为250ms
    }
    
    initOfferToDoor() {
        this.hideNarrative();
        
        // 献上动画
        if (this.synthesisResult) {
            this.synthesisResult.animPhase = 'offering';
            this.synthesisResult.animTarget = {
                x: this.centerX - 40,
                y: this.centerY - 100
            };
        }
        
        // 门吸收能量效果
        if (this.doorEl) {
            this.doorEl.classList.add('absorbing');
        }
        
        setTimeout(() => {
            // 移除酒酿DOM
            if (this.synthesisResult && this.synthesisResult.el) {
                this.synthesisResult.el.style.opacity = '0';
                this.synthesisResult.el.style.transform = 'scale(0.3)';
            }
            
            setTimeout(() => {
                if (this.synthesisResult && this.synthesisResult.el) {
                    this.synthesisResult.el.remove();
                }
                this.synthesisResult = null;
                
                // 清空物品
                this.items.forEach(item => {
                    if (item.el) item.el.remove();
                });
                this.items = [];
                
                // 门释放能量
                if (this.doorEl) {
                    this.doorEl.classList.remove('absorbing');
                    this.doorEl.classList.add('releasing');
                }
                
                this.setState('blueWash');
            }, 400);
        }, 600);
    }
    
    initBlueWash() {
        // 背景荧光蓝渐变 - 更亮更温柔，有力量感
        this.blueWashPhase = 'fadeIn';
        this.cyanOverlayAlpha = 0;
        this.blueWashMaxAlpha = 0.5; // 更亮
        
        // 1.5秒慢慢变亮
        setTimeout(() => {
            this.blueWashPhase = 'hold';
        }, 1500);
        
        // 保持0.5秒后开始消退
        setTimeout(() => {
            this.blueWashPhase = 'fadeOut';
            
            // 再过1.5秒后进入上升动画
            setTimeout(() => {
                this.setState('riseUp');
            }, 1500);
        }, 2000);
    }
    
    initRiseUp() {
        // 第一步：先让门和物品栏彻底消失
        if (this.doorEl) {
            this.doorEl.style.transition = 'opacity 0.8s ease';
            this.doorEl.style.opacity = '0';
        }
        if (this.inventoryEl) {
            this.inventoryEl.style.transition = 'opacity 0.8s ease';
            this.inventoryEl.style.opacity = '0';
        }
        
        // 等待门和物品栏完全消失后，等0.3秒，然后开始动画
        setTimeout(() => {
            this.startRiseAnimation();
        }, 1100); // 0.8秒消失 + 0.3秒等待
    }
    
    startRiseAnimation() {
        // 粒子往上飞
        this.risePhase = 'rising'; // 上升阶段
        this.riseOffset = 0;
        this.riseTargetOffset = this.canvas.height * 4; // 飞4屏的距离
        this.riseSpeed = 0;
        this.targetRiseSpeed = 0; // 目标镜头速度（用于平滑加减速）
        this.cameraScale = 1;
        this.riseStartTime = performance.now();
        this.riseDuration = 6000; // 总上升时间（ms）- 翻倍
        this.riseAccelTime = 1600; // 加速时间（ms）- 翻倍
        this.riseDecelTime = 2000; // 减速时间（ms）- 翻倍
        
        // 给所有粒子赋予上升属性 - 初始速度为0，会加速
        this.particles.forEach(p => {
            p.riseStartX = p.x;
            p.riseStartY = p.y;
            p.risingSpeed = 0; // 初始为0，会逐渐加速
            p.maxRisingSpeed = 10 + Math.random() * 10; // 最大速度（更快）
            p.originalSize = p.size;
            p.driftSpeed = (Math.random() - 0.5) * 0.4;
        });
        
        // 镜头放大动画 - 一开始就放大（时长翻倍）
        const screen = document.getElementById('intro-screen');
        if (screen) {
            screen.style.transition = 'transform 5s cubic-bezier(0.25, 0.1, 0.25, 1)';
            screen.style.transform = 'scale(1.3)';
        }
        
        // 动画完成后进入组成文字阶段
        setTimeout(() => {
            this.risePhase = 'stopped';
            this.setState('gatherToText');
        }, this.riseDuration);
    }
    
    initGatherToText() {
        // 重新加载点阵目标
        this.loadTextDots();
        
        // 渲染时：renderY = p.y + riseOffset
        // 我们想让文字显示在屏幕中央偏上一点（约 centerY * 0.65 的位置）
        // "开始游戏"按钮会在中央偏下一点
        // 所以：目标渲染位置 = centerY * 0.65
        //       p.targetY + riseOffset = centerY * 0.65
        //       p.targetY = centerY * 0.65 - riseOffset
        const riseY = this.riseOffset || 0;
        const displayCenterY = this.centerY * 0.65; // 屏幕显示位置：中央偏上
        const actualCenterY = displayCenterY - riseY; // 粒子实际坐标
        
        // 调整目标位置（将文字从 centerY 移动到 actualCenterY）
        const offsetY = actualCenterY - this.centerY;
        this.textDotTargets.forEach(t => {
            t.y = t.y + offsetY;
        });
        
        console.log(`riseOffset: ${riseY}, 显示位置: ${displayCenterY}, 实际目标Y偏移: ${offsetY}, 需要 ${this.textDotTargets.length} 个点`);

        const needed = this.textDotTargets.length;
        const currentCount = this.particles.length;
        
        // 如果粒子不够，从四面八方添加额外粒子飞入
        const extraNeeded = Math.max(0, needed - currentCount);
        if (extraNeeded > 0) {
            console.log(`需要额外 ${extraNeeded} 个粒子从四面八方飞入`);
            for (let i = 0; i < extraNeeded; i++) {
                // 从屏幕四边外面生成（考虑当前可见区域，即考虑 riseOffset）
                const side = Math.floor(Math.random() * 4);
                let x, y;
                // 可见区域的 y 范围：实际 y 在 [-riseY, canvas.height - riseY] 之间
                const visibleTop = -riseY - 100;
                const visibleBottom = this.canvas.height - riseY + 100;
                const visibleMidY = (visibleTop + visibleBottom) / 2;
                
                switch (side) {
                    case 0: // 上
                        x = Math.random() * this.canvas.width;
                        y = visibleTop;
                        break;
                    case 1: // 右
                        x = this.canvas.width + 50;
                        y = visibleMidY + (Math.random() - 0.5) * this.canvas.height;
                        break;
                    case 2: // 下
                        x = Math.random() * this.canvas.width;
                        y = visibleBottom;
                        break;
                    case 3: // 左
                        x = -50;
                        y = visibleMidY + (Math.random() - 0.5) * this.canvas.height;
                        break;
                }
                
                const p = {
                    x, y,
                    vx: 0, vy: 0,
                    size: this.config.textParticleSize,
                    alpha: 0.8,
                    visualSize: this.config.textParticleSize,
                    visualAlpha: 0.8,
                    linkedTo: null,
                    gathering: false,
                    isExtraParticle: true
                };
                this.particles.push(p);
            }
        }
        
        // 按照粒子当前位置排序（靠近文字中心的优先）
        const sortedParticles = [...this.particles].sort((a, b) => {
            const distA = Math.hypot(a.x - this.centerX, a.y - actualCenterY);
            const distB = Math.hypot(b.x - this.centerX, b.y - actualCenterY);
            return distA - distB;
        });
        
        // 打乱目标顺序
        const shuffledTargets = [...this.textDotTargets].sort(() => Math.random() - 0.5);
        
        // 断开所有连线，停止漂移
        this.particles.forEach(p => {
            p.linkedTo = null;
            p.driftSpeed = 0;
        });
        
        // 分配目标
        sortedParticles.forEach((p, i) => {
            if (i < shuffledTargets.length) {
                // 这个粒子会变成文字的一部分
                p.targetX = shuffledTargets[i].x;
                p.targetY = shuffledTargets[i].y;
                p.targetSize = this.config.textParticleSize;
                p.isTextDot = true;
                p.targetAlpha = 1;
                p.gathering = true;
            } else {
                // 多余粒子慢慢淡出
                p.targetAlpha = 0;
                p.isTextDot = false;
                p.gathering = true;
                p.targetX = p.x + (Math.random() - 0.5) * 300;
                p.targetY = p.y - 200;
            }
        });
        
        console.log(`开始聚合，共 ${this.particles.length} 个粒子，${needed} 个目标点`);
        
        // 4秒后显示开始按钮（拼字更慢，需要更长时间）
        setTimeout(() => {
            this.setState('showStartButton');
        }, 4000);
    }
    
    
    initShowStartButton() {
        // 粒子停止移动，固定位置
        this.particles.forEach(p => {
            if (p.isTextDot && p.targetX !== null) {
                p.x = p.targetX;
                p.y = p.targetY;
                p.gathering = false;
            }
        });
        
        // 显示按钮
        setTimeout(() => {
            if (this.startBtnEl) {
                this.startBtnEl.classList.add('visible');
            }
        }, 500);
    }
    
    initStoryTransition() {
        // 隐藏按钮和文字粒子
        if (this.startBtnEl) {
            this.startBtnEl.style.transition = 'opacity 0.8s ease';
            this.startBtnEl.style.opacity = '0';
            this.startBtnEl.style.pointerEvents = 'none';
        }
        
        // 粒子淡出
        this.particles.forEach(p => {
            p.targetAlpha = 0;
            p.gathering = true;
        });
        
        // 创建故事文字容器
        const storyContainer = document.createElement('div');
        storyContainer.id = 'story-text-container';
        storyContainer.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            z-index: 50;
            pointer-events: none;
        `;
        document.getElementById('intro-screen').appendChild(storyContainer);
        
        // 故事文字序列
        const storySequence = [
            { text: '十三年前，一位酿造师在田子坊的小巷里\n点燃了第一盏灯，开始了酿造的旅程。', delay: 1000, duration: 6000 },
            { text: '十三年后，这些配方被时间打碎成了记忆碎片，\n散落在酿造宇宙的各个角落。', delay: 600, duration: 6000 },
            { text: '你的任务：找回这些碎片，\n重建完整的"宝珠配方图谱"。', delay: 600, duration: 6000, isGoal: true },
            { text: '当最后一块碎片归位，\n传说中的"天赐宝珠酪"将再次被唤醒。', delay: 600, duration: 7500, isGoal: true }
        ];
        
        let currentDelay = 800; // 初始等待粒子淡出
        
        storySequence.forEach((item, index) => {
            currentDelay += item.delay;
            
            setTimeout(() => {
                this.showStoryText(storyContainer, item.text, item.duration, item.isGoal);
            }, currentDelay);
            
            currentDelay += item.duration;
        });
        
        // 所有文字显示完后进入主界面
        setTimeout(() => {
            this.finishIntro();
        }, currentDelay + 500);
    }
    
    showStoryText(container, text, duration, isGoal = false) {
        const textEl = document.createElement('div');
        textEl.className = 'story-text' + (isGoal ? ' goal-text' : '');
        textEl.innerHTML = text.replace(/\n/g, '<br>'); // 支持换行
        textEl.style.cssText = `
            font-size: ${isGoal ? '22px' : '24px'};
            line-height: 1.8;
            color: ${isGoal ? '#FFD700' : '#E0F7FA'};
            font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
            letter-spacing: 4px;
            opacity: 0;
            transform: scale(0.95);
            transition: opacity 1s ease, transform 1s ease;
            text-shadow: ${isGoal 
                ? '0 0 20px rgba(255, 215, 0, 0.6), 0 0 40px rgba(255, 215, 0, 0.3)' 
                : '0 0 15px rgba(0, 200, 255, 0.6), 0 0 30px rgba(0, 200, 255, 0.3)'};
            margin: 20px 0;
            max-width: 80vw;
        `;
        
        container.innerHTML = ''; // 清除之前的文字
        container.appendChild(textEl);
        
        // 淡入
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                textEl.style.opacity = '1';
                textEl.style.transform = 'scale(1)';
            });
        });
        
        // 淡出
        setTimeout(() => {
            textEl.style.opacity = '0';
            textEl.style.transform = 'scale(1.02)';
        }, duration - 1000);
    }
    
    // ==================== 粒子系统 ====================
    
    addParticle(fromCenter = false) {
        const angle = Math.random() * Math.PI * 2;
        const dist = fromCenter ? (20 + Math.random() * 80) : (150 + Math.random() * 350);
        
        const p = {
            x: this.centerX + Math.cos(angle) * dist,
            y: this.centerY + Math.sin(angle) * dist,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            size: this.config.particleBaseSize + Math.random() * (this.config.particleMaxSize - this.config.particleBaseSize),
            alpha: this.config.particleAlpha + Math.random() * 0.2,
            targetAlpha: null,
            linkedTo: null,
            gathering: false,
            targetX: null,
            targetY: null,
            targetSize: null,
            isTextDot: false,
            pulseOffset: 0, // 被光波震动的偏移
            pulseDecay: 0,
            pulseAngle: 0
        };
        
        this.particles.push(p);
        return p;
    }
    
    addLinkedCluster() {
        const count = 2 + Math.floor(Math.random() * 2); // 2-3个
        const baseX = this.centerX + (Math.random() - 0.5) * 500;
        const baseY = this.centerY + (Math.random() - 0.5) * 500;
        const cluster = [];
        
        for (let i = 0; i < count; i++) {
            const p = this.addParticle(false);
            // 连线粒子间距缩小
            p.x = baseX + (Math.random() - 0.5) * this.config.linkedClusterSpacing;
            p.y = baseY + (Math.random() - 0.5) * this.config.linkedClusterSpacing;
            p.vx = (Math.random() - 0.5) * 0.15;
            p.vy = (Math.random() - 0.5) * 0.15;
            p.size = this.config.particleBaseSize; // 连线粒子统一较小
            cluster.push(p);
        }
        
        // 建立连接
        for (let i = 1; i < cluster.length; i++) {
            cluster[i].linkedTo = cluster[i - 1];
        }
    }
    
    updateParticles(dt) {
        // 上升偏移影响粒子y轴
        const riseY = (this.state === 'riseUp' || this.state === 'gatherToText' || this.state === 'showStartButton') 
            ? (this.riseOffset || 0) : 0;
            
        this.particles.forEach(p => {
            // 上升逻辑 - 从原位置往上飞
            if (this.state === 'riseUp' && !p.gathering) {
                const elapsed = performance.now() - (this.riseStartTime || 0);
                const totalDuration = this.riseDuration || 3000;
                const accelTime = this.riseAccelTime || 800;
                const decelTime = this.riseDecelTime || 1000;
                const steadyEnd = totalDuration - decelTime;
                
                // 计算速度倍数（使用与镜头相同的加减速曲线）
                let speedMultiplier = 1;
                if (elapsed < accelTime) {
                    // 加速阶段
                    const accelProgress = elapsed / accelTime;
                    speedMultiplier = this.easeOutCubic(accelProgress);
                } else if (elapsed < steadyEnd) {
                    // 匀速阶段
                    speedMultiplier = 1;
                } else if (elapsed < totalDuration) {
                    // 减速阶段
                    const decelProgress = (elapsed - steadyEnd) / decelTime;
                    speedMultiplier = this.easeInCubic(1 - decelProgress);
                } else {
                    speedMultiplier = 0;
                }
                
                p.risingSpeed = (p.maxRisingSpeed || 10) * speedMultiplier;
                
                // 往上飞
                const speed = p.risingSpeed || 0;
                p.y -= speed;
                
                // 轻微水平漂移（保持自然感）
                if (p.driftSpeed) {
                    p.x += p.driftSpeed * speedMultiplier;
                }
                
                // 计算上升进度（限制在 0-1）
                const startY = p.riseStartY || this.canvas.height / 2;
                const totalRise = Math.max(0, startY - p.y);
                const maxRise = this.canvas.height * 1.5;
                const riseProgress = Math.min(1, Math.max(0, totalRise / maxRise));
                
                // 上升过程中粒子逐渐变大到文字点大小
                const targetSize = this.config.textParticleSize || 12;
                const startSize = p.originalSize || p.size || 2;
                // 确保 size 始终为正数
                p.visualSize = Math.max(1, startSize + (targetSize - startSize) * riseProgress);
                
                // 透明度也逐渐增加
                p.visualAlpha = Math.max(0.1, (p.alpha || 0.5) * (0.6 + riseProgress * 0.4));
                
                // 更新实际 size（用于后续组成文字）
                p.size = p.visualSize;
            } else {
                p.visualSize = Math.max(1, p.size || 2);
                p.visualAlpha = p.alpha || 0.5;
            }
            
            // ... existing update logic ...
            // 已经到达目标位置并固定的粒子不再移动
            if (p.settled) {
                return;
            }
            
            if (p.gathering && p.targetX !== null) {
                // 向目标聚合 - 慢慢靠近
                const dx = p.targetX - p.x;
                const dy = p.targetY - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 1) {
                    // 使用更慢的缓动
                    const speed = Math.max(dist * 0.03, 1); // 更慢：0.08 -> 0.03
                    p.x += (dx / dist) * speed;
                    p.y += (dy / dist) * speed;
                } else {
                    // 到达目标，固定位置
                    p.x = p.targetX;
                    p.y = p.targetY;
                    if (p.isTextDot) {
                        p.settled = true; // 标记为已固定
                    }
                }
                
                if (p.targetSize !== null) {
                    p.size += (p.targetSize - p.size) * 0.08;
                }
                if (p.targetAlpha !== null) {
                    p.alpha += (p.targetAlpha - p.alpha) * 0.06;
                }
            } else if (this.state !== 'riseUp') { // 非上升状态下的自由漂浮
                // 自由漂浮
                p.x += p.vx;
                p.y += p.vy;
                
                // 边界反弹（软边界）
                const margin = 50;
                if (p.x < margin) p.vx += 0.01;
                if (p.x > this.canvas.width - margin) p.vx -= 0.01;
                if (p.y < margin) p.vy += 0.01;
                if (p.y > this.canvas.height - margin) p.vy -= 0.01;
                
                // 速度衰减
                p.vx *= 0.999;
                p.vy *= 0.999;
            }
            
            // 光波震动衰减
            if (p.pulseDecay > 0) {
                p.pulseDecay -= dt * 0.002;
                if (p.pulseDecay < 0) p.pulseDecay = 0;
            }
        });
    }
    
    drawParticles() {
        const ctx = this.ctx;
        
        // 上升偏移已在 update 中处理了粒子坐标，这里只需要处理尾巴
        const riseY = (this.state === 'riseUp' || this.state === 'gatherToText' || this.state === 'showStartButton') 
            ? (this.riseOffset || 0) : 0;
        
        // 先画连线（更细更透明）
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 0.5;
        this.particles.forEach(p => {
            if (p.linkedTo && !p.gathering && this.state !== 'riseUp') {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.linkedTo.x, p.linkedTo.y);
                ctx.stroke();
            }
        });
        
        // 再画粒子
        this.particles.forEach(p => {
            // 光波震动偏移
            const offsetX = Math.cos(p.pulseAngle) * p.pulseOffset * p.pulseDecay;
            const offsetY = Math.sin(p.pulseAngle) * p.pulseOffset * p.pulseDecay;
            
            // 绘制拖尾（仅在上升时）
            if (this.state === 'riseUp' && !p.gathering) {
                const speed = p.risingSpeed || 4;
                const trailLength = speed * 4 + (this.riseSpeed || 6) * 1.5;
                const renderY = p.y + riseY;
                
                const gradient = ctx.createLinearGradient(p.x, renderY, p.x, renderY + trailLength);
                gradient.addColorStop(0, `rgba(255, 255, 255, ${(p.visualAlpha || p.alpha) * 0.8})`);
                gradient.addColorStop(0.4, `rgba(200, 230, 255, ${(p.visualAlpha || p.alpha) * 0.4})`);
                gradient.addColorStop(1, 'rgba(150, 200, 255, 0)');
                
                ctx.beginPath();
                ctx.moveTo(p.x, renderY);
                ctx.lineTo(p.x, renderY + trailLength);
                ctx.strokeStyle = gradient;
                ctx.lineWidth = (p.visualSize || p.size) * 0.5;
                ctx.lineCap = 'round';
                ctx.stroke();
            }
            
            // 绘制粒子本体
            // 注意：riseY 只在 update 没有处理 y 轴时才需要减去，但我们的 update 逻辑对于上升是直接修改 p.y 的
            // 只有 gatherToText 阶段，由于重新计算了 targets 并减去了 riseY，所以粒子本身不需要再减
            // 但为了统一，我们在 update 里修改 y，draw 里只画当前 x,y
            
            // 修正：riseUp 阶段 update 已经改了 y，所以直接画
            // gatherToText 阶段 target 已经减了 riseY，p.y 也会飞向那个位置，所以也直接画
            // 唯独 spiral 时，我们计算的是绝对位置，所以需要减去 riseOffset 带来的视觉移动？
            // 不，画面往上飞 = 所有物体 y 坐标增加（下移）？不对，画面往上 = 物体相对画面下移。
            // 我们让 riseOffset 增加，然后渲染时 y + riseOffset 吗？
            // 之前的逻辑是 riseOffset 增加，然后 draw 时 y - riseY 不对，应该是 y + riseY 模拟相机上移
            // 或者：粒子真实 y 坐标减小（上移），相机不动。
            // 采用方案：粒子真实 y 减小（上飞），同时相机上移（riseOffset 增加）
            // 最终渲染 y = p.y + riseOffset
            
            let renderY = p.y;
            if (this.state === 'riseUp' || this.state === 'gatherToText' || this.state === 'showStartButton') {
                renderY += riseY;
            }
            
            // 确保半径为正数
            const radius = Math.max(0.5, p.visualSize || p.size || 2);
            const alpha = Math.max(0, Math.min(1, p.visualAlpha || p.alpha || 0.5));
            
            ctx.beginPath();
            ctx.arc(p.x + offsetX, renderY + offsetY, radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fill();
        });
    }
    
    // 发射多条光波（中间最强，向外递减）
    emitPulseWave(x, y, isFinal = false) {
        const waveCount = isFinal ? 5 : 3;
        const baseDelay = 80;
        
        for (let i = 0; i < waveCount; i++) {
            setTimeout(() => {
                // 中间的波最强
                const centerIndex = Math.floor(waveCount / 2);
                const distFromCenter = Math.abs(i - centerIndex);
                const strength = 1 - (distFromCenter / waveCount) * 0.6;
                
                const wave = {
                    x, y,
                    radius: 0,
                    maxRadius: isFinal ? 500 : 300,
                    speed: isFinal ? 6 : 4,
                    alpha: strength,
                    lineWidth: isFinal ? (4 - distFromCenter * 0.8) : (2 - distFromCenter * 0.4),
                    isFinal
                };
                
                this.pulseWaves.push(wave);
            }, i * baseDelay);
        }
    }
    
    updatePulseWaves(dt) {
        this.pulseWaves = this.pulseWaves.filter(wave => {
            wave.radius += wave.speed;
            const progress = wave.radius / wave.maxRadius;
            wave.currentAlpha = wave.alpha * (1 - progress * progress); // 平方衰减
            
            // 检测粒子碰撞 - 震动效果
            if (wave.isFinal || wave.alpha > 0.5) {
                this.particles.forEach(p => {
                    const dx = p.x - wave.x;
                    const dy = p.y - wave.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    // 波前沿范围内的粒子被震动
                    if (Math.abs(dist - wave.radius) < 30) {
                        const strength = wave.isFinal ? 20 : 10;
                        p.pulseOffset = strength * (1 - Math.abs(dist - wave.radius) / 30);
                        p.pulseDecay = 1;
                        p.pulseAngle = Math.atan2(dy, dx); // 径向震动
                    }
                });
            }
            
            return wave.radius < wave.maxRadius;
        });
    }
    
    drawPulseWaves() {
        const ctx = this.ctx;
        this.pulseWaves.forEach(wave => {
            ctx.beginPath();
            ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
            const color = wave.isFinal 
                ? `rgba(255, 200, 50, ${wave.currentAlpha * 0.7})`
                : `rgba(255, 215, 100, ${wave.currentAlpha * 0.5})`;
            ctx.strokeStyle = color;
            ctx.lineWidth = wave.lineWidth;
            ctx.stroke();
        });
    }
    
    // ==================== 物品系统 ====================
    
    createItem(name, icon, isGolden = false) {
        // 根据屏幕尺寸调整物品大小（iPad Air: 1180x820）
        const isLargeScreen = window.innerWidth >= 800 && window.innerHeight >= 700;
        const itemWidth = isLargeScreen ? 70 : 75;
        const itemHeight = isLargeScreen ? 70 : 75;
        
        // 物品栏高度
        const inventoryHeight = isLargeScreen ? 180 : 110;
        
        // 计算物品栏中的位置 - 左上角开始排列
        const itemIndex = this.items.length;
        const gap = 12;
        const padding = 20;
        const startX = padding;
        const startY = this.canvas.height - inventoryHeight + padding;
        
        const item = {
            name,
            icon,
            isGolden,
            x: startX + itemIndex * (itemWidth + gap),
            y: startY,
            // 保存原始位置，用于放回
            originX: startX + itemIndex * (itemWidth + gap),
            originY: startY,
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
    }
    
    startGoldenPulse(item) {
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
    }
    
    updateItemVisual(item) {
        if (item.el) {
            item.el.classList.toggle('golden', item.isGolden);
        }
        // 停止光波
        if (!item.isGolden && item.pulseInterval) {
            clearInterval(item.pulseInterval);
        }
    }
    
    createSynthesisResult(name, icon, x, y) {
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
    }
    
    flashWhite(x, y) {
        const flash = document.createElement('div');
        flash.className = 'synthesis-flash';
        flash.style.left = x + 'px';
        flash.style.top = y + 'px';
        
        document.getElementById('intro-screen').appendChild(flash);
        
        setTimeout(() => flash.remove(), 400);
    }
    
    // ==================== 拖拽系统 ====================
    
    onPointerDown(e) {
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
    }
    
    onPointerMove(e) {
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
    }
    
    onPointerUp(e) {
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
    }
    
    // ==================== 渲染循环 ====================
    
    animate(time = 0) {
        const dt = time - this.lastTime;
        this.lastTime = time;
        
        // 清空画布
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 荧光蓝覆层（献上后的效果）- 更亮更温柔
        if (this.state === 'blueWash' || this.state === 'riseUp') {
            const maxAlpha = this.blueWashMaxAlpha || 0.25;
            
            if (this.blueWashPhase === 'fadeIn') {
                this.cyanOverlayAlpha = Math.min(this.cyanOverlayAlpha + 0.008, maxAlpha);
            } else if (this.blueWashPhase === 'hold') {
                // 保持
            } else if (this.blueWashPhase === 'fadeOut') {
                this.cyanOverlayAlpha = Math.max(this.cyanOverlayAlpha - 0.006, 0);
            }
            
            if (this.cyanOverlayAlpha > 0) {
                this.ctx.fillStyle = `rgba(0, 200, 255, ${this.cyanOverlayAlpha})`;
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }
        }
        
        // 上升动画 - 镜头与粒子同步，带加速和减速
        if (this.risePhase === 'rising') {
            const elapsed = performance.now() - this.riseStartTime;
            const totalDuration = this.riseDuration;
            const accelTime = this.riseAccelTime;
            const decelTime = this.riseDecelTime;
            const steadyStart = accelTime;
            const steadyEnd = totalDuration - decelTime;
            
            // 计算目标镜头速度（基于阶段）
            let maxCameraSpeed = 15; // 最大镜头速度
            
            if (elapsed < accelTime) {
                // 加速阶段：使用缓动函数平滑加速
                const accelProgress = elapsed / accelTime;
                const eased = this.easeOutCubic(accelProgress);
                this.targetRiseSpeed = maxCameraSpeed * eased;
            } else if (elapsed < steadyEnd) {
                // 匀速阶段
                this.targetRiseSpeed = maxCameraSpeed;
            } else if (elapsed < totalDuration) {
                // 减速阶段：使用缓动函数平滑减速
                const decelProgress = (elapsed - steadyEnd) / decelTime;
                const eased = this.easeInCubic(1 - decelProgress);
                this.targetRiseSpeed = maxCameraSpeed * eased;
            } else {
                this.targetRiseSpeed = 0;
            }
            
            // 镜头速度平滑过渡
            this.riseSpeed += (this.targetRiseSpeed - this.riseSpeed) * 0.15;
            this.riseOffset += this.riseSpeed;
            
            // 限制最大偏移
            if (this.riseOffset > this.riseTargetOffset) {
                this.riseOffset = this.riseTargetOffset;
            }
        } else if (this.risePhase === 'stopped') {
            // 停止后保持位置
        }
        
        // 更新和绘制粒子
        this.updateParticles(dt);
        this.updatePulseWaves(dt);
        this.drawParticles();
        this.drawPulseWaves();
        
        // 更新物品动画
        this.updateItemAnimations(dt);
        
        requestAnimationFrame(this.animate.bind(this));
    }
    
    updateItemAnimations(dt) {
        this.items.forEach(item => {
            if (item.animPhase === 'popApart' && item.animTarget) {
                item.x += (item.animTarget.x - item.x) * 0.2;
                item.y += (item.animTarget.y - item.y) * 0.2;
                this.updateItemPosition(item);
            } else if (item.animPhase === 'spinning') {
                const elapsed = performance.now() - item.spinStart;
                const progress = Math.min(elapsed / 600, 1); // 600ms
                const eased = this.easeInOutCubic(progress);
                item.spinAngle = eased * Math.PI * 4; // 2圈
                this.updateItemPosition(item);
            } else if (item.animPhase === 'dash' && item.animTarget) {
                item.x += (item.animTarget.x - item.x) * 0.3;
                item.y += (item.animTarget.y - item.y) * 0.3;
                item.spinAngle = 0;
                this.updateItemPosition(item);
            }
        });
        
        // 合成结果动画
        if (this.synthesisResult && this.synthesisResult.animPhase === 'offering') {
            const item = this.synthesisResult;
            if (item.animTarget) {
                item.x += (item.animTarget.x - item.x) * 0.12;
                item.y += (item.animTarget.y - item.y) * 0.12;
                this.updateItemPosition(item);
            }
        }
    }
    
    updateItemPosition(item) {
        if (item.el) {
            item.el.style.left = item.x + 'px';
            item.el.style.top = item.y + 'px';
            if (item.spinAngle) {
                item.el.style.transform = `rotate(${item.spinAngle}rad)`;
            } else {
                item.el.style.transform = '';
            }
        }
    }
    
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }
    
    easeInCubic(t) {
        return t * t * t;
    }
    
    // ==================== 辅助方法 ====================
    
    showNarrative(text) {
        if (this.narrativeEl) {
            this.narrativeEl.textContent = text;
            this.narrativeEl.classList.add('visible');
            
            // 荧光蓝色，发光效果，像灵魂的低语
            this.narrativeEl.style.color = '#E0F7FA';
            this.narrativeEl.style.textShadow = '0 0 10px rgba(0, 200, 255, 0.8), 0 0 20px rgba(0, 200, 255, 0.4)';
        }
    }
    
    hideNarrative() {
        if (this.narrativeEl) {
            this.narrativeEl.classList.remove('visible');
        }
    }
    
    finishIntro() {
        // 标记已播放
        sessionStorage.setItem('hasPlayedIntro_v5', 'true');
        
        // 淡出开场
        const screen = document.getElementById('intro-screen');
        if (screen) {
            screen.classList.add('fade-out');
            
            setTimeout(() => {
                screen.style.display = 'none';
                // 显示主界面
                const container = document.querySelector('.container');
                if (container) {
                    container.style.display = 'flex';
                }
            }, 1000);
        }
    }
}

// 检查是否需要播放开场
document.addEventListener('DOMContentLoaded', () => {
    const hasPlayed = sessionStorage.getItem('hasPlayedIntro_v5');
    const urlParams = new URLSearchParams(window.location.search);
    const forceIntro = urlParams.get('intro') === 'reset';
    
    if (forceIntro) {
        sessionStorage.removeItem('hasPlayedIntro_v5');
    }
    
    const introScreen = document.getElementById('intro-screen');
    const container = document.querySelector('.container');
    
    if (!hasPlayed || forceIntro) {
        // 播放开场
        if (introScreen) introScreen.style.display = 'flex';
        if (container) container.style.display = 'none';
        window.introSystem = new IntroSystem();
    } else {
        // 跳过开场
        if (introScreen) introScreen.style.display = 'none';
        if (container) container.style.display = 'flex';
    }
});
