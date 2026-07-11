/** @feature game-layout @see docs/features/game-layout.md */

Game.prototype.showLevelIntro = function() {
        return new Promise(resolve => {
            const ld = this.levelData;
            if (!ld || !ld.name) { resolve(); return; }

            const existing = document.getElementById('level-intro-overlay');
            if (existing) existing.remove();

            const overlay = document.createElement('div');
            overlay.id = 'level-intro-overlay';
            overlay.className = 'level-intro-overlay';

            const levelNum = (ld.objectiveIndex != null) ? ld.objectiveIndex + 1 : '';
            const displayName = levelNum ? `第${levelNum}关 · ${ld.name}` : ld.name;
            const targetText = ld.target ? `目标：${ld.target}` : '';
            const descText = ld.description || ld.storyIntro || '';

            overlay.innerHTML = `
                <div class="level-intro-content">
                    <div class="intro-level-name">${displayName}</div>
                    <div class="intro-separator"></div>
                    ${targetText ? `<div class="intro-target">${targetText}</div>` : ''}
                    ${descText ? `<div class="intro-desc">${descText}</div>` : ''}
                    <div class="intro-tip">点击任意处继续</div>
                </div>
            `;

            document.body.appendChild(overlay);
            overlay.offsetHeight;

            requestAnimationFrame(() => {
                overlay.classList.add('visible');
            });

            const dismiss = () => {
                overlay.classList.remove('visible');
                overlay.classList.add('fade-out');
                setTimeout(() => {
                    overlay.remove();
                    resolve();
                }, 600);
            };

            setTimeout(() => {
                const onClick = () => {
                    overlay.removeEventListener('click', onClick);
                    clearTimeout(autoTimer);
                    if (window.AudioManager) window.AudioManager.playClickOpen();
                    dismiss();
                };
                overlay.addEventListener('click', onClick);
                const autoTimer = setTimeout(() => {
                    overlay.removeEventListener('click', onClick);
                    dismiss();
                }, 3600);
            }, 800);
        });
    }

Game.prototype.initUI = function() {
        this.doorStates = [];
        const alreadyHasBook = (window.LevelManager.currentProgress.discoveredItems || []).includes('配方书');
        this._recipeBookPhaseActive = !!this.levelData.recipeBookPhase && !alreadyHasBook;
        const doorRow = document.getElementById('door-row');

        if (this.levelData.isSpecialArea) {
            doorRow.style.display = 'none';
        } else if (this.levelData.doors && this.levelData.doors.length > 1) {
            this.isDualDoor = true;
            doorRow.classList.add('dual-doors');
            this.initDualDoors();
        } else {
            this.isDualDoor = false;
            const showTarget = !this._recipeBookPhaseActive;
            const doorIcon = document.getElementById('door-icon');

            if (this.levelData.multiTarget) {
                this._initMultiTarget(doorIcon, showTarget);
            } else {
                if (doorIcon) {
                    if (showTarget && this.levelData.target) {
                        Game.setIconContent(doorIcon, this.levelData.target);
                    } else {
                        doorIcon.textContent = '';
                    }
                }
                if (showTarget && this.levelData.target) {
                    this.updateTargetDisplay(this.levelData.target);
                }
            }

            if (this._recipeBookPhaseActive) {
                this._hideTargetDisplay();
            }
            this.doorStates.push({
                idx: 0,
                target: this.levelData.target,
                stage: 0,
                done: false,
                container: document.getElementById('door-container'),
                wrapper: document.getElementById('door-wrapper-0')
            });
        }

        const levelNameEl = document.getElementById('level-name');
        if (levelNameEl) levelNameEl.textContent = this.levelData.name;

        const synthesisArea = document.getElementById('synthesis-area');
        if (synthesisArea) {
            synthesisArea.innerHTML = '';
        }

        if (this._recipeBookPhaseActive) {
            // Phase 1: no items, no trade station, inventory empty
            const inventory = document.getElementById('inventory-area');
            if (inventory) inventory.innerHTML = '';
            this.updateInventoryLayout();
        } else {
            this.initInventory();
            if (!this.levelData.isSpecialArea) {
                this.initTradeStation();
            }
        }
        this.initGemDisplay();
        this.updateIdentityPlaque();
        this._autoShowRecipeBook();

        const backBtn = document.getElementById('back-btn');
        if (backBtn && window.LevelManager && window.LevelManager.hasAnyClaimableTask()) {
            if (!backBtn.querySelector('.claimable-dot')) {
                const dot = document.createElement('span');
                dot.className = 'claimable-dot';
                backBtn.appendChild(dot);
            }
        }
        backBtn.addEventListener('click', () => {
            if (window.AudioManager) {
                window.AudioManager.playClickBack();
                window.AudioManager.stopBGM();
            }
            // 标记玩家已从游戏中退出（第一次退出时）
            if (!localStorage.getItem('tut_first_exit_game')) {
                localStorage.setItem('tut_first_exit_game', '1');
            }
            const worldId = this.levelData.worldId || 1;
            const url = `levels.html?world=${worldId}`;
            if (window.navigateTo) window.navigateTo(url);
            else window.location.href = url;
        });

        this._initDoorClickHandler();

        if (this.levelData.isTutorial) {
            this.showTutorialHint();
        }
        
        if (this.levelData.levelHints && this.levelData.levelHints.length > 0) {
            this.showLevelHints();
        }

        if (!this._skipPostInit) {
            if (!this.levelData.isSpecialArea && !this._recipeBookPhaseActive) {
                setTimeout(() => this.flashTargetDisplay(), 400);
            }
            this._playLevelDialogs();
            this._setupChapterSynthTimers();
        }
    }

