/** @feature items-icons @see docs/features/items-icons.md */
const { ITEMS } = require('../data/items.js');
const { CHEESE_TONE, WINE_TONE } = require('../data/item-tones.js');

function getGameItemCardTone(itemName) {
  if (CHEESE_TONE.has(itemName)) return 'cheese';
  if (WINE_TONE.has(itemName)) return 'wine';
  return '';
}

function getItemMeta(name) {
  const data = ITEMS[name] || {};
  const itemType = data.type || 'base';
  const tone = getGameItemCardTone(name);
  const hasEffect = !!(data.isRecipeBook || data.extracts);
  return {
    icon: data.icon || '🍨',
    itemType,
    tone,
    hasEffect,
  };
}

function buildItemClass(meta) {
  const parts = ['game-item', `type-${meta.itemType || 'base'}`];
  if (meta.tone) parts.push(`tone-${meta.tone}`);
  if (meta.hasEffect) parts.push('has-effect');
  if (meta.inInventory) parts.push('in-inventory');
  if (meta.selected) parts.push('selected');
  if (meta.isTarget) parts.push('target-item');
  if (meta.placeholder) parts.push('placeholder');
  if (meta.offeringFlight) parts.push('offering-flight');
  if (meta.appearing) parts.push('appearing');
  if (meta.fading) parts.push('fading');
  return parts.join(' ');
}

module.exports = {
  getGameItemCardTone,
  getItemMeta,
  buildItemClass,
};
