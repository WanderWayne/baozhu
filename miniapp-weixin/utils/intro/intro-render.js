const { BAOZHU_TITLE_CONFIG } = require('../main-particles');

module.exports = function attachIntroRender(IntroSystem) {
  IntroSystem.prototype.animate = function animate(time = 0) {
    const dt = time - this.lastTime;
    this.lastTime = time;

    if (this.state === 'riseUp' && this.risePhase === 'rising') {
      const elapsed = this.now() - this.riseStartTime;
      const colorProgress = Math.min(elapsed / this.riseDuration, 1);
      this.colorTransitionProgress = colorProgress;
      const r = Math.round(245 * colorProgress);
      const g = Math.round(230 * colorProgress);
      const b = Math.round(224 * colorProgress);
      this._setScreenBg(`rgb(${r}, ${g}, ${b})`, colorProgress > 0.5);
    } else if (
      this.risePhase === 'stopped'
      || this.state === 'gatherToText'
      || this.state === 'showStartButton'
    ) {
      this._setScreenBg('#F5E6E0', true);
    } else if (
      this.state !== 'blueWash'
      && this.state !== 'storyNarration'
      && this.state !== 'riseUp'
    ) {
      this._setScreenBg('#000000', false);
    }

    this.ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);

    if (this.risePhase === 'rising') {
      const elapsed = this.now() - this.riseStartTime;
      const totalDuration = this.riseDuration;
      const accelTime = this.riseAccelTime;
      const decelTime = this.riseDecelTime;
      const steadyEnd = totalDuration - decelTime;
      const maxCameraSpeed = 15;

      if (elapsed < accelTime) {
        this.targetRiseSpeed = maxCameraSpeed * this.easeOutCubic(elapsed / accelTime);
      } else if (elapsed < steadyEnd) {
        this.targetRiseSpeed = maxCameraSpeed;
      } else if (elapsed < totalDuration) {
        this.targetRiseSpeed = maxCameraSpeed * this.easeInCubic(1 - (elapsed - steadyEnd) / decelTime);
      } else {
        this.targetRiseSpeed = 0;
      }

      this.riseSpeed += (this.targetRiseSpeed - this.riseSpeed) * 0.15;
      this.riseOffset += this.riseSpeed;
      if (this.riseOffset > this.riseTargetOffset) {
        this.riseOffset = this.riseTargetOffset;
      }
    }

    this.updateParticles(dt);
    this.updatePulseWaves(dt);
    this.updateItemAnimations(dt);
    this.drawParticles();
    this.drawDoor();
    this.drawInventoryPanel();
    this.drawItems();
    this.drawPulseWaves();
    this.drawSynthesisFlashes();

    // 金光遮罩：画在最上层，峰值时整屏纯金不透明（献门后的闪金光）
    if (this.state === 'blueWash' || this.state === 'storyNarration') {
      const maxAlpha = this.blueWashMaxAlpha != null ? this.blueWashMaxAlpha : 1;
      if (this.blueWashPhase === 'fadeIn') {
        this.cyanOverlayAlpha = Math.min(this.cyanOverlayAlpha + 0.025, maxAlpha);
      } else if (this.blueWashPhase === 'fadeOut') {
        this.cyanOverlayAlpha = Math.max(this.cyanOverlayAlpha - 0.01, 0);
      }
      if (this.cyanOverlayAlpha > 0) {
        this.ctx.fillStyle = `rgba(232, 200, 115, ${this.cyanOverlayAlpha})`;
        this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
      }
    }

    this.drawTransitionOverlay();
  };

  IntroSystem.prototype.drawInventoryPanel = function drawInventoryPanel() {
    const target = this.page && this.page.data && this.page.data.inventoryVisible ? 1 : 0;
    if (this._inventoryPanelProgress == null) this._inventoryPanelProgress = 0;
    this._inventoryPanelProgress += (target - this._inventoryPanelProgress) * 0.14;
    if (this._inventoryPanelProgress <= 0.01) return;

    const ctx = this.ctx;
    const h = 180;
    const y = this.logicalHeight - h * this._inventoryPanelProgress;

    ctx.save();
    ctx.globalAlpha = Math.min(1, this._inventoryPanelProgress);
    const panel = ctx.createLinearGradient(0, y, 0, this.logicalHeight);
    panel.addColorStop(0, 'rgba(30, 30, 35, 0.82)');
    panel.addColorStop(1, 'rgba(20, 20, 24, 0.92)');
    ctx.fillStyle = panel;
    ctx.fillRect(0, y, this.logicalWidth, h);

    const shadow = ctx.createLinearGradient(0, y - 28, 0, y + 8);
    shadow.addColorStop(0, 'rgba(0, 0, 0, 0)');
    shadow.addColorStop(1, 'rgba(0, 0, 0, 0.42)');
    ctx.fillStyle = shadow;
    ctx.fillRect(0, y - 28, this.logicalWidth, 36);
    ctx.restore();
  };

  // ==================== 门（canvas 绘制，确保实心遮挡粒子）====================
  IntroSystem.prototype._archPath = function _archPath(x, y, w, h, r) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h);
  };

  IntroSystem.prototype.drawDoor = function drawDoor() {
    this.doorOpacity += (this.doorTargetOpacity - this.doorOpacity) * 0.12;
    if (this.doorOpacity <= 0.01 && this.doorTargetOpacity <= 0.01) return;

    const ctx = this.ctx;
    const w = 120;
    const h = 180;
    const r = 60;
    const x = this.centerX - w / 2;
    const y = this.centerY - 110;
    const t = this.now();
    const breathe = (Math.sin((t / 1000) * Math.PI) + 1) / 2;

    let glow = 0;
    let frame = `rgba(${Math.round(150 + 50 * breathe)}, ${Math.round(150 + 35 * breathe)}, 150, ${0.5 + 0.2 * breathe})`;
    if (this.doorModes.has('breathing')) glow = 0.3 + breathe * 0.4;
    if (this.doorModes.has('active')) { glow = 0.6 + breathe * 0.4; frame = 'rgba(232, 200, 115, 0.75)'; }
    if (this.doorModes.has('hover')) { glow = 1; frame = 'rgba(255, 220, 100, 0.95)'; }
    if (this.doorModes.has('absorbing') || this.doorModes.has('releasing')) { glow = 1; frame = 'rgba(255, 220, 100, 0.9)'; }

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, this.doorOpacity));

    // 实心黑色门体（遮挡粒子）
    this._archPath(x, y, w, h, r);
    ctx.fillStyle = '#000';
    ctx.fill();

    // 内部金色光晕
    if (glow > 0) {
      const cx = x + w / 2;
      const cy = y + h * 0.4;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.95);
      g.addColorStop(0, `rgba(232, 200, 115, ${0.32 * glow})`);
      g.addColorStop(0.5, `rgba(200, 170, 80, ${0.12 * glow})`);
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.save();
      this._archPath(x, y, w, h, r);
      ctx.clip();
      ctx.fillStyle = g;
      ctx.fillRect(x - 20, y - 20, w + 40, h + 40);
      ctx.restore();
    }

    // 门框描边
    this._archPath(x, y, w, h, r);
    ctx.lineWidth = 3;
    ctx.strokeStyle = frame;
    if (this.doorModes.has('active') || this.doorModes.has('hover')) {
      ctx.shadowColor = 'rgba(232, 200, 115, 0.5)';
      ctx.shadowBlur = 25;
    }
    ctx.stroke();
    ctx.restore();
  };

  IntroSystem.prototype.drawItems = function drawItems() {
    const ctx = this.ctx;
    const all = [...this.items];
    if (this.synthesisResult) all.push(this.synthesisResult);

    all.forEach((it) => {
      if (it.hidden) return;
      const op = it.curOpacity != null ? it.curOpacity : 1;
      if (op <= 0.01) return;
      const scale = it.curScale != null ? it.curScale : 1;
      if (scale <= 0.01) return;
      const cx = it.x + it.width / 2;
      const cy = it.y + it.height / 2;
      const rad = it.width / 2;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, op));
      ctx.translate(cx, cy);
      if (it.spinAngle) ctx.rotate(it.spinAngle);
      ctx.scale(scale, scale);

      // 实心圆底
      ctx.beginPath();
      ctx.arc(0, 0, rad, 0, Math.PI * 2);
      if (it.isSynthesisResult) ctx.fillStyle = 'rgb(50, 50, 55)';
      else if (it.isGolden) ctx.fillStyle = 'rgb(42, 40, 36)';
      else ctx.fillStyle = 'rgb(40, 40, 45)';
      ctx.fill();

      // 边框
      ctx.lineWidth = 2;
      if (it.isGolden && !it.goldenBorderOnly) {
        ctx.strokeStyle = 'rgba(255, 200, 50, 0.85)';
        ctx.shadowColor = 'rgba(255, 200, 50, 0.45)';
        ctx.shadowBlur = 18;
      } else if (it.isGolden && it.goldenBorderOnly) {
        ctx.strokeStyle = 'rgba(255, 210, 80, 0.95)';
      } else if (it.isSynthesisResult) {
        ctx.strokeStyle = 'rgba(232, 200, 115, 0.6)';
        ctx.shadowColor = 'rgba(232, 200, 115, 0.35)';
        ctx.shadowBlur = 18;
      } else {
        ctx.strokeStyle = 'rgba(100, 100, 110, 0.6)';
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 图标 + 名称
      const iconEntry = this._getIconImage ? this._getIconImage(it) : null;
      if (iconEntry && iconEntry.loaded && !iconEntry.failed) {
        const iconSize = Math.min(rad * 1.35, 46);
        ctx.drawImage(iconEntry.image, -iconSize / 2, -iconSize / 2 - 5, iconSize, iconSize);
      } else {
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '22px sans-serif';
        ctx.fillText((it.name || '').slice(0, 1), 0, -6);
      }
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '11px sans-serif';
      ctx.fillText(it.name, 0, rad - 12);

      ctx.restore();
    });
  };

  IntroSystem.prototype.drawSynthesisFlashes = function drawSynthesisFlashes() {
    const ctx = this.ctx;
    const now = this.now();
    (this.synthesisFlashes || []).forEach((f) => {
      const p = Math.min((now - (f.t0 || now)) / 400, 1);
      const scale = 0.1 + p * 2.4;
      const alpha = 1 - p;
      const radius = 100 * scale;
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, radius);
      g.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
      g.addColorStop(0.4, `rgba(255, 235, 180, ${alpha * 0.8})`);
      g.addColorStop(0.7, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(f.x, f.y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  IntroSystem.prototype._easeItemAppearance = function _easeItemAppearance(item) {
    const targetScale = item.isDragging ? 1.1 : (item.visible === false ? 0.5 : 1);
    if (item.curScale == null) item.curScale = 0.5;
    item.curScale += (targetScale - item.curScale) * 0.2;
    const targetOpacity = item.visible === false ? 0 : (item.opacity != null ? item.opacity : 1);
    if (item.curOpacity == null) item.curOpacity = 0;
    item.curOpacity += (targetOpacity - item.curOpacity) * 0.25;
  };

  IntroSystem.prototype.updateItemAnimations = function updateItemAnimations(dt) {
    this.items.forEach((item) => this._easeItemAppearance(item));
    if (this.synthesisResult) this._easeItemAppearance(this.synthesisResult);

    this.items.forEach((item) => {
      if (item.animPhase === 'popApart' && item.animTarget) {
        item.x += (item.animTarget.x - item.x) * 0.2;
        item.y += (item.animTarget.y - item.y) * 0.2;
        this.updateItemPosition(item);
      } else if (item.animPhase === 'spinning') {
        const elapsed = this.now() - item.spinStart;
        const progress = Math.min(elapsed / 600, 1);
        item.spinAngle = this.easeInOutCubic(progress) * Math.PI * 4;
        this.updateItemPosition(item);
      } else if (item.animPhase === 'dash' && item.animTarget) {
        item.x += (item.animTarget.x - item.x) * 0.3;
        item.y += (item.animTarget.y - item.y) * 0.3;
        item.spinAngle = 0;
        this.updateItemPosition(item);
      }
    });

    if (this.synthesisResult && this.synthesisResult.animPhase === 'offering') {
      const item = this.synthesisResult;
      if (item.animTarget) {
        item.x += (item.animTarget.x - item.x) * 0.04;
        item.y += (item.animTarget.y - item.y) * 0.04;
        this.updateItemPosition(item);
      }
    }
  };

  IntroSystem.prototype.updateItemPosition = function updateItemPosition(item) {
    // 物品改为 canvas 每帧绘制，无需 setData
  };

  IntroSystem.prototype.easeInOutCubic = function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
  };

  IntroSystem.prototype.easeOutCubic = function easeOutCubic(t) {
    return 1 - (1 - t) ** 3;
  };

  IntroSystem.prototype.easeInCubic = function easeInCubic(t) {
    return t * t * t;
  };

  IntroSystem.prototype.showNarrative = function showNarrative(text) {
    this.patchUI({
      narrativeVisible: true,
      narrativeText: text,
    });
  };

  IntroSystem.prototype.hideNarrative = function hideNarrative() {
    this.patchUI({ narrativeVisible: false });
  };

  IntroSystem.prototype.setDoorClass = function setDoorClass(extraClasses) {
    const base = Array.isArray(extraClasses) ? extraClasses : (extraClasses || '').split(' ').filter(Boolean);
    this.doorModes = new Set(base);
  };

  IntroSystem.prototype.addDoorClass = function addDoorClass(className) {
    this.doorModes.add(className);
  };

  IntroSystem.prototype.removeDoorClass = function removeDoorClass(className) {
    this.doorModes.delete(className);
  };

  IntroSystem.prototype.setDoorOpacity = function setDoorOpacity(target) {
    this.doorTargetOpacity = target;
  };

  IntroSystem.prototype._setScreenBg = function _setScreenBg(color, warm) {
    const d = this.page.data;
    if (d.screenBg !== color || !!d.warmTransition !== !!warm) {
      this.patchUI({ screenBg: color, warmTransition: warm });
    }
  };
};
