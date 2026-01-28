// 环境氛围系统 (独立模块，可复用)
// ================================================

class AmbienceSystem {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.canvas = null;
        this.ctx = null;
        this.isActive = false;
        
        // 元素集合
        this.warmGlows = [];
        this.fermentBubbles = [];
        this.goldenDust = [];
        this.mistLayers = [];
        this.lightBeams = [];
        this.decorElements = [];
        this.heavyMist = null;
    }
    
    init() {
        if (!this.container) {
            console.warn(`AmbienceSystem: Container #${this.containerId} not found`);
            return;
        }
        
        // 创建画布
        this.createCanvas();
        
        // 初始化元素
        this.createWarmGlows();
        this.createFermentBubbles();
        this.createGoldenDust();
        this.createMistLayers();
        this.createLightBeams();
        this.createDecorElements();
        this.createHeavyMist();
        
        // 开始动画
        this.isActive = true;
        this.animate();
        
        // 监听调整大小
        window.addEventListener('resize', this.onResize.bind(this));
    }
    
    createCanvas() {
        // 检查是否存在
        const existing = this.container.querySelector('.ambience-canvas');
        if (existing) {
            console.log('[AmbienceSystem] 已存在，跳过创建');
            this.canvas = existing;
            this.ctx = this.canvas.getContext('2d');
            this.resize();
            return;
        }
        
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'ambience-canvas';
        this.canvas.id = 'ambience-canvas-' + this.containerId;
        this.canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 2;
            pointer-events: none;
        `;
        
        // 插入到最底层（在其他内容之前）
        const firstChild = this.container.firstChild;
        if (firstChild) {
            this.container.insertBefore(this.canvas, firstChild);
        } else {
            this.container.appendChild(this.canvas);
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        
        console.log(`[AmbienceSystem] Canvas 已创建: ${this.canvas.id}, 尺寸: ${this.canvas.width}x${this.canvas.height}`);
    }
    
    onResize() {
        if (this.canvas) {
            this.resize();
            // 重置位置依赖屏幕尺寸的元素
            this.decorElements = [];
            this.createDecorElements();
            this.createHeavyMist();
        }
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    // ==================== 绘图辅助 ====================
    
    drawPath(pathData) {
        const p = new Path2D(pathData);
        this.ctx.stroke(p);
    }
    
    fillPath(pathData) {
        const p = new Path2D(pathData);
        this.ctx.fill(p);
    }
    
    fillEllipse(x, y, rx, ry, rotation) {
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    // ==================== 元素创建 ====================
    
    createWarmGlows() {
        const colors = [
            { r: 245, g: 230, b: 224 },
            { r: 240, g: 217, b: 160 },
            { r: 232, g: 200, b: 115 },
        ];
        this.warmGlows = [];
        for (let i = 0; i < 5; i++) {
            this.warmGlows.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: 150 + Math.random() * 200,
                alpha: 0.08 + Math.random() * 0.12,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.2,
                breathPhase: Math.random() * Math.PI * 2,
                breathSpeed: 0.003 + Math.random() * 0.005,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }
    }
    
    createFermentBubbles() {
        this.fermentBubbles = [];
        for (let i = 0; i < 25; i++) {
            this.fermentBubbles.push(this.createBubble());
        }
    }
    
    createBubble() {
        return {
            x: Math.random() * this.canvas.width,
            y: this.canvas.height + Math.random() * 100,
            size: 2 + Math.random() * 6,
            speed: 0.2 + Math.random() * 0.4,
            wobblePhase: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.02 + Math.random() * 0.03,
            wobbleAmount: 0.5 + Math.random() * 1.5,
            alpha: 0.2 + Math.random() * 0.3,
            isGold: Math.random() < 0.4
        };
    }
    
    createGoldenDust() {
        this.goldenDust = [];
        for (let i = 0; i < 80; i++) {
            this.goldenDust.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: 0.5 + Math.random() * 2,
                alpha: 0.1 + Math.random() * 0.3,
                vx: (Math.random() - 0.5) * 0.2,
                vy: -0.05 - Math.random() * 0.1,
                breathPhase: Math.random() * Math.PI * 2,
                breathSpeed: 0.01 + Math.random() * 0.02,
                isGold: Math.random() > 0.3
            });
        }
    }
    
    createMistLayers() {
        this.mistLayers = [];
        for (let i = 0; i < 5; i++) {
            this.mistLayers.push({
                y: this.canvas.height - 40 - i * 45,
                height: 60 + Math.random() * 50,
                alpha: 0.1 + i * 0.02,
                offset: Math.random() * 1000,
                speed: 0.3 + Math.random() * 0.4,
                waveFreq: 0.004 + Math.random() * 0.003
            });
        }
    }
    
    createLightBeams() {
        this.lightBeams = [];
        for (let i = 0; i < 3; i++) {
            this.lightBeams.push({
                startX: this.canvas.width * (0.55 + i * 0.2),
                startY: -50,
                angle: Math.PI * 0.65 + (Math.random() - 0.5) * 0.1,
                width: 40 + Math.random() * 60,
                length: this.canvas.height * 1.3,
                alpha: 0.08 + Math.random() * 0.1,
                breathPhase: Math.random() * Math.PI * 2,
                breathSpeed: 0.003 + Math.random() * 0.004
            });
        }
    }
    
    createHeavyMist() {
        // 轻薄的雾，稍微遮住稻穗根部
        this.heavyMist = {
            y: this.canvas.height - 120, // 高度减小
            height: 120,
            offset: 0,
            speed: 0.15
        };
    }
    
    createDecorElements() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        this.decorElements = [];
        
        // 1. 稻穗 (Back) - 位置更靠下，给按钮留空间
        const wheatTypes = ['wheat1', 'wheat2', 'wheat3'];
        const gap = 12;
        const totalWheat = Math.ceil(w / gap) + 10;
        
        for (let i = -5; i < totalWheat; i++) {
            const xPos = i * gap + (Math.random() - 0.5) * 20;
            const yPos = h * 0.75 + (Math.random() - 0.5) * 60; // 从0.55改为0.75，更靠下
            
            this.decorElements.push({
                layer: 'back',
                type: wheatTypes[Math.floor(Math.random() * wheatTypes.length)],
                x: xPos,
                y: yPos,
                width: 70 * (0.6 + Math.random() * 0.7),
                height: 220 * (0.6 + Math.random() * 0.7),
                alpha: 0.25 + Math.random() * 0.35,
                rotation: (Math.random() - 0.5) * 0.2,
                breathPhase: Math.random() * Math.PI * 2,
                breathSpeed: 0.002 + Math.random() * 0.003
            });
        }
        
        // 坛子和碗暂时移除
    }
    
    // ==================== 更新逻辑 ====================
    
    update() {
        // Warm Glows
        this.warmGlows.forEach(g => {
            g.x += g.vx; g.y += g.vy; g.breathPhase += g.breathSpeed;
            if (g.x < -g.size || g.x > this.canvas.width + g.size) g.vx *= -1;
            if (g.y < -g.size || g.y > this.canvas.height + g.size) g.vy *= -1;
        });
        
        // Ferment Bubbles
        this.fermentBubbles.forEach(b => {
            b.y -= b.speed; b.wobblePhase += b.wobbleSpeed;
            b.x += Math.sin(b.wobblePhase) * b.wobbleAmount;
            if (b.y < 100) b.alpha *= 0.98;
            if (b.y < -20 || b.alpha < 0.01) Object.assign(b, this.createBubble());
        });
        
        // Golden Dust
        this.goldenDust.forEach(d => {
            d.x += d.vx; d.y += d.vy; d.breathPhase += d.breathSpeed;
            if (d.x < -10) d.x = this.canvas.width + 10;
            if (d.x > this.canvas.width + 10) d.x = -10;
            if (d.y < -10) d.y = this.canvas.height + 10;
        });
        
        // Mist Layers
        this.mistLayers.forEach(m => { m.offset += m.speed; });
        
        // Heavy Mist
        if (this.heavyMist) this.heavyMist.offset += this.heavyMist.speed;
        
        // Light Beams
        this.lightBeams.forEach(b => { b.breathPhase += b.breathSpeed; });
        
        // Decor Elements
        this.decorElements.forEach(d => { d.breathPhase += d.breathSpeed; });
    }
    
    // ==================== 绘制逻辑 ====================
    
    animate() {
        if (!this.isActive || !this.ctx) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.update();
        
        this.drawWarmGlows();
        this.drawLightBeams();
        this.drawMistLayers();
        this.drawDecorElements('back');
        this.drawHeavyMist();
        this.drawDecorElements('front');
        this.drawGoldenDust();
        this.drawFermentBubbles();
        
        requestAnimationFrame(this.animate.bind(this));
    }
    
    drawWarmGlows() {
        this.warmGlows.forEach(g => {
            const alpha = g.alpha * (0.7 + Math.sin(g.breathPhase) * 0.3);
            const grad = this.ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.size);
            grad.addColorStop(0, `rgba(${g.color.r}, ${g.color.g}, ${g.color.b}, ${alpha})`);
            grad.addColorStop(0.6, `rgba(${g.color.r}, ${g.color.g}, ${g.color.b}, ${alpha * 0.3})`);
            grad.addColorStop(1, 'transparent');
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(g.x - g.size, g.y - g.size, g.size * 2, g.size * 2);
        });
    }
    
    drawFermentBubbles() {
        this.fermentBubbles.forEach(b => {
            const color = b.isGold ? '232, 200, 115' : '255, 253, 247';
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${color}, ${b.alpha})`;
            this.ctx.fill();
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${b.alpha * 0.6})`;
            this.ctx.lineWidth = 0.5;
            this.ctx.stroke();
        });
    }
    
    drawGoldenDust() {
        this.goldenDust.forEach(d => {
            const alpha = d.alpha * (0.6 + Math.sin(d.breathPhase) * 0.4);
            const color = d.isGold ? '232, 200, 115' : '240, 217, 160';
            this.ctx.beginPath();
            this.ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${color}, ${alpha})`;
            this.ctx.fill();
        });
    }
    
    drawMistLayers() {
        this.mistLayers.forEach(m => {
            const grad = this.ctx.createLinearGradient(0, m.y, 0, m.y + m.height);
            grad.addColorStop(0, 'transparent');
            grad.addColorStop(0.4, `rgba(255, 253, 247, ${m.alpha})`);
            grad.addColorStop(0.8, `rgba(255, 253, 247, ${m.alpha * 0.6})`);
            grad.addColorStop(1, 'transparent');
            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.moveTo(0, m.y + m.height);
            for (let x = 0; x <= this.canvas.width; x += 20) {
                const wave = Math.sin((x + m.offset) * m.waveFreq) * 18;
                this.ctx.lineTo(x, m.y + wave);
            }
            this.ctx.lineTo(this.canvas.width, m.y + m.height);
            this.ctx.closePath();
            this.ctx.fill();
        });
    }
    
    drawHeavyMist() {
        const m = this.heavyMist;
        const grad = this.ctx.createLinearGradient(0, m.y, 0, m.y + m.height);
        grad.addColorStop(0, 'rgba(245, 230, 224, 0)');
        grad.addColorStop(0.5, 'rgba(245, 230, 224, 0.4)');
        grad.addColorStop(1, 'rgba(245, 230, 224, 0.6)');
        
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.moveTo(0, m.y + m.height);
        for (let x = 0; x <= this.canvas.width; x += 30) {
            const wave = Math.sin((x + m.offset) * 0.005) * 15 + Math.sin((x + m.offset * 1.5) * 0.01) * 8;
            this.ctx.lineTo(x, m.y + wave);
        }
        this.ctx.lineTo(this.canvas.width, m.y + m.height);
        this.ctx.lineTo(0, m.y + m.height);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawLightBeams() {
        this.lightBeams.forEach(b => {
            const alpha = b.alpha * (0.6 + Math.sin(b.breathPhase) * 0.4);
            const endX = b.startX + Math.cos(b.angle) * b.length;
            const endY = b.startY + Math.sin(b.angle) * b.length;
            const grad = this.ctx.createLinearGradient(b.startX, b.startY, endX, endY);
            grad.addColorStop(0, `rgba(255, 248, 230, ${alpha * 0.6})`);
            grad.addColorStop(0.3, `rgba(255, 248, 230, ${alpha})`);
            grad.addColorStop(0.7, `rgba(255, 248, 230, ${alpha * 0.8})`);
            grad.addColorStop(1, 'transparent');
            
            this.ctx.save();
            this.ctx.translate(b.startX, b.startY);
            this.ctx.rotate(b.angle);
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(-b.width / 2, 0, b.width, b.length);
            this.ctx.restore();
        });
    }
    
    drawDecorElements(layer) {
        const color = '#6B5344';
        
        this.decorElements.forEach(el => {
            if (el.layer !== layer) return;
            
            const alpha = el.alpha * (0.9 + Math.sin(el.breathPhase) * 0.1);
            
            this.ctx.save();
            this.ctx.translate(el.x, el.y);
            
            let scaleX = el.width / (el.type.includes('wheat') ? 60 : el.type === 'jar' ? 100 : 100);
            let scaleY = el.height / (el.type.includes('wheat') ? 200 : el.type === 'jar' ? 140 : 60);
            
            if (el.rotation) {
                this.ctx.translate(el.width/2, el.height/2);
                this.ctx.rotate(el.rotation);
                this.ctx.translate(-el.width/2, -el.height/2);
            }
            
            this.ctx.scale(scaleX, scaleY);
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = color;
            this.ctx.strokeStyle = color;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            
            if (el.type === 'jar') {
                // 坛子完全不透明
                this.ctx.globalAlpha = 1;
                this.ctx.fillStyle = "#6B5344"; // 老木褐
                this.fillPath("M25 25 Q25 15 35 12 L65 12 Q75 15 75 25 L78 40 Q85 50 85 75 Q85 125 50 135 Q15 125 15 75 Q15 50 22 40 Z");
                this.ctx.fillStyle = "#5D4037"; // 坛口深色
                this.fillPath("M30 18 A20 6 0 0 1 70 18 A20 6 0 0 1 30 18");
                this.ctx.fillStyle = "#4E342E"; // 坛口内部更深
                this.fillPath("M32 16 A18 5 0 0 1 68 16 A18 5 0 0 1 32 16");
                // 装饰高光
                this.ctx.lineWidth = 3; 
                this.ctx.strokeStyle = "rgba(200, 180, 160, 0.4)";
                this.drawPath("M30 60 Q28 90 35 110");
            } 
            else if (el.type === 'bowl') {
                this.ctx.lineWidth = 3; this.drawPath("M10 15 Q10 55 50 55 Q90 55 90 15");
                this.ctx.lineWidth = 2; this.drawPath("M10 15 A40 8 0 0 1 90 15 A40 8 0 0 1 10 15");
                this.ctx.globalAlpha *= 0.6; this.fillPath("M35 52 A15 3 0 0 1 65 52 A15 3 0 0 1 35 52");
            }
            else if (el.type === 'wheat1') {
                this.ctx.lineWidth = 3; this.drawPath("M30 200 Q30 150 35 100 Q40 60 20 20");
                this.ctx.globalAlpha *= 0.8;
                this.fillEllipse(22, 25, 4, 8, -0.35);
                this.fillEllipse(20, 38, 4, 7, -0.44);
                this.fillEllipse(23, 50, 3, 6, -0.26);
                this.ctx.lineWidth = 2; this.ctx.globalAlpha *= 0.8;
                this.drawPath("M32 80 Q45 70 55 75");
            }
            else if (el.type === 'wheat2') {
                this.ctx.lineWidth = 3; this.drawPath("M30 200 Q28 120 30 20");
                this.ctx.globalAlpha *= 0.8;
                this.fillEllipse(26, 25, 4, 8, -0.09);
                this.fillEllipse(34, 35, 4, 7, 0.09);
                this.fillEllipse(26, 45, 3, 6, -0.09);
                this.fillEllipse(34, 55, 3, 6, 0.09);
                this.ctx.lineWidth = 2; this.ctx.globalAlpha *= 0.8;
                this.drawPath("M30 140 Q10 130 5 135");
                this.drawPath("M30 100 Q50 90 55 95");
            }
            else if (el.type === 'wheat3') {
                this.ctx.lineWidth = 3; this.drawPath("M25 200 Q25 140 30 90 Q35 50 50 20");
                this.ctx.globalAlpha *= 0.8;
                this.fillEllipse(48, 25, 4, 8, 0.35);
                this.fillEllipse(45, 38, 3, 7, 0.26);
                this.ctx.lineWidth = 2; this.ctx.globalAlpha *= 0.8;
                this.drawPath("M28 120 Q10 110 5 115");
            }
            
            this.ctx.restore();
        });
    }
}

