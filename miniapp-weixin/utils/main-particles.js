const BAOZHU_TITLE_CONFIG = {
  dotSize: { normal: 12, small: 8 },
  charGap: { normal: 30, small: 15 },
  textParticleSize: { normal: 8, small: 6 },
  /** 主界面标题纵向中心（相对屏高），比 H5 默认 0.28 上移约 15% */
  mainTitleCenterYRatio: 0.238,
  introTitleCenterYRatio: 0.442,
};

class MainParticleSystem {
  constructor(options) {
    this.canvas = options.canvas;
    this.ctx = options.ctx;
    this.logicalWidth = options.width;
    this.logicalHeight = options.height;
    this.growthSystem = options.growthSystem;
    this.onBackgroundColor = options.onBackgroundColor || (() => {});
    this.mode = options.mode || 'full'; // full | background | title
    this.titleCenterYRatio = options.titleCenterYRatio ?? BAOZHU_TITLE_CONFIG.mainTitleCenterYRatio;

    this.particles = [];
    this.textDotTargets = [];
    this.lastTime = 0;
    this.bubbles = [];
    this.goldenDust = [];
    this.warmGlows = [];
    this.textureParticles = [];
    this.spawnTimers = { bubble: 0 };
    this._rafId = null;
    this._destroyed = false;

    this.colors = {
      milkFoam: { r: 255, g: 253, b: 247 },
      riceWineGold: { r: 232, g: 200, b: 115 },
      dawnGold: { r: 240, g: 217, b: 160 },
      dawnPink: { r: 245, g: 230, b: 224 },
      oldWood: { r: 107, g: 83, b: 68 },
    };

    this.isSmallScreen = this.logicalWidth <= 450 && this.logicalHeight <= 950;
    const titleCfg = BAOZHU_TITLE_CONFIG;
    this.config = {
      textParticleSize: this.isSmallScreen ? titleCfg.textParticleSize.small : titleCfg.textParticleSize.normal,
    };

    this.centerX = this.logicalWidth / 2;
    this.centerY = this.logicalHeight / 2;
    if (this.mode !== 'background') {
      this.loadTextDots();
      this.createTextParticles();
    }
    if (this.mode !== 'title') {
      this.initFermentationSystem();
    }
  }

  start() {
    if (this._rafId != null) return;
    const loop = (time) => {
      if (this._destroyed) return;
      this.animate(time);
      this._rafId = this.canvas.requestAnimationFrame(loop);
    };
    this._rafId = this.canvas.requestAnimationFrame(loop);
  }

  destroy() {
    this._destroyed = true;
    if (this._rafId != null && this.canvas.cancelAnimationFrame) {
      this.canvas.cancelAnimationFrame(this._rafId);
    }
    this._rafId = null;
  }

  resize(width, height) {
    this.logicalWidth = width;
    this.logicalHeight = height;
    this.centerX = width / 2;
    this.centerY = height / 2;
    this.isSmallScreen = width <= 450 && height <= 950;
    if (this.mode !== 'background') {
      this.loadTextDots();
      this.reassignParticles();
    }
    if (this.mode !== 'title') {
      const params = this.getGrowthParams();
      this.initFermentationSystem();
      this.initTextureParticles(params.textureSpread);
    }
  }

  getGrowthParams() {
    if (this.growthSystem) {
      return {
        factor: this.growthSystem.getGrowthFactor(),
        bgColor: this.growthSystem.getBackgroundColor(),
        textColor: this.growthSystem.getTextColor(),
        glowColor: this.growthSystem.getGlowColor(),
        glowIntensity: this.growthSystem.getTextGlowIntensity(),
        textureSpread: this.growthSystem.getTextureSpread(),
        bubbleParams: this.growthSystem.getBubbleParams(),
        dustParams: this.growthSystem.getDustParams(),
        glowParams: this.growthSystem.getGlowParams(),
        showHint: this.growthSystem.shouldShowGrowthHint(),
      };
    }
    return {
      factor: 0,
      bgColor: this.colors.dawnPink,
      textColor: this.colors.oldWood,
      glowColor: this.colors.riceWineGold,
      glowIntensity: 0.05,
      textureSpread: 0.05,
      bubbleParams: { count: 8, goldRatio: 0.1, minSize: 2, maxSize: 8, minAlpha: 0.1, maxAlpha: 0.3, minSpeed: 0.2, maxSpeed: 0.5 },
      dustParams: { count: 20, minAlpha: 0.01, maxAlpha: 0.04 },
      glowParams: { count: 2, minAlpha: 0.01, maxAlpha: 0.02 },
      showHint: true,
    };
  }

