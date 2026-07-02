# H5 -> Cocos Data Mapping

## Source of Truth (H5)

- `js/data/data-worlds.js` -> chapters/worlds/levels
- `js/data/data-items.js` -> items/recipes/fragments/attributes/hints
- `js/data/data-atlas.js` -> atlas slots and progress geometry
- `js/data/data-tasks.js` -> task list

## Normalized Output

- `assets/resources/config/worlds.json`
- `assets/resources/config/items.json`
- `assets/resources/config/atlas.json`
- `assets/resources/config/tasks.json`
- `assets/resources/config/game-config.json` (merged snapshot)

## Runtime Consumers

- `assets/scripts/core/RecipeEngine.ts` consumes `items.recipes`.
- `assets/scripts/core/ProgressService.ts` consumes atlas countable slot ids.
- `assets/scripts/core/TaskService.ts` consumes normalized task `rule`.
- Scene controllers read through `ConfigRepository`.

