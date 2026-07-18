// 游戏核心逻辑 - 合成模块
// ================================================

// 处理合成
Game.prototype.handleSynthesis = function(item1, item2) {
    this.resetIdleTimer();

    // 酿造中的物品不可再次参与任何合成
    if (!item1 || !item2) return;
    if (item1.classList.contains('brewing-item') || item2.classList.contains('brewing-item')) return;
    if (item1.dataset.locked === '1' || item2.dataset.locked === '1') return;
    
    const name1 = item1.dataset.name;
    const name2 = item2.dataset.name;

    window.SynthesisEngine.synthesize(
        { name: name1 }, 
        { name: name2 }, 
        (result) => {
            if (result.type === 'failed') {
                // 播放失败音效
                if (window.AudioManager) {
                    window.AudioManager.playSFX('error');
                }
                
                // 失败震动反馈
                item1.classList.add('shake-anim');
                item2.classList.add('shake-anim');
                setTimeout(() => {
                    item1.classList.remove('shake-anim');
                    item2.classList.remove('shake-anim');
                }, 500);

                // 触觉反馈
                try { if (navigator.vibrate) navigator.vibrate(50); } catch(e) {}
                
                this.showToast(result.message);

                // 两个物品互相挤开
                this._pushItemsApart(item1, item2);

                this.checkTriggerDialogs('onFailedSynthesis');
                this._chapterSynthHooksAfterFailedAttempt();
            } else if (result.type === 'instant') {
                this.performSynthesis(item1, item2, result);
            } else if (result.type === 'timer') {
                this.startTimerSynthesis(item1, item2, result);
            }
        }
    );
};

// 合成失败时：两个物品互相挤开
Game.prototype._pushItemsApart = function(item1, item2) {
    const synthArea = document.getElementById('synthesis-area');
    if (!synthArea) return;
    const parentRect = synthArea.getBoundingClientRect();
    const rect1 = item1.getBoundingClientRect();
    const rect2 = item2.getBoundingClientRect();
    const cx1 = rect1.left + rect1.width / 2;
    const cy1 = rect1.top + rect1.height / 2;
    const cx2 = rect2.left + rect2.width / 2;
    const cy2 = rect2.top + rect2.height / 2;
    let dx = cx1 - cx2;
    let dy = cy1 - cy2;
    const dist = Math.hypot(dx, dy) || 1;
    dx /= dist;
    dy /= dist;
    const pushDist = 55;
    const newCx1 = cx1 + dx * pushDist;
    const newCy1 = cy1 + dy * pushDist;
    const newCx2 = cx2 - dx * pushDist;
    const newCy2 = cy2 - dy * pushDist;
    item1.style.left = (newCx1 - parentRect.left - rect1.width / 2) + 'px';
    item1.style.top = (newCy1 - parentRect.top - rect1.height / 2) + 'px';
    item2.style.left = (newCx2 - parentRect.left - rect2.width / 2) + 'px';
    item2.style.top = (newCy2 - parentRect.top - rect2.height / 2) + 'px';
};

// 即时合成
Game.prototype.performSynthesis = function(item1, item2, resultData) {
    this._brewingDragPair = null;

    if (item1 && item1._brewCountInterval) {
        clearInterval(item1._brewCountInterval);
        item1._brewCountInterval = null;
    }

    this._synthCount = (this._synthCount || 0) + 1;

    if (!this.isFreeMode && resultData.recipe && resultData.recipe.ingredients) {
        if (!this._synthRouteSteps) this._synthRouteSteps = [];
        this._synthRouteSteps.push({
            ingredients: [...resultData.recipe.ingredients],
            result: resultData.result
        });
    }

    const ingName1 = item1.dataset.name;
    const ingName2 = item2.dataset.name;

    const rect1 = item1.getBoundingClientRect();
    const rect2 = item2.getBoundingClientRect();
    const parentRect = document.getElementById('synthesis-area').getBoundingClientRect();

    const brewingPair =
        item1.classList.contains('brewing-item') && item2.classList.contains('brewing-item');
    let centerX;
    let centerY;
    if (brewingPair) {
        const anchor = item1.querySelector('.timer-overlay') ? item1 : item2;
        const r = anchor.getBoundingClientRect();
        centerX = r.left + r.width / 2 - parentRect.left;
        centerY = r.top + r.height / 2 - parentRect.top;
    } else {
        const cx1 = rect1.left + rect1.width / 2;
        const cy1 = rect1.top + rect1.height / 2;
        const cx2 = rect2.left + rect2.width / 2;
        const cy2 = rect2.top + rect2.height / 2;
        centerX = (cx1 + cx2) / 2 - parentRect.left;
        centerY = (cy1 + cy2) / 2 - parentRect.top;
    }

    // 移除旧物品
    item1.remove();
    item2.remove();

    // 检查是否首次发现（用于静置揭晓）
    const isFirstDiscovery = !window.LevelManager.currentProgress.discoveredItems.includes(resultData.result);
    const itemData = window.ITEMS[resultData.result];
    const isHiddenItem = itemData && itemData.hidden;
    
    // 播放合成音效
    if (window.AudioManager) {
        const mt = !this.isFreeMode && this.levelData.multiTarget && Array.isArray(this.levelData.multiTargets)
            ? this.levelData.multiTargets
            : null;
        const isTargetItem = !this.isFreeMode && (
            resultData.result === this.levelData.target ||
            (mt && mt.includes(resultData.result))
        );
        const hasFragment = itemData && itemData.fragment;
        
        if (isTargetItem) {
            // 目标物品：播放特殊音效（只播放前3秒）
            window.AudioManager.playSFX('craft-target');
        } else if (hasFragment && isFirstDiscovery) {
            // 首次发现带记忆碎片的物品
            window.AudioManager.playSFX('craft-fragment');
        } else {
            // 普通合成
            window.AudioManager.playSFX('craft-normal');
        }
    }
    
    // 创建新物品
    const newItem = this.createItemElement(resultData.result);
    newItem.classList.add('new-item');
    // 添加合成成功特效
    newItem.classList.add('synthesis-anim');
    
    // 如果是目标物品，添加金边效果（支持双门）
    const mtList = !this.isFreeMode && this.levelData.multiTarget && Array.isArray(this.levelData.multiTargets)
        ? this.levelData.multiTargets
        : null;
    const isTarget = !this.isFreeMode && (
        resultData.result === this.levelData.target ||
        (mtList && mtList.includes(resultData.result)) ||
        (this.isDualDoor && this.doorStates.some(d => !d.done && d.target === resultData.result))
    );
    if (isTarget) {
        newItem.classList.add('target-item');
    }

    document.getElementById('synthesis-area').appendChild(newItem);
    const outW = newItem.offsetWidth || 85;
    const outH = newItem.offsetHeight || 85;
    newItem.style.left = (centerX - outW / 2) + 'px';
    newItem.style.top = (centerY - outH / 2) + 'px';

    this.checkTriggerDialogs('onSynthesize', resultData.result);

    // 粒子特效（坐标为合成中心；勿再加半宽偏移）
    this.showSynthesisParticles(centerX, centerY);

    // 记录合成
    this.synthesizedItems.add(resultData.result);

    this._chapterSynthHooksAfterSuccess(resultData.result);
    
    // 记录发现新物品（不显示提示）
    const discoveryResult = window.LevelManager.discoverItem(resultData.result);
    // 移除发现物品的 Toast 提示，保持游戏流程简洁
    if (!discoveryResult.isNew && resultData.message) {
        this.showToast(resultData.message);
    }

    // --- 新增：将合成出的新物品加入底部物品栏 ---
    this.addToInventoryIfNotExists(resultData.result);

    // 记录完美通关配方
    if (!this.isFreeMode && resultData.result === this.levelData.target
        && this.levelData.perfectRecipes && resultData.recipe) {
        window.LevelManager.recordCompletionRecipe(this.levelId, resultData.recipe.ingredients);
    }

    // 检查门状态
    this.checkDoorProgress(resultData.result);

    this._maybeEmitDoorWaveOnSynthProgress(resultData.result, ingName1, ingName2);

    // 检查是否完成关卡（传入合成区元素，而非去物品栏找）
    this.checkLevelCompletion(resultData.result, newItem);
};

