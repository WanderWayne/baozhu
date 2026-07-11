/** @feature progress @see docs/features/progress.md */
// 关卡与世界管理系统（对齐 H5 js/level.js）
const { WORLDS, LEVELS, CHAPTERS } = require('../data/worlds.js');
const { FRAGMENTS, ITEMS } = require('../data/items.js');
const atlas = require('../data/atlas.js');
const { getAtlasSlotById } = require('./atlas-counts');
const devPlaytest = require('./dev-playtest');

const STORAGE_KEY = 'bojoo_game_progress_v2';
const CLAIMED_TASKS_KEY = 'baozhu_claimed_tasks';
const SESSION_START_KEY = 'baozhu_session_start';

function defaultProgress() {
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
    chapterPhaseSettlementSeen: false,
    chapterProgress: {},
    titleLevel: 1,
  };
}

class LevelManager {
  constructor() {
    this.storageKey = STORAGE_KEY;
    this.currentProgress = this.loadProgress();
    if (!this.currentProgress.atlasPieces) this.currentProgress.atlasPieces = [];
    this.migrateAtlasProgress();
    if (this.refreshAtlasUnlocks()) this.saveProgress();
  }

  loadProgress() {
    try {
      const saved = wx.getStorageSync(this.storageKey);
      if (saved) {
        const progress = typeof saved === 'string' ? JSON.parse(saved) : saved;
        if (!progress.fragments) progress.fragments = [];
        if (progress.gems === undefined) progress.gems = 0;
        if (!progress.discoveredRecipes) progress.discoveredRecipes = {};
        if (!progress.bestSynthCounts) progress.bestSynthCounts = {};
        if (!progress.completionPrimaryRoutes) progress.completionPrimaryRoutes = {};
        if (!progress.seenCompletionBadgeHints) progress.seenCompletionBadgeHints = {};
        if (!progress.atlasPieces) progress.atlasPieces = [];
        if (progress.chapterPhaseSettlementSeen === undefined) progress.chapterPhaseSettlementSeen = false;
        if (!progress.chapterPhaseSettlementSeen && progress.completedLevels?.includes(106)) {
          progress.chapterPhaseSettlementSeen = true;
        }
        if (!progress.titleLevel) progress.titleLevel = 1;
        if (!progress.retroactiveGemsAwarded && progress.completedLevels?.length > 0) {
          progress.gems += progress.completedLevels.length * 50;
          progress.retroactiveGemsAwarded = true;
        }
        return progress;
      }
    } catch (e) {
      console.warn('[LevelManager] loadProgress failed', e);
    }
    return defaultProgress();
  }

  saveProgress() {
    wx.setStorageSync(this.storageKey, this.currentProgress);
  }

  isWorldUnlocked(worldId) {
    if (devPlaytest.isEnabled()) return true;
    if (worldId === 1) return true;
    if (this.currentProgress.unlockedWorlds.includes(worldId)) return true;

    const fragmentCount = this.currentProgress.fragments?.length || 0;
    const fragmentThresholds = { 2: 3, 3: 6, 4: 9, 5: 12, 6: 16 };
    const threshold = fragmentThresholds[worldId];
    if (threshold && fragmentCount >= threshold) {
      if (!this.currentProgress.unlockedWorlds.includes(worldId)) {
        this.currentProgress.unlockedWorlds.push(worldId);
        this.saveProgress();
      }
      return true;
    }
    return false;
  }

  getWorldUnlockRequirement(worldId) {
    const thresholds = { 1: 0, 2: 3, 3: 6, 4: 9, 5: 12, 6: 16 };
    return thresholds[worldId] || 0;
  }

  isLevelUnlocked(levelId) {
    if (devPlaytest.isEnabled()) return true;
    const level = LEVELS.find((l) => l.id === levelId);
    if (!level) return false;
    if (!this.isWorldUnlocked(level.worldId)) return false;

    const world = WORLDS.find((w) => w.id === level.worldId);
    if (!world) return false;

    const levelIndex = world.levels.indexOf(levelId);
    if (levelIndex === -1) return false;
    if (levelIndex === 0) return true;

    const previousLevelId = world.levels[levelIndex - 1];
    return this.isLevelCompleted(previousLevelId);
  }

  isLevelCompleted(levelId) {
    return (this.currentProgress.completedLevels || []).includes(levelId);
  }

