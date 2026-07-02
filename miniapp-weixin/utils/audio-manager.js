const BGM_KEY = 'baozhu_bgm_volume';
const SFX_KEY = 'baozhu_sfx_volume';

const AUDIO_ENABLED = true;

class AudioManager {
  constructor() {
    this.bgmVolume = 0;
    this.sfxVolume = 0;
    this.currentBGM = null;
    this.currentBGMName = null;
    this.audioUnlocked = false;

    this.audioFiles = {
      'bgm-menu': '/assets/audio/SFX4 BGM-main-menu.mp3',
      'bgm-game': '/assets/audio/SFX1 BGM game.mp3',
      'click-open': '/assets/audio/SFX35 click_open.mp3',
      'click-ui': '/assets/audio/SFX36 click_close.mp3',
      'click-back': '/assets/audio/SFX36 click_close.mp3',
      'pickup': '/assets/audio/SFX34 click.mp3',
      'error': '/assets/audio/SFX11 error.mp3',
      'craft-normal': '/assets/audio/SFX20 success craft.mp3',
      'craft-target': '/assets/audio/SFX25 targetCrafted.mp3',
      'door-absorb': '/assets/audio/SFX41 success.mp3',
      'task-reward-gem': '/assets/audio/SFX40 moneymuch.mp3',
      'page': '/assets/audio/SFX30 page.mp3',
      'recipe-book': '/assets/audio/SFX30 page.mp3',
      'recipe-tab': '/assets/audio/SFX36 click_close.mp3',
      'inventory-slot-pop': '/assets/audio/SFX37 bubblepoph.mp3',
    };

    this.loadVolumeSettings();
    this.setBGMVolume(0);
    this.setSFXVolume(0);
  }

  loadVolumeSettings() {
    try {
      const savedBGM = wx.getStorageSync(BGM_KEY);
      const savedSFX = wx.getStorageSync(SFX_KEY);
      if (savedBGM !== '' && savedBGM != null) this.bgmVolume = Number(savedBGM) / 100;
      if (savedSFX !== '' && savedSFX != null) this.sfxVolume = Number(savedSFX) / 100;
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
    try { wx.setStorageSync(SFX_KEY, Math.round(value * 100)); } catch (e) { /* noop */ }
  }

  unlock() {
    this.audioUnlocked = true;
  }

  playBGM(name) {
    if (!AUDIO_ENABLED || !this.audioUnlocked || this.bgmVolume <= 0) return;
    const src = this.audioFiles[name];
    if (!src) return;

    if (this.currentBGMName === name && this.currentBGM) {
      this.currentBGM.volume = this.bgmVolume;
      this.currentBGM.play();
      return;
    }

    if (this.currentBGM) {
      this.currentBGM.stop();
      this.currentBGM.destroy();
      this.currentBGM = null;
    }

    const bgm = wx.createInnerAudioContext();
    bgm.src = src;
    bgm.loop = true;
    bgm.volume = this.bgmVolume;
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
  }

  stopBGM() {
    if (this.currentBGM) this.currentBGM.stop();
  }

  playSFX(name) {
    if (!AUDIO_ENABLED || !this.audioUnlocked || this.sfxVolume <= 0) return;
    const src = this.audioFiles[name];
    if (!src) return;
    const sfx = wx.createInnerAudioContext();
    sfx.src = src;
    sfx.volume = this.sfxVolume;
    sfx.play();
    sfx.onEnded(() => sfx.destroy());
    sfx.onError(() => sfx.destroy());
  }

  playClickOpen() {
    this.playSFX('click-open');
  }

  playClickBack() {
    this.playSFX('click-back');
  }

  playClickExit() {
    this.playSFX('click-ui');
  }

  playClickEnter() {
    this.playSFX('page');
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
