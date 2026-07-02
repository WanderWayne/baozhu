import fs from 'node:fs/promises';
import path from 'node:path';

const cfgRoot = path.join(process.cwd(), 'assets', 'resources', 'config');

async function readJson(name) {
  const filePath = path.join(cfgRoot, name);
  const text = await fs.readFile(filePath, 'utf8');
  return JSON.parse(text);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function unique(arr) {
  return new Set(arr).size === arr.length;
}

async function main() {
  const worlds = await readJson('worlds.json');
  const items = await readJson('items.json');
  const atlas = await readJson('atlas.json');
  const tasks = await readJson('tasks.json');

  const worldIds = worlds.worlds.map((w) => w.id);
  const levelIds = worlds.levels.map((l) => l.id);
  const itemNames = Object.keys(items.items);
  const taskIds = tasks.tasks.map((t) => t.id);
  const atlasSlotIds = [...atlas.slots.map((s) => s.id), atlas.centerSlot?.id].filter(Boolean);

  assert(unique(worldIds), 'Duplicate world id detected');
  assert(unique(levelIds), 'Duplicate level id detected');
  assert(unique(itemNames), 'Duplicate item name detected');
  assert(unique(taskIds), 'Duplicate task id detected');
  assert(unique(atlasSlotIds), 'Duplicate atlas slot id detected');

  worlds.levels.forEach((level) => {
    assert(worldIds.includes(level.worldId), `Level ${level.id} references missing world ${level.worldId}`);
  });

  items.recipes.forEach((recipe, idx) => {
    assert(Array.isArray(recipe.ingredients), `Recipe[${idx}] ingredients must be array`);
    assert(recipe.ingredients.length >= 2, `Recipe[${idx}] must have >=2 ingredients`);
    assert(typeof recipe.result === 'string' && recipe.result.length > 0, `Recipe[${idx}] result missing`);
  });

  tasks.tasks.forEach((task, idx) => {
    assert(task.rule && typeof task.rule.kind === 'string', `Task[${idx}] rule missing`);
  });

  console.log('[validate-config] ok', {
    worlds: worlds.worlds.length,
    levels: worlds.levels.length,
    items: itemNames.length,
    recipes: items.recipes.length,
    tasks: tasks.tasks.length,
    atlasSlots: atlasSlotIds.length,
  });
}

main().catch((err) => {
  console.error('[validate-config] failed:', err.message);
  process.exitCode = 1;
});

