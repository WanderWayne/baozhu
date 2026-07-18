// 试玩 / 测试模式 — 便于 QA，不影响正式玩家逻辑
//
// 对 Cursor 说「宝珠酿造，开启试玩模式」→ 启用下列行为
// 对 Cursor 说「宝珠酿造，恢复正式模式」→ 关闭下列行为
//
// 试玩模式行为：
// 1. 重置进度后全部关卡可进（不锁后续关）
// 2. 104 双酪关每次进入都走配方书获取事件
// 3. 新手引导每次都会再次出现（不记「已看过」）

const STORAGE_KEY = 'baozhu_dev_playtest';

/** @type {boolean|null} null = 读 storage / 默认；true/false = 强制 */
let _forced = null;

/** 未写入 storage 时的默认值；正式版默认关闭试玩模式 */
const DEFAULT_ENABLED = false;

const PHRASE_ENABLE = '宝珠酿造，开启试玩模式';
const PHRASE_DISABLE = '宝珠酿造，恢复正式模式';
const MODE_RESTORE_KEY = 'baozhu_dev_playtest_prod_restore';

function isEnabled() {
  if (_forced !== null) return _forced;
  try {
    // 曾默认开启试玩模式，一次性恢复为正式通关
    if (!wx.getStorageSync(MODE_RESTORE_KEY)) {
      wx.setStorageSync(STORAGE_KEY, '0');
      wx.setStorageSync(MODE_RESTORE_KEY, '1');
    }
    const v = wx.getStorageSync(STORAGE_KEY);
    if (v === '1') return true;
    if (v === '0') return false;
  } catch (e) { /* ignore */ }
  return DEFAULT_ENABLED;
}

function enable() {
  _forced = true;
  try { wx.setStorageSync(STORAGE_KEY, '1'); } catch (e) { /* ignore */ }
}

function disable() {
  _forced = false;
  try { wx.setStorageSync(STORAGE_KEY, '0'); } catch (e) { /* ignore */ }
}

/** 104 双酪关是否强制走配方书获取阶段 */
function forceRecipeBookPhase(levelId) {
  return isEnabled() && levelId === 104;
}

module.exports = {
  STORAGE_KEY,
  DEFAULT_ENABLED,
  PHRASE_ENABLE,
  PHRASE_DISABLE,
  isEnabled,
  enable,
  disable,
  forceRecipeBookPhase,
};
