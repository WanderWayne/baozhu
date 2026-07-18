/** @feature trade-station @see docs/features/trade-station.md */
// 交易神坛（对齐 H5 game-core initTradeStation / showTradeConfirm / startTradeRestock）
const levelManager = require('../../../utils/level-manager');
const { getItemMeta } = require('../../../utils/game-item-style');
const gameLayout = require('./game-layout');

const RESTOCK_SEC = 5;
const ITEM_SIZE_PX = 85;
const STATION_BOX_W = 220;
const STATION_BOX_H = 96;
const STATION_RIGHT_PAD = 12;
const TRADE_HIT_RADIUS = 90;
const TRADE_HIT_MARGIN = 28;
const TARGET_SAFE_GAP = 18;

class TradeStationManager {
  constructor(controller) {
    this.controller = controller;
    this.page = controller.page;
    this.stations = [];
    this._hitRects = [];
    this._timers = {};
    this._dropHandled = false;
  }

  destroy() {
    Object.keys(this._timers).forEach((key) => {
      clearInterval(this._timers[key]);
      delete this._timers[key];
    });
    this._hitRects = [];
    this.stations = [];
    this._dropHandled = false;
  }

  static getConfigs(levelData) {
    let configs = levelData.tradeStations || [];
    if (configs.length === 0 && levelData.tradeStation) {
      configs = [levelData.tradeStation];
    }
    return configs;
  }

  init(configs, levelId) {
    this.destroy();
    if (!configs.length) {
      this.page.setData({
        tradeStationViews: [],
        tradeStationMode: false,
      });
      return;
    }

    this.stations = configs.map((cfg, i) => ({
      id: `ts_${i}`,
      input: cfg.input || null,
      output: cfg.output,
      cost: cfg.cost || 0,
      type: cfg.type || (cfg.cost != null && !cfg.input ? 'gem' : 'item'),
      maxUses: cfg.maxUses != null ? cfg.maxUses : Infinity,
      usesLeft: cfg.maxUses != null ? cfg.maxUses : Infinity,
      restocking: false,
      soldOut: false,
      countdown: 0,
      hover: false,
      wrong: false,
      entering: true,
    }));

    this.page.setData({
      tradeStationViews: this._buildViews(levelId),
      tradeStationMode: true,
      tradeRowHidden: true,
    });

    setTimeout(() => {
      const views = (this.page.data.tradeStationViews || []).map((v) => ({
        ...v,
        entering: false,
      }));
      this.page.setData({ tradeStationViews: views });
    }, 500);

    wx.nextTick(() => {
      setTimeout(() => this._measureHitRects(), 120);
    });
  }

  _buildViews(levelId) {
    const n = this.stations.length;
    const scale = n >= 3 ? 0.82 : 1;
    const stationH = STATION_BOX_H * scale;
    let gap = n >= 3 ? 18 : 22;
    if (levelId === 105 && n >= 3) gap = 56;
    const totalH = n * stationH + (n - 1) * gap;

    const synth = this.controller.synthesisRect;
    const door = this.controller.doorRect;
    const inv = this.controller.inventoryRect;
    const doorBottom = door ? door.bottom : (synth ? synth.top : 0);
    let invTop = inv ? inv.top : (synth ? synth.bottom : 0);
    if (levelId === 105 && n >= 3) {
      const viewport = gameLayout.getViewport();
      const row1 = gameLayout.getInventoryHeightPx(viewport.windowHeight, 'rows-1');
      const row2 = gameLayout.getInventoryHeightPx(viewport.windowHeight, 'rows-2');
      invTop -= Math.max(0, row2 - row1);
    }
    const synthTop = synth ? synth.top : 0;

    let offsetY = 0;
    if (synth) {
      const availableTop = Math.max(0, doorBottom - synthTop + TARGET_SAFE_GAP);
      const availableBottom = Math.max(availableTop + totalH, invTop - synthTop - TARGET_SAFE_GAP);
      offsetY = Math.max(availableTop, availableBottom - totalH);
    }

    const estW = STATION_BOX_W * scale;
    const estH = STATION_BOX_H * scale;

    return this.stations.map((s, i) => {
      const isGem = s.type === 'gem';
      const inputMeta = isGem ? { icon: '💎' } : getItemMeta(s.input || '');
      const outputMeta = getItemMeta(s.output);
      const topPx = offsetY + i * (stationH + gap);
      const stationStyle = `top:${topPx}px;transform:scale(${scale});`;
      const layoutLeft = synth ? synth.width - STATION_RIGHT_PAD - STATION_BOX_W : 0;
      const layoutTop = topPx;
      return {
        id: s.id,
        input: s.input,
        output: s.output,
        inputIcon: inputMeta.icon,
        inputName: isGem ? `${s.cost || 0} 💎` : (s.input || ''),
        outputIcon: outputMeta.icon,
        outputName: outputMeta.name || s.output,
        type: s.type,
        cost: s.cost || 0,
        scale,
        centered: false,
        top: topPx,
        stationStyle,
        stationH,
        layoutLeft,
        layoutTop,
        layoutW: estW,
        layoutH: estH,
        restocking: s.restocking,
        soldOut: s.soldOut,
        countdown: s.countdown,
        overlayTitle: s.soldOut ? '断货' : '进货中',
        hover: s.hover,
        wrong: s.wrong,
        entering: s.entering,
      };
    });
  }

