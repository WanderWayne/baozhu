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
const tutorialGuide = require('../tutorial-guide');
const levelManager = require('../level-manager');
const { showDoorBubble } = require('../door-dialog');

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
    item.selected = false;

    const afterTradeDrop = (ok) => {
      if (this.tradeStation) this.tradeStation.clearProximity();
      if (ok) {
        setTimeout(() => { this._workshopDragFinishing = false; }, 120);
        return;
      }
      const hit = items.find((other) => {
        if (other.id === id || other.locked) return false;
        const dist = Math.hypot(other.x - item.x, other.y - item.y);
        return dist < COLLISION_PX;
      });
      if (hit) {
        this._trySynthesis(item, hit, items);
      } else {
        this.page.setData({ workshopItems: items });
      }
      setTimeout(() => { this._workshopDragFinishing = false; }, 120);
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
      this._maybeShowLongPressTutorial(newId);
      return;
    }

    restoreInventorySlot(false);
    this.page.setData({ inventoryItems: inv }, () => this._syncLayout());
  },

  _maybeShowLongPressTutorial: function(workshopItemId) {
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
        text: '长按物品可以查看属性',
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
    if (!item) return;
    const hit = items.find((other) => {
      if (other.id === itemId || other.locked || other.offering) return false;
      return Math.hypot(other.x - item.x, other.y - item.y) < COLLISION_PX;
    });
    if (hit) this._trySynthesis(item, hit, items);
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
    const n = this.page.data.workshopItems.length;
    return { x: 48 + (n % 3) * 88, y: 120 + Math.floor(n / 3) * 88 };
  },

  _touchToWorkshop: function(clientX, clientY) {
    if (!this.synthesisRect) return this._defaultWorkshopPos();
    return {
      x: clientX - this.synthesisRect.left - ITEM_SIZE_PX / 2,
      y: clientY - this.synthesisRect.top - ITEM_SIZE_PX / 2,
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
    if (!item || item.locked || item.offering) return;

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
      this._showToast('需要「珠宝」才能交换');
      return;
    }
    workshop.splice(workshop.indexOf(gem), 1);
    workshop.push(this._makeItem(output, gem.x, gem.y, false));
    this.page.setData({ workshopItems: workshop });
    levelManager.discoverItem(output);
    this._showToast(`换到了 ${output}`);
  }};
