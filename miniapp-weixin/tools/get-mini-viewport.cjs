const automator = require('miniprogram-automator');
const MiniProgram = require('miniprogram-automator/out/MiniProgram').default;

MiniProgram.prototype.checkVersion = async function checkVersion() {};

const DEFAULT = { w: 390, h: 844 };
const WS = process.env.WEAPP_WS || 'ws://127.0.0.1:9423';

function parsePageH(layoutStyle) {
  const m = /--page-h:(\d+)px/.exec(layoutStyle || '');
  return m ? Number(m[1]) : null;
}

async function getMiniViewport() {
  let mp;
  try {
    mp = await Promise.race([
      automator.connect({ wsEndpoint: WS }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('connect timeout')), 8000)),
    ]);
    const page = await mp.currentPage();
    const data = await page.data();
    const pageH = parsePageH(data.layoutStyle);
    if (pageH) return { w: DEFAULT.w, h: pageH };

    const metrics = await page.callMethod('getLayoutMetrics').catch(() => null);
    if (metrics && metrics.windowHeight) {
      return { w: DEFAULT.w, h: metrics.windowHeight };
    }
  } catch (_) {
    /* fall through */
  } finally {
    if (mp && typeof mp.disconnect === 'function') {
      try { await mp.disconnect(); } catch (_) { /* noop */ }
    }
  }
  return DEFAULT;
}

module.exports = { getMiniViewport, DEFAULT };

if (require.main === module) {
  getMiniViewport().then((v) => console.log(JSON.stringify(v))).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
