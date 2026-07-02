System.register(["cc"], function (_export, _context) {
  "use strict";

  var _cclegacy, PerformanceProfiler, _crd;

  _export("PerformanceProfiler", void 0);

  return {
    setters: [function (_cc) {
      _cclegacy = _cc.cclegacy;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "e9627spS8VEtobI/nnz4/l9", "PerformanceProfiler", undefined);

      _export("PerformanceProfiler", PerformanceProfiler = class PerformanceProfiler {
        constructor(maxSamples = 240) {
          this.samples = [];
          this.maxSamples = void 0;
          this.maxSamples = maxSamples;
        }

        record(deltaMs) {
          this.samples.push({
            timestamp: Date.now(),
            deltaMs
          });
          if (this.samples.length > this.maxSamples) this.samples.shift();
        }

        getAverageFps() {
          if (!this.samples.length) return 0;
          const avgDelta = this.samples.reduce((sum, s) => sum + s.deltaMs, 0) / this.samples.length;
          if (avgDelta <= 0) return 0;
          return 1000 / avgDelta;
        }

      });

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=794db8f5c5ca13c3c1bc2d86f6bbfb82150f8df4.js.map