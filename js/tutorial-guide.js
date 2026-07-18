// 新手引导系统 — 聚光灯 + 文字提示 + 交互穿透
// ================================================

window.TutorialGuide = {
    _active: false,
    _overlay: null,
    _resolve: null,
    _dismissReadyTimer: null,
    _autoDismissTimer: null,

    _clearTimers() {
        if (this._dismissReadyTimer) {
            clearTimeout(this._dismissReadyTimer);
            this._dismissReadyTimer = null;
        }
        if (this._autoDismissTimer) {
            clearTimeout(this._autoDismissTimer);
            this._autoDismissTimer = null;
        }
    },

    /**
     * @param {Object} opts
     * @param {HTMLElement|DOMRect} opts.target  高亮的目标元素或 DOMRect
     * @param {string}  opts.text     引导文字
     * @param {string}  [opts.position='bottom']  文字位置: top | bottom
     * @param {number}  [opts.padding=10]
     * @param {number}  [opts.borderRadius=16]
     * @returns {Promise}
     */
    show(opts) {
        if (this._active) return Promise.resolve();
        this._active = true;

        return new Promise(resolve => {
            this._resolve = resolve;

            const el = opts.target instanceof HTMLElement ? opts.target : null;
            const rect = el ? el.getBoundingClientRect() : opts.target;
            const pad = opts.padding ?? 10;
            const br = opts.borderRadius ?? 16;

            const W = window.innerWidth;
            const H = window.innerHeight;

            const hx = Math.max(0, rect.left - pad);
            const hy = Math.max(0, rect.top - pad);
            const hw = Math.min(W - hx, rect.width + pad * 2);
            const hh = Math.min(H - hy, rect.height + pad * 2);

            const overlay = document.createElement('div');
            overlay.className = 'tut-overlay';
            overlay.innerHTML = `
                <svg class="tut-mask" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
                    <defs>
                        <mask id="tut-cutout">
                            <rect width="${W}" height="${H}" fill="white"/>
                            <rect x="${hx}" y="${hy}" width="${hw}" height="${hh}" rx="${br}" ry="${br}" fill="black"/>
                        </mask>
                    </defs>
                    <rect width="${W}" height="${H}" fill="rgba(50,40,22,0.82)" mask="url(#tut-cutout)"/>
                </svg>
                <div class="tut-border" style="left:${hx}px;top:${hy}px;width:${hw}px;height:${hh}px;border-radius:${br}px"></div>
                <div class="tut-text-wrap" style="${this._textStyle(opts.position || 'bottom', hx, hy, hw, hh)}">
                    <div class="tut-text">${opts.text || ''}</div>
                </div>
            `;

            document.body.appendChild(overlay);
            this._overlay = overlay;

            requestAnimationFrame(() => overlay.classList.add('visible'));

            let touchStartY = null;
            const SWIPE_THRESHOLD = 15;
            let dismissEnabled = false;

            const onTouchStart = (e) => {
                touchStartY = e.touches[0].clientY;
            };

            const onTouchMove = (e) => {
                if (!dismissEnabled) return;
                if (touchStartY !== null) {
                    const dy = Math.abs(e.touches[0].clientY - touchStartY);
                    if (dy > SWIPE_THRESHOLD) {
                        cleanup();
                        this._close();
                    }
                }
            };

            const onPointerUp = (e) => {
                if (!this._active || !dismissEnabled) return;
                const cx = e.clientX ?? e.changedTouches?.[0]?.clientX;
                const cy = e.clientY ?? e.changedTouches?.[0]?.clientY;

                if (window.AudioManager) window.AudioManager.playClickOpen();

                cleanup();
                this._close();

                if (cx != null && cy != null) {
                    const hitEl = document.elementFromPoint(cx, cy);
                    if (hitEl) {
                        setTimeout(() => hitEl.click(), 30);
                    }
                }
            };

            const cleanup = () => {
                this._clearTimers();
                overlay.removeEventListener('touchstart', onTouchStart);
                overlay.removeEventListener('touchmove', onTouchMove);
                overlay.removeEventListener('click', onPointerUp);
            };

            this._dismissReadyTimer = setTimeout(() => {
                dismissEnabled = true;
                overlay.addEventListener('touchstart', onTouchStart, { passive: true });
                overlay.addEventListener('touchmove', onTouchMove, { passive: true });
                overlay.addEventListener('click', onPointerUp);
            }, 1000);

            this._autoDismissTimer = setTimeout(() => {
                cleanup();
                this._close();
            }, 8000);
        });
    },

    _textStyle(pos, hx, hy, hw, hh) {
        const W = window.innerWidth;
        const H = window.innerHeight;
        const margin = 16;
        const maxW = Math.min(280, W - margin * 2);
        const cx = hx + hw / 2;

        // Clamp horizontal so the box stays on-screen
        let left = cx - maxW / 2;
        if (left < margin) left = margin;
        if (left + maxW > W - margin) left = W - margin - maxW;

        const gap = 20;
        let vertical;
        if (pos === 'top') {
            let bottom = H - hy + gap;
            if (bottom > H - margin) bottom = H - margin;
            vertical = `bottom:${bottom}px`;
        } else {
            let top = hy + hh + gap;
            if (top > H - 80) top = H - 80;
            vertical = `top:${top}px`;
        }

        return `left:${left}px; width:${maxW}px; ${vertical}`;
    },

    _close() {
        this._clearTimers();
        this._active = false;
        const ov = this._overlay;
        if (ov) {
            ov.classList.remove('visible');
            ov.classList.add('fade-out');
            setTimeout(() => ov.remove(), 400);
        }
        this._overlay = null;
        if (this._resolve) {
            this._resolve();
            this._resolve = null;
        }
    }
};
