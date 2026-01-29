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
            } else if (result.type === 'instant') {
                this.performSynthesis(item1, item2, result);
            } else if (result.type === 'timer') {
                this.startTimerSynthesis(item1, item2, result);
            }
        }
    );
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
    
    // 如果是目标物品，添加金边效果
    if (!this.isFreeMode && resultData.result === this.levelData.target) {
        newItem.classList.add('target-item');
    }
    
    newItem.style.left = centerX + 'px';
    newItem.style.top = centerY + 'px';
    
    // 如果是首次发现或隐藏物品，添加神秘效果（静置揭晓）
    if (isFirstDiscovery || isHiddenItem) {
        this.applyMysteryEffect(newItem, resultData.result);
    }
    
    document.getElementById('synthesis-area').appendChild(newItem);

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

    // 检查是否完成关卡
    this.checkLevelCompletion(resultData.result);
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

// 检查门进度
Game.prototype.checkDoorProgress = function(newItemName) {
    if (!this.levelData.doorTriggers) return;

    // 检查是否触发新阶段
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

// 更新门状态
Game.prototype.updateDoorStage = function(stage) {
    this.doorStage = stage;
    
    const doorContainer = document.getElementById('door-container');
    const doorStatus = document.getElementById('door-status');
    
    // 更新门样式
    doorContainer.className = `door-container stage-${stage}`;
    
    // 显示状态提示
    let statusText = '';
    switch (stage) {
        case 1:
            statusText = window.TIPS.doorStage1;
            break;
        case 2:
            statusText = window.TIPS.doorStage2;
            break;
        case 3:
            statusText = window.TIPS.doorStage3;
            break;
    }
    
    if (statusText) {
        doorStatus.textContent = statusText;
        doorStatus.classList.add('visible');
        setTimeout(() => {
            doorStatus.classList.remove('visible');
        }, 3000);
    }
};

// 检查关卡完成 - 改为只解锁门stage-3，不立即结算
Game.prototype.checkLevelCompletion = function(newItemName) {
    if (newItemName === this.levelData.target) {
        // 标记目标已就绪
        this.targetReady = true;
        
        // 更新门到最终状态（等待献上）
        this.updateDoorStage(3);
        
        // 添加等待献上状态
        const doorContainer = document.getElementById('door-container');
        doorContainer.classList.add('awaiting-offer');
        
        // 显示献上提示
        this.showDoorStatus('把它放到门前');
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
    
    // 检查是否有下一个目标（章节过渡）
    if (this.hasNextObjective()) {
        // 章节内过渡 - 星星动画
        this.performChapterTransition(itemEl);
    } else {
        // 最后一个目标或独立关卡 - 正常完成
        itemEl.classList.add('offering-item');
        doorContainer.classList.add('offering');
        
        setTimeout(() => {
            itemEl.remove();
            doorContainer.classList.remove('offering');
            
            // 正式完成关卡
            this.showSuccessModal();
            window.LevelManager.completeLevel(this.levelId);
        }, 600);
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
    
    // 物品栏发出金光
    inventoryArea.classList.add('golden-glow');
    
    // 物品发出金光轮廓
    currentItems.forEach(item => {
        item.classList.add('golden-outline');
    });
    
    // 金光闪烁后开始物品变换（0.6s后）
    setTimeout(() => {
        this.performItemTransition();
    }, 600);
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
    
    const newItemNames = nextLevelData.initialItems || [];
    
    // ========== 第一阶段：所有老物品按顺序消失 ==========
    const disappearInterval = 300; // 每个物品消失间隔
    const disappearAnimationDuration = 1600; // 消失动画时长
    
    currentItems.forEach((oldItem, index) => {
        setTimeout(() => {
            // 禁用交互
            oldItem.style.pointerEvents = 'none';
            // 移除金光
            oldItem.classList.remove('golden-outline');
            // 清除可能的内联动画样式
            oldItem.style.animation = '';
            
            // 等待一帧后再添加爆开动画，确保金光动画完全移除
            requestAnimationFrame(() => {
                // 创建泡沫粒子效果（减少粒子数量提升性能）
                this.createFoamParticles(oldItem, 8);
                // 添加爆开动画
                oldItem.classList.add('bubble-pop');
            });
            
            // 动画结束后隐藏元素（用 visibility 保持占位，避免布局重排）
            setTimeout(() => {
                oldItem.style.visibility = 'hidden';
            }, disappearAnimationDuration - 50);
        }, index * disappearInterval);
    });
    
    // 计算所有老物品消失完成的时间
    const allDisappearTime = currentItems.length * disappearInterval + disappearAnimationDuration;
    
    // 所有消失动画完成后，一次性清空物品栏
    setTimeout(() => {
        currentItems.forEach(item => item.remove());
    }, allDisappearTime);
    
    // ========== 第二阶段：新物品按顺序出现 ==========
    const appearInterval = 300; // 每个物品出现间隔
    const appearAnimationDuration = 1900; // 出现动画时长
    const appearStartDelay = 200; // 消失完成后稍等一下再开始出现
    
    newItemNames.forEach((newItemName, index) => {
        setTimeout(() => {
            const newItem = this.createItemElement(newItemName);
            // 先设置初始状态（隐藏），避免闪烁
            newItem.style.opacity = '0';
            newItem.style.transform = 'scale(0)';
            newItem.classList.add('in-inventory');
            inventoryArea.appendChild(newItem);
            
            // 下一帧再添加动画类，确保初始状态生效
            requestAnimationFrame(() => {
                newItem.style.opacity = '';
                newItem.style.transform = '';
                newItem.classList.add('item-pop-in');
                // 添加奶雾 pop 效果
                this.createFoamParticles(newItem, 8);
            });
            
            // 动画结束后移除动画类
            setTimeout(() => {
                newItem.classList.remove('item-pop-in');
            }, appearAnimationDuration);
        }, allDisappearTime + appearStartDelay + index * appearInterval);
    });
    
    // 计算所有物品变换完成的总时间
    const totalTransitionTime = allDisappearTime + appearStartDelay + 
        newItemNames.length * appearInterval + appearAnimationDuration;
    
    setTimeout(() => {
        // 完成当前目标，切换到下一个目标
        window.LevelManager.completeLevel(this.levelId);
        this.levelId = nextLevelId;
        this.levelData = nextLevelData;
        this.objectiveIndex = nextLevelData.objectiveIndex || 0;
        
        // 重置游戏状态
        this.doorStage = 0;
        this.discoveredTriggers = new Set();
        this.synthesizedItems = new Set();
        this.targetReady = false;
        
        // 清理提示计时器
        if (this.levelHintInterval) {
            clearInterval(this.levelHintInterval);
            this.levelHintInterval = null;
        }
        
        // 物品栏金光消失
        inventoryArea.classList.remove('golden-glow');
        inventoryArea.classList.add('golden-fade');
        
        // 更新物品栏布局
        this.updateInventoryLayout();
        
        // 更新门的目标图标
        const targetItem = window.ITEMS[this.levelData.target];
        const doorIcon = document.getElementById('door-icon');
        if (doorIcon) doorIcon.textContent = targetItem?.icon || '?';
        
        // 更新关卡信息
        const levelName = document.getElementById('level-name');
        if (levelName) levelName.textContent = this.levelData.name;
        this.updateTargetDisplay(this.levelData.target);
        
        // 清空合成区
        const synthesisArea = document.getElementById('synthesis-area');
        if (synthesisArea) {
            synthesisArea.innerHTML = '<div class="workbench-texture"></div>';
        }
        
        // 门打开动画（0.5s后）
        setTimeout(() => {
            doorContainer.classList.remove('closing', 'closed');
            doorContainer.classList.add('opening');
            doorContainer.className = 'door-container stage-0 opening';
            
            // 显示过渡文字
            const transitionText = this.getTransitionText();
            if (transitionText) {
                const textEl = document.createElement('div');
                textEl.className = 'chapter-transition-text';
                textEl.textContent = transitionText;
                document.body.appendChild(textEl);
                
                setTimeout(() => textEl.remove(), 2500);
            }
            
            // 完成过渡
            setTimeout(() => {
                doorContainer.classList.remove('opening');
                inventoryArea.classList.remove('golden-fade');
                this.isTransitioning = false;
                
                // 重启空闲计时器
                this.startIdleTimer();
                
                // 如果关卡有专属提示，定时显示
                if (this.levelData.levelHints && this.levelData.levelHints.length > 0) {
                    this.showLevelHints();
                }
            }, 800);
            
        }, 500);
        
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

// 长按物品处理 - 显示提取卡
Game.prototype.onItemLongPress = function(itemEl) {
    const itemName = itemEl.dataset.name;
    this.showExtractCard(itemName, itemEl);
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

