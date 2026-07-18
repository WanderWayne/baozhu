# AI Handoff — 宝珠游戏

更新时间：2026-07-12  
当前分支：`master`  
最近远程提交：`31e77bf 完成了小程序的图像`

## 1. 项目背景

这是宝珠/Bojoo 品牌的移动端酿造合成游戏。

- H5 是当前行为与视觉基准。
- 微信小程序正在做 H5 parity 和演示稳定性。
- Cocos 是后续迁移目标，当前任务不要主动改 Cocos。
- 修改 gameplay 功能前必须先读：
  - `docs/FEATURE_INDEX.md`
  - 对应的 `docs/features/<id>.md`
  - `AGENTS.md`
- 不要覆盖或回退当前未提交改动。

## 2. 用户当前目标

用户正在连续调整 H5 与微信小程序的 UI/引导，并要求双端保持一致。

当前最重要、仍需用户实机确认的任务：

> 微信小程序的页面切换必须像 H5：当前界面渐暗，切到新界面后渐亮；不能再出现新页面从右侧滑入。

用户上一轮反馈：

- 原生右侧滑入已经消失。
- 转场方向不一致：主界面 → 选关看不到渐暗渐亮，选关 → 主界面能看到。

已针对该反馈做了最新修改，但用户尚未反馈实机结果。

## 3. 当前转场实现

Feature：`audio-nav`

主要文件：

- `miniapp-weixin/utils/page-transitions.js`
- `miniapp-weixin/behaviors/page-transition.js`
- `miniapp-weixin/pages/common/page-transitions.wxss`
- 六个页面的 `.js` / `.wxml`：
  - `pages/intro/`
  - `pages/index/`
  - `pages/levels/`
  - `pages/game/`
  - `pages/codex/`
  - `pages/gallery/`

当前技术方案：

1. WebView 下 `navigateTo` / `navigateBack` 会强制显示微信原生左右推入动画。
2. 所有项目内自定义导航统一通过 `wx.reLaunch`，主动放弃页面栈，避免左右推入。
3. 返回按钮不依赖页面栈，每个页面都传入明确目标 URL。
4. 遮罩使用顶层 `cover-view`，以覆盖 Canvas / 原生层。
5. 不依赖 CSS opacity transition；由 JS 每 40ms 分帧更新 `pageTransition.opacity`：
   - 离场渐暗：500ms，透明度 0 → 1
   - 入场渐亮：600ms，透明度 1 → 0
6. 所有转场现在统一使用深色遮罩 `#101010`。
   - 之前浅色目标使用暖白遮罩，和选关页背景太接近，造成“没有渐暗”的错觉。
7. 主菜单按钮已移除额外 200ms 等待，点击后立即开始渐暗。

注意：

- `pages/intro/intro.js` 和 `pages/index/index.js` 的 `onLoad` 中仍有直接 `wx.redirectTo`，仅用于启动时根据开场记录自动纠正入口，不属于用户点击的正常转场。
- 如果最新方案仍出现系统滑动，说明当前微信版本连 `reLaunch` 也有系统动画。WebView 无官方自定义路由能力，下一条可靠路线是评估 Skyline 自定义路由；不要在没有完整兼容性验证时直接迁移。

## 4. 本轮其他已完成改动

### 第二关长按引导

用户要求暂时去掉第二关“长按物品可以查看属性”的引导，但保留长按功能。

- H5：`js/game/game-drag.js`
- 小程序：`miniapp-weixin/utils/game/drag.js`

### 门下方“献上”

用户要求合成目标物品后，门下方不显示“献上”。

- H5：
  - `css/game/game-door-base.css`
  - `css/game/game-door-states.css`
- 小程序：
  - `pages/game/game.wxml`
  - `pages/game/game-door.wxss`

自动献上和门框反馈保留。

### 新手引导

用户要求：

- 不显示“点击任意处继续”
- 点击关闭机制保留
- 8 秒自动结束
- 出现/消失有渐入渐出

