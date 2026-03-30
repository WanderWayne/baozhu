// 游戏核心逻辑 - UI模块
// ================================================

// 显示提取卡（配方来路/去路）
Game.prototype.showExtractCard = function(itemName, itemEl) {
    const itemData = window.ITEMS[itemName];
    if (!itemData) return;
    
    // 查找配方来路（这个物品是怎么合成的）
    const originRecipes = window.RECIPES.filter(r => r.result === itemName);
    
    // 查找配方去路（这个物品可以合成什么）
    const nextRecipes = window.RECIPES.filter(r => r.ingredients.includes(itemName));
    
    // 检查是否有可提取的成分
    const extractable = itemData.extracts || null;
    
    // 构建提取卡内容
    let originHtml = '';
    if (originRecipes.length > 0) {
        const discoveredItems = window.LevelManager.currentProgress.discoveredItems || [];
        originHtml = originRecipes.map(r => {
            const ing1Data = window.ITEMS[r.ingredients[0]] || {};
            const ing2Data = window.ITEMS[r.ingredients[1]] || {};
            // 只显示已发现的配方
            const known = discoveredItems.includes(r.ingredients[0]) && discoveredItems.includes(r.ingredients[1]);
            if (!known) return '';
            return `<div class="extract-recipe">
                <span class="recipe-item">${ing1Data.icon || '?'} ${r.ingredients[0]}</span>
                <span class="recipe-plus">+</span>
                <span class="recipe-item">${ing2Data.icon || '?'} ${r.ingredients[1]}</span>
            </div>`;
        }).filter(Boolean).join('') || '<div class="extract-unknown">未知来源</div>';
    } else {
        originHtml = '<div class="extract-unknown">基础原料</div>';
    }
    
    let nextHtml = '';
    if (nextRecipes.length > 0) {
        const discoveredItems = window.LevelManager.currentProgress.discoveredItems || [];
        nextHtml = nextRecipes.slice(0, 3).map(r => {
            const resultData = window.ITEMS[r.result] || {};
            // 只显示已发现的结果
            if (!discoveredItems.includes(r.result)) {
                return `<div class="extract-recipe next-recipe">
                    <span class="recipe-result">??? 未知配方</span>
                </div>`;
            }
            return `<div class="extract-recipe next-recipe">
                <span class="recipe-result">${resultData.icon || '?'} ${r.result}</span>
            </div>`;
        }).join('');
    } else {
        nextHtml = '<div class="extract-unknown">暂无已知用途</div>';
    }
    
    // 提取按钮（如果有可提取成分）
    let extractBtnHtml = '';
    if (extractable && extractable.length > 0) {
        const extractData = window.ITEMS[extractable[0]] || {};
        extractBtnHtml = `
            <button class="extract-action-btn" data-extract="${extractable[0]}">
                <span class="extract-icon">🔮</span>
                <span>提取 ${extractData.icon || ''} ${extractable[0]}</span>
            </button>
        `;
    }
    
    const modal = document.createElement('div');
    modal.className = 'extract-card-modal';
    modal.innerHTML = `
        <div class="extract-card">
            <div class="extract-header">
                <span class="extract-item-icon">${itemData.icon}</span>
                <span class="extract-item-name">${itemName}</span>
            </div>
            <div class="extract-desc">${itemData.desc || ''}</div>
            
            <div class="extract-section">
                <div class="extract-section-title">📥 来源</div>
                <div class="extract-section-content">${originHtml}</div>
            </div>
            
            <div class="extract-section">
                <div class="extract-section-title">📤 用途</div>
                <div class="extract-section-content">${nextHtml}</div>
            </div>
            
            ${extractBtnHtml}
            
            <button class="extract-close-btn">关闭</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 动画显示
    requestAnimationFrame(() => {
        modal.classList.add('visible');
    });
    
    // 关闭按钮
    modal.querySelector('.extract-close-btn').addEventListener('click', () => {
        modal.classList.remove('visible');
        setTimeout(() => modal.remove(), 300);
    });
    
    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('visible');
            setTimeout(() => modal.remove(), 300);
        }
    });
    
    // 提取按钮（如果有）
    const extractBtn = modal.querySelector('.extract-action-btn');
    if (extractBtn) {
        extractBtn.addEventListener('click', () => {
            const extractName = extractBtn.dataset.extract;
            this.performExtraction(itemEl, extractName);
            modal.classList.remove('visible');
            setTimeout(() => modal.remove(), 300);
        });
    }
};

// 获取下一关（基于世界的levels列表顺序）
Game.prototype.getNextLevel = function() {
    const world = window.WORLDS.find(w => w.levels.includes(this.levelId));
    if (!world) return null;
    
    const currentIndex = world.levels.indexOf(this.levelId);
    
    // 当前世界还有下一关
    if (currentIndex < world.levels.length - 1) {
        const nextLevelId = world.levels[currentIndex + 1];
        return window.LEVELS.find(l => l.id === nextLevelId);
    }
    
    // 当前世界已完成，检查下一个世界
    const nextWorld = window.WORLDS.find(w => w.id === world.id + 1);
    if (nextWorld && window.LevelManager.isWorldUnlocked(nextWorld.id)) {
        const nextLevelId = nextWorld.levels[0];
        return window.LEVELS.find(l => l.id === nextLevelId);
    }
    
    return null;
};

// 显示成功弹窗
Game.prototype.showSuccessModal = function() {
    // 清理关卡提示定时器
    if (this.levelHintInterval) {
        clearInterval(this.levelHintInterval);
        this.levelHintInterval = null;
    }
    
    // 检查是否完成了第5个基础关卡(104)且未领取过奖励
    if (this.levelId === 104 && !window.LevelManager.hasClaimedBasicReward()) {
        this.showBasicCompletionScreen();
        return;
    }
    
    const itemData = window.ITEMS[this.levelData.target];
    const nextLevel = this.getNextLevel();
    
    // 检查并解锁成就
    const achievementId = this.levelData.targetId;
    let achievementHtml = '';
    
    if (achievementId && window.ACHIEVEMENTS.recipes[achievementId]) {
        const wasNew = window.LevelManager.unlockAchievement(achievementId);
        const achievement = window.ACHIEVEMENTS.recipes[achievementId];
        
        if (wasNew) {
            achievementHtml = `
                <div class="achievement-badge new">
                    <div class="badge-icon">${achievement.icon}</div>
                    <div class="badge-info">
                        <div class="badge-title">🎉 获得徽章</div>
                        <div class="badge-name">${achievement.name}</div>
                    </div>
                </div>
            `;
        }
    }
    
    // 检查世界完成成就
    this.checkWorldCompletion();
    
    // 获取过渡文案（使用实际的下一关ID）
    const nextLevelId = nextLevel ? nextLevel.id : null;
    const transitionKey = `${this.levelId}to${nextLevelId}`;
    const transitionText = window.STORY.transitions[transitionKey] || '';
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="success-modal">
            <div class="success-icon">${itemData.icon}</div>
            <div class="success-title">${this.levelData.completionText}</div>
            <div class="success-subtitle">${this.levelData.target}</div>
            
            ${achievementHtml}
            
            <div class="culture-note">
                "${this.levelData.cultureNote}"
            </div>
            
            <div class="real-product">
                ${this.levelData.realProductNote}
            </div>
            
            ${transitionText ? `<div class="transition-text">${transitionText}</div>` : ''}
            
            <div class="modal-buttons">
                <button class="modal-btn secondary" onclick="goToMap()">返回地图</button>
                ${nextLevel ? `<button class="modal-btn" onclick="nextLevel()">继续探索</button>` : ''}
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    window.goToMap = () => {
        const worldId = this.levelData.worldId || 1;
        const url = `levels.html?world=${worldId}`;
        if (window.navigateTo) window.navigateTo(url);
        else window.location.href = url;
    };

    window.nextLevel = () => {
        if (nextLevel) {
            if (window.navigateTo) window.navigateTo(`game.html?level=${nextLevel.id}`);
            else window.location.href = `game.html?level=${nextLevel.id}`;
        }
    };
};

// 显示基础关卡完成画面
Game.prototype.showBasicCompletionScreen = function() {
    const overlay = document.getElementById('basic-completion-overlay');
    if (!overlay) return;
    
    // 获取耗时和评级
    const elapsedTime = window.LevelManager.getBasicLevelElapsedTime();
    const timeText = window.LevelManager.formatElapsedTime(elapsedTime);
    const speedRating = window.LevelManager.getSpeedRating(elapsedTime);
    
    // 获取探索进度
    const explorationProgress = window.LevelManager.getExplorationProgress();
    
    // 获取当前称号
    const currentTitle = window.LevelManager.getCurrentTitle();
    
    // 填充数据
    document.getElementById('completion-time').textContent = timeText;
    document.getElementById('completion-progress').textContent = explorationProgress;
    
    // 设置速度评级
    const speedBadge = document.getElementById('speed-badge');
    speedBadge.querySelector('.speed-icon').textContent = speedRating.icon;
    speedBadge.querySelector('.speed-name').textContent = speedRating.name;
    speedBadge.className = `speed-badge tier-${speedRating.tier}`;
    
    // 设置旧称号
    const oldTitleEl = document.getElementById('old-title');
    oldTitleEl.querySelector('.title-icon').textContent = currentTitle.icon;
    oldTitleEl.querySelector('.title-name').textContent = currentTitle.name;
    
    // 显示画面
    overlay.classList.remove('hidden');
    
    // 绑定领取奖励按钮
    const claimBtn = document.getElementById('claim-reward-btn');
    claimBtn.onclick = () => this.claimBasicReward();
};

// 领取基础关卡奖励
Game.prototype.claimBasicReward = function() {
    // 隐藏领取按钮区域
    document.querySelector('.completion-reward-btn').classList.add('hidden');
    
    // 升级称号
    const newTitle = window.LevelManager.upgradeTitle();
    
    // 显示新称号
    const newTitleEl = document.getElementById('new-title');
    newTitleEl.querySelector('.title-icon').textContent = newTitle.icon;
    newTitleEl.querySelector('.title-name').textContent = newTitle.name;
    
    // 显示奖励区域
    document.getElementById('reward-display').classList.remove('hidden');
    
    // 延迟显示继续按钮
    setTimeout(() => {
        document.getElementById('continue-section').classList.remove('hidden');
        
        // 绑定继续按钮
        document.getElementById('continue-explore-btn').onclick = () => {
            window.LevelManager.claimBasicReward();
            if (window.navigateTo) window.navigateTo('game.html?level=3');
            else window.location.href = 'game.html?level=3';
        };
        
        document.getElementById('rest-btn').onclick = () => {
            window.LevelManager.claimBasicReward();
            const worldId = this.levelData?.worldId || 1;
            const url = `levels.html?world=${worldId}`;
            if (window.navigateTo) window.navigateTo(url);
            else window.location.href = url;
        };
    }, 800);
};

// 检查世界完成成就
Game.prototype.checkWorldCompletion = function() {
    const world = window.WORLDS.find(w => w.levels.includes(this.levelId));
    if (!world) return;
    
    const allLevelsCompleted = world.levels.every(lid => 
        window.LevelManager.isLevelCompleted(lid) || lid === this.levelId
    );
    
    if (allLevelsCompleted) {
        const achievementId = `world_${world.id}_complete`;
        window.LevelManager.unlockAchievement(achievementId);
    }
    
    // 检查是否全部完成
    const allLevels = window.LEVELS.map(l => l.id);
    const allComplete = allLevels.every(lid => 
        window.LevelManager.isLevelCompleted(lid) || lid === this.levelId
    );
    
    if (allComplete) {
        window.LevelManager.unlockAchievement('all_complete');
    }
};

// Toast 消息（暂时禁用所有提示）
Game.prototype.showToast = function(msg, duration = 4000) {
    return;
};

// 发现新物品提示（增强版）
Game.prototype.showDiscoveryToast = function(itemName, msg, fragment) {
    const itemData = window.ITEMS[itemName];
    
    // 如果有碎片，显示增强版发现弹窗
    if (fragment) {
        this.showFragmentDiscovery(itemName, itemData, fragment);
        return;
    }
    
    // 普通发现提示
    const toast = document.createElement('div');
    toast.className = 'discovery-toast';
    toast.innerHTML = `<span class="icon">${itemData?.icon || '✨'}</span> 发现：${itemName}`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 2500);

    // 如果有额外消息，延迟显示
    if (msg) {
        setTimeout(() => {
            this.showToast(msg);
        }, 2000);
    }
};

// 显示碎片发现弹窗
Game.prototype.showFragmentDiscovery = function(itemName, itemData, fragment) {
    const modal = document.createElement('div');
    modal.className = 'fragment-discovery-modal';
    modal.innerHTML = `
        <div class="fragment-discovery-content">
            <div class="discovery-header">
                <span class="discovery-star">✨</span>
                <span class="discovery-title">新发现！</span>
                <span class="discovery-star">✨</span>
            </div>
            
            <div class="discovery-item">
                <div class="item-icon">${itemData?.icon || '❓'}</div>
                <div class="item-name">${itemName}</div>
            </div>
            
            <div class="fragment-unlock">
                <div class="fragment-badge">
                    <span class="fragment-image">${fragment.image}</span>
                    <span class="fragment-label">记忆碎片</span>
                </div>
                <div class="fragment-text">"${fragment.text}"</div>
            </div>
            
            <div class="discovery-progress">
                <span class="progress-icon">📖</span>
                <span>配方图鉴已更新</span>
            </div>
            
            <button class="discovery-continue-btn">继续探索</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 添加动画
    requestAnimationFrame(() => {
        modal.classList.add('visible');
    });
    
    // 点击继续按钮关闭
    modal.querySelector('.discovery-continue-btn').addEventListener('click', () => {
        modal.classList.remove('visible');
        setTimeout(() => modal.remove(), 300);
    });
    
    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('visible');
            setTimeout(() => modal.remove(), 300);
        }
    });
};

