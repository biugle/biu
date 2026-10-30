# Contributing to Biu

感谢参与 Biu 基座和 CLI 的建设。提交代码前请先阅读 AGENTS.md、docs/development.md 和 docs/production-checklist.md。

## 开发流程

1. 使用 Node.js 22+ 和 pnpm 9.14.4。
2. 执行 pnpm install --frozen-lockfile。
3. 修改源码、测试、Demo 和对应文档。
4. 开发中按改动范围执行类型检查、测试和格式检查；交付前执行完整 pnpm verify。
5. 涉及 CLI 或项目模板时，重点检查 pnpm verify:cli-install 与 pnpm verify:scenarios 的实际安装、启动和创建结果。
6. 不提交 node_modules、dist、.biu、日志、覆盖率和 .husky/_。

## Pull Request 要求

- 说明变更目的、影响范围和回滚方式。
- 提供测试命令和结果；UI 变更附带桌面和窄屏验收说明。
- 新增或修改公开 API 必须同步中英文数据契约、综合能力规范、使用文档、逐属性 Demo API 表和回归测试；发布审计统一更新 docs/final-delivery-review.md 及英文对应文件。
- 提交前检查 staged diff；任何代码、配置、文档和 Demo 都不得包含真实 Token、Cookie、密码、内部域名或本地用户数据。
- 基座能力与 Demo mock 分离；Demo 账号只用于本地演示。

提交信息建议使用 feat:、fix:、docs:、test:、refactor:、chore: 前缀。
