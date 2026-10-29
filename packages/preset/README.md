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

### Sidebar controls

The Sidebar preset starts expanded. Its round control at the sidebar's top edge switches between the full-width menu and a 60px icon rail; from the hidden state it restores the full-width menu. The first footer action hides the menu completely. The top-edge control remains outside the hidden navigation so the menu can always be restored. `lockSidebar` disables these built-in presentation controls, while host-driven `hideSidebar` and `collapseSidebar` overrides remain supported.

See the architecture guide in https://github.com/biugle/biu/blob/main/docs/design.md.

## License

MIT
