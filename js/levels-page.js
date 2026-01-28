// 章节选择页面逻辑
// ================================================

let currentWorldId = 1;

document.addEventListener('DOMContentLoaded', () => {
    // 从URL参数获取初始世界
    const urlParams = new URLSearchParams(window.location.search);
    const worldParam = urlParams.get('world');
    if (worldParam) {
        currentWorldId = parseInt(worldParam) || 1;
    }
    
    initWorldMap();
    selectWorld(currentWorldId);
    
    // 播放主界面BGM
    if (window.AudioManager) {
        window.AudioManager.playBGM('bgm-menu');
    }
    
    // 返回按钮
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (window.AudioManager) {
                window.AudioManager.playClickBack();
            }
            window.navigateTo('index.html');
        });
    }
});

// ==================== 世界地图 ====================

function initWorldMap() {
    const worldMap = document.getElementById('world-map');
    if (!worldMap) return;
    
    worldMap.innerHTML = '';
    
    window.WORLDS.forEach(world => {
        const node = createWorldNode(world);
        worldMap.appendChild(node);
    });
}

function createWorldNode(world) {
    const node = document.createElement('div');
    const isUnlocked = window.LevelManager.isWorldUnlocked(world.id);
    const progress = window.LevelManager.getWorldProgress(world.id);
    const isCompleted = progress.percentage === 100;
    const isActive = world.id === currentWorldId;
    
    node.className = `world-node ${isUnlocked ? 'unlocked' : 'locked'} ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`;
    node.dataset.worldId = world.id;
    
    // 获取解锁需求
    const fragmentReq = window.LevelManager.getWorldUnlockRequirement(world.id);
    
    if (isUnlocked) {
        node.innerHTML = `<div class="icon">${world.icon}</div>`;
        node.title = world.name;
        node.addEventListener('click', () => {
            // 点击时添加微妙的动画反馈
            node.style.transform = 'scale(0.92)';
            setTimeout(() => {
                node.style.transform = '';
                selectWorld(world.id);
            }, 150);
        });
    } else {
        node.innerHTML = `<div class="icon">🔒</div>`;
        node.title = `收集${fragmentReq}个碎片解锁 ${world.name}`;
    }
    
    return node;
}

// ==================== 选择世界 ====================

function selectWorld(worldId) {
    currentWorldId = worldId;
    
    // 更新世界节点状态
    document.querySelectorAll('.world-node').forEach(node => {
        node.classList.remove('active');
        if (parseInt(node.dataset.worldId) === worldId) {
            node.classList.add('active');
        }
    });
    
    // 获取世界数据
    const world = window.LevelManager.getWorldData(worldId);
    if (!world) return;
    
    // 更新页面主题色
    updateTheme(world.theme);
    
    // 更新世界标题
    updateWorldHeader(world);
    
    // 更新关卡门
    initLevelDoors(worldId);
    
    // 更新故事文本
    updateStorySection(worldId);
    
    // 更新URL（不刷新页面）
    const newUrl = `levels.html?world=${worldId}`;
    window.history.replaceState({}, '', newUrl);
}

function updateTheme(theme) {
    const container = document.getElementById('container');
    if (!container) return;
    
    // 移除所有主题类
    container.className = 'container';
    
    // 添加对应主题类
    if (theme) {
        container.classList.add(`theme-${theme}`);
    }
    
    // 同时更新body背景
    document.body.className = '';
    if (theme) {
        document.body.classList.add(`theme-${theme}`);
    }
    
    // 更新关卡选择器的渐变遮罩颜色
    updateCarouselGradients();
}

function updateCarouselGradients() {
    // CSS 变量会自动应用，这里可以做额外处理
}

function updateWorldHeader(world) {
    const worldIcon = document.getElementById('world-icon');
    const worldName = document.getElementById('world-name');
    
    if (worldIcon) worldIcon.textContent = world.icon;
    if (worldName) worldName.textContent = world.name;
}

// ==================== 关卡滑动选择器 ====================

let currentLevels = [];
let selectedLevelIndex = 0;

function initLevelDoors(worldId) {
    const doorsContainer = document.getElementById('level-doors');
    if (!doorsContainer) return;
    
    currentLevels = window.LevelManager.getWorldLevels(worldId);
    
    doorsContainer.innerHTML = '';
    
    // 找到第一个未完成的关卡作为默认选中
    selectedLevelIndex = 0;
    for (let i = 0; i < currentLevels.length; i++) {
        if (!window.LevelManager.isLevelCompleted(currentLevels[i].id)) {
            selectedLevelIndex = i;
            break;
        }
    }
    
    // 如果关卡数 >= 3，添加顶部占位符
    if (currentLevels.length >= 3) {
        const topSpacer = document.createElement('div');
        topSpacer.className = 'level-spacer';
        topSpacer.style.height = '120px';
        topSpacer.style.flexShrink = '0';
        doorsContainer.appendChild(topSpacer);
    }
    
    currentLevels.forEach((level, index) => {
        const door = createLevelDoor(level, index);
        doorsContainer.appendChild(door);
    });
    
    // 如果关卡数 >= 3，添加底部占位符
    if (currentLevels.length >= 3) {
        const bottomSpacer = document.createElement('div');
        bottomSpacer.className = 'level-spacer';
        bottomSpacer.style.height = '120px';
        bottomSpacer.style.flexShrink = '0';
        doorsContainer.appendChild(bottomSpacer);
    }
    
    // 绑定滚动事件
    doorsContainer.addEventListener('scroll', handleCarouselScroll);
    
    // 初始化选中状态
    setTimeout(() => {
        updateSelectedLevel(selectedLevelIndex);
        scrollToLevel(selectedLevelIndex, false);
    }, 100);
}

