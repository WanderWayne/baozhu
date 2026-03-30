// 开场序列系统 - 早期状态模块
// ================================================

IntroSystem.prototype.initDotIdle = function() {
    // 白点呼吸动画由 CSS 处理
    const dotEl = document.getElementById('intro-dot');
    if (dotEl) dotEl.classList.add('visible');
};

IntroSystem.prototype.initDoorExpand = function() {
    // 播放点击白点的音效（只播放前6秒）
    if (window.AudioManager) {
        window.AudioManager.playSFX('click-dot');
    }
    
    // 白点渐隐并禁用交互
    const dotEl = document.getElementById('intro-dot');
    if (dotEl) {
        dotEl.style.transition = 'opacity 0.2s ease';
        dotEl.style.opacity = '0';
        dotEl.style.pointerEvents = 'none';
    }
    
    // 屏幕闪白
    const flashEl = document.getElementById('intro-flash');
    if (flashEl) {
        flashEl.classList.add('flash');
    }
    
    // 闪白期间，门和粒子先隐藏
    if (this.doorEl) {
        this.doorEl.style.opacity = '0';
    }
    
    // 0.7秒后白色开始渐变消失，同时显示门和粒子
    setTimeout(() => {
        // 播放门显现的 hum 音效
        if (window.AudioManager) {
            window.AudioManager.playSFX('hum');
        }
        
        // 显示门和粒子
        if (this.doorEl) {
            this.doorEl.style.opacity = '1';
        }
        this.createAllParticles();
        
        if (flashEl) {
            flashEl.classList.remove('flash');
            flashEl.classList.add('fade-out');
        }
    }, 700);
    
    // 渐变完成后（2.2秒），开始呼吸
    setTimeout(() => {
        this.showNarrative('这是...?');
        this.setState('doorBreath');
    }, 2200);
};

IntroSystem.prototype.createAllParticles = function() {
    // 一次性创建所有粒子（无动画）
    for (let i = 0; i < this.config.ambientParticles; i++) {
        this.addParticle(false);
    }
    for (let i = 0; i < this.config.linkedClusterCount; i++) {
        this.addLinkedCluster();
    }
};

IntroSystem.prototype.startParticleSpawning = function() {
    // 逐渐生成粒子（从中心向外扩散）
    let spawned = 0;
    const totalToSpawn = this.config.ambientParticles + this.config.linkedClusterCount * 3;
    
    const spawnInterval = setInterval(() => {
        if (spawned < this.config.ambientParticles) {
            this.addParticle(true);
        } else if (spawned < totalToSpawn) {
            if ((spawned - this.config.ambientParticles) % 3 === 0) {
                this.addLinkedCluster();
            }
        } else {
            clearInterval(spawnInterval);
        }
        spawned++;
    }, 25);
};

IntroSystem.prototype.initDoorBreath = function() {
    // 开始呼吸
    if (this.doorEl) {
        this.doorEl.classList.add('breathing');
    }
    
    // 呼吸3次后显示物品栏
    setTimeout(() => {
        this.hideNarrative();
        if (this.inventoryEl) {
            this.inventoryEl.classList.add('visible');
        }
        
        // 物品栏出现后弹出糯米
        setTimeout(() => {
            this.setState('spawnRice');
        }, 800);
    }, 6000); // 3次呼吸 = 6秒
};

IntroSystem.prototype.initSpawnRice = function() {
    // 创建糯米物品
    this.createItem('糯米', '🍚', true);
    
    // 显示提示文字
    this.showNarrative('拖动它...');
    
    this.setState('waitRicePlaced');
};

IntroSystem.prototype.initRicePlacedPulse = function() {
    // 播放光波音效
    if (window.AudioManager) {
        window.AudioManager.playSFX('wave');
    }
    
    // 糯米放下时的最强光波
    const rice = this.items.find(i => i.name === '糯米');
    if (rice) {
        // 从物品中心发射光波
        const centerX = rice.x + rice.width / 2;
        const centerY = rice.y + rice.height / 2;
        this.emitPulseWave(centerX, centerY, true);
        
        rice.isGolden = false;
        this.updateItemVisual(rice);
    }
    
    // 显示 "...很好......."
    setTimeout(() => {
        this.showNarrative('...很好.......');
        
        setTimeout(() => {
            this.setState('spawnBrewing');
        }, 1200);
    }, 600);
};

IntroSystem.prototype.initSpawnBrewing = function() {
    // 创建酿造物品（普通样式）
    this.createItem('酿造', '🫗', false);
    
    setTimeout(() => {
        this.hideNarrative();
        this.setState('waitSynthesis');
    }, 300);
};

