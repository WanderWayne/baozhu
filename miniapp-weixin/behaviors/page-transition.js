const {
  consumeEnterTransition,
  animateTransitionOpacity,
  FADE_IN_MS,
} = require('../utils/page-transitions');

const NATIVE_ROUTE_SETTLE_MS = 320;

const EMPTY = {
  active: false,
  opacity: 0,
  contentOpacity: 1,
  leaving: false,
  mode: 'warm',
};

module.exports = Behavior({
  data: {
    pageTransition: { ...EMPTY },
  },

  methods: {
    _blockTransitionTouch() {},

    _preparePageTransitionEnter() {
      const mode = consumeEnterTransition();
      if (!mode) return;
      this._pendingPageTransitionMode = mode;
      this.setData({
        pageTransition: {
          active: true,
          opacity: 1,
          contentOpacity: 0,
          leaving: false,
          mode,
        },
      });
      if (typeof this._setCanvasTransitionOpacity === 'function') {
        this._setCanvasTransitionOpacity(1);
      }
    },

    _handlePageTransitionEnter() {
      const mode = this._pendingPageTransitionMode || consumeEnterTransition();
      this._pendingPageTransitionMode = '';
      if (mode) {
        this.setData({
          pageTransition: {
            active: true,
            opacity: 1,
            contentOpacity: 0,
            leaving: false,
            mode,
          },
        }, () => {
          if (typeof this._setCanvasTransitionOpacity === 'function') {
            this._setCanvasTransitionOpacity(1);
          }
          setTimeout(() => {
            animateTransitionOpacity(this, 1, 0, FADE_IN_MS).then(() => {
              this.setData({
                pageTransition: { ...EMPTY },
              });
            });
          }, NATIVE_ROUTE_SETTLE_MS);
        });
      }
    },
  },
});
