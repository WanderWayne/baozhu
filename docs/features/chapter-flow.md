# Feature: `chapter-flow` — 章节转场

## 行为摘要

过关后门关闭、物品收束、过关文案、下一关 intro。见 [`GAME_MECHANICS.md`](../../GAME_MECHANICS.md) 过关流程。

## H5 文件

| 文件 | 职责 | 关键符号 |
|------|------|----------|
| [`js/game/game-synthesis.js`](../../js/game/game-synthesis.js) | 转场动画 | chapter transition |
| [`js/game/game-core.js`](../../js/game/game-core.js) | 门关闭状态 | `doorClosing` |
| [`css/game/game-chapter-transition.css`](../../css/game/game-chapter-transition.css) | | |

## 小程序文件

| 文件 | 职责 | 关键符号 |
|------|------|----------|
| [`utils/game-chapter-transition.js`](../../miniapp-weixin/utils/game-chapter-transition.js) | `runChapterTransition` | |
| [`pages/game/game-chapter-transition.wxss`](../../miniapp-weixin/pages/game/game-chapter-transition.wxss) | | |
| [`utils/game/controller.js`](../../miniapp-weixin/utils/game/controller.js) | 触发 | |

## 修改检查清单

- [ ] 101→102 转场目视
- [ ] 105 珠宝阶段特殊逻辑

## 已知差异 / 历史 bug

- 105 complete 后 settlement 与 H5 细节可能不同
