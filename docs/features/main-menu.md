# Feature: `main-menu` — 主菜单

## 行为摘要

主界面粒子、任务面板、设置、导航到选关/图鉴/长廊。见 `js/main.js`。

## H5 文件

| 文件 | 职责 |
|------|------|
| `js/main.js` | 主菜单逻辑 |
| `js/main-particles.js`, `js/growth-system.js` | 视觉 |
| `index.html` | DOM |

## 小程序文件

| 文件 | 职责 |
|------|------|
| `pages/index/index.*` | 独立主菜单 |
| `pages/intro/intro.js` | embedded 菜单（**重复**，见 Phase 3） |
| `utils/main-menu.js` | 共用逻辑（Phase 3） |

## 修改检查清单

- [ ] 同时改 intro embedded 与 index 或已提取 main-menu.js

## 关卡内任务达成提示

H5 `js/game/game-task-toast.js` + `css/game/game-task-toast.css`，小程序 `utils/game-task-toast.js` + `pages/game/game.wxss`。提示固定在左上角，使用白底、薄荷色细边框和薄荷色文字的直角长方形卡片。
