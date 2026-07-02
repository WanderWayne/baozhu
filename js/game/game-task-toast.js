/**
 * 关卡内「任务达成」提示：自左上角滑入 → 停留 2 秒 → 飞向返回键上可领取任务绿点（.claimable-dot）并缩小。
 */
(function () {
    const GameTaskToast = {
        _layer: null,
        _lastDone: null,
        _queue: [],
        _draining: false,

        ensureLayer() {
            if (this._layer) return this._layer;
            const root = document.createElement('div');
            root.id = 'game-task-toast-root';
            document.body.appendChild(root);
            this._layer = root;
            return root;
        },

        /** 进入关卡时调用，避免把已达成的任务再弹一遍 */
        initBaseline() {
            if (typeof window.getBaozhuTaskDoneMap !== 'function') return;
            this._lastDone = { ...window.getBaozhuTaskDoneMap() };
        },

        /** 在 LevelManager 写入进度后调用 */
        afterProgressMutation() {
            if (typeof window.getBaozhuTaskDoneMap !== 'function' || !window.BAOZHU_TASKS) return;
            const next = window.getBaozhuTaskDoneMap();
            const prev = this._lastDone;
            if (!prev) {
                this._lastDone = { ...next };
                return;
            }
            const names = [];
            window.BAOZHU_TASKS.forEach(t => {
                if (!prev[t.id] && next[t.id]) names.push(t.name);
            });
            this._lastDone = { ...next };
            if (
                names.length &&
                window.GameInstance &&
                typeof window.GameInstance._refreshBackBtnDot === 'function'
            ) {
                window.GameInstance._refreshBackBtnDot();
            }
            names.forEach(n => this._enqueue(n));
        },

        _enqueue(taskName) {
            this._queue.push(taskName);
            if (!this._draining) this._drain();
        },

        async _drain() {
            this._draining = true;
            while (this._queue.length) {
                const name = this._queue.shift();
                await this._playToast(name);
            }
            this._draining = false;
        },

        _playToast(taskName) {
            return new Promise(resolve => {
                this.ensureLayer();
                const el = document.createElement('div');
                el.className = 'game-task-toast';
                el.setAttribute('role', 'status');

                const badge = document.createElement('span');
                badge.className = 'game-task-toast__badge';
                badge.setAttribute('aria-hidden', 'true');
                const mark = document.createElement('span');
                mark.className = 'game-task-toast__badge-mark';
                mark.textContent = '!';
                badge.appendChild(mark);

                const textSpan = document.createElement('span');
                textSpan.className = 'game-task-toast__text';
                textSpan.textContent = '任务达成：' + taskName;

                el.appendChild(badge);
                el.appendChild(textSpan);
                this._layer.appendChild(el);

                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        el.classList.add('game-task-toast--slide-in');
                        if (window.AudioManager) window.AudioManager.playSFX('task-milestone');
                    });
                });

                const SLIDE_MS = 480;
                const HOLD_MS = 2000;

                setTimeout(() => {
                    const anchor = document.querySelector('#back-btn .claimable-dot');
                    const r = el.getBoundingClientRect();

                    el.classList.remove('game-task-toast--slide-in');
                    Object.assign(el.style, {
                        position: 'fixed',
                        left: `${r.left}px`,
                        top: `${r.top}px`,
                        width: `${Math.ceil(r.width)}px`,
                        transform: 'none',
                        opacity: '1',
                        transition: 'none',
                        boxSizing: 'border-box'
                    });
                    void el.offsetHeight;

                    const fcx = r.left + r.width / 2;
                    const fcy = r.top + r.height / 2;
                    let dx = 0;
                    let dy = 0;
                    const scale = 0.045;

                    if (anchor) {
                        const tr = anchor.getBoundingClientRect();
                        dx = tr.left + tr.width / 2 - fcx;
                        dy = tr.top + tr.height / 2 - fcy;
                    } else {
                        const back = document.getElementById('back-btn');
                        if (back) {
                            const br = back.getBoundingClientRect();
                            dx = br.right - 12 - fcx;
                            dy = br.top + 12 - fcy;
                        }
                    }

                    el.classList.add('game-task-toast--fly-out');

                    const anim = el.animate(
                        [
                            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                            { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 0.28 }
                        ],
                        { duration: 520, easing: 'cubic-bezier(0.33, 1, 0.44, 1)', fill: 'forwards' }
                    );

                    anim.onfinish = () => {
                        el.remove();
                        resolve();
                    };
                }, SLIDE_MS + HOLD_MS);
            });
        }
    };

    window.GameTaskToast = GameTaskToast;
})();
