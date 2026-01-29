// ========================================
// 宝珠酿造 · 合成宇宙 V2 数据库 - 配方与物品
// ========================================

// 合成配方数据库（基于新方案）
const RECIPES = [
    // ========== 第一章核心配方：酪之初启 ==========
    
    // 第1关：第一缕甜
    { ingredients: ["牛奶", "冰糖碎"], result: "甜牛奶", time: 0, msg: "甜蜜的开始" },
    
    // 第2关：凝固之术
    { ingredients: ["牛奶", "酿造"], result: "奶酪", time: 5, msg: "100度低温烤制中..." },
    
    // 第3关：双酪之约
    // 雪酪 = 甜牛奶 + 酿造（甜液体凝固 = 轻盈版酪）
    { ingredients: ["甜牛奶", "酿造"], result: "雪酪", time: 5, msg: "甜蜜凝固，轻盈雪酪诞生..." },
    { ingredients: ["酿造", "甜牛奶"], result: "雪酪", time: 5, msg: "甜蜜凝固，轻盈雪酪诞生..." },
    { ingredients: ["奶酪", "雪酪"], result: "双酪", time: 0, msg: "双酪合璧，厚与轻，一体两面" },
    
    // 第4关：香气之约 - 桂花酒酿
    { ingredients: ["桂花", "酒酿原浆"], result: "桂花酒酿", time: 3, msg: "桂花香气融入酒酿..." },
    { ingredients: ["酒酿原浆", "桂花"], result: "桂花酒酿", time: 3, msg: "桂花香气融入酒酿..." },
    
    // 第5关：酪饮之道 - 酒酿玫瑰酪
    { ingredients: ["玫瑰", "酒酿原浆"], result: "玫瑰酒酿", time: 3, msg: "玫瑰香气融入酒酿..." },
    { ingredients: ["酒酿原浆", "玫瑰"], result: "玫瑰酒酿", time: 3, msg: "玫瑰香气融入酒酿..." },
    { ingredients: ["双酪", "玫瑰酒酿"], result: "酒酿玫瑰酪", time: 0, msg: "玫瑰与酪的舞蹈！", isTarget: true },
    
    // 第6关 Boss：冰酒酿桂花酪
    { ingredients: ["双酪", "桂花酒酿"], result: "酒酿桂花酪", time: 0, msg: "桂花与酪的醇香！" },
    { ingredients: ["酒酿桂花酪", "冰块"], result: "冰酒酿桂花酪", time: 0, msg: "经典之作！", isTarget: true },
    
    // ========== 辅助配方（兼容旧版/备用路径） ==========
    { ingredients: ["牛奶", "冰块"], result: "冰牛奶", time: 0, msg: "清凉一下" },
    { ingredients: ["甜牛奶", "酒酿原浆"], result: "酿香奶底", time: 0, msg: "酒酿的香气开始弥漫" },
    { ingredients: ["酿香奶底", "冰块"], result: "冰酥基底", time: 0, msg: "基底已成" },
    { ingredients: ["冰酥基底", "酒酿原浆"], result: "冰酥酪", time: 0, msg: "冰酥酪完成！", isTarget: true },
    { ingredients: ["冰牛奶", "酒酿原浆"], result: "冰酿奶", time: 0, msg: "冰与酒酿的相遇" },
    { ingredients: ["冰酿奶", "冰糖碎"], result: "冰酥酪", time: 0, msg: "另一种方式完成冰酥酪！", isTarget: true },
    
    // 雪域酸奶路径
    { ingredients: ["牛奶", "菌种"], result: "发酵奶", time: 3, msg: "发酵中，请稍候..." },
    { ingredients: ["发酵奶", "冰糖碎"], result: "原味酸奶", time: 0, msg: "原味的美好" },
    { ingredients: ["原味酸奶", "冰糖碎"], result: "雪域酸奶", time: 2, msg: "四步两次发酵...", isTarget: true },
    { ingredients: ["原味酸奶", "冰块"], result: "冰镇酸奶", time: 0, msg: "冰镇的清爽" },
    { ingredients: ["冰镇酸奶", "冰糖碎"], result: "雪域酸奶", time: 0, msg: "冰镇版雪域酸奶！", isTarget: true },
    
    // 双酪底（兼容旧版，映射到双酪）
    { ingredients: ["奶酪", "奶酪"], result: "浓酪底", time: 0, msg: "双倍浓郁" },
    { ingredients: ["浓酪底", "冰糖碎"], result: "双酪", time: 0, msg: "另一种双酪！" },
    
    // 冰酒酿桂花酪备用路径
    { ingredients: ["桂花原浆", "酒酿原浆"], result: "桂花酒酿", time: 3, msg: "桂花原浆融入酒酿..." },
    { ingredients: ["奶酪", "桂花酒酿"], result: "桂香奶酪", time: 0, msg: "桂花香气包裹奶酪" },
    { ingredients: ["桂香奶酪", "雪酪"], result: "酒酿桂花酪", time: 0, msg: "创新路径！" },
    { ingredients: ["雪酪", "桂花"], result: "桂花雪酪", time: 0, msg: "桂花飘落雪酪" },
    { ingredients: ["桂花雪酪", "酒酿原浆"], result: "酒酿桂花酪", time: 2, msg: "酒酿慢慢渗入..." },
    
    // ========== 花之山脉（世界2） ==========
    { ingredients: ["桂花酪底", "芋头圆子"], result: "酒酿桂花酪（自然发酵甜）", time: 0, msg: "自然发酵的甜！", isTarget: true },
    { ingredients: ["双酪底", "玫瑰原浆"], result: "玫瑰酪底", time: 0, msg: "玫瑰香气扑鼻" },
    { ingredients: ["玫瑰酪底", "冰块"], result: "双酪玫瑰", time: 0, msg: "玫瑰与酪的舞蹈" },
    { ingredients: ["双酪玫瑰", "燕麦爆爆珠"], result: "酒酿玫瑰酪", time: 0, msg: "酒酿玫瑰酪完成！", isTarget: true },
    { ingredients: ["雪域酸奶", "茉莉花液"], result: "茉莉酸奶", time: 0, msg: "茉莉清香" },
    { ingredients: ["茉莉酸奶", "雪酪"], result: "茉莉酸奶底", time: 0, msg: "茉莉酸奶底完成" },
    { ingredients: ["茉莉酸奶底", "抹茶酱"], result: "岩间茉莉酸奶昔", time: 0, msg: "岩间茉莉！", isTarget: true },
    
    // ========== 果野平原（世界3） ==========
    { ingredients: ["奶酪", "芭乐浆"], result: "果味酪底", time: 0, msg: "水果的酸甜" },
    { ingredients: ["果味酪底", "草莓酱"], result: "草莓芭乐底", time: 0, msg: "莓果香气" },
    { ingredients: ["草莓芭乐底", "燕麦爆爆珠"], result: "珍珠芭乐草莓酪", time: 0, msg: "珍珠芭乐草莓酪！", isTarget: true },
    { ingredients: ["雪域酸奶", "蓝莓"], result: "莓果酸奶", time: 0, msg: "莓果的甜蜜" },
    { ingredients: ["莓果酸奶", "巴西莓酸奶"], result: "双莓底", time: 0, msg: "双莓合璧" },
    { ingredients: ["双莓底", "草莓酱"], result: "三重莓果VC酸奶昔", time: 0, msg: "三重莓果！", isTarget: true },
    { ingredients: ["双酪底", "蜂蜜柚子茶酱"], result: "柚子酪底", time: 0, msg: "柚子清香" },
    { ingredients: ["柚子酪底", "冰块"], result: "清爽柚子底", time: 0, msg: "清爽一夏" },
    { ingredients: ["清爽柚子底", "西柚粒"], result: "青青柚子酪", time: 0, msg: "青青柚子酪！", isTarget: true },
    
    // ========== 谷物峡谷（世界4） ==========
    { ingredients: ["混合坚果", "加热"], result: "脆烤坚果", time: 2, msg: "烘烤中..." },
    { ingredients: ["雪域酸奶", "脆烤坚果"], result: "坚果酸奶底", time: 0, msg: "坚果香脆" },
    { ingredients: ["坚果酸奶底", "蜂蜜"], result: "0蔗糖脆烤坚果酸奶碗", time: 0, msg: "健康美味！", isTarget: true },
    { ingredients: ["酒酿酸奶", "可可粉"], result: "可可酸奶", time: 0, msg: "可可香浓" },
    { ingredients: ["可可酸奶", "燕麦圈"], result: "可可麦圈底", time: 0, msg: "麦圈香脆" },
    { ingredients: ["可可麦圈底", "奥利奥碎"], result: "可可麦圈酸奶碗", time: 0, msg: "童年的味道！", isTarget: true },
    
    // ========== 温差雪峰（世界5） ==========
    { ingredients: ["茉莉花茶", "Kiri芝士"], result: "芝士茶底", time: 0, msg: "芝士与茶相遇" },
    { ingredients: ["芝士茶底", "加热"], result: "温热芝士茶", time: 2, msg: "加热中..." },
    { ingredients: ["温热芝士茶", "牛奶"], result: "听泉茉白", time: 0, msg: "听泉茉白！", isTarget: true },
    { ingredients: ["Kiri芝士", "牛奶"], result: "芝士奶底", time: 0, msg: "芝士奶底" },
    { ingredients: ["芝士奶底", "玫瑰花"], result: "玫瑰茶奶", time: 0, msg: "玫瑰香气" },
    { ingredients: ["玫瑰茶奶", "加热"], result: "五鼎芝玫瑰烤奶", time: 3, msg: "烤制中...", isTarget: true },
    
    // ========== 终极合成 ==========
    { ingredients: ["桂花原浆", "玫瑰原浆"], result: "双花蜜", time: 0, msg: "两生花" },
    { ingredients: ["双花蜜", "茉莉花液"], result: "三花酿", time: 0, msg: "三花合一" },
    { ingredients: ["三花酿", "双酪底"], result: "宝珠精华", time: 3, msg: "精华凝聚中..." },
    { ingredients: ["宝珠精华", "蜂蜜"], result: "天赐宝珠酪", time: 5, msg: "传奇诞生！", isTarget: true },
    
    // ========== 辅助合成（酒酿酸奶等） ==========
    { ingredients: ["雪域酸奶", "酒酿原浆"], result: "酒酿酸奶", time: 0, msg: "酒酿酸奶" },
    { ingredients: ["奇亚籽", "牛奶"], result: "奇亚籽奶", time: 2, msg: "奇亚籽膨胀中..." },
];

