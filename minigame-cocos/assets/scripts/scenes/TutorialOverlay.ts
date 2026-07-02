import { _decorator, Component } from 'cc';

const { ccclass } = _decorator;

@ccclass('TutorialOverlay')
export class TutorialOverlay extends Component {
  private shownKeys = new Set<string>();

  showOnce(key: string, message: string): void {
    if (this.shownKeys.has(key)) return;
    this.shownKeys.add(key);
    console.log('[TutorialOverlay]', key, message);
  }

  reset(): void {
    this.shownKeys.clear();
  }
}