  relayout(levelId) {
    if (!this.stations.length) return;
    this.page.setData({ tradeStationViews: this._mergeViews(levelId) });
    wx.nextTick(() => {
      setTimeout(() => this._measureHitRects(), 80);
    });
  }

  _mergeViews(levelId) {
    const views = this._buildViews(levelId);
    return views.map((v) => {
      const s = this.stations.find((st) => st.id === v.id);
      if (!s) return v;
      return {
        ...v,
        restocking: s.restocking,
        soldOut: s.soldOut,
        countdown: s.countdown,
        hover: s.hover,
        wrong: s.wrong,
        entering: s.entering,
      };
    });
  }

  _syncViews() {
    if (!this.stations.length) return;
    this.page.setData({
      tradeStationViews: this._mergeViews(this.controller.levelId),
    });
  }

  _measureHitRects() {
    if (!this.stations.length) return;
    const query = wx.createSelectorQuery().in(this.page);
    query.selectAll('.trade-station').boundingClientRect();
    query.exec((res) => {
      const rects = res[0] || [];
      this._hitRects = this.stations.map((s, i) => ({
        id: s.id,
        ...(rects[i] || {}),
      }));
    });
  }

  _workshopItemScreenRect(item) {
    const synth = this.controller.synthesisRect;
    if (!synth || !item) return null;
    const left = synth.left + item.x;
    const top = synth.top + item.y;
    return {
      left,
      top,
      right: left + ITEM_SIZE_PX,
      bottom: top + ITEM_SIZE_PX,
      width: ITEM_SIZE_PX,
      height: ITEM_SIZE_PX,
    };
  }

  _stationCenter(entry) {
    return {
      x: entry.left + entry.width / 2,
      y: entry.top + entry.height / 2,
    };
  }

  _isNearStation(cx, cy, entry, radius = TRADE_HIT_RADIUS) {
    if (!entry || !entry.width) return false;
    const sc = this._stationCenter(entry);
    return Math.hypot(cx - sc.x, cy - sc.y) < radius;
  }

  _pointHitsStation(px, py, entry) {
    if (!entry || !entry.width || px == null || py == null) return false;
    return px >= entry.left - TRADE_HIT_MARGIN
      && px <= entry.right + TRADE_HIT_MARGIN
      && py >= entry.top - TRADE_HIT_MARGIN
      && py <= entry.bottom + TRADE_HIT_MARGIN;
  }

  _itemRectHitsStation(itemRect, entry) {
    if (!itemRect || !entry || !entry.width) return false;
    return itemRect.right >= entry.left - TRADE_HIT_MARGIN
      && itemRect.left <= entry.right + TRADE_HIT_MARGIN
      && itemRect.bottom >= entry.top - TRADE_HIT_MARGIN
      && itemRect.top <= entry.bottom + TRADE_HIT_MARGIN;
  }

