System.register(["__unresolved_0", "cc"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, RecipeEngine, _crd;

  function keyOf(ingredients) {
    return [...ingredients].sort().join('|');
  }

  function _reportPossibleCrUseOfRecipe(extras) {
    _reporterNs.report("Recipe", "./types", _context.meta, extras);
  }

  function _reportPossibleCrUseOfSynthesizeResult(extras) {
    _reporterNs.report("SynthesizeResult", "./types", _context.meta, extras);
  }

  _export("RecipeEngine", void 0);

  return {
    setters: [function (_unresolved_) {
      _reporterNs = _unresolved_;
    }, function (_cc) {
      _cclegacy = _cc.cclegacy;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "d0cefCm2U1HR4T/xeAl+78Y", "RecipeEngine", undefined);

      _export("RecipeEngine", RecipeEngine = class RecipeEngine {
        constructor(recipes) {
          this.index = new Map();
          recipes.forEach(recipe => {
            this.index.set(keyOf(recipe.ingredients), recipe);
          });
        }

        synthesize(items) {
          if (!items.length) {
            return {
              success: false,
              reason: 'EMPTY_INPUT'
            };
          }

          const k = keyOf(items);
          const recipe = this.index.get(k);

          if (!recipe) {
            return {
              success: false,
              reason: 'NO_RECIPE'
            };
          }

          return {
            success: true,
            resultItem: recipe.result
          };
        }

        canSynthesize(items) {
          return this.index.has(keyOf(items));
        }

      });

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=ef370182a4ee244b0832b59a7b0e4f18743a148d.js.map