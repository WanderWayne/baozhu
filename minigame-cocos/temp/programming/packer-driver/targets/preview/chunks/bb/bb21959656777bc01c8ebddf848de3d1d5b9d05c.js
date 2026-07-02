System.register(["__unresolved_0", "cc"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, TaskService, _crd;

  function _reportPossibleCrUseOfProgressState(extras) {
    _reporterNs.report("ProgressState", "./types", _context.meta, extras);
  }

  function _reportPossibleCrUseOfTaskConfig(extras) {
    _reporterNs.report("TaskConfig", "./types", _context.meta, extras);
  }

  _export("TaskService", void 0);

  return {
    setters: [function (_unresolved_) {
      _reporterNs = _unresolved_;
    }, function (_cc) {
      _cclegacy = _cc.cclegacy;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "3e4d5XgU1JH4KNZvJ1UkZ1M", "TaskService", undefined);

      _export("TaskService", TaskService = class TaskService {
        constructor(tasks) {
          this.tasks = void 0;
          this.tasks = tasks;
        }

        evaluate(progress) {
          return this.tasks.map(task => {
            var current = 0;
            var total = 1;

            if (task.rule.kind === 'discoveredItemsAtLeast') {
              total = task.rule.threshold;
              current = Math.min(progress.discoveredItems.length, total);
            } else if (task.rule.kind === 'completeAllLevels') {
              total = task.rule.levelIds.length;
              current = task.rule.levelIds.filter(id => progress.completedLevels.includes(id)).length;
            }

            return {
              id: task.id,
              current,
              total,
              done: current >= total,
              gems: task.gems
            };
          });
        }

      });

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=bb21959656777bc01c8ebddf848de3d1d5b9d05c.js.map