// 应用神秘效果（静置揭晓）
Game.prototype.applyMysteryEffect = function(itemEl, itemName) {
    itemEl.classList.add('mystery-item');
    
    // 暂时隐藏真实名字
    const nameEl = itemEl.querySelector('.name');
    if (nameEl) {
        nameEl.dataset.realName = itemName;
        nameEl.textContent = '???';
    }
    
    // 设置揭晓计时器（1.2秒后揭晓）
    const revealDelay = 1200;
    const timerId = setTimeout(() => {
        this.revealItem(itemEl);
        this.revealTimers.delete(itemEl);
    }, revealDelay);
    
    this.revealTimers.set(itemEl, timerId);
};

// 粒子特效 - 白到金扩散
Game.prototype.showSynthesisParticles = function(x, y) {
    const synthesisArea = document.getElementById('synthesis-area');
    const centerX = x;
    const centerY = y;
    const count = 14;

    const container = document.createElement('div');
    container.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0;pointer-events:none;z-index:50;';

    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.5;
        const dist = 45 + Math.random() * 40;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist;
        const size = 3 + Math.random() * 4;
        const dur = 0.6 + Math.random() * 0.4;
        const delay = Math.random() * 0.12;
        const g = Math.round(180 + Math.random() * 75);
        const gB = Math.round(g * 0.35);

        p.style.cssText =
            'position:absolute;' +
            'left:' + centerX + 'px;top:' + centerY + 'px;' +
            'width:' + size + 'px;height:' + size + 'px;' +
            'border-radius:50%;' +
            'background:radial-gradient(circle,#fff 20%,rgb(' + g + ',' + Math.round(g * 0.8) + ',' + gB + ') 100%);' +
            'box-shadow:0 0 ' + (size + 2) + 'px rgba(255,255,255,0.6);' +
            'opacity:1;' +
            'transform:translate(-50%,-50%) scale(1);' +
            'transition:transform ' + dur + 's cubic-bezier(0.2,0.8,0.3,1) ' + delay + 's,' +
            'opacity ' + (dur * 0.6) + 's ease ' + (delay + dur * 0.4) + 's;' +
            'pointer-events:none;';

        container.appendChild(p);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                p.style.transform = 'translate(calc(-50% + ' + tx + 'px),calc(-50% + ' + ty + 'px)) scale(0.3)';
                p.style.opacity = '0';
            });
        });
    }

    synthesisArea.appendChild(container);
    setTimeout(() => container.remove(), 1400);
};

// 倒计时合成
Game.prototype.startTimerSynthesis = function(item1, item2, resultData) {
    const rect1 = item1.getBoundingClientRect();
    const rect2 = item2.getBoundingClientRect();
    const parentRect = document.getElementById('synthesis-area').getBoundingClientRect();
    
    const targetX = (rect1.left + rect2.left) / 2 - parentRect.left;
    const targetY = (rect1.top + rect2.top) / 2 - parentRect.top;

    // 移动到一起
    item1.style.transition = 'all 0.3s ease';
    item2.style.transition = 'all 0.3s ease';
    item1.style.left = targetX + 'px';
    item1.style.top = targetY + 'px';
    item2.style.left = targetX + 'px';
    item2.style.top = targetY + 'px';

    // 酿造中的物品仍可在台上拖动，但不可再次参与合成（由 handleSynthesis / 拖拽碰撞拦截）
    item1.classList.add('brewing-item');
    item2.classList.add('brewing-item');
    item1.dataset.locked = '1';
    item2.dataset.locked = '1';
    item2.style.pointerEvents = 'none';

    this._brewingDragPair = [item1, item2];

    // 添加倒计时覆盖层
    setTimeout(() => {
        const overlay = document.createElement('div');
        overlay.className = 'timer-overlay';
        overlay.innerHTML = `
            <svg class="timer-ring-svg" viewBox="0 0 100 100" aria-hidden="true">
                <circle class="timer-ring-track" cx="50" cy="50" r="46" fill="none"/>
                <g class="timer-ring-spinner">
                    <circle class="timer-ring-spin" cx="50" cy="50" r="46" fill="none"/>
                </g>
            </svg>
            <div class="timer-text">酿造中</div>
        `;
        item1.appendChild(overlay);

        item2.style.opacity = '0';
    }, 300);

    // 倒计时结束后合成（结束前再对齐叠放与伴侣，避免拖拽后伴侣仍停在旧坐标）
    setTimeout(() => {
        const synthEl = document.getElementById('synthesis-area');
        if (
            synthEl &&
            item1 &&
            item2 &&
            item1.isConnected &&
            item2.isConnected &&
            item1.classList.contains('brewing-item') &&
            item2.classList.contains('brewing-item')
        ) {
            const anchor = item1.querySelector('.timer-overlay') ? item1 : item2;
            const sr = synthEl.getBoundingClientRect();
            const ar = anchor.getBoundingClientRect();
            const relX = ar.left - sr.left;
            const relY = ar.top - sr.top;
            const partner = anchor === item1 ? item2 : item1;
            partner.style.transition = 'none';
            partner.style.left = relX + 'px';
            partner.style.top = relY + 'px';
        }
        this.performSynthesis(item1, item2, resultData);
    }, resultData.duration * 1000 + 300);
};

