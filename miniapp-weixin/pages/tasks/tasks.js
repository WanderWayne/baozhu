const levelManager = require('../../utils/level-manager');
const { getTasksWithProgress } = require('../../utils/tasks');
const { navigateBackWithFade } = require('../../utils/page-transitions');
const pageTransitionBehavior = require('../../behaviors/page-transition');

Page({
  behaviors: [pageTransitionBehavior],
  data: {
    statusBarHeight: 0,
    taskRows: [],
  },

  onLoad() {
    this._preparePageTransitionEnter();
    const sys = wx.getSystemInfoSync();
    this.audioManager = require('../../utils/audio-manager');
    this.setData({ statusBarHeight: sys.statusBarHeight || 0 });
    this.refreshTasks();
  },

  onShow() {
    this._handlePageTransitionEnter();
    this.audioManager.unlock();
    this.audioManager.playBGM('bgm-menu', { fadeInMs: 2000 });
    this.refreshTasks();
  },

  refreshTasks() {
    this.setData({ taskRows: getTasksWithProgress() });
  },

  onBack() {
    if (this.audioManager) this.audioManager.playClickBack();
    navigateBackWithFade('/pages/index/index');
  },

  onClaimTask(e) {
    const taskId = e.currentTarget.dataset.id;
    const task = this.data.taskRows.find((t) => t.id === taskId);
    if (!task || !task.canClaim) return;

    if (task.gems > 0) this.audioManager.playSFX('task-reward-gem');
    else this.audioManager.playClickOpen();

    levelManager.claimTask(taskId);
    levelManager.addGems(task.gems || 0);
    this.refreshTasks();
  },
});
