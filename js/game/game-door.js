/** @feature door-offering @see docs/features/door-offering.md */

Game.prototype._getDoorRect = function() {
        const door = document.getElementById('door-container');
        if (!door) return null;
        return door.getBoundingClientRect();
    }

Game.prototype._calcDuration = function(text) {
        return Math.min(Math.max(text.length * 280, 3000), 7000);
    }

Game.prototype._splitDialogText = function(text, maxLen = 20) {
        if (text.length <= maxLen) return [text];
        const chunks = [];
        const puncts = /([，。！？、；：…—])/;
        let remaining = text;
        while (remaining.length > maxLen) {
            let cutAt = -1;
            for (let i = Math.min(maxLen, remaining.length) - 1; i >= Math.floor(maxLen * 0.5); i--) {
                if (puncts.test(remaining[i])) { cutAt = i + 1; break; }
            }
            if (cutAt === -1) cutAt = maxLen;
            chunks.push(remaining.slice(0, cutAt));
            remaining = remaining.slice(cutAt);
        }
        if (remaining) chunks.push(remaining);
        return chunks;
    }

Game.prototype._dialogSide = null;

Game.prototype._pickBubbleSide = function() {
        const doorRect = this._getDoorRect();
        if (!doorRect) return Math.random() < 0.5 ? 'left' : 'right';
        const screenW = window.innerWidth;
        const spaceRight = screenW - doorRect.right;
        const spaceLeft = doorRect.left;
        const minUsable = 90;
        const canRight = spaceRight >= minUsable;
        const canLeft = spaceLeft >= minUsable;
        if (canRight && canLeft) {
            return Math.random() < 0.5 ? 'left' : 'right';
        }
        return canRight ? 'right' : 'left';
    }

Game.prototype.showDoorBubble = function(text) {
        const doorRect = this._getDoorRect();
        const gameArea = document.querySelector('.game-container') || document.body;
        if (!doorRect) return null;

        const side = this._pickBubbleSide();
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const pad = 6;
        const gap = 16 + Math.random() * 10;

        let availW;
        if (side === 'right') {
            availW = screenW - doorRect.right - gap - pad;
        } else {
            availW = doorRect.left - gap - pad;
        }
        availW = Math.max(availW, 80);
        const maxW = Math.min(300, screenW * 0.44, availW);

        const bubble = document.createElement('div');
        bubble.className = 'door-bubble';
        bubble.classList.add(side === 'left' ? 'tail-right' : 'tail-left');
        bubble.textContent = text;
        bubble.style.maxWidth = maxW + 'px';

        gameArea.appendChild(bubble);

        const bw = bubble.offsetWidth;
        const bh = bubble.offsetHeight;

        const yRange = Math.max(doorRect.height * 0.7, 60);
        const yCenterBase = doorRect.top + doorRect.height * 0.45;
        const yJitter = (Math.random() - 0.5) * yRange;
        let y = yCenterBase - bh / 2 + yJitter;

        let x;
        if (side === 'right') {
            x = doorRect.right + gap;
        } else {
            x = doorRect.left - bw - gap;
        }

        x = Math.max(pad, Math.min(x, screenW - bw - pad));
        y = Math.max(pad, Math.min(y, screenH - bh - pad));

        bubble.style.left = x + 'px';
        bubble.style.top = y + 'px';

        const dur = this._calcDuration(text);
        setTimeout(() => {
            bubble.classList.add('fade-out');
            setTimeout(() => bubble.remove(), 900);
        }, dur);

        return bubble;
    }

Game.prototype.showDialog = function(text) {
        const lines = this._splitDialogText(text);
        let chain = Promise.resolve();
        for (const line of lines) {
            chain = chain.then(() => new Promise(resolve => {
                this.showDoorBubble(line);
                const dur = this._calcDuration(line);
                this._dialogTimer = setTimeout(() => {
                    this._dialogTimer = null;
                    resolve();
                }, dur);
            }));
        }
        return chain;
    }

Game.prototype.showTriggerDialog = function(text) {
        const lines = this._splitDialogText(text);
        for (const line of lines) {
            this.showDoorBubble(line);
        }
    }

Game.prototype.dismissAllDialogs = function() {
        return new Promise(resolve => {
            if (this._dialogTimer) {
                clearTimeout(this._dialogTimer);
                this._dialogTimer = null;
            }
            this._dialogSide = null;
            document.querySelectorAll('.door-bubble:not(.fade-out)').forEach(b => {
                b.classList.add('fade-out');
            });
            setTimeout(() => {
                document.querySelectorAll('.door-bubble').forEach(b => b.remove());
                this.dialogActive = false;
                resolve();
            }, 900);
        });
    }

    // ========== 门点击交互 ==========
