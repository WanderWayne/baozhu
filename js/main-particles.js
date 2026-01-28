// 主界面粒子系统 V2 - 成长型发酵世界
// 基于 docs/baozhu-style-guide.md 和 growth-system.js
// ================================================

class MainParticleSystem {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.textDotTargets = [];
        this.lastTime = 0;
        
        // 发酵系统粒子
        this.bubbles = [];
        this.goldenDust = [];
        this.warmGlows = [];
        this.textureParticles = []; // 蔓延纹理粒子
        
        // V2 色彩（来自成长系统）
        this.colors = {
            milkFoam: { r: 255, g: 253, b: 247 },
            yeastBeige: { r: 245, g: 240, b: 230 },
            riceWineGold: { r: 232, g: 200, b: 115 },
            dawnGold: { r: 240, g: 217, b: 160 },
            dawnPink: { r: 245, g: 230, b: 224 },
            oldWood: { r: 107, g: 83, b: 68 },
            caramelBrown: { r: 166, g: 124, b: 82 }
        };
        
        // 配置
        this.config = {
            textParticleSize: 8,
        };

        // 小屏适配
        this.isSmallScreen = window.innerWidth <= 450 && window.innerHeight <= 950;
        if (this.isSmallScreen) {
            this.config.textParticleSize = 6;
        }
        
        this.spawnTimers = { bubble: 0, dust: 0 };
        
