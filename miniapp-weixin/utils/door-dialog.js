const gameLayout = require('./game-layout');

let hideTimer = null;
let fadeTimer = null;
let dialogChain = null;

function calcDuration(text) {
  return Math.min(Math.max((text || '').length * 280, 3000), 7000);
}

function splitDialogText(text, maxLen = 20) {
  if (!text || text.length <= maxLen) return [text];
  const chunks = [];
  const puncts = /([，。！？、；：…—])/;
  let remaining = text;
  while (remaining.length > maxLen) {
    let cutAt = -1;
    for (let i = Math.min(maxLen, remaining.length) - 1; i >= Math.floor(maxLen * 0.5); i -= 1) {
      if (puncts.test(remaining[i])) { cutAt = i + 1; break; }
    }
    if (cutAt === -1) cutAt = maxLen;
    chunks.push(remaining.slice(0, cutAt));
    remaining = remaining.slice(cutAt);
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

function pickBubbleSide(doorRect, screenW) {
  if (!doorRect) return Math.random() < 0.5 ? 'left' : 'right';
  const spaceRight = screenW - doorRect.right;
  const spaceLeft = doorRect.left;
  const minUsable = 90;
  const canRight = spaceRight >= minUsable;
  const canLeft = spaceLeft >= minUsable;
  if (canRight && canLeft) return Math.random() < 0.5 ? 'left' : 'right';
  return canRight ? 'right' : 'left';
}

function layoutBubblePosition(doorRect, bubbleW, bubbleH, side, screenW, screenH) {
  const pad = 6;
  const gap = 16 + Math.random() * 10;
  const yRange = Math.max(doorRect.height * 0.7, 60);
  const yCenterBase = doorRect.top + doorRect.height * 0.45;
  const yJitter = (Math.random() - 0.5) * yRange;
  let y = yCenterBase - bubbleH / 2 + yJitter;
  let x;
  if (side === 'right') {
    x = doorRect.right + gap;
  } else {
    x = doorRect.left - bubbleW - gap;
  }
  x = Math.max(pad, Math.min(x, screenW - bubbleW - pad));
  y = Math.max(pad, Math.min(y, screenH - bubbleH - pad));
  return { x: Math.round(x), y: Math.round(y) };
}

function clearTimers() {
  if (hideTimer) clearTimeout(hideTimer);
  if (fadeTimer) clearTimeout(fadeTimer);
  hideTimer = null;
  fadeTimer = null;
}

function measureDoorRect(page) {
  return new Promise((resolve) => {
    const cached = page.controller && page.controller.doorRect;
    if (cached && cached.width) {
      resolve(cached);
      return;
    }
    const query = wx.createSelectorQuery().in(page);
    query.select('#door-container').boundingClientRect();
    query.exec((res) => resolve(res[0] || null));
  });
}

function measureBubbleRect(page) {
  return new Promise((resolve) => {
    const query = wx.createSelectorQuery().in(page);
    query.select('#door-bubble').boundingClientRect();
    query.exec((res) => resolve(res[0] || null));
  });
}

function scheduleFadeOut(page, durationMs, onDone) {
  clearTimers();
  hideTimer = setTimeout(() => {
    hideTimer = null;
    if (!page.data.doorBubbleText) {
      if (onDone) onDone();
      return;
    }
    page.setData({ doorBubbleFading: true });
    fadeTimer = setTimeout(() => {
      fadeTimer = null;
      page.setData({
        doorBubbleText: '',
        doorBubbleVisible: false,
        doorBubbleFading: false,
      });
      if (onDone) onDone();
    }, 900);
  }, durationMs);
}

function showDoorBubbleInternal(page, text) {
  if (!page || !text) return Promise.resolve();

  const viewport = gameLayout.getViewport();
  const screenW = viewport.windowWidth;
  const screenH = viewport.windowHeight;

  return measureDoorRect(page).then((doorRect) => {
    if (!doorRect) return;

    const side = pickBubbleSide(doorRect, screenW);
    const tailClass = side === 'left' ? 'tail-right' : 'tail-left';
    const gap = 16;
    const pad = 6;
    let availW;
    if (side === 'right') {
      availW = screenW - doorRect.right - gap - pad;
    } else {
      availW = doorRect.left - gap - pad;
    }
    availW = Math.max(availW, 80);
    const maxW = Math.min(300, screenW * 0.44, availW);

    return new Promise((resolve) => {
      page.setData({
        doorBubbleText: text,
        doorBubbleTail: tailClass,
        doorBubbleMaxWidth: Math.round(maxW),
        doorBubbleLeft: -9999,
        doorBubbleTop: 0,
        doorBubbleVisible: false,
        doorBubbleFading: false,
      }, () => {
        wx.nextTick(() => {
          measureBubbleRect(page).then((bubbleRect) => {
            if (!bubbleRect || !bubbleRect.width) {
              resolve();
              return;
            }
            const pos = layoutBubblePosition(
              doorRect,
              bubbleRect.width,
              bubbleRect.height,
              side,
              screenW,
              screenH,
            );
            page.setData({
              doorBubbleLeft: pos.x,
              doorBubbleTop: pos.y,
              doorBubbleVisible: true,
            });
            scheduleFadeOut(page, calcDuration(text), resolve);
          });
        });
      });
    });
  });
}

/**
 * 对齐 H5 game-core.js showDoorBubble — 绝对定位在门左/右侧，带尾巴与渐入渐出
 */
function showDoorBubble(page, text) {
  clearTimers();
  dialogChain = null;
  return showDoorBubbleInternal(page, text);
}

function showDialog(page, text) {
  const lines = splitDialogText(text);
  clearTimers();
  dialogChain = lines.reduce(
    (chain, line) => chain.then(() => showDoorBubbleInternal(page, line)),
    Promise.resolve(),
  );
  return dialogChain;
}

function showTriggerDialog(page, text) {
  const lines = splitDialogText(text);
  lines.forEach((line) => showDoorBubble(page, line));
}

function hideDoorBubble(page) {
  clearTimers();
  dialogChain = null;
  if (!page) return Promise.resolve();
  if (!page.data.doorBubbleText) {
    page.setData({ doorBubbleVisible: false, doorBubbleFading: false });
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    page.setData({ doorBubbleFading: true });
    fadeTimer = setTimeout(() => {
      fadeTimer = null;
      page.setData({
        doorBubbleText: '',
        doorBubbleVisible: false,
        doorBubbleFading: false,
      });
      resolve();
    }, 900);
  });
}

function dismissAllDialogs(page) {
  return hideDoorBubble(page);
}

/** 顺序播放关卡开场对白（对齐 H5 _playLevelDialogs runOpeningDialogs） */
function playLevelDialogs(page, dialogs) {
  if (!dialogs || !dialogs.length) return Promise.resolve();
  let chain = new Promise((resolve) => setTimeout(resolve, 400));
  dialogs.forEach((d) => {
    if (d?.text) {
      chain = chain.then(() => showDialog(page, d.text));
    }
  });
  return chain;
}

module.exports = {
  showDoorBubble,
  showDialog,
  showTriggerDialog,
  hideDoorBubble,
  dismissAllDialogs,
  playLevelDialogs,
  calcDuration,
  splitDialogText,
};
