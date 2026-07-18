const PT_STORAGE = 'page_transitioning';
const FADE_OUT_MS = 500;
const FADE_IN_MS = 600;
const FADE_FRAME_MS = 40;
let navigating = false;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getTargetMode() {
  // 所有页面统一先压暗，避免暖白遮罩与浅色页面背景混在一起，
  // 造成某些方向看似完全没有转场。
  return 'black';
}

function getTopPage() {
  const pages = getCurrentPages();
  return pages.length ? pages[pages.length - 1] : null;
}

function stashEnterTransition(mode) {
  try {
    wx.setStorageSync(PT_STORAGE, mode);
  } catch (err) { /* ignore */ }
}

function consumeEnterTransition() {
  try {
    const mode = wx.getStorageSync(PT_STORAGE);
    if (!mode) return '';
    wx.removeStorageSync(PT_STORAGE);
    return mode;
  } catch (err) {
    return '';
  }
}

function animateTransitionOpacity(page, from, to, duration) {
  if (!page || typeof page.setData !== 'function') return Promise.resolve();

  const applyFrame = (opacity) => {
    page.setData({
      'pageTransition.opacity': opacity,
      'pageTransition.contentOpacity': 1 - opacity,
    });
    if (typeof page._setCanvasTransitionOpacity === 'function') {
      page._setCanvasTransitionOpacity(opacity);
    }
  };

  const startedAt = Date.now();
  applyFrame(from);

  return new Promise((resolve) => {
    const timer = setInterval(() => {
      const progress = Math.min(1, (Date.now() - startedAt) / duration);
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - ((-2 * progress + 2) ** 2) / 2;
      const opacity = from + ((to - from) * eased);
      applyFrame(opacity);

      if (progress >= 1) {
        clearInterval(timer);
        resolve();
      }
    }, FADE_FRAME_MS);
  });
}

async function playFadeOut(mode) {
  const page = getTopPage();
  if (!page || typeof page.setData !== 'function') {
    await delay(FADE_OUT_MS);
    return;
  }

  await new Promise((resolve) => {
    page.setData({
      pageTransition: {
        active: true,
        opacity: 0,
        contentOpacity: 1,
        leaving: true,
        mode,
      },
    }, resolve);
  });

  await animateTransitionOpacity(page, 0, 1, FADE_OUT_MS);
}

async function navigateWithFade(url) {
  if (navigating) return;
  navigating = true;
  const mode = getTargetMode(url);
  await playFadeOut(mode);
  stashEnterTransition(mode);

  return new Promise((resolve) => {
    // 旧页与目标页都保持全黑，系统推入发生在黑屏之间，不会显出滑动。
    // 保留页面栈可避免 reLaunch 销毁 WebView 时产生白色空帧。
    wx.navigateTo({
      url,
      complete: (res) => {
        navigating = false;
        resolve(res);
      },
    });
  });
}

async function navigateBackWithFade(fallbackUrl) {
  if (navigating) return;
  navigating = true;
  const destUrl = fallbackUrl || '/pages/index/index';
  const mode = getTargetMode(destUrl || '/pages/index/index');

  await playFadeOut(mode);
  stashEnterTransition(mode);

  return new Promise((resolve) => {
    const pages = getCurrentPages();
    const route = pages.length > 1 ? wx.navigateBack : wx.redirectTo;
    const options = pages.length > 1 ? { delta: 1 } : { url: destUrl };
    route({
      ...options,
      complete: (res) => {
        navigating = false;
        resolve(res);
      },
    });
  });
}

function navigateToWithFade(url) {
  return navigateWithFade(url);
}

function reLaunchWithFade(url) {
  if (navigating) return;
  navigating = true;
  const mode = getTargetMode(url);
  return playFadeOut(mode).then(() => {
    stashEnterTransition(mode);
    return new Promise((resolve) => {
      wx.reLaunch({
        url,
        complete: (res) => {
          navigating = false;
          resolve(res);
        },
      });
    });
  });
}

function redirectToWithFade(url) {
  if (navigating) return;
  navigating = true;
  const mode = getTargetMode(url);
  return playFadeOut(mode).then(() => {
    stashEnterTransition(mode);
    return new Promise((resolve) => {
      wx.redirectTo({
        url,
        complete: (res) => {
          navigating = false;
          resolve(res);
        },
      });
    });
  });
}

async function navigateHomeWithFade(fallbackUrl = '/pages/index/index') {
  if (navigating) return;
  navigating = true;
  const mode = getTargetMode(fallbackUrl);
  await playFadeOut(mode);
  stashEnterTransition(mode);

  return new Promise((resolve) => {
    const pages = getCurrentPages();
    const route = pages.length > 1 ? wx.navigateBack : wx.redirectTo;
    const options = pages.length > 1
      ? { delta: pages.length - 1 }
      : { url: fallbackUrl };
    route({
      ...options,
      complete: (res) => {
        navigating = false;
        resolve(res);
      },
    });
  });
}

module.exports = {
  PT_STORAGE,
  FADE_OUT_MS,
  FADE_IN_MS,
  animateTransitionOpacity,
  consumeEnterTransition,
  navigateWithFade,
  navigateBackWithFade,
  navigateToWithFade,
  navigateHomeWithFade,
  reLaunchWithFade,
  redirectToWithFade,
};
