/** @feature recipe-book @see docs/features/recipe-book.md */

Game.prototype._spawnRecipeBookDirectly = function() {
        const synthArea = document.getElementById('synthesis-area');
        if (!synthArea) return;

        const itemName = '配方书';
        const newItem = this.createItemElement(itemName);
        newItem.style.position = 'absolute';
        newItem.style.left = '50%';
        newItem.style.top = '45%';
        newItem.style.transform = 'translate(-50%, -50%) scale(0)';
        newItem.style.opacity = '0';
        newItem.style.transition = 'transform 0.5s cubic-bezier(0, 0, 0.2, 1.2), opacity 0.4s ease-out';
        newItem.style.zIndex = '15';
        synthArea.appendChild(newItem);

        requestAnimationFrame(() => {
            newItem.style.transform = 'translate(-50%, -50%) scale(1)';
            newItem.style.opacity = '1';
        });

        window.LevelManager.discoverItem(itemName);

        if (!localStorage.getItem('tut_recipeBook')) {
            localStorage.setItem('tut_recipeBook', '1');
            setTimeout(() => {
                if (!window.TutorialGuide || window.TutorialGuide._active) return;
                window.TutorialGuide.show({
                    target: newItem,
                    text: '发<span style="color:#6cf;text-shadow:0 0 8px rgba(100,200,255,0.8),0 0 16px rgba(100,200,255,0.4)">蓝光</span>的物品拥有特殊能力<br>长按它来激活',
                    position: 'bottom',
                    padding: 10,
                    borderRadius: 50
                });
            }, 800);
        }
    }

Game.prototype._autoShowRecipeBook = function() {
        if (this._recipeBookPhaseActive) return;
        const discovered = window.LevelManager.currentProgress.discoveredItems || [];
        if (discovered.includes('配方书')) {
            this.showRecipeBookButton();
        }
    }

Game.prototype._revealRecipeBookPhase2 = function() {
        this._recipeBookPhaseActive = false;

        // Hide trade station
        if (this.tradeStations) {
            this.tradeStations.forEach(ts => {
                if (ts.el) {
                    ts.el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                    ts.el.style.opacity = '0';
                    ts.el.style.transform = 'translate(-50%, -50%) scale(0)';
                    setTimeout(() => ts.el.remove(), 500);
                }
            });
            this.tradeStations = [];
            this.tradeStation = null;
        }

        setTimeout(() => {
            const doorIcon = document.getElementById('door-icon');
            if (doorIcon) {
                Game.setIconContent(doorIcon, this.levelData.target);
                doorIcon.style.opacity = '0';
                doorIcon.offsetHeight;
                doorIcon.style.transition = 'opacity 0.6s ease';
                doorIcon.style.opacity = '1';
            }
            this._showTargetDisplay();
            if (this.levelData.target) {
                this.updateTargetDisplay(this.levelData.target);
            }
            const td = document.querySelector('.level-target-display');
            if (td) {
                td.style.transform = 'scale(0)';
                td.style.opacity = '0';
                td.offsetHeight;
                td.style.transition = 'transform 0.5s cubic-bezier(0,0,0.2,1.2), opacity 0.4s ease-out';
                td.style.transform = 'scale(1)';
                td.style.opacity = '1';
                setTimeout(() => {
                    td.style.transition = '';
                    td.style.transform = '';
                    td.style.opacity = '';
                    this.flashTargetDisplay();
                }, 550);
            }

            // Init inventory with items
            this.initInventory();
            this.updateInventoryLayout();

            // Init regular trade stations if any
            this.initTradeStation();
            this._maybeShowTradeStationTutorial();
        }, 600);
    }

Game.prototype._specialAreaProceed = function() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        // 交易台缩小消失
        if (this.tradeStations) {
            this.tradeStations.forEach(ts => {
                if (ts.el) {
                    ts.el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                    ts.el.style.opacity = '0';
                    ts.el.style.transform = 'scale(0)';
                }
            });
        }

        setTimeout(() => {
            this.performGoldenGlowTransition();
        }, 500);
    }
