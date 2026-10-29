# Data Contracts

This document defines the data boundary between the foundation, Portals, APPs and backend services. Demo `src/mock/` files are examples only; production projects must use SSO, permission and business services.

## Common response

```json
{ "code": 0, "message": "", "data": {} }
```

Only `code === 0` is success. Error details must not include request headers, cookies, tokens, passwords or session IDs.

## Batch text and filter parameters

`ProTextField` retains a string field value. `onChange(value: string, items: string[])` reports committed text and its derived items. Direct typing reports raw text; on blur, enabled separators are parsed, empty items removed and the value formatted. If formatting changes the text, the normalized value and items are reported through `onChange`. Apply parses the draft and commits non-empty items joined with line breaks. Items are trimmed and empty items removed, while source order and duplicates remain. Cancelling a draft or returning false from asynchronous `onApply` leaves query state and committed values unchanged.

`splitString(str, separatorIncludesSpace = false, separatorIncludesComma = false)` always splits line breaks and carriage returns. Whitespace and Chinese/English comma splitting are independent opt-in rules, both disabled by default; internal phrase whitespace and commas remain when disabled. Existing one/two-argument calls stay compatible. Empty, whitespace-only and runtime non-string values return `[]`.

```ts
import { splitString } from "@biugle/react-components";

const value = "华东，华南\n唐宁";
const items = splitString(value, false, true);
// ["华东", "华南", "唐宁"]
```

The component does not automatically convert items into HTTP query/body parameters or decide whether an API expects text, arrays or repeated parameters. A page may store only `queryParams.keyword: string`; its API adapter explicitly parses and converts that value according to the backend contract. Inline filters and the advanced Drawer share one controlled state rather than separate pending queries.

The standard region Table page's `queryRegionRows(keyword, channel)` is a project-local redacted query example. It explicitly enables Chinese/English comma splitting, preserves phrase spaces and lowercases keywords. A match for any keyword in `region`, `channel` or `manager` passes (OR between keywords), and the selected channel combines with that result using AND. An empty keyword list does not restrict the search. The page's `api.ts` owns this rule; it is not a default business-filtering contract of Table or ProTextField.

## Table sizing state and remaining space

Controlled Table/ProTable column widths use `Record<string, number | string>`, keyed by `Column.key`. Numbers are pixels; untouched fixed CSS/percentage widths retain their representation. An action column without a configured width keeps the shared responsive default and must not be frozen into its measured pixel width by callbacks or persistence.

`fillRemainingSpace?: boolean` defaults to true. The table uses one stable dynamic ordinary column: the leaf named by `elasticColumn`, or the final visible ordinary leaf when the key is omitted. Resizing another ordinary leaf keeps that leaf as the fixed balance point and adjusts it progressively from its current committed width; the role is not handed to a neighbor and is not refilled to the viewport maximum after every commit. Directly resizing the dynamic leaf balances it one-to-one with the nearest preceding ordinary leaf and stops when either reaches a bound, rather than shrinking further and creating a new trailing spacer. Existing spacer slack can be consumed when the dynamic leaf grows. Other accepted changes depend on the dynamic leaf's available range, compensation bounds and target limits. Automatic fill and balancing may exceed `maxWidth`; direct drags still respect the target leaf's `minWidth`/`maxWidth`. Fixed, action and selection/expansion columns never participate in compensation. `fillRemainingSpace=false`, `elasticColumn=false` or `scroll.x="max-content"` selects independent resizing with the exact content width, without filling or compensation.

`onColumnWidthsChange(widths)` reports one complete map containing the final distribution. Callers apply the full new state rather than retaining only the dragged column and losing other ordinary columns' final widths. Manual-width protection remains while a controlled caller accepts the new map; an external width-map replacement/reset or column-structure change clears it. `onColumnResize(key, width)` reports only the resized target; its value matches the target in the full map, and automatic filling never widens it again. Operations with no accepted delta emit neither callback.

```ts
type TableSizingState = {
  columnWidths: Record<string, number | string>;
  fillRemainingSpace: boolean;
};

const defaultSizingState: TableSizingState = {
  columnWidths: {},
  fillRemainingSpace: true,
};
```

Sizing state is a page layout preference, suitable for standard-page `storeState` updates through `dispatcher.setStoreState`; business query conditions remain in `queryParams`. Resize callbacks do not automatically rewrite business fields or produce HTTP parameters. During consecutive adjustments, manually resized ordinary columns keep their chosen widths and the dynamic key stays fixed. Resizing another ordinary leaf uses that same dynamic leaf as the balance point, progressing from its current width instead of switching columns or refilling to the viewport maximum. Directly resizing the dynamic leaf balances it with its preceding ordinary neighbor; the pair stops when either reaches a bound so a new spacer gap is not created. Later drags do not transfer compensation to a different dynamic column. Viewport changes preserve these manual widths. External width-map changes, reset or column-structure changes release the protections; equivalent columns-array copies are not resets.

