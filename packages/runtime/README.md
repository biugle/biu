# @biugle/biu-runtime

The React runtime shell for biu Portals and independent APPs.

## What it provides

- Shell lifecycle, navigation hooks and framework adapter contracts.
- Authentication, permission and error boundaries.
- Remote APP loading, menu routing and update checks.
- Shared i18n, store, events, bridge and UI exports from public packages.
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

Runtime and Preset use the same public package entry points consumed by applications. Business projects provide configuration, routes and pages; they do not copy the Shell implementation.

See the architecture and usage guides in https://github.com/biugle/biu/blob/main/docs/.

## License

MIT