// 元素信息库
const ITEMS = {
    // 基础原料
    "牛奶": { icon: "🥛", type: "base", desc: "新鲜牛奶" },
    "酒酿原浆": { icon: "🍶", type: "base", desc: "40天酿造的原浆" },
    "冰糖碎": { icon: "🍬", type: "base", desc: "天然冰糖" },
    "冰块": { icon: "🧊", type: "base", desc: "清凉冰块" },
    "菌种": { icon: "🦠", type: "base", desc: "发酵菌种" },
    "酿造": { icon: "🏺", type: "process", desc: "酿造工艺" },
    "加热": { icon: "🔥", type: "tool", desc: "加热工具" },
    "冷冻": { icon: "❄️", type: "tool", desc: "冷冻工具" },
    
    // 花类原料
    "桂花": { icon: "🌼", type: "floral", desc: "桂林金桂，秋天最温柔的香气" },
    "桂花原浆": { icon: "🌼", type: "floral", desc: "桂花原浆" },
    "玫瑰": { icon: "🌹", type: "floral", desc: "平阴玫瑰，千年花都的馈赠" },
    "玫瑰花": { icon: "🌹", type: "floral", desc: "平阴玫瑰（旧版兼容）" },
    "玫瑰原浆": { icon: "🌹", type: "floral", desc: "玫瑰原浆" },
    "茉莉花茶": { icon: "🍵", type: "floral", desc: "茉莉花茶" },
    "茉莉花液": { icon: "🍵", type: "floral", desc: "茉莉花液" },
    
    // 水果类
    "西柚粒": { icon: "🍊", type: "fruit", desc: "新鲜西柚" },
    "蜂蜜柚子茶酱": { icon: "🍯", type: "fruit", desc: "蜂蜜柚子" },
    "草莓酱": { icon: "🍓", type: "fruit", desc: "草莓酱" },
    "芭乐浆": { icon: "🥝", type: "fruit", desc: "红芭乐浆" },
    "蓝莓": { icon: "🫐", type: "fruit", desc: "新鲜蓝莓" },
    "牛油果": { icon: "🥑", type: "fruit", desc: "新鲜牛油果" },
    "火龙果": { icon: "🐉", type: "fruit", desc: "火龙果" },
    "蜜瓜丁": { icon: "🍈", type: "fruit", desc: "蜜瓜丁" },
    "香蕉片": { icon: "🍌", type: "fruit", desc: "香蕉片" },
    
    // 谷物坚果类
    "燕麦爆爆珠": { icon: "💥", type: "grain", desc: "爆爆珠" },
    "奇亚籽": { icon: "🌰", type: "grain", desc: "奇亚籽" },
    "混合坚果": { icon: "🥜", type: "grain", desc: "混合坚果" },
    "燕麦谷物": { icon: "🌾", type: "grain", desc: "燕麦谷物" },
    "燕麦圈": { icon: "⭕", type: "grain", desc: "燕麦圈" },
    "椰子脆片": { icon: "🥥", type: "grain", desc: "椰子脆片" },
    "奥利奥碎": { icon: "🍪", type: "grain", desc: "奥利奥碎" },
    "可可粉": { icon: "🍫", type: "grain", desc: "生可可粉" },
    
    // 特殊原料
    "香气封印": { icon: "🔮", type: "special", desc: "封印着花香的神秘容器", extracts: ["桂花原浆"] },
    "Kiri芝士": { icon: "🧀", type: "special", desc: "Kiri芝士酪乳" },
    "巴西莓酸奶": { icon: "🍇", type: "special", desc: "巴西莓酸奶" },
    "抹茶酱": { icon: "🍵", type: "special", desc: "抹茶酱" },
    "小芋圆": { icon: "🟣", type: "special", desc: "小芋圆" },
    "芋头圆子": { icon: "🟣", type: "special", desc: "芋头圆子" },
    "雪梨银耳羹": { icon: "🍐", type: "special", desc: "雪梨银耳羹" },
    "红茶": { icon: "🫖", type: "special", desc: "正山小种" },
    "蜂蜜": { icon: "🍯", type: "special", desc: "椴树雪蜜" },
    
    // 中间产物
    "甜牛奶": { icon: "🥛", type: "mid", desc: "甜蜜的开始" },
    "冰牛奶": { icon: "🥛", type: "mid", desc: "清凉牛奶" },
    "酿香奶底": { icon: "🥣", type: "mid", desc: "酒酿香气的奶底" },
    "冰酥基底": { icon: "🍨", type: "mid", desc: "冰酥酪的基底" },
    "冰酿奶": { icon: "🥛", type: "mid", desc: "冰与酒酿的相遇" },
    "发酵奶": { icon: "🥛", type: "mid", desc: "发酵中的奶" },
    "原味酸奶": { icon: "🥛", type: "mid", desc: "原味酸奶" },
    "冰镇酸奶": { icon: "🥛", type: "mid", desc: "冰镇的清爽" },
    "奶酪": { icon: "🧀", type: "mid", desc: "中式奶酪，100度低温烤制" },
    "雪酪": { icon: "🍨", type: "mid", desc: "轻盈雪酪，甜牛奶凝固而成" },
    "浓酪底": { icon: "🧀", type: "mid", desc: "双倍浓郁" },
    "双酪": { icon: "🥣", type: "mid", desc: "双酪合璧，厚与轻，一体两面" },
    "双酪底": { icon: "🥣", type: "mid", desc: "双酪合璧（旧版兼容）" },
    "桂花酒酿": { icon: "🌼", type: "mid", desc: "桂花香气融入酒酿" },
    "玫瑰酒酿": { icon: "🌹", type: "mid", desc: "玫瑰香气融入酒酿" },
    "桂香奶酪": { icon: "🌼", type: "mid", desc: "桂花香气包裹奶酪" },
    "桂花雪酪": { icon: "🌼", type: "mid", desc: "桂花飘落雪酪" },
    "桂花酪底": { icon: "🥣", type: "mid", desc: "桂花酪底（旧版兼容）" },
    "玫瑰酪底": { icon: "🌹", type: "mid", desc: "玫瑰酪底" },
    "双酪玫瑰": { icon: "🌹", type: "mid", desc: "双酪玫瑰" },
    "茉莉酸奶": { icon: "🍵", type: "mid", desc: "茉莉酸奶" },
    "茉莉酸奶底": { icon: "🍵", type: "mid", desc: "茉莉酸奶底" },
    "果味酪底": { icon: "🥣", type: "mid", desc: "果味酪底" },
    "草莓芭乐底": { icon: "🍓", type: "mid", desc: "草莓芭乐底" },
    "莓果酸奶": { icon: "🫐", type: "mid", desc: "莓果酸奶" },
    "双莓底": { icon: "🫐", type: "mid", desc: "双莓底" },
    "柚子酪底": { icon: "🍊", type: "mid", desc: "柚子酪底" },
    "清爽柚子底": { icon: "🍊", type: "mid", desc: "清爽柚子底" },
    "脆烤坚果": { icon: "🥜", type: "mid", desc: "脆烤坚果" },
    "坚果酸奶底": { icon: "🥜", type: "mid", desc: "坚果酸奶底" },
    "可可酸奶": { icon: "🍫", type: "mid", desc: "可可酸奶" },
    "可可麦圈底": { icon: "🍫", type: "mid", desc: "可可麦圈底" },
    "芝士茶底": { icon: "🧀", type: "mid", desc: "芝士茶底" },
    "温热芝士茶": { icon: "🍵", type: "mid", desc: "温热芝士茶" },
    "芝士奶底": { icon: "🧀", type: "mid", desc: "芝士奶底" },
    "玫瑰茶奶": { icon: "🌹", type: "mid", desc: "玫瑰茶奶" },
    "酒酿酸奶": { icon: "🍶", type: "mid", desc: "酒酿酸奶" },
    "奇亚籽奶": { icon: "🌰", type: "mid", desc: "奇亚籽奶" },
    "双花蜜": { icon: "🌸", type: "mid", desc: "两种花蜜的融合" },
    "三花酿": { icon: "🌸", type: "mid", desc: "三花合一" },
    "宝珠精华": { icon: "✨", type: "mid", desc: "宝珠精华" },
    
    // 最终产品
    "冰酥酪": { icon: "🍨", type: "final", desc: "宝珠的第一碗" },
    "雪域酸奶": { icon: "🥛", type: "final", desc: "四步两次发酵" },
    "酒酿桂花酪": { icon: "🌼", type: "mid", desc: "双酪与桂花酒酿的醇香融合" },
    "冰酒酿桂花酪": { icon: "🧊", type: "final", desc: "宝珠经典之作，桂花香与酒酿的完美融合，冰凉清爽" },
    "酒酿玫瑰酪": { icon: "🌹", type: "final", desc: "玫瑰与酪的舞蹈，芬芳满溢" },
    "酒酿桂花酪（自然发酵甜）": { icon: "🌼", type: "final", desc: "自然发酵的甜" },
    "酒酿玫瑰酪": { icon: "🌹", type: "final", desc: "玫瑰与酪的舞蹈" },
    "岩间茉莉酸奶昔": { icon: "🍵", type: "final", desc: "清新脱俗" },
    "珍珠芭乐草莓酪": { icon: "🍓", type: "final", desc: "莓果酸甜" },
    "三重莓果VC酸奶昔": { icon: "🫐", type: "final", desc: "三重莓果的力量" },
    "青青柚子酪": { icon: "🍊", type: "final", desc: "清新如春" },
    "0蔗糖脆烤坚果酸奶碗": { icon: "🥜", type: "final", desc: "健康美味" },
    "可可麦圈酸奶碗": { icon: "🍫", type: "final", desc: "童年的味道" },
    "听泉茉白": { icon: "🍵", type: "final", desc: "温润如春" },
    "五鼎芝玫瑰烤奶": { icon: "🌹", type: "final", desc: "温暖整个冬天" },
    "天赐宝珠酪": { icon: "✨", type: "ultimate", desc: "所有味道的和声" }
};

