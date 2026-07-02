const levelManager = require('../../utils/level-manager');
const { FRAGMENTS } = require('../../data/items.js');
const { navigateBackWithFade } = require('../../utils/page-transitions');

const CATEGORY_LABELS = {
  all: '全部',
  founder: '创始故事',
  craft: '传统工艺',
  ingredient: '食材来源',
  philosophy: '品牌哲学',
  history: '历史传承',
  season: '季节故事',
};

Page({
  data: {
    statusBarHeight: 0,
    progressText: '0/15',
    progressPercent: 0,
    currentCategory: 'all',
    categories: [
      { id: 'all', label: '全部' },
      { id: 'founder', label: '创始' },
      { id: 'craft', label: '工艺' },
      { id: 'ingredient', label: '食材' },
      { id: 'philosophy', label: '哲学' },
      { id: 'history', label: '历史' },
      { id: 'season', label: '季节' },
    ],
    fragments: [],
    allCollected: false,
    ultimateHint: '收集全部碎片，唤醒传说…',
    detailVisible: false,
    detail: {},
  },

  collected: [],

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
    this.collected = levelManager.currentProgress.fragments || [];
    const total = FRAGMENTS.length;
    const collected = this.collected.length;
    this.renderFragments(this.data.currentCategory);
    this.setData({
      progressText: `${collected}/${total}`,
      progressPercent: total > 0 ? Math.round((collected / total) * 100) : 0,
      allCollected: collected >= total && total > 0,
      ultimateHint: collected >= total && total > 0 ? '传说已被唤醒！' : '收集全部碎片，唤醒传说…',
    });
  },

  renderFragments(category) {
    let list = FRAGMENTS;
    if (category !== 'all') {
      list = list.filter((f) => f.category === category);
    }
    const fragments = list.map((f) => ({
      id: f.id,
      image: f.image,
      categoryLabel: CATEGORY_LABELS[f.category] || f.category,
      collected: this.collected.includes(f.id),
      raw: f,
    }));
    this.setData({ fragments });
  },

  onCategoryTap(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ currentCategory: id });
    this.renderFragments(id);
    this.audioManager.playClickOpen();
  },

  onFragmentTap(e) {
    const id = e.currentTarget.dataset.id;
    const frag = FRAGMENTS.find((f) => f.id === id);
    if (!frag || !this.collected.includes(id)) return;
    this.setData({
      detailVisible: true,
      detail: {
        image: frag.image,
        categoryLabel: CATEGORY_LABELS[frag.category] || frag.category,
        story: `"${frag.text}"`,
        trigger: `合成 ${frag.trigger}`,
      },
    });
  },

  hideDetail() {
    this.setData({ detailVisible: false });
  },

  noop() {},

  onBack() {
    this.audioManager.playClickBack();
    navigateBackWithFade('/pages/index/index');
  },
});
