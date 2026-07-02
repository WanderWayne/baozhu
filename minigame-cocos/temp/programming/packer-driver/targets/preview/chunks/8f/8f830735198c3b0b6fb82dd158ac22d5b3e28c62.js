System.register(["__unresolved_0", "cc", "__unresolved_1"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, getGameContext, _dec, _class, _crd, ccclass, IntroScene;

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

      _cclegacy._RF.push({}, "842c36LbUpLII1F9rZ5/jfa", "IntroScene", undefined);

      __checkObsolete__(['_decorator', 'Component']);

      ({
        ccclass
      } = _decorator);

      _export("IntroScene", IntroScene = (_dec = ccclass('IntroScene'), _dec(_class = class IntroScene extends Component {
        constructor() {
          super(...arguments);
          this.played = false;
        }

        onEnable() {
          var {
            router
          } = (_crd && getGameContext === void 0 ? (_reportPossibleCrUseOfgetGameContext({
            error: Error()
          }), getGameContext) : getGameContext)();
          router.onChange(scene => {
            if (scene === 'Intro') this.playIntro();
          });
          this.playIntro();
        }

        playIntro() {
          if (this.played) return;
          this.played = true;
          console.log('[IntroScene] play intro sequence'); // Intro scaffold: immediately continue; replace with timeline animation later.

          (_crd && getGameContext === void 0 ? (_reportPossibleCrUseOfgetGameContext({
            error: Error()
          }), getGameContext) : getGameContext)().router.navigate('Menu');
        }

      }) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=8f830735198c3b0b6fb82dd158ac22d5b3e28c62.js.map