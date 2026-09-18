# 发布、缓存与 Demo 部署

公开包当前共 10 个：`@biugle/biu-cli`、`@biugle/biu-i18n`、`@biugle/biu-events`、`@biugle/biu-bridge`、`@biugle/biu-router`、`@biugle/biu-store`、`@biugle/biu-ui`、`@biugle/biu-runtime`、`@biugle/biu-preset` 和 `@biugle/biu-adapter-react`。Demo 项目均为 private workspace package，不发布到 npm。

## 版本来源

CLI 构建时读取当前项目 package.json 的 version 写入 Runtime；没有 version 时显示 `-`，不会要求业务开发者手工修改入口代码。生产发布建议由 Release PR 或 CI 统一更新每个应用自己的 package.json，并将构建清单中的 buildId 作为资源版本。Portal 加载独立 APP 后，APP 会通过受 Origin 校验的 `BIU_READY.VERSION` 握手回传自身版本，Portal 不再依赖手工维护 `remoteApps.<APP_ID>.VERSION`。

## 缓存策略

- Rsbuild 静态资源使用内容 hash，HTML 和 manifest 保持短缓存或 no-cache。
- 部署时保留上一版本静态资源，避免门户 HTML 和 CDN 中的旧入口短暂找不到 chunk。
- Runtime 只在首次加载建立 manifest 基线，并在用户导航时最多检查一次远程更新；不轮询、不自动刷新，发现新 buildId 时用 Message 提示用户。若启动时清单请求失败，会在下一次用户操作时重试并建立基线。
- 更新检查接口只返回构建清单和 buildId，不返回 Token、Cookie 或用户数据。

## Changesets 发布流程

仓库使用 Changesets 管理独立版本：

```bash
pnpm changeset
pnpm version-packages
pnpm release
```

日常开发只提交 `.changeset/*.md`，不要手工修改受影响包的版本号或 CHANGELOG。主分支上的 Release workflow 会自动创建 Version PR；Version PR 合并后，CI 执行构建、测试和 `changeset publish`，只发布受影响的 `@biugle/*` 包，并按内部依赖关系更新依赖包版本。

### GitHub Actions 自动发版完整流程

工作流文件为 `.github/workflows/release.yml`，完整流程如下：

```text
开发者提交 .changeset/*.md
        ↓ push main
Actions 安装依赖并运行 changesets/action
        ↓
生成 changeset-release/main 分支
        ↓
更新 package.json、CHANGELOG 和 pnpm-lock.yaml
        ↓
创建或更新 Release PR
        ↓ 人工审核并合并
Actions 再次执行构建、测试和 changeset publish
        ↓
发布受影响的 @biugle/* npm 包
```

仓库设置必须允许工作流创建 PR：

```text
Settings → Actions → General
→ Workflow permissions → Read and write permissions
→ Allow GitHub Actions to create and approve pull requests
```

如果该复选项被组织或企业策略锁定，需要由组织 Owner 或企业管理员开启。关闭时不会影响构建，但 Actions 无法自动创建 Release PR；可以手动将 `changeset-release/main` 合并到 `main`，合并后 npm 发布仍由 Actions 自动执行。

必须配置的 Repository Secret：

| Secret           | 用途                                                  |
| ---------------- | ----------------------------------------------------- |
| `NPM_GIT_BIUGLE` | npm granular token，需具备 `@biugle` scope 的发布权限 |
| `GITHUB_TOKEN`   | GitHub 自动注入，不需要手工创建                       |

`NPM_GIT_BIUGLE` 只配置在 GitHub Actions Secrets 中，不要写入仓库、Vercel 环境变量、`.npmrc` 或日志。若 npm 组织启用了强制 2FA，应使用允许自动化发布的 token。

Release PR 合并后，`changeset-release/main` 是一次性版本分支。仓库开启 GitHub 自动删除已合并分支后会自动清理；没有开启时可以手动删除，不影响后续 Changesets 创建新的发布分支。

如果某次 Actions 在创建 PR 前失败，先修复权限后重跑失败任务；若远程已经存在 `changeset-release/main`，不要重复执行 `pnpm version-packages`，直接复用该分支创建或更新 PR。

发布所需 GitHub Secrets：

- `NPM_GIT_BIUGLE`：具有发布权限的 npm token；
- `GITHUB_TOKEN`：由 GitHub Actions 提供，用于创建 Version PR。

用户升级已发布基座：

