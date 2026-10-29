# @biugle/biu-cli

The official CLI for creating, discovering, developing and building biu projects.

## What it provides

- Interactive project generation through biu init.
- Portal, APP and React Custom project templates.
- Menu-aware page discovery and route registry generation.
- Rsbuild/Rspack development and production build orchestration.
- Port selection, environment configuration and foundation snapshots.

## Install

```bash
pnpm add -D @biugle/biu-cli
```

## Usage

```bash
biu init
biu create my-portal --type PORTAL
biu create my-app --type APP
biu start
biu build --all --env prod
```

The CLI generates temporary .biu files and keeps business pages under project control. It does not replace the business framework.

The root fallback route is always `/` and is sourced from `src/pages/index.*`; it does not require a route entry. Directories under `src/pages` with a leading `_` are reserved for internal or embedded pages and are never auto-discovered by the CLI. Declare only public business pages in `local-routes/index.ts`.

APP projects can independently include their configured layout shell in development and production builds:

```ts
layout: {
  preset: "sidebar",
  includeInDevelopment: true,
  includeInBuild: false,
}
```

New standard APP templates use this preview-shell default. An APP created with the explicit `custom` preset keeps its user-owned layout in production by default. Set `includeInBuild: true` to retain a Preset layout, or `false` to omit any layout. Existing configs that omit the flags retain their previous output, and Portal layouts are always included.

See the development guide in https://github.com/biugle/biu/blob/main/docs/development.md.

## License

MIT
