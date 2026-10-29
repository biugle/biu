# Release, Caching and Demo Deployment

## Published packages

biu publishes eighteen public packages: `@biugle/biu-cli`, `@biugle/biu-i18n`, `@biugle/biu-events`, `@biugle/biu-bridge`, `@biugle/biu-router`, `@biugle/biu-store`, `@biugle/icons`, `@biugle/render-code`, `@biugle/watermark`, `@biugle/logger`, `@biugle/react-components`, `@biugle/react-form`, `@biugle/react-table`, `@biugle/tanstack-query`, `@biugle/http`, `@biugle/biu-runtime`, `@biugle/biu-preset` and `@biugle/biu-adapter-react`. Demo applications are private workspace packages.

## Changesets

```bash
pnpm changeset
pnpm verify
```

Developers commit a Changeset instead of running versioning manually or editing package versions and changelogs. Merge the Changeset with the feature through a normal Pull Request into protected `main`; the Release workflow then creates a Version PR. After that Release PR is merged, the publish workflow verifies its origin, runs the full gate and publishes only the affected packages.

### Complete GitHub Actions release flow

The workflow is `.github/workflows/release.yml`:

```text
Developer opens a Pull Request containing .changeset/*.md
        ↓ review and merge into protected main
Actions installs dependencies and runs changesets/action
        ↓
Creates or updates changeset-release/main
        ↓
Updates package.json, CHANGELOG and pnpm-lock.yaml
        ↓
Creates or updates the Release PR
        ↓ manual review and merge
The publish script checks whether this is a merged Changesets Release PR
        ↓ normal main pushes skip safely; GitHub verification errors fail closed
Only a verified release merge runs changeset publish
        ↓
Publishes affected @biugle/* packages
```

`pnpm release:publish` runs `scripts/release-publish.mjs`, which calls `scripts/verify-release-origin.mjs` before publishing. The verifier uses the GitHub API to check that the current SHA is associated with a merged same-repository `changeset-release/<branch>` PR, and validates its base branch, fixed `chore: release packages` title and source branch. It does not depend on the PR creator's account, so both the default `GITHUB_TOKEN` and a `CHANGESETS_GITHUB_TOKEN` PAT are supported. Normal main pushes, manual version edits and ordinary feature PR merges skip successfully without running `changeset publish`; GitHub verification errors fail closed. Only a verified release PR merge publishes. Isolated API tests for this flow run as part of `pnpm verify`. The guard protects npm publishing only; Vercel Git integration can still deploy pushes to `main` according to each Vercel Project's settings, so the branch must also be protected.

The remote check on 2026-10-25 found `main` with `protected=false`. Branch protection cannot be changed by a repository file and must be enabled by a GitHub repository administrator. Create a ruleset requiring Pull Requests and the `CI / validate` check, blocking force pushes and branch deletion, and limiting bypass actors. Changesets Action defaults to `GITHUB_TOKEN`; GitHub does not start other workflows for PR events created by that token. To require CI on generated Release PRs, set a least-privilege fine-grained PAT as `CHANGESETS_GITHUB_TOKEN`; the workflow prefers it and falls back to the automatic token when unset. Verify that the bot PR receives the required check before enforcing the rule. Do not use the npm token as a GitHub token.

The repository must allow workflows to create pull requests and protect `main`:

```text
Settings → Actions → General
→ Workflow permissions → Read and write permissions
→ Allow GitHub Actions to create and approve pull requests

Settings → Rules → Rulesets → New branch ruleset
→ Target branch: main
→ Require a pull request and required CI status checks
→ Block force pushes and branch deletion
```

If the checkbox is locked by an organization or enterprise policy, an organization Owner or enterprise administrator must enable it. With the option disabled, builds still work, but Actions cannot create the Release PR. A maintainer can open a PR from `changeset-release/main` with the exact title `chore: release packages`, wait for required checks, then merge it. Do not push or merge that branch directly to `main`; the release-origin guard will reject npm publishing.

Required Repository Secret:

| Secret           | Purpose                                                       |
| ---------------- | ------------------------------------------------------------- |
| `NPM_GIT_BIUGLE` | npm granular token with publish access to the `@biugle` scope |
| `GITHUB_TOKEN`   | Provided automatically by GitHub; do not create it manually   |

Keep `NPM_GIT_BIUGLE` only in GitHub Actions Secrets. Never place it in the repository, Vercel environment variables, `.npmrc` or logs. If the npm organization requires 2FA, use a token suitable for automated publishing.

After the Release PR is merged, `changeset-release/main` is a one-off release branch. GitHub can delete it automatically when automatic head-branch deletion is enabled; otherwise it can be deleted manually. This does not affect future Changesets releases.

If Actions fails before creating the PR, fix the permission and rerun the failed job. If `changeset-release/main` already exists, reuse it and do not run `pnpm version-packages` again.

## Cache and update checks

Rsbuild assets use content hashes; HTML and manifests use short or no-cache policies so users see the current entry. The repository does not retain previous build artifacts for native Vercel Git deployments, so a long-lived old page can still request a retired lazy chunk. Retain old assets during a rollout when the platform supports it. Otherwise, a missing `.js` must return a `no-store` 404 rather than `index.html`, and Runtime's error boundary offers a refresh action.

Runtime establishes a manifest baseline at startup and checks once on user actions. It does not poll or force-refresh. An update manifest contains only build ID and asset metadata.

## CI and Vercel

After the frozen-lockfile install, CI runs `pnpm verify` on Pull Requests: foundation and Demo type checks, public-package tarball/export checks, tests, ESLint, Prettier, Knip, a production dependency audit, 100 CLI create inputs, seven Portal/APP preset and environment builds, and all six Demo builds. The Release workflow runs the same verification on main pushes before Changesets; ordinary pushes skip npm publishing, and only a release PR merge that passes origin verification runs `changeset publish`. The Demo workflow only builds Portal A/B, React/Vue/HTML APPs and Custom React for acceptance. Vercel deployment uses native Git integration; `NPM_GIT_BIUGLE` is required only for npm publishing.

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

Before enabling release automation, make sure the repository has an initial `main` commit, Actions are enabled, and the protected branch requires the CI `validate` job. The current `.github/dependabot.yml` combines routine npm and GitHub Actions version updates into one weekly batch, with at most one open version-update PR. GitHub security updates remain on their separate security-fix path. Dependabot PRs still run CI and CodeQL, while Vercel skips their Preview builds. Other recommended repository controls include secret scanning with push protection and npm trusted publishing/provenance.

## Release checklist

```bash
pnpm install --frozen-lockfile
pnpm verify
pnpm --filter <project> biu build --env prod
```
