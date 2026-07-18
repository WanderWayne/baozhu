# Feature: `audio-nav` — 音频与页面跳转

## H5

| 文件 | 职责 |
|------|------|
| `js/audio-manager.js` | BGM/SFX |
| `js/page-transitions.js` | `navigateTo` fade |
| `audio files/*` | 资源 |

## 小程序

| 文件 | 职责 |
|------|------|
| `utils/audio-manager.js` | |
| `utils/page-transitions.js` | 页面离场遮罩、路由与入场标记 |
| `behaviors/page-transition.js` | 各页面共用的入场淡入逻辑 |
| `pages/common/page-transitions.wxss` | 全屏渐暗/渐亮遮罩样式 |
| `assets/audio/*` | |

小程序 WebView 的 `navigateTo` / `navigateBack` 会强制使用系统左右推入动画。项目内普通前进与返回保留页面栈，但在调用系统路由前让旧页全黑，并让目标页首帧保持全黑；系统推入/退出因此发生在纯黑画面之间，随后才执行自定义渐亮。这样既隐藏系统滑动，也避免 `reLaunch` 销毁 WebView 产生白色空帧。只有重置游戏等确实需要清空页面栈的入口使用 `reLaunch`。

转场遮罩由六个页面末尾的 `root-portal` 承载，并在其中使用 `cover-view`，确保遮罩脱离页面自身的层叠上下文并覆盖普通 UI 与其他原生组件。粒子 Canvas 在部分微信渲染环境中仍处于独立合成层，CSS 层级和透明度都无法可靠压暗它，因此转场状态机会同步调用页面的 `_setCanvasTransitionOpacity()`：主菜单标题粒子、开场粒子和选关泡泡在每帧内容绘制完成后，直接在同一个 Canvas 内绘制深色转场层。目标页在 `onLoad` 开始时调用 `_preparePageTransitionEnter()`，首帧即保持全黑；`onShow` 再执行渐亮，避免 `reLaunch` 后先露出页面背景造成白闪。

主界面的 Page 配置、`page` 样式和初始 `bgColor` 使用 `#101010`，保证首次创建时也不会露出浅色底。返回主界面优先通过 `navigateBack` 回到仍保持黑幕的旧页面，再从黑色渐亮。
