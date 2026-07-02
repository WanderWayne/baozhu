export interface FrameSample {
  timestamp: number;
  deltaMs: number;
}

export class PerformanceProfiler {
  private samples: FrameSample[] = [];
  private readonly maxSamples: number;

  constructor(maxSamples = 240) {
    this.maxSamples = maxSamples;
  }

  record(deltaMs: number): void {
    this.samples.push({ timestamp: Date.now(), deltaMs });
    if (this.samples.length > this.maxSamples) this.samples.shift();
  }

  getAverageFps(): number {
    if (!this.samples.length) return 0;
    const avgDelta = this.samples.reduce((sum, s) => sum + s.deltaMs, 0) / this.samples.length;
    if (avgDelta <= 0) return 0;
    return 1000 / avgDelta;
  }
}

