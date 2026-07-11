/** @feature synthesis @see docs/features/synthesis.md */
const synthesisEngine = require('../synthesis-engine');
const levelManager = require('../level-manager');
const { getItemMeta } = require('../game-item-style');
const { createFoamBurst, appendFoam } = require('../game-foam');
const { showTriggerDialog } = require('../door-dialog');
const { nextId } = require('./constants');

module.exports = {
  _chapterSynthHooksAfterSuccess: function(resultName) {
    if (this.levelId === 104) {
      if (resultName === '雪酪') {
        this._lvl104AwaitDual = true;
      }
      if (resultName === '双酪') {
        this._clearLvl104DualHints();
      } else if (this._lvl104AwaitDual) {
        this._scheduleLvl104DualCheeseHints();
      }
    }
  },

  _chapterSynthHooksAfterFailedAttempt: function() {
    if (this.levelId === 104 && this._lvl104AwaitDual) {
      this._scheduleLvl104DualCheeseHints();
    }
  },

  _trySynthesis: function(item1, item2, items) {
    synthesisEngine.synthesize({ name: item1.name }, { name: item2.name }, (result) => {
      if (result.type === 'failed') {
        this._showToast(result.message);
        try { this.page.audioManager.playSFX('error'); } catch (err) { /* noop */ }
        this._chapterSynthHooksAfterFailedAttempt();
        items.forEach((i) => {
          if (i.id === item1.id || i.id === item2.id) {
            i.selected = false;
            i.shakeAnim = true;
          }
        });
        this.page.setData({ workshopItems: items });
        // shake 动画结束后清 flag
        setTimeout(() => {
          const ws = [...this.page.data.workshopItems];
          let changed = false;
          ws.forEach((i) => { if (i.shakeAnim) { i.shakeAnim = false; changed = true; } });
          if (changed) this.page.setData({ workshopItems: ws });
        }, 500);
        return;
      }

      const idx1 = items.findIndex((i) => i.id === item1.id);
      const idx2 = items.findIndex((i) => i.id === item2.id);
      if (idx1 < 0 || idx2 < 0) return;

      const cx = (item1.x + item2.x) / 2;
      const cy = (item1.y + item2.y) / 2;

      if (result.type === 'timer') {
        items.splice(Math.max(idx1, idx2), 1);
        items.splice(Math.min(idx1, idx2), 1);
        const brewings = [...(this.page.data.brewings || [])];
        const offset = brewings.length * 18;
        const brewing = {
          id: nextId(),
          name: result.result,
          x: cx + offset,
          y: cy + offset,
          secondsLeft: result.duration,
          total: result.duration,
          message: result.message,
          recipe: result.recipe,
        };
        brewings.push(brewing);
        this.page.setData({ workshopItems: items, brewings });
        this._startBrewTimer(brewing.id);
        return;
      }

      this._finishSynthesis(items, idx1, idx2, result, cx, cy);
    });
  },

  _finishSynthesis: function(items, idx1, idx2, result, cx, cy) {
    items.splice(Math.max(idx1, idx2), 1);
    items.splice(Math.min(idx1, idx2), 1);

    this.synthCount += 1;
    const newItem = this._makeItem(result.result, cx, cy, false);
    const isTarget = this._isTargetItem(result.result);
    newItem.isTarget = isTarget;
    newItem.synthesisAnim = true;
    if (isTarget) newItem.targetEntry = true;  // 两阶段：入场弹出
    items.push(newItem);

    levelManager.discoverItem(result.result);
    this._addToInventoryIfNeeded(result.result);

    if (result.recipe?.ingredients) {
      levelManager.recordCompletionRecipe(this.levelId, result.recipe.ingredients);
    }

    this._updateDoorTriggers(result.result);

    // 生成飞溅粒子（10 个，随机方向）
    const particles = [];
    for (let i = 0; i < 10; i += 1) {
      const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 35 + Math.random() * 30;
      const size = 5 + Math.random() * 7;
      particles.push({
        id: `p${i}`,
        tx: Math.round(Math.cos(angle) * dist),
        ty: Math.round(Math.sin(angle) * dist),
        size: Math.round(size),
        cx: Math.round(cx),
        cy: Math.round(cy),
      });
    }
    this.page.setData({ workshopItems: items, synthParticles: particles });

    if (result.message && !isTarget) this._showToast(result.message);
    try { this.page.audioManager.playSFX(isTarget ? 'craft-target' : 'craft-normal'); } catch (err) { /* noop */ }

    // 合成弹出结束后清 synthesisAnim
    setTimeout(() => {
      const ws = [...this.page.data.workshopItems];
      const idx = ws.findIndex((i) => i.id === newItem.id);
      if (idx >= 0) {
        ws[idx] = { ...ws[idx], synthesisAnim: false };
        this.page.setData({ workshopItems: ws });
      }
    }, 700);
    // 目标物：1200ms 后 targetEntry 结束，切换为 targetBreathe 呼吸循环
    if (isTarget) {
      setTimeout(() => {
        const ws2 = [...this.page.data.workshopItems];
        const idx2 = ws2.findIndex((i) => i.id === newItem.id);
        if (idx2 >= 0) {
          ws2[idx2] = { ...ws2[idx2], targetEntry: false };
          this.page.setData({ workshopItems: ws2 });
        }
      }, 1200);
    }
    setTimeout(() => this.page.setData({ synthParticles: [] }), 1500);

    this._onItemSynthesized(result.result, newItem.id);
  },

  _onItemSynthesized: function(itemName, itemId) {
    this.synthesizedItems.add(itemName);
    this._checkTriggerDialogs('onSynthesize', itemName);
    this._chapterSynthHooksAfterSuccess(itemName);
    this._checkLevelCompletion(itemName, itemId);
  },

  _checkTriggerDialogs: function(event, itemName) {
    const triggers = this.levelData.triggerDialogs;
    if (!triggers) return;

    let lines = null;
    let triggerKey = '';

    if (event === 'onSynthesize' && triggers.onSynthesize?.[itemName]) {
      triggerKey = `synth_${itemName}`;
      lines = triggers.onSynthesize[itemName];
    }

    if (!lines || this._firedTriggers.has(triggerKey)) return;
    this._firedTriggers.add(triggerKey);

    lines.forEach((line) => {
      if (line?.text) showTriggerDialog(this.page, line.text);
    });
  },

  _isTargetItem: function(name) {
    if (this.levelData.multiTarget && this.levelData.multiTargets) {
      return this.levelData.multiTargets.includes(name);
    }
    return name === this.levelData.target;
  },

  _buildMultiTargetRows: function(targets, completed) {
    return (targets || []).map((name, i) => ({
      name,
      num: i + 1,
      done: completed.includes(name),
    }));
  }};
