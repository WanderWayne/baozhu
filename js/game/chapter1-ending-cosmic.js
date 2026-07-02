// 第一章通关结尾：黑幕 → 全屏星尘（无边缘聚合）→ 分段叙事文案（节奏同开场 story）→ 点击继续回主界面

(function () {
    'use strict';

    const CURTAIN_FADE_MS = 1400;
    const OUT_FADE_MS = 1000;

    // 与 intro-states-late.js storySequence 前两段一致：delay / duration / fade 起点 duration-1000
    const STORY_BASE_MS = 500;
    const LINE1_DELAY_MS = 800;
    const LINE1_DURATION_MS = 5500;
    const LINE2_DELAY_MS = 600;
    const TAP_HINT_AFTER_LINE2_MS = 1000;

    /**
     * @param {number} n
     * @param {number} w
     * @param {number} h
     * @returns {{x:number,y:number}[]}
     */
    function gridHomes(n, w, h) {
        const cols = Math.ceil(Math.sqrt(n));
        const rows = Math.ceil(n / cols);
        const cellW = w / cols;
        const cellH = h / rows;
        const homes = [];
        let i = 0;
        for (let r = 0; r < rows && i < n; r++) {
            for (let c = 0; c < cols && i < n; c++) {
                const jitterX = (Math.random() - 0.5) * cellW * 0.35;
                const jitterY = (Math.random() - 0.5) * cellH * 0.35;
                homes.push({
                    x: Math.max(20, Math.min(w - 20, c * cellW + cellW * 0.5 + jitterX)),
                    y: Math.max(20, Math.min(h - 20, r * cellH + cellH * 0.5 + jitterY)),
                });
                i++;
            }
        }
        return homes;
    }

    class Chapter1EndingCosmic {
        constructor() {
            this._raf = null;
            this._resizeBound = null;
            this._timeouts = [];
            this.root = null;
            this.canvas = null;
            this.ctx = null;
            this.particles = [];
            this.phase = 'precurtain';
            this.preCurtain = null;
            this.postCurtain = null;
            this.textWrap = null;
            this.line1Host = null;
            this.line2Host = null;
            this.tapHint = null;
            this._continueHandler = null;
            this.w = 0;
            this.h = 0;
        }

        _later(ms, fn) {
            const id = setTimeout(fn, ms);
            this._timeouts.push(id);
            return id;
        }

        _clearTimers() {
            this._timeouts.forEach((id) => clearTimeout(id));
            this._timeouts = [];
        }

        run() {
            this.root = document.createElement('div');
            this.root.id = 'chapter1-ending-root';
            this.root.className = 'chapter1-ending-root';
            this.root.setAttribute('aria-hidden', 'true');

            this.preCurtain = document.createElement('div');
            this.preCurtain.className = 'chapter1-ending-curtain chapter1-ending-pre-curtain';

            this.canvas = document.createElement('canvas');
            this.canvas.className = 'chapter1-ending-canvas';
            this.canvas.setAttribute('aria-hidden', 'true');

            this.textWrap = document.createElement('div');
            this.textWrap.className = 'chapter1-ending-text-wrap';
            this.line1Host = document.createElement('div');
            this.line1Host.className = 'chapter1-ending-line-host';
            this.line2Host = document.createElement('div');
            this.line2Host.className = 'chapter1-ending-line-host';
            this.tapHint = document.createElement('p');
            this.tapHint.className = 'chapter1-ending-tap-hint';
            this.tapHint.textContent = '点击任意处继续';
            this.textWrap.appendChild(this.line1Host);
            this.textWrap.appendChild(this.line2Host);
            this.textWrap.appendChild(this.tapHint);

            this.postCurtain = document.createElement('div');
            this.postCurtain.className = 'chapter1-ending-curtain chapter1-ending-post-curtain';

            this.root.appendChild(this.preCurtain);
            this.root.appendChild(this.canvas);
            this.root.appendChild(this.textWrap);
            this.root.appendChild(this.postCurtain);

            document.body.appendChild(this.root);

            this.ctx = this.canvas.getContext('2d');
            this._resizeBound = () => this._resize();
            window.addEventListener('resize', this._resizeBound);

            this.preCurtain.style.opacity = '0';
            this.postCurtain.style.opacity = '0';
            requestAnimationFrame(() => {
                this.preCurtain.style.transition = `opacity ${CURTAIN_FADE_MS}ms ease`;
                this.preCurtain.style.opacity = '1';
            });

            this._later(CURTAIN_FADE_MS, () => this._beginScene());
        }

        _resize() {
            if (!this.canvas) return;
            this.w = window.innerWidth;
            this.h = window.innerHeight;
            this.canvas.width = this.w;
            this.canvas.height = this.h;
        }

        _buildParticlesFillScreen(ambientN, clusterCount, spacing) {
            const w = this.w;
            const h = this.h;
            const homes = gridHomes(ambientN, w, h);

            for (let i = 0; i < ambientN; i++) {
                const hm = homes[i];
                const jx = (Math.random() - 0.5) * 14;
                const jy = (Math.random() - 0.5) * 14;
                const x = hm.x + jx;
                const y = hm.y + jy;
                const isGold = Math.random() < 0.28;
                const base = 1.2 + Math.random() * 1.4;
                this.particles.push({
                    x,
                    y,
                    homeX: hm.x,
                    homeY: hm.y,
                    vx: (Math.random() - 0.5) * 0.25,
                    vy: (Math.random() - 0.5) * 0.25,
                    wanderAngle: Math.random() * Math.PI * 2,
                    wanderRadius: 12 + Math.random() * 22,
                    size: base,
                    alpha: (0.35 + Math.random() * 0.15) * 0.65,
                    visualSize: base,
                    visualAlpha: (0.35 + Math.random() * 0.15) * 0.65,
                    isGold,
                    linkedTo: null,
                });
            }

            for (let c = 0; c < clusterCount; c++) {
                const cnt = 2 + Math.floor(Math.random() * 2);
                const baseHomeX = 80 + Math.random() * (w - 160);
                const baseHomeY = 80 + Math.random() * (h - 160);
                const cluster = [];
                for (let k = 0; k < cnt; k++) {
                    const hx = baseHomeX + (Math.random() - 0.5) * spacing;
                    const hy = baseHomeY + (Math.random() - 0.5) * spacing;
                    const jx = (Math.random() - 0.5) * 8;
                    const jy = (Math.random() - 0.5) * 8;
                    const p = {
                        x: hx + jx,
                        y: hy + jy,
                        homeX: hx,
                        homeY: hy,
                        vx: (Math.random() - 0.5) * 0.12,
                        vy: (Math.random() - 0.5) * 0.12,
                        wanderAngle: Math.random() * Math.PI * 2,
                        wanderRadius: 10 + Math.random() * 14,
                        size: 1.3,
                        alpha: 0.38,
                        visualSize: 1.3,
                        visualAlpha: 0.38,
                        isGold: Math.random() < 0.35,
                        linkedTo: null,
                    };
                    this.particles.push(p);
                    cluster.push(p);
                }
                for (let i = 1; i < cluster.length; i++) {
                    cluster[i].linkedTo = cluster[i - 1];
                }
            }
        }

        _beginScene() {
            this._resize();
            const isSmall = window.innerWidth <= 450 && window.innerHeight <= 950;
            const ambientN = isSmall ? 100 : 145;
            const clusterCount = isSmall ? 5 : 8;
            const spacing = 22;
            this.particles = [];
            this._buildParticlesFillScreen(ambientN, clusterCount, spacing);

            this.phase = 'wander';
            this._lastNow = performance.now();
            this._tick();

            const line1At = STORY_BASE_MS + LINE1_DELAY_MS;
            const line2At = line1At + LINE1_DURATION_MS + LINE2_DELAY_MS;

            this._later(line1At, () => this._showStoryLine1());
            this._later(line2At, () => this._showStoryLine2());
        }

        /** 对齐 IntroSystem.prototype.showStoryText（非 goal）：音效 + 入场 + duration-1000 退场 */
        _appendStoryStyledLine(host, text, durationMs, holdVisible) {
            if (window.AudioManager) {
                window.AudioManager.playSFX('text-appear');
            }

            const textEl = document.createElement('div');
            textEl.className = 'chapter1-ending-story-line';
            textEl.innerHTML = text.replace(/\n/g, '<br>');

            const isSmallScreen = window.innerWidth <= 450 && window.innerHeight <= 950;
            const fontSize = isSmallScreen ? '14px' : '24px';
            const letterSpacing = isSmallScreen ? '2px' : '4px';

            textEl.style.cssText = `
                font-size: ${fontSize};
                line-height: 1.8;
                color: rgba(255,255,255,0.92);
                font-family: "Source Han Serif SC", "Noto Serif SC", "PingFang SC", serif;
                letter-spacing: ${letterSpacing};
                opacity: 0;
                transform: scale(0.95);
                transition: opacity 1s ease, transform 1s ease;
                text-shadow: 0 0 10px rgba(255,255,255,0.6), 0 0 25px rgba(255,255,255,0.25);
                margin: 20px 0;
                max-width: 80vw;
            `;

            host.innerHTML = '';
            host.appendChild(textEl);

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    textEl.style.opacity = '1';
                    textEl.style.transform = 'scale(1)';
                });
            });

            if (!holdVisible && durationMs > 1000) {
                this._later(durationMs - 1000, () => {
                    textEl.style.opacity = '0';
                    textEl.style.transform = 'scale(1.02)';
                });
            }
        }

        _showStoryLine1() {
            this.textWrap.classList.add('chapter1-ending-text-visible');
            this._appendStoryStyledLine(
                this.line1Host,
                '恭喜你完成了奶酪谷的挑战',
                LINE1_DURATION_MS,
                false
            );
        }

        _showStoryLine2() {
            this.line1Host.innerHTML = '';
            this._appendStoryStyledLine(this.line2Host, '后续敬请期待！', 0, true);

            this._later(TAP_HINT_AFTER_LINE2_MS, () => {
                this.tapHint.classList.add('chapter1-ending-tap-visible');
                this.root.style.pointerEvents = 'auto';
                this.root.style.cursor = 'pointer';
                this._continueHandler = () => this._startOut();
                this.root.addEventListener('click', this._continueHandler);
            });
        }

        _tick() {
            if (this.phase === 'out') return;

            const now = performance.now();
            const dt = Math.min(50, now - (this._lastNow || now));
            this._lastNow = now;

            this._updateWander(dt, now);
            this._drawParticles(true);

            this._raf = requestAnimationFrame(() => this._tick());
        }

        _updateWander(dt, now) {
            const w = this.w;
            const h = this.h;
            const margin = 48;
            const isSmall = w <= 450 && h <= 950;

            this.particles.forEach((p) => {
                if (isSmall) {
                    p.wanderAngle += (Math.random() - 0.5) * 0.05;
                    const targetX = p.homeX + Math.cos(p.wanderAngle) * p.wanderRadius;
                    const targetY = p.homeY + Math.sin(p.wanderAngle) * p.wanderRadius;
                    p.x += (targetX - p.x) * 0.012;
                    p.y += (targetY - p.y) * 0.012;
                } else {
                    p.x += p.vx;
                    p.y += p.vy;
                    if (p.x < margin) p.vx += 0.012;
                    if (p.x > w - margin) p.vx -= 0.012;
                    if (p.y < margin) p.vy += 0.012;
                    if (p.y > h - margin) p.vy -= 0.012;
                    p.vx *= 0.9985;
                    p.vy *= 0.9985;
                }
                p.visualSize = Math.max(0.5, p.size);
                p.visualAlpha = p.alpha;
            });
        }

        _drawParticles(drawLinks) {
            const ctx = this.ctx;
            if (!ctx) return;
            ctx.clearRect(0, 0, this.w, this.h);

            if (drawLinks) {
                ctx.strokeStyle = 'rgba(255, 230, 170, 0.15)';
                ctx.lineWidth = 0.5;
                this.particles.forEach((p) => {
                    if (p.linkedTo) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p.linkedTo.x, p.linkedTo.y);
                        ctx.stroke();
                    }
                });
            }

            this.particles.forEach((p) => {
                const radius = Math.max(0.5, p.visualSize || p.size || 2);
                const alpha = Math.max(0, Math.min(1, p.visualAlpha ?? p.alpha ?? 0.5));
                ctx.beginPath();
                ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
                if (p.isGold) {
                    ctx.fillStyle = `rgba(255, 220, 130, ${alpha})`;
                } else {
                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                }
                ctx.fill();
            });
        }

        _startOut() {
            if (this.phase === 'out') return;
            this.phase = 'out';
            this._clearTimers();

            if (this._continueHandler) {
                this.root.removeEventListener('click', this._continueHandler);
                this._continueHandler = null;
            }
            this.root.style.pointerEvents = 'none';

            if (this._raf) {
                cancelAnimationFrame(this._raf);
                this._raf = null;
            }

            if (window.AudioManager) window.AudioManager.stopBGM();

            this.postCurtain.style.transition = `opacity ${OUT_FADE_MS}ms ease`;
            requestAnimationFrame(() => {
                this.postCurtain.style.opacity = '1';
            });

            setTimeout(() => {
                try {
                    sessionStorage.setItem('chapter1_main_entrance', '1');
                } catch (e) {}
                this._dispose();
                window.location.href = 'index.html';
            }, OUT_FADE_MS + 80);
        }

        _dispose() {
            this._clearTimers();
            window.removeEventListener('resize', this._resizeBound);
            if (this.root && this.root.parentNode) {
                this.root.parentNode.removeChild(this.root);
            }
            this.root = null;
            this.canvas = null;
            this.ctx = null;
            this.particles = [];
        }
    }

    window.startChapter1EndingCosmic = function () {
        const run = new Chapter1EndingCosmic();
        run.run();
        return run;
    };
})();
