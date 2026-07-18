/** @feature chapter-flow @see docs/features/chapter-flow.md */

Game.prototype._setupChapterSynthTimers = function() {
        if (this.isFreeMode) return;
        if (this.levelId !== 102) return;
        this._lvl102HintsMuted = false;
        this._lvl102HintTimer = null;
        this._lvl102PointerMuteBound = () => this._lvl102OnPointerMuteScreen();
        window.addEventListener('pointermove', this._lvl102PointerMuteBound, { passive: true });
    }

Game.prototype._lvl102OnPointerMuteScreen = function() {
        if (this.levelId !== 102) return;
        if (!this.synthesizedItems.has('酸奶') || this.synthesizedItems.has('奶酪')) return;
        this._lvl102HintsMuted = true;
        if (this._lvl102HintTimer) {
            clearTimeout(this._lvl102HintTimer);
            this._lvl102HintTimer = null;
        }
    }

Game.prototype._clearLvl102SecondStepHints = function() {
        if (this._lvl102HintTimer) {
            clearTimeout(this._lvl102HintTimer);
            this._lvl102HintTimer = null;
        }
        if (this._lvl102PointerMuteBound) {
            window.removeEventListener('pointermove', this._lvl102PointerMuteBound);
            this._lvl102PointerMuteBound = null;
        }
    }

Game.prototype._scheduleLvl102SecondStepHints = function() {
        // 合成后自动弹出的提示对白已关闭。
    }

Game.prototype._clearLvl104DualHints = function() {
        if (this._lvl104DualHintTimer) {
            clearTimeout(this._lvl104DualHintTimer);
            this._lvl104DualHintTimer = null;
        }
        this._lvl104AwaitDual = false;
    }

Game.prototype._scheduleLvl104DualCheeseHints = function() {
        // 合成后自动弹出的提示对白已关闭。
    }

Game.prototype._chapterSynthHooksAfterSuccess = function(resultName) {
        if (this.isFreeMode) return;

        if (this.levelId === 102) {
            this._lvl102HintsMuted = false;
            if (resultName === '奶酪') {
                this._clearLvl102SecondStepHints();
            } else {
                this._scheduleLvl102SecondStepHints();
            }
        }

        if (this.levelId === 104) {
            if (resultName === '雪酪') {
                this._lvl104AwaitDual = true;
            }
            if (resultName === '双酪') {
                this._clearLvl104DualHints();
            } else if (this._lvl104AwaitDual) {
                this._scheduleLvl104DualCheeseHints();
            }
        }
    }

Game.prototype._chapterSynthHooksAfterFailedAttempt = function() {
        if (this.isFreeMode) return;
        if (this.levelId === 102) {
            this._lvl102HintsMuted = false;
            this._scheduleLvl102SecondStepHints();
        }
        if (this.levelId === 104 && this._lvl104AwaitDual) {
            this._scheduleLvl104DualCheeseHints();
        }
    }

Game.prototype.hasNextObjective = function() {
        if (!this.chapterData) return false;
        return this.objectiveIndex < this.chapterData.objectives.length - 1;
    }

Game.prototype.getNextObjectiveLevelId = function() {
        if (!this.hasNextObjective()) return null;
        return this.chapterData.objectives[this.objectiveIndex + 1];
    }

Game.prototype.getTransitionText = function() {
        if (!this.chapterData || !this.chapterData.transitionTexts) return '';
        return this.chapterData.transitionTexts[this.objectiveIndex] || '';
    }

Game.prototype.transitionToNextObjective = function() {
        const nextLevelId = this.getNextObjectiveLevelId();
        if (!nextLevelId) return;
        
        const nextLevelData = window.LevelManager.getLevelData(nextLevelId);
        if (!nextLevelData) return;
        
        // 保存当前目标进度
        window.LevelManager.saveObjectiveProgress(this.chapterId, this.objectiveIndex);
        
        // 更新内部状态
        this.levelId = nextLevelId;
        this.levelData = nextLevelData;
        this.objectiveIndex = nextLevelData.objectiveIndex;
        
        // 重置游戏状态
        this.doorStage = 0;
        this.discoveredTriggers = new Set();
        this.synthesizedItems = new Set();
        this.targetReady = false;
        this._firedTriggers = new Set();
        
        // 清理提示计时器
        if (this.levelHintInterval) {
            clearInterval(this.levelHintInterval);
            this.levelHintInterval = null;
        }
        
        // 重新初始化UI（不重新绑定事件）
        this.refreshUIForNextObjective();
    }

Game.prototype.refreshUIForNextObjective = function() {
        const _hasBook = (window.LevelManager.currentProgress.discoveredItems || []).includes('配方书');
        this._recipeBookPhaseActive = !!this.levelData.recipeBookPhase && !_hasBook;
        const hideTarget = this._recipeBookPhaseActive;

        const doorIcon = document.getElementById('door-icon');
        const doorContainer = document.getElementById('door-container');
        if (doorContainer) {
            Game.resetDoorSynthMaturity(doorContainer);
            doorContainer.className = 'door-container stage-0';
            const oldQuads = doorContainer.querySelector('.door-quadrants');
            if (oldQuads) oldQuads.remove();
        }
        this._stopMultiTargetCycle();
        this._multiTargetState = null;

        if (this.levelData.multiTarget && !hideTarget) {
            this._initMultiTarget(doorIcon, true);
        } else {
            if (doorIcon) {
                if (hideTarget) {
                    doorIcon.textContent = '';
                } else {
                    Game.setIconContent(doorIcon, this.levelData.target);
                }
            }
        }
        
        const levelName = document.getElementById('level-name');
        if (levelName) levelName.textContent = this.levelData.name;

        if (hideTarget) {
            this._hideTargetDisplay();
        } else if (!this.levelData.multiTarget) {
            this.updateTargetDisplay(this.levelData.target);
        }
        
        const synthesisArea = document.getElementById('synthesis-area');
        if (synthesisArea) {
            synthesisArea.innerHTML = '';
        }
        
        if (hideTarget) {
            const inventory = document.getElementById('inventory-area');
            if (inventory) inventory.innerHTML = '';
            this.updateInventoryLayout();
        } else {
            this.initInventory();
        }
        
        this.startIdleTimer();
        this._autoShowRecipeBook();
        
        if (this.levelData.levelHints && this.levelData.levelHints.length > 0) {
            this.showLevelHints();
        }

        if (this._recipeBookPhaseActive) {
            this._playLevelDialogs();
        }
    }
