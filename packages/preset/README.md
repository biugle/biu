# @biugle/biu-preset

Official React layout presets for Portal and independent APP projects.

## Available entry points

- @biugle/biu-preset/sidebar
- @biugle/biu-preset/topbar
- @biugle/biu-preset/blank
- @biugle/biu-preset/dashboard
- @biugle/biu-preset/mobile
- @biugle/biu-preset/custom
- @biugle/biu-preset/toolbar

Each layout keeps its matching CSS subpath for compatibility. All six CSS subpaths resolve to one shared stylesheet. Runtime capabilities come from biu-runtime; this package provides official layout composition.

React compatibility: `react` and `react-dom` `^19.0.0` are required peer dependencies.

## Install

```bash
pnpm add @biugle/biu-preset @biugle/biu-runtime
```

## Usage

```tsx
import { SidebarLayout } from "@biugle/biu-preset/sidebar";
import "@biugle/biu-preset/sidebar.css";

<SidebarLayout>{children}</SidebarLayout>;
```

Choose a preset instead of copying foundation layout or responsive styles into an application.

Floating layers use the shared `--biu-z-index-*` variables from `@biugle/react-components/theme.default.css`. Header Popovers and tab context menus therefore follow the same stacking order as component Dialogs, notifications and tooltips.

### Sidebar controls

The Sidebar preset starts expanded. Its top-edge control stays centered on the sidebar/content seam while expanded or collapsed to the 60px icon rail, showing only the expand icon when collapsed. Menu settings remain in the footer in both states, while hide/favorites/recent/search actions are available when expanded. Fully hidden navigation restores through the same top control outside the inert sidebar, with a 2px logical-start gap from the viewport edge. All official Portal and APP shells share LayoutFrame; `lockSidebar` and controlled `hideSidebar`/`collapseSidebar` overrides remain supported.

See the architecture guide in https://github.com/biugle/biu/blob/main/docs/design.md.

## License

MIT
