System.register(["__unresolved_0", "cc", "__unresolved_1"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, getGameContext, _dec, _class, _crd, ccclass, GameScene;

  function _reportPossibleCrUseOfgetGameContext(extras) {
    _reporterNs.report("getGameContext", "./GameContext", _context.meta, extras);
  }

  return {
    setters: [function (_unresolved_) {
      _reporterNs = _unresolved_;
    }, function (_cc) {
      _cclegacy = _cc.cclegacy;
      __checkObsolete__ = _cc.__checkObsolete__;
      __checkObsoleteInNamespace__ = _cc.__checkObsoleteInNamespace__;
      _decorator = _cc._decorator;
      Component = _cc.Component;
    }, function (_unresolved_2) {
      getGameContext = _unresolved_2.getGameContext;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "7c7f82d+iBEzpHmFC8PO7GA", "GameScene", undefined);

      __checkObsolete__(['_decorator', 'Component']);

      ({
        ccclass
      } = _decorator);

      _export("GameScene", GameScene = (_dec = ccclass('GameScene'), _dec(_class = class GameScene extends Component {
        constructor(...args) {
          super(...args);
          this.state = null;
        }

        onEnable() {
          const {
            router
          } = (_crd && getGameContext === void 0 ? (_reportPossibleCrUseOfgetGameContext({
            error: Error()
          }), getGameContext) : getGameContext)();
          router.onChange((scene, routeState) => {
            if (scene !== 'Game') return;
            const levelId = routeState.levelId || 101;
            this.enterLevel(levelId);
          });
        }

        enterLevel(levelId) {
          const ctx = (_crd && getGameContext === void 0 ? (_reportPossibleCrUseOfgetGameContext({
            error: Error()
          }), getGameContext) : getGameContext)();
          const level = ctx.config.getLevels().find(l => l.id === levelId);

          if (!level) {
            console.warn('[GameScene] level not found', levelId);
            ctx.router.navigate('Levels');
            return;
          }

          this.state = {
            levelId,
            inventory: [...(level.initialItems || [])],
            craftedItems: [],
            target: level.target || '',
            completed: false
          };
          console.log('[GameScene] enter level', this.state);
        }

        trySynthesize(itemA, itemB, extraItem) {
          if (!this.state || this.state.completed) return;
          const ctx = (_crd && getGameContext === void 0 ? (_reportPossibleCrUseOfgetGameContext({
            error: Error()
          }), getGameContext) : getGameContext)();
          const items = [itemA, itemB];
          if (extraItem) items.push(extraItem);
          const result = ctx.recipes.synthesize(items);

          if (!result.success || !result.resultItem) {
            console.log('[GameScene] synth failed', items, result.reason);
            return;
          }

          this.state.inventory.push(result.resultItem);
          this.state.craftedItems.push(result.resultItem);
          ctx.progress.discoverItem(result.resultItem);
          this.tryUnlockFragment(result.resultItem);
          console.log('[GameScene] synth success', items, '=>', result.resultItem);

          if (result.resultItem === this.state.target) {
            this.offerTarget();
          }
        }

        tryUnlockFragment(itemName) {
          const ctx = (_crd && getGameContext === void 0 ? (_reportPossibleCrUseOfgetGameContext({
            error: Error()
          }), getGameContext) : getGameContext)();
          const fragment = ctx.config.getFragments().find(f => f.trigger === itemName);
          if (!(fragment != null && fragment.id)) return;

          if (ctx.progress.discoverFragment(fragment.id)) {
            console.log('[GameScene] fragment unlocked', fragment.id);
          }
        }

        offerTarget() {
          if (!this.state || this.state.completed) return;
          const ctx = (_crd && getGameContext === void 0 ? (_reportPossibleCrUseOfgetGameContext({
            error: Error()
          }), getGameContext) : getGameContext)();
          this.state.completed = true;
          ctx.progress.markLevelComplete(this.state.levelId);
          ctx.progress.addGems(50);
          ctx.progress.applyAutoWorldUnlocks(ctx.config.getWorlds().map(w => w.id));
          ctx.progress.save();
          console.log('[GameScene] level completed', this.state.levelId);
          this.backToLevels();
        }

        backToLevels() {
          (_crd && getGameContext === void 0 ? (_reportPossibleCrUseOfgetGameContext({
            error: Error()
          }), getGameContext) : getGameContext)().router.navigate('Levels');
        }

      }) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=a7777ce746e7124720302e7ada5f2dd148d00b06.js.map