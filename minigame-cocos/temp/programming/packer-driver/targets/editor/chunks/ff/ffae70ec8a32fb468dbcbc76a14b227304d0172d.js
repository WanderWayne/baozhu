System.register(["__unresolved_0", "cc"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, ProgressService, _crd, STORAGE_KEY;

  function _reportPossibleCrUseOfProgressState(extras) {
    _reporterNs.report("ProgressState", "./types", _context.meta, extras);
  }

  _export("ProgressService", void 0);

  return {
    setters: [function (_unresolved_) {
      _reporterNs = _unresolved_;
    }, function (_cc) {
      _cclegacy = _cc.cclegacy;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "c5f44Pc8kBGXoB4DDO1BvxH", "ProgressService", undefined);

      STORAGE_KEY = 'bojoo_game_progress_v2';

      _export("ProgressService", ProgressService = class ProgressService {
        constructor(storage, atlasCountableSlotIds) {
          this.state = void 0;
          this.storage = void 0;
          this.atlasCountableSlotIds = void 0;
          this.worldUnlockFragmentThreshold = {
            1: 0,
            2: 3,
            3: 6,
            4: 9,
            5: 12,
            6: 16
          };
          this.storage = storage;
          this.atlasCountableSlotIds = atlasCountableSlotIds;
          this.state = this.load();
        }

        defaultState() {
          return {
            unlockedWorlds: [1],
            unlockedLevels: [101],
            completedLevels: [],
            discoveredItems: [],
            fragments: [],
            achievements: [],
            gems: 0,
            discoveredRecipes: {},
            atlasPieces: [],
            chapterPhaseSettlementSeen: false
          };
        }

        load() {
          try {
            const raw = this.storage.getString(STORAGE_KEY);
            if (!raw) return this.defaultState();
            const parsed = JSON.parse(raw);
            return { ...this.defaultState(),
              ...parsed,
              unlockedWorlds: parsed.unlockedWorlds || [1],
              unlockedLevels: parsed.unlockedLevels || [101],
              completedLevels: parsed.completedLevels || [],
              discoveredItems: parsed.discoveredItems || [],
              fragments: parsed.fragments || [],
              achievements: parsed.achievements || [],
              discoveredRecipes: parsed.discoveredRecipes || {},
              atlasPieces: parsed.atlasPieces || []
            };
          } catch (e) {
            return this.defaultState();
          }
        }

        save() {
          this.storage.setString(STORAGE_KEY, JSON.stringify(this.state));
        }

        reset() {
          this.state = this.defaultState();
          this.storage.remove(STORAGE_KEY);
        }

        snapshot() {
          return JSON.parse(JSON.stringify(this.state));
        }

        markLevelComplete(levelId) {
          if (this.state.completedLevels.includes(levelId)) return false;
          this.state.completedLevels.push(levelId);
          return true;
        }

        discoverItem(itemName) {
          if (this.state.discoveredItems.includes(itemName)) return false;
          this.state.discoveredItems.push(itemName);
          return true;
        }

        discoverFragment(fragmentId) {
          if (this.state.fragments.includes(fragmentId)) return false;
          this.state.fragments.push(fragmentId);
          return true;
        }

        addGems(gems) {
          this.state.gems += Math.max(0, gems);
        }

        unlockWorld(worldId) {
          if (!this.state.unlockedWorlds.includes(worldId)) {
            this.state.unlockedWorlds.push(worldId);
          }
        }

        unlockLevel(levelId) {
          if (!this.state.unlockedLevels.includes(levelId)) {
            this.state.unlockedLevels.push(levelId);
          }
        }

        unlockAtlasPiece(slotId) {
          if (!this.atlasCountableSlotIds.includes(slotId)) return;

          if (!this.state.atlasPieces.includes(slotId)) {
            this.state.atlasPieces.push(slotId);
          }
        }

        setChapterSettlementSeen(seen) {
          this.state.chapterPhaseSettlementSeen = seen;
        }

        getAtlasProgress() {
          const ids = new Set(this.state.atlasPieces);
          const total = this.atlasCountableSlotIds.length;
          let unlocked = 0;
          this.atlasCountableSlotIds.forEach(id => {
            if (ids.has(id)) unlocked += 1;
          });
          return {
            unlocked,
            total
          };
        }

        getFragmentProgress(totalFragments) {
          return {
            unlocked: this.state.fragments.length,
            total: totalFragments
          };
        }

        isWorldUnlocked(worldId) {
          var _this$worldUnlockFrag;

          if (worldId === 1) return true;
          if (this.state.unlockedWorlds.includes(worldId)) return true;
          const threshold = (_this$worldUnlockFrag = this.worldUnlockFragmentThreshold[worldId]) != null ? _this$worldUnlockFrag : Number.MAX_SAFE_INTEGER;
          return this.state.fragments.length >= threshold;
        }

        getWorldUnlockRequirement(worldId) {
          var _this$worldUnlockFrag2;

          return (_this$worldUnlockFrag2 = this.worldUnlockFragmentThreshold[worldId]) != null ? _this$worldUnlockFrag2 : 0;
        }

        applyAutoWorldUnlocks(worldIds) {
          let changed = false;
          worldIds.forEach(worldId => {
            if (!this.state.unlockedWorlds.includes(worldId) && this.isWorldUnlocked(worldId)) {
              this.state.unlockedWorlds.push(worldId);
              changed = true;
            }
          });
          return changed;
        }

        isLevelUnlocked(levelId, levels, worlds) {
          const level = levels.find(l => l.id === levelId);
          if (!level) return false;
          if (!this.isWorldUnlocked(level.worldId)) return false;
          const world = worlds.find(w => w.id === level.worldId);
          if (!world) return false;
          const idx = world.levels.indexOf(levelId);
          if (idx < 0) return false;
          if (idx === 0) return true;
          const prevId = world.levels[idx - 1];
          return this.state.completedLevels.includes(prevId);
        }

        getWorldProgress(worldId, worlds) {
          const world = worlds.find(w => w.id === worldId);
          if (!world) return {
            completed: 0,
            total: 0,
            percentage: 0
          };
          const completed = world.levels.filter(id => this.state.completedLevels.includes(id)).length;
          const total = world.levels.length;
          return {
            completed,
            total,
            percentage: total > 0 ? Math.round(completed / total * 100) : 0
          };
        }

      });

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=ffae70ec8a32fb468dbcbc76a14b227304d0172d.js.map