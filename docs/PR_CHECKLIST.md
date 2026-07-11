# Pull Request / 功能改动检查清单

改任一 gameplay feature 时勾选：

## 文档

- [ ] 已读 [`docs/FEATURE_INDEX.md`](FEATURE_INDEX.md) 对应行
- [ ] 已更新 [`docs/features/<id>.md`](features/) 文件表（若移动/新增文件）
- [ ] 相关文件含 `@feature <id>` 注释

## 双端

- [ ] H5 与小程序逻辑均已修改（或明确记录「仅一端」原因）
- [ ] 数据改动已跑 `node miniapp-weixin/tools/export-data.mjs`

## 验收

- [ ] 已跑 FEATURE_INDEX 中该 feature 的 parity 命令
- [ ] 微信开发者工具清缓存重编译

## Feature → Parity 速查

| Feature | 命令 |
|---------|------|
| level-select | `node compare-parity.cjs levels` |
| drag/synth/door/layout | `node compare-parity.cjs game 101` |
| synthesis chain | `node compare-parity.cjs game 102` |
| trade-station | `node compare-parity.cjs game 105` |
| layout metrics | `node check-layout.cjs` |

（在 `miniapp-weixin/tools/` 下执行）
