System.register(["__unresolved_0", "cc", "__unresolved_1"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, getGameContext, _dec, _class, _crd, ccclass, TaskToast;

  function _reportPossibleCrUseOfgetGameContext(extras) {
    _reporterNs.report("getGameContext", "./GameContext", _context.meta, extras);
  }

  return {
    setters: [function (_unresolved_) {
      _reporterNs = _unresolved_;
    }, function (_cc) {
      _cclegacy = _cc.cclegacy;
      __checkObsolete__ = _cc.__checkObsolete__;
      __checkObsoleteInNamespace__ = _cc.__checkObsoleteInNamespace__;
      _decorator = _cc._decorator;
      Component = _cc.Component;
    }, function (_unresolved_2) {
      getGameContext = _unresolved_2.getGameContext;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "ff46dQEQhVNhIx0CyvoKEaW", "TaskToast", undefined);

      __checkObsolete__(['_decorator', 'Component']);

      ({
        ccclass
      } = _decorator);

      _export("TaskToast", TaskToast = (_dec = ccclass('TaskToast'), _dec(_class = class TaskToast extends Component {
        constructor(...args) {
          super(...args);
          this.knownDone = new Set();
        }

        refreshAndToastNewlyDone() {
          const ctx = (_crd && getGameContext === void 0 ? (_reportPossibleCrUseOfgetGameContext({
            error: Error()
          }), getGameContext) : getGameContext)();
          const progress = ctx.tasks.evaluate(ctx.progress.snapshot());
          progress.forEach(p => {
            if (p.done && !this.knownDone.has(p.id)) {
              this.knownDone.add(p.id);
              console.log('[TaskToast] task completed', p.id, `+${p.gems} gems`);
            }
          });
        }

      }) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=82678f38a555de6cda65d3198b3e7670aad7e78d.js.map