/**
 * 章内关间转场 — 对齐 H5 performChapterTransition → performGoldenGlowTransition → performItemTransition
 */
const levelManager = require('./level-manager');
const devPlaytest = require('./dev-playtest');
const { getItemMeta } = require('./game-item-style');
const { createFoamBurst, appendFoam } = require('./game-foam');
const { showDialog, playLevelDialogs } = require('./door-dialog');
const { frameDelay } = require('./inventory-pop-animation');

const DISAPPEAR_INTERVAL = 300;
const DISAPPEAR_DURATION = 1600;
const APPEAR_INTERVAL = 300;
const APPEAR_DURATION = 1900;
const APPEAR_START_DELAY = 200;
const ITEMS_PER_ROW = 4;

let itemUid = 0;
function nextItemId() {
  itemUid += 1;
  return `item_tr_${itemUid}_${Date.now()}`;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function setPage(page, data) {
  return new Promise((resolve) => page.setData(data, resolve));
}

function playSlotSfx(page, isDisappear) {
  try {
    if (page.audioManager && page.audioManager.playInventoryTransitionSlot) {
      page.audioManager.playInventoryTransitionSlot(isDisappear);
    }
  } catch (err) { /* noop */ }
}

function queryInventoryCenters(page) {
  return new Promise((resolve) => {
    wx.nextTick(() => {
      const query = wx.createSelectorQuery().in(page);
      query.selectAll('.inventory-item-slot').boundingClientRect();
      query.exec((res) => {
        const rects = res[0] || [];
        resolve(rects.map((r) => ({
          x: r.left + r.width / 2,
          y: r.top + r.height / 2,
        })));
      });
    });
  });
}

function makeInventoryItem(name) {
  const meta = getItemMeta(name);
  return {
    id: nextItemId(),
    name,
    icon: meta.icon,
    itemType: meta.itemType,
    tone: meta.tone,
    hasEffect: meta.hasEffect,
    x: 0,
    y: 0,
    inInventory: true,
    locked: false,
    isTarget: false,
    selected: false,
    offering: false,
    offeringFlight: false,
    appearing: false,
    placeholder: false,
    goldenOutline: false,
    popPhase: '',
    popDone: false,
    hidden: false,
  };
}

/** 只改一项，其余保持同一对象引用，避免打断已在播放的动画 */
function patchInventoryItem(page, itemId, patch) {
  return setPage(page, {
    inventoryItems: page.data.inventoryItems.map((it) => (
      it.id === itemId ? { ...it, ...patch } : it
    )),
  });
}

function appendInventoryItem(page, item) {
  return setPage(page, {
    inventoryItems: [...page.data.inventoryItems, item],
  });
}

function syncLayoutForCount(page, count) {
  if (typeof page.syncGameLayout === 'function') {
    page.syncGameLayout(undefined, count);
  }
}

async function runChapterTransition(controller) {
  const page = controller.page;
  const nextLevelId = controller.getNextObjectiveLevelId();
  if (!nextLevelId) {
    controller.offeringInProgress = false;
    controller.isTransitioning = false;
    return;
  }

  const nextData = levelManager.getLevelData(nextLevelId);
  if (!nextData) {
    controller.offeringInProgress = false;
    controller.isTransitioning = false;
    return;
  }

  controller.isTransitioning = true;
  const transitionText = controller.getTransitionText() || '第一关，通过。';
  const oldCount = (page.data.inventoryItems || []).filter((i) => !i.hidden).length;
  const discovered = levelManager.currentProgress.discoveredItems || [];
  const isNextRecipePhase = nextData.recipeBookPhase && (
    !discovered.includes('配方书') || devPlaytest.forceRecipeBookPhase(nextData.id)
  );
  const newItemNames = isNextRecipePhase ? [] : (nextData.initialItems || []);

  // —— Phase 1: 门关闭 ——
  await setPage(page, { doorStarEntering: true });
  await delay(400);
  await setPage(page, { doorStarEntering: false, doorClosing: true });
  await delay(600);
  await setPage(page, { doorClosing: false, doorClosed: true });

  // —— Phase 2: 目标 / 合成区 / 交易台收束 ——
  await setPage(page, { targetHidden: true, tradeRowHidden: true });
  const workshop = page.data.workshopItems || [];
  for (let i = 0; i < workshop.length; i += 1) {
    if (i > 0) await delay(60);
    const items = page.data.workshopItems.map((item, idx) => (
      idx === i ? { ...item, shrinking: true } : item
    ));
    await setPage(page, { workshopItems: items });
  }
  if (workshop.length) await delay(440);
  await setPage(page, { workshopItems: [], brewings: [] });

  // —— Phase 3: 过关文案 pop ——
  await setPage(page, {
    levelCompletePopText: transitionText,
    levelCompletePopVisible: true,
  });
  await delay(1200);
  await setPage(page, { levelCompletePopVisible: false });
  await delay(300);

  if (controller.levelId === 105 && !levelManager.hasSeenChapterPhaseSettlement()) {
    levelManager.completeLevel(controller.levelId);
    await controller.showSettlementScreen();
  }

  // —— Phase 4: 物品栏金光 ——
  const goldenItems = (page.data.inventoryItems || []).map((i) => ({
    ...i,
    goldenOutline: true,
    popPhase: '',
  }));
  await setPage(page, { inventoryGoldenGlow: true, inventoryItems: goldenItems });
  await delay(600);

  // —— Phase 5: 旧物 bubble-pop（CSS 两帧挂 class）——
  let centers = await queryInventoryCenters(page);
  for (let index = 0; index < oldCount; index += 1) {
    if (index > 0) await delay(DISAPPEAR_INTERVAL);
    const target = page.data.inventoryItems[index];
    if (!target || target.hidden) continue;

    playSlotSfx(page, true);
    await patchInventoryItem(page, target.id, { popPhase: 'out', popDone: false });

    if (centers[index]) {
      appendFoam(page, createFoamBurst(centers[index].x, centers[index].y, 8));
    }

    const doneId = target.id;
    setTimeout(() => {
      patchInventoryItem(page, doneId, { popDone: true });
    }, DISAPPEAR_DURATION - 50);
  }

  const allDisappearTime = oldCount > 0
    ? oldCount * DISAPPEAR_INTERVAL + DISAPPEAR_DURATION
    : 0;
  if (oldCount > 0) {
    const waited = (oldCount - 1) * DISAPPEAR_INTERVAL;
    const remain = allDisappearTime - waited;
    if (remain > 0) await delay(remain);
  }
  await setPage(page, { inventoryItems: [] });

  // —— Phase 6: 新物 item-pop-in ——
  const appearStartDelay = allDisappearTime > 0 ? APPEAR_START_DELAY : 150;
  if (newItemNames.length) await delay(appearStartDelay);

  for (let index = 0; index < newItemNames.length; index += 1) {
    if (index > 0) await delay(APPEAR_INTERVAL);

    const rowsBefore = Math.ceil(index / ITEMS_PER_ROW);
    const rowsAfter = Math.ceil((index + 1) / ITEMS_PER_ROW);
    if (rowsAfter > rowsBefore && rowsAfter >= 2) {
      syncLayoutForCount(page, index + 1);
    }

    playSlotSfx(page, false);
    const item = makeInventoryItem(newItemNames[index]);
    item.popPhase = 'hold';
    await appendInventoryItem(page, item);
    await frameDelay(32);
    await patchInventoryItem(page, item.id, { popPhase: 'in' });

    centers = await queryInventoryCenters(page);
    const c = centers[centers.length - 1];
    if (c) appendFoam(page, createFoamBurst(c.x, c.y, 8));
  }

  if (newItemNames.length) await delay(APPEAR_DURATION);

  syncLayoutForCount(page, newItemNames.length);

  // —— Phase 7: 换关状态 ——
  levelManager.saveObjectiveProgress(
    controller.levelData.chapterId,
    controller.levelData.objectiveIndex
  );
  levelManager.completeLevel(controller.levelId);

  controller.levelId = nextLevelId;
  controller.offeringInProgress = false;

  controller._applyLevelState(nextData, {
    showIntro: false,
    keepInventory: true,
    goldenFade: true,
    keepTransitionLock: true,
    recipeBookPhaseEntry: isNextRecipePhase,
  });

  controller._inChapterFlow = true;

  await delay(400);

  // —— Phase 8: 新关封面 ——
  controller._introFromTransition = true;
  await controller.showLevelIntro();
  controller._introFromTransition = false;
  controller._scheduleTradeStationTutorialAfterIntro();

  // —— Phase 9: 收尾 ——
  await setPage(page, {
    inventoryGoldenFade: false,
    doorClosed: false,
    targetPopIn: !isNextRecipePhase,
    targetFlash: !isNextRecipePhase,
    targetHidden: isNextRecipePhase,
  });
  controller.isTransitioning = false;
  await delay(isNextRecipePhase ? 200 : 550);
  if (!isNextRecipePhase) {
    await setPage(page, { targetPopIn: false, targetFlash: false });
  }
  if (isNextRecipePhase) {
    await playLevelDialogs(page, controller.levelData.dialogs || [])
      .then(() => controller._spawnRecipeBookDirectly());
  } else if (controller.levelData.dialogs?.[0]?.text) {
    await delay(400);
    await showDialog(page, controller.levelData.dialogs[0].text);
  }
  controller._syncLayout();
}

module.exports = {
  runChapterTransition,
};
