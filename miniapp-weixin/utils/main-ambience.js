const { drawDecorElements } = require('./main-ambience-decor');

class MainAmbience {
  constructor(options) {
    this.canvas = options.canvas;
    this.ctx = options.ctx;
    this.logicalWidth = options.width;
    this.logicalHeight = options.height;
    this.fadeInMs = typeof options.fadeInMs === 'number' ? options.fadeInMs : 0;
    this.deferFadeIn = !!options.deferFadeIn;
    this.onOpacityChange = options.onOpacityChange || (() => {});

    this.warmGlows = [];
    this.fermentBubbles = [];
    this.goldenDust = [];
    this.mistLayers = [];
    this.lightBeams = [];
    this.decorElements = [];
    this.heavyMist = null;
    this.frontBottomMist = null;
    this.isActive = false;
    this._rafId = null;
    this._destroyed = false;
    this._opacity = 1;
  }

  init() {
    this.createWarmGlows();
    this.createFermentBubbles();
    this.createGoldenDust();
    this.createMistLayers();
    this.createLightBeams();
    this.createDecorElements();
    this.createHeavyMist();
    this.createFrontBottomMist();

    this.isActive = true;
    this.start();

    if (this.deferFadeIn) {
      this.setOpacity(0);
    } else if (this.fadeInMs > 0) {
      this.setOpacity(0);
      this.fadeInCanvas(this.fadeInMs);
    } else {
      this.setOpacity(1);
    }
  }

  setOpacity(value) {
    this._opacity = value;
    this.onOpacityChange(value);
  }

