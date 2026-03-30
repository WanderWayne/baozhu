// 游戏核心逻辑 - 合成模块
// ================================================

// 处理合成
Game.prototype.handleSynthesis = function(item1, item2) {
    this.resetIdleTimer();
    
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
    const rect1 = item1.getBoundingClientRect();
    const rect2 = item2.getBoundingClientRect();
    const parentRect = document.getElementById('synthesis-area').getBoundingClientRect();
    
    const centerX = (rect1.left + rect2.left) / 2 - parentRect.left;
    const centerY = (rect1.top + rect2.top) / 2 - parentRect.top;

    // 移除旧物品
    item1.remove();
    item2.remove();

    // 检查是否首次发现（用于静置揭晓）
    const isFirstDiscovery = !window.LevelManager.currentProgress.discoveredItems.includes(resultData.result);
    const itemData = window.ITEMS[resultData.result];
    const isHiddenItem = itemData && itemData.hidden;
    
    // 播放合成音效
    if (window.AudioManager) {
        // 判断应该播放哪种合成音效
        const isTargetItem = !this.isFreeMode && resultData.result === this.levelData.target;
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
    const isTarget = !this.isFreeMode && (
        resultData.result === this.levelData.target ||
        (this.isDualDoor && this.doorStates.some(d => !d.done && d.target === resultData.result))
    );
    if (isTarget) {
        newItem.classList.add('target-item');
    }
    
    newItem.style.left = centerX + 'px';
    newItem.style.top = centerY + 'px';
    
    // 如果是首次发现或隐藏物品，添加神秘效果（静置揭晓）
    if (isFirstDiscovery || isHiddenItem) {
        this.applyMysteryEffect(newItem, resultData.result);
    }
    
    document.getElementById('synthesis-area').appendChild(newItem);

    this.checkTriggerDialogs('onSynthesize', resultData.result);

    // 粒子特效
    this.showSynthesisParticles(centerX, centerY);

    // 记录合成
    this.synthesizedItems.add(resultData.result);
    
    // 检查是否发现新物品
    const discoveryResult = window.LevelManager.discoverItem(resultData.result);
    if (discoveryResult.isNew) {
        // 如果有神秘效果，延迟显示发现提示
        if (isFirstDiscovery || isHiddenItem) {
            setTimeout(() => {
                this.showDiscoveryToast(resultData.result, resultData.message, discoveryResult.fragment);
            }, 1200);
        } else {
            this.showDiscoveryToast(resultData.result, resultData.message, discoveryResult.fragment);
        }
    } else if (resultData.message) {
        this.showToast(resultData.message);
    }

    // --- 新增：将合成出的新物品加入底部物品栏 ---
    this.addToInventoryIfNotExists(resultData.result);

    // 检查门状态
    this.checkDoorProgress(resultData.result);

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

// 粒子特效 - 奶酪珠风格
Game.prototype.showSynthesisParticles = function(x, y) {
    const synthesisArea = document.getElementById('synthesis-area');
    const centerX = x + 45; // 90px item size, center is +45
    const centerY = y + 45;
    
    // 1. 创建柔和波纹效果
    const ripple = document.createElement('div');
    ripple.className = 'synthesis-ripple';
    ripple.style.left = centerX + 'px';
    ripple.style.top = centerY + 'px';
    synthesisArea.appendChild(ripple);
    setTimeout(() => ripple.remove(), 800);
    
    // 2. 创建奶酪珠粒子 - 缓慢向上漂浮
    const count = 8;
    const container = document.createElement('div');
    container.className = 'particle-container';
    container.style.left = centerX + 'px';
    container.style.top = centerY + 'px';
    
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // 随机角度（主要向上），随机距离
        const angleSpread = Math.PI * 0.6; // 约108度范围
        const baseAngle = -Math.PI / 2; // 向上
        const angle = baseAngle + (Math.random() - 0.5) * angleSpread;
        const dist = 40 + Math.random() * 30;
        const tx = Math.cos(angle) * dist * (0.6 + Math.random() * 0.4);
        const ty = Math.sin(angle) * dist - 20; // 向上偏移更多
        
        // 随机大小 - 圆润的奶酪珠
        const size = 6 + Math.random() * 6;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        
        // 设置CSS变量供动画使用
        particle.style.setProperty('--tx', tx + 'px');
        particle.style.setProperty('--ty', ty + 'px');
        
        // 随机延迟，让粒子错开出现
        particle.style.animationDelay = (i * 0.05) + 's';
        
        container.appendChild(particle);
    }
    
    synthesisArea.appendChild(container);
    setTimeout(() => container.remove(), 1800);
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

    // 添加倒计时覆盖层
    setTimeout(() => {
        // 开始播放倒计时音效（循环）
        if (window.AudioManager) {
            window.AudioManager.playSFXLoop('timer-tick');
        }
        
        const overlay = document.createElement('div');
        overlay.className = 'timer-overlay';
        overlay.innerHTML = `
            <div class="timer-circle"></div>
            <div class="timer-text">${resultData.message || '酿造中...'}</div>
        `;
        item1.appendChild(overlay);
        item2.style.opacity = '0';
    }, 300);

    // 倒计时结束后合成
    setTimeout(() => {
        // 停止倒计时音效
        if (window.AudioManager) {
            window.AudioManager.stopSFXLoop('timer-tick');
        }
        this.performSynthesis(item1, item2, resultData);
    }, resultData.duration * 1000 + 300);
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
    }
};

