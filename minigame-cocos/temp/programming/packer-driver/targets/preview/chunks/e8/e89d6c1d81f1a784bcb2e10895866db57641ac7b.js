System.register(["__unresolved_0", "cc", "__unresolved_1"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, getGameContext, _dec, _class, _crd, ccclass, MenuScene;

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

      _cclegacy._RF.push({}, "75eb39UBoJBZ6a6Ld+fJsZN", "MenuScene", undefined);

      __checkObsolete__(['_decorator', 'Component']);

      ({
        ccclass
      } = _decorator);

      _export("MenuScene", MenuScene = (_dec = ccclass('MenuScene'), _dec(_class = class MenuScene extends Component {
        onEnable() {
          var {
            router
          } = (_crd && getGameContext === void 0 ? (_reportPossibleCrUseOfgetGameContext({
            error: Error()
          }), getGameContext) : getGameContext)();
          router.onChange(scene => {
            if (scene === 'Menu') this.render();
          });
        }

        render() {
          var ctx = (_crd && getGameContext === void 0 ? (_reportPossibleCrUseOfgetGameContext({
            error: Error()
          }), getGameContext) : getGameContext)();
          var state = ctx.progress.snapshot();
          var atlas = ctx.progress.getAtlasProgress();
          var fragment = ctx.progress.getFragmentProgress(ctx.config.getFragments().length);
          var taskProgress = ctx.tasks.evaluate(state);
          console.log('[MenuScene] progress', {
            atlas,
            fragment,
            taskProgress
          });
        }

        onTapStart() {
          (_crd && getGameContext === void 0 ? (_reportPossibleCrUseOfgetGameContext({
            error: Error()
          }), getGameContext) : getGameContext)().router.navigate('Levels');
        }

        onTapCodex() {
          (_crd && getGameContext === void 0 ? (_reportPossibleCrUseOfgetGameContext({
            error: Error()
          }), getGameContext) : getGameContext)().router.navigate('Codex');
        }

        onTapGallery() {
          (_crd && getGameContext === void 0 ? (_reportPossibleCrUseOfgetGameContext({
            error: Error()
          }), getGameContext) : getGameContext)().router.navigate('Gallery');
        }

      }) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=e89d6c1d81f1a784bcb2e10895866db57641ac7b.js.map