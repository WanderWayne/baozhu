const { BUILD_VERSION } = require('../../utils/build-version');
const levelManager = require('../../utils/level-manager');
const { resetTutorialStorage } = require('../../utils/main-menu');
const { navigateBackWithFade, reLaunchWithFade } = require('../../utils/page-transitions');
const pageTransitionBehavior = require('../../behaviors/page-transition');

Page({
  behaviors: [pageTransitionBehavior],
  data: {
    statusBarHeight: 0,
    buildVersion: BUILD_VERSION,
    bgmVolume: 80,
    sfxVolume: 80,
  },

  onLoad() {
    this._preparePageTransitionEnter();
    const sys = wx.getSystemInfoSync();
    this.audioManager = require('../../utils/audio-manager');
    this.setData({
      statusBarHeight: sys.statusBarHeight || 0,
      bgmVolume: Math.round(this.audioManager.bgmVolume * 100),
      sfxVolume: Math.round(this.audioManager.sfxVolume * 100),
    });
  },

  onShow() {
    this._handlePageTransitionEnter();
    this.audioManager.unlock();
    this.audioManager.playBGM('bgm-menu', { fadeInMs: 2000 });
  },

  onBack() {
    if (this.audioManager) this.audioManager.playClickBack();
    navigateBackWithFade('/pages/index/index');
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

  onReset() {
    wx.showModal({
      title: '重置进度',
      content: '确定要重置所有游戏进度吗？\n\n将清除：\n- 关卡进度\n- 成就徽章\n- 开场动画记录\n- 教学动画记录\n\n此操作不可撤销。',
      confirmText: '确定重置',
      confirmColor: '#A67C52',
      success: (res) => {
        if (!res.confirm) return;
        if (this.audioManager && typeof this.audioManager.resetBGM === 'function') {
          this.audioManager.resetBGM();
        }
        levelManager.resetProgress();
        resetTutorialStorage();
        wx.showToast({ title: '进度已重置', icon: 'success' });
        reLaunchWithFade('/pages/intro/intro');
      },
    });
  },
});
