System.register(["__unresolved_0", "cc", "__unresolved_1"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, getGameContext, _dec, _class, _crd, ccclass, LevelsScene;

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

      _cclegacy._RF.push({}, "abe8acyzqxAvppyGpbabl/5", "LevelsScene", undefined);

      __checkObsolete__(['_decorator', 'Component']);

      ({
        ccclass
      } = _decorator);

      _export("LevelsScene", LevelsScene = (_dec = ccclass('LevelsScene'), _dec(_class = class LevelsScene extends Component {
        constructor(...args) {
          super(...args);
          this.currentWorldId = 1;
        }

        onEnable() {
          (_crd && getGameContext === void 0 ? (_reportPossibleCrUseOfgetGameContext({
            error: Error()
          }), getGameContext) : getGameContext)().router.onChange(scene => {
            if (scene === 'Levels') this.renderWorld(this.currentWorldId);
          });
        }

        renderWorld(worldId) {
          this.currentWorldId = worldId;
          const ctx = (_crd && getGameContext === void 0 ? (_reportPossibleCrUseOfgetGameContext({
            error: Error()
          }), getGameContext) : getGameContext)();
          const levels = ctx.config.getLevels().filter(l => l.worldId === worldId);
          const worlds = ctx.config.getWorlds().map(w => ({
            id: w.id,
            levels: w.levels || []
          }));
          const levelStates = levels.map(l => ({
            id: l.id,
            unlocked: ctx.progress.isLevelUnlocked(l.id, ctx.config.getLevels().map(lv => ({
              id: lv.id,
              worldId: lv.worldId
            })), worlds),
            completed: ctx.progress.snapshot().completedLevels.includes(l.id)
          }));
          console.log('[LevelsScene] world levels', worldId, levelStates);
        }

        enterLevel(levelId) {
          (_crd && getGameContext === void 0 ? (_reportPossibleCrUseOfgetGameContext({
            error: Error()
          }), getGameContext) : getGameContext)().router.navigate('Game', {
            levelId
          });
        }

      }) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=bf18450a370b871703f99022d674547cff945e44.js.map