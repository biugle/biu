# Adapter Guide

## Contract

An Adapter is a framework-independent object exported as the default value:

```ts
import type { BiuFrameworkAdapter } from "@biugle/biu-runtime";

const adapter: BiuFrameworkAdapter = {
  framework: "custom",
  loadPage(module) {
    return (module as { default: unknown }).default;
  },
  renderPage(container, page) {
    // Mount the page into the container.
  },
  unmountPage(container) {
    container.replaceChildren();
  },
};

export default adapter;
```

`loadPage` normalizes a dynamic import result. `renderPage` mounts it. `unmountPage` must remove listeners, timers and DOM owned by the page. Adapters must not modify the host Header, Sidebar, Tabs or document-level styles.

## Supported integrations

- React: use `@biugle/biu-adapter-react` and the official React runtime.
- Native HTML: use Runtime's built-in `htmlAdapter`; HTML is mounted as a string and cleaned on navigation.
- Vue, Svelte and Angular: provide a framework Adapter and configure the corresponding Rsbuild plugin.
- Legacy applications: use an independent APP with the Bridge/iframe boundary first, then migrate incrementally if needed.

## HTML APP example

The runnable HTML example is `examples/dev-demo/apps/html-child`:

```bash
pnpm build:html-child
pnpm start --filter html-child
```

The Portal only stores the remote APP metadata. It never bundles the APP page source.

## Rules

Adapters are production contracts, not Demo mocks. Authentication, permissions and business data remain project responsibilities. Cross-window communication must use `@biugle/biu-bridge`; shared events must use `@biugle/biu-events`.

Every public business page has a local route Code and is kept under `src/pages/<Code>`. The fixed root fallback is an exception: `src/pages/index.*` maps to `/` and does not need a route-table entry. Directories beginning with `_` are reserved for internal, login, error or embedded pages; the CLI never auto-discovers them. Declare other business pages explicitly through `local-routes/index.ts`.
