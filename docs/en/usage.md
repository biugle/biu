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

`local-routes/index.ts` is the single discovery entry and may re-export `common.ts`, `business.ts` and other route files. Page Codes must be unique in one project. Portal APP routes store only `appId` and `appPath`; `APP_URL` belongs in `config/<ENV>.ts`. Public menu Codes, every menu-path segment and the matching page directory use uppercase-starting Pascal/camel names, for example `UserManagement` and `/SystemConfig/UserManagement`; new menu entries must not use `-`, `_` or all-lowercase paths. `appId`, domains and locale values are separate identifiers and keep their own naming conventions.

Every Portal and APP has a fixed root route `/`. The CLI uses `src/pages/index.*` as the root page (`index.tsx` for React, `index.vue` for Vue and `index.html` for HTML); it does not need a `local-routes` entry and is independent of the Tabs switch. When Tabs are enabled, the root page is the protected fallback tab. Closing all tabs, or closing the last ordinary tab, returns to `/`. Directories under `src/pages` whose names start with `_` are reserved for internal, login, error or embedded pages. The CLI never auto-discovers them and does not emit ordinary menu entries or page chunks for them; expose a business page by using a non-`_` directory and explicitly declaring it in `local-routes/index.ts`.

Foundation menu, user and breadcrumb labels show Tooltip only when their text overflows. Foundation Tabs use `Ellipsis` with `alwaysTooltip`, so the complete menu path remains discoverable even when it currently fits; this also keeps Chinese/English locale switches and nested paths visually stable.

The host route uses the complete menu Code chain, for example `/SystemConfig/SystemBasic/PageA`. This chain is stable across locale changes and is the identity used for permissions, audit and deep links. `appPath` is the independent route inside the iframe APP.

## Locale and state

```tsx
import { useBiuI18n } from "@biugle/biu-runtime";

const { $t } = useBiuI18n();
return <span>{$t("菜单")}</span>;
```

Use `@biugle/biu-store` directly when a project needs shared state, and `@biugle/biu-router` when it needs menu queries. Locale changes reload menu resources with the `locale` query parameter. Invalid locale, theme, direction or timezone values use safe defaults.

## Public UI and Runtime APIs

`@biugle/react-components` exposes Message, Tooltip, Dialog, Drawer, copy helpers and `fire()`. Runtime exposes navigation, authentication, layout overrides, locale/menu reload hooks, lifecycle hooks and update checks. Custom projects can close the default auth flow and define their own pages while retaining these boundaries.

## Public components, forms, tables and HTTP

The capabilities are intentionally separate packages: `@biugle/react-components` uses the root Pro entry and `@biugle/react-components/ui` for composable parts; `@biugle/react-form` provides `react-hook-form` `Form.Item` render props; `@biugle/react-table` provides UI/Pro tables and `useQueryTable`; `@biugle/tanstack-query` provides framework-neutral Query core and exposes React bindings from `@biugle/tanstack-query/react`; `@biugle/http` is the standalone Axios client migrated from `ts-xhttp` with regression fixes; `@biugle/render-code` and `@biugle/watermark` provide native QR/barcode and DOM watermark helpers. None of these packages depends on Runtime, Preset, Router or Store.

The three React component packages default to Chinese visible text and each maintains local `zh-CN.json` and `en-US.json` resources. Pass `locale="en-US"` to use the built-in English text and `localeText` to override individual labels; explicit button, empty, loading, error and pagination props always take precedence. Table filters, sorts and slices local data, while server-paginated results keep their server semantics. The Demo Form/Table pages pass the current Runtime locale so these defaults can be verified after switching languages.

The `@biugle/react-components/ui` main catalog covers controls, CheckboxGroup/RadioGroup, date ranges, Tooltip/Ellipsis, Dialog/Drawer, Popover/Popconfirm/Dropdown, Tree/Transfer, Typography/Space/List/ColorPicker/ContextMenu/Timeline/Spin/Image/Notification/Affix/ResizeBox, layout containers, Collapsible/Steps and file upload/preview. `ConfigProvider` is the global configuration entry for `locale`, `localeText`, `theme` and `direction`; `ComponentsProvider` remains a compatibility alias. `SearchTextField`, Autocomplete, Cascader and Skeleton remain deprecated compatibility exports only; they are not part of the new catalog or Demo order. The root entry adds PageBox, PageFilter, `PageFilterItem`/`PageFilter.Item`, Result and Confirm Pro presets. PageFilterItem renders a floating label inside a filter field while the caller still owns the control; `moreFields` reuses the Pro Drawer for advanced filters and supports controlled `drawerOpen`, `drawerTitle`, `drawerWidth`, `drawerFooter` and Drawer class-name overrides. RangeDatePicker uses two consecutive date selections and normalizes the start/end order; RangeTimePicker keeps an existing opposite value or fills the value visible in the opposite dropdown when one side is edited. Textarea uses bounded native resizing without a separate painted drag icon. The component catalog is one `/ComponentUIShowcase` page: it uses one order for interactive UI and Pro presets, and places a dedicated API/property table directly after every region. The old `/ComponentProShowcase` path is only a compatibility alias. Render Code and Watermark have dedicated capability pages under the service menu. Chart, RichText, Editor and Preview Server are intentionally outside this base package.

```tsx
import { ConfigProvider } from "@biugle/react-components";

<ConfigProvider locale="en-US" theme="light" direction="ltr">
  <App />
</ConfigProvider>;
```

`@biugle/react-form` also provides `Form.Group` (with `FormGroup`/`Group` aliases) for titled business sections. It supports `title`, `description`, `columns`, `gap`, root `className`, and `classNames.root/header/title/description/body`; it defaults to two columns and collapses to one on narrow screens. Existing `Form.Section` and `Form.Grid` remain compatible.

```tsx
import { Button, Dialog, Tooltip } from "@biugle/react-components";
import { Form, FormItem, useForm } from "@biugle/react-form";
import { Table, useQueryTable } from "@biugle/react-table";
import http from "@biugle/http";
import "@biugle/react-components/styles.css";
import "@biugle/react-form/styles.css";
import "@biugle/react-table/styles.css";

const form = useForm({ defaultValues: { keyword: "" } });
const table = useQueryTable({
  queryKey: ["users"],
  queryFn: ({ pagination, signal }) =>
    http.get("/users", { page: pagination.current, size: pagination.pageSize }, { signal }),
});
```

The query function receives an `AbortSignal` and normalizes `{ items, total }`, `{ data, total }` and the legacy `{ results, pagination.totalResult }` shapes. The HTTP package owns transport, cancellation, retry, upload and lifecycle hooks, not business permissions or Mock data. The Demo exposes these APIs under Component, Form, Table and HTTP capability menus.
