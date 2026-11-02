# @biugle/biu-runtime

The React runtime shell for biu Portals and independent APPs.

## What it provides

- Shell lifecycle, navigation hooks and framework adapter contracts.
- Authentication, permission and error boundaries.
- Remote APP loading, menu routing and update checks.
- Coordination through public i18n, Store, Events and Bridge contracts, with Components UI APIs consumed directly.
- Default login, home and status pages for safe fallbacks. The login fields/actions and Runtime error/retry surfaces reuse the public `@biugle/react-components` controls; business profile/password panels remain Portal-owned slots.

## Install

```bash
pnpm add @biugle/biu-runtime @biugle/react-components react react-dom
```

## Usage

```tsx
import { BiuShell } from "@biugle/biu-runtime";

<BiuShell config={runtimeConfig} />;
```

## Page lifecycle and tabs

`layout.tabs` maintains the Portal's open-route tab strip and restores its route-key history from `sessionStorage`; page caching is a separate opt-in. Set `keepAlive: true` on a local route entry to keep its `pageRegistry` page mounted, or on a remote APP route to retain its iframe, while another route is active. It defaults to `false`, so existing routes still unmount on navigation. Cache identity uses the full menu path, so repeated route Codes under different paths retain separate instances; there is no LRU cap, and memory grows with visited opted-in paths. Closing tabs releases their pages/iframes; a full app reload starts fresh instances. Hidden local page effects and remote iframe code keep running. Local pages can use `useBiuContext().currentCode`; embedded APPs receive `HOST_CONTEXT.HOST_ACTIVE` and can read `useBiuContext().hostActive` or their Adapter context to pause background work. Custom remote loaders receive the same `active` boolean. If tabs are disabled, cached routes stay until the Shell unmounts. The option supports local React pages, pages rendered through a configured Adapter, and remote iframe APPs including Vue, HTML and React projects.

Remote loader lifecycle callbacks report `ACTIVATE` and `DEACTIVATE` when a cached route changes visibility, in addition to `LOAD_START`, `READY`, `ERROR` and `UNLOAD`. A hidden remote app still runs in its iframe; the host signal lets its own framework code pause costly background work without coupling Runtime to Vue, React or another framework.

Framework Adapters may implement `updatePage(container, page, context)` to apply changing host context to an existing page instance. Without this optional hook, Adapters preserve their existing remount-on-context-change behavior.

The Demo enables `keepAlive` on `StandardTablePageShowcase` and the uniquely coded `VueKeepAliveDemo` route, and includes local counters to verify both local page and remote Vue iframe retention. The route's module-level Zustand Store separately owns its query and table data.

`createBiuUpdateChecker` exposes `initialize()` and `check()`. The first successfully read snapshot becomes the baseline; a late initialization success or failure does not replace or clear a baseline established by a concurrent check. Checks triggered by navigation report a detected update at most once per checker, including concurrent reads. Shell locale changes retain the checker and baseline, and notifications use the locale current when the update is detected. Unmounting, disabling checks or changing the manifest URL prevents retired checkers from displaying late notifications. Network failures do not interrupt navigation, and checks do not poll or force-refresh.

Runtime and Preset use the same public package entry points consumed by applications. Business projects provide configuration, routes and pages; they do not copy the Shell implementation.

Embedded APP events validate the protocol, host Origin, actual parent window and any supplied `APP_ID`. Portal receivers additionally require the event's `APP_ID` to match the owning iframe. Incoming host events publish only to the APP base bus, without echoing to the host; locally produced events continue to publish locally and forward to a validated host. An unknown or rejected host receives no outgoing event or Overlay notification. Explicit empty or invalid Bridge targets never fall back to an unchecked parent Origin.

Configuration identity is used only for the Shell's first initialization. The Shell and Portal iframe loader then read only `useBiuAuthStore.context`. `clear()` and `setAuth(undefined)` retain an empty identity without falling back to configuration or a previous HOST_CONTEXT; layout or storage-scope updates cannot restore the old user. Login, identity refresh, logout and clearing resend the current `HOST_CONTEXT.AUTH` through `publicAuthContext` without recreating the iframe or restarting loader lifecycles. `auth.enabled=false` disables the default auth entry but still allows project-owned identity context to synchronize.

See the [architecture](https://github.com/biugle/biu/blob/main/docs/design.md) and [usage guide](https://github.com/biugle/biu/blob/main/docs/usage.md).

## License

MIT
