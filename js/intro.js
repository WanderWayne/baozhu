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
        this.expandRadius = 0; // 扩散圆半径
        this.pulseWaves = [];
        
        // 配置 - 调整参数
        this.config = {
            minParticles: 150, // 最少粒子数（用于拼字）
            ambientParticles: 35, // 环境漂浮粒子（减少）
            linkedClusterCount: 6, // 连线粒子组数量（减少）
            linkedClusterSpacing: 25, // 连线粒子间距（缩小）
            doorBreathDuration: 2000, // 呼吸周期 ms（更慢更温柔）
            doorBreathCount: 3,
            particleBaseSize: 1.5, // 基础粒子大小（缩小）
            particleMaxSize: 2.5, // 最大粒子大小
            textParticleSize: 3, // 拼字粒子大小
            particleAlpha: 0.4, // 粒子透明度（降低）
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
    
    // 生成文字点阵目标坐标（直接绘制文字采样，更可靠）
    loadTextDots() {
        // 等待 DOM 加载完成后再采样
        setTimeout(() => {
            this.generateTextDots();
        }, 100);
    }
    
    generateTextDots() {
        const text = '宝珠奶酪';
        const fontSize = Math.min(72, window.innerWidth / 6);
        
        // 创建离屏 canvas
        const offCanvas = document.createElement('canvas');
        const offCtx = offCanvas.getContext('2d');
        
        // 设置画布大小
        offCanvas.width = fontSize * text.length + 40;
        offCanvas.height = fontSize + 40;
        
        // 绘制文字
        offCtx.fillStyle = '#fff';
        offCtx.font = `bold ${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
        offCtx.textAlign = 'center';
        offCtx.textBaseline = 'middle';
        offCtx.fillText(text, offCanvas.width / 2, offCanvas.height / 2);
        
        // 采样像素
        const imageData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
        const data = imageData.data;
        
        // 降采样步长
        const step = 4;
        const offsetX = this.centerX - offCanvas.width / 2;
        const offsetY = this.centerY - offCanvas.height / 2;
        
        this.textDotTargets = [];
        
        for (let y = 0; y < offCanvas.height; y += step) {
            for (let x = 0; x < offCanvas.width; x += step) {
                const i = (y * offCanvas.width + x) * 4;
                const a = data[i + 3]; // alpha 通道
                
                // 检测有内容的像素
                if (a > 50) {
                    this.textDotTargets.push({
                        x: offsetX + x,
                        y: offsetY + y
                    });
                }
            }
        }
        
        console.log(`生成了 ${this.textDotTargets.length} 个文字点阵目标`);
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
                this.finishIntro();
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
            case 'zoomOutWithUI':
                this.initZoomOutWithUI();
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
            case 'gatherToText':
                this.initGatherToText();
                break;
            case 'showStartButton':
                this.initShowStartButton();
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
        // 隐藏白点
        const dotEl = document.getElementById('intro-dot');
        if (dotEl) {
            dotEl.classList.add('expanding');
        }
        
        // 开始扩散动画
        this.expandRadius = 10;
        this.expandPhase = 'expanding';
        
        // 一开始门就是放大的状态
        const screen = document.getElementById('intro-screen');
        if (screen) screen.classList.add('zoomed');
        
        // 延迟显示门（等扩散到一定程度）
        setTimeout(() => {
            if (dotEl) dotEl.style.opacity = '0';
            if (this.doorEl) {
                this.doorEl.classList.add('expanding');
            }
            // 开始生成粒子
            this.startParticleSpawning();
        }, 600);
        
        // 扩散完成后进入呼吸
        setTimeout(() => {
            this.expandPhase = 'done';
            this.showNarrative('这是...?');
            this.setState('doorBreath');
        }, 1800);
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
        this.breathCount = 0;
        if (this.doorEl) {
            this.doorEl.classList.add('breathing');
        }
        
        // 开始呼吸计数
        const breathInterval = setInterval(() => {
            this.breathCount++;
            if (this.breathCount >= this.config.doorBreathCount) {
                clearInterval(breathInterval);
                this.hideNarrative();
                this.setState('zoomOutWithUI');
            }
        }, this.config.doorBreathDuration);
    }
    
    initZoomOutWithUI() {
        // 镜头缩小的同时，物品栏从底部冒出
        const screen = document.getElementById('intro-screen');
        if (screen) screen.classList.remove('zoomed');
        
        // 同时显示物品栏
        if (this.inventoryEl) {
            this.inventoryEl.classList.add('visible');
        }
        
        // 缩小动画时长约1.5s，结束后弹出糯米
        setTimeout(() => {
            this.setState('spawnRice');
        }, 1500);
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
        
        // 阶段1：弹开
        const popDistance = 80;
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
        
        // 300ms 后开始旋转
        setTimeout(() => {
            rice.animPhase = 'spinning';
            brewing.animPhase = 'spinning';
            rice.spinStart = performance.now();
            brewing.spinStart = performance.now();
            
            // 旋转结束后（800ms）冲刺
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
            }, 800);
        }, 350);
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
        // 背景荧光蓝渐变 - 然后再变回黑色
        this.blueWashPhase = 'fadeIn';
        this.cyanOverlayAlpha = 0;
        
        // 1秒后开始消退
        setTimeout(() => {
            this.blueWashPhase = 'fadeOut';
            
            // 再过1秒后进入拼字
            setTimeout(() => {
                this.setState('gatherToText');
            }, 1000);
        }, 1000);
    }
    
    initGatherToText() {
        // 隐藏门和物品栏
        if (this.doorEl) {
            this.doorEl.style.transition = 'opacity 0.8s ease';
            this.doorEl.style.opacity = '0';
        }
        if (this.inventoryEl) {
            this.inventoryEl.style.transition = 'opacity 0.8s ease';
            this.inventoryEl.style.opacity = '0';
        }
        
        // 重新生成文字点阵（确保坐标正确）
        this.generateTextDots();
        
        // 等待一帧确保点阵生成完成
        setTimeout(() => {
            const needed = this.textDotTargets.length;
            
            // 如果没有足够点阵，创建简单的备用文字
            if (needed < 50) {
                console.warn('点阵数量不足，使用备用方案');
                this.createFallbackTextDots();
            }
            
            // 确保有足够粒子
            while (this.particles.length < needed) {
                // 从屏幕边缘随机位置生成新粒子
                const p = {
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    vx: 0,
                    vy: 0,
                    size: this.config.particleBaseSize,
                    alpha: 0.3,
                    targetAlpha: null,
                    linkedTo: null,
                    gathering: false,
                    targetX: null,
                    targetY: null,
                    targetSize: null,
                    isTextDot: false,
                    pulseOffset: 0,
                    pulseDecay: 0,
                    pulseAngle: 0
                };
                this.particles.push(p);
            }
            
            // 打乱目标顺序，让粒子随机分配
            const shuffledTargets = [...this.textDotTargets].sort(() => Math.random() - 0.5);
            
            // 断开所有连线
            this.particles.forEach(p => {
                p.linkedTo = null;
            });
            
            // 分配目标
            this.particles.forEach((p, i) => {
                if (i < shuffledTargets.length) {
                    p.targetX = shuffledTargets[i].x;
                    p.targetY = shuffledTargets[i].y;
                    p.targetSize = this.config.textParticleSize;
                    p.isTextDot = true;
                    p.targetAlpha = 0.95;
                    p.gathering = true;
                } else {
                    // 多余粒子淡出
                    p.targetAlpha = 0;
                    p.isTextDot = false;
                    p.gathering = true;
                    // 飞向屏幕外
                    const angle = Math.random() * Math.PI * 2;
                    const dist = Math.max(this.canvas.width, this.canvas.height);
                    p.targetX = this.centerX + Math.cos(angle) * dist;
                    p.targetY = this.centerY + Math.sin(angle) * dist;
                }
            });
            
            console.log(`开始聚合，共 ${this.particles.length} 个粒子，目标 ${shuffledTargets.length} 个`);
            
            // 3秒后显示开始按钮
            setTimeout(() => {
                this.setState('showStartButton');
            }, 3500);
        }, 100);
    }
    
    // 备用方案：用简单的方式生成文字点阵
    createFallbackTextDots() {
        const text = '宝珠奶酪';
        this.textDotTargets = [];
        
        // 每个字的大概位置
        const charWidth = 60;
        const startX = this.centerX - (text.length * charWidth) / 2;
        const y = this.centerY;
        
        // 为每个字生成一些点
        for (let i = 0; i < text.length; i++) {
            const cx = startX + i * charWidth + charWidth / 2;
            // 用圆形分布模拟每个字
            for (let j = 0; j < 25; j++) {
                const angle = Math.random() * Math.PI * 2;
                const r = Math.random() * 25;
                this.textDotTargets.push({
                    x: cx + Math.cos(angle) * r,
                    y: y + Math.sin(angle) * r
                });
            }
        }
        
        console.log(`备用方案生成了 ${this.textDotTargets.length} 个点`);
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
        this.particles.forEach(p => {
            if (p.gathering && p.targetX !== null) {
                // 向目标聚合
                const dx = p.targetX - p.x;
                const dy = p.targetY - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 0.5) {
                    // 使用缓动，越近越慢
                    const speed = Math.max(dist * 0.06, 1);
                    p.x += (dx / dist) * speed;
                    p.y += (dy / dist) * speed;
                }
                
                if (p.targetSize !== null) {
                    p.size += (p.targetSize - p.size) * 0.08;
                }
                if (p.targetAlpha !== null) {
                    p.alpha += (p.targetAlpha - p.alpha) * 0.05;
                }
            } else {
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
        
        // 先画连线（更细更透明）
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 0.5;
        this.particles.forEach(p => {
            if (p.linkedTo && !p.gathering) {
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
            
            ctx.beginPath();
            ctx.arc(p.x + offsetX, p.y + offsetY, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
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
        const itemWidth = 75;
        const itemHeight = 75;
        
        // 计算物品栏中的位置
        const itemIndex = this.items.length;
        const gap = 15;
        const totalWidth = (this.items.length + 1) * itemWidth + this.items.length * gap;
        const startX = this.centerX - totalWidth / 2;
        
        const item = {
            name,
            icon,
            isGolden,
            x: startX + itemIndex * (itemWidth + gap),
            y: this.canvas.height - 100,
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
        const item = {
            name,
            icon,
            x: x - 40,
            y: y - 40,
            width: 80,
            height: 80,
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
            this.draggedItem = clickedItem;
            this.draggedItem.isDragging = true;
            
            const rect = clickedItem.el.getBoundingClientRect();
            this.draggedItem.dragOffsetX = x - rect.left;
            this.draggedItem.dragOffsetY = y - rect.top;
            
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
        
        if (item.el) {
            item.el.classList.remove('dragging');
        }
        
        // 状态判断
        if (this.state === 'waitRicePlaced' && item.name === '糯米') {
            // 检查是否放在合成区域（屏幕中央偏上）
            if (item.y < this.canvas.height - 200) {
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
                
                if (dist < 120) {
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
        
        // 绘制扩散圆（门扩张阶段）
        if (this.expandPhase === 'expanding' && this.state === 'doorExpand') {
            this.expandRadius += 4;
            const maxRadius = Math.max(this.canvas.width, this.canvas.height);
            const alpha = Math.max(0, 1 - this.expandRadius / (maxRadius * 0.3));
            
            // 绘制扩散光环
            this.ctx.beginPath();
            this.ctx.arc(this.centerX, this.centerY, this.expandRadius, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
            
            // 内部填充渐变
            if (this.expandRadius < 150) {
                const gradient = this.ctx.createRadialGradient(
                    this.centerX, this.centerY, 0,
                    this.centerX, this.centerY, this.expandRadius
                );
                gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.3})`);
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                this.ctx.fillStyle = gradient;
                this.ctx.fill();
            }
        }
        
        // 荧光蓝覆层（献上后的效果）
        if (this.state === 'blueWash') {
            if (this.blueWashPhase === 'fadeIn') {
                this.cyanOverlayAlpha = Math.min(this.cyanOverlayAlpha + 0.015, 0.25);
            } else if (this.blueWashPhase === 'fadeOut') {
                this.cyanOverlayAlpha = Math.max(this.cyanOverlayAlpha - 0.01, 0);
            }
            
            if (this.cyanOverlayAlpha > 0) {
                this.ctx.fillStyle = `rgba(0, 180, 220, ${this.cyanOverlayAlpha})`;
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }
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
                const progress = Math.min(elapsed / 800, 1);
                const eased = this.easeInOutCubic(progress);
                item.spinAngle = eased * Math.PI * 6; // 3圈
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
    
    // ==================== 辅助方法 ====================
    
    showNarrative(text) {
        if (this.narrativeEl) {
            this.narrativeEl.textContent = text;
            this.narrativeEl.classList.add('visible');
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
