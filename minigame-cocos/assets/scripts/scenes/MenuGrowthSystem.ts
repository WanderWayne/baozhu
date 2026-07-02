import { _decorator, Component } from 'cc';
import { getGameContext } from './GameContext';

const { ccclass } = _decorator;

export interface GrowthStage {
  id: string;
  name: string;
  minDiscovered: number;
  progress: number;
}

@ccclass('MenuGrowthSystem')
export class MenuGrowthSystem extends Component {
  private stages: GrowthStage[] = [
    { id: 'seed', name: '微光', minDiscovered: 0, progress: 15 },
    { id: 'sprout', name: '萌发', minDiscovered: 10, progress: 35 },
    { id: 'bloom', name: '开绽', minDiscovered: 25, progress: 65 },
    { id: 'ritual', name: '成章', minDiscovered: 45, progress: 100 },
  ];

  getCurrentStage(): GrowthStage {
    const discovered = getGameContext().progress.snapshot().discoveredItems.length;
    let current = this.stages[0];
    this.stages.forEach((s) => {
      if (discovered >= s.minDiscovered) current = s;
    });
    return current;
  }
}

