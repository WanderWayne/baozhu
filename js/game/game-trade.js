/** @feature trade-station @see docs/features/trade-station.md */

Game.prototype._initSpecialAreaCenterTrade = function() {
        // 将交易台移到合成区中央，缩放出现
        if (this.tradeStations) {
            this.tradeStations.forEach(ts => {
                if (ts.el) {
                    ts.el.classList.add('special-area-center');
                    ts.el.style.opacity = '0';
                    ts.el.style.transform = 'translate(-50%, -50%) scale(0)';
                    ts.el.offsetHeight;
                    ts.el.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.175,0.885,0.32,1.275)';
                    ts.el.style.opacity = '1';
                    ts.el.style.transform = 'translate(-50%, -50%) scale(1)';
                }
            });
        }

        // 添加"继续前进"按钮
        setTimeout(() => {
            const btn = document.createElement('div');
            btn.className = 'special-area-continue';
            btn.textContent = '继续前进 →';
            document.getElementById('synthesis-area').appendChild(btn);
            btn.offsetHeight;
            btn.classList.add('visible');
            const go = () => {
                btn.removeEventListener('click', go);
                btn.removeEventListener('touchend', go);
                btn.remove();
                this._specialAreaProceed();
            };
            btn.addEventListener('click', go);
            btn.addEventListener('touchend', go);
        }, 1500);
    }

Game.prototype._initRecipeBookTrade = function() {
        const cfg = this.levelData.recipeBookTradeStation;
        if (cfg) {
            const configs = [cfg];
            this.tradeStations = [];
            configs.forEach((c, i) => {
                const ts = this._createTradeStation(c, i);
                this.tradeStations.push(ts);
            });
            if (this.tradeStations.length === 1) {
                this.tradeStation = this.tradeStations[0];
            }

            this.tradeStations.forEach(ts => {
                if (ts.el) {
                    ts.el.classList.add('special-area-center');
                    ts.el.style.opacity = '0';
                    ts.el.style.transform = 'translate(-50%, -50%) scale(0)';
                    ts.el.offsetHeight;
                    ts.el.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.175,0.885,0.32,1.275)';
                    ts.el.style.opacity = '1';
                    ts.el.style.transform = 'translate(-50%, -50%) scale(1)';
                }
            });

            this._maybeShowTradeStationTutorial();
            return;
        }

        // No trade station — spawn recipe book item directly in synthesis area
        this._spawnRecipeBookDirectly();
    }

Game.prototype._createTradeStation = function(cfg, index) {
        const synthArea = document.getElementById('synthesis-area');
        const isGem = cfg.type === 'gem';
        const outputItem = window.ITEMS[cfg.output] || {};

        const el = document.createElement('div');
        el.className = 'trade-station';
        el.dataset.tsIndex = index;

        let inputContent, inputName;
        if (isGem) {
            const _tsDiamond = (window.ITEM_SVGS && window.ITEM_SVGS['_diamond'])
                ? `<span class="ts-gem-icon ts-gem-svg">${window.ITEM_SVGS['_diamond']}</span>`
                : '<span class="ts-gem-icon">💎</span>';
            inputContent = `<span class="ts-gem-cost">${cfg.cost}${_tsDiamond}</span>`;
            inputName = '';
        } else {
            const inputItem = window.ITEMS[cfg.input] || {};
            const _tsInputSvg = window.ITEM_SVGS && window.ITEM_SVGS[cfg.input];
            const tsInputIcon = _tsInputSvg
                ? `<span class="ts-ghost-icon ts-ghost-svg">${_tsInputSvg}</span>`
                : `<span class="ts-ghost-icon">${inputItem.icon || '?'}</span>`;
            inputContent = tsInputIcon;
            inputName = `<span class="ts-slot-name">${inputItem.name || cfg.input}</span>`;
        }

        const _tsOutputSvg = window.ITEM_SVGS && window.ITEM_SVGS[cfg.output];
        const tsOutputIcon = _tsOutputSvg
            ? `<span class="ts-ghost-icon ts-ghost-svg">${_tsOutputSvg}</span>`
            : `<span class="ts-ghost-icon">${outputItem.icon || '?'}</span>`;
        const outputName = `<span class="ts-slot-name">${outputItem.name || cfg.output}</span>`;

        el.innerHTML = `
            <div class="ts-body">
                <div class="ts-slot ts-slot-input">${inputContent}${inputName}</div>
                <div class="ts-middle">
                    <span class="ts-arrow">→</span>
                    <span class="ts-label">兑换</span>
                </div>
                <div class="ts-slot ts-slot-output">${tsOutputIcon}${outputName}</div>
            </div>
            <div class="trade-station-hitbox"></div>
            <div class="trade-restock-overlay">
                <span class="trade-restock-title">进货中</span>
                <span class="trade-restock-countdown">5</span>
                <span class="trade-restock-unit">秒</span>
            </div>
        `;
        synthArea.appendChild(el);

        const ts = {
            el: el,
            box: el.querySelector('.trade-station-hitbox'),
            inputSlot: el.querySelector('.ts-slot-input'),
            outputSlot: el.querySelector('.ts-slot-output'),
            overlay: el.querySelector('.trade-restock-overlay'),
            countdownEl: el.querySelector('.trade-restock-countdown'),
            input: cfg.input || null,
            output: cfg.output,
            cost: cfg.cost || 0,
            type: isGem ? 'gem' : 'item',
            maxUses: cfg.maxUses || Infinity,
            usesLeft: cfg.maxUses || Infinity,
            soldOut: false,
            restocking: false,
            restockTimeout: null
        };

        el.addEventListener('click', (e) => {
            if (ts.restocking || ts.soldOut) return;
            e.stopPropagation();
            this.showTradeConfirm(ts);
        });

        return ts;
    }

    // 初始化交易站（支持单个或多个）
