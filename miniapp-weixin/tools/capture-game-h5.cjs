const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

const repoRoot = path.join(__dirname, '..', '..');
const outDir = path.join(__dirname, 'screenshots');
const levelId = process.argv[2] || '101';
const outPath = path.join(outDir, `game-${levelId}-h5.png`);
const port = Number(process.env.H5_PORT || 3457);
const viewportW = Number(process.env.VIEWPORT_W || 390);
const viewportH = Number(process.env.VIEWPORT_H || 844);
const url = `http://127.0.0.1:${port}/game.html?level=${levelId}`;

function serveStatic(root) {
  return http.createServer((req, res) => {
    const rel = decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\//, '') || 'index.html';
    const file = path.join(root, rel);
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(file).toLowerCase();
    const types = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.mp3': 'audio/mpeg',
      '.svg': 'image/svg+xml',
    };
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const puppeteer = require('puppeteer');
  const server = serveStatic(repoRoot);
  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));

  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: viewportW, height: viewportH },
  });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    await delay(2000);

    const intro = await page.$('.level-intro-overlay.visible, .level-intro-overlay');
    if (intro) {
      await intro.click();
      await delay(800);
    }

    await page.waitForSelector('.door-bubble.visible', { timeout: 2500 }).catch(() => {});
    await delay(400);

    await page.screenshot({ path: outPath, fullPage: false });
    console.log('screenshot:', outPath);
  } finally {
    await browser.close();
    server.close();
  }
})().catch((err) => {
  console.error('CAPTURE_H5_FAILED:', err.message || err);
  process.exit(1);
});