  /** 优先 DOM 实测矩形，否则按 right:12px + scale 推算（与 CSS 一致） */
  _getStationScreenRects() {
    const synth = this.controller.synthesisRect;
    const views = this.page.data.tradeStationViews || [];
    const out = [];

    views.forEach((v) => {
      const s = this._findStation(v.id);
      if (!s) return;

      const dom = this._hitRects.find((r) => r.id === v.id);
      if (dom && dom.width > 0) {
        out.push({
          id: v.id,
          left: dom.left,
          top: dom.top,
          right: dom.right,
          bottom: dom.bottom,
          width: dom.width,
          height: dom.height,
          station: s,
        });
        return;
      }

      if (!synth) return;
      const scale = v.scale || 1;
      const topPx = v.top || 0;
      const unscaledLeft = synth.width - STATION_RIGHT_PAD - STATION_BOX_W;
      const cx = unscaledLeft + STATION_BOX_W / 2;
      const cy = topPx + STATION_BOX_H / 2;
      const w = STATION_BOX_W * scale;
      const h = STATION_BOX_H * scale;
      const left = synth.left + cx - w / 2;
      const top = synth.top + cy - h / 2;
      out.push({
        id: v.id,
        left,
        top,
        right: left + w,
        bottom: top + h,
        width: w,
        height: h,
        station: s,
      });
    });

    return out;
  }

  _findStationNearPoints(cx, cy, touchX, touchY, stationRects) {
    let best = null;
    let bestD = Infinity;
    stationRects.forEach((entry) => {
      const st = entry.station;
      if (st.type === 'gem' || st.restocking || st.soldOut) return;
      const sc = this._stationCenter(entry);
      const dItem = Math.hypot(cx - sc.x, cy - sc.y);
      const dTouch = (touchX != null && touchY != null)
        ? Math.hypot(touchX - sc.x, touchY - sc.y)
        : Infinity;
      const d = Math.min(dItem, dTouch);
      const hit = this._pointHitsStation(cx, cy, entry)
        || this._pointHitsStation(touchX, touchY, entry)
        || d < TRADE_HIT_RADIUS;
      if (hit && d < bestD) {
        bestD = d;
        best = st;
      }
    });
    return best;
  }

  _resolveDropStation(itemRect, touchX, touchY) {
    const hovered = this.stations.find(
      (s) => s.hover && s.type === 'item' && !s.restocking && !s.soldOut,
    );
    if (hovered) return hovered;

    const icx = itemRect
      ? (itemRect.left + itemRect.right) / 2
      : touchX;
    const icy = itemRect
      ? (itemRect.top + itemRect.bottom) / 2
      : touchY;
    if (icx == null || icy == null) return null;

    const stationRects = this._getStationScreenRects();
    if (itemRect) {
      let bestRectHit = null;
      let bestRectD = Infinity;
      stationRects.forEach((entry) => {
        const st = entry.station;
        if (st.type === 'gem' || st.restocking || st.soldOut) return;
        if (!this._itemRectHitsStation(itemRect, entry)) return;
        const sc = this._stationCenter(entry);
        const d = Math.hypot(icx - sc.x, icy - sc.y);
        if (d < bestRectD) {
          bestRectD = d;
          bestRectHit = st;
        }
      });
      if (bestRectHit) return bestRectHit;
    }
    return this._findStationNearPoints(icx, icy, touchX, touchY, stationRects);
  }

  _refreshHitRects(callback) {
    if (!this.stations.length) {
      if (callback) callback();
      return;
    }
    const query = wx.createSelectorQuery().in(this.page);
    query.selectAll('.trade-station').boundingClientRect();
    query.exec((res) => {
      const domRects = res[0] || [];
      this._hitRects = this.stations.map((s, i) => ({
        id: s.id,
        ...(domRects[i] || {}),
      }));
      if (callback) callback();
    });
  }

  _findStation(id) {
    return this.stations.find((s) => s.id === id);
  }

  _hasInputItem(inputName) {
    const { workshopItems, inventoryItems } = this.page.data;
    const inWs = (workshopItems || []).some(
      (i) => i.name === inputName && !i.locked && !i.offering,
    );
    const inInv = (inventoryItems || []).some(
      (i) => i.name === inputName && !i.hidden && !i.placeholder,
    );
    return inWs || inInv;
  }

  _findInputItem(inputName) {
    const ws = (this.page.data.workshopItems || []).find(
      (i) => i.name === inputName && !i.locked && !i.offering,
    );
    if (ws) return { source: 'workshop', id: ws.id, item: ws };
    const inv = (this.page.data.inventoryItems || []).find(
      (i) => i.name === inputName && !i.hidden && !i.placeholder,
    );
    if (inv) return { source: 'inventory', id: inv.id, item: inv };
    return null;
  }

