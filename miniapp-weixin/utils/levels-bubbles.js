// 发酵粒子系统 — 微信小程序版（对齐 H5 js/levels-bubbles.js）
// 天空渐变 / 远山 / 晨雾 / 温暖光斑 / 光线条纹 / 金色微尘 / 孢子 / 气泡
// ================================================

class FermentationWorld {
  constructor(options) {
    this.canvas = options.canvas;
    this.ctx = options.ctx;
    this.width = options.width;
    this.height = options.height;
    this.theme = options.theme || 'dairy';
    this._destroyed = false;
    this._rafId = null;

    this.bubbles = [];
    this.goldenDust = [];
    this.warmGlows = [];
    this.driftingSpores = [];
    this.valley = null;

    this.config = {
      maxBubbles: 20,
      maxDust: 50,
      maxGlows: 5,
      maxSpores: 25,
    };

    this.lastTime = 0;
    this.spawnTimers = { bubble: 0 };

    this.colors = {
      milkFoam:      { r: 255, g: 253, b: 247 },
      yeastBeige:    { r: 245, g: 240, b: 230 },
      riceWineGold:  { r: 232, g: 200, b: 115 },
      dawnGold:      { r: 240, g: 217, b: 160 },
      dawnPink:      { r: 245, g: 230, b: 224 },
      caramelBrown:  { r: 166, g: 124, b: 82  },
      sunriseOrange: { r: 232, g: 168, b: 124 },
    };

    this._init();
  }

  setTheme(theme) {
    if (this.theme !== theme) {
      this.theme = theme;
      if (theme === 'dairy') this._generateValley();
    }
  }

  // ── valley background ─────────────────────────────────

  _generateValley() {
    const W = this.width;
    const H = this.height;
    const v = {};

    v.hills = [];
    const hillConfigs = [
      { baseY: 0.30, amp: 0.03, alpha: 0.10, color: 'rgba(220,200,160,' },
      { baseY: 0.36, amp: 0.04, alpha: 0.15, color: 'rgba(210,185,140,' },
      { baseY: 0.42, amp: 0.03, alpha: 0.20, color: 'rgba(200,170,120,' },
    ];
    for (const hc of hillConfigs) {
      const pts = [];
      for (let i = 0; i <= 12; i++) {
        const x = (i / 12) * W;
        const noise = Math.sin(i * 1.7 + hc.baseY * 30) * 0.5 + Math.sin(i * 0.8 + hc.amp * 100) * 0.5;
        pts.push({ x, y: H * hc.baseY + noise * H * hc.amp });
      }
      v.hills.push({ pts, alpha: hc.alpha, color: hc.color });
    }

    v.valleyDust = [];
    for (let i = 0; i < 35; i++) {
      const depthT = Math.random();
      v.valleyDust.push({
        x: W * 0.15 + Math.random() * W * 0.7,
        y: H * 0.3 + depthT * H * 0.65,
        size: 0.4 + Math.random() * 1.5,
        alpha: 0.04 + depthT * 0.08,
        vx: (Math.random() - 0.5) * 0.06,
        vy: (Math.random() - 0.5) * 0.03 - 0.01,
        breathPhase: Math.random() * Math.PI * 2,
        breathSpeed: 0.002 + Math.random() * 0.005,
      });
    }

    v.mists = [];
    for (let i = 0; i < 4; i++) {
      const depthT = i / 3;
      v.mists.push({
        x: Math.random() * W,
        y: H * (0.6 + depthT * 0.35),
        w: W * (0.6 + Math.random() * 0.5),
        h: 30 + Math.random() * 50,
        alpha: 0.03 + depthT * 0.05,
        vx: 0.02 + Math.random() * 0.04,
      });
    }

    this.valley = v;
  }

