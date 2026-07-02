module.exports = function attachIntroParticles(IntroSystem) {
  IntroSystem.prototype.addParticle = function addParticle(fromCenter = false) {
    let x;
    let y;
    const margin = 0;

    if (this.isSmallScreen) {
      x = margin + Math.random() * (this.logicalWidth - margin * 2);
      y = margin + Math.random() * (this.logicalHeight - margin * 2);
    } else {
      const angle = Math.random() * Math.PI * 2;
      const dist = fromCenter ? (20 + Math.random() * 80) : (150 + Math.random() * 350);
      x = this.centerX + Math.cos(angle) * dist;
      y = this.centerY + Math.sin(angle) * dist;
    }

    const isCyan = Math.random() < 0.3;
    const p = {
      x,
      y,
      homeX: x,
      homeY: y,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      wanderAngle: Math.random() * Math.PI * 2,
      wanderRadius: 15 + Math.random() * 25,
      size: this.config.particleBaseSize + Math.random() * (this.config.particleMaxSize - this.config.particleBaseSize),
      alpha: (this.config.particleAlpha + Math.random() * 0.15) * 0.6,
      targetAlpha: null,
      linkedTo: null,
      gathering: false,
      targetX: null,
      targetY: null,
      targetSize: null,
      isTextDot: false,
      pulseOffset: 0,
      pulseDecay: 0,
      pulseAngle: 0,
      isCyan,
      originalColor: isCyan ? 'gold' : 'white',
    };

    this.particles.push(p);
    return p;
  };

  IntroSystem.prototype.addLinkedCluster = function addLinkedCluster() {
    const count = 2 + Math.floor(Math.random() * 2);
    const margin = 80;
    let baseX;
    let baseY;

    if (this.isSmallScreen) {
      baseX = margin + Math.random() * (this.logicalWidth - margin * 2);
      baseY = margin + Math.random() * (this.logicalHeight - margin * 2);
    } else {
      baseX = this.centerX + (Math.random() - 0.5) * 500;
      baseY = this.centerY + (Math.random() - 0.5) * 500;
    }

    const cluster = [];
    for (let i = 0; i < count; i += 1) {
      const p = this.addParticle(false);
      p.x = baseX + (Math.random() - 0.5) * this.config.linkedClusterSpacing;
      p.y = baseY + (Math.random() - 0.5) * this.config.linkedClusterSpacing;
      p.homeX = p.x;
      p.homeY = p.y;
      p.vx = (Math.random() - 0.5) * 0.1;
      p.vy = (Math.random() - 0.5) * 0.1;
      p.size = this.config.particleBaseSize;
      cluster.push(p);
    }

    for (let i = 1; i < cluster.length; i += 1) {
      cluster[i].linkedTo = cluster[i - 1];
    }
  };

  IntroSystem.prototype.updateParticles = function updateParticles(dt) {
    const riseY = (this.state === 'riseUp' || this.state === 'gatherToText' || this.state === 'showStartButton')
      ? (this.riseOffset || 0) : 0;

    this.particles.forEach((p) => {
      if (this.state === 'riseUp' && !p.gathering) {
        const elapsed = this.now() - (this.riseStartTime || 0);
        const totalDuration = this.riseDuration || 3000;
        const accelTime = this.riseAccelTime || 800;
        const decelTime = this.riseDecelTime || 1000;
        const steadyEnd = totalDuration - decelTime;

        let speedMultiplier = 1;
        if (elapsed < accelTime) {
          speedMultiplier = this.easeOutCubic(elapsed / accelTime);
        } else if (elapsed < steadyEnd) {
          speedMultiplier = 1;
        } else if (elapsed < totalDuration) {
          speedMultiplier = this.easeInCubic(1 - (elapsed - steadyEnd) / decelTime);
        } else {
          speedMultiplier = 0;
        }

        p.risingSpeed = (p.maxRisingSpeed || 10) * speedMultiplier;
        const speed = p.risingSpeed || 0;
        p.y -= speed;
        if (p.driftSpeed) p.x += p.driftSpeed * speedMultiplier;

        const startY = p.riseStartY || this.logicalHeight / 2;
        const totalRise = Math.max(0, startY - p.y);
        const maxRise = this.logicalHeight * 1.5;
        const riseProgress = Math.min(1, Math.max(0, totalRise / maxRise));
        const targetSize = this.config.textParticleSize || 12;
        const startSize = p.originalSize || p.size || 2;
        p.visualSize = Math.max(1, startSize + (targetSize - startSize) * riseProgress);
        p.visualAlpha = Math.max(0.1, (p.alpha || 0.5) * (0.6 + riseProgress * 0.4));
        p.size = p.visualSize;
      } else {
        p.visualSize = Math.max(1, p.size || 2);
        p.visualAlpha = p.alpha || 0.5;
      }

      if (p.settled) return;

      if (p.gathering && p.targetX !== null) {
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 1) {
          const spd = Math.max(dist * 0.03, 1);
          p.x += (dx / dist) * spd;
          p.y += (dy / dist) * spd;
        } else {
          p.x = p.targetX;
          p.y = p.targetY;
          if (p.isTextDot) {
            p.settled = true;
            p.alpha = 1;
            p.visualAlpha = 1;
          }
        }
        if (p.targetSize !== null) {
          p.size += (p.targetSize - p.size) * 0.1;
          p.visualSize = p.size;
        }
        if (p.targetAlpha !== null) {
          const alphaSpeed = p.isTextDot ? 0.05 : 0.08;
          p.alpha += (p.targetAlpha - p.alpha) * alphaSpeed;
          p.visualAlpha = p.alpha;
        }
      } else if (this.state !== 'riseUp') {
        if (this.isSmallScreen && p.homeX !== undefined) {
          p.wanderAngle += (Math.random() - 0.5) * 0.05;
          const targetX = p.homeX + Math.cos(p.wanderAngle) * p.wanderRadius;
          const targetY = p.homeY + Math.sin(p.wanderAngle) * p.wanderRadius;
          p.x += (targetX - p.x) * 0.01;
          p.y += (targetY - p.y) * 0.01;
        } else {
          p.x += p.vx;
          p.y += p.vy;
          const m = 50;
          if (p.x < m) p.vx += 0.01;
          if (p.x > this.logicalWidth - m) p.vx -= 0.01;
          if (p.y < m) p.vy += 0.01;
          if (p.y > this.logicalHeight - m) p.vy -= 0.01;
          p.vx *= 0.999;
          p.vy *= 0.999;
        }
      }

      if (p.pulseDecay > 0) {
        p.pulseDecay -= dt * 0.002;
        if (p.pulseDecay < 0) p.pulseDecay = 0;
      }
    });
  };

  IntroSystem.prototype.drawParticles = function drawParticles() {
    const ctx = this.ctx;
    const riseY = (this.state === 'riseUp' || this.state === 'gatherToText' || this.state === 'showStartButton')
      ? (this.riseOffset || 0) : 0;
    const colorProgress = this.colorTransitionProgress || 0;

    ctx.strokeStyle = 'rgba(255, 230, 170, 0.15)';
    ctx.lineWidth = 0.5;
    this.particles.forEach((p) => {
      if (p.linkedTo && !p.gathering && this.state !== 'riseUp') {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.linkedTo.x, p.linkedTo.y);
        ctx.stroke();
      }
    });

    this.particles.forEach((p) => {
      const offsetX = Math.cos(p.pulseAngle) * p.pulseOffset * p.pulseDecay;
      const offsetY = Math.sin(p.pulseAngle) * p.pulseOffset * p.pulseDecay;

      if (this.state === 'riseUp' && !p.gathering) {
        const speed = p.risingSpeed || 4;
        const trailLength = speed * 4 + (this.riseSpeed || 6) * 1.5;
        const renderY = p.y + riseY;
        const trailR = Math.round(255 + (232 - 255) * colorProgress);
        const trailG = Math.round(255 + (200 - 255) * colorProgress);
        const trailB = Math.round(255 + (115 - 255) * colorProgress);
        const gradient = ctx.createLinearGradient(p.x, renderY, p.x, renderY + trailLength);
        gradient.addColorStop(0, `rgba(${trailR}, ${trailG}, ${trailB}, ${(p.visualAlpha || p.alpha) * 0.8})`);
        gradient.addColorStop(0.4, `rgba(${trailR}, ${trailG}, ${trailB}, ${(p.visualAlpha || p.alpha) * 0.4})`);
        gradient.addColorStop(1, 'rgba(245, 230, 224, 0)');
        ctx.beginPath();
        ctx.moveTo(p.x, renderY);
        ctx.lineTo(p.x, renderY + trailLength);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = (p.visualSize || p.size) * 0.5;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      let renderY = p.y;
      if (this.state === 'riseUp' || this.state === 'gatherToText' || this.state === 'showStartButton') {
        renderY += riseY;
      }

      const radius = Math.max(0.5, p.visualSize || p.size || 2);
      const alpha = Math.max(0, Math.min(1, p.visualAlpha || p.alpha || 0.5));
      ctx.beginPath();
      ctx.arc(p.x + offsetX, renderY + offsetY, radius, 0, Math.PI * 2);

      if (this.state === 'gatherToText' || this.state === 'showStartButton' || this.state === 'storyTransition') {
        if (p.isTextDot) ctx.fillStyle = `rgba(107, 83, 68, ${alpha})`;
        else ctx.fillStyle = `rgba(232, 200, 115, ${alpha * 0.5})`;
      } else if (this.state === 'riseUp') {
        let startR; let startG; let startB; let endR; let endG; let endB;
        if (p.isCyan) {
          startR = 255; startG = 220; startB = 130;
          endR = 232; endG = 200; endB = 115;
        } else {
          startR = 255; startG = 255; startB = 255;
          endR = 107; endG = 83; endB = 68;
        }
        const r = Math.round(startR + (endR - startR) * colorProgress);
        const g = Math.round(startG + (endG - startG) * colorProgress);
        const b = Math.round(startB + (endB - startB) * colorProgress);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      } else if (p.isCyan) {
        ctx.fillStyle = `rgba(255, 220, 130, ${alpha})`;
      } else {
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      }
      ctx.fill();
    });
  };

  IntroSystem.prototype.emitPulseWave = function emitPulseWave(x, y, isFinal = false) {
    const waveCount = isFinal ? 5 : 3;
    const baseDelay = 80;
    for (let i = 0; i < waveCount; i += 1) {
      this.schedule(() => {
        const centerIndex = Math.floor(waveCount / 2);
        const distFromCenter = Math.abs(i - centerIndex);
        const strength = 1 - (distFromCenter / waveCount) * 0.6;
        this.pulseWaves.push({
          x,
          y,
          radius: 0,
          maxRadius: isFinal ? 500 : 300,
          speed: isFinal ? 6 : 4,
          alpha: strength,
          lineWidth: isFinal ? (4 - distFromCenter * 0.8) : (2 - distFromCenter * 0.4),
          isFinal,
        });
      }, i * baseDelay);
    }
  };

  IntroSystem.prototype.updatePulseWaves = function updatePulseWaves(dt) {
    this.pulseWaves = this.pulseWaves.filter((wave) => {
      wave.radius += wave.speed;
      const progress = wave.radius / wave.maxRadius;
      wave.currentAlpha = wave.alpha * (1 - progress * progress);
      if (wave.isFinal || wave.alpha > 0.5) {
        this.particles.forEach((p) => {
          const dx = p.x - wave.x;
          const dy = p.y - wave.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (Math.abs(dist - wave.radius) < 30) {
            const strength = wave.isFinal ? 20 : 10;
            p.pulseOffset = strength * (1 - Math.abs(dist - wave.radius) / 30);
            p.pulseDecay = 1;
            p.pulseAngle = Math.atan2(dy, dx);
          }
        });
      }
      return wave.radius < wave.maxRadius;
    });
  };

  IntroSystem.prototype.drawPulseWaves = function drawPulseWaves() {
    const ctx = this.ctx;
    this.pulseWaves.forEach((wave) => {
      ctx.beginPath();
      ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
      const color = wave.isFinal
        ? `rgba(255, 200, 50, ${wave.currentAlpha * 0.7})`
        : `rgba(255, 215, 100, ${wave.currentAlpha * 0.5})`;
      ctx.strokeStyle = color;
      ctx.lineWidth = wave.lineWidth;
      ctx.stroke();
    });
  };
};
