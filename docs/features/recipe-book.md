# Feature: `recipe-book` — 配方书

## 行为摘要

长按配方书打开、记载/发现 tab、104 配方书阶段、交易台换配方书。见 [`GAME_MECHANICS.md`](../../GAME_MECHANICS.md) 配方书相关节。

## H5 文件

| 文件 | 职责 | 关键符号 |
|------|------|----------|
| [`js/game/game-ui.js`](../../js/game/game-ui.js) | 配方书 UI、提取卡 | `openRecipeBook`, overlay |
| [`js/game/game-synthesis.js`](../../js/game/game-synthesis.js) | 配方书阶段转场 | |
| [`js/game/game-trade.js`](../../js/game/game-trade.js) | `_initRecipeBookTrade` | |
| [`css/game/game-recipe-book.css`](../../css/game/game-recipe-book.css) | | |

## 小程序文件

| 文件 | 职责 | 关键符号 |
|------|------|----------|
| [`utils/game-recipe-book.js`](../../miniapp-weixin/utils/game-recipe-book.js) | 数据与 tab | `getRecipeBookPageData` |
| [`utils/game/controller.js`](../../miniapp-weixin/utils/game/controller.js) | `activateRecipeBook`, flyer | |
| [`pages/game/game-recipe-book.wxss`](../../miniapp-weixin/pages/game/game-recipe-book.wxss) | | |

## 数据依赖

- `recipeBookPhase`, `recipeBookTradeStation`
- `discoveredItems` in progress

## 修改检查清单

- [ ] 104 关卡配方书全流程
- [ ] 长按 800ms 与拖取消

## 已知差异 / 历史 bug

- H5 有 `showExtractCard`，小程序未移植
