// ========================================
// 宝珠酿造 · 合成宇宙 V2 数据库
// ========================================

// 世界配置
const WORLDS = [
    {
        id: 1,
        name: "奶酪谷",
        subtitle: "乳制基础",
        description: "从牛奶到酪的基础认知，建立酿造语言。",
        theme: "dairy",
        color: "#FFF5E6",
        icon: "🥛",
        unlocked: true,
        levels: [101, 102, 103, 1, 2, 3]  // 新增3个基础关在最前面
    },
    {
        id: 2,
        name: "花之山脉",
        subtitle: "花香系统",
        description: "桂花、玫瑰、茉莉，三系花类世界。",
        theme: "floral",
        color: "#FFE4E1",
        icon: "🌸",
        unlocked: false,
        levels: [4, 5, 6]
    },
    {
        id: 3,
        name: "果野平原",
        subtitle: "水果属性",
        description: "酸甜清爽，水果与乳的碰撞。",
        theme: "fruit",
        color: "#E8F5E9",
        icon: "🍓",
        unlocked: false,
        levels: [7, 8, 9]
    },
    {
        id: 4,
        name: "谷物峡谷",
        subtitle: "谷物与坚果",
        description: "爆爆珠、奇亚籽和坚果的物理实验。",
        theme: "grain",
        color: "#FFF8E1",
        icon: "🌾",
        unlocked: false,
        levels: [10, 11]
    },
    {
        id: 5,
        name: "温差雪峰",
        subtitle: "冷热与热饮",
        description: "在冷热之间找回冬日的慰藉。",
        theme: "temperature",
        color: "#E3F2FD",
        icon: "❄️",
        unlocked: false,
        levels: [12, 13]
    },
    {
        id: 6,
        name: "宝珠大成",
        subtitle: "终极圣殿",
        description: "十三年日落月升，终归于一碗。",
        theme: "ultimate",
        color: "#D4A574",
        icon: "✨",
        unlocked: false,
        levels: [14]
    }
];

