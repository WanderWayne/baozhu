/** @feature synthesis @see docs/features/synthesis.md */
// GameController 编排层 — 玩法细节见 utils/game/*
// 游戏核心控制器（小程序 touch 版，对齐 H5 101–106）
const synthesisEngine = require('./lib/synthesis-engine');
const levelManager = require('../../utils/level-manager');
const { getItemMeta } = require('../../utils/game-item-style');
const { getRecipeBookPageData } = require('./lib/game-recipe-book');
const { showDialog, playLevelDialogs } = require('./lib/door-dialog');
const { runChapterTransition } = require('./lib/game-chapter-transition');
const { navigateBackWithFade, navigateHomeWithFade } = require('../../utils/page-transitions');
const { frameDelay } = require('./lib/inventory-pop-animation');
const { createFoamBurst, appendFoam } = require('./lib/game-foam');
const TradeStationManager = require('./lib/trade-station');
const tutorialGuide = require('../../utils/tutorial-guide');
const devPlaytest = require('../../utils/dev-playtest');

const { ITEM_SIZE_PX, nextId, APPEAR_INTERVAL, APPEAR_DURATION } = require('./lib/game/constants');

const dragMixin = require('./lib/game/drag');
const doorMixin = require('./lib/game/door');
const synthesisFlowMixin = require('./lib/game/synthesis-flow');
const brewingMixin = require('./lib/game/brewing');
const inventoryMixin = require('./lib/game/inventory');
const completionMixin = require('./lib/game/completion');
const recipeBookMixin = require('./lib/game/recipe-book');

const DOOR_CLICK_LINES = {
  101: { hints: [], chat: [] },
  102: {
    hints: ['鲜奶发酵成酸奶，滤布收成酪。'],
    chat: ['...', '别乱碰。', '老老实实做出奶酪。'],
  },
  103: {
    hints: ['四种，我全都要。'],
    chat: ['...', '还没齐呢。', '别偷懒。'],
  },
  104: {
    hints: ['也许跟它的名字有关。'],
    chat: ['...', '自己想。', '别看我。'],
  },
  105: {
    hints: ['翻翻配方书。'],
    chat: ['...', '花挑错了可不行。', '别浪费雪酪。'],
  },
  106: {
    hints: ['在考试呢，想什么呢。'],
    chat: ['...', '这是最后一关了。', '步骤不少。', '冷静。'],
  },
  _default: {
    hints: [],
    chat: ['...', '嗯？', '别戳了。', '有事？', '去合成。'],
  },
};

class GameController {
  constructor(page, levelId) {
    this.page = page;
    this.levelId = levelId;
    this.levelData = levelManager.getLevelData(levelId);
    this.chapterData = this.levelData
      ? levelManager.getChapterData(this.levelData.chapterId)
      : null;
    this.doorStage = 0;
    this.discoveredTriggers = new Set();
    this.synthCount = 0;
    this.targetReady = false;
    this.isTransitioning = false;
    this.offeringInProgress = false;
    this.multiCompleted = [];
    this.completedTargetItems = new Set();
    this.brewTimers = {};
    this.brewDragState = null;
    this._offerQueue = [];
    this.dragState = null;
    this._workshopDragFinishing = false;
    this._lpState = null;
    this._lpRingTimer = null;
    this._lpCompleteTimer = null;
    this._workbenchInitialSpawned = false;
    this._introOuterTimer = null;
    this._recipeBookPhaseActive = false;
    this._firedTriggers = new Set();
    this._inChapterFlow = false;
    this._lvl104AwaitDual = false;
    this._lvl104DualHintTimer = null;
    this._doorClickCooldown = 0;
    this._doorClickChatIdx = 0;
    this._recipeBookAttentionTimer = null;
    this.synthesizedItems = new Set();
    this.completedTargetItems = new Set();
    this.synthesisRect = null;
    this.doorRect = null;
    this.inventoryRect = null;
    this.tradeStation = new TradeStationManager(this);
    this._pendingTradeStationInit = false;
    this._doorClickLines = DOOR_CLICK_LINES;
  }

  init() {
    if (!this.levelData) return false;

    this._inChapterFlow = false;
    this._firedTriggers = new Set();
    this.synthesizedItems = new Set();
    this._clearLvl104DualHints();

    const basicLevels = levelManager.getBasicLevelIds();
    if (basicLevels.includes(this.levelId)) {
      levelManager.startBasicLevelTimer();
    }

    this._applyLevelState(this.levelData, { showIntro: false });
    this.showLevelIntro();
    return true;
  }