// 故事文案
const STORY = {
    opening: {
        line1: "十三年慢酿的秘法，被时间吹散。",
        line2: "请你，帮我们把味道找回来。"
    },
    worlds: {
        1: "找回最基础的酪与酸奶。",
        2: "重新点亮桂花、玫瑰、茉莉的香路。",
        3: "让莓果与柚子再次撞进雪酪里。",
        4: "让爆爆珠、奇亚籽和坚果重新发出声音。",
        5: "在冷热之间找回冬日一杯热饮的慰藉。",
        6: "十三年日落月升，终归于一碗。"
    },
    // 关卡过渡文案
    transitions: {
        "101to102": "你学会了献上。现在，让时间成为你的伙伴。",
        "102to103": "发酵的奥秘已被掌握。试着探索物品更深的秘密。",
        "103to1": "你已经掌握了基本的酿造之道。真正的旅程现在开始。",
        "1to2": "有了冰酥酪，还需要另一种魔法——发酵。",
        "2to3": "酸奶与酪都已苏醒，是时候创造经典了。",
        "3to4": "奶酪谷的基础已经稳固，花之山脉在远方招手。",
        "4to5": "桂花的香气弥漫，玫瑰正在等待。",
        "5to6": "三系花香已齐，果野平原的甜蜜在召唤。",
        "6to7": "莓果的酸甜已被驯服，还有更多水果等待探索。",
        "7to8": "柚子的清新完成，莓果森林正在苏醒。",
        "8to9": "双莓的力量已凝聚，柚子的清泉在前方。",
        "9to10": "果野平原已恢复生机，谷物峡谷的声音传来。",
        "10to11": "坚果的香脆已被唤醒，可可的甜蜜在等待。",
        "11to12": "谷物峡谷已复苏，温差雪峰的暖意在召唤。",
        "12to13": "茉莉的温暖已传递，玫瑰烤奶正在等待。",
        "13to14": "所有世界已被点亮，终极圣殿的大门为你敞开。"
    },
    // 品牌文化文案
    brand: {
        history: "2010年夏天，宝珠奶酪第一家店诞生于上海田子坊。",
        philosophy: "快乐就是酿出食物本真的味道，做一件温暖美好的事。",
        tradition: "《淮南王食经》记载：'有四时饮，夏有酪饮'。",
        craft: "四十天的自然发酵，让糯米在静默中转化。",
        spirit: "像孩子般好奇和勇敢，大胆想象和尝试。",
        season: "我们出售的是流转的春夏与秋冬。"
    }
};