## Menus and permissions

Menu and directory APIs receive the current `locale` and return `DIRECTORY`/`MENU` nodes. New menu Codes, path segments and page directories use uppercase-starting Pascal/camel names without hyphens or underscores; `portalCode`, `appId` and other external identifiers keep their own conventions. The stable identity is the complete Code chain, for example:

```text
menuKey: SystemConfig/SystemBasic/PageA
routePath: /SystemConfig/SystemBasic/PageA
```

Titles can change with locale; Codes and paths must not. Repeated leaf Codes require `navigateByKey`. Permission failures use fail-closed behavior when the permission API is enabled.

## Locale resources

```json
{
  "code": 0,
  "data": {
    "key": "en-US",
    "translation": { "系统配置": "System configuration" }
  }
}
```

Missing values fall back to English, Chinese and then the key. Invalid locale values fall back to `zh-CN`.

## Portal and APP

```ts
remoteApps: {
  "child-app": {
    APP_URL: "https://app.example.com",
    ALLOWED_ORIGINS: ["https://app.example.com"],
    OVERLAY_MODE: "IFRAME"
  }
}
```

Cross-origin APPs require an exact allowed Origin. `AUTH_ACTION` is accepted only from an origin listed in `remoteAppOrigins` or one of `remoteApps.*.ALLOWED_ORIGINS`; when no origin is configured, the action is rejected. Portal and APP are built and deployed separately.

Standalone APP layout output is controlled independently by `layout.includeInDevelopment` and `layout.includeInBuild`. New standard APP templates show the preview shell in development and omit it from production builds by default; an APP created with the explicit `custom` preset retains its user-owned layout by default. `includeInBuild` can override either default. Missing fields preserve legacy output for existing projects, and Portals always keep their own layout. This policy only changes generated layout/CSS imports; it does not change Runtime, page routing or the APP-in-Portal iframe contract.

## Layout watermark and code rendering

The official Layout can enable a native watermark with `layout.watermark`. The configuration contains presentation options only; it must not carry identity, tokens or business data:

```ts
layout: {
  watermark: {
    enabled: true,
    text: ["Biu", "Internal system"],
    color: "#64748b",
    opacity: 0.12,
    rotate: -20,
    gap: [120, 90],
  },
}
```

`@biugle/watermark` exposes a `createWatermark(target, options)` handle with `update` and `destroy`. It is an independent framework-neutral package. `@biugle/render-code` returns QR/barcode data URLs, canvas or SVG and does not enter Bridge, menu or authentication protocols.

## Auth and user data

The foundation exposes `login`, `logout`, `refreshAuth` and `setAuth`. It stores only non-sensitive identity data. Tokens, cookies, passwords and session IDs remain in SSO or the gateway. `extra` is reserved for non-sensitive project metadata. The bridge also filters common credential-shaped field names such as API and access keys as a defense in depth; it cannot reliably identify secrets hidden in arbitrary values, so callers must still keep sensitive data out of `extra`.

The default Runtime authentication page uses the public Components `TextField` and `Button`. Runtime status and error surfaces use `Result`, `Alert`, `Button` and `biuMessage`; the redacted stack is intentionally a read-only `<pre>`. Profile and change-password panels remain Portal-owned slots. Demo panels use the same public controls, while real projects provide API submission and validation without placing passwords in Runtime state.

## Scoped client state

- Favorites: localStorage, scoped by Portal and environment, up to 100.
- Recent items: localStorage, same scope, up to 10.
- Tabs: sessionStorage, same scope.
- Locale, theme, direction and timezone: sessionStorage, same scope.

Old favorites and recent records are retained and handled by the page-not-found fallback if a menu changes.

Every Portal and APP uses `src/pages/index.*` as its fixed root fallback page. Directories named `src/pages/_*` are internal and are not parsed by the CLI. The root page is independent of Tabs and is the protected fallback tab when Tabs are enabled. The Portal version comes from its own `package.json`; an embedded APP returns its version in `BIU_READY.VERSION` after Origin validation.

## Bridge and updates

Bridge payloads contain Portal Code, environment, locale, theme, direction, timezone, current Code and redacted auth only. Lifecycle values are `LOAD_START`, `READY`, `ERROR`, `UNLOAD`, `MOUNT`, `UNMOUNT`, `BEFORE`, `AFTER` and `ERROR`. Update manifests contain build IDs and asset metadata, never user credentials.