文件：

- H5：`js/tutorial-guide.js`、`css/tutorial-guide.css`
- 小程序：`utils/tutorial-guide.js`、`pages/common/tutorial-guide.wxss`

当前行为：

- 1 秒后允许点击关闭
- 8 秒自动关闭
- 淡入/淡出约 400ms

### 配方书与返回按钮

用户要求：

- 配方书移动到左上角
- 返回按钮移动到右上角
- 返回图案改成房子
- SVG 作为源文件，小程序实际用 PNG，沿用现有物品图标管线

相关文件：

- H5：
  - `game.html`
  - `css/game/game-door-base.css`
  - `css/game/game-synthesis.css`
  - `js/data/data-items.js`
  - `js/game/game-core.js`
  - `js/game/game-init-ui.js`
- 小程序：
  - `pages/game/game.wxml`
  - `pages/game/game.wxss`
  - `pages/game/game-recipe-book.wxss`
  - `assets/icons/_home.svg`
  - `assets/icons/_home.png`
  - `components/item-icon/item-icon.wxs`
  - `tools/sync-item-svgs.cjs`

小程序运行时加载 `_home.png`，不是直接渲染 SVG。

## 5. 验证状态

已通过：

- 修改过的 JS 文件 `node --check`
- `git diff --check`
- IDE lint：无报错
- `node scripts/check-feature-map.cjs`
- 转场 mock：
  - 离场透明度最终到 1
  - 入场透明度最终回到 0
  - 主界面 → 选关使用 `mode: black`
  - 路由调用为 `reLaunch`

尚未完成：

- 最新统一深色方案的微信开发者工具实际运行验证
- 真机验证

当前电脑无法自动验证小程序：

```text
BLOCKED: DevTools not logged in.
connect ECONNREFUSED 127.0.0.1:50708
```

如开发者工具已登录并打开项目，可运行：

```powershell
powershell -ExecutionPolicy Bypass -File miniapp-weixin/tools/enable-auto.ps1
node miniapp-weixin/tools/mcp-health.cjs
```

## 6. 建议下一步

1. 让用户重新编译微信小程序。
2. 逐条测试：
   - 主界面 → 选关
   - 选关 → 主界面
   - 选关 → 游戏
   - 游戏 → 选关
   - 主界面 ↔ 图谱
   - 主界面 ↔ 画廊
3. 每次观察：
   - 是否立即开始逐渐变暗
   - 暗到接近全黑后是否切页
   - 新页面是否逐渐变亮
   - 是否存在左右滑动
   - 是否出现短暂白屏/粉色背景闪烁
4. 如果只有某条路径失败，先检查该按钮是否绕过 `utils/page-transitions.js`，不要重写整套方案。
5. 如果所有路径仍有系统滑动，停止继续堆遮罩补丁，评估：
   - Skyline 自定义路由的兼容成本
   - 或将主要界面合并为单 Page 内部切换

## 7. Git 状态与注意事项

当前有大量未提交修改，全部属于最近几轮用户需求。不要执行：

- `git reset --hard`
- `git checkout --`
- 任何会回退用户改动的命令

当前新增未跟踪内容包括：

- `AI_HANDOFF.md`
- `miniapp-weixin/assets/icons/_home.png`
- `miniapp-weixin/assets/icons/_home.svg`
- `miniapp-weixin/behaviors/page-transition.js`
- `miniapp-weixin/pages/common/page-transitions.wxss`

没有用户授权时不要 commit 或 push。

## 8. 常用检查命令

```powershell
node scripts/check-feature-map.cjs
node --check miniapp-weixin/utils/page-transitions.js
node --check miniapp-weixin/behaviors/page-transition.js
git diff --check
git status --short
```

小程序 gameplay 改动应参考：

```powershell
cd miniapp-weixin/tools
node check-layout.cjs
node compare-parity.cjs levels
node compare-parity.cjs game 101
```

