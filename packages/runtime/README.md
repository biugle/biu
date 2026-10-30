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

`createBiuUpdateChecker` exposes `initialize()` and `check()`. The first successfully read snapshot becomes the baseline; a late initialization success or failure does not replace or clear a baseline established by a concurrent check. Checks triggered by navigation report a detected update at most once per checker, including concurrent reads. Shell locale changes retain the checker and baseline, and notifications use the locale current when the update is detected. Unmounting, disabling checks or changing the manifest URL prevents retired checkers from displaying late notifications. Network failures do not interrupt navigation, and checks do not poll or force-refresh.

Runtime and Preset use the same public package entry points consumed by applications. Business projects provide configuration, routes and pages; they do not copy the Shell implementation.

See the architecture and usage guides in https://github.com/biugle/biu/blob/main/docs/.

## License

MIT
