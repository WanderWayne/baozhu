const GameController = require('../../utils/game-controller');
const levelManager = require('../../utils/level-manager');
const GameTaskToast = require('../../utils/game-task-toast');
const gameLayout = require('../../utils/game-layout');
const gameAmbience = require('../../utils/game-ambience');
const { navigateBackWithFade } = require('../../utils/page-transitions');

Page({
  data: {
    showClaimableDot: false,
    synthParticles: [],
    trailParticles: [],
    layoutStyle: '',
    inventoryRowsClass: 'rows-1',
    levelId: 101,
    levelName: '',
    levelTarget: '',
    levelIcon: '🍨',
    doorStage: 0,
    targetReady: false,
    doorClosing: false,
    doorStarEntering: false,
    doorClosed: false,
    doorOffering: false,
    doorBubbleVisible: false,
    doorBubbleFading: false,
    doorBubbleText: '',
    doorBubbleLeft: 0,
    doorBubbleTop: 0,
    doorBubbleMaxWidth: 200,
    doorBubbleTail: 'tail-left',
    milkFogParticles: [],
    grassClumps: [],
    bgDust: [],
    showTransitionText: false,
    transitionText: '',
    inventoryGoldenGlow: false,
    inventoryGoldenFade: false,
    levelCompletePopVisible: false,
    levelCompletePopText: '',
    targetHidden: false,
    targetPopIn: false,
    targetFlash: false,
    tradeRowHidden: false,
    foamParticles: [],
    introFadeOut: false,
    introReady: false,
    inventoryItems: [],
    workshopItems: [],
    multiTargets: [],
    multiTargetRows: [],
    multiCompleted: [],
    showIntro: false,
    introTitle: '',
    introTarget: '',
    introDesc: '',
    toastMessage: '',
    successVisible: false,
    successText: '',
    successIsNew: false,
    endingVisible: false,
    brewings: [],
    tradeStations: [],
    themeClass: 'theme-dairy',
    taskToastVisible: false,
    taskToastText: '',
    dragGhost: { visible: false, x: 0, y: 0, icon: '', name: '', itemType: 'base', tone: '' },
    recipeBookBtnVisible: false,
    recipeBookBtnPulse: false,
    recipeBookBtnFlash: false,
    recipeBookOverlayVisible: false,
    recipeBookTab: 'recorded',
    recipeBookSearch: '',
    recipeBookSections: [],
    recipeBookEmptyText: '',
    recipeBookFlyer: { visible: false },
    basicCompletionVisible: false,
    basicCompletionPhase: 'stats',
    basicCompletionTime: '',
    basicCompletionProgress: 0,
    basicSpeedIcon: '⚡',
    basicSpeedName: '闪电',
    basicSpeedTier: 5,
    basicOldTitleIcon: '🌱',
    basicOldTitleName: '酿造学徒',
    basicNewTitleIcon: '',
    basicNewTitleName: '',
  },

  controller: null,
  _dustTimer: null,

  onLoad(options) {
    this.audioManager = require('../../utils/audio-manager');
    this.levelId = parseInt(options.level || options.id || '101', 10);

    GameTaskToast.bindPage(this);
    GameTaskToast.initBaseline();

    this.controller = new GameController(this, this.levelId);
    if (!this.controller.init()) {
      wx.showToast({ title: '关卡不存在', icon: 'none' });
      setTimeout(() => navigateBackWithFade('/pages/levels/levels?world=1'), 800);
      return;
    }

    this.syncGameLayout();
    this._initAmbience();
    this.audioManager.playBGM('bgm-game');
  },

  _initAmbience() {
    this.setData({
      milkFogParticles: gameAmbience.createMilkFogParticles(),
      grassClumps: gameAmbience.createGrassClumps(),
      bgDust: [],
    });
  },

  _startDustLoop() {
    this._stopDustLoop();
    this._dustTimer = setInterval(() => {
      const dust = gameAmbience.createDustParticle();
      const list = (this.data.bgDust || []).concat(dust).slice(-24);
      this.setData({ bgDust: list });
      setTimeout(() => {
        const next = (this.data.bgDust || []).filter((d) => d.id !== dust.id);
        if (next.length !== (this.data.bgDust || []).length) {
          this.setData({ bgDust: next });
        }
      }, dust.duration * 1000 + 120);
    }, 700);
  },

  _stopDustLoop() {
    if (this._dustTimer) {
      clearInterval(this._dustTimer);
      this._dustTimer = null;
    }
  },

  onReady() {
    this._measureGameRects();
    this._startDustLoop();
  },

  onShow() {
    this.audioManager.unlock();
    this.syncGameLayout();
    setTimeout(() => this._measureGameRects(), 100);
    this.setData({ showClaimableDot: levelManager.hasAnyClaimableTask() });
  },

  onResize() {
    this.syncGameLayout();
    setTimeout(() => this._measureGameRects(), 50);
  },

  onUnload() {
    this._stopDustLoop();
    if (this.controller) this.controller.destroy();
    this.audioManager.stopBGM();
  },

  /** 对齐 H5 updateInventoryLayout：按物品数量定 rows-*，合成区 bottom = 物品栏实测高度 */
  syncGameLayout(measuredInventoryHeightPx, impliedItemCount) {
    const items = this.data.inventoryItems || [];
    const itemCount = impliedItemCount != null
      ? impliedItemCount
      : items.filter((i) => !i.hidden).length;
    const layout = gameLayout.computeLayout(itemCount, measuredInventoryHeightPx);
    this.setData({
      layoutStyle: layout.style,
      inventoryRowsClass: layout.rowClass,
    });
  },

  _measureGameRects() {
    if (!this.controller) return;
    const query = wx.createSelectorQuery().in(this);
    query.select('#synthesis-area').boundingClientRect();
    query.select('#door-container').boundingClientRect();
    query.select('#inventory-area').boundingClientRect();
    query.select('.game-page').boundingClientRect();
    query.exec((res) => {
      if (res[2] && res[2].height) {
        this.syncGameLayout(res[2].height);
      }
      if (res[0] && res[1]) {
        this.controller.measureRects(res[0], res[1], res[2]);
      }
      if (res[2] && res[3]) {
        const vh = gameLayout.getViewport().windowHeight;
        this._layoutMetrics = {
          windowHeight: vh,
          pageBottom: res[3].bottom,
          invTop: res[2].top,
          invBottom: res[2].bottom,
          invHeight: res[2].height,
          gapToWindowBottom: vh - res[2].bottom,
        };
      }
      setTimeout(() => {
        if (!this.controller) return;
        const q2 = wx.createSelectorQuery().in(this);
        q2.select('#synthesis-area').boundingClientRect();
        q2.select('#door-container').boundingClientRect();
        q2.select('#inventory-area').boundingClientRect();
        q2.exec((res2) => {
          if (res2[0] && res2[1]) {
            this.controller.measureRects(res2[0], res2[1], res2[2]);
          }
          if (res2[2] && res2[2].height) {
            this.syncGameLayout(res2[2].height);
          }
        });
      }, 400);
    });
  },

  getLayoutMetrics() {
    return this._layoutMetrics || null;
  },

  dismissIntro() {
    if (this.controller) this.controller.dismissIntro();
    setTimeout(() => this._measureGameRects(), 300);
  },

  onBrewingTouchStart(e) {
    if (this.controller) this.controller.onBrewingTouchStart(e);
  },
  onBrewingTouchMove(e) {
    if (this.controller) this.controller.onBrewingTouchMove(e);
  },
  onBrewingTouchEnd() {
    if (this.controller) this.controller.onBrewingTouchEnd();
  },

  onInventoryTap(e) {
    if (this.controller) this.controller.onInventoryTap(e);
  },

  onInventoryTouchStart(e) {
    if (this.controller) this.controller.onInventoryTouchStart(e);
  },

  onInventoryTouchMove(e) {
    if (this.controller) this.controller.onInventoryTouchMove(e);
  },

  onInventoryTouchEnd(e) {
    if (this.controller) this.controller.onInventoryTouchEnd(e);
  },

  onPageTouchMove(e) {
    if (this.controller) this.controller.onPageTouchMove(e);
  },

  onPageTouchEnd(e) {
    if (this.controller) this.controller.onPageTouchEnd(e);
  },

  onWorkshopTouchStart(e) {
    if (this.controller) this.controller.onWorkshopTouchStart(e);
  },

  onWorkshopTouchMove(e) {
    if (this.controller) this.controller.onWorkshopTouchMove(e);
  },

  onWorkshopTouchEnd(e) {
    if (this.controller) this.controller.onWorkshopTouchEnd(e);
  },

  onTradeTap(e) {
    if (this.controller) this.controller.onTradeTap(e);
  },

  onWorkshopLongPress(e) {
    if (this.controller) this.controller.onWorkshopLongPress(e);
  },

  onDoorTap() {
    if (this.controller) this.controller.onDoorTap();
  },

  onRecipeBookTap() {
    if (this.controller) this.controller.openRecipeBook();
  },

  onRecipeBookClose() {
    if (this.controller) this.controller.closeRecipeBook();
  },

  onRecipeBookOverlayTap() {
    if (this.controller) this.controller.closeRecipeBook();
  },

  onRecipeBookPanelTap() {
    /* 阻止点击面板关闭 overlay */
  },

  onRecipeBookTabTap(e) {
    if (this.controller) this.controller.onRecipeBookTabChange(e.currentTarget.dataset.tab);
  },

  onRecipeBookSearchInput(e) {
    if (this.controller) this.controller.onRecipeBookSearch(e.detail.value);
  },

  onClaimBasicReward() {
    if (this.controller) this.controller.claimBasicReward();
  },

  onBasicCompletionExplore() {
    if (this.controller) this.controller.finishBasicCompletionExplore();
  },

  onBasicCompletionRest() {
    if (this.controller) this.controller.finishBasicCompletionRest();
  },

  dismissSuccess() {
    if (this.controller) this.controller.dismissSuccess();
  },

  dismissEnding() {
    if (this.controller) this.controller.dismissEnding();
  },

  onBack() {
    try { this.audioManager.playClickBack(); } catch (err) { /* noop */ }
    try { this.audioManager.stopBGM(); } catch (err) { /* noop */ }
    const worldId = this.controller?.levelData?.worldId || 1;
    navigateBackWithFade(`/pages/levels/levels?world=${worldId}`);
  },
});