  loadTextDots() {
    const dotMatrices = {
      宝: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 2, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
        [0, 0, 2, 2, 2, 2, 2, 0, 0, 0],
        [0, 0, 0, 0, 2, 0, 0, 0, 0, 0],
        [0, 0, 2, 2, 2, 2, 2, 0, 0, 0],
        [0, 0, 0, 0, 2, 0, 0, 0, 0, 0],
        [0, 2, 2, 2, 2, 2, 2, 2, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
      珠: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 1, 0, 0],
        [4, 4, 4, 0, 1, 0, 1, 0, 0],
        [0, 4, 0, 0, 1, 1, 1, 1, 0],
        [4, 4, 4, 0, 0, 0, 1, 0, 0],
        [0, 4, 0, 0, 1, 1, 1, 1, 1],
        [4, 4, 4, 0, 0, 3, 1, 0, 0],
        [0, 0, 0, 4, 1, 0, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
      奶: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 3, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 3, 0, 3, 2, 2, 2, 2, 0, 0],
        [3, 3, 3, 3, 3, 2, 0, 2, 0, 0],
        [0, 3, 0, 3, 0, 2, 0, 2, 2, 0],
        [0, 3, 0, 3, 0, 2, 0, 0, 2, 0],
        [0, 3, 0, 3, 0, 2, 0, 0, 2, 0],
        [0, 3, 3, 3, 3, 2, 0, 0, 2, 0],
        [0, 0, 0, 3, 0, 0, 0, 2, 2, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
      酪: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 0, 2, 0, 0, 0],
        [0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 2, 3, 4, -2, 0],
        [0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0],
        [0, 1, 1, 0, 1, 1, 2, 2, 0, 1, 1],
        [0, 1, 3, 3, 3, 1, 0, 3, 3, 3, 0],
        [0, 1, 0, 0, 0, 1, 0, 3, 0, 3, 0],
        [0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 0],
      ],
    };
    this.generateDotsFromMatrices(dotMatrices);
  }

  generateDotsFromMatrices(matrices) {
    const chars = ['宝', '珠', '奶', '酪'];
    const titleCfg = BAOZHU_TITLE_CONFIG;
    const dotSize = this.isSmallScreen ? titleCfg.dotSize.small : titleCfg.dotSize.normal;
    const charGap = this.isSmallScreen ? titleCfg.charGap.small : titleCfg.charGap.normal;
    const gridSize = 10;
    const charWidth = gridSize * dotSize;
    const charHeight = gridSize * dotSize;
    const totalWidth = 2 * charWidth + charGap;
    const totalHeight = 2 * charHeight + charGap;
    const startX = this.centerX - totalWidth / 2;
    const displayCenterY = this.logicalHeight * this.titleCenterYRatio;
    const startY = displayCenterY - totalHeight / 2;
    this.textDotTargets = [];

    chars.forEach((char, index) => {
      const matrix = matrices[char];
      if (!matrix) return;
      const rowIdx = Math.floor(index / 2);
      const colIdx = index % 2;
      const charOffsetX = startX + colIdx * (charWidth + charGap);
      const charOffsetY = startY + rowIdx * (charHeight + charGap);
      for (let row = 0; row < matrix.length; row += 1) {
        for (let col = 0; col < matrix[row].length; col += 1) {
          const val = matrix[row][col];
          if (val === 0) continue;
          let x = charOffsetX + col * dotSize;
          let y = charOffsetY + row * dotSize;
          if (val === 2) x += dotSize / 2;
          else if (val === 3) y += dotSize / 2;
          else if (val === 4) { x += dotSize / 2; y += dotSize / 2; }
          this.textDotTargets.push({ x, y });
        }
      }
    });
  }

  createTextParticles() {
    this.particles = this.textDotTargets.map((target) => ({
      x: target.x + (Math.random() - 0.5) * 200,
      y: target.y + (Math.random() - 0.5) * 200,
      targetX: target.x,
      targetY: target.y,
      size: this.config.textParticleSize,
      isTextDot: true,
      gathering: true,
      settled: false,
      breathPhase: Math.random() * Math.PI * 2,
      breathSpeed: 0.5 + Math.random() * 0.5,
    }));
  }

  reassignParticles() {
    const textParticles = this.particles.filter((p) => p.isTextDot);
    textParticles.forEach((p, i) => {
      if (i < this.textDotTargets.length) {
        p.targetX = this.textDotTargets[i].x;
        p.targetY = this.textDotTargets[i].y;
        p.gathering = true;
        p.settled = false;
      }
    });
  }

  initFermentationSystem() {
    const params = this.getGrowthParams();
    this.bubbles = [];
    for (let i = 0; i < params.bubbleParams.count; i += 1) {
      const bubble = this.createBubble(params.bubbleParams);
      bubble.y = Math.random() * this.logicalHeight;
      this.bubbles.push(bubble);
    }
    this.goldenDust = [];
    for (let i = 0; i < params.dustParams.count; i += 1) {
      this.goldenDust.push(this.createDust(params.dustParams));
    }
    this.warmGlows = [];
    for (let i = 0; i < params.glowParams.count; i += 1) {
      this.warmGlows.push(this.createGlow(params.glowParams));
    }
    this.initTextureParticles(params.textureSpread);
  }

  createBubble(params) {
    const isGold = Math.random() < params.goldRatio;
    const color = isGold ? this.colors.riceWineGold : this.colors.milkFoam;
    return {
      x: Math.random() * this.logicalWidth,
      y: this.logicalHeight + 30,
      size: params.minSize + Math.random() * (params.maxSize - params.minSize),
      speed: params.minSpeed + Math.random() * (params.maxSpeed - params.minSpeed),
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.008 + Math.random() * 0.015,
      wobbleAmount: 0.3 + Math.random() * 0.6,
      alpha: params.minAlpha + Math.random() * (params.maxAlpha - params.minAlpha),
      color,
    };
  }

  createDust(params) {
    const color = Math.random() > 0.3 ? this.colors.riceWineGold : this.colors.dawnGold;
    return {
      x: Math.random() * this.logicalWidth,
      y: Math.random() * this.logicalHeight,
      size: 0.5 + Math.random() * 2,
      alpha: params.minAlpha + Math.random() * (params.maxAlpha - params.minAlpha),
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.05 - 0.02,
      breathPhase: Math.random() * Math.PI * 2,
      breathSpeed: 0.003 + Math.random() * 0.006,
      color,
    };
  }

  createGlow(params) {
    const colors = [this.colors.riceWineGold, this.colors.dawnPink, this.colors.dawnGold];
    return {
      x: Math.random() * this.logicalWidth,
      y: Math.random() * this.logicalHeight,
      size: 100 + Math.random() * 150,
      alpha: params.minAlpha + Math.random() * (params.maxAlpha - params.minAlpha),
      vx: (Math.random() - 0.5) * 0.03,
      vy: (Math.random() - 0.5) * 0.02,
      breathPhase: Math.random() * Math.PI * 2,
      breathSpeed: 0.001 + Math.random() * 0.002,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
  }

  initTextureParticles(spread) {
    this.textureParticles = [];
    const centerX = this.logicalWidth / 2;
    const baseY = this.logicalHeight;
    const maxRadius = Math.max(this.logicalWidth, this.logicalHeight) * spread;
    const particleCount = Math.round(50 + spread * 200);
    for (let i = 0; i < particleCount; i += 1) {
      const angle = Math.random() * Math.PI;
      const distance = Math.random() * maxRadius;
      const gaussianDistance = distance * Math.pow(Math.random(), 0.7);
      const x = centerX + Math.cos(angle - Math.PI / 2) * gaussianDistance * 1.5;
      const y = baseY - Math.sin(angle) * gaussianDistance;
      if (y < 0 || y > this.logicalHeight || x < 0 || x > this.logicalWidth) continue;
      const distanceRatio = gaussianDistance / maxRadius;
      const baseAlpha = 0.03 + (1 - distanceRatio) * 0.08;
      this.textureParticles.push({
        x, y,
        size: 2 + Math.random() * 6,
        alpha: baseAlpha * (0.5 + Math.random() * 0.5),
        breathPhase: Math.random() * Math.PI * 2,
        breathSpeed: 0.002 + Math.random() * 0.004,
        color: Math.random() > 0.6 ? this.colors.riceWineGold : this.colors.milkFoam,
      });
    }
  }

  animate(time = 0) {
    const dt = time - this.lastTime;
    this.lastTime = time;
    const params = this.getGrowthParams();

    if (this.mode !== 'title') {
      const bg = params.bgColor;
      this.onBackgroundColor(`rgb(${bg.r}, ${bg.g}, ${bg.b})`);
    }

    this.ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);

    if (this.mode !== 'title') {
      this.updateGlows();
      this.updateDust();
      this.updateBubbles(dt, params.bubbleParams);
      this.updateTextureParticles();
      this.drawGlows();
      this.drawTextureParticles();
      this.drawGrowthHint(params.showHint);
      this.drawDust();
      this.drawBubbles();
    }

    if (this.mode !== 'background') {
      this.updateTextParticles(dt);
      this.drawTextParticles(params);
    }
  }

  updateBubbles(dt, params) {
    this.spawnTimers.bubble += dt;
    if (this.spawnTimers.bubble > 1000 && this.bubbles.length < params.count) {
      this.bubbles.push(this.createBubble(params));
      this.spawnTimers.bubble = 0;
    }
    this.bubbles.forEach((b) => {
      b.y -= b.speed;
      b.wobblePhase += b.wobbleSpeed;
      b.x += Math.sin(b.wobblePhase) * b.wobbleAmount;
      if (b.y < 80) b.alpha *= 0.97;
    });
    this.bubbles = this.bubbles.filter((b) => b.y > -30 && b.alpha > 0.02);
  }

  updateDust() {
    this.goldenDust.forEach((d) => {
      d.x += d.vx;
      d.y += d.vy;
      d.breathPhase += d.breathSpeed;
      if (d.x < -20) d.x = this.logicalWidth + 20;
      if (d.x > this.logicalWidth + 20) d.x = -20;
      if (d.y < -20) d.y = this.logicalHeight + 20;
      if (d.y > this.logicalHeight + 20) d.y = -20;
    });
  }

  updateGlows() {
    this.warmGlows.forEach((g) => {
      g.x += g.vx;
      g.y += g.vy;
      g.breathPhase += g.breathSpeed;
      if (g.x < -g.size / 2 || g.x > this.logicalWidth + g.size / 2) g.vx *= -1;
      if (g.y < -g.size / 2 || g.y > this.logicalHeight + g.size / 2) g.vy *= -1;
    });
  }

  updateTextureParticles() {
    this.textureParticles.forEach((t) => { t.breathPhase += t.breathSpeed; });
  }

  updateTextParticles(dt) {
    this.particles.forEach((p) => {
      if (!p.isTextDot) return;
      if (p.gathering && p.targetX != null) {
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 1) {
          const speed = Math.max(dist * 0.05, 1);
          p.x += (dx / dist) * speed;
          p.y += (dy / dist) * speed;
        } else {
          p.x = p.targetX;
          p.y = p.targetY;
          p.settled = true;
          p.gathering = false;
        }
      }
      if (p.settled) {
        p.breathPhase += p.breathSpeed * 0.02;
        p.visualSize = p.size * (1 + Math.sin(p.breathPhase) * 0.08);
      } else {
        p.visualSize = p.size;
      }
    });
  }

  drawBubbles() {
    this.bubbles.forEach((b) => {
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${b.color.r}, ${b.color.g}, ${b.color.b}, ${b.alpha})`;
      this.ctx.fill();
    });
  }

  drawDust() {
    this.goldenDust.forEach((d) => {
      const breathAlpha = d.alpha * (0.6 + Math.sin(d.breathPhase) * 0.4);
      this.ctx.beginPath();
      this.ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${d.color.r}, ${d.color.g}, ${d.color.b}, ${breathAlpha})`;
      this.ctx.fill();
    });
  }

  drawGlows() {
    this.warmGlows.forEach((g) => {
      const breathAlpha = g.alpha * (0.7 + Math.sin(g.breathPhase) * 0.3);
      const gradient = this.ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.size);
      gradient.addColorStop(0, `rgba(${g.color.r}, ${g.color.g}, ${g.color.b}, ${breathAlpha})`);
      gradient.addColorStop(0.4, `rgba(${g.color.r}, ${g.color.g}, ${g.color.b}, ${breathAlpha * 0.5})`);
      gradient.addColorStop(1, 'transparent');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(g.x - g.size, g.y - g.size, g.size * 2, g.size * 2);
    });
  }

  drawTextureParticles() {
    this.textureParticles.forEach((t) => {
      const breathAlpha = t.alpha * (0.7 + Math.sin(t.breathPhase) * 0.3);
      this.ctx.beginPath();
      this.ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${t.color.r}, ${t.color.g}, ${t.color.b}, ${breathAlpha})`;
      this.ctx.fill();
    });
  }

  drawGrowthHint(showHint) {
    if (!showHint) return;
    const centerX = this.logicalWidth / 2;
    const baseY = this.logicalHeight;
    const maxRadius = Math.max(this.logicalWidth, this.logicalHeight) * 0.6;
    this.ctx.beginPath();
    this.ctx.ellipse(centerX, baseY, maxRadius * 1.2, maxRadius * 0.8, 0, Math.PI, 0);
    this.ctx.setLineDash([5, 10]);
    this.ctx.strokeStyle = `rgba(${this.colors.riceWineGold.r}, ${this.colors.riceWineGold.g}, ${this.colors.riceWineGold.b}, 0.05)`;
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  settleTitleParticles() {
    this.particles.forEach((p, i) => {
      if (!p.isTextDot || !this.textDotTargets[i]) return;
      p.x = this.textDotTargets[i].x;
      p.y = this.textDotTargets[i].y;
      p.targetX = p.x;
      p.targetY = p.y;
      p.gathering = false;
      p.settled = true;
    });
  }

  upgradeToFullMode(options = {}) {
    if (this.mode === 'full') return;
    this.mode = 'full';
    if (!options.keepTitleLayout) {
      this.titleCenterYRatio = BAOZHU_TITLE_CONFIG.mainTitleCenterYRatio;
      this.loadTextDots();
      const textParticles = this.particles.filter((p) => p.isTextDot);
      textParticles.forEach((p, i) => {
        if (i >= this.textDotTargets.length) return;
        p.targetX = this.textDotTargets[i].x;
        p.targetY = this.textDotTargets[i].y;
        p.x = p.targetX;
        p.y = p.targetY;
        p.gathering = false;
        p.settled = true;
      });
    }
    this.initFermentationSystem();
  }

  drawTextParticles(params) {
    const { textColor, glowColor, glowIntensity } = params;
    this.particles.forEach((p) => {
      if (!p.isTextDot) return;
      const radius = p.visualSize || p.size;
      if (glowIntensity > 0.02) {
        const glowRadius = radius * (2 + glowIntensity * 3);
        const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);
        gradient.addColorStop(0, `rgba(${glowColor.r}, ${glowColor.g}, ${glowColor.b}, ${glowIntensity})`);
        gradient.addColorStop(0.5, `rgba(${glowColor.r}, ${glowColor.g}, ${glowColor.b}, ${glowIntensity * 0.3})`);
        gradient.addColorStop(1, 'transparent');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(p.x - glowRadius, p.y - glowRadius, glowRadius * 2, glowRadius * 2);
      }
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgb(${textColor.r}, ${textColor.g}, ${textColor.b})`;
      this.ctx.fill();
    });
  }
}

module.exports = MainParticleSystem;
module.exports.BAOZHU_TITLE_CONFIG = BAOZHU_TITLE_CONFIG;
