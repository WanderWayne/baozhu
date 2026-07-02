System.register(["__unresolved_0", "cc", "__unresolved_1"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, ConfigRepository, ConfigLoader, _crd, fallbackConfig;

  function _reportPossibleCrUseOfConfigRepository(extras) {
    _reporterNs.report("ConfigRepository", "./ConfigRepository", _context.meta, extras);
  }

  function _reportPossibleCrUseOfGameConfig(extras) {
    _reporterNs.report("GameConfig", "./ConfigRepository", _context.meta, extras);
  }

  _export("ConfigLoader", void 0);

  return {
    setters: [function (_unresolved_) {
      _reporterNs = _unresolved_;
    }, function (_cc) {
      _cclegacy = _cc.cclegacy;
    }, function (_unresolved_2) {
      ConfigRepository = _unresolved_2.ConfigRepository;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "a7f9dkBq39FN4C8vsCvUeqd", "ConfigLoader", undefined);

      fallbackConfig = {
        worlds: {
          chapters: {},
          worlds: [],
          levels: []
        },
        items: {
          recipes: [],
          items: {},
          fragments: []
        },
        atlas: {
          slots: [],
          centerSlot: null
        },
        tasks: {
          tasks: []
        }
      };

      _export("ConfigLoader", ConfigLoader = class ConfigLoader {
        static loadFromObject(data) {
          var cfg = data || fallbackConfig;
          return new (_crd && ConfigRepository === void 0 ? (_reportPossibleCrUseOfConfigRepository({
            error: Error()
          }), ConfigRepository) : ConfigRepository)(cfg);
        }

      });

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=c6525daf04e4d5ca989932f8760792c2effdc5fd.js.map