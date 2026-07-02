/** 小程序 canvas 2d 对 Path2D(svg) 描边支持不完整，用手绘路径对齐 H5 */

function tokenizePath(d) {
  return d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
}

function readNum(tokens, idx) {
  return parseFloat(tokens[idx]);
}

function tracePath(ctx, d) {
  const tokens = tokenizePath(d);
  let i = 0;
  let cmd = '';
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;

  ctx.beginPath();

  while (i < tokens.length) {
    const t = tokens[i];
    if (/[a-zA-Z]/.test(t)) {
      cmd = t;
      i += 1;
      continue;
    }

    switch (cmd) {
      case 'M':
        x = readNum(tokens, i);
        y = readNum(tokens, i + 1);
        startX = x;
        startY = y;
        ctx.moveTo(x, y);
        i += 2;
        break;
      case 'L':
        x = readNum(tokens, i);
        y = readNum(tokens, i + 1);
        ctx.lineTo(x, y);
        i += 2;
        break;
      case 'Q': {
        const cpx = readNum(tokens, i);
        const cpy = readNum(tokens, i + 1);
        x = readNum(tokens, i + 2);
        y = readNum(tokens, i + 3);
        ctx.quadraticCurveTo(cpx, cpy, x, y);
        i += 4;
        break;
      }
      case 'A': {
        const rx = readNum(tokens, i);
        const ry = readNum(tokens, i + 1);
        i += 5;
        x = readNum(tokens, i);
        y = readNum(tokens, i + 1);
        ctx.ellipse((startX + x) / 2, y, rx, ry, 0, Math.PI, 0, false);
        i += 2;
        break;
      }
      case 'Z':
      case 'z':
        ctx.closePath();
        x = startX;
        y = startY;
        i += 1;
        break;
      default:
        i += 1;
        break;
    }
  }
}

function strokePath(ctx, d) {
  tracePath(ctx, d);
  ctx.stroke();
}

function fillPath(ctx, d) {
  tracePath(ctx, d);
  ctx.fill();
}

function fillEllipse(ctx, x, y, rx, ry, rotation) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
  ctx.fill();
}

function setStrokeWidth(ctx, designWidth, scaleX, scaleY) {
  const minScale = Math.max(Math.min(Math.abs(scaleX), Math.abs(scaleY)), 0.35);
  ctx.lineWidth = designWidth / minScale;
}

function drawWheat1(ctx, scaleX, scaleY, designH) {
  const root = designH || 250;
  setStrokeWidth(ctx, 3, scaleX, scaleY);
  ctx.beginPath();
  ctx.moveTo(30, root);
  if (root > 204) {
    ctx.quadraticCurveTo(30, 200 + (root - 200) * 0.55, 30, 200);
  }
  ctx.quadraticCurveTo(30, 150, 35, 100);
  ctx.quadraticCurveTo(40, 60, 20, 20);
  ctx.stroke();

  ctx.globalAlpha *= 0.8;
  setStrokeWidth(ctx, 2, scaleX, scaleY);
  ctx.beginPath();
  ctx.moveTo(32, 80);
  ctx.quadraticCurveTo(45, 70, 55, 75);
  ctx.stroke();
}

function drawWheat2(ctx, scaleX, scaleY, designH) {
  const root = designH || 250;
  setStrokeWidth(ctx, 3, scaleX, scaleY);
  ctx.beginPath();
  ctx.moveTo(30, root);
  if (root > 204) {
    ctx.quadraticCurveTo(28, 200 + (root - 200) * 0.5, 30, 200);
  }
  ctx.quadraticCurveTo(28, 120, 30, 20);
  ctx.stroke();

  ctx.globalAlpha *= 0.8;
  setStrokeWidth(ctx, 2, scaleX, scaleY);
  ctx.beginPath();
  ctx.moveTo(30, 140);
  ctx.quadraticCurveTo(10, 130, 5, 135);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(30, 100);
  ctx.quadraticCurveTo(50, 90, 55, 95);
  ctx.stroke();
}

