import fs from 'node:fs/promises';
import path from 'node:path';

const cfgRoot = path.join(process.cwd(), 'assets', 'resources', 'config');
const toolsRoot = path.join(process.cwd(), 'tools');

async function readJson(p) {
  return JSON.parse(await fs.readFile(p, 'utf8'));
}

async function main() {
  const gameConfig = await readJson(path.join(cfgRoot, 'game-config.json'));
  const cases = await readJson(path.join(toolsRoot, 'parity-cases.json'));

  const recipes = new Map();
  gameConfig.items.recipes.forEach((r) => {
    recipes.set([...r.ingredients].sort().join('|'), r.result);
  });

  const lines = [];
  lines.push('# Parity Report');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');

  for (const c of cases.cases) {
    if (c.ingredients) {
      const got = recipes.get([...c.ingredients].sort().join('|'));
      lines.push(`- [${got === c.expected ? 'x' : ' '}] ${c.id}: ${c.title} (got: ${got || 'NONE'})`);
      continue;
    }
    if (c.levelId) {
      const level = gameConfig.worlds.levels.find((l) => l.id === c.levelId);
      const ok = !!level && level.target === c.target;
      lines.push(`- [${ok ? 'x' : ' '}] ${c.id}: ${c.title}`);
      continue;
    }
    if (c.taskId) {
      const task = gameConfig.tasks.tasks.find((t) => t.id === c.taskId);
      lines.push(`- [${task ? 'x' : ' '}] ${c.id}: ${c.title}`);
      continue;
    }
    if (c.slotIds) {
      const set = new Set(gameConfig.atlas.slots.map((s) => s.id));
      const ok = c.slotIds.every((id) => set.has(id));
      lines.push(`- [${ok ? 'x' : ' '}] ${c.id}: ${c.title}`);
      continue;
    }
    lines.push(`- [ ] ${c.id}: ${c.title}`);
  }

  const outPath = path.join(process.cwd(), 'docs', 'parity-report.md');
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${lines.join('\n')}\n`);
  console.log(`[parity-report] wrote ${outPath}`);
}

main().catch((err) => {
  console.error('[parity-report] failed', err);
  process.exitCode = 1;
});

