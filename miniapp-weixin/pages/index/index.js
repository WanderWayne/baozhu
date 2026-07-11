const { navigateToWithFade } = require('../../utils/page-transitions');
const tutorialGuide = require('../../utils/tutorial-guide');
const { INTRO_KEY, resetTutorialStorage } = require('../../utils/main-menu');

Page({
  data: {
    pageReady: false,
    loadError: '',
    showCanvas: false,
    ambienceOpacity: 1,
    bgColor: '#F5E6E0',
    menuVisible: true,
    codexPercent: 0,
    codexText: '0/3',
    fragmentPercent: 0,
    fragmentText: '0/15',
    tasksVisible: false,
    settingsVisible: false,
    taskRows: [],
    showClaimableDot: false,
    bgmVolume: 0,
    sfxVolume: 0,
    postIntroHandoff: false,
    tutOverlay: tutorialGuide.emptyOverlay(),
  },

  particleSystem: null,
  ambienceSystem: null,
  _canvasReady: false,

  onLoad(options) {
    try {
      this.meta = require('../../data/meta.js');
      this.levelManager = require('../../utils/level-manager');
      this.growthSystem = require('../../utils/growth-system');
      this.audioManager = require('../../utils/audio-manager');
      this.getAtlasProgressCounts = require('../../utils/atlas-counts').getAtlasProgressCounts;
      this.getTasksWithProgress = require('../../utils/tasks').getTasksWithProgress;
      this.MainParticleSystem = require('../../utils/main-particles');
      this.MainAmbience = require('../../utils/main-ambience');

      const postIntro = options && options.postIntro === '1';
      const skipIntro = options && options.skipIntro === '1';
      let hasPlayed = false;
      try { hasPlayed = !!wx.getStorageSync(INTRO_KEY); } catch (e) { /* ignore */ }

      if (!hasPlayed && !postIntro && !skipIntro) {
        wx.redirectTo({ url: '/pages/intro/intro' });
        return;
      }

      this._postIntroHandoff = postIntro;
      this._skipIntroHandoff = skipIntro;

      const patch = {
        pageReady: true,
        bgmVolume: Math.round((this.audioManager.bgmVolume || 0) * 100),
        sfxVolume: Math.round((this.audioManager.sfxVolume || 0) * 100),
      };

      if (postIntro) {
        patch.showCanvas = true;
        patch.menuVisible = false;
        patch.postIntroHandoff = true;
        patch.ambienceOpacity = 1;
        patch.bgColor = '#F5E6E0';
        this._pendingParticleMode = 'title';
        this._ambienceDeferFadeIn = false;
        this._ambienceFadeInMs = 0;
      } else if (skipIntro) {
        patch.showCanvas = true;
        patch.menuVisible = false;
        patch.ambienceOpacity = 0;
        patch.bgColor = this.growthSystem.getBackgroundRgbString();
        this._pendingParticleMode = 'full';
        this._ambienceFadeInMs = 1400;
      } else {
        patch.bgColor = this.growthSystem.getBackgroundRgbString();
      }

      this.setData(patch);
      this.refreshUI();
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      console.error('[index] onLoad failed: ' + msg);
      this.setData({ loadError: msg || '模块加载失败' });
    }
  },

  onReady() {
    if (!this.data.pageReady) return;
    if (this._postIntroHandoff || this._skipIntroHandoff) {
      setTimeout(() => this.initCanvases(), 80);
      return;
    }
    this.setData({ showCanvas: true }, () => {
      setTimeout(() => this.initCanvases(), 80);
    });
  },

  onShow() {
    if (!this.data.pageReady) return;
    try {
      this.audioManager.unlock();
      this.audioManager.playBGM('bgm-menu');
      this.refreshUI();
      tutorialGuide.maybeShowMainGuide(this);
      if (this.data.showCanvas && !this.particleSystem) {
        setTimeout(() => this.initCanvases(), 100);
      }
    } catch (err) {
      console.error('[index] onShow failed: ' + (err && err.message ? err.message : String(err)));
    }
  },

  onHide() {
    if (this.audioManager) this.audioManager.stopBGM();
  },

  onUnload() {
    this.destroyCanvases();
    if (this.audioManager) this.audioManager.stopBGM();
  },

  initCanvases(retry = 0) {
    if (!this.MainParticleSystem || !this.MainAmbience) return;

    const sys = wx.getSystemInfoSync();
    const dpr = sys.pixelRatio || 2;

    wx.createSelectorQuery()
      .in(this)
      .select('#ambience-canvas')
      .fields({ node: true, size: true })
      .select('#main-canvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        const ambRes = res && res[0];
        const mainRes = res && res[1];
        if (!ambRes?.node || !mainRes?.node) {
          if (retry < 5) setTimeout(() => this.initCanvases(retry + 1), 150);
          return;
        }

        const w = mainRes.width || sys.windowWidth;
        const h = mainRes.height || sys.windowHeight;
        if (!w || !h) {
          if (retry < 5) setTimeout(() => this.initCanvases(retry + 1), 150);
          return;
        }

        this.destroyCanvases();

        const ambCanvas = ambRes.node;
        const ambCtx = ambCanvas.getContext('2d');
        ambCanvas.width = w * dpr;
        ambCanvas.height = h * dpr;
        ambCtx.scale(dpr, dpr);

        const mainCanvas = mainRes.node;
        const mainCtx = mainCanvas.getContext('2d');
        mainCanvas.width = w * dpr;
        mainCanvas.height = h * dpr;
        mainCtx.scale(dpr, dpr);

        const particleMode = this._pendingParticleMode || 'full';
        const ambienceFadeIn = this._ambienceFadeInMs != null ? this._ambienceFadeInMs : 1400;
        const ambienceDefer = !!this._ambienceDeferFadeIn;

        this.ambienceSystem = new this.MainAmbience({
          canvas: ambCanvas,
          ctx: ambCtx,
          width: w,
          height: h,
          fadeInMs: ambienceDefer ? 0 : ambienceFadeIn,
          deferFadeIn: ambienceDefer,
          onOpacityChange: (opacity) => {
            this.setData({ ambienceOpacity: opacity });
          },
        });
        this.ambienceSystem.init();

        if (ambienceDefer && this._ambienceFadeInMs > 0) {
          this.ambienceSystem.fadeInCanvas(this._ambienceFadeInMs);
        }

        this.particleSystem = new this.MainParticleSystem({
          canvas: mainCanvas,
          ctx: mainCtx,
          width: w,
          height: h,
          mode: particleMode,
          growthSystem: this.growthSystem,
          onBackgroundColor: (color) => {
            if (this._bgThrottle || this.data.bgColor === color) return;
            this._bgThrottle = true;
            setTimeout(() => { this._bgThrottle = false; }, 200);
            this.setData({ bgColor: color });
          },
        });
        this.particleSystem.start();
        this._canvasReady = true;
        this._pendingParticleMode = null;
        this._ambienceFadeInMs = null;
        this._ambienceDeferFadeIn = false;

        if (this._postIntroHandoff) {
          setTimeout(() => this.finishPostIntroHandoff(), 180);
        } else if (this._skipIntroHandoff) {
          setTimeout(() => this.finishSkipIntroHandoff(), 400);
        }
      });
  },

  finishPostIntroHandoff() {
    // 粒子已在 mainTitleCenterYRatio 正确位置，直接淡入菜单
    this.setData({ menuVisible: true });
    this.audioManager.playBGM('bgm-menu');
    this.refreshUI();

    // 稍作延迟再升级到 full mode，让菜单先完成 opacity 过渡
    setTimeout(() => {
      if (this.particleSystem && typeof this.particleSystem.upgradeToFullMode === 'function') {
        this.particleSystem.upgradeToFullMode({ keepTitleLayout: true });
      }
      this._postIntroHandoff = false;
      this.setData({
        postIntroHandoff: false,
        bgColor: this.growthSystem.getBackgroundRgbString(),
      });
    }, 600);
  },

  finishSkipIntroHandoff() {
    this.setData({
      menuVisible: true,
      bgColor: this.growthSystem.getBackgroundRgbString(),
    });
    this.audioManager.playBGM('bgm-menu');
    this.refreshUI();
    this._skipIntroHandoff = false;
  },

  destroyCanvases() {
    if (this.particleSystem) {
      this.particleSystem.destroy();
      this.particleSystem = null;
    }
    if (this.ambienceSystem) {
      this.ambienceSystem.destroy();
      this.ambienceSystem = null;
    }
    this._canvasReady = false;
  },

  refreshUI() {
    if (!this.levelManager) return;
    if (this.levelManager.refreshAtlasUnlocks()) this.levelManager.saveProgress();

    const atlasPieces = this.levelManager.currentProgress.atlasPieces || [];
    const { unlocked: atlasUnlocked, total: atlasTotal } = this.getAtlasProgressCounts(atlasPieces);
    const atlasPercent = atlasTotal > 0 ? Math.min((atlasUnlocked / atlasTotal) * 100, 100) : 0;

    const fragments = this.levelManager.currentProgress.fragments || [];
    const totalFragments = this.meta.fragmentTotal || 15;
    const fragmentPercent = Math.min((fragments.length / totalFragments) * 100, 100);

    this.setData({
      codexPercent: atlasPercent,
      codexText: `${atlasUnlocked}/${atlasTotal}`,
      fragmentPercent,
      fragmentText: `${fragments.length}/${totalFragments}`,
      showClaimableDot: this.levelManager.hasAnyClaimableTask(),
    });
    if (!this._postIntroHandoff) {
      this.setData({ bgColor: this.growthSystem.getBackgroundRgbString() });
    }
  },

  refreshTasks() {
    if (!this.getTasksWithProgress) return;
    this.setData({ taskRows: this.getTasksWithProgress() });
  },

  noop() {},

  onTutorialDismiss() {
    tutorialGuide.dismiss(this);
  },

  onContinue() {
    if (!this.audioManager) return;
    this.audioManager.playClickOpen();
    setTimeout(() => navigateToWithFade('/pages/levels/levels'), 200);
  },

  onCodex() {
    if (!this.audioManager) return;
    this.audioManager.playClickOpen();
    setTimeout(() => navigateToWithFade('/pages/codex/codex'), 200);
  },

  onGallery() {
    if (!this.audioManager) return;
    this.audioManager.playClickOpen();
    setTimeout(() => navigateToWithFade('/pages/gallery/gallery'), 200);
  },

  openPanel(type) {
    if (type === 'settings') {
      this.setData({ settingsVisible: true, tasksVisible: false });
      return;
    }
    this.refreshTasks();
    this.setData({ tasksVisible: true, settingsVisible: false }, () => {
      tutorialGuide.maybeShowClaimReward(this);
    });
  },

  closePanel(type) {
    const patch = type === 'settings'
      ? { settingsVisible: false }
      : { tasksVisible: false };
    this.setData(patch);
  },

  onSettings() {
    if (!this.audioManager) return;
    this.audioManager.playClickOpen();
    this.openPanel('settings');
  },

  onTasks() {
    if (!this.audioManager) return;
    this.audioManager.playClickOpen();
    this.openPanel('tasks');
  },

  onCloseSettings() {
    if (!this.audioManager) return;
    this.audioManager.playClickExit();
    this.closePanel('settings');
  },

  onCloseTasks() {
    if (!this.audioManager) return;
    this.audioManager.playClickExit();
    this.closePanel('tasks');
  },

  onSettingsOverlayTap() {
    if (!this.audioManager) return;
    this.audioManager.playClickExit();
    this.closePanel('settings');
  },

  onTasksOverlayTap() {
    if (!this.audioManager) return;
    this.audioManager.playClickExit();
    this.closePanel('tasks');
  },

  onBgmChanging(e) {
    const value = e.detail.value;
    this.setData({ bgmVolume: value });
    if (this.audioManager) this.audioManager.setBGMVolume(value / 100);
  },

  onBgmChange(e) {
    wx.setStorageSync('baozhu_bgm_volume', String(e.detail.value));
  },

  onSfxChanging(e) {
    const value = e.detail.value;
    this.setData({ sfxVolume: value });
    if (this.audioManager) this.audioManager.setSFXVolume(value / 100);
  },

  onSfxChange(e) {
    wx.setStorageSync('baozhu_sfx_volume', String(e.detail.value));
  },

  onClaimTask(e) {
    const taskId = e.currentTarget.dataset.id;
    const task = this.data.taskRows.find((t) => t.id === taskId);
    if (!task || !task.canClaim || !this.levelManager) return;

    if (task.gems > 0) this.audioManager.playSFX('task-reward-gem');
    else this.audioManager.playClickOpen();

    this.levelManager.claimTask(taskId);
    this.levelManager.addGems(task.gems || 0);
    this.refreshTasks();
    this.refreshUI();
  },

  onReset() {
    if (!this.levelManager) return;
    wx.showModal({
      title: '重置进度',
      content: '确定要重置所有游戏进度吗？\n\n将清除：\n• 关卡进度\n• 成就徽章\n• 开场动画记录\n• 教学动画记录\n\n此操作不可撤销。',
      confirmText: '确定重置',
      confirmColor: '#A67C52',
      success: (res) => {
        if (!res.confirm) return;
        this.levelManager.resetProgress();
        resetTutorialStorage();
        wx.showToast({ title: '进度已重置', icon: 'success' });
        this.refreshTasks();
        this.refreshUI();
        this.destroyCanvases();
        wx.navigateTo({ url: '/pages/intro/intro' });
      },
    });
  },
});
