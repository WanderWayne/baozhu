/** @feature audio-nav @see docs/features/audio-nav.md */
const levelManager = require('./level-manager');

const BGM_KEY = 'baozhu_bgm_volume';
const SFX_KEY = 'baozhu_sfx_volume';
const VOLUME_FIX_KEY = 'baozhu_volume_mute_bug_fixed';

const DEFAULT_BGM_VOLUME = 0.8;
const DEFAULT_SFX_VOLUME = 0.8;

const AUDIO_ENABLED = true;
const MAIN_AUDIO_BASE = '/assets/audio/';

const BGM_VOLUME_MUL = {
  'bgm-intro': 0.55,
  'hum': 1.15,
};

const BGM_LOOP_ENVELOPE = {
  'hum': { fadeInMs: 2000, fadeOutMs: 2000 },
  'bgm-intro': { fadeInMs: 2000, fadeOutMs: 4000 },
};

const SFX_VOLUME_MUL = {
  'click-dot': 1.25,
  'hum': 1.15,
  'wave': 1.15,
  'craft-normal': 1.05,
  'door-absorb': 0.9,
  'text-appear': 0.75,
};

const PRELOAD_SFX = [
  'click-dot',
  'hum',
  'wave',
  'craft-normal',
  'door-absorb',
  'text-appear',
  'click-open',
  'click-ui',
  'click-enter',
  'error',
  'task-reward-gem',
];

const SFX_POOL_SIZE = 2;

const MAIN_AUDIO_FILES = {
  'bgm-menu': `${MAIN_AUDIO_BASE}bgm-menu.mp3`,
  'bgm-intro': `${MAIN_AUDIO_BASE}bgm-intro.mp3`,

  'click-open': `${MAIN_AUDIO_BASE}click-open.mp3`,
  'click-ui': `${MAIN_AUDIO_BASE}click-ui.mp3`,
  'click-enter': `${MAIN_AUDIO_BASE}click-enter.mp3`,
  'click-dot': `${MAIN_AUDIO_BASE}intro-click-dot.mp3`,
  'hum': `${MAIN_AUDIO_BASE}intro-hum.mp3`,
  'wave': `${MAIN_AUDIO_BASE}intro-wave.mp3`,
  'craft-normal': `${MAIN_AUDIO_BASE}intro-craft-normal.mp3`,
  'door-absorb': `${MAIN_AUDIO_BASE}intro-door-absorb.mp3`,
  'text-appear': `${MAIN_AUDIO_BASE}intro-text-appear.mp3`,

  'error': `${MAIN_AUDIO_BASE}error.mp3`,
  'task-reward-gem': `${MAIN_AUDIO_BASE}task-reward-gem.mp3`,
};

class AudioManager {
  constructor() {
    this.bgmVolume = DEFAULT_BGM_VOLUME;
    this.sfxVolume = DEFAULT_SFX_VOLUME;
    this.currentBGM = null;
    this.currentBGMName = null;
    this.audioUnlocked = false;
    this.audioFiles = { ...MAIN_AUDIO_FILES };

    this._loopingSFX = {};
    this._sfxPools = {};
    this._sfxPoolCursor = {};
    this._sfxWarmed = {};
    this._bgmFadeTimer = null;
    this._bgmTransitioning = false;
    this._bgmLoopEnvelopeTimer = setInterval(() => this._applyBGMLoopEnvelope(), 80);
    this.loadVolumeSettings();
  }

  registerAudioFiles(map) {
    if (!map || typeof map !== 'object') return;
    Object.assign(this.audioFiles, map);
    if (this.audioUnlocked) this.preloadSFX(Object.keys(map));
  }

  loadVolumeSettings() {
    try {
      if (!wx.getStorageSync(VOLUME_FIX_KEY)) {
        wx.setStorageSync(BGM_KEY, 80);
        wx.setStorageSync(SFX_KEY, 80);
        wx.setStorageSync(VOLUME_FIX_KEY, '1');
      }

      const savedBGM = wx.getStorageSync(BGM_KEY);
      const savedSFX = wx.getStorageSync(SFX_KEY);
      if (savedBGM !== '' && savedBGM != null) {
        this.bgmVolume = Number(savedBGM) / 100;
      }
      if (savedSFX !== '' && savedSFX != null) {
        this.sfxVolume = Number(savedSFX) / 100;
      }
    } catch (e) {
      /* ignore */
    }
  }

