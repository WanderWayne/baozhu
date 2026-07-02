import { _decorator, Component } from 'cc';
import { getGameContext } from './GameContext';

const { ccclass } = _decorator;

@ccclass('IntroScene')
export class IntroScene extends Component {
  private played = false;

  onEnable(): void {
    const { router } = getGameContext();
    router.onChange((scene) => {
      if (scene === 'Intro') this.playIntro();
    });
    this.playIntro();
  }

  private playIntro(): void {
    if (this.played) return;
    this.played = true;
    console.log('[IntroScene] play intro sequence');
    // Intro scaffold: immediately continue; replace with timeline animation later.
    getGameContext().router.navigate('Menu');
  }
}

