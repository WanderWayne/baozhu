import { _decorator, Component } from 'cc';
import { getGameContext } from './GameContext';

const { ccclass } = _decorator;

@ccclass('ChapterSettlement')
export class ChapterSettlement extends Component {
  showIfNeeded(chapterId: number): boolean {
    const progress = getGameContext().progress.snapshot();
    if (chapterId !== 1 || progress.chapterPhaseSettlementSeen) return false;
    console.log('[ChapterSettlement] show chapter completion settlement', chapterId);
    return true;
  }

  markSeen(): void {
    const ctx = getGameContext();
    ctx.progress.setChapterSettlementSeen(true);
    ctx.progress.save();
  }
}

