# biu Architecture Baseline

## Goals and boundaries

biu is a detachable enterprise frontend foundation. Portal and APP are peer projects with independent startup, builds, deployments and domains. A Portal does not bundle APP source; by default it loads an APP through `remoteApps[APP_ID].APP_URL` in an iframe.

Pages are flat by their final Code inside a project. Backend virtual hierarchy may describe portals, directories and permissions, but it does not change the frontend page layout. Runtime abstracts the Loader and lifecycle boundary so future ESM, qiankun or Wujie loaders can be added without changing menu or permission contracts.

## Package responsibilities

```text
@biugle/biu-cli             project creation, discovery, Rsbuild, manifests
@biugle/biu-i18n            framework-independent locale resources and fallback
@biugle/biu-events          typed same-document event bus
@biugle/biu-bridge          origin-checked cross-window protocol
@biugle/biu-router          menu trees, complete paths, permissions and navigation
@biugle/biu-store           Zustand preferences, auth, menus and Tabs sessions
@biugle/biu-ui              Message, Tooltip, Modal, Drawer and fire
@biugle/biu-runtime         Shell, loading, lifecycle, auth and orchestration
@biugle/biu-preset          Sidebar/Topbar/Blank/Dashboard/Mobile layouts and CSS
@biugle/biu-adapter-react   official React Adapter
```

Vue, Svelte, Angular and native HTML integrate through an explicit Adapter Contract. The HTML adapter is built into Runtime. APP URLs are environment configuration, not menu protocol data. Every Portal and APP uses `src/pages/index.*` as its fixed root fallback page; `src/pages/_*` directories are internal and are not parsed by the CLI. The root page is independent of Tabs and is the protected fallback tab when Tabs are enabled.

## Project structure

```text
project/
├── biu.config.ts
├── local-routes/index.ts
├── config/{local,dev,test,pre,prod}.ts
├── public/static/
└── src/pages/<Code>/
```

Workspace packages are preferred for shared code. Projects do not generate a second i18n implementation or an ungoverned `src/shared` directory.

## Configuration and compilation

`biu.config.ts` contains stable project configuration; environment differences live in `config/<ENV>.ts`. The priority is `--env` > `BIU_ENV` > the command default. Portal menu, directory and permission APIs use `{ code: 0, message?, data }`. A successful empty menu tree compiles no local pages. Local fallback is used only when the API is not configured or explicitly allows fallback; `--all` is for diagnosis.

The CLI discovers `local-routes/index.ts`, filters the page registry with menu and permission Codes, generates a temporary entry, then invokes Rsbuild/Rspack. Runtime consumes the generated registry and owns navigation, loading, lifecycle and error boundaries.

## Layout and extension

The official presets are `sidebar`, `topbar`, `blank`, `dashboard`, `mobile` and `custom`. Custom is an independent React project that defines its own shell while retaining Runtime Context, authentication exits, errors, update checks and events.

Portal slots are declared through `portalSlots.workbar`, `portalSlots.toolbar` or the typed `toolbarActions` contract. Stable foundation labels use `labelKey`/`tooltipKey`; business values remain Portal or backend data. The same action contract can render desktop controls and a compact mobile menu.

## State, routing and security

Zustand is used only through `@biugle/biu-store`, split into preference, auth, menu and session stores. Favorites and recent items use scoped localStorage; Tabs and preferences use scoped sessionStorage. `@biugle/biu-router` keeps the complete menu Code chain as the stable identity and URL. Repeated leaf Codes must use `navigateByKey`.

Bridge messages contain locale, theme, timezone, direction, environment, portal Code and redacted identity only. Tokens, cookies, passwords and session IDs never cross the Bridge or enter generated frontend code. Cross-window messages require an exact allowed Origin.

## Engineering quality

The root workspace and generated projects include TypeScript, ESLint, Prettier, EditorConfig and Husky/lint-staged. Knip audits public packages; Changesets manages versions and GitHub Actions runs the quality gates. Demo apps are private acceptance projects, not published packages.
