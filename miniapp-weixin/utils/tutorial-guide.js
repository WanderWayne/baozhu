// 新手引导 — Canvas 聚光灯挖洞 + 描边 + 文字（全 Canvas 绘制，避免 cover-view 文字不显示）

const devPlaytest = require('./dev-playtest');

let _active = false;
let _resolve = null;
let _canDismiss = false;
let _continueTimer = null;
let _autoDismissTimer = null;
let _paintState = null;

function clearTimers() {
  if (_continueTimer) {
    clearTimeout(_continueTimer);
    _continueTimer = null;
  }
  if (_autoDismissTimer) {
    clearTimeout(_autoDismissTimer);
    _autoDismissTimer = null;
  }
}

function hasSeen(key) {
  if (devPlaytest.isEnabled()) return false;
  return !!wx.getStorageSync(key);
}

function markSeen(key) {
  if (devPlaytest.isEnabled()) return;
  wx.setStorageSync(key, '1');
}

const FADE_MS = 400;

function emptyOverlay() {
  return {
    active: false,
    visible: false,
    fadeOut: false,
    screenW: 375,
    screenH: 667,
  };
}

function formatTextFields(raw) {
  return {
    textPlain: String(raw || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''),
  };
}

function resolveShape(opts, hw, hh, borderRadius) {
  if (opts.shape === 'circle') return 'circle';
  if (opts.shape === 'roundRect') return 'roundRect';
  const minSide = Math.min(hw, hh);
  const ratio = Math.max(hw, hh) / Math.max(minSide, 1);
  if (ratio <= 1.25 && borderRadius >= minSide * 0.35) return 'circle';
  return 'roundRect';
}

function roundRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

function wrapTextLines(ctx, text, maxWidth) {
  const lines = [];
  (text || '').split('\n').forEach((para) => {
    let line = '';
    for (let i = 0; i < para.length; i += 1) {
      const ch = para[i];
      const test = line + ch;
      if (line && ctx.measureText(test).width > maxWidth) {
        lines.push(line);
        line = ch;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
  });
  return lines;
}

function strokeHoleBorder(ctx, hole) {
  const {
    hx, hy, hw, hh, br, shape,
  } = hole;
  const cx = hx + hw / 2;
  const cy = hy + hh / 2;

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';

  const glowLayers = [
    { w: 3, color: 'rgba(190, 155, 90, 0.55)' },
    { w: 6, color: 'rgba(140, 110, 60, 0.18)' },
    { w: 10, color: 'rgba(100, 80, 45, 0.08)' },
  ];

  glowLayers.forEach(({ w, color }) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    if (shape === 'circle') {
      const radius = Math.min(hw, hh) / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      roundRectPath(ctx, hx, hy, hw, hh, br);
      ctx.stroke();
    }
  });

  ctx.restore();
}

function drawGuideText(ctx, hole) {
  const {
    W, H, hx, hy, hw, hh, text, position,
  } = hole;
  if (!text) return;

  const margin = 16;
  const maxW = Math.min(280, W - margin * 2);
  const cx = hx + hw / 2;
  const lineHeight = 24;
  const fontMain = '500 15px -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif';

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.font = fontMain;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'rgba(255, 255, 255, 0.45)';
  ctx.shadowBlur = 8;

  const lines = wrapTextLines(ctx, text, maxW);
  const blockH = lines.length * lineHeight;

  let startY;
  let textX = cx;
  ctx.textAlign = 'center';

  if (position === 'left') {
    const leftEdge = Math.max(margin, hx - 20 - maxW);
    textX = leftEdge + maxW;
    ctx.textAlign = 'right';
    startY = Math.max(margin, hy + hh / 2 - blockH / 2);
  } else if (position === 'top') {
    startY = Math.max(margin, hy - 20 - blockH);
  } else {
    startY = hy + hh + 20;
    if (startY + blockH > H - 80) startY = H - 80 - blockH;
  }

  lines.forEach((line, idx) => {
    ctx.fillText(line, textX, startY + idx * lineHeight);
  });

  ctx.restore();
}

function paintTutorialFrame(page) {
  const hole = _paintState;
  if (!hole) return;

  wx.nextTick(() => {
    setTimeout(() => {
      const query = wx.createSelectorQuery().in(page);
      query.select('#tut-spotlight-canvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          const entry = res[0];
          if (!entry?.node) return;

          const canvas = entry.node;
          const ctx = canvas.getContext('2d');
          const {
            W, H, hx, hy, hw, hh, br, shape,
          } = hole;

          const dpr = (wx.getWindowInfo && wx.getWindowInfo().pixelRatio)
            || wx.getSystemInfoSync().pixelRatio
            || 2;

          canvas.width = W * dpr;
          canvas.height = H * dpr;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, W, H);

          ctx.fillStyle = 'rgba(50, 40, 22, 0.82)';
          ctx.fillRect(0, 0, W, H);

          ctx.globalCompositeOperation = 'destination-out';
          ctx.fillStyle = '#000';

          const cx = hx + hw / 2;
          const cy = hy + hh / 2;

          if (shape === 'circle') {
            const radius = Math.min(hw, hh) / 2;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();
          } else {
            roundRectPath(ctx, hx, hy, hw, hh, br);
            ctx.fill();
          }

          strokeHoleBorder(ctx, hole);
          drawGuideText(ctx, hole);
        });
    }, 80);
  });
}

