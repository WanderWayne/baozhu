import { _decorator, Component } from 'cc';
import { getGameContext } from './GameContext';

const { ccclass } = _decorator;

@ccclass('TaskToast')
export class TaskToast extends Component {
  private knownDone = new Set<string>();

  refreshAndToastNewlyDone(): void {
    const ctx = getGameContext();
    const progress = ctx.tasks.evaluate(ctx.progress.snapshot());
    progress.forEach((p) => {
      if (p.done && !this.knownDone.has(p.id)) {
        this.knownDone.add(p.id);
        console.log('[TaskToast] task completed', p.id, `+${p.gems} gems`);
      }
    });
  }
}

