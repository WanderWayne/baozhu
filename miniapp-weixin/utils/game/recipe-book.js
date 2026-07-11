/** @feature recipe-book @see docs/features/recipe-book.md */
const levelManager = require('../level-manager');
const tutorialGuide = require('../tutorial-guide');
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

  openRecipeBook: function() {
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
  },

  closeRecipeBook: function() {
    try { this.page.audioManager.playSFX('recipe-book'); } catch (err) { /* noop */ }
    this.page.setData({ recipeBookOverlayVisible: false });
  },

  onRecipeBookTabChange: function(tab) {
    try { this.page.audioManager.playSFX('recipe-tab'); } catch (err) { /* noop */ }
    const discovered = levelManager.currentProgress.discoveredItems || [];
    this.page.setData(getRecipeBookPageData(
      tab,
      this.page.data.recipeBookSearch || '',
      discovered,
    ));
  },

  onRecipeBookSearch: function(query) {
    const discovered = levelManager.currentProgress.discoveredItems || [];
    this.page.setData(getRecipeBookPageData(
      this.page.data.recipeBookTab || 'recorded',
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
      });
    }, 600);
  }
};
