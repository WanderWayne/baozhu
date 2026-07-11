/** @feature drag-drop @see docs/features/drag-drop.md */

Game.prototype.initInventory = function() {
        const inventory = document.getElementById('inventory-area');
        inventory.innerHTML = '';
        
        this.levelData.initialItems.forEach(itemName => {
            const el = this.createItemElement(itemName);
            el.classList.add('in-inventory');
            inventory.appendChild(el);
        });
        
        // 更新物品栏布局
        this.updateInventoryLayout();

        if (this.levelData.spawnInfiniteOnWorkbench && this.levelData.infiniteItems?.length) {
            this._spawnInitialInfiniteWorkbenchItems();
        }
        if (this.levelData.workbenchInitialItems?.length) {
            this._spawnWorkbenchInitialItems(220);
        }
    }

Game.prototype._replenishInfiniteItem = function(itemName) {
        if (!itemName) return;
        const infiniteItems = this.levelData.infiniteItems;
        if (!infiniteItems || !infiniteItems.includes(itemName)) return;

        const onBench = !!this.levelData.spawnInfiniteOnWorkbench;
        const inventory = document.getElementById('inventory-area');
        const synthArea = document.getElementById('synthesis-area');

        setTimeout(() => {
            requestAnimationFrame(() => {
                const sel = `.game-item[data-name="${itemName}"]`;
                const exists =
                    !!(inventory && inventory.querySelector(sel)) ||
                    !!(synthArea && synthArea.querySelector(sel));
                if (exists) return;

                if (onBench) {
                    this.spawnWorkbenchItemPopIn(itemName);
                    return;
                }

                if (!inventory) return;
                const item = this.createItemElement(itemName);
                item.style.opacity = '0';
                item.style.transform = 'scale(0)';
                item.classList.add('in-inventory');
                inventory.appendChild(item);
                requestAnimationFrame(() => {
                    item.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0,0,0.2,1.2)';
                    item.style.opacity = '';
                    item.style.transform = '';
                    setTimeout(() => {
                        item.style.transition = '';
                    }, 450);
                });
                this.updateInventoryLayout();
            });
        }, 600);
    }

Game.prototype.spawnWorkbenchItemPopIn = function(itemName) {
        const synthesisArea = document.getElementById('synthesis-area');
        if (!synthesisArea) return;
        if (synthesisArea.querySelector(`.game-item[data-name="${itemName}"]`)) return;

        const appearAnimationDuration = 1900;
        const halfApprox = 42;
        const rect = synthesisArea.getBoundingClientRect();
        const cx = rect.width * 0.4;
        const cy = rect.height * 0.56;

        const newItem = this.createItemElement(itemName);
        newItem.style.position = 'absolute';
        newItem.style.left = `${Math.max(6, cx - halfApprox)}px`;
        newItem.style.top = `${Math.max(6, cy - halfApprox)}px`;
        newItem.style.zIndex = '15';
        newItem.style.opacity = '0';
        newItem.style.transform = 'scale(0)';
        synthesisArea.appendChild(newItem);

        if (window.AudioManager) window.AudioManager.playInventoryTransitionSlot(false);

        requestAnimationFrame(() => {
            newItem.style.opacity = '';
            newItem.style.transform = '';
            newItem.classList.add('item-pop-in');
            if (typeof this.createFoamParticles === 'function') {
                this.createFoamParticles(newItem, 8);
            }
        });
        setTimeout(() => {
            newItem.classList.remove('item-pop-in');
        }, appearAnimationDuration);
    }

Game.prototype._spawnInitialInfiniteWorkbenchItems = function() {
        if (!this.levelData.spawnInfiniteOnWorkbench || !this.levelData.infiniteItems?.length) return;
        const startDelay = 220;
        requestAnimationFrame(() => {
            this.levelData.infiniteItems.forEach((itemName, i) => {
                setTimeout(() => this.spawnWorkbenchItemPopIn(itemName), startDelay + i * 300);
            });
        });
    }

Game.prototype._spawnWorkbenchInitialItems = function(startDelay = 220) {
        const list = this.levelData.workbenchInitialItems;
        if (!list?.length) return;
        requestAnimationFrame(() => {
            list.forEach((itemName, i) => {
                setTimeout(() => this.spawnWorkbenchItemPopIn(itemName), startDelay + i * 300);
            });
        });
    }

Game.prototype.updateInventoryLayout = function(opts = {}) {
        const inventory = document.getElementById('inventory-area');
        if (!inventory) return;

        const itemsPerRow = 4;
        let itemCount = inventory.querySelectorAll('.game-item').length;
        if (typeof opts.impliedItemCount === 'number') {
            itemCount = opts.impliedItemCount;
        }
        const rows = Math.ceil(itemCount / itemsPerRow);
        
        inventory.classList.remove('rows-0', 'rows-1', 'rows-2', 'rows-3-plus');
        
        if (rows === 0) {
            inventory.classList.add('rows-0');
        } else if (rows <= 1) {
            inventory.classList.add('rows-1');
        } else if (rows === 2) {
            inventory.classList.add('rows-2');
        } else {
            inventory.classList.add('rows-3-plus');
        }

        // 同步合成区底边与物品栏顶边对齐，消除中间死区
        this._syncSynthesisAreaBottom();

        // 同步钻石显示位置（在物品栏上方）
        this._updateGemPosition();
        // 物品栏高度有 0.35s 过渡，过渡结束后再更新一次
        setTimeout(() => {
            this._updateGemPosition();
            this._syncSynthesisAreaBottom();
            this._nudgeSynthItemsAboveInventory();
        }, 400);
    }

