const { ITEMS } = require('../data/items.js');

function getWorldDisplayIcon(world) {
  if (!world) {
    return { emoji: '🍨', iconName: '' };
  }
  if (world.svgItem) {
    return {
      emoji: (ITEMS[world.svgItem] && ITEMS[world.svgItem].icon) || world.icon || '🍨',
      iconName: world.svgItem,
    };
  }
  return { emoji: world.icon || '🍨', iconName: '' };
}

function getLevelDoorIcon(level, unlocked) {
  if (!unlocked) {
    return { emoji: '🔒', iconName: '' };
  }
  if (level.target) {
    return {
      emoji: (ITEMS[level.target] && ITEMS[level.target].icon) || level.icon || '🍨',
      iconName: level.target,
    };
  }
  return { emoji: level.icon || '🍨', iconName: '' };
}

module.exports = {
  getWorldDisplayIcon,
  getLevelDoorIcon,
};
