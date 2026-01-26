# 宝珠酿造 · 视觉风格指南 V2

> "在上海弄堂里酿米酒的甜品小店，在13年日落月升的慢酿中，
> 腐烂与发酵的静默里，逐渐寻找到自己的真理。"

---

## 核心精神

### 品牌灵魂
- **慢酿** — 不是魔法，是时间的礼物
- **生机** — 活着的食物，有呼吸的世界
- **弄堂** — 温暖、亲密、有人情味的角落
- **发酵** — 看不见的生命在静默中工作
- **循环** — 日落月升，腐烂与新生

### 设计原则

#### 1. 生机感 > 奇幻感
不是魔法世界，是**活着的世界**。
- 气泡不是魔法粒子，是发酵产生的真实气泡
- 光芒不是魔法光效，是阳光穿过玻璃罐的折射
- 动画不是特效，是生命在缓慢呼吸

#### 2. 温度感 > 科技感
像弄堂里的老店，不是实验室。
- 手写字体而非几何字体
- 自然纹理而非纯净背景
- 暖色调为主，冷色为点缀

#### 3. 层次感 > 扁平感
发酵是分层的，时间是有厚度的。
- 背景有纹理和深度
- 颜色有明暗变化
- 空间有前中后层次

#### 4. 静谧中的活力
安静但不死寂，缓慢但有生机。
- 微小但持续的动态
- 若隐若现的生命迹象
- 等待中的期待感

---

## 色彩系统

### 主色调：慢酿光谱

基于发酵过程和自然食材，创造一个有生命力的色彩体系。

```
┌─────────────────────────────────────────────────────┐
│                    慢 酿 光 谱                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│   🌅 晨曦系        🍯 酿造系        🌿 生机系        │
│                                                     │
│   破晓粉          米酒金           苔藓绿           │
│   #F5E6E0         #E8C873          #7BA37B          │
│                                                     │
│   朝霞橘          焦糖棕           嫩芽绿           │
│   #E8A87C         #A67C52          #A8C686          │
│                                                     │
│   暮光紫          老木褐           清泉蓝           │
│   #B8A5C7         #6B5344          #89B4C8          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 色彩定义

#### 晨曦系 — 时间的颜色
代表"日落月升"的时间循环，温柔而充满希望。

| 名称 | 色值 | 使用场景 |
|------|------|----------|
| 破晓粉 | `#F5E6E0` | 温暖的背景底色 |
| 朝霞橘 | `#E8A87C` | 强调色、按钮悬停 |
| 暮光紫 | `#B8A5C7` | 神秘元素、夜间场景 |
| 黎明金 | `#F0D9A0` | 高光、成就、珍贵物品 |

#### 酿造系 — 发酵的颜色
代表米酒、酸奶、奶酪的酿造过程。

| 名称 | 色值 | 使用场景 |
|------|------|----------|
| 米酒金 | `#E8C873` | 品牌主色、重要元素 |
| 焦糖棕 | `#A67C52` | 文字、图标、边框 |
| 老木褐 | `#6B5344` | 深色文字、标题 |
| 奶沫白 | `#FFFDF7` | 最亮的背景、卡片 |
| 酵母米 | `#F5F0E6` | 通用背景色 |

#### 生机系 — 生命的颜色
代表"Living Food"的活力和自然。

| 名称 | 色值 | 使用场景 |
|------|------|----------|
| 苔藓绿 | `#7BA37B` | 生命力、成长、健康 |
| 嫩芽绿 | `#A8C686` | 新手引导、新内容 |
| 清泉蓝 | `#89B4C8` | 清爽元素、水、纯净 |
| 浆果红 | `#C4727A` | 警告、重要、热情 |

#### 辅助色 — 食材的颜色

| 名称 | 色值 | 灵感来源 |
|------|------|----------|
| 草莓粉 | `#E8B4B8` | 新鲜草莓 |
| 蓝莓紫 | `#8B7BA3` | 野生蓝莓 |
| 蜂蜜琥珀 | `#D4A03A` | 天然蜂蜜 |
| 糯米白 | `#F8F4EC` | 发酵糯米 |
| 可可棕 | `#5D4E46` | 厄瓜多尔可可 |

