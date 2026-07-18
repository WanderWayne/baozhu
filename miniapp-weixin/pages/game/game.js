const GameController = require('./game-controller');
const levelManager = require('../../utils/level-manager');
const GameTaskToast = require('../../utils/game-task-toast');
const gameLayout = require('./lib/game-layout');
const gameAmbience = require('./game-ambience');
const gameGems = require('./lib/game-gems');
const { navigateBackWithFade } = require('../../utils/page-transitions');
const tutorialGuide = require('../../utils/tutorial-guide');
const pageTransitionBehavior = require('../../behaviors/page-transition');

Page({
  behaviors: [pageTransitionBehavior],
  data: {
    showClaimableDot: false,
    synthParticles: [],
    trailParticles: [],
    layoutStyle: '',
    inventoryRowsClass: 'rows-1',
    gemCount: 0,
    gemBump: false,
    gemPlusVisible: false,
    gemPlusAmount: 0,
    gemFlyers: [],
    levelId: 101,
    levelName: '',
    levelTarget: '',
    levelIcon: '🍨',
    doorStage: 0,
    doorSynthMaturity: 0,
    doorWaveVisible: false,
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
    tradeStationViews: [],
    tradeStationMode: false,
    tradeConfirmVisible: false,
    tradeConfirm: null,
    tradeFlyer: { visible: false },
    themeClass: 'theme-dairy',
    taskToastVisible: false,
    taskToastText: '',
    dragGhost: { visible: false, x: 0, y: 0, icon: '', name: '', itemType: 'base', tone: '' },
    inventoryDeleteHover: false,
    recipeBookBtnVisible: false,
    recipeBookBtnPulse: false,
    recipeBookBtnFlash: false,
    recipeBookNudge: false,
    recipeBookOverlayVisible: false,
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
    settlementVisible: false,
    settlementFading: false,
    settlementChapterName: '这一章',
    settlementProgressPercent: 0,
    tutOverlay: tutorialGuide.emptyOverlay(),
  },

  controller: null,
  _dustTimer: null,

  onLoad(options) {
    this._preparePageTransitionEnter();
    this.audioManager = require('../../utils/audio-manager');
    this.audioManager.registerAudioFiles(require('./game-audio-files'));
    this.levelId = parseInt(options.level || options.id || '101', 10);

    GameTaskToast.bindPage(this);
    GameTaskToast.initBaseline();

    this.controller = new GameController(this, this.levelId);
    if (!this.controller.init()) {
      wx.showToast({ title: '关卡不存在', icon: 'none' });
      setTimeout(() => navigateBackWithFade('/pages/levels/levels?world=1'), 800);
      return;
    }

    gameGems.initGemDisplay(this);

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
    this._handlePageTransitionEnter();
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
    clearTimeout(this._inventoryNudgeTimer);
    this._stopDustLoop();
    gameGems.destroyGemDisplay(this);
    if (this.controller) this.controller.destroy();
    this.audioManager.stopBGM();
  },

  showGemReward(amount) {
    return gameGems.showGemReward(this, amount);
  },

  /** 对齐 H5 updateInventoryLayout：按物品数量定 rows-*，合成区 bottom = 物品栏实测高度 */
  syncGameLayout(measuredInventoryHeightPx, impliedItemCount) {
    const items = this.data.inventoryItems || [];
    const itemCount = impliedItemCount != null
      ? impliedItemCount
      : items.filter((i) => !i.hidden).length;
    const layout = gameLayout.computeLayout(itemCount, measuredInventoryHeightPx);
    const previousInvH = this._inventoryLayoutHeight;
    const inventoryGrew = Number.isFinite(previousInvH) && layout.invH > previousInvH + 1;
    this._inventoryLayoutHeight = layout.invH;

    const patch = {
      layoutStyle: layout.style,
      inventoryRowsClass: layout.rowClass,
    };

    if (inventoryGrew) {
      const viewport = gameLayout.getViewport();
      const predictedSynthesisHeight = Math.max(250, viewport.windowHeight - layout.invH);
      const nudged = gameLayout.nudgeWorkshopItems(
        this.data.workshopItems || [],
        viewport.windowWidth,
        predictedSynthesisHeight,
      );
      const nudgedBrewings = gameLayout.nudgeWorkshopItems(
        this.data.brewings || [],
        viewport.windowWidth,
        predictedSynthesisHeight,
      );
      if (nudged.changed) patch.workshopItems = nudged.items;
      if (nudgedBrewings.changed) patch.brewings = nudgedBrewings.items;
    }

    this.setData(patch);

    if (inventoryGrew) {
      clearTimeout(this._inventoryNudgeTimer);
      this._inventoryNudgeTimer = setTimeout(() => {
        this._nudgeWorkshopItemsToMeasuredBounds();
      }, 400);
    }
  },

  _nudgeWorkshopItemsToMeasuredBounds() {
    if (!this.controller) return;
    const query = wx.createSelectorQuery().in(this);
    query.select('#synthesis-area').boundingClientRect();
    query.select('#door-container').boundingClientRect();
    query.select('#inventory-area').boundingClientRect();
    query.exec((res) => {
      const synthesisRect = res && res[0];
      if (!synthesisRect) return;
      this.controller.measureRects(synthesisRect, res[1], res[2]);
      const nudged = gameLayout.nudgeWorkshopItems(
        this.data.workshopItems || [],
        synthesisRect.width,
        synthesisRect.height,
      );
      const nudgedBrewings = gameLayout.nudgeWorkshopItems(
        this.data.brewings || [],
        synthesisRect.width,
        synthesisRect.height,
      );
      const patch = {};
      if (nudged.changed) patch.workshopItems = nudged.items;
      if (nudgedBrewings.changed) patch.brewings = nudgedBrewings.items;
      if (Object.keys(patch).length) this.setData(patch);
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
            if (this.controller.tradeStation) {
              this.controller.tradeStation.relayout(this.controller.levelId);
            }
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
  onBrewingTouchEnd(e) {
    if (this.controller) this.controller.onBrewingTouchEnd(e);
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

  onWorkshopTouchCancel(e) {
    if (this.controller) this.controller.onWorkshopTouchCancel(e);
  },

  onTradeStationTouchMove(e) {
    if (this.controller) this.controller.onWorkshopTouchMove(e);
  },

  onTradeStationTouchEnd(e) {
    if (this.controller) this.controller.onWorkshopTouchEnd(e);
  },

  onTradeTap(e) {
    if (this.controller) this.controller.onTradeTap(e);
  },

  onTradeStationTap(e) {
    if (this.controller?.tradeStation) {
      this.controller.tradeStation.onStationTap(e.currentTarget.dataset.id);
    }
  },

  onTradeConfirmCancel() {
    if (this.controller?.tradeStation) {
      this.controller.tradeStation.dismissConfirm(true);
    }
  },

  onTradeConfirmOk() {
    if (this.controller?.tradeStation) {
      this.controller.tradeStation.confirmTrade();
    }
  },

  onSettlementContinue() {
    if (this.controller) this.controller.onSettlementContinue();
  },

  onSettlementRest() {
    if (this.controller) this.controller.onSettlementRest();
  },

  onTutorialDismiss() {
    tutorialGuide.dismiss(this);
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
    if (!tutorialGuide.hasSeen('tut_first_exit_game')) {
      tutorialGuide.markSeen('tut_first_exit_game');
    }
    try { this.audioManager.playClickBack(); } catch (err) { /* noop */ }
    try { this.audioManager.stopBGM(); } catch (err) { /* noop */ }
    const worldId = this.controller?.levelData?.worldId || 1;
    navigateBackWithFade(`/pages/levels/levels?world=${worldId}`);
  },
});
