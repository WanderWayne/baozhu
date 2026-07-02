import { ProgressState } from './types';

export interface IStorageAdapter {
  getString(key: string): string | null;
  setString(key: string, value: string): void;
  remove(key: string): void;
}

const STORAGE_KEY = 'bojoo_game_progress_v2';

export class ProgressService {
  private state: ProgressState;
  private storage: IStorageAdapter;
  private atlasCountableSlotIds: string[];
  private readonly worldUnlockFragmentThreshold: Record<number, number> = {
    1: 0,
    2: 3,
    3: 6,
    4: 9,
    5: 12,
    6: 16,
  };

  constructor(storage: IStorageAdapter, atlasCountableSlotIds: string[]) {
    this.storage = storage;
    this.atlasCountableSlotIds = atlasCountableSlotIds;
    this.state = this.load();
  }

  private defaultState(): ProgressState {
    return {
      unlockedWorlds: [1],
      unlockedLevels: [101],
      completedLevels: [],
      discoveredItems: [],
      fragments: [],
      achievements: [],
      gems: 0,
      discoveredRecipes: {},
      atlasPieces: [],
      chapterPhaseSettlementSeen: false,
    };
  }

  private load(): ProgressState {
    try {
      const raw = this.storage.getString(STORAGE_KEY);
      if (!raw) return this.defaultState();
      const parsed = JSON.parse(raw) as Partial<ProgressState>;
      return {
        ...this.defaultState(),
        ...parsed,
        unlockedWorlds: parsed.unlockedWorlds || [1],
        unlockedLevels: parsed.unlockedLevels || [101],
        completedLevels: parsed.completedLevels || [],
        discoveredItems: parsed.discoveredItems || [],
        fragments: parsed.fragments || [],
        achievements: parsed.achievements || [],
        discoveredRecipes: parsed.discoveredRecipes || {},
        atlasPieces: parsed.atlasPieces || [],
      };
    } catch (e) {
      return this.defaultState();
    }
  }

  save(): void {
    this.storage.setString(STORAGE_KEY, JSON.stringify(this.state));
  }

  reset(): void {
    this.state = this.defaultState();
    this.storage.remove(STORAGE_KEY);
  }

  snapshot(): ProgressState {
    return JSON.parse(JSON.stringify(this.state)) as ProgressState;
  }

  markLevelComplete(levelId: number): boolean {
    if (this.state.completedLevels.includes(levelId)) return false;
    this.state.completedLevels.push(levelId);
    return true;
  }

  discoverItem(itemName: string): boolean {
    if (this.state.discoveredItems.includes(itemName)) return false;
    this.state.discoveredItems.push(itemName);
    return true;
  }

  discoverFragment(fragmentId: string): boolean {
    if (this.state.fragments.includes(fragmentId)) return false;
    this.state.fragments.push(fragmentId);
    return true;
  }

  addGems(gems: number): void {
    this.state.gems += Math.max(0, gems);
  }

  unlockWorld(worldId: number): void {
    if (!this.state.unlockedWorlds.includes(worldId)) {
      this.state.unlockedWorlds.push(worldId);
    }
  }

  unlockLevel(levelId: number): void {
    if (!this.state.unlockedLevels.includes(levelId)) {
      this.state.unlockedLevels.push(levelId);
    }
  }

  unlockAtlasPiece(slotId: string): void {
    if (!this.atlasCountableSlotIds.includes(slotId)) return;
    if (!this.state.atlasPieces.includes(slotId)) {
      this.state.atlasPieces.push(slotId);
    }
  }

  setChapterSettlementSeen(seen: boolean): void {
    this.state.chapterPhaseSettlementSeen = seen;
  }

  getAtlasProgress(): { unlocked: number; total: number } {
    const ids = new Set(this.state.atlasPieces);
    const total = this.atlasCountableSlotIds.length;
    let unlocked = 0;
    this.atlasCountableSlotIds.forEach((id) => {
      if (ids.has(id)) unlocked += 1;
    });
    return { unlocked, total };
  }

  getFragmentProgress(totalFragments: number): { unlocked: number; total: number } {
    return { unlocked: this.state.fragments.length, total: totalFragments };
  }

  isWorldUnlocked(worldId: number): boolean {
    if (worldId === 1) return true;
    if (this.state.unlockedWorlds.includes(worldId)) return true;
    const threshold = this.worldUnlockFragmentThreshold[worldId] ?? Number.MAX_SAFE_INTEGER;
    return this.state.fragments.length >= threshold;
  }

  getWorldUnlockRequirement(worldId: number): number {
    return this.worldUnlockFragmentThreshold[worldId] ?? 0;
  }

  applyAutoWorldUnlocks(worldIds: number[]): boolean {
    let changed = false;
    worldIds.forEach((worldId) => {
      if (!this.state.unlockedWorlds.includes(worldId) && this.isWorldUnlocked(worldId)) {
        this.state.unlockedWorlds.push(worldId);
        changed = true;
      }
    });
    return changed;
  }

  isLevelUnlocked(
    levelId: number,
    levels: Array<{ id: number; worldId: number }>,
    worlds: Array<{ id: number; levels: number[] }>
  ): boolean {
    const level = levels.find((l) => l.id === levelId);
    if (!level) return false;
    if (!this.isWorldUnlocked(level.worldId)) return false;
    const world = worlds.find((w) => w.id === level.worldId);
    if (!world) return false;
    const idx = world.levels.indexOf(levelId);
    if (idx < 0) return false;
    if (idx === 0) return true;
    const prevId = world.levels[idx - 1];
    return this.state.completedLevels.includes(prevId);
  }

  getWorldProgress(worldId: number, worlds: Array<{ id: number; levels: number[] }>) {
    const world = worlds.find((w) => w.id === worldId);
    if (!world) return { completed: 0, total: 0, percentage: 0 };
    const completed = world.levels.filter((id) => this.state.completedLevels.includes(id)).length;
    const total = world.levels.length;
    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }
}

