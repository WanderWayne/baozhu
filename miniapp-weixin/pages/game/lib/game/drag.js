/** @feature drag-drop @see docs/features/drag-drop.md */
const {
  ITEM_SIZE_PX,
  COLLISION_PX,
  DRAG_THRESHOLD_PX,
  LP_DELAY_MS,
  LP_RING_DELAY_MS,
  LP_MOVE_THRESHOLD_PX,
  nextId,
} = require('./constants');
const tutorialGuide = require('../../../../utils/tutorial-guide');
const levelManager = require('../../../../utils/level-manager');
const { showDoorBubble } = require('../door-dialog');

function isCollisionBlocked(item) {
  return item?.locked || item?.offering || item?.isTarget || item?.targetEntry || item?.offeringFlight;
}

module.exports = {
  _cancelLongPress: function() {
    if (this._lpRingTimer) {
      clearTimeout(this._lpRingTimer);
      this._lpRingTimer = null;
    }
    if (this._lpCompleteTimer) {
      clearTimeout(this._lpCompleteTimer);
      this._lpCompleteTimer = null;
    }
    if (this._lpState?.id && !this._lpState.completed) {
      this._patchWorkshopItem(this._lpState.id, { lpRing: false, lpBurst: false });
    }
    this._lpState = null;
  },

  _startLongPressWatch: function(id, touch) {
    this._cancelLongPress();
    this._lpState = {
      id,
      startX: touch.clientX,
      startY: touch.clientY,
      completed: false,
    };
    this._lpRingTimer = setTimeout(() => {
      if (!this._lpState || this._lpState.id !== id || this._lpState.completed) return;
      this._patchWorkshopItem(id, { lpRing: true, lpBurst: false });
    }, LP_RING_DELAY_MS);
    this._lpCompleteTimer = setTimeout(() => {
      if (!this._lpState || this._lpState.id !== id || this._lpState.completed) return;
      this._lpState.completed = true;
      this._patchWorkshopItem(id, { lpRing: false, lpBurst: true });
      this._onWorkshopLongPressComplete(id);
      setTimeout(() => this._patchWorkshopItem(id, { lpBurst: false }), 800);
    }, LP_DELAY_MS);
  },

  _checkLongPressCancel: function(touch) {
    if (!this._lpState || this._lpState.completed) return;
    const dx = touch.clientX - this._lpState.startX;
    const dy = touch.clientY - this._lpState.startY;
    if (Math.hypot(dx, dy) > LP_MOVE_THRESHOLD_PX) {
      this._cancelLongPress();
    }
  },

  _onWorkshopLongPressComplete: function(id) {
    const item = (this.page.data.workshopItems || []).find((i) => i.id === id);
    if (!item) return;

    if (item.name === '配方书') {
      if (this.dragState?.id === id) {
        const items = [...this.page.data.workshopItems];
        const dragged = items.find((i) => i.id === id);
        if (dragged) {
          dragged.x = this.dragState.originX;
          dragged.y = this.dragState.originY;
          dragged.selected = false;
          this.page.setData({ workshopItems: items });
        }
        this.dragState = null;
      }
      try { this.page.audioManager.playSFX('pickup'); } catch (err) { /* noop */ }
      this.activateRecipeBook(id);
      return;
    }

    // 普通物品长按 — 不打断进行中的拖拽
    this._patchWorkshopItem(id, { lpRing: false, lpBurst: false });
  },

  onWorkshopLongPress: function(e) {
    // 已由 touch 计时器处理，保留接口兼容
    if (this._dragBlocked() || this.isTransitioning) return;
    const { id } = e.currentTarget.dataset;
    this._onWorkshopLongPressComplete(id);
  },

  activateRecipeBook: function(itemId) {
    this.showRecipeBookButton();
    const items = (this.page.data.workshopItems || []).filter((i) => i.id !== itemId);
    const item = (this.page.data.workshopItems || []).find((i) => i.id === itemId);
    if (!item) return;

    const startX = this.synthesisRect
      ? this.synthesisRect.left + item.x + ITEM_SIZE_PX / 2
      : item.x + ITEM_SIZE_PX / 2;
    const startY = this.synthesisRect
      ? this.synthesisRect.top + item.y + ITEM_SIZE_PX / 2
      : item.y + ITEM_SIZE_PX / 2;

    this.page.setData({
      workshopItems: items,
      recipeBookFlyer: {
        visible: true,
        animating: false,
        x: startX - ITEM_SIZE_PX / 2,
        y: startY - ITEM_SIZE_PX / 2,
        scale: 1,
        opacity: 1,
        icon: item.icon,
        name: item.name,
        itemType: item.itemType,
        tone: item.tone || '',
      },
    });

    setTimeout(() => {
      const query = wx.createSelectorQuery().in(this.page);
      query.select('#recipe-book-btn').boundingClientRect();
      query.exec((res) => {
        const btnRect = res[0];
        const targetX = btnRect
          ? btnRect.left + btnRect.width / 2 - ITEM_SIZE_PX / 2
          : startX;
        const targetY = btnRect
          ? btnRect.top + btnRect.height / 2 - ITEM_SIZE_PX / 2
          : startY - 120;

        wx.nextTick(() => {
          this.page.setData({
            recipeBookFlyer: {
              ...this.page.data.recipeBookFlyer,
              animating: true,
              x: targetX,
              y: targetY,
              scale: 0.2,
              opacity: 0,
            },
            recipeBookBtnFlash: true,
          });
        });

        setTimeout(() => {
          this.page.setData({
            recipeBookFlyer: { visible: false },
            recipeBookBtnFlash: false,
          });
          showDoorBubble(this.page, '点开配方书看看吧');
          if (this._recipeBookPhaseActive) {
            setTimeout(() => this._revealRecipeBookPhase2(), 400);
          }
        }, 850);
      });
    }, 500);
  },

  _dragBlocked: function() {
    return this.isTransitioning
      || this.offeringInProgress
      || this.page.data.showIntro;
    // brewing 不锁定全局：倒计时期间仍可拖动其它物品（对齐 H5 行为）
  },

  onInventoryTouchStart: function(e) {
    if (this._dragBlocked()) return;
    const { id } = e.currentTarget.dataset;
    const item = this.page.data.inventoryItems.find((i) => i.id === id);
    if (!item || item.hidden || item.placeholder) return;
    const touch = e.touches[0];
    this.dragState = {
      fromInventory: true,
      id,
      startX: touch.clientX,
      startY: touch.clientY,
      active: false,
    };
  },

  onInventoryTouchMove: function(e) {
    this._handleInventoryDragMove(e);
  },

  onPageTouchMove: function(e) {
    if (this.dragState?.fromInventory) {
      this._handleInventoryDragMove(e);
      return;
    }
    if (this.dragState && !this.dragState.fromInventory) {
      this._handleWorkshopDragMove(e);
    }
  },

  onPageTouchEnd: function(e) {
    if (this.dragState?.fromInventory) {
      this._finishInventoryDrag(e);
      return;
    }
    if (this.dragState && !this.dragState.fromInventory) {
      this._finishWorkshopDrag(e);
    }
  },

  _handleInventoryDragMove: function(e) {
    if (!this.dragState?.fromInventory) return;
    const touch = e.touches[0];
    const dx = touch.clientX - this.dragState.startX;
    const dy = touch.clientY - this.dragState.startY;
    if (!this.dragState.active) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
      this.dragState.active = true;
      const inv = this.page.data.inventoryItems.map((i) => (
        i.id === this.dragState.id ? { ...i, placeholder: true } : i
      ));
      this.page.setData({ inventoryItems: inv });
      try { this.page.audioManager.playSFX('pickup'); } catch (err) { /* noop */ }
    }
    const item = this.page.data.inventoryItems.find((i) => i.id === this.dragState.id);
    if (!item) return;
    this.page.setData({
      dragGhost: {
        visible: true,
        x: touch.clientX,
        y: touch.clientY,
        icon: item.icon,
        name: item.name,
        itemType: item.itemType,
        tone: item.tone || '',
      },
    });
    this._updateCollisionPreviewAt(touch.clientX, touch.clientY);
  },

  onInventoryTouchEnd: function(e) {
    this._finishInventoryDrag(e);
  },

  _handleWorkshopDragMove: function(e) {
    if (!this.dragState || this.dragState.fromInventory) return;
    const touch = e.touches[0];
    if (!touch) return;
    this._checkLongPressCancel(touch);
    const dx = touch.clientX - this.dragState.startX;
    const dy = touch.clientY - this.dragState.startY;
    const items = [...this.page.data.workshopItems];
    const item = items.find((i) => i.id === this.dragState.id);
    if (!item) return;
    item.x = this.dragState.originX + dx;
    item.y = this.dragState.originY + dy;
    this.dragState.lastX = touch.clientX;
    this.dragState.lastY = touch.clientY;
    this.page.setData({ workshopItems: items });
    if (this._isInInventory(touch.clientX, touch.clientY)) {
      this.page.setData({
        workshopItems: this._clearCollisionPreviewItems(),
        inventoryDeleteHover: true,
      });
    } else {
      if (this.page.data.inventoryDeleteHover) {
        this.page.setData({ inventoryDeleteHover: false });
      }
      this._updateCollisionPreviewAt(
        (this.synthesisRect?.left || 0) + item.x + ITEM_SIZE_PX / 2,
        (this.synthesisRect?.top || 0) + item.y + ITEM_SIZE_PX / 2,
        item.id
      );
    }
    if (this.tradeStation) {
      this.tradeStation.updateProximityFromItem(item, touch.clientX, touch.clientY);
    }
  },

  _finishWorkshopDrag: function(e) {
    if (this._workshopDragFinishing) return;

    if (this._lpState && !this._lpState.completed) {
      this._cancelLongPress();
    } else if (this._lpState?.completed) {
      this._lpState = null;
      this._lpRingTimer = null;
      this._lpCompleteTimer = null;
    }

    if (!this.dragState || this.dragState.fromInventory) return;
    this._workshopDragFinishing = true;
    const { id, lastX, lastY } = this.dragState;
    this.dragState = null;

    const items = [...this.page.data.workshopItems];
    const item = items.find((i) => i.id === id);
    if (!item) {
      if (this.tradeStation) this.tradeStation.clearProximity();
      setTimeout(() => { this._workshopDragFinishing = false; }, 120);
      return;
    }

    const finishDragGuard = () => {
      this.dragState = null;
      this.page.setData({
        workshopItems: this._clearCollisionPreviewItems(),
        dragGhost: { visible: false, x: 0, y: 0, icon: '', name: '', itemType: 'base', tone: '' },
        inventoryDeleteHover: false,
      });
      setTimeout(() => { this._workshopDragFinishing = false; }, 120);
    };

    if (this._isInInventory(lastX, lastY)) {
      if (this.tradeStation) this.tradeStation.clearProximity();
      const remaining = items.filter((i) => i.id !== id);
      this.page.setData({ workshopItems: remaining });
      try { this.page.audioManager.playSFX('drop'); } catch (err) { /* noop */ }
      finishDragGuard();
      return;
    }

    const afterTradeDrop = (ok) => {
      if (this.tradeStation) this.tradeStation.clearProximity();
      if (ok) {
        finishDragGuard();
        return;
      }
      const clampedPos = this._clampWorkshopPos(item.x, item.y);
      item.x = clampedPos.x;
      item.y = clampedPos.y;
      item.selected = false;
      const hit = items.find((other) => {
        if (other.id === id || isCollisionBlocked(other)) return false;
        const dist = Math.hypot(other.x - item.x, other.y - item.y);
        return dist < COLLISION_PX;
      });
      if (hit) {
        this._trySynthesis(item, hit, items);
      } else {
        this.page.setData({ workshopItems: items });
        try { this.page.audioManager.playSFX('drop'); } catch (err) { /* noop */ }
      }
      finishDragGuard();
    };

    if (this.tradeStation) {
      this.tradeStation.tryDropWorkshopItem(item.name, item.id, lastX, lastY, afterTradeDrop);
      return;
    }

    afterTradeDrop(false);
  },

  _finishInventoryDrag: function(e) {
    if (!this.dragState?.fromInventory) return;
    const touch = e.changedTouches[0];
    const { id, active } = this.dragState;
    this.dragState = null;
    this.page.setData({
      workshopItems: this._clearCollisionPreviewItems(),
      dragGhost: { visible: false, x: 0, y: 0, icon: '', name: '', itemType: 'base', tone: '' },
    });

    const inv = [...this.page.data.inventoryItems];
    const srcIdx = inv.findIndex((i) => i.id === id);
    if (srcIdx < 0) return;
    const src = inv[srcIdx];

    const restoreInventorySlot = (withAppear) => {
      inv[srcIdx] = {
        ...inv[srcIdx],
        placeholder: false,
        hidden: false,
        appearing: !!withAppear,
      };
    };

    if (!active) {
      this._spawnFromInventory(src, this._defaultWorkshopPos());
      restoreInventorySlot(true);
      this.page.setData({ inventoryItems: inv }, () => this._syncLayout());
      try { this.page.audioManager.playSFX('pickup'); } catch (err) { /* noop */ }
      return;
    }

    const { clientX: cx, clientY: cy } = touch;

    if (this.tradeStation?.tryTradeFromInventory(src.name, id, cx, cy)) {
      inv[srcIdx] = { ...src, placeholder: false, hidden: true };
      this.page.setData({ inventoryItems: inv }, () => this._syncLayout());
      return;
    }

    if (this._isInInventory(cx, cy)) {
      restoreInventorySlot(false);
      this.page.setData({ inventoryItems: inv }, () => this._syncLayout());
      return;
    }

    if (this._isInSynthesisArea(cx, cy)) {
      const pos = this._touchToWorkshop(cx, cy);
      const newId = this._spawnFromInventory(src, pos);
      restoreInventorySlot(true);
      this.page.setData({ inventoryItems: inv }, () => this._syncLayout());
      try { this.page.audioManager.playSFX('drop'); } catch (err) { /* noop */ }
      this._checkWorkshopCollisionFor(newId);
      // 暂时关闭：第二关长按查看属性引导
      return;
    }

    restoreInventorySlot(false);
    this.page.setData({ inventoryItems: inv }, () => this._syncLayout());
  },

  _maybeShowLongPressTutorial: function(workshopItemId) {
    return; // 暂时关闭第二关长按查看属性引导
    if (this.levelId !== 102 || tutorialGuide.hasSeen('tut_longPress')) return;
    tutorialGuide.markSeen('tut_longPress');
    setTimeout(() => {
      const item = (this.page.data.workshopItems || []).find((i) => i.id === workshopItemId);
      if (!item || !this.synthesisRect) return;
      tutorialGuide.show(this.page, {
        rect: {
          left: this.synthesisRect.left + item.x,
          top: this.synthesisRect.top + item.y,
          width: ITEM_SIZE_PX,
          height: ITEM_SIZE_PX,
        },
        text: '发蓝光的物品拥有特殊能力\n长按它来激活',
        position: 'top',
        padding: 10,
        borderRadius: 50,
        shape: 'circle',
      });
    }, 400);
  },

  _checkWorkshopCollisionFor: function(itemId) {
    const items = [...this.page.data.workshopItems];
    const item = items.find((i) => i.id === itemId);
    if (!item || isCollisionBlocked(item)) return;
    const hit = items.find((other) => {
      if (other.id === itemId || isCollisionBlocked(other)) return false;
      return Math.hypot(other.x - item.x, other.y - item.y) < COLLISION_PX;
    });
    if (hit) this._trySynthesis(item, hit, items);
  },

  _updateCollisionPreviewAt: function(clientX, clientY, excludeId) {
    if (!this.synthesisRect) return;
    const x = clientX - this.synthesisRect.left - ITEM_SIZE_PX / 2;
    const y = clientY - this.synthesisRect.top - ITEM_SIZE_PX / 2;
    const items = [...(this.page.data.workshopItems || [])];
    let hitId = null;
    items.forEach((other) => {
      if (other.id === excludeId || isCollisionBlocked(other)) return;
      if (Math.hypot(other.x - x, other.y - y) < COLLISION_PX) hitId = other.id;
    });
    if (this._collisionPreviewId === hitId) return;
    this._collisionPreviewId = hitId;
    let changed = false;
    items.forEach((item) => {
      const next = item.id === hitId;
      if (!!item.collisionPreview !== next) {
        item.collisionPreview = next;
        changed = true;
      }
    });
    if (changed) this.page.setData({ workshopItems: items });
  },

  _clearCollisionPreviewItems: function() {
    this._collisionPreviewId = null;
    let changed = false;
    const items = (this.page.data.workshopItems || []).map((item) => {
      if (!item.collisionPreview) return item;
      changed = true;
      return { ...item, collisionPreview: false };
    });
    return changed ? items : this.page.data.workshopItems;
  },

  _spawnFromInventory: function(src, pos) {
    const workshop = [...this.page.data.workshopItems];
    const newItem = {
      ...src,
      id: nextId(),
      inInventory: false,
      hidden: false,
      placeholder: false,
      appearing: false,
      x: pos.x,
      y: pos.y,
      selected: false,
    };
    workshop.push(newItem);
    this.page.setData({ workshopItems: workshop });
    return newItem.id;
  },

  _defaultWorkshopPos: function() {
    return this._findSpawnWorkshopPos();
  },

  _findSpawnWorkshopPos: function() {
    const rect = this.synthesisRect;
    if (!rect) {
      const n = this.page.data.workshopItems.length;
      return { x: 48 + (n % 3) * 88, y: 120 + Math.floor(n / 3) * 88 };
    }

    const width = rect.width || ((rect.right || 0) - (rect.left || 0));
    const height = rect.height || ((rect.bottom || 0) - (rect.top || 0));
    const maxX = Math.max(0, width - ITEM_SIZE_PX);
    const maxY = Math.max(0, height - ITEM_SIZE_PX);
    const centerX = maxX / 2;
    const centerY = maxY / 2;
    const existing = (this.page.data.workshopItems || []).filter((i) => !i.offering);
    const minDist = Math.max(COLLISION_PX + 18, ITEM_SIZE_PX * 0.95);
    const randomOffset = () => (Math.random() - 0.5) * 22;
    const candidates = [
      this._clampWorkshopPos(centerX + randomOffset(), centerY + randomOffset()),
    ];

    const angleOffset = Math.random() * Math.PI * 2;
    const step = Math.max(ITEM_SIZE_PX * 0.82, 70);
    const maxRadius = Math.hypot(maxX, maxY);
    for (let radius = step; radius <= maxRadius + step; radius += step) {
      const count = Math.max(8, Math.ceil((Math.PI * 2 * radius) / step));
      for (let i = 0; i < count; i += 1) {
        const angle = angleOffset + (i / count) * Math.PI * 2;
        candidates.push(this._clampWorkshopPos(
          centerX + Math.cos(angle) * radius + randomOffset(),
          centerY + Math.sin(angle) * radius + randomOffset()
        ));
      }
    }

    const farEnough = (pos, dist) => existing.every((item) => (
      Math.hypot(item.x - pos.x, item.y - pos.y) >= dist
    ));
    return candidates.find((pos) => farEnough(pos, minDist))
      || candidates.find((pos) => farEnough(pos, COLLISION_PX))
      || candidates[0];
  },

  _touchToWorkshop: function(clientX, clientY) {
    if (!this.synthesisRect) return this._defaultWorkshopPos();
    const left = this.synthesisRect.left || 0;
    const top = this.synthesisRect.top || 0;
    return this._clampWorkshopPos(
      clientX - left - ITEM_SIZE_PX / 2,
      clientY - top - ITEM_SIZE_PX / 2
    );
  },

  _clampWorkshopPos: function(x, y) {
    if (!this.synthesisRect) return { x, y };
    const width = this.synthesisRect.width || ((this.synthesisRect.right || 0) - (this.synthesisRect.left || 0));
    const height = this.synthesisRect.height || ((this.synthesisRect.bottom || 0) - (this.synthesisRect.top || 0));
    const maxX = Math.max(0, width - ITEM_SIZE_PX);
    const maxY = Math.max(0, height - ITEM_SIZE_PX);
    return {
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY)),
    };
  },

  _isInInventory: function(clientX, clientY) {
    if (!this.inventoryRect) return false;
    const r = this.inventoryRect;
    return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
  },

  _isInSynthesisArea: function(clientX, clientY) {
    if (!this.synthesisRect) return true;
    const r = this.synthesisRect;
    const aboveInventory = this.inventoryRect ? clientY < this.inventoryRect.top : true;
    return (
      aboveInventory
      && clientX >= r.left
      && clientX <= r.right
      && clientY >= r.top
      && clientY <= r.bottom
    );
  },

  onInventoryTap: function(e) {
    if (this._dragBlocked()) return;
    const { id } = e.currentTarget.dataset;
    const src = this.page.data.inventoryItems.find((i) => i.id === id);
    if (!src || src.hidden || src.placeholder) return;
    this._spawnFromInventory(src, this._defaultWorkshopPos());
    const inv = this.page.data.inventoryItems.map((i) => (
      i.id === id ? { ...i, appearing: true } : i
    ));
    this.page.setData({ inventoryItems: inv }, () => this._syncLayout());
    try { this.page.audioManager.playSFX('pickup'); } catch (err) { /* noop */ }
  },

  onWorkshopTouchStart: function(e) {
    if (this._dragBlocked()) return;
    const { id } = e.currentTarget.dataset;
    const touch = e.touches[0];
    const items = [...this.page.data.workshopItems];
    const item = items.find((i) => i.id === id);
    if (!item || isCollisionBlocked(item)) return;

    this._startLongPressWatch(id, touch);

    if (item.hasEffect) return;

    if (this.tradeStation?.stations?.length) {
      this.tradeStation._measureHitRects();
    }

    this.dragState = {
      fromInventory: false,
      id,
      startX: touch.clientX,
      startY: touch.clientY,
      originX: item.x,
      originY: item.y,
      active: true,
      lastX: touch.clientX,
      lastY: touch.clientY,
    };
    item.selected = true;
    item.offeringFlight = false;
    this.page.setData({ workshopItems: items });
    try { this.page.audioManager.playSFX('pickup'); } catch (err) { /* noop */ }
  },

  onWorkshopTouchMove: function(e) {
    this._handleWorkshopDragMove(e);
  },

  onWorkshopTouchEnd: function(e) {
    this._finishWorkshopDrag(e);
  },

  onWorkshopTouchCancel: function(e) {
    this._finishWorkshopDrag(e);
  },

  onTradeTap: function(e) {
    if (this.page.data.tradeStationMode) return;
    const { input, output } = e.currentTarget.dataset;
    const workshop = [...this.page.data.workshopItems];
    const gem = workshop.find((i) => i.name === input && !i.locked);
    if (!gem) {
      this._showToast(`需要「${input}」才能兑换`);
      return;
    }
    workshop.splice(workshop.indexOf(gem), 1);
    workshop.push(this._makeItem(output, gem.x, gem.y, false));
    this.page.setData({ workshopItems: workshop });
    levelManager.discoverItem(output);
    this._showToast(`换到了 ${output}`);
  }};
