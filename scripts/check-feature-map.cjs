#!/usr/bin/env node
/**
 * 校验 @feature 注释与 docs/features/*.md 文档互指。
 * 用法: node scripts/check-feature-map.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FEAT_DIR = path.join(ROOT, 'docs/features');
const SCAN_DIRS = [
  path.join(ROOT, 'js'),
  path.join(ROOT, 'miniapp-weixin/utils'),
  path.join(ROOT, 'miniapp-weixin/pages'),
  path.join(ROOT, 'miniapp-weixin/components'),
];

const FEATURE_RE = /@feature\s+([a-z0-9-]+)/g;
const MD_LINK_RE = /\[([^\]]+)\]\(([^)]+\.(?:js|wxml|wxss|json|mjs|cjs))\)/g;
const BACKTICK_PATH_RE = /`((?:js|miniapp-weixin|css)\/[^`]+)`/g;

let errors = 0;
let warnings = 0;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(js|mjs|cjs|wxml|wxss|json|md)$/.test(name)) out.push(p);
  }
  return out;
}

const featureDocs = fs.readdirSync(FEAT_DIR)
  .filter((f) => f.endsWith('.md') && f !== '_TEMPLATE.md')
  .map((f) => f.replace(/\.md$/, ''));

const tagged = new Map();

for (const dir of SCAN_DIRS) {
  for (const file of walk(dir)) {
    const text = fs.readFileSync(file, 'utf8');
    let m;
    FEATURE_RE.lastIndex = 0;
    while ((m = FEATURE_RE.exec(text)) !== null) {
      const id = m[1];
      if (!tagged.has(id)) tagged.set(id, []);
      tagged.get(id).push(path.relative(ROOT, file));
    }
  }
}

for (const id of featureDocs) {
  const docPath = path.join(FEAT_DIR, `${id}.md`);
  const doc = fs.readFileSync(docPath, 'utf8');
  if (!tagged.has(id)) {
    console.warn(`WARN  docs/features/${id}.md 无对应 @feature 代码文件`);
    warnings += 1;
  }
}

for (const [id, files] of tagged) {
  const docPath = path.join(FEAT_DIR, `${id}.md`);
  if (!fs.existsSync(docPath)) {
    console.error(`ERROR @feature ${id} 缺少 docs/features/${id}.md`);
    errors += 1;
    continue;
  }
  console.log(`OK    ${id} ← ${files.length} file(s)`);
}

const indexPath = path.join(ROOT, 'docs/FEATURE_INDEX.md');
if (!fs.existsSync(indexPath)) {
  console.error('ERROR 缺少 docs/FEATURE_INDEX.md');
  errors += 1;
} else {
  for (const id of featureDocs) {
    if (!fs.readFileSync(indexPath, 'utf8').includes(`\`${id}\``)) {
      console.warn(`WARN  FEATURE_INDEX 未列出 ${id}`);
      warnings += 1;
    }
  }
}

console.log(`\n${errors} error(s), ${warnings} warning(s)`);
process.exit(errors > 0 ? 1 : 0);