function createLevelDoor(level, index) {
    const door = document.createElement('div');
    const isUnlocked = window.LevelManager.isLevelUnlocked(level.id);
    const isCompleted = window.LevelManager.isLevelCompleted(level.id);
    
    // 检查是否是最新解锁的关卡（已解锁但未完成的第一个）
    const isLatestUnlocked = isUnlocked && !isCompleted && isLatestUnlockedLevel(level.id);
    
    door.className = `level-door ${isUnlocked ? 'unlocked' : 'locked'} ${isCompleted ? 'completed' : ''}`;
    door.dataset.index = index;
    door.dataset.levelId = level.id;
    
    // 目标文字格式化
    const targetText = isUnlocked 
        ? `目标 · ${level.target}` 
        : '尚未解锁';
    
    // 进入按钮，最新解锁的加光波特效
    const btnClass = isLatestUnlocked ? 'door-enter-btn pulse-effect' : 'door-enter-btn';
    
    door.innerHTML = `
        ${isCompleted ? '<div class="completed-badge">✓</div>' : ''}
        <div class="door-frame">
            <div class="door-icon">${isUnlocked ? level.icon : '🔒'}</div>
        </div>
        <div class="door-info">
            <div class="door-name">${isUnlocked ? level.name : '· · ·'}</div>
            <div class="door-target">${targetText}</div>
        </div>
        ${isUnlocked ? `<button class="${btnClass}">进 入</button>` : ''}
    `;
    
    // 点击关卡卡片选中
    door.addEventListener('click', (e) => {
        // 如果点击的是进入按钮，直接进入
        if (e.target.classList.contains('door-enter-btn')) {
            enterLevel(level.id);
            return;
        }
        
        // 否则选中这个关卡
        if (isUnlocked) {
            updateSelectedLevel(index);
            scrollToLevel(index, true);
        }
    });
    
    return door;
}

// 判断是否是最新解锁的关卡
function isLatestUnlockedLevel(levelId) {
    // 获取当前世界的所有关卡
    const levels = currentLevels;
    
    // 找到第一个已解锁但未完成的关卡
    for (const level of levels) {
        const isUnlocked = window.LevelManager.isLevelUnlocked(level.id);
        const isCompleted = window.LevelManager.isLevelCompleted(level.id);
        
        if (isUnlocked && !isCompleted) {
            return level.id === levelId;
        }
    }
    
    return false;
}

function handleCarouselScroll() {
    const container = document.getElementById('level-doors');
    if (!container || currentLevels.length < 3) return;
    
    const doors = container.querySelectorAll('.level-door');
    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.top + containerRect.height / 2;
    
    let closestIndex = 0;
    let closestDistance = Infinity;
    
    doors.forEach((door, i) => {
        const doorRect = door.getBoundingClientRect();
        const doorCenter = doorRect.top + doorRect.height / 2;
        const distance = Math.abs(doorCenter - containerCenter);
        
        if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = parseInt(door.dataset.index);
        }
    });
    
    if (closestIndex !== selectedLevelIndex) {
        updateSelectedLevel(closestIndex);
    }
}

function updateSelectedLevel(index) {
    selectedLevelIndex = index;
    
    const container = document.getElementById('level-doors');
    const doors = container.querySelectorAll('.level-door');
    
    doors.forEach((door) => {
        const doorIndex = parseInt(door.dataset.index);
        door.classList.remove('selected');
        
        if (doorIndex === index) {
            door.classList.add('selected');
        }
    });
}

function scrollToLevel(index, smooth = true) {
    const container = document.getElementById('level-doors');
    const doors = container.querySelectorAll('.level-door');
    
    // 找到对应index的door
    let targetDoor = null;
    doors.forEach(door => {
        if (parseInt(door.dataset.index) === index) {
            targetDoor = door;
        }
    });
    
    if (!targetDoor) return;
    
    // 计算滚动位置，使目标关卡居中
    const containerHeight = container.clientHeight;
    const doorHeight = targetDoor.offsetHeight;
    const doorOffsetTop = targetDoor.offsetTop;
    
    const scrollTarget = doorOffsetTop - (containerHeight / 2) + (doorHeight / 2);
    
    container.scrollTo({
        top: Math.max(0, scrollTarget),
        behavior: smooth ? 'smooth' : 'auto'
    });
}

function enterLevel(levelId) {
    // 播放进入音效并停止BGM
    if (window.AudioManager) {
        window.AudioManager.playClickEnter();
        window.AudioManager.stopBGM();
    }
    
    // 宝珠风格的淡出过渡
    const container = document.getElementById('container');
    const bubbleCanvas = document.getElementById('bubble-canvas');
    
    if (container) {
        container.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        container.style.opacity = '0';
        container.style.transform = 'scale(1.02)';
    }
    
    if (bubbleCanvas) {
        bubbleCanvas.style.transition = 'opacity 0.6s ease';
        bubbleCanvas.style.opacity = '0';
    }
    
    setTimeout(() => {
        window.navigateTo(`game.html?level=${levelId}`);
    }, 500);
}

// ==================== 故事文本 ====================

function updateStorySection(worldId) {
    const storyText = document.getElementById('story-text');
    if (!storyText) return;
    
    const world = window.LevelManager.getWorldData(worldId);
    if (world && world.description) {
        storyText.textContent = world.description;
    } else {
        const text = window.STORY?.worlds?.[worldId] || '';
        storyText.textContent = text;
    }
}

