const automator = require('miniprogram-automator');
const MiniProgram = require('miniprogram-automator/out/MiniProgram').default;
const Connection = require('miniprogram-automator/out/Connection').default;
const fs = require('node:fs');
const path = require('node:path');

MiniProgram.prototype.checkVersion = async function checkVersion() {};

const wsEndpoint = process.env.WEAPP_WS || 'ws://127.0.0.1:9423';
const outDir = path.join(__dirname, '..', '..');
const shotPath = path.join(outDir, 'mcp-shot.png');
const logPath = path.join(outDir, 'mcp-console.json');

const logs = [];
const timeout = (ms, label) =>
  new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timeout ${ms}ms`)), ms));

function saveLogs() {
  fs.writeFileSync(logPath, JSON.stringify(logs, null, 2), 'utf8');
}

(async () => {
  const mp = await Promise.race([automator.connect({ wsEndpoint }), timeout(10000, 'connect')]);
  mp.on('console', (entry) => logs.push({ ...entry, ts: Date.now() }));

  await Promise.race([mp.evaluate(() => console.log('[mcp-capture] probe')), timeout(8000, 'evaluate')]).catch(() => {});
  await new Promise((r) => setTimeout(r, 1500));

  const page = await Promise.race([mp.currentPage(), timeout(15000, 'currentPage')]);
  const data = await Promise.race([page.data(), timeout(10000, 'page.data')]);

  console.log('--- page ---');
  console.log('path:', page.path);
  console.log('showCanvas:', data.showCanvas);
  console.log('loadError:', data.loadError || '(none)');
  console.log('pageReady:', data.pageReady);
  console.log('bgColor:', data.bgColor);

  let shotOk = false;
  try {
    await Promise.race([mp.screenshot({ path: shotPath }), timeout(60000, 'screenshot')]);
    shotOk = true;
    console.log('screenshot:', shotPath);
  } catch (e) {
    console.log('screenshot via mp.screenshot failed:', e.message);
    try {
      const conn = await Connection.create(wsEndpoint.replace('ws://', 'ws://'));
      const shot = await Promise.race([conn.send('App.captureScreenshot'), timeout(60000, 'App.captureScreenshot')]);
      if (shot && shot.data) {
        fs.writeFileSync(shotPath, shot.data, 'base64');
        shotOk = true;
        console.log('screenshot via raw API:', shotPath);
      }
      conn.dispose();
    } catch (e2) {
      console.log('raw captureScreenshot failed:', e2.message);
    }
  }

  saveLogs();
  console.log('console logs:', logs.length, 'entries ->', logPath);
  logs.slice(-30).forEach((l) => {
    const msg = l.message || l.text || l.args?.join(' ') || JSON.stringify(l);
    console.log(`[${l.type || l.level || 'log'}]`, msg);
  });

  await mp.disconnect();
  if (!shotOk) process.exit(2);
})().catch((err) => {
  saveLogs();
  console.error('CAPTURE_FAILED:', err.message || err);
  process.exit(1);
});