```bash
pnpm update @biugle/biu-cli @biugle/biu-i18n @biugle/biu-events @biugle/biu-bridge @biugle/biu-router @biugle/biu-store @biugle/biu-ui @biugle/biu-runtime @biugle/biu-preset @biugle/biu-adapter-react
```

后续可使用 `biu upgrade` 封装同一流程。npm 包版本升级和部署后的 `buildId` 更新检测是两条独立链路，不能互相替代。

## GitHub Actions

`.github/workflows/ci.yml` 执行锁文件安装、基座和 Demo 类型检查、测试、ESLint、Prettier 与 100 场景 CLI 验证。CI 对同一分支取消过时运行，避免重复消耗构建资源。

`.github/workflows/deploy-demo.yml` 只构建并上传六类 Demo 的验收产物；Blank、Dashboard、Mobile 等其他 preset 通过 CLI 场景和默认 Demo 验收，不维护额外独立样例项目。Vercel 部署使用原生 Git 集成，不需要 `VERCEL_TOKEN`、`VERCEL_ORG_ID` 或 `VERCEL_PROJECT_ID`。六个 Vercel Project 分别配置不同的 Build Command 和 Output Directory，推送 `main` 后自动部署。

### Vercel 已关联 GitHub 时的原生部署

如果 Vercel 项目已经关联本仓库，可以直接使用 Vercel 的 Git 部署，不需要把 `VERCEL_TOKEN` 或 `VERCEL_ORG_ID` 填到 Vercel Environment Variables。每个 Vercel Project 只负责一个 Demo；以 Portal A 为例：

| Vercel 设置      | 值                                                              |
| ---------------- | --------------------------------------------------------------- |
| Root Directory   | `./`                                                            |
| Framework Preset | `Other`                                                         |
| Install Command  | `pnpm install --frozen-lockfile`                                |
| Build Command    | `pnpm build && pnpm --filter main-a biu build --all --env prod` |
| Output Directory | `examples/dev-demo/apps/main-a/dist`                            |
| Node.js          | `22`                                                            |

Portal B、React、Vue、HTML 和 Custom 只需将 Build Command 中的项目名及 Output Directory 分别替换为 `main-b`、`child-app`、`vue-child`、`html-child`、`layout-custom`。推送 `main` 后 Vercel 会自动构建部署。仓库根目录的 `vercel.json` 提供 SPA 深链回退；不要再为同一个 Project 配置 Vercel CLI 部署。

推荐的 Demo Project 和域名映射如下：

| Vercel Project   | Domain                 | Demo            |
| ---------------- | ---------------------- | --------------- |
| `biu-portal-a`   | `biu-a.biugle.cn`      | `main-a`        |
| `biu-portal-b`   | `biu-b.biugle.cn`      | `main-b`        |
| `biu-react-app`  | `biu-s.biugle.cn`      | `child-app`     |
| `biu-vue-app`    | `biu-vue.biugle.cn`    | `vue-child`     |
| `biu-html-app`   | `biu-html.biugle.cn`   | `html-child`    |
| `biu-custom-app` | `biu-custom.biugle.cn` | `layout-custom` |

首次接入 GitHub Actions 前检查：

1. 仓库已存在首个 `main` 提交，且默认分支与 workflow 的 `main`/`master` 保持一致。
2. GitHub Actions 已启用；`main` 配置 required status checks，至少要求 CI 的 `validate` job 通过。
3. `NPM_GIT_BIUGLE` 使用仅允许发布的 npm granular access token，绑定 `@biugle` scope；不要把 token 写进仓库变量、日志或 `.npmrc`。
4. 每个 Vercel Project 都绑定同一仓库的 `main` 分支，并配置正确的根目录、构建命令、产物目录和自定义域名。
5. 不要同时启用同一 Project 的 Vercel CLI 部署和原生 Git 部署，避免重复构建和重复发布。
6. 生产部署还需由平台配置 HTTPS/CSP、缓存和回滚策略；Demo workflow 不代表生产部署策略。

推荐的仓库级可选配置：Dependabot 或 Renovate、CodeQL、secret scanning/push protection、npm provenance（切换到 npm trusted publishing 后再启用），以及 protected `main` 分支。

## 发布前命令

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm lint
pnpm format:check
pnpm audit:unused
pnpm verify:scenarios
pnpm build:demo:all
pnpm build:html-child
```

完成验收后清理 `node_modules`、`dist`、`.biu`、coverage、日志和临时场景目录，再由 CI 重新安装和构建。
