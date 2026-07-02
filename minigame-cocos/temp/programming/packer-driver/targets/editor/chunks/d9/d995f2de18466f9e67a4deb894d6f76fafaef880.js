System.register(["__unresolved_0", "cc"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, ConfigRepository, _crd;

  function _reportPossibleCrUseOfRecipe(extras) {
    _reporterNs.report("Recipe", "../core/types", _context.meta, extras);
  }

  function _reportPossibleCrUseOfTaskConfig(extras) {
    _reporterNs.report("TaskConfig", "../core/types", _context.meta, extras);
  }

  _export("ConfigRepository", void 0);

  return {
    setters: [function (_unresolved_) {
      _reporterNs = _unresolved_;
    }, function (_cc) {
      _cclegacy = _cc.cclegacy;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "9895033pk1M+bOCChznJ/Mk", "ConfigRepository", undefined);

      _export("ConfigRepository", ConfigRepository = class ConfigRepository {
        constructor(cfg) {
          this.cfg = void 0;
          this.cfg = cfg;
        }

        getRecipes() {
          return this.cfg.items.recipes;
        }

        getLevels() {
          return this.cfg.worlds.levels;
        }

        getWorlds() {
          return this.cfg.worlds.worlds;
        }

        getFragments() {
          return this.cfg.items.fragments;
        }

        getTasks() {
          return this.cfg.tasks.tasks;
        }

        getAtlasCountableSlotIds() {
          var _this$cfg$atlas$cente;

          const ids = this.cfg.atlas.slots.filter(slot => slot.kind !== 'reserved').map(slot => slot.id);
          if ((_this$cfg$atlas$cente = this.cfg.atlas.centerSlot) != null && _this$cfg$atlas$cente.id) ids.push(this.cfg.atlas.centerSlot.id);
          return ids;
        }

      });

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=d995f2de18466f9e67a4deb894d6f76fafaef880.js.map