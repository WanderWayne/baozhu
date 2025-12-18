// 游戏核心逻辑 V2 - 可视化目标门
class Game {
    constructor() {
        // 检查是否是自由模式
        const params = new URLSearchParams(window.location.search);
        this.isFreeMode = params.get('mode') === 'free';
        
        if (this.isFreeMode) {
            this.initFreeMode();
            return;
        }
        
        this.levelId = this.getLevelFromUrl();
        this.levelData = window.LevelManager.getLevelData(this.levelId);
        
        if (!this.levelData) {
            alert('关卡不存在');
            window.location.href = 'index.html';
            return;
        }

        // 门状态：0=初始, 1=微光, 2=震动, 3=打开(等待献上)
        this.doorStage = 0;
        this.discoveredTriggers = new Set();
        this.synthesizedItems = new Set();
        
        // 目标是否已合成（等待献上）
        this.targetReady = false;
        
        // 静置揭晓相关
        this.revealTimers = new Map(); // itemElement -> timerId
        
        // 空闲计时器
        this.idleTimer = null;
        this.idleTimeout = 12000; // 12秒（增加空闲等待时间）

        // 检查是否需要显示教学动画（第一关且第一次玩）
        // 101 是新的第一个教学关，1 是旧的第一关（保持兼容）
        if ((this.levelId === 101 || this.levelId === 1) && !this.hasSeenTutorial()) {
            this.showTutorial();
        } else {
            this.hideTutorialImmediately();
            this.startGame();
        }
        
        window.GameInstance = this;
    }
    
    // 初始化自由探索模式
    initFreeMode() {
        this.synthesizedItems = new Set();
        this.revealTimers = new Map();
        this.idleTimer = null;
        this.idleTimeout = 15000;
        
        // 隐藏教学动画
        this.hideTutorialImmediately();
        
        // 设置自由模式UI
        this.setupFreeModeUI();
        
        // 初始化拖拽系统
        this.dragSystem = new window.DragSystem(this);
        
        window.GameInstance = this;
    }
    
    // 设置自由模式UI
    setupFreeModeUI() {
        // 修改门区域显示
        const doorContainer = document.getElementById('door-container');
        const levelName = document.getElementById('level-name');
        const levelTarget = document.getElementById('level-target');
        const doorIcon = document.getElementById('door-icon');
        
        if (doorContainer) doorContainer.className = 'door-container free-mode';
        if (levelName) levelName.textContent = '自由探索';
        if (levelTarget) levelTarget.textContent = '自由合成，发现新配方';
        if (doorIcon) doorIcon.textContent = '🧪';
        
        // 初始化物品栏 - 所有基础原料
        this.initFreeModeInventory();
        
        // 更新身份铭牌
        this.updateIdentityPlaque();
        
        // 绑定返回按钮
        document.getElementById('back-btn').addEventListener('click', () => {
            window.location.href = 'index.html';
        });
        
        // 显示自由模式提示
        setTimeout(() => {
            this.showToast('自由探索模式：尝试任意组合！', 3000);
        }, 500);
    }
    
    // 初始化自由模式物品栏
    initFreeModeInventory() {
        const inventory = document.getElementById('inventory-area');
        inventory.innerHTML = '';
        
        // 获取所有基础原料
        const baseItems = Object.entries(window.ITEMS)
            .filter(([name, data]) => data.type === 'base' || data.type === 'tool')
            .map(([name]) => name);
        
        baseItems.forEach(itemName => {
            const el = this.createItemElement(itemName);
            el.classList.add('in-inventory');
            inventory.appendChild(el);
        });
    }

    // 检查是否已看过教学
    hasSeenTutorial() {
        // 支持 URL 参数 ?tutorial=reset 强制重置教学
        const params = new URLSearchParams(window.location.search);
        if (params.get('tutorial') === 'reset') {
            localStorage.removeItem('baozhu_tutorial_seen');
            return false;
        }
        return localStorage.getItem('baozhu_tutorial_seen') === 'true';
    }

    // 标记已看过教学
    markTutorialSeen() {
        localStorage.setItem('baozhu_tutorial_seen', 'true');
    }

