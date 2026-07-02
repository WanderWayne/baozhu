const taskDefs = require('../data/tasks.js');
const levelManager = require('./level-manager');

function checkTask(taskId) {
  const progress = levelManager.currentProgress;
  const completed = progress.completedLevels || [];
  const discovered = progress.discoveredItems || [];

  switch (taskId) {
    case 'first_synthesis':
      return { current: Math.min(discovered.length, 1), total: 1 };
    case 'complete_first5': {
      const first5 = [101, 102, 103, 104, 105];
      const done = first5.filter((id) => completed.includes(id)).length;
      return { current: done, total: 5 };
    }
    case 'complete_boss':
      return { current: completed.includes(106) ? 1 : 0, total: 1 };
    case 'complete_chapter1': {
      const chapter1 = [101, 102, 103, 104, 105, 106];
      const done = chapter1.filter((id) => completed.includes(id)).length;
      return { current: done, total: 6 };
    }
    case 'discover_10':
      return { current: Math.min(discovered.length, 10), total: 10 };
    case 'discover_20':
      return { current: Math.min(discovered.length, 20), total: 20 };
    default:
      return { current: 0, total: 1 };
  }
}

function getTasksWithProgress() {
  const claimed = levelManager.getClaimedTasks();
  return taskDefs.map((task) => {
    const { current, total } = checkTask(task.id);
    const percent = Math.min((current / total) * 100, 100);
    const done = current >= total;
    const alreadyClaimed = claimed.includes(task.id);
    const canClaim = done && !alreadyClaimed;
    let rewardLabel = '奖励';
    if (canClaim) rewardLabel = '领取';
    else if (alreadyClaimed) rewardLabel = '已领取';

    return {
      ...task,
      current,
      total,
      percent,
      done,
      alreadyClaimed,
      canClaim,
      rewardLabel,
    };
  });
}

module.exports = {
  getTasksWithProgress,
  checkTask,
};
