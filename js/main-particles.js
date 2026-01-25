// 主界面粒子系统 - 复用开场动画的点阵拼字效果
// ================================================

class MainParticleSystem {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.textDotTargets = [];
        this.lastTime = 0;
        
        // 配置
        this.config = {
            particleBaseSize: 1.5,
            particleMaxSize: 2.5,
            textParticleSize: 8,
            particleAlpha: 0.4,
            ambientParticles: 80, // 环境粒子
        };

        // 小屏适配
        this.isSmallScreen = window.innerWidth <= 450 && window.innerHeight <= 950;
        if (this.isSmallScreen) {
            this.config.ambientParticles = 50;
            this.config.textParticleSize = 6;
        }
        
        this.init();
    }
    
    init() {
        this.canvas = document.getElementById('main-canvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        this.loadTextDots();
        this.createParticles();
        this.animate();
        
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.loadTextDots();
            this.reassignParticles();
        });
    }
    
    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
    }
    
    // 手动定义点阵数据 - "宝珠奶酪" 四个字
    loadTextDots() {
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
        const dotSize = this.isSmallScreen ? 8 : 12;
        const charGap = this.isSmallScreen ? 15 : 30;
        const gridSize = 10;
        
        const charWidth = gridSize * dotSize;
        const charHeight = gridSize * dotSize;
        
        // 2x2 排列，放在屏幕上半部分
        const totalWidth = 2 * charWidth + charGap;
        const totalHeight = 2 * charHeight + charGap;
        const startX = this.centerX - totalWidth / 2;
        // 放在屏幕上半部分（约 30% 位置为中心）
        const displayCenterY = this.canvas.height * 0.28;
        const startY = displayCenterY - totalHeight / 2;
        
        this.textDotTargets = [];
        
        chars.forEach((char, index) => {
            const matrix = matrices[char];
            if (!matrix) return;
            
            const rowIdx = Math.floor(index / 2);
            const colIdx = index % 2;
            
            const charOffsetX = startX + colIdx * (charWidth + charGap);
            const charOffsetY = startY + rowIdx * (charHeight + charGap);
            
            for (let row = 0; row < matrix.length; row++) {
                for (let col = 0; col < matrix[row].length; col++) {
                    const val = matrix[row][col];
                    if (val === 0) continue;
                    
                    let x = charOffsetX + col * dotSize;
                    let y = charOffsetY + row * dotSize;
                    
                    if (val === 2) x += dotSize / 2;
                    else if (val === 3) y += dotSize / 2;
                    else if (val === 4) { x += dotSize / 2; y += dotSize / 2; }
                    
                    this.textDotTargets.push({ x, y });
                }
            }
        });
    }
    
    createParticles() {
        this.particles = [];
        
        // 创建文字粒子 - 全部使用白色，完全可见（透明度0% = 不透明）
        this.textDotTargets.forEach(target => {
            this.particles.push({
                x: target.x + (Math.random() - 0.5) * 200,
                y: target.y + (Math.random() - 0.5) * 200,
                targetX: target.x,
                targetY: target.y,
                size: this.config.textParticleSize,
                alpha: 1, // 完全可见
                targetAlpha: 1,
                isTextDot: true,
                isCyan: false, // 白色粒子
                gathering: true,
                settled: false,
                // 呼吸效果参数
                breathPhase: Math.random() * Math.PI * 2,
                breathSpeed: 0.5 + Math.random() * 0.5,
            });
        });
        
        // 创建环境粒子（背景漂浮）
        for (let i = 0; i < this.config.ambientParticles; i++) {
            const isCyan = Math.random() < 0.3;
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                size: this.config.particleBaseSize + Math.random() * (this.config.particleMaxSize - this.config.particleBaseSize),
                alpha: (this.config.particleAlpha + Math.random() * 0.15) * 0.6,
                isTextDot: false,
                isCyan: isCyan,
                homeX: Math.random() * this.canvas.width,
                homeY: Math.random() * this.canvas.height,
                wanderAngle: Math.random() * Math.PI * 2,
                wanderRadius: 15 + Math.random() * 25,
            });
        }
    }
    
    reassignParticles() {
        // 窗口大小变化时重新分配文字粒子目标
        const textParticles = this.particles.filter(p => p.isTextDot);
        textParticles.forEach((p, i) => {
            if (i < this.textDotTargets.length) {
                p.targetX = this.textDotTargets[i].x;
                p.targetY = this.textDotTargets[i].y;
                p.gathering = true;
                p.settled = false;
            }
        });
    }
    
    updateParticles(dt) {
        this.particles.forEach(p => {
            if (p.isTextDot) {
                // 文字粒子聚合
                if (p.gathering && p.targetX !== null) {
                    const dx = p.targetX - p.x;
                    const dy = p.targetY - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist > 1) {
                        const speed = Math.max(dist * 0.05, 1);
                        p.x += (dx / dist) * speed;
                        p.y += (dy / dist) * speed;
                    } else {
                        p.x = p.targetX;
                        p.y = p.targetY;
                        p.settled = true;
                        p.gathering = false;
                    }
                    
                    // 透明度渐变
                    if (p.targetAlpha !== null) {
                        p.alpha += (p.targetAlpha - p.alpha) * 0.05;
                    }
                }
                
                // 呼吸效果（只调整大小，不调整透明度，保持完全不透明）
                if (p.settled) {
                    p.breathPhase += p.breathSpeed * 0.02;
                    const breathScale = 1 + Math.sin(p.breathPhase) * 0.1;
                    p.visualSize = p.size * breathScale;
                    p.visualAlpha = 1; // 完全不透明
                } else {
                    p.visualSize = p.size;
                    p.visualAlpha = 1; // 完全不透明
                }
            } else {
                // 环境粒子漂浮
                p.wanderAngle += (Math.random() - 0.5) * 0.03;
                const targetX = p.homeX + Math.cos(p.wanderAngle) * p.wanderRadius;
                const targetY = p.homeY + Math.sin(p.wanderAngle) * p.wanderRadius;
                p.x += (targetX - p.x) * 0.01;
                p.y += (targetY - p.y) * 0.01;
                
                p.visualSize = p.size;
                p.visualAlpha = p.alpha;
            }
        });
    }
    
    drawParticles() {
        const ctx = this.ctx;
        
        this.particles.forEach(p => {
            const radius = Math.max(0.5, p.visualSize || p.size || 2);
            const alpha = Math.max(0, Math.min(1, p.visualAlpha || p.alpha || 0.5));
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
            
            if (p.isCyan) {
                ctx.fillStyle = `rgba(176, 245, 255, ${alpha})`;
            } else {
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            }
            ctx.fill();
        });
    }
    
    animate(time = 0) {
        const dt = time - this.lastTime;
        this.lastTime = time;
        
        // 清空画布（黑色背景）
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 更新和绘制粒子
        this.updateParticles(dt);
        this.drawParticles();
        
        requestAnimationFrame(this.animate.bind(this));
    }
}

// 导出到全局
window.MainParticleSystem = MainParticleSystem;

