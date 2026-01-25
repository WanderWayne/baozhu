// 游戏核心逻辑 - 核心模块
// ================================================

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
            if (window.navigateTo) window.navigateTo('index.html');
            else window.location.href = 'index.html';
            return;
        }

        // 章节系统 - Monument Valley 风格
        this.chapterId = this.levelData.chapterId || null;
        this.objectiveIndex = this.levelData.objectiveIndex || 0;
        this.chapterData = this.chapterId ? window.CHAPTERS[this.chapterId] : null;
        this.isTransitioning = false; // 防止过渡期间重复触发

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

        // 如果是基础关卡，启动计时器
        const basicLevels = window.LevelManager.getBasicLevelIds();
        if (basicLevels.includes(this.levelId)) {
            window.LevelManager.startBasicLevelTimer();
        }

        // 不再显示教学动画，直接开始游戏
        this.hideTutorialImmediately();
        this.startGame();
        
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
        const doorIcon = document.getElementById('door-icon');
        
        if (doorContainer) doorContainer.className = 'door-container free-mode';
        if (levelName) levelName.textContent = '自由探索';
        this.updateTargetDisplay(null, true); // 自由模式
        if (doorIcon) doorIcon.textContent = '🧪';
        
        // 初始化物品栏 - 所有基础原料
        this.initFreeModeInventory();
        
        // 更新身份铭牌
        this.updateIdentityPlaque();
        
        // 绑定返回按钮
        document.getElementById('back-btn').addEventListener('click', () => {
            if (window.AudioManager) {
                window.AudioManager.playClickBack();
                window.AudioManager.stopBGM();
            }
            if (window.navigateTo) window.navigateTo('index.html');
            else window.location.href = 'index.html';
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
        this.startSugarSparkles();
        
        // 播放游戏关卡BGM
        if (window.AudioManager) {
            window.AudioManager.playBGM('bgm-game');
        }
    }
    
    // 糖晶微闪粒子系统
    startSugarSparkles() {
        // 每6-10秒创建1-2个糖晶闪光
        const createSparkle = () => {
            const count = Math.random() > 0.5 ? 2 : 1;
            for (let i = 0; i < count; i++) {
                setTimeout(() => this.createSugarSparkle(), i * 300);
            }
            // 下一次闪光在6-10秒后
            const nextDelay = 6000 + Math.random() * 4000;
            setTimeout(createSparkle, nextDelay);
        };
        // 初始延迟3秒后开始
        setTimeout(createSparkle, 3000);
    }
    
    createSugarSparkle() {
        const sparkle = document.createElement('div');
        sparkle.className = 'sugar-sparkle';
        
        // 随机位置（避开底部物品栏区域）
        const x = 10 + Math.random() * 80; // 10%-90% 水平位置
        const y = 10 + Math.random() * 60; // 10%-70% 垂直位置
        
        sparkle.style.left = x + '%';
        sparkle.style.top = y + '%';
        
        // 随机大小 - 更大更明显
        const size = 10 + Math.random() * 8; // 10-18px
        sparkle.style.width = size + 'px';
        sparkle.style.height = size + 'px';
        
        document.body.appendChild(sparkle);
        
        // 动画结束后移除
        setTimeout(() => sparkle.remove(), 2500);
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
        this.updateTargetDisplay(this.levelData.target);

        // 清空合成区（防止残留物品）
        const synthesisArea = document.getElementById('synthesis-area');
        if (synthesisArea) {
            synthesisArea.innerHTML = '';
        }

        // 初始化物品栏
        this.initInventory();
        
        // 更新身份铭牌
        this.updateIdentityPlaque();

        // 绑定返回按钮
        document.getElementById('back-btn').addEventListener('click', () => {
            if (window.AudioManager) {
                window.AudioManager.playClickBack();
                window.AudioManager.stopBGM();
            }
            if (window.navigateTo) window.navigateTo('index.html');
            else window.location.href = 'index.html';
        });

        // 显示关卡描述（增加显示时长）
        setTimeout(() => {
            this.showToast(this.levelData.description, 4000);
        }, 500);
        
        // 如果是教学关卡，显示特定提示
        if (this.levelData.isTutorial) {
            this.showTutorialHint();
        }
        
        // 如果关卡有专属提示，定时显示
        if (this.levelData.levelHints && this.levelData.levelHints.length > 0) {
            this.showLevelHints();
        }
    }
    
    // 显示关卡专属提示（循环显示）
    showLevelHints() {
        const hints = this.levelData.levelHints;
        let hintIndex = 0;
        
        // 先显示第一条提示（延迟3秒）
        setTimeout(() => {
            this.showToast('💡 ' + hints[hintIndex], 5000);
            hintIndex++;
        }, 3000);
        
        // 之后每隔15秒显示下一条提示（如果玩家还没通关）
        this.levelHintInterval = setInterval(() => {
            if (hintIndex < hints.length) {
                this.showToast('💡 ' + hints[hintIndex], 5000);
                hintIndex++;
            } else {
                // 循环回到第一条
                hintIndex = 0;
            }
        }, 15000);
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
    
    // ==================== 章节系统方法 ====================
    
    // 检查是否有下一个目标
    hasNextObjective() {
        if (!this.chapterData) return false;
        return this.objectiveIndex < this.chapterData.objectives.length - 1;
    }
    
    // 获取下一个目标的关卡ID
    getNextObjectiveLevelId() {
        if (!this.hasNextObjective()) return null;
        return this.chapterData.objectives[this.objectiveIndex + 1];
    }
    
    // 获取过渡文字
    getTransitionText() {
        if (!this.chapterData || !this.chapterData.transitionTexts) return '';
        return this.chapterData.transitionTexts[this.objectiveIndex] || '';
    }
    
    // 过渡到下一个目标
    transitionToNextObjective() {
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
        
        // 清理提示计时器
        if (this.levelHintInterval) {
            clearInterval(this.levelHintInterval);
            this.levelHintInterval = null;
        }
        
        // 重新初始化UI（不重新绑定事件）
        this.refreshUIForNextObjective();
    }
    
    // 刷新UI以显示下一个目标
    refreshUIForNextObjective() {
        // 更新门的目标图标
        const targetItem = window.ITEMS[this.levelData.target];
        const doorIcon = document.getElementById('door-icon');
        if (doorIcon) doorIcon.textContent = targetItem?.icon || '?';
        
        // 更新关卡信息
        const levelName = document.getElementById('level-name');
        if (levelName) levelName.textContent = this.levelData.name;
        this.updateTargetDisplay(this.levelData.target);
        
        // 重置门状态样式
        const doorContainer = document.getElementById('door-container');
        if (doorContainer) {
            doorContainer.className = 'door-container stage-0';
        }
        
        // 清空合成区
        const synthesisArea = document.getElementById('synthesis-area');
        if (synthesisArea) {
            synthesisArea.innerHTML = '';
        }
        
        // 重新初始化物品栏
        this.initInventory();
        
        // 重启空闲计时器
        this.startIdleTimer();
        
        // 如果关卡有专属提示，定时显示
        if (this.levelData.levelHints && this.levelData.levelHints.length > 0) {
            this.showLevelHints();
        }
    }
    
    // 更新目标显示
    updateTargetDisplay(targetName, isFreeMode = false) {
        const targetNameEl = document.getElementById('target-name');
        const targetLabelEl = document.querySelector('.level-target-display .target-label');
        
        if (isFreeMode) {
            // 自由模式
            if (targetNameEl) targetNameEl.textContent = '发现新配方';
            if (targetLabelEl) targetLabelEl.textContent = '自由';
        } else if (targetName) {
            if (targetNameEl) targetNameEl.textContent = targetName;
            if (targetLabelEl) targetLabelEl.textContent = '目标';
        }
    }
}

// 导出到全局
window.Game = Game;