// 提示词库
const TIPS = {
    // 操作提示
    firstDrag: "把两样放得更近一点，味道就会自己说话。",
    failedCombine: "似乎还缺一点什么，不如换个搭配？",
    idle5s: "门后的光在等你试一试新组合。",
    idle10s: "每一次尝试都是发现的开始。",
    
    // 门状态提示
    doorStage1: "酿造室似乎被唤醒了。",
    doorStage2: "好像只差最后一步味道。",
    doorStage3: "这一角酿造之境，被你重新点亮。",
    
    // 成功提示
    successBasic: "很好！继续探索更多组合。",
    successMid: "你让奶更接近宝珠的味道了。",
    successAdvanced: "酿造的智慧正在觉醒。",
    
    // 发现提示
    newDiscovery: "发现了新的配方！",
    rareDiscovery: "这是一个珍贵的发现！"
};

// 智能线索系统（根据组合类型给出引导性提示）
const HINT_SYSTEM = {
    // 同类型物品组合
    sameType: {
        base: "两种基础原料需要一个容器来承载...",
        floral: "花香需要找到载体，也许一些乳制品？",
        fruit: "水果们在等待一个酪底...",
        grain: "谷物需要液体来激活它们的潜力...",
        tool: "工具需要作用于食材...",
        mid: "这两个还不能直接融合，试试分步走？"
    },
    
    // 类型组合提示
    typeHints: {
        "base+base": "试着先做一个基底，比如牛奶+冰糖碎？",
        "base+floral": "花香需要先融入酒酿或奶酪中...",
        "base+fruit": "水果需要一个奶酪或酸奶的基底...",
        "base+grain": "谷物喜欢和酸奶一起...",
        "base+tool": "也许这个工具需要作用于更复杂的东西...",
        "floral+floral": "两种花可以融合，但需要一个载体...",
        "floral+fruit": "花与果的组合很美，但需要酪底...",
        "floral+grain": "花香和谷物还差一个桥梁...",
        "fruit+fruit": "多重水果需要一个基底来承载...",
        "fruit+grain": "水果和谷物需要酸奶来融合...",
        "grain+grain": "试试把它们加入酸奶中...",
        "mid+tool": "试着用工具处理更基础的食材...",
        "final+base": "成品已经完成了，试试其他组合？",
        "final+final": "两个成品不能再合成了..."
    },
    
    // 特定物品提示
    itemHints: {
        "牛奶": "牛奶是一切的基础，试试加入菌种发酵，或者加入酿造变成奶酪？",
        "酒酿原浆": "酒酿原浆可以和牛奶组合，也可以和桂花融合...",
        "菌种": "菌种需要牛奶才能发挥作用...",
        "酿造": "酿造工艺可以把牛奶变成奶酪...",
        "桂花": "桂花的香气需要酒酿来激活...",
        "冰块": "冰块可以让奶底变得清爽...",
        "冰糖碎": "冰糖碎可以给任何东西增添甜蜜..."
    },
    
    // 接近成功的提示（当其中一个物品是目标的前置物品时）
    almostThere: [
        "很接近了！再想想还缺什么...",
        "这个方向是对的，还差一步...",
        "味道快要完整了..."
    ],
    
    // 通用失败提示
    general: [
        "这两个暂时不来电，换个搭配试试？",
        "也许它们各自有更合适的伙伴...",
        "宝珠的配方需要正确的组合...",
        "试着从基础原料开始构建..."
    ]
};

