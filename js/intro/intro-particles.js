// 开场序列系统 - 粒子系统模块
// ================================================

IntroSystem.prototype.addParticle = function(fromCenter = false) {
    let x, y;
    const margin = 0; // 屏幕边缘留白
    
    if (this.isSmallScreen) {
        // 小屏幕：均匀分布在屏幕可见区域内
        x = margin + Math.random() * (this.canvas.width - margin * 2);
        y = margin + Math.random() * (this.canvas.height - margin * 2);
    } else {
        // 大屏幕：使用原来的圆形分布
        const angle = Math.random() * Math.PI * 2;
        const dist = fromCenter ? (20 + Math.random() * 80) : (150 + Math.random() * 350);
        x = this.centerX + Math.cos(angle) * dist;
        y = this.centerY + Math.sin(angle) * dist;
    }
    
    // 随机决定是否为荧光蓝粒子（约30%概率）
    const isCyan = Math.random() < 0.3;
    
    const p = {
        x: x,
        y: y,
        homeX: x, // 记录"家"的位置
        homeY: y,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        wanderAngle: Math.random() * Math.PI * 2, // 漫游角度
        wanderRadius: 15 + Math.random() * 25, // 漫游半径（小范围移动）
        size: this.config.particleBaseSize + Math.random() * (this.config.particleMaxSize - this.config.particleBaseSize),
        alpha: (this.config.particleAlpha + Math.random() * 0.15) * 0.6, // 降低透明度，更像背景
        targetAlpha: null,
        linkedTo: null,
        gathering: false,
        targetX: null,
        targetY: null,
        targetSize: null,
        isTextDot: false,
        pulseOffset: 0, // 被光波震动的偏移
        pulseDecay: 0,
        pulseAngle: 0,
        isCyan: isCyan, // 是否为荧光蓝粒子
        originalColor: isCyan ? 'cyan' : 'white' // 原始颜色
    };
    
    this.particles.push(p);
    return p;
};

IntroSystem.prototype.addLinkedCluster = function() {
    const count = 2 + Math.floor(Math.random() * 2); // 2-3个
    const margin = 80;
    let baseX, baseY;
    
    if (this.isSmallScreen) {
        // 小屏幕：在屏幕可见区域内生成
        baseX = margin + Math.random() * (this.canvas.width - margin * 2);
        baseY = margin + Math.random() * (this.canvas.height - margin * 2);
    } else {
        baseX = this.centerX + (Math.random() - 0.5) * 500;
        baseY = this.centerY + (Math.random() - 0.5) * 500;
    }
    
    const cluster = [];
    
    for (let i = 0; i < count; i++) {
        const p = this.addParticle(false);
        // 连线粒子间距缩小
        p.x = baseX + (Math.random() - 0.5) * this.config.linkedClusterSpacing;
        p.y = baseY + (Math.random() - 0.5) * this.config.linkedClusterSpacing;
        p.homeX = p.x; // 更新家的位置
        p.homeY = p.y;
        p.vx = (Math.random() - 0.5) * 0.1;
        p.vy = (Math.random() - 0.5) * 0.1;
        p.size = this.config.particleBaseSize; // 连线粒子统一较小
        cluster.push(p);
    }
    
    // 建立连接
    for (let i = 1; i < cluster.length; i++) {
        cluster[i].linkedTo = cluster[i - 1];
    }
};

