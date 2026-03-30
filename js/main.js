// 主界面逻辑（V5 - 成长型发酵世界）

document.addEventListener('DOMContentLoaded', () => {
    // 初始化成长系统
    initGrowthSystem();
    
    // 更新进度面板
    updateProgressPanel();

    // 绑定主菜单按钮
    bindMenuButtons();
    
    // 绑定面板事件
    bindPanelEvents();

    // 检测可领取任务，更新金色提示点
    updateClaimableDots();
    
    const mainScreen = document.getElementById('main-screen');
    if (mainScreen && mainScreen.style.display !== 'none') {
        // 主界面已显示（跳过开场的情况），初始化粒子系统
        if (!window.mainParticleSystem && window.MainParticleSystem) {
            window.mainParticleSystem = new MainParticleSystem();
        }
        
        if (window.initMainScreenAmbience) {
            window.initMainScreenAmbience();
        }
        
        if (window.AudioManager) {
            window.AudioManager.playBGM('bgm-menu');
        }
    }
});

// ==================== 成长系统初始化 ====================

function initGrowthSystem() {
    // 应用成长系统 CSS 变量
    if (window.GrowthSystem) {
        window.GrowthSystem.applyCSSVariables();
        
        // 输出当前成长状态（调试用）
        const stage = window.GrowthSystem.getCurrentStage();
        console.log(`[成长系统] 当前阶段: ${stage.name}, 进度: ${stage.progress}%`);
    }
}

// ==================== 主菜单按钮绑定 ====================

function bindMenuButtons() {
    // 开始游戏按钮
    const continueBtn = document.getElementById('continue-btn');
    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            if (window.AudioManager) window.AudioManager.playClickEnter();
            
            window.navigateTo('levels.html');
        });
    }

    // 配方图谱进度条 - 点击进入
    const codexRow = document.getElementById('codex-row');
    if (codexRow) {
        codexRow.addEventListener('click', () => {
            if (window.AudioManager) window.AudioManager.playClickEnter();
            window.navigateTo('codex.html');
        });
    }

    // 记忆碎片进度条 - 点击进入
    const fragmentRow = document.getElementById('fragment-row');
    if (fragmentRow) {
        fragmentRow.addEventListener('click', () => {
            if (window.AudioManager) window.AudioManager.playClickEnter();
            window.navigateTo('gallery.html');
        });
    }

    // 任务按钮
    const tasksBtn = document.getElementById('free-mode-btn');
    if (tasksBtn) {
        tasksBtn.addEventListener('click', () => {
            if (window.AudioManager) window.AudioManager.playClickEnter();
            renderTasks();
            openPanel('tasks-overlay');
        });
    }

    // 设置按钮 - 打开设置面板
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            if (window.AudioManager) window.AudioManager.playClickEnter();
            openPanel('settings-overlay');
        });
    }

    // 重置按钮
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
}

// ==================== 面板控制 ====================

function bindPanelEvents() {
    // 设置面板关闭按钮
    const settingsClose = document.getElementById('settings-close');
    if (settingsClose) {
        settingsClose.addEventListener('click', () => {
            closePanel('settings-overlay');
        });
    }

    // 任务面板关闭按钮
    const tasksClose = document.getElementById('tasks-close');
    if (tasksClose) {
        tasksClose.addEventListener('click', () => {
            closePanel('tasks-overlay');
        });
    }

    // 点击遮罩关闭面板
    document.querySelectorAll('.panel-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closePanel(overlay.id);
            }
        });
    });

    // BGM 音量滑块
    const bgmSlider = document.getElementById('bgm-volume-slider');
    const bgmValue = document.getElementById('bgm-volume-value');
    if (bgmSlider && bgmValue) {
        // 加载保存的音量
        const savedBGM = localStorage.getItem('baozhu_bgm_volume') || '80';
        bgmSlider.value = savedBGM;
        bgmValue.textContent = savedBGM + '%';

        bgmSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            bgmValue.textContent = value + '%';
            if (window.AudioManager) {
                window.AudioManager.setBGMVolume(value / 100);
            }
        });
    }
    
    // SFX 音量滑块
    const sfxSlider = document.getElementById('sfx-volume-slider');
    const sfxValue = document.getElementById('sfx-volume-value');
    if (sfxSlider && sfxValue) {
        // 加载保存的音量
        const savedSFX = localStorage.getItem('baozhu_sfx_volume') || '80';
        sfxSlider.value = savedSFX;
        sfxValue.textContent = savedSFX + '%';

        sfxSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            sfxValue.textContent = value + '%';
            if (window.AudioManager) {
                window.AudioManager.setSFXVolume(value / 100);
            }
        });
    }
}

function openPanel(panelId) {
    const panel = document.getElementById(panelId);
    if (panel) {
        panel.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }
}

function closePanel(panelId) {
    const panel = document.getElementById(panelId);
    if (panel) {
        panel.classList.remove('visible');
        document.body.style.overflow = '';
    }
}

// ==================== 可领取任务金色提示点 ====================

function hasAnyClaimableTask() {
    return window.LevelManager && window.LevelManager.hasAnyClaimableTask();
}

