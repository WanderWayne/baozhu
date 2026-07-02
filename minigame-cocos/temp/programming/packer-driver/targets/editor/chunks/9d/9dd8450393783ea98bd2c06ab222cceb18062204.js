System.register(["cc"], function (_export, _context) {
  "use strict";

  var _cclegacy, SceneRouter, _crd;

  _export("SceneRouter", void 0);

  return {
    setters: [function (_cc) {
      _cclegacy = _cc.cclegacy;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "14452NKj0RHhakbpn0fvexv", "SceneRouter", undefined);

      _export("SceneRouter", SceneRouter = class SceneRouter {
        constructor() {
          this.current = 'Boot';
          this.routeState = {};
          this.listeners = [];
        }

        onChange(listener) {
          this.listeners.push(listener);
        }

        navigate(scene, state = {}) {
          this.current = scene;
          this.routeState = { ...state
          };
          this.listeners.forEach(listener => listener(scene, this.routeState));
        }

        getCurrentScene() {
          return this.current;
        }

        getState() {
          return { ...this.routeState
          };
        }

      });

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=9dd8450393783ea98bd2c06ab222cceb18062204.js.map