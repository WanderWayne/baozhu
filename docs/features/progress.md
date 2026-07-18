# Feature: `progress` — 进度与解锁

## 行为摘要

关卡解锁、发现物品、宝石、碎片、图谱进度；localStorage / wx.storage。见 [`GAME_MECHANICS.md`](../../GAME_MECHANICS.md) 进度与奖励。

## H5 文件

| 文件 | 职责 | 关键符号 |
|------|------|----------|
| [`js/level.js`](../../js/level.js) | `LevelManager` | `completeLevel`, `discoverItem`, `getGems` |
| [`js/game/game-gems.js`](../../js/game/game-gems.js) | 钻石计数、飞行动画、`+N` 反馈 | `updateGemDisplay`, `showGemFlyAnimation` |
| [`js/data/data-tasks.js`](../../js/data/data-tasks.js) | 任务定义 | `BAOZHU_TASKS` |
| [`js/data/data-atlas.js`](../../js/data/data-atlas.js) | 图谱槽位 | |

## 小程序文件

| 文件 | 职责 | 关键符号 |
|------|------|----------|
| [`utils/level-manager.js`](../../miniapp-weixin/utils/level-manager.js) | 同 H5 | |
| [`utils/tasks.js`](../../miniapp-weixin/utils/tasks.js) | 任务 UI 逻辑 | |
| [`pages/game/lib/game-gems.js`](../../miniapp-weixin/pages/game/lib/game-gems.js) | 钻石计数、飞行动画、`+N` 反馈 | `showGemReward` |
| [`data/worlds.js`](../../miniapp-weixin/data/worlds.js) | 关卡数据 | export |

## 数据依赖

- Storage key: `bojoo_game_progress_v2`

## 修改检查清单

- [ ] H5 改 progress 字段时同步 miniapp level-manager
- [ ] `node export-data.mjs` if data changed

## 已知差异 / 历史 bug

- `dev-playtest.js` 默认全开（QA）
