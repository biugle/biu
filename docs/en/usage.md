# biu Usage Guide

## Create a project

```bash
biu create portal-a --type PORTAL
biu create child-app --type APP
biu create custom-app --type APP --preset custom
biu init
```

`biu init` is the interactive wizard. It asks for the mode, Portal/APP count, names, authentication, menu source, Tabs/Breadcrumbs and Portal slots. A generated project contains `biu.config.ts`, environment files, `local-routes/index.ts`, `src/pages`, TypeScript, ESLint, Prettier, EditorConfig and Husky/lint-staged.

## Start the Demo

```bash
pnpm start --filter main-a
pnpm start --filter main-b
pnpm start --filter child-app
pnpm start --filter vue-child
pnpm start --filter html-child
pnpm start --filter layout-custom
pnpm start --filter main-a -- --apps ../child-app,../vue-child
```

Portals use the `9001–9999` range and APPs use `8001–8888`. `dev.port` or `--port` can override the range. `--apps` only orchestrates local APP processes and temporarily overrides local remote URLs; production still deploys Portal and APP independently.

| Project         | Type             | Default address          |
| --------------- | ---------------- | ------------------------ |
| `main-a`        | Portal           | `http://localhost:9001/` |
| `main-b`        | Portal           | `http://localhost:9002/` |
| `child-app`     | React APP        | `http://localhost:8001/` |
| `vue-child`     | Vue 3 APP        | `http://localhost:8002/` |
| `html-child`    | HTML APP         | `http://localhost:8003/` |
| `layout-custom` | React Custom APP | `http://localhost:8007/` |

## Build

```bash
pnpm build
pnpm build:demo:all
pnpm --filter main-a biu build --env dev
BIU_ENV=pre pnpm --filter main-a biu build
```

Production output contains `dist/index.html`, page chunks, static assets and manifests. Portal and APP outputs are independent.

## Routes and menus

`local-routes/index.ts` is the single discovery entry and may re-export `common.ts`, `business.ts` and other route files. Page Codes must be unique in one project. Portal APP routes store only `appId` and `appPath`; `APP_URL` belongs in `config/<ENV>.ts`.

Every Portal and APP has a fixed root route `/`. The CLI uses `src/pages/index.*` as the root page (`index.tsx` for React, `index.vue` for Vue and `index.html` for HTML); it does not need a `local-routes` entry and is independent of the Tabs switch. When Tabs are enabled, the root page is the protected fallback tab. Closing all tabs, or closing the last ordinary tab, returns to `/`. Directories under `src/pages` whose names start with `_` are reserved for internal, login, error or embedded pages. The CLI never auto-discovers them and does not emit ordinary menu entries or page chunks for them; expose a business page by using a non-`_` directory and explicitly declaring it in `local-routes/index.ts`.

The host route uses the complete menu Code chain, for example `/system-config/system-basic/PageA`. This chain is stable across locale changes and is the identity used for permissions, audit and deep links. `appPath` is the independent route inside the iframe APP.

## Locale and state

```tsx
import { useBiuI18n } from "@biugle/biu-runtime";

const { $t } = useBiuI18n();
return <span>{$t("菜单")}</span>;
```

Use `@biugle/biu-store` directly when a project needs shared state, and `@biugle/biu-router` when it needs menu queries. Locale changes reload menu resources with the `locale` query parameter. Invalid locale, theme, direction or timezone values use safe defaults.

## Public UI and Runtime APIs

`@biugle/biu-ui` exposes Message, Tooltip, Modal, Drawer, copy helpers and `fire()`. Runtime exposes navigation, authentication, layout overrides, locale/menu reload hooks, lifecycle hooks and update checks. Custom projects can close the default auth flow and define their own pages while retaining these boundaries.
