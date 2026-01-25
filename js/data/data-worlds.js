// ========================================
// 宝珠酿造 · 合成宇宙 V2 数据库 - 世界与关卡
// ========================================

// 章节配置 - Monument Valley 风格的多目标关卡
const CHAPTERS = {
    1: {
        id: 1,
        name: "乳之觉醒",
        objectives: [101, 102, 2],  // 唤醒之手 -> 时间的答案 -> 酸奶阶梯
        transitionTexts: [
            "第一道门已开启...",
            "第二道门正在等待..."
        ]
    },
    2: {
        id: 2,
        name: "酪之试炼",
        objectives: [1, 104],  // 冰酥门廊 -> 双酪启程
        transitionTexts: [
            "更深的门在召唤..."
        ]
    },
    3: {
        id: 3,
        name: "奶酪试炼",
        objectives: [3],  // 奶酪试炼 - 独立
        transitionTexts: []
    }
};

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
        levels: [101, 102, 2, 1, 104, 3]  // 唤醒之手 -> 时间的答案 -> 酸奶阶梯 -> 冰酥门廊 -> 双酪启程 -> 奶酪试炼
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
        chapterId: 1,
        objectiveIndex: 0,
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
        chapterId: 1,
        objectiveIndex: 1,
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
    // ========== 世界1：奶酪谷 ==========
    {
        id: 1,
        worldId: 1,
        chapterId: 2,
        objectiveIndex: 0,
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
        chapterId: 1,
        objectiveIndex: 2,
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
        id: 104,
        worldId: 1,
        chapterId: 2,
        objectiveIndex: 1,
        name: "双酪启程",
        target: "双酪底",
        targetId: "shuanglao",
        description: "两种酪底的相遇，开启新的可能。",
        storyIntro: "奶酪与雪酪，两种质地，一个基底。",
        icon: "🧀",
        duration: "1-2分钟",
        initialItems: ["牛奶", "酿造", "冰糖碎", "酒酿原浆", "冰块"],
        doorTriggers: {
            stage1: ["奶酪"],
            stage2: ["雪酪"],
            stage3: ["双酪底"]
        },
        completionText: "双酪底，是许多经典的起点。",
        cultureNote: "奶酪与雪酪的融合，是宝珠饮品的核心基底。",
        realProductNote: "双酪底：奶酪与雪酪的完美融合。",
        levelHints: [
            "所谓的双酪，是奶酪和雪酪。",
            "雪酪尝起来很甜啊！",
            "奶酪需要牛奶和酿造...",
            "雪酪需要甜牛奶和冰块..."
        ]
    },
    {
        id: 3,
        worldId: 1,
        chapterId: 3,
        objectiveIndex: 0,
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

// 导出
window.CHAPTERS = CHAPTERS;
window.WORLDS = WORLDS;
window.LEVELS = LEVELS;

