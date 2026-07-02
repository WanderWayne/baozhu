System.register(["__unresolved_0", "cc", "__unresolved_1"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, getGameContext, _dec, _class, _crd, ccclass, GalleryScene;

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

      _cclegacy._RF.push({}, "51224UGnuZNpK8wPsInT7zN", "GalleryScene", undefined);

      __checkObsolete__(['_decorator', 'Component']);

      ({
        ccclass
      } = _decorator);

      _export("GalleryScene", GalleryScene = (_dec = ccclass('GalleryScene'), _dec(_class = class GalleryScene extends Component {
        onEnable() {
          (_crd && getGameContext === void 0 ? (_reportPossibleCrUseOfgetGameContext({
            error: Error()
          }), getGameContext) : getGameContext)().router.onChange(scene => {
            if (scene === 'Gallery') this.render();
          });
        }

        render() {
          var ctx = (_crd && getGameContext === void 0 ? (_reportPossibleCrUseOfgetGameContext({
            error: Error()
          }), getGameContext) : getGameContext)();
          var state = ctx.progress.snapshot();
          var fragments = ctx.config.getFragments();
          var unlocked = fragments.filter(f => state.fragments.includes(f.id)).length;
          console.log('[GalleryScene]', {
            unlocked,
            total: fragments.length
          });
        }

      }) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=c5a15b753ab0f0aa5131f095b753107d0fe32453.js.map