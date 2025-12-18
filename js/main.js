// 主界面逻辑（V2 - 世界地图）
let currentWorldId = 1;

document.addEventListener('DOMContentLoaded', () => {
    initWorldMap();
    initLevelDoors(currentWorldId);
    updateStorySection(currentWorldId);
    updateProgressPanel();

    // 自由探索模式按钮
    const freeModeBtn = document.getElementById('free-mode-btn');
    if (freeModeBtn) {
        freeModeBtn.addEventListener('click', () => {
            window.location.href = 'game.html?mode=free';
        });
    }

    // 重置按钮逻辑
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('确定要重置所有游戏进度吗？\n\n将清除：\n• 关卡进度\n• 成就徽章\n• 开场动画记录\n• 教学动画记录\n\n此操作不可撤销。')) {
                // 清除关卡进度
                window.LevelManager.resetProgress();
                // 清除开场动画记录（所有版本）
                sessionStorage.removeItem('hasPlayedIntro_v2');
                sessionStorage.removeItem('hasPlayedIntro_v3');
                sessionStorage.removeItem('hasPlayedIntro_v4');
                sessionStorage.removeItem('hasPlayedIntro_v5');
                // 清除教学动画记录
                localStorage.removeItem('baozhu_tutorial_seen');
                
                alert('进度已重置！即将重新开始...');
                window.location.reload();
            }
        });
    }
});

// 初始化世界地图
function initWorldMap() {
    const worldMap = document.querySelector('.world-map');
    if (!worldMap) return;
    
    worldMap.innerHTML = '';
    
    window.WORLDS.forEach(world => {
        const node = createWorldNode(world);
        worldMap.appendChild(node);
    });
}

// 创建世界节点
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
    const currentFragments = window.LevelManager.currentProgress.fragments?.length || 0;
    
    if (isUnlocked) {
        node.innerHTML = `
            <div class="icon">${world.icon}</div>
            <div class="name">${world.name}</div>
        `;
        node.addEventListener('click', () => {
            selectWorld(world.id);
        });
    } else {
        // 显示解锁需求
        node.innerHTML = `
            <div class="icon" style="filter: grayscale(100%); opacity: 0.5;">🔒</div>
            <div class="name">${currentFragments}/${fragmentReq}🧩</div>
        `;
        node.title = `收集${fragmentReq}个碎片解锁`;
    }
    
    return node;
}

// 选择世界
function selectWorld(worldId) {
    currentWorldId = worldId;
    
    // 更新世界节点状态
    document.querySelectorAll('.world-node').forEach(node => {
        node.classList.remove('active');
        if (parseInt(node.dataset.worldId) === worldId) {
            node.classList.add('active');
        }
    });
    
    // 更新关卡门
    initLevelDoors(worldId);
    
    // 更新故事文本
    updateStorySection(worldId);
}

// 初始化关卡门
function initLevelDoors(worldId) {
    const world = window.LevelManager.getWorldData(worldId);
    const doorsContainer = document.querySelector('.level-doors');
    if (!doorsContainer || !world) return;
    
    const levels = window.LevelManager.getWorldLevels(worldId);
    
    doorsContainer.innerHTML = `
        <div class="world-title">
            <h2>${world.name}</h2>
            <div class="world-subtitle">${world.subtitle}</div>
        </div>
        <div class="doors-grid"></div>
    `;
    
    const grid = doorsContainer.querySelector('.doors-grid');
    
    levels.forEach((level, index) => {
        const door = createLevelDoor(level);
        door.style.animationDelay = `${0.1 + index * 0.1}s`;
        grid.appendChild(door);
    });
}

// 创建关卡门
function createLevelDoor(level) {
    const door = document.createElement('div');
    const isUnlocked = window.LevelManager.isLevelUnlocked(level.id);
    const isCompleted = window.LevelManager.isLevelCompleted(level.id);
    
    door.className = `level-door ${isUnlocked ? 'unlocked' : 'locked'} ${isCompleted ? 'completed' : ''}`;
    door.style.animation = 'slideUp 0.6s ease-out both';
    
    door.innerHTML = `
        ${isCompleted ? '<div class="completed-badge">✓</div>' : ''}
        <div class="door-frame">
            <div class="door-icon">${isUnlocked ? level.icon : '🔒'}</div>
        </div>
        <div class="door-info">
            <div class="door-name">${isUnlocked ? level.name : '???'}</div>
            <div class="door-target">${isUnlocked ? level.target : '未解锁'}</div>
        </div>
    `;
    
    if (isUnlocked) {
        door.addEventListener('click', () => {
            enterLevel(level.id);
        });
    }
    
    return door;
}

// 进入关卡
function enterLevel(levelId) {
    const container = document.querySelector('.container');
    if (container) {
        container.style.opacity = '0';
        container.style.transition = 'opacity 0.5s ease';
    }
    
    setTimeout(() => {
        window.location.href = `game.html?level=${levelId}`;
    }, 500);
}

// 更新故事文本
function updateStorySection(worldId) {
    const storySection = document.querySelector('.story-section');
    if (!storySection) return;
    
    const storyText = window.STORY.worlds[worldId] || '';
    storySection.innerHTML = `<p class="story-text">${storyText}</p>`;
}

// 更新进度面板
function updateProgressPanel() {
    const codexFill = document.getElementById('codex-progress-fill');
    const codexText = document.getElementById('codex-progress-text');
    const fragmentFill = document.getElementById('fragment-progress-fill');
    const fragmentText = document.getElementById('fragment-progress-text');
    
    if (!codexFill || !fragmentFill) return;
    
    // 获取配方发现进度（使用实际的ITEMS数量）
    const discoveredItems = window.LevelManager.currentProgress.discoveredItems || [];
    const totalRecipes = Object.keys(window.ITEMS).length;
    const codexPercent = Math.min((discoveredItems.length / totalRecipes) * 100, 100);
    
    codexFill.style.width = codexPercent + '%';
    codexText.textContent = `${discoveredItems.length}/${totalRecipes}`;
    
    // 获取碎片收集进度（使用实际的FRAGMENTS数量）
    const fragments = window.LevelManager.currentProgress.fragments || [];
    const totalFragments = window.FRAGMENTS ? window.FRAGMENTS.length : 16;
    const fragmentPercent = Math.min((fragments.length / totalFragments) * 100, 100);
    
    fragmentFill.style.width = fragmentPercent + '%';
    fragmentText.textContent = `${fragments.length}/${totalFragments}`;
}
