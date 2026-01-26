// 弄堂午后 · 发酵粒子系统 V2
// 基于 docs/baozhu-style-guide.md
// 主题：温暖、生机、慢酿
// ================================================

class FermentationWorld {
    constructor() {
        this.canvas = document.getElementById('bubble-canvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        
        // 粒子容器
        this.bubbles = [];          // 发酵气泡
        this.goldenDust = [];       // 金色微尘（阳光下的灰尘）
        this.warmGlows = [];        // 温暖光斑
        this.driftingSpores = [];   // 漂浮孢子（酵母）
        
        // 配置
        this.config = {
            maxBubbles: 20,
            maxDust: 50,
            maxGlows: 5,
            maxSpores: 25
        };
        
        this.lastTime = 0;
        this.spawnTimers = {
            bubble: 0,
            dust: 0,
            spore: 0
        };
        
        // 颜色定义（来自风格指南）
        this.colors = {
            milkFoam: { r: 255, g: 253, b: 247 },
            yeastBeige: { r: 245, g: 240, b: 230 },
            riceWineGold: { r: 232, g: 200, b: 115 },
            dawnGold: { r: 240, g: 217, b: 160 },
            dawnPink: { r: 245, g: 230, b: 224 },
            caramelBrown: { r: 166, g: 124, b: 82 },
            sunriseOrange: { r: 232, g: 168, b: 124 }
        };
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.init();
        this.animate();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    init() {
        // 初始化金色微尘
        for (let i = 0; i < this.config.maxDust; i++) {
            this.goldenDust.push(this.createGoldenDust());
        }
        
        // 初始化温暖光斑
        for (let i = 0; i < this.config.maxGlows; i++) {
            this.warmGlows.push(this.createWarmGlow());
        }
        
        // 初始化漂浮孢子
        for (let i = 0; i < this.config.maxSpores; i++) {
            this.driftingSpores.push(this.createSpore());
        }
        
        // 初始化一些气泡
        for (let i = 0; i < 8; i++) {
            const bubble = this.createBubble();
            bubble.y = Math.random() * this.canvas.height;
            this.bubbles.push(bubble);
        }
    }
    
    // ==================== 发酵气泡 ====================
    // 像真正的发酵气泡，在粘稠液体中缓慢上升
    
    createBubble() {
        const colorChoice = Math.random();
        let color;
        if (colorChoice < 0.5) {
            color = this.colors.milkFoam;      // 奶白色
        } else if (colorChoice < 0.8) {
            color = this.colors.dawnGold;      // 淡金色
        } else {
            color = this.colors.riceWineGold;  // 米酒金
        }
        
        return {
            x: Math.random() * this.canvas.width,
            y: this.canvas.height + 30,
            size: 3 + Math.random() * 10,
            speed: 0.2 + Math.random() * 0.5,  // 非常缓慢
            wobblePhase: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.008 + Math.random() * 0.015,
            wobbleAmount: 0.3 + Math.random() * 0.6,
            alpha: 0.15 + Math.random() * 0.25,
            color: color
        };
    }
    
    updateBubbles(dt) {
        // 生成新气泡（很慢）
        this.spawnTimers.bubble += dt;
        if (this.spawnTimers.bubble > 1200 && this.bubbles.length < this.config.maxBubbles) {
            this.bubbles.push(this.createBubble());
            this.spawnTimers.bubble = 0;
        }
        
        this.bubbles.forEach(b => {
            b.y -= b.speed;
            b.wobblePhase += b.wobbleSpeed;
            b.x += Math.sin(b.wobblePhase) * b.wobbleAmount;
            
            // 接近顶部时淡出
            if (b.y < 80) {
                b.alpha *= 0.97;
            }
        });
        
        this.bubbles = this.bubbles.filter(b => b.y > -30 && b.alpha > 0.02);
    }
    
    drawBubbles() {
        this.bubbles.forEach(b => {
            // 气泡主体
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${b.color.r}, ${b.color.g}, ${b.color.b}, ${b.alpha})`;
            this.ctx.fill();
            
            // 气泡边缘（稍微亮一点）
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${b.alpha * 0.3})`;
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            
            // 气泡高光
            if (b.size > 5) {
                this.ctx.beginPath();
                this.ctx.arc(b.x - b.size * 0.3, b.y - b.size * 0.3, b.size * 0.2, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 255, 255, ${b.alpha * 0.6})`;
                this.ctx.fill();
            }
        });
    }
    
    // ==================== 金色微尘 ====================
    // 像阳光下的灰尘，在空气中缓慢漂浮
    
    createGoldenDust() {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            size: 0.5 + Math.random() * 2,
            alpha: 0.02 + Math.random() * 0.06,
            vx: (Math.random() - 0.5) * 0.08,
            vy: (Math.random() - 0.5) * 0.05 - 0.02, // 微微向上飘
            breathPhase: Math.random() * Math.PI * 2,
            breathSpeed: 0.003 + Math.random() * 0.006,
            // 金色系
            color: Math.random() > 0.3 
                ? this.colors.riceWineGold 
                : this.colors.dawnGold
        };
    }
    
    updateGoldenDust(dt) {
        this.goldenDust.forEach(d => {
            d.x += d.vx;
            d.y += d.vy;
            d.breathPhase += d.breathSpeed;
            
            // 边界环绕
            if (d.x < -20) d.x = this.canvas.width + 20;
            if (d.x > this.canvas.width + 20) d.x = -20;
            if (d.y < -20) d.y = this.canvas.height + 20;
            if (d.y > this.canvas.height + 20) d.y = -20;
        });
    }
    
    drawGoldenDust() {
        this.goldenDust.forEach(d => {
            const breathAlpha = d.alpha * (0.6 + Math.sin(d.breathPhase) * 0.4);
            
            this.ctx.beginPath();
            this.ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${d.color.r}, ${d.color.g}, ${d.color.b}, ${breathAlpha})`;
            this.ctx.fill();
        });
    }
    
    // ==================== 温暖光斑 ====================
    // 像阳光透过窗户照进来的光斑
    
    createWarmGlow() {
        const colors = [
            this.colors.riceWineGold,
            this.colors.dawnPink,
            this.colors.sunriseOrange,
            this.colors.dawnGold
        ];
        
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            size: 100 + Math.random() * 150,
            alpha: 0.015 + Math.random() * 0.025,
            vx: (Math.random() - 0.5) * 0.03,
            vy: (Math.random() - 0.5) * 0.02,
            breathPhase: Math.random() * Math.PI * 2,
            breathSpeed: 0.001 + Math.random() * 0.002,
            color: colors[Math.floor(Math.random() * colors.length)]
        };
    }
    
    updateWarmGlows(dt) {
        this.warmGlows.forEach(g => {
            g.x += g.vx;
            g.y += g.vy;
            g.breathPhase += g.breathSpeed;
            
            // 边界反弹（柔和）
            if (g.x < -g.size / 2 || g.x > this.canvas.width + g.size / 2) {
                g.vx *= -1;
            }
            if (g.y < -g.size / 2 || g.y > this.canvas.height + g.size / 2) {
                g.vy *= -1;
            }
        });
    }
    
    drawWarmGlows() {
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
    
    // ==================== 漂浮孢子 ====================
    // 像酵母孢子在空气中飘动
    
    createSpore() {
        const colors = [
            this.colors.milkFoam,
            this.colors.yeastBeige,
            this.colors.dawnPink
        ];
        
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            size: 1 + Math.random() * 3,
            alpha: 0.04 + Math.random() * 0.08,
            // 更复杂的运动轨迹
            vx: (Math.random() - 0.5) * 0.12,
            vy: (Math.random() - 0.5) * 0.08,
            wobbleX: Math.random() * Math.PI * 2,
            wobbleY: Math.random() * Math.PI * 2,
            wobbleSpeedX: 0.01 + Math.random() * 0.02,
            wobbleSpeedY: 0.008 + Math.random() * 0.015,
            color: colors[Math.floor(Math.random() * colors.length)]
        };
    }
    
    updateSpores(dt) {
        this.driftingSpores.forEach(s => {
            s.wobbleX += s.wobbleSpeedX;
            s.wobbleY += s.wobbleSpeedY;
            
            s.x += s.vx + Math.sin(s.wobbleX) * 0.3;
            s.y += s.vy + Math.cos(s.wobbleY) * 0.2;
            
            // 边界环绕
            if (s.x < -20) s.x = this.canvas.width + 20;
            if (s.x > this.canvas.width + 20) s.x = -20;
            if (s.y < -20) s.y = this.canvas.height + 20;
            if (s.y > this.canvas.height + 20) s.y = -20;
        });
    }
    
    drawSpores() {
        this.driftingSpores.forEach(s => {
            this.ctx.beginPath();
            this.ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${s.color.r}, ${s.color.g}, ${s.color.b}, ${s.alpha})`;
            this.ctx.fill();
        });
    }
    
    // ==================== 光线条纹 ====================
    // 偶尔的斜光，像阳光从窗户斜照进来
    
    drawLightBeams() {
        const time = this.lastTime * 0.0001;
        
        // 2-3条微妙的光线
        for (let i = 0; i < 2; i++) {
            const offset = i * 0.5;
            const alpha = 0.015 + Math.sin(time + offset) * 0.008;
            
            if (alpha > 0.01) {
                const x1 = this.canvas.width * (0.6 + i * 0.2);
                const y1 = 0;
                const x2 = this.canvas.width * (0.2 + i * 0.15);
                const y2 = this.canvas.height;
                
                const gradient = this.ctx.createLinearGradient(x1, y1, x2, y2);
                gradient.addColorStop(0, `rgba(240, 217, 160, ${alpha})`);
                gradient.addColorStop(0.3, `rgba(240, 217, 160, ${alpha * 1.5})`);
                gradient.addColorStop(0.7, `rgba(240, 217, 160, ${alpha * 1.2})`);
                gradient.addColorStop(1, 'transparent');
                
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.moveTo(x1, y1);
                this.ctx.lineTo(x1 + 80, y1);
                this.ctx.lineTo(x2 + 60, y2);
                this.ctx.lineTo(x2, y2);
                this.ctx.closePath();
                this.ctx.fill();
            }
        }
    }
    
    // ==================== 渲染循环 ====================
    
    animate(time = 0) {
        const dt = time - this.lastTime;
        this.lastTime = time;
        
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制顺序：从远到近
        
        // 1. 温暖光斑（最底层）
        this.updateWarmGlows(dt);
        this.drawWarmGlows();
        
        // 2. 光线条纹
        this.drawLightBeams();
        
        // 3. 金色微尘
        this.updateGoldenDust(dt);
        this.drawGoldenDust();
        
        // 4. 漂浮孢子
        this.updateSpores(dt);
        this.drawSpores();
        
        // 5. 发酵气泡（最上层）
        this.updateBubbles(dt);
        this.drawBubbles();
        
        requestAnimationFrame((t) => this.animate(t));
    }
}

// 页面加载后初始化
document.addEventListener('DOMContentLoaded', () => {
    new FermentationWorld();
});