Game.prototype._doorClickLines = {
        101: { hints: [], chat: [] },
        102: {
            hints: ['鲜奶发酵成酸奶，滤布收成酪。'],
            chat: ['...', '别乱碰。', '老老实实做出奶酪。']
        },
        103: {
            hints: ['四种，我全都要。'],
            chat: ['...', '还没齐呢。', '别偷懒。']
        },
        104: {
            hints: ['也许跟它的名字有关。'],
            chat: ['...', '自己想。', '别看我。']
        },
        105: {
            hints: ['翻翻配方书。'],
            chat: ['...', '花挑错了可不行。', '别浪费珠宝。']
        },
        106: {
            hints: ['在考试呢，想什么呢。'],
            chat: ['...', '这是最后一关了。', '步骤不少。', '冷静。']
        },
        _default: {
            hints: [],
            chat: ['...', '嗯？', '别戳了。', '有事？', '去合成。']
        }
    };

Game.prototype._doorClickCooldown = 0;
Game.prototype._doorClickChatIdx = 0;

Game.prototype._initDoorClickHandler = function() {
        const dc = document.getElementById('door-container');
        if (!dc) return;
        if (dc._doorClickBound) return;
        dc._doorClickBound = true;

        dc.addEventListener('click', (e) => {
            if (this.isTransitioning) return;
            if (this.dialogActive) return;

            this._emitDoorWave(dc);

            const now = Date.now();
            if (now - this._doorClickCooldown < 4000) return;
            this._doorClickCooldown = now;

            this._showDoorClickLine();
        });
    }

Game.prototype._emitDoorWave = function(dc) {
        const wave = document.createElement('div');
        wave.className = 'door-click-wave';
        dc.appendChild(wave);
        setTimeout(() => wave.remove(), 1600);
    }

    /** 逼近目标：光波 + 门框成熟梯度（边缘更亮、纹样递进到 data-synth-maturity） */
Game.prototype._onDoorSynthProgressPulse = function(dc) {
        if (!dc) return;
        this._emitDoorWave(dc);
        const max = Game.DOOR_SYNTH_MATURITY_MAX;
        let n = parseInt(dc.dataset.synthMaturity, 10) || 0;
        if (n < max) dc.dataset.synthMaturity = String(n + 1);
    }

    /** 合成产物相对当前关卡目标更近时，门泛起光波（与点击门同款动画） */
Game.prototype._maybeEmitDoorWaveOnSynthProgress = function(resultName, ing1, ing2) {
        if (this.isFreeMode || !resultName || !ing1 || !ing2) return;
        if (this.levelData?.isSpecialArea) return;

        const INF = 1e9;
        const distOf = (map, name) => (map.has(name) ? map.get(name) : INF);

        if (this.isDualDoor && this.doorStates && this.doorStates.length) {
            this.doorStates.forEach(ds => {
                if (ds.done || !ds.target || !ds.container) return;
                const dm = Game.getStepsToTargetsDistMapCached([ds.target]);
                const dRes = distOf(dm, resultName);
                const inputBest = Math.min(distOf(dm, ing1), distOf(dm, ing2));
                if (dRes < inputBest && dRes < INF) this._onDoorSynthProgressPulse(ds.container);
            });
            return;
        }

        const goals = [];
        if (this._multiTargetState) {
            this._multiTargetState.targets.forEach(t => {
                if (!this._multiTargetState.completed.includes(t)) goals.push(t);
            });
        } else if (this.levelData?.target) {
            goals.push(this.levelData.target);
        }
        if (!goals.length) return;

        const dm = Game.getStepsToTargetsDistMapCached(goals);
        const dRes = distOf(dm, resultName);
        const inputBest = Math.min(distOf(dm, ing1), distOf(dm, ing2));
        if (dRes >= inputBest || dRes >= INF) return;

        const dc = document.getElementById('door-container');
        if (dc) this._onDoorSynthProgressPulse(dc);
    }

Game.prototype._showDoorClickLine = function() {
        const lines = this._doorClickLines[this.levelId] || this._doorClickLines._default;
        const pool = [...lines.hints, ...lines.chat];
        if (pool.length === 0) return;

        const idx = this._doorClickChatIdx % pool.length;
        this._doorClickChatIdx++;
        this.showDoorBubble(pool[idx]);
    }