/** 酿造倒计时期间：让叠放的另一原料与主元素在合成区内保持同一位置 */
Game.prototype._syncBrewingPartnerToSynthCoords = function(relX, relY, draggedEl) {
    const pair = this._brewingDragPair;
    if (!pair || !draggedEl || !pair.includes(draggedEl)) return;
    const other = pair[0] === draggedEl ? pair[1] : pair[0];
    if (!other || !other.isConnected) return;
    const synth = document.getElementById('synthesis-area');
    if (!synth || other.parentElement !== synth) return;
    other.style.transition = 'none';
    other.style.left = relX + 'px';
    other.style.top = relY + 'px';
};

// 检查门进度（支持双门）
Game.prototype.checkDoorProgress = function(newItemName) {
    if (this.isDualDoor) {
        this.doorStates.forEach(ds => {
            if (ds.done) return;
            const triggers = ds.doorTriggers;
            if (!triggers) return;
            for (const [stage, items] of Object.entries(triggers)) {
                if (items.includes(newItemName) && !ds.discoveredTriggers.has(newItemName)) {
                    ds.discoveredTriggers.add(newItemName);
                    const stageNum = parseInt(stage.replace('stage', ''));
                    if (stageNum > ds.stage) {
                        this.updateDoorStageFor(ds, stageNum);
                    }
                }
            }
        });
        return;
    }

    // Multi-target: door progress handled separately
    if (this._multiTargetState) return;

    if (!this.levelData.doorTriggers) return;
    for (const [stage, triggers] of Object.entries(this.levelData.doorTriggers)) {
        if (triggers.includes(newItemName) && !this.discoveredTriggers.has(newItemName)) {
            this.discoveredTriggers.add(newItemName);
            const stageNum = parseInt(stage.replace('stage', ''));
            if (stageNum > this.doorStage) {
                this.updateDoorStage(stageNum);
            }
        }
    }
};

// 更新指定门的状态（双门用）
Game.prototype.updateDoorStageFor = function(ds, stage) {
    ds.stage = stage;
    if (ds.container) {
        ds.container.className = `door-container stage-${stage}`;
        this._emitDoorWave(ds.container);
    }
};

// 更新门状态（单门用）
Game.prototype.updateDoorStage = function(stage) {
    this.doorStage = stage;
    
    const doorContainer = document.getElementById('door-container');
    const doorStatus = document.getElementById('door-status');
    
    if (doorContainer) {
        doorContainer.className = `door-container stage-${stage}`;
        this._emitDoorWave(doorContainer);
    }
    
    // 提示暂时禁用
};

// 检查关卡完成 - 目标物品合成后自动飞向门（支持双门 & 多目标）
Game.prototype.checkLevelCompletion = function(newItemName, synthAreaEl) {
    if (this.isDualDoor) {
        const ds = this.doorStates.find(d => !d.done && d.target === newItemName);
        if (!ds) return;

        this.updateDoorStageFor(ds, 3);
        const targetEl = synthAreaEl || document.querySelector('#synthesis-area .game-item.target-item');
        if (!targetEl) return;

        const invCopy = document.querySelector('#inventory-area .game-item[data-name="' + newItemName + '"]');
        if (invCopy) invCopy.style.display = 'none';

        setTimeout(() => { targetEl.classList.add('target-breathe'); }, 1200);
        setTimeout(() => {
            this.showCompletionBadgesOverlay().then(() => {
                setTimeout(() => this.autoOfferToDoor(targetEl, ds), 350);
            });
        }, 1600);
        return;
    }

    // 多目标关（如 103）：只能走 handleMultiTargetComplete；禁止在 _multiTargetState 短暂缺失时
    // 落入下面「单门 + levelData.target」分支（103 的 target 仅为展示用「酒酿」，会误判整关通关）
    const multiTargets = this.levelData.multiTargets;
    const isMultiObjective =
        !!this.levelData.multiTarget && Array.isArray(multiTargets) && multiTargets.length > 0;

    if (isMultiObjective) {
        if (this._multiTargetState) {
            const handled = this.handleMultiTargetComplete(newItemName, synthAreaEl);
            if (handled && synthAreaEl) {
                synthAreaEl.style.pointerEvents = 'none';
                synthAreaEl.classList.add('target-breathe');
                setTimeout(() => {
                    synthAreaEl.style.transition = 'transform 0.5s ease-in, opacity 0.5s ease-in';
                    synthAreaEl.style.transform = 'scale(0)';
                    synthAreaEl.style.opacity = '0';
                    setTimeout(() => synthAreaEl.remove(), 550);
                }, 1500);
            }
        }
        return;
    }

    // 单门模式
    if (newItemName === this.levelData.target) {
        this.targetReady = true;
        this.updateDoorStage(3);

        const targetEl = synthAreaEl || document.querySelector('#synthesis-area .game-item.target-item');
        if (targetEl) {
            const invCopy = document.querySelector('#inventory-area .game-item[data-name="' + newItemName + '"]');
            if (invCopy) invCopy.style.display = 'none';

            setTimeout(() => { targetEl.classList.add('target-breathe'); }, 1200);
            setTimeout(() => {
                this.showCompletionBadgesOverlay().then(() => {
                    setTimeout(() => this.autoOfferToDoor(targetEl), 350);
                });
            }, 1600);
        }
    }
};

