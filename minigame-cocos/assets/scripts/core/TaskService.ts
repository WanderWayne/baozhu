import { ProgressState, TaskConfig } from './types';

export interface TaskProgress {
  id: string;
  current: number;
  total: number;
  done: boolean;
  gems: number;
}

export class TaskService {
  private tasks: TaskConfig[];

  constructor(tasks: TaskConfig[]) {
    this.tasks = tasks;
  }

  evaluate(progress: ProgressState): TaskProgress[] {
    return this.tasks.map((task) => {
      let current = 0;
      let total = 1;
      if (task.rule.kind === 'discoveredItemsAtLeast') {
        total = task.rule.threshold;
        current = Math.min(progress.discoveredItems.length, total);
      } else if (task.rule.kind === 'completeAllLevels') {
        total = task.rule.levelIds.length;
        current = task.rule.levelIds.filter((id) => progress.completedLevels.includes(id)).length;
      }
      return {
        id: task.id,
        current,
        total,
        done: current >= total,
        gems: task.gems,
      };
    });
  }
}

