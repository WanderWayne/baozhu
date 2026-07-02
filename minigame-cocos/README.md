# Baozhu Mini Game (Cocos Creator)

This folder contains the Cocos Creator migration target for the Baozhu game.

## Goal

- Replace the current multi-page H5 runtime with a WeChat Mini Game runtime.
- Keep gameplay semantics aligned with H5 data and mechanics docs.

## Structure

- `assets/scripts/core/`: portable gameplay logic (recipes/progress/tasks).
- `assets/scripts/scenes/`: scene-level controllers (boot/intro/menu/levels/game/codex/gallery).
- `assets/scripts/runtime/`: storage/audio/resource/router services.
- `assets/scripts/wechat/`: WeChat-specific lifecycle and platform bridges.
- `assets/resources/config/`: normalized data exported from H5 source files.
- `tools/`: migration and validation tooling.
- `docs/`: parity checklist and release acceptance docs.

## Data Pipeline

1. Export from H5 source:

```bash
node tools/export-h5-data.mjs
```

2. Validate normalized config:

```bash
node tools/validate-config.mjs
```

## Current Status

- Project scaffold created.
- Data export + validation tooling in place.
- Core recipe/progress/task logic migrated into engine-agnostic TypeScript.
- Scene skeletons and first-chapter playable loop controller provided.