  _transitionResetData(opts = {}) {
    return {
      doorStarEntering: false,
      doorClosing: false,
      doorClosed: false,
      doorOffering: false,
      inventoryGoldenGlow: false,
      inventoryGoldenFade: !!opts.goldenFade,
      targetHidden: false,
      targetPopIn: false,
      targetFlash: false,
      tradeRowHidden: false,
      foamParticles: [],
      introFadeOut: false,
    };
  }

  _levelTargetIcon(levelData) {
    const target = levelData?.target || '';
    const levelIcon = target
      ? getItemMeta(target).icon
      : (levelData?.icon || '🍨');
    return {
      levelIcon,
      levelTarget: target,
    };
  }

  _applyLevelState(levelData, opts = {}) {
    this.levelData = levelData;
    this.chapterData = levelManager.getChapterData(levelData.chapterId);
    this.doorStage = 0;
    this.discoveredTriggers = new Set();
    this.synthCount = 0;
    this.targetReady = false;
    if (!opts.keepTransitionLock) {
      this.isTransitioning = false;
    }
    this.offeringInProgress = false;
    this.multiCompleted = [];
    this.completedTargetItems = new Set();
    this.synthesizedItems = new Set();
    this._offerQueue = [];
    this._workbenchInitialSpawned = false;

    const discovered = levelManager.currentProgress.discoveredItems || [];
    const alreadyHasBook = discovered.includes('配方书');
    const forceRecipePhase = devPlaytest.forceRecipeBookPhase(levelData.id);
    this._recipeBookPhaseActive = !!(
      levelData.recipeBookPhase
      && (!alreadyHasBook || forceRecipePhase)
      && !opts.skipRecipePhase
    );

    let inventory = opts.keepInventory ? [...(this.page.data.inventoryItems || [])] : [];
    if (opts.keepInventory) {
      inventory = inventory.map((it) => ({
        ...it,
        popPhase: '',
        popDone: false,
        goldenOutline: false,
      }));
    }
    const workshop = [];
    if (this._recipeBookPhaseActive) {
      inventory = [];
    } else if (!opts.keepInventory) {
      let x = 20;
      (levelData.initialItems || []).forEach((name) => {
        inventory.push(this._makeItem(name, x, 0, true));
        x += 72;
      });
    }

    if (!this._recipeBookPhaseActive && !opts.keepInventory) {
      // workbench 物品在关卡初始化时 pop-in
    }

    const multiTargets = levelData.multiTarget ? (levelData.multiTargets || []) : [];
    const showRecipeBtn = alreadyHasBook && !this._recipeBookPhaseActive && !levelData.isSpecialArea;
    const recipeBookData = getRecipeBookPageData(
      '',
      discovered,
    );

    this.page.setData({
      levelId: levelData.id,
      levelName: levelData.name,
      levelTarget: levelData.target,
      ...this._levelTargetIcon(levelData),
      doorStage: 0,
      doorSynthMaturity: 0,
      doorWaveVisible: false,
      targetReady: false,
      showTransitionText: false,
      transitionText: '',
      inventoryItems: inventory,
      workshopItems: opts.keepInventory && !this._recipeBookPhaseActive
        ? (this.page.data.workshopItems || [])
        : workshop,
      multiTargets,
      multiTargetRows: this._buildMultiTargetRows(multiTargets, []),
      multiCompleted: [],
      showIntro: !!opts.showIntro,
      introTitle: this._introTitle(),
      introTarget: this._recipeBookPhaseActive
        ? ''
        : (levelData.target ? `目标：${levelData.target}` : ''),
      introDesc: levelData.description || levelData.storyIntro || '',
      toastMessage: '',
      successVisible: false,
      successText: levelData.completionText || '过关！',
      brewings: [],
      tradeStations: levelData.tradeStations || [],
      themeClass: this._themeClass(),
      doorBubbleVisible: false,
      doorBubbleFading: false,
      doorBubbleText: '',
      doorBubbleLeft: 0,
      doorBubbleTop: 0,
      dragGhost: { visible: false, x: 0, y: 0, icon: '', name: '', itemType: 'base', tone: '' },
      targetHidden: this._recipeBookPhaseActive || !!opts.recipeBookPhaseEntry,
      recipeBookBtnVisible: showRecipeBtn,
      recipeBookBtnPulse: showRecipeBtn,
      recipeBookOverlayVisible: false,
      recipeBookFlyer: { visible: false },
      basicCompletionVisible: false,
      basicCompletionPhase: 'stats',
      ...recipeBookData,
      ...this._transitionResetData(opts),
    }, () => {
      this._syncLayout();
      this._initTradeStations();
      this._spawnWorkbenchInitialItemsIfNeeded(220);
    });
  }

