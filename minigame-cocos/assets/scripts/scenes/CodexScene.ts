import { _decorator, Component } from 'cc';
import { getGameContext } from './GameContext';

const { ccclass } = _decorator;

@ccclass('CodexScene')
export class CodexScene extends Component {
  onEnable(): void {
    getGameContext().router.onChange((scene) => {
      if (scene === 'Codex') this.render();
    });
  }

  render(): void {
    const ctx = getGameContext();
    const state = ctx.progress.snapshot();
    const atlas = ctx.progress.getAtlasProgress();
    const discovered = new Set(state.discoveredItems);
    const recipes = ctx.config.getRecipes();
    const discoveredRecipes = recipes.filter((r) => discovered.has(r.result)).length;
    console.log('[CodexScene]', {
      atlas,
      discoveredRecipes,
      totalRecipes: recipes.length,
    });
  }
}