### CSS 变量

```css
:root {
  /* ===== 晨曦系 ===== */
  --dawn-pink: #F5E6E0;
  --sunrise-orange: #E8A87C;
  --dusk-purple: #B8A5C7;
  --dawn-gold: #F0D9A0;
  
  /* ===== 酿造系 ===== */
  --rice-wine-gold: #E8C873;
  --caramel-brown: #A67C52;
  --old-wood: #6B5344;
  --milk-foam: #FFFDF7;
  --yeast-beige: #F5F0E6;
  
  /* ===== 生机系 ===== */
  --moss-green: #7BA37B;
  --sprout-green: #A8C686;
  --spring-blue: #89B4C8;
  --berry-red: #C4727A;
  
  /* ===== 食材色 ===== */
  --strawberry: #E8B4B8;
  --blueberry: #8B7BA3;
  --honey-amber: #D4A03A;
  --sticky-rice: #F8F4EC;
  --cocoa: #5D4E46;
  
  /* ===== 语义化 ===== */
  --bg-primary: var(--yeast-beige);
  --bg-card: var(--milk-foam);
  --text-primary: var(--old-wood);
  --text-secondary: var(--caramel-brown);
  --accent-primary: var(--rice-wine-gold);
  --accent-life: var(--moss-green);
}
```

---

## 背景与纹理

### 弄堂纹理
不要纯色背景，要有生活的痕迹。

#### 1. 酵母纸纹理
```css
.yeast-paper {
  background-color: var(--yeast-beige);
  background-image: 
    url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
}
```

#### 2. 晨光渐变
```css
.morning-glow {
  background: linear-gradient(
    165deg,
    var(--dawn-pink) 0%,
    var(--yeast-beige) 40%,
    var(--milk-foam) 100%
  );
}
```

#### 3. 暮色渐变
```css
.dusk-glow {
  background: linear-gradient(
    195deg,
    var(--dusk-purple) 0%,
    var(--dawn-pink) 30%,
    var(--yeast-beige) 100%
  );
}
```

### 层次叠加
多层背景创造深度感。

```css
.layered-bg {
  background:
    /* 最上层：微光点 */
    radial-gradient(circle at 20% 30%, rgba(232, 200, 115, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(184, 165, 199, 0.06) 0%, transparent 40%),
    /* 中间层：温暖渐变 */
    linear-gradient(170deg, var(--dawn-pink) 0%, transparent 50%),
    /* 底层：基础色 */
    var(--yeast-beige);
}
```

---

## 动效系统

### 核心理念：发酵的节奏
所有动画都应该像发酵一样——**缓慢、持续、有生命力**。

### 1. 发酵气泡

不是魔法粒子，是真正的发酵气泡。

```javascript
const FermentBubble = {
  // 大小：像真实气泡，有大有小
  size: { min: 2, max: 12 },
  
  // 速度：非常缓慢，像在粘稠液体中上升
  speed: { min: 0.2, max: 0.8 },
  
  // 摇摆：轻微的左右飘动
  wobble: { amount: 0.5, speed: 0.02 },
  
  // 透明度：半透明，边缘柔和
  opacity: { min: 0.1, max: 0.4 },
  
  // 颜色：奶白色或淡金色
  colors: ['#FFFDF7', '#F5F0E6', '#E8C873', '#F0D9A0']
};
```

### 2. 呼吸光晕

像生命在呼吸，缓慢而有节奏。

```css
@keyframes living-breath {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
    filter: blur(0px);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.02);
    filter: blur(1px);
  }
}

.breathing {
  animation: living-breath 4s ease-in-out infinite;
}
```

### 3. 晨昏循环

背景颜色随时间微妙变化。

```javascript
// 根据游戏进度或时间，背景色调微妙变化
const timeOfDay = {
  dawn: { bg: '#F5E6E0', accent: '#E8A87C' },
  day: { bg: '#F5F0E6', accent: '#E8C873' },
  dusk: { bg: '#EDE6E8', accent: '#B8A5C7' },
  night: { bg: '#E8E4E6', accent: '#8B7BA3' }
};
```

