// 开场序列系统 - 后期状态模块
// ================================================

IntroSystem.prototype.initBlueWash = function() {
    // 背景荧光蓝渐变 - 更亮更温柔，有力量感
    this.blueWashPhase = 'fadeIn';
    this.cyanOverlayAlpha = 0;
    this.blueWashMaxAlpha = 0.5;
    
    // 1.5秒慢慢变亮
    setTimeout(() => {
        this.blueWashPhase = 'hold';
    }, 1500);
    
    // 保持0.5秒后开始消退
    setTimeout(() => {
        this.blueWashPhase = 'fadeOut';
        
        // 荧光蓝消退后，进入故事叙述（新流程：先讲故事，再上升）
        setTimeout(() => {
            this.setState('storyNarration');
        }, 1500);
    }, 2000);
};

// ==================== 新状态：故事叙述（粒子保持原位）====================

IntroSystem.prototype.initStoryNarration = function() {
    // 让门和物品栏慢慢消失
    if (this.doorEl) {
        this.doorEl.style.transition = 'opacity 1.5s ease';
        this.doorEl.style.opacity = '0';
    }
    if (this.inventoryEl) {
        this.inventoryEl.style.transition = 'opacity 1.5s ease';
        this.inventoryEl.style.opacity = '0';
    }
    
    // 粒子保持原位，不做任何变化
    // 只是让它们轻微呼吸
    this.particles.forEach(p => {
        p.storyBreathPhase = Math.random() * Math.PI * 2;
        p.storyBreathSpeed = 0.3 + Math.random() * 0.3;
    });
    
    // 创建故事文字容器
    const storyContainer = document.createElement('div');
    storyContainer.id = 'story-text-container';
    storyContainer.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        z-index: 50;
        pointer-events: none;
    `;
    document.getElementById('intro-screen').appendChild(storyContainer);
    this.storyContainer = storyContainer;
    
    // 故事文字序列（新增第一句）
    const storySequence = [
        { text: '亲爱的酿造师，\n你对这个世界好像全然不知。', delay: 800, duration: 5500 },
        { text: '十三年前，一位酿造师在田子坊的小巷里\n点燃了第一盏灯，开始了酿造的旅程。', delay: 600, duration: 6500 },
        { text: '十三年后，这些配方被时间打碎成了记忆碎片，\n散落在酿造宇宙的各个角落。', delay: 600, duration: 6500 },
        { text: '你的任务：找回这些碎片，\n重建完整的"宝珠配方图谱"。', delay: 600, duration: 6500, isGoal: true },
        { text: '当最后一块碎片归位，\n传说中的"天赐宝珠酪"将再次被唤醒。', delay: 600, duration: 7000, isGoal: true }
    ];
    
    let currentDelay = 500;
    
    storySequence.forEach((item, index) => {
        currentDelay += item.delay;
        
        setTimeout(() => {
            this.showStoryText(storyContainer, item.text, item.duration, item.isGoal);
        }, currentDelay);
        
        currentDelay += item.duration;
    });
    
    // 故事讲完后，进入粒子上升阶段
    setTimeout(() => {
        // 移除故事容器
        if (storyContainer.parentNode) {
            storyContainer.style.transition = 'opacity 1s ease';
            storyContainer.style.opacity = '0';
            setTimeout(() => storyContainer.remove(), 1000);
        }
        this.setState('riseUp');
    }, currentDelay + 800);
};

// ==================== 粒子上升（带渐进式颜色变化）====================

IntroSystem.prototype.initRiseUp = function() {
    // 初始化渐进式颜色变化参数
    this.colorTransitionProgress = 0; // 0 = 黑色/白色，1 = 破晓粉/老木褐
    
    // 开始上升动画
    this.startRiseAnimation();
};

IntroSystem.prototype.startRiseAnimation = function() {
    // 粒子往上飞
    this.risePhase = 'rising';
    this.riseOffset = 0;
    this.riseTargetOffset = this.canvas.height * 4;
    this.riseSpeed = 0;
    this.targetRiseSpeed = 0;
    this.cameraScale = 1;
    this.riseStartTime = performance.now();
    this.riseDuration = 6000;
    this.riseAccelTime = 1600;
    this.riseDecelTime = 2000;
    
    // 给所有粒子赋予上升属性
    this.particles.forEach(p => {
        p.riseStartX = p.x;
        p.riseStartY = p.y;
        p.risingSpeed = 0;
        p.maxRisingSpeed = 10 + Math.random() * 10;
        p.originalSize = p.size;
        p.driftSpeed = (Math.random() - 0.5) * 0.4;
    });
    
    // 镜头放大动画
    const screen = document.getElementById('intro-screen');
    if (screen) {
        screen.style.transition = 'transform 5s cubic-bezier(0.25, 0.1, 0.25, 1)';
        screen.style.transform = 'scale(1.3)';
    }
    
    // 动画完成后进入组成文字阶段
    setTimeout(() => {
        this.risePhase = 'stopped';
        this.setState('gatherToText');
    }, this.riseDuration);
};

// ==================== 粒子聚合成文字 ====================

IntroSystem.prototype.initGatherToText = function() {
    // 重新加载点阵目标
    this.loadTextDots();
    
    const riseY = this.riseOffset || 0;
    const displayCenterY = this.centerY * 0.65;
    const actualCenterY = displayCenterY - riseY;
    
    // 调整目标位置
    const offsetY = actualCenterY - this.centerY;
    this.textDotTargets.forEach(t => {
        t.y = t.y + offsetY;
    });
    
    const needed = this.textDotTargets.length;
    const currentCount = this.particles.length;
    
    // 如果粒子不够，添加额外粒子
    const extraNeeded = Math.max(0, needed - currentCount);
    if (extraNeeded > 0) {
        for (let i = 0; i < extraNeeded; i++) {
            const side = Math.floor(Math.random() * 4);
            let x, y;
            const visibleTop = -riseY - 100;
            const visibleBottom = this.canvas.height - riseY + 100;
            const visibleMidY = (visibleTop + visibleBottom) / 2;
            
            switch (side) {
                case 0: x = Math.random() * this.canvas.width; y = visibleTop; break;
                case 1: x = this.canvas.width + 50; y = visibleMidY + (Math.random() - 0.5) * this.canvas.height; break;
                case 2: x = Math.random() * this.canvas.width; y = visibleBottom; break;
                case 3: x = -50; y = visibleMidY + (Math.random() - 0.5) * this.canvas.height; break;
            }
            
            this.particles.push({
                x, y, vx: 0, vy: 0,
                size: this.config.textParticleSize,
                alpha: 0.8, visualSize: this.config.textParticleSize, visualAlpha: 0.8,
                linkedTo: null, gathering: false, isExtraParticle: true
            });
        }
    }
    
    // 排序和分配目标
    const sortedParticles = [...this.particles].sort((a, b) => {
        const distA = Math.hypot(a.x - this.centerX, a.y - actualCenterY);
        const distB = Math.hypot(b.x - this.centerX, b.y - actualCenterY);
        return distA - distB;
    });
    
    const shuffledTargets = [...this.textDotTargets].sort(() => Math.random() - 0.5);
    
    this.particles.forEach(p => {
        p.linkedTo = null;
        p.driftSpeed = 0;
    });
    
    sortedParticles.forEach((p, i) => {
        if (i < shuffledTargets.length) {
            p.targetX = shuffledTargets[i].x;
            p.targetY = shuffledTargets[i].y;
            p.targetSize = this.config.textParticleSize;
            p.isTextDot = true;
            p.targetAlpha = 1;
            p.gathering = true;
            p.settled = false;
            p.alpha = 1;
            p.visualAlpha = 1;
            p.isCyan = false;
            p.useOldWood = true;
        } else {
            p.targetAlpha = 0;
            p.isTextDot = false;
            p.gathering = true;
            p.targetX = p.x + (Math.random() - 0.5) * 300;
            p.targetY = p.y - 200;
        }
    });
    
    setTimeout(() => {
        this.setState('showStartButton');
    }, 4000);
};

// ==================== 显示按钮（开始游戏 + 设置）====================

IntroSystem.prototype.initShowStartButton = function() {
    // 粒子固定到位
    this.particles.forEach(p => {
        if (p.isTextDot && p.targetX !== null) {
            p.x = p.targetX;
            p.y = p.targetY;
            p.gathering = false;
        }
    });
    
    // 播放主界面 BGM
    if (window.AudioManager) {
        window.AudioManager.playBGM('bgm-menu');
    }
    
    // 显示多层次环境效果
    if (typeof this.showAmbienceLayers === 'function') {
        this.showAmbienceLayers();
    } else if (window.AmbienceSystem) {
        // 后备方案：直接使用 AmbienceSystem
        console.log('[Intro] 使用后备方案初始化环境层');
        this.ambience = new window.AmbienceSystem('intro-screen');
        this.ambience.init();
    } else {
        console.warn('showAmbienceLayers 和 AmbienceSystem 都不可用');
    }
    
    // 创建按钮容器
    setTimeout(() => {
        this.showIntroButtons();
    }, 500);
};

IntroSystem.prototype.showIntroButtons = function() {
    const screen = document.getElementById('intro-screen');
    
    // 创建按钮容器
    const btnContainer = document.createElement('div');
    btnContainer.id = 'intro-buttons';
    btnContainer.style.cssText = `
        position: absolute;
        top: 48%;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        z-index: 50;
        opacity: 0;
        transition: opacity 0.8s ease;
    `;
    
    // 开始游戏按钮
    const startBtn = document.createElement('button');
    startBtn.textContent = '开始游戏';
    startBtn.style.cssText = `
        padding: 12px 24px;
        font-size: 16px;
        color: #6B5344;
        background: transparent;
        border: none;
        border-top: 1px solid #A67C52;
        cursor: pointer;
        font-family: "Source Han Serif SC", "Noto Serif SC", "PingFang SC", serif;
        letter-spacing: 4px;
        transition: all 0.3s ease;
    `;
    startBtn.addEventListener('mouseenter', () => {
        startBtn.style.color = '#E8C873';
        startBtn.style.borderTopColor = '#E8C873';
        startBtn.style.textShadow = '0 0 15px rgba(232, 200, 115, 0.4)';
    });
    startBtn.addEventListener('mouseleave', () => {
        startBtn.style.color = '#6B5344';
        startBtn.style.borderTopColor = '#A67C52';
        startBtn.style.textShadow = 'none';
    });
    startBtn.addEventListener('click', () => {
        if (window.AudioManager) {
            window.AudioManager.playClickEnter();
            window.AudioManager.fadeOutBGM(2000);
        }
        this.startSeedAndGoToLevels();
    });
    
    // 设置按钮
    const settingsBtn = document.createElement('button');
    settingsBtn.textContent = '设置';
    settingsBtn.style.cssText = `
        padding: 8px 16px;
        font-size: 14px;
        color: #A67C52;
        background: transparent;
        border: none;
        border-bottom: 1px solid rgba(166, 124, 82, 0.3);
        cursor: pointer;
        font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
        letter-spacing: 3px;
        transition: all 0.3s ease;
    `;
    settingsBtn.addEventListener('mouseenter', () => {
        settingsBtn.style.color = '#6B5344';
        settingsBtn.style.borderBottomColor = '#A67C52';
    });
    settingsBtn.addEventListener('mouseleave', () => {
        settingsBtn.style.color = '#A67C52';
        settingsBtn.style.borderBottomColor = 'rgba(166, 124, 82, 0.3)';
    });
    settingsBtn.addEventListener('click', () => {
        if (window.AudioManager) window.AudioManager.playClickEnter();
        // 打开设置面板
        const settingsOverlay = document.getElementById('settings-overlay');
        if (settingsOverlay) settingsOverlay.classList.add('visible');
    });
    
    btnContainer.appendChild(startBtn);
    btnContainer.appendChild(settingsBtn);
    screen.appendChild(btnContainer);
    
    // 淡入按钮
    requestAnimationFrame(() => {
        btnContainer.style.opacity = '1';
    });
};

// 播种时刻并跳转章节选择
IntroSystem.prototype.startSeedAndGoToLevels = function() {
    // 标记已播放
    sessionStorage.setItem('hasPlayedIntro_v5', 'true');
    
    const screen = document.getElementById('intro-screen');
    const btnContainer = document.getElementById('intro-buttons');
    
    // 隐藏按钮
    if (btnContainer) {
        btnContainer.style.transition = 'opacity 0.5s ease';
        btnContainer.style.opacity = '0';
    }
    
    // 粒子淡出
    this.particles.forEach(p => {
        p.targetAlpha = 0;
        p.gathering = true;
    });
    
    // 播种动画
    setTimeout(() => {
        this.showSeedMoment();
    }, 800);
};

// 播种时刻
IntroSystem.prototype.showSeedMoment = function() {
    const screen = document.getElementById('intro-screen');
    
    const seed = document.createElement('div');
    seed.id = 'growth-seed';
    seed.style.cssText = `
        position: absolute;
        top: 40%;
        left: 50%;
        width: 10px;
        height: 10px;
        background: radial-gradient(circle, #E8C873 0%, #A67C52 70%, transparent 100%);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        box-shadow: 0 0 30px rgba(232, 200, 115, 0.9), 0 0 60px rgba(232, 200, 115, 0.5);
        z-index: 100;
        animation: seed-pulse 1s ease-in-out infinite;
    `;
    
    const style = document.createElement('style');
    style.id = 'seed-style';
    style.textContent = `
        @keyframes seed-pulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.9; }
            50% { transform: translate(-50%, -50%) scale(1.4); opacity: 1; }
        }
        @keyframes seed-fall {
            0% { top: 40%; opacity: 1; transform: translate(-50%, -50%) scale(1); }
            50% { top: 75%; opacity: 1; transform: translate(-50%, -50%) scale(0.8); }
            100% { top: 90%; opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
        }
    `;
    document.head.appendChild(style);
    screen.appendChild(seed);
    
    // 种子下落
    setTimeout(() => {
        seed.style.animation = 'seed-fall 1.8s ease-in forwards';
    }, 600);
    
    // 跳转章节选择
    setTimeout(() => {
        seed.remove();
        style.remove();
        if (window.navigateTo) {
            window.navigateTo('levels.html');
        } else {
            window.location.href = 'levels.html';
        }
    }, 2600);
};

// ==================== 故事过渡（不再需要）====================

IntroSystem.prototype.initStoryTransition = function() {
    // 不再使用
};

// ==================== 故事文字显示 ====================

IntroSystem.prototype.showStoryText = function(container, text, duration, isGoal = false) {
    if (window.AudioManager) {
        window.AudioManager.playSFX('text-appear');
    }
    
    const textEl = document.createElement('div');
    textEl.className = 'story-text' + (isGoal ? ' goal-text' : '');
    textEl.innerHTML = text.replace(/\n/g, '<br>');
    
    const isSmallScreen = window.innerWidth <= 450 && window.innerHeight <= 950;
    const fontSize = isSmallScreen ? '14px' : (isGoal ? '22px' : '24px');
    const letterSpacing = isSmallScreen ? '2px' : '4px';
    
    // 故事叙述阶段背景仍是黑色，所以文字用原来的荧光色
    textEl.style.cssText = `
        font-size: ${fontSize};
        line-height: 1.8;
        color: ${isGoal ? '#FFD700' : '#E0F7FA'};
        font-family: "Source Han Serif SC", "Noto Serif SC", "PingFang SC", serif;
        letter-spacing: ${letterSpacing};
        opacity: 0;
        transform: scale(0.95);
        transition: opacity 1s ease, transform 1s ease;
        text-shadow: ${isGoal 
            ? '0 0 20px rgba(255, 215, 0, 0.6), 0 0 40px rgba(255, 215, 0, 0.3)' 
            : '0 0 15px rgba(0, 200, 255, 0.6), 0 0 30px rgba(0, 200, 255, 0.3)'};
        margin: 20px 0;
        max-width: 80vw;
    `;
    
    container.innerHTML = '';
    container.appendChild(textEl);
    
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            textEl.style.opacity = '1';
            textEl.style.transform = 'scale(1)';
        });
    });
    
    setTimeout(() => {
        textEl.style.opacity = '0';
        textEl.style.transform = 'scale(1.02)';
    }, duration - 1000);
};