  _spawnWorkbenchInitialItemsIfNeeded(startDelay = 220) {
    if (this._workbenchInitialSpawned || this._recipeBookPhaseActive) return;
    const list = this.levelData.workbenchInitialItems;
    if (!list?.length) return;
    this._workbenchInitialSpawned = true;
    const spawnAll = () => {
      list.forEach((itemName, i) => {
        setTimeout(() => this.spawnWorkbenchItemPopIn(itemName), i * APPEAR_INTERVAL);
      });
    };
    if (!this.synthesisRect && typeof this.page._measureGameRects === 'function') {
      this.page._measureGameRects();
      setTimeout(spawnAll, startDelay);
      return;
    }
    setTimeout(spawnAll, startDelay);
  }

  /** intro 收起后触发交易台引导（不等待门边对白） */
  _scheduleTradeStationTutorialAfterIntro() {
    if (this._recipeBookPhaseActive || this.levelData.isSpecialArea) return;
    setTimeout(() => {
      this._maybeShowTradeStationTutorial();
    }, 800);
  }

  spawnWorkbenchItemPopIn(itemName) {
    const workshop = this.page.data.workshopItems || [];
    if (workshop.some((i) => i.name === itemName)) return;

    const synth = this.synthesisRect;
    const cx = synth ? synth.width * 0.25 : 90;
    const cy = synth ? synth.height * 0.5 : 140;
    const half = ITEM_SIZE_PX / 2;

    const newItem = this._makeItem(itemName, Math.max(6, cx - half), Math.max(6, cy - half), false);
    newItem.workbenchPopIn = true;

    this.page.setData({ workshopItems: [...workshop, newItem] });

    try {
      this.page.audioManager.playInventoryTransitionSlot(false);
    } catch (err) { /* noop */ }

    if (synth) {
      appendFoam(this.page, createFoamBurst(
        synth.left + cx,
        synth.top + cy,
        8,
      ));
    }

    setTimeout(() => {
      const ws = (this.page.data.workshopItems || []).map((i) => (
        i.id === newItem.id ? { ...i, workbenchPopIn: false } : i
      ));
      this.page.setData({ workshopItems: ws });
    }, 1900);
  }




  _initTradeStations() {
    if (this._recipeBookPhaseActive) {
      this.tradeStation.destroy();
      this.page.setData({ tradeStationViews: [], tradeStationMode: false });
      return;
    }
    const configs = TradeStationManager.getConfigs(this.levelData);
    if (!configs.length) {
      this.tradeStation.destroy();
      this.page.setData({ tradeStationViews: [], tradeStationMode: false });
      return;
    }
    if (!this.synthesisRect || !this.doorRect || !this.inventoryRect) {
      this._pendingTradeStationInit = true;
      this.page.setData({
        tradeStationViews: [],
        tradeStationMode: false,
        tradeRowHidden: true,
      });
      if (typeof this.page._measureGameRects === 'function') {
        setTimeout(() => this.page._measureGameRects(), 80);
      }
      return;
    }
    this._pendingTradeStationInit = false;
    wx.nextTick(() => {
      setTimeout(() => {
        this.tradeStation.init(configs, this.levelId);
      }, 100);
    });
  }

  _maybeShowTradeStationTutorial() {
    if (tutorialGuide.hasSeen('tut_tradeStation')) return;
    if (!this.tradeStation?.stations?.length) return;
    tutorialGuide.markSeen('tut_tradeStation');
    tutorialGuide.show(this.page, {
      targetSelector: '.trade-station',
      text: '将物品放入/点击兑换台以兑换',
      position: 'bottom',
      padding: 8,
      borderRadius: 14,
      shape: 'roundRect',
    });
  }

  _introTitle() {
    const idx = this.levelData.objectiveIndex;
    const num = idx != null ? idx + 1 : '';
    return num ? `第${num}关 · ${this.levelData.name}` : this.levelData.name;
  }

  _themeClass() {
    const map = {
      1: 'theme-dairy', 2: 'theme-floral', 3: 'theme-fruit',
      4: 'theme-grain', 5: 'theme-temperature', 6: 'theme-ultimate',
    };
    return map[this.levelData.worldId] || 'theme-dairy';
  }

