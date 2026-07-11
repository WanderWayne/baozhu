/** @feature synthesis @see docs/features/synthesis.md */
const levelManager = require('../level-manager');

module.exports = {
  _updateBrewing: function(brewId, patch) {
    const brewings = (this.page.data.brewings || []).map((b) => (
      b.id === brewId ? { ...b, ...patch } : b
    ));
    this.page.setData({ brewings });
  },

  onBrewingTouchStart: function(e) {
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
  },

  onBrewingTouchMove: function(e) {
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
  },

  onBrewingTouchEnd: function() {
    if (this.brewDragState) {
      this._updateBrewing(this.brewDragState.id, { dragging: false });
    }
    this.brewDragState = null;
  },

  _clearBrewTimer: function(brewId) {
    if (this.brewTimers[brewId]) {
      clearInterval(this.brewTimers[brewId]);
      delete this.brewTimers[brewId];
    }
  },

  _finishBrewing: function(brewId) {
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
  },

  _startBrewTimer: function(brewId) {
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
  }};