IntroSystem.prototype.initFirstSynthesis = function() {
    this.hideNarrative();
    
    // 首次发现合成动画
    const rice = this.items.find(i => i.name === '糯米');
    const brewing = this.items.find(i => i.name === '酿造');
    if (!rice || !brewing) return;
    
    // 动画阶段 - 使用当前位置计算中心
    const riceCenterX = rice.x + rice.width / 2;
    const riceCenterY = rice.y + rice.height / 2;
    const brewingCenterX = brewing.x + brewing.width / 2;
    const brewingCenterY = brewing.y + brewing.height / 2;
    
    const centerX = (riceCenterX + brewingCenterX) / 2;
    const centerY = (riceCenterY + brewingCenterY) / 2;
    
    // 保存合成中心点
    this.synthesisCenterX = centerX;
    this.synthesisCenterY = centerY;
    
    // 阶段1：弹开（距离缩小）
    const popDistance = 50;
    const angle = Math.atan2(brewingCenterY - riceCenterY, brewingCenterX - riceCenterX);
    
    rice.animTarget = {
        x: centerX - Math.cos(angle) * popDistance - rice.width / 2,
        y: centerY - Math.sin(angle) * popDistance - rice.height / 2
    };
    brewing.animTarget = {
        x: centerX + Math.cos(angle) * popDistance - brewing.width / 2,
        y: centerY + Math.sin(angle) * popDistance - brewing.height / 2
    };
    rice.animPhase = 'popApart';
    brewing.animPhase = 'popApart';
    rice.spinAngle = 0;
    brewing.spinAngle = 0;
    
    // 250ms 后开始旋转
    setTimeout(() => {
        rice.animPhase = 'spinning';
        brewing.animPhase = 'spinning';
        rice.spinStart = performance.now();
        brewing.spinStart = performance.now();
        
        // 旋转结束后（600ms，2圈）冲刺
        setTimeout(() => {
            rice.animPhase = 'dash';
            brewing.animPhase = 'dash';
            rice.animTarget = { x: centerX - rice.width / 2, y: centerY - rice.height / 2 };
            brewing.animTarget = { x: centerX - brewing.width / 2, y: centerY - brewing.height / 2 };
            
            // 冲刺完成后白闪（200ms）
            setTimeout(() => {
                // 播放合成音效
                if (window.AudioManager) {
                    window.AudioManager.playSFX('craft-normal');
                }
                
                this.flashWhite(centerX, centerY);
                
                // 移除原物品DOM
                if (rice.el) rice.el.remove();
                if (brewing.el) brewing.el.remove();
                
                // 移除原物品，创建酒酿
                this.items = this.items.filter(i => i.name !== '糯米' && i.name !== '酿造');
                this.synthesisResult = this.createSynthesisResult('酒酿', '🍶', centerX, centerY);
                
                // 门变活跃，自动献上
                setTimeout(() => {
                    if (this.doorEl) {
                        this.doorEl.classList.add('active');
                    }
                    this.setState('offerToDoor');
                }, 500);
            }, 200);
        }, 600);  // 改为600ms匹配旋转时间
    }, 250);  // 改为250ms
};

IntroSystem.prototype.initOfferToDoor = function() {
    this.hideNarrative();
    
    // 播放门吸收音效
    if (window.AudioManager) {
        window.AudioManager.playSFX('door-absorb');
    }
    
    // 献上动画
    if (this.synthesisResult) {
        this.synthesisResult.animPhase = 'offering';
        this.synthesisResult.animTarget = {
            x: this.centerX - 40,
            y: this.centerY - 100
        };
    }
    
    // 门吸收能量效果
    if (this.doorEl) {
        this.doorEl.classList.add('absorbing');
    }
    
    setTimeout(() => {
        // 移除酒酿DOM
        if (this.synthesisResult && this.synthesisResult.el) {
            this.synthesisResult.el.style.opacity = '0';
            this.synthesisResult.el.style.transform = 'scale(0.3)';
        }
        
        setTimeout(() => {
            if (this.synthesisResult && this.synthesisResult.el) {
                this.synthesisResult.el.remove();
            }
            this.synthesisResult = null;
            
            // 清空物品
            this.items.forEach(item => {
                if (item.el) item.el.remove();
            });
            this.items = [];
            
            // 门释放能量
            if (this.doorEl) {
                this.doorEl.classList.remove('absorbing');
                this.doorEl.classList.add('releasing');
            }
            
            // 开始播放开场BGM
            if (window.AudioManager) {
                window.AudioManager.playBGM('bgm-intro');
            }
            
            this.setState('blueWash');
        }, 400);
    }, 600);
};