Game.prototype.initTradeStation = function() {
        // 清理旧的
        if (this.tradeStations) {
            this.tradeStations.forEach(ts => {
                if (ts.restockTimeout) clearTimeout(ts.restockTimeout);
            });
        }
        document.querySelectorAll('.trade-station').forEach(el => el.remove());
        const oldDialog = document.getElementById('trade-confirm');
        if (oldDialog) oldDialog.remove();
        this.tradeStations = [];
        this.tradeStation = null;

        // 支持 tradeStation（单个）或 tradeStations（数组）
        let configs = this.levelData.tradeStations || [];
        if (configs.length === 0 && this.levelData.tradeStation) {
            configs = [this.levelData.tradeStation];
        }
        if (configs.length === 0) return;

        configs.forEach((cfg, i) => {
            const ts = this._createTradeStation(cfg, i);
            this.tradeStations.push(ts);
        });

        // 多交易站布局：沿右侧纵向排列，居中于合成区中部（门底到物品栏顶之间）
        if (this.tradeStations.length > 1) {
            const n = this.tradeStations.length;
            const scale = n >= 3 ? 0.82 : 1;
            const stationH = 72 * scale;
            let gap = n >= 3 ? 18 : 22;
            if (this.levelId === 105 && n >= 3) gap = 56;
            const totalH = n * stationH + (n - 1) * gap;
            const doorArea = document.getElementById('door-area');
            const invArea = document.getElementById('inventory-area');
            const synthArea = document.getElementById('synthesis-area');
            const synthRect = synthArea ? synthArea.getBoundingClientRect() : { top: 0, bottom: window.innerHeight };
            const doorBottom = doorArea ? doorArea.getBoundingClientRect().bottom : synthRect.top;
            let invTop = invArea ? invArea.getBoundingClientRect().top : synthRect.bottom;
            if (this.levelId === 105 && n >= 3) {
                const h = window.innerHeight || document.documentElement.clientHeight || 800;
                const row1 = h <= 600 ? 95 : (h <= 750 ? 105 : 110);
                const row2 = h <= 600 ? 185 : (h <= 750 ? 196 : 206);
                invTop -= Math.max(0, row2 - row1);
            }
            const midY = (doorBottom + invTop) / 2;
            const synthTop = synthRect.top;
            const offsetY = midY - synthTop - totalH / 2;
            this.tradeStations.forEach((ts, i) => {
                ts.el.style.top = `${offsetY + i * (stationH + gap)}px`;
                ts.el.style.transform = scale < 1 ? `scale(${scale})` : '';
                ts.el.style.transformOrigin = 'right center';
            });
        }

        // 向后兼容：单个时也挂到 this.tradeStation
        if (this.tradeStations.length === 1) {
            this.tradeStation = this.tradeStations[0];
        }
    }

Game.prototype._maybeShowTradeStationTutorial = function() {
        if (!window.TutorialGuide) return;
        if (localStorage.getItem('tut_tradeStation')) return;
        if (!this.tradeStations || this.tradeStations.length === 0) return;

        const firstTs = this.tradeStations[0].el;
        if (!firstTs) return;

        localStorage.setItem('tut_tradeStation', '1');

        setTimeout(() => {
            window.TutorialGuide.show({
                target: firstTs,
                text: '将物品放入/点击兑换台以兑换',
                position: 'bottom',
                padding: 8,
                borderRadius: 14
            });
        }, 600);
    }

    // 交易站断货 — 显示"断货"遮罩
Game.prototype._markSoldOut = function(ts) {
        ts.soldOut = true;
        ts.el.classList.add('trade-sold-out');
        const overlay = ts.overlay;
        if (overlay) {
            overlay.innerHTML = '<span class="trade-restock-title">断货</span>';
            overlay.classList.add('active');
        }
    }

