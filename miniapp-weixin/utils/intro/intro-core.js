const { BAOZHU_TITLE_CONFIG } = require('../main-particles');

class IntroSystem {
  constructor(page) {
    this.page = page;
    this.canvas = null;
    this.ctx = null;
    this.logicalWidth = 0;
    this.logicalHeight = 0;
    this.dpr = 1;
    this.particles = [];
    this.textDotTargets = [];
    this.state = 'idle';
    this.stateData = {};
    this.items = [];
    this.draggedItem = null;
    this.synthesisResult = null;
    this.breathCount = 0;
    this.lastTime = 0;
    this.cyanOverlayAlpha = 0;
    this.pulseWaves = [];
    this.synthesisFlashes = [];
    // 门绘制状态（改为 canvas 绘制，不再依赖 DOM/CSS）
    this.doorModes = new Set();
    this.doorOpacity = 0;
    this.doorTargetOpacity = 0;
    this._itemId = 0;
    this._timers = [];
    this._rafId = null;
    this._destroyed = false;
    this.ambience = null;
    this.audioManager = null;

    this.config = {
      minParticles: 200,
      ambientParticles: 150,
      linkedClusterCount: 8,
      linkedClusterSpacing: 25,
      extraParticlesForText: 80,
      doorBreathDuration: 2000,
      doorBreathCount: 3,
      particleBaseSize: 1.5,
      particleMaxSize: 2.5,
      textParticleSize: 5,
      particleAlpha: 0.4,
    };

    const sys = wx.getSystemInfoSync();
    this.isSmallScreen = sys.windowWidth <= 450 && sys.windowHeight <= 950;
    const titleCfg = BAOZHU_TITLE_CONFIG;
    this.config.textParticleSize = this.isSmallScreen
      ? titleCfg.textParticleSize.small
      : titleCfg.textParticleSize.normal;
    if (this.isSmallScreen) {
      this.config.ambientParticles = 144;
      this.config.linkedClusterCount = 4;
    }

    try {
      this.audioManager = require('../audio-manager');
    } catch (e) {
      /* optional */
    }
  }

  init(canvas, ctx, width, height, dpr) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.logicalWidth = width;
    this.logicalHeight = height;
    this.dpr = dpr || 1;
    this.centerX = width / 2;
    this.centerY = height / 2;
    this.loadTextDots();
    this.setState('dotIdle');
    this._startLoop();
  }

  now() {
    if (typeof performance !== 'undefined' && performance.now) return performance.now();
    return Date.now();
  }

  schedule(fn, ms) {
    const id = setTimeout(() => {
      if (!this._destroyed) fn();
    }, ms);
    this._timers.push(id);
    return id;
  }

  patchUI(patch) {
    if (this._destroyed || !this.page) return;
    this.page.setData(patch);
  }

  _startLoop() {
    if (!this.canvas || this._destroyed) return;
    const frame = (time) => {
      if (this._destroyed) return;
      this.animate(time);
      this._rafId = this.canvas.requestAnimationFrame(frame);
    };
    this._rafId = this.canvas.requestAnimationFrame(frame);
  }

  destroy() {
    this._destroyed = true;
    this._timers.forEach((id) => clearTimeout(id));
    this._timers = [];
    if (this._rafId && this.canvas && this.canvas.cancelAnimationFrame) {
      this.canvas.cancelAnimationFrame(this._rafId);
    }
    this._rafId = null;
    if (this.ambience) {
      this.ambience.destroy();
      this.ambience = null;
    }
    this.items.forEach((item) => {
      if (item.pulseInterval) clearInterval(item.pulseInterval);
    });
  }

  playSFX(name) {
    if (this.audioManager && typeof this.audioManager.playSFX === 'function') {
      this.audioManager.playSFX(name);
    }
  }

  playBGM(name) {
    if (this.audioManager && typeof this.audioManager.playBGM === 'function') {
      this.audioManager.playBGM(name);
    }
  }

  setState(newState, data = {}) {
    console.log(`Intro state: ${this.state} → ${newState}`);
    this.state = newState;
    this.stateData = { startTime: this.now(), ...data };

    switch (newState) {
      case 'dotIdle':
        this.initDotIdle();
        break;
      case 'doorExpand':
        this.initDoorExpand();
        break;
      case 'doorBreath':
        this.initDoorBreath();
        break;
      case 'spawnRice':
        this.initSpawnRice();
        break;
      case 'waitRicePlaced':
        break;
      case 'ricePlacedPulse':
        this.initRicePlacedPulse();
        break;
      case 'spawnBrewing':
        this.initSpawnBrewing();
        break;
      case 'waitSynthesis':
        this.showNarrative('把它们放在一起...');
        break;
      case 'firstSynthesis':
        this.initFirstSynthesis();
        break;
      case 'waitOffer':
        break;
      case 'offerToDoor':
        this.initOfferToDoor();
        break;
      case 'blueWash':
        this.initBlueWash();
        break;
      case 'storyNarration':
        this.initStoryNarration();
        break;
      case 'riseUp':
        this.initRiseUp();
        break;
      case 'gatherToText':
        this.initGatherToText();
        break;
      case 'showStartButton':
        this.initShowStartButton();
        break;
      case 'storyTransition':
        this.initStoryTransition();
        break;
      default:
        break;
    }
  }
}

module.exports = IntroSystem;