  _makeItem(name, x, y, inInventory) {
    const meta = getItemMeta(name);
    return {
      id: nextId(),
      name,
      icon: meta.icon,
      itemType: meta.itemType,
      tone: meta.tone,
      hasEffect: meta.hasEffect,
      x,
      y,
      inInventory: !!inInventory,
      locked: false,
      isTarget: false,
      selected: false,
      offering: false,
      offeringFlight: false,
      appearing: false,
      placeholder: false,
      goldenOutline: false,
      popPhase: '',
      popDone: false,
      shrinking: false,
    };
  }

  showLevelIntro() {
    return new Promise((resolve) => {
      if (!this.levelData?.name) {
        resolve();
        return;
      }
      this._introResolve = resolve;
      this._introDismissed = false;
      this._introSkipOpeningDialogs = this._introFromTransition;
      this._introFromTransition = false;
      this.page.setData({
        showIntro: true,
        introFadeOut: false,
        introReady: true,
        introTitle: this._introTitle(),
        introTarget: this._recipeBookPhaseActive
          ? ''
          : (this.levelData.target ? `目标：${this.levelData.target}` : ''),
        introDesc: this.levelData.description || this.levelData.storyIntro || '',
      }, () => {
        wx.nextTick(() => {
          this.page.setData({ introReady: true });
        });
      });

      if (this._introOuterTimer) clearTimeout(this._introOuterTimer);
      if (this._introAutoTimer) clearTimeout(this._introAutoTimer);
      this._introOuterTimer = setTimeout(() => {
        this._introOuterTimer = null;
        this._introAutoTimer = setTimeout(() => {
          this._introAutoTimer = null;
          this._finishIntroDismiss(true);
        }, 3600);
      }, 800);
    });
  }

  dismissIntro() {
    if (this._introDismissed) return;
    if (this._introOuterTimer) { clearTimeout(this._introOuterTimer); this._introOuterTimer = null; }
    if (this._introAutoTimer) { clearTimeout(this._introAutoTimer); this._introAutoTimer = null; }
    try { this.page.audioManager.playSFX('click-open'); } catch (err) { /* noop */ }
    this._finishIntroDismiss(false);
  }

  _finishIntroDismiss(auto) {
    if (this._introDismissed || !this.page.data.showIntro) return;
    this._introDismissed = true;
    this.page.setData({ introFadeOut: true, introReady: false });
    setTimeout(() => {
      this.page.setData({ showIntro: false, introFadeOut: false });
      if (this._introResolve) {
        this._introResolve();
        this._introResolve = null;
      }
      if (!this._introSkipOpeningDialogs) {
        this._playLevelDialogs();
      } else if (!this._recipeBookPhaseActive && !this.levelData.isSpecialArea) {
        setTimeout(() => this.flashTargetDisplay(), 400);
      }
      this._scheduleTradeStationTutorialAfterIntro();
      this._introSkipOpeningDialogs = false;
    }, 600);
  }

  _playLevelDialogs() {
    const isRecipePhase = this._recipeBookPhaseActive;
    const discovered = levelManager.currentProgress.discoveredItems || [];
    const alreadyHasBook = discovered.includes('配方书');

    const runOpening = () => {
      const dialogs = this.levelData.dialogs;
      if (!dialogs || !dialogs.length) return Promise.resolve();
      return playLevelDialogs(this.page, dialogs);
    };

    if (isRecipePhase) {
      runOpening().then(() => this._spawnRecipeBookDirectly());
      return;
    }

    if (alreadyHasBook && this.levelData.revisitDialogs?.length) {
      playLevelDialogs(this.page, this.levelData.revisitDialogs);
      return;
    }

    runOpening().then(() => {
      if (!this.levelData.isSpecialArea && !this._recipeBookPhaseActive) {
        setTimeout(() => this.flashTargetDisplay(), 400);
      }
    });
  }


  flashTargetDisplay() {
    this.page.setData({ targetFlash: true, targetPopIn: true });
    setTimeout(() => {
      this.page.setData({ targetFlash: false, targetPopIn: false });
    }, 550);
  }


  async _fillInitialInventory() {
    const names = this.levelData.initialItems || [];
    if (!names.length) {
      this._syncLayout();
      return;
    }

    const inventory = [];
    for (let index = 0; index < names.length; index += 1) {
      if (index > 0) await new Promise((r) => setTimeout(r, APPEAR_INTERVAL));
      const item = this._makeItem(names[index], 0, 0, true);
      item.popPhase = 'hold';
      inventory.push(item);
      this.page.setData({ inventoryItems: [...inventory] }, () => {
        if (typeof this.page.syncGameLayout === 'function') {
          this.page.syncGameLayout(undefined, inventory.length);
        }
      });
      await frameDelay(32);
      inventory[index] = { ...inventory[index], popPhase: 'in' };
      this.page.setData({ inventoryItems: [...inventory] });
    }
    await new Promise((r) => setTimeout(r, APPEAR_DURATION));
    this._syncLayout();
    this._initTradeStations();
  }
























