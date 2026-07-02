# Migration Status Snapshot

## Implemented in this milestone

- Cocos-oriented project scaffold under `minigame-cocos/`.
- H5 data export pipeline into normalized JSON config.
- Config validation and parity report tooling.
- Core logic services:
  - `RecipeEngine`
  - `ProgressService`
  - `TaskService`
- Scene skeletons:
  - `Boot`, `Intro`, `Menu`, `Levels`, `Game`, `Codex`, `Gallery`
- Supporting systems:
  - tutorial overlay scaffold
  - chapter settlement scaffold
  - menu growth stage scaffold
  - task toast scaffold
- Runtime services:
  - storage adapters
  - audio service
  - scene router
  - resource/performance policy helpers

## Pending for production parity

- Cocos scene/prefab asset authoring and visual polish.
- Full drag/touch UI implementation with node-level hit testing.
- Complete chapter-by-chapter scripted narrative and animation parity.
- Real audio asset bundle wiring and optimization on target devices.
- WeChat submission metadata and final QA pass.

