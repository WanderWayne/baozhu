System.register(["__unresolved_0", "cc", "__unresolved_1"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, getGameContext, _dec, _class, _crd, ccclass, MenuGrowthSystem;

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

      _cclegacy._RF.push({}, "f6988go1FhGibvAkiey7Uh7", "MenuGrowthSystem", undefined);

      __checkObsolete__(['_decorator', 'Component']);

      ({
        ccclass
      } = _decorator);

      _export("MenuGrowthSystem", MenuGrowthSystem = (_dec = ccclass('MenuGrowthSystem'), _dec(_class = class MenuGrowthSystem extends Component {
        constructor(...args) {
          super(...args);
          this.stages = [{
            id: 'seed',
            name: '微光',
            minDiscovered: 0,
            progress: 15
          }, {
            id: 'sprout',
            name: '萌发',
            minDiscovered: 10,
            progress: 35
          }, {
            id: 'bloom',
            name: '开绽',
            minDiscovered: 25,
            progress: 65
          }, {
            id: 'ritual',
            name: '成章',
            minDiscovered: 45,
            progress: 100
          }];
        }

        getCurrentStage() {
          const discovered = (_crd && getGameContext === void 0 ? (_reportPossibleCrUseOfgetGameContext({
            error: Error()
          }), getGameContext) : getGameContext)().progress.snapshot().discoveredItems.length;
          let current = this.stages[0];
          this.stages.forEach(s => {
            if (discovered >= s.minDiscovered) current = s;
          });
          return current;
        }

      }) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=cc880d6bbc5fbba78add9e38173ff8ad4abb3f67.js.map