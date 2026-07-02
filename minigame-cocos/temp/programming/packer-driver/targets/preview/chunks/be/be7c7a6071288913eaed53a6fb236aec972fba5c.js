System.register(["__unresolved_0", "cc"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, _crd, currentCtx;

  function setGameContext(ctx) {
    currentCtx = ctx;
  }

  function getGameContext() {
    if (!currentCtx) throw new Error('GameContext not initialized');
    return currentCtx;
  }

  function _reportPossibleCrUseOfConfigRepository(extras) {
    _reporterNs.report("ConfigRepository", "../data/ConfigRepository", _context.meta, extras);
  }

  function _reportPossibleCrUseOfProgressService(extras) {
    _reporterNs.report("ProgressService", "../core/ProgressService", _context.meta, extras);
  }

  function _reportPossibleCrUseOfRecipeEngine(extras) {
    _reporterNs.report("RecipeEngine", "../core/RecipeEngine", _context.meta, extras);
  }

  function _reportPossibleCrUseOfTaskService(extras) {
    _reporterNs.report("TaskService", "../core/TaskService", _context.meta, extras);
  }

  function _reportPossibleCrUseOfSceneRouter(extras) {
    _reporterNs.report("SceneRouter", "../runtime/SceneRouter", _context.meta, extras);
  }

  function _reportPossibleCrUseOfAudioService(extras) {
    _reporterNs.report("AudioService", "../runtime/AudioService", _context.meta, extras);
  }

  _export({
    setGameContext: setGameContext,
    getGameContext: getGameContext
  });

  return {
    setters: [function (_unresolved_) {
      _reporterNs = _unresolved_;
    }, function (_cc) {
      _cclegacy = _cc.cclegacy;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "94aed2LaBpO+Jx0E8hITuCT", "GameContext", undefined);

      currentCtx = null;

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=be7c7a6071288913eaed53a6fb236aec972fba5c.js.map