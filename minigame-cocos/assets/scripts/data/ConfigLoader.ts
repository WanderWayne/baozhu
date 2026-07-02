import { ConfigRepository, GameConfig } from './ConfigRepository';

const fallbackConfig: GameConfig = {
  worlds: { chapters: {}, worlds: [], levels: [] },
  items: { recipes: [], items: {}, fragments: [] },
  atlas: { slots: [], centerSlot: null },
  tasks: { tasks: [] },
};

export class ConfigLoader {
  static loadFromObject(data: unknown): ConfigRepository {
    const cfg = (data as GameConfig) || fallbackConfig;
    return new ConfigRepository(cfg);
  }
}

