# 宝珠游戏 · 功能索引（H5 ↔ 小程序）

说一个功能名 → 打开对应 [`docs/features/<id>.md`](features/) → 按文件表改代码。

**规则文档**：[`GAME_MECHANICS.md`](../GAME_MECHANICS.md) · **验收**：[`miniapp-h5-parity.mdc`](../.cursor/rules/miniapp-h5-parity.mdc)

## 功能一览

| ID | 中文名 | H5 主入口 | 小程序主入口 | Parity 命令 | 文档 |
|----|--------|-----------|--------------|-------------|------|
| `intro` | 开场动画 | `js/intro/*` | `utils/intro/*`, `pages/intro/` | 手动 | [intro.md](features/intro.md) |
| `main-menu` | 主菜单/任务 | `js/main.js` | `pages/index/`, `pages/intro/` | 手动 | [main-menu.md](features/main-menu.md) |
| `level-select` | 选关 | `js/levels-page.js` | `pages/levels/` | `node compare-parity.cjs levels` | [level-select.md](features/level-select.md) |
| `progress` | 进度/解锁/宝石 | `js/level.js`, `game-gems.js` | `utils/level-manager.js` | 手动 | [progress.md](features/progress.md) |
| `game-layout` | 三区布局 | `game-init-ui.js`, `game-inventory.js` | `utils/game-layout.js` | `node check-layout.cjs` | [game-layout.md](features/game-layout.md) |
| `drag-drop` | 拖拽/长按 | `js/game/game-drag.js` | `utils/game/drag.js` | `compare-parity game 101/102` | [drag-drop.md](features/drag-drop.md) |
| `synthesis` | 合成 | `js/synthesis.js`, `game-synthesis.js` | `synthesis-engine.js`, `utils/game/synthesis-flow.js` | `compare-parity game 101` | [synthesis.md](features/synthesis.md) |
| `trade-station` | 交易台 | `js/game/game-trade.js` | `utils/trade-station.js` | `compare-parity game 105` | [trade-station.md](features/trade-station.md) |
| `door-offering` | 门/献上 | `js/game/game-door.js` | `utils/game/door.js`, `door-dialog.js` | `compare-parity game 101` | [door-offering.md](features/door-offering.md) |
| `recipe-book` | 配方书 | `game-ui.js`, `game-synthesis.js` | `game-recipe-book.js` | 关卡 104 手动 | [recipe-book.md](features/recipe-book.md) |
| `chapter-flow` | 章节转场 | `game-chapter-flow.js`, `game-synthesis.js` | `game-chapter-transition.js` | 101→102 手动 | [chapter-flow.md](features/chapter-flow.md) |
| `completion` | 结算/Ending | `game-ui.js`, `chapter1-ending-cosmic.js` | controller + `game-basic-completion.wxss` | 106 手动 | [completion.md](features/completion.md) |
| `tutorial` | 引导 | `js/tutorial-guide.js` | `utils/tutorial-guide.js` | 手动 | [tutorial.md](features/tutorial.md) |
| `codex` | 宝珠图谱 | `js/codex.js` | `pages/codex/` | 手动 | [codex.md](features/codex.md) |
| `gallery` | 记忆长廊 | `js/gallery.js` | `pages/gallery/` | 手动 | [gallery.md](features/gallery.md) |
| `items-icons` | 物品/图标 | `data-items.js` ITEM_SVGS | `sync-item-svgs.cjs`, `item-icon` | 目视 | [items-icons.md](features/items-icons.md) |
| `audio-nav` | 音频/跳转 | `audio-manager.js`, `page-transitions.js` | 同名 utils | 手动 | [audio-nav.md](features/audio-nav.md) |
| `data-sync` | 数据导出 | `js/data/*` | `tools/export-data.mjs` | `node export-data.mjs` | [data-sync.md](features/data-sync.md) |

## Parity 矩阵（Phase 4）

在 `miniapp-weixin/tools/` 目录执行：

| Feature | 命令 | 通过标准 |
|---------|------|----------|
| `level-select` | `node compare-parity.cjs levels` | diff < 12% |
| `drag-drop`, `synthesis`, `door-offering`, `game-layout` | `node compare-parity.cjs game 101` | diff < 12% |
| `synthesis` (多步合成) | `node compare-parity.cjs game 102` | diff < 12% |
| `trade-station` | `node compare-parity.cjs game 105` | diff < 12% |
| `game-layout` | `node check-layout.cjs` | 布局指标通过 |
| `data-sync` | `node export-data.mjs` | 无报错 |
| `items-icons` | `node sync-item-svgs.cjs` | 71 PNG 生成 |

## 巨型文件拆分状态

| 文件 | 目标 | 状态 |
|------|------|------|
| `js/game/game-core.js` | <800 行，仅 wiring | ✅ ~630 行；已拆 `game-trade`, `game-door`, `game-inventory`, `game-gems`, `game-chapter-flow`, `game-init-ui`, `game-tutorial`, `game-recipe-book-core` |
| `miniapp-weixin/utils/game-controller.js` | <800 行 | ✅ ~700 行；mixins 在 `utils/game/*` |
| `js/drag-drop.js` | 迁至 `game-drag.js` | ✅ 薄 stub + `game-drag.js` |

## 代码标注约定

```javascript
/** @feature trade-station @see docs/features/trade-station.md */
```

校验：`node scripts/check-feature-map.cjs`

## 改功能时的通用流程

1. 查本表 → 打开 `docs/features/<id>.md`
2. 同时改 H5 与小程序文件表中的项
3. 更新文档中的行号/文件列表（若结构变了）
4. 跑该 feature 的 parity 命令
5. 见 [`PR_CHECKLIST.md`](PR_CHECKLIST.md)
