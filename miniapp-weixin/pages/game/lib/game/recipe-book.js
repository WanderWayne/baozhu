/** @feature recipe-book @see docs/features/recipe-book.md */
const levelManager = require('../../../../utils/level-manager');
const tutorialGuide = require('../../../../utils/tutorial-guide');
const { getRecipeBookPageData } = require('../game-recipe-book');
const { ITEM_SIZE_PX } = require('./constants');

module.exports = {
  showRecipeBookButton: function() {
    if (this.page.data.recipeBookBtnVisible) return;
    this.page.setData({
      recipeBookBtnVisible: true,
      recipeBookBtnPulse: true,
    });
    if (!tutorialGuide.hasSeen('tut_recipeBookBtn')) {
      tutorialGuide.markSeen('tut_recipeBookBtn');
      setTimeout(() => {
        tutorialGuide.show(this.page, {
          targetSelector: '#recipe-book-btn',
          text: '点击这里查看配方书',
          position: 'bottom',
          padding: 8,
          borderRadius: 20,
          shape: 'roundRect',
        });
      }, 600);
    }
  },

  _clearRecipeBookAttentionTimer: function() {
    if (this._recipeBookAttentionTimer) {
      clearTimeout(this._recipeBookAttentionTimer);
      this._recipeBookAttentionTimer = null;
    }
  },

  _isRecipeBookPositiveProgress: function(itemName) {
    if (this.levelId !== 104 || !this.levelData?.doorTriggers) return false;
    return Object.values(this.levelData.doorTriggers).some((list) => (
      Array.isArray(list) && list.includes(itemName)
    ));
  },

  _scheduleRecipeBookAttention: function() {
    this._clearRecipeBookAttentionTimer();
    if (this.levelId !== 104) return;
    if (!this.page.data.recipeBookBtnVisible) return;
    if (this.page.data.recipeBookOverlayVisible) return;
    if (this.completedTargetItems?.has(this.levelData?.target)) return;
    this.page.setData({ recipeBookNudge: false });
    this._recipeBookAttentionTimer = setTimeout(() => {
      if (this.levelId !== 104) return;
      if (!this.page.data.recipeBookBtnVisible || this.page.data.recipeBookOverlayVisible) return;
      if (this.completedTargetItems?.has(this.levelData?.target)) return;
      this.page.setData({ recipeBookNudge: true });
    }, 7000);
  },

  _markRecipeBookPositiveProgress: function(itemName) {
    if (!this._isRecipeBookPositiveProgress(itemName)) return;
    this.page.setData({ recipeBookNudge: false });
    if (itemName !== this.levelData?.target) {
      this._scheduleRecipeBookAttention();
    } else {
      this._clearRecipeBookAttentionTimer();
    }
  },

  openRecipeBook: function() {
    if (this.page.data.recipeBookOverlayVisible) return;
    this._clearRecipeBookAttentionTimer();
    try { this.page.audioManager.playSFX('recipe-book'); } catch (err) { /* noop */ }
    const discovered = levelManager.currentProgress.discoveredItems || [];
    this.page.setData({
      recipeBookOverlayVisible: true,
      recipeBookBtnPulse: false,
      recipeBookNudge: false,
      ...getRecipeBookPageData(
        this.page.data.recipeBookSearch || '',
        discovered,
      ),
    });
  },

  closeRecipeBook: function() {
    try { this.page.audioManager.playSFX('recipe-book'); } catch (err) { /* noop */ }
    this.page.setData({ recipeBookOverlayVisible: false });
    this._scheduleRecipeBookAttention();
  },

  onRecipeBookSearch: function(query) {
    const discovered = levelManager.currentProgress.discoveredItems || [];
    this.page.setData(getRecipeBookPageData(
      query,
      discovered,
    ));
  },

  _spawnRecipeBookDirectly: function() {
    const place = () => {
      const rect = this.synthesisRect;
      const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      const winH = info.windowHeight || 667;
      let cx = 120;
      let cy = 140;
      if (rect && rect.width && rect.height) {
        cx = rect.width / 2 - ITEM_SIZE_PX / 2;
        const screenCenterY = winH * 0.5 - rect.top;
        cy = Math.min(
          rect.height - ITEM_SIZE_PX - 8,
          Math.max(8, screenCenterY - ITEM_SIZE_PX / 2),
        );
      }
      const item = this._makeItem('配方书', cx, cy, false);
      item.recipeBookSpawn = true;
      this.page.setData({
        workshopItems: [...(this.page.data.workshopItems || []), item],
      });
      levelManager.discoverItem('配方书');

      if (!tutorialGuide.hasSeen('tut_recipeBook')) {
        tutorialGuide.markSeen('tut_recipeBook');
        setTimeout(() => {
          tutorialGuide.show(this.page, {
            targetSelector: '.game-item.recipe-book-spawn',
            text: '发蓝光的物品拥有特殊能力\n长按它来激活',
            position: 'bottom',
            padding: 10,
            borderRadius: 50,
            shape: 'circle',
          });
        }, 800);
      }
    };

    if (this.synthesisRect?.width) {
      place();
    } else {
      wx.nextTick(() => {
        setTimeout(place, 200);
      });
    }
  },

  _revealRecipeBookPhase2: function() {
    this._recipeBookPhaseActive = false;

    if (this.tradeStation) {
      this.tradeStation.destroy();
    }
    this.page.setData({
      tradeStationViews: [],
      tradeStationMode: false,
      tradeStations: this.levelData.tradeStations || [],
      doorStarEntering: true,
      targetHidden: false,
    });

    setTimeout(() => {
      this.page.setData({
        doorStarEntering: false,
        targetPopIn: true,
        ...this._levelTargetIcon(this.levelData),
        levelTarget: this.levelData.target,
      });
      setTimeout(() => {
        this.page.setData({ targetPopIn: false });
        this.flashTargetDisplay();
      }, 550);
      this._fillInitialInventory().then(() => {
        this._initTradeStations();
        this._scheduleRecipeBookAttention();
      });
    }, 600);
  }
};