function _ensureDot(el) {
    if (!el || el.querySelector('.claimable-dot')) return;
    const dot = document.createElement('span');
    dot.className = 'claimable-dot';
    el.appendChild(dot);
}

function _removeDot(el) {
    if (!el) return;
    const dot = el.querySelector('.claimable-dot');
    if (dot) dot.remove();
}

function updateClaimableDots() {
    const show = hasAnyClaimableTask();
    const tasksBtn = document.getElementById('free-mode-btn');
    if (show) {
        _ensureDot(tasksBtn);
    } else {
        _removeDot(tasksBtn);
    }
}

// ==================== 任务系统 ====================

const TASKS = [
    {
        id: 'first_synthesis',
        name: '初次合成',
        description: '完成第一次物品合成',
        check: () => {
            const items = window.LevelManager.currentProgress.discoveredItems || [];
            return { current: Math.min(items.length, 1), total: 1 };
        },
        reward: '💎 30',
        gems: 30
    },
    {
        id: 'complete_first5',
        name: '崭露头角',
        description: '完成前五关',
        check: () => {
            const completed = window.LevelManager.currentProgress.completedLevels || [];
            const first5 = [101, 102, 103, 104, 105];
            const done = first5.filter(id => completed.includes(id)).length;
            return { current: done, total: 5 };
        },
        reward: '💎 150',
        gems: 150
    },
    {
        id: 'complete_boss',
        name: '经典之作',
        description: '酿出冰酒酿桂花酪',
        check: () => {
            const completed = window.LevelManager.currentProgress.completedLevels || [];
            const done = completed.includes(106) ? 1 : 0;
            return { current: done, total: 1 };
        },
        reward: '💎 300',
        gems: 300
    },
    {
        id: 'complete_chapter1',
        name: '酪之初启',
        description: '完成奶酪谷全部 6 关',
        check: () => {
            const completed = window.LevelManager.currentProgress.completedLevels || [];
            const chapter1 = [101, 102, 103, 104, 105, 106];
            const done = chapter1.filter(id => completed.includes(id)).length;
            return { current: done, total: 6 };
        },
        reward: '💎 200',
        gems: 200
    },
    {
        id: 'discover_10',
        name: '见多识广',
        description: '发现 10 种物品',
        check: () => {
            const items = window.LevelManager.currentProgress.discoveredItems || [];
            return { current: Math.min(items.length, 10), total: 10 };
        },
        reward: '💎 100',
        gems: 100
    },
    {
        id: 'discover_20',
        name: '酿造百科',
        description: '发现 20 种物品',
        check: () => {
            const items = window.LevelManager.currentProgress.discoveredItems || [];
            return { current: Math.min(items.length, 20), total: 20 };
        },
        reward: '💎 250',
        gems: 250
    }
];

function renderTasks() {
    const list = document.getElementById('tasks-list');
    if (!list) return;

    // 已领取的任务奖励记录
    const claimed = JSON.parse(localStorage.getItem('baozhu_claimed_tasks') || '[]');

    list.innerHTML = '';

    TASKS.forEach(task => {
        const { current, total } = task.check();
        const percent = Math.min((current / total) * 100, 100);
        const done = current >= total;
        const alreadyClaimed = claimed.includes(task.id);
        const canClaim = done && !alreadyClaimed;

        const row = document.createElement('div');
        row.className = 'task-row' + (done ? ' task-done' : '') + (alreadyClaimed ? ' task-claimed' : '');

        const rewardLabel = canClaim ? '领取' : (alreadyClaimed ? '已领取' : '奖励');

        row.innerHTML =
            '<div class="task-left">' +
                '<div class="task-info">' +
                    '<span class="task-name">' + task.name + '</span>' +
                    '<span class="task-desc">' + task.description + '</span>' +
                '</div>' +
                '<div class="task-progress-bar">' +
                    '<div class="task-progress-fill" style="width:' + percent + '%"></div>' +
                '</div>' +
                '<span class="task-progress-text">' + current + ' / ' + total + '</span>' +
            '</div>' +
            '<div class="task-reward' + (canClaim ? ' task-claimable' : '') + '" data-task-id="' + task.id + '">' +
                (canClaim ? '<span class="claimable-dot"></span>' : '') +
                '<span class="task-reward-label">' + rewardLabel + '</span>' +
                '<span class="task-reward-value">' + task.reward + '</span>' +
            '</div>';

        list.appendChild(row);
    });

    // Bind claim buttons
    list.querySelectorAll('.task-claimable').forEach(el => {
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => {
            const taskId = el.dataset.taskId;
            const task = TASKS.find(t => t.id === taskId);
            if (!task || !task.gems) return;

            claimed.push(taskId);
            localStorage.setItem('baozhu_claimed_tasks', JSON.stringify(claimed));
            window.LevelManager.addGems(task.gems);

            el.classList.remove('task-claimable');
            el.querySelector('.task-reward-label').textContent = '已领取';
            _removeDot(el);
            el.style.cursor = '';

            const row = el.closest('.task-row');
            if (row) row.classList.add('task-claimed');

            updateClaimableDots();
        });
    });
}

// ==================== 进度面板 ====================

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
