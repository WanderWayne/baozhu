System.register(["cc"], function (_export, _context) {
  "use strict";

  var _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, _dec, _class, _crd, ccclass, TutorialOverlay;

  return {
    setters: [function (_cc) {
      _cclegacy = _cc.cclegacy;
      __checkObsolete__ = _cc.__checkObsolete__;
      __checkObsoleteInNamespace__ = _cc.__checkObsoleteInNamespace__;
      _decorator = _cc._decorator;
      Component = _cc.Component;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "ac71dMAPYJDpLGLtywNCvxg", "TutorialOverlay", undefined);

      __checkObsolete__(['_decorator', 'Component']);

      ({
        ccclass
      } = _decorator);

      _export("TutorialOverlay", TutorialOverlay = (_dec = ccclass('TutorialOverlay'), _dec(_class = class TutorialOverlay extends Component {
        constructor(...args) {
          super(...args);
          this.shownKeys = new Set();
        }

        showOnce(key, message) {
          if (this.shownKeys.has(key)) return;
          this.shownKeys.add(key);
          console.log('[TutorialOverlay]', key, message);
        }

        reset() {
          this.shownKeys.clear();
        }

      }) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=3698bf2982a6da275b1771657f61429be0a1dcb2.js.map