  _slotCenters(s) {
    const rect = this._getStationScreenRects().find((r) => r.id === s.id);
    if (!rect || !rect.width) return null;
    const scale = rect.width / STATION_BOX_W;
    const y = rect.top + 48 * scale;
    return {
      input: { x: rect.left + 46 * scale, y },
      output: { x: rect.left + 174 * scale, y },
    };
  }

  _animateTradeInput(itemName, fromScreen, s, onDone) {
    const meta = getItemMeta(itemName);
    const slots = this._slotCenters(s);
    if (!fromScreen || !slots) {
      if (onDone) onDone();
      return;
    }
    const half = ITEM_SIZE_PX / 2;
    this.page.setData({
      tradeFlyer: {
        visible: true,
        name: itemName,
        icon: meta.icon,
        itemType: meta.itemType || 'base',
        tone: meta.tone || '',
        x: Math.round(fromScreen.x - half),
        y: Math.round(fromScreen.y - half),
        scale: 1,
        opacity: 1,
      },
    });
    setTimeout(() => {
      this.page.setData({
        'tradeFlyer.x': Math.round(slots.input.x - half),
        'tradeFlyer.y': Math.round(slots.input.y - half),
        'tradeFlyer.scale': 0.35,
        'tradeFlyer.opacity': 0.05,
      });
    }, 30);
    setTimeout(() => {
      this.page.setData({ tradeFlyer: { visible: false } });
      if (onDone) onDone();
    }, 520);
  }

  _findItemTradeStation(itemName, preferredStationId) {
    if (preferredStationId) {
      const preferred = this._findStation(preferredStationId);
      if (
        preferred
        && preferred.type === 'item'
        && !preferred.restocking
        && !preferred.soldOut
        && preferred.input === itemName
      ) {
        return preferred;
      }
    }
    return this.stations.find(
      (s) => s.type === 'item'
        && !s.restocking
        && !s.soldOut
        && s.input === itemName,
    ) || null;
  }

  onStationTap(stationId) {
    if (this._dropHandled) return;
    const s = this._findStation(stationId);
    if (!s || s.restocking || s.soldOut) return;
    this._showConfirm(s);
  }

  _showConfirm(s) {
    const isGem = s.type === 'gem';
    const outputMeta = getItemMeta(s.output);
    let canTrade = false;
    let noteText = '';

    if (isGem) {
      const gems = levelManager.getGems();
      canTrade = gems >= (s.cost || 0);
      if (!canTrade) noteText = `钻石不足 (${gems}/${s.cost})`;
    } else {
      canTrade = this._hasInputItem(s.input);
      if (!canTrade) {
        const meta = getItemMeta(s.input);
        noteText = `缺少${meta.name || s.input}`;
      }
    }

    const inputMeta = isGem
      ? { icon: '💎' }
      : getItemMeta(s.input || '');
    const inputLabel = isGem ? `${s.cost}` : (s.input || '');
    this.page.setData({
      tradeConfirmVisible: true,
      tradeConfirm: {
        stationId: s.id,
        isGem,
        input: isGem ? '_diamond' : (s.input || ''),
        inputLabel,
        inputIcon: isGem ? '💎' : inputMeta.icon,
        outputLabel: outputMeta.name || s.output,
        outputName: s.output,
        outputIcon: outputMeta.icon,
        canTrade,
        noteText,
      },
    });
  }

  dismissConfirm(playSound = true) {
    if (playSound) {
      try { this.page.audioManager.playClickExit(); } catch (err) { /* noop */ }
    }
    this.page.setData({ tradeConfirmVisible: false, tradeConfirm: null });
  }

  confirmTrade() {
    const conf = this.page.data.tradeConfirm;
    if (!conf || !conf.canTrade) return;
    this.dismissConfirm(false);
    this._executeTrade(conf.stationId);
  }

