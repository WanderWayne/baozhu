System.register(["__unresolved_0", "cc", "__unresolved_1", "__unresolved_2"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, runRecipeEngineSpec, runProgressServiceSpec, _dec, _class, _crd, ccclass, AppRoot;

  function _reportPossibleCrUseOfrunRecipeEngineSpec(extras) {
    _reporterNs.report("runRecipeEngineSpec", "./tests/RecipeEngine.spec", _context.meta, extras);
  }

  function _reportPossibleCrUseOfrunProgressServiceSpec(extras) {
    _reporterNs.report("runProgressServiceSpec", "./tests/ProgressService.spec", _context.meta, extras);
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
      runRecipeEngineSpec = _unresolved_2.runRecipeEngineSpec;
    }, function (_unresolved_3) {
      runProgressServiceSpec = _unresolved_3.runProgressServiceSpec;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "07bd99tgkpMGqZ0ygcaH6Sl", "AppRoot", undefined);

      __checkObsolete__(['_decorator', 'Component']);

      ({
        ccclass
      } = _decorator);

      _export("AppRoot", AppRoot = (_dec = ccclass('AppRoot'), _dec(_class = class AppRoot extends Component {
        start() {
          // Early-stage smoke checks for migrated core logic.
          (_crd && runRecipeEngineSpec === void 0 ? (_reportPossibleCrUseOfrunRecipeEngineSpec({
            error: Error()
          }), runRecipeEngineSpec) : runRecipeEngineSpec)();
          (_crd && runProgressServiceSpec === void 0 ? (_reportPossibleCrUseOfrunProgressServiceSpec({
            error: Error()
          }), runProgressServiceSpec) : runProgressServiceSpec)();
          console.log('[AppRoot] core smoke specs passed');
        }

      }) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=1606d403225aabae52e581658abacf21365d70b1.js.map