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
            const i1svg = window.ITEM_SVGS && window.ITEM_SVGS[r.ingredients[0]];
            const i2svg = window.ITEM_SVGS && window.ITEM_SVGS[r.ingredients[1]];
            const i1icon = i1svg ? `<span class="recipe-item-svg">${i1svg}</span>` : (ing1Data.icon || '?');
            const i2icon = i2svg ? `<span class="recipe-item-svg">${i2svg}</span>` : (ing2Data.icon || '?');
            return `<div class="extract-recipe">
                <span class="recipe-item">${i1icon} ${r.ingredients[0]}</span>
                <span class="recipe-plus">+</span>
                <span class="recipe-item">${i2icon} ${r.ingredients[1]}</span>
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
            const rSvg = window.ITEM_SVGS && window.ITEM_SVGS[r.result];
            const rIcon = rSvg ? `<span class="recipe-item-svg">${rSvg}</span>` : (resultData.icon || '?');
            return `<div class="extract-recipe next-recipe">
                <span class="recipe-result">${rIcon} ${r.result}</span>
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
    
    const headerSvg = window.ITEM_SVGS && window.ITEM_SVGS[itemName];
    const headerIconHtml = headerSvg
        ? `<span class="extract-item-icon extract-item-icon-svg">${headerSvg}</span>`
        : `<span class="extract-item-icon">${itemData.icon}</span>`;

    const modal = document.createElement('div');
    modal.className = 'extract-card-modal';
    modal.innerHTML = `
        <div class="extract-card">
            <div class="extract-header">
                ${headerIconHtml}
                <span class="extract-item-name">${itemName}</span>
            </div>
            <div class="extract-basic-block">
                <div class="extract-section-title">基础信息</div>
                <div class="extract-desc">${itemData.desc || ''}</div>
            </div>
            
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
        if (window.AudioManager) window.AudioManager.playClickExit();
        modal.classList.remove('visible');
        setTimeout(() => modal.remove(), 300);
    });
    
    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            if (window.AudioManager) window.AudioManager.playClickExit();
            modal.classList.remove('visible');
            setTimeout(() => modal.remove(), 300);
        }
    });
    
    // 提取按钮（如果有）
    const extractBtn = modal.querySelector('.extract-action-btn');
    if (extractBtn) {
        extractBtn.addEventListener('click', () => {
            if (window.AudioManager) window.AudioManager.playClickOpen();
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

/** 第一章 Boss（106）通关：黑幕 → 星尘聚合漂浮 → 文案 → 回主界面渐亮（图谱仅后台 unlock） */
Game.prototype.showChapter1AtlasRewardScreen = function() {
    if (window.LevelManager) {
        window.LevelManager.refreshAtlasUnlocks();
        window.LevelManager.saveProgress();
    }
    if (window.AudioManager) window.AudioManager.fadeOutBGM(1400);
    if (typeof window.startChapter1EndingCosmic === 'function') {
        window.startChapter1EndingCosmic();
    }
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
                <button class="modal-btn" onclick="goToMap()">返回地图</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    window.goToMap = () => {
        const worldId = this.levelData.worldId || 1;
        const url = `levels.html?world=${worldId}`;
        if (window.AudioManager) window.AudioManager.playClickExit();
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
    claimBtn.onclick = () => {
        if (window.AudioManager) window.AudioManager.playClickOpen();
        this.claimBasicReward();
    };
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
            if (window.AudioManager) window.AudioManager.playClickOpen();
            window.LevelManager.claimBasicReward();
            if (window.navigateTo) window.navigateTo('game.html?level=3');
            else window.location.href = 'game.html?level=3';
        };
        
        document.getElementById('rest-btn').onclick = () => {
            if (window.AudioManager) window.AudioManager.playClickExit();
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

// 发现新物品提示
Game.prototype.showDiscoveryToast = function(itemName, msg, fragment) {
    const itemData = window.ITEMS[itemName];
    
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
                <span>宝珠图谱已更新</span>
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
        if (window.AudioManager) window.AudioManager.playClickOpen();
        modal.classList.remove('visible');
        setTimeout(() => modal.remove(), 300);
    });
    
    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            if (window.AudioManager) window.AudioManager.playClickExit();
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
        this.openRecipeBook();
    });
    document.getElementById('door-area').appendChild(btn);

    btn.style.transform = 'scale(0)';
    btn.style.opacity = '0';
    btn.offsetHeight;
    btn.style.transition = 'transform 0.4s cubic-bezier(0, 0, 0.2, 1.2), opacity 0.3s ease';
    btn.style.transform = 'scale(1)';
    btn.style.opacity = '1';

    // 首次显示配方书按钮时，使用新手引导提示玩家
    if (!localStorage.getItem('tut_recipeBookBtn') && window.TutorialGuide) {
        localStorage.setItem('tut_recipeBookBtn', '1');
        setTimeout(() => {
            window.TutorialGuide.show({
                target: btn,
                text: '点击这里查看配方书',
                position: 'bottom',
                padding: 8,
                borderRadius: 20
            });
        }, 600);
    }
};

// 记载页配方（由配方书物品提供的固定配方）
// category: 'ingredient' = 小料, 'beverage' = 饮品
Game.prototype._recordedRecipes = [
    { name: '奶酪', icon: '🧀', formula: '牛奶 + 发酵 → 酸奶；酸奶 + 滤布', note: '滤去乳清凝酪', category: 'ingredient' },
    { name: '甜牛奶', icon: '🥛', formula: '牛奶 + 冰糖碎', note: '甜蜜的开始', category: 'ingredient' },
    { name: '雪酪', icon: '🍨', formula: '甜牛奶 + 发酵 → 甜酸奶；甜酸奶 + 滤布', note: '轻盈滤酪', category: 'ingredient' },
    { name: '双酪', icon: '🍨', formula: '奶酪 + 雪酪', note: '厚与轻，一体两面', category: 'ingredient',
      lockedFormula: '失去了配方，好像跟它的名字有关系', skipWriteRecipe: true },
    { name: '玫瑰酒酿', icon: '🌹', formula: '玫瑰 + 酒酿原浆', note: '花香融入酒酿', category: 'ingredient' },
    { name: '桂花酒酿', icon: '🌼', formula: '桂花 + 酒酿原浆', note: '秋天最温柔的香气', category: 'ingredient' },
    { name: '酒酿玫瑰酪', icon: '🌹', formula: '双酪 + 玫瑰酒酿', note: '双酪为底，玫瑰酒酿为魂', category: 'beverage' },
    { name: '酒酿桂花酪', icon: '🌼', formula: '双酪 + 桂花酒酿', note: '双酪与桂花酒酿的醇香融合', category: 'beverage' },
    { name: '冰酒酿桂花酪', icon: '🧊', formula: '酒酿桂花酪 + 冰块', note: '宝珠经典之作', category: 'beverage' },
];

Game.prototype.openRecipeBook = function() {
    if (document.getElementById('recipe-book-overlay')) return;

    if (window.AudioManager) window.AudioManager.playSFX('recipe-book');
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
            <div class="recipe-book-tab-hint">
                <span>记载：配方书中的固定配方</span>
                <span>发现：你游玩中自行解锁的配方</span>
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

    function getIconHTML(name, fallbackEmoji) {
        const svg = window.ITEM_SVGS && window.ITEM_SVGS[name];
        if (svg) return `<span class="recipe-icon recipe-icon-svg">${svg}</span>`;
        return `<span class="recipe-icon">${fallbackEmoji || '?'}</span>`;
    }

    /** 多步记载只展示最后一步（以；或 ; 分段） */
    function recipeBookFormulaDisplay(formula) {
        if (!formula || typeof formula !== 'string') return formula;
        const parts = formula.split(/[；;]/).map(s => s.trim()).filter(Boolean);
        return parts.length > 1 ? parts[parts.length - 1] : formula.trim();
    }

    function renderEntryHTML(r, showWriteBtn) {
        let extra = '';
        if (showWriteBtn) {
            extra = `<button class="recipe-write-btn" data-recipe="${r.name}">写入配方</button>`;
        }
        const classes = ['recipe-entry'];
        if (r._dualCheeseGoldenHint) classes.push('recipe-dual-cheese-hint');
        return `<div class="${classes.join(' ')}">
            ${getIconHTML(r.name, r.icon)}
            <div class="recipe-detail">
                <div class="recipe-name">${r.name}</div>
                <div class="recipe-formula">${recipeBookFormulaDisplay(r.formula)}</div>
                ${extra}
            </div>
        </div>`;
    }

    function renderList() {
        const query = searchInput.value.trim().toLowerCase();

        if (currentTab === 'recorded') {
            const discovered = new Set(window.LevelManager.currentProgress.discoveredItems || []);
            let allRecorded = self._recordedRecipes.map(r => {
                const isLocked = !!(r.lockedFormula && !discovered.has(r.name));
                const entry = isLocked
                    ? { icon: r.icon, name: r.name, formula: r.lockedFormula || '', note: r.note || '' }
                    : { icon: r.icon, name: r.name, formula: r.formula, note: r.note };
                entry.category = r.category || 'ingredient';
                entry._isLocked = isLocked;
                entry._originalRecipe = r;
                entry._showWriteBtn = isLocked && !r.skipWriteRecipe;
                entry._dualCheeseGoldenHint = isLocked && r.name === '双酪';
                return entry;
            });

            if (query) {
                allRecorded = allRecorded.filter(e =>
                    e.name.toLowerCase().includes(query) ||
                    e.formula.toLowerCase().includes(query)
                );
            }

            const ingredients = allRecorded.filter(e => e.category === 'ingredient');
            const beverages = allRecorded.filter(e => e.category === 'beverage');

            if (ingredients.length === 0 && beverages.length === 0) {
                listEl.innerHTML = '<div class="recipe-empty">' +
                    (query ? '没有找到匹配的配方' : '暂无记载') + '</div>';
                return;
            }

            let html = '';
            if (ingredients.length > 0) {
                html += '<div class="recipe-group-label">小料</div>';
                html += ingredients.map(e => renderEntryHTML(e, e._showWriteBtn)).join('');
            }
            if (beverages.length > 0) {
                html += '<div class="recipe-group-label">饮品</div>';
                html += beverages.map(e => renderEntryHTML(e, e._showWriteBtn)).join('');
            }
            listEl.innerHTML = html;

            // Bind write-recipe buttons
            listEl.querySelectorAll('.recipe-write-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const recipeName = btn.dataset.recipe;
                    const recipeData = self._recordedRecipes.find(r => r.name === recipeName);
                    if (recipeData) self.showRecipeWriteUI(recipeData, overlay);
                });
            });
        } else {
            const recordedNames = new Set(self._recordedRecipes.map(r => r.name));
            const discoveredList = window.LevelManager.currentProgress.discoveredItems || [];
            let entries = [];
            discoveredList.forEach(itemName => {
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

            if (query) {
                entries = entries.filter(e =>
                    e.name.toLowerCase().includes(query) ||
                    e.formula.toLowerCase().includes(query)
                );
            }

            if (entries.length === 0) {
                listEl.innerHTML = '<div class="recipe-empty">' +
                    (query ? '没有找到匹配的配方' : '还没有发现任何配方') + '</div>';
                return;
            }

            listEl.innerHTML = entries.map(renderEntryHTML).join('');
        }
    }

    // Tab switching
    overlay.querySelectorAll('.recipe-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            if (window.AudioManager) window.AudioManager.playSFX('recipe-tab');
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
        if (window.AudioManager) window.AudioManager.playSFX('recipe-book');
        overlay.classList.remove('visible');
        setTimeout(() => overlay.remove(), 300);
    };
    overlay.querySelector('#recipe-book-close').addEventListener('click', closeBook);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeBook();
    });
};

// ==================== 写入配方 UI ====================

Game.prototype.showRecipeWriteUI = function(recipeData, bookOverlay) {
    if (document.getElementById('recipe-write-overlay')) return;
    if (!recipeData || recipeData.skipWriteRecipe) return;

    // Find the actual recipe from RECIPES
    const actualRecipe = window.RECIPES.find(r => r.result === recipeData.name);
    if (!actualRecipe) return;

    const correctIngredients = actualRecipe.ingredients.slice().sort();
    const slotCount = correctIngredients.length; // typically 2

    // Available items = discovered items that aren't tools/processes/books
    const discoveredItems = (window.LevelManager.currentProgress.discoveredItems || []).filter(name => {
        const d = window.ITEMS[name];
        if (!d) return false;
        if (d.type === 'tool' || d.type === 'process' || d.isRecipeBook) return false;
        return true;
    });

    let slots = new Array(slotCount).fill(null);

    const ov = document.createElement('div');
    ov.id = 'recipe-write-overlay';
    ov.className = 'recipe-write-overlay';

    function getSlotIconHTML(name) {
        if (!name) return '<span class="rw-slot-empty">?</span>';
        const svg = window.ITEM_SVGS && window.ITEM_SVGS[name];
        if (svg) return `<span class="rw-slot-svg">${svg}</span>`;
        const d = window.ITEMS[name];
        return `<span class="rw-slot-emoji">${d?.icon || '?'}</span>`;
    }

    function render() {
        let slotsHTML = '';
        for (let i = 0; i < slotCount; i++) {
            const name = slots[i];
            const filled = name !== null;
            slotsHTML += `<div class="rw-slot ${filled ? 'filled' : ''}" data-idx="${i}">
                ${getSlotIconHTML(name)}
                ${filled ? `<span class="rw-slot-name">${name}</span>` : ''}
                ${filled ? `<button class="rw-slot-remove" data-idx="${i}">✕</button>` : ''}
            </div>`;
            if (i < slotCount - 1) slotsHTML += '<span class="rw-plus">+</span>';
        }

        const resultSvg = window.ITEM_SVGS && window.ITEM_SVGS[recipeData.name];
        const resultIcon = resultSvg
            ? `<span class="rw-result-svg">${resultSvg}</span>`
            : `<span class="rw-result-emoji">${recipeData.icon || '?'}</span>`;

        const allFilled = slots.every(s => s !== null);

        let itemsHTML = discoveredItems.map(name => {
            const inSlot = slots.includes(name);
            const svg = window.ITEM_SVGS && window.ITEM_SVGS[name];
            const icon = svg
                ? `<span class="rw-item-svg">${svg}</span>`
                : `<span class="rw-item-emoji">${(window.ITEMS[name]?.icon) || '?'}</span>`;
            return `<div class="rw-item ${inSlot ? 'rw-item-used' : ''}" data-name="${name}">
                ${icon}<span class="rw-item-name">${name}</span>
            </div>`;
        }).join('');

        ov.innerHTML = `
            <div class="rw-panel">
                <div class="rw-header">写入配方</div>
                <div class="rw-formula">
                    ${slotsHTML}
                    <span class="rw-arrow">→</span>
                    <div class="rw-result">
                        ${resultIcon}
                        <span class="rw-result-name">${recipeData.name}</span>
                    </div>
                </div>
                <div class="rw-items-label">选择原料</div>
                <div class="rw-items">${itemsHTML}</div>
                <div class="rw-actions">
                    <button class="rw-btn rw-cancel">取消</button>
                    <button class="rw-btn rw-confirm ${allFilled ? '' : 'disabled'}">确定</button>
                </div>
                <div class="rw-feedback" id="rw-feedback"></div>
            </div>
        `;

        // Bind events
        ov.querySelectorAll('.rw-slot-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.AudioManager) window.AudioManager.playClickOpen();
                const idx = parseInt(btn.dataset.idx);
                slots[idx] = null;
                render();
            });
        });

        ov.querySelectorAll('.rw-item:not(.rw-item-used)').forEach(el => {
            el.addEventListener('click', () => {
                if (window.AudioManager) window.AudioManager.playClickOpen();
                const name = el.dataset.name;
                const emptyIdx = slots.indexOf(null);
                if (emptyIdx === -1) return;
                slots[emptyIdx] = name;
                render();
            });
        });

        const cancelBtn = ov.querySelector('.rw-cancel');
        cancelBtn.addEventListener('click', () => {
            if (window.AudioManager) window.AudioManager.playClickExit();
            ov.classList.remove('visible');
            setTimeout(() => ov.remove(), 250);
        });

        const confirmBtn = ov.querySelector('.rw-confirm');
        if (allFilled) {
            confirmBtn.addEventListener('click', () => {
                if (window.AudioManager) window.AudioManager.playClickOpen();
                const attempt = slots.slice().sort();
                const correct = attempt.length === correctIngredients.length &&
                    attempt.every((v, i) => v === correctIngredients[i]);

                const fb = ov.querySelector('#rw-feedback');
                if (correct) {
                    fb.textContent = '配方正确！';
                    fb.className = 'rw-feedback rw-success';
                    if (window.AudioManager) window.AudioManager.playSFX('craft-target');
                    window.LevelManager.discoverItem(recipeData.name);
                    localStorage.setItem('baozhu_recipe_written_' + recipeData.name, '1');
                    if (window.LevelManager && window.LevelManager.refreshAtlasUnlocks()) {
                        window.LevelManager.saveProgress();
                    }
                    setTimeout(() => {
                        ov.classList.remove('visible');
                        setTimeout(() => {
                            ov.remove();
                            // Re-render recipe book list
                            if (bookOverlay) {
                                const listEl = bookOverlay.querySelector('#recipe-book-list');
                                const searchInput = bookOverlay.querySelector('#recipe-search');
                                if (listEl && searchInput) {
                                    // Trigger re-render by dispatching input event
                                    searchInput.dispatchEvent(new Event('input'));
                                }
                            }
                        }, 250);
                    }, 1200);
                } else {
                    fb.textContent = '配方不对，再想想...';
                    fb.className = 'rw-feedback rw-fail';
                    if (window.AudioManager) window.AudioManager.playSFX('error');
                    confirmBtn.classList.add('rw-shake');
                    setTimeout(() => confirmBtn.classList.remove('rw-shake'), 500);
                }
            });
        }
    }

    document.body.appendChild(ov);
    render();
    ov.offsetHeight;
    ov.classList.add('visible');
};

/** 本局合成路径指纹（用于「殊途同归」判定） */
Game.prototype._buildCompletionRouteFingerprint = function() {
    const steps = this._synthRouteSteps || [];
    return steps
        .map(s => [...s.ingredients].sort().join('+') + '→' + s.result)
        .join('|');
};

/**
 * 通关反馈：「完美」「殊途同归」——当前已暂时关闭弹层。
 * 仍写入首次通关合成路径指纹，便于日后恢复判定。
 */
Game.prototype.showCompletionBadgesOverlay = function() {
    if (this.isFreeMode) return Promise.resolve();

    const fp = this._buildCompletionRouteFingerprint();
    window.LevelManager.trySetPrimaryCompletionRoute(this.levelId, fp);
    return Promise.resolve();
};

/* 暂时下线：完美 / 殊途同归 弹层链（恢复时删掉上面的短实现，启用下方逻辑）
Game.prototype.showCompletionBadgesOverlay = function() {
    if (this.isFreeMode) return Promise.resolve();

    const fp = this._buildCompletionRouteFingerprint();
    const primaryBefore = window.LevelManager.getPrimaryCompletionRoute(this.levelId);
    const wasReplay = !!this._levelWasAlreadyCompletedOnEntry;

    window.LevelManager.trySetPrimaryCompletionRoute(this.levelId, fp);

    const count = this._synthCount || 0;
    const min = this.levelData.minSynthCount;
    const showPerfect = typeof min === 'number' && min >= 0 && count === min;
    const showAlternate = wasReplay && !!primaryBefore && fp !== primaryBefore;

    const badges = [];
    if (showPerfect) {
        badges.push({
            kind: 'perfect',
            title: '完美',
            hint: `在本关的总合成次数等于关卡最少合成次数时出现。（本关最少：${min} 次）`
        });
    }
    if (showAlternate) {
        badges.push({
            kind: 'alternateRoute',
            title: '殊途同归',
            hint: '本关曾经通关过，这一次从开局到通关的合成顺序与第一次通关时不完全一致时出现。'
        });
    }

    if (badges.length === 0) return Promise.resolve();

    let chain = Promise.resolve();
    badges.forEach(b => {
        chain = chain.then(() => this._showSingleCompletionBadge(b));
    });
    return chain;
};
*/

Game.prototype._showSingleCompletionBadge = function(badge) {
    return new Promise(resolve => {
        const lm = window.LevelManager;
        const showHint = lm.shouldShowCompletionBadgeHint(badge.kind);

        const ov = document.createElement('div');
        ov.className = 'completion-badge-overlay';
        ov.setAttribute('role', 'dialog');
        ov.setAttribute('aria-label', badge.title);

        const panel = document.createElement('div');
        panel.className = 'completion-badge-panel';

        const titleEl = document.createElement('div');
        titleEl.className = 'completion-badge-title';
        titleEl.textContent = badge.title;
        panel.appendChild(titleEl);

        if (showHint) {
            const hintEl = document.createElement('p');
            hintEl.className = 'completion-badge-hint';
            hintEl.textContent = badge.hint;
            panel.appendChild(hintEl);
        }

        const tapEl = document.createElement('div');
        tapEl.className = 'completion-badge-tap';
        tapEl.textContent = '点击任意处继续';
        panel.appendChild(tapEl);

        ov.appendChild(panel);

        const done = () => {
            if (window.AudioManager) window.AudioManager.playClickOpen();
            ov.remove();
            document.removeEventListener('keydown', onKey);
            if (showHint) lm.markCompletionBadgeHintSeen(badge.kind);
            resolve();
        };

        const onKey = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                done();
            }
        };

        ov.addEventListener('click', done);
        document.addEventListener('keydown', onKey);

        document.body.appendChild(ov);
        ov.offsetHeight;
        requestAnimationFrame(() => ov.classList.add('visible'));
    });
};