  fadeInCanvas(durationMs = 1400) {
    this.setOpacity(0);
    const start = Date.now();
    const tick = () => {
      if (this._destroyed) return;
      const t = Math.min((Date.now() - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      this.setOpacity(eased);
      if (t < 1) setTimeout(tick, 16);
    };
    setTimeout(tick, 32);
  }

  start() {
    if (this._rafId != null) return;
    const loop = () => {
      if (this._destroyed || !this.isActive) return;
      this.animate();
      this._rafId = this.canvas.requestAnimationFrame(loop);
    };
    this._rafId = this.canvas.requestAnimationFrame(loop);
  }

  destroy() {
    this._destroyed = true;
    this.isActive = false;
    if (this._rafId != null && this.canvas.cancelAnimationFrame) {
      this.canvas.cancelAnimationFrame(this._rafId);
    }
    this._rafId = null;
  }

  resize(width, height) {
    this.logicalWidth = width;
    this.logicalHeight = height;
    this.decorElements = [];
    this.createDecorElements();
    this.createHeavyMist();
    this.createFrontBottomMist();
    this.createLightBeams();
  }

  createWarmGlows() {
    const colors = [
      { r: 245, g: 230, b: 224 },
      { r: 240, g: 217, b: 160 },
      { r: 232, g: 200, b: 115 },
    ];
    this.warmGlows = [];
    for (let i = 0; i < 5; i += 1) {
      this.warmGlows.push({
        x: Math.random() * this.logicalWidth,
        y: Math.random() * this.logicalHeight,
        size: 150 + Math.random() * 200,
        alpha: 0.08 + Math.random() * 0.12,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.2,
        breathPhase: Math.random() * Math.PI * 2,
        breathSpeed: 0.003 + Math.random() * 0.005,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  createFermentBubbles() {
    this.fermentBubbles = [];
    for (let i = 0; i < 25; i += 1) {
      this.fermentBubbles.push(this.createBubble());
    }
  }

  createBubble() {
    return {
      x: Math.random() * this.logicalWidth,
      y: this.logicalHeight + Math.random() * 100,
      size: 2 + Math.random() * 6,
      speed: 0.2 + Math.random() * 0.4,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.03,
      wobbleAmount: 0.5 + Math.random() * 1.5,
      alpha: 0.2 + Math.random() * 0.3,
      isGold: Math.random() < 0.4,
    };
  }

  createGoldenDust() {
    this.goldenDust = [];
    for (let i = 0; i < 80; i += 1) {
      this.goldenDust.push({
        x: Math.random() * this.logicalWidth,
        y: Math.random() * this.logicalHeight,
        size: 0.5 + Math.random() * 2,
        alpha: 0.1 + Math.random() * 0.3,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -0.05 - Math.random() * 0.1,
        breathPhase: Math.random() * Math.PI * 2,
        breathSpeed: 0.01 + Math.random() * 0.02,
        isGold: Math.random() > 0.3,
      });
    }
  }

  createMistLayers() {
    this.mistLayers = [];
    for (let i = 0; i < 5; i += 1) {
      this.mistLayers.push({
        y: this.logicalHeight - 40 - i * 45,
        height: 60 + Math.random() * 50,
        alpha: 0.1 + i * 0.02,
        offset: Math.random() * 1000,
        speed: 0.3 + Math.random() * 0.4,
        waveFreq: 0.004 + Math.random() * 0.003,
      });
    }
  }

  createLightBeams() {
    this.lightBeams = [];
    for (let i = 0; i < 3; i += 1) {
      this.lightBeams.push({
        startX: this.logicalWidth * (0.55 + i * 0.2),
        startY: -50,
        angle: Math.PI * 0.65 + (Math.random() - 0.5) * 0.1,
        width: 40 + Math.random() * 60,
        length: this.logicalHeight * 1.3,
        alpha: 0.08 + Math.random() * 0.1,
        breathPhase: Math.random() * Math.PI * 2,
        breathSpeed: 0.003 + Math.random() * 0.004,
      });
    }
  }

  createHeavyMist() {
    this.heavyMist = {
      y: this.logicalHeight - 120,
      height: 120,
      offset: 0,
      speed: 0.15,
    };
  }

  createDecorElements() {
    const w = this.logicalWidth;
    const h = this.logicalHeight;
    this.decorElements = [];
    const wheatTypes = ['wheat1', 'wheat2', 'wheat3'];
    const gap = 11;
    const totalWheat = Math.ceil(w / gap) + 12;

    for (let i = -6; i < totalWheat; i += 1) {
      const designH = 212 + Math.random() * 48;
      const height = designH * (0.74 + Math.random() * 0.58);
      const extendBelow = 22 + Math.random() * 78;
      const xPos = i * gap + (Math.random() - 0.5) * 26;
      const yPos = h + extendBelow - height;

      this.decorElements.push({
        layer: 'back',
        type: wheatTypes[Math.floor(Math.random() * wheatTypes.length)],
        x: xPos,
        y: yPos,
        width: 52 + Math.random() * 58,
        height,
        designH,
        alpha: 0.22 + Math.random() * 0.38,
        rotation: (Math.random() - 0.5) * 0.28,
        breathPhase: Math.random() * Math.PI * 2,
        breathSpeed: 0.002 + Math.random() * 0.004,
      });
    }
  }

  createFrontBottomMist() {
    this.frontBottomMist = {
      y: this.logicalHeight - 88,
      offset: Math.random() * 800,
      speed: 0.11,
    };
  }

  update() {
    this.warmGlows.forEach((g) => {
      g.x += g.vx;
      g.y += g.vy;
      g.breathPhase += g.breathSpeed;
      if (g.x < -g.size || g.x > this.logicalWidth + g.size) g.vx *= -1;
      if (g.y < -g.size || g.y > this.logicalHeight + g.size) g.vy *= -1;
    });

    this.fermentBubbles.forEach((b) => {
      b.y -= b.speed;
      b.wobblePhase += b.wobbleSpeed;
      b.x += Math.sin(b.wobblePhase) * b.wobbleAmount;
      if (b.y < 100) b.alpha *= 0.98;
      if (b.y < -20 || b.alpha < 0.01) Object.assign(b, this.createBubble());
    });

    this.goldenDust.forEach((d) => {
      d.x += d.vx;
      d.y += d.vy;
      d.breathPhase += d.breathSpeed;
      if (d.x < -10) d.x = this.logicalWidth + 10;
      if (d.x > this.logicalWidth + 10) d.x = -10;
      if (d.y < -10) d.y = this.logicalHeight + 10;
    });

    this.mistLayers.forEach((m) => { m.offset += m.speed; });
    if (this.heavyMist) this.heavyMist.offset += this.heavyMist.speed;
    if (this.frontBottomMist) this.frontBottomMist.offset += this.frontBottomMist.speed;
    this.lightBeams.forEach((b) => { b.breathPhase += b.breathSpeed; });
    this.decorElements.forEach((d) => { d.breathPhase += d.breathSpeed; });
  }

  animate() {
    if (!this.ctx) return;
    const w = this.logicalWidth;
    const h = this.logicalHeight;
    this.ctx.clearRect(0, 0, w, h);
    if (this._opacity <= 0.01) {
      this.update();
      return;
    }

    this.ctx.save();
    this.ctx.globalAlpha = this._opacity;
    this.update();
    this.drawWarmGlows();
    this.drawLightBeams();
    this.drawMistLayers();
    drawDecorElements(this.ctx, this.decorElements, 'back');
    this.drawHeavyMist();
    this.drawFrontBottomMist();
    drawDecorElements(this.ctx, this.decorElements, 'front');
    this.drawGoldenDust();
    this.drawFermentBubbles();
    this.ctx.restore();
  }

  drawWarmGlows() {
    this.warmGlows.forEach((g) => {
      const alpha = g.alpha * (0.7 + Math.sin(g.breathPhase) * 0.3);
      const grad = this.ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.size);
      grad.addColorStop(0, `rgba(${g.color.r}, ${g.color.g}, ${g.color.b}, ${alpha})`);
      grad.addColorStop(0.6, `rgba(${g.color.r}, ${g.color.g}, ${g.color.b}, ${alpha * 0.3})`);
      grad.addColorStop(1, 'transparent');
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(g.x - g.size, g.y - g.size, g.size * 2, g.size * 2);
    });
  }

  drawFermentBubbles() {
    this.fermentBubbles.forEach((b) => {
      const color = b.isGold ? '232, 200, 115' : '255, 253, 247';
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${color}, ${b.alpha})`;
      this.ctx.fill();
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${b.alpha * 0.6})`;
      this.ctx.lineWidth = 0.5;
      this.ctx.stroke();
    });
  }

  drawGoldenDust() {
    this.goldenDust.forEach((d) => {
      const alpha = d.alpha * (0.6 + Math.sin(d.breathPhase) * 0.4);
      const color = d.isGold ? '232, 200, 115' : '240, 217, 160';
      this.ctx.beginPath();
      this.ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${color}, ${alpha})`;
      this.ctx.fill();
    });
  }

  drawMistLayers() {
    const w = this.logicalWidth;
    this.mistLayers.forEach((m) => {
      const grad = this.ctx.createLinearGradient(0, m.y, 0, m.y + m.height);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.4, `rgba(255, 253, 247, ${m.alpha})`);
      grad.addColorStop(0.8, `rgba(255, 253, 247, ${m.alpha * 0.6})`);
      grad.addColorStop(1, 'transparent');
      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.moveTo(0, m.y + m.height);
      for (let x = 0; x <= w; x += 20) {
        const wave = Math.sin((x + m.offset) * m.waveFreq) * 18;
        this.ctx.lineTo(x, m.y + wave);
      }
      this.ctx.lineTo(w, m.y + m.height);
      this.ctx.closePath();
      this.ctx.fill();
    });
  }

  drawHeavyMist() {
    const m = this.heavyMist;
    if (!m) return;
    const w = this.logicalWidth;
    const grad = this.ctx.createLinearGradient(0, m.y, 0, m.y + m.height);
    grad.addColorStop(0, 'rgba(245, 230, 224, 0)');
    grad.addColorStop(0.5, 'rgba(245, 230, 224, 0.4)');
    grad.addColorStop(1, 'rgba(245, 230, 224, 0.6)');
    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.moveTo(0, m.y + m.height);
    for (let x = 0; x <= w; x += 30) {
      const wave = Math.sin((x + m.offset) * 0.005) * 15 + Math.sin((x + m.offset * 1.5) * 0.01) * 8;
      this.ctx.lineTo(x, m.y + wave);
    }
    this.ctx.lineTo(w, m.y + m.height);
    this.ctx.lineTo(0, m.y + m.height);
    this.ctx.closePath();
    this.ctx.fill();
  }

  /** 稻穗前方底部薄雾 — 根部区域朦胧 */
  drawFrontBottomMist() {
    const m = this.frontBottomMist;
    if (!m) return;
    const w = this.logicalWidth;
    const h = this.logicalHeight;
    const grad = this.ctx.createLinearGradient(0, m.y, 0, h);
    grad.addColorStop(0, 'rgba(245, 230, 224, 0)');
    grad.addColorStop(0.3, 'rgba(255, 253, 247, 0.18)');
    grad.addColorStop(0.65, 'rgba(245, 230, 224, 0.42)');
    grad.addColorStop(1, 'rgba(245, 230, 224, 0.58)');
    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 22) {
      const wave = Math.sin((x + m.offset) * 0.0055) * 11
        + Math.sin((x + m.offset * 1.3) * 0.011) * 6;
      this.ctx.lineTo(x, m.y + wave);
    }
    this.ctx.lineTo(w, h);
    this.ctx.closePath();
    this.ctx.fill();
  }

  drawLightBeams() {
    this.lightBeams.forEach((b) => {
      const alpha = b.alpha * (0.6 + Math.sin(b.breathPhase) * 0.4);
      const endX = b.startX + Math.cos(b.angle) * b.length;
      const endY = b.startY + Math.sin(b.angle) * b.length;
      const grad = this.ctx.createLinearGradient(b.startX, b.startY, endX, endY);
      grad.addColorStop(0, `rgba(255, 248, 230, ${alpha * 0.6})`);
      grad.addColorStop(0.3, `rgba(255, 248, 230, ${alpha})`);
      grad.addColorStop(0.7, `rgba(255, 248, 230, ${alpha * 0.8})`);
      grad.addColorStop(1, 'transparent');
      this.ctx.save();
      this.ctx.translate(b.startX, b.startY);
      this.ctx.rotate(b.angle);
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(-b.width / 2, 0, b.width, b.length);
      this.ctx.restore();
    });
  }
}

module.exports = MainAmbience;