IntroSystem.prototype.updateParticles = function(dt) {
    // 上升偏移影响粒子y轴
    const riseY = (this.state === 'riseUp' || this.state === 'gatherToText' || this.state === 'showStartButton') 
        ? (this.riseOffset || 0) : 0;
        
    this.particles.forEach(p => {
        // 上升逻辑 - 从原位置往上飞
        if (this.state === 'riseUp' && !p.gathering) {
            const elapsed = performance.now() - (this.riseStartTime || 0);
            const totalDuration = this.riseDuration || 3000;
            const accelTime = this.riseAccelTime || 800;
            const decelTime = this.riseDecelTime || 1000;
            const steadyEnd = totalDuration - decelTime;
            
            // 计算速度倍数（使用与镜头相同的加减速曲线）
            let speedMultiplier = 1;
            if (elapsed < accelTime) {
                // 加速阶段
                const accelProgress = elapsed / accelTime;
                speedMultiplier = this.easeOutCubic(accelProgress);
            } else if (elapsed < steadyEnd) {
                // 匀速阶段
                speedMultiplier = 1;
            } else if (elapsed < totalDuration) {
                // 减速阶段
                const decelProgress = (elapsed - steadyEnd) / decelTime;
                speedMultiplier = this.easeInCubic(1 - decelProgress);
            } else {
                speedMultiplier = 0;
            }
            
            p.risingSpeed = (p.maxRisingSpeed || 10) * speedMultiplier;
            
            // 往上飞
            const speed = p.risingSpeed || 0;
            p.y -= speed;
            
            // 轻微水平漂移（保持自然感）
            if (p.driftSpeed) {
                p.x += p.driftSpeed * speedMultiplier;
            }
            
            // 计算上升进度（限制在 0-1）
            const startY = p.riseStartY || this.canvas.height / 2;
            const totalRise = Math.max(0, startY - p.y);
            const maxRise = this.canvas.height * 1.5;
            const riseProgress = Math.min(1, Math.max(0, totalRise / maxRise));
            
            // 上升过程中粒子逐渐变大到文字点大小
            const targetSize = this.config.textParticleSize || 12;
            const startSize = p.originalSize || p.size || 2;
            // 确保 size 始终为正数
            p.visualSize = Math.max(1, startSize + (targetSize - startSize) * riseProgress);
            
            // 透明度也逐渐增加
            p.visualAlpha = Math.max(0.1, (p.alpha || 0.5) * (0.6 + riseProgress * 0.4));
            
            // 更新实际 size（用于后续组成文字）
            p.size = p.visualSize;
        } else {
            p.visualSize = Math.max(1, p.size || 2);
            p.visualAlpha = p.alpha || 0.5;
        }
        
        // 已经到达目标位置并固定的粒子不再移动
        if (p.settled) {
            return;
        }
        
        if (p.gathering && p.targetX !== null) {
            // 向目标聚合 - 慢慢靠近
            const dx = p.targetX - p.x;
            const dy = p.targetY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 1) {
                // 使用更慢的缓动
                const speed = Math.max(dist * 0.03, 1); // 更慢：0.08 -> 0.03
                p.x += (dx / dist) * speed;
                p.y += (dy / dist) * speed;
            } else {
                // 到达目标，固定位置
                p.x = p.targetX;
                p.y = p.targetY;
                if (p.isTextDot) {
                    p.settled = true; // 标记为已固定
                    p.alpha = 1; // 确保完全可见
                    p.visualAlpha = 1;
                }
            }
            
            if (p.targetSize !== null) {
                p.size += (p.targetSize - p.size) * 0.1;
                p.visualSize = p.size;
            }
            if (p.targetAlpha !== null) {
                // 文字粒子从透明变为可见，速度适中
                const alphaSpeed = p.isTextDot ? 0.05 : 0.08;
                p.alpha += (p.targetAlpha - p.alpha) * alphaSpeed;
                p.visualAlpha = p.alpha;
            }
        } else if (this.state !== 'riseUp') { // 非上升状态下的自由漂浮
            if (this.isSmallScreen && p.homeX !== undefined) {
                // 小屏幕：围绕"家"位置小范围漫游
                p.wanderAngle += (Math.random() - 0.5) * 0.05; // 缓慢改变漫游方向
                
                // 目标位置是家附近的一个点
                const targetX = p.homeX + Math.cos(p.wanderAngle) * p.wanderRadius;
                const targetY = p.homeY + Math.sin(p.wanderAngle) * p.wanderRadius;
                
                // 缓慢移向目标
                p.x += (targetX - p.x) * 0.01;
                p.y += (targetY - p.y) * 0.01;
            } else {
                // 大屏幕：原有的自由漂浮逻辑
                p.x += p.vx;
                p.y += p.vy;
                
                // 边界反弹（软边界）
                const margin = 50;
                if (p.x < margin) p.vx += 0.01;
                if (p.x > this.canvas.width - margin) p.vx -= 0.01;
                if (p.y < margin) p.vy += 0.01;
                if (p.y > this.canvas.height - margin) p.vy -= 0.01;
                
                // 速度衰减
                p.vx *= 0.999;
                p.vy *= 0.999;
            }
        }
        
        // 光波震动衰减
        if (p.pulseDecay > 0) {
            p.pulseDecay -= dt * 0.002;
            if (p.pulseDecay < 0) p.pulseDecay = 0;
        }
    });
};

