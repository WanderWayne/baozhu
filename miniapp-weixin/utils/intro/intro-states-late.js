const { BAOZHU_TITLE_CONFIG } = require('../main-particles');

module.exports = function attachIntroStatesLate(IntroSystem) {
  IntroSystem.prototype.initBlueWash = function initBlueWash() {
    this.blueWashPhase = 'fadeIn';
    this.cyanOverlayAlpha = 0;
    // 峰值整屏纯金、完全不透明
    this.blueWashMaxAlpha = 1;

    // 金光达到峰值时，遮住门/物品并开始淡出它们
    this.schedule(() => {
      this.blueWashPhase = 'hold';
      this.setDoorOpacity(0);
      this.items.forEach((item) => { item.opacity = 0; });
      if (this.synthesisResult) this.synthesisResult.opacity = 0;
      this.patchUI({ inventoryVisible: false });
    }, 1500);

    this.schedule(() => {
      this.blueWashPhase = 'fadeOut';
      this.schedule(() => this.setState('storyNarration'), 1500);
    }, 2000);
  };

  IntroSystem.prototype.initStoryNarration = function initStoryNarration() {
    // 门/物品/物品栏已在 blueWash hold 阶段淡出，无需重复隐藏
    this.patchUI({
      storyVisible: true,
    });

    this.particles.forEach((p) => {
      p.storyBreathPhase = Math.random() * Math.PI * 2;
      p.storyBreathSpeed = 0.3 + Math.random() * 0.3;
    });

    const storySequence = this.getStorySequence();
    let currentDelay = 500;

    storySequence.forEach((item) => {
      currentDelay += item.delay;
      this.schedule(() => {
        this.showStoryText(item.text, item.duration, item.isGoal);
      }, currentDelay);
      currentDelay += item.duration;
    });

    this.schedule(() => {
      this.patchUI({ storyVisible: false, storyText: '' });
      this.setState('riseUp');
    }, currentDelay + 800);
  };

  IntroSystem.prototype.showStoryText = function showStoryText(text, duration, isGoal = false) {
    this.playSFX('text-appear');
    this.patchUI({
      storyVisible: true,
      storyText: text,
      storyTextGoal: !!isGoal,
      storyTextVisible: false,
    });
    this.schedule(() => this.patchUI({ storyTextVisible: true }), 30);
    this.schedule(() => this.patchUI({ storyTextVisible: false }), duration - 1000);
  };

  IntroSystem.prototype.initRiseUp = function initRiseUp() {
    this.colorTransitionProgress = 0;
    this.startRiseAnimation();
  };

  IntroSystem.prototype.startRiseAnimation = function startRiseAnimation() {
    this.risePhase = 'rising';
    this.riseOffset = 0;
    this.riseTargetOffset = this.logicalHeight * 4;
    this.riseSpeed = 0;
    this.targetRiseSpeed = 0;
    this.cameraScale = 1;
    this.riseStartTime = this.now();
    this.riseDuration = 6000;
    this.riseAccelTime = 1600;
    this.riseDecelTime = 2000;

    this.particles.forEach((p) => {
      p.riseStartX = p.x;
      p.riseStartY = p.y;
      p.risingSpeed = 0;
      p.maxRisingSpeed = 10 + Math.random() * 10;
      p.originalSize = p.size;
      p.driftSpeed = (Math.random() - 0.5) * 0.4;
    });

    this.patchUI({ warmTransition: true });

    this.schedule(() => {
      this.risePhase = 'stopped';
      this.setState('gatherToText');
    }, this.riseDuration);
  };

  IntroSystem.prototype.initGatherToText = function initGatherToText() {
    this.loadTextDots();
    const riseY = this.riseOffset || 0;
    this.textDotTargets.forEach((t) => {
      t.y -= riseY;
    });

    const needed = this.textDotTargets.length;
    const currentCount = this.particles.length;
    const extraNeeded = Math.max(0, needed - currentCount);
    if (extraNeeded > 0) {
      for (let i = 0; i < extraNeeded; i += 1) {
        const side = Math.floor(Math.random() * 4);
        let x;
        let y;
        const visibleTop = -riseY - 100;
        const visibleBottom = this.logicalHeight - riseY + 100;
        const visibleMidY = (visibleTop + visibleBottom) / 2;
        switch (side) {
          case 0: x = Math.random() * this.logicalWidth; y = visibleTop; break;
          case 1: x = this.logicalWidth + 50; y = visibleMidY + (Math.random() - 0.5) * this.logicalHeight; break;
          case 2: x = Math.random() * this.logicalWidth; y = visibleBottom; break;
          default: x = -50; y = visibleMidY + (Math.random() - 0.5) * this.logicalHeight; break;
        }
        this.particles.push({
          x, y, vx: 0, vy: 0,
          size: this.config.textParticleSize,
          alpha: 0.8, visualSize: this.config.textParticleSize, visualAlpha: 0.8,
          linkedTo: null, gathering: false, isExtraParticle: true,
        });
      }
    }

    const titleCfg = BAOZHU_TITLE_CONFIG;
    const gatherCenterY = this.logicalHeight * titleCfg.mainTitleCenterYRatio - riseY;
    const sortedParticles = [...this.particles].sort((a, b) => {
      const distA = Math.hypot(a.x - this.centerX, a.y - gatherCenterY);
      const distB = Math.hypot(b.x - this.centerX, b.y - gatherCenterY);
      return distA - distB;
    });
    const shuffledTargets = [...this.textDotTargets].sort(() => Math.random() - 0.5);

    this.particles.forEach((p) => {
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

    this.schedule(() => this.setState('showStartButton'), 4000);
  };

  IntroSystem.prototype.initShowStartButton = function initShowStartButton() {
    this.particles.forEach((p) => {
      if (p.isTextDot && p.targetX !== null) {
        p.x = p.targetX;
        p.y = p.targetY;
        p.gathering = false;
        p.settled = true;
      }
    });

    this.playBGM('bgm-menu');
    this.initAmbience(() => {
      if (this.ambience && typeof this.ambience.fadeInCanvas === 'function') {
        this.ambience.fadeInCanvas(2200);
      }
    });

    // 稻穗渐入约一半后展示主菜单（不再跳页）
    this.schedule(() => {
      this.showMainMenu();
    }, 1800);
  };

  IntroSystem.prototype.showMainMenu = function showMainMenu() {
    try { wx.setStorageSync('hasPlayedIntro_v5', '1'); } catch (e) { /* ignore */ }
    if (this.page && typeof this.page.enterMenuMode === 'function') {
      this.page.enterMenuMode();
    }
  };

  IntroSystem.prototype.initAmbience = function initAmbience(callback) {
    if (this.ambience) {
      if (callback) callback();
      return;
    }
    const MainAmbience = require('../main-ambience');
    const page = this.page;
    const sys = wx.getSystemInfoSync();
    const dpr = sys.pixelRatio || 2;
    const w = sys.windowWidth;
    const h = sys.windowHeight;

    wx.createSelectorQuery()
      .in(page)
      .select('#ambience-canvas')
      .fields({ node: true })
      .exec((res) => {
        if (this._destroyed || !res || !res[0] || !res[0].node) return;
        const ambCanvas = res[0].node;
        const ambCtx = ambCanvas.getContext('2d');
        ambCanvas.width = w * dpr;
        ambCanvas.height = h * dpr;
        ambCtx.scale(dpr, dpr);

        this.ambience = new MainAmbience({
          canvas: ambCanvas,
          ctx: ambCtx,
          width: w,
          height: h,
          fadeInMs: 0,
          deferFadeIn: true,
          onOpacityChange: (opacity) => {
            this.patchUI({ ambienceOpacity: opacity });
          },
        });
        this.ambience.init();
        if (callback) callback();
      });
  };

  IntroSystem.prototype.initStoryTransition = function initStoryTransition() {
    /* deprecated */
  };

  IntroSystem.prototype.completeIntro = function completeIntro() {
    if (this.page && typeof this.page.onCompleteIntro === 'function') {
      this.page.onCompleteIntro();
    }
  };
};
