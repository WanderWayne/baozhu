/** @feature drag-drop @see docs/features/drag-drop.md */
// 兼容入口：game.html 请加载 js/game/game-drag.js
// 本文件保留供旧引用；若未加载 game-drag 则报错提示。
if (typeof DragSystem === 'undefined') {
  console.error('[drag-drop] 请先加载 js/game/game-drag.js');
}
