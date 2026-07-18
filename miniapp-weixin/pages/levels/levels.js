/** @feature level-select @see docs/features/level-select.md */
const levelManager = require('../../utils/level-manager');
const { WORLDS } = require('../../utils/level-manager');
const { getWorldDisplayIcon, getLevelDoorIcon } = require('../../utils/levels-display');
const { navigateToWithFade, navigateBackWithFade } = require('../../utils/page-transitions');
const pageTransitionBehavior = require('../../behaviors/page-transition');

function computeNavInsets() {
  const sys = wx.getSystemInfoSync();
  const statusBarHeight = sys.statusBarHeight || 0;
  let navPaddingTop = statusBarHeight + 8;
  let headerHeight = 44;
  let navPaddingLeft = 16;
  let navPaddingRight = 16;
  try {
    const menu = wx.getMenuButtonBoundingClientRect();
    if (menu && menu.top) {
      navPaddingTop = menu.top;
      headerHeight = menu.height || 32;
      navPaddingRight = Math.max(16, sys.windowWidth - menu.left + 8);
    }
  } catch (e) {
    /* ignore */
  }
  return {
    statusBarHeight,
    navPaddingTop,
    headerHeight,
    navPaddingLeft,
    navPaddingRight,
  };
}

Page({
  behaviors: [pageTransitionBehavior],
  data: {
    statusBarHeight: 0,
    navPaddingTop: 0,
    headerHeight: 44,
    navPaddingLeft: 16,
    navPaddingRight: 16,
    theme: 'dairy',
    worlds: [],
    worldIcon: '🧀',
    worldIconName: '',
    worldName: '',
    storyText: '',
    levels: [],
    scrollIntoView: '',
    scrollTop: 0,
    carouselHeight: 0,
    spacerHeight: 120,
    selectedIndex: 0,
    topHintText: '',
    topHintVisible: false,
    topHintFading: false,
    showClaimableDot: false,
    currentWorldId: 1,
  },

  _scrollThrottle: false,
  _bubbleWorld: null,
  _pendingCenterIndex: 0,

  _rpxToPx(rpx) {
    const sys = wx.getSystemInfoSync();
    return (sys.windowWidth || 375) * rpx / 750;
  },

  _estimateDoorHeight() {
    return this._rpxToPx(180);
  },

  _estimateDoorGap() {
    return this._rpxToPx(28);
  },

  _computeSpacerHeight(carouselHeight = this.data.carouselHeight, doorHeight = this._estimateDoorHeight()) {
    return Math.max(0, Math.round(((carouselHeight || 420) - doorHeight) / 2));
  },

  _selectLevelFromScrollTop(scrollTop, afterRefresh) {
    const currentLevels = this.data.levels || [];
    if (!currentLevels.length) {
      if (typeof afterRefresh === 'function') afterRefresh(0);
      return;
    }

    const doorH = this._estimateDoorHeight();
    const gap = this._estimateDoorGap();
    const spacer = this.data.spacerHeight || this._computeSpacerHeight();
    const carouselH = this.data.carouselHeight || 420;
    const rawIndex = Math.round((scrollTop + carouselH / 2 - spacer - doorH / 2) / (doorH + gap));
    const closestIndex = Math.max(0, Math.min(currentLevels.length - 1, rawIndex));
    const selectedIndex = this._findSelectableIndex(currentLevels, closestIndex);
    const fallbackMode = selectedIndex !== closestIndex;
    const halfH = carouselH / 2;

    const levels = currentLevels.map((lv, idx) => {
      const doorCenter = spacer + idx * (doorH + gap) + doorH / 2 - scrollTop;
      const distance = Math.abs(doorCenter - carouselH / 2);
      const t = Math.min(distance / halfH, 1);
      const idxDist = Math.abs(idx - closestIndex);

      let opacity;
      if (idxDist >= 2) {
        opacity = 0;
      } else if (idxDist === 1) {
        opacity = 0.78 + (1 - t) * 0.14;
      } else {
        opacity = 1;
      }

      if (!lv.unlocked && opacity > 0) opacity *= 0.52;

      let scale = 1 - t * 0.08;
      return {
        ...lv,
        selected: idx === selectedIndex,
        fallbackSelected: fallbackMode && idx === selectedIndex,
        doorStyle: `opacity:${opacity};transform:scale(${scale});pointer-events:${opacity < 0.05 ? 'none' : 'auto'};`,
      };
    });

    this.setData({ levels, selectedIndex }, () => {
      if (typeof afterRefresh === 'function') afterRefresh(selectedIndex);
    });
  },

  _findPlayableIndex(levels) {
    if (!levels || !levels.length) return 0;
    const firstIncomplete = levels.findIndex((lv) => lv.unlocked && !lv.completed);
    if (firstIncomplete >= 0) return firstIncomplete;
    for (let i = levels.length - 1; i >= 0; i -= 1) {
      if (levels[i].unlocked) return i;
    }
    return 0;
  },

  _findSelectableIndex(levels, centerIndex) {
    if (!levels || !levels.length) return 0;
    const start = Math.max(0, Math.min(levels.length - 1, centerIndex));
    for (let i = start; i >= 0; i -= 1) {
      if (levels[i].unlocked) return i;
    }
    return this._findPlayableIndex(levels);
  },

  onLoad(options) {
    this._preparePageTransitionEnter();
    this.setData(computeNavInsets());
    this.audioManager = require('../../utils/audio-manager');
    const worldId = parseInt(options.world || '1', 10);
    this.selectWorld(worldId);
  },

  onReady() {
    this._measureCarouselHeight();
    setTimeout(() => this.refreshCarouselVisuals(), 200);
    this._initBubbleCanvas();
  },

  _measureCarouselHeight() {
    wx.createSelectorQuery()
      .in(this)
      .select('#carousel-container')
      .boundingClientRect((rect) => {
        if (rect && rect.height > 0) {
          const carouselHeight = Math.floor(rect.height);
          this.setData({
            carouselHeight,
            spacerHeight: this._computeSpacerHeight(carouselHeight),
          }, () => {
            this._centerLevel(this._pendingCenterIndex || this.data.selectedIndex || 0);
          });
        }
      })
      .exec();
  },

  onShow() {
    this._handlePageTransitionEnter();
    this.audioManager.unlock();
    this.audioManager.playBGM('bgm-menu', { fadeInMs: 2000 });
    this.setData({ showClaimableDot: levelManager.hasAnyClaimableTask() });
    this.selectWorld(this.data.currentWorldId);
    setTimeout(() => this.refreshCarouselVisuals(), 300);
    if (this._bubbleWorld) this._bubbleWorld.start();
  },

  onHide() {
    if (this.audioManager) this.audioManager.fadeOutBGM(2000);
  },

  onUnload() {
    if (this._bubbleWorld) { this._bubbleWorld.destroy(); this._bubbleWorld = null; }
    if (this.audioManager) this.audioManager.fadeOutBGM(2000);
  },

  _setCanvasTransitionOpacity(opacity) {
    this._canvasTransitionOpacity = opacity;
    if (this._bubbleWorld && typeof this._bubbleWorld.setTransitionOpacity === 'function') {
      this._bubbleWorld.setTransitionOpacity(opacity);
    }
  },

  _initBubbleCanvas(retry = 0) {
    const FermentationWorld = require('../../utils/levels-bubbles');
    const sys = wx.getSystemInfoSync();
    const dpr = sys.pixelRatio || 2;
    const w = sys.windowWidth;
    const h = sys.windowHeight;

    wx.createSelectorQuery()
      .in(this)
      .select('#bubble-canvas')
      .fields({ node: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          if (retry < 5) setTimeout(() => this._initBubbleCanvas(retry + 1), 150);
          return;
        }
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);

        if (this._bubbleWorld) this._bubbleWorld.destroy();
        this._bubbleWorld = new FermentationWorld({
          canvas, ctx, width: w, height: h,
          theme: this.data.theme || 'dairy',
        });
        this._bubbleWorld.setTransitionOpacity(this._canvasTransitionOpacity || 0);
        this._bubbleWorld.start();
      });
  },

  selectWorld(worldId) {
    const world = levelManager.getWorldData(worldId) || WORLDS[0];
    if (!world) return;

    const worlds = WORLDS.map((w) => {
      const progress = levelManager.getWorldProgress(w.id);
      const display = getWorldDisplayIcon(w);
      return {
        id: w.id,
        icon: w.icon,
        displayIcon: display.emoji,
        iconName: display.iconName,
        unlocked: levelManager.isWorldUnlocked(w.id),
        active: w.id === worldId,
        completed: progress.percentage === 100,
      };
    });

    const rawLevels = levelManager.getWorldLevels(worldId);
    const levels = rawLevels.map((lv, index) => {
      const unlocked = levelManager.isLevelUnlocked(lv.id);
      const completed = levelManager.isLevelCompleted(lv.id);
      let targetLabel = unlocked ? `目标 · ${lv.target}` : '尚未解锁';
      if (lv.multiTarget && lv.multiTargets) {
        targetLabel = unlocked ? `目标 · ${lv.multiTargets.join('，')}` : '尚未解锁';
      }
      const door = getLevelDoorIcon(lv, unlocked);
      return {
        id: lv.id,
        name: lv.name,
        target: lv.target || '',
        icon: lv.icon || '🍨',
        doorIcon: door.emoji,
        doorIconName: door.iconName,
        targetLabel,
        unlocked,
        completed,
        selected: false,
        fallbackSelected: false,
        latest: false,
        doorStyle: '',
      };
    });
    const firstOpen = this._findPlayableIndex(levels);
    levels.forEach((lv, index) => {
      lv.selected = index === firstOpen;
      lv.latest = index === firstOpen && lv.unlocked && !lv.completed;
    });

    const newTheme = world.theme || 'dairy';
    const wIcon = getWorldDisplayIcon(world);
    this.setData({
      currentWorldId: worldId,
      theme: newTheme,
      worlds,
      worldIcon: wIcon.emoji,
      worldIconName: wIcon.iconName,
      worldName: world.name,
      storyText: world.description || '',
      levels,
      selectedIndex: firstOpen,
      scrollIntoView: '',
      scrollTop: this._estimateScrollTop(firstOpen),
      spacerHeight: this._computeSpacerHeight(),
    }, () => {
      this._lastScrollTop = this._estimateScrollTop(firstOpen);
      this._pendingCenterIndex = firstOpen;
      setTimeout(() => this._centerLevel(firstOpen), 80);
      setTimeout(() => this.refreshCarouselVisuals(), 150);
      if (this._bubbleWorld) this._bubbleWorld.setTheme(newTheme);
    });
  },

  _estimateScrollTop(index) {
    const doorH = this._estimateDoorHeight();
    const gap = this._estimateDoorGap();
    const spacer = this.data.spacerHeight || this._computeSpacerHeight();
    const carouselH = this.data.carouselHeight || 420;
    return Math.max(0, Math.round(spacer + index * (doorH + gap) - (carouselH - doorH) / 2));
  },

  _centerLevel(index) {
    const query = wx.createSelectorQuery().in(this);
    query.select('#carousel-container').boundingClientRect();
    query.selectAll('.level-door').boundingClientRect();
    query.exec((res) => {
      const container = res && res[0];
      const doors = res && res[1];
      const rect = doors && doors[index];
      if (!container || !rect) {
        this.setData({ scrollTop: this._estimateScrollTop(index) });
        return;
      }
      const spacerHeight = this._computeSpacerHeight(container.height, rect.height);
      const spacerDelta = spacerHeight - (this.data.spacerHeight || 0);
      const delta = (rect.top + rect.height / 2) - (container.top + container.height / 2);
      this.setData({
        spacerHeight,
        scrollTop: Math.max(0, Math.round((this.data.scrollTop || 0) + delta + spacerDelta)),
      });
      this._lastScrollTop = Math.max(0, Math.round((this.data.scrollTop || 0) + delta + spacerDelta));
      setTimeout(() => this.refreshCarouselVisuals(), 120);
    });
  },

  refreshCarouselVisuals(afterRefresh) {
    const query = wx.createSelectorQuery().in(this);
    query.select('#carousel-container').boundingClientRect();
    query.selectAll('.level-door').boundingClientRect();
    query.exec((res) => {
      const container = res[0];
      const doors = res[1];
      if (!container || !doors || !doors.length) {
        if (typeof afterRefresh === 'function') afterRefresh(this.data.selectedIndex || 0);
        return;
      }

      const centerY = container.top + container.height / 2;
      const halfH = container.height / 2;
      let closestIndex = 0;
      let closestDistance = Infinity;

      doors.forEach((rect, i) => {
        const doorCenter = rect.top + rect.height / 2;
        const distance = Math.abs(doorCenter - centerY);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = i;
        }
      });

      const currentLevels = this.data.levels || [];
      const selectedIndex = this._findSelectableIndex(currentLevels, closestIndex);
      const fallbackMode = selectedIndex !== closestIndex;
      const levels = currentLevels.map((lv, idx) => {
        const rect = doors[idx];
        if (!rect) return lv;

        const doorCenter = rect.top + rect.height / 2;
        const distance = Math.abs(doorCenter - centerY);
        const t = Math.min(distance / halfH, 1);
        const idxDist = Math.abs(idx - closestIndex);

        let opacity;
        if (idxDist >= 2) {
          opacity = 0;
        } else if (idxDist === 1) {
          opacity = 0.78 + (1 - t) * 0.14;
        } else {
          opacity = 1;
        }

        if (!lv.unlocked && opacity > 0) {
          opacity *= 0.52;
        }

        let scale = 1 - t * 0.08;
        const pointerEvents = opacity < 0.05 ? 'none' : 'auto';

        return {
          ...lv,
          selected: idx === selectedIndex,
          fallbackSelected: fallbackMode && idx === selectedIndex,
          doorStyle: `opacity:${opacity};transform:scale(${scale});pointer-events:${pointerEvents};`,
        };
      });

      this.setData({ levels, selectedIndex }, () => {
        if (typeof afterRefresh === 'function') afterRefresh(selectedIndex);
      });
    });
  },

  onWorldTap(e) {
    const worldId = parseInt(e.currentTarget.dataset.id, 10);
    if (!levelManager.isWorldUnlocked(worldId)) {
      this.showTopHint('由于你未解锁此章节，所以无法进入。');
      return;
    }
    this.audioManager.playClickOpen();
    this.selectWorld(worldId);
  },

  onDoorTap(e) {
    const index = parseInt(e.currentTarget.dataset.index, 10);
    const level = this.data.levels[index];
    if (!level) return;
    if (!level.unlocked) {
      this.showTopHint('由于你未解锁此关卡，所以无法进入。');
      return;
    }
    this.setData({
      scrollIntoView: '',
      scrollTop: this._estimateScrollTop(index),
      selectedIndex: index,
    });
    this.audioManager.playClickOpen();
    setTimeout(() => this._centerLevel(index), 80);
    setTimeout(() => this.refreshCarouselVisuals(), 350);
  },

  onEnterLevel(e) {
    const levelId = parseInt(e.currentTarget.dataset.id, 10);
    if (!levelManager.isLevelUnlocked(levelId)) {
      this.showTopHint('由于你未解锁此关卡，所以无法进入。');
      return;
    }
    this.audioManager.playClickEnter();
    this.audioManager.fadeOutBGM(2000);
    navigateToWithFade(`/pages/game/game?level=${levelId}`);
  },

  onCarouselScroll() {
    // Throttle: fire immediately, then at most once per frame during drag
    if (this._scrollThrottle) return;
    this._scrollThrottle = true;
    const scrollTop = arguments[0]?.detail?.scrollTop;
    if (typeof scrollTop === 'number') {
      this._lastScrollTop = scrollTop;
      this._selectLevelFromScrollTop(scrollTop);
    } else {
      this.refreshCarouselVisuals();
    }
    setTimeout(() => { this._scrollThrottle = false; }, 16);
  },

  onCarouselScrollEnd() {
    // Final cleanup after momentum scroll settles
    if (typeof this._lastScrollTop === 'number') {
      this._selectLevelFromScrollTop(this._lastScrollTop);
    } else {
      this.refreshCarouselVisuals();
    }
  },

  showTopHint(message) {
    this.setData({ topHintText: message, topHintVisible: true, topHintFading: false });
    this.audioManager.playSFX('error');
    setTimeout(() => this.setData({ topHintFading: true }), 500);
    setTimeout(() => {
      this.setData({ topHintVisible: false, topHintFading: false, topHintText: '' });
    }, 1500);
  },

  onBack() {
    this.audioManager.playClickBack();
    navigateBackWithFade('/pages/index/index');
  },
});