// 空闲计时器
Game.prototype.startIdleTimer = function() {
    this.resetIdleTimer();
};

Game.prototype.resetIdleTimer = function() {
    if (this.idleTimer) {
        clearTimeout(this.idleTimer);
    }
    this.idleTimer = setTimeout(() => {
        this.showIdleHint();
    }, this.idleTimeout);
};

Game.prototype.showIdleHint = function() {
    this.showToast(window.TIPS.idle5s, 4000);
    this.resetIdleTimer();
};

// ==================== 配方书系统 ====================

Game.prototype.showRecipeBookButton = function() {
    if (document.getElementById('recipe-book-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'recipe-book-btn';
    btn.className = 'recipe-book-btn golden-pulse';
    btn.textContent = '📖 配方书';
    btn.addEventListener('click', () => {
        btn.classList.remove('golden-pulse');
        if (window.AudioManager) window.AudioManager.playSFX('craft-normal');
        this.openRecipeBook();
    });
    document.getElementById('door-area').appendChild(btn);

    btn.style.transform = 'scale(0)';
    btn.style.opacity = '0';
    btn.offsetHeight;
    btn.style.transition = 'transform 0.4s cubic-bezier(0, 0, 0.2, 1.2), opacity 0.3s ease';
    btn.style.transform = 'scale(1)';
    btn.style.opacity = '1';
};

// 记载页配方（由配方书物品提供的固定配方）
Game.prototype._recordedRecipes = [
    { name: '奶酪', icon: '🧀', formula: '牛奶 + 酿造', note: '100°C 低温烤制' },
    { name: '甜牛奶', icon: '🥛', formula: '牛奶 + 冰糖碎', note: '甜蜜的开始' },
    { name: '雪酪', icon: '🍨', formula: '甜牛奶 + 酿造', note: '甜液体凝固，轻盈版酪' },
    { name: '双酪', icon: '🍨', formula: '奶酪 + 雪酪', note: '厚与轻，一体两面',
      lockedFormula: '失去了配方', lockedNote: '重要的原料。只记得方法跟它的名字一样。' },
    { name: '玫瑰酒酿', icon: '🌹', formula: '玫瑰 + 酒酿原浆', note: '花香融入酒酿' },
    { name: '酒酿玫瑰酪', icon: '🌹', formula: '双酪 + 玫瑰酒酿', note: '双酪为底，玫瑰酒酿为魂' },
    { name: '桂花酒酿', icon: '🌼', formula: '桂花 + 酒酿原浆', note: '秋天最温柔的香气' },
];

Game.prototype.openRecipeBook = function() {
    if (document.getElementById('recipe-book-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'recipe-book-overlay';
    overlay.className = 'recipe-book-overlay';

    overlay.innerHTML = `
        <div class="recipe-book-page">
            <div class="recipe-book-header">
                <span class="recipe-book-title">酿 造 手 札</span>
                <button class="recipe-book-close" id="recipe-book-close">✕</button>
            </div>
            <div class="recipe-book-search">
                <input type="text" class="recipe-search-input" id="recipe-search" placeholder="搜索配方...">
            </div>
            <div class="recipe-book-tabs">
                <button class="recipe-tab active" data-tab="recorded">记载</button>
                <button class="recipe-tab" data-tab="discovered">发现</button>
            </div>
            <div class="recipe-book-divider"></div>
            <div class="recipe-book-content" id="recipe-book-list"></div>
            <div class="recipe-book-footer">— 记载于宝珠酿造坊 —</div>
        </div>
    `;

    document.body.appendChild(overlay);

    // State
    let currentTab = 'recorded';
    const listEl = overlay.querySelector('#recipe-book-list');
    const searchInput = overlay.querySelector('#recipe-search');
    const self = this;

    function renderList() {
        const query = searchInput.value.trim().toLowerCase();
        let entries = [];

        if (currentTab === 'recorded') {
            const discovered = new Set(window.LevelManager.currentProgress.discoveredItems || []);
            entries = self._recordedRecipes.map(r => {
                if (r.lockedFormula && !discovered.has(r.name)) {
                    return { icon: r.icon, name: r.name, formula: r.lockedFormula, note: r.lockedNote || '' };
                }
                return { icon: r.icon, name: r.name, formula: r.formula, note: r.note };
            });
        } else {
            const recordedNames = new Set(self._recordedRecipes.map(r => r.name));
            const discovered = window.LevelManager.currentProgress.discoveredItems || [];
            discovered.forEach(itemName => {
                const itemData = window.ITEMS[itemName];
                if (!itemData) return;
                if (itemData.type === 'base' || itemData.type === 'tool' || itemData.type === 'process') return;
                if (itemData.isRecipeBook) return;
                if (recordedNames.has(itemName)) return;

                const recipe = window.RECIPES.find(r => r.result === itemName);
                const formula = recipe ? recipe.ingredients.join(' + ') : '未知来源';
                entries.push({
                    icon: itemData.icon || '?',
                    name: itemName,
                    formula: formula,
                    note: itemData.desc || ''
                });
            });
        }

        if (query) {
            entries = entries.filter(e =>
                e.name.toLowerCase().includes(query) ||
                e.formula.toLowerCase().includes(query)
            );
        }

        if (entries.length === 0) {
            listEl.innerHTML = '<div class="recipe-empty">' +
                (query ? '没有找到匹配的配方' : (currentTab === 'discovered' ? '还没有发现任何配方' : '暂无记载')) +
                '</div>';
            return;
        }

        listEl.innerHTML = entries.map(r => `
            <div class="recipe-entry">
                <span class="recipe-icon">${r.icon}</span>
                <div class="recipe-detail">
                    <div class="recipe-name">${r.name}</div>
                    <div class="recipe-formula">${r.formula}</div>
                    <div class="recipe-note">${r.note}</div>
                </div>
            </div>
        `).join('');
    }

    // Tab switching
    overlay.querySelectorAll('.recipe-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            overlay.querySelectorAll('.recipe-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTab = tab.dataset.tab;
            renderList();
        });
    });

    // Search
    searchInput.addEventListener('input', renderList);

    // Initial render
    renderList();

    overlay.offsetHeight;
    overlay.classList.add('visible');

    // Close
    const closeBook = () => {
        overlay.classList.remove('visible');
        setTimeout(() => overlay.remove(), 300);
    };
    overlay.querySelector('#recipe-book-close').addEventListener('click', closeBook);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeBook();
    });
};