  _consumeInput(loc) {
    if (loc.source === 'workshop') {
      const items = (this.page.data.workshopItems || []).filter((i) => i.id !== loc.id);
      this.page.setData({ workshopItems: items });
      return true;
    }
    if (loc.source === 'inventory') {
      const inv = (this.page.data.inventoryItems || []).map((i) => (
        i.id === loc.id ? { ...i, hidden: true, placeholder: false } : i
      ));
      this.page.setData({ inventoryItems: inv }, () => this.controller._syncLayout());
      return true;
    }
    return false;
  }

  _executeTrade(stationId, preferredWorkshopId = null) {
    const s = this._findStation(stationId);
    if (!s || s.restocking || s.soldOut) return false;

    if (s.type === 'gem') {
      levelManager.addGems(-(s.cost || 0));
    } else {
      let loc = null;
      if (preferredWorkshopId) {
        const item = (this.page.data.workshopItems || []).find((i) => i.id === preferredWorkshopId);
        if (item && item.name === s.input) {
          loc = { source: 'workshop', id: preferredWorkshopId, item };
        }
      }
      if (!loc) loc = this._findInputItem(s.input);
      if (!loc) return false;
      const rect = loc.source === 'workshop'
        ? this._workshopItemScreenRect(loc.item)
        : null;
      const fromScreen = rect
        ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
        : this._slotCenters(s)?.input;
      this._consumeInput(loc);
      try { this.page.audioManager.playSFX('trade'); } catch (err) { /* noop */ }
      this._animateTradeInput(s.input, fromScreen, s, () => this._spawnOutput(s));
      return true;
    }

    try { this.page.audioManager.playSFX('trade'); } catch (err) { /* noop */ }
    this._spawnOutput(s);
    return true;
  }

  _spawnOutput(s) {
    const stationView = (this.page.data.tradeStationViews || []).find((v) => v.id === s.id);
    let spawnX = 48;
    let spawnY = 120;
    const synth = this.controller.synthesisRect;
    const rect = this._getStationScreenRects().find((r) => r.id === s.id);
    const slots = this._slotCenters(s);
    if (slots && synth) {
      spawnX = Math.max(8, Math.round(slots.output.x - synth.left - ITEM_SIZE_PX / 2));
      spawnY = Math.max(8, Math.round(slots.output.y - synth.top - ITEM_SIZE_PX / 2));
    } else if (rect && synth) {
      spawnX = Math.max(8, Math.round(rect.left - synth.left + rect.width - ITEM_SIZE_PX - 10));
      spawnY = Math.max(8, Math.round(rect.top - synth.top + 6));
    } else if (stationView && stationView.layoutTop != null) {
      spawnX = Math.max(8, Math.round((stationView.layoutLeft || 0) + 10));
      spawnY = Math.max(8, Math.round(stationView.layoutTop + 6));
    }

    const newItem = this.controller._makeItem(s.output, spawnX, spawnY, false);
    newItem.appearing = true;
    const workshop = [...(this.page.data.workshopItems || []), newItem];
    this.page.setData({ workshopItems: workshop });
    setTimeout(() => {
      const ws = (this.page.data.workshopItems || []).map((i) => (
        i.id === newItem.id ? { ...i, appearing: false } : i
      ));
      this.page.setData({ workshopItems: ws });
    }, 450);

    levelManager.discoverItem(s.output);
    this.controller.synthesizedItems.add(s.output);
    this.controller._updateDoorTriggers(s.output);
    this.controller._checkLevelCompletion(s.output, newItem.id);

    this._startRestock(s.id);
    this._syncViews();
  }

  _startRestock(stationId) {
    const s = this._findStation(stationId);
    if (!s) return;

    if (s.maxUses !== Infinity) {
      s.usesLeft -= 1;
      if (s.usesLeft <= 0) {
        s.soldOut = true;
        s.restocking = false;
        s.countdown = 0;
        this._syncViews();
        return;
      }
    }

    s.restocking = true;
    s.countdown = RESTOCK_SEC;
    this._syncViews();

    if (this._timers[stationId]) clearInterval(this._timers[stationId]);
    this._timers[stationId] = setInterval(() => {
      s.countdown -= 1;
      if (s.countdown <= 0) {
        clearInterval(this._timers[stationId]);
        delete this._timers[stationId];
        s.restocking = false;
        s.countdown = 0;
      }
      this._syncViews();
    }, 1000);
  }