/* multi-target door */

Game.prototype._hideTargetDisplay = function() {
        const el = document.querySelector('.level-target-display');
        if (el) el.style.display = 'none';
    }

Game.prototype._showTargetDisplay = function() {
        const el = document.querySelector('.level-target-display');
        if (el) el.style.display = '';
    }

Game.prototype.updateTargetDisplay = function(targetName, isFreeMode = false) {
        const targetNameEl = document.getElementById('target-name');
        const targetLabelEl = document.querySelector('.level-target-display .target-label');
        
        if (isFreeMode) {
            if (targetNameEl) targetNameEl.textContent = '发现新配方';
            if (targetLabelEl) targetLabelEl.textContent = '自由';
        } else if (targetName) {
            if (targetNameEl) targetNameEl.textContent = targetName;
            if (targetLabelEl) targetLabelEl.textContent = '目标';
        }
    }

Game.prototype._initMultiTarget = function(doorIcon, showTarget) {
        const targets = this.levelData.multiTargets || [];
        this._multiTargetState = {
            targets: targets.slice(),
            completed: [],
            cycleIndex: 0,
            cycleTimer: null,
            allDoneTriggered: false,
            resumeToken: 0
        };

        // Add quadrant overlays to door
        const doorGlow = document.querySelector('#door-container .door-glow');
        if (doorGlow && !doorGlow.querySelector('.door-quadrants')) {
            const qContainer = document.createElement('div');
            qContainer.className = 'door-quadrants';
            for (let i = 0; i < targets.length; i++) {
                const q = document.createElement('div');
                q.className = 'door-quadrant';
                q.dataset.index = i;
                qContainer.appendChild(q);
            }
            doorGlow.appendChild(qContainer);
        }

        // Show multi-target display
        if (showTarget) {
            this._updateMultiTargetDisplay();
        }

        // Start cycling door icon
        if (doorIcon && showTarget) {
            this._startMultiTargetCycle(doorIcon);
        }
    }

Game.prototype._updateMultiTargetDisplay = function() {
        const targetNameEl = document.getElementById('target-name');
        const targetLabelEl = document.querySelector('.level-target-display .target-label');
        if (!targetNameEl) return;

        if (targetLabelEl) targetLabelEl.textContent = '目标';

        const targets = this._multiTargetState.targets;
        const completed = this._multiTargetState.completed;

        let html = '';
        targets.forEach((t, i) => {
            const done = completed.includes(t);
            html += `<span class="multi-target-item ${done ? 'mt-done' : ''}" data-target="${t}">`;
            html += `<span class="mt-num">${i + 1}.</span><span class="mt-name">${t}</span>`;
            html += `</span>`;
            if (i < targets.length - 1) html += '<br>';
        });
        targetNameEl.innerHTML = html;
    }

Game.prototype._startMultiTargetCycle = function(doorIcon) {
        if (this._multiTargetState.cycleTimer) {
            clearInterval(this._multiTargetState.cycleTimer);
        }

        const remaining = () => this._multiTargetState.targets.filter(
            t => !this._multiTargetState.completed.includes(t)
        );

        const showNext = () => {
            const rem = remaining();
            if (rem.length === 0) return;

            this._multiTargetState.cycleIndex = (this._multiTargetState.cycleIndex + 1) % rem.length;
            const nextTarget = rem[this._multiTargetState.cycleIndex % rem.length];
            const nextItem = window.ITEMS[nextTarget] || {};

            doorIcon.classList.add('icon-fade-out');
            setTimeout(() => {
                Game.setIconContent(doorIcon, nextTarget);
                doorIcon.classList.remove('icon-fade-out');
                doorIcon.classList.add('icon-fade-in');
                setTimeout(() => doorIcon.classList.remove('icon-fade-in'), 350);
            }, 300);
        };

        // Show first icon immediately
        const rem = remaining();
        if (rem.length > 0) {
            Game.setIconContent(doorIcon, rem[0]);
        }

        this._multiTargetState.cycleTimer = setInterval(showNext, 2500);
    }

Game.prototype._stopMultiTargetCycle = function() {
        if (this._multiTargetState && this._multiTargetState.cycleTimer) {
            clearInterval(this._multiTargetState.cycleTimer);
            this._multiTargetState.cycleTimer = null;
        }
    }

