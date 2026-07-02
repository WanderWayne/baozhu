System.register(["__unresolved_0", "cc", "__unresolved_1"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, RecipeEngine, _crd;

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function runRecipeEngineSpec() {
    var engine = new (_crd && RecipeEngine === void 0 ? (_reportPossibleCrUseOfRecipeEngine({
      error: Error()
    }), RecipeEngine) : RecipeEngine)([{
      ingredients: ['牛奶', '冰糖碎'],
      result: '甜牛奶'
    }, {
      ingredients: ['发酵', '牛奶'],
      result: '酸奶'
    }]);
    var r1 = engine.synthesize(['冰糖碎', '牛奶']);
    assert(r1.success && r1.resultItem === '甜牛奶', 'recipe order-insensitive match failed');
    var r2 = engine.synthesize(['牛奶', '滤布']);
    assert(!r2.success, 'invalid recipe should fail');
  }

  function _reportPossibleCrUseOfRecipeEngine(extras) {
    _reporterNs.report("RecipeEngine", "../core/RecipeEngine", _context.meta, extras);
  }

  _export("runRecipeEngineSpec", runRecipeEngineSpec);

  return {
    setters: [function (_unresolved_) {
      _reporterNs = _unresolved_;
    }, function (_cc) {
      _cclegacy = _cc.cclegacy;
    }, function (_unresolved_2) {
      RecipeEngine = _unresolved_2.RecipeEngine;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "b2dd6wChEtJRZR/H/INiXaQ", "RecipeEngine.spec", undefined);

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=ddec470a9f9d39257294dd0b20d5fcad741e9878.js.map