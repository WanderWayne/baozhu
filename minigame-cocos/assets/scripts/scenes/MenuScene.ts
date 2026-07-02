import { _decorator, Component } from 'cc';
import { getGameContext } from './GameContext';

const { ccclass } = _decorator;

@ccclass('MenuScene')
export class MenuScene extends Component {
  onEnable(): void {
    const { router } = getGameContext();
    router.onChange((scene) => {
      if (scene === 'Menu') this.render();
    });
  }

  private render(): void {
    const ctx = getGameContext();
    const state = ctx.progress.snapshot();
    const atlas = ctx.progress.getAtlasProgress();
    const fragment = ctx.progress.getFragmentProgress(ctx.config.getFragments().length);
    const taskProgress = ctx.tasks.evaluate(state);
    console.log('[MenuScene] progress', { atlas, fragment, taskProgress });
  }

  onTapStart(): void {
    getGameContext().router.navigate('Levels');
  }

  onTapCodex(): void {
    getGameContext().router.navigate('Codex');
  }

  onTapGallery(): void {
    getGameContext().router.navigate('Gallery');
  }
}

