// ========================================
// 宝珠酿造 · 合成宇宙 V2 数据库 - 世界与关卡
// ========================================

// 章节配置 - Monument Valley 风格的多目标关卡
// 第一章以"冰酒酿桂花酪"为最终Boss，共5关
const CHAPTERS = {
    1: {
        id: 1,
        name: "酪之初启",
        description: "从牛奶到酪，建立酿造的基础语言",
        objectives: [101, 102, 103, 104, 105],  // 5关递进结构
        transitionTexts: [
            "甜蜜，是最朴素的开始...",
            "液体凝固成酪，奶酿之道初现...",
            "双酪合璧，厚与轻，一体两面...",
            "双酪为底，酒酿为魂，酪饮之道开启...",
        ]
    }
};

// 世界配置
const WORLDS = [
    {
        id: 1,
        name: "奶酪谷",
        subtitle: "酪之初启",
        description: "从牛奶到酪的基础认知，建立酿造语言。以冰酒酿桂花酪为目标。",
        theme: "dairy",
        color: "#FFF5E6",
        icon: "🥛",
        unlocked: true,
        levels: [101, 102, 103, 104, 105]  // 第一缕甜 -> 凝固之术 -> 双酪之约 -> 酪饮之道 -> Boss:冰酒酿桂花酪
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

// 关卡配置（第一章：酪之初启 - 5关，以冰酒酿桂花酪为Boss）
const LEVELS = [
    // ========== 第一章：酪之初启（6关） ==========
    
    // 第1关：第一缕甜 - 强制因果演示
    {
        id: 101,
        worldId: 1,
        chapterId: 1,
        objectiveIndex: 0,
        name: "第一缕甜",
        target: "甜牛奶",
        targetId: "sweet_milk",
        description: "合成，然后献上。",
        storyIntro: "一切开始于最简单的组合。",
        icon: "🥛",
        duration: "15-30秒",
        initialItems: ["牛奶", "冰糖碎"],  // 仅2个，零自由度
        doorTriggers: {
            stage1: [],
            stage2: [],
            stage3: ["甜牛奶"]
        },
        completionText: "甜蜜，是最朴素的开始。",
        cultureNote: "牛奶与冰糖，最朴素的甜蜜开始。",
        realProductNote: "现实中：这是宝珠许多饮品的基础。",
        isTutorial: true,
        tutorialFocus: "approach_and_offer",
        // 教学的规律
        teachingRule: "液体 + 甜味 → 甜液体"
    },
    
    // 第2关：凝固之术 - 引入工艺概念
    {
        id: 102,
        worldId: 1,
        chapterId: 1,
        objectiveIndex: 1,
        name: "凝固之术",
        target: "奶酪",
        targetId: "cheese",
        description: "酿造工艺，让液体凝固成酪。",
        storyIntro: "牛奶遇见酿造，会发生什么？",
        icon: "🧀",
        duration: "30-45秒",
        initialItems: ["牛奶", "酿造"],  // 仅2个，零自由度
        doorTriggers: {
            stage1: [],
            stage2: [],
            stage3: ["奶酪"]
        },
        completionText: "奶酿成酪，百度慢烤。",
        cultureNote: "以牛奶和40天自酿的原浆，经由100度低温烤制而成。",
        realProductNote: "宝珠奶酪：牛奶+稀奶油+冰糖粉+酒酿原浆B，95-100°C烤制20-25分钟。",
        isTutorial: true,
        tutorialFocus: "craft_transform",
        teachingRule: "液体 + 酿造工艺 → 凝固成酪"
    },
    
    // 第3关：双酪之约 - 多步合成，运用规律
    {
        id: 103,
        worldId: 1,
        chapterId: 1,
        objectiveIndex: 2,
        name: "双酪之约",
        target: "双酪",
        targetId: "dual_cheese",
        description: "厚与轻，是一体两面。",
        storyIntro: "奶酪与雪酪，两种质地，一个基底。",
        icon: "🍨",
        duration: "1-2分钟",
        initialItems: ["牛奶", "酿造", "冰糖碎"],  // 3个，低自由度
        doorTriggers: {
            stage1: ["甜牛奶", "奶酪"],  // 门微光（做出任一中间产物）
            stage2: ["雪酪"],            // 门震动
            stage3: ["双酪"]             // 门打开
        },
        completionText: "双酪合璧，厚与轻，一体两面。",
        cultureNote: "奶酪醇厚，雪酪轻盈，合而为一是宝珠饮品的核心基底。",
        realProductNote: "双酪：奶酪与雪酪的完美融合。",
        levelHints: [
            "双酪，是两种酪的组合...",
            "雪酪尝起来更轻盈、更甜...",
            "奶酪：牛奶 + 酿造",
            "雪酪：甜牛奶 + 酿造（甜的液体凝固成轻盈的酪）"
        ],
        // 合成路径：
        // 牛奶 + 冰糖碎 → 甜牛奶
        // 牛奶 + 酿造 → 奶酪
        // 甜牛奶 + 酿造 → 雪酪
        // 奶酪 + 雪酪 → 双酪
        teachingRule: "甜液体 + 酿造 → 轻盈版酪；奶酪 + 雪酪 → 双酪"
    },
    
    // 第4关：酪饮之道 - 教双酪+酒酿=酪饮（花+酒酿在这里首次出现）
    {
        id: 104,
        worldId: 1,
        chapterId: 1,
        objectiveIndex: 3,
        name: "酪饮之道",
        target: "酒酿玫瑰酪",
        targetId: "rose_cheese_drink",
        description: "双酪为底，酒酿为魂。",
        storyIntro: "玫瑰与酒酿相遇，双酪承载芬芳。",
        icon: "🌹",
        duration: "1-2分钟",
        initialItems: ["双酪", "玫瑰", "酒酿原浆"],  // 3个，无干扰
        doorTriggers: {
            stage1: ["玫瑰酒酿"],        // 门微光
            stage2: [],
            stage3: ["酒酿玫瑰酪"]       // 门打开
        },
        completionText: "玫瑰与酒酿相遇，双酪承载芬芳。酪饮之道，始于此刻。",
        cultureNote: "平阴玫瑰，千年花都的馈赠。",
        realProductNote: "酒酿玫瑰酪：奶酪、雪酪、玫瑰原浆、燕麦爆爆珠、冰块、平阴玫瑰花干。",
        levelHints: [
            "玫瑰是一种花香...",
            "花香可以融入酒酿...",
            "酪饮需要双酪做底...",
            "双酪 + 花香酒酿 = 酪饮品"
        ],
        // 合成路径：
        // 玫瑰 + 酒酿原浆 → 玫瑰酒酿
        // 双酪 + 玫瑰酒酿 → 酒酿玫瑰酪
        teachingRule: "花香 + 酒酿原浆 → 花香酒酿；双酪 + 花香酒酿 → 酪饮品"
    },
    
    // 第5关 Boss：冰酒酿桂花酪 - 综合运用所有规律
    {
        id: 105,
        worldId: 1,
        chapterId: 1,
        objectiveIndex: 4,
        name: "冰酒酿桂花酪",
        target: "冰酒酿桂花酪",
        targetId: "ice_osmanthus_cheese_drink",
        description: "第一次触碰经典的味道。",
        storyIntro: "当奶与酿相遇，经典的轮廓开始显现。",
        icon: "🧊",
        duration: "2-3分钟",
        initialItems: ["牛奶", "酿造", "冰糖碎", "酒酿原浆", "桂花", "冰块"],  // 6个，Boss关
        doorTriggers: {
            stage1: ["双酪"],              // 门微光
            stage2: ["酒酿桂花酪"],        // 门震动
            stage3: ["冰酒酿桂花酪"]       // 门打开
        },
        completionText: "冰酒酿桂花酪，宝珠的经典之作。",
        cultureNote: "酒酿的甘洌、奶酪的醇厚、桂花的清香，三者合一，冰凉入口。",
        realProductNote: "酒酿桂花酪：奶酪、雪酪、鲜活酒酿米、冰块、桂花原浆、桂林金桂桂花。",
        isBoss: true,
        levelHints: [
            "运用你学到的所有规律...",
            "先做双酪底...",
            "桂花需要酒酿来唤醒...",
            "双酪 + 桂花酒酿 = 酒酿桂花酪",
            "最后加上冰块..."
        ],
        // Boss关需要运用的规律
        requiredRules: [
            "牛奶 + 冰糖碎 → 甜牛奶",
            "牛奶 + 酿造 → 奶酪",
            "甜牛奶 + 酿造 → 雪酪",
            "奶酪 + 雪酪 → 双酪",
            "桂花 + 酒酿原浆 → 桂花酒酿",
            "双酪 + 桂花酒酿 → 酒酿桂花酪",
            "酒酿桂花酪 + 冰块 → 冰酒酿桂花酪"
        ]
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

