// 开场序列系统 - 渲染循环模块
// ================================================

IntroSystem.prototype.animate = function(time = 0) {
    const dt = time - this.lastTime;
    this.lastTime = time;
    
    // 清空画布
    // 在上升和后续阶段，使用透明清除让CSS背景渐变显示出来
    if (this.risePhase === 'rising' || this.risePhase === 'stopped' || this.state === 'gatherToText' || this.state === 'showStartButton' || this.state === 'storyTransition') {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // 荧光蓝覆层（献上后的效果）- 更亮更温柔
    if (this.state === 'blueWash' || this.state === 'riseUp') {
        const maxAlpha = this.blueWashMaxAlpha || 0.25;
        
        if (this.blueWashPhase === 'fadeIn') {
            this.cyanOverlayAlpha = Math.min(this.cyanOverlayAlpha + 0.008, maxAlpha);
        } else if (this.blueWashPhase === 'hold') {
            // 保持
        } else if (this.blueWashPhase === 'fadeOut') {
            this.cyanOverlayAlpha = Math.max(this.cyanOverlayAlpha - 0.006, 0);
        }
        
        if (this.cyanOverlayAlpha > 0) {
            this.ctx.fillStyle = `rgba(0, 200, 255, ${this.cyanOverlayAlpha})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    
    // 上升动画 - 镜头与粒子同步，带加速和减速
    if (this.risePhase === 'rising') {
        const elapsed = performance.now() - this.riseStartTime;
        const totalDuration = this.riseDuration;
        const accelTime = this.riseAccelTime;
        const decelTime = this.riseDecelTime;
        const steadyStart = accelTime;
        const steadyEnd = totalDuration - decelTime;
        
        // 计算目标镜头速度（基于阶段）
        let maxCameraSpeed = 15; // 最大镜头速度
        
        if (elapsed < accelTime) {
            // 加速阶段：使用缓动函数平滑加速
            const accelProgress = elapsed / accelTime;
            const eased = this.easeOutCubic(accelProgress);
            this.targetRiseSpeed = maxCameraSpeed * eased;
        } else if (elapsed < steadyEnd) {
            // 匀速阶段
            this.targetRiseSpeed = maxCameraSpeed;
        } else if (elapsed < totalDuration) {
            // 减速阶段：使用缓动函数平滑减速
            const decelProgress = (elapsed - steadyEnd) / decelTime;
            const eased = this.easeInCubic(1 - decelProgress);
            this.targetRiseSpeed = maxCameraSpeed * eased;
        } else {
            this.targetRiseSpeed = 0;
        }
        
        // 镜头速度平滑过渡
        this.riseSpeed += (this.targetRiseSpeed - this.riseSpeed) * 0.15;
        this.riseOffset += this.riseSpeed;
        
        // 限制最大偏移
        if (this.riseOffset > this.riseTargetOffset) {
            this.riseOffset = this.riseTargetOffset;
        }
    } else if (this.risePhase === 'stopped') {
        // 停止后保持位置
    }
    
    // 更新和绘制粒子
    this.updateParticles(dt);
    this.updatePulseWaves(dt);
    this.drawParticles();
    this.drawPulseWaves();
    
    // 更新物品动画
    this.updateItemAnimations(dt);
    
    requestAnimationFrame(this.animate.bind(this));
};

IntroSystem.prototype.updateItemAnimations = function(dt) {
    this.items.forEach(item => {
        if (item.animPhase === 'popApart' && item.animTarget) {
            item.x += (item.animTarget.x - item.x) * 0.2;
            item.y += (item.animTarget.y - item.y) * 0.2;
            this.updateItemPosition(item);
        } else if (item.animPhase === 'spinning') {
            const elapsed = performance.now() - item.spinStart;
            const progress = Math.min(elapsed / 600, 1); // 600ms
            const eased = this.easeInOutCubic(progress);
            item.spinAngle = eased * Math.PI * 4; // 2圈
            this.updateItemPosition(item);
        } else if (item.animPhase === 'dash' && item.animTarget) {
            item.x += (item.animTarget.x - item.x) * 0.3;
            item.y += (item.animTarget.y - item.y) * 0.3;
            item.spinAngle = 0;
            this.updateItemPosition(item);
        }
    });
    
    // 合成结果动画
    if (this.synthesisResult && this.synthesisResult.animPhase === 'offering') {
        const item = this.synthesisResult;
        if (item.animTarget) {
            item.x += (item.animTarget.x - item.x) * 0.12;
            item.y += (item.animTarget.y - item.y) * 0.12;
            this.updateItemPosition(item);
        }
    }
};

IntroSystem.prototype.updateItemPosition = function(item) {
    if (item.el) {
        item.el.style.left = item.x + 'px';
        item.el.style.top = item.y + 'px';
        if (item.spinAngle) {
            item.el.style.transform = `rotate(${item.spinAngle}rad)`;
        } else {
            item.el.style.transform = '';
        }
    }
};

// ==================== 缓动函数 ====================

IntroSystem.prototype.easeInOutCubic = function(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

IntroSystem.prototype.easeOutCubic = function(t) {
    return 1 - Math.pow(1 - t, 3);
};

IntroSystem.prototype.easeInCubic = function(t) {
    return t * t * t;
};

// ==================== 辅助方法 ====================

IntroSystem.prototype.showNarrative = function(text) {
    if (this.narrativeEl) {
        this.narrativeEl.textContent = text;
        this.narrativeEl.classList.add('visible');
        
        // 荧光蓝色，发光效果，像灵魂的低语
        this.narrativeEl.style.color = '#E0F7FA';
        this.narrativeEl.style.textShadow = '0 0 10px rgba(0, 200, 255, 0.8), 0 0 20px rgba(0, 200, 255, 0.4)';
    }
};

IntroSystem.prototype.hideNarrative = function() {
    if (this.narrativeEl) {
        this.narrativeEl.classList.remove('visible');
    }
};

IntroSystem.prototype.finishIntro = function() {
    // 标记已播放
    sessionStorage.setItem('hasPlayedIntro_v5', 'true');
    
    // 淡出开场
    const screen = document.getElementById('intro-screen');
    if (screen) {
        screen.classList.add('fade-out');
        
        setTimeout(() => {
            screen.style.display = 'none';
            // 直接跳转到章节选择页面（开始游戏 = 继续探索）
            if (window.navigateTo) window.navigateTo('levels.html');
            else window.location.href = 'levels.html';
        }, 1000);
    }
};