function mountOverlay(page, rect, opts) {
  const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
  const W = info.windowWidth || 375;
  const H = info.windowHeight || 667;
  const pad = opts.padding != null ? opts.padding : 10;
  const br = opts.borderRadius != null ? opts.borderRadius : 16;

  const hx = Math.max(0, rect.left - pad);
  const hy = Math.max(0, rect.top - pad);
  const hw = Math.min(W - hx, rect.width + pad * 2);
  const hh = Math.min(H - hy, rect.height + pad * 2);
  const shape = resolveShape(opts, hw, hh, br);
  const textFields = formatTextFields(opts.text);

  _paintState = {
    W,
    H,
    hx,
    hy,
    hw,
    hh,
    br,
    shape,
    text: textFields.textPlain,
    position: opts.position || 'bottom',
  };

  page.setData({
    tutOverlay: {
      active: true,
      visible: false,
      fadeOut: false,
      screenW: W,
      screenH: H,
    },
  }, () => {
    paintTutorialFrame(page);
    wx.nextTick(() => {
      setTimeout(() => page.setData({ 'tutOverlay.visible': true }), 20);
    });
  });

  clearTimers();
  _canDismiss = false;
  _continueTimer = setTimeout(() => {
    _canDismiss = true;
  }, 1000);
  _autoDismissTimer = setTimeout(() => {
    close(page);
  }, 8000);
}

function close(page) {
  _active = false;
  _canDismiss = false;
  _paintState = null;
  clearTimers();
  if (page) {
    const { screenW, screenH } = page.data.tutOverlay || {};
    page.setData({
      tutOverlay: {
        ...emptyOverlay(),
        active: true,
        visible: true,
        fadeOut: true,
        screenW: screenW || 375,
        screenH: screenH || 667,
      },
    });
    setTimeout(() => {
      page.setData({ tutOverlay: emptyOverlay() });
    }, FADE_MS);
  }
  if (_resolve) {
    _resolve();
    _resolve = null;
  }
}

function show(page, opts = {}) {
  if (_active) return Promise.resolve();
  _active = true;

  return new Promise((resolve) => {
    _resolve = resolve;

    const done = (rect) => {
      if (!rect || !rect.width) {
        close(page);
        return;
      }
      mountOverlay(page, rect, opts);
    };

    if (opts.rect) {
      done(opts.rect);
      return;
    }

    if (opts.targetSelector) {
      wx.createSelectorQuery().in(page)
        .select(opts.targetSelector)
        .boundingClientRect()
        .exec((res) => done(res[0]));
      return;
    }

    close(page);
  });
}

function dismiss(page) {
  if (!_active || !_canDismiss) return;
  try {
    if (page.audioManager) page.audioManager.playClickOpen();
  } catch (err) { /* noop */ }
  close(page);
}

function maybeShowClaimReward(page) {
  if (!wx.getStorageSync('tut_guide_claim_reward')) return;
  wx.removeStorageSync('tut_guide_claim_reward');
  setTimeout(() => {
    show(page, {
      targetSelector: '.task-reward.task-claimable',
      text: '点击这里领取奖励',
      position: 'left',
      padding: 10,
      borderRadius: 12,
      shape: 'roundRect',
    });
  }, 400);
}

module.exports = {
  hasSeen,
  markSeen,
  show,
  dismiss,
  maybeShowClaimReward,
  emptyOverlay,
};
