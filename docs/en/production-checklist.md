# Production Delivery Checklist

## Required

- Set `projectType` to `PORTAL` or `APP`; Portal must define a portal Code and APP must not define a Portal.
- Validate Portal Sidebar, Portal Topbar, independent APP preset and React Custom.
- Decide `auth.enabled`; production auth should use SSO or a business service.
- Keep environment-specific configuration in `config/<ENV>.ts` and build with `--env prod`.
- Configure exact `remoteApps[APP_ID].APP_URL` and `ALLOWED_ORIGINS` for every remote APP; the embedded APP version is returned through its Origin-validated `BIU_READY.VERSION` handshake.
- Use HTTPS, CSP, `frame-ancestors`, `nosniff`, Referrer-Policy and secure cookies at the deployment layer.
- Do not put tokens, cookies, passwords or long-lived credentials in frontend configuration.
- Verify menu and permission API responses and fail-closed behavior.

## Build and quality

```bash
pnpm install --frozen-lockfile
pnpm verify
pnpm --filter <project> biu build --env prod
```

Confirm `dist/index.html`, hashed assets, manifests, complete hierarchical URLs, error boundaries, monitoring hooks, Bridge Origin checks and SPA fallback. Confirm Portal and APP are separate artifacts.

`pnpm verify:source-size` applies an 800-line limit to all repository `.js`, `.jsx`, `.mjs`, `.ts`, `.tsx` and `.css` files, including public packages, Demos, tests and scripts. Both new and existing oversized files fail; no legacy exceptions or exception baseline remain. Generated output and data files such as JSON are excluded from the source count, but source files must not be hidden in generated directories. Run the complete `pnpm verify` gate before release.

`pnpm verify:boundaries` checks public packages, Demos and the shared Demo package. Internal package imports must match `exports` and be declared in `dependencies` or `peerDependencies`. Cross-package and cross-Demo relative source imports are forbidden, as are Components/Table UI imports of Pro and reusable package dependencies on Runtime/Preset/Adapter/CLI. Type imports and re-exports are included; both package dependency and source import graphs must be acyclic.

## Runtime behavior

Verify locale reload, scoped Store state, Tabs/Breadcrumb behavior, `biuMessage` from `@biugle/react-components`, Tooltip, Modal, Drawer, `fire()`, auth boundaries, lifecycle hooks, navigation cancellation and remote APP timeout/error states. Update checks should read the latest manifest at startup or on user actions without polling.

For `localeUrl`, verify that business translations overlay the built-in resource for the same locale and take priority for matching keys. A same-locale `reloadLocale()` must update memoized headers and API descriptions. Removing a business override restores the built-in value; other missing keys use the established fallback. Stable menu keys must survive locale and menu reloads. The standalone I18n `addLocale` API retains whole-resource replacement semantics.

Verify that the `context` field in `useBiuAuthStore` is the only authentication state source. The legacy `auth` field in `useBiuPreferenceStore` and `useBiuStore` state is a compatibility projection; `setAuth` and `initialize`/`setState` updates containing `auth` forward to Auth Store. New and legacy readers must agree after login, logout and clearing. Preference persistence still contains only locale, theme, direction and timezone.

## Rollback

Keep the previous hashed assets available. Roll back Portal and APP as a compatible pair and verify `APP_URL`, `ALLOWED_ORIGINS`, manifests and build IDs after rollback.
