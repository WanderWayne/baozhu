const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

const repoRoot = path.join(__dirname, '..', '..');
const outPath = path.join(__dirname, 'screenshots', 'levels-h5.png');
const port = 3457;
const url = `http://127.0.0.1:${port}/levels.html?world=1`;

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

(async () => {
  const server = serveStatic(repoRoot);
  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));

  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch {
    console.error('Install puppeteer in miniapp-weixin/tools or run: npm i puppeteer --prefix miniapp-weixin/tools');
    server.close();
    process.exit(1);
  }

  const browser = await puppeteer.launch({ headless: 'new', defaultViewport: { width: 390, height: 844 } });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: outPath, fullPage: false });
  await browser.close();
  server.close();
  console.log('screenshot:', outPath);
})().catch((err) => {
  console.error('CAPTURE_H5_FAILED:', err.message || err);
  process.exit(1);
});
