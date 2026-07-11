/** @feature level-select @see docs/features/level-select.md */
// 章节选择页面逻辑
// ================================================

/** 屏幕中上方红字报错提示（最高图层）；出现后停留约 0.5s 再于 1s 内淡出 */
function showTopHintError(message) {
    const text = typeof message === 'string' ? message : '';
    if (!text) return;

    if (window.AudioManager) window.AudioManager.playSFX('error');

    const existing = document.getElementById('global-top-hint');
    if (existing) existing.remove();

    const el = document.createElement('div');
    el.id = 'global-top-hint';
    el.className = 'global-top-hint';
    el.setAttribute('role', 'alert');
    el.textContent = text;
    document.body.appendChild(el);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            el.classList.add('global-top-hint--visible');
        });
    });

    setTimeout(() => {
        el.classList.add('global-top-hint--fade');
    }, 500);

    setTimeout(() => {
        el.remove();
    }, 1500);
}

window.showTopHintError = showTopHintError;

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
        if (window.LevelManager && window.LevelManager.hasAnyClaimableTask()) {
            const dot = document.createElement('span');
            dot.className = 'claimable-dot';
            backBtn.appendChild(dot);
        }
        backBtn.addEventListener('click', () => {
            if (window.AudioManager) {
                window.AudioManager.playClickBack();
            }
            // 如果是第一次从游戏退出并返回主界面，设置引导标记
            if (localStorage.getItem('tut_first_exit_game') === '1' && 
                !localStorage.getItem('tut_main_guide_done')) {
                localStorage.setItem('tut_guide_tasks_on_main', '1');
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
    
    const _wSvg = world.svgItem && window.ITEM_SVGS && window.ITEM_SVGS[world.svgItem];
    const iconHTML = _wSvg
        ? `<div class="icon world-icon-svg">${_wSvg}</div>`
        : `<div class="icon">${world.icon}</div>`;
    
    if (isUnlocked) {
        node.innerHTML = iconHTML;
        node.title = world.name;
        node.addEventListener('click', () => {
            // 点击时添加微妙的动画反馈
            if (window.AudioManager) window.AudioManager.playClickOpen();
            node.style.transform = 'scale(0.92)';
            setTimeout(() => {
                node.style.transform = '';
                selectWorld(world.id);
            }, 150);
        });
    } else {
        node.innerHTML = iconHTML;
        node.title = `收集${fragmentReq}个碎片解锁 ${world.name}`;
        node.addEventListener('click', () => {
            showTopHintError('由于你未解锁此章节，所以无法进入。');
        });
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
    
    if (worldIcon) {
        const _whSvg = world.svgItem && window.ITEM_SVGS && window.ITEM_SVGS[world.svgItem];
        if (_whSvg) {
            worldIcon.innerHTML = _whSvg;
            worldIcon.classList.add('world-header-svg');
        } else {
            worldIcon.textContent = world.icon;
            worldIcon.classList.remove('world-header-svg');
        }
    }
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
        handleCarouselScroll();
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
    
    // 目标文字格式化（双门/多目标关卡显示所有目标）
    let targetLabel = level.target;
    if (level.multiTarget && level.multiTargets) {
        targetLabel = level.multiTargets.join('，');
    } else if (level.doors && level.doors.length > 1) {
        targetLabel = level.doors.map(d => d.target).join(' + ');
    }
    const targetText = isUnlocked 
        ? `目标 · ${targetLabel}` 
        : '尚未解锁';
    
    // 进入按钮，最新解锁的加光波特效
    const btnClass = isLatestUnlocked ? 'door-enter-btn pulse-effect' : 'door-enter-btn';
    
    const ps = isCompleted && level.perfectRecipes ? window.LevelManager.getPerfectStatus(level.id) : null;

    const badgeHtml = isCompleted && ps && !ps.isPerfect
        ? `<div class="completed-badge no-check"><span class="perfect-progress">${ps.found}/${ps.total}</span></div>`
        : isCompleted
            ? '<div class="completed-badge">✓</div>'
            : '';

    door.innerHTML = `
        ${badgeHtml}
        <div class="door-frame${ps && ps.isPerfect ? ' perfect-glow' : ''}">
            <div class="door-icon${(isUnlocked && window.ITEM_SVGS && window.ITEM_SVGS[level.target]) ? ' door-icon-svg' : ''}">${isUnlocked ? ((window.ITEM_SVGS && window.ITEM_SVGS[level.target]) || level.icon) : '🔒'}</div>
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
        
        // 否则选中这个关卡（未解锁则提示）
        if (isUnlocked) {
            if (window.AudioManager) window.AudioManager.playClickOpen();
            updateSelectedLevel(index);
            scrollToLevel(index, true);
        } else {
            showTopHintError('由于你未解锁此关卡，所以无法进入。');
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
    const halfH = containerRect.height / 2;
    
    let closestIndex = 0;
    let closestDistance = Infinity;
    
    doors.forEach((door) => {
        const doorRect = door.getBoundingClientRect();
        const doorCenter = doorRect.top + doorRect.height / 2;
        const distance = Math.abs(doorCenter - containerCenter);
        
        if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = parseInt(door.dataset.index);
        }
    });

    doors.forEach((door) => {
        const doorRect = door.getBoundingClientRect();
        const doorCenter = doorRect.top + doorRect.height / 2;
        const distance = Math.abs(doorCenter - containerCenter);
        const t = Math.min(distance / halfH, 1);
        const idx = parseInt(door.dataset.index);
        const idxDist = Math.abs(idx - closestIndex);

        let opacity;
        if (idxDist >= 2) {
            opacity = 0;
        } else if (idxDist === 1) {
            // 紧邻选中：略透明，但比旧版几何衰减更清晰易辨
            opacity = 0.78 + (1 - t) * 0.14;
        } else {
            opacity = 1;
        }

        // 未解锁：在同滚动位置下始终比已解锁更淡（避免 inline opacity 盖掉 .locked 样式）
        if (door.classList.contains('locked') && opacity > 0) {
            opacity *= 0.52;
        }

        door.style.opacity = String(opacity);
        door.style.pointerEvents = opacity < 0.05 ? 'none' : '';
        door.style.transform = `scale(${1 - t * 0.08})`;
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



