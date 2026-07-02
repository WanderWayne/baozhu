System.register(["cc"], function (_export, _context) {
  "use strict";

  var _cclegacy, SceneRouter, _crd;

  function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

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

        navigate(scene, state) {
          if (state === void 0) {
            state = {};
          }

          this.current = scene;
          this.routeState = _extends({}, state);
          this.listeners.forEach(listener => listener(scene, this.routeState));
        }

        getCurrentScene() {
          return this.current;
        }

        getState() {
          return _extends({}, this.routeState);
        }

      });

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=9dd8450393783ea98bd2c06ab222cceb18062204.js.map