// 星图章节选择 - 核心控制
// 负责初始化画布、粒子系统及主循环，并与主菜单按钮对接

(function () {
    function ConstellationSystem() {
        this.canvas = document.getElementById('constellation-canvas');
        this.screenEl = document.getElementById('constellation-screen');
        this.mainScreenEl = document.getElementById('main-screen');
        this.particles = null;
        this.lastTime = 0;
        this.rafId = null;
        this.isRunning = false;
    }

    ConstellationSystem.prototype.init = function () {
        if (!this.canvas || !this.screenEl) return;

        // 切换到星图界面
        if (this.mainScreenEl) {
            this.mainScreenEl.style.display = 'none';
        }
        this.screenEl.style.display = 'block';

        // 初始化粒子系统
        if (!this.particles) {
            this.particles = new window.ConstellationParticles(this.canvas);
        }

        this.handleResize();
        window.addEventListener('resize', this.handleResize.bind(this));

        this.isRunning = true;
        this.lastTime = performance.now();
        this.loop(this.lastTime);
    };

    ConstellationSystem.prototype.handleResize = function () {
        if (!this.canvas || !this.particles) return;

        const width = window.innerWidth;
        const height = window.innerHeight;
        this.particles.resize(width, height);
    };

    ConstellationSystem.prototype.loop = function (timestamp) {
        if (!this.isRunning) return;

        const dt = Math.min(timestamp - this.lastTime, 50);
        this.lastTime = timestamp;

        if (this.particles) {
            this.particles.update(dt);
            this.particles.draw();
        }

        this.rafId = window.requestAnimationFrame(this.loop.bind(this));
    };

    ConstellationSystem.prototype.stop = function () {
        this.isRunning = false;
        if (this.rafId) {
            window.cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    };

    // 对外暴露初始化入口
    window.ConstellationSystem = {
        instance: null,
        init: function () {
            if (!this.instance) {
                this.instance = new ConstellationSystem();
            }
            this.instance.init();
        }
    };
})();

