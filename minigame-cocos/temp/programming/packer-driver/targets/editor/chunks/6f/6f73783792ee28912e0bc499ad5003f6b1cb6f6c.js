System.register(["__unresolved_0", "cc", "__unresolved_1", "__unresolved_2"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, ProgressService, MemoryStorageAdapter, _crd;

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function runProgressServiceSpec() {
    const storage = new (_crd && MemoryStorageAdapter === void 0 ? (_reportPossibleCrUseOfMemoryStorageAdapter({
      error: Error()
    }), MemoryStorageAdapter) : MemoryStorageAdapter)();
    const svc = new (_crd && ProgressService === void 0 ? (_reportPossibleCrUseOfProgressService({
      error: Error()
    }), ProgressService) : ProgressService)(storage, ['ch1_main', 'ch1_secret', 'center']);
    assert(svc.markLevelComplete(101), 'complete level should return true first time');
    assert(!svc.markLevelComplete(101), 'complete level should dedupe');
    svc.discoverItem('甜牛奶');
    svc.unlockAtlasPiece('ch1_main');
    svc.unlockAtlasPiece('center');
    const atlas = svc.getAtlasProgress();
    assert(atlas.unlocked === 2 && atlas.total === 3, 'atlas progress mismatch');
  }

  function _reportPossibleCrUseOfProgressService(extras) {
    _reporterNs.report("ProgressService", "../core/ProgressService", _context.meta, extras);
  }

  function _reportPossibleCrUseOfMemoryStorageAdapter(extras) {
    _reporterNs.report("MemoryStorageAdapter", "../runtime/StorageAdapter", _context.meta, extras);
  }

  _export("runProgressServiceSpec", runProgressServiceSpec);

  return {
    setters: [function (_unresolved_) {
      _reporterNs = _unresolved_;
    }, function (_cc) {
      _cclegacy = _cc.cclegacy;
    }, function (_unresolved_2) {
      ProgressService = _unresolved_2.ProgressService;
    }, function (_unresolved_3) {
      MemoryStorageAdapter = _unresolved_3.MemoryStorageAdapter;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "e6dd5jMecBGlJZTl9sm3Zsr", "ProgressService.spec", undefined);

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=6f73783792ee28912e0bc499ad5003f6b1cb6f6c.js.map