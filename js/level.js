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

    // 检查关卡是否解锁（非线性：同一世界内所有关卡都可玩）
    isLevelUnlocked(levelId) {
        const level = window.LEVELS.find(l => l.id === levelId);
        if (!level) return false;
        
        // 如果世界已解锁，该世界内所有关卡都解锁
        return this.isWorldUnlocked(level.worldId);
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
            achievements: []
        };
        this.saveProgress();
    }

    // 解锁所有（调试用）
    unlockAll() {
        this.currentProgress.unlockedWorlds = window.WORLDS.map(w => w.id);
        this.currentProgress.unlockedLevels = window.LEVELS.map(l => l.id);
        this.saveProgress();
    }
}

window.LevelManager = new LevelManager();
