const meta = require('../data/meta.js');
const levelManager = require('./level-manager');

class GrowthSystem {
  constructor() {
    this.colors = {
      dawnPink: { r: 245, g: 230, b: 224 },
      riceWineGold: { r: 232, g: 200, b: 115 },
      dawnGold: { r: 240, g: 217, b: 160 },
      oldWood: { r: 107, g: 83, b: 68 },
      yeastBeige: { r: 245, g: 240, b: 230 },
    };
  }

  calculateGrowthProgress() {
    const progress = levelManager.currentProgress;
    const weights = { levels: 0.4, items: 0.3, fragments: 0.3 };

    const totalLevels = meta.levelTotal || 20;
    const completedLevels = progress.completedLevels?.length || 0;
    const levelProgress = Math.min(completedLevels / totalLevels, 1);

    const totalItems = meta.itemTotal || 50;
    const discoveredItems = progress.discoveredItems?.length || 0;
    const itemProgress = Math.min(discoveredItems / totalItems, 1);

    const totalFragments = meta.fragmentTotal || 16;
    const collectedFragments = progress.fragments?.length || 0;
    const fragmentProgress = Math.min(collectedFragments / totalFragments, 1);

    return Math.round(
      (levelProgress * weights.levels + itemProgress * weights.items + fragmentProgress * weights.fragments) * 100,
    );
  }

  getGrowthFactor() {
    return this.calculateGrowthProgress() / 100;
  }

  lerpColor(color1, color2, t) {
    return {
      r: Math.round(color1.r + (color2.r - color1.r) * t),
      g: Math.round(color1.g + (color2.g - color1.g) * t),
      b: Math.round(color1.b + (color2.b - color1.b) * t),
    };
  }

  getBackgroundColor() {
    const factor = this.getGrowthFactor();
    if (factor < 0.5) {
      const t = factor / 0.5;
      return this.lerpColor(this.colors.dawnPink, this.colors.yeastBeige, t);
    }
    const t = (factor - 0.5) / 0.5;
    const warmBeige = this.lerpColor(this.colors.yeastBeige, this.colors.dawnGold, 0.2);
    return this.lerpColor(this.colors.yeastBeige, warmBeige, t);
  }

  getTextColor() {
    return this.colors.oldWood;
  }

  getGlowColor() {
    return this.colors.riceWineGold;
  }

  getTextGlowIntensity() {
    return 0.05 + this.getGrowthFactor() * 0.55;
  }

  getTextureSpread() {
    return 0.05 + this.getGrowthFactor() * 0.9;
  }

  getBubbleParams() {
    const factor = this.getGrowthFactor();
    return {
      count: Math.round(8 + factor * 22),
      goldRatio: 0.1 + factor * 0.5,
      minSize: 2 + factor * 1,
      maxSize: 8 + factor * 4,
      minAlpha: 0.1 + factor * 0.1,
      maxAlpha: 0.3 + factor * 0.2,
      minSpeed: 0.2,
      maxSpeed: 0.5 + factor * 0.3,
    };
  }

  getDustParams() {
    const factor = this.getGrowthFactor();
    return {
      count: Math.round(20 + factor * 40),
      minAlpha: 0.01 + factor * 0.02,
      maxAlpha: 0.04 + factor * 0.06,
    };
  }

  getGlowParams() {
    const factor = this.getGrowthFactor();
    return {
      count: Math.round(2 + factor * 4),
      minAlpha: 0.01 + factor * 0.02,
      maxAlpha: 0.02 + factor * 0.03,
    };
  }

  shouldShowGrowthHint() {
    return this.calculateGrowthProgress() < 20;
  }

  getBackgroundRgbString() {
    const bg = this.getBackgroundColor();
    return `rgb(${bg.r}, ${bg.g}, ${bg.b})`;
  }
}

module.exports = new GrowthSystem();
