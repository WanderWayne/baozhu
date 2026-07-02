import { _decorator, Component } from 'cc';
import { getGameContext } from './GameContext';

const { ccclass } = _decorator;

@ccclass('GalleryScene')
export class GalleryScene extends Component {
  onEnable(): void {
    getGameContext().router.onChange((scene) => {
      if (scene === 'Gallery') this.render();
    });
  }

  render(): void {
    const ctx = getGameContext();
    const state = ctx.progress.snapshot();
    const fragments = ctx.config.getFragments();
    const unlocked = fragments.filter((f) => state.fragments.includes(f.id)).length;
    console.log('[GalleryScene]', { unlocked, total: fragments.length });
  }
}