// 更新门状态（单门用）
Game.prototype.updateDoorStage = function(stage) {
    this.doorStage = stage;
    
    const doorContainer = document.getElementById('door-container');
    const doorStatus = document.getElementById('door-status');
    
    if (doorContainer) {
        doorContainer.className = `door-container stage-${stage}`;
    }
    
    // 提示暂时禁用
};

// 检查关卡完成 - 目标物品合成后自动飞向门（支持双门）
Game.prototype.checkLevelCompletion = function(newItemName, synthAreaEl) {
    if (this.isDualDoor) {
        // 双门模式：看哪扇门需要这个物品
        const ds = this.doorStates.find(d => !d.done && d.target === newItemName);
        if (!ds) return;

        this.updateDoorStageFor(ds, 3);
        const targetEl = synthAreaEl || document.querySelector('#synthesis-area .game-item.target-item');
        if (!targetEl) return;

        const invCopy = document.querySelector('#inventory-area .game-item[data-name="' + newItemName + '"]');
        if (invCopy) invCopy.style.display = 'none';

        setTimeout(() => { targetEl.classList.add('target-breathe'); }, 1200);
        setTimeout(() => { this.autoOfferToDoor(targetEl, ds); }, 2200);
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
            setTimeout(() => { this.autoOfferToDoor(targetEl); }, 2200);
        }
    }
};

// 目标物品自动飞向门（支持双门：doorState 指定目标门）
Game.prototype.autoOfferToDoor = function(itemEl, doorState) {
    if (this.isTransitioning) return;
    if (!this.isDualDoor) this.targetReady = false;

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

    // 保存门位置供珠宝飞行动画使用
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

        // 物品栏少了一个物品，需要更新布局和珠宝位置
        this.updateInventoryLayout();

        if (doorState) {
            // 双门模式：标记这扇门完成
            this.completeDoor(doorState, itemEl);
        } else {
            this.performOffering(itemEl);
        }
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
        // 所有门完成 → 过关
        setTimeout(() => {
            this.showSuccessModal();
            window.LevelManager.completeLevel(this.levelId);
        }, 600);
    }
};

