// 开场序列系统 - 后期状态模块
// ================================================

IntroSystem.prototype.initBlueWash = function() {
    // 背景荧光蓝渐变 - 更亮更温柔，有力量感
    this.blueWashPhase = 'fadeIn';
    this.cyanOverlayAlpha = 0;
    this.blueWashMaxAlpha = 0.5; // 更亮
    
    // 1.5秒慢慢变亮
    setTimeout(() => {
        this.blueWashPhase = 'hold';
    }, 1500);
    
    // 保持0.5秒后开始消退
    setTimeout(() => {
        this.blueWashPhase = 'fadeOut';
        
        // 再过1.5秒后进入上升动画
        setTimeout(() => {
            this.setState('riseUp');
        }, 1500);
    }, 2000);
};

IntroSystem.prototype.initRiseUp = function() {
    // 第一步：先让门和物品栏彻底消失
    if (this.doorEl) {
        this.doorEl.style.transition = 'opacity 0.8s ease';
        this.doorEl.style.opacity = '0';
    }
    if (this.inventoryEl) {
        this.inventoryEl.style.transition = 'opacity 0.8s ease';
        this.inventoryEl.style.opacity = '0';
    }
    
    // 等待门和物品栏完全消失后，等0.3秒，然后开始动画
    setTimeout(() => {
        this.startRiseAnimation();
    }, 1100); // 0.8秒消失 + 0.3秒等待
};

IntroSystem.prototype.startRiseAnimation = function() {
    // 粒子往上飞
    this.risePhase = 'rising'; // 上升阶段
    this.riseOffset = 0;
    this.riseTargetOffset = this.canvas.height * 4; // 飞4屏的距离
    this.riseSpeed = 0;
    this.targetRiseSpeed = 0; // 目标镜头速度（用于平滑加减速）
    this.cameraScale = 1;
    this.riseStartTime = performance.now();
    this.riseDuration = 6000; // 总上升时间（ms）- 翻倍
    this.riseAccelTime = 1600; // 加速时间（ms）- 翻倍
    this.riseDecelTime = 2000; // 减速时间（ms）- 翻倍
    
    // 给所有粒子赋予上升属性 - 初始速度为0，会加速
    this.particles.forEach(p => {
        p.riseStartX = p.x;
        p.riseStartY = p.y;
        p.risingSpeed = 0; // 初始为0，会逐渐加速
        p.maxRisingSpeed = 10 + Math.random() * 10; // 最大速度（更快）
        p.originalSize = p.size;
        p.driftSpeed = (Math.random() - 0.5) * 0.4;
    });
    
    // 镜头放大动画 + 背景色渐变到宝珠品牌色
    const screen = document.getElementById('intro-screen');
    if (screen) {
        screen.style.transition = 'transform 5s cubic-bezier(0.25, 0.1, 0.25, 1)';
        screen.style.transform = 'scale(1.3)';
        
        // 背景色渐变：从黑色变成温暖的黄棕白色
        screen.classList.add('warm-transition');
    }
    
    // 动画完成后进入组成文字阶段
    setTimeout(() => {
        this.risePhase = 'stopped';
        this.setState('gatherToText');
    }, this.riseDuration);
};

IntroSystem.prototype.initGatherToText = function() {
    // 重新加载点阵目标
    this.loadTextDots();
    
    // 渲染时：renderY = p.y + riseOffset
    // 我们想让文字显示在屏幕中央偏上一点（约 centerY * 0.65 的位置）
    // "开始游戏"按钮会在中央偏下一点
    // 所以：目标渲染位置 = centerY * 0.65
    //       p.targetY + riseOffset = centerY * 0.65
    //       p.targetY = centerY * 0.65 - riseOffset
    const riseY = this.riseOffset || 0;
    const displayCenterY = this.centerY * 0.65; // 屏幕显示位置：中央偏上
    const actualCenterY = displayCenterY - riseY; // 粒子实际坐标
    
    // 调整目标位置（将文字从 centerY 移动到 actualCenterY）
    const offsetY = actualCenterY - this.centerY;
    this.textDotTargets.forEach(t => {
        t.y = t.y + offsetY;
    });
    
    console.log(`riseOffset: ${riseY}, 显示位置: ${displayCenterY}, 实际目标Y偏移: ${offsetY}, 需要 ${this.textDotTargets.length} 个点`);

    const needed = this.textDotTargets.length;
    const currentCount = this.particles.length;
    
    // 如果粒子不够，从四面八方添加额外粒子飞入
    const extraNeeded = Math.max(0, needed - currentCount);
    if (extraNeeded > 0) {
        console.log(`需要额外 ${extraNeeded} 个粒子从四面八方飞入`);
        for (let i = 0; i < extraNeeded; i++) {
            // 从屏幕四边外面生成（考虑当前可见区域，即考虑 riseOffset）
            const side = Math.floor(Math.random() * 4);
            let x, y;
            // 可见区域的 y 范围：实际 y 在 [-riseY, canvas.height - riseY] 之间
            const visibleTop = -riseY - 100;
            const visibleBottom = this.canvas.height - riseY + 100;
            const visibleMidY = (visibleTop + visibleBottom) / 2;
            
            switch (side) {
                case 0: // 上
                    x = Math.random() * this.canvas.width;
                    y = visibleTop;
                    break;
                case 1: // 右
                    x = this.canvas.width + 50;
                    y = visibleMidY + (Math.random() - 0.5) * this.canvas.height;
                    break;
                case 2: // 下
                    x = Math.random() * this.canvas.width;
                    y = visibleBottom;
                    break;
                case 3: // 左
                    x = -50;
                    y = visibleMidY + (Math.random() - 0.5) * this.canvas.height;
                    break;
            }
            
            const p = {
                x, y,
                vx: 0, vy: 0,
                size: this.config.textParticleSize,
                alpha: 0.8,
                visualSize: this.config.textParticleSize,
                visualAlpha: 0.8,
                linkedTo: null,
                gathering: false,
                isExtraParticle: true
            };
            this.particles.push(p);
        }
    }
    
    // 按照粒子当前位置排序（靠近文字中心的优先）
    const sortedParticles = [...this.particles].sort((a, b) => {
        const distA = Math.hypot(a.x - this.centerX, a.y - actualCenterY);
        const distB = Math.hypot(b.x - this.centerX, b.y - actualCenterY);
        return distA - distB;
    });
    
    // 打乱目标顺序
    const shuffledTargets = [...this.textDotTargets].sort(() => Math.random() - 0.5);
    
    // 断开所有连线，停止漂移
    this.particles.forEach(p => {
        p.linkedTo = null;
        p.driftSpeed = 0;
    });
    
    // 分配目标
    sortedParticles.forEach((p, i) => {
        if (i < shuffledTargets.length) {
            // 这个粒子会变成文字的一部分
            p.targetX = shuffledTargets[i].x;
            p.targetY = shuffledTargets[i].y;
            p.targetSize = this.config.textParticleSize;
            p.isTextDot = true;
            p.targetAlpha = 1;
            p.gathering = true;
            p.settled = false; // 重置固定状态
            // 文字粒子完全可见（透明度0% = 不透明）
            p.alpha = 1;
            p.visualAlpha = 1;
            // 确保是白色粒子
            p.isCyan = false;
        } else {
            // 多余粒子慢慢淡出
            p.targetAlpha = 0;
            p.isTextDot = false;
            p.gathering = true;
            p.targetX = p.x + (Math.random() - 0.5) * 300;
            p.targetY = p.y - 200;
        }
    });
    
    console.log(`开始聚合，共 ${this.particles.length} 个粒子，${needed} 个目标点`);
    
    // 4秒后显示开始按钮（拼字更慢，需要更长时间）
    setTimeout(() => {
        this.setState('showStartButton');
    }, 4000);
};