Game.prototype.startTradeRestock = function(ts) {
        if (!ts) ts = this.tradeStation;
        if (!ts) return;

        // 如果有使用次数限制
        if (ts.maxUses !== Infinity) {
            ts.usesLeft--;
            if (ts.usesLeft <= 0) {
                this._markSoldOut(ts);
                return;
            }
        }

        ts.restocking = true;
        if (ts.restockTimeout) clearTimeout(ts.restockTimeout);

        const overlay = ts.overlay;
        const countdownEl = ts.countdownEl;
        const duration = 5;
        let remaining = duration;

        if (overlay) {
            overlay.classList.add('active');
            if (countdownEl) countdownEl.textContent = remaining;
        }

        const tick = () => {
            remaining--;
            if (remaining <= 0) {
                ts.restocking = false;
                if (overlay) overlay.classList.remove('active');
                ts.restockTimeout = null;
                return;
            }
            if (countdownEl) countdownEl.textContent = remaining;
            ts.restockTimeout = setTimeout(tick, 1000);
        };
        ts.restockTimeout = setTimeout(tick, 1000);
    }

Game.prototype._spawnTradeOutput = function(ts) {
        if (!ts) ts = this.tradeStation;
        const synthArea = document.getElementById('synthesis-area');
        const synthRect = synthArea.getBoundingClientRect();

        let spawnX, spawnY;
        if (ts.outputSlot) {
            const slotRect = ts.outputSlot.getBoundingClientRect();
            spawnX = slotRect.left - synthRect.left + slotRect.width / 2 - 25;
            spawnY = slotRect.top - synthRect.top + slotRect.height / 2 - 25;
        } else {
            const stationRect = ts.el.getBoundingClientRect();
            spawnX = stationRect.left - synthRect.left + stationRect.width / 2 - 25;
            spawnY = stationRect.top - synthRect.top + 20;
        }

        const newItem = this.createItemElement(ts.output);
        newItem.classList.add('new-item');
        newItem.style.position = 'absolute';
        newItem.style.left = spawnX + 'px';
        newItem.style.top = spawnY + 'px';
        newItem.style.transform = 'scale(0)';
        newItem.style.opacity = '0';
        newItem.style.transition = 'transform 0.4s cubic-bezier(0, 0, 0.2, 1.2), opacity 0.3s ease-out';
        newItem.style.zIndex = '15';
        synthArea.appendChild(newItem);

        requestAnimationFrame(() => {
            newItem.style.transform = 'scale(1)';
            newItem.style.opacity = '1';
        });

        this.synthesizedItems.add(ts.output);
        window.LevelManager.discoverItem(ts.output);
        this.checkDoorProgress(ts.output);
        this.checkLevelCompletion(ts.output, newItem);
        this.startTradeRestock(ts);

        const outputData = window.ITEMS[ts.output];
        if (outputData && outputData.isRecipeBook) {
            if (!localStorage.getItem('tut_recipeBook')) {
                localStorage.setItem('tut_recipeBook', '1');
                setTimeout(() => {
                    if (!window.TutorialGuide || window.TutorialGuide._active) return;
                    window.TutorialGuide.show({
                        target: newItem,
                        text: '发蓝光的物品拥有特殊能力\n长按它来激活',
                        position: 'bottom',
                        padding: 10,
                        borderRadius: 50
                    });
                }, 800);
            }
        }

        this._replenishInfiniteItem(ts.input);
    }

Game.prototype._findItemTradeStation = function(itemName) {
        if (!this.tradeStations) return null;
        return this.tradeStations.find(ts =>
            ts.type === 'item' && !ts.restocking && !ts.soldOut && ts.input === itemName
        ) || null;
    }

    // 执行物品交易（拖拽到交易台时的兼容入口）
Game.prototype.executeTrade = function(itemEl) {
        if (itemEl.classList.contains('brewing-item')) return false;
        const itemName = itemEl.dataset.name;
        const ts = this._findItemTradeStation(itemName);

        if (!ts) {
            if (this.tradeStations) {
                this.tradeStations.forEach(s => {
                    if (s.type === 'item' && !s.soldOut) {
                        s.box.classList.add('trade-wrong');
                        setTimeout(() => s.box.classList.remove('trade-wrong'), 500);
                    }
                });
            }
            return false;
        }

        if (window.AudioManager) window.AudioManager.playSFX('trade');
        this._animateInputToSlot(itemEl, ts, () => this._spawnTradeOutput(ts));
        return true;
    }

    // 交易确认弹窗（统一物品/钻石）
