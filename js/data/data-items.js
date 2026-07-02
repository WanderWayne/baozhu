// ========================================
// 宝珠酿造 · 合成宇宙 V2 数据库 - 配方与物品
// ========================================

// 合成配方数据库（基于新方案）
const RECIPES = [
    // ========== 第一章核心配方：酪之初启 ==========
    
    // 第1关：第一缕甜
    { ingredients: ["牛奶", "冰糖碎"], result: "甜牛奶", time: 0, msg: "甜蜜的开始" },
    
    // 第2关：凝固之术 — 鲜奶发酵成酸奶，滤布凝酪；酿造得奶酒（干扰）
    { ingredients: ["牛奶", "发酵"], result: "酸奶", time: 5, msg: "乳酸菌悄悄做事，奶渐渐稠成酸奶…" },
    { ingredients: ["发酵", "牛奶"], result: "酸奶", time: 5, msg: "乳酸菌悄悄做事，奶渐渐稠成酸奶…" },
    { ingredients: ["酸奶", "滤布"], result: "奶酪", time: 0, msg: "乳清滤去，奶香凝成厚实酪…" },
    { ingredients: ["滤布", "酸奶"], result: "奶酪", time: 0, msg: "乳清滤去，奶香凝成厚实酪…" },
    { ingredients: ["牛奶", "酿造"], result: "奶酒", time: 5, msg: "谷香入奶，一盏柔性的小酒…" },
    { ingredients: ["酿造", "牛奶"], result: "奶酒", time: 5, msg: "谷香入奶，一盏柔性的小酒…" },
    { ingredients: ["奶酒", "酿造"], result: "高度奶酒", time: 5, msg: "再经凝炼，酒意更厚一层…" },
    { ingredients: ["酿造", "奶酒"], result: "高度奶酒", time: 5, msg: "再经凝炼，酒意更厚一层…" },

    // 第3关：酿酒之道（多种米干扰项）
    { ingredients: ["糯米", "酿造"], result: "酒酿", time: 5, msg: "糯米发酵，甜香弥漫..." },
    { ingredients: ["酿造", "糯米"], result: "酒酿", time: 5, msg: "糯米发酵，甜香弥漫..." },
    { ingredients: ["大米", "酿造"], result: "米酒", time: 5, msg: "大米也能酿，但不是酒酿..." },
    { ingredients: ["酿造", "大米"], result: "米酒", time: 5, msg: "大米也能酿，但不是酒酿..." },
    { ingredients: ["黑米", "酿造"], result: "黑米露", time: 5, msg: "紫黑色的酒露，但不是目标..." },
    { ingredients: ["酿造", "黑米"], result: "黑米露", time: 5, msg: "紫黑色的酒露，但不是目标..." },
    { ingredients: ["小米", "酿造"], result: "小米黄酒", time: 5, msg: "小米黄酒，古朴的味道..." },
    { ingredients: ["酿造", "小米"], result: "小米黄酒", time: 5, msg: "小米黄酒，古朴的味道..." },
    
    // 第4关：双酪之约 — 甜奶发酵成甜酸奶，滤布得轻盈雪酪
    { ingredients: ["甜牛奶", "发酵"], result: "甜酸奶", time: 5, msg: "甜奶也经得起发酵，稠成一碗甜酸奶…" },
    { ingredients: ["发酵", "甜牛奶"], result: "甜酸奶", time: 5, msg: "甜奶也经得起发酵，稠成一碗甜酸奶…" },
    { ingredients: ["甜酸奶", "滤布"], result: "雪酪", time: 0, msg: "滤去水分，凝成轻盈雪酪…" },
    { ingredients: ["滤布", "甜酸奶"], result: "雪酪", time: 0, msg: "滤去水分，凝成轻盈雪酪…" },
    // 甜奶误配酿造：不是轻盈酪那条路
    { ingredients: ["甜牛奶", "酿造"], result: "甜奶浊酿", time: 2, msg: "酿造把酒谷的香塞进甜奶里……轻盈酪要走发酵再滤布。" },
    { ingredients: ["酿造", "甜牛奶"], result: "甜奶浊酿", time: 2, msg: "酿造把酒谷的香塞进甜奶里……轻盈酪要走发酵再滤布。" },
    { ingredients: ["奶酪", "雪酪"], result: "双酪", time: 0, msg: "双酪合璧，厚与轻，一体两面" },
    
    // 第4关：香气之约 - 桂花酒酿
    { ingredients: ["桂花", "酒酿原浆"], result: "桂花酒酿", time: 3, msg: "桂花香气融入酒酿..." },
    { ingredients: ["酒酿原浆", "桂花"], result: "桂花酒酿", time: 3, msg: "桂花香气融入酒酿..." },
    
    // 第5关：酪饮之道 - 酒酿玫瑰酪
    { ingredients: ["玫瑰", "酒酿原浆"], result: "玫瑰酒酿", time: 3, msg: "玫瑰香气融入酒酿..." },
    { ingredients: ["酒酿原浆", "玫瑰"], result: "玫瑰酒酿", time: 3, msg: "玫瑰香气融入酒酿..." },
    { ingredients: ["菊花", "酒酿原浆"], result: "菊花酒酿", time: 3, msg: "菊花清香融入酒酿..." },
    { ingredients: ["酒酿原浆", "菊花"], result: "菊花酒酿", time: 3, msg: "菊花清香融入酒酿..." },
    { ingredients: ["茉莉花", "酒酿原浆"], result: "茉莉酒酿", time: 3, msg: "茉莉清香融入酒酿..." },
    { ingredients: ["酒酿原浆", "茉莉花"], result: "茉莉酒酿", time: 3, msg: "茉莉清香融入酒酿..." },
    { ingredients: ["双酪", "玫瑰酒酿"], result: "酒酿玫瑰酪", time: 3, msg: "玫瑰与酪融合中…", isTarget: true },

    // 第6关 Boss：冰酒酿桂花酪
    { ingredients: ["双酪", "桂花酒酿"], result: "酒酿桂花酪", time: 3, msg: "桂花与酪交融中…" },
    { ingredients: ["酒酿桂花酪", "冰块"], result: "冰酒酿桂花酪", time: 0, msg: "经典之作！", isTarget: true },
    
    // ========== 第一章：死胡同与探索配方 ==========
    
    // 死胡同 A：冰糖碎乱用
    { ingredients: ["冰糖碎", "酿造"], result: "糖酿", time: 3, msg: "甜得发腻，没人要这个" },
    { ingredients: ["酿造", "冰糖碎"], result: "糖酿", time: 3, msg: "甜得发腻，没人要这个" },
    { ingredients: ["冰糖碎", "发酵"], result: "甜酵糖", time: 0, msg: "糖粒急着发酵，只剩一团糊涂" },
    { ingredients: ["发酵", "冰糖碎"], result: "甜酵糖", time: 0, msg: "糖粒急着发酵，只剩一团糊涂" },

    // 死胡同 B：冰块乱用
    { ingredients: ["奶酪", "冰块"], result: "冰奶酪", time: 0, msg: "硬邦邦的，这不是冰酥酪" },
    { ingredients: ["冰块", "奶酪"], result: "冰奶酪", time: 0, msg: "硬邦邦的，这不是冰酥酪" },
    { ingredients: ["酒酿", "冰块"], result: "冰酒酿", time: 0, msg: "冰镇倒是不错，但不够格" },
    { ingredients: ["冰块", "酒酿"], result: "冰酒酿", time: 0, msg: "冰镇倒是不错，但不够格" },
    { ingredients: ["甜牛奶", "冰块"], result: "冰甜奶", time: 0, msg: "清凉，但也就这样了" },
    { ingredients: ["冰块", "甜牛奶"], result: "冰甜奶", time: 0, msg: "清凉，但也就这样了" },
    { ingredients: ["雪酪", "冰块"], result: "冰霜雪酪", time: 0, msg: "冻过头了，雪酪变硬了" },
    { ingredients: ["冰块", "雪酪"], result: "冰霜雪酪", time: 0, msg: "冻过头了，雪酪变硬了" },
    { ingredients: ["米酒", "冰块"], result: "冰米酒", time: 0, msg: "冰镇米酒，古朴的清凉" },
    { ingredients: ["冰块", "米酒"], result: "冰米酒", time: 0, msg: "冰镇米酒，古朴的清凉" },

    // 死胡同 C：发酵与酿造搅在一起
    { ingredients: ["发酵", "酿造"], result: "怪味发酵物", time: 3, msg: "两条路子混成一团……算了" },
    { ingredients: ["酿造", "发酵"], result: "怪味发酵物", time: 3, msg: "两条路子混成一团……算了" },

    // 无害对照：规律辨析（可与正路对照，不产生关卡目标）
    // — 米粒成「酿」须借酿造；单发酵只是饭坯
    { ingredients: ["糯米", "发酵"], result: "酵糯饭", time: 3, msg: "糯饭发酸发软，还差酿造那一魂" },
    { ingredients: ["发酵", "糯米"], result: "酵糯饭", time: 3, msg: "糯饭发酸发软，还差酿造那一魂" },
    { ingredients: ["大米", "发酵"], result: "酵米饭", time: 3, msg: "饭粒发酵了，但成不了你想的那种酿" },
    { ingredients: ["发酵", "大米"], result: "酵米饭", time: 3, msg: "饭粒发酵了，但成不了你想的那种酿" },
    { ingredients: ["黑米", "发酵"], result: "酵黑米饭", time: 3, msg: "紫饭发酵后……只是一碗怪的酸饭" },
    { ingredients: ["发酵", "黑米"], result: "酵黑米饭", time: 3, msg: "紫饭发酵后……只是一碗怪的酸饭" },
    { ingredients: ["小米", "发酵"], result: "酵粟饭", time: 3, msg: "粟米发酵后稠稠的，也不是黄酒那条路" },
    { ingredients: ["发酵", "小米"], result: "酵粟饭", time: 3, msg: "粟米发酵后稠稠的，也不是黄酒那条路" },
    // — 花香须先入酒酿原浆；单丢给酿造缺「酒底」
    { ingredients: ["桂花", "酿造"], result: "桂花浊酿", time: 2, msg: "花香闷在糟里，浊得很，少了酒酿原浆那口气" },
    { ingredients: ["酿造", "桂花"], result: "桂花浊酿", time: 2, msg: "花香闷在糟里，浊得很，少了酒酿原浆那口气" },
    { ingredients: ["玫瑰", "酿造"], result: "玫瑰浊酿", time: 2, msg: "花瓣烂糟糟……记得先请酒酿原浆出场" },
    { ingredients: ["酿造", "玫瑰"], result: "玫瑰浊酿", time: 2, msg: "花瓣烂糟糟……记得先请酒酿原浆出场" },
    { ingredients: ["菊花", "酿造"], result: "菊花浊酿", time: 2, msg: "菊花清气扛不住闷酿，糊成一团" },
    { ingredients: ["酿造", "菊花"], result: "菊花浊酿", time: 2, msg: "菊花清气扛不住闷酿，糊成一团" },
    { ingredients: ["茉莉花", "酿造"], result: "茉莉浊酿", time: 2, msg: "茉莉要先遇见酒浆，直接进酿造只会浊" },
    { ingredients: ["酿造", "茉莉花"], result: "茉莉浊酿", time: 2, msg: "茉莉要先遇见酒浆，直接进酿造只会浊" },
    // — 鲜奶渍原浆不如甜奶路径工整（对照酿香奶底）
    { ingredients: ["牛奶", "酒酿原浆"], result: "渍酿奶", time: 0, msg: "乳白混着琥珀色……甜香奶底那条路更利落" },
    { ingredients: ["酒酿原浆", "牛奶"], result: "渍酿奶", time: 0, msg: "乳白混着琥珀色……甜香奶底那条路更利落" },
    // — 成品酪遇酿造 ≠ 鲜奶遇酿造（奶酒）；乃腌渍风味
    { ingredients: ["奶酪", "酿造"], result: "酒焖奶酪", time: 3, msg: "奶酪吸饱了酒气……别致，但不是进阶正戏" },
    { ingredients: ["酿造", "奶酪"], result: "酒焖奶酪", time: 3, msg: "奶酪吸饱了酒气……别致，但不是进阶正戏" },
    // — 奶酒链再发酵：两套路搅浑
    { ingredients: ["奶酒", "发酵"], result: "酵奶酒", time: 3, msg: "奶酒又发酵……酸甜打架，不成章法" },
    { ingredients: ["发酵", "奶酒"], result: "酵奶酒", time: 3, msg: "奶酒又发酵……酸甜打架，不成章法" },
    { ingredients: ["高度奶酒", "发酵"], result: "滥酵奶酒", time: 3, msg: "再发酵只会更浊，不是考官要的酪" },
    { ingredients: ["发酵", "高度奶酒"], result: "滥酵奶酒", time: 3, msg: "再发酵只会更浊，不是考官要的酪" },
    // — 轻盈雪酪经不起「发酵」这一套
    { ingredients: ["雪酪", "发酵"], result: "塌雪酪", time: 2, msg: "雪酪塌成糊……发酵毁了轻盈" },
    { ingredients: ["发酵", "雪酪"], result: "塌雪酪", time: 2, msg: "雪酪塌成糊……发酵毁了轻盈" },
    // — 原浆已是工夫；再叠发酵失焦
    { ingredients: ["酒酿原浆", "发酵"], result: "酵浆浑汤", time: 3, msg: "底味太重又发酵……只剩一锅糊涂鲜" },
    { ingredients: ["发酵", "酒酿原浆"], result: "酵浆浑汤", time: 3, msg: "底味太重又发酵……只剩一锅糊涂鲜" },
    // — 冷意只会锁住酿造的起香，对照温度叙事
    { ingredients: ["冰块", "酿造"], result: "冰淬浊酿", time: 0, msg: "冰把香气摁死了……这不是正经酿法" },
    { ingredients: ["酿造", "冰块"], result: "冰淬浊酿", time: 0, msg: "冰把香气摁死了……这不是正经酿法" },
    // — 双酪已完成阴阳合璧；再发酵徒增混沌
    { ingredients: ["双酪", "发酵"], result: "酵酪糊", time: 3, msg: "厚轻好不容易合体，再发酵全毁了口感" },
    { ingredients: ["发酵", "双酪"], result: "酵酪糊", time: 3, msg: "厚轻好不容易合体，再发酵全毁了口感" },

    // 探索配方：花 + 牛奶（自然但无用）
    { ingredients: ["牛奶", "桂花"], result: "桂花牛奶", time: 0, msg: "淡淡的桂花香" },
    { ingredients: ["桂花", "牛奶"], result: "桂花牛奶", time: 0, msg: "淡淡的桂花香" },
    { ingredients: ["牛奶", "玫瑰"], result: "玫瑰牛奶", time: 0, msg: "玫瑰花瓣漂浮着" },
    { ingredients: ["玫瑰", "牛奶"], result: "玫瑰牛奶", time: 0, msg: "玫瑰花瓣漂浮着" },

    // 探索配方：酪 + 酒酿原浆（方向对但不是正解）
    { ingredients: ["奶酪", "酒酿原浆"], result: "酒酿奶酪", time: 0, msg: "酒香奶酪，有意思，但不是双酪" },
    { ingredients: ["酒酿原浆", "奶酪"], result: "酒酿奶酪", time: 0, msg: "酒香奶酪，有意思，但不是双酪" },
    { ingredients: ["雪酪", "酒酿原浆"], result: "酒酿雪酪", time: 0, msg: "轻盈的酒香，但缺少厚度" },
    { ingredients: ["酒酿原浆", "雪酪"], result: "酒酿雪酪", time: 0, msg: "轻盈的酒香，但缺少厚度" },

    // 跨关惊喜：酒酿(L3产物) + 花材
    { ingredients: ["酒酿", "桂花"], result: "桂花酒酿", time: 3, msg: "糯米酒酿遇上桂花" },
    { ingredients: ["桂花", "酒酿"], result: "桂花酒酿", time: 3, msg: "糯米酒酿遇上桂花" },
    { ingredients: ["酒酿", "玫瑰"], result: "玫瑰酒酿", time: 3, msg: "自酿的酒酿配玫瑰" },
    { ingredients: ["玫瑰", "酒酿"], result: "玫瑰酒酿", time: 3, msg: "自酿的酒酿配玫瑰" },

    // 跨关惊喜：双酪 + 错误花酒酿（L5 干扰）
    { ingredients: ["双酪", "菊花酒酿"], result: "酒酿菊花酪", time: 3, msg: "菊花与酪交融中…" },
    { ingredients: ["双酪", "茉莉酒酿"], result: "酒酿茉莉酪", time: 3, msg: "茉莉与酪交融中…" },

    // ========== 辅助配方（兼容旧版/备用路径） ==========
    { ingredients: ["牛奶", "冰块"], result: "冰牛奶", time: 0, msg: "清凉一下" },
    { ingredients: ["甜牛奶", "酒酿原浆"], result: "酿香奶底", time: 0, msg: "酒酿的香气开始弥漫" },
    { ingredients: ["酿香奶底", "冰块"], result: "霜酪", time: 0, msg: "凉意浸入，凝出一层薄霜…" },
    { ingredients: ["霜酪", "冰块"], result: "冰酥酪", time: 0, msg: "冰酥酪完成！", isTarget: true },
    { ingredients: ["霜酪", "酒酿原浆"], result: "冰酥酪", time: 0, msg: "冰酥酪完成！", isTarget: true },
    { ingredients: ["冰牛奶", "酒酿原浆"], result: "冰酿奶", time: 0, msg: "冰与酒酿的相遇" },
    { ingredients: ["冰酿奶", "冰糖碎"], result: "冰酥酪", time: 0, msg: "另一种方式完成冰酥酪！", isTarget: true },
    
    // 雪域酸奶路径
    { ingredients: ["牛奶", "菌种"], result: "发酵奶", time: 3, msg: "发酵中，请稍候..." },
    { ingredients: ["发酵奶", "冰糖碎"], result: "原味酸奶", time: 0, msg: "原味的美好" },
    { ingredients: ["原味酸奶", "冰糖碎"], result: "雪域酸奶", time: 2, msg: "四步两次发酵...", isTarget: true },
    { ingredients: ["原味酸奶", "冰块"], result: "冰镇酸奶", time: 0, msg: "冰镇的清爽" },
    { ingredients: ["冰镇酸奶", "冰糖碎"], result: "雪域酸奶", time: 0, msg: "冰镇版雪域酸奶！", isTarget: true },
    
    // （已移除浓酪底→双酪的备用路径）
    
    // 冰酒酿桂花酪备用路径
    { ingredients: ["桂花原浆", "酒酿原浆"], result: "桂花酒酿", time: 3, msg: "桂花原浆融入酒酿..." },
    { ingredients: ["奶酪", "桂花酒酿"], result: "桂香奶酪", time: 3, msg: "桂花酪液交融中…" },
    { ingredients: ["桂香奶酪", "雪酪"], result: "酒酿桂花酪", time: 3, msg: "厚酪与轻盈合一…" },
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

// ========================================
// 第一章 SVG 图标（Monument Valley 极简几何风格）
// createItemElement 会优先使用此处的 SVG，不存在时回退到 ITEMS.icon (emoji)
// ========================================
const ITEM_SVGS = {
    // ===== 基础原料 =====
    "牛奶": '<svg viewBox="0 0 40 40"><rect x="16" y="4" width="8" height="4" rx="1.5" fill="#F0E8D8" stroke="#B89060" stroke-width="1"/><path d="M16 8l-3 4h14l-3-4" fill="#F8F0E0" stroke="#B89060" stroke-width="1"/><path d="M13 12h14v19a4 4 0 01-4 4H17a4 4 0 01-4-4z" fill="#FFFDF8" stroke="#B89060" stroke-width="1"/><rect x="16" y="20" width="8" height="6" rx="1" fill="#F0E8D8" opacity=".3"/></svg>',
    "冰糖碎": '<svg viewBox="0 0 40 40"><polygon points="22,6 30,14 26,24 16,20 14,10" fill="#d8f4ff" stroke="#5aa8e0" stroke-width="1"/><polygon points="12,12 8,22 16,30 22,22" fill="#b0e4fc" stroke="#4890d0" stroke-width="1"/><polygon points="26,26 33,31 28,38 20,34" fill="#e8fbff" stroke="#5aa8e0" stroke-width="1"/><path d="M14 16l6-4 4 6-8 2z" fill="#7ec8f0" opacity=".55" stroke="#4090c8" stroke-width=".6"/><circle cx="24" cy="17" r="1.4" fill="#ffffff" opacity=".9"/></svg>',
    "酿造": '<svg viewBox="0 0 40 40"><ellipse cx="20" cy="14" rx="10" ry="3.5" fill="#986038" stroke="#583818" stroke-width="1"/><path d="M10 14 L30 14 L26 28 Q20 34 14 28 Z" fill="#b07848" stroke="#583818" stroke-width="1"/><ellipse cx="20" cy="14" rx="8" ry="2.5" fill="#c08858"/><path d="M26 9 Q33 8 32 15" fill="none" stroke="#f5e6c0" stroke-width="2.2" stroke-linecap="round"/><path d="M31 14 L35 11 L34 17 Z" fill="#f5e6c0" stroke="#d8c8a0" stroke-width=".45"/><circle cx="15" cy="22" r="2" fill="#ffffff" opacity=".28"/><circle cx="23" cy="26" r="1.6" fill="#ffffff" opacity=".34"/><circle cx="26" cy="20" r="1.3" fill="#ffffff" opacity=".26"/></svg>',
    "发酵": '<svg viewBox="0 0 40 40"><ellipse cx="20" cy="13" rx="9" ry="3" fill="#f5e8c8" stroke="#d4c090" stroke-width="1"/><path d="M11 13 L29 13 L27 27 Q20 33 13 27 Z" fill="#faf3dc" stroke="#c9b078" stroke-width="1"/><ellipse cx="20" cy="13" rx="7" ry="2.2" fill="#fff8e8"/><circle cx="16" cy="21" r="2.2" fill="#fffef6" opacity=".55"/><circle cx="23" cy="24" r="1.6" fill="#fffef6" opacity=".5"/><circle cx="21" cy="19" r="1.2" fill="#ffffff" opacity=".65"/><circle cx="14" cy="26" r="1.4" fill="#fdf6dd" opacity=".5"/><path d="M24 8 q3-2 5 1" fill="none" stroke="#edd9a8" stroke-width="1.2" stroke-linecap="round"/></svg>',
    "酒酿原浆": '<svg viewBox="0 0 40 40"><rect x="16" y="4" width="8" height="4" rx="2" fill="#C89820" stroke="#A07808" stroke-width="1"/><path d="M13 8h14v22a5 5 0 01-5 5h-4a5 5 0 01-5-5z" fill="#E0B040" stroke="#A07808" stroke-width="1"/><circle cx="17" cy="20" r="1.5" fill="#F0C850" opacity=".6"/><circle cx="23" cy="24" r="1" fill="#F0C850" opacity=".5"/><circle cx="19" cy="28" r="1.2" fill="#F0C850" opacity=".55"/></svg>',
    "冰块": '<svg viewBox="0 0 40 40"><path d="M20 6l12 8v12l-12 8-12-8V14z" fill="#A0D8F0" stroke="#50A0D0" stroke-width="1"/><path d="M20 6l12 8-12 6-12-6z" fill="#C8ECFF" stroke="#50A0D0" stroke-width="1"/><path d="M20 20v14" stroke="#70C0E8" stroke-width=".6" opacity=".6"/><path d="M8 14l12 6" stroke="#70C0E8" stroke-width=".6" opacity=".5"/></svg>',
    "滤布": '<svg viewBox="0 0 40 40"><ellipse cx="20" cy="22" rx="14" ry="10" fill="#e8e4dc" stroke="#b8a898" stroke-width="1"/><path d="M8 14 Q20 10 32 14" fill="none" stroke="#a89888" stroke-width="1"/><line x1="12" y1="18" x2="28" y2="26" stroke="#d8d4cc" stroke-width=".8"/><line x1="28" y1="18" x2="12" y2="26" stroke="#d8d4cc" stroke-width=".8"/></svg>',
    "珠宝": '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="14" fill="#E0A800" stroke="#B88000" stroke-width="1.2"/><circle cx="20" cy="20" r="10" fill="#F0C030" stroke="#C89800" stroke-width=".8"/><path d="M20 12l3 6-3 10-3-10z" fill="#C89000" opacity=".5"/><path d="M12 18h16" stroke="#C89000" stroke-width=".6" opacity=".4"/></svg>',
    "配方书": '<svg viewBox="0 0 40 40"><path d="M8 7h12v28H10a2 2 0 01-2-2V7z" fill="#8B5E30" stroke="#6A4018" stroke-width="1"/><path d="M20 7h12v26a2 2 0 01-2 2H20V7z" fill="#FFF4D8" stroke="#B89060" stroke-width="1"/><line x1="23" y1="13" x2="29" y2="13" stroke="#B89060" stroke-width="1.2"/><line x1="23" y1="17" x2="28" y2="17" stroke="#C8A070" stroke-width=".8"/><line x1="23" y1="21" x2="27" y2="21" stroke="#C8A070" stroke-width=".8"/><line x1="23" y1="25" x2="29" y2="25" stroke="#C8A070" stroke-width=".8"/></svg>',

    // ===== 米类（共用碗形，不同颗粒颜色） =====
    "糯米": '<svg viewBox="0 0 40 40"><path d="M7 18h26l-3 14a3 3 0 01-3 2H13a3 3 0 01-3-2z" fill="#B08050" stroke="#885830" stroke-width="1"/><ellipse cx="20" cy="18" rx="13" ry="4" fill="#C89868" stroke="#885830" stroke-width="1"/><circle cx="15" cy="15" r="2.5" fill="#FFFFF0" stroke="#D0C8B0" stroke-width=".6"/><circle cx="20" cy="13" r="2.5" fill="#FFFFF0" stroke="#D0C8B0" stroke-width=".6"/><circle cx="25" cy="15" r="2.5" fill="#FFFFF0" stroke="#D0C8B0" stroke-width=".6"/><circle cx="17" cy="10" r="2" fill="#FFFFF0" stroke="#D0C8B0" stroke-width=".6"/><circle cx="23" cy="11" r="2" fill="#FFFFF0" stroke="#D0C8B0" stroke-width=".6"/></svg>',
    "大米": '<svg viewBox="0 0 40 40"><path d="M7 18h26l-3 14a3 3 0 01-3 2H13a3 3 0 01-3-2z" fill="#B08050" stroke="#885830" stroke-width="1"/><ellipse cx="20" cy="18" rx="13" ry="4" fill="#C89868" stroke="#885830" stroke-width="1"/><ellipse cx="15" cy="14" rx="3" ry="1.5" fill="#FFF8E0" stroke="#C8B890" stroke-width=".6" transform="rotate(-20 15 14)"/><ellipse cx="20" cy="12" rx="3" ry="1.5" fill="#FFF8E0" stroke="#C8B890" stroke-width=".6"/><ellipse cx="25" cy="14" rx="3" ry="1.5" fill="#FFF8E0" stroke="#C8B890" stroke-width=".6" transform="rotate(15 25 14)"/><ellipse cx="18" cy="10" rx="2.5" ry="1.2" fill="#FFF8E0" stroke="#C8B890" stroke-width=".6" transform="rotate(-10 18 10)"/></svg>',
    "黑米": '<svg viewBox="0 0 40 40"><path d="M7 18h26l-3 14a3 3 0 01-3 2H13a3 3 0 01-3-2z" fill="#B08050" stroke="#885830" stroke-width="1"/><ellipse cx="20" cy="18" rx="13" ry="4" fill="#C89868" stroke="#885830" stroke-width="1"/><circle cx="14" cy="14" r="2" fill="#382050" stroke="#280840" stroke-width=".5"/><circle cx="19" cy="12" r="2" fill="#382050" stroke="#280840" stroke-width=".5"/><circle cx="24" cy="14" r="2" fill="#382050" stroke="#280840" stroke-width=".5"/><circle cx="17" cy="10" r="1.8" fill="#382050" stroke="#280840" stroke-width=".5"/><circle cx="22" cy="11" r="1.8" fill="#382050" stroke="#280840" stroke-width=".5"/></svg>',
    "小米": '<svg viewBox="0 0 40 40"><path d="M7 18h26l-3 14a3 3 0 01-3 2H13a3 3 0 01-3-2z" fill="#B08050" stroke="#885830" stroke-width="1"/><ellipse cx="20" cy="18" rx="13" ry="4" fill="#C89868" stroke="#885830" stroke-width="1"/><circle cx="14" cy="14" r="1.5" fill="#F0B800"/><circle cx="17" cy="12" r="1.5" fill="#F0B800"/><circle cx="20" cy="13" r="1.5" fill="#F0B800"/><circle cx="23" cy="12" r="1.5" fill="#F0B800"/><circle cx="26" cy="14" r="1.5" fill="#F0B800"/><circle cx="15" cy="10" r="1.2" fill="#F0B800"/><circle cx="19" cy="9" r="1.2" fill="#F0B800"/><circle cx="23" cy="10" r="1.2" fill="#F0B800"/></svg>',

    // ===== 花类 =====
    "桂花": '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="3" fill="#C88800"/><ellipse cx="20" cy="11" rx="3.5" ry="5" fill="#F0B800" stroke="#C88800" stroke-width=".6"/><ellipse cx="29" cy="20" rx="5" ry="3.5" fill="#F0B800" stroke="#C88800" stroke-width=".6"/><ellipse cx="20" cy="29" rx="3.5" ry="5" fill="#F0B800" stroke="#C88800" stroke-width=".6"/><ellipse cx="11" cy="20" rx="5" ry="3.5" fill="#F0B800" stroke="#C88800" stroke-width=".6"/></svg>',
    "玫瑰": '<svg viewBox="0 0 40 40"><path d="M20 36v-10" stroke="#408820" stroke-width="1.8" stroke-linecap="round"/><ellipse cx="15" cy="30" rx="4" ry="2" fill="#50A030" transform="rotate(-30 15 30)"/><ellipse cx="25" cy="32" rx="3.5" ry="1.8" fill="#50A030" transform="rotate(25 25 32)"/><ellipse cx="20" cy="18" rx="12" ry="10" fill="#E85888" stroke="#C83860" stroke-width=".8"/><ellipse cx="15" cy="16" rx="5" ry="7" fill="#E04878" transform="rotate(-15 15 16)"/><ellipse cx="25" cy="16" rx="5" ry="7" fill="#E04878" transform="rotate(15 25 16)"/><ellipse cx="20" cy="14" rx="4" ry="6" fill="#D83868"/><ellipse cx="20" cy="18" rx="6" ry="4" fill="#E85080" transform="rotate(-10 20 18)"/><circle cx="20" cy="16" r="3" fill="#C83058"/></svg>',
    "菊花": '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="3" fill="#C06800"/><ellipse cx="20" cy="10" rx="2" ry="5.5" fill="#F09820" stroke="#D07800" stroke-width=".4"/><ellipse cx="27" cy="12" rx="2" ry="5.5" fill="#F09820" stroke="#D07800" stroke-width=".4" transform="rotate(45 27 12)"/><ellipse cx="30" cy="20" rx="5.5" ry="2" fill="#F09820" stroke="#D07800" stroke-width=".4"/><ellipse cx="27" cy="28" rx="2" ry="5.5" fill="#F09820" stroke="#D07800" stroke-width=".4" transform="rotate(-45 27 28)"/><ellipse cx="20" cy="30" rx="2" ry="5.5" fill="#F09820" stroke="#D07800" stroke-width=".4"/><ellipse cx="13" cy="28" rx="2" ry="5.5" fill="#F09820" stroke="#D07800" stroke-width=".4" transform="rotate(45 13 28)"/><ellipse cx="10" cy="20" rx="5.5" ry="2" fill="#F09820" stroke="#D07800" stroke-width=".4"/><ellipse cx="13" cy="12" rx="2" ry="5.5" fill="#F09820" stroke="#D07800" stroke-width=".4" transform="rotate(-45 13 12)"/></svg>',
    "茉莉花": '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="3" fill="#D8C850"/><ellipse cx="20" cy="10" rx="4" ry="6" fill="#FFFFF0" stroke="#C0B880" stroke-width=".7"/><ellipse cx="29.5" cy="17" rx="4" ry="6" fill="#FFFFF0" stroke="#C0B880" stroke-width=".7" transform="rotate(72 29.5 17)"/><ellipse cx="26" cy="27" rx="4" ry="6" fill="#FFFFF0" stroke="#C0B880" stroke-width=".7" transform="rotate(144 26 27)"/><ellipse cx="14" cy="27" rx="4" ry="6" fill="#FFFFF0" stroke="#C0B880" stroke-width=".7" transform="rotate(216 14 27)"/><ellipse cx="10.5" cy="17" rx="4" ry="6" fill="#FFFFF0" stroke="#C0B880" stroke-width=".7" transform="rotate(288 10.5 17)"/></svg>',

    // ===== Group A: 酪类家族（方块奶酪，边缘半圆缺口） =====
    "奶酪": '<svg viewBox="0 0 40 40"><rect x="5" y="8" width="30" height="24" rx="2" fill="#F5C800" stroke="#D4A000" stroke-width="1.2"/><circle cx="14" cy="18" r="3" fill="#D4A800" opacity=".55"/><circle cx="25" cy="23" r="2.5" fill="#D4A800" opacity=".5"/><circle cx="17" cy="28" r="2" fill="#D4A800" opacity=".45"/><circle cx="28" cy="15" r="1.8" fill="#D4A800" opacity=".4"/><circle cx="5" cy="20" r="2.5" fill="#D4A000"/><circle cx="5" cy="20" r="2.5" fill="#F5C800"/><path d="M5 17.5v5" fill="none"/><circle cx="35" cy="26" r="2" fill="#D4A000"/><circle cx="35" cy="26" r="2" fill="#F5C800"/><circle cx="22" cy="8" r="2.2" fill="#D4A000"/><circle cx="22" cy="8" r="2.2" fill="#F5C800"/><rect x="5" y="8" width="30" height="24" rx="2" fill="none" stroke="#D4A000" stroke-width="1.2"/></svg>',
    "雪酪": '<svg viewBox="0 0 40 40"><rect x="5" y="8" width="30" height="24" rx="2" fill="#C0E8F8" stroke="#70B8D8" stroke-width="1.2"/><circle cx="14" cy="18" r="3" fill="#90C8E0" opacity=".5"/><circle cx="25" cy="23" r="2.5" fill="#90C8E0" opacity=".45"/><circle cx="17" cy="28" r="2" fill="#90C8E0" opacity=".4"/><circle cx="28" cy="15" r="1.8" fill="#90C8E0" opacity=".35"/><circle cx="5" cy="22" r="2.5" fill="#70B8D8"/><circle cx="5" cy="22" r="2.5" fill="#C0E8F8"/><circle cx="35" cy="16" r="2" fill="#70B8D8"/><circle cx="35" cy="16" r="2" fill="#C0E8F8"/><circle cx="12" cy="8" r="2" fill="#70B8D8"/><circle cx="12" cy="8" r="2" fill="#C0E8F8"/><rect x="5" y="8" width="30" height="24" rx="2" fill="none" stroke="#70B8D8" stroke-width="1.2"/><path d="M19 11l1.5-2 1.5 2-1.5 .8z" fill="#E0F4FF" opacity=".5"/></svg>',
    "双酪": '<svg viewBox="0 0 40 40"><rect x="2" y="12" width="22" height="20" rx="2" fill="#F5C800" stroke="#D4A000" stroke-width="1"/><circle cx="10" cy="20" r="2.5" fill="#D4A800" opacity=".5"/><circle cx="17" cy="26" r="2" fill="#D4A800" opacity=".45"/><circle cx="2" cy="22" r="2" fill="#D4A000"/><circle cx="2" cy="22" r="2" fill="#F5C800"/><rect x="2" y="12" width="22" height="20" rx="2" fill="none" stroke="#D4A000" stroke-width="1"/><rect x="16" y="6" width="22" height="20" rx="2" fill="#C0E8F8" stroke="#70B8D8" stroke-width="1"/><circle cx="26" cy="14" r="2.5" fill="#90C8E0" opacity=".5"/><circle cx="31" cy="20" r="1.8" fill="#90C8E0" opacity=".4"/><circle cx="38" cy="12" r="2" fill="#70B8D8"/><circle cx="38" cy="12" r="2" fill="#C0E8F8"/><rect x="16" y="6" width="22" height="20" rx="2" fill="none" stroke="#70B8D8" stroke-width="1"/></svg>',

    // ===== Group C: 花酒酿家族（坛子+花朵） =====
    "桂花酒酿": '<svg viewBox="0 0 40 40"><ellipse cx="20" cy="14" rx="8" ry="3" fill="#B87820" stroke="#905810" stroke-width="1"/><path d="M12 14v14c0 4 3.5 7 8 7s8-3 8-7V14" fill="#D8A840" stroke="#905810" stroke-width="1"/><circle cx="20" cy="8" r="3" fill="#F0B000" stroke="#C08800" stroke-width=".6"/><ellipse cx="20" cy="5" rx="1.5" ry="2.5" fill="#F8C800"/><ellipse cx="24" cy="8" rx="2.5" ry="1.5" fill="#F8C800"/><ellipse cx="16" cy="8" rx="2.5" ry="1.5" fill="#F8C800"/></svg>',
    "玫瑰酒酿": '<svg viewBox="0 0 40 40"><ellipse cx="20" cy="14" rx="8" ry="3" fill="#B87820" stroke="#905810" stroke-width="1"/><path d="M12 14v14c0 4 3.5 7 8 7s8-3 8-7V14" fill="#D8A840" stroke="#905810" stroke-width="1"/><ellipse cx="20" cy="7" rx="5" ry="4" fill="#E85888" stroke="#C83860" stroke-width=".5"/><ellipse cx="17" cy="6" rx="2.5" ry="3.5" fill="#E04878" transform="rotate(-15 17 6)"/><ellipse cx="23" cy="6" rx="2.5" ry="3.5" fill="#E04878" transform="rotate(15 23 6)"/><circle cx="20" cy="6.5" r="2" fill="#C83058"/></svg>',
    "菊花酒酿": '<svg viewBox="0 0 40 40"><ellipse cx="20" cy="14" rx="8" ry="3" fill="#B87820" stroke="#905810" stroke-width="1"/><path d="M12 14v14c0 4 3.5 7 8 7s8-3 8-7V14" fill="#D8A840" stroke="#905810" stroke-width="1"/><circle cx="20" cy="8" r="2" fill="#C06800"/><ellipse cx="20" cy="4.5" rx="1.2" ry="2.5" fill="#F09020"/><ellipse cx="24" cy="7.5" rx="2.5" ry="1.2" fill="#F09020"/><ellipse cx="20" cy="11.5" rx="1.2" ry="2.5" fill="#F09020"/><ellipse cx="16" cy="7.5" rx="2.5" ry="1.2" fill="#F09020"/></svg>',
    "茉莉酒酿": '<svg viewBox="0 0 40 40"><ellipse cx="20" cy="14" rx="8" ry="3" fill="#B87820" stroke="#905810" stroke-width="1"/><path d="M12 14v14c0 4 3.5 7 8 7s8-3 8-7V14" fill="#D8A840" stroke="#905810" stroke-width="1"/><circle cx="20" cy="8" r="3" fill="#F0F0D8" stroke="#B8B080" stroke-width=".6"/><circle cx="20" cy="5.5" r="1.8" fill="#FFFFF0"/><circle cx="23" cy="8" r="1.8" fill="#FFFFF0"/><circle cx="17" cy="8" r="1.8" fill="#FFFFF0"/><circle cx="20" cy="8" r="1.2" fill="#D8C850"/></svg>',

    // ===== Group B: 最终饮品（杯形+分层） =====
    "酒酿桂花酪": '<svg viewBox="0 0 40 40"><path d="M10 6h20l-2 22a4 4 0 01-4 3h-8a4 4 0 01-4-3z" fill="#FFF0C8" stroke="#B88840" stroke-width="1"/><rect x="12" y="18" width="16" height="8" fill="#E8B040" opacity=".6" rx="1"/><rect x="11" y="12" width="18" height="6" fill="#F0C050" opacity=".4" rx="1"/><circle cx="20" cy="4" r="2.5" fill="#F0B000" stroke="#C08800" stroke-width=".5"/><ellipse cx="17" cy="3" rx="1.5" ry="1" fill="#F8C800" opacity=".9"/><ellipse cx="23" cy="3" rx="1.5" ry="1" fill="#F8C800" opacity=".9"/></svg>',
    "冰酒酿桂花酪": '<svg viewBox="0 0 40 40"><path d="M10 6h20l-2 22a4 4 0 01-4 3h-8a4 4 0 01-4-3z" fill="#C8E8F8" stroke="#58A0C8" stroke-width="1"/><rect x="12" y="18" width="16" height="8" fill="#E0B040" opacity=".5" rx="1"/><rect x="11" y="12" width="18" height="6" fill="#A0D8F0" opacity=".5" rx="1"/><path d="M17 8l3-4 3 4-3 2z" fill="#80C8E8" opacity=".7"/><circle cx="20" cy="3" r="2" fill="#F0B000" stroke="#C08800" stroke-width=".4"/><ellipse cx="17.5" cy="2.5" rx="1" ry=".7" fill="#F8C800" opacity=".8"/><ellipse cx="22.5" cy="2.5" rx="1" ry=".7" fill="#F8C800" opacity=".8"/></svg>',
    "酒酿玫瑰酪": '<svg viewBox="0 0 40 40"><path d="M10 6h20l-2 22a4 4 0 01-4 3h-8a4 4 0 01-4-3z" fill="#FFF0E8" stroke="#B88840" stroke-width="1"/><rect x="12" y="18" width="16" height="8" fill="#E86898" opacity=".45" rx="1"/><rect x="11" y="12" width="18" height="6" fill="#F0B8C8" opacity=".4" rx="1"/><ellipse cx="20" cy="3.5" rx="4" ry="3" fill="#E85888" stroke="#C83860" stroke-width=".4"/><ellipse cx="17.5" cy="3" rx="2" ry="2.5" fill="#E04878" transform="rotate(-15 17.5 3)"/><ellipse cx="22.5" cy="3" rx="2" ry="2.5" fill="#E04878" transform="rotate(15 22.5 3)"/><circle cx="20" cy="3" r="1.5" fill="#C83058"/></svg>',

    // ===== 中间产物 =====
    "甜牛奶": '<svg viewBox="0 0 40 40"><rect x="16" y="4" width="8" height="4" rx="1.5" fill="#F0E0C0" stroke="#B89060" stroke-width="1"/><path d="M16 8l-3 4h14l-3-4" fill="#FFF4D8" stroke="#B89060" stroke-width="1"/><path d="M13 12h14v19a4 4 0 01-4 4H17a4 4 0 01-4-4z" fill="#FFFDF0" stroke="#B89060" stroke-width="1"/><path d="M23 7l2-3" stroke="#F0B000" stroke-width="1.5" stroke-linecap="round"/><circle cx="26" cy="3" r="1.5" fill="#F0B000"/></svg>',
    "酸奶": '<svg viewBox="0 0 40 40"><rect x="16" y="4" width="8" height="4" rx="1.5" fill="#E8ECD8" stroke="#98A878" stroke-width="1"/><path d="M16 8l-3 4h14l-3-4" fill="#F2F5E8" stroke="#98A878" stroke-width="1"/><path d="M13 12h14v19a4 4 0 01-4 4H17a4 4 0 01-4-4z" fill="#FAFCF4" stroke="#98A878" stroke-width="1"/><ellipse cx="20" cy="22" rx="5" ry="7" fill="#E0E8D0" opacity=".45"/></svg>',
    "甜酸奶": '<svg viewBox="0 0 40 40"><rect x="16" y="4" width="8" height="4" rx="1.5" fill="#F0E8D0" stroke="#B89868" stroke-width="1"/><path d="M16 8l-3 4h14l-3-4" fill="#FFF6E8" stroke="#B89868" stroke-width="1"/><path d="M13 12h14v19a4 4 0 01-4 4H17a4 4 0 01-4-4z" fill="#FFFBF2" stroke="#B89868" stroke-width="1"/><ellipse cx="20" cy="22" rx="5" ry="7" fill="#F8ECD8" opacity=".5"/><circle cx="24" cy="16" r="1.2" fill="#F0C030" opacity=".7"/></svg>',
    "霜酪": '<svg viewBox="0 0 40 40"><rect x="8" y="10" width="24" height="18" rx="3" fill="#DCECF8" stroke="#78B0D0" stroke-width="1"/><path d="M12 12 Q20 8 28 12" fill="none" stroke="#B8DCF0" stroke-width="1"/><circle cx="14" cy="20" r="2" fill="#C8E4F8" opacity=".7"/><circle cx="26" cy="22" r="1.6" fill="#C8E4F8" opacity=".65"/><path d="M18 8l2-3 2 3z" fill="#A8D8F0" opacity=".85"/></svg>',
    "酒酿": '<svg viewBox="0 0 40 40"><ellipse cx="20" cy="12" rx="8" ry="3" fill="#B87820" stroke="#905810" stroke-width="1"/><path d="M12 12v16c0 4 3.5 7 8 7s8-3 8-7V12" fill="#D8A840" stroke="#905810" stroke-width="1"/><circle cx="17" cy="22" r="1.2" fill="#F0C050" opacity=".5"/><circle cx="23" cy="26" r="1" fill="#F0C050" opacity=".45"/></svg>',
    "米酒": '<svg viewBox="0 0 40 40"><rect x="16" y="5" width="8" height="4" rx="2" fill="#C8B888" stroke="#988860" stroke-width="1"/><path d="M13 9h14v21a5 5 0 01-5 5h-4a5 5 0 01-5-5z" fill="#F0E0B8" stroke="#988860" stroke-width="1"/><circle cx="18" cy="22" r="1" fill="#D8C898" opacity=".5"/><circle cx="22" cy="26" r=".8" fill="#D8C898" opacity=".45"/></svg>',
    "黑米露": '<svg viewBox="0 0 40 40"><rect x="16" y="5" width="8" height="4" rx="2" fill="#583878" stroke="#381850" stroke-width="1"/><path d="M13 9h14v21a5 5 0 01-5 5h-4a5 5 0 01-5-5z" fill="#684888" stroke="#381850" stroke-width="1"/><circle cx="18" cy="22" r="1" fill="#806098" opacity=".5"/><circle cx="22" cy="26" r=".8" fill="#806098" opacity=".45"/></svg>',
    "小米黄酒": '<svg viewBox="0 0 40 40"><rect x="16" y="5" width="8" height="4" rx="2" fill="#C89020" stroke="#A07008" stroke-width="1"/><path d="M13 9h14v21a5 5 0 01-5 5h-4a5 5 0 01-5-5z" fill="#E0A830" stroke="#A07008" stroke-width="1"/><circle cx="18" cy="22" r="1" fill="#F0C040" opacity=".5"/><circle cx="22" cy="26" r=".8" fill="#F0C040" opacity=".45"/></svg>',
    "奶酒": '<svg viewBox="0 0 40 40"><rect x="16" y="4" width="8" height="4" rx="1.5" fill="#E8D0A8" stroke="#B08050" stroke-width="1"/><path d="M16 8l-3 4h14l-3-4" fill="#F4E4C8" stroke="#B08050" stroke-width="1"/><path d="M13 12h14v19a4 4 0 01-4 4H17a4 4 0 01-4-4z" fill="#FFF0D8" stroke="#B08050" stroke-width="1"/><ellipse cx="20" cy="22" rx="5" ry="7" fill="#E8C078" opacity=".45"/><circle cx="22" cy="18" r="1.2" fill="#F5E8C0" opacity=".7"/></svg>',
    "高度奶酒": '<svg viewBox="0 0 40 40"><rect x="16" y="4" width="8" height="4" rx="1.5" fill="#C89858" stroke="#986838" stroke-width="1"/><path d="M16 8l-3 4h14l-3-4" fill="#D8B078" stroke="#986838" stroke-width="1"/><path d="M13 12h14v19a4 4 0 01-4 4H17a4 4 0 01-4-4z" fill="#E8C898" stroke="#986838" stroke-width="1"/><ellipse cx="20" cy="22" rx="5" ry="7" fill="#C87838" opacity=".5"/><circle cx="21" cy="17" r="1.3" fill="#F0D8A8" opacity=".55"/></svg>',
    "桂香奶酪": '<svg viewBox="0 0 40 40"><rect x="5" y="10" width="30" height="22" rx="2" fill="#F0C800" stroke="#C8A000" stroke-width="1"/><circle cx="13" cy="20" r="2.5" fill="#C8A000" opacity=".45"/><circle cx="24" cy="25" r="2" fill="#C8A000" opacity=".4"/><circle cx="5" cy="22" r="2" fill="#C8A000"/><circle cx="5" cy="22" r="2" fill="#F0C800"/><rect x="5" y="10" width="30" height="22" rx="2" fill="none" stroke="#C8A000" stroke-width="1"/><circle cx="28" cy="6" r="3" fill="#F0B800" stroke="#D09800" stroke-width=".5"/><ellipse cx="25" cy="5" rx="2" ry="1.2" fill="#F8D000"/><ellipse cx="31" cy="5" rx="2" ry="1.2" fill="#F8D000"/></svg>',
    "桂花雪酪": '<svg viewBox="0 0 40 40"><rect x="5" y="10" width="30" height="22" rx="2" fill="#B0E0F0" stroke="#60A8C8" stroke-width="1"/><circle cx="13" cy="20" r="2.5" fill="#80C0D8" opacity=".45"/><circle cx="24" cy="25" r="2" fill="#80C0D8" opacity=".4"/><circle cx="35" cy="18" r="2" fill="#60A8C8"/><circle cx="35" cy="18" r="2" fill="#B0E0F0"/><rect x="5" y="10" width="30" height="22" rx="2" fill="none" stroke="#60A8C8" stroke-width="1"/><circle cx="28" cy="6" r="3" fill="#F0B800" stroke="#D09800" stroke-width=".5"/><ellipse cx="25" cy="5" rx="2" ry="1.2" fill="#F8D000"/><ellipse cx="31" cy="5" rx="2" ry="1.2" fill="#F8D000"/></svg>',

    // ===== 特殊 UI 图标 =====
    "_diamond": '<svg viewBox="0 0 40 40"><path d="M8 16l12-12 12 12-12 20z" fill="#60C0F0" stroke="#2890D0" stroke-width="1.2"/><path d="M8 16l12-12 12 12H8z" fill="#90D8FF" stroke="#2890D0" stroke-width="1.2"/><path d="M8 16h24l-12 20z" fill="#48B0E8"/><path d="M20 4l-6 12h12z" fill="#B0E8FF" opacity=".6"/></svg>',

    // ===== 死胡同产物（整体灰化 / 淡化） =====
    "糖酿": '<svg viewBox="0 0 40 40"><g opacity=".65"><ellipse cx="20" cy="12" rx="8" ry="3" fill="#B89868" stroke="#907040" stroke-width="1"/><path d="M12 12v16c0 4 3.5 7 8 7s8-3 8-7V12" fill="#D0B070" stroke="#907040" stroke-width="1"/><circle cx="17" cy="22" r="1.5" fill="#E0C080" opacity=".6"/><circle cx="23" cy="20" r="1.2" fill="#E0C080" opacity=".5"/></g></svg>',
    "冰奶酪": '<svg viewBox="0 0 40 40"><g opacity=".6"><rect x="5" y="8" width="30" height="24" rx="2" fill="#B8C8D4" stroke="#8098A8" stroke-width="1"/><circle cx="14" cy="18" r="3" fill="#98B0C0" opacity=".45"/><circle cx="25" cy="23" r="2.5" fill="#98B0C0" opacity=".4"/><circle cx="5" cy="20" r="2.5" fill="#8098A8"/><circle cx="5" cy="20" r="2.5" fill="#B8C8D4"/><rect x="5" y="8" width="30" height="24" rx="2" fill="none" stroke="#8098A8" stroke-width="1"/></g></svg>',
    "冰酒酿": '<svg viewBox="0 0 40 40"><g opacity=".6"><ellipse cx="20" cy="12" rx="8" ry="3" fill="#8898B0" stroke="#687898" stroke-width="1"/><path d="M12 12v16c0 4 3.5 7 8 7s8-3 8-7V12" fill="#98A8C0" stroke="#687898" stroke-width="1"/><path d="M18 8l2-3 2 3z" fill="#B0C8D8" opacity=".6"/></g></svg>',
    "冰甜奶": '<svg viewBox="0 0 40 40"><g opacity=".6"><rect x="16" y="4" width="8" height="4" rx="1.5" fill="#B8C0D0" stroke="#8890A8" stroke-width="1"/><path d="M16 8l-3 4h14l-3-4" fill="#C8D0E0" stroke="#8890A8" stroke-width="1"/><path d="M13 12h14v19a4 4 0 01-4 4H17a4 4 0 01-4-4z" fill="#D0D8E8" stroke="#8890A8" stroke-width="1"/></g></svg>',
    "冰霜雪酪": '<svg viewBox="0 0 40 40"><g opacity=".6"><rect x="5" y="8" width="30" height="24" rx="2" fill="#B0C8D8" stroke="#7898B0" stroke-width="1"/><circle cx="14" cy="18" r="3" fill="#90B0C8" opacity=".4"/><circle cx="25" cy="24" r="2" fill="#90B0C8" opacity=".35"/><circle cx="35" cy="16" r="2" fill="#7898B0"/><circle cx="35" cy="16" r="2" fill="#B0C8D8"/><rect x="5" y="8" width="30" height="24" rx="2" fill="none" stroke="#7898B0" stroke-width="1"/><path d="M20 5v3M18.5 6.5h3" stroke="#A0C0D8" stroke-width=".8" stroke-linecap="round"/></g></svg>',
    "冰米酒": '<svg viewBox="0 0 40 40"><g opacity=".6"><rect x="16" y="5" width="8" height="4" rx="2" fill="#98A0B0" stroke="#687888" stroke-width="1"/><path d="M13 9h14v21a5 5 0 01-5 5h-4a5 5 0 01-5-5z" fill="#A8B0C0" stroke="#687888" stroke-width="1"/><path d="M18 7l2-3 2 3z" fill="#B0C8D8" opacity=".6"/></g></svg>',
    "怪味发酵物": '<svg viewBox="0 0 40 40"><g opacity=".65"><ellipse cx="20" cy="21" rx="11" ry="10" fill="#708838" stroke="#506820" stroke-width="1"/><circle cx="15" cy="18" r="2" fill="#607028" opacity=".6"/><circle cx="24" cy="23" r="2.5" fill="#607028" opacity=".5"/><circle cx="18" cy="26" r="1.5" fill="#607028" opacity=".6"/><path d="M16 15c2-2 5-2 7 0" stroke="#506820" stroke-width=".8" fill="none"/></g></svg>',
    "甜酵糖": '<svg viewBox="0 0 40 40"><g opacity=".6"><polygon points="22,8 28,16 24,26 14,24 12,14" fill="#d8c8b8" stroke="#a89888" stroke-width="1"/><circle cx="18" cy="16" r="2.5" fill="#c8b8a8" opacity=".7"/><circle cx="24" cy="22" r="2" fill="#b8a898" opacity=".65"/></g></svg>',
    "甜奶浊酿": '<svg viewBox="0 0 40 40"><g opacity=".62"><ellipse cx="20" cy="14" rx="8" ry="3" fill="#a89888" stroke="#887868" stroke-width="1"/><path d="M12 14v14c0 4 3.5 7 8 7s8-3 8-7V14" fill="#c8b8a8" stroke="#887868" stroke-width="1"/></g></svg>',
    "酵糯饭": '<svg viewBox="0 0 40 40"><g opacity=".62"><path d="M7 18h26l-3 14a3 3 0 01-3 2H13a3 3 0 01-3-2z" fill="#b89878" stroke="#887058" stroke-width="1"/><ellipse cx="20" cy="18" rx="13" ry="4" fill="#c8a888" stroke="#887058" stroke-width="1"/></g></svg>',
    "酵米饭": '<svg viewBox="0 0 40 40"><g opacity=".62"><path d="M7 18h26l-3 14a3 3 0 01-3 2H13a3 3 0 01-3-2z" fill="#b89878" stroke="#887058" stroke-width="1"/><ellipse cx="20" cy="18" rx="13" ry="4" fill="#c8a888" stroke="#887058"/></g></svg>',
    "酵黑米饭": '<svg viewBox="0 0 40 40"><g opacity=".62"><path d="M7 18h26l-3 14a3 3 0 01-3 2H13a3 3 0 01-3-2z" fill="#886878" stroke="#604858" stroke-width="1"/><ellipse cx="20" cy="18" rx="13" ry="4" fill="#987888" stroke="#604858"/></g></svg>',
    "酵粟饭": '<svg viewBox="0 0 40 40"><g opacity=".62"><path d="M7 18h26l-3 14a3 3 0 01-3 2H13a3 3 0 01-3-2z" fill="#b89858" stroke="#887038" stroke-width="1"/><ellipse cx="20" cy="18" rx="13" ry="4" fill="#c8a858" stroke="#887038"/></g></svg>',
    "桂花浊酿": '<svg viewBox="0 0 40 40"><g opacity=".58"><ellipse cx="20" cy="14" rx="8" ry="3" fill="#886838" stroke="#685028" stroke-width="1"/><path d="M12 14v14c0 4 3.5 7 8 7s8-3 8-7V14" fill="#a07848" stroke="#685028" stroke-width="1"/><circle cx="20" cy="8" r="2.5" fill="#886818" opacity=".8"/></g></svg>',
    "玫瑰浊酿": '<svg viewBox="0 0 40 40"><g opacity=".58"><ellipse cx="20" cy="14" rx="8" ry="3" fill="#704848" stroke="#583038" stroke-width="1"/><path d="M12 14v14c0 4 3.5 7 8 7s8-3 8-7V14" fill="#986058" stroke="#583038" stroke-width="1"/><ellipse cx="20" cy="8" rx="4" ry="3" fill="#884858" opacity=".85"/></g></svg>',
    "菊花浊酿": '<svg viewBox="0 0 40 40"><g opacity=".58"><ellipse cx="20" cy="14" rx="8" ry="3" fill="#706848" stroke="#584838" stroke-width="1"/><path d="M12 14v14c0 4 3.5 7 8 7s8-3 8-7V14" fill="#908058" stroke="#584838" stroke-width="1"/><circle cx="20" cy="8" r="2" fill="#886828"/></g></svg>',
    "茉莉浊酿": '<svg viewBox="0 0 40 40"><g opacity=".58"><ellipse cx="20" cy="14" rx="8" ry="3" fill="#787868" stroke="#585848" stroke-width="1"/><path d="M12 14v14c0 4 3.5 7 8 7s8-3 8-7V14" fill="#a0a088" stroke="#585848" stroke-width="1"/><circle cx="20" cy="8" r="2.5" fill="#c8c8b0" opacity=".85"/></g></svg>',
    "渍酿奶": '<svg viewBox="0 0 40 40"><g opacity=".62"><path d="M13 12h14v19a4 4 0 01-4 4H17a4 4 0 01-4-4z" fill="#f2ebe2" stroke="#c8b098" stroke-width="1"/><path d="M14 14h12v10H14z" fill="#e8d090" opacity=".35" rx="1"/></g></svg>',
    "酒焖奶酪": '<svg viewBox="0 0 40 40"><g opacity=".62"><rect x="5" y="8" width="30" height="24" rx="2" fill="#d8a830" stroke="#b08818" stroke-width="1"/><circle cx="14" cy="18" r="3" fill="#b08818" opacity=".45"/><path d="M26 10 Q30 14 28 22" stroke="#986018" stroke-width="1.2" fill="none" opacity=".65"/></g></svg>',
    "酵奶酒": '<svg viewBox="0 0 40 40"><g opacity=".62"><path d="M13 12h14v19a4 4 0 01-4 4H17a4 4 0 01-4-4z" fill="#e0d4b8" stroke="#b89868" stroke-width="1"/><ellipse cx="20" cy="22" rx="6" ry="8" fill="#c8a878" opacity=".45"/><circle cx="23" cy="17" r="2" fill="#887858" opacity=".35"/></g></svg>',
    "滥酵奶酒": '<svg viewBox="0 0 40 40"><g opacity=".58"><path d="M13 12h14v19a4 4 0 01-4 4H17a4 4 0 01-4-4z" fill="#c8b098" stroke="#988058" stroke-width="1"/><ellipse cx="20" cy="22" rx="7" ry="9" fill="#a08048" opacity=".55"/></g></svg>',
    "塌雪酪": '<svg viewBox="0 0 40 40"><g opacity=".62"><rect x="6" y="14" width="28" height="18" rx="3" fill="#c8d8e0" stroke="#8898a8" stroke-width="1"/><path d="M10 14 Q20 22 30 14" fill="#b0c8d8" opacity=".6"/></g></svg>',
    "酵浆浑汤": '<svg viewBox="0 0 40 40"><g opacity=".62"><ellipse cx="20" cy="22" rx="14" ry="10" fill="#c8b898" stroke="#988868" stroke-width="1"/><ellipse cx="20" cy="20" rx="11" ry="7" fill="#d8c8a8" opacity=".7"/><circle cx="14" cy="22" r="2" fill="#887858" opacity=".35"/><circle cx="26" cy="23" r="2.5" fill="#887858" opacity=".3"/></g></svg>',
    "冰淬浊酿": '<svg viewBox="0 0 40 40"><g opacity=".62"><ellipse cx="20" cy="14" rx="8" ry="3" fill="#6898b0" stroke="#487878" stroke-width="1"/><path d="M12 14v14c0 4 3.5 7 8 7s8-3 8-7V14" fill="#98b8c8" stroke="#487878" stroke-width="1"/><path d="M18 8l2-3 2 3z" fill="#b0d8f0" opacity=".8"/></g></svg>',
    "酵酪糊": '<svg viewBox="0 0 40 40"><g opacity=".62"><ellipse cx="20" cy="24" rx="14" ry="10" fill="#c8b088" stroke="#988858" stroke-width="1"/><path d="M12 18 Q20 14 28 18" fill="#d8c8a0" opacity=".55"/></g></svg>',
    "桂花牛奶": '<svg viewBox="0 0 40 40"><g opacity=".65"><rect x="16" y="4" width="8" height="4" rx="1.5" fill="#E8D8B8" stroke="#B89060" stroke-width="1"/><path d="M16 8l-3 4h14l-3-4" fill="#F0E4C8" stroke="#B89060" stroke-width="1"/><path d="M13 12h14v19a4 4 0 01-4 4H17a4 4 0 01-4-4z" fill="#FFF8E0" stroke="#B89060" stroke-width="1"/><circle cx="23" cy="6" r="2.5" fill="#F0B000" opacity=".7"/></g></svg>',
    "玫瑰牛奶": '<svg viewBox="0 0 40 40"><g opacity=".65"><rect x="16" y="4" width="8" height="4" rx="1.5" fill="#E8D8B8" stroke="#B89060" stroke-width="1"/><path d="M16 8l-3 4h14l-3-4" fill="#F0E4C8" stroke="#B89060" stroke-width="1"/><path d="M13 12h14v19a4 4 0 01-4 4H17a4 4 0 01-4-4z" fill="#FFF0F0" stroke="#B89060" stroke-width="1"/><ellipse cx="25" cy="5" rx="3" ry="2.5" fill="#E85888" opacity=".7"/><circle cx="25" cy="5" r="1.2" fill="#C83058" opacity=".7"/></g></svg>',
    "酒酿奶酪": '<svg viewBox="0 0 40 40"><g opacity=".65"><rect x="5" y="8" width="30" height="24" rx="2" fill="#E0C060" stroke="#B89830" stroke-width="1"/><circle cx="14" cy="18" r="2.8" fill="#C8A030" opacity=".4"/><circle cx="25" cy="24" r="2" fill="#C8A030" opacity=".35"/><circle cx="5" cy="21" r="2" fill="#B89830"/><circle cx="5" cy="21" r="2" fill="#E0C060"/><rect x="5" y="8" width="30" height="24" rx="2" fill="none" stroke="#B89830" stroke-width="1"/></g></svg>',
    "酒酿雪酪": '<svg viewBox="0 0 40 40"><g opacity=".65"><rect x="5" y="8" width="30" height="24" rx="2" fill="#C8D8C0" stroke="#90A888" stroke-width="1"/><circle cx="14" cy="18" r="2.8" fill="#A0B898" opacity=".4"/><circle cx="25" cy="24" r="2" fill="#A0B898" opacity=".35"/><circle cx="35" cy="18" r="2" fill="#90A888"/><circle cx="35" cy="18" r="2" fill="#C8D8C0"/><rect x="5" y="8" width="30" height="24" rx="2" fill="none" stroke="#90A888" stroke-width="1"/></g></svg>',
    "酒酿菊花酪": '<svg viewBox="0 0 40 40"><g opacity=".6"><path d="M10 6h20l-2 22a4 4 0 01-4 3h-8a4 4 0 01-4-3z" fill="#E8D8B8" stroke="#A88860" stroke-width="1"/><rect x="12" y="18" width="16" height="8" fill="#D0A040" opacity=".35" rx="1"/><circle cx="20" cy="4" r="2" fill="#C06800"/><ellipse cx="20" cy="2" rx="1" ry="2" fill="#F09020" opacity=".8"/><ellipse cx="22.5" cy="4" rx="2" ry="1" fill="#F09020" opacity=".8"/><ellipse cx="17.5" cy="4" rx="2" ry="1" fill="#F09020" opacity=".8"/></g></svg>',
    "酒酿茉莉酪": '<svg viewBox="0 0 40 40"><g opacity=".6"><path d="M10 6h20l-2 22a4 4 0 01-4 3h-8a4 4 0 01-4-3z" fill="#E8D8B8" stroke="#A88860" stroke-width="1"/><rect x="12" y="18" width="16" height="8" fill="#D0C898" opacity=".35" rx="1"/><circle cx="20" cy="4" r="2.5" fill="#F0F0D0" stroke="#B8B060" stroke-width=".5"/><circle cx="20" cy="4" r="1.2" fill="#D8C850" opacity=".8"/></g></svg>',
};

// 元素信息库
const ITEMS = {
    // 基础原料
    "牛奶": { icon: "🥛", type: "base", desc: "草场与晨光里的奶香，酪与饮的底色。" },
    "酒酿原浆": { icon: "🍶", type: "base", desc: "四十日窖藏的甘洌，糯米与光阴酿成的底味。" },
    "冰糖碎": { icon: "🍬", type: "base", desc: "碎碎甜甜的琥珀心意，给液体一缕温柔。" },
    "冰块": { icon: "🧊", type: "base", desc: "一口清透的冷静，压住燥热与腻。" },
    "滤布": { icon: "🧵", type: "tool", desc: "滤去乳清，把酸奶收成厚实的酪。" },
    "菌种": { icon: "🦠", type: "base", desc: "极小却执拗的生命，专司奶里的微妙转化。" },
    "酿造": { icon: "🏺", type: "process", desc: "烟火人间里，以谷果入酿、凝香成酒的老法子。" },
    "发酵": { icon: "🫙", type: "process", desc: "万物自化，让寻常食材在静息间慢慢生香蜕变。" },
    "加热": { icon: "🔥", type: "tool", desc: "加热工具" },
    "冷冻": { icon: "❄️", type: "tool", desc: "冷冻工具" },
    
    // 花类原料
    "桂花": { icon: "🌼", type: "floral", desc: "枝头小小金屑，香气不争却绵长。" },
    "桂花原浆": { icon: "🌼", type: "floral", desc: "桂花原浆" },
    "玫瑰": { icon: "🌹", type: "floral", desc: "浓烈却坦荡的一层绯红，适合托住醇厚。" },
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
    
    // 功能 / 货币物品
    "配方书": { icon: "📖", type: "special", desc: "记着前人试错与心得的旧册子。", isRecipeBook: true },
    "珠宝": { icon: "🪙", type: "currency", desc: "一点温润亮光，可在坊间换来稀罕花材。", noSynthesize: true },

    // 花卉原料（干扰项）
    "茉莉花": { icon: "🌸", type: "floral", desc: "新开时像落了薄雪，香气温吞吞地渗出来。" },

    // 花卉原料（补充）
    "菊花": { icon: "🏵️", type: "floral", desc: "山野清气，淡而远。" },

    // 谷物原料（第一章）
    "糯米": { icon: "🍚", type: "base", desc: "圆滚滚的米粒，专候一场绵甜的酝酿。" },
    "大米": { icon: "🌾", type: "base", desc: "家常米粒，酿得出酒，却不是那份糯甜。" },
    "黑米": { icon: "🖤", type: "base", desc: "紫黑一粒粒，酿出来像夜色里的露。" },
    "小米": { icon: "🟡", type: "base", desc: "金子似的细粒，走的是另一条酒香小路。" },

    // 干扰项产物
    "酒酿": { icon: "🍶", type: "mid", desc: "糯米与时光私语酿出的甜。" },
    "米酒": { icon: "🍶", type: "mid", desc: "米的另一种醉意，爽直。" },
    "黑米露": { icon: "🍷", type: "mid", desc: "紫黑浆液里沉着谷物的倔强。" },
    "小米黄酒": { icon: "🍺", type: "mid", desc: "小米走的路更古朴，酒味厚拙。" },

    // 死胡同产物（第一章探索配方）
    "糖酿": { icon: "🍯", type: "deadend", desc: "甜到发腻的糖浆，没有用处" },
    "冰奶酪": { icon: "🧊", type: "deadend", desc: "冻硬了的奶酪，嚼不动" },
    "冰酒酿": { icon: "🧊", type: "deadend", desc: "冰镇的酒酿，凑合喝" },
    "冰甜奶": { icon: "🥛", type: "deadend", desc: "冰的甜牛奶，仅此而已" },
    "冰霜雪酪": { icon: "❄️", type: "deadend", desc: "冻过头了，硬邦邦" },
    "冰米酒": { icon: "🧊", type: "deadend", desc: "冰镇米酒，古朴的清凉" },
    "怪味发酵物": { icon: "🤮", type: "deadend", desc: "发酵与酿造搅在一处，谁也不肯认错。" },
    "甜酵糖": { icon: "🍬", type: "deadend", desc: "糖急着发酵，只剩一团糊涂。" },
    "甜奶浊酿": { icon: "🍶", type: "deadend", desc: "酿造把酒谷的香塞进甜奶里……轻盈酪要走发酵再滤布。" },
    "酵糯饭": { icon: "🍚", type: "deadend", desc: "糯米饭发酵发酸，离「酒酿」还差酿造那一魂。" },
    "酵米饭": { icon: "🍚", type: "deadend", desc: "寻常米粒发酵成酸饭，不是米酒那条酿路。" },
    "酵黑米饭": { icon: "🍚", type: "deadend", desc: "紫黑米粒发酵后只剩古怪稠酸，不是黑米露。" },
    "酵粟饭": { icon: "🟡", type: "deadend", desc: "粟米稠成一团发酵味，也不是小米黄酒的酿法。" },
    "桂花浊酿": { icon: "🌼", type: "deadend", desc: "桂花闷进酿造糟里发浊；花香应先遇见酒酿原浆。" },
    "玫瑰浊酿": { icon: "🌹", type: "deadend", desc: "玫瑰不经酒浆托底，只剩一团暧昧的糟味。" },
    "菊花浊酿": { icon: "🏵️", type: "deadend", desc: "菊花清气耐不住闷酿，清气散尽。" },
    "茉莉浊酿": { icon: "🌸", type: "deadend", desc: "茉莉要先溶进酒浆；硬塞进酿造只会浊。" },
    "渍酿奶": { icon: "🥛", type: "deadend", desc: "鲜奶与原浆搅在一起很含糊；甜牛奶那条路径更清楚。" },
    "酒焖奶酪": { icon: "🧀", type: "deadend", desc: "奶酪吸饱酒气像腌渍小菜；不是鲜奶遇酿造变奶酒那条逻辑。" },
    "酵奶酒": { icon: "🍶", type: "deadend", desc: "奶酒再发酵，酸甜两头不靠。" },
    "滥酵奶酒": { icon: "🍶", type: "deadend", desc: "已是高度仍发酵，只剩浑浊刺激。" },
    "塌雪酪": { icon: "🍨", type: "deadend", desc: "轻盈雪酪最怕久坐发酵，入口只剩塌了的糊。" },
    "酵浆浑汤": { icon: "🍲", type: "deadend", desc: "原浆本就厚重，再发酵失焦成浑汤。" },
    "冰淬浊酿": { icon: "🧊", type: "deadend", desc: "冰只会压住酿造该起的香与热意。" },
    "酵酪糊": { icon: "🥣", type: "deadend", desc: "双酪已成一体，再发酵等于拆掉阴阳。" },
    "桂花牛奶": { icon: "🥛", type: "deadend", desc: "有桂花香的牛奶，仅此而已" },
    "玫瑰牛奶": { icon: "🥛", type: "deadend", desc: "花瓣漂浮着，但没什么用" },
    "酒酿奶酪": { icon: "🧀", type: "deadend", desc: "酒香奶酪，方向对了但不够" },
    "酒酿雪酪": { icon: "🍨", type: "deadend", desc: "轻盈的酒香，但缺少厚度" },
    "酒酿菊花酪": { icon: "🏵️", type: "deadend", desc: "清雅菊花味，可惜不是目标" },
    "酒酿茉莉酪": { icon: "🌸", type: "deadend", desc: "茉莉清香，但今天不做这个" },

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
    "甜牛奶": { icon: "🥛", type: "mid", desc: "糖溶进奶里，最朴素的甜头。" },
    "酸奶": { icon: "🥛", type: "mid", desc: "鲜奶借发酵稠成的酸奶，离奶酪只差一层滤布。" },
    "甜酸奶": { icon: "🥛", type: "mid", desc: "甜牛奶发酵后的稠酸奶，滤过之后化作轻盈雪酪。" },
    "冰牛奶": { icon: "🥛", type: "mid", desc: "清凉牛奶" },
    "酿香奶底": { icon: "🥣", type: "mid", desc: "酒酿香气的奶底" },
    "奶酒": { icon: "🍶", type: "mid", desc: "谷香进了奶里，柔柔软软的一盏酒意。" },
    "高度奶酒": { icon: "🍶", type: "mid", desc: "再经凝炼，酒劲往上抬了一截。" },
    "霜酪": { icon: "🍨", type: "mid", desc: "酿香奶底冰镇凝结的一层霜意；再加冰或原浆即成冰酥酪。" },
    "冰酿奶": { icon: "🥛", type: "mid", desc: "冰与酒酿的相遇" },
    "发酵奶": { icon: "🥛", type: "mid", desc: "发酵中的奶" },
    "原味酸奶": { icon: "🥛", type: "mid", desc: "原味酸奶" },
    "冰镇酸奶": { icon: "🥛", type: "mid", desc: "冰镇的清爽" },
    "奶酪": { icon: "🧀", type: "mid", desc: "酸奶经滤布收干水分，凝成厚实的一块包容。" },
    "雪酪": { icon: "🍨", type: "mid", desc: "甜酸奶滤成的轻盈云朵，入口像雪。" },
    "浓酪底": { icon: "🧀", type: "mid", desc: "双倍浓郁" },
    "双酪": { icon: "🥣", type: "mid", desc: "厚重与轻盈并肩，一副味道的阴阳。" },
    "双酪底": { icon: "🥣", type: "mid", desc: "双酪合璧（旧版兼容）" },
    "桂花酒酿": { icon: "🌼", type: "mid", desc: "桂花落进酒酿里，秋意有了形状。" },
    "玫瑰酒酿": { icon: "🌹", type: "mid", desc: "玫瑰把心事浸进酒里，香得坦荡。" },
    "茉莉酒酿": { icon: "🌸", type: "mid", desc: "茉莉的清气一丝一缕渗进酒坛。" },
    "菊花酒酿": { icon: "🏵️", type: "mid", desc: "菊花借酒托出一口山野。" },
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
    "酒酿桂花酪": { icon: "🌼", type: "mid", desc: "酪与桂花酒酿抱在一处，醇厚里沁着甜香。" },
    "冰酒酿桂花酪": { icon: "🧊", type: "final", desc: "一口冰凉压住甜腻，经典轮廓就此分明。" },
    "酒酿玫瑰酪": { icon: "🌹", type: "final", desc: "玫瑰与酪缠绵，芬芳厚得像心事。" },
    "酒酿桂花酪（自然发酵甜）": { icon: "🌼", type: "final", desc: "自然发酵的甜" },
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
        "102to103": "发酵把时间酿成酸奶；滤布把它收成酪。",
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
        "牛奶": "鲜奶搭发酵先成酸奶，再用滤布凝酪；若遇上酿造，会走上奶酒那条路。",
        "酒酿原浆": "酒酿原浆可以和牛奶组合，也可以和桂花融合...",
        "菌种": "菌种需要牛奶才能发挥作用...",
        "酿造": "酿造擅把谷果的香凝进液体里；甜奶误配它会变浊酿，轻盈酪要走发酵滤布。",
        "发酵": "发酵让人放心交给时间——鲜奶变酸奶，甜奶变甜酸奶，再接滤布成酪。",
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
        text: "酸奶滤去水分，慢慢收出厚实的一块包容。",
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
        tags: ["工艺", "谷果入酿", "可使鲜奶变奶酒", "需要时间"],
        color: "brown",
        hint: "谷果入酿、凝香成酒；鲜奶与它相合是奶酒，不是酪"
    },
    "发酵": {
        tags: ["工艺", "静置蜕变", "可使鲜奶变酸奶", "需要时间"],
        color: "green",
        hint: "交给时间与菌群：鲜奶→酸奶，甜奶→甜酸奶；酪要靠滤布收干"
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
    "滤布": {
        tags: ["工具", "可滤乳清", "需配合酸奶"],
        color: "white",
        hint: "兜住酸奶，滤走水分，把醇厚留下来"
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
        tags: ["液体", "甜", "可发酵"],
        color: "white",
        hint: "甜蜜的牛奶，发酵成甜酸奶再加滤布可得轻盈雪酪"
    },
    "酸奶": {
        tags: ["半凝固", "酸香", "需过滤"],
        color: "white",
        hint: "鲜奶发酵的成果，与滤布相合凝成厚奶酪"
    },
    "甜酸奶": {
        tags: ["半凝固", "甜", "酸香", "需过滤"],
        color: "white",
        hint: "甜奶发酵的成果，滤过之后化作轻盈雪酪"
    },
    "奶酪": {
        tags: ["凝固态", "醇厚", "可变轻盈", "可融合风味"],
        color: "cream",
        hint: "酸奶滤成的厚酪；与轻盈雪酪合体成双酪"
    },
    "雪酪": {
        tags: ["凝固态", "轻盈", "甜", "可融合风味"],
        color: "white",
        hint: "甜酸奶滤成的轻盈酪"
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
    "酿香奶底": {
        tags: ["液体", "酒香", "可冰镇"],
        color: "cream",
        hint: "酒酿香渗入甜奶；加冰先结出霜酪"
    },
    "霜酪": {
        tags: ["半凝固", "冷感", "酒香"],
        color: "blue",
        hint: "冰镇酿奶的第一层霜意；再加冰或原浆即成冰酥酪"
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
    },
    "奶酒": {
        tags: ["液体", "酒香", "奶味"],
        color: "amber",
        hint: "牛奶遇酿造的先声，不是酪"
    },
    "高度奶酒": {
        tags: ["液体", "酒香", "醇厚"],
        color: "amber",
        hint: "再酿一层，离酪更远"
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
        match: ["可发酵", "工艺"],
        description: "鲜奶 + 发酵 → 酸奶；酸奶 + 滤布 → 厚奶酪"
    },
    {
        rule: "轻盈凝固",
        match: ["甜", "需过滤"],
        description: "甜奶 + 发酵 → 甜酸奶；甜酸奶 + 滤布 → 轻盈雪酪"
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
window.ITEM_SVGS = ITEM_SVGS;
window.STORY = STORY;
window.TIPS = TIPS;
window.HINT_SYSTEM = HINT_SYSTEM;
window.ACHIEVEMENTS = ACHIEVEMENTS;
window.FRAGMENTS = FRAGMENTS;
window.ITEM_ATTRIBUTES = ITEM_ATTRIBUTES;
window.ATTRIBUTE_RULES = ATTRIBUTE_RULES;