Game.prototype.handleMultiTargetComplete = function(targetName, synthAreaEl) {
        if (!this._multiTargetState) return false;
        if (this._multiTargetState.allDoneTriggered) return false;
        const { targets, completed } = this._multiTargetState;
        if (!targets.includes(targetName) || completed.includes(targetName)) return false;

        completed.push(targetName);
        this._multiTargetState.resumeToken = (this._multiTargetState.resumeToken || 0) + 1;
        const resumeTok = this._multiTargetState.resumeToken;
        const idx = targets.indexOf(targetName);
        const doorContainer = document.getElementById('door-container');
        const doorIcon = document.getElementById('door-icon');

        // 1. Pause cycling, show completed item clearly
        this._stopMultiTargetCycle();

        if (doorIcon) {
            Game.setIconContent(doorIcon, targetName);
            doorIcon.classList.add('mt-clear');
        }

        // 2. Door flash
        if (doorContainer) {
            doorContainer.classList.add('multi-target-flash');
            setTimeout(() => doorContainer.classList.remove('multi-target-flash'), 1300);
        }

        // 3. Light up quadrant
        setTimeout(() => {
            const quad = document.querySelector(`.door-quadrant[data-index="${idx}"]`);
            if (quad) quad.classList.add('lit');
        }, 600);

        // 4. Update target display
        this._updateMultiTargetDisplay();

        // 4.5. Show progress bubble "x/total"
        const total = targets.length;
        const done = completed.length;
        if (done < total) {
            this.showDoorBubble(`${done}/${total}`);
        }

        // 5. After flash, resume cycling or complete（resumeToken 作废旧延迟，避免多次酿造时误判「已全部完成」）
        setTimeout(() => {
            if (!this._multiTargetState || this._multiTargetState.resumeToken !== resumeTok) return;
            if (this._multiTargetState.allDoneTriggered) return;
            if (doorIcon) doorIcon.classList.remove('mt-clear');

            const { targets: T, completed: C } = this._multiTargetState;
            const remaining = T.filter(t => !C.includes(t));
            if (remaining.length === 0) {
                this._multiTargetState.allDoneTriggered = true;
                this._multiTargetAllDone(synthAreaEl);
            } else {
                if (doorIcon) this._startMultiTargetCycle(doorIcon);
            }
        }, 2000);

        return true;
    }

Game.prototype._multiTargetAllDone = function(synthAreaEl) {
        if (this.isTransitioning) return;
        this.targetReady = true;
        this.updateDoorStage(3);

        const doorContainer = document.getElementById('door-container');
        if (!doorContainer) return;

        const doorIcon = document.getElementById('door-icon');
        if (doorIcon) Game.setIconContent(doorIcon, this.levelData.target, '🍶');

        // Save door rect for gem animation
        const doorRect = doorContainer.getBoundingClientRect();
        this._lastDoorRect = { left: doorRect.left, top: doorRect.top, width: doorRect.width, height: doorRect.height };

        if (window.AudioManager) window.AudioManager.playSFX('door-absorb');

        const proceed = () => {
            if (this.hasNextObjective()) {
                // Skip the star-fly and go directly to close + golden glow
                this.isTransitioning = true;
                this.warmthLevel = (this.warmthLevel || 0) + 1;

                doorContainer.classList.add('star-entering');
                setTimeout(() => {
                    doorContainer.classList.remove('star-entering');
                    doorContainer.classList.add('closing', 'closed');
                    document.body.classList.remove('warmth-1', 'warmth-2', 'warmth-3', 'warmth-4', 'warmth-5');
                    document.body.classList.add(`warmth-${Math.min(this.warmthLevel, 5)}`);
                    setTimeout(() => this.performGoldenGlowTransition(), 300);
                }, 400);
            } else {
                doorContainer.classList.add('offering');
                setTimeout(() => {
                    doorContainer.classList.remove('offering');
                    window.LevelManager.completeLevel(this.levelId);
                    if (this.levelId === 106) {
                        this.showChapter1AtlasRewardScreen();
                    } else {
                        this.showSuccessModal();
                    }
                }, 600);
            }
        };

        const runAfterBadges = () => {
            const delayedProceed = () => setTimeout(proceed, 2200);
            if (this.levelData.completionDialogs && this.levelData.completionDialogs.length > 0) {
                this.playCompletionDialogs().then(delayedProceed);
            } else {
                delayedProceed();
            }
        };

        this.showCompletionBadgesOverlay().then(runAfterBadges);
    }
