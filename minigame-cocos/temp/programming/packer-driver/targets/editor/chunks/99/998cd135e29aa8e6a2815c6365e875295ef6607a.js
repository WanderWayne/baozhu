System.register(["cc"], function (_export, _context) {
  "use strict";

  var _cclegacy, AudioService, _crd;

  _export("AudioService", void 0);

  return {
    setters: [function (_cc) {
      _cclegacy = _cc.cclegacy;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "14817l5roRIyYT+uyBaII3N", "AudioService", undefined);

      _export("AudioService", AudioService = class AudioService {
        constructor(audioMap) {
          this.bgm = null;
          this.sfxVolume = 0.8;
          this.bgmVolume = 0.8;
          this.map = void 0;
          this.map = audioMap;
        }

        playBgm(key) {
          var _wx;

          const src = this.map[key];
          if (!src || !((_wx = wx) != null && _wx.createInnerAudioContext)) return;

          if (this.bgm) {
            this.bgm.stop();
            this.bgm.destroy();
          }

          this.bgm = wx.createInnerAudioContext();
          this.bgm.src = src;
          this.bgm.loop = true;
          this.bgm.volume = this.bgmVolume;
          this.bgm.play();
        }

        stopBgm() {
          if (!this.bgm) return;
          this.bgm.stop();
        }

        playSfx(key) {
          var _wx2;

          const src = this.map[key];
          if (!src || !((_wx2 = wx) != null && _wx2.createInnerAudioContext)) return;
          const sfx = wx.createInnerAudioContext();
          sfx.src = src;
          sfx.volume = this.sfxVolume;
          sfx.play();
          sfx.onEnded(() => sfx.destroy());
        }

        setBgmVolume(v) {
          this.bgmVolume = Math.max(0, Math.min(1, v));
          if (this.bgm) this.bgm.volume = this.bgmVolume;
        }

        setSfxVolume(v) {
          this.sfxVolume = Math.max(0, Math.min(1, v));
        }

      });

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=998cd135e29aa8e6a2815c6365e875295ef6607a.js.map