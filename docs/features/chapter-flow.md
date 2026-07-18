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
- 章内关卡完成后不再显示居中的金色发光“第几关通关”文字，门关闭后直接进入物品栏换场阶段。
- 小程序换场时使用精确数组路径更新单个物品动画状态；H5 与小程序都会预先建立下一关全部透明槽位，避免完整数组 diff 与逐项 flex 重排导致物品左右抖动。
