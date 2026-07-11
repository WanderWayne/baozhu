/** @feature progress @see docs/features/progress.md */

Game.prototype.initGemDisplay = function() {
        if (document.getElementById('gem-display')) return;
        const el = document.createElement('div');
        el.id = 'gem-display';
        el.className = 'gem-display';
        const diamondSvg = window.ITEM_SVGS && window.ITEM_SVGS['_diamond'];
        const gemIconHTML = diamondSvg
            ? `<span class="gem-icon gem-icon-svg">${diamondSvg}</span>`
            : '<span class="gem-icon">💎</span>';
        el.innerHTML = `${gemIconHTML}<span class="gem-count" id="gem-count">0</span>`;
        document.body.appendChild(el);
        // 元素创建后立即定位，静默初始化（不触发动画）
        this._updateGemPosition();
        this.updateGemDisplay(true);

        // 监听物品栏尺寸变化，同步钻石位置（含高度过渡动画期间）
        const inventory = document.getElementById('inventory-area');
        if (inventory && typeof ResizeObserver !== 'undefined') {
            this._gemResizeObserver = new ResizeObserver(() => this._updateGemPosition());
            this._gemResizeObserver.observe(inventory);
        }
        window.addEventListener('resize', this._boundUpdateGemPosition = () => this._updateGemPosition());
    }

Game.prototype._updateGemPosition = function() {
        const gemEl = document.getElementById('gem-display');
        const inventory = document.getElementById('inventory-area');
        if (!gemEl || !inventory) return;
        const invRect = inventory.getBoundingClientRect();
        gemEl.style.bottom = (window.innerHeight - invRect.top + 6) + 'px';
    }

Game.prototype._refreshBackBtnDot = function() {
        const backBtn = document.getElementById('back-btn');
        if (!backBtn) return;
        const has = window.LevelManager && window.LevelManager.hasAnyClaimableTask();
        const existing = backBtn.querySelector('.claimable-dot');
        if (has && !existing) {
            const dot = document.createElement('span');
            dot.className = 'claimable-dot';
            backBtn.appendChild(dot);
        } else if (!has && existing) {
            existing.remove();
        }
    }

Game.prototype.updateGemDisplay = function(silent = false) {
        const countEl = document.getElementById('gem-count');
        if (!countEl) {
            console.warn('[Gems] #gem-count element not found');
            return;
        }
        const gems = window.LevelManager.getGems();
        const old = parseInt(countEl.textContent) || 0;
        console.log('[Gems] updateGemDisplay — old:', old, '→ new:', gems, silent ? '(silent)' : '');
        countEl.textContent = gems;

        this._refreshBackBtnDot();
        if (!silent && gems > old) {
            const diff = gems - old;
            if (window.AudioManager) window.AudioManager.playSFX('gem-earn');
            countEl.classList.remove('gem-bump');
            countEl.offsetHeight;
            countEl.classList.add('gem-bump');
            // 钻石飞行动画 + "+N" 标注
            if (this._lastDoorRect) {
                console.log('[Gems] showGemFlyAnimation from', this._lastDoorRect);
                this.showGemFlyAnimation(this._lastDoorRect, diff);
                this._lastDoorRect = null;
            } else {
                console.warn('[Gems] _lastDoorRect is null — fly animation skipped');
            }
            this.showGemPlusLabel(diff);
        }
    }

Game.prototype.showGemFlyAnimation = function(fromRect, amount) {
        console.log('[Gems] showGemFlyAnimation start, amount:', amount);
        const gemEl = document.getElementById('gem-display');
        if (!gemEl) return;
        // 飞行前先强制同步钻石框位置（暂停过渡，确保读到最终坐标）
        gemEl.style.transition = 'none';
        this._updateGemPosition();
        gemEl.offsetHeight; // 强制应用
        const toRect = gemEl.getBoundingClientRect();
        gemEl.style.transition = ''; // 恢复过渡
        const toX = toRect.left + toRect.width / 2;
        const toY = toRect.top + toRect.height / 2;
        const fromX = fromRect.left + fromRect.width / 2;
        const fromY = fromRect.top + fromRect.height / 2;
        const count = 10;
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const gem = document.createElement('div');
                const _dSvg = window.ITEM_SVGS && window.ITEM_SVGS['_diamond'];
                if (_dSvg) { gem.innerHTML = _dSvg; gem.style.fontSize = '0'; }
                else { gem.textContent = '💎'; }
                gem.style.cssText = `
                    position: fixed;
                    left: ${fromX - 10}px;
                    top: ${fromY - 10}px;
                    width: 20px; height: 20px;
                    font-size: 16px; line-height: 20px; text-align: center;
                    pointer-events: none; z-index: 3000;
                    opacity: 1; transform: scale(1.3);
                    transition:
                        left 0.85s cubic-bezier(0.4, 0, 0.2, 1),
                        top  0.85s cubic-bezier(0.4, 0, 0.2, 1),
                        transform 0.85s ease-out,
                        opacity 0.25s ease-in 0.6s;
                `;
                document.body.appendChild(gem);
                gem.offsetHeight;
                const jx = (Math.random() - 0.5) * 36;
                const jy = (Math.random() - 0.5) * 20;
                gem.style.left = (toX - 10 + jx) + 'px';
                gem.style.top  = (toY - 10 + jy) + 'px';
                gem.style.transform = 'scale(0.7)';
                gem.style.opacity = '0';
                setTimeout(() => gem.remove(), 950);
            }, i * 75);
        }
    }

Game.prototype.showGemPlusLabel = function(amount) {
        console.log('[Gems] showGemPlusLabel +' + amount);
        const gemEl = document.getElementById('gem-display');
        if (!gemEl) return;
        const rect = gemEl.getBoundingClientRect();
        const label = document.createElement('div');
        label.className = 'gem-plus-label';
        label.textContent = '+' + amount;
        label.style.left = (rect.left + rect.width / 2 - 20) + 'px';
        label.style.top  = (rect.top - 6) + 'px';
        document.body.appendChild(label);
        setTimeout(() => label.remove(), 1300);
    }