// 导出
window.AmbienceSystem = AmbienceSystem;

// 辅助函数：给 IntroSystem 添加 showAmbienceLayers 方法
function addAmbienceToIntroSystem() {
    if (window.IntroSystem && !window.IntroSystem.prototype.showAmbienceLayers) {
        window.IntroSystem.prototype.showAmbienceLayers = function() {
            if (!this.ambience) {
                this.ambience = new AmbienceSystem('intro-screen');
                this.ambience.init();
            }
        };
        console.log('[AmbienceSystem] showAmbienceLayers 已添加到 IntroSystem');
    }
}

// 立即尝试添加
addAmbienceToIntroSystem();

// 如果 IntroSystem 还不存在，等 DOM 加载后再试
if (!window.IntroSystem) {
    document.addEventListener('DOMContentLoaded', addAmbienceToIntroSystem);
}

// 提供一个全局函数供主界面使用
window.initMainScreenAmbience = function() {
    const mainScreen = document.getElementById('main-screen');
    if (!mainScreen) return;
    
    // 检查是否已存在
    const existing = mainScreen.querySelector('.ambience-canvas');
    if (existing) return;
    
    const ambience = new AmbienceSystem('main-screen');
    ambience.init();
    console.log('[AmbienceSystem] 主界面环境层已初始化');
};
