/** @feature progress @see docs/features/progress.md */
const levelManager = require('../../../utils/level-manager');

const FLYER_COUNT = 10;
const REWARD_SEQUENCE_MS = 1600;

function schedule(page, callback, delay) {
  const timer = setTimeout(() => {
    if (page._gemTimers) page._gemTimers.delete(timer);
    callback();
  }, delay);
  if (!page._gemTimers) page._gemTimers = new Set();
  page._gemTimers.add(timer);
  return timer;
}

function initGemDisplay(page) {
  page.setData({ gemCount: levelManager.getGems() });
}

function queryRewardRects(page) {
  return new Promise((resolve) => {
    wx.nextTick(() => {
      const query = wx.createSelectorQuery().in(page);
      query.select('#door-container').boundingClientRect();
      query.select('#gem-display').boundingClientRect();
      query.exec((res) => resolve({ door: res?.[0], gem: res?.[1] }));
    });
  });
}

function makeFlyers(doorRect, gemRect) {
  const fromX = doorRect.left + doorRect.width / 2 - 10;
  const fromY = doorRect.top + doorRect.height / 2 - 10;
  const targetX = gemRect.left + gemRect.width / 2 - 10;
  const targetY = gemRect.top + gemRect.height / 2 - 10;
  return Array.from({ length: FLYER_COUNT }, (_, index) => ({
    id: `gem_${Date.now()}_${index}`,
    fromX,
    fromY,
    toX: targetX + (Math.random() - 0.5) * 36,
    toY: targetY + (Math.random() - 0.5) * 20,
    delay: index * 75,
    opacityDelay: index * 75 + 600,
    active: false,
  }));
}

async function showGemReward(page, amount) {
  const reward = Math.max(0, Number(amount) || 0);
  if (!reward) return;

  try { page.audioManager.playSFX('gem-earn'); } catch (err) { /* noop */ }
  const rects = await queryRewardRects(page);
  const flyers = rects.door && rects.gem ? makeFlyers(rects.door, rects.gem) : [];

  await new Promise((resolve) => {
    page.setData({
      gemCount: levelManager.getGems(),
      gemBump: false,
      gemPlusVisible: true,
      gemPlusAmount: reward,
      gemFlyers: flyers,
    }, () => {
      wx.nextTick(() => {
        page.setData({
          gemBump: true,
          gemFlyers: flyers.map((flyer) => ({ ...flyer, active: true })),
        });
      });
      schedule(page, () => page.setData({ gemBump: false }), 450);
      schedule(page, () => page.setData({ gemFlyers: [] }), 1150);
      schedule(page, () => page.setData({ gemPlusVisible: false }), 1300);
      schedule(page, resolve, REWARD_SEQUENCE_MS);
    });
  });
}

function destroyGemDisplay(page) {
  if (!page._gemTimers) return;
  page._gemTimers.forEach((timer) => clearTimeout(timer));
  page._gemTimers.clear();
}

module.exports = { initGemDisplay, showGemReward, destroyGemDisplay };