Game.prototype.flashTargetDisplay = function() {
        document.querySelectorAll('.level-target-display').forEach(el => {
            el.classList.remove('target-entry-pulse');
            el.offsetHeight;
            el.classList.add('target-entry-pulse');
            el.addEventListener('animationend', () => el.classList.remove('target-entry-pulse'), { once: true });
        });
    }

Game.prototype.initDualDoors = function() {
        const doorRow = document.getElementById('door-row');
        // 清空默认的单门 wrapper
        doorRow.innerHTML = '';

        this.levelData.doors.forEach((doorCfg, idx) => {
            const targetItem = window.ITEMS[doorCfg.target];
            const wrapper = document.createElement('div');
            wrapper.className = 'door-wrapper';
            wrapper.id = 'door-wrapper-' + idx;
            wrapper.innerHTML = `
                <div class="door-container stage-0" id="door-container-${idx}">
                    <div class="door-aura"></div>
                    <div class="door-frame">
                        <div class="door-glow">
                            <div class="door-fog"></div>
                            <div class="door-target-silhouette" id="door-icon-${idx}"></div>
                        </div>
                    </div>
                    <div class="door-offer-hint">献上</div>
                </div>
                <div class="level-info">
                    <div class="level-target-display">
                        <span class="target-label">目标</span>
                        <span class="target-name">${doorCfg.target}</span>
                    </div>
                </div>
            `;
            doorRow.appendChild(wrapper);
            const dualDoorIcon = document.getElementById(`door-icon-${idx}`);
            Game.setIconContent(dualDoorIcon, doorCfg.target, doorCfg.icon || '?');

            this.doorStates.push({
                idx,
                target: doorCfg.target,
                doorTriggers: doorCfg.doorTriggers,
                stage: 0,
                done: false,
                discoveredTriggers: new Set(),
                container: null,
                wrapper: null
            });
        });

        // 缓存 DOM 引用
        this.doorStates.forEach((ds, idx) => {
            ds.container = document.getElementById('door-container-' + idx);
            ds.wrapper = document.getElementById('door-wrapper-' + idx);
        });
    }

Game.prototype.showLevelHints = function() {
        const hints = this.levelData.levelHints;
        let hintIndex = 0;
        
        // 先显示第一条提示（延迟3秒）
        setTimeout(() => {
            this.showToast('💡 ' + hints[hintIndex], 5000);
            hintIndex++;
        }, 3000);
        
        // 之后每隔15秒显示下一条提示（如果玩家还没通关）
        this.levelHintInterval = setInterval(() => {
            if (hintIndex < hints.length) {
                this.showToast('💡 ' + hints[hintIndex], 5000);
                hintIndex++;
            } else {
                // 循环回到第一条
                hintIndex = 0;
            }
        }, 15000);
    }
