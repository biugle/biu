# biu Development Guide

## Workspace

```text
biu/
├── .editorconfig
├── eslint.config.js
├── .prettierrc.json
├── .husky/pre-commit
├── packages/                 public foundation packages
├── examples/dev-demo/apps/   independent Portal and APP demos
└── docs/
```

The root workspace and every generated project use TypeScript, ESLint, Prettier, EditorConfig and Husky/lint-staged. `@biugle/biu-store` uses Zustand as the only state library. `@biugle/render-code`, `@biugle/watermark` and `@biugle/logger` are framework-neutral independent packages. Runtime and Preset consume public package entry points rather than maintaining private forwarding implementations.

## Code boundaries

- CLI reads `biu.config.ts`, merges environment files, discovers `local-routes/index.ts`, filters Codes and invokes Rsbuild.
- Runtime consumes the generated registry and owns loading, navigation, lifecycle, Bridge and error boundaries.
- Router owns menu trees, complete URLs, permission filtering and navigation queries.
- Store owns scoped preference, auth, menu and session state.
- Preset owns official Layouts, menus, Tabs, Header and responsive CSS.
- UI owns reusable floating components and `fire()` without depending on Runtime.

Every Portal and APP has a fixed `/` fallback sourced from `src/pages/index.*`. It is not a `local-routes` entry and is not included in the ordinary page registry. Directories under `src/pages` that start with `_` are internal pages and are never scanned or emitted as menu chunks; public pages use `src/pages/<Code>` and are declared explicitly in `local-routes/index.ts`. Public menu Codes, every segment of a menu path and the corresponding page directory use uppercase-starting Pascal/camel names, such as `ComponentUIShowcase` and `/SystemConfig/UserManagement`; new menu entries must not use `-`, `_` or all-lowercase paths. `appId`, domains and locale values are separate identifiers and are not subject to this menu-path rule.

Local menu configuration and generator defaults must follow the naming rule above. Historical external Codes may remain in `meta` or an explicit compatibility mapping, but new hyphenated URLs must not be generated. Titles may change with locale; Codes and canonical URLs may not.

## Daily commands

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm lint
pnpm format:check
pnpm audit:unused
pnpm verify:scenarios
pnpm build:demo:all
```

Knip strictly checks public package files, dependencies, exports and unresolved references. Demo pages are discovered dynamically by the CLI, so their completeness is verified by type checks, CLI scenarios and builds instead of treating ordinary static imports as the source of truth.

## Generated projects

`biu init` guides mode and project selection. `biu create <name> --type ... --preset ...` is the non-interactive form. A generated project includes its own package metadata, environment files, routes, pages, EditorConfig, ESLint, Prettier and Husky hook. Business code must not import private files from another application through deep relative paths.

## Lifecycle and integration

Shell lifecycle is `MOUNT`/`UNMOUNT`; navigation lifecycle is `BEFORE`/`AFTER`/`ERROR`. A `BEFORE` hook may return `false` to cancel navigation. iframe lifecycle is `LOAD_START`/`READY`/`ERROR`/`UNLOAD`. Cross-window APP events are structured and Origin-checked.

The default authentication page uses `@biugle/react-components` `TextField` and `Button`; Runtime status/error and remote retry surfaces use the same public Components package. Portal-owned profile and change-password slots must also use public controls for their UI, while real validation and API submission remain in the Portal. Menu trees, tab context menus and layout controls remain Preset-owned navigation skeleton behavior. See [`data-contracts.md`](data-contracts.md) for the sensitive-data boundary.
