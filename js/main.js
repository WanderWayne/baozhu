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
    
    const mainScreen = document.getElementById('main-screen');
    if (mainScreen && mainScreen.style.display !== 'none') {
        // 主界面已显示，初始化粒子系统
        if (!window.mainParticleSystem) {
            window.mainParticleSystem = new MainParticleSystem();
        }
        
        // 初始化环境层（使用全局函数，更可靠）
        if (window.initMainScreenAmbience) {
            window.initMainScreenAmbience();
        }
        
        // 播放BGM
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
            
            // 检查是否是首次进入（从开场动画过来，进度条等被隐藏）
            const codexRow = document.getElementById('codex-row');
            const isFirstTime = codexRow && codexRow.style.display === 'none';
            
            // 如果是从开场过来，introSystem 实例还在 window 上
            // 但如果直接刷新主界面，introSystem 可能不在
            if (isFirstTime && window.introSystem) {
                // 首次进入：播放播种动画后跳转
                window.introSystem.showSeedAndGoToLevels();
            } else {
                // 老玩家：直接跳转
                window.navigateTo('levels.html');
            }
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

    // 自由世界按钮
    const freeModeBtn = document.getElementById('free-mode-btn');
    if (freeModeBtn) {
        freeModeBtn.addEventListener('click', () => {
            if (window.AudioManager) window.AudioManager.playClickEnter();
            window.navigateTo('game.html?mode=free');
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