### 4. 涟漪扩散

交互反馈，像水波纹或发酵产生的涟漪。

```css
@keyframes ferment-ripple {
  0% {
    transform: scale(0.8);
    opacity: 0.5;
    border-width: 3px;
  }
  100% {
    transform: scale(2.5);
    opacity: 0;
    border-width: 1px;
  }
}
```

### 5. 漂浮微尘

空气中的微粒，像阳光下的灰尘。

```javascript
const FloatingDust = {
  count: 30,
  size: { min: 1, max: 3 },
  speed: { min: 0.05, max: 0.15 },
  opacity: { min: 0.02, max: 0.08 },
  // 金色微尘，像阳光
  color: 'rgba(232, 200, 115, opacity)'
};
```

---

## 字体与排版

### 字体选择

#### 标题字体
温暖、有手作感的衬线体。
```css
font-family: "Source Han Serif SC", "Noto Serif SC", "SimSun", serif;
```

#### 正文字体
清晰、舒适的无衬线体。
```css
font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
```

### 排版规范

| 元素 | 字号 | 行高 | 字间距 | 颜色 |
|------|------|------|--------|------|
| 大标题 | 28-36px | 1.4 | 6-10px | var(--old-wood) |
| 小标题 | 18-22px | 1.5 | 3-5px | var(--caramel-brown) |
| 正文 | 14-16px | 1.9 | 1-2px | var(--old-wood) |
| 注释 | 12-13px | 1.7 | 1px | var(--caramel-brown) |

### 特殊排版

#### 竖向标题
重要标题可以竖向排列，增添东方韵味。

```css
.vertical-title {
  writing-mode: vertical-rl;
  text-orientation: upright;
  letter-spacing: 8px;
}
```

---

## UI 组件

### 按钮

#### 主要按钮 — 米酒金
```css
.btn-primary {
  background: var(--rice-wine-gold);
  color: var(--old-wood);
  border: none;
  border-radius: 24px;
  padding: 12px 28px;
  font-size: 14px;
  letter-spacing: 2px;
  box-shadow: 0 4px 16px rgba(232, 200, 115, 0.3);
  transition: all 0.4s ease;
}

.btn-primary:hover {
  background: var(--honey-amber);
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(232, 200, 115, 0.4);
}
```

#### 次要按钮 — 透明边框
```css
.btn-secondary {
  background: transparent;
  color: var(--caramel-brown);
  border: 1px solid var(--caramel-brown);
  border-radius: 24px;
  padding: 11px 27px;
  transition: all 0.4s ease;
}

.btn-secondary:hover {
  background: var(--caramel-brown);
  color: var(--milk-foam);
}
```

#### 生机按钮 — 苔藓绿
```css
.btn-life {
  background: var(--moss-green);
  color: white;
  border-radius: 24px;
  box-shadow: 0 4px 16px rgba(123, 163, 123, 0.3);
}
```

### 卡片

```css
.card {
  background: var(--milk-foam);
  border: 1px solid rgba(166, 124, 82, 0.1);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 
    0 4px 20px rgba(107, 83, 68, 0.06),
    0 1px 3px rgba(107, 83, 68, 0.04);
  transition: all 0.4s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 
    0 8px 32px rgba(107, 83, 68, 0.1),
    0 2px 8px rgba(107, 83, 68, 0.06);
}

/* 卡片内的温暖光效 */
.card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60%;
  background: linear-gradient(
    180deg,
    rgba(245, 230, 224, 0.4) 0%,
    transparent 100%
  );
  border-radius: 16px 16px 0 0;
  pointer-events: none;
}
```

### 输入框

```css
.input {
  background: var(--milk-foam);
  border: 1px solid rgba(166, 124, 82, 0.2);
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 15px;
  color: var(--old-wood);
  transition: all 0.3s ease;
}

.input:focus {
  outline: none;
  border-color: var(--rice-wine-gold);
  box-shadow: 0 0 0 3px rgba(232, 200, 115, 0.15);
}
```

