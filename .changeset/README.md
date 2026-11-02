# Changesets

每个发布单元使用一个 changeset，列出所有受影响的公开包和各包应采用的最高版本级别；同一发布中的多份说明可以合并，避免重复 bump 文案：

```bash
pnpm changeset
```

日常 Changeset 随功能 Pull Request 合入 `dev`，发布时再通过审核的 `dev` → `main` Pull Request 晋级。只有 Changesets 生成的 `changeset-release/main` PR 合并后才允许自动发布受影响的 `@biugle/*` 包。不要手工改包版本号来触发发布。
