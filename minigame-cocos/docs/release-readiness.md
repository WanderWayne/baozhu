# Release Readiness (WeChat Mini Game)

## Build and Package

- [ ] Cocos build target: WeChat Mini Game.
- [ ] Main package size audited; non-critical resources moved to subpackages/bundles.
- [ ] Startup scene initializes in under budget on mid devices.

## Functionality

- [ ] `node tools/validate-config.mjs` passes.
- [ ] `node tools/parity-report.mjs` generated and reviewed.
- [ ] Manual run-through of chapter-1 closed loop completed.

## Product and Compliance

- [ ] App icon/name/version synchronized with product materials.
- [ ] Privacy text and permissions complete for mini-game submission.
- [ ] Share metadata configured via WeChat adapter.

## Stability

- [ ] No blocking errors in WeChat DevTools logs.
- [ ] Resume-from-background behavior verified.
- [ ] Storage corruption fallback tested (invalid JSON -> reset-safe defaults).