  setBGMVolume(value) {
    this.bgmVolume = value;
    if (this.currentBGM) this.currentBGM.volume = value;
    try { wx.setStorageSync(BGM_KEY, Math.round(value * 100)); } catch (e) { /* noop */ }
  }

  setSFXVolume(value) {
    this.sfxVolume = value;
    Object.entries(this._sfxPools).forEach(([name, pool]) => {
      pool.forEach((ctx) => { ctx.volume = this._sfxVolume(name); });
    });
    try { wx.setStorageSync(SFX_KEY, Math.round(value * 100)); } catch (e) { /* noop */ }
  }

  unlock() {
    this.audioUnlocked = true;
    this.preloadSFX(PRELOAD_SFX);
  }

  _sfxVolume(name, volumeMul = 1) {
    return Math.min(1, this.sfxVolume * (SFX_VOLUME_MUL[name] || 1) * volumeMul);
  }

  _bgmTargetVolume(name) {
    return Math.min(1, this.bgmVolume * (BGM_VOLUME_MUL[name] || 1));
  }

  _clearBGMFade() {
    if (this._bgmFadeTimer) {
      clearTimeout(this._bgmFadeTimer);
      this._bgmFadeTimer = null;
    }
  }

  _destroyBGMContext(ctx) {
    if (!ctx) return;
    try { ctx.stop(); } catch (e) { /* noop */ }
    try { ctx.destroy(); } catch (e) { /* noop */ }
  }

  _applyBGMLoopEnvelope() {
    if (this._bgmTransitioning || !this.currentBGM || !this.currentBGMName) return;
    const envelope = BGM_LOOP_ENVELOPE[this.currentBGMName];
    if (!envelope) return;
    const duration = Number(this.currentBGM.duration);
    const currentTime = Number(this.currentBGM.currentTime);
    if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(currentTime)) return;