// 成就系统
const ACHIEVEMENTS = {
    // 配方徽章（完成关卡获得）
    recipes: {
        "bingsulao": { name: "冰酥学徒", icon: "🍨", desc: "完成第一碗冰酥酪" },
        "xueyusuannai": { name: "发酵入门", icon: "🥛", desc: "掌握雪域酸奶的秘密" },
        "guihualo": { name: "桂花飘香", icon: "🌼", desc: "制作经典酒酿桂花酪" },
        "meiguilo": { name: "玫瑰之心", icon: "🌹", desc: "掌握酒酿玫瑰酪" },
        "molisuannaixi": { name: "茉莉清香", icon: "🍵", desc: "完成岩间茉莉酸奶昔" },
        "caomeilo": { name: "莓果大师", icon: "🍓", desc: "制作珍珠芭乐草莓酪" },
        "youzilo": { name: "柚子清泉", icon: "🍊", desc: "完成青青柚子酪" },
        "jianguowan": { name: "坚果达人", icon: "🥜", desc: "制作脆烤坚果酸奶碗" },
        "tingquanmobai": { name: "茶香温暖", icon: "🍵", desc: "完成听泉茉白" },
        "tiancibaozhu": { name: "宝珠大师", icon: "✨", desc: "合成天赐宝珠酪" }
    },
    // 特殊成就
    special: {
        "first_synthesis": { name: "初次尝试", icon: "🌟", desc: "完成第一次合成" },
        "world_1_complete": { name: "奶酪谷探险家", icon: "🏔️", desc: "完成奶酪谷所有关卡" },
        "world_2_complete": { name: "花之守护者", icon: "🌸", desc: "完成花之山脉所有关卡" },
        "world_3_complete": { name: "果野行者", icon: "🍇", desc: "完成果野平原所有关卡" },
        "all_complete": { name: "传奇酿造师", icon: "👑", desc: "完成所有关卡" },
        "collector": { name: "配方收藏家", icon: "📚", desc: "发现50种以上物品" }
    }
};

