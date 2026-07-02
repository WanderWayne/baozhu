import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const repoRoot = path.resolve(process.cwd(), '..');
const dataDir = path.join(repoRoot, 'js', 'data');
const outputDir = path.join(process.cwd(), 'assets', 'resources', 'config');

const sourceFiles = [
  path.join(dataDir, 'data-worlds.js'),
  path.join(dataDir, 'data-items.js'),
  path.join(dataDir, 'data-atlas.js'),
  path.join(dataDir, 'data-tasks.js'),
];

function sanitizeTasks(tasks) {
  return (tasks || []).map((task) => {
    let rule;
    switch (task.id) {
      case 'first_synthesis':
        rule = { kind: 'discoveredItemsAtLeast', threshold: 1 };
        break;
      case 'discover_10':
        rule = { kind: 'discoveredItemsAtLeast', threshold: 10 };
        break;
      case 'discover_20':
        rule = { kind: 'discoveredItemsAtLeast', threshold: 20 };
        break;
      case 'complete_first5':
        rule = { kind: 'completeAllLevels', levelIds: [101, 102, 103, 104, 105] };
        break;
      case 'complete_boss':
        rule = { kind: 'completeAllLevels', levelIds: [106] };
        break;
      case 'complete_chapter1':
        rule = { kind: 'completeAllLevels', levelIds: [101, 102, 103, 104, 105, 106] };
        break;
      default:
        rule = { kind: 'custom' };
    }
    return {
      id: task.id,
      name: task.name,
      description: task.description,
      rewardLabel: task.reward,
      gems: Number(task.gems || 0),
      rule,
    };
  });
}

async function loadH5Data() {
  const contextObj = {
    window: {
      LevelManager: {
        currentProgress: {
          completedLevels: [],
          discoveredItems: [],
        },
      },
    },
    localStorage: {
      getItem() {
        return null;
      },
      setItem() {},
      removeItem() {},
    },
    console,
    setTimeout,
    clearTimeout,
  };
  contextObj.globalThis = contextObj;
  const context = vm.createContext(contextObj);

  for (const filePath of sourceFiles) {
    const code = await fs.readFile(filePath, 'utf8');
    vm.runInContext(code, context, { filename: filePath });
  }

  return contextObj.window;
}

async function main() {
  const w = await loadH5Data();
  await fs.mkdir(outputDir, { recursive: true });

  const worlds = {
    chapters: w.CHAPTERS || {},
    worlds: w.WORLDS || [],
    levels: w.LEVELS || [],
  };

  const items = {
    recipes: w.RECIPES || [],
    items: w.ITEMS || {},
    itemSvgs: w.ITEM_SVGS || {},
    story: w.STORY || [],
    tips: w.TIPS || {},
    hintSystem: w.HINT_SYSTEM || {},
    achievements: w.ACHIEVEMENTS || {},
    fragments: w.FRAGMENTS || [],
    itemAttributes: w.ITEM_ATTRIBUTES || {},
    attributeRules: w.ATTRIBUTE_RULES || {},
    hiddenRecipes: w.HIDDEN_RECIPES || [],
  };

  const atlas = {
    outerSlotCount: w.ATLAS_OUTER_SLOT_COUNT || 0,
    visual: w.ATLAS_VISUAL || {},
    innerPetals: w.ATLAS_INNER_PETALS || [],
    outerPetals: w.ATLAS_OUTER_PETALS || [],
    petalPaths: w.ATLAS_PETAL_PATHS || [],
    wedgePaths: w.ATLAS_WEDGE_PATHS || [],
    slots: w.ATLAS_SLOTS || [],
    centerSlot: w.ATLAS_CENTER_SLOT || null,
  };

  const tasks = {
    tasks: sanitizeTasks(w.BAOZHU_TASKS || []),
  };

  const merged = {
    meta: {
      generatedAt: new Date().toISOString(),
      source: 'h5-js-globals',
      counts: {
        chapters: Object.keys(worlds.chapters).length,
        worlds: worlds.worlds.length,
        levels: worlds.levels.length,
        recipes: items.recipes.length,
        items: Object.keys(items.items).length,
        fragments: items.fragments.length,
        tasks: tasks.tasks.length,
        atlasSlots: atlas.slots.length + (atlas.centerSlot ? 1 : 0),
      },
    },
    worlds,
    items,
    atlas,
    tasks,
  };

  await Promise.all([
    fs.writeFile(path.join(outputDir, 'worlds.json'), JSON.stringify(worlds, null, 2)),
    fs.writeFile(path.join(outputDir, 'items.json'), JSON.stringify(items, null, 2)),
    fs.writeFile(path.join(outputDir, 'atlas.json'), JSON.stringify(atlas, null, 2)),
    fs.writeFile(path.join(outputDir, 'tasks.json'), JSON.stringify(tasks, null, 2)),
    fs.writeFile(path.join(outputDir, 'game-config.json'), JSON.stringify(merged, null, 2)),
  ]);

  console.log('[export-h5-data] done:', merged.meta.counts);
}

main().catch((err) => {
  console.error('[export-h5-data] failed:', err);
  process.exitCode = 1;
});

