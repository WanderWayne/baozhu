/** @feature drag-drop @see docs/features/drag-drop.md */
const { frameDelay } = require('../inventory-pop-animation');
const { createFoamBurst, appendFoam } = require('../game-foam');

module.exports = {
  _addToInventoryIfNeeded: function(name) {
    const inv = [...this.page.data.inventoryItems];
    if (inv.some((i) => i.name === name && !i.hidden)) return;

    const item = this._makeItem(name, 0, 0, true);
    item.popPhase = 'hold';
    inv.push(item);
    const newCount = inv.filter((i) => !i.hidden).length;

    this.page.setData({ inventoryItems: inv }, () => {
      this._syncLayout(newCount);
      this._animateInventoryPopIn(item.id);
    });
  },

  _animateInventoryPopIn: function(itemId) {
    try {
      this.page.audioManager.playInventoryTransitionSlot(false);
    } catch (err) { /* noop */ }

    frameDelay(32).then(() => {
      const inv = [...this.page.data.inventoryItems];
      const idx = inv.findIndex((i) => i.id === itemId);
      if (idx < 0) return;
      inv[idx] = { ...inv[idx], popPhase: 'in-quick' };
      this.page.setData({ inventoryItems: inv });

      wx.nextTick(() => {
        const query = wx.createSelectorQuery().in(this.page);
        query.selectAll('.inventory-item-slot').boundingClientRect();
        query.exec((res) => {
          const rects = res[0] || [];
          const visible = inv.filter((i) => !i.hidden);
          const slotIdx = visible.findIndex((i) => i.id === itemId);
          const rect = rects[slotIdx];
          if (rect) {
            appendFoam(this.page, createFoamBurst(
              rect.left + rect.width / 2,
              rect.top + rect.height / 2,
              8,
            ));
          }
        });
      });
    });
  },

  _patchWorkshopItem: function(id, patch) {
    const items = (this.page.data.workshopItems || []).map((i) => (
      i.id === id ? { ...i, ...patch } : i
    ));
    this.page.setData({ workshopItems: items });
  }};
