System.register(["__unresolved_0", "cc"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, MemoryStorageAdapter, WechatStorageAdapter, _crd;

  function _reportPossibleCrUseOfIStorageAdapter(extras) {
    _reporterNs.report("IStorageAdapter", "../core/ProgressService", _context.meta, extras);
  }

  _export({
    MemoryStorageAdapter: void 0,
    WechatStorageAdapter: void 0
  });

  return {
    setters: [function (_unresolved_) {
      _reporterNs = _unresolved_;
    }, function (_cc) {
      _cclegacy = _cc.cclegacy;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "09920TGmEJM7Kc9NmKZRewH", "StorageAdapter", undefined);

      _export("MemoryStorageAdapter", MemoryStorageAdapter = class MemoryStorageAdapter {
        constructor() {
          this.store = new Map();
        }

        getString(key) {
          var _this$store$get;

          return (_this$store$get = this.store.get(key)) != null ? _this$store$get : null;
        }

        setString(key, value) {
          this.store.set(key, value);
        }

        remove(key) {
          this.store.delete(key);
        }

      });

      _export("WechatStorageAdapter", WechatStorageAdapter = class WechatStorageAdapter {
        getString(key) {
          try {
            var value = wx.getStorageSync(key);
            if (value === undefined || value === null || value === '') return null;
            return String(value);
          } catch (e) {
            return null;
          }
        }

        setString(key, value) {
          try {
            wx.setStorageSync(key, value);
          } catch (e) {// noop in early scaffold stage
          }
        }

        remove(key) {
          try {
            wx.removeStorageSync(key);
          } catch (e) {// noop in early scaffold stage
          }
        }

      });

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=409b7b2c0cd236a341336995c0a5dbda7739b1cf.js.map