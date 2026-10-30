# @biugle/biu-cli

The official CLI for creating, developing and building Biu Portal and APP projects. Requires **Node.js 22+** and **pnpm 9.14.4**.

## Create a project

```bash
pnpm dlx @biugle/biu-cli create my-portal --type PORTAL --preset sidebar
cd my-portal
pnpm install
pnpm start
```

For interactive creation of multiple projects, run `pnpm dlx @biugle/biu-cli init` in a terminal. `init` accepts up to 20 Portals and 20 APPs, asks about authentication, tabs, breadcrumbs, menus and layout inclusion, and supports `q`/`quit`/`cancel` to cancel. For scripts and CI, use `create <name>`.

Install the CLI in an existing Biu project with `pnpm add -D @biugle/biu-cli`. The generated project declares its foundation dependencies; install them before starting or building. React templates explicitly install `@tanstack/react-query` using the peer range declared by `@biugle/tanstack-query`, so its React entrypoint is usable after installation. Each generated `@biugle/*` dependency uses that package's version recorded when the CLI was built; the template's own project version starts at `1.0.0`. A standalone project resolves installed public packages. A checkout of the Biu source workspace uses the local packages and builds missing foundation outputs.

## Commands

| Command                           | Behavior                                                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `biu` / `biu dev`                 | Start the current project in the `local` environment.                                                              |
| `biu init`                        | Interactively create projects; requires a terminal.                                                                |
| `biu create <name>`               | Create a project in a new, safe, single-level directory. Existing directories are rejected.                        |
| `biu start --filter <project>`    | Delegate to that workspace package's `start` script. The generated project's `pnpm start` runs `biu dev` directly. |
| `biu build`                       | Build the current project in the `prod` environment and write `dist/index.html` and `dist/manifest/`.              |
| `biu --help` / `biu <command> -h` | Show command usage.                                                                                                |
| `biu --version`                   | Print the installed CLI package version.                                                                           |

| Option                | Commands       | Values / default                                                                                                                                                        |
| --------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--type`              | `create`       | `PORTAL` (default), `APP`; case insensitive.                                                                                                                            |
| `--preset`            | `create`       | Portal: `sidebar` (default), `topbar`. APP: `sidebar` (default), `blank`, `dashboard`, `mobile`, `custom`.                                                              |
| `--env`               | `dev`, `build` | `local`, `dev`, `test`, `pre`, `prod`, or a custom environment name matching `[a-z][a-z0-9_-]*`. Overrides `BIU_ENV`; defaults to `local` for dev and `prod` for build. |
| `--portal`            | `dev`, `build` | Override the Portal code used for menu/config scope.                                                                                                                    |
| `--apps`              | `dev`          | Comma-separated APP directories, relative to the current project or absolute. Starts APP servers and overrides their local iframe URLs.                                 |
| `--port`              | `dev`          | Integer from 1 to 65535. Portal defaults to available ports 9001–9999; APP to 8001–8888. An occupied preferred port falls back to the configured range.                 |
| `--all`               | `dev`, `build` | Include all declared local routes for diagnosis. Normal operation uses runtime menus and permissions.                                                                   |
| `--filter`            | `start`        | Required workspace package selector. Other arguments are forwarded to its `start` script.                                                                               |
| `--lang` / `--locale` | All            | `zh-CN` (default), `en-US`; may precede the command or follow it. `BIU_LOCALE` sets the default.                                                                        |

Value options accept `--name value` and `--name=value`. An explicitly supplied option without a value fails before generation or startup.

```bash
biu create my-app --type APP --preset custom --lang en-US
biu dev --env dev --port 9100
biu dev --apps ../my-app,../vue-app
biu build --env prod
biu --lang en-US --help
```

To inspect a production build, serve the generated `dist/` directory with your static server and configure an SPA fallback to `index.html` for page URLs. Portal and APP have independent builds and deployments; the Portal loads APP URLs through iframes.

## Routes and layout

The fixed root fallback route is `/`, sourced from `src/pages/index.*`, and does not require a route entry. Business pages live in flat `src/pages/<Code>` directories and public routes are declared in `local-routes/index.ts`. Directories whose names start with `_` are internal pages and are excluded from CLI discovery. Use PascalCase menu/page Codes and URL segments such as `Welcome` and `/SystemConfig/UserManagement`.

HTML projects use the built-in `htmlAdapter` by default. An explicit `adapter` path takes precedence in both development and production, allowing project-owned rendering and localization while keeping the public Adapter lifecycle. Other non-React frameworks must configure their Adapter.

Standard APP templates show their configured layout during development and omit it from production by default:

```ts
layout: {
  preset: "sidebar",
  includeInDevelopment: true,
  includeInBuild: false,
}
```

An explicitly chosen `custom` preset retains its application-owned layout in production by default. Set `includeInBuild: true` to retain a standard Preset layout, or `false` to omit any APP layout. Existing configurations without these flags retain their previous output; Portal layouts are always included.

## Generated files and troubleshooting

- Components and Table root, `/ui` and `/pro` imports all resolve to the project foundation snapshot, keeping development isolated from workspace rebuilds. The installation gate compiles `/pro` in real generated pages as well as checking Node imports.
- `.biu/generated/` holds generated entries and routes. `.biu/foundation/` holds the project snapshot of compiled foundation packages; it is refreshed on startup/build.
- Development output uses `.biu/dev/` and leaves production `dist/` intact. The dev server serves `/manifest/routes.json` as uncached JSON for the Runtime update baseline, before its SPA fallback. Keep `.biu/` and `dist/` out of Git.
- After changing foundation or CLI source, rebuild the workspace packages and restart your dev servers. Stop servers before deleting their snapshots.
- Missing installed package: run `pnpm install` in the generated project. In a source checkout, run `pnpm build` if foundation output is missing.
- Coordinated `--apps` sessions validate all APP configurations before starting subprocesses. A failed APP or failed Portal startup stops the child processes; Ctrl+C also stops the coordinated session.
- Menu requests apply their timeout to both response headers and the response body. `menu.fallback: false` makes request/schema failures stop discovery.

See the [development guide](https://github.com/biugle/biu/blob/main/docs/development.md), [package graph](https://github.com/biugle/biu/blob/main/docs/package-graph.md) and [data contracts](https://github.com/biugle/biu/blob/main/docs/data-contracts.md).

## License

MIT
