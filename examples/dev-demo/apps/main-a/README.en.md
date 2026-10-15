# Portal Demo: main-a and main-b

This Demo contains two peer Portals and independent APPs:

- `main-a`: Sidebar Portal with Tabs enabled, default port 9001.
- `main-b`: Topbar Portal, default port 9002.
- `child-app`: React APP with PageA and PageB, default port 8001.
- `vue-child`: Vue 3 APP with VuePage, default port 8002.
- `html-child`: native HTML APP, default port 8003.
- `layout-custom`: independent React Custom APP, default port 8007.

Start the two Portals and local APPs with:

```bash
pnpm start --filter main-a -- --apps ../child-app,../vue-child
pnpm start --filter main-b
pnpm start --filter layout-custom
```

Portal does not bundle APP source. It reads `remoteApps.APP_URL` from the current environment and loads the independent APP boundary. Every project emits its own `dist/index.html` and can be deployed to a separate domain.

## Component verification routes

main-a uses the public package entries directly and does not duplicate component implementations. The key routes are:

- `/ComponentCapabilities/ComponentUIShowcase`: component interactions, overlays, Notification, Upload, Anchor, Slider and API tables;
- `/FormCapabilities/FormShowcase`: standard Form, default sizes, validation, input normalization and submitted values;
- `/TableShowcase`: Table/ProTable/EditableTable, query, column settings, striped rows and resize APIs;
- `/StandardTableTabsShowcase` and `/StandardTablePageShowcase`: standard PageBox, filter, toolbar, table, footer and pagination layouts;
- `/EditableTablePageShowcase`: double-click editing, blur save, cancel/clear/save actions and pagination;
- `/TableResizeShowcase`: column bounds, row height, elastic columns, non-elastic columns and horizontal scrolling.

Page query parameters, Zustand stores, `api.ts` and sanitized `mock.ts` files are kept separate. A multi-tab root store owns only shared tab state; each `TabPages/<TabCode>/` directory owns its page implementation. Locale switching, table filtering and Drawer field interaction should be checked from these routes.
