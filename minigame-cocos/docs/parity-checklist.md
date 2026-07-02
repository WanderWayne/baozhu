# Gameplay Parity Checklist

## Recipe and Crafting

- [ ] Core chapter-1 recipes produce same results as H5.
- [ ] Invalid recipe gives failure feedback (no silent success).
- [ ] Triple-recipes (where defined in H5) are supported.

## Level Progress

- [ ] Level completion writes `completedLevels`.
- [ ] New discoveries append into `discoveredItems`.
- [ ] Fragment unlock by trigger item matches H5 behavior.
- [ ] Gems are awarded and persisted.

## Main Systems

- [ ] Intro -> Menu -> Levels -> Game loop works in one runtime.
- [ ] Codex counters match unlocked recipe/atlas progress.
- [ ] Gallery counter matches unlocked fragment count.
- [ ] Task completion map aligns with migrated rule schema.

## Chapter Flow

- [ ] Chapter-1 target offering can finish each level.
- [ ] Chapter settlement appears once and persists seen state.
- [ ] Unlock chain for worlds/levels follows configured rules.

## Platform

- [ ] WeChat lifecycle hooks do not reset progress unexpectedly.
- [ ] Audio can start after user gesture.
- [ ] Asset loading remains below package thresholds.

