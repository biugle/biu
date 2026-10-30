# Native Git Deployment on Vercel

This document defines the standard Vercel Git deployment for biu demos.

Repository:

```text
git@github.com:biugle/biu.git
```

Use Vercel's native Git integration. Regular Pull Requests get Preview deployments, and pushes to `main` create Production deployments. Dependabot PR events still reach Vercel, but the root `vercel.json` marks their Preview builds as ignored before build and deploy steps run. No `VERCEL_TOKEN`, `VERCEL_ORG_ID` or npm token is needed by Vercel.

## Projects

Create six Vercel Projects from the same repository:

| Project          | Domain                 | Demo            | Output Directory                            |
| ---------------- | ---------------------- | --------------- | ------------------------------------------- |
| `biu-portal-a`   | `biu-a.biugle.cn`      | `main-a`        | `examples/dev-demo/apps/main-a/dist`        |
| `biu-portal-b`   | `biu-b.biugle.cn`      | `main-b`        | `examples/dev-demo/apps/main-b/dist`        |
| `biu-react-app`  | `biu-s.biugle.cn`      | `child-app`     | `examples/dev-demo/apps/child-app/dist`     |
| `biu-vue-app`    | `biu-vue.biugle.cn`    | `vue-child`     | `examples/dev-demo/apps/vue-child/dist`     |
| `biu-html-app`   | `biu-html.biugle.cn`   | `html-child`    | `examples/dev-demo/apps/html-child/dist`    |
| `biu-custom-app` | `biu-custom.biugle.cn` | `layout-custom` | `examples/dev-demo/apps/layout-custom/dist` |

## Shared settings

```text
Root Directory: ./
Framework Preset: Other
Node.js: 22
Install Command: pnpm install --frozen-lockfile
```

Use this Build Command for each Project, replacing `<demo-name>` with the matching Demo name:

```bash
pnpm build && pnpm --filter <demo-name> biu build --all --env prod
```

Keep the Output Directory from the table above. Do not select the `Node` preset. It makes Vercel look for a server entrypoint after the static build and causes `No entrypoint found` errors. Keep Root Directory at `./`; changing it to an app subdirectory breaks workspace dependency and lockfile resolution.

The repository already contains a root `vercel.json` with an SPA fallback for deep links.

The SPA fallback checks the filesystem first and rewrites only extensionless paths to `index.html`. Missing paths with extensions explicitly return a `no-store` 404 instead of HTML with a successful status. The root document and SPA routes use `no-cache, no-store, must-revalidate`, so reopening the app fetches the current entry document; existing content-hashed assets remain cacheable by filename.

For a clearly identified dynamic module/chunk load failure, Runtime records a 10-minute cooldown for that page and asset in `sessionStorage` and automatically reloads once. If the same failure repeats or the browser blocks `sessionStorage`, the error view explains the likely version mismatch and offers a manual refresh. Ordinary application errors, including a normal `.reduce` exception, do not trigger an automatic reload. `pnpm verify:vercel-routing` checks the filesystem-first order, missing-asset 404 and entry-document cache rules.

The 2026-10-25 live check found that this correction is not deployed: `/b46ebfbd.js` returned HTTP 200, `text/html`, `Content-Disposition: index.html` and a response cache policy of up to four hours, while the current entry references different hashes. Hashes prevent different content from sharing a URL; they do not keep an old deployment's lazy chunk available after a new deployment. This repository does not configure retention of previous artifacts for Vercel native Git deployments. After deploying the working-tree `vercel.json`, verify that the old hash and any nonexistent `.js` return a `no-store` 404 while valid JS still returns a JavaScript MIME type, and confirm that a long-running old page offers a refresh action after its chunk request fails.

## Domains and deployment

Add each domain under `Settings → Domains`, then create the CNAME record shown by Vercel at your DNS provider. The target is commonly `cname.vercel-dns.com`, but the Vercel-provided value is authoritative.

After configuring the six Projects, merge changes through reviewed Pull Requests into protected `main`. Vercel deploys all six Projects after the merge and creates Preview deployments for regular Pull Requests. The root `vercel.json` `ignoreCommand` skips only Preview builds authored by `dependabot[bot]`; Vercel still receives the PR event and evaluates the ignore command, but does not build or publish that Preview. GitHub CI and CodeQL still run for those PRs, and Production builds after merging to `main` are not skipped. `pnpm verify:vercel-routing` covers these deployment cases. Do not push directly to `main` or configure a second Vercel CLI deployment for the same Project. `deploy-demo.yml` only builds and uploads acceptance artifacts when manually dispatched; they expire after seven days. The Release gate already builds all Demos on main/master pushes.

## Production checks

Portal production configuration uses `biu-a.biugle.cn`, `biu-b.biugle.cn`, `biu-s.biugle.cn` and `biu-vue.biugle.cn`. Remote app `APP_URL` and `ALLOWED_ORIGINS` must exactly match the deployed HTTPS origins. HTML and Custom are standalone demos and are not listed in Portal `remoteApps`.

If `/api/menu/portal-tree` is not provided by a production backend, replace it with the real API URL. The local fallback is for demo acceptance only.