function drawWheat3(ctx, scaleX, scaleY, designH) {
  const root = designH || 250;
  setStrokeWidth(ctx, 3, scaleX, scaleY);
  ctx.beginPath();
  ctx.moveTo(25, root);
  if (root > 204) {
    ctx.quadraticCurveTo(25, 200 + (root - 200) * 0.5, 25, 200);
  }
  ctx.quadraticCurveTo(25, 140, 30, 90);
  ctx.quadraticCurveTo(35, 50, 50, 20);
  ctx.stroke();

  ctx.globalAlpha *= 0.8;
  setStrokeWidth(ctx, 2, scaleX, scaleY);
  ctx.beginPath();
  ctx.moveTo(28, 120);
  ctx.quadraticCurveTo(10, 110, 5, 115);
  ctx.stroke();
}

function drawDecorElements(ctx, decorElements, layer) {
  const color = '#6B5344';

  decorElements.forEach((el) => {
    if (el.layer !== layer) return;

    const alpha = el.alpha * (0.9 + Math.sin(el.breathPhase) * 0.1);

    ctx.save();
    ctx.translate(el.x, el.y);

    const scaleX = el.width / (el.type.includes('wheat') ? 60 : el.type === 'jar' ? 100 : 100);
    const wheatDesignH = el.designH || 250;
    const scaleY = el.height / (el.type.includes('wheat') ? wheatDesignH : el.type === 'jar' ? 140 : 60);

    if (el.rotation) {
      ctx.translate(el.width / 2, el.height / 2);
      ctx.rotate(el.rotation);
      ctx.translate(-el.width / 2, -el.height / 2);
    }

    ctx.scale(scaleX, scaleY);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (el.type === 'jar') {
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#6B5344';
      fillPath(ctx, 'M25 25 Q25 15 35 12 L65 12 Q75 15 75 25 L78 40 Q85 50 85 75 Q85 125 50 135 Q15 125 15 75 Q15 50 22 40 Z');
      ctx.fillStyle = '#5D4037';
      fillPath(ctx, 'M30 18 A20 6 0 0 1 70 18 A20 6 0 0 1 30 18');
      ctx.fillStyle = '#4E342E';
      fillPath(ctx, 'M32 16 A18 5 0 0 1 68 16 A18 5 0 0 1 32 16');
      setStrokeWidth(ctx, 3, scaleX, scaleY);
      ctx.strokeStyle = 'rgba(200, 180, 160, 0.4)';
      strokePath(ctx, 'M30 60 Q28 90 35 110');
    } else if (el.type === 'bowl') {
      setStrokeWidth(ctx, 3, scaleX, scaleY);
      strokePath(ctx, 'M10 15 Q10 55 50 55 Q90 55 90 15');
      setStrokeWidth(ctx, 2, scaleX, scaleY);
      strokePath(ctx, 'M10 15 A40 8 0 0 1 90 15 A40 8 0 0 1 10 15');
      ctx.globalAlpha *= 0.6;
      fillPath(ctx, 'M35 52 A15 3 0 0 1 65 52 A15 3 0 0 1 35 52');
    } else if (el.type === 'wheat1') {
      drawWheat1(ctx, scaleX, scaleY, wheatDesignH);
      ctx.globalAlpha *= 0.8;
      fillEllipse(ctx, 22, 25, 4, 8, -0.35);
      fillEllipse(ctx, 20, 38, 4, 7, -0.44);
      fillEllipse(ctx, 23, 50, 3, 6, -0.26);
    } else if (el.type === 'wheat2') {
      drawWheat2(ctx, scaleX, scaleY, wheatDesignH);
      ctx.globalAlpha *= 0.8;
      fillEllipse(ctx, 26, 25, 4, 8, -0.09);
      fillEllipse(ctx, 34, 35, 4, 7, 0.09);
      fillEllipse(ctx, 26, 45, 3, 6, -0.09);
      fillEllipse(ctx, 34, 55, 3, 6, 0.09);
    } else if (el.type === 'wheat3') {
      drawWheat3(ctx, scaleX, scaleY, wheatDesignH);
      ctx.globalAlpha *= 0.8;
      fillEllipse(ctx, 48, 25, 4, 8, 0.35);
      fillEllipse(ctx, 45, 38, 3, 7, 0.26);
    }

    ctx.restore();
  });
}

module.exports = { drawDecorElements };
