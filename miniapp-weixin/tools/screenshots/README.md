# 截图验收（H5 ↔ 小程序）

## 一键比对（推荐）

```powershell
cd miniapp-weixin/tools
powershell -ExecutionPolicy Bypass -File enable-auto.ps1   # MCP 未连时
node compare-parity.cjs game 101
node compare-parity.cjs game 102
node compare-parity.cjs levels
```

输出目录 `screenshots/`：

| 文件 | 说明 |
|------|------|
| `game-101-h5.png` / `game-101-mini.png` | 单端截图 |
| `game-101-compare.png` | 左 H5、右小程序 |
| `game-101-diff.png` | 像素差异（红区） |

**通过标准**：diff **< 12%** 且目视一致（门、气泡、圆形物品、三区布局）。

## 单独截图

```powershell
node capture-game.cjs 101
node capture-game-h5.cjs 101
node capture-levels.cjs
node capture-levels-h5.cjs
```

## MCP 健康检查

```powershell
node mcp-health.cjs
```

## 已知可接受差异

- 微信模拟器顶栏 vs 浏览器顶栏（compare 前可 crop，当前 cover 390×844）

## Cursor 规则

见 `.cursor/rules/miniapp-h5-parity.mdc` — 完成 miniapp 改动后必须跑 compare 并迭代。
