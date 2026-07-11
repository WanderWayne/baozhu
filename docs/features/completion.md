# Feature: `completion` — 结算与 Ending

## H5

| 文件 | 职责 |
|------|------|
| `js/game/game-ui.js` | basic completion overlay |
| `js/game/chapter1-ending-cosmic.js` | 第一章 cosmic ending |
| `css/game/game-completion.css`, `game-chapter1-complete.css` | |

## 小程序

| 文件 | 职责 |
|------|------|
| `utils/game/controller.js` | `_showBasicCompletionScreen`, `endingVisible` |
| `pages/game/game-basic-completion.wxss` | |
| `game.wxml` settlement / ending overlays | |

## 已知差异

小程序 cosmic ending 简化为静态 overlay
