const levelManager = require('../../utils/level-manager');
const { getAtlasProgressCounts } = require('../../utils/atlas-counts');
const atlas = require('../../data/atlas.js');
const { ITEMS, RECIPES } = require('../../data/items.js');
const { LEVELS: ALL_LEVELS } = require('../../data/worlds.js');
const { navigateBackWithFade } = require('../../utils/page-transitions');

function categorizeRecipes() {
  const core = [];
  const branch = [];
  const hidden = [];
  const targetItems = ALL_LEVELS.map((l) => l.target);

  Object.entries(ITEMS).forEach(([name, data]) => {
    const item = { name, ...data };
    if (data.type === 'ultimate' || targetItems.includes(name)) {
      core.push(item);
    } else if (data.hidden) {
      hidden.push(item);
    } else if (data.type === 'mid' || data.type === 'final') {
      branch.push(item);
    }
  });
  return { core, branch, hidden };
}

Page({
  data: {
    statusBarHeight: 0,
    atlasProgressText: '0/3',
    atlasSlots: [],
    centerUnlocked: false,
    recipesOpen: false,
    recipePercent: 0,
    coreDiscovered: 0,
    branchDiscovered: 0,
    hiddenDiscovered: 0,
    coreTotal: 0,
    branchTotal: 0,
    hiddenTotal: 0,
    recipeSections: [],
    detailVisible: false,
    detail: {},
  },

  discovered: [],

  onLoad() {
    const sys = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sys.statusBarHeight || 0 });
    this.audioManager = require('../../utils/audio-manager');
    this.refresh();
  },

  onShow() {
    this.audioManager.unlock();
    this.audioManager.playBGM('bgm-menu');
    this.refresh();
  },

  refresh() {
    if (levelManager.refreshAtlasUnlocks()) levelManager.saveProgress();
    this.discovered = levelManager.currentProgress.discoveredItems || [];
    const pieces = levelManager.currentProgress.atlasPieces || [];
    const { unlocked, total } = getAtlasProgressCounts(pieces);

    const slots = (atlas.slots || []).map((s) => ({
      id: s.id,
      kind: s.kind,
      label: s.label || s.id,
      unlocked: pieces.includes(s.id),
    }));

    const categories = categorizeRecipes();
    const mapSection = (title, list) => {
      const items = list.map((r) => ({
        name: r.name,
        icon: r.icon || '✨',
        discovered: this.discovered.includes(r.name),
      }));
      const discovered = items.filter((i) => i.discovered).length;
      return { title, items, discovered, total: items.length };
    };

    const sections = [
      mapSection('核心配方', categories.core),
      mapSection('支线配方', categories.branch),
      mapSection('隐藏配方', categories.hidden),
    ];

    const sum = categories.core.length + categories.branch.length + categories.hidden.length;
    const discoveredCount = sections.reduce((a, s) => a + s.discovered, 0);

    this.setData({
      atlasProgressText: `${unlocked}/${total}`,
      atlasSlots: slots,
      centerUnlocked: pieces.includes('center'),
      coreDiscovered: sections[0].discovered,
      branchDiscovered: sections[1].discovered,
      hiddenDiscovered: sections[2].discovered,
      coreTotal: sections[0].total,
      branchTotal: sections[1].total,
      hiddenTotal: sections[2].total,
      recipePercent: sum > 0 ? Math.round((discoveredCount / sum) * 100) : 0,
      recipeSections: sections,
    });
  },

  toggleRecipes() {
    this.setData({ recipesOpen: !this.data.recipesOpen });
    this.audioManager.playClickOpen();
  },

  onRecipeTap(e) {
    const name = e.currentTarget.dataset.name;
    if (!this.discovered.includes(name)) return;
    const data = ITEMS[name] || {};
    const recipeData = RECIPES.find((r) => r.result === name);
    let formula = '配方来源未知';
    if (recipeData) {
      formula = `${recipeData.ingredients.join(' + ')} → ${name}`;
    }
    this.setData({
      detailVisible: true,
      detail: {
        icon: data.icon || '✨',
        name,
        desc: data.desc || '',
        formula,
      },
    });
    this.audioManager.playClickOpen();
  },

  hideDetail() {
    this.setData({ detailVisible: false });
    this.audioManager.playClickExit();
  },

  noop() {},

  onBack() {
    this.audioManager.playClickBack();
    navigateBackWithFade('/pages/index/index');
  },
});