// 故事碎片系统
const FRAGMENTS = [
    // 创始人故事
    {
        id: "origin_1",
        trigger: "冰酥酪",
        category: "founder",
        text: "2010年夏天，田子坊的小巷里，第一盏灯被点亮。",
        image: "🏮"
    },
    {
        id: "origin_2",
        trigger: "雪域酸奶",
        category: "founder",
        text: "白天在写字楼工作，晚上在小店里酿造第二天的饮品。",
        image: "🌙"
    },
    {
        id: "origin_3",
        trigger: "酒酿桂花酪",
        category: "founder",
        text: "快乐就是酿出食物本真的味道，做一件温暖美好的事。",
        image: "💫"
    },
    
    // 传统工艺
    {
        id: "craft_1",
        trigger: "桂花酒酿",
        category: "craft",
        text: "四十天的慢酿，让糯米在静默中转化为酒香。",
        image: "🏺"
    },
    {
        id: "craft_2",
        trigger: "奶酪",
        category: "craft",
        text: "以牛奶和40天自酿的原浆，经由100度低温烤制而成。",
        image: "🔥"
    },
    {
        id: "craft_3",
        trigger: "发酵奶",
        category: "craft",
        text: "四步两次发酵，浓郁绵醇，有一种质朴的美妙。",
        image: "🦠"
    },
    
    // 食材来源
    {
        id: "ingredient_1",
        trigger: "桂花酪底",
        category: "ingredient",
        text: "桂林金桂，秋天最温柔的香气。",
        image: "🌼"
    },
    {
        id: "ingredient_2",
        trigger: "玫瑰酪底",
        category: "ingredient",
        text: "平阴玫瑰，千年花都的馈赠。",
        image: "🌹"
    },
    {
        id: "ingredient_3",
        trigger: "茉莉酸奶",
        category: "ingredient",
        text: "茉莉花茶，古老的东方香气。",
        image: "🍵"
    },
    
    // 品牌哲学
    {
        id: "philosophy_1",
        trigger: "双酪底",
        category: "philosophy",
        text: "健康天然，用传统工艺酿出食物本真的味道。",
        image: "🌿"
    },
    {
        id: "philosophy_2",
        trigger: "三花酿",
        category: "philosophy",
        text: "像孩子般好奇和勇敢，大胆想象和尝试。",
        image: "👶"
    },
    {
        id: "philosophy_3",
        trigger: "天赐宝珠酪",
        category: "philosophy",
        text: "十三年日落月升，终归于一碗。",
        image: "✨"
    },
    
    // 历史传承
    {
        id: "history_1",
        trigger: "雪酪",
        category: "history",
        text: "《淮南王食经》记载：有四时饮，夏有酪饮。",
        image: "📜"
    },
    {
        id: "history_2",
        trigger: "原味酸奶",
        category: "history",
        text: "唐朝开始，酪饮就成为公主们的下午茶。",
        image: "👑"
    },
    
    // 季节故事
    {
        id: "season_1",
        trigger: "青青柚子酪",
        category: "season",
        text: "我们出售的是流转的春夏与秋冬。",
        image: "🍂"
    }
];