    // 显示教学动画
    showTutorial() {
        const overlay = document.getElementById('tutorial-overlay');
        const tutorialIcon = document.getElementById('tutorial-door-icon');
        const tutorialTarget = document.getElementById('tutorial-target-name');
        const skipBtn = document.getElementById('tutorial-skip-btn');
        
        // 设置教学动画中的目标物品
        const targetItem = window.ITEMS[this.levelData.target];
        if (tutorialIcon) tutorialIcon.textContent = targetItem?.icon || '🍨';
        if (tutorialTarget) tutorialTarget.textContent = this.levelData.target;
        
        // 显示教学覆盖层
        overlay.classList.remove('hidden');
        
        // 绑定跳过/继续按钮
        skipBtn.addEventListener('click', () => {
            this.dismissTutorial();
        });
        
        // 也允许点击任意位置跳过（延迟绑定，避免误触）
        setTimeout(() => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay || e.target.closest('.tutorial-content')) {
                    this.dismissTutorial();
                }
            }, { once: true });
        }, 2500);
    }

    // 关闭教学动画
    dismissTutorial() {
        const overlay = document.getElementById('tutorial-overlay');
        
        // 标记已看过
        this.markTutorialSeen();
        
        // 播放缩小动画
        overlay.classList.add('zoom-out');
        
        // 动画结束后隐藏并开始游戏
        setTimeout(() => {
            overlay.classList.add('fade-out');
            setTimeout(() => {
                overlay.classList.add('hidden');
                this.startGame();
            }, 300);
        }, 800);
    }

    // 立即隐藏教学（非第一关或已看过）
    hideTutorialImmediately() {
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) overlay.classList.add('hidden');
    }

    // 开始游戏（初始化UI和交互）
    startGame() {
        this.initUI();
        this.initDragSystem();
        this.startIdleTimer();
    }

    getLevelFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return parseInt(params.get('level')) || 1;
    }

    initUI() {
        // 设置门的目标图标
        const targetItem = window.ITEMS[this.levelData.target];
        document.getElementById('door-icon').textContent = targetItem?.icon || '?';
        
        // 设置关卡信息
        document.getElementById('level-name').textContent = this.levelData.name;
        document.getElementById('level-target').textContent = `目标：${this.levelData.target}`;

        // 初始化物品栏
        this.initInventory();
        
        // 更新身份铭牌
        this.updateIdentityPlaque();

        // 绑定返回按钮
        document.getElementById('back-btn').addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        // 显示关卡描述（增加显示时长）
        setTimeout(() => {
            this.showToast(this.levelData.description, 4000);
        }, 500);
        
        // 如果是教学关卡，显示特定提示
        if (this.levelData.isTutorial) {
            this.showTutorialHint();
        }
    }
    
    // 显示教学关卡特定提示
    showTutorialHint() {
        const focus = this.levelData.tutorialFocus;
        let hintText = '';
        
        switch (focus) {
            case 'approach_and_offer':
                setTimeout(() => {
                    this.showToast('💡 提示：合成后，把物品拖到门上', 5000);
                }, 5000);
                break;
            case 'pause_wait':
                setTimeout(() => {
                    this.showToast('💡 提示：有些合成需要等待', 5000);
                }, 5000);
                break;
            case 'extract_longpress':
                setTimeout(() => {
                    this.showToast('💡 提示：长按物品可以查看信息或提取', 5000);
                }, 3000);
                break;
        }
    }
    
    // 更新身份铭牌（基于碎片和进度）
    updateIdentityPlaque() {
        const plaque = document.getElementById('identity-plaque');
        if (!plaque) return;
        
        const fragmentCount = window.LevelManager.currentProgress.fragments?.length || 0;
        const completedLevels = window.LevelManager.currentProgress.completedLevels?.length || 0;
        
        // 定义身份等级
        const identities = [
            { minFragments: 0, minLevels: 0, icon: '🌱', title: '寻味者', level: 'apprentice' },
            { minFragments: 3, minLevels: 3, icon: '🍃', title: '酿造学徒', level: 'apprentice' },
            { minFragments: 6, minLevels: 6, icon: '🌿', title: '调味师', level: 'brewer' },
            { minFragments: 10, minLevels: 9, icon: '🌸', title: '花香使者', level: 'brewer' },
            { minFragments: 13, minLevels: 12, icon: '✨', title: '酿造师', level: 'master' },
            { minFragments: 16, minLevels: 14, icon: '👑', title: '宝珠大师', level: 'legend' }
        ];
        
        // 找到当前身份
        let currentIdentity = identities[0];
        for (const identity of identities) {
            if (fragmentCount >= identity.minFragments || completedLevels >= identity.minLevels) {
                currentIdentity = identity;
            }
        }
        
        // 更新显示
        plaque.querySelector('.identity-icon').textContent = currentIdentity.icon;
        plaque.querySelector('.identity-title').textContent = currentIdentity.title;
        
        // 更新样式
        plaque.className = 'identity-plaque level-' + currentIdentity.level;
    }

    initInventory() {
        const inventory = document.getElementById('inventory-area');
        inventory.innerHTML = '';
        
        this.levelData.initialItems.forEach(itemName => {
            const el = this.createItemElement(itemName);
            el.classList.add('in-inventory');
            inventory.appendChild(el);
        });
    }

    initDragSystem() {
        this.dragSystem = new window.DragSystem(this);
    }

    createItemElement(itemName) {
        const itemData = window.ITEMS[itemName] || { icon: '❓', type: 'unknown' };
        const el = document.createElement('div');
        el.className = 'game-item';
        // 添加类型样式类
        if (itemData.type) {
            el.classList.add(`type-${itemData.type}`);
        }
        
        el.dataset.name = itemName;
        el.innerHTML = `
            <div class="icon">${itemData.icon}</div>
            <div class="name">${itemName}</div>
        `;
        return el;
    }

    // 新增：添加到物品栏
    addToInventoryIfNotExists(itemName) {
        const inventory = document.getElementById('inventory-area');
        // 检查是否已存在
        const existing = Array.from(inventory.children).find(el => el.dataset.name === itemName);
        
        if (!existing) {
            const newItem = this.createItemElement(itemName);
            newItem.classList.add('in-inventory');
            newItem.classList.add('new-item'); // 复用弹出动画
            inventory.appendChild(newItem);
            
            // 滚动到最新的物品
            setTimeout(() => {
                inventory.scrollTo({
                    left: inventory.scrollWidth,
                    behavior: 'smooth'
                });
            }, 100);
        }
    }

    // 处理合成
    handleSynthesis(item1, item2) {
        this.resetIdleTimer();
        
        const name1 = item1.dataset.name;
        const name2 = item2.dataset.name;

        window.SynthesisEngine.synthesize(
            { name: name1 }, 
            { name: name2 }, 
            (result) => {
                if (result.type === 'failed') {
                    // 失败震动反馈
                    item1.classList.add('shake-anim');
                    item2.classList.add('shake-anim');
                    setTimeout(() => {
                        item1.classList.remove('shake-anim');
                        item2.classList.remove('shake-anim');
                    }, 500);

                    // 触觉反馈
                    if (navigator.vibrate) navigator.vibrate(50);
                    
                    this.showToast(result.message);
                } else if (result.type === 'instant') {
                    this.performSynthesis(item1, item2, result);
                } else if (result.type === 'timer') {
                    this.startTimerSynthesis(item1, item2, result);
                }
            }
        );
    }

    // 即时合成
    performSynthesis(item1, item2, resultData) {
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
        
        // 创建新物品
        const newItem = this.createItemElement(resultData.result);
        newItem.classList.add('new-item');
        // 添加合成成功特效
        newItem.classList.add('synthesis-anim');
        
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
    }
    
    // 应用神秘效果（静置揭晓）
    applyMysteryEffect(itemEl, itemName) {
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
    }

    // 粒子特效
    showSynthesisParticles(x, y) {
        const count = 12;
        const container = document.createElement('div');
        container.className = 'particle-container';
        // 90px item size, center is +45
        container.style.left = (x + 45) + 'px';
        container.style.top = (y + 45) + 'px';
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // 随机角度和距离
            const angle = (i / count) * Math.PI * 2;
            const dist = 60 + Math.random() * 20;
            const tx = Math.cos(angle) * dist;
            const ty = Math.sin(angle) * dist;
            
            particle.style.width = (Math.random() * 4 + 4) + 'px';
            particle.style.height = particle.style.width;
            
            // 设置CSS变量供动画使用
            particle.style.setProperty('--tx', tx + 'px');
            particle.style.setProperty('--ty', ty + 'px');
            
            // 随机颜色
            particle.style.background = Math.random() > 0.5 ? 'var(--brand-color)' : '#FFD700';
            
            container.appendChild(particle);
        }
        
        document.getElementById('synthesis-area').appendChild(container);
        setTimeout(() => container.remove(), 1000);
    }

    // 倒计时合成
    startTimerSynthesis(item1, item2, resultData) {
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
            this.performSynthesis(item1, item2, resultData);
        }, resultData.duration * 1000 + 300);
    }

    // 检查门进度
    checkDoorProgress(newItemName) {
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
    }

    // 更新门状态
    updateDoorStage(stage) {
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
    }

    // 检查关卡完成 - 改为只解锁门stage-3，不立即结算
    checkLevelCompletion(newItemName) {
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
    }
    
    // 尝试献上物品到门 - 由拖拽系统调用
    tryOfferToDoor(itemEl) {
        if (this.isFreeMode) return false;
        
        const itemName = itemEl.dataset.name;
        
        // 只有目标物品且已就绪才能献上
        if (!this.targetReady || itemName !== this.levelData.target) {
            return false;
        }
        
        // 献上成功
        this.performOffering(itemEl);
        return true;
    }
    
    // 执行献上仪式
    performOffering(itemEl) {
        const doorContainer = document.getElementById('door-container');
        
        // 物品飞向门的动画
        itemEl.classList.add('offering-item');
        
        // 门的闪光动画
        doorContainer.classList.add('offering');
        doorContainer.classList.remove('awaiting-offer');
        
        // 触觉反馈
        if (navigator.vibrate) navigator.vibrate([50, 50, 100]);
        
        // 动画结束后完成关卡
        setTimeout(() => {
            itemEl.remove();
            doorContainer.classList.remove('offering');
            
            // 正式完成关卡
            this.showSuccessModal();
            window.LevelManager.completeLevel(this.levelId);
        }, 600);
    }
    
    // 显示门状态提示（复用现有元素，但增加持续显示逻辑）
    showDoorStatus(text, duration = 0) {
        const doorStatus = document.getElementById('door-status');
        doorStatus.textContent = text;
        doorStatus.classList.add('visible');
        
        if (duration > 0) {
            setTimeout(() => {
                doorStatus.classList.remove('visible');
            }, duration);
        }
        // duration = 0 时保持显示
    }
    
    // 长按物品处理 - 显示提取卡
    onItemLongPress(itemEl) {
        const itemName = itemEl.dataset.name;
        this.showExtractCard(itemName, itemEl);
    }
    
    // 取消物品的揭晓计时器
    cancelRevealForItem(itemEl) {
        const timerId = this.revealTimers.get(itemEl);
        if (timerId) {
            clearTimeout(timerId);
            this.revealTimers.delete(itemEl);
            
            // 如果还没揭晓，立即揭晓
            if (itemEl.classList.contains('mystery-item')) {
                this.revealItem(itemEl);
            }
        }
    }
    
    // 揭晓物品
    revealItem(itemEl) {
        itemEl.classList.remove('mystery-item');
        itemEl.classList.add('revealed-item');
        
        // 恢复名字显示
        const nameEl = itemEl.querySelector('.name');
        if (nameEl && nameEl.dataset.realName) {
            nameEl.textContent = nameEl.dataset.realName;
        }
    }
    
    // 显示提取卡（配方来路/去路）
    showExtractCard(itemName, itemEl) {
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
    }
    
    // 执行材料提取
    performExtraction(sourceItemEl, extractName) {
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
        if (navigator.vibrate) navigator.vibrate(20);
    }

    // 获取下一关（基于世界的levels列表顺序）
    getNextLevel() {
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
    }
    
    // 显示成功弹窗
    showSuccessModal() {
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
            window.location.href = 'index.html';
        };

        window.nextLevel = () => {
            if (nextLevel) {
                window.location.href = `game.html?level=${nextLevel.id}`;
            }
        };
    }

    // 检查世界完成成就
    checkWorldCompletion() {
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
    }

    // Toast 消息
    showToast(msg, duration = 4000) {
        // 移除现有 toast
        const existingToast = document.querySelector('.toast-msg');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = 'toast-msg';
        toast.textContent = msg;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // 发现新物品提示（增强版）
    showDiscoveryToast(itemName, msg, fragment) {
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
    }
    
    // 显示碎片发现弹窗
    showFragmentDiscovery(itemName, itemData, fragment) {
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
    }

    // 空闲计时器
    startIdleTimer() {
        this.resetIdleTimer();
    }

    resetIdleTimer() {
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
        }
        this.idleTimer = setTimeout(() => {
            this.showIdleHint();
        }, this.idleTimeout);
    }

    showIdleHint() {
        this.showToast(window.TIPS.idle5s, 4000);
        this.resetIdleTimer();
    }
}

// 启动游戏
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});
