/** @feature data-sync @see docs/features/data-sync.md */
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const dataDir = path.join(repoRoot, 'js', 'data');
const outDir = path.join(__dirname, '..', 'data');

const files = [
  path.join(dataDir, 'data-worlds.js'),
  path.join(dataDir, 'data-items.js'),
  path.join(dataDir, 'data-atlas.js'),
  path.join(dataDir, 'data-tasks.js'),
];

async function load() {
  const ctx = {
    window: { LevelManager: { currentProgress: { completedLevels: [], discoveredItems: [] } } },
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    console,
  };
  ctx.globalThis = ctx;
  const context = vm.createContext(ctx);
  for (const f of files) {
    vm.runInContext(await fs.readFile(f, 'utf8'), context, { filename: f });
  }
  return ctx.window;
}

function jsModule(obj) {
  return `module.exports = ${JSON.stringify(obj, null, 2)};\n`;
}

async function main() {
  const w = await load();
  await fs.mkdir(outDir, { recursive: true });

  const meta = {
    fragmentTotal: (w.FRAGMENTS || []).length,
    levelTotal: (w.LEVELS || []).length,
    itemTotal: Object.keys(w.ITEMS || {}).length,
  };

  const tasks = (w.BAOZHU_TASKS || []).map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    reward: t.reward,
    gems: t.gems,
  }));

  await Promise.all([
    fs.writeFile(path.join(outDir, 'meta.js'), jsModule(meta)),
    fs.writeFile(path.join(outDir, 'meta.json'), JSON.stringify(meta, null, 2)),
    fs.writeFile(path.join(outDir, 'worlds.js'), jsModule({
      WORLDS: w.WORLDS || [],
      LEVELS: w.LEVELS || [],
      CHAPTERS: w.CHAPTERS || {},
    })),
    fs.writeFile(path.join(outDir, 'items.js'), jsModule({
      ITEMS: w.ITEMS || {},
      RECIPES: w.RECIPES || [],
      HINT_SYSTEM: w.HINT_SYSTEM || {},
      TIPS: w.TIPS || {},
      FRAGMENTS: w.FRAGMENTS || [],
    })),
    fs.writeFile(path.join(outDir, 'chapters.js'), jsModule(w.CHAPTERS || {})),
    fs.writeFile(path.join(outDir, 'chapters.json'), JSON.stringify(w.CHAPTERS || {}, null, 2)),
    fs.writeFile(path.join(outDir, 'atlas.js'), jsModule({
      slots: w.ATLAS_SLOTS || [],
      centerSlot: w.ATLAS_CENTER_SLOT || null,
      innerPetals: w.ATLAS_INNER_PETALS || [],
      outerPetals: w.ATLAS_OUTER_PETALS || [],
      visual: w.ATLAS_VISUAL || {},
    })),
    fs.writeFile(path.join(outDir, 'atlas.json'), JSON.stringify({
      slots: w.ATLAS_SLOTS || [],
      centerSlot: w.ATLAS_CENTER_SLOT || null,
    }, null, 2)),
    fs.writeFile(path.join(outDir, 'tasks.js'), jsModule(tasks)),
    fs.writeFile(path.join(outDir, 'tasks.json'), JSON.stringify(tasks, null, 2)),
  ]);

  console.log('[export-data] ok', meta);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