  hasSeenChapterPhaseSettlement() {
    return !!this.currentProgress.chapterPhaseSettlementSeen;
  }

  markChapterPhaseSettlementSeen() {
    if (this.currentProgress.chapterPhaseSettlementSeen) return;
    this.currentProgress.chapterPhaseSettlementSeen = true;
    this.saveProgress();
  }

  recordCompletionRecipe(levelId, ingredients) {
    const key = [...ingredients].sort().join('+');
    const levelData = this.getLevelData(levelId);
    if (!levelData || !levelData.perfectRecipes) return;
    const isValid = levelData.perfectRecipes.some(
      (pr) => [...pr.ingredients].sort().join('+') === key,
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

  getPerfectStatus(levelId) {
    const levelData = this.getLevelData(levelId);
    if (!levelData || !levelData.perfectRecipes) return null;
    const total = levelData.perfectRecipes.length;
    const found = (this.currentProgress.discoveredRecipes[levelId] || []).length;
    return { found, total, isPerfect: found >= total };
  }

  getWorldProgress(worldId) {
    const world = WORLDS.find((w) => w.id === worldId);
    if (!world) return { completed: 0, total: 0, percentage: 0 };

    const completed = world.levels.filter((lid) => this.isLevelCompleted(lid)).length;
    return {
      completed,
      total: world.levels.length,
      percentage: Math.round((completed / world.levels.length) * 100),
    };
  }

  completeLevel(levelId) {
    const alreadyDone = this.currentProgress.completedLevels.includes(levelId);
    if (!alreadyDone) {
      this.currentProgress.completedLevels.push(levelId);
      this.addGems(50);
      if (this.refreshAtlasUnlocks()) this.saveProgress();
      try {
        const gameTaskToast = require('./game-task-toast');
        gameTaskToast.afterProgressMutation();
      } catch (e) { /* optional */ }
      return true;
    }
    return false;
  }

  addGems(amount) {
    if (this.currentProgress.gems === undefined) this.currentProgress.gems = 0;
    this.currentProgress.gems += amount;
    this.saveProgress();
  }

  getGems() {
    return this.currentProgress.gems || 0;
  }

  discoverItem(itemName) {
    if (!this.currentProgress.discoveredItems.includes(itemName)) {
      this.currentProgress.discoveredItems.push(itemName);
      const fragment = this.checkFragmentTrigger(itemName);
      if (fragment) this.collectFragment(fragment.id);
      this.saveProgress();
      if (this.refreshAtlasUnlocks()) this.saveProgress();
      if (this.currentProgress.discoveredItems.length >= 50) {
        this.unlockAchievement('collector');
      }
      try {
        const gameTaskToast = require('./game-task-toast');
        gameTaskToast.afterProgressMutation();
      } catch (e) { /* optional */ }
      return { isNew: true, fragment };
    }
    return { isNew: false, fragment: null };
  }

  checkFragmentTrigger(itemName) {
    if (!FRAGMENTS) return null;
    return FRAGMENTS.find((f) => f.trigger === itemName) || null;
  }

  collectFragment(fragmentId) {
    if (!this.currentProgress.fragments) this.currentProgress.fragments = [];
    if (!this.currentProgress.fragments.includes(fragmentId)) {
      this.currentProgress.fragments.push(fragmentId);
      this.saveProgress();
      return true;
    }
    return false;
  }

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

  getPrimaryCompletionRoute(levelId) {
    const routes = this.currentProgress.completionPrimaryRoutes;
    if (!routes) return null;
    return routes[String(levelId)] ?? null;
  }

  trySetPrimaryCompletionRoute(levelId, fingerprint) {
    if (!this.currentProgress.completionPrimaryRoutes) {
      this.currentProgress.completionPrimaryRoutes = {};
    }
    const key = String(levelId);
    if (this.currentProgress.completionPrimaryRoutes[key]) return;
    this.currentProgress.completionPrimaryRoutes[key] = fingerprint;
    this.saveProgress();
  }

  shouldShowCompletionBadgeHint(kind) {
    if (!this.currentProgress.seenCompletionBadgeHints) {
      this.currentProgress.seenCompletionBadgeHints = {};
    }
    return !this.currentProgress.seenCompletionBadgeHints[kind];
  }

  markCompletionBadgeHintSeen(kind) {
    if (!this.currentProgress.seenCompletionBadgeHints) {
      this.currentProgress.seenCompletionBadgeHints = {};
    }
    if (this.currentProgress.seenCompletionBadgeHints[kind]) return;
    this.currentProgress.seenCompletionBadgeHints[kind] = true;
    this.saveProgress();
  }

  hasFragment(fragmentId) {
    return this.currentProgress.fragments?.includes(fragmentId) || false;
  }

  getCollectedFragments() {
    if (!FRAGMENTS) return [];
    return FRAGMENTS.filter((f) => this.currentProgress.fragments?.includes(f.id));
  }

  getFragmentProgress() {
    const total = FRAGMENTS?.length || 0;
    const collected = this.currentProgress.fragments?.length || 0;
    return {
      collected,
      total,
      percentage: total > 0 ? Math.round((collected / total) * 100) : 0,
    };
  }

  migrateAtlasProgress() {
    if (!this.currentProgress.atlasPieces) this.currentProgress.atlasPieces = [];
  }

  hasAtlasPiece(id) {
    return !!(this.currentProgress.atlasPieces && this.currentProgress.atlasPieces.includes(id));
  }

  unlockAtlasPieceById(id) {
    if (!getAtlasSlotById(id)) return false;
    if (!this.currentProgress.atlasPieces) this.currentProgress.atlasPieces = [];
    if (this.currentProgress.atlasPieces.includes(id)) return false;
    this.currentProgress.atlasPieces.push(id);
    return true;
  }

  refreshAtlasUnlocks() {
    let changed = false;

    Object.keys(CHAPTERS).forEach((k) => {
      const ch = CHAPTERS[k];
      const slotId = `ch${Number(k)}_main`;
      const slot = (atlas.slots || []).find((s) => s.id === slotId);
      if (!slot || slot.kind !== 'main') return;
      const done = ch.objectives.every((lid) => this.isLevelCompleted(lid));
      if (done && this.unlockAtlasPieceById(slotId)) changed = true;
    });

    if ((this.currentProgress.discoveredItems || []).includes('双酪')) {
      if (this.unlockAtlasPieceById('ch1_secret')) changed = true;
    }

    const chapterIds = Object.keys(CHAPTERS).map(Number).sort((a, b) => a - b);
    const allChaptersDone = chapterIds.length > 0 && chapterIds.every((cid) => {
      const ch = CHAPTERS[cid];
      return ch && ch.objectives.every((lid) => this.isLevelCompleted(lid));
    });
    if (allChaptersDone && chapterIds.length > 1 && this.unlockAtlasPieceById('center')) {
      changed = true;
    }

    return changed;
  }

  unlockAtlasPiece(id) {
    if (!this.unlockAtlasPieceById(id)) return false;
    this.saveProgress();
    return true;
  }

  unlockAchievement(achievementId) {
    if (!this.currentProgress.achievements.includes(achievementId)) {
      this.currentProgress.achievements.push(achievementId);
      this.saveProgress();
      return true;
    }
    return false;
  }

  hasAchievement(achievementId) {
    return this.currentProgress.achievements.includes(achievementId);
  }

  getLevelData(levelId) {
    return LEVELS.find((l) => l.id === levelId);
  }

  saveObjectiveProgress(chapterId, objectiveIndex) {
    if (!this.currentProgress.chapterProgress) {
      this.currentProgress.chapterProgress = {};
    }
    const current = this.currentProgress.chapterProgress[chapterId] ?? -1;
    if (objectiveIndex > current) {
      this.currentProgress.chapterProgress[chapterId] = objectiveIndex;
      this.saveProgress();
    }
  }

  getChapterData(chapterId) {
    return CHAPTERS[chapterId] || CHAPTERS[String(chapterId)] || null;
  }

  getWorldData(worldId) {
    return WORLDS.find((w) => w.id === worldId);
  }

  getWorldLevels(worldId) {
    const world = this.getWorldData(worldId);
    if (!world) return [];
    return world.levels.map((lid) => this.getLevelData(lid)).filter(Boolean);
  }

  resetProgress() {
    this.currentProgress = defaultProgress();
    if (devPlaytest.isEnabled()) {
      this.currentProgress.unlockedWorlds = WORLDS.map((w) => w.id);
      this.currentProgress.unlockedLevels = LEVELS.map((l) => l.id);
    }
    this.saveProgress();
    wx.removeStorageSync('baozhu_basic_completed');
    wx.removeStorageSync(SESSION_START_KEY);
  }

  unlockAll() {
    this.currentProgress.unlockedWorlds = WORLDS.map((w) => w.id);
    this.currentProgress.unlockedLevels = LEVELS.map((l) => l.id);
    this.saveProgress();
  }

  getBasicLevelIds() {
    return [101, 102, 103, 104, 105, 106];
  }

  startBasicLevelTimer() {
    if (!wx.getStorageSync(SESSION_START_KEY)) {
      wx.setStorageSync(SESSION_START_KEY, String(Date.now()));
    }
  }

  getBasicLevelElapsedTime() {
    const startTime = wx.getStorageSync(SESSION_START_KEY);
    if (!startTime) return 0;
    return Date.now() - parseInt(startTime, 10);
  }

  formatElapsedTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}分${seconds.toString().padStart(2, '0')}秒`;
  }

  getSpeedRating(ms) {
    const minutes = ms / 1000 / 60;
    if (minutes < 5) return { name: '闪电', icon: '⚡', color: '#FFD700', tier: 5 };
    if (minutes < 10) return { name: '疾风', icon: '💨', color: '#9C27B0', tier: 4 };
    if (minutes < 20) return { name: '稳健', icon: '🌿', color: '#2196F3', tier: 3 };
    if (minutes < 30) return { name: '悠然', icon: '🍃', color: '#4CAF50', tier: 2 };
    return { name: '沉浸', icon: '🌙', color: '#9E9E9E', tier: 1 };
  }

  hasCompletedAllBasicLevels() {
    return this.getBasicLevelIds().every((id) => this.isLevelCompleted(id));
  }

  hasClaimedBasicReward() {
    return !!wx.getStorageSync('baozhu_basic_completed');
  }

  markBasicRewardClaimed() {
    wx.setStorageSync('baozhu_basic_completed', '1');
  }

  claimBasicReward() {
    this.markBasicRewardClaimed();
  }

  getExplorationProgress() {
    const totalItems = Object.keys(ITEMS).length;
    const discovered = (this.currentProgress.discoveredItems || []).length;
    return Math.round((discovered / totalItems) * 100);
  }

  upgradeTitle() {
    if (!this.currentProgress.titleLevel) {
      this.currentProgress.titleLevel = 1;
    }
    if (this.currentProgress.titleLevel < 5) {
      this.currentProgress.titleLevel += 1;
      this.saveProgress();
    }
    return this.getCurrentTitle();
  }

  getCurrentTitle() {
    const titles = [
      { level: 1, name: '酿造学徒', icon: '🌱' },
      { level: 2, name: '初级酿造师', icon: '🌿' },
      { level: 3, name: '熟练酿造师', icon: '🌳' },
      { level: 4, name: '酿造大师', icon: '⭐' },
      { level: 5, name: '传奇酿造师', icon: '👑' },
    ];
    const level = this.currentProgress.titleLevel || 1;
    return titles.find((t) => t.level === level) || titles[0];
  }

  getClaimedTasks() {
    try {
      const raw = wx.getStorageSync(CLAIMED_TASKS_KEY);
      if (!raw) return [];
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (e) {
      return [];
    }
  }

  claimTask(taskId) {
    const claimed = this.getClaimedTasks();
    if (claimed.includes(taskId)) return;
    claimed.push(taskId);
    wx.setStorageSync(CLAIMED_TASKS_KEY, claimed);
  }

  hasAnyClaimableTask() {
    const claimed = this.getClaimedTasks();
    const completed = this.currentProgress.completedLevels || [];
    const discovered = this.currentProgress.discoveredItems || [];
    const checks = [
      { id: 'first_synthesis', done: discovered.length >= 1 },
      { id: 'complete_first5', done: [101, 102, 103, 104, 105].every((id) => completed.includes(id)) },
      { id: 'complete_boss', done: completed.includes(106) },
      { id: 'complete_chapter1', done: [101, 102, 103, 104, 105, 106].every((id) => completed.includes(id)) },
      { id: 'discover_10', done: discovered.length >= 10 },
      { id: 'discover_20', done: discovered.length >= 20 },
    ];
    return checks.some((c) => c.done && !claimed.includes(c.id));
  }
}

const levelManager = new LevelManager();

module.exports = levelManager;
module.exports.WORLDS = WORLDS;
module.exports.LEVELS = LEVELS;
module.exports.CHAPTERS = CHAPTERS;
