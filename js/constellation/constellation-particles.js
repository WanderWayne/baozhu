// 星图章节选择 - 粒子系统
// 受开场粒子启发的金色宇宙背景与星座连线

(function () {
    function ConstellationParticles(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.links = [];
        this.core = null;
        this.time = 0;
        this.config = {
            particleCount: 60,
            baseSize: 1.5,
            maxSize: 2.8,
            baseAlpha: 0.45,
            driftSpeed: 0.08,
            linkedClusterCount: 8,
            linkedClusterSpacing: 40
        };
    }

    ConstellationParticles.prototype.resize = function (width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        if (!this.particles.length) {
            this.initParticles();
        }
        if (!this.core) {
            this.createCore(width, height);
        } else {
            this.core.x = width * 0.5;
            this.core.y = height * 0.42;
        }
    };

    ConstellationParticles.prototype.initParticles = function () {
        this.particles = [];
        this.links = [];

        const w = this.canvas.width;
        const h = this.canvas.height;

        // 背景漂浮金点
        for (let i = 0; i < this.config.particleCount; i++) {
            const x = Math.random() * w;
            const y = Math.random() * h;
            this.particles.push(this.createParticle(x, y, false));
        }

        // 星座簇：2-3粒子相互连线
        for (let i = 0; i < this.config.linkedClusterCount; i++) {
            this.addLinkedCluster();
        }
    };

    ConstellationParticles.prototype.createParticle = function (x, y, isCluster) {
        const size = this.config.baseSize + Math.random() * (this.config.maxSize - this.config.baseSize);
        const alpha = (this.config.baseAlpha + Math.random() * 0.2) * (isCluster ? 1 : 0.7);

        return {
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * this.config.driftSpeed,
            vy: (Math.random() - 0.5) * this.config.driftSpeed,
            size: size,
            alpha: alpha,
            wanderAngle: Math.random() * Math.PI * 2,
            wanderRadius: 10 + Math.random() * 20,
            isCluster: !!isCluster
        };
    };

    ConstellationParticles.prototype.addLinkedCluster = function () {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const centerX = w * 0.5 + (Math.random() - 0.5) * w * 0.6;
        const centerY = h * 0.5 + (Math.random() - 0.5) * h * 0.6;
        const count = 2 + Math.floor(Math.random() * 2); // 2-3个点

        const clusterParticles = [];
        for (let i = 0; i < count; i++) {
            const px = centerX + (Math.random() - 0.5) * this.config.linkedClusterSpacing;
            const py = centerY + (Math.random() - 0.5) * this.config.linkedClusterSpacing;
            const p = this.createParticle(px, py, true);
            p.size = this.config.baseSize + Math.random() * 0.8;
            this.particles.push(p);
            clusterParticles.push(p);
        }

        // 完整连线星座，每点互连
        for (let i = 0; i < clusterParticles.length; i++) {
            for (let j = i + 1; j < clusterParticles.length; j++) {
                this.links.push({
                    a: clusterParticles[i],
                    b: clusterParticles[j]
                });
            }
        }
    };

    ConstellationParticles.prototype.update = function (dt) {
        this.time += dt;
        const w = this.canvas.width;
        const h = this.canvas.height;

        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];

            // 轻微漫游
            p.wanderAngle += (Math.random() - 0.5) * 0.02;
            p.vx += Math.cos(p.wanderAngle) * 0.0006 * p.wanderRadius;
            p.vy += Math.sin(p.wanderAngle) * 0.0006 * p.wanderRadius;

            p.x += p.vx * dt;
            p.y += p.vy * dt;

            // 缓慢回拉到屏幕内
            if (p.x < -50 || p.x > w + 50 || p.y < -50 || p.y > h + 50) {
                p.x = Math.random() * w;
                p.y = Math.random() * h;
            }
        }
    };

    ConstellationParticles.prototype.createCore = function (width, height) {
        this.core = {
            x: width * 0.5,
            y: height * 0.42,
            baseRadius: 12,
            pulseStrength: 0.18
        };
    };

    ConstellationParticles.prototype.drawCore = function () {
        if (!this.core) return;

        const ctx = this.ctx;
        const t = this.time;
        const breath = 1 + this.core.pulseStrength * Math.sin(t * 0.002);
        const alpha = 0.7 + 0.25 * Math.sin(t * 0.002 + Math.PI / 3);

        const radius = this.core.baseRadius * breath;

        // 外圈柔光
        const outerRadius = radius * 5;
        const gOuter = ctx.createRadialGradient(
            this.core.x,
            this.core.y,
            0,
            this.core.x,
            this.core.y,
            outerRadius
        );
        gOuter.addColorStop(0, 'rgba(240, 210, 150,' + (alpha * 0.4).toFixed(3) + ')');
        gOuter.addColorStop(1, 'rgba(15, 10, 5, 0)');

        ctx.fillStyle = gOuter;
        ctx.beginPath();
        ctx.arc(this.core.x, this.core.y, outerRadius, 0, Math.PI * 2);
        ctx.fill();

        // 内圈金核
        const innerRadius = radius * 1.4;
        const gInner = ctx.createRadialGradient(
            this.core.x,
            this.core.y - radius * 0.4,
            innerRadius * 0.1,
            this.core.x,
            this.core.y,
            innerRadius
        );
        gInner.addColorStop(0, 'rgba(255, 245, 225,' + Math.min(1, alpha * 1.2).toFixed(3) + ')');
        gInner.addColorStop(0.4, 'rgba(252, 228, 180,' + alpha.toFixed(3) + ')');
        gInner.addColorStop(1, 'rgba(222, 185, 115,' + (alpha * 0.9).toFixed(3) + ')');

        ctx.fillStyle = gInner;
        ctx.beginPath();
        ctx.arc(this.core.x, this.core.y, innerRadius, 0, Math.PI * 2);
        ctx.fill();

        // 轻微高光点
        ctx.fillStyle = 'rgba(255, 255, 245,' + Math.min(1, alpha * 1.4).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(
            this.core.x - innerRadius * 0.25,
            this.core.y - innerRadius * 0.4,
            innerRadius * 0.22,
            0,
            Math.PI * 2
        );
        ctx.fill();
    };

    ConstellationParticles.prototype.draw = function () {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // 深色宇宙背景
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, '#0b101c');
        gradient.addColorStop(1, '#02040a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // 星座连线（先画线，再画点）
        ctx.save();
        ctx.lineWidth = 0.7;
        ctx.strokeStyle = 'rgba(222, 196, 130, 0.45)';
        ctx.beginPath();
        for (let i = 0; i < this.links.length; i++) {
            const link = this.links[i];
            ctx.moveTo(link.a.x, link.a.y);
            ctx.lineTo(link.b.x, link.b.y);
        }
        ctx.stroke();
        ctx.restore();

        // 粒子
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            const baseAlpha = p.isCluster ? p.alpha : p.alpha * 0.8;

            const innerAlpha = baseAlpha;
            const outerAlpha = baseAlpha * 0.4;

            // 柔和金色光点
            const radial = ctx.createRadialGradient(
                p.x,
                p.y,
                0,
                p.x,
                p.y,
                p.size * 3
            );
            radial.addColorStop(0, 'rgba(255, 230, 180,' + innerAlpha.toFixed(3) + ')');
            radial.addColorStop(1, 'rgba(255, 210, 120,' + outerAlpha.toFixed(3) + ')');
            ctx.fillStyle = radial;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // 中心呼吸金核
        this.drawCore();
    };

    window.ConstellationParticles = ConstellationParticles;
})();

