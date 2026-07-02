import { _decorator, Component } from 'cc';
import { getGameContext } from './GameContext';

const { ccclass } = _decorator;

@ccclass('LevelsScene')
export class LevelsScene extends Component {
  private currentWorldId = 1;

  onEnable(): void {
    getGameContext().router.onChange((scene) => {
      if (scene === 'Levels') this.renderWorld(this.currentWorldId);
    });
  }

  renderWorld(worldId: number): void {
    this.currentWorldId = worldId;
    const ctx = getGameContext();
    const levels = ctx.config.getLevels().filter((l) => l.worldId === worldId);
    const worlds = ctx.config.getWorlds().map((w) => ({
      id: w.id as number,
      levels: (w.levels as number[]) || [],
    }));
    const levelStates = levels.map((l) => ({
      id: l.id,
      unlocked: ctx.progress.isLevelUnlocked(
        l.id as number,
        ctx.config.getLevels().map((lv) => ({ id: lv.id as number, worldId: lv.worldId as number })),
        worlds
      ),
      completed: ctx.progress.snapshot().completedLevels.includes(l.id as number),
    }));
    console.log('[LevelsScene] world levels', worldId, levelStates);
  }

  enterLevel(levelId: number): void {
    getGameContext().router.navigate('Game', { levelId });
  }
}

