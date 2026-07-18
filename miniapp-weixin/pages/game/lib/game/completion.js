/** @feature completion @see docs/features/completion.md */
const levelManager = require('../../../../utils/level-manager');
const { navigateBackWithFade, navigateHomeWithFade } = require('../../../../utils/page-transitions');

module.exports = {
  _showBasicCompletionScreen: function() {
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
  },

  claimBasicReward: function() {
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
  },

  finishBasicCompletionRest: function() {
    try { this.page.audioManager.playClickExit(); } catch (err) { /* noop */ }
    levelManager.claimBasicReward();
    this.isTransitioning = false;
    this.page.setData({ basicCompletionVisible: false });
    const worldId = this.levelData?.worldId || 1;
    navigateBackWithFade(`/pages/levels/levels?world=${worldId}`);
  },

  finishBasicCompletionExplore: function() {
    try { this.page.audioManager.playClickOpen(); } catch (err) { /* noop */ }
    levelManager.claimBasicReward();
    this.isTransitioning = false;
    this.page.setData({ basicCompletionVisible: false });
    const worldId = this.levelData?.worldId || 1;
    navigateBackWithFade(`/pages/levels/levels?world=${worldId}`);
  },

  showSettlementScreen: function() {
    return new Promise((resolve) => {
      const chapterName = this.chapterData?.name || '这一章';
      const objectives = Array.isArray(this.chapterData?.objectives) ? this.chapterData.objectives : [];
      const completed = objectives.filter((id) => levelManager.isLevelCompleted(id)).length;
      const percent = objectives.length > 0 ? Math.round((completed / objectives.length) * 100) : 0;

      levelManager.markChapterPhaseSettlementSeen();

      this._settlementResolve = resolve;
      this.page.setData({
        settlementFading: false,
        settlementVisible: false,
        settlementChapterName: chapterName,
        settlementProgressPercent: percent,
      });

      const mount = () => {
        this.page.setData({ settlementVisible: true });
        setTimeout(() => {
          try { this.page.audioManager.playSFX('settlement-phase-complete'); } catch (err) { /* noop */ }
        }, 300);
      };

      try { this.page.audioManager.fadeOutBGM(1600, mount); } catch (err) { mount(); }
    });
  },

  onSettlementContinue: function() {
    this.page.setData({ settlementFading: true, settlementVisible: false });
    setTimeout(() => {
      this.page.setData({ settlementFading: false });
      try { this.page.audioManager.playBGM('bgm-game'); } catch (err) { /* noop */ }
      if (this._settlementResolve) {
        this._settlementResolve();
        this._settlementResolve = null;
      }
    }, 600);
  },

  onSettlementRest: function() {
    this.page.setData({ settlementFading: true, settlementVisible: false });
    setTimeout(() => {
      this.page.setData({ settlementFading: false });
      try { this.page.audioManager.stopBGM(); } catch (err) { /* noop */ }
      this._settlementResolve = null;
      navigateHomeWithFade('/pages/index/index');
    }, 600);
  }
};
