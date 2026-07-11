#!/usr/bin/env node
/** Extract class methods from game-core.js into Game.prototype modules */
const fs = require('fs');
const path = require('path');

const CORE = path.join(__dirname, '../js/game/game-core.js');
const src = fs.readFileSync(CORE, 'utf8');
const lines = src.split('\n');

const classStart = lines.findIndex((l) => l.startsWith('class Game'));
const classEnd = lines.findIndex((l, i) => i > classStart && l === '}');
if (classStart < 0 || classEnd < 0) {
  console.error('Could not find class Game bounds');
  process.exit(1);
}

function findMethodEnd(startIdx) {
  let depth = 0;
  let started = false;
  for (let i = startIdx; i < classEnd; i++) {
    const line = lines[i];
    for (const ch of line) {
      if (ch === '{') { depth++; started = true; }
      else if (ch === '}') depth--;
    }
    if (started && depth === 0) return i;
  }
  return classEnd - 1;
}

function parseMethods() {
  const methods = [];
  for (let i = classStart + 1; i < classEnd; i++) {
    const m = lines[i].match(/^    (static )?([a-zA-Z_][\w$]*)\s*\(/);
    if (!m) continue;
    const end = findMethodEnd(i);
    methods.push({
      name: m[2],
      static: !!m[1],
      start: i,
      end,
      body: lines.slice(i, end + 1),
    });
    i = end;
  }
  return methods;
}

function toPrototypeBlock(method) {
  const prefix = method.static ? 'Game.' : 'Game.prototype.';
  const head = method.body[0].replace(/^    static /, '    ').replace(/^    ([\w$]+)\s*\(/, `${prefix}$1 = function(`);
  const rest = method.body.slice(1);
  return [head, ...rest].join('\n');
}

function extractToFile(outPath, header, methodNames, staticNames = []) {
  const all = parseMethods();
  const picked = [];
  for (const name of methodNames) {
    const m = all.find((x) => x.name === name && !x.static);
    if (!m) { console.warn('missing method', name); continue; }
    picked.push(m);
  }
  for (const name of staticNames) {
    const m = all.find((x) => x.name === name && x.static);
    if (!m) { console.warn('missing static', name); continue; }
    picked.push(m);
  }
  picked.sort((a, b) => a.start - b.start);
  const blocks = picked.map(toPrototypeBlock);
  fs.writeFileSync(outPath, header + '\n\n' + blocks.join('\n\n') + '\n');
  return picked.map((m) => ({ name: m.name, start: m.start, end: m.end }));
}

const removed = [];

removed.push(...extractToFile(
  path.join(__dirname, '../js/game/game-inventory.js'),
  '/** @feature drag-drop @see docs/features/drag-drop.md */',
  [
    'initInventory', '_replenishInfiniteItem', 'spawnWorkbenchItemPopIn',
    '_spawnInitialInfiniteWorkbenchItems', '_spawnWorkbenchInitialItems',
    'updateInventoryLayout', '_syncSynthesisAreaBottom', '_nudgeSynthItemsAboveInventory',
    'createItemElement', 'addToInventoryIfNotExists',
  ],
  ['setIconContent'],
));

removed.push(...extractToFile(
  path.join(__dirname, '../js/game/game-gems.js'),
  '/** @feature progress @see docs/features/progress.md */',
  [
    'initGemDisplay', '_updateGemPosition', '_refreshBackBtnDot', 'updateGemDisplay',
    'showGemFlyAnimation', 'showGemPlusLabel',
  ],
));

removed.push(...extractToFile(
  path.join(__dirname, '../js/game/game-chapter-flow.js'),
  '/** @feature chapter-flow @see docs/features/chapter-flow.md */',
  [
    '_setupChapterSynthTimers', '_lvl102OnPointerMuteScreen', '_clearLvl102SecondStepHints',
    '_scheduleLvl102SecondStepHints', '_clearLvl104DualHints', '_scheduleLvl104DualCheeseHints',
    '_chapterSynthHooksAfterSuccess', '_chapterSynthHooksAfterFailedAttempt',
    'hasNextObjective', 'getNextObjectiveLevelId', 'getTransitionText',
    'transitionToNextObjective', 'refreshUIForNextObjective',
  ],
));

removed.push(...extractToFile(
  path.join(__dirname, '../js/game/game-door-multi.js'),
  '/** @feature door-offering @see docs/features/door-offering.md */',
  [
    '_hideTargetDisplay', '_showTargetDisplay', 'updateTargetDisplay',
    '_initMultiTarget', '_updateMultiTargetDisplay', '_startMultiTargetCycle',
    '_stopMultiTargetCycle', 'handleMultiTargetComplete', '_multiTargetAllDone',
  ],
));

// Remove from core (bottom to top)
removed.sort((a, b) => b.start - a.start);
let newLines = [...lines];
for (const r of removed) {
  newLines.splice(r.start, r.end - r.start + 1);
}
fs.writeFileSync(CORE, newLines.join('\n'));
console.log('Extracted', removed.length, 'methods. game-core now', newLines.length, 'lines');

// Second pass - run with: node scripts/extract-game-core-modules.cjs --pass2
if (process.argv.includes('--pass2')) {
  const r2 = [];
  r2.push(...extractToFile(
    path.join(__dirname, '../js/game/game-recipe-book-core.js'),
    '/** @feature recipe-book @see docs/features/recipe-book.md */',
    ['_spawnRecipeBookDirectly', '_autoShowRecipeBook', '_revealRecipeBookPhase2', '_specialAreaProceed'],
  ));
  r2.push(...extractToFile(
    path.join(__dirname, '../js/game/game-tutorial.js'),
    '/** @feature tutorial @see docs/features/tutorial.md */',
    ['hasSeenTutorial', 'markTutorialSeen', 'showTutorial', 'dismissTutorial', 'hideTutorialImmediately', 'showTutorialHint'],
  ));
  r2.push(...extractToFile(
    path.join(__dirname, '../js/game/game-init-ui.js'),
    '/** @feature game-layout @see docs/features/game-layout.md */',
    ['initUI', 'showLevelIntro', 'initDualDoors', 'showLevelHints', 'flashTargetDisplay'],
  ));
  r2.sort((a,b)=>b.start-a.start);
  let nl=[...lines];
  for (const r of r2) nl.splice(r.start, r.end-r.start+1);
  fs.writeFileSync(CORE, nl.join('\n'));
  console.log('Pass2 extracted', r2.length, 'methods. game-core now', nl.length, 'lines');
  process.exit(0);
}
