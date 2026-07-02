const automator = require('miniprogram-automator');
const MiniProgram = require('miniprogram-automator/out/MiniProgram').default;
const Connection = require('miniprogram-automator/out/Connection').default;
const fs = require('node:fs');
const path = require('node:path');

MiniProgram.prototype.checkVersion = async function checkVersion() {};

const wsEndpoint = process.env.WEAPP_WS || 'ws://127.0.0.1:9423';
const outDir = path.join(__dirname, 'screenshots');
const shotPath = path.join(outDir, 'levels-mini.png');

const timeout = (ms, label) =>
  new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timeout ${ms}ms`)), ms));

(async () => {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const mp = await Promise.race([automator.connect({ wsEndpoint }), timeout(10000, 'connect')]);

  await Promise.race([
    mp.reLaunch('/pages/levels/levels?world=1'),
    timeout(15000, 'reLaunch'),
  ]);

  await new Promise((r) => setTimeout(r, 2200));

  const page = await Promise.race([mp.currentPage(), timeout(10000, 'currentPage')]);
  console.log('page:', page.path);

  let shotOk = false;
  try {
    const conn = await Connection.create(wsEndpoint.replace('ws://', 'ws://'));
    const shot = await Promise.race([conn.send('App.captureScreenshot'), timeout(15000, 'captureScreenshot')]);
    if (shot && shot.data) {
      fs.writeFileSync(shotPath, shot.data, 'base64');
      shotOk = true;
      console.log('screenshot via raw API:', shotPath);
    }
    conn.dispose();
  } catch (e2) {
    console.log('raw capture failed:', e2.message);
  }

  if (!shotOk) {
    try {
      await Promise.race([mp.screenshot({ path: shotPath }), timeout(60000, 'screenshot')]);
      shotOk = true;
      console.log('screenshot:', shotPath);
    } catch (e) {
      console.log('screenshot failed:', e.message);
    }
  }

  await mp.disconnect();
  if (!shotOk) process.exit(2);
})().catch((err) => {
  console.error('CAPTURE_FAILED:', err.message || err);
  process.exit(1);
});
