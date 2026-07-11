# Feature: `data-sync` — 数据导出

## 源（H5，权威）

| 文件 | 导出内容 |
|------|----------|
| `js/data/data-worlds.js` | WORLDS, LEVELS, CHAPTERS |
| `js/data/data-items.js` | ITEMS, RECIPES, FRAGMENTS |
| `js/data/data-atlas.js` | ATLAS_* |
| `js/data/data-tasks.js` | BAOZHU_TASKS |

## 命令

```bash
node miniapp-weixin/tools/export-data.mjs
node miniapp-weixin/tools/sync-item-svgs.cjs
```

## 输出

`miniapp-weixin/data/*.js` + `*.json`

## 注意

勿手改 miniapp data 而不回写 H5；`tools/data/` 副本已删除（Phase 3）
