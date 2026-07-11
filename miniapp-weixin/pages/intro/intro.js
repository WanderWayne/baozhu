/** @feature intro @see docs/features/intro.md */
const IntroSystem = require('../../utils/intro/index');
const { redirectToWithFade, navigateToWithFade } = require('../../utils/page-transitions');
const { INTRO_KEY, resetTutorialStorage } = require('../../utils/main-menu');

function computeSkipBtnTop() {
  const sys = wx.getSystemInfoSync();
  let top = (sys.statusBarHeight || 44) + 52;
  try {
    const menu = wx.getMenuButtonBoundingClientRect();
    if (menu && menu.bottom) top = menu.bottom + 16;
  } catch (e) {
    /* ignore */
  }
  return top;
}

Page({
  data: {
    // ── intro 动画状态 ──
    screenBg: '#000000',
    warmTransition: false,
    ambienceOpacity: 0,
    dotVisible: false,
    dotOpacity: 1,
    flashClass: '',
    inventoryVisible: false,
    narrativeVisible: false,
    narrativeText: '',
    storyVisible: false,
    storyText: '',
    storyTextGoal: false,
    storyTextVisible: false,
    skipBtnTop: 100,

    // ── 主菜单状态（粒子聚字后内嵌展示）──
    menuMode: false,
    menuVisible: false,
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
  },

  intro: null,

  onLoad() {
    try {
      if (wx.getStorageSync(INTRO_KEY)) {
        wx.redirectTo({ url: '/pages/index/index' });
        return;
      }
      this.setData({ skipBtnTop: computeSkipBtnTop() });
    } catch (e) {
      console.error('[intro] onLoad: ' + (e && e.message ? e.message : String(e)));
    }
  },

  onReady() {
    if (wx.getStorageSync(INTRO_KEY)) return;
    this.initIntroCanvas();
  },

  onShow() {
    try {
      const audioManager = require('../../utils/audio-manager');
      audioManager.unlock();
      if (this.data.menuMode && this.audioManager) {
        this.audioManager.playBGM('bgm-menu');
      }
    } catch (e) {
      /* ignore */
    }
  },

  onHide() {
    if (this.audioManager) this.audioManager.stopBGM();
  },

  onUnload() {
    if (this.intro) {
      this.intro.destroy();
      this.intro = null;
    }
  },

  initIntroCanvas(retry = 0) {
    const sys = wx.getSystemInfoSync();
    const dpr = sys.pixelRatio || 2;

    wx.createSelectorQuery()
      .in(this)
      .select('#intro-canvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        const canvasRes = res && res[0];
        if (!canvasRes?.node) {
          if (retry < 5) setTimeout(() => this.initIntroCanvas(retry + 1), 150);
          return;
        }

        const w = sys.windowWidth;
        const h = sys.windowHeight;
        const canvas = canvasRes.node;
        const ctx = canvas.getContext('2d');
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);

        if (this.intro) this.intro.destroy();
        this.intro = new IntroSystem(this);
        this.intro.init(canvas, ctx, w, h, dpr);
      });
  },

  // ── intro 触摸事件 ──

  onDotTap() {
    if (this.intro && this.intro.state === 'dotIdle') {
      this.intro.setState('doorExpand');
    }
  },

  onItemTouchStart(e) {
    if (this.intro) this.intro.onTouchStart(e);
  },

  onItemTouchMove(e) {
    if (this.intro) this.intro.onTouchMove(e);
  },

  onItemTouchEnd(e) {
    if (this.intro) this.intro.onTouchEnd(e);
  },

  onSkipIntro() {
    try { wx.setStorageSync(INTRO_KEY, '1'); } catch (err) { /* ignore */ }
    if (this.intro) {
      this.intro.destroy();
      this.intro = null;
    }
    redirectToWithFade('/pages/index/index?skipIntro=1');
  },

  // ── 主菜单内嵌：IntroSystem 调用入口 ──

  enterMenuMode() {
    if (this.data.menuMode) return;

    // 懒加载游戏模块
    try {
      this.meta = require('../../data/meta.js');
      this.levelManager = require('../../utils/level-manager');
      this.growthSystem = require('../../utils/growth-system');
      this.audioManager = require('../../utils/audio-manager');
      this.getAtlasProgressCounts = require('../../utils/atlas-counts').getAtlasProgressCounts;
      this.getTasksWithProgress = require('../../utils/tasks').getTasksWithProgress;
    } catch (e) {
      console.error('[intro] enterMenuMode load failed: ' + (e && e.message ? e.message : String(e)));
      return;
    }

    this.setData({
      menuMode: true,
      bgmVolume: Math.round((this.audioManager.bgmVolume || 0) * 100),
      sfxVolume: Math.round((this.audioManager.sfxVolume || 0) * 100),
    });
    this.refreshUI();

    // 短暂延迟确保 menuMode 渲染后再淡入
    setTimeout(() => this.setData({ menuVisible: true }), 50);
  },

  // ── 主菜单数据刷新 ──

  refreshUI() {
    if (!this.levelManager || !this.meta) return;
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
  },

  refreshTasks() {
    if (!this.getTasksWithProgress) return;
    this.setData({ taskRows: this.getTasksWithProgress() });
  },

  noop() {},

  // ── 主菜单导航 ──

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

  // ── 面板 ──

  openPanel(type) {
    if (type === 'settings') {
      this.setData({ settingsVisible: true, tasksVisible: false });
      return;
    }
    this.refreshTasks();
    this.setData({ tasksVisible: true, settingsVisible: false });
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

  // ── 音量 ──

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

  // ── 任务 ──

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

  // ── 重置进度 ──

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
        // 重新播开场
        if (this.intro) { this.intro.destroy(); this.intro = null; }
        wx.reLaunch({ url: '/pages/intro/intro' });
      },
    });
  },
});