// 关卡配置（基于新方案）
const LEVELS = [
    // ========== 基础教学关（世界1前置） ==========
    {
        id: 101,
        worldId: 1,
        name: "唤醒之手",
        target: "甜牛奶",
        targetId: "tutorial_1",
        description: "合成，然后献上。",
        storyIntro: "一切开始于最简单的组合。",
        icon: "🥛",
        duration: "15-30秒",
        initialItems: ["牛奶", "冰糖碎"],
        doorTriggers: {
            stage1: [],
            stage2: [],
            stage3: ["甜牛奶"]
        },
        completionText: "你唤醒了第一缕甜。",
        cultureNote: "牛奶与冰糖，最朴素的甜蜜开始。",
        realProductNote: "现实中：这是宝珠许多饮品的基础。",
        isTutorial: true,
        tutorialFocus: "approach_and_offer"  // 教学重点：靠近+献上
    },
    {
        id: 102,
        worldId: 1,
        name: "时间的答案",
        target: "发酵奶",
        targetId: "tutorial_2",
        description: "有时候，等待就是答案。",
        storyIntro: "发酵需要时间，耐心是酿造的一部分。",
        icon: "🦠",
        duration: "30-45秒",
        initialItems: ["牛奶", "菌种"],
        doorTriggers: {
            stage1: [],
            stage2: [],
            stage3: ["发酵奶"]
        },
        completionText: "时间给了牛奶新的生命。",
        cultureNote: "四步两次发酵，是宝珠酸奶的灵魂工艺。",
        realProductNote: "宝珠的发酵工艺传承自古老的中式酿造。",
        isTutorial: true,
        tutorialFocus: "pause_wait"  // 教学重点：静置等待
    },
    {
        id: 103,
        worldId: 1,
        name: "抽丝剥茧",
        target: "桂花酒酿",
        targetId: "tutorial_3",
        description: "长按物品，发现它的秘密。",
        storyIntro: "有些原料藏着更多的可能。",
        icon: "🔮",
        duration: "30-60秒",
        initialItems: ["酒酿原浆", "香气封印"],
        doorTriggers: {
            stage1: [],
            stage2: ["桂花原浆"],
            stage3: ["桂花酒酿"]
        },
        completionText: "你学会了探索物品的奥秘。",
        cultureNote: "提取，是发现隐藏可能的方法。",
        realProductNote: "桂花酒酿：酒酿的甘洌与桂花的清香。",
        isTutorial: true,
        tutorialFocus: "extract_longpress"  // 教学重点：长按提取
    },
    
    // ========== 世界1：奶酪谷 ==========
    {
        id: 1,
        worldId: 1,
        name: "冰酥门廊",
        target: "冰酥酪",
        targetId: "bingsulao",
        description: "把味道拼回去。先从最简单的一碗开始。",
        storyIntro: "时间在酒缸里走错了路，老配方散落成字句与原料。",
        icon: "🍨",
        duration: "30-60秒",
        initialItems: ["牛奶", "酒酿原浆", "冰糖碎", "冰块"],
        // 门状态触发条件
        doorTriggers: {
            stage1: ["甜牛奶"],           // 门微光
            stage2: ["冰酥基底"],         // 门震动
            stage3: ["冰酥酪"]            // 门打开
        },
        completionText: "你找回了宝珠的第一碗冰酥酪。",
        cultureNote: "牛奶、米酒和冰糖碎，最简单的组合，需要最长的耐心。",
        realProductNote: "现实中的冰酥酪：牛奶、米酒、冰糖碎，零添加的小甜甜。"
    },
    {
        id: 2,
        worldId: 1,
        name: "酸奶阶梯",
        target: "雪域酸奶",
        targetId: "xueyusuannai",
        description: "发酵，是时间给予的礼物。",
        storyIntro: "有了奶底，还需要另一种魔法——发酵。",
        icon: "🥛",
        duration: "30-60秒",
        initialItems: ["牛奶", "菌种", "冰糖碎"],
        doorTriggers: {
            stage1: ["发酵奶"],
            stage2: ["原味酸奶"],
            stage3: ["雪域酸奶"]
        },
        completionText: "四步两次发酵，浓郁绵醇。",
        cultureNote: "酸奶饮以宝珠雪域酸奶为基础原料，传承经典手工酸奶制作方法。",
        realProductNote: "雪域酸奶：牛奶、菌种、冰糖碎，四步两次发酵。"
    },
    {
        id: 3,
        worldId: 1,
        name: "奶酪试炼",
        target: "酒酿桂花酪",
        targetId: "guihualo",
        description: "第一次触碰经典的味道。",
        storyIntro: "当奶与酿相遇，经典的轮廓开始显现。",
        icon: "🌼",
        duration: "1-2分钟",
        initialItems: ["牛奶", "酒酿原浆", "冰糖碎", "冰块", "桂花", "酿造"],
        doorTriggers: {
            stage1: ["奶酪"],
            stage2: ["雪酪", "桂花酒酿"],
            stage3: ["酒酿桂花酪"]
        },
        completionText: "酒酿桂花酪，宝珠的经典之作。",
        cultureNote: "酒酿的甘洌、奶酪的醇厚、桂花的清香，三者合一。",
        realProductNote: "酒酿桂花酪：奶酪、雪酪、鲜活酒酿米、冰块、桂花原浆、桂林金桂桂花。"
    },

    // ========== 世界2：花之山脉 ==========
    {
        id: 4,
        worldId: 2,
        name: "桂花雨巷",
        target: "酒酿桂花酪（自然发酵甜）",
        targetId: "guihualo_natural",
        description: "桂花香气在空气中扩散，唤醒沉睡的甜。",
        storyIntro: "花之山脉的第一站，桂花正在等待。",
        icon: "🌼",
        duration: "2-3分钟",
        initialItems: ["奶酪", "雪酪", "酒酿原浆", "桂花原浆", "桂花", "芋头圆子", "冰块"],
        doorTriggers: {
            stage1: ["桂花酒酿"],
            stage2: ["双酪底"],
            stage3: ["酒酿桂花酪（自然发酵甜）"]
        },
        completionText: "自然发酵的甜，是时间的馈赠。",
        cultureNote: "桂花，是秋天最温柔的香气。",
        realProductNote: "酒酿桂花酪（自然发酵甜）：奶酪、轻盈雪酪、鲜活酒酿米、桂花酒酿糯米饭、芋头圆子。"
    },
    {
        id: 5,
        worldId: 2,
        name: "玫瑰花径",
        target: "酒酿玫瑰酪",
        targetId: "meiguilo",
        description: "玫瑰的浪漫，需要恰到好处的平衡。",
        storyIntro: "花香会扩散，也会过量。学会平衡是关键。",
        icon: "🌹",
        duration: "2-3分钟",
        initialItems: ["奶酪", "雪酪", "玫瑰原浆", "燕麦爆爆珠", "冰块", "玫瑰花", "火龙果"],
        doorTriggers: {
            stage1: ["玫瑰酪底"],
            stage2: ["双酪玫瑰"],
            stage3: ["酒酿玫瑰酪"]
        },
        completionText: "玫瑰的芬芳与酪的醇厚，完美交融。",
        cultureNote: "平阴玫瑰，千年花都的馈赠。",
        realProductNote: "酒酿玫瑰酪：奶酪、雪酪、玫瑰原浆、燕麦爆爆珠、冰块、平阴玫瑰花干。"
    },
    {
        id: 6,
        worldId: 2,
        name: "茉莉幽谷",
        target: "岩间茉莉酸奶昔",
        targetId: "molisuannaixi",
        description: "茉莉的清香，需要温柔以待。",
        storyIntro: "茉莉花开在山间，香气淡雅悠远。",
        icon: "🍵",
        duration: "2-3分钟",
        initialItems: ["雪酪", "雪域酸奶", "茉莉花液", "燕麦爆爆珠", "冰块", "抹茶酱", "蜜瓜丁"],
        doorTriggers: {
            stage1: ["茉莉酸奶"],
            stage2: ["茉莉酸奶底"],
            stage3: ["岩间茉莉酸奶昔"]
        },
        completionText: "茉莉与抹茶的相遇，清新脱俗。",
        cultureNote: "茉莉花茶，古老的东方香气。",
        realProductNote: "岩间茉莉酸奶昔：雪酪、雪域酸奶、茉莉酸奶、燕麦爆爆珠、冰块、茉莉花液、抹茶酱。"
    },

    // ========== 世界3：果野平原 ==========
    {
        id: 7,
        worldId: 3,
        name: "草莓芭乐园",
        target: "珍珠芭乐草莓酪",
        targetId: "caomeilo",
        description: "酸与甜的碰撞，需要技巧。",
        storyIntro: "水果有自己的脾气，学会与它们相处。",
        icon: "🍓",
        duration: "2-3分钟",
        initialItems: ["奶酪", "雪酪", "芭乐浆", "草莓酱", "燕麦爆爆珠", "冰块", "西柚粒", "牛油果", "蓝莓"],
        doorTriggers: {
            stage1: ["果味酪底"],
            stage2: ["草莓芭乐底"],
            stage3: ["珍珠芭乐草莓酪"]
        },
        completionText: "莓果的酸甜与酪的醇厚，完美平衡。",
        cultureNote: "新鲜水果，是季节最好的礼物。",
        realProductNote: "珍珠芭乐草莓酪：奶酪、雪酪、冷冻红芭乐浆、燕麦爆爆珠、冰块、草莓酱。"
    },
    {
        id: 8,
        worldId: 3,
        name: "莓果森林",
        target: "三重莓果VC酸奶昔",
        targetId: "meiguosuannaixi",
        description: "三重莓果，三重惊喜。",
        storyIntro: "莓果家族齐聚，带来满满的维C。",
        icon: "🫐",
        duration: "2-3分钟",
        initialItems: ["雪酪", "雪域酸奶", "巴西莓酸奶", "草莓酱", "牛油果", "蓝莓", "奇亚籽", "冰块"],
        doorTriggers: {
            stage1: ["莓果酸奶"],
            stage2: ["双莓底"],
            stage3: ["三重莓果VC酸奶昔"]
        },
        completionText: "三重莓果的力量，满满的健康能量。",
        cultureNote: "莓果富含花青素，是大自然的健康馈赠。",
        realProductNote: "三重莓果VC酸奶昔：雪酪、雪域酸奶、巴西莓酸奶、奇亚籽、冰块、草莓酱。"
    },
    {
        id: 9,
        worldId: 3,
        name: "柚子清泉",
        target: "青青柚子酪",
        targetId: "youzilo",
        description: "柚子的清新，让一切变得轻盈。",
        storyIntro: "清爽的柚子，是夏日最好的伙伴。",
        icon: "🍊",
        duration: "1-2分钟",
        initialItems: ["奶酪", "雪酪", "冰块", "蜂蜜柚子茶酱", "西柚粒"],
        doorTriggers: {
            stage1: ["柚子酪底"],
            stage2: ["清爽柚子底"],
            stage3: ["青青柚子酪"]
        },
        completionText: "青青柚子酪，清新如春。",
        cultureNote: "我们出售的是流转的春夏与秋冬。",
        realProductNote: "青青柚子酪：奶酪、雪酪、冰块、蜂蜜柚子茶酱、西柚粒。"
    },

    // ========== 世界4：谷物峡谷 ==========
    {
        id: 10,
        worldId: 4,
        name: "坚果烘焙坊",
        target: "0蔗糖脆烤坚果酸奶碗",
        targetId: "jianguowan",
        description: "坚果的香脆，需要恰到好处的烘烤。",
        storyIntro: "谷物峡谷里，坚果和谷物正在苏醒。",
        icon: "🥜",
        duration: "2-3分钟",
        initialItems: ["雪域酸奶", "奇亚籽", "燕麦谷物", "混合坚果", "椰子脆片", "蜂蜜", "火龙果", "蓝莓", "冰块"],
        doorTriggers: {
            stage1: ["脆烤坚果"],
            stage2: ["坚果酸奶底"],
            stage3: ["0蔗糖脆烤坚果酸奶碗"]
        },
        completionText: "无蔗糖的健康，一样可以美味。",
        cultureNote: "健康天然，用传统工艺酿出食物本真的味道。",
        realProductNote: "0蔗糖脆烤坚果酸奶碗：雪域酸奶（无糖版）、奇亚籽、欧扎克谷物、混合坚果。"
    },
    {
        id: 11,
        worldId: 4,
        name: "可可麦圈屋",
        target: "可可麦圈酸奶碗",
        targetId: "kekewan",
        description: "可可与麦圈，童年的味道。",
        storyIntro: "爆爆珠遇热会爆开，带来惊喜。",
        icon: "🍫",
        duration: "2-3分钟",
        initialItems: ["酒酿酸奶", "可可粉", "燕麦谷物", "椰子脆片", "燕麦圈", "奥利奥碎", "蓝莓", "香蕉片", "冰块"],
        doorTriggers: {
            stage1: ["可可酸奶"],
            stage2: ["可可麦圈底"],
            stage3: ["可可麦圈酸奶碗"]
        },
        completionText: "可可的浓郁，麦圈的香脆，童心满满。",
        cultureNote: "童心激发与生俱来的童心与创意。",
        realProductNote: "可可麦圈酸奶碗：酒酿酸奶、生可可粉、欧扎克谷物、椰子脆片、燕麦圈、奥利奥碎。"
    },

    // ========== 世界5：温差雪峰 ==========
    {
        id: 12,
        worldId: 5,
        name: "茉莉暖阁",
        target: "听泉茉白",
        targetId: "tingquanmobai",
        description: "热饮的温暖，在寒冷中格外珍贵。",
        storyIntro: "温差雪峰上，冷热之间藏着秘密。",
        icon: "🍵",
        duration: "1-2分钟",
        initialItems: ["茉莉花茶", "Kiri芝士", "牛奶", "加热"],
        doorTriggers: {
            stage1: ["芝士茶底"],
            stage2: ["温热芝士茶"],
            stage3: ["听泉茉白"]
        },
        completionText: "听泉茉白，温润如春。",
        cultureNote: "在寒冷的季节，热饮带来温暖。",
        realProductNote: "听泉茉白：茉莉花茶、Kiri芝士酪乳、牛奶。"
    },
    {
        id: 13,
        worldId: 5,
        name: "玫瑰烤奶炉",
        target: "五鼎芝玫瑰烤奶",
        targetId: "meiguikaoniu",
        description: "烤制的香气，与玫瑰完美融合。",
        storyIntro: "加热让香气升腾，玫瑰变得更加温柔。",
        icon: "🌹",
        duration: "2-3分钟",
        initialItems: ["小芋圆", "雪梨银耳羹", "Kiri芝士", "牛奶", "玫瑰花", "红茶", "加热"],
        doorTriggers: {
            stage1: ["芝士奶底"],
            stage2: ["玫瑰茶奶"],
            stage3: ["五鼎芝玫瑰烤奶"]
        },
        completionText: "玫瑰烤奶，温暖整个冬天。",
        cultureNote: "热饮系列侧重养生原料，适合秋冬季节。",
        realProductNote: "五鼎芝玫瑰烤奶：小芋圆、雪梨银耳羹、Kiri芝士酪乳、牛奶、平阴玫瑰花干、正山小种茶。"
    },

    // ========== 终极圣殿 ==========
    {
        id: 14,
        worldId: 6,
        name: "宝珠大成",
        target: "天赐宝珠酪",
        targetId: "tiancibaozhu",
        description: "十三年日落月升，终归于一碗。",
        storyIntro: "所有味道的和声，在这里汇聚。",
        icon: "✨",
        duration: "3-5分钟",
        initialItems: ["奶酪", "雪酪", "酒酿原浆", "桂花原浆", "玫瑰原浆", "茉莉花液", "蓝莓", "坚果", "蜂蜜", "冰块"],
        doorTriggers: {
            stage1: ["三花酿"],
            stage2: ["宝珠精华"],
            stage3: ["天赐宝珠酪"]
        },
        completionText: "恭喜你，成为了真正的宝珠酿造师！",
        cultureNote: "天赐宝珠酪，不是新配方，而是所有味道的和声。",
        realProductNote: "这是你用十三年的味道调配出的传奇饮品。"
    }
];

