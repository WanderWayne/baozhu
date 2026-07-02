const levelManager = require('../../utils/level-manager');
const { WORLDS } = require('../../utils/level-manager');
const { getWorldDisplayIcon, getLevelDoorIcon } = require('../../utils/levels-display');
const { navigateToWithFade, navigateBackWithFade } = require('../../utils/page-transitions');

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
  data: {
    statusBarHeight: 0,
    navPaddingTop: 0,
    headerHeight: 44,
    navPaddingLeft: 16,
    navPaddingRight: 16,
    theme: 'dairy',
    worlds: [],
    worldIcon: '🧀',
    worldName: '',
    storyText: '',
    levels: [],
    scrollIntoView: '',
    selectedIndex: 0,
    topHintText: '',
    topHintVisible: false,
    topHintFading: false,
    showClaimableDot: false,
    currentWorldId: 1,
  },

  _scrollThrottle: false,
  _bubbleWorld: null,

  onLoad(options) {
    this.setData(computeNavInsets());
    this.audioManager = require('../../utils/audio-manager');
    const worldId = parseInt(options.world || '1', 10);
    this.selectWorld(worldId);
  },

  onReady() {
    setTimeout(() => this.refreshCarouselVisuals(), 200);
    this._initBubbleCanvas();
  },

  onShow() {
    this.audioManager.unlock();
    this.audioManager.playBGM('bgm-menu');
    this.setData({ showClaimableDot: levelManager.hasAnyClaimableTask() });
    this.selectWorld(this.data.currentWorldId);
    setTimeout(() => this.refreshCarouselVisuals(), 300);
    if (this._bubbleWorld) this._bubbleWorld.start();
  },

  onHide() {
    if (this.audioManager) this.audioManager.stopBGM();
  },

  onUnload() {
    if (this._bubbleWorld) { this._bubbleWorld.destroy(); this._bubbleWorld = null; }
    if (this.audioManager) this.audioManager.stopBGM();
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
        this._bubbleWorld.start();
      });
  },

  selectWorld(worldId) {
    const world = levelManager.getWorldData(worldId) || WORLDS[0];
    if (!world) return;

    const worlds = WORLDS.map((w) => {
      const progress = levelManager.getWorldProgress(w.id);
      return {
        id: w.id,
        icon: w.icon,
        displayIcon: getWorldDisplayIcon(w),
        unlocked: levelManager.isWorldUnlocked(w.id),
        active: w.id === worldId,
        completed: progress.percentage === 100,
      };
    });

    const rawLevels = levelManager.getWorldLevels(worldId);
    let firstOpen = 0;
    for (let i = 0; i < rawLevels.length; i += 1) {
      if (levelManager.isLevelUnlocked(rawLevels[i].id) && !levelManager.isLevelCompleted(rawLevels[i].id)) {
        firstOpen = i;
        break;
      }
    }

    const levels = rawLevels.map((lv, index) => {
      const unlocked = levelManager.isLevelUnlocked(lv.id);
      const completed = levelManager.isLevelCompleted(lv.id);
      let targetLabel = unlocked ? `目标 · ${lv.target}` : '尚未解锁';
      if (lv.multiTarget && lv.multiTargets) {
        targetLabel = unlocked ? `目标 · ${lv.multiTargets.join('，')}` : '尚未解锁';
      }
      const latest = unlocked && !completed && index === firstOpen;
      return {
        id: lv.id,
        name: lv.name,
        icon: lv.icon || '🍨',
        doorIcon: getLevelDoorIcon(lv, unlocked),
        targetLabel,
        unlocked,
        completed,
        selected: index === firstOpen,
        latest,
        doorStyle: '',
      };
    });

    const newTheme = world.theme || 'dairy';
    this.setData({
      currentWorldId: worldId,
      theme: newTheme,
      worlds,
      worldIcon: getWorldDisplayIcon(world),
      worldName: world.name,
      storyText: world.description || '',
      levels,
      selectedIndex: firstOpen,
      scrollIntoView: levels[firstOpen] ? `door-${levels[firstOpen].id}` : '',
    }, () => {
      setTimeout(() => this.refreshCarouselVisuals(), 150);
      if (this._bubbleWorld) this._bubbleWorld.setTheme(newTheme);
    });
  },

  refreshCarouselVisuals() {
    const query = wx.createSelectorQuery().in(this);
    query.select('#carousel-container').boundingClientRect();
    query.selectAll('.level-door').boundingClientRect();
    query.exec((res) => {
      const container = res[0];
      const doors = res[1];
      if (!container || !doors || !doors.length) return;

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

      const levels = this.data.levels.map((lv, idx) => {
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

        const scale = 1 - t * 0.08;
        const selected = idx === closestIndex;
        const pointerEvents = opacity < 0.05 ? 'none' : 'auto';

        return {
          ...lv,
          selected,
          doorStyle: `opacity:${opacity};transform:scale(${scale});pointer-events:${pointerEvents};`,
        };
      });

      this.setData({ levels, selectedIndex: closestIndex });
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
      scrollIntoView: `door-${level.id}`,
      selectedIndex: index,
    });
    this.audioManager.playClickOpen();
    setTimeout(() => this.refreshCarouselVisuals(), 350);
  },

  onEnterLevel(e) {
    const levelId = parseInt(e.currentTarget.dataset.id, 10);
    if (!levelManager.isLevelUnlocked(levelId)) {
      this.showTopHint('由于你未解锁此关卡，所以无法进入。');
      return;
    }
    this.audioManager.playClickEnter();
    this.audioManager.stopBGM();
    navigateToWithFade(`/pages/game/game?level=${levelId}`);
  },

  onCarouselScroll() {
    // Throttle: fire immediately, then at most once per frame during drag
    if (this._scrollThrottle) return;
    this._scrollThrottle = true;
    this.refreshCarouselVisuals();
    setTimeout(() => { this._scrollThrottle = false; }, 16);
  },

  onCarouselScrollEnd() {
    // Final cleanup after momentum scroll settles
    this.refreshCarouselVisuals();
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