### 分隔线

```css
.divider {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--caramel-brown) 20%,
    var(--rice-wine-gold) 50%,
    var(--caramel-brown) 80%,
    transparent 100%
  );
  opacity: 0.2;
  margin: 24px 0;
}

/* 带图案的分隔线 */
.divider-fancy {
  display: flex;
  align-items: center;
  gap: 16px;
}

.divider-fancy::before,
.divider-fancy::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--caramel-brown), transparent);
  opacity: 0.2;
}

.divider-fancy .icon {
  color: var(--rice-wine-gold);
  font-size: 12px;
}
```

---

## 场景氛围

### 开场动画

**主题：黎明 · 新生**

从黑暗到晨曦，象征发酵的开始。

```
背景：#000 → #F5E6E0 (破晓粉) → #F5F0E6 (酵母米)
粒子：奶白色小气泡，缓慢上升
光效：金色晨光从上方洒下
音效：轻柔的环境音，偶尔的气泡声
```

### 主界面

**主题：弄堂 · 午后**

温暖、亲切的小店氛围。

```
背景：酵母米 #F5F0E6 + 微妙纹理
粒子：金色灰尘在阳光中漂浮
光效：柔和的暖光从侧面照入
元素：手写风格的标题，圆润的按钮
```

### 章节选择

**主题：酿造坊**

展示不同的酿造世界。

```
背景：根据章节变化色调
 - 奶酪谷：破晓粉 + 米酒金
 - 蜜糖湾：黎明金 + 蜂蜜琥珀
 - 浆果林：暮光紫 + 浆果红
粒子：发酵气泡从底部升起
交互：选中时有涟漪扩散
```

### 游戏关卡

**主题：发酵中**

专注、沉浸的酿造体验。

```
背景：深一点的酵母米，突出操作区
粒子：极少量，不干扰操作
光效：物品周围有微弱的生命光晕
节奏：拖拽物品时有轻微的弹性动画
```

---

## 情感词汇表

设计时参考这些词汇，确保风格一致：

### ✅ 是这样的
```
温暖   亲切   缓慢   有机   真实   手作
生命   呼吸   时间   耐心   期待   静谧
弄堂   午后   阳光   气泡   发酵   酿造
```

### ❌ 不是这样的
```
冰冷   机械   急躁   人工   浮夸   工业
死寂   僵硬   瞬间   急功   焦虑   喧嚣
实验室 科技感 魔法   闪烁   尖锐   扁平
```

---

## 实施检查清单

每个界面完成后，对照检查：

### 色彩
- [ ] 是否使用了暖色调为主？
- [ ] 是否有至少2-3层颜色叠加？
- [ ] 强调色是否使用了米酒金或相关色？

### 纹理
- [ ] 背景是否有微妙的纹理？
- [ ] 卡片是否有内部光效？
- [ ] 是否避免了大面积纯色？

### 动效
- [ ] 动画是否足够缓慢（>2秒周期）？
- [ ] 是否有持续的微妙动态？
- [ ] 交互反馈是否柔和？

### 生命力
- [ ] 是否有"活着"的感觉？
- [ ] 留白处是否有微粒子？
- [ ] 是否能感受到"时间在流动"？

### 情感
- [ ] 是否感觉温暖亲切？
- [ ] 是否感觉可以慢下来？
- [ ] 是否像一家有人情味的小店？

---

## 快速参考

### 核心色彩
```
背景：#F5F0E6 (酵母米)
卡片：#FFFDF7 (奶沫白)
主色：#E8C873 (米酒金)
文字：#6B5344 (老木褐)
生机：#7BA37B (苔藓绿)
```

### 核心动效
```
呼吸周期：4秒
气泡速度：0.2-0.8px/帧
过渡时长：0.4-0.6秒
缓动函数：ease, ease-out
```

### 核心原则
```
生机 > 奇幻
温度 > 科技
层次 > 扁平
静谧中的活力
```

---

*宝珠酿造 · 在时间里慢慢发酵的游戏*

*最后更新：2026年1月*