// 目标物品自动飞向门（支持双门：doorState 指定目标门）
Game.prototype.autoOfferToDoor = function(itemEl, doorState) {
    if (this.isTransitioning) return;
    if (!this.isDualDoor) this.targetReady = false;
    this._offeringInProgress = true;

    const doorContainer = doorState ? doorState.container : document.getElementById('door-container');
    const doorRect = doorContainer.getBoundingClientRect();
    const itemName = itemEl.dataset.name;

    // 读取物品当前屏幕位置（包含 scale 变换后的视觉位置）
    const visualRect = itemEl.getBoundingClientRect();
    // 视觉中心
    const cx = visualRect.left + visualRect.width / 2;
    const cy = visualRect.top + visualRect.height / 2;
    // 物品原始尺寸（去掉 scale）
    const baseW = 85;
    const baseH = 85;

    // 飞行中锁定目标物品，防止被玩家拖动
    itemEl.classList.add('offering-flight-lock');
    itemEl.dataset.locked = '1';
    itemEl.style.pointerEvents = 'none';

    // 创建一个干净的飞行克隆体，避免原元素的动画/transition干扰
    const flyer = itemEl.cloneNode(true);
    flyer.className = 'game-item target-item offering-flight';
    flyer.style.cssText = `
        position: fixed;
        left: ${cx - baseW / 2}px;
        top: ${cy - baseH / 2}px;
        width: ${baseW}px;
        height: ${baseH}px;
        transform: scale(1.25);
        z-index: 2000;
        pointer-events: none;
        opacity: 1;
        animation: none;
        border: 3px solid rgba(232, 200, 115, 0.9);
        box-shadow: 0 0 25px rgba(232, 200, 115, 0.7), 0 0 50px rgba(232, 200, 115, 0.4);
        filter: brightness(1.15);
    `;
    document.body.appendChild(flyer);

    // 删掉合成区原元素
    itemEl.remove();

    // 保存门位置供钻石飞行动画使用
    this._lastDoorRect = { left: doorRect.left, top: doorRect.top, width: doorRect.width, height: doorRect.height };
    console.log('[Gems] _lastDoorRect saved:', this._lastDoorRect);

    // 飞行目标：门中心
    const doorCX = doorRect.left + doorRect.width / 2;
    const doorCY = doorRect.top + doorRect.height / 2;
    const targetLeft = doorCX - baseW / 2;
    const targetTop = doorCY - baseH / 2;

    // 金色轨迹粒子
    this._spawnFlightTrail(document.body, cx, cy, doorCX, doorCY, 1500);

    // 强制浏览器渲染初始帧，然后再设置目标值触发过渡
    flyer.offsetHeight;

    flyer.style.transition = 'left 1.5s cubic-bezier(0.4, 0, 0.15, 1), top 1.5s cubic-bezier(0.4, 0, 0.15, 1), transform 1.5s cubic-bezier(0.4, 0, 0.15, 1), opacity 0.4s ease-in 1.1s';
    flyer.style.left = targetLeft + 'px';
    flyer.style.top = targetTop + 'px';
    flyer.style.transform = 'scale(0.3)';
    flyer.style.opacity = '0';

    setTimeout(() => {
        const invCopy = document.querySelector('#inventory-area .game-item[data-name="' + itemName + '"]');
        if (invCopy) invCopy.remove();

        flyer.remove();

        // 物品栏少了一个物品，需要更新布局和钻石位置
        this.updateInventoryLayout();

        if (doorState) {
            // 双门模式：标记这扇门完成
            this.completeDoor(doorState, itemEl);
        } else {
            this.performOffering(itemEl);
        }
        this._offeringInProgress = false;
    }, 1600);
};

Game.prototype._spawnFlightTrail = function(container, sx, sy, ex, ey, duration) {
    const isBody = container === document.body;
    const pos = isBody ? 'fixed' : 'absolute';
    const count = 12;
    const interval = duration / count;
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const t = i / count;
            const x = sx + (ex - sx) * t + (Math.random() - 0.5) * 20;
            const y = sy + (ey - sy) * t + (Math.random() - 0.5) * 20;
            const dot = document.createElement('div');
            dot.style.cssText = `
                position:${pos}; left:${x}px; top:${y}px;
                width:8px; height:8px; border-radius:50%; pointer-events:none; z-index:1999;
                background: radial-gradient(circle, rgba(255,220,100,0.9) 0%, rgba(232,200,115,0.4) 60%, transparent 100%);
                box-shadow: 0 0 8px rgba(232,200,115,0.6);
                animation: trailFade 0.8s ease-out forwards;
            `;
            container.appendChild(dot);
            setTimeout(() => dot.remove(), 850);
        }, i * interval);
    }
};

// 双门模式：完成一扇门
Game.prototype.completeDoor = function(doorState, itemEl) {
    doorState.done = true;

    // 播放吸收音效
    if (window.AudioManager) {
        window.AudioManager.playSFX('door-absorb');
    }

    // 视觉：门闪光 + 勾标记
    if (doorState.container) {
        doorState.container.classList.add('offering');
        setTimeout(() => doorState.container.classList.remove('offering'), 600);
    }
    if (doorState.wrapper) {
        doorState.wrapper.classList.add('door-done');
    }

    // 检查是否所有门都完成
    const allDone = this.doorStates.every(d => d.done);
    if (allDone) {
        setTimeout(() => {
            this.showCompletionBadgesOverlay().then(() => {
                window.LevelManager.completeLevel(this.levelId);
                this.showSuccessModal();
            });
        }, 600);
    }
};

// 尝试献上物品到门 - 由拖拽系统调用
Game.prototype.tryOfferToDoor = function(itemEl) {
    if (this.isFreeMode) return false;
    if (itemEl.classList.contains('brewing-item')) return false;

    const itemName = itemEl.dataset.name;
    
    // 只有目标物品且已就绪才能献上
    if (!this.targetReady || itemName !== this.levelData.target) {
        return false;
    }
    
    // 献上成功
    this.performOffering(itemEl);
    return true;
};

