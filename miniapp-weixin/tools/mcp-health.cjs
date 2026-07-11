const http = require('http');
const automator = require('miniprogram-automator');
const MiniProgram = require('miniprogram-automator/out/MiniProgram').default;

MiniProgram.prototype.checkVersion = async function checkVersion() {};

const wsEndpoint = process.env.WEAPP_WS || 'ws://127.0.0.1:9423';
const autoPort = Number(process.env.WEAPP_AUTO_PORT || wsEndpoint.split(':').pop() || 9423);

function readIdePort() {
  try {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');

    function readIfExists(file) {
      if (fs.existsSync(file)) {
        return Number(fs.readFileSync(file, 'utf8').trim()) || null;
      }
      return null;
    }

    function findIdePortUnder(root) {
      if (!fs.existsSync(root)) return null;
      const stack = [root];
      while (stack.length) {
        const dir = stack.pop();
        let entries;
        try {
          entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch (_) {
          continue;
        }
        for (const entry of entries) {
          const full = path.join(dir, entry.name);
          if (entry.isFile() && entry.name === '.ide') {
            const port = readIfExists(full);
            if (port) return port;
          } else if (entry.isDirectory() && entry.name !== 'node_modules') {
            stack.push(full);
          }
        }
      }
      return null;
    }

    const candidates = [];
    if (process.env.LOCALAPPDATA) {
      candidates.push(path.join(process.env.LOCALAPPDATA, '微信开发者工具', 'User Data', 'Default', '.ide'));
    }
    if (process.platform === 'darwin') {
      candidates.push(path.join(os.homedir(), 'Library/Application Support/微信开发者工具/User Data/Default/.ide'));
      const found = findIdePortUnder(path.join(os.homedir(), 'Library/Application Support/微信开发者工具'));
      if (found) return found;
    }
    for (const ideFile of candidates) {
      const port = readIfExists(ideFile);
      if (port) return port;
    }
  } catch (_) {
    // ignore
  }
  return 44825;
}

function httpJson(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: 5000 }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('timeout'));
    });
  });
}

(async () => {
  const idePort = readIdePort();
  console.log(`[1/3] IDE HTTP http://127.0.0.1:${idePort}/v2/islogin`);

  let login = false;
  try {
    const status = await httpJson(`http://127.0.0.1:${idePort}/v2/islogin`);
    login = Boolean(status.login);
    console.log(`      login: ${login}`);
  } catch (err) {
    console.log(`      FAIL: ${err.message}`);
  }

  if (!login) {
    console.error('');
    console.error('BLOCKED: DevTools not logged in.');
    console.error('  Open WeChat DevTools -> sign in, OR run enable-auto.ps1 (it will stop here).');
    process.exit(1);
  }

  console.log(`[2/3] Automation port ws://127.0.0.1:${autoPort}`);
  console.log('Checking', wsEndpoint, '...');
  const mp = await automator.connect({ wsEndpoint });
  const page = await mp.currentPage();
  const data = await page.data();
  console.log('[3/3] OK connected');
  console.log('  page:', page.path);
  console.log('  showIntro:', data.showIntro);
  console.log('  levelName:', data.levelName || data.pageReady);
  await mp.disconnect();
  process.exit(0);
})().catch((err) => {
  console.error('FAIL:', err.message || err);
  console.error('');
  console.error('Fix steps:');
  console.error('  1. Open WeChat DevTools with this project (repo root, miniprogramRoot=miniapp-weixin/)');
  console.error('  2. Re-login if prompted (需要重新登录)');
  console.error('  3. Settings -> Security -> enable Service Port');
  console.error('  4. Run: bash enable-auto.sh (macOS) or powershell -ExecutionPolicy Bypass -File enable-auto.ps1 (Windows)');
  console.error('  5. Reload Cursor window (MCP reconnects to ws://127.0.0.1:9423)');
  process.exit(1);
});