IntroSystem.prototype.initShowStartButton = function() {
    // 粒子停止移动，固定位置
    this.particles.forEach(p => {
        if (p.isTextDot && p.targetX !== null) {
            p.x = p.targetX;
            p.y = p.targetY;
            p.gathering = false;
        }
    });
    
    // 显示按钮
    setTimeout(() => {
        if (this.startBtnEl) {
            this.startBtnEl.classList.add('visible');
        }
    }, 500);
};

IntroSystem.prototype.initStoryTransition = function() {
    // 隐藏按钮和文字粒子
    if (this.startBtnEl) {
        this.startBtnEl.style.transition = 'opacity 0.8s ease';
        this.startBtnEl.style.opacity = '0';
        this.startBtnEl.style.pointerEvents = 'none';
    }
    
    // 粒子淡出
    this.particles.forEach(p => {
        p.targetAlpha = 0;
        p.gathering = true;
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
    
    // 故事文字序列（duration调整为6500ms以配合SFX21音效长度）
    const storySequence = [
        { text: '十三年前，一位酿造师在田子坊的小巷里\n点燃了第一盏灯，开始了酿造的旅程。', delay: 1000, duration: 6500 },
        { text: '十三年后，这些配方被时间打碎成了记忆碎片，\n散落在酿造宇宙的各个角落。', delay: 600, duration: 6500 },
        { text: '你的任务：找回这些碎片，\n重建完整的"宝珠配方图谱"。', delay: 600, duration: 6500, isGoal: true },
        { text: '当最后一块碎片归位，\n传说中的"天赐宝珠酪"将再次被唤醒。', delay: 600, duration: 7500, isGoal: true }
    ];
    
    let currentDelay = 800; // 初始等待粒子淡出
    
    storySequence.forEach((item, index) => {
        currentDelay += item.delay;
        
        setTimeout(() => {
            this.showStoryText(storyContainer, item.text, item.duration, item.isGoal);
        }, currentDelay);
        
        currentDelay += item.duration;
    });
    
    // 所有文字显示完后进入主界面
    setTimeout(() => {
        this.finishIntro();
    }, currentDelay + 500);
};

IntroSystem.prototype.showStoryText = function(container, text, duration, isGoal = false) {
    // 播放文字出现音效
    if (window.AudioManager) {
        window.AudioManager.playSFX('text-appear');
    }
    
    const textEl = document.createElement('div');
    textEl.className = 'story-text' + (isGoal ? ' goal-text' : '');
    textEl.innerHTML = text.replace(/\n/g, '<br>'); // 支持换行
    
    // iPhone 14 及类似小屏手机使用更小的字号
    const isSmallScreen = window.innerWidth <= 450 && window.innerHeight <= 950;
    const fontSize = isSmallScreen 
        ? (isGoal ? '14px' : '14px')
        : (isGoal ? '22px' : '24px');
    const letterSpacing = isSmallScreen ? '2px' : '4px';
    
    textEl.style.cssText = `
        font-size: ${fontSize};
        line-height: 1.8;
        color: ${isGoal ? '#FFD700' : '#E0F7FA'};
        font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
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
    
    container.innerHTML = ''; // 清除之前的文字
    container.appendChild(textEl);
    
    // 淡入
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            textEl.style.opacity = '1';
            textEl.style.transform = 'scale(1)';
        });
    });
    
    // 淡出
    setTimeout(() => {
        textEl.style.opacity = '0';
        textEl.style.transform = 'scale(1.02)';
    }, duration - 1000);
};