// 执行献上仪式
Game.prototype.performOffering = function(itemEl) {
    // 防止重复触发
    if (this.isTransitioning) return;
    
    // 播放献祭音效
    if (window.AudioManager) {
        window.AudioManager.playSFX('door-absorb');
    }
    
    const doorContainer = document.getElementById('door-container');
    doorContainer.classList.remove('awaiting-offer');
    
    // 触觉反馈
    try { if (navigator.vibrate) navigator.vibrate([50, 50, 100]); } catch(e) {}
    
    const proceed = () => {
        if (this.hasNextObjective()) {
            // 移除第二关后的新手引导，改为第一次退出到主界面时引导
            this.performChapterTransition(itemEl);
        } else {
            itemEl.classList.add('offering-item');
            doorContainer.classList.add('offering');
            setTimeout(() => {
                itemEl.remove();
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

    if (this.levelData.completionDialogs && this.levelData.completionDialogs.length > 0) {
        this.playCompletionDialogs().then(proceed);
    } else {
        proceed();
    }
};

// 执行章节过渡动画（新版：门关闭 + 金光 + 物品变换）
Game.prototype.performChapterTransition = function(itemEl) {
    this.isTransitioning = true;
    const doorContainer = document.getElementById('door-container');
    const inventoryArea = document.getElementById('inventory-area');
    
    // 获取物品和门的位置
    const itemRect = itemEl.getBoundingClientRect();
    const doorRect = doorContainer.getBoundingClientRect();
    
    // 记录当前暖度等级（用于累加）
    this.warmthLevel = (this.warmthLevel || 0) + 1;

    // 如果 itemEl 已不在 DOM 中（由 autoOfferToDoor 移除），跳过星星动画，直接门关闭
    const itemInDOM = itemEl && itemEl.parentElement;

    const doDoorClose = () => {
        doorContainer.classList.add('star-entering');
        setTimeout(() => {
            doorContainer.classList.remove('star-entering');
            doorContainer.classList.add('closing', 'closed');
            document.body.classList.remove('warmth-1', 'warmth-2', 'warmth-3', 'warmth-4', 'warmth-5');
            document.body.classList.add(`warmth-${Math.min(this.warmthLevel, 5)}`);
            setTimeout(() => this.performGoldenGlowTransition(), 300);
        }, 400);
    };

    if (!itemInDOM) {
        doDoorClose();
        return;
    }

    // 1. 物品变成星星飞向门 (0.8s)
    itemEl.classList.add('star-transform');
    
    setTimeout(() => {
        const star = document.createElement('div');
        star.className = 'flying-star';
        star.style.left = (itemRect.left + itemRect.width / 2 - 12) + 'px';
        star.style.top = (itemRect.top + itemRect.height / 2 - 12) + 'px';
        document.body.appendChild(star);
        
        itemEl.remove();
        
        const doorCenterX = doorRect.left + doorRect.width / 2 - 12;
        const doorCenterY = doorRect.top + doorRect.height / 2 - 12;
        
        star.style.transition = 'all 1s cubic-bezier(0.4, 0, 0.2, 1)';
        requestAnimationFrame(() => {
            star.style.left = doorCenterX + 'px';
            star.style.top = doorCenterY + 'px';
            star.style.transform = 'scale(0.5)';
        });
        
        setTimeout(() => {
            star.remove();
            doDoorClose();
        }, 1000);
        
    }, 800);
};

// 执行金光 + 物品变换动画
Game.prototype.performGoldenGlowTransition = function() {
    const inventoryArea = document.getElementById('inventory-area');
    const doorContainer = document.getElementById('door-container');
    const currentItems = Array.from(inventoryArea.querySelectorAll('.game-item'));

    // ========== 先缩小消失：目标显示、交易台、合成区物品 ==========
    const targetDisplay = document.querySelector('.level-target-display');
    if (targetDisplay) {
        targetDisplay.style.transition = 'transform 0.4s ease-in, opacity 0.4s ease-in';
        targetDisplay.style.transform = 'scale(0)';
        targetDisplay.style.opacity = '0';
    }

    if (this.tradeStations && this.tradeStations.length > 0) {
        this.tradeStations.forEach(ts => {
            if (ts.el) {
                ts.el.style.transition = 'transform 0.4s ease-in, opacity 0.4s ease-in';
                ts.el.style.opacity = '0';
                ts.el.style.transform = (ts.el.style.transform || '') + ' scale(0)';
            }
        });
    }

    const synthItems = Array.from(
        document.getElementById('synthesis-area')?.querySelectorAll('.game-item') || []
    );
    synthItems.forEach((item, i) => {
        setTimeout(() => {
            item.style.transition = 'transform 0.35s ease-in, opacity 0.35s ease-in';
            item.style.transform = 'scale(0)';
            item.style.opacity = '0';
        }, i * 60);
    });

    // 等缩小动画完成后：先发钻石 → 再做金光 + 物品变换（关卡介绍移到物品替换完成后）
    setTimeout(() => {
        synthItems.forEach(item => item.remove());
        if (this.tradeStations) {
            this.tradeStations.forEach(ts => { if (ts.el) ts.el.remove(); });
            this.tradeStations = [];
            this.tradeStation = null;
        }

        // 在关卡介绍之前完成钻石奖励
        const gemAwarded = !this.levelData.isSpecialArea
            ? window.LevelManager.completeLevel(this.levelId)
            : false;
        if (gemAwarded) {
            this.updateGemDisplay();
        }

        const gemDelay = gemAwarded ? 1600 : 0;

        setTimeout(() => {
            const proceedToNext = () => {
                inventoryArea.classList.add('golden-glow');
                currentItems.forEach(item => {
                    item.classList.add('golden-outline');
                });

                setTimeout(() => {
                    this.performItemTransition();
                }, 600);
            };

            if (this.levelId === 105 && window.LevelManager && !window.LevelManager.hasSeenChapterPhaseSettlement()) {
                this.showSettlementScreen().then(proceedToNext);
            } else {
                proceedToNext();
            }
        }, gemDelay);
    }, 500);
};

// 执行物品栏物品变换动画
Game.prototype.performItemTransition = function() {
    const inventoryArea = document.getElementById('inventory-area');
    const doorContainer = document.getElementById('door-container');
    const currentItems = Array.from(inventoryArea.querySelectorAll('.game-item'));
    
    // 获取下一关的物品
    const nextLevelId = this.getNextObjectiveLevelId();
    const nextLevelData = window.LevelManager.getLevelData(nextLevelId);
    if (!nextLevelData) return;
    
    const _nextHasBook = (window.LevelManager.currentProgress.discoveredItems || []).includes('配方书');
    const isNextRecipePhase = !!nextLevelData.recipeBookPhase && !_nextHasBook;
    const newItemNames = isNextRecipePhase ? [] : (nextLevelData.initialItems || []);

    // ========== 第一阶段：所有旧物品 bubble-pop 消失 ==========
    const disappearInterval = 300;
    const disappearAnimationDuration = 1600;

    currentItems.forEach((oldItem, index) => {
        setTimeout(() => {
            oldItem.style.pointerEvents = 'none';
            oldItem.classList.remove('golden-outline');
            oldItem.style.animation = '';
            // 先于下一帧动画触发音效，减轻「晚半拍」感（MP3 仍有微小解码延迟）
            if (window.AudioManager) window.AudioManager.playInventoryTransitionSlot(true);
            requestAnimationFrame(() => {
                this.createFoamParticles(oldItem, 8);
                oldItem.classList.add('bubble-pop');
            });
            setTimeout(() => {
                oldItem.style.visibility = 'hidden';
            }, disappearAnimationDuration - 50);
        }, index * disappearInterval);
    });

    const allDisappearTime = currentItems.length > 0
        ? currentItems.length * disappearInterval + disappearAnimationDuration
        : 0;

    setTimeout(() => {
        inventoryArea.querySelectorAll('.game-item').forEach(el => el.remove());
    }, allDisappearTime);

    // ========== 第二阶段：所有新物品依次出现 ==========
    const appearInterval = 300;
    const appearAnimationDuration = 1900;
    const appearStartDelay = allDisappearTime > 0 ? 200 : 150;
    const stagedNewItems = new Map();

    // 先一次性建立全部透明槽位，避免逐项 append 让已出现物品反复参与 flex 重排。
    if (newItemNames.length > 0) {
        setTimeout(() => {
            newItemNames.forEach((newItemName, index) => {
                const newItem = this.createItemElement(newItemName);
                newItem.style.opacity = '0';
                newItem.style.transform = 'scale(0)';
                newItem.classList.add('in-inventory');
                inventoryArea.appendChild(newItem);
                stagedNewItems.set(index, newItem);
            });
            this.updateInventoryLayout({ impliedItemCount: newItemNames.length });
        }, allDisappearTime + 20);
    }

    newItemNames.forEach((newItemName, index) => {
        const appearAt = allDisappearTime + appearStartDelay + index * appearInterval;

        setTimeout(() => {
            const newItem = stagedNewItems.get(index);
            if (!newItem) return;
            if (window.AudioManager) window.AudioManager.playInventoryTransitionSlot(false);
            requestAnimationFrame(() => {
                newItem.style.opacity = '';
                newItem.style.transform = '';
                newItem.classList.add('item-pop-in');
                this.createFoamParticles(newItem, 8);
            });
            setTimeout(() => {
                newItem.classList.remove('item-pop-in');
            }, appearAnimationDuration);
        }, appearAt);
    });

    // 计算总过渡时间
    const totalTransitionTime = allDisappearTime + appearStartDelay +
        (newItemNames.length > 0
            ? newItemNames.length * appearInterval + appearAnimationDuration
            : 500);
    
    setTimeout(() => {
        // completeLevel already called in performGoldenGlowTransition; handle special area here
        if (this.levelData.isSpecialArea) {
            const p = window.LevelManager.currentProgress;
            if (!p.completedLevels.includes(this.levelId)) {
                p.completedLevels.push(this.levelId);
                window.LevelManager.saveProgress();
            }
        }
        this.levelId = nextLevelId;
        this.levelData = nextLevelData;
        this.objectiveIndex = nextLevelData.objectiveIndex || 0;
        const _hasBook = (window.LevelManager.currentProgress.discoveredItems || []).includes('配方书');
        this._recipeBookPhaseActive = !!nextLevelData.recipeBookPhase && !_hasBook;

        // 重置游戏状态
        this.doorStage = 0;
        this.discoveredTriggers = new Set();
        this.synthesizedItems = new Set();
        this.targetReady = false;
        this._synthCount = 0;
        this._synthRouteSteps = [];
        this._levelWasAlreadyCompletedOnEntry =
            window.LevelManager && window.LevelManager.isLevelCompleted(this.levelId);
        this._doorClickChatIdx = 0;
        this._doorClickCooldown = 0;
        this._stopMultiTargetCycle();
        this._multiTargetState = null;
        
        if (this.levelHintInterval) {
            clearInterval(this.levelHintInterval);
            this.levelHintInterval = null;
        }
        
        // 物品栏金光消失
        inventoryArea.classList.remove('golden-glow');
        inventoryArea.classList.add('golden-fade');
        
        this.updateInventoryLayout();
        
        // 清空合成区
        const synthesisArea = document.getElementById('synthesis-area');
        if (synthesisArea) {
            synthesisArea.innerHTML = '<div class="workbench-texture"></div>';
        }

        // 初始化交易站（特殊区域延后到对话结束）
        if (!this.levelData.isSpecialArea) {
            this.initTradeStation();
        }

        if (this.levelData.spawnInfiniteOnWorkbench && this.levelData.infiniteItems?.length) {
            const benchStart = 320;
            this.levelData.infiniteItems.forEach((itemName, i) => {
                setTimeout(() => this.spawnWorkbenchItemPopIn(itemName), benchStart + i * 300);
            });
        }

        if (this.levelData.workbenchInitialItems?.length) {
            this._spawnWorkbenchInitialItems(320);
        }

        const doorRow = document.getElementById('door-row');

        if (this.levelData.isSpecialArea) {
            // 新关是特殊区域：隐藏门
            doorRow.style.display = 'none';
            doorRow.innerHTML = '';
        } else {
            // 恢复门可见
            doorRow.style.display = '';
        }

        const isSingleToSingle = !this.isDualDoor
            && !this.levelData.isSpecialArea
            && !(this.levelData.doors && this.levelData.doors.length > 1);

        if (isSingleToSingle) {
            const hideTarget = this._recipeBookPhaseActive;
            const dc = document.getElementById('door-container');
            if (dc) {
                Game.resetDoorSynthMaturity(dc);
                dc.className = 'door-container stage-0';
            }
            // Remove multi-target quadrants from previous level
            const oldQuads = dc && dc.querySelector('.door-quadrants');
            if (oldQuads) oldQuads.remove();

            const doorIcon = document.getElementById('door-icon');
            if (doorIcon) {
                doorIcon.classList.remove('mt-clear', 'icon-fade-out', 'icon-fade-in');
                doorIcon.style.transition = 'opacity 0.3s ease';
                doorIcon.style.opacity = '0';
                if (!this.levelData.multiTarget) {
                    setTimeout(() => {
                        if (hideTarget) {
                            doorIcon.textContent = '';
                            doorIcon.classList.remove('has-svg-icon');
                        } else if (this.levelData.target) {
                            Game.setIconContent(doorIcon, this.levelData.target);
                        }
                        doorIcon.style.opacity = '1';
                    }, 300);
                }
            }

            const targetDisplay = document.querySelector('.level-target-display');
            if (hideTarget) {
                if (targetDisplay) targetDisplay.style.display = 'none';
            } else if (this.levelData.multiTarget) {
                setTimeout(() => {
                    if (doorIcon) doorIcon.style.opacity = '1';
                    this._initMultiTarget(doorIcon, true);
                }, 300);
                if (targetDisplay) {
                    targetDisplay.style.transform = 'scale(0)';
                    targetDisplay.style.opacity = '0';
                    targetDisplay.style.display = '';
                }
            } else {
                const targetNameEl = document.getElementById('target-name');
                if (targetNameEl) targetNameEl.textContent = this.levelData.target || '';
                if (targetDisplay) {
                    targetDisplay.style.transform = 'scale(0)';
                    targetDisplay.style.opacity = '0';
                    targetDisplay.style.display = '';
                }
            }

            this.doorStates = [{
                idx: 0,
                target: this.levelData.target,
                stage: 0,
                done: false,
                container: dc,
                wrapper: document.getElementById('door-wrapper-0')
            }];

            setTimeout(() => {
                this.showLevelIntro().then(() => {
                    inventoryArea.classList.remove('golden-fade');
                    this.isTransitioning = false;
                    this.startIdleTimer();
                    this._autoShowRecipeBook();
                    this._playLevelDialogs();
                    this._maybeShowTradeStationTutorial();

                    if (!hideTarget && targetDisplay) {
                        targetDisplay.style.transition = 'transform 0.5s cubic-bezier(0,0,0.2,1.2), opacity 0.4s ease-out';
                        targetDisplay.style.transform = 'scale(1)';
                        targetDisplay.style.opacity = '1';
                        setTimeout(() => {
                            targetDisplay.style.transition = '';
                            targetDisplay.style.transform = '';
                            targetDisplay.style.opacity = '';
                            this.flashTargetDisplay();
                        }, 550);
                    }
                });
            }, 400);
        } else {
            // Full door rebuild for dual-door or special area transitions
            const oldWrappers = Array.from(doorRow.querySelectorAll('.door-wrapper'));
            oldWrappers.forEach(w => w.classList.add('scale-out'));

            setTimeout(() => {
                doorRow.innerHTML = '';

                if (this.levelData.isSpecialArea) {
                    // no door
                } else if (this.levelData.doors && this.levelData.doors.length > 1) {
                    this.isDualDoor = true;
                    this.doorStates = [];
                    doorRow.classList.add('dual-doors');
                    this.initDualDoors();
                } else {
                    this.isDualDoor = false;
                    this.doorStates = [];
                    doorRow.classList.remove('dual-doors');

                    const wrapper = document.createElement('div');
                    wrapper.className = 'door-wrapper';
                    wrapper.id = 'door-wrapper-0';
                    const tItem = this.levelData.target ? window.ITEMS[this.levelData.target] : null;
                    const hasTarget = !!this.levelData.target;
                    wrapper.innerHTML = `
                        <div class="door-container stage-0" id="door-container">
                            <div class="door-aura"></div>
                            <div class="door-frame">
                                <div class="door-glow">
                                    <div class="door-fog"></div>
                                    <div class="door-target-silhouette" id="door-icon">${tItem?.icon || ''}</div>
                                </div>
                            </div>
                            <div class="door-offer-hint">献上</div>
                        </div>
                        <div class="level-info">
                            <div class="level-target-display" id="level-target" style="${hasTarget ? 'transform:scale(0);opacity:0' : 'display:none'}">
                                <span class="target-label">目标</span>
                                <span class="target-name" id="target-name">${this.levelData.target || ''}</span>
                            </div>
                        </div>
                    `;
                    doorRow.appendChild(wrapper);
                    this.doorStates.push({
                        idx: 0,
                        target: this.levelData.target,
                        stage: 0,
                        done: false,
                        container: wrapper.querySelector('.door-container'),
                        wrapper: wrapper
                    });
                }

                const newWrappers = Array.from(doorRow.querySelectorAll('.door-wrapper'));
                newWrappers.forEach(w => w.classList.add('scale-in'));

                setTimeout(() => {
                    newWrappers.forEach(w => w.classList.remove('scale-in'));
                    this.showLevelIntro().then(() => {
                        inventoryArea.classList.remove('golden-fade');
                        this.isTransitioning = false;
                        this.startIdleTimer();
                        this._autoShowRecipeBook();
                        this._playLevelDialogs();
                        this._maybeShowTradeStationTutorial();

                        if (!this.levelData.isSpecialArea) {
                            const td = document.querySelector('.level-target-display');
                            if (td && td.style.display !== 'none') {
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
                        }
                    });
                }, 600);

            }, 550);
        }
        
    }, totalTransitionTime);
};

// 创建泡沫粒子效果
Game.prototype.createFoamParticles = function(itemEl, particleCount) {
    const rect = itemEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const container = document.createElement('div');
    container.className = 'bubble-foam';
    container.style.left = centerX + 'px';
    container.style.top = centerY + 'px';
    
    // 创建指定数量的泡沫粒子（默认10-14个）
    const count = particleCount || (10 + Math.floor(Math.random() * 5));
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'foam-particle';
        
        // 随机方向和距离
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
        const distance = 35 + Math.random() * 50;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        
        particle.style.setProperty('--foam-x', x + 'px');
        particle.style.setProperty('--foam-y', y + 'px');
        
        // 随机大小（有大有小）
        const isLarge = Math.random() > 0.7;
        const size = isLarge ? (10 + Math.random() * 6) : (5 + Math.random() * 5);
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        
        if (isLarge) {
            particle.classList.add('large');
        }
        
        // 随机延迟
        particle.style.animationDelay = (Math.random() * 0.12) + 's';
        
        container.appendChild(particle);
    }
    
    document.body.appendChild(container);
    
    // 动画结束后移除
    setTimeout(() => container.remove(), 2400);
};

// 显示门状态提示（复用现有元素，但增加持续显示逻辑）
Game.prototype.showDoorStatus = function(text, duration = 0) {
    const doorStatus = document.getElementById('door-status');
    doorStatus.textContent = text;
    doorStatus.classList.add('visible');
    
    if (duration > 0) {
        setTimeout(() => {
            doorStatus.classList.remove('visible');
        }, duration);
    }
    // duration = 0 时保持显示
};

// 长按物品处理
Game.prototype.onItemLongPress = function(itemEl) {
    const itemName = itemEl.dataset.name;
    const itemData = window.ITEMS[itemName];

    if (itemData && itemData.isRecipeBook) {
        this.activateRecipeBook(itemEl);
        return;
    }
};

// 配方书激活：先显示按钮，然后物品飞向按钮消失
Game.prototype.activateRecipeBook = function(itemEl) {
    this.showRecipeBookButton();

    // 等按钮出现后（0.5s），物品飞向按钮
    setTimeout(() => {
        const btn = document.getElementById('recipe-book-btn');
        if (!btn) { itemEl.remove(); return; }

        const btnRect = btn.getBoundingClientRect();
        const itemRect = itemEl.getBoundingClientRect();
        const cx = itemRect.left + itemRect.width / 2;
        const cy = itemRect.top + itemRect.height / 2;

        // 创建飞行克隆体
        const flyer = itemEl.cloneNode(true);
        flyer.style.cssText = `
            position: fixed;
            left: ${cx - 42}px;
            top: ${cy - 42}px;
            width: 85px;
            height: 85px;
            z-index: 2000;
            pointer-events: none;
            opacity: 1;
            animation: none;
            border-radius: 50%;
            border: 2px solid rgba(232, 200, 115, 0.6);
            box-shadow: 0 0 15px rgba(232, 200, 115, 0.4);
        `;
        document.body.appendChild(flyer);
        itemEl.remove();

        const targetX = btnRect.left + btnRect.width / 2 - 42;
        const targetY = btnRect.top + btnRect.height / 2 - 42;

        flyer.offsetHeight;
        flyer.style.transition = 'left 0.8s cubic-bezier(0.4, 0, 0.15, 1), top 0.8s cubic-bezier(0.4, 0, 0.15, 1), transform 0.8s cubic-bezier(0.4, 0, 0.15, 1), opacity 0.3s ease-in 0.5s';
        flyer.style.left = targetX + 'px';
        flyer.style.top = targetY + 'px';
        flyer.style.transform = 'scale(0.2)';
        flyer.style.opacity = '0';

        // 飞到后按钮闪一下
        setTimeout(() => {
            flyer.remove();
            if (btn) {
                btn.style.transform = 'scale(1.2)';
                btn.style.boxShadow = '0 0 16px rgba(232, 200, 115, 0.5)';
                setTimeout(() => {
                    btn.style.transform = 'scale(1)';
                    btn.style.boxShadow = '';
                }, 300);
            }
            this.showDoorBubble('点开配方书看看吧');
            if (this._recipeBookPhaseActive) {
                setTimeout(() => this._revealRecipeBookPhase2(), 400);
            }
        }, 850);
    }, 500);
};

// 取消物品的揭晓计时器
Game.prototype.cancelRevealForItem = function(itemEl) {
    const timerId = this.revealTimers.get(itemEl);
    if (timerId) {
        clearTimeout(timerId);
        this.revealTimers.delete(itemEl);
        
        // 如果还没揭晓，立即揭晓
        if (itemEl.classList.contains('mystery-item')) {
            this.revealItem(itemEl);
        }
    }
};

// 揭晓物品
Game.prototype.revealItem = function(itemEl) {
    itemEl.classList.remove('mystery-item');
    itemEl.classList.add('revealed-item');
    
    // 恢复名字显示
    const nameEl = itemEl.querySelector('.name');
    if (nameEl && nameEl.dataset.realName) {
        nameEl.textContent = nameEl.dataset.realName;
    }
};

// 执行材料提取
Game.prototype.performExtraction = function(sourceItemEl, extractName) {
    const rect = sourceItemEl.getBoundingClientRect();
    const parentRect = document.getElementById('synthesis-area').getBoundingClientRect();
    
    // 创建提取出的新物品
    const newItem = this.createItemElement(extractName);
    newItem.classList.add('new-item', 'extracted-item');
    
    // 放置在原物品旁边
    const offsetX = 60;
    newItem.style.left = (rect.left - parentRect.left + offsetX) + 'px';
    newItem.style.top = (rect.top - parentRect.top) + 'px';
    
    document.getElementById('synthesis-area').appendChild(newItem);
    
    // 记录发现
    window.LevelManager.discoverItem(extractName);
    
    // 添加到物品栏
    this.addToInventoryIfNotExists(extractName);
    
    // 显示提示
    this.showToast(`提取出了 ${extractName}`, 2000);
    
    // 触觉反馈
    try { if (navigator.vibrate) navigator.vibrate(20); } catch(e) {}
};

// 前五关结算画面
Game.prototype.showSettlementScreen = function() {
    return new Promise(resolve => {
        const chapterName = this.chapterData?.name || '这一章';
        const objectives = Array.isArray(this.chapterData?.objectives) ? this.chapterData.objectives : [];
        const completed = objectives.filter(id => window.LevelManager.isLevelCompleted(id)).length;
        const percent = objectives.length > 0 ? Math.round((completed / objectives.length) * 100) : 0;

        const overlay = document.createElement('div');
        overlay.className = 'settlement-overlay';
        overlay.innerHTML =
            '<div class="settlement-content">' +
                '<div class="settlement-title">阶段完成</div>' +
                '<div class="settlement-sep"></div>' +
                '<div class="settlement-encouragement">做得很好，这一章的香气已经被你点亮了一大半。</div>' +
                '<div class="settlement-progress">' +
                    '<div class="settlement-progress-label">' + chapterName + '已完成</div>' +
                    '<div class="settlement-progress-value">' + percent + '%</div>' +
                    '<div class="settlement-progress-track">' +
                        '<div class="settlement-progress-fill" style="width:' + percent + '%"></div>' +
                    '</div>' +
                '</div>' +
                '<div class="settlement-message">' +
                    '接下来会进入更完整的酿造组合。<br>' +
                    '要不要先休息一下？' +
                '</div>' +
                '<div class="settlement-buttons">' +
                    '<button class="settlement-btn settlement-btn-exit">休息一下</button>' +
                    '<button class="settlement-btn settlement-btn-continue">继续酿造</button>' +
                '</div>' +
            '</div>';

        const mountOverlay = () => {
            if (window.LevelManager && typeof window.LevelManager.markChapterPhaseSettlementSeen === 'function') {
                window.LevelManager.markChapterPhaseSettlementSeen();
            }
            document.body.appendChild(overlay);
            overlay.offsetHeight;
            overlay.classList.add('visible');
            if (window.AudioManager) {
                setTimeout(() => window.AudioManager.playSFX('settlement-phase-complete'), 300);
            }
        };

        const am = window.AudioManager;
        if (am && am.currentBGM) {
            am.fadeOutBGM(1600, mountOverlay);
        } else {
            mountOverlay();
        }

        const exitBtn = overlay.querySelector('.settlement-btn-exit');
        const continueBtn = overlay.querySelector('.settlement-btn-continue');

        const dismiss = (goExit) => {
            overlay.style.transition = 'background 0.6s ease, opacity 0.6s ease';
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.remove();
                if (goExit) {
                    if (window.AudioManager) window.AudioManager.stopBGM();
                    if (window.navigateTo) window.navigateTo('index.html');
                    else window.location.href = 'index.html';
                } else {
                    if (window.AudioManager) window.AudioManager.playBGM('bgm-game');
                    resolve();
                }
            }, 650);
        };

        exitBtn.addEventListener('click', () => {
            if (window.AudioManager) window.AudioManager.playClickExit();
            dismiss(true);
        });
        continueBtn.addEventListener('click', () => {
            if (window.AudioManager) window.AudioManager.playClickOpen();
            dismiss(false);
        });
    });
};

// 第一次进入游戏后退出到主界面时引导玩家查看任务
// 此功能在 game-core.js 的 performOffering 中触发
Game.prototype._showLevel2CompletionTutorial = async function() {
    // 此方法已不再使用，保留空实现以兼容旧代码
    // 新手引导已改为：第一次玩家进入游戏后退出到主界面时，引导玩家查看任务
};
