// 游戏核心控制器（小程序 touch 版，对齐 H5 101–104）
const synthesisEngine = require('./synthesis-engine');
const levelManager = require('./level-manager');
const { getItemMeta } = require('./game-item-style');
const { getRecipeBookPageData } = require('./game-recipe-book');
const { showDialog, showDoorBubble, showTriggerDialog, playLevelDialogs } = require('./door-dialog');
const { runChapterTransition } = require('./game-chapter-transition');
const { navigateBackWithFade } = require('./page-transitions');
const { frameDelay } = require('./inventory-pop-animation');

const ITEM_SIZE_PX = 85;
const COLLISION_PX = 65;
const DRAG_THRESHOLD_PX = 10;
const OFFER_ANIM_MS = 550;
const APPEAR_INTERVAL = 300;
const APPEAR_DURATION = 1900;

let uid = 0;
function nextId() {
  uid += 1;
  return `item_${uid}_${Date.now()}`;
}

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
    this.brewTimers = {};
    this.brewDragState = null;
    this._offerQueue = [];
    this.dragState = null;
    this._introOuterTimer = null;
    this._recipeBookPhaseActive = false;
    this._firedTriggers = new Set();
    this._inChapterFlow = false;
    this._lvl104AwaitDual = false;
    this._lvl104DualHintTimer = null;
    this._doorClickCooldown = 0;
    this._doorClickChatIdx = 0;
    this.synthesizedItems = new Set();
    this.synthesisRect = null;
    this.doorRect = null;
    this.inventoryRect = null;
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
      levelCompletePopVisible: false,
      levelCompletePopText: '',
      targetHidden: false,
      targetPopIn: false,
      targetFlash: false,
      tradeRowHidden: false,
      foamParticles: [],
      introFadeOut: false,
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
    this._offerQueue = [];

    const discovered = levelManager.currentProgress.discoveredItems || [];
    const alreadyHasBook = discovered.includes('配方书');
    this._recipeBookPhaseActive = !!(
      levelData.recipeBookPhase
      && !alreadyHasBook
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

    if (!this._recipeBookPhaseActive) {
      (levelData.workbenchInitialItems || []).forEach((name, i) => {
        workshop.push(this._makeItem(name, 40 + i * 90, 80, false));
      });
    }

    const multiTargets = levelData.multiTarget ? (levelData.multiTargets || []) : [];
    const showRecipeBtn = !!levelData.recipeBookPhase && alreadyHasBook && !this._recipeBookPhaseActive;
    const recipeBookData = getRecipeBookPageData(
      'recorded',
      '',
      discovered,
    );

    this.page.setData({
      levelId: levelData.id,
      levelName: levelData.name,
      levelTarget: levelData.target,
      levelIcon: levelData.icon || '🍨',
      doorStage: 0,
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
    }, () => this._syncLayout());
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
      if (!this._introFromTransition) {
        this._playLevelDialogs();
      } else if (!this._recipeBookPhaseActive && !this.levelData.isSpecialArea) {
        setTimeout(() => this.flashTargetDisplay(), 400);
      }
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

  _spawnRecipeBookDirectly() {
    const rect = this.synthesisRect;
    const cx = rect ? Math.max(20, rect.width / 2 - ITEM_SIZE_PX / 2) : 120;
    const cy = rect ? Math.max(40, rect.height * 0.42 - ITEM_SIZE_PX / 2) : 100;
    const item = this._makeItem('配方书', cx, cy, false);
    item.recipeBookSpawn = true;
    this.page.setData({
      workshopItems: [...(this.page.data.workshopItems || []), item],
    });
    levelManager.discoverItem('配方书');
  }

  flashTargetDisplay() {
    this.page.setData({ targetFlash: true, targetPopIn: true });
    setTimeout(() => {
      this.page.setData({ targetFlash: false, targetPopIn: false });
    }, 550);
  }

  _revealRecipeBookPhase2() {
    this._recipeBookPhaseActive = false;
    this.page.setData({
      targetHidden: false,
      targetPopIn: true,
      targetFlash: false,
      tradeStations: this.levelData.tradeStations || [],
    });
    setTimeout(() => {
      this.page.setData({ targetPopIn: false });
      this.flashTargetDisplay();
    }, 500);
    this._fillInitialInventory();
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
  }

  showRecipeBookButton() {
    if (this.page.data.recipeBookBtnVisible) return;
    this.page.setData({
      recipeBookBtnVisible: true,
      recipeBookBtnPulse: true,
    });
  }

  openRecipeBook() {
    if (this.page.data.recipeBookOverlayVisible) return;
    try { this.page.audioManager.playSFX('recipe-book'); } catch (err) { /* noop */ }
    const discovered = levelManager.currentProgress.discoveredItems || [];
    this.page.setData({
      recipeBookOverlayVisible: true,
      recipeBookBtnPulse: false,
      ...getRecipeBookPageData(
        this.page.data.recipeBookTab || 'recorded',
        this.page.data.recipeBookSearch || '',
        discovered,
      ),
    });
  }

  closeRecipeBook() {
    try { this.page.audioManager.playSFX('recipe-book'); } catch (err) { /* noop */ }
    this.page.setData({ recipeBookOverlayVisible: false });
  }

  onRecipeBookTabChange(tab) {
    try { this.page.audioManager.playSFX('recipe-tab'); } catch (err) { /* noop */ }
    const discovered = levelManager.currentProgress.discoveredItems || [];
    this.page.setData(getRecipeBookPageData(
      tab,
      this.page.data.recipeBookSearch || '',
      discovered,
    ));
  }

  onRecipeBookSearch(query) {
    const discovered = levelManager.currentProgress.discoveredItems || [];
    this.page.setData(getRecipeBookPageData(
      this.page.data.recipeBookTab || 'recorded',
      query,
      discovered,
    ));
  }

  onWorkshopLongPress(e) {
    if (this._dragBlocked() || this.isTransitioning) return;
    const { id } = e.currentTarget.dataset;
    const item = (this.page.data.workshopItems || []).find((i) => i.id === id);
    if (!item || item.name !== '配方书') return;
    this.activateRecipeBook(id);
  }

  activateRecipeBook(itemId) {
    this.showRecipeBookButton();
    const items = (this.page.data.workshopItems || []).filter((i) => i.id !== itemId);
    const item = (this.page.data.workshopItems || []).find((i) => i.id === itemId);
    if (!item) return;

    const startX = this.synthesisRect
      ? this.synthesisRect.left + item.x + ITEM_SIZE_PX / 2
      : item.x + ITEM_SIZE_PX / 2;
    const startY = this.synthesisRect
      ? this.synthesisRect.top + item.y + ITEM_SIZE_PX / 2
      : item.y + ITEM_SIZE_PX / 2;

    this.page.setData({
      workshopItems: items,
      recipeBookFlyer: {
        visible: true,
        animating: false,
        x: startX - ITEM_SIZE_PX / 2,
        y: startY - ITEM_SIZE_PX / 2,
        scale: 1,
        opacity: 1,
        icon: item.icon,
        name: item.name,
        itemType: item.itemType,
        tone: item.tone || '',
      },
    });

    setTimeout(() => {
      const query = wx.createSelectorQuery().in(this.page);
      query.select('#recipe-book-btn').boundingClientRect();
      query.exec((res) => {
        const btnRect = res[0];
        const targetX = btnRect
          ? btnRect.left + btnRect.width / 2 - ITEM_SIZE_PX / 2
          : startX;
        const targetY = btnRect
          ? btnRect.top + btnRect.height / 2 - ITEM_SIZE_PX / 2
          : startY - 120;

        wx.nextTick(() => {
          this.page.setData({
            recipeBookFlyer: {
              ...this.page.data.recipeBookFlyer,
              animating: true,
              x: targetX,
              y: targetY,
              scale: 0.2,
              opacity: 0,
            },
            recipeBookBtnFlash: true,
          });
        });

        setTimeout(() => {
          this.page.setData({
            recipeBookFlyer: { visible: false },
            recipeBookBtnFlash: false,
          });
          showDoorBubble(this.page, '点开配方书看看吧');
          if (this._recipeBookPhaseActive) {
            setTimeout(() => this._revealRecipeBookPhase2(), 400);
          }
        }, 850);
      });
    }, 500);
  }

  onDoorTap() {
    if (this.isTransitioning || this.page.data.showIntro) return;
    const now = Date.now();
    if (now - this._doorClickCooldown < 4000) return;
    this._doorClickCooldown = now;
    this._showDoorClickLine();
  }

  _doorClickLines = {
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
      chat: ['...', '花挑错了可不行。', '别浪费珠宝。'],
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

  _showDoorClickLine() {
    const lines = this._doorClickLines[this.levelId] || this._doorClickLines._default;
    const pool = [...lines.hints, ...lines.chat];
    if (!pool.length) return;
    const idx = this._doorClickChatIdx % pool.length;
    this._doorClickChatIdx += 1;
    showDoorBubble(this.page, pool[idx]);
  }

  _clearLvl104DualHints() {
    if (this._lvl104DualHintTimer) {
      clearTimeout(this._lvl104DualHintTimer);
      this._lvl104DualHintTimer = null;
    }
    this._lvl104AwaitDual = false;
  }

  _scheduleLvl104DualCheeseHints() {
    if (this.levelId !== 104 || !this._lvl104AwaitDual) return;
    if (this.synthesizedItems.has('双酪')) {
      this._clearLvl104DualHints();
      return;
    }
    if (this._lvl104DualHintTimer) clearTimeout(this._lvl104DualHintTimer);
    this._lvl104DualHintTimer = setTimeout(() => {
      this._lvl104DualHintTimer = null;
      if (this.levelId !== 104 || !this._lvl104AwaitDual) return;
      if (this.synthesizedItems.has('双酪')) {
        this._clearLvl104DualHints();
        return;
      }
      showTriggerDialog(this.page, '双酪到底是什么呢...');
      this._scheduleLvl104DualCheeseHints();
    }, 10000);
  }

  _chapterSynthHooksAfterSuccess(resultName) {
    if (this.levelId === 104) {
      if (resultName === '雪酪') {
        this._lvl104AwaitDual = true;
      }
      if (resultName === '双酪') {
        this._clearLvl104DualHints();
      } else if (this._lvl104AwaitDual) {
        this._scheduleLvl104DualCheeseHints();
      }
    }
  }

  _chapterSynthHooksAfterFailedAttempt() {
    if (this.levelId === 104 && this._lvl104AwaitDual) {
      this._scheduleLvl104DualCheeseHints();
    }
  }

  _showBasicCompletionScreen() {
    const elapsed = levelManager.getBasicLevelElapsedTime();
    const speedRating = levelManager.getSpeedRating(elapsed);
    const currentTitle = levelManager.getCurrentTitle();
    this.page.setData({
      basicCompletionVisible: true,
      basicCompletionPhase: 'stats',
      basicCompletionTime: levelManager.formatElapsedTime(elapsed),
      basicCompletionProgress: levelManager.getExplorationProgress(),
      basicSpeedIcon: speedRating.icon,
      basicSpeedName: speedRating.name,
      basicSpeedTier: speedRating.tier,
      basicOldTitleIcon: currentTitle.icon,
      basicOldTitleName: currentTitle.name,
      basicNewTitleIcon: '',
      basicNewTitleName: '',
    });
  }

  claimBasicReward() {
    try { this.page.audioManager.playClickOpen(); } catch (err) { /* noop */ }
    const newTitle = levelManager.upgradeTitle();
    this.page.setData({
      basicCompletionPhase: 'reward',
      basicNewTitleIcon: newTitle.icon,
      basicNewTitleName: newTitle.name,
    });
    setTimeout(() => {
      this.page.setData({ basicCompletionPhase: 'continue' });
    }, 800);
  }

  finishBasicCompletionRest() {
    try { this.page.audioManager.playClickExit(); } catch (err) { /* noop */ }
    levelManager.claimBasicReward();
    this.isTransitioning = false;
    this.page.setData({ basicCompletionVisible: false });
    const worldId = this.levelData?.worldId || 1;
    navigateBackWithFade(`/pages/levels/levels?world=${worldId}`);
  }

  finishBasicCompletionExplore() {
    try { this.page.audioManager.playClickOpen(); } catch (err) { /* noop */ }
    levelManager.claimBasicReward();
    this.isTransitioning = false;
    this.page.setData({ basicCompletionVisible: false });
    const worldId = this.levelData?.worldId || 1;
    navigateBackWithFade(`/pages/levels/levels?world=${worldId}`);
  }

  measureRects(synthesisRect, doorRect, inventoryRect) {
    this.synthesisRect = synthesisRect;
    this.doorRect = doorRect;
    this.inventoryRect = inventoryRect;
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

  _dragBlocked() {
    return this.isTransitioning
      || this.offeringInProgress
      || this.page.data.showIntro;
    // brewing 不锁定全局：倒计时期间仍可拖动其它物品（对齐 H5 行为）
  }

  onInventoryTouchStart(e) {
    if (this._dragBlocked()) return;
    const { id } = e.currentTarget.dataset;
    const item = this.page.data.inventoryItems.find((i) => i.id === id);
    if (!item || item.hidden || item.placeholder) return;
    const touch = e.touches[0];
    this.dragState = {
      fromInventory: true,
      id,
      startX: touch.clientX,
      startY: touch.clientY,
      active: false,
    };
  }

  onInventoryTouchMove(e) {
    this._handleInventoryDragMove(e);
  }

  onPageTouchMove(e) {
    if (!this.dragState?.fromInventory) return;
    this._handleInventoryDragMove(e);
  }

  _handleInventoryDragMove(e) {
    if (!this.dragState?.fromInventory) return;
    const touch = e.touches[0];
    const dx = touch.clientX - this.dragState.startX;
    const dy = touch.clientY - this.dragState.startY;
    if (!this.dragState.active) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
      this.dragState.active = true;
      const inv = this.page.data.inventoryItems.map((i) => (
        i.id === this.dragState.id ? { ...i, placeholder: true } : i
      ));
      this.page.setData({ inventoryItems: inv });
      try { this.page.audioManager.playSFX('pickup'); } catch (err) { /* noop */ }
    }
    const item = this.page.data.inventoryItems.find((i) => i.id === this.dragState.id);
    if (!item) return;
    this.page.setData({
      dragGhost: {
        visible: true,
        x: touch.clientX,
        y: touch.clientY,
        icon: item.icon,
        name: item.name,
        itemType: item.itemType,
        tone: item.tone || '',
      },
    });
  }

  onInventoryTouchEnd(e) {
    this._finishInventoryDrag(e);
  }

  onPageTouchEnd(e) {
    if (this.dragState?.fromInventory) this._finishInventoryDrag(e);
  }

  _finishInventoryDrag(e) {
    if (!this.dragState?.fromInventory) return;
    const touch = e.changedTouches[0];
    const { id, active } = this.dragState;
    this.dragState = null;
    this.page.setData({
      dragGhost: { visible: false, x: 0, y: 0, icon: '', name: '', itemType: 'base', tone: '' },
    });

    const inv = [...this.page.data.inventoryItems];
    const srcIdx = inv.findIndex((i) => i.id === id);
    if (srcIdx < 0) return;
    const src = inv[srcIdx];

    const restoreInventorySlot = (withAppear) => {
      inv[srcIdx] = {
        ...inv[srcIdx],
        placeholder: false,
        hidden: false,
        appearing: !!withAppear,
      };
    };

    if (!active) {
      this._spawnFromInventory(src, this._defaultWorkshopPos());
      restoreInventorySlot(true);
      this.page.setData({ inventoryItems: inv }, () => this._syncLayout());
      try { this.page.audioManager.playSFX('pickup'); } catch (err) { /* noop */ }
      return;
    }

    const { clientX: cx, clientY: cy } = touch;

    if (this._isInInventory(cx, cy)) {
      restoreInventorySlot(false);
      this.page.setData({ inventoryItems: inv }, () => this._syncLayout());
      return;
    }

    if (this._isInSynthesisArea(cx, cy)) {
      const pos = this._touchToWorkshop(cx, cy);
      const newId = this._spawnFromInventory(src, pos);
      restoreInventorySlot(true);
      this.page.setData({ inventoryItems: inv }, () => this._syncLayout());
      try { this.page.audioManager.playSFX('drop'); } catch (err) { /* noop */ }
      this._checkWorkshopCollisionFor(newId);
      return;
    }

    restoreInventorySlot(false);
    this.page.setData({ inventoryItems: inv }, () => this._syncLayout());
  }

  _checkWorkshopCollisionFor(itemId) {
    const items = [...this.page.data.workshopItems];
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    const hit = items.find((other) => {
      if (other.id === itemId || other.locked || other.offering) return false;
      return Math.hypot(other.x - item.x, other.y - item.y) < COLLISION_PX;
    });
    if (hit) this._trySynthesis(item, hit, items);
  }

  _spawnFromInventory(src, pos) {
    const workshop = [...this.page.data.workshopItems];
    const newItem = {
      ...src,
      id: nextId(),
      inInventory: false,
      hidden: false,
      placeholder: false,
      appearing: false,
      x: pos.x,
      y: pos.y,
      selected: false,
    };
    workshop.push(newItem);
    this.page.setData({ workshopItems: workshop });
    return newItem.id;
  }

  _defaultWorkshopPos() {
    const n = this.page.data.workshopItems.length;
    return { x: 48 + (n % 3) * 88, y: 120 + Math.floor(n / 3) * 88 };
  }

  _touchToWorkshop(clientX, clientY) {
    if (!this.synthesisRect) return this._defaultWorkshopPos();
    return {
      x: clientX - this.synthesisRect.left - ITEM_SIZE_PX / 2,
      y: clientY - this.synthesisRect.top - ITEM_SIZE_PX / 2,
    };
  }

  _isInInventory(clientX, clientY) {
    if (!this.inventoryRect) return false;
    const r = this.inventoryRect;
    return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
  }

  _isInSynthesisArea(clientX, clientY) {
    if (!this.synthesisRect) return true;
    const r = this.synthesisRect;
    const aboveInventory = this.inventoryRect ? clientY < this.inventoryRect.top : true;
    return (
      aboveInventory
      && clientX >= r.left
      && clientX <= r.right
      && clientY >= r.top
      && clientY <= r.bottom
    );
  }
  onInventoryTap(e) {
    if (this._dragBlocked()) return;
    const { id } = e.currentTarget.dataset;
    const src = this.page.data.inventoryItems.find((i) => i.id === id);
    if (!src || src.hidden || src.placeholder) return;
    this._spawnFromInventory(src, this._defaultWorkshopPos());
    const inv = this.page.data.inventoryItems.map((i) => (
      i.id === id ? { ...i, appearing: true } : i
    ));
    this.page.setData({ inventoryItems: inv }, () => this._syncLayout());
    try { this.page.audioManager.playSFX('pickup'); } catch (err) { /* noop */ }
  }

  onWorkshopTouchStart(e) {
    if (this._dragBlocked()) return;
    const { id } = e.currentTarget.dataset;
    const touch = e.touches[0];
    const items = [...this.page.data.workshopItems];
    const item = items.find((i) => i.id === id);
    if (!item || item.locked || item.offering) return;

    this.dragState = {
      fromInventory: false,
      id,
      startX: touch.clientX,
      startY: touch.clientY,
      originX: item.x,
      originY: item.y,
      active: true,
    };
    item.selected = true;
    item.offeringFlight = false;
    this.page.setData({ workshopItems: items });
  }

  onWorkshopTouchMove(e) {
    if (!this.dragState) return;
    const touch = e.touches[0];
    const dx = touch.clientX - this.dragState.startX;
    const dy = touch.clientY - this.dragState.startY;
    const items = [...this.page.data.workshopItems];
    const item = items.find((i) => i.id === this.dragState.id);
    if (!item) return;
    item.x = this.dragState.originX + dx;
    item.y = this.dragState.originY + dy;
    this.page.setData({ workshopItems: items });
  }

  onWorkshopTouchEnd() {
    if (!this.dragState) return;
    const { id } = this.dragState;
    this.dragState = null;

    const items = [...this.page.data.workshopItems];
    const item = items.find((i) => i.id === id);
    if (!item) return;
    item.selected = false;

    const hit = items.find((other) => {
      if (other.id === id || other.locked) return false;
      const dist = Math.hypot(other.x - item.x, other.y - item.y);
      return dist < COLLISION_PX;
    });

    if (hit) {
      this._trySynthesis(item, hit, items);
    } else {
      this.page.setData({ workshopItems: items });
    }
  }

  onTradeTap(e) {
    const { input, output } = e.currentTarget.dataset;
    const workshop = [...this.page.data.workshopItems];
    const gem = workshop.find((i) => i.name === input && !i.locked);
    if (!gem) {
      this._showToast('需要「珠宝」才能交换');
      return;
    }
    workshop.splice(workshop.indexOf(gem), 1);
    workshop.push(this._makeItem(output, gem.x, gem.y, false));
    this.page.setData({ workshopItems: workshop });
    levelManager.discoverItem(output);
    this._showToast(`换到了 ${output}`);
  }

  _isNearDoor(item) {
    if (!this.synthesisRect || !this.doorRect) return item.y < 80;
    const cx = this.synthesisRect.left + item.x + ITEM_SIZE_PX;
    const cy = this.synthesisRect.top + item.y + ITEM_SIZE_PX;
    const dx = this.doorRect.left + this.doorRect.width / 2;
    const dy = this.doorRect.top + this.doorRect.height / 2;
    return Math.hypot(cx - dx, cy - dy) < 110;
  }

  _doorCenterInWorkshop() {
    if (!this.synthesisRect || !this.doorRect) {
      return { x: 120, y: 20 };
    }
    return {
      x: this.doorRect.left + this.doorRect.width / 2 - this.synthesisRect.left - ITEM_SIZE_PX,
      y: this.doorRect.top + this.doorRect.height / 2 - this.synthesisRect.top - ITEM_SIZE_PX,
    };
  }

  _trySynthesis(item1, item2, items) {
    synthesisEngine.synthesize({ name: item1.name }, { name: item2.name }, (result) => {
      if (result.type === 'failed') {
        this._showToast(result.message);
        try { this.page.audioManager.playSFX('error'); } catch (err) { /* noop */ }
        this._chapterSynthHooksAfterFailedAttempt();
        items.forEach((i) => {
          if (i.id === item1.id || i.id === item2.id) {
            i.selected = false;
            i.shakeAnim = true;
          }
        });
        this.page.setData({ workshopItems: items });
        // shake 动画结束后清 flag
        setTimeout(() => {
          const ws = [...this.page.data.workshopItems];
          let changed = false;
          ws.forEach((i) => { if (i.shakeAnim) { i.shakeAnim = false; changed = true; } });
          if (changed) this.page.setData({ workshopItems: ws });
        }, 500);
        return;
      }

      const idx1 = items.findIndex((i) => i.id === item1.id);
      const idx2 = items.findIndex((i) => i.id === item2.id);
      if (idx1 < 0 || idx2 < 0) return;

      const cx = (item1.x + item2.x) / 2;
      const cy = (item1.y + item2.y) / 2;

      if (result.type === 'timer') {
        items.splice(Math.max(idx1, idx2), 1);
        items.splice(Math.min(idx1, idx2), 1);
        const brewings = [...(this.page.data.brewings || [])];
        const offset = brewings.length * 18;
        const brewing = {
          id: nextId(),
          name: result.result,
          x: cx + offset,
          y: cy + offset,
          secondsLeft: result.duration,
          total: result.duration,
          message: result.message,
          recipe: result.recipe,
        };
        brewings.push(brewing);
        this.page.setData({ workshopItems: items, brewings });
        this._startBrewTimer(brewing.id);
        return;
      }

      this._finishSynthesis(items, idx1, idx2, result, cx, cy);
    });
  }

  _updateBrewing(brewId, patch) {
    const brewings = (this.page.data.brewings || []).map((b) => (
      b.id === brewId ? { ...b, ...patch } : b
    ));
    this.page.setData({ brewings });
  }

  onBrewingTouchStart(e) {
    const { id } = e.currentTarget.dataset;
    const brewing = (this.page.data.brewings || []).find((b) => b.id === id);
    if (!brewing) return;
    const t = e.touches && e.touches[0];
    if (!t) return;
    this.brewDragState = {
      id,
      startX: t.clientX,
      startY: t.clientY,
      originX: brewing.x,
      originY: brewing.y,
    };
    this._updateBrewing(id, { dragging: true });
  }

  onBrewingTouchMove(e) {
    if (!this.brewDragState) return;
    const t = e.touches && e.touches[0];
    if (!t) return;
    const { id, startX, startY, originX, originY } = this.brewDragState;
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    this._updateBrewing(id, {
      x: originX + dx,
      y: originY + dy,
    });
  }

  onBrewingTouchEnd() {
    if (this.brewDragState) {
      this._updateBrewing(this.brewDragState.id, { dragging: false });
    }
    this.brewDragState = null;
  }

  _clearBrewTimer(brewId) {
    if (this.brewTimers[brewId]) {
      clearInterval(this.brewTimers[brewId]);
      delete this.brewTimers[brewId];
    }
  }

  _finishBrewing(brewId) {
    const brewings = [...(this.page.data.brewings || [])];
    const idx = brewings.findIndex((b) => b.id === brewId);
    if (idx < 0) return;
    const b = brewings[idx];
    brewings.splice(idx, 1);
    this._clearBrewTimer(brewId);

    const items = [...this.page.data.workshopItems];
    this.synthCount += 1;
    const newItem = this._makeItem(b.name, b.x, b.y, false);
    const isTarget = this._isTargetItem(b.name);
    newItem.isTarget = isTarget;
    newItem.revealedItem = true;
    if (isTarget) newItem.targetEntry = true;
    items.push(newItem);
    levelManager.discoverItem(b.name);
    this._addToInventoryIfNeeded(b.name);
    if (b.recipe?.ingredients) {
      levelManager.recordCompletionRecipe(this.levelId, b.recipe.ingredients);
    }
    this._updateDoorTriggers(b.name);
    this.page.setData({ brewings, workshopItems: items });
    if (b.message && !isTarget) this._showToast(b.message);
    try { this.page.audioManager.playSFX(isTarget ? 'craft-target' : 'craft-normal'); } catch (err) { /* noop */ }
    setTimeout(() => {
      const ws = [...this.page.data.workshopItems];
      const ri = ws.findIndex((i) => i.id === newItem.id);
      if (ri >= 0) { ws[ri] = { ...ws[ri], revealedItem: false }; this.page.setData({ workshopItems: ws }); }
    }, 600);
    if (isTarget) {
      setTimeout(() => {
        const ws2 = [...this.page.data.workshopItems];
        const ri2 = ws2.findIndex((i) => i.id === newItem.id);
        if (ri2 >= 0) { ws2[ri2] = { ...ws2[ri2], targetEntry: false }; this.page.setData({ workshopItems: ws2 }); }
      }, 1200);
    }
    this._onItemSynthesized(b.name, newItem.id);
  }

  _startBrewTimer(brewId) {
    this._clearBrewTimer(brewId);
    this.brewTimers[brewId] = setInterval(() => {
      const brewings = [...(this.page.data.brewings || [])];
      const idx = brewings.findIndex((b) => b.id === brewId);
      if (idx < 0) {
        this._clearBrewTimer(brewId);
        return;
      }
      const b = { ...brewings[idx] };
      b.secondsLeft -= 1;
      if (b.secondsLeft <= 0) {
        this._finishBrewing(brewId);
      } else {
        brewings[idx] = b;
        this.page.setData({ brewings });
      }
    }, 1000);
  }

  _finishSynthesis(items, idx1, idx2, result, cx, cy) {
    items.splice(Math.max(idx1, idx2), 1);
    items.splice(Math.min(idx1, idx2), 1);

    this.synthCount += 1;
    const newItem = this._makeItem(result.result, cx, cy, false);
    const isTarget = this._isTargetItem(result.result);
    newItem.isTarget = isTarget;
    newItem.synthesisAnim = true;
    if (isTarget) newItem.targetEntry = true;  // 两阶段：入场弹出
    items.push(newItem);

    levelManager.discoverItem(result.result);
    this._addToInventoryIfNeeded(result.result);

    if (result.recipe?.ingredients) {
      levelManager.recordCompletionRecipe(this.levelId, result.recipe.ingredients);
    }

    this._updateDoorTriggers(result.result);

    // 生成飞溅粒子（10 个，随机方向）
    const particles = [];
    for (let i = 0; i < 10; i += 1) {
      const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 35 + Math.random() * 30;
      const size = 5 + Math.random() * 7;
      particles.push({
        id: `p${i}`,
        tx: Math.round(Math.cos(angle) * dist),
        ty: Math.round(Math.sin(angle) * dist),
        size: Math.round(size),
        cx: Math.round(cx),
        cy: Math.round(cy),
      });
    }
    this.page.setData({ workshopItems: items, synthParticles: particles });

    if (result.message && !isTarget) this._showToast(result.message);
    try { this.page.audioManager.playSFX(isTarget ? 'craft-target' : 'craft-normal'); } catch (err) { /* noop */ }

    // 合成弹出结束后清 synthesisAnim
    setTimeout(() => {
      const ws = [...this.page.data.workshopItems];
      const idx = ws.findIndex((i) => i.id === newItem.id);
      if (idx >= 0) {
        ws[idx] = { ...ws[idx], synthesisAnim: false };
        this.page.setData({ workshopItems: ws });
      }
    }, 700);
    // 目标物：1200ms 后 targetEntry 结束，切换为 targetBreathe 呼吸循环
    if (isTarget) {
      setTimeout(() => {
        const ws2 = [...this.page.data.workshopItems];
        const idx2 = ws2.findIndex((i) => i.id === newItem.id);
        if (idx2 >= 0) {
          ws2[idx2] = { ...ws2[idx2], targetEntry: false };
          this.page.setData({ workshopItems: ws2 });
        }
      }, 1200);
    }
    setTimeout(() => this.page.setData({ synthParticles: [] }), 1500);

    this._onItemSynthesized(result.result, newItem.id);
  }

  _onItemSynthesized(itemName, itemId) {
    this.synthesizedItems.add(itemName);
    this._checkTriggerDialogs('onSynthesize', itemName);
    this._chapterSynthHooksAfterSuccess(itemName);
    this._checkLevelCompletion(itemName, itemId);
  }

  _checkTriggerDialogs(event, itemName) {
    const triggers = this.levelData.triggerDialogs;
    if (!triggers) return;

    let lines = null;
    let triggerKey = '';

    if (event === 'onSynthesize' && triggers.onSynthesize?.[itemName]) {
      triggerKey = `synth_${itemName}`;
      lines = triggers.onSynthesize[itemName];
    }

    if (!lines || this._firedTriggers.has(triggerKey)) return;
    this._firedTriggers.add(triggerKey);

    lines.forEach((line) => {
      if (line?.text) showTriggerDialog(this.page, line.text);
    });
  }

  _isTargetItem(name) {
    if (this.levelData.multiTarget && this.levelData.multiTargets) {
      return this.levelData.multiTargets.includes(name);
    }
    return name === this.levelData.target;
  }

  _buildMultiTargetRows(targets, completed) {
    return (targets || []).map((name, i) => ({
      name,
      num: i + 1,
      done: completed.includes(name),
    }));
  }

  _addToInventoryIfNeeded(name) {
    const inv = [...this.page.data.inventoryItems];
    const exists = inv.some((i) => i.name === name);
    if (exists) return;
    inv.push({ ...this._makeItem(name, 0, 0, true), hidden: false });
    this.page.setData({ inventoryItems: inv }, () => this._syncLayout());
  }

  _updateDoorTriggers(itemName) {
    if (!this.levelData.doorTriggers) return;
    for (const [stage, triggers] of Object.entries(this.levelData.doorTriggers)) {
      if (triggers.includes(itemName) && !this.discoveredTriggers.has(itemName)) {
        this.discoveredTriggers.add(itemName);
        const stageNum = parseInt(stage.replace('stage', ''), 10);
        if (stageNum > this.doorStage) {
          this.doorStage = stageNum;
          this.page.setData({ doorStage: stageNum });
        }
      }
    }
  }

  _checkLevelCompletion(itemName, itemId) {
    if (this.levelData.multiTarget && this.levelData.multiTargets) {
      if (!this.levelData.multiTargets.includes(itemName)) return;
      if (this.multiCompleted.includes(itemName)) return;
      this.multiCompleted.push(itemName);
      const multiCompleted = [...this.multiCompleted];
      const items = this.page.data.workshopItems.map((i) => (
        i.id === itemId ? { ...i, isTarget: true } : i
      ));
      this.page.setData({
        multiCompleted,
        multiTargetRows: this._buildMultiTargetRows(this.levelData.multiTargets, multiCompleted),
        workshopItems: items,
      });
      // 每合成一个目标就献门一次（等入场动画结束）
      setTimeout(() => this._queueOfferToDoor(itemId), 1200);
      return;
    }

    if (itemName !== this.levelData.target) return;

    this.targetReady = true;
    this.doorStage = 3;
    const items = this.page.data.workshopItems.map((i) => (
      i.id === itemId ? { ...i, isTarget: true } : i
    ));
    this.page.setData({ targetReady: true, doorStage: 3, workshopItems: items });
    setTimeout(() => this._queueOfferToDoor(itemId), 1200);
  }

  _queueOfferToDoor(itemId) {
    this._offerQueue.push(itemId);
    this._processOfferQueue();
  }

  _processOfferQueue() {
    if (this.offeringInProgress || this.isTransitioning) return;
    while (this._offerQueue.length) {
      const itemId = this._offerQueue[0];
      const item = (this.page.data.workshopItems || []).find((i) => i.id === itemId);
      if (!item) {
        this._offerQueue.shift();
        continue;
      }
      this._offerQueue.shift();
      this._autoOfferToDoor(itemId);
      return;
    }
  }

  _autoOfferToDoor(itemId) {
    if (this.offeringInProgress || this.isTransitioning) return;

    const items = [...this.page.data.workshopItems];
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    this.offeringInProgress = true;
    this.targetReady = false;
    const dest = this._doorCenterInWorkshop();

    item.isTarget = true;
    item.offering = true;
    item.offeringFlight = true;
    const startX = item.x;
    const startY = item.y;
    item.x = dest.x;
    item.y = dest.y;

    // 生成飞行轨迹粒子
    const trails = [];
    for (let i = 0; i < 10; i += 1) {
      const t = i / 10;
      trails.push({
        id: `t${i}`,
        x: Math.round(startX + (dest.x - startX) * t + (Math.random() - 0.5) * 12),
        y: Math.round(startY + (dest.y - startY) * t + (Math.random() - 0.5) * 12),
        size: Math.round(4 + Math.random() * 5),
        delay: parseFloat((i * 0.04).toFixed(2)),
      });
    }

    this.page.setData({
      workshopItems: items,
      doorOffering: true,
      targetReady: false,
      trailParticles: trails,
    });
    setTimeout(() => this.page.setData({ trailParticles: [] }), OFFER_ANIM_MS + 300);

    setTimeout(() => this._performOffering(itemId), OFFER_ANIM_MS);
  }

  _performOffering(itemId) {
    const items = this.page.data.workshopItems.filter((i) => i.id !== itemId);
    this.page.setData({
      workshopItems: items,
      doorOffering: false,
      targetReady: false,
    });

    try { this.page.audioManager.playSFX('door-absorb'); } catch (err) { /* noop */ }

    this.offeringInProgress = false;

    if (this.levelData.multiTarget && this.levelData.multiTargets) {
      const allDone = this.multiCompleted.length >= this.levelData.multiTargets.length;
      if (allDone) {
        this.targetReady = true;
        this.doorStage = 3;
        this.page.setData({ targetReady: true, doorStage: 3 });
        if (this.hasNextObjective() && this._inChapterFlow) {
          levelManager.recordSynthCount(this.levelId, this.synthCount);
          this._performChapterTransition();
          return;
        }
        this._completeLevelFlow();
        return;
      }
      this._processOfferQueue();
      return;
    }

    if (this.hasNextObjective() && this._inChapterFlow) {
      levelManager.recordSynthCount(this.levelId, this.synthCount);
      this._performChapterTransition();
      return;
    }

    this._completeLevelFlow();
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

  _completeLevelFlow() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.targetReady = false;
    this.offeringInProgress = false;

    levelManager.recordSynthCount(this.levelId, this.synthCount);
    levelManager.completeLevel(this.levelId);

    if (this.levelId === 106) {
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
    wx.reLaunch({ url: '/pages/index/index' });
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
    this._offerQueue = [];
    this._clearLvl104DualHints();
    if (this._introOuterTimer) clearTimeout(this._introOuterTimer);
    if (this._introAutoTimer) clearTimeout(this._introAutoTimer);
  }
}

module.exports = GameController;
