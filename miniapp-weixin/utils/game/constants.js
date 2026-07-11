/** @feature drag-drop @see docs/features/drag-drop.md */
let uid = 0;

module.exports = {
  ITEM_SIZE_PX: 85,
  COLLISION_PX: 65,
  DRAG_THRESHOLD_PX: 10,
  OFFER_ANIM_MS: 550,
  APPEAR_INTERVAL: 300,
  APPEAR_DURATION: 1900,
  LP_DELAY_MS: 800,
  LP_RING_DELAY_MS: 200,
  LP_MOVE_THRESHOLD_PX: 12,
  nextId() {
    uid += 1;
    return `item_${uid}_${Date.now()}`;
  },
};
