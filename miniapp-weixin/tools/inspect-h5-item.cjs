const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

const repoRoot = path.join(__dirname, '..', '..');
const port = 3458;

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
    const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
}

(async () => {
  const puppeteer = require('puppeteer');
  const server = serveStatic(repoRoot);
  await new Promise((r) => server.listen(port, '127.0.0.1', r));
  const browser = await puppeteer.launch({ headless: 'new', defaultViewport: { width: 390, height: 844 } });
  try {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${port}/game.html?level=101`, { waitUntil: 'networkidle2' });
    await page.click('.level-intro-overlay').catch(() => {});
    await new Promise((r) => setTimeout(r, 800));
    const info = await page.evaluate(() => {
      const item = document.querySelector('#inventory-area .game-item');
      if (!item) return null;
      const icon = item.querySelector('.icon');
      const name = item.querySelector('.name');
      const cs = (el) => {
        if (!el) return null;
        const s = getComputedStyle(el);
        return {
          tag: el.tagName,
          className: el.className,
          html: el.outerHTML.slice(0, 200),
          fontSize: s.fontSize,
          padding: s.padding,
          background: s.backgroundColor,
          borderRadius: s.borderRadius,
          width: s.width,
          marginTop: s.marginTop,
        };
      };
      return {
        itemHtml: item.outerHTML,
        item: cs(item),
        icon: cs(icon),
        name: cs(name),
      };
    });
    console.log(JSON.stringify(info, null, 2));
  } finally {
    await browser.close();
    server.close();
  }
})();
