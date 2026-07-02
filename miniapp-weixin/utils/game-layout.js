/**
 * 游戏页布局 — 对齐 H5 game-core.js updateInventoryLayout / _syncSynthesisAreaBottom
 * 使用 windowHeight(px) + 固定物品栏高度，避免 vh / 100vh 在小程序与 H5 不一致。
 */

const ITEMS_PER_ROW = 4;

/** 与 css/game/game-inventory.css + game-responsive-media.css 一致 */
const INV_HEIGHT = {
  tall: { rows0: 110, rows1: 110, rows2: 206, rows3: 260 },
  medium: { rows0: 105, rows1: 105, rows2: 196, rows3: 235 },
  short: { rows0: 95, rows1: 95, rows2: 185, rows3: 220 },
};

const DOOR_PAD_TOP_MIN = 55;
const DOOR_PAD_TOP_SHORT = 45;
const INV_PAD_X = 10;
const INV_PAD_TOP = 12;
const INV_PAD_TOP_SHORT = 10;
const INV_PAD_BOTTOM = 12;

/** 与 css/game/game-responsive-media.css 门区 vh + min-height 一致，换算为 px */
function getDoorHeightPx(windowHeight) {
  if (windowHeight <= 600) {
    return Math.max(Math.round(windowHeight * 0.32), 200);
  }
  if (windowHeight <= 750) {
    return Math.max(Math.round(windowHeight * 0.35), 230);
  }
  return Math.max(Math.round(windowHeight * 0.38), 260);
}

function getDoorPadTop(windowHeight, statusBarHeight) {
  const base = windowHeight <= 600 ? DOOR_PAD_TOP_SHORT : DOOR_PAD_TOP_MIN;
  return Math.max(base, statusBarHeight + 12);
}

function getViewport() {
  const info = (typeof wx.getWindowInfo === 'function')
    ? wx.getWindowInfo()
    : wx.getSystemInfoSync();

  const windowHeight = info.windowHeight || info.screenHeight || 667;
  const windowWidth = info.windowWidth || info.screenWidth || 375;
  const statusBarHeight = info.statusBarHeight || 0;
  const safeArea = info.safeArea || {};

  let safeBottom = 0;
  let safeTop = statusBarHeight;
  if (safeArea.bottom != null && safeArea.bottom > 0) {
    safeBottom = Math.max(0, windowHeight - safeArea.bottom);
  }
  if (safeArea.top != null && safeArea.top > 0) {
    safeTop = safeArea.top;
  }

  return {
    windowHeight,
    windowWidth,
    statusBarHeight,
    safeTop,
    safeBottom,
  };
}

function getHeightTable(windowHeight) {
  if (windowHeight <= 600) return INV_HEIGHT.short;
  if (windowHeight <= 750) return INV_HEIGHT.medium;
  return INV_HEIGHT.tall;
}

function getRowClass(itemCount) {
  const rows = Math.ceil(Math.max(0, itemCount) / ITEMS_PER_ROW);
  if (rows === 0) return 'rows-0';
  if (rows <= 1) return 'rows-1';
  if (rows === 2) return 'rows-2';
  return 'rows-3-plus';
}

function getInventoryHeightPx(windowHeight, rowClass) {
  const table = getHeightTable(windowHeight);
  const map = {
    'rows-0': table.rows0,
    'rows-1': table.rows1,
    'rows-2': table.rows2,
    'rows-3-plus': table.rows3,
  };
  return map[rowClass] || table.rows1;
}

function buildLayoutStyle(viewport, options = {}) {
  const {
    rowClass = 'rows-1',
    synthesisBottomPx,
    measuredInventoryHeightPx,
  } = options;

  const invContentH = getInventoryHeightPx(viewport.windowHeight, rowClass);
  // 底部 Home 指示条：栏高向下延伸，物品带垂直位置不变
  const invTotalH = invContentH + viewport.safeBottom;
  const invPadBottom = INV_PAD_BOTTOM + viewport.safeBottom;
  const synthBottom = synthesisBottomPx != null
    ? synthesisBottomPx
    : (measuredInventoryHeightPx != null ? measuredInventoryHeightPx : invTotalH);

  const doorH = getDoorHeightPx(viewport.windowHeight);
  const doorPadTop = getDoorPadTop(viewport.windowHeight, viewport.statusBarHeight);
  const invPadTop = viewport.windowHeight <= 600 ? INV_PAD_TOP_SHORT : INV_PAD_TOP;

  const style = [
    `--page-h:${viewport.windowHeight}px`,
    `--safe-top:${viewport.safeTop}px`,
    `--safe-bottom:${viewport.safeBottom}px`,
    `--door-h:${doorH}px`,
    `--door-pad-top:${doorPadTop}px`,
    `--inv-content-h:${invContentH}px`,
    `--inv-h:${invTotalH}px`,
    `--inv-pad-x:${INV_PAD_X}px`,
    `--inv-pad-top:${invPadTop}px`,
    `--inv-pad-bottom:${invPadBottom}px`,
    `--synthesis-bottom:${Math.round(synthBottom)}px`,
  ].join(';');

  return { style, rowClass, invH: invTotalH, invContentH, synthBottom, doorPadTop, doorH };
}

function computeLayout(itemCount, measuredInventoryHeightPx) {
  const viewport = getViewport();
  const rowClass = getRowClass(itemCount);
  return buildLayoutStyle(viewport, { rowClass, measuredInventoryHeightPx });
}

module.exports = {
  ITEMS_PER_ROW,
  getViewport,
  getRowClass,
  getInventoryHeightPx,
  getDoorHeightPx,
  computeLayout,
  buildLayoutStyle,
};
