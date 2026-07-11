# Feature: `intro` — 开场动画

## 行为摘要

首页 cinematic intro → 主菜单。H5: `index.html` + `js/intro/*`；小程序: `pages/intro/` + `utils/intro/*`。

## H5 文件

| 文件 | 职责 |
|------|------|
| `js/intro.js`, `js/intro/*` | IntroSystem |
| `css/intro/*` | 样式 |

## 小程序文件

| 文件 | 职责 |
|------|------|
| `utils/intro/index.js` 及各子模块 | |
| `pages/intro/intro.*` | 含 embedded 主菜单 |

## 修改检查清单

- [ ] intro 结束后进入菜单
- [ ] sessionStorage `hasPlayedIntro` 逻辑