// 隐藏配方（额外发现奖励）
const HIDDEN_RECIPES = [
    { ingredients: ["桂花酒酿", "玫瑰酪底"], result: "双花恋酪", time: 0, msg: "两种花香的邂逅！" },
    { ingredients: ["三花酿", "蜂蜜"], result: "蜜语花酿", time: 0, msg: "甜蜜的秘密配方！" },
    { ingredients: ["冰酥酪", "蓝莓"], result: "蓝莓冰酥", time: 0, msg: "意外的美味组合！" },
    { ingredients: ["雪域酸奶", "火龙果"], result: "火龙酸奶", time: 0, msg: "色彩的碰撞！" },
    { ingredients: ["茉莉酸奶", "桂花酒酿"], result: "茉桂双香", time: 0, msg: "两种香气的融合！" }
];

// 将隐藏配方添加到主配方列表
RECIPES.push(...HIDDEN_RECIPES);

// 为隐藏配方添加物品定义
ITEMS["双花恋酪"] = { icon: "💐", type: "hidden", desc: "桂花与玫瑰的邂逅", hidden: true };
ITEMS["蜜语花酿"] = { icon: "🍯", type: "hidden", desc: "甜蜜的秘密配方", hidden: true };
ITEMS["蓝莓冰酥"] = { icon: "🫐", type: "hidden", desc: "意外的美味组合", hidden: true };
ITEMS["火龙酸奶"] = { icon: "🐉", type: "hidden", desc: "色彩的碰撞", hidden: true };
ITEMS["茉桂双香"] = { icon: "🌸", type: "hidden", desc: "两种香气的融合", hidden: true };