    const inGain = Math.min(1, currentTime / (envelope.fadeInMs / 1000));
    const outGain = Math.min(1, Math.max(0, duration - currentTime) / (envelope.fadeOutMs / 1000));
    this.currentBGM.volume = this._bgmTargetVolume(this.currentBGMName) * Math.min(inGain, outGain);
  }

  _fadeBGMTo(ctx, targetVolume, durationMs = 1200, onDone) {
    this._clearBGMFade();
    this._bgmTransitioning = true;
    if (!ctx || durationMs <= 0) {
      if (ctx) ctx.volume = targetVolume;
      this._bgmTransitioning = false;
      if (onDone) onDone();
      return;
    }
    const startVol = ctx.volume || 0;
    const steps = Math.max(1, Math.ceil(durationMs / 80));
    let step = 0;
    const tick = () => {
      step += 1;
      const t = Math.min(step / steps, 1);
      if (ctx) ctx.volume = startVol + (targetVolume - startVol) * t;
      if (t >= 1) {
        this._bgmFadeTimer = null;
        this._bgmTransitioning = false;
        if (onDone) onDone();
        return;
      }
      this._bgmFadeTimer = setTimeout(tick, durationMs / steps);
    };
    tick();
  }

  _createSFXContext(name) {
    const src = this.audioFiles[name];
    if (!src) return null;
    const sfx = wx.createInnerAudioContext();
    sfx.src = src;
    sfx.startTime = 0;
    sfx.volume = this._sfxVolume(name);
    sfx.obeyMuteSwitch = false;
    sfx.onError(() => {
      try { sfx.destroy(); } catch (e) { /* noop */ }
    });
    return sfx;
  }

  preloadSFX(names) {
    if (!AUDIO_ENABLED || !this.audioUnlocked || !Array.isArray(names)) return;
    names.forEach((name) => {
      if (!this.audioFiles[name] || this._sfxPools[name]) return;
      const pool = [];
      for (let i = 0; i < SFX_POOL_SIZE; i += 1) {
        const ctx = this._createSFXContext(name);
        if (ctx) pool.push(ctx);
      }
      if (pool.length) {
        this._sfxPools[name] = pool;
        this._sfxPoolCursor[name] = 0;
        this._warmSFX(name);
      }
    });
  }

  _warmSFX(name) {
    if (this._sfxWarmed[name]) return;
    const pool = this._sfxPools[name];
    if (!pool || !pool.length) return;
    const sfx = pool[0];
    this._sfxWarmed[name] = true;
    try {
      sfx.volume = 0;
      sfx.startTime = 0;
      sfx.play();
      setTimeout(() => {
        try { sfx.stop(); } catch (e) { /* noop */ }
        try { sfx.startTime = 0; } catch (e) { /* noop */ }
        sfx.volume = this._sfxVolume(name);
      }, 80);
    } catch (e) {
      sfx.volume = this._sfxVolume(name);
    }
  }

  playBGM(name, options = {}) {
    if (!AUDIO_ENABLED || !this.audioUnlocked || this.bgmVolume <= 0) return;
    const src = this.audioFiles[name];
    if (!src) return;

    if (this.currentBGMName === name && this.currentBGM) {
      if (this._bgmTransitioning) return;
      const targetVolume = this._bgmTargetVolume(name);
      if (options.fadeInMs) this._fadeBGMTo(this.currentBGM, targetVolume, options.fadeInMs);
      else this.currentBGM.volume = targetVolume;
      this.currentBGM.play();
      return;
    }

    this._clearBGMFade();
    this._bgmTransitioning = false;
    if (this.currentBGM) {
      this.currentBGM.stop();
      this.currentBGM.destroy();
      this.currentBGM = null;
    }

    const bgm = wx.createInnerAudioContext();
    bgm.src = src;
    bgm.loop = true;
    const targetVolume = this._bgmTargetVolume(name);
    bgm.volume = options.fadeInMs ? 0 : targetVolume;
    bgm.onError(() => {
      bgm.destroy();
      if (this.currentBGM === bgm) {
        this.currentBGM = null;
        this.currentBGMName = null;
      }
    });
    bgm.play();
    this.currentBGM = bgm;
    this.currentBGMName = name;
    if (options.fadeInMs) this._fadeBGMTo(bgm, targetVolume, options.fadeInMs);
  }

  stopBGM() {
    this._clearBGMFade();
    this._bgmTransitioning = false;
    if (this.currentBGM) this.currentBGM.stop();
  }

  resetBGM() {
    this._clearBGMFade();
    this._bgmTransitioning = false;
    if (this.currentBGM) {
      try { this.currentBGM.stop(); } catch (e) { /* noop */ }
      try { this.currentBGM.destroy(); } catch (e) { /* noop */ }
    }
    this.currentBGM = null;
    this.currentBGMName = null;
  }

  fadeOutBGM(durationMs = 2000, onDone) {
    if (!this.currentBGM || this.bgmVolume <= 0) {
      if (onDone) onDone();
      return;
    }
    this._clearBGMFade();
    this._bgmTransitioning = true;
    const bgm = this.currentBGM;
    const startVol = bgm.volume;
    const steps = 16;
    const stepMs = durationMs / steps;
    let step = 0;
    const tick = () => {
      step += 1;
      const t = step / steps;
      if (this.currentBGM === bgm) {
        bgm.volume = startVol * (1 - t);
      }
      if (step >= steps) {
        if (this.currentBGM === bgm) this.stopBGM();
        this._bgmFadeTimer = null;
        this._bgmTransitioning = false;
        if (onDone) onDone();
        return;
      }
      this._bgmFadeTimer = setTimeout(tick, stepMs);
    };
    tick();
  }

  fadeToBGM(name, options = {}) {
    const fadeOutMs = options.fadeOutMs || 2000;
    const fadeInMs = options.fadeInMs || 2000;
    if (this.currentBGMName === name && this.currentBGM) {
      this.playBGM(name, { fadeInMs });
      return;
    }
    if (!this.currentBGM) {
      this.playBGM(name, { fadeInMs });
      return;
    }

    const src = this.audioFiles[name];
    if (!AUDIO_ENABLED || !this.audioUnlocked || this.bgmVolume <= 0 || !src) return;

    this._clearBGMFade();
    this._bgmTransitioning = true;
    const oldBGM = this.currentBGM;
    const oldStartVol = oldBGM.volume || 0;
    const nextBGM = wx.createInnerAudioContext();
    const targetVol = this._bgmTargetVolume(name);
    const durationMs = Math.max(fadeOutMs, fadeInMs);
    const steps = Math.max(1, Math.ceil(durationMs / 80));
    let step = 0;

    nextBGM.src = src;
    nextBGM.loop = true;
    nextBGM.volume = 0;
    nextBGM.onError(() => {
      this._destroyBGMContext(nextBGM);
      if (this.currentBGM === nextBGM) {
        this.currentBGM = null;
        this.currentBGMName = null;
        this._bgmTransitioning = false;
      }
    });
    nextBGM.play();
    this.currentBGM = nextBGM;
    this.currentBGMName = name;

    const tick = () => {
      step += 1;
      const elapsedMs = Math.min(durationMs, (step / steps) * durationMs);
      const outT = Math.min(1, elapsedMs / fadeOutMs);
      const inT = Math.min(1, elapsedMs / fadeInMs);
      oldBGM.volume = oldStartVol * (1 - outT);
      if (this.currentBGM === nextBGM) {
        nextBGM.volume = targetVol * inT;
      }
      if (elapsedMs >= durationMs) {
        this._destroyBGMContext(oldBGM);
        if (this.currentBGM === nextBGM) nextBGM.volume = targetVol;
        this._bgmFadeTimer = null;
        this._bgmTransitioning = false;
        return;
      }
      this._bgmFadeTimer = setTimeout(tick, durationMs / steps);
    };
    tick();
  }

  playSFX(name) {
    if (!AUDIO_ENABLED || !this.audioUnlocked || this.sfxVolume <= 0) return;
    const src = this.audioFiles[name];
    if (!src) return;
    const pool = this._sfxPools[name];
    if (pool && pool.length) {
      const idx = this._sfxPoolCursor[name] || 0;
      const sfx = pool[idx % pool.length];
      this._sfxPoolCursor[name] = (idx + 1) % pool.length;
      try { sfx.stop(); } catch (e) { /* noop */ }
      try { sfx.startTime = 0; } catch (e) { /* noop */ }
      sfx.volume = this._sfxVolume(name);
      sfx.play();
      return;
    }
    const sfx = wx.createInnerAudioContext();
    sfx.src = src;
    sfx.startTime = 0;
    sfx.volume = this._sfxVolume(name);
    sfx.obeyMuteSwitch = false;
    sfx.play();
    sfx.onEnded(() => sfx.destroy());
    sfx.onError(() => sfx.destroy());
  }

  playSFXLoop(name) {
    if (!AUDIO_ENABLED || !this.audioUnlocked || this.sfxVolume <= 0) return;
    if (this._loopingSFX[name]) return;
    const src = this.audioFiles[name];
    if (!src) return;
    const sfx = wx.createInnerAudioContext();
    sfx.src = src;
    sfx.loop = true;
    sfx.volume = this.sfxVolume;
    sfx.onError(() => {
      sfx.destroy();
      if (this._loopingSFX[name] === sfx) delete this._loopingSFX[name];
    });
    sfx.play();
    this._loopingSFX[name] = sfx;
  }

  stopSFXLoop(name) {
    const sfx = this._loopingSFX[name];
    if (!sfx) return;
    try { sfx.stop(); } catch (e) { /* noop */ }
    try { sfx.destroy(); } catch (e) { /* noop */ }
    delete this._loopingSFX[name];
  }

  playClickOpen() {
    this.playSFX('click-open');
  }

  playClickExit() {
    this.playSFX('click-ui');
  }

  playClickBack() {
    this.playClickExit();
  }

  playClickEnter() {
    this.playSFX('click-enter');
  }

  playCraftResultSound(resultName, isTarget) {
    const progress = levelManager.currentProgress || { discoveredItems: [] };
    const isFirstDiscovery = !(progress.discoveredItems || []).includes(resultName);
    const hasFragment = !!levelManager.checkFragmentTrigger(resultName);
    if (isTarget) this.playSFX('craft-target');
    else if (hasFragment && isFirstDiscovery) this.playSFX('craft-fragment');
    else this.playSFX('craft-normal');
  }

  playInventoryTransitionSlot(isDisappear, opts = {}) {
    if (!AUDIO_ENABLED || !this.audioUnlocked || this.sfxVolume <= 0) return;
    const src = this.audioFiles['inventory-slot-pop'];
    if (!src) return;
    const volumeMul = typeof opts.volumeMul === 'number' ? opts.volumeMul : 0.42;
    const sfx = wx.createInnerAudioContext();
    sfx.src = src;
    sfx.volume = Math.min(1, this.sfxVolume * volumeMul);
    sfx.playbackRate = isDisappear ? 0.88 : 1;
    sfx.play();
    sfx.onEnded(() => sfx.destroy());
    sfx.onError(() => sfx.destroy());
  }
}

module.exports = new AudioManager();
