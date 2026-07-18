// 关卡内任务达成提示
const { getTasksWithProgress } = require('./tasks');
const levelManager = require('./level-manager');

function getDoneMap() {
  const rows = getTasksWithProgress(levelManager);
  const map = {};
  rows.forEach((r) => { map[r.id] = r.done; });
  return map;
}

const GameTaskToast = {
  _lastDone: null,
  _queue: [],
  _draining: false,
  _page: null,

  bindPage(page) {
    this._page = page;
  },

  initBaseline() {
    this._lastDone = { ...getDoneMap() };
  },

  afterProgressMutation() {
    const next = getDoneMap();
    const prev = this._lastDone;
    if (!prev) {
      this._lastDone = { ...next };
      return;
    }
    const names = [];
    Object.keys(next).forEach((id) => {
      if (!prev[id] && next[id]) {
        const row = getTasksWithProgress(levelManager).find((t) => t.id === id);
        if (row) names.push(row.name);
      }
    });
    this._lastDone = { ...next };
    names.forEach((n) => this._enqueue(n));
  },

  _enqueue(taskName) {
    this._queue.push(taskName);
    if (!this._draining) this._drain();
  },

  async _drain() {
    this._draining = true;
    while (this._queue.length) {
      const name = this._queue.shift();
      await this._playToast(name);
    }
    this._draining = false;
  },

  _playToast(taskName) {
    return new Promise((resolve) => {
      if (!this._page) {
        resolve();
        return;
      }
      this._page.setData({
        taskToastVisible: true,
        taskToastText: `任务达成 · ${taskName}`,
      });
      try {
        const page = this._page;
        if (page && page.audioManager) page.audioManager.playSFX('task-milestone');
      } catch (e) { /* noop */ }
      setTimeout(() => {
        if (this._page) {
          this._page.setData({ taskToastVisible: false, taskToastText: '' });
        }
        resolve();
      }, 2200);
    });
  },
};

module.exports = GameTaskToast;
