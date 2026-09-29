# Data Contracts

This document defines the data boundary between the foundation, Portals, APPs and backend services. Demo `src/mock/` files are examples only; production projects must use SSO, permission and business services.

## Common response

```json
{ "code": 0, "message": "", "data": {} }
```

Only `code === 0` is success. Error details must not include request headers, cookies, tokens, passwords or session IDs.

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

Cross-origin APPs require an exact allowed Origin. Portal and APP are built and deployed separately.

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

The foundation exposes `login`, `logout`, `refreshAuth` and `setAuth`. It stores only non-sensitive identity data. Tokens, cookies, passwords and session IDs remain in SSO or the gateway. `extra` is reserved for non-sensitive project metadata.

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