  _drawValleyBackground() {
    if (this.theme !== 'dairy' || !this.valley) return;
    const ctx = this.ctx;
    const W = this.width;
    const H = this.height;
    const v = this.valley;

    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0,   '#FDF8E8');
    sky.addColorStop(0.4, '#F8F0D8');
    sky.addColorStop(0.7, '#F2E4C0');
    sky.addColorStop(1,   '#ECD8A8');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    v.hills.forEach((hill) => {
      ctx.beginPath();
      ctx.moveTo(0, H);
      ctx.lineTo(hill.pts[0].x, hill.pts[0].y);
      for (let i = 1; i < hill.pts.length; i++) {
        const prev = hill.pts[i - 1];
        const cur = hill.pts[i];
        ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + cur.x) / 2, (prev.y + cur.y) / 2);
      }
      const last = hill.pts[hill.pts.length - 1];
      ctx.lineTo(last.x, last.y);
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fillStyle = hill.color + hill.alpha + ')';
      ctx.fill();
    });

    v.valleyDust.forEach((d) => {
      const ba = d.alpha * (0.5 + Math.sin(d.breathPhase) * 0.5);
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,180,140,${ba})`;
      ctx.fill();
    });

    v.mists.forEach((m) => {
      const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.w / 2);
      grad.addColorStop(0,   `rgba(255,253,240,${m.alpha})`);
      grad.addColorStop(0.6, `rgba(255,250,235,${m.alpha * 0.5})`);
      grad.addColorStop(1,   'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(m.x - m.w / 2, m.y - m.h / 2, m.w, m.h);
    });
  }

  _updateMist() {
    if (!this.valley) return;
    const W = this.width;
    const H = this.height;
    this.valley.mists.forEach((m) => {
      m.x += m.vx;
      if (m.x > W + m.w / 2) m.x = -m.w / 2;
    });
    this.valley.valleyDust.forEach((d) => {
      d.x += d.vx;
      d.y += d.vy;
      d.breathPhase += d.breathSpeed;
      if (d.x < W * 0.1) d.x = W * 0.9;
      if (d.x > W * 0.9) d.x = W * 0.1;
      if (d.y < H * 0.2) d.y = H * 0.9;
      if (d.y > H * 1.05) d.y = H * 0.25;
    });
  }

  // ── warm glows ────────────────────────────────────────

  _createWarmGlow() {
    const palette = [this.colors.riceWineGold, this.colors.dawnPink, this.colors.sunriseOrange, this.colors.dawnGold];
    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      size: 100 + Math.random() * 150,
      alpha: 0.015 + Math.random() * 0.025,
      vx: (Math.random() - 0.5) * 0.03,
      vy: (Math.random() - 0.5) * 0.02,
      breathPhase: Math.random() * Math.PI * 2,
      breathSpeed: 0.001 + Math.random() * 0.002,
      color: palette[Math.floor(Math.random() * palette.length)],
    };
  }

  _updateWarmGlows() {
    this.warmGlows.forEach((g) => {
      g.x += g.vx; g.y += g.vy; g.breathPhase += g.breathSpeed;
      if (g.x < -g.size / 2 || g.x > this.width + g.size / 2) g.vx *= -1;
      if (g.y < -g.size / 2 || g.y > this.height + g.size / 2) g.vy *= -1;
    });
  }

  _drawWarmGlows() {
    this.warmGlows.forEach((g) => {
      const a = g.alpha * (0.7 + Math.sin(g.breathPhase) * 0.3);
      const grad = this.ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.size);
      grad.addColorStop(0,   `rgba(${g.color.r},${g.color.g},${g.color.b},${a})`);
      grad.addColorStop(0.4, `rgba(${g.color.r},${g.color.g},${g.color.b},${a * 0.5})`);
      grad.addColorStop(1,   'transparent');
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(g.x - g.size, g.y - g.size, g.size * 2, g.size * 2);
    });
  }

  // ── light beams ───────────────────────────────────────

  _drawLightBeams() {
    const time = this.lastTime * 0.0001;
    for (let i = 0; i < 2; i++) {
      const alpha = 0.015 + Math.sin(time + i * 0.5) * 0.008;
      if (alpha <= 0.01) continue;
      const x1 = this.width * (0.6 + i * 0.2);
      const x2 = this.width * (0.2 + i * 0.15);
      const grad = this.ctx.createLinearGradient(x1, 0, x2, this.height);
      grad.addColorStop(0,   `rgba(240,217,160,${alpha})`);
      grad.addColorStop(0.3, `rgba(240,217,160,${alpha * 1.5})`);
      grad.addColorStop(0.7, `rgba(240,217,160,${alpha * 1.2})`);
      grad.addColorStop(1,   'transparent');
      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.moveTo(x1, 0);
      this.ctx.lineTo(x1 + 80, 0);
      this.ctx.lineTo(x2 + 60, this.height);
      this.ctx.lineTo(x2, this.height);
      this.ctx.closePath();
      this.ctx.fill();
    }
  }

  // ── golden dust ───────────────────────────────────────

  _createGoldenDust() {
    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      size: 0.5 + Math.random() * 2,
      alpha: 0.02 + Math.random() * 0.06,
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.05 - 0.02,
      breathPhase: Math.random() * Math.PI * 2,
      breathSpeed: 0.003 + Math.random() * 0.006,
      color: Math.random() > 0.3 ? this.colors.riceWineGold : this.colors.dawnGold,
    };
  }

  _updateGoldenDust() {
    this.goldenDust.forEach((d) => {
      d.x += d.vx; d.y += d.vy; d.breathPhase += d.breathSpeed;
      if (d.x < -20) d.x = this.width + 20;
      if (d.x > this.width + 20) d.x = -20;
      if (d.y < -20) d.y = this.height + 20;
      if (d.y > this.height + 20) d.y = -20;
    });
  }

  _drawGoldenDust() {
    this.goldenDust.forEach((d) => {
      const a = d.alpha * (0.6 + Math.sin(d.breathPhase) * 0.4);
      this.ctx.beginPath();
      this.ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${d.color.r},${d.color.g},${d.color.b},${a})`;
      this.ctx.fill();
    });
  }

  // ── drifting spores ───────────────────────────────────

  _createSpore() {
    const palette = [this.colors.milkFoam, this.colors.yeastBeige, this.colors.dawnPink];
    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      size: 1 + Math.random() * 3,
      alpha: 0.04 + Math.random() * 0.08,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.08,
      wobbleX: Math.random() * Math.PI * 2,
      wobbleY: Math.random() * Math.PI * 2,
      wobbleSpeedX: 0.01 + Math.random() * 0.02,
      wobbleSpeedY: 0.008 + Math.random() * 0.015,
      color: palette[Math.floor(Math.random() * palette.length)],
    };
  }

  _updateSpores() {
    this.driftingSpores.forEach((s) => {
      s.wobbleX += s.wobbleSpeedX; s.wobbleY += s.wobbleSpeedY;
      s.x += s.vx + Math.sin(s.wobbleX) * 0.3;
      s.y += s.vy + Math.cos(s.wobbleY) * 0.2;
      if (s.x < -20) s.x = this.width + 20;
      if (s.x > this.width + 20) s.x = -20;
      if (s.y < -20) s.y = this.height + 20;
      if (s.y > this.height + 20) s.y = -20;
    });
  }

  _drawSpores() {
    this.driftingSpores.forEach((s) => {
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${s.color.r},${s.color.g},${s.color.b},${s.alpha})`;
      this.ctx.fill();
    });
  }

  // ── bubbles ───────────────────────────────────────────

  _createBubble() {
    const c = Math.random();
    const color = c < 0.5 ? this.colors.milkFoam : c < 0.8 ? this.colors.dawnGold : this.colors.riceWineGold;
    return {
      x: Math.random() * this.width,
      y: this.height + 30,
      size: 3 + Math.random() * 10,
      speed: 0.2 + Math.random() * 0.5,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.008 + Math.random() * 0.015,
      wobbleAmount: 0.3 + Math.random() * 0.6,
      alpha: 0.15 + Math.random() * 0.25,
      color,
    };
  }

  _updateBubbles(dt) {
    this.spawnTimers.bubble += dt;
    if (this.spawnTimers.bubble > 1200 && this.bubbles.length < this.config.maxBubbles) {
      this.bubbles.push(this._createBubble());
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

  _drawBubbles() {
    this.bubbles.forEach((b) => {
      const ctx = this.ctx;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${b.color.r},${b.color.g},${b.color.b},${b.alpha})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${b.alpha * 0.3})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      if (b.size > 5) {
        ctx.beginPath();
        ctx.arc(b.x - b.size * 0.3, b.y - b.size * 0.3, b.size * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${b.alpha * 0.6})`;
        ctx.fill();
      }
    });
  }

  // ── init & loop ───────────────────────────────────────

  _init() {
    this._generateValley();
    for (let i = 0; i < this.config.maxDust; i++) this.goldenDust.push(this._createGoldenDust());
    for (let i = 0; i < this.config.maxGlows; i++) this.warmGlows.push(this._createWarmGlow());
    for (let i = 0; i < this.config.maxSpores; i++) this.driftingSpores.push(this._createSpore());
    for (let i = 0; i < 8; i++) {
      const b = this._createBubble();
      b.y = Math.random() * this.height;
      this.bubbles.push(b);
    }
  }

  // map theme name → chapter background color (mirrors CSS vars)
  _themeBg() {
    const map = {
      dairy:       '#FDF8E8',
      floral:      '#FDF0F2',
      fruit:       '#F0F5EC',
      grain:       '#F8F2E4',
      temperature: '#EDF4F7',
      ultimate:    '#FDF4EC',
    };
    return map[this.theme] || '#FDF8E8';
  }

  animate(time = 0) {
    if (this._destroyed) return;
    const dt = time - this.lastTime;
    this.lastTime = time;

    this.ctx.clearRect(0, 0, this.width, this.height);

    // 将粒子绘制区域裁剪到上方 58%（山丘/天空区）
    // 下方关卡卡片区域不会有任何粒子遮挡
    const clipH = this.height * 0.58;
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(0, 0, this.width, clipH);
    this.ctx.clip();

    this._updateMist();
    this._updateWarmGlows();
    this._drawWarmGlows();
    this._drawLightBeams();
    this._updateGoldenDust();
    this._drawGoldenDust();
    this._updateSpores();
    this._drawSpores();
    this._updateBubbles(dt);
    this._drawBubbles();

    this.ctx.restore();

    this._rafId = this.canvas.requestAnimationFrame((t) => this.animate(t));
  }

  start() {
    if (this._rafId != null) return;
    this._rafId = this.canvas.requestAnimationFrame((t) => this.animate(t));
  }

  destroy() {
    this._destroyed = true;
    if (this._rafId != null && this.canvas.cancelAnimationFrame) {
      this.canvas.cancelAnimationFrame(this._rafId);
    }
    this._rafId = null;
  }
}

module.exports = FermentationWorld;
