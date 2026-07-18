# Feature: `game-layout` — 三区布局

## 行为摘要

门区 / 合成区 / 物品栏垂直分区；safe area；物品栏行数固定 px。见 parity 规则 layout 段。

## H5 文件

| 文件 | 职责 | 关键符号 |
|------|------|----------|
| [`js/game/game-init-ui.js`](../../js/game/game-init-ui.js) | `initUI`, 双门、关卡提示 | `initUI`, `initDualDoors` |
| [`js/game/game-inventory.js`](../../js/game/game-inventory.js) | 物品栏高度、合成区 bottom | `updateInventoryLayout`, `_syncSynthesisAreaBottom` |
| [`js/game/game-core.js`](../../js/game/game-core.js) | 构造、生命周期 | wiring only |
| [`css/game/game-layout.css`](../../css/game/game-layout.css) | CSS 变量 | |

## 小程序文件

| 文件 | 职责 | 关键符号 |
|------|------|----------|
| [`utils/game-layout.js`](../../miniapp-weixin/utils/game-layout.js) | CSS 变量计算 | `computeLayoutStyle` |
| [`pages/game/game.js`](../../miniapp-weixin/pages/game/game.js) | `_measureGameRects`, `syncGameLayout` | |
| [`pages/game/game.wxss`](../../miniapp-weixin/pages/game/game.wxss) | 容器 | |

## 修改检查清单

- [ ] 禁止玩法页裸 `100vh`
- [ ] `node check-layout.cjs`
- [ ] `compare-parity game 101`

## 已知差异 / 历史 bug

- 合成区 bottom 必须等于物品栏实测高度
- 物品栏从一行增高到多行时，H5 `_nudgeSynthItemsAboveInventory()` 与小程序 `nudgeWorkshopItems()` 会把侵入新边界的合成区物品向上推出；小程序在高度动画结束后还会用实测矩形复核一次。
