module.exports = function attachIntroItems(IntroSystem) {
  IntroSystem.prototype.nextItemId = function nextItemId() {
    this._itemId += 1;
    return `item-${this._itemId}`;
  };

  IntroSystem.prototype.syncItemsToPage = function syncItemsToPage() {
    // 物品/合成结果改为在 canvas 每帧绘制（见 intro-render.drawItems），此处不再 setData
  };

  IntroSystem.prototype.createItem = function createItem(name, icon, isGolden = false, isSvg = false, emitGoldenPulse = true) {
    const sys = wx.getSystemInfoSync();
    const isLargeScreen = sys.windowWidth >= 800 && sys.windowHeight >= 700;
    const itemWidth = isLargeScreen ? 70 : 75;
    const itemHeight = isLargeScreen ? 70 : 75;
    const inventoryHeight = 180;
    const inventoryTop = this.logicalHeight - inventoryHeight;
    const itemsInInventory = this.items.filter((item) => item.y >= inventoryTop - 50);
    const itemIndex = itemsInInventory.length;
    const gap = 15;
    const padding = 25;
    const itemsPerRow = 4;
    const col = itemIndex % itemsPerRow;
    const row = Math.floor(itemIndex / itemsPerRow);
    const startX = padding;
    const startY = this.logicalHeight - inventoryHeight + padding;

    const item = {
      id: this.nextItemId(),
      name,
      icon: isSvg ? icon : (icon || name.charAt(0)),
      isSvg,
      isGolden,
      x: startX + col * (itemWidth + gap),
      y: startY + row * (itemHeight + gap),
      originX: startX + col * (itemWidth + gap),
      originY: startY + row * (itemHeight + gap),
      width: itemWidth,
      height: itemHeight,
      isDragging: false,
      isInSynthesisArea: false,
      animPhase: null,
      animTarget: null,
      spinAngle: 0,
      spinStart: 0,
      pulseInterval: null,
      goldenBorderOnly: !!(isGolden && !emitGoldenPulse),
      visible: true,
      opacity: 1,
      scale: 1,
      curScale: 0.5,
      curOpacity: 0,
    };

    this.items.push(item);

    if (isGolden && emitGoldenPulse) this.startGoldenPulse(item);
    return item;
  };

  IntroSystem.prototype.startGoldenPulse = function startGoldenPulse(item) {
    const pulse = () => {
      if (item.isGolden && this.items.includes(item)) {
        this.emitPulseWave(item.x + item.width / 2, item.y + item.height / 2, false);
      }
    };
    this.schedule(pulse, 300);
    item.pulseInterval = setInterval(() => {
      if (item.isGolden && this.items.includes(item)) {
        this.emitPulseWave(item.x + item.width / 2, item.y + item.height / 2, false);
      } else {
        clearInterval(item.pulseInterval);
      }
    }, 2000);
  };

  IntroSystem.prototype.updateItemVisual = function updateItemVisual(item) {
    if (!item.isGolden && item.pulseInterval) {
      clearInterval(item.pulseInterval);
      item.pulseInterval = null;
    }
    this.syncItemsToPage();
  };

  IntroSystem.prototype.createSynthesisResult = function createSynthesisResult(name, icon, x, y, isSvg = false) {
    const sys = wx.getSystemInfoSync();
    const isLargeScreen = sys.windowWidth >= 800 && sys.windowHeight >= 700;
    const size = isLargeScreen ? 75 : 80;
    const item = {
      id: this.nextItemId(),
      name,
      icon: isSvg ? icon : (icon || name.charAt(0)),
      isSvg,
      x: x - size / 2,
      y: y - size / 2,
      width: size,
      height: size,
      isDragging: false,
      animPhase: null,
      animTarget: null,
      isSynthesisResult: true,
      visible: true,
      opacity: 1,
      scale: 1,
      curScale: 0.5,
      curOpacity: 0,
    };
    this.synthesisResult = item;
    return item;
  };

  IntroSystem.prototype.flashWhite = function flashWhite(x, y) {
    const id = `flash-${Date.now()}`;
    this.synthesisFlashes = [...(this.synthesisFlashes || []), { id, x, y, t0: this.now() }];
    this.schedule(() => {
      this.synthesisFlashes = (this.synthesisFlashes || []).filter((f) => f.id !== id);
    }, 400);
  };

  IntroSystem.prototype.getTouchXY = function getTouchXY(touch) {
    return {
      x: touch.clientX != null ? touch.clientX : touch.pageX,
      y: touch.clientY != null ? touch.clientY : touch.pageY,
    };
  };

  IntroSystem.prototype.hitTestItem = function hitTestItem(x, y) {
    const clickable = [...this.items];
    if (this.synthesisResult) clickable.push(this.synthesisResult);
    return clickable.find((item) => (
      !item.hidden
      && x >= item.x && x <= item.x + item.width
      && y >= item.y && y <= item.y + item.height
    ));
  };

  IntroSystem.prototype.onTouchStart = function onTouchStart(e) {
    if (!['waitRicePlaced', 'waitSynthesis', 'waitOffer'].includes(this.state)) return;
    const touch = e.touches && e.touches[0];
    if (!touch) return;
    const { x, y } = this.getTouchXY(touch);
    const clickedItem = this.hitTestItem(x, y);
    if (!clickedItem) return;

    this.draggedItem = clickedItem;
    clickedItem.isDragging = true;
    clickedItem.dragOffsetX = x - clickedItem.x;
    clickedItem.dragOffsetY = y - clickedItem.y;

    if (clickedItem.isGolden) {
      if (clickedItem.pulseInterval) {
        clearInterval(clickedItem.pulseInterval);
        clickedItem.pulseInterval = null;
      }
      clickedItem.isGolden = false;
    }
    this.syncItemsToPage();
  };

  IntroSystem.prototype.onTouchMove = function onTouchMove(e) {
    if (!this.draggedItem) return;
    const touch = e.touches && e.touches[0];
    if (!touch) return;
    const { x: rawX, y: rawY } = this.getTouchXY(touch);
    const x = rawX - this.draggedItem.dragOffsetX;
    const y = rawY - this.draggedItem.dragOffsetY;
    this.draggedItem.x = x;
    this.draggedItem.y = y;
    this.draggedItem.isInSynthesisArea = rawY < this.logicalHeight - 150;

    if (this.synthesisResult && this.draggedItem === this.synthesisResult) {
      const doorCenterY = this.centerY - 16;
      const itemCenterX = x + this.draggedItem.width / 2;
      const itemCenterY = y + this.draggedItem.height / 2;
      const dx = itemCenterX - this.centerX;
      const dy = itemCenterY - doorCenterY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const inDoorArea = dist < 90;
      if (inDoorArea) this.addDoorClass('hover');
      else this.removeDoorClass('hover');
    }
    this.syncItemsToPage();
  };

  IntroSystem.prototype.onTouchEnd = function onTouchEnd(e) {
    if (!this.draggedItem) return;
    const item = this.draggedItem;
    const touch = (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0]);
    const { y: rawY } = touch ? this.getTouchXY(touch) : { y: item.y };
    const isInSynthesisArea = item.y < this.logicalHeight - 200;

    item.isDragging = false;

    if (this.state === 'waitRicePlaced' && item.name === '糯米' && isInSynthesisArea) {
      item.isInSynthesisArea = true;
      this.setState('ricePlacedPulse');
    } else if (this.state === 'waitSynthesis') {
      const rice = this.items.find((i) => i.name === '糯米');
      const brewing = this.items.find((i) => i.name === '酿造');
      if (rice && brewing) {
        const riceCenterX = rice.x + rice.width / 2;
        const riceCenterY = rice.y + rice.height / 2;
        const brewingCenterX = brewing.x + brewing.width / 2;
        const brewingCenterY = brewing.y + brewing.height / 2;
        const dx = riceCenterX - brewingCenterX;
        const dy = riceCenterY - brewingCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < ((rice.width + brewing.width) / 2) * 0.5) {
          this.setState('firstSynthesis');
        }
      }
    } else if (this.state === 'waitOffer' && item === this.synthesisResult) {
      const doorCenterY = this.centerY - 60;
      const itemCenterX = item.x + item.width / 2;
      const itemCenterY = item.y + item.height / 2;
      const dx = itemCenterX - this.centerX;
      const dy = itemCenterY - doorCenterY;
      if (Math.sqrt(dx * dx + dy * dy) < 130) {
        this.removeDoorClass('hover');
        this.setState('offerToDoor');
      }
    }

    this.draggedItem = null;
    this.syncItemsToPage();
  };
};