// ========================================
// 物品属性系统 - 帮助玩家推理合成关系
// ========================================
// 玩家长按物品时显示属性标签，通过属性匹配推理合成
const ITEM_ATTRIBUTES = {
    // ========== 基础原料 ==========
    "牛奶": {
        tags: ["液体", "基底", "可凝固", "可发酵"],
        color: "white",
        hint: "新鲜牛奶，一切的起点"
    },
    "冰糖碎": {
        tags: ["粉末", "甜味", "可溶解"],
        color: "yellow",
        hint: "天然冰糖，增添甜蜜"
    },
    "酿造": {
        tags: ["工艺", "可使液体凝固", "需要时间"],
        color: "brown",
        hint: "酿造工艺，让液体变成酪"
    },
    "酒酿原浆": {
        tags: ["酒类", "香醇", "可载香", "液体"],
        color: "amber",
        hint: "40天自酿的原浆，可以承载花香"
    },
    "菌种": {
        tags: ["催化剂", "需要液体", "需要时间"],
        color: "green",
        hint: "发酵菌种，需要液体和时间"
    },
    "冰块": {
        tags: ["固体", "冷感", "可冰镇"],
        color: "blue",
        hint: "清凉冰块，给饮品降温"
    },
    
    // ========== 花类原料 ==========
    "桂花": {
        tags: ["花香", "干燥", "可融入酒类"],
        color: "gold",
        hint: "桂林金桂，香气需要酒酿来唤醒"
    },
    "玫瑰": {
        tags: ["花香", "干燥", "可融入酒类"],
        color: "pink",
        hint: "平阴玫瑰，香气需要酒酿来唤醒"
    },
    
    // ========== 中间产物 ==========
    "甜牛奶": {
        tags: ["液体", "甜", "可凝固", "可发酵"],
        color: "white",
        hint: "甜蜜的牛奶，加酿造可变成轻盈的雪酪"
    },
    "奶酪": {
        tags: ["凝固态", "醇厚", "可变轻盈", "可融合风味"],
        color: "cream",
        hint: "中式奶酪，加甜味可变轻盈"
    },
    "雪酪": {
        tags: ["凝固态", "轻盈", "甜", "可融合风味"],
        color: "white",
        hint: "轻盈雪酪，甜牛奶凝固而成"
    },
    "双酪": {
        tags: ["复合酪底", "醇厚与轻盈兼具", "可融合风味", "需要香酿点睛"],
        color: "cream",
        hint: "双酪合璧，需要酒酿来点睛"
    },
    "桂花酒酿": {
        tags: ["酒香", "花香", "可提升风味", "可点睛酪底"],
        color: "gold",
        hint: "桂花香气融入酒酿，可以点睛双酪"
    },
    "玫瑰酒酿": {
        tags: ["酒香", "花香", "可提升风味", "可点睛酪底"],
        color: "pink",
        hint: "玫瑰香气融入酒酿，可以点睛双酪"
    },
    // ========== 最终产品 ==========
    "酒酿桂花酪": {
        tags: ["酪饮", "桂花香", "酒酿味", "可冰镇"],
        color: "gold",
        hint: "酒酿桂花酪，加冰块即成经典"
    },
    "冰酒酿桂花酪": {
        tags: ["经典成品", "桂花香", "酒酿味", "冰凉"],
        color: "gold",
        hint: "宝珠经典之作"
    },
    "酒酿玫瑰酪": {
        tags: ["经典成品", "玫瑰香", "酒酿味"],
        color: "pink",
        hint: "玫瑰与酪的舞蹈"
    }
};

// 属性匹配规则 - 用于推理系统
const ATTRIBUTE_RULES = [
    {
        rule: "甜化",
        match: ["液体", "甜味"],
        description: "液体 + 甜味 → 甜液体"
    },
    {
        rule: "凝固",
        match: ["可凝固", "工艺"],
        description: "液体 + 酿造工艺 → 凝固成酪"
    },
    {
        rule: "轻盈凝固",
        match: ["甜", "可凝固", "工艺"],
        description: "甜液体 + 酿造 → 轻盈版酪（雪酪）"
    },
    {
        rule: "双酪合璧",
        match: ["凝固态", "凝固态"],
        description: "奶酪 + 雪酪 → 双酪（厚与轻合一）"
    },
    {
        rule: "香酿",
        match: ["花香", "可载香"],
        description: "花香物 + 酒酿原浆 → 花香酒酿"
    },
    {
        rule: "酪饮",
        match: ["复合酪底", "可点睛酪底"],
        description: "双酪 + 花香酒酿 → 酪饮品"
    },
    {
        rule: "冰镇",
        match: ["可冰镇", "冷感"],
        description: "酪饮 + 冰块 → 冰凉版本"
    }
];

// 导出
window.RECIPES = RECIPES;
window.ITEMS = ITEMS;
window.STORY = STORY;
window.TIPS = TIPS;
window.HINT_SYSTEM = HINT_SYSTEM;
window.ACHIEVEMENTS = ACHIEVEMENTS;
window.FRAGMENTS = FRAGMENTS;
window.ITEM_ATTRIBUTES = ITEM_ATTRIBUTES;
window.ATTRIBUTE_RULES = ATTRIBUTE_RULES;

