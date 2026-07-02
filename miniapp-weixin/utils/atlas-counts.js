const atlas = require('../data/atlas.js');

function getAtlasCountableSlots() {
  const slots = (atlas.slots || []).filter((s) => s.kind !== 'reserved');
  return [...slots, atlas.centerSlot];
}

function getAtlasProgressCounts(unlockedIds) {
  const ids = new Set(unlockedIds || []);
  const countable = getAtlasCountableSlots();
  const total = countable.length;
  let unlocked = 0;
  countable.forEach((s) => {
    if (ids.has(s.id)) unlocked += 1;
  });
  return { unlocked, total };
}

function getAtlasSlotById(slotId) {
  if (atlas.centerSlot && slotId === atlas.centerSlot.id) return atlas.centerSlot;
  return (atlas.slots || []).find((s) => s.id === slotId) || null;
}

module.exports = {
  getAtlasProgressCounts,
  getAtlasSlotById,
  getAtlasCountableSlots,
};
