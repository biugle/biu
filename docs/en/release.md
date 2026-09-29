# Release, Caching and Demo Deployment

## Published packages

biu publishes eighteen public packages: `@biugle/biu-cli`, `@biugle/biu-i18n`, `@biugle/biu-events`, `@biugle/biu-bridge`, `@biugle/biu-router`, `@biugle/biu-store`, `@biugle/icons`, `@biugle/render-code`, `@biugle/watermark`, `@biugle/logger`, `@biugle/react-components`, `@biugle/react-form`, `@biugle/react-table`, `@biugle/tanstack-query`, `@biugle/http`, `@biugle/biu-runtime`, `@biugle/biu-preset` and `@biugle/biu-adapter-react`. Demo applications are private workspace packages.

## Changesets

```bash
pnpm changeset
pnpm version-packages
pnpm release
```

Developers commit a Changeset instead of editing package versions or changelogs manually. The Release workflow creates a Version PR; after it is merged, only affected packages are published.

### Complete GitHub Actions release flow

The workflow is `.github/workflows/release.yml`:

```text
Developer commits .changeset/*.md
        ↓ push main
Actions installs dependencies and runs changesets/action
        ↓
Creates or updates changeset-release/main
        ↓
Updates package.json, CHANGELOG and pnpm-lock.yaml
        ↓
Creates or updates the Release PR
        ↓ manual review and merge
Actions runs build, tests and changeset publish
        ↓
Publishes affected @biugle/* packages
```

The repository must allow workflows to create pull requests:

```text
Settings → Actions → General
→ Workflow permissions → Read and write permissions
→ Allow GitHub Actions to create and approve pull requests
```

If the checkbox is locked by an organization or enterprise policy, an organization Owner or enterprise administrator must enable it. With the option disabled, builds still work, but Actions cannot create the Release PR. You can manually merge `changeset-release/main` into `main`; npm publishing remains automated after the merge.

Required Repository Secret:

| Secret           | Purpose                                                       |
| ---------------- | ------------------------------------------------------------- |
| `NPM_GIT_BIUGLE` | npm granular token with publish access to the `@biugle` scope |
| `GITHUB_TOKEN`   | Provided automatically by GitHub; do not create it manually   |

Keep `NPM_GIT_BIUGLE` only in GitHub Actions Secrets. Never place it in the repository, Vercel environment variables, `.npmrc` or logs. If the npm organization requires 2FA, use a token suitable for automated publishing.

After the Release PR is merged, `changeset-release/main` is a one-off release branch. GitHub can delete it automatically when automatic head-branch deletion is enabled; otherwise it can be deleted manually. This does not affect future Changesets releases.

If Actions fails before creating the PR, fix the permission and rerun the failed job. If `changeset-release/main` already exists, reuse it and do not run `pnpm version-packages` again.

## Cache and update checks

Rsbuild assets use content hashes. HTML and manifests use short or no-cache policies, while previous static assets remain available during rollout. Runtime establishes a manifest baseline at startup and checks once on user actions. It does not poll or force-refresh. An update manifest contains only build ID and asset metadata.

## CI and Vercel

Pull Requests run install, build, type checks, tests, ESLint, Prettier, Knip and 100 CLI scenarios. The Demo workflow only builds Portal A/B, React/Vue/HTML APPs and Custom React for acceptance. Vercel deployment uses native Git integration; `NPM_GIT_BIUGLE` is required only for npm publishing.

Required repository secrets:

- `NPM_GIT_BIUGLE`: an npm granular token with publish access to the `@biugle` scope.

No Vercel secret is required. Create six Vercel Projects linked to the same repository and configure each project with its own Build Command, Output Directory and domain.

### Native Vercel deployment for an already linked Git project

If a Vercel project is already linked to this repository, use Vercel Git deployments directly. Do not put `VERCEL_TOKEN` or `VERCEL_ORG_ID` into Vercel Environment Variables. Each Vercel project should own one Demo. For Portal A, use root `./`, the `Other` framework preset, Node.js `22`, install command `pnpm install --frozen-lockfile`, build command `pnpm build && pnpm --filter main-a biu build --all --env prod`, and output directory `examples/dev-demo/apps/main-a/dist`. Replace `main-a` in the command and output directory with `main-b`, `child-app`, `vue-child`, `html-child` or `layout-custom` for the other Demos. The repository `vercel.json` provides SPA deep-link fallback. Do not configure a second Vercel CLI deployment for the same project.

Recommended Demo project and domain mapping:

| Vercel Project   | Domain                 | Demo            |
| ---------------- | ---------------------- | --------------- |
| `biu-portal-a`   | `biu-a.biugle.cn`      | `main-a`        |
| `biu-portal-b`   | `biu-b.biugle.cn`      | `main-b`        |
| `biu-react-app`  | `biu-s.biugle.cn`      | `child-app`     |
| `biu-vue-app`    | `biu-vue.biugle.cn`    | `vue-child`     |
| `biu-html-app`   | `biu-html.biugle.cn`   | `html-child`    |
| `biu-custom-app` | `biu-custom.biugle.cn` | `layout-custom` |

Before enabling release automation, make sure the repository has an initial `main` commit, Actions are enabled, and the protected branch requires the CI `validate` job. Recommended optional controls are Dependabot/Renovate, CodeQL, secret scanning with push protection and npm trusted publishing/provenance.

## Release checklist

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
