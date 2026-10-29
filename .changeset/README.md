# Changesets

每个发布单元使用一个 changeset，列出所有受影响的公开包和各包应采用的最高版本级别；同一发布中的多份说明可以合并，避免重复 bump 文案：

```bash
pnpm changeset
```

合并到主分支后，Release workflow 会创建 Version PR；只有 Changesets 生成的 `changeset-release/<branch>` PR 合并后才允许自动发布受影响的 `@biugle/*` 包。不要手工改包版本号来触发发布。