// 合成配方数据库（基于新方案）
const RECIPES = [
    // ========== 基础合成（世界1必需） ==========
    // 冰酥酪路径A（标准路径）
    { ingredients: ["牛奶", "冰糖碎"], result: "甜牛奶", time: 0, msg: "甜蜜的开始" },
    { ingredients: ["牛奶", "冰块"], result: "冰牛奶", time: 0, msg: "清凉一下" },
    { ingredients: ["甜牛奶", "酒酿原浆"], result: "酿香奶底", time: 0, msg: "酒酿的香气开始弥漫" },
    { ingredients: ["酿香奶底", "冰块"], result: "冰酥基底", time: 0, msg: "基底已成" },
    { ingredients: ["冰酥基底", "酒酿原浆"], result: "冰酥酪", time: 0, msg: "冰酥酪完成！", isTarget: true },
    // 冰酥酪路径B（快捷路径）
    { ingredients: ["冰牛奶", "酒酿原浆"], result: "冰酿奶", time: 0, msg: "冰与酒酿的相遇" },
    { ingredients: ["冰酿奶", "冰糖碎"], result: "冰酥酪", time: 0, msg: "另一种方式完成冰酥酪！", isTarget: true },
    
    // 雪域酸奶路径A（标准路径）
    { ingredients: ["牛奶", "菌种"], result: "发酵奶", time: 3, msg: "发酵中，请稍候..." },
    { ingredients: ["发酵奶", "冰糖碎"], result: "原味酸奶", time: 0, msg: "原味的美好" },
    { ingredients: ["原味酸奶", "冰糖碎"], result: "雪域酸奶", time: 2, msg: "四步两次发酵...", isTarget: true },
    // 雪域酸奶路径B（冷冻路径）
    { ingredients: ["原味酸奶", "冰块"], result: "冰镇酸奶", time: 0, msg: "冰镇的清爽" },
    { ingredients: ["冰镇酸奶", "冰糖碎"], result: "雪域酸奶", time: 0, msg: "冰镇版雪域酸奶！", isTarget: true },
    
    // 基础酪系列
    { ingredients: ["牛奶", "酿造"], result: "奶酪", time: 5, msg: "100度低温烤制中..." },
    { ingredients: ["奶酪", "冰糖碎"], result: "雪酪", time: 0, msg: "雪酪，轻盈版的奶酪" },
    { ingredients: ["奶酪", "雪酪"], result: "双酪底", time: 0, msg: "双酪合璧" },
    // 双酪底路径B
    { ingredients: ["奶酪", "奶酪"], result: "浓酪底", time: 0, msg: "双倍浓郁" },
    { ingredients: ["浓酪底", "冰糖碎"], result: "双酪底", time: 0, msg: "另一种双酪！" },
    
    // 酒酿系列
    { ingredients: ["酒酿原浆", "桂花"], result: "桂花酒酿", time: 3, msg: "桂花香气融入酒酿..." },
    { ingredients: ["酒酿原浆", "桂花原浆"], result: "桂花酒酿", time: 3, msg: "桂花原浆融入酒酿..." },
    { ingredients: ["双酪底", "桂花酒酿"], result: "桂花酪底", time: 0, msg: "桂花与酪相遇" },
    { ingredients: ["桂花酪底", "冰块"], result: "酒酿桂花酪", time: 0, msg: "经典之作！", isTarget: true },
    // 酒酿桂花酪路径B（直接路径）
    { ingredients: ["奶酪", "桂花酒酿"], result: "桂香奶酪", time: 0, msg: "桂花香气包裹奶酪" },
    { ingredients: ["桂香奶酪", "雪酪"], result: "酒酿桂花酪", time: 0, msg: "创新路径完成！", isTarget: true },
    // 酒酿桂花酪路径C（花底优先）
    { ingredients: ["雪酪", "桂花"], result: "桂花雪酪", time: 0, msg: "桂花飘落雪酪" },
    { ingredients: ["桂花雪酪", "酒酿原浆"], result: "酒酿桂花酪", time: 2, msg: "酒酿慢慢渗入...", isTarget: true },
    
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
    "桂花": { icon: "🌼", type: "floral", desc: "桂林金桂" },
    "桂花原浆": { icon: "🌼", type: "floral", desc: "桂花原浆" },
    "玫瑰花": { icon: "🌹", type: "floral", desc: "平阴玫瑰" },
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
    "奶酪": { icon: "🧀", type: "mid", desc: "中式奶酪" },
    "雪酪": { icon: "🍨", type: "mid", desc: "轻盈雪酪" },
    "浓酪底": { icon: "🧀", type: "mid", desc: "双倍浓郁" },
    "双酪底": { icon: "🥣", type: "mid", desc: "双酪合璧" },
    "桂花酒酿": { icon: "🌼", type: "mid", desc: "桂花酒酿" },
    "桂香奶酪": { icon: "🌼", type: "mid", desc: "桂花香气包裹奶酪" },
    "桂花雪酪": { icon: "🌼", type: "mid", desc: "桂花飘落雪酪" },
    "桂花酪底": { icon: "🥣", type: "mid", desc: "桂花酪底" },
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
    "酒酿桂花酪": { icon: "🌼", type: "final", desc: "宝珠经典之作" },
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

// 导出
window.WORLDS = WORLDS;
window.LEVELS = LEVELS;
window.RECIPES = RECIPES;
window.ITEMS = ITEMS;
window.STORY = STORY;
window.TIPS = TIPS;
window.HINT_SYSTEM = HINT_SYSTEM;
window.ACHIEVEMENTS = ACHIEVEMENTS;
window.FRAGMENTS = FRAGMENTS;