  measureRects(synthesisRect, doorRect, inventoryRect) {
    this.synthesisRect = synthesisRect;
    this.doorRect = doorRect;
    this.inventoryRect = inventoryRect;
    if (this._pendingTradeStationInit) {
      this._initTradeStations();
    } else if (this.tradeStation?.stations?.length) {
      this.tradeStation.relayout(this.levelId);
    }
  }

  _syncLayout() {
    if (!this.page.syncGameLayout) return;
    wx.nextTick(() => {
      this.page.syncGameLayout();
      if (typeof this.page._measureGameRects === 'function') {
        setTimeout(() => this.page._measureGameRects(), 80);
      }
    });
  }














































  _shouldShowBasicCompletion() {
    return this.levelId === 104
      && !this._inChapterFlow
      && !levelManager.hasClaimedBasicReward();
  }

  hasNextObjective() {
    if (!this.chapterData || this.levelData.objectiveIndex == null) return false;
    return this.levelData.objectiveIndex < this.chapterData.objectives.length - 1;
  }

  getNextObjectiveLevelId() {
    if (!this.hasNextObjective()) return null;
    return this.chapterData.objectives[this.levelData.objectiveIndex + 1];
  }

  getTransitionText() {
    if (!this.chapterData?.transitionTexts) return '';
    return this.chapterData.transitionTexts[this.levelData.objectiveIndex] || '';
  }

  _performChapterTransition() {
    runChapterTransition(this).catch(() => {
      this.offeringInProgress = false;
      this.isTransitioning = false;
    });
  }

  async _completeLevelFlow() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.targetReady = false;
    this.offeringInProgress = false;

    levelManager.recordSynthCount(this.levelId, this.synthCount);
    const gemAwarded = levelManager.completeLevel(this.levelId);
    if (gemAwarded && typeof this.page.showGemReward === 'function') {
      await this.page.showGemReward(50);
    }
    if (levelManager.refreshAtlasUnlocks()) {
      levelManager.saveProgress();
    }

    if (this.levelId === 106) {
      const dialogs = this.levelData.completionDialogs;
      if (dialogs?.length) {
        await playLevelDialogs(this.page, dialogs);
      }
      this.page.setData({ endingVisible: true, successVisible: false });
      wx.setStorageSync('chapter1_main_entrance', '1');
      return;
    }

    if (this._shouldShowBasicCompletion()) {
      this._showBasicCompletionScreen();
      return;
    }

    this.isTransitioning = false;
    const worldId = this.levelData?.worldId || 1;
    navigateBackWithFade(`/pages/levels/levels?world=${worldId}`);
  }

  dismissSuccess() {
    this.isTransitioning = false;
    this.page.setData({ successVisible: false });
    const worldId = this.levelData?.worldId || 1;
    navigateBackWithFade(`/pages/levels/levels?world=${worldId}`);
  }

  dismissEnding() {
    this.page.setData({ endingVisible: false });
    levelManager.markChapterPhaseSettlementSeen();
    navigateHomeWithFade('/pages/index/index');
  }

  _showToast(msg) {
    this.page.setData({ toastMessage: msg });
    setTimeout(() => {
      if (this.page.data.toastMessage === msg) {
        this.page.setData({ toastMessage: '' });
      }
    }, 2200);
  }

  destroy() {
    Object.keys(this.brewTimers).forEach((id) => this._clearBrewTimer(id));
    try { this.page.audioManager.stopSFXLoop('timer-tick'); } catch (err) { /* noop */ }
    if (this.tradeStation) this.tradeStation.destroy();
    this._offerQueue = [];
    this._clearLvl104DualHints();
    if (typeof this._clearRecipeBookAttentionTimer === 'function') {
      this._clearRecipeBookAttentionTimer();
    }
    if (this._introOuterTimer) clearTimeout(this._introOuterTimer);
    if (this._introAutoTimer) clearTimeout(this._introAutoTimer);
  }
}

Object.assign(GameController.prototype, dragMixin);
Object.assign(GameController.prototype, doorMixin);
Object.assign(GameController.prototype, synthesisFlowMixin);
Object.assign(GameController.prototype, brewingMixin);
Object.assign(GameController.prototype, inventoryMixin);
Object.assign(GameController.prototype, recipeBookMixin);
Object.assign(GameController.prototype, completionMixin);

module.exports = GameController;
