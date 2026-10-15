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

The root workspace and every generated project use TypeScript, ESLint, Prettier, EditorConfig and Husky/lint-staged. `@biugle/biu-store` uses Zustand as the only state library. `@biugle/render-code`, `@biugle/watermark` and `@biugle/logger` are framework-neutral independent packages. Runtime and Preset consume public package entry points rather than maintaining private forwarding implementations. Standard Table Demo business state also uses `@biugle/biu-store`: `api.ts` contains query/API entry points, `mock.ts` contains sanitized data, and multi-tab pages keep only the active tab in the root store while each `TabPages/<TabCode>/` page owns its store. Temporary responsive measurements and presentation-only toggles may remain in `useState`.

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
pnpm verify
```

`pnpm verify` is the shared local and CI gate. It runs builds and type checks, packed-package checks, tests, ESLint, Prettier, Knip, a production dependency audit, CLI scenarios and all Demo builds. For focused iteration, run `pnpm check`, `pnpm test`, `pnpm verify:pack` or `pnpm verify:scenarios` separately. Knip checks public package files, dependencies, exports and unresolved references. Demo pages are discovered dynamically by the CLI, so their completeness is verified through CLI scenarios, Demo type checks and builds rather than ordinary static imports.

`pnpm build:demo:all` builds the foundation packages and then all six Demos. `pnpm build:demo:all:built` only builds the Demos and is reused by `pnpm verify` after `pnpm check` has already built the foundation. The `examples/dev-demo` `build:foundation` script delegates to the root workspace command instead of maintaining a duplicate package list.

## Generated projects

`biu init` guides mode and project selection. `biu create <name> --type ... --preset ...` is the non-interactive form. A generated project includes its own package metadata, environment files, routes, pages, EditorConfig, ESLint, Prettier and Husky hook. Business code must not import private files from another application through deep relative paths.

## Lifecycle and integration

Shell lifecycle is `MOUNT`/`UNMOUNT`; navigation lifecycle is `BEFORE`/`AFTER`/`ERROR`. A `BEFORE` hook may return `false` to cancel navigation. iframe lifecycle is `LOAD_START`/`READY`/`ERROR`/`UNLOAD`. Cross-window APP events are structured and Origin-checked.

The default authentication page uses `@biugle/react-components` `TextField` and `Button`; Runtime status/error and remote retry surfaces use the same public Components package. Portal-owned profile and change-password slots must also use public controls for their UI, while real validation and API submission remain in the Portal. Menu trees, tab context menus and layout controls remain Preset-owned navigation skeleton behavior. See [`data-contracts.md`](data-contracts.md) for the sensitive-data boundary.

## Performance and browser regression

Performance work follows one rule: reduce invisible work without changing interaction contracts. Disabled Tooltips do not mount an interaction tree, Ellipsis measures overflow on first hover/focus, and shared ResizeObserver, IntersectionObserver and window listeners are released on unmount. Notification hosts live under `body` and outside document flow, preventing the first message from reflowing the page. Table resizing uses one pointer session, updates preview DOM during movement and commits controlled state on pointerup; pointercancel and window blur clean the session. Enable `virtual` only for genuinely large data sets so ordinary table semantics remain unchanged.

Browser regression should cover the component and Form pages plus all three standard Table pages: no blank page or full-page flash on first interaction, filter and Drawer fields share one state, locale changes update visible copy, overlays stay outside document flow, only the table content area scrolls, resize bounds are enforced, reset restores the complete default state, and EditableTable blur-save and cancel/clear/save actions remain independent. Avoid full accessibility-tree snapshots for large tables in automation; use local DOM metrics, screenshots and targeted interactions instead.
