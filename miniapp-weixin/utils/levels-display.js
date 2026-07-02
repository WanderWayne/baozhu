const { ITEMS } = require('../data/items.js');

function getWorldDisplayIcon(world) {
  if (!world) return '🍨';
  if (world.svgItem && ITEMS[world.svgItem]?.icon) {
    return ITEMS[world.svgItem].icon;
  }
  return world.icon || '🍨';
}

function getLevelDoorIcon(level, unlocked) {
  if (!unlocked) return '🔒';
  if (level.target && ITEMS[level.target]?.icon) {
    return ITEMS[level.target].icon;
  }
  return level.icon || '🍨';
}

module.exports = {
  getWorldDisplayIcon,
  getLevelDoorIcon,
};