// 尝试献上物品到门 - 由拖拽系统调用
Game.prototype.tryOfferToDoor = function(itemEl) {
    if (this.isFreeMode) return false;
    
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
            this.performChapterTransition(itemEl);
        } else {
            itemEl.classList.add('offering-item');
            doorContainer.classList.add('offering');
            setTimeout(() => {
                itemEl.remove();
                doorContainer.classList.remove('offering');
                this.showSuccessModal();
                window.LevelManager.completeLevel(this.levelId);
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
    
    // 1. 物品变成星星飞向门 (0.8s)
    itemEl.classList.add('star-transform');
    
    setTimeout(() => {
        // 创建飞行的星星
        const star = document.createElement('div');
        star.className = 'flying-star';
        star.style.left = (itemRect.left + itemRect.width / 2 - 12) + 'px';
        star.style.top = (itemRect.top + itemRect.height / 2 - 12) + 'px';
        document.body.appendChild(star);
        
        // 移除原物品
        itemEl.remove();
        
        // 星星飞向门
        const doorCenterX = doorRect.left + doorRect.width / 2 - 12;
        const doorCenterY = doorRect.top + doorRect.height / 2 - 12;
        
        star.style.transition = 'all 1s cubic-bezier(0.4, 0, 0.2, 1)';
        requestAnimationFrame(() => {
            star.style.left = doorCenterX + 'px';
            star.style.top = doorCenterY + 'px';
            star.style.transform = 'scale(0.5)';
        });
        
        // 2. 星星进入门，门闪光后关闭 (1s后)
        setTimeout(() => {
            star.remove();
            doorContainer.classList.add('star-entering');
            
            // 门关闭（变黑）
            setTimeout(() => {
                doorContainer.classList.remove('star-entering');
                doorContainer.classList.add('closing');
                doorContainer.classList.add('closed');
                
                // 3. 背景变暖一点
                document.body.classList.remove('warmth-1', 'warmth-2', 'warmth-3', 'warmth-4', 'warmth-5');
                document.body.classList.add(`warmth-${Math.min(this.warmthLevel, 5)}`);
                
                // 4. 物品栏和物品发出金光 (0.3s后)
                setTimeout(() => {
                    this.performGoldenGlowTransition();
                }, 300);
                
            }, 400);
            
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

    // 等缩小动画完成后：先发珠宝 → 再显示关卡介绍 → 再做金光 + 物品变换
    setTimeout(() => {
        synthItems.forEach(item => item.remove());
        if (this.tradeStations) {
            this.tradeStations.forEach(ts => { if (ts.el) ts.el.remove(); });
            this.tradeStations = [];
            this.tradeStation = null;
        }

        // 在关卡介绍之前完成珠宝奖励
        const gemAwarded = !this.levelData.isSpecialArea
            ? window.LevelManager.completeLevel(this.levelId)
            : false;
        if (gemAwarded) {
            this.updateGemDisplay();
        }

        const gemDelay = gemAwarded ? 1600 : 0;

        setTimeout(() => {
            const proceedToNext = () => {
                const nextLevelId = this.getNextObjectiveLevelId();
                const nextLevelData = nextLevelId ? window.LevelManager.getLevelData(nextLevelId) : null;

                const savedLevelData = this.levelData;
                if (nextLevelData) this.levelData = nextLevelData;

                this.showLevelIntro().then(() => {
                    this.levelData = savedLevelData;

                    inventoryArea.classList.add('golden-glow');
                    currentItems.forEach(item => {
                        item.classList.add('golden-outline');
                    });

                    setTimeout(() => {
                        this.performItemTransition();
                    }, 600);
                });
            };

            if (this.levelId === 105) {
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
    
    const isNextRecipePhase = !!nextLevelData.recipeBookPhase;
    const newItemNames = isNextRecipePhase ? [] : (nextLevelData.initialItems || []);

    // ========== 第一阶段：所有旧物品 bubble-pop 消失 ==========
    const disappearInterval = 300;
    const disappearAnimationDuration = 1600;

    currentItems.forEach((oldItem, index) => {
        setTimeout(() => {
            oldItem.style.pointerEvents = 'none';
            oldItem.classList.remove('golden-outline');
            oldItem.style.animation = '';
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
        currentItems.forEach(item => item.remove());
    }, allDisappearTime);

    // ========== 第二阶段：所有新物品依次出现 ==========
    const appearInterval = 300;
    const appearAnimationDuration = 1900;
    const appearStartDelay = allDisappearTime > 0 ? 200 : 150;

    newItemNames.forEach((newItemName, index) => {
        setTimeout(() => {
            const newItem = this.createItemElement(newItemName);
            newItem.style.opacity = '0';
            newItem.style.transform = 'scale(0)';
            newItem.classList.add('in-inventory');
            inventoryArea.appendChild(newItem);
            requestAnimationFrame(() => {
                newItem.style.opacity = '';
                newItem.style.transform = '';
                newItem.classList.add('item-pop-in');
                this.createFoamParticles(newItem, 8);
            });
            setTimeout(() => {
                newItem.classList.remove('item-pop-in');
            }, appearAnimationDuration);
        }, allDisappearTime + appearStartDelay + index * appearInterval);
    });

    // 计算总过渡时间
    const totalTransitionTime = allDisappearTime + appearStartDelay +
        (newItemNames.length > 0
            ? newItemNames.length * appearInterval + appearAnimationDuration
            : 500);
    
    setTimeout(() => {
        // 完成当前目标，切换到下一个目标（特殊区域不奖励珠宝）
        if (this.levelData.isSpecialArea) {
            const p = window.LevelManager.currentProgress;
            if (!p.completedLevels.includes(this.levelId)) {
                p.completedLevels.push(this.levelId);
                window.LevelManager.saveProgress();
            }
        } else {
            window.LevelManager.completeLevel(this.levelId);
        }
        this.levelId = nextLevelId;
        this.levelData = nextLevelData;
        this.objectiveIndex = nextLevelData.objectiveIndex || 0;
        this._recipeBookPhaseActive = !!nextLevelData.recipeBookPhase;
        
        // 重置游戏状态
        this.doorStage = 0;
        this.discoveredTriggers = new Set();
        this.synthesizedItems = new Set();
        this.targetReady = false;
        
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
            const hideTarget = !!this.levelData.recipeBookPhase;
            const dc = document.getElementById('door-container');
            if (dc) dc.className = 'door-container stage-0';
            const doorIcon = document.getElementById('door-icon');
            const tItem = !hideTarget && this.levelData.target ? window.ITEMS[this.levelData.target] : null;
            if (doorIcon) {
                doorIcon.style.transition = 'opacity 0.3s ease';
                doorIcon.style.opacity = '0';
                setTimeout(() => {
                    doorIcon.textContent = hideTarget ? '' : (tItem?.icon || '');
                    doorIcon.style.opacity = '1';
                }, 300);
            }

            const targetDisplay = document.querySelector('.level-target-display');
            if (hideTarget) {
                if (targetDisplay) targetDisplay.style.display = 'none';
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
                inventoryArea.classList.remove('golden-fade');
                this.isTransitioning = false;
                this.startIdleTimer();
                this._autoShowRecipeBook();
                this._playLevelDialogs();

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
                    inventoryArea.classList.remove('golden-fade');
                    this.isTransitioning = false;
                    this.startIdleTimer();
                    this._autoShowRecipeBook();
                    this._playLevelDialogs();

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

    this.showExtractCard(itemName, itemEl);
};

// 配方书激活：先显示按钮，然后物品飞向按钮消失
Game.prototype.activateRecipeBook = function(itemEl) {
    // 先显示按钮
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
        const elapsed = window.LevelManager.getBasicLevelElapsedTime();
        const timeStr = window.LevelManager.formatElapsedTime(elapsed);
        const rating = window.LevelManager.getSpeedRating(elapsed);
        const completed = (window.LevelManager.currentProgress.completedLevels || [])
            .filter(id => id >= 101 && id <= 105).length;
        const gems = completed * 50;

        const overlay = document.createElement('div');
        overlay.className = 'settlement-overlay';
        overlay.innerHTML =
            '<div class="settlement-content">' +
                '<div class="settlement-title">阶段完成</div>' +
                '<div class="settlement-sep"></div>' +
                '<div class="settlement-stats">' +
                    '<div class="settlement-stat">' +
                        '<span class="settlement-stat-icon">⏱</span>' +
                        '<span>用时</span>' +
                        '<span class="settlement-stat-value">' + timeStr + '</span>' +
                    '</div>' +
                    '<div class="settlement-stat">' +
                        '<span class="settlement-stat-icon">' + rating.icon + '</span>' +
                        '<span>评价</span>' +
                        '<span class="settlement-stat-value" style="color:' + rating.color + '">' + rating.name + '</span>' +
                    '</div>' +
                    '<div class="settlement-stat">' +
                        '<span class="settlement-stat-icon">💎</span>' +
                        '<span>获得珠宝</span>' +
                        '<span class="settlement-stat-value">' + gems + '</span>' +
                    '</div>' +
                '</div>' +
                '<div class="settlement-message">' +
                    '你已经掌握了酿造的基础语言<br>' +
                    '接下来将是一个挑战<br>' +
                    '可以先休息一下' +
                '</div>' +
                '<div class="settlement-buttons">' +
                    '<button class="settlement-btn settlement-btn-exit">休息一下</button>' +
                    '<button class="settlement-btn settlement-btn-continue">继续挑战</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);
        overlay.offsetHeight;
        overlay.classList.add('visible');

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
                    resolve();
                }
            }, 650);
        };

        exitBtn.addEventListener('click', () => dismiss(true));
        continueBtn.addEventListener('click', () => dismiss(false));
    });
};

