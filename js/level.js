/** @feature progress @see docs/features/progress.md */
// 关卡与世界管理系统（V2）
class LevelManager {
    constructor() {
        this.storageKey = 'bojoo_game_progress_v2';
        this.currentProgress = this.loadProgress();
        if (!this.currentProgress.atlasPieces) this.currentProgress.atlasPieces = [];
        this.migrateAtlasProgress();
        if (this.refreshAtlasUnlocks()) this.saveProgress();
    }

    // 加载进度
    loadProgress() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            const progress = JSON.parse(saved);
            // 确保新字段存在（向后兼容）
            if (!progress.fragments) progress.fragments = [];
            if (progress.gems === undefined) progress.gems = 0;
            if (!progress.discoveredRecipes) progress.discoveredRecipes = {};
            if (!progress.bestSynthCounts) progress.bestSynthCounts = {};
            if (!progress.completionPrimaryRoutes) progress.completionPrimaryRoutes = {};
            if (!progress.seenCompletionBadgeHints) progress.seenCompletionBadgeHints = {};
            if (!progress.atlasPieces) progress.atlasPieces = [];
            if (progress.chapterPhaseSettlementSeen === undefined) progress.chapterPhaseSettlementSeen = false;
            // 已通过第一章 Boss 的旧存档：不必再弹出「阶段完成」
            if (!progress.chapterPhaseSettlementSeen && progress.completedLevels?.includes(106)) {
                progress.chapterPhaseSettlementSeen = true;
            }
            // 向后兼容：为加入钻石系统前已完成的关卡补发钻石（只补一次）
            if (!progress.retroactiveGemsAwarded && progress.completedLevels && progress.completedLevels.length > 0) {
                progress.gems += progress.completedLevels.length * 50;
                progress.retroactiveGemsAwarded = true;
                console.log('[Gems] retroactive award:', progress.completedLevels.length * 50,
                    'gems for', progress.completedLevels.length, 'completed levels');
            }
            return progress;
        }
        return {
            unlockedWorlds: [1],
            unlockedLevels: [101],
            completedLevels: [],
            discoveredItems: [],
            fragments: [],
            achievements: [],
            gems: 0,
            retroactiveGemsAwarded: true,
            discoveredRecipes: {},
            bestSynthCounts: {},
            completionPrimaryRoutes: {},
            seenCompletionBadgeHints: {},
            atlasPieces: [],
            chapterPhaseSettlementSeen: false
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

    /** 是否已看过前五章「阶段完成」结算（只显示一次） */
    hasSeenChapterPhaseSettlement() {
        return !!this.currentProgress.chapterPhaseSettlementSeen;
    }

    markChapterPhaseSettlementSeen() {
        if (this.currentProgress.chapterPhaseSettlementSeen) return;
        this.currentProgress.chapterPhaseSettlementSeen = true;
        this.saveProgress();
    }

    // 记录通关配方（用于完美通关判定）
    recordCompletionRecipe(levelId, ingredients) {
        const key = [...ingredients].sort().join('+');
        const levelData = this.getLevelData(levelId);
        if (!levelData || !levelData.perfectRecipes) return;
        const isValid = levelData.perfectRecipes.some(pr =>
            [...pr.ingredients].sort().join('+') === key
        );
        if (!isValid) return;
        if (!this.currentProgress.discoveredRecipes[levelId]) {
            this.currentProgress.discoveredRecipes[levelId] = [];
        }
        if (!this.currentProgress.discoveredRecipes[levelId].includes(key)) {
            this.currentProgress.discoveredRecipes[levelId].push(key);
            this.saveProgress();
        }
    }

    // 获取关卡的完美通关状态
    getPerfectStatus(levelId) {
        const levelData = this.getLevelData(levelId);
        if (!levelData || !levelData.perfectRecipes) return null;
        const total = levelData.perfectRecipes.length;
        const found = (this.currentProgress.discoveredRecipes[levelId] || []).length;
        return { found, total, isPerfect: found >= total };
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
        const alreadyDone = this.currentProgress.completedLevels.includes(levelId);
        console.log('[Gems] completeLevel', levelId, '— already completed:', alreadyDone);
        if (!alreadyDone) {
            this.currentProgress.completedLevels.push(levelId);
            this.addGems(50);
            if (this.refreshAtlasUnlocks()) this.saveProgress();
            if (window.GameTaskToast) window.GameTaskToast.afterProgressMutation();
            return true;
        }
        return false;
    }

    // 钻石系统
    addGems(amount) {
        if (this.currentProgress.gems === undefined) this.currentProgress.gems = 0;
        this.currentProgress.gems += amount;
        this.saveProgress();
        console.log('[Gems] addGems +' + amount + ', total now:', this.currentProgress.gems,
            '— GameInstance:', !!window.GameInstance,
            '— updateGemDisplay:', !!(window.GameInstance && window.GameInstance.updateGemDisplay));
        if (window.GameInstance && window.GameInstance.updateGemDisplay) {
            window.GameInstance.updateGemDisplay();
        }
    }

    getGems() {
        return this.currentProgress.gems || 0;
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
            if (this.refreshAtlasUnlocks()) this.saveProgress();
            
            // 检查收藏家成就
            if (this.currentProgress.discoveredItems.length >= 50) {
                this.unlockAchievement('collector');
            }
            
            if (window.GameTaskToast) window.GameTaskToast.afterProgressMutation();
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
    
    // 记录合成次数，返回 { count, prevBest, isNewRecord }
    recordSynthCount(levelId, count) {
        if (!this.currentProgress.bestSynthCounts) this.currentProgress.bestSynthCounts = {};
        const key = String(levelId);
        const prev = this.currentProgress.bestSynthCounts[key];
        const isNewRecord = prev === undefined || count < prev;
        if (isNewRecord) {
            this.currentProgress.bestSynthCounts[key] = count;
            this.saveProgress();
        }
        return { count, prevBest: prev ?? null, isNewRecord };
    }

    getBestSynthCount(levelId) {
        if (!this.currentProgress.bestSynthCounts) return null;
        return this.currentProgress.bestSynthCounts[String(levelId)] ?? null;
    }

    /** 首次通关时记录的合成路径指纹（sorted ingredients→result 串联） */
    getPrimaryCompletionRoute(levelId) {
        const routes = this.currentProgress.completionPrimaryRoutes;
        if (!routes) return null;
        return routes[String(levelId)] ?? null;
    }

    trySetPrimaryCompletionRoute(levelId, fingerprint) {
        if (!this.currentProgress.completionPrimaryRoutes) this.currentProgress.completionPrimaryRoutes = {};
        const key = String(levelId);
        if (this.currentProgress.completionPrimaryRoutes[key]) return;
        this.currentProgress.completionPrimaryRoutes[key] = fingerprint;
        this.saveProgress();
    }

    shouldShowCompletionBadgeHint(kind) {
        if (!this.currentProgress.seenCompletionBadgeHints) this.currentProgress.seenCompletionBadgeHints = {};
        return !this.currentProgress.seenCompletionBadgeHints[kind];
    }

    markCompletionBadgeHintSeen(kind) {
        if (!this.currentProgress.seenCompletionBadgeHints) this.currentProgress.seenCompletionBadgeHints = {};
        if (this.currentProgress.seenCompletionBadgeHints[kind]) return;
        this.currentProgress.seenCompletionBadgeHints[kind] = true;
        this.saveProgress();
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

    // ========== 宝珠图谱 ==========

    migrateAtlasProgress() {
        if (!this.currentProgress.atlasPieces) this.currentProgress.atlasPieces = [];
    }

    hasAtlasPiece(id) {
        return !!(this.currentProgress.atlasPieces && this.currentProgress.atlasPieces.includes(id));
    }

    unlockAtlasPieceById(id) {
        if (!window.getAtlasSlotById || !window.getAtlasSlotById(id)) return false;
        if (!this.currentProgress.atlasPieces) this.currentProgress.atlasPieces = [];
        if (this.currentProgress.atlasPieces.includes(id)) return false;
        this.currentProgress.atlasPieces.push(id);
        return true;
    }

    /** @returns {boolean} 是否有新碎片写入（需 saveProgress） */
    refreshAtlasUnlocks() {
        if (!window.CHAPTERS || !window.ATLAS_SLOTS) return false;
        let changed = false;

        Object.keys(window.CHAPTERS).forEach(k => {
            const ch = window.CHAPTERS[k];
            const cid = Number(k);
            const slotId = `ch${cid}_main`;
            const slot = window.ATLAS_SLOTS.find(s => s.id === slotId);
            if (!slot || slot.kind !== 'main') return;
            const done = ch.objectives.every(lid => this.isLevelCompleted(lid));
            if (done && this.unlockAtlasPieceById(slotId)) changed = true;
        });

        if ((this.currentProgress.discoveredItems || []).includes('双酪')) {
            if (this.unlockAtlasPieceById('ch1_secret')) changed = true;
        }

        const chapterIds = Object.keys(window.CHAPTERS).map(Number).sort((a, b) => a - b);
        const allChaptersDone = chapterIds.length > 0 && chapterIds.every(cid => {
            const ch = window.CHAPTERS[cid];
            return ch && ch.objectives.every(lid => this.isLevelCompleted(lid));
        });
        const multiChapter = chapterIds.length > 1;
        if (allChaptersDone && multiChapter && this.unlockAtlasPieceById('center')) changed = true;

        return changed;
    }

    unlockAtlasPiece(id) {
        if (!this.unlockAtlasPieceById(id)) return false;
        this.saveProgress();
        return true;
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
            unlockedLevels: [101],
            completedLevels: [],
            discoveredItems: [],
            fragments: [],
            achievements: [],
            gems: 0,
            titleLevel: 1,
            chapterProgress: {},
            discoveredRecipes: {},
            bestSynthCounts: {},
            completionPrimaryRoutes: {},
            seenCompletionBadgeHints: {},
            atlasPieces: []
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
        return [101, 102, 103, 104, 105, 106];
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
    hasAnyClaimableTask() {
        const claimed = JSON.parse(localStorage.getItem('baozhu_claimed_tasks') || '[]');
        const completed = this.currentProgress.completedLevels || [];
        const discovered = this.currentProgress.discoveredItems || [];
        const checks = [
            { id: 'first_synthesis', done: discovered.length >= 1 },
            { id: 'complete_first5', done: [101,102,103,104,105].every(id => completed.includes(id)) },
            { id: 'complete_boss', done: completed.includes(106) },
            { id: 'complete_chapter1', done: [101,102,103,104,105,106].every(id => completed.includes(id)) },
            { id: 'discover_10', done: discovered.length >= 10 },
            { id: 'discover_20', done: discovered.length >= 20 },
        ];
        return checks.some(c => c.done && !claimed.includes(c.id));
    }
}

window.LevelManager = new LevelManager();
