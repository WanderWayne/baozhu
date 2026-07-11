# Feature: `items-icons` — 物品与图标

## H5

- `js/data/data-items.js` — `ITEMS`, `ITEM_SVGS`（inline SVG）
- `js/game/game-core.js` — `createItemElement`, `setIconContent`

## 小程序

- `tools/sync-item-svgs.cjs` — SVG → PNG + `item-icon.wxs`
- `components/item-icon/*`
- `utils/game-item-style.js` — tone sets

## 命令

`node miniapp-weixin/tools/sync-item-svgs.cjs`

## 历史

运行时 SVG data URI 导致 OOM；现用 PNG + WXS 零 setData
