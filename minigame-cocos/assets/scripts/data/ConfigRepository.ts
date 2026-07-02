import { Recipe, TaskConfig } from '../core/types';

export interface WorldsConfig {
  chapters: Record<string, unknown>;
  worlds: Array<{ id: number; [k: string]: unknown }>;
  levels: Array<{ id: number; worldId: number; target?: string; [k: string]: unknown }>;
}

export interface ItemsConfig {
  recipes: Recipe[];
  items: Record<string, { name?: string; [k: string]: unknown }>;
  fragments: Array<{ id: string; trigger?: string; [k: string]: unknown }>;
}

export interface AtlasConfig {
  slots: Array<{ id: string; kind: string; [k: string]: unknown }>;
  centerSlot: { id: string; [k: string]: unknown } | null;
}

export interface TasksConfig {
  tasks: TaskConfig[];
}

export interface GameConfig {
  worlds: WorldsConfig;
  items: ItemsConfig;
  atlas: AtlasConfig;
  tasks: TasksConfig;
}

export class ConfigRepository {
  private cfg: GameConfig;

  constructor(cfg: GameConfig) {
    this.cfg = cfg;
  }

  getRecipes(): Recipe[] {
    return this.cfg.items.recipes;
  }

  getLevels() {
    return this.cfg.worlds.levels;
  }

  getWorlds() {
    return this.cfg.worlds.worlds;
  }

  getFragments() {
    return this.cfg.items.fragments;
  }

  getTasks(): TaskConfig[] {
    return this.cfg.tasks.tasks;
  }

  getAtlasCountableSlotIds(): string[] {
    const ids = this.cfg.atlas.slots
      .filter((slot) => slot.kind !== 'reserved')
      .map((slot) => slot.id);
    if (this.cfg.atlas.centerSlot?.id) ids.push(this.cfg.atlas.centerSlot.id);
    return ids;
  }
}