Game.prototype._syncSynthesisAreaBottom = function() {
        const inventory = document.getElementById('inventory-area');
        const synthesisArea = document.getElementById('synthesis-area');
        if (inventory && synthesisArea) {
            const invHeight = inventory.getBoundingClientRect().height;
            synthesisArea.style.bottom = invHeight + 'px';
        }
    }

Game.prototype._nudgeSynthItemsAboveInventory = function() {
        const synth = document.getElementById('synthesis-area');
        const inv = document.getElementById('inventory-area');
        if (!synth || !inv) return;

        const invRect = inv.getBoundingClientRect();
        const synthRect = synth.getBoundingClientRect();
        const items = synth.querySelectorAll('.game-item:not(.brewing-item)');
        if (!items.length) return;

        const horizPad = 4;
        const vertPad = 10;
        const invTop = invRect.top + vertPad;

        items.forEach((item) => {
            const r = item.getBoundingClientRect();
            const overlapX = r.right > invRect.left + horizPad && r.left < invRect.right - horizPad;
            if (!overlapX || r.bottom <= invTop) return;

            const depth = r.bottom - invTop;
            const halfConeRad = Math.PI / 8;
            const theta = (Math.random() * 2 - 1) * halfConeRad;
            const dist = depth + 18 + Math.random() * 32;
            const dx = Math.sin(theta) * dist;
            const dy = -Math.cos(theta) * dist;

            const cx = r.left + r.width / 2 - synthRect.left + dx;
            const cy = r.top + r.height / 2 - synthRect.top + dy;
            const w = item.offsetWidth || 84;
            const h = item.offsetHeight || 84;
            let nl = cx - w / 2;
            let nt = cy - h / 2;

            const margin = 8;
            const maxL = Math.max(margin, synth.clientWidth - w - margin);
            const maxT = Math.max(margin, synth.clientHeight - h - margin);
            nl = Math.min(Math.max(margin, nl), maxL);
            nt = Math.min(Math.max(margin, nt), maxT);

            item.style.transform = '';
            const prevTransition = item.style.transition;
            item.style.transition =
                'left 0.36s cubic-bezier(0.25, 0.46, 0.45, 1), top 0.36s cubic-bezier(0.25, 0.46, 0.45, 1)';
            item.style.left = `${nl}px`;
            item.style.top = `${nt}px`;
            setTimeout(() => {
                item.style.transition = prevTransition;
            }, 380);
        });
    }

Game.prototype.createItemElement = function(itemName) {
        const itemData = window.ITEMS[itemName] || { icon: '❓', type: 'unknown' };
        const el = document.createElement('div');
        el.className = 'game-item';
        if (itemData.type) {
            el.classList.add(`type-${itemData.type}`);
        }

        const cardTone = getGameItemCardTone(itemName);
        if (cardTone) {
            el.classList.add(`tone-${cardTone}`);
        }

        // 有长按效果的物品标记 has-effect（配方书、可提取物品等）
        if (itemData.isRecipeBook || itemData.extracts) {
            el.classList.add('has-effect');
        }

        el.dataset.name = itemName;
        const svgIcon = window.ITEM_SVGS && window.ITEM_SVGS[itemName];
        const iconClass = svgIcon ? 'icon item-svg' : 'icon';
        const iconContent = svgIcon || itemData.icon;
        el.innerHTML = `
            <div class="${iconClass}">${iconContent}</div>
            <div class="name">${itemName}</div>
        `;
        return el;
    }

Game.setIconContent = function(el, itemName, fallbackEmoji) {
        if (!el) return;
        const svg = window.ITEM_SVGS && window.ITEM_SVGS[itemName];
        if (svg) {
            el.innerHTML = svg;
            el.classList.add('has-svg-icon');
        } else {
            el.textContent = fallbackEmoji || (window.ITEMS[itemName]?.icon) || '?';
            el.classList.remove('has-svg-icon');
        }
    }

Game.prototype.addToInventoryIfNotExists = function(itemName) {
        const inventory = document.getElementById('inventory-area');
        // 检查是否已存在
        const existing = Array.from(inventory.children).find(el => el.dataset.name === itemName);
        
        if (!existing) {
            const newItem = this.createItemElement(itemName);
            newItem.classList.add('in-inventory');
            newItem.classList.add('new-item'); // 复用弹出动画
            inventory.appendChild(newItem);
            
            // 更新物品栏布局
            this.updateInventoryLayout();
            
            // 滚动到最新的物品（垂直滚动）
            setTimeout(() => {
                inventory.scrollTo({
                    top: inventory.scrollHeight,
                    behavior: 'smooth'
                });
            }, 100);
        }
    }
