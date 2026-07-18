# Codex Project Guide

## What This Project Is

This repository is the Baozhu/Bojoo branded brewing-crafting game. It is a mobile-first, vertical 2D game for customers waiting in-store. The core loop is drag two items together, synthesize a new food/drink item, discover recipes, offer target items to the door, and progress through short levels.

The current working phase is H5 <-> WeChat miniapp parity and demo stabilization. The H5 browser build is the source of truth. The WeChat miniapp should match it visually and behaviorally. The Cocos project is a newer migration target, not the current production-ready runtime.

## Main Project Areas

- `index.html`, `game.html`, `levels.html`, `codex.html`, `gallery.html`: H5 playable prototype entry points.
- `js/`: H5 game code and source-of-truth data.
- `js/data/`: canonical H5 data for worlds, levels, items, recipes, atlas, and tasks.
- `js/game/`: split H5 gameplay modules. Prefer these over adding logic back into `game-core.js`.
- `css/`: H5 styling.
- `miniapp-weixin/`: WeChat miniapp port that should stay aligned with H5.
- `miniapp-weixin/data/`: generated miniapp data. Do not hand-edit unless there is a documented reason.
- `miniapp-weixin/utils/game/`: split miniapp gameplay mixins.
- `minigame-cocos/`: Cocos Creator / WeChat Mini Game migration target.
- `docs/FEATURE_INDEX.md`: first stop when modifying any gameplay feature.
- `docs/features/`: feature-specific maps for H5 and miniapp files.
- `GAME_MECHANICS.md`: product/gameplay rules that should not be casually changed.
- `Todo`: product priorities, open design thoughts, and demo risks.

## Current Architecture Rules

When the user asks to change a gameplay feature:

1. Read `docs/FEATURE_INDEX.md`.
2. Find the feature id, then read `docs/features/<id>.md`.
3. Check both the H5 file list and miniapp file list.
4. Keep H5 and miniapp behavior aligned unless the user explicitly asks for one platform only.
5. If data changes, update H5 source data first, then export to miniapp data.

Important feature ids:

- `intro`: opening animation.
- `main-menu`: main menu and task surface.
- `level-select`: chapter/level selection.
- `progress`: unlocks, gems, discoveries, task progress.
- `game-layout`: door/workshop/inventory vertical layout.
- `drag-drop`: drag, drop, long press, inventory cloning.
- `synthesis`: recipe lookup, success/failure, brewing timers.
- `trade-station`: item/gem trade stations and restock.
- `door-offering`: target door, automatic offering, door dialog.
- `recipe-book`: recipe book item, long press, recipe UI.
- `chapter-flow`: level completion and transition.
- `completion`: settlement and ending overlays.
- `tutorial`: guided interaction hints.
- `codex`: atlas/codex.
- `gallery`: memory gallery.
- `items-icons`: item SVG/PNG/icon pipeline.
- `audio-nav`: audio and page transitions.
- `data-sync`: H5 to miniapp data export.

## Validation Commands

Run commands from the indicated directory.

Miniapp tools:

```bash
cd miniapp-weixin/tools
node export-data.mjs
node check-layout.cjs
node compare-parity.cjs levels
node compare-parity.cjs game 101
node compare-parity.cjs game 102
node compare-parity.cjs game 105
node sync-item-svgs.cjs
```

Cocos migration checks:

```bash
cd minigame-cocos
node tools/validate-config.mjs
node tools/parity-report.mjs
```

Feature map check:

```bash
node scripts/check-feature-map.cjs
```

The parity docs use a visual diff target of under 12%, with manual review for acceptable SVG/emoji differences.

## Editing Guidelines For Codex

- Do not overwrite or revert user changes. This repo often has a dirty worktree.
- Before editing a feature, read the feature doc and surrounding implementation.
- Keep changes scoped. Avoid unrelated refactors during gameplay fixes.
- Keep `js/game/game-core.js` and `miniapp-weixin/utils/game-controller.js` as wiring files when possible. Put feature behavior in split modules.
- For data changes, treat `js/data/*` as canonical and regenerate miniapp data with `miniapp-weixin/tools/export-data.mjs`.
- Do not restore deleted `miniapp-weixin/tools/data/*`; docs say that duplicate data copy was removed in Phase 3.
- Do not commit generated Cocos folders such as `minigame-cocos/library/`, `temp/`, `build/`, `native/`, or `profiles/`.
- Do not add new package managers or framework layers unless the user asks.
- Every completed change must update the in-game build version shown at the lower-left of the intro. Use `M.DvN` format, for example `7.15v1`; increment `vN` for additional changes on the same date. Keep H5 `js/build-version.js` and miniapp `miniapp-weixin/utils/build-version.js` synchronized.
- Use `rg` / `rg --files` for search.
- Prefer `apply_patch` for manual edits.

## Product And Design Notes

- The game should feel slow, alive, warm, and culturally tied to fermentation, rice wine, dairy, flowers, and Baozhu's shop identity.
- Single-session play should fit a 3-5 minute drink wait.
- The demo priority is clarity: onboarding, feedback, task rewards, trade station clarity, recipe book clarity, and chapter completion should be understandable without guessing.
- Door dialog should feel like a craft mentor, not generic tutorial text.
- Avoid making the experience feel like a generic web app or marketing page; the playable game is the main surface.

## Useful Status Notes

- H5 is the current source of truth.
- Miniapp parity is the active phase.
- Cocos validates data and has core services/scenes, but still needs production parity, real visual scene authoring, QA, and WeChat release work.
- First chapter data includes levels around `101` through `106`; level `104` introduces the recipe book phase and level `105` uses trade stations.
