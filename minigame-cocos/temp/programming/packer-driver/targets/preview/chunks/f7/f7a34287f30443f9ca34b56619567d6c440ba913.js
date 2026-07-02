System.register(["cc"], function (_export, _context) {
  "use strict";

  var _cclegacy, WechatAdapter, _crd;

  _export("WechatAdapter", void 0);

  return {
    setters: [function (_cc) {
      _cclegacy = _cc.cclegacy;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "2e2bf+RXddBMbthVASmY89W", "WechatAdapter", undefined);

      _export("WechatAdapter", WechatAdapter = class WechatAdapter {
        initLifecycleHooks() {
          if (!wx) return;
          wx.onShow == null || wx.onShow(payload => {
            console.log('[WechatAdapter] onShow', payload);
          });
          wx.onHide == null || wx.onHide(() => {
            console.log('[WechatAdapter] onHide');
          });
        }

        setShare(title, imageUrl) {
          var _wx;

          if (!((_wx = wx) != null && _wx.showShareMenu)) return;
          wx.showShareMenu({
            withShareTicket: true,
            menus: ['shareAppMessage', 'shareTimeline']
          });
          wx.onShareAppMessage == null || wx.onShareAppMessage(() => ({
            title,
            imageUrl
          }));
        }

      });

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=f7a34287f30443f9ca34b56619567d6c440ba913.js.map