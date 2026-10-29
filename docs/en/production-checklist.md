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

The 800-line TypeScript/JavaScript source budget is enforced by `pnpm verify:source-size`: new oversized files fail, while legacy exceptions must be listed in `scripts/source-size-baseline.json` with an owner, review date, reason and line ceiling. Keep each exception within its ceiling and remove it after the file is split below the limit. Run the complete `pnpm verify` gate before release; do not rely on historical reports' fixed oversized-file counts.

## Runtime behavior

Verify locale reload, scoped Store state, Tabs/Breadcrumb behavior, Message, Tooltip, Modal, Drawer, `fire()`, auth boundaries, lifecycle hooks, navigation cancellation and remote APP timeout/error states. Update checks should read the latest manifest at startup or on user actions without polling.

## Rollback

Keep the previous hashed assets available. Roll back Portal and APP as a compatible pair and verify `APP_URL`, `ALLOWED_ORIGINS`, manifests and build IDs after rollback.
