System.register(["cc"], function (_export, _context) {
  "use strict";

  var _cclegacy, _crd, resourcePolicy;

  return {
    setters: [function (_cc) {
      _cclegacy = _cc.cclegacy;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "c8922FZxKlGM5wqErlmHLzo", "ResourcePolicy", undefined);

      _export("resourcePolicy", resourcePolicy = {
        critical: ['config/game-config', 'ui/common/button', 'ui/common/panel'],
        chapter1: ['chapter1/scene', 'chapter1/items', 'chapter1/effects'],
        codex: ['codex/scene', 'codex/icons'],
        gallery: ['gallery/scene', 'gallery/fragments'],
        audio: ['audio/bgm_menu', 'audio/sfx_click', 'audio/sfx_success']
      });

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=99b5818d99ecd48e376ba934d9d2d0593a9556fd.js.map