        this.init();
    }
    
    init() {
        this.canvas = document.getElementById('main-canvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        this.loadTextDots();
        this.createTextParticles();
        this.initFermentationSystem();
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
    
    // ==================== 成长系统集成 ====================
    
    getGrowthParams() {
        if (window.GrowthSystem) {
            return {
                factor: window.GrowthSystem.getGrowthFactor(),
                bgColor: window.GrowthSystem.getBackgroundColor(),
                textColor: window.GrowthSystem.getTextColor(),
                glowColor: window.GrowthSystem.getGlowColor(),
                glowIntensity: window.GrowthSystem.getTextGlowIntensity(),
                textureSpread: window.GrowthSystem.getTextureSpread(),
                bubbleParams: window.GrowthSystem.getBubbleParams(),
                dustParams: window.GrowthSystem.getDustParams(),
                glowParams: window.GrowthSystem.getGlowParams(),
                showHint: window.GrowthSystem.shouldShowGrowthHint()
            };
        }
        // 默认初始状态
        return {
            factor: 0,
            bgColor: this.colors.dawnPink,
            textColor: this.colors.oldWood,
            glowColor: this.colors.riceWineGold,
            glowIntensity: 0.05,
            textureSpread: 0.05,
            bubbleParams: { count: 8, goldRatio: 0.1, minSize: 2, maxSize: 8, minAlpha: 0.1, maxAlpha: 0.3, minSpeed: 0.2, maxSpeed: 0.5 },
            dustParams: { count: 20, minAlpha: 0.01, maxAlpha: 0.04 },
            glowParams: { count: 2, minAlpha: 0.01, maxAlpha: 0.02 },
            showHint: true
        };
    }
    
    // ==================== 文字点阵系统 ====================
    
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
        
        const totalWidth = 2 * charWidth + charGap;
        const totalHeight = 2 * charHeight + charGap;
        const startX = this.centerX - totalWidth / 2;
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
    
    createTextParticles() {
        this.particles = [];
        
        this.textDotTargets.forEach(target => {
            this.particles.push({
                x: target.x + (Math.random() - 0.5) * 200,
                y: target.y + (Math.random() - 0.5) * 200,
                targetX: target.x,
                targetY: target.y,
                size: this.config.textParticleSize,
                alpha: 1,
                targetAlpha: 1,
                isTextDot: true,
                gathering: true,
                settled: false,
                breathPhase: Math.random() * Math.PI * 2,
                breathSpeed: 0.5 + Math.random() * 0.5,
            });
        });
    }
    
    reassignParticles() {
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
    
    // ==================== 发酵系统初始化 ====================
    
    initFermentationSystem() {
        const params = this.getGrowthParams();
        
        // 初始化气泡
        this.bubbles = [];
        for (let i = 0; i < params.bubbleParams.count; i++) {
            const bubble = this.createBubble(params.bubbleParams);
            bubble.y = Math.random() * this.canvas.height;
            this.bubbles.push(bubble);
        }
        
        // 初始化金色微尘
        this.goldenDust = [];
        for (let i = 0; i < params.dustParams.count; i++) {
            this.goldenDust.push(this.createDust(params.dustParams));
        }
        
        // 初始化温暖光斑
        this.warmGlows = [];
        for (let i = 0; i < params.glowParams.count; i++) {
            this.warmGlows.push(this.createGlow(params.glowParams));
        }
        
        // 初始化蔓延纹理粒子
        this.initTextureParticles(params.textureSpread);
    }
    
    // ==================== 发酵气泡 ====================
    
    createBubble(params) {
        const isGold = Math.random() < params.goldRatio;
        const color = isGold ? this.colors.riceWineGold : this.colors.milkFoam;
        
        return {
            x: Math.random() * this.canvas.width,
            y: this.canvas.height + 30,
            size: params.minSize + Math.random() * (params.maxSize - params.minSize),
            speed: params.minSpeed + Math.random() * (params.maxSpeed - params.minSpeed),
            wobblePhase: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.008 + Math.random() * 0.015,
            wobbleAmount: 0.3 + Math.random() * 0.6,
            alpha: params.minAlpha + Math.random() * (params.maxAlpha - params.minAlpha),
            color: color
        };
    }
    
    updateBubbles(dt, params) {
        // 生成新气泡
        this.spawnTimers.bubble += dt;
        if (this.spawnTimers.bubble > 1000 && this.bubbles.length < params.count) {
            this.bubbles.push(this.createBubble(params));
            this.spawnTimers.bubble = 0;
        }
        
        this.bubbles.forEach(b => {
            b.y -= b.speed;
            b.wobblePhase += b.wobbleSpeed;
            b.x += Math.sin(b.wobblePhase) * b.wobbleAmount;
            
            if (b.y < 80) {
                b.alpha *= 0.97;
            }
        });
        
        this.bubbles = this.bubbles.filter(b => b.y > -30 && b.alpha > 0.02);
    }
    
    drawBubbles() {
        this.bubbles.forEach(b => {
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${b.color.r}, ${b.color.g}, ${b.color.b}, ${b.alpha})`;
            this.ctx.fill();
            
            // 气泡边缘
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${b.alpha * 0.3})`;
            this.ctx.lineWidth = 0.5;
            this.ctx.stroke();
            
            // 高光
            if (b.size > 4) {
                this.ctx.beginPath();
                this.ctx.arc(b.x - b.size * 0.3, b.y - b.size * 0.3, b.size * 0.2, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 255, 255, ${b.alpha * 0.5})`;
                this.ctx.fill();
            }
        });
    }
    
    // ==================== 金色微尘 ====================
    
    createDust(params) {
        const color = Math.random() > 0.3 ? this.colors.riceWineGold : this.colors.dawnGold;
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            size: 0.5 + Math.random() * 2,
            alpha: params.minAlpha + Math.random() * (params.maxAlpha - params.minAlpha),
            vx: (Math.random() - 0.5) * 0.08,
            vy: (Math.random() - 0.5) * 0.05 - 0.02,
            breathPhase: Math.random() * Math.PI * 2,
            breathSpeed: 0.003 + Math.random() * 0.006,
            color: color
        };
    }
    
    updateDust() {
        this.goldenDust.forEach(d => {
            d.x += d.vx;
            d.y += d.vy;
            d.breathPhase += d.breathSpeed;
            
            if (d.x < -20) d.x = this.canvas.width + 20;
            if (d.x > this.canvas.width + 20) d.x = -20;
            if (d.y < -20) d.y = this.canvas.height + 20;
            if (d.y > this.canvas.height + 20) d.y = -20;
        });
    }
    
    drawDust() {
        this.goldenDust.forEach(d => {
            const breathAlpha = d.alpha * (0.6 + Math.sin(d.breathPhase) * 0.4);
            this.ctx.beginPath();
            this.ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${d.color.r}, ${d.color.g}, ${d.color.b}, ${breathAlpha})`;
            this.ctx.fill();
        });
    }
    
    // ==================== 温暖光斑 ====================
    
    createGlow(params) {
        const colors = [this.colors.riceWineGold, this.colors.dawnPink, this.colors.dawnGold];
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            size: 100 + Math.random() * 150,
            alpha: params.minAlpha + Math.random() * (params.maxAlpha - params.minAlpha),
            vx: (Math.random() - 0.5) * 0.03,
            vy: (Math.random() - 0.5) * 0.02,
            breathPhase: Math.random() * Math.PI * 2,
            breathSpeed: 0.001 + Math.random() * 0.002,
            color: colors[Math.floor(Math.random() * colors.length)]
        };
    }
    
    updateGlows() {
        this.warmGlows.forEach(g => {
            g.x += g.vx;
            g.y += g.vy;
            g.breathPhase += g.breathSpeed;
            
            if (g.x < -g.size / 2 || g.x > this.canvas.width + g.size / 2) g.vx *= -1;
            if (g.y < -g.size / 2 || g.y > this.canvas.height + g.size / 2) g.vy *= -1;
        });
    }
    
    drawGlows() {
        this.warmGlows.forEach(g => {
            const breathAlpha = g.alpha * (0.7 + Math.sin(g.breathPhase) * 0.3);
            const gradient = this.ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.size);
            gradient.addColorStop(0, `rgba(${g.color.r}, ${g.color.g}, ${g.color.b}, ${breathAlpha})`);
            gradient.addColorStop(0.4, `rgba(${g.color.r}, ${g.color.g}, ${g.color.b}, ${breathAlpha * 0.5})`);
            gradient.addColorStop(1, 'transparent');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(g.x - g.size, g.y - g.size, g.size * 2, g.size * 2);
        });
    }
    
    // ==================== 蔓延纹理（核心成长可视化）====================
    
    initTextureParticles(spread) {
        this.textureParticles = [];
        
        // 从屏幕底部中央开始蔓延
        const centerX = this.canvas.width / 2;
        const baseY = this.canvas.height;
        
        // 纹理粒子数量和范围随 spread 增加
        const maxRadius = Math.max(this.canvas.width, this.canvas.height) * spread;
        const particleCount = Math.round(50 + spread * 200);
        
        for (let i = 0; i < particleCount; i++) {
            // 从中心向外分布，越靠近边缘越稀疏
            const angle = Math.random() * Math.PI; // 只在上半圆
            const distance = Math.random() * maxRadius;
            
            // 使用高斯分布让粒子更集中在中心
            const gaussianDistance = distance * Math.pow(Math.random(), 0.7);
            
            const x = centerX + Math.cos(angle - Math.PI / 2) * gaussianDistance * 1.5;
            const y = baseY - Math.sin(angle) * gaussianDistance;
            
            // 只保留屏幕内的粒子
            if (y < 0 || y > this.canvas.height || x < 0 || x > this.canvas.width) continue;
            
            // 透明度随距离增加而降低
            const distanceRatio = gaussianDistance / maxRadius;
            const baseAlpha = 0.03 + (1 - distanceRatio) * 0.08;
            
            this.textureParticles.push({
                x, y,
                size: 2 + Math.random() * 6,
                alpha: baseAlpha * (0.5 + Math.random() * 0.5),
                breathPhase: Math.random() * Math.PI * 2,
                breathSpeed: 0.002 + Math.random() * 0.004,
                color: Math.random() > 0.6 ? this.colors.riceWineGold : this.colors.milkFoam
            });
        }
    }
    
    updateTextureParticles() {
        this.textureParticles.forEach(t => {
            t.breathPhase += t.breathSpeed;
        });
    }
    
    drawTextureParticles() {
        this.textureParticles.forEach(t => {
            const breathAlpha = t.alpha * (0.7 + Math.sin(t.breathPhase) * 0.3);
            this.ctx.beginPath();
            this.ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${t.color.r}, ${t.color.g}, ${t.color.b}, ${breathAlpha})`;
            this.ctx.fill();
        });
    }
    
    // 绘制蔓延纹理的"边界暗示"（初始状态时显示）
    drawGrowthHint(showHint) {
        if (!showHint) return;
        
        // 在蔓延区域边缘画一个极淡的虚线轮廓，暗示"这里会长满"
        const centerX = this.canvas.width / 2;
        const baseY = this.canvas.height;
        const maxRadius = Math.max(this.canvas.width, this.canvas.height) * 0.6;
        
        this.ctx.beginPath();
        this.ctx.ellipse(centerX, baseY, maxRadius * 1.2, maxRadius * 0.8, 0, Math.PI, 0);
        this.ctx.setLineDash([5, 10]);
        this.ctx.strokeStyle = `rgba(${this.colors.riceWineGold.r}, ${this.colors.riceWineGold.g}, ${this.colors.riceWineGold.b}, 0.05)`;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    // ==================== 文字粒子更新与绘制 ====================
    
    updateTextParticles(dt) {
        this.particles.forEach(p => {
            if (!p.isTextDot) return;
            
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
            }
            
            // 呼吸效果
            if (p.settled) {
                p.breathPhase += p.breathSpeed * 0.02;
                const breathScale = 1 + Math.sin(p.breathPhase) * 0.08;
                p.visualSize = p.size * breathScale;
            } else {
                p.visualSize = p.size;
            }
        });
    }
    
    drawTextParticles(params) {
        const textColor = params.textColor;
        const glowColor = params.glowColor;
        const glowIntensity = params.glowIntensity;
        
        this.particles.forEach(p => {
            if (!p.isTextDot) return;
            
            const radius = p.visualSize || p.size;
            
            // 绘制金色光晕（成长标志）
            if (glowIntensity > 0.02) {
                const glowRadius = radius * (2 + glowIntensity * 3);
                const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);
                gradient.addColorStop(0, `rgba(${glowColor.r}, ${glowColor.g}, ${glowColor.b}, ${glowIntensity})`);
                gradient.addColorStop(0.5, `rgba(${glowColor.r}, ${glowColor.g}, ${glowColor.b}, ${glowIntensity * 0.3})`);
                gradient.addColorStop(1, 'transparent');
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(p.x - glowRadius, p.y - glowRadius, glowRadius * 2, glowRadius * 2);
            }
            
            // 绘制文字粒子（老木褐色）
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgb(${textColor.r}, ${textColor.g}, ${textColor.b})`;
            this.ctx.fill();
        });
    }
    
    // ==================== 渲染循环 ====================
    
    animate(time = 0) {
        const dt = time - this.lastTime;
        this.lastTime = time;
        
        const params = this.getGrowthParams();
        
        // 清除画布，保持透明（背景色由 CSS 控制，这样环境层可以透出来）
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 更新主界面背景色（通过 CSS 变量或直接设置）
        const mainScreen = document.getElementById('main-screen');
        if (mainScreen) {
            const bg = params.bgColor;
            mainScreen.style.backgroundColor = `rgb(${bg.r}, ${bg.g}, ${bg.b})`;
        }
        
        // 更新发酵系统
        this.updateGlows();
        this.updateDust();
        this.updateBubbles(dt, params.bubbleParams);
        this.updateTextureParticles();
        
        // 绘制顺序：最底层到最上层
        // 1. 温暖光斑
        this.drawGlows();
        
        // 2. 蔓延纹理
        this.drawTextureParticles();
        
        // 3. 成长暗示（初始状态）
        this.drawGrowthHint(params.showHint);
        
        // 4. 金色微尘
        this.drawDust();
        
        // 5. 发酵气泡
        this.drawBubbles();
        
        // 6. 文字粒子（带光晕）
        this.updateTextParticles(dt);
        this.drawTextParticles(params);
        
        requestAnimationFrame(this.animate.bind(this));
    }
}

// 导出到全局
window.MainParticleSystem = MainParticleSystem;
