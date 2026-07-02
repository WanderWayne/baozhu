// 教学引导占位（波6：主菜单/关卡聚光灯可在此扩展）
const STORAGE_PREFIX = 'baozhu_tutorial_';

function hasSeen(key) {
  return !!wx.getStorageSync(STORAGE_PREFIX + key);
}

function markSeen(key) {
  wx.setStorageSync(STORAGE_PREFIX + key, '1');
}

function maybeShowMainGuide(page) {
  if (hasSeen('main_guide_done')) return;
  if (!wx.getStorageSync('tut_guide_tasks_on_main')) return;
  page.setData({ tutorialHint: '完成任务可领取钻石奖励' });
  markSeen('main_guide_done');
}

module.exports = {
  hasSeen,
  markSeen,
  maybeShowMainGuide,
};
