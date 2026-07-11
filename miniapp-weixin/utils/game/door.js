/** @feature door-offering @see docs/features/door-offering.md */
const levelManager = require('../level-manager');
const { ITEM_SIZE_PX, OFFER_ANIM_MS } = require('./constants');
const { showDoorBubble, showTriggerDialog } = require('../door-dialog');

module.exports = {
  onDoorTap: function() {
    if (this.isTransitioning || this.page.data.showIntro) return;
    const now = Date.now();
    if (now - this._doorClickCooldown < 4000) return;
    this._doorClickCooldown = now;
    this._showDoorClickLine();
  },

  _showDoorClickLine: function() {
    const lines = this._doorClickLines[this.levelId] || this._doorClickLines._default;
    const pool = [...lines.hints, ...lines.chat];
    if (!pool.length) return;
    const idx = this._doorClickChatIdx % pool.length;
    this._doorClickChatIdx += 1;
    showDoorBubble(this.page, pool[idx]);
  },

  _clearLvl104DualHints: function() {
    if (this._lvl104DualHintTimer) {
      clearTimeout(this._lvl104DualHintTimer);
      this._lvl104DualHintTimer = null;
    }
    this._lvl104AwaitDual = false;
  },

  _scheduleLvl104DualCheeseHints: function() {
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
  },

  _isNearDoor: function(item) {
    if (!this.synthesisRect || !this.doorRect) return item.y < 80;
    const cx = this.synthesisRect.left + item.x + ITEM_SIZE_PX;
    const cy = this.synthesisRect.top + item.y + ITEM_SIZE_PX;
    const dx = this.doorRect.left + this.doorRect.width / 2;
    const dy = this.doorRect.top + this.doorRect.height / 2;
    return Math.hypot(cx - dx, cy - dy) < 110;
  },

  _doorCenterInWorkshop: function() {
    if (!this.synthesisRect || !this.doorRect) {
      return { x: 120, y: 20 };
    }
    return {
      x: this.doorRect.left + this.doorRect.width / 2 - this.synthesisRect.left - ITEM_SIZE_PX,
      y: this.doorRect.top + this.doorRect.height / 2 - this.synthesisRect.top - ITEM_SIZE_PX,
    };
  },

  _updateDoorTriggers: function(itemName) {
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
  },

  _checkLevelCompletion: function(itemName, itemId) {
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
  },

  _queueOfferToDoor: function(itemId) {
    this._offerQueue.push(itemId);
    this._processOfferQueue();
  },

  _processOfferQueue: function() {
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
  },

  _autoOfferToDoor: function(itemId) {
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
  },

  _performOffering: function(itemId) {
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
        if (this.hasNextObjective()) {
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

    if (this.hasNextObjective()) {
      levelManager.recordSynthCount(this.levelId, this.synthCount);
      this._performChapterTransition();
      return;
    }

    this._completeLevelFlow();
  }};