Game.prototype.showTradeConfirm = function(ts) {
        if (ts.restocking || ts.soldOut) return;

        const old = document.getElementById('trade-confirm');
        if (old) old.remove();

        const isGem = ts.type === 'gem';
        const outputItem = window.ITEMS[ts.output] || {};

        let inputLabel, canTrade, noteText = '';
        if (isGem) {
            const gems = window.LevelManager.getGems();
            const _cdSvg = (window.ITEM_SVGS && window.ITEM_SVGS['_diamond']);
            inputLabel = _cdSvg ? `${ts.cost} <span class="confirm-gem-svg">${_cdSvg}</span>` : `${ts.cost} 💎`;
            canTrade = gems >= ts.cost;
            if (!canTrade) noteText = `钻石不足 (${gems}/${ts.cost})`;
        } else {
            const inputItem = window.ITEMS[ts.input] || {};
            const _ciSvg = window.ITEM_SVGS && window.ITEM_SVGS[ts.input];
            inputLabel = _ciSvg
                ? `<span class="confirm-item-svg">${_ciSvg}</span> ${inputItem.name || ts.input}`
                : `${inputItem.icon || '?'} ${inputItem.name || ts.input}`;
            const hasItem = !!document.querySelector(`.game-item[data-name="${ts.input}"]`);
            canTrade = hasItem;
            if (!canTrade) noteText = `缺少${inputItem.name || ts.input}`;
        }

        const _coSvg = window.ITEM_SVGS && window.ITEM_SVGS[ts.output];
        const outputLabel = _coSvg
            ? `<span class="confirm-item-svg">${_coSvg}</span> ${outputItem.name || ts.output}`
            : `${outputItem.icon || '?'} ${outputItem.name || ts.output}`;

        const dialog = document.createElement('div');
        dialog.id = 'trade-confirm';
        dialog.className = 'trade-confirm-overlay';
        dialog.innerHTML = `
            <div class="trade-confirm-backdrop"></div>
            <div class="trade-confirm-box">
                <div class="trade-confirm-text">
                    确认用 <span class="trade-confirm-input-name">${inputLabel}</span>
                    兑换 <span class="trade-confirm-output-name">${outputLabel}</span> 吗？
                </div>
                <div class="trade-confirm-btns">
                    <button class="trade-confirm-cancel">取消</button>
                    <button class="trade-confirm-ok ${canTrade ? '' : 'disabled'}">确认</button>
                </div>
                ${noteText ? `<div class="trade-confirm-note">${noteText}</div>` : ''}
            </div>
        `;
        document.body.appendChild(dialog);

        const dismiss = (playExitSound = true) => {
            if (playExitSound && window.AudioManager) window.AudioManager.playClickExit();
            dialog.remove();
        };
        dialog.querySelector('.trade-confirm-cancel').addEventListener('click', () => dismiss(true));
        dialog.querySelector('.trade-confirm-backdrop').addEventListener('click', () => dismiss(true));

        if (canTrade) {
            dialog.querySelector('.trade-confirm-ok').addEventListener('click', () => {
                dismiss(false);
                this._executeTradeAnimated(ts);
            });
        }
    }

    // 执行交易（带动画）
Game.prototype._executeTradeAnimated = function(ts) {
        const isGem = ts.type === 'gem';

        if (isGem) {
            window.LevelManager.addGems(-ts.cost);
            this.updateGemDisplay(true);
        }

        if (window.AudioManager) window.AudioManager.playSFX('trade');

        if (!isGem) {
            const itemEl = document.querySelector(`.game-item[data-name="${ts.input}"]`);
            if (itemEl) {
                this._animateInputToSlot(itemEl, ts, () => this._spawnTradeOutput(ts));
                return;
            }
        }

        this._spawnTradeOutput(ts);
    }

    // 输入物品飞向交易台左侧圆圈的动画
Game.prototype._animateInputToSlot = function(itemEl, ts, onDone) {
        const slotRect = ts.inputSlot.getBoundingClientRect();
        const itemRect = itemEl.getBoundingClientRect();

        const clone = itemEl.cloneNode(true);
        clone.style.position = 'fixed';
        clone.style.left = itemRect.left + 'px';
        clone.style.top = itemRect.top + 'px';
        clone.style.width = itemRect.width + 'px';
        clone.style.height = itemRect.height + 'px';
        clone.style.zIndex = '200';
        clone.style.pointerEvents = 'none';
        clone.style.transition = 'all 0.45s cubic-bezier(0.4, 0, 0.2, 1)';
        document.body.appendChild(clone);

        itemEl.remove();
        this.updateInventoryLayout();

        requestAnimationFrame(() => {
            const targetX = slotRect.left + slotRect.width / 2 - itemRect.width / 2;
            const targetY = slotRect.top + slotRect.height / 2 - itemRect.height / 2;
            clone.style.left = targetX + 'px';
            clone.style.top = targetY + 'px';
            clone.style.transform = 'scale(0.4)';
            clone.style.opacity = '0.2';
        });

        setTimeout(() => {
            clone.remove();
            if (onDone) onDone();
        }, 500);
    }
