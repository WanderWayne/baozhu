import { _decorator, Component } from 'cc';
import { getGameContext } from './GameContext';

const { ccclass } = _decorator;

interface GameRuntimeState {
  levelId: number;
  inventory: string[];
  craftedItems: string[];
  target: string;
  completed: boolean;
}

@ccclass('GameScene')
export class GameScene extends Component {
  private state: GameRuntimeState | null = null;

  onEnable(): void {
    const { router } = getGameContext();
    router.onChange((scene, routeState) => {
      if (scene !== 'Game') return;
      const levelId = routeState.levelId || 101;
      this.enterLevel(levelId);
    });
  }

  enterLevel(levelId: number): void {
    const ctx = getGameContext();
    const level = ctx.config.getLevels().find((l) => l.id === levelId);
    if (!level) {
      console.warn('[GameScene] level not found', levelId);
      ctx.router.navigate('Levels');
      return;
    }
    this.state = {
      levelId,
      inventory: [...((level.initialItems as string[]) || [])],
      craftedItems: [],
      target: (level.target as string) || '',
      completed: false,
    };
    console.log('[GameScene] enter level', this.state);
  }

  trySynthesize(itemA: string, itemB: string, extraItem?: string): void {
    if (!this.state || this.state.completed) return;
    const ctx = getGameContext();
    const items = [itemA, itemB];
    if (extraItem) items.push(extraItem);
    const result = ctx.recipes.synthesize(items);
    if (!result.success || !result.resultItem) {
      console.log('[GameScene] synth failed', items, result.reason);
      return;
    }
    this.state.inventory.push(result.resultItem);
    this.state.craftedItems.push(result.resultItem);
    ctx.progress.discoverItem(result.resultItem);
    this.tryUnlockFragment(result.resultItem);
    console.log('[GameScene] synth success', items, '=>', result.resultItem);

    if (result.resultItem === this.state.target) {
      this.offerTarget();
    }
  }

  private tryUnlockFragment(itemName: string): void {
    const ctx = getGameContext();
    const fragment = ctx.config.getFragments().find((f) => f.trigger === itemName);
    if (!fragment?.id) return;
    if (ctx.progress.discoverFragment(fragment.id)) {
      console.log('[GameScene] fragment unlocked', fragment.id);
    }
  }

  offerTarget(): void {
    if (!this.state || this.state.completed) return;
    const ctx = getGameContext();
    this.state.completed = true;
    ctx.progress.markLevelComplete(this.state.levelId);
    ctx.progress.addGems(50);
    ctx.progress.applyAutoWorldUnlocks(ctx.config.getWorlds().map((w) => w.id));
    ctx.progress.save();
    console.log('[GameScene] level completed', this.state.levelId);
    this.backToLevels();
  }

  backToLevels(): void {
    getGameContext().router.navigate('Levels');
  }
}

