#!/usr/bin/env node
/** One-shot split of js/game/game-core.js — removes trade/door dupes, extracts feature modules */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CORE = path.join(ROOT, 'js/game/game-core.js');
const DOOR = path.join(ROOT, 'js/game/game-door.js');

const src = fs.readFileSync(CORE, 'utf8');
let lines = src.split('\n');

// Strip item-tone block (use js/shared/item-tones.js)
const toneStart = lines.findIndex((l) => l.includes('GAME_ITEM_CARD_TONE_CHEESE'));
if (toneStart >= 0) {
  let toneEnd = toneStart;
  while (toneEnd < lines.length && !lines[toneEnd].includes('class Game')) toneEnd++;
  lines.splice(toneStart, toneEnd - toneStart);
}

// Ensure @feature header
if (!lines[0].includes('@feature')) {
  lines.splice(1, 0, '// @feature game-layout synthesis @see docs/FEATURE_INDEX.md');
}

const classStart = lines.findIndex((l) => l.startsWith('class Game'));
const classEnd = lines.findIndex((l, i) => i > classStart && l === '}');
if (classStart < 0 || classEnd < 0) {
  console.error('class Game not found');
  process.exit(1);
}

function findMethodEnd(startIdx) {
  let depth = 0;
  let started = false;
  for (let i = startIdx; i < classEnd; i++) {
    for (const ch of lines[i]) {
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
    methods.push({ name: m[2], static: !!m[1], start: i, end, body: lines.slice(i, end + 1) });
    i = end;
  }
  return methods;
}

function toPrototypeBlock(method) {
  const prefix = method.static ? 'Game.' : 'Game.prototype.';
  const head = method.body[0]
    .replace(/^    static /, '    ')
    .replace(/^    ([\w$]+)\s*\(/, `${prefix}$1 = function(`);
  return [head, ...method.body.slice(1)].join('\n');
}

function pickMethods(all, names, staticNames = []) {
  const picked = [];
  for (const name of names) {
    const m = all.find((x) => x.name === name && !x.static);
    if (!m) { console.warn('WARN missing', name); continue; }
    picked.push(m);
  }
  for (const name of staticNames) {
    const m = all.find((x) => x.name === name && x.static);
    if (!m) { console.warn('WARN missing static', name); continue; }
    picked.push(m);
  }
  return picked.sort((a, b) => a.start - b.start);
}

function writeModule(relPath, header, picked) {
  const out = path.join(ROOT, relPath);
  fs.writeFileSync(out, `${header}\n\n${picked.map(toPrototypeBlock).join('\n\n')}\n`);
}

function appendToDoor(header, picked) {
  const blocks = picked.map(toPrototypeBlock).join('\n\n');
  fs.appendFileSync(DOOR, `\n${header}\n\n${blocks}\n`);
}

const REMOVE_FROM_CORE = [
  // already in game-trade.js
  '_initSpecialAreaCenterTrade', '_initRecipeBookTrade', '_createTradeStation', 'initTradeStation',
  '_maybeShowTradeStationTutorial', '_markSoldOut', 'startTradeRestock', '_spawnTradeOutput',
  '_findItemTradeStation', 'executeTrade', 'showTradeConfirm', '_executeTradeAnimated', '_animateInputToSlot',
  // already in game-door.js
  '_getDoorRect', '_calcDuration', '_splitDialogText', '_pickBubbleSide', 'showDoorBubble',
  'showDialog', 'showTriggerDialog', 'dismissAllDialogs', '_initDoorClickHandler',
  '_emitDoorWave', '_onDoorSynthProgressPulse', '_maybeEmitDoorWaveOnSynthProgress', '_showDoorClickLine',
];

const EXTRACT = [
  {
    path: 'js/game/game-inventory.js',
    header: '/** @feature drag-drop @see docs/features/drag-drop.md */',
    methods: [
      'initInventory', '_replenishInfiniteItem', 'spawnWorkbenchItemPopIn',
      '_spawnInitialInfiniteWorkbenchItems', '_spawnWorkbenchInitialItems',
      'updateInventoryLayout', '_syncSynthesisAreaBottom', '_nudgeSynthItemsAboveInventory',
      'createItemElement', 'addToInventoryIfNotExists',
    ],
    statics: ['setIconContent'],
  },
  {
    path: 'js/game/game-gems.js',
    header: '/** @feature progress @see docs/features/progress.md */',
    methods: [
      'initGemDisplay', '_updateGemPosition', '_refreshBackBtnDot', 'updateGemDisplay',
      'showGemFlyAnimation', 'showGemPlusLabel',
    ],
  },
  {
    path: 'js/game/game-chapter-flow.js',
    header: '/** @feature chapter-flow @see docs/features/chapter-flow.md */',
    methods: [
      '_setupChapterSynthTimers', '_lvl102OnPointerMuteScreen', '_clearLvl102SecondStepHints',
      '_scheduleLvl102SecondStepHints', '_clearLvl104DualHints', '_scheduleLvl104DualCheeseHints',
      '_chapterSynthHooksAfterSuccess', '_chapterSynthHooksAfterFailedAttempt',
      'hasNextObjective', 'getNextObjectiveLevelId', 'getTransitionText',
      'transitionToNextObjective', 'refreshUIForNextObjective',
    ],
  },
  {
    path: 'js/game/game-door.js',
    header: '/* multi-target door */',
    methods: [
      '_hideTargetDisplay', '_showTargetDisplay', 'updateTargetDisplay',
      '_initMultiTarget', '_updateMultiTargetDisplay', '_startMultiTargetCycle',
      '_stopMultiTargetCycle', 'handleMultiTargetComplete', '_multiTargetAllDone',
    ],
    append: true,
  },
  {
    path: 'js/game/game-recipe-book-core.js',
    header: '/** @feature recipe-book @see docs/features/recipe-book.md */',
    methods: ['_spawnRecipeBookDirectly', '_autoShowRecipeBook', '_revealRecipeBookPhase2', '_specialAreaProceed'],
  },
  {
    path: 'js/game/game-tutorial.js',
    header: '/** @feature tutorial @see docs/features/tutorial.md */',
    methods: ['hasSeenTutorial', 'markTutorialSeen', 'showTutorial', 'dismissTutorial', 'hideTutorialImmediately', 'showTutorialHint'],
  },
  {
    path: 'js/game/game-init-ui.js',
    header: '/** @feature game-layout @see docs/features/game-layout.md */',
    methods: ['initUI', 'showLevelIntro', 'initDualDoors', 'showLevelHints', 'flashTargetDisplay'],
  },
];

const all = parseMethods();
const toRemove = new Set(REMOVE_FROM_CORE);

for (const spec of EXTRACT) {
  const picked = pickMethods(all, spec.methods, spec.statics || []);
  if (spec.append) {
    appendToDoor(spec.header, picked);
  } else {
    writeModule(spec.path, spec.header, picked);
  }
  picked.forEach((m) => toRemove.add(m.name));
}

const removeRanges = all
  .filter((m) => toRemove.has(m.name))
  .sort((a, b) => b.start - a.start);

for (const r of removeRanges) {
  lines.splice(r.start, r.end - r.start + 1);
}

fs.writeFileSync(CORE, lines.join('\n'));
console.log('Removed', removeRanges.length, 'method blocks from game-core.js');
console.log('game-core.js now', lines.length, 'lines');
