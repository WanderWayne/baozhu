System.register(["__unresolved_0", "cc", "__unresolved_1"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, getGameContext, _dec, _class, _crd, ccclass, CodexScene;

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

      _cclegacy._RF.push({}, "ea839H257pHhbSID9CGMIy7", "CodexScene", undefined);

      __checkObsolete__(['_decorator', 'Component']);

      ({
        ccclass
      } = _decorator);

      _export("CodexScene", CodexScene = (_dec = ccclass('CodexScene'), _dec(_class = class CodexScene extends Component {
        onEnable() {
          (_crd && getGameContext === void 0 ? (_reportPossibleCrUseOfgetGameContext({
            error: Error()
          }), getGameContext) : getGameContext)().router.onChange(scene => {
            if (scene === 'Codex') this.render();
          });
        }

        render() {
          const ctx = (_crd && getGameContext === void 0 ? (_reportPossibleCrUseOfgetGameContext({
            error: Error()
          }), getGameContext) : getGameContext)();
          const state = ctx.progress.snapshot();
          const atlas = ctx.progress.getAtlasProgress();
          const discovered = new Set(state.discoveredItems);
          const recipes = ctx.config.getRecipes();
          const discoveredRecipes = recipes.filter(r => discovered.has(r.result)).length;
          console.log('[CodexScene]', {
            atlas,
            discoveredRecipes,
            totalRecipes: recipes.length
          });
        }

      }) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=d3202f7f68a754c8dc6e83b6145714fa0af1be6d.js.map