IntroSystem.prototype.drawParticles = function() {
    const ctx = this.ctx;
    
    // 上升偏移已在 update 中处理了粒子坐标，这里只需要处理尾巴
    const riseY = (this.state === 'riseUp' || this.state === 'gatherToText' || this.state === 'showStartButton') 
        ? (this.riseOffset || 0) : 0;
    
    // 先画连线（更细更透明）
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 0.5;
    this.particles.forEach(p => {
        if (p.linkedTo && !p.gathering && this.state !== 'riseUp') {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.linkedTo.x, p.linkedTo.y);
            ctx.stroke();
        }
    });
    
    // 再画粒子
    this.particles.forEach(p => {
        // 光波震动偏移
        const offsetX = Math.cos(p.pulseAngle) * p.pulseOffset * p.pulseDecay;
        const offsetY = Math.sin(p.pulseAngle) * p.pulseOffset * p.pulseDecay;
        
        // 绘制拖尾（仅在上升时）
        if (this.state === 'riseUp' && !p.gathering) {
            const speed = p.risingSpeed || 4;
            const trailLength = speed * 4 + (this.riseSpeed || 6) * 1.5;
            const renderY = p.y + riseY;
            
            const gradient = ctx.createLinearGradient(p.x, renderY, p.x, renderY + trailLength);
            gradient.addColorStop(0, `rgba(255, 255, 255, ${(p.visualAlpha || p.alpha) * 0.8})`);
            gradient.addColorStop(0.4, `rgba(200, 230, 255, ${(p.visualAlpha || p.alpha) * 0.4})`);
            gradient.addColorStop(1, 'rgba(150, 200, 255, 0)');
            
            ctx.beginPath();
            ctx.moveTo(p.x, renderY);
            ctx.lineTo(p.x, renderY + trailLength);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = (p.visualSize || p.size) * 0.5;
            ctx.lineCap = 'round';
            ctx.stroke();
        }
        
        // 绘制粒子本体
        let renderY = p.y;
        if (this.state === 'riseUp' || this.state === 'gatherToText' || this.state === 'showStartButton') {
            renderY += riseY;
        }
        
        // 确保半径为正数
        const radius = Math.max(0.5, p.visualSize || p.size || 2);
        const alpha = Math.max(0, Math.min(1, p.visualAlpha || p.alpha || 0.5));
        
        ctx.beginPath();
        ctx.arc(p.x + offsetX, renderY + offsetY, radius, 0, Math.PI * 2);
        
        // 决定粒子颜色：聚合/上升中的粒子变白，否则按原始颜色
        if (p.gathering || p.settled || this.state === 'riseUp' || this.state === 'gatherToText' || this.state === 'showStartButton') {
            // 聚合成文字时全部变白
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        } else if (p.isCyan) {
            // 荧光蓝粒子
            ctx.fillStyle = `rgba(176, 245, 255, ${alpha})`;
        } else {
            // 白色粒子
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        }
        ctx.fill();
    });
};

// 发射多条光波（中间最强，向外递减）
IntroSystem.prototype.emitPulseWave = function(x, y, isFinal = false) {
    const waveCount = isFinal ? 5 : 3;
    const baseDelay = 80;
    
    for (let i = 0; i < waveCount; i++) {
        setTimeout(() => {
            // 中间的波最强
            const centerIndex = Math.floor(waveCount / 2);
            const distFromCenter = Math.abs(i - centerIndex);
            const strength = 1 - (distFromCenter / waveCount) * 0.6;
            
            const wave = {
                x, y,
                radius: 0,
                maxRadius: isFinal ? 500 : 300,
                speed: isFinal ? 6 : 4,
                alpha: strength,
                lineWidth: isFinal ? (4 - distFromCenter * 0.8) : (2 - distFromCenter * 0.4),
                isFinal
            };
            
            this.pulseWaves.push(wave);
        }, i * baseDelay);
    }
};

IntroSystem.prototype.updatePulseWaves = function(dt) {
    this.pulseWaves = this.pulseWaves.filter(wave => {
        wave.radius += wave.speed;
        const progress = wave.radius / wave.maxRadius;
        wave.currentAlpha = wave.alpha * (1 - progress * progress); // 平方衰减
        
        // 检测粒子碰撞 - 震动效果
        if (wave.isFinal || wave.alpha > 0.5) {
            this.particles.forEach(p => {
                const dx = p.x - wave.x;
                const dy = p.y - wave.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // 波前沿范围内的粒子被震动
                if (Math.abs(dist - wave.radius) < 30) {
                    const strength = wave.isFinal ? 20 : 10;
                    p.pulseOffset = strength * (1 - Math.abs(dist - wave.radius) / 30);
                    p.pulseDecay = 1;
                    p.pulseAngle = Math.atan2(dy, dx); // 径向震动
                }
            });
        }
        
        return wave.radius < wave.maxRadius;
    });
};

IntroSystem.prototype.drawPulseWaves = function() {
    const ctx = this.ctx;
    this.pulseWaves.forEach(wave => {
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
        const color = wave.isFinal 
            ? `rgba(255, 200, 50, ${wave.currentAlpha * 0.7})`
            : `rgba(255, 215, 100, ${wave.currentAlpha * 0.5})`;
        ctx.strokeStyle = color;
        ctx.lineWidth = wave.lineWidth;
        ctx.stroke();
    });
};