  /** 拖拽松手：对齐 H5 checkTradeHit（中心距离）+ executeTrade */
  tryDropWorkshopItem(itemName, itemId, touchX, touchY, callback) {
    if (this._dropHandled) {
      if (callback) callback(true);
      return true;
    }

    const item = (this.page.data.workshopItems || []).find((i) => i.id === itemId);
    if (!item || item.name !== itemName) {
      if (callback) callback(false);
      return false;
    }

    const finish = () => {
      const itemRect = this._workshopItemScreenRect(item);
      const nearStation = this._resolveDropStation(itemRect, touchX, touchY);
      if (!nearStation) {
        if (callback) callback(false);
        return false;
      }

      const target = this._findItemTradeStation(itemName, nearStation.id);
      if (!target) {
        this._flashWrong();
        if (callback) callback(false);
        return false;
      }

      this._dropHandled = true;
      this._executeTrade(target.id, itemId);
      setTimeout(() => { this._dropHandled = false; }, 300);
      if (callback) callback(true);
      return true;
    };

    if (callback) {
      this._refreshHitRects(finish);
      return undefined;
    }
    return finish();
  }

  tryTradeFromInventory(itemName, inventoryId, clientX, clientY) {
    const fakeItem = { x: 0, y: 0 };
    const synth = this.controller.synthesisRect;
    if (synth) {
      fakeItem.x = clientX - synth.left - ITEM_SIZE_PX / 2;
      fakeItem.y = clientY - synth.top - ITEM_SIZE_PX / 2;
    }
    const itemRect = this._workshopItemScreenRect(fakeItem);
    const nearStation = this._resolveDropStation(itemRect, clientX, clientY);
    if (!nearStation) return false;

    const target = this._findItemTradeStation(itemName, nearStation.id);
    if (!target) {
      this._flashWrong();
      return false;
    }

    const fromScreen = { x: clientX, y: clientY };
    this._consumeInput({ source: 'inventory', id: inventoryId });
    try { this.page.audioManager.playSFX('trade'); } catch (err) { /* noop */ }
    this._animateTradeInput(itemName, fromScreen, target, () => this._spawnOutput(target));
    return true;
  }

  updateProximityFromItem(item, touchX, touchY) {
    if (!this.stations.length || !item) return;
    const itemRect = this._workshopItemScreenRect(item);
    if (!itemRect) return;

    const icx = (itemRect.left + itemRect.right) / 2;
    const icy = (itemRect.top + itemRect.bottom) / 2;
    const stationRects = this._getStationScreenRects();
    let changed = false;

    this.stations.forEach((s) => {
      if (s.type === 'gem' || s.restocking || s.soldOut) {
        if (s.hover) { s.hover = false; changed = true; }
        return;
      }
      const entry = stationRects.find((r) => r.id === s.id);
      if (!entry) {
        if (s.hover) { s.hover = false; changed = true; }
        return;
      }
      const sc = this._stationCenter(entry);
      const dItem = Math.hypot(icx - sc.x, icy - sc.y);
      const dTouch = (touchX != null && touchY != null)
        ? Math.hypot(touchX - sc.x, touchY - sc.y)
        : Infinity;
      const near = this._itemRectHitsStation(itemRect, entry)
        || this._pointHitsStation(touchX, touchY, entry)
        || Math.min(dItem, dTouch) < TRADE_HIT_RADIUS;
      if (s.hover !== near) {
        s.hover = near;
        changed = true;
      }
    });

    if (changed) this._syncViews();
  }

  updateProximity(clientX, clientY) {
    const synth = this.controller.synthesisRect;
    if (!synth) return;
    const fakeItem = {
      x: clientX - synth.left - ITEM_SIZE_PX / 2,
      y: clientY - synth.top - ITEM_SIZE_PX / 2,
    };
    this.updateProximityFromItem(fakeItem, clientX, clientY);
  }

  clearProximity() {
    let changed = false;
    this.stations.forEach((s) => {
      if (s.hover) {
        s.hover = false;
        changed = true;
      }
    });
    if (changed) this._syncViews();
  }

  _flashWrong() {
    this.stations.forEach((s) => { s.wrong = true; });
    this._syncViews();
    setTimeout(() => {
      this.stations.forEach((s) => { s.wrong = false; });
      this._syncViews();
    }, 500);
  }
}

module.exports = TradeStationManager;
