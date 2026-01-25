// 关卡与世界管理系统（V2）
class LevelManager {
    constructor() {
        this.storageKey = 'bojoo_game_progress_v2';
        this.currentProgress = this.loadProgress();
    }

    // 加载进度
    loadProgress() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            const progress = JSON.parse(saved);
            // 确保新字段存在（向后兼容）
            if (!progress.fragments) progress.fragments = [];
            return progress;
        }
        return {
            unlockedWorlds: [1],      // 默认解锁第一世界
            unlockedLevels: [101],    // 默认解锁第一关（新教学关）
            completedLevels: [],       // 已完成的关卡
            discoveredItems: [],       // 已发现的物品
            fragments: [],             // 收集的记忆碎片
            achievements: []           // 成就
        };
    }

    // 保存进度
    saveProgress() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.currentProgress));
    }

    // 检查世界是否解锁（基于碎片收集数量）
    isWorldUnlocked(worldId) {
        // 第一世界始终解锁
        if (worldId === 1) return true;
        
        // 检查是否已保存解锁状态
        if (this.currentProgress.unlockedWorlds.includes(worldId)) return true;
        
        // 根据碎片数量动态解锁
        const fragmentCount = this.currentProgress.fragments?.length || 0;
        const fragmentThresholds = {
            2: 3,   // 世界2需要3个碎片
            3: 6,   // 世界3需要6个碎片
            4: 9,   // 世界4需要9个碎片
            5: 12,  // 世界5需要12个碎片
            6: 16   // 终极世界需要全部16个碎片
        };
        
        const threshold = fragmentThresholds[worldId];
        if (threshold && fragmentCount >= threshold) {
            // 自动解锁并保存
            if (!this.currentProgress.unlockedWorlds.includes(worldId)) {
                this.currentProgress.unlockedWorlds.push(worldId);
                this.saveProgress();
            }
            return true;
        }
        
        return false;
    }
    
    // 获取世界解锁所需碎片数
    getWorldUnlockRequirement(worldId) {
        const thresholds = {
            1: 0, 2: 3, 3: 6, 4: 9, 5: 12, 6: 16
        };
        return thresholds[worldId] || 0;
    }

    // 检查关卡是否解锁（顺序解锁：完成前一关才能解锁下一关）
    isLevelUnlocked(levelId) {
        const level = window.LEVELS.find(l => l.id === levelId);
        if (!level) return false;
        
        // 检查世界是否解锁
        if (!this.isWorldUnlocked(level.worldId)) return false;
        
        // 获取该世界的关卡顺序
        const world = window.WORLDS.find(w => w.id === level.worldId);
        if (!world) return false;
        
        const levelOrder = world.levels;
        const levelIndex = levelOrder.indexOf(levelId);
        
        // 如果找不到关卡，返回false
        if (levelIndex === -1) return false;
        
        // 第一关始终解锁
        if (levelIndex === 0) return true;
        
        // 检查前一关是否已完成
        const previousLevelId = levelOrder[levelIndex - 1];
        return this.isLevelCompleted(previousLevelId);
    }

    // 检查关卡是否完成
    isLevelCompleted(levelId) {
        return this.currentProgress.completedLevels.includes(levelId);
    }

    // 获取世界完成度
    getWorldProgress(worldId) {
        const world = window.WORLDS.find(w => w.id === worldId);
        if (!world) return { completed: 0, total: 0 };
        
        const completed = world.levels.filter(lid => this.isLevelCompleted(lid)).length;
        return {
            completed,
            total: world.levels.length,
            percentage: Math.round((completed / world.levels.length) * 100)
        };
    }

    // 完成关卡（非线性版本：不需要解锁下一关）
    completeLevel(levelId) {
        if (!this.currentProgress.completedLevels.includes(levelId)) {
            this.currentProgress.completedLevels.push(levelId);
            this.saveProgress();
            return true;
        }
        return false;
    }

    // 记录发现的物品
    discoverItem(itemName) {
        if (!this.currentProgress.discoveredItems.includes(itemName)) {
            this.currentProgress.discoveredItems.push(itemName);
            
            // 检查是否触发碎片收集
            const fragment = this.checkFragmentTrigger(itemName);
            if (fragment) {
                this.collectFragment(fragment.id);
            }
            
            this.saveProgress();
            
            // 检查收藏家成就
            if (this.currentProgress.discoveredItems.length >= 50) {
                this.unlockAchievement('collector');
            }
            
            return { isNew: true, fragment }; // 新发现，可能有碎片
        }
        return { isNew: false, fragment: null }; // 已发现过
    }
    
    // 检查是否触发碎片收集
    checkFragmentTrigger(itemName) {
        if (!window.FRAGMENTS) return null;
        return window.FRAGMENTS.find(f => f.trigger === itemName);
    }
    
    // 收集碎片
    collectFragment(fragmentId) {
        if (!this.currentProgress.fragments) {
            this.currentProgress.fragments = [];
        }
        if (!this.currentProgress.fragments.includes(fragmentId)) {
            this.currentProgress.fragments.push(fragmentId);
            this.saveProgress();
            return true;
        }
        return false;
    }
    
    // 检查碎片是否已收集
    hasFragment(fragmentId) {
        return this.currentProgress.fragments?.includes(fragmentId) || false;
    }
    
    // 获取已收集的碎片
    getCollectedFragments() {
        if (!window.FRAGMENTS) return [];
        return window.FRAGMENTS.filter(f => 
            this.currentProgress.fragments?.includes(f.id)
        );
    }
    
    // 获取碎片收集进度
    getFragmentProgress() {
        const total = window.FRAGMENTS?.length || 0;
        const collected = this.currentProgress.fragments?.length || 0;
        return {
            collected,
            total,
            percentage: total > 0 ? Math.round((collected / total) * 100) : 0
        };
    }

    // 解锁成就
    unlockAchievement(achievementId) {
        if (!this.currentProgress.achievements.includes(achievementId)) {
            this.currentProgress.achievements.push(achievementId);
            this.saveProgress();
            return true;
        }
        return false;
    }

    // 检查成就是否已解锁
    hasAchievement(achievementId) {
        return this.currentProgress.achievements.includes(achievementId);
    }

    // 获取所有已解锁成就
    getUnlockedAchievements() {
        const achievements = [];
        
        // 配方成就
        for (const [id, data] of Object.entries(window.ACHIEVEMENTS.recipes)) {
            if (this.currentProgress.achievements.includes(id)) {
                achievements.push({ ...data, id, type: 'recipe' });
            }
        }
        
        // 特殊成就
        for (const [id, data] of Object.entries(window.ACHIEVEMENTS.special)) {
            if (this.currentProgress.achievements.includes(id)) {
                achievements.push({ ...data, id, type: 'special' });
            }
        }
        
        return achievements;
    }

    // 获取关卡数据
    getLevelData(levelId) {
        return window.LEVELS.find(l => l.id === levelId);
    }

    // 获取世界数据
    getWorldData(worldId) {
        return window.WORLDS.find(w => w.id === worldId);
    }

    // 获取当前世界的关卡列表
    getWorldLevels(worldId) {
        const world = this.getWorldData(worldId);
        if (!world) return [];
        return world.levels.map(lid => this.getLevelData(lid)).filter(Boolean);
    }

    // 重置进度（调试用）
    resetProgress() {
        this.currentProgress = {
            unlockedWorlds: [1],
            unlockedLevels: [101],  // 新教学关
            completedLevels: [],
            discoveredItems: [],
            fragments: [],
            achievements: [],
            titleLevel: 1,  // 重置称号等级
            chapterProgress: {}  // 章节进度
        };
        this.saveProgress();
        
        // 清除基础关卡完成记录和计时器
        localStorage.removeItem('baozhu_basic_completed');
        sessionStorage.removeItem('baozhu_session_start');
    }

    // 解锁所有（调试用）
    unlockAll() {
        this.currentProgress.unlockedWorlds = window.WORLDS.map(w => w.id);
        this.currentProgress.unlockedLevels = window.LEVELS.map(l => l.id);
        this.saveProgress();
    }
    
    // ========== 基础关卡计时系统 ==========
    
    // 基础关卡ID列表（前5关）
    getBasicLevelIds() {
        return [101, 102, 2, 1, 104]; // 唤醒之手, 时间的答案, 酸奶阶梯, 冰酥门廊, 双酪启程
    }
    
    // 开始基础关卡计时（第一次进入基础关卡时调用）
    startBasicLevelTimer() {
        const sessionKey = 'baozhu_session_start';
        if (!sessionStorage.getItem(sessionKey)) {
            sessionStorage.setItem(sessionKey, Date.now().toString());
        }
    }
    
    // 获取基础关卡耗时（毫秒）
    getBasicLevelElapsedTime() {
        const sessionKey = 'baozhu_session_start';
        const startTime = sessionStorage.getItem(sessionKey);
        if (!startTime) return 0;
        return Date.now() - parseInt(startTime);
    }
    
    // 格式化时间显示
    formatElapsedTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}分${seconds.toString().padStart(2, '0')}秒`;
    }
    
    // 获取速度评级
    getSpeedRating(ms) {
        const minutes = ms / 1000 / 60;
        if (minutes < 5) {
            return { name: '闪电', icon: '⚡', color: '#FFD700', tier: 5 };
        } else if (minutes < 10) {
            return { name: '疾风', icon: '💨', color: '#9C27B0', tier: 4 };
        } else if (minutes < 20) {
            return { name: '稳健', icon: '🌿', color: '#2196F3', tier: 3 };
        } else if (minutes < 30) {
            return { name: '悠然', icon: '🍃', color: '#4CAF50', tier: 2 };
        } else {
            return { name: '沉浸', icon: '🌙', color: '#9E9E9E', tier: 1 };
        }
    }
    
    // 检查是否完成了所有基础关卡
    hasCompletedAllBasicLevels() {
        const basicLevels = this.getBasicLevelIds();
        return basicLevels.every(id => this.isLevelCompleted(id));
    }
    
    // 检查是否已领取基础关卡奖励
    hasClaimedBasicReward() {
        return localStorage.getItem('baozhu_basic_completed') === 'true';
    }
    
    // 标记已领取基础关卡奖励
    claimBasicReward() {
        localStorage.setItem('baozhu_basic_completed', 'true');
        // 清除计时器
        sessionStorage.removeItem('baozhu_session_start');
    }
    
    // ========== 章节系统进度 ==========
    
    // 保存章节目标进度
    saveObjectiveProgress(chapterId, objectiveIndex) {
        if (!this.currentProgress.chapterProgress) {
            this.currentProgress.chapterProgress = {};
        }
        
        // 记录该章节已完成的最高目标索引
        const currentProgress = this.currentProgress.chapterProgress[chapterId] || -1;
        if (objectiveIndex > currentProgress) {
            this.currentProgress.chapterProgress[chapterId] = objectiveIndex;
            this.saveProgress();
        }
    }
    
    // 获取章节当前目标索引（用于恢复进度）
    getChapterProgress(chapterId) {
        if (!this.currentProgress.chapterProgress) return 0;
        const completedIndex = this.currentProgress.chapterProgress[chapterId];
        // 返回下一个目标的索引（已完成+1）
        return completedIndex !== undefined ? completedIndex + 1 : 0;
    }
    
    // 获取章节应该开始的关卡ID
    getChapterStartLevelId(chapterId) {
        const chapter = window.CHAPTERS[chapterId];
        if (!chapter) return null;
        
        const objectiveIndex = this.getChapterProgress(chapterId);
        // 如果已完成所有目标，返回最后一个
        if (objectiveIndex >= chapter.objectives.length) {
            return chapter.objectives[chapter.objectives.length - 1];
        }
        return chapter.objectives[objectiveIndex];
    }
    
    // 重置章节进度（调试用）
    resetChapterProgress(chapterId) {
        if (this.currentProgress.chapterProgress) {
            delete this.currentProgress.chapterProgress[chapterId];
            this.saveProgress();
        }
    }
    
    // 获取探索进度百分比
    getExplorationProgress() {
        const totalItems = Object.keys(window.ITEMS).length;
        const discovered = this.currentProgress.discoveredItems.length;
        return Math.round((discovered / totalItems) * 100);
    }
    
    // 升级玩家称号
    upgradeTitle() {
        // 称号等级：酿造学徒 -> 初级酿造师 -> 熟练酿造师 -> 酿造大师 -> 传奇酿造师
        if (!this.currentProgress.titleLevel) {
            this.currentProgress.titleLevel = 1;
        }
        if (this.currentProgress.titleLevel < 5) {
            this.currentProgress.titleLevel++;
            this.saveProgress();
        }
        return this.getCurrentTitle();
    }
    
    // 获取当前称号
    getCurrentTitle() {
        const titles = [
            { level: 1, name: '酿造学徒', icon: '🌱' },
            { level: 2, name: '初级酿造师', icon: '🌿' },
            { level: 3, name: '熟练酿造师', icon: '🌳' },
            { level: 4, name: '酿造大师', icon: '⭐' },
            { level: 5, name: '传奇酿造师', icon: '👑' }
        ];
        const level = this.currentProgress.titleLevel || 1;
        return titles.find(t => t.level === level) || titles[0];
    }
}

window.LevelManager = new LevelManager();
