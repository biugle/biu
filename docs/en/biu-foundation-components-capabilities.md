# Biu Foundation, Components and Public Capabilities

> Status: the approved single normative entry point for implementation, maintenance, regression, documentation and delivery. Updated 2026-09-29.

This document consolidates the component, foundation, Demo, package, compatibility, documentation and acceptance rules collected during all rebuild iterations. The staged documents previously under `docs/specs/` and `docs/en/specs/` have been merged into this document and its Chinese counterpart and removed. Future implementation, fixes, acceptance and Agent handoff follow this document, its Chinese counterpart and the public package/API manuals; no second Spec directory is maintained.

## Scope

- The foundation owns Portal/APP layout skeletons, routing, menus, state orchestration, lifecycle and responsive constraints.
- `@biugle/react-components` owns usable UI components, Pro page presets, overlays, Message, Fire and shared interaction behavior.
- `@biugle/react-form` owns react-hook-form conventions, `Form.Item`, `Form.Group`/`FormGroup` and form layout.
- `@biugle/react-table` owns UI Table, ProTable and `useQueryTable`, but not the HTTP client. Leaf columns are resizable by default; `resizable: false` opts out, `width` accepts pixel numbers or CSS width strings, and `minWidth` clamps the minimum. Grouped headers resize through leaf columns while headers, cells and the horizontal scroll track share the same leaf widths.
- `@biugle/http` uses `/Users/bexhe/WorkSpace/ts-xhttp/` as its compatibility baseline. Extensions must remain backward compatible.
- i18n, events, bridge, router, store, HTTP, logger, render-code, watermark, icons and query core are framework-neutral reusable packages.
- The Demo is both a showcase, API reference, regression surface and migration guide.

`imd` is used for component behavior and visual design, `design-imile`/`imi` for component and shell patterns, `ds-web` for real form/table pages and query patterns, and `antd`/Radix/Tailwind for mature behavior and implementation primitives. Chart, RichText, Editor and Preview Server remain optional future adapters.

## Package boundaries

See [`docs/package-graph.md`](package-graph.md) for the full graph. The framework-neutral packages are `@biugle/biu-i18n`, `biu-events`, `biu-bridge`, `biu-router`, `biu-store`, `http`, `logger`, `render-code`, `watermark` and `icons`. React packages are `react-components`, `react-form` and `react-table`. `@biugle/tanstack-query` is one package: core/root is framework-neutral and React hooks are exposed from `/react`.

There is no second `biu-ui` implementation, no duplicate foundation Tooltip/Ellipsis/Message, and no private Runtime/Preset forwarding API. Consumers use the public package entries.

## Shared contracts

- Every component root has a stable `biu-ui-*` or `biu-pro-*` class prefix; meaningful internal slots have prefixed classes.
- `className` styles the root, `classNames` styles named slots, and CSS variables expose theme/size/shadow overrides. Tailwind utility classes such as `w-full` remain supported.
- Default semantic colors are primary `#1677ff`, warning `#faad14`, success `#52c41a` and error `#ff4d4f`; warning/success text and soft surfaces use the matching readable strong/border tones.
- Menu item padding stays within 2–4px; hierarchy is expressed by nested wrappers/guides. UI Menu and Preset navigation render at most five levels and ignore children below level five.
- Each item in Favorites, Recent and Search results is split into a left text button and a right “open in new tab” icon button: text opens in the current page, while the icon opens a new tab. Use the shared Tooltip and `newTab` icon; never nest buttons.
- Checkbox, Radio, Switch and adjacent labels share a vertical center line; show-count TextField/Textarea examples share a top baseline with neighboring controls; Demo action groups keep a consistent vertical margin/gap rhythm.
- Buttons never jump on hover. Hover/focus/active and the short pressed state use a subtle semantic border/shadow ring. Every interactive affordance has `cursor:pointer`; disabled controls use `not-allowed`.
- A Button keeps focus after mouse or keyboard activation and uses the same semantic border/shadow ring for hover, active, focus-visible and the short pressed state. Contained `default` buttons use black text; contained `success` buttons use white text. Dark semantic colors must still have a visible click response.
- Dialog, Drawer, Popover, Popconfirm, Select and Date/Time panels are body-mounted portals. Radix owns focus, keyboard, dismiss and collision behavior.
- Select, DatePicker, Popover and Dropdown portals opened inside a Drawer are recognized through the composed event path, so the parent outside-click/focus handling cannot swallow option clicks. Drawer controls keep the PageFilter control height and only expand to the available drawer width.
- Ellipsis shows a Tooltip only on real overflow by default; `alwaysTooltip` opts in to always-on content. Foundation long labels uniformly use Components Ellipsis and Tooltip.

## Unified component catalog

There is one component capability page. It uses one full-width section per component type, renders the interactive effect cases, and ends with a UI Table API reference. The former Pro deep link is kept only as a compatibility alias; the menu no longer splits UI and Pro pages. Enterprise states and richer presets are demonstrated in the same ordered catalog.

- Button/ButtonGroup: seven semantic types, three variants, icons before/after/center, Button-owned `onlyIcon` square actions with Tooltip content, loading, block, shape, readonly, class contracts and click feedback. Callers must not add a second icon-button geometry class or wrap an only-icon Button in another Tooltip.
- TextField/Textarea: stable widths, change/input/clear/count/length/addons/inputProps/autocomplete and error state. Textarea defaults to component-owned bidirectional resizing: a contained corner hit area and small bottom-right drag mark update the outer frame and textarea together, with no browser-native second handle; horizontal/vertical/none are supported and the frame cannot escape its parent.
- InputNumber, Checkbox/Radio groups, Switch, Select, Cascader, DatePicker/RangeDatePicker and TimePicker/RangeTimePicker provide controlled form behavior, locale, custom rendering, disabled states and business-grade options.
- Select also exposes `size="small" | "medium" | "large"` so PageFilter and Toolbar controls share the TextField/Button baseline.
- Date/Time components support `YYYY-MM-DD`, `YYYY-MM-DD HH:mm:ss`, readable format aliases, dayjs, ranges, presets, disabled date/time, needConfirm, footer, 12/24-hour mode and Chinese/English resources. Single-date presets default to Today/Tomorrow/Yesterday, date-range presets default to Last week/Last month, and callers can override either with `presets`; confirmation commits and closes the panel. Range date panels use a direct two-click flow without an extra start/end selector and normalize reversed selections; range time panels keep an existing opposite value or fill the value currently shown by the opposite dropdown when one side is edited. Range panels use equal sides with a centered em dash; time presets default to “Last hour” and “Last day”. The time-range main area shrinks on narrow viewports so the right hour/minute/second controls stay inside the panel.
- Dialog/Drawer, Tooltip/Ellipsis, Popover/Popconfirm, DropdownMenu, Tabs, Menu/Breadcrumb, Pagination, Tree, Transfer, Alert/Empty/Loading/Progress/Tag/Badge/Steps and Upload/File Preview follow the same portal, focus, collision, cursor, class and locale contracts. File rows vertically center the icon, filename and any present metadata, without reserving an empty metadata line.
- Alert and Message both demonstrate multiline content. Their action/close areas use independent right-side grid columns and never overlap; Message supports bounded viewport dragging through `draggable`, while narrow Alerts move the action below the content and keep close on the right.
- PageFilter labels float over the single field border; the wrapper does not create an extra frame, and TextField, Select and Date/Time controls retain their own border, background, default height and focus ring. Its main area uses two equal columns and at most two rows by default; each field is roughly half a column with an approximately 240px cap, while the action cluster stays right-aligned and vertically centered. More filters use secondary outlined, reset uses secondary contained, query uses dark contained, and all three keep the same small size/width with the shared Ellipsis/Tooltip contract for long labels. `maxRows` changes the row limit and `autoCollapse` detects overflow and exposes it in the wider `large` Drawer. The advanced Drawer includes visible filter items and extra fields by default, keeping both surfaces on the same controlled state. FormGroup has title, icon, description, border, columns, gap and slot overrides.
- `Form.Item.tooltip`, `PageFilterItem.tooltip` and `Table.Column.tooltip` each accept a `ReactNode`. They render a shared Tooltip question-mark action after the label or header title, remain vertically centered, and do not add another border or change the control/column size.
- `CopyText` composes `Ellipsis` with a copy action. `text` is the exact clipboard value while `content` only changes rendering; `lines`, `maxWidth`, `alwaysTooltip`, `copyOnHover`, copy labels, `onCopy` and `classNames` are independent API fields. Copying prefers the Clipboard API and falls back to a temporary textarea with `execCommand("copy")` for legacy webviews.
- `Detail` is a configuration-driven read-only record view. Pass `data` and `sections`; `DetailSection` supports `title`, `icon`, `items`, `columns` and `bordered`, while `DetailItem` supports dotted `key/dataIndex` paths, `render`, `span`, `tooltip`, `ellipsis`, `className` and `classNames`. Empty values render as `-`, long values reuse the shared Ellipsis behavior, and the default four-column layout collapses to two and then one column on narrow screens.
- `Form.List` supports heterogeneous controls in one row, add/remove, move up/down, optional drag sorting, `showSort`, and `minRows`/`maxRows` in the `0..99999` range. Each `columns[]` entry also accepts `tooltip?: React.ReactNode`, rendering a vertically centered question-mark Tooltip after that header. Header and rows reuse the same grid tracks; sort index is hidden by default, and when enabled it shares one column with drag/up/down controls. The operation column is fixed right and uses a small secondary action. Row values and sort state are maintained internally with controlled integration available.

### Content navigation and scroll feedback

- `Anchor` scans `h1`–`h5` inside the supplied `container` or the document, supports `levels`/`selector`, generates stable ids for headings without ids, indents links by level, tracks the active heading through `scrollContainer`, scrolls with `offsetTop`, and exposes a collapsible catalog header, independently collapsible level-one/two nodes by default, controlled collapsed keys, `mode="fixed" | "static"`, `position="left" | "right"`, `hideOnMobile`, `onChange`, `maxItems`, `className`, and slot `classNames`. Fixed mode defaults to the right viewport edge, keeps a stable top position, caps its height at 80% of the observed scroll container height, uses one left-side connector line without dots, highlights only the current node, and scrolls only its list; static mode leaves placement to the caller. With `hideOnMobile` enabled, the component is logically not rendered below the mobile breakpoint.
- `ScrollProgress` listens to the window by default and also accepts an HTMLElement, ref, or selector; it calculates `scrollTop / (scrollHeight - clientHeight)`, renders a percentage/progress bar, and shows a compact back-to-top button after `backTopThreshold`. `showPercentage`, `showBackTop`, `behavior`, `mode="fixed" | "static"`, corner positions, `draggable`, `onBackTop`, locale and slot class names are supported. Fixed mode is for page-level feedback and can move within the viewport when `draggable` is enabled; static mode is for cards and caller-controlled layouts and never responds to dragging. Both components clean up scroll/resize/observer listeners and must not introduce duplicate subscriptions or page jank.

## Framework-neutral services

- HTTP preserves ts-xhttp method signatures, defaults, hooks, cancellation, retry, upload progress, response extraction and normalized errors.
- i18n normalizes locale values, defaults to Chinese, keeps independent Chinese/English resources, and uses the original Chinese text as every translation key (for example `$t("列设置")`); English is only the `en-US` value. Runtime switching and fallback remain supported.

### Component locale contract

- Every public component package uses the original Chinese text as the locale key, for example `localeText={{ "列设置": "Columns" }}`. Do not add `localeKeys`, `Record<keyof ...>`, or English-name mappings such as `cancel` and `columnSettings`.
- Visible labels, dynamic messages, button text, placeholders, `aria-label`, `title`, and Tooltip content must come from the package `zh-CN.json`/`en-US.json` resources. Component implementations must not hard-code user-facing text; explicit caller labels remain the highest-priority override.
- Resolve `locale` from the component, then Provider/FormScope, then package Chinese defaults. Merge `localeText` from package defaults, Provider overrides, and component overrides. Dynamic text uses `{text}`, `{count}`, and `{index}` resource placeholders instead of concatenating untranslated fixed text.
- `@biugle/react-components`, `@biugle/react-form`, and `@biugle/react-table` maintain independent resources. Every public API or Demo text change must update both resources, types, tests, API tables, and both language documents.
- Query is a single package with a framework-neutral core and `/react` hooks (`useQuery`, `useMutation`, invalidation and status conventions).
- Store exposes preference/auth/menu/session stores and a standard Zustand pattern.
- Logger provides native console wrappers, console guard/debugger policies, DevTools-open callbacks, colored log methods and throttled callbacks that Watermark can use to refresh after tampering.
- Render Code provides native QR/Barcode SVG/Canvas plus base64 `img` fallback for legacy printing. Watermark is native DOM/SVG and framework independent.

## Foundation boundary and Demo

Menu naming contract: every public menu node `code`, every segment of its `path`, and the matching local page directory must use uppercase-starting camel/PascalCase (for example `ComponentUIShowcase` and `/SystemConfig/UserManagement`). New menu paths must not contain hyphens, underscores, or all-lowercase segments. Navigation renders at most five levels and ignores children below level five. Non-menu identity fields such as `appId`, domains and locale values are excluded.

Preset owns Sidebar, Topbar, Blank, Dashboard, Mobile, Custom, Tabs, Header, menu configuration, overlays, theme and responsive CSS. It does not duplicate UI behavior. Portal and APP remain peers with independent startup, build and deployment; default integration is iframe.

### Non-menu foundation pages

- The default authentication page uses the public Components `TextField` and `Button` for account/password fields and sign-in/register actions. Runtime and the Portal still own SSO navigation, authentication state and business validation.
- Runtime status pages, error boundaries, redacted detail copy and remote APP retry actions use Components `Result`, `Alert`, `Button` and `biuMessage`. The stack `<pre>` remains a dedicated read-only log region rather than being treated as a form control.
- The Demo Portal login, profile, change-password and workbar surfaces use public Components controls. Account panels remain Portal-owned `profilePanel`/`passwordPanel` slots; the foundation never stores passwords or fakes a business API submission.
- Menu trees, tab context menus and sidebar/topbar navigation actions remain Preset-owned navigation skeleton behavior. Remote APP business pages, the native file-input trigger and the error-detail scroll area are explicit non-unification boundaries.

This keeps page controls visually consistent without changing the authentication protocol, menu layout, or business submission contract.

Demo menus use real capability names: Foundation, Components, Form, Table and platform services. The unified Components page shows UI cases and Pro presets in one order, with a dedicated API table directly beneath every component section; the old `ComponentProShowcase` path is only a compatibility deep link and does not maintain a second catalog. The first column must contain one real component name, never a grouped label such as `Checkbox / Radio / Switch`; every property and method gets its own type, default, allowed values/parameters, precise description and runnable example. The final full table is only an index. The single `/TableShowcase` page composes standard filter / toolbar-left-right / Table / footer / Pagination CRUD layout with base Table, ProTable and useQueryTable CRUD/query patterns, with a dedicated API table in each example region, including PageFilter and PageFilterItem, and one consolidated index. It also demonstrates one-row, two-row and overflow filter layouts. Form regions follow the same rule for Form, Form.Item, FormGroup, Form.Grid, Form.Section, Form.List and actions/error summary. ProTable only owns the density, column settings and fullscreen structural tools; create, export, refresh and other business actions are supplied by the caller through toolbar slots. ProTable column settings support visibility, preserve fixed columns, show only a lock icon for fixed columns, and let non-fixed columns use deterministic up/down controls with optional persistence; the settings panel order must remain synchronized with the real table order. Table header text and affordance icons share a vertical center line. Custom Toolbar `ButtonList` actions show icon and label by default; row/default table actions delegate to Button `onlyIcon`, and overflow menu items show text only. Toolbar, Table, footer and Pagination remain independent regions; `ButtonList maxCount` handles row/toolbar action overflow. HTTP/i18n/Query/Store/Logger/Render Code/Watermark pages document methods with examples. Icons support search, categories, broad coverage and copy-to-clipboard.

- API table precision rule: every public property or method occupies its own row; do not combine multiple APIs into a vague `a / b / c` row. Each row contains the component/module, one property or method, its complete TypeScript type, default value, allowed values or method parameters, exact effect/behavior and a runnable example. The renderer must expand legacy grouped source rows instead of displaying them as merged rows. Public type changes must update the Demo tables, bilingual docs and regression tests together. Documentation tables keep horizontal overflow only; the page owns vertical scrolling so stacked regions do not create nested scroll contexts.
- API tables must not use a generic fallback such as “see the public type for details.” After a legacy grouped row is expanded, every property/method needs its own type, default, allowed values/parameters, field-specific behavior description and matching example. Missing metadata must be added to the capability catalogue instead of copying the source row description to every property.
- ProTable column settings update the table and panel immediately after an ordinary column is moved with its up/down controls. Fixed columns cannot be hidden or reordered and show only a lock icon; ordinary columns return to their previous position after being hidden and shown again.
- IconsSearch aligns each icon and its name from the left, keeps the name directly after the icon with Ellipsis support, and uses public Biu controls for search, category, copying, size and color examples.

## Current regression fixes

The current iteration includes explicit Date/Time format examples, responsive time-range sizing, centered range separators, time range presets, global Popover/Popconfirm/Dropdown portal-shell scrollbar protection (the Radix surface itself never uses `overflow-y: auto`; long menus scroll only in their inner list), multiline Message/Alert layouts with a real complex Message surface, centered Steps, blue/brighter semantic colors, stable PageFilter labels without changing child control dimensions, vertically centered FileItem rows, fixed-size text-free Switch, component-owned Textarea frame resizing without a visible handle, and a sized foundation Tooltip trigger so bottom tooltips collide upward correctly. The RangeTimePicker connector is aligned with the actual 30px Select control row rather than the label-plus-control block. Bottom foundation popovers no longer force `position: fixed` on the Radix inner node, and the Drawer Demo uses the default padded Cancel/Confirm footer. Demo action groups keep a consistent vertical rhythm. Foundation toolbar popovers now keep the outer surface non-scrolling; recent/favorite records and search results use Radix's available height as their only internal scroll region, render naturally while content fits, and hide horizontal overflow to prevent nested scrollbars. Menu depth, PageFilter item placement and column-setting visibility/up-down rules are part of this regression contract.

## Delivery gates

```bash
pnpm check
pnpm test
pnpm lint
pnpm format:check
pnpm audit:unused
pnpm verify:scenarios
pnpm build:demo:all
git diff --check
```

Browser acceptance covers foundation collapse/expand and bottom Tooltip/popovers, the unified component order and API table, Button states, Select tags/options, Date/Time ranges, all overlays, Message/Alert, Textarea resize, Switch, Tree/Transfer and every service capability page. Build snapshots in `.biu/`, `dist/`, coverage, caches and logs are generated artifacts and must not be committed. See [`docs/final-delivery-review.md`](final-delivery-review.md) for the delivery audit.

## Additional display primitives

`Typography/Title/Paragraph` provide semantic text layout, and Typography supports `primary/success/warning/error/default` colors. `Space` provides consistent gaps, `List` renders data-driven list items, `ColorPicker` supports controlled values and presets, and `ContextMenu` provides a right-click menu for a content region. `Timeline` renders ordered nodes vertically or horizontally, `Spin` renders standalone or content-overlay loading, `Image` supports constrained sizing, lazy loading, fallback and click preview, and `Notification` exposes a top-right notification API with vertically aligned icon, content and close action. `Affix` provides scroll pinning, `ResizeBox` provides bounded container resizing, and `Box` supports CSS-in-JS object, array and resolver values through `css` and `sx`; merge order is `css < sx < style`. `ConfigProvider` is the global component-tree configuration entry for `locale`, `localeText`, `theme` and `direction`; `ComponentsProvider` remains as a compatibility alias. Upload thumbnails, file status and file previews remain owned by `Upload/FileList/FilePreview` rather than introducing a second upload model.

## Browser regression and documentation archive (2026-09-28)

After restarting port 9002, the following capability surfaces were checked in the browser:

| Surface                 | Result | Evidence                                                                                                                                                                                           |
| ----------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Components              | PASS   | `/ComponentUIShowcase` renders the ordered catalog and 52 regional API tables; Button click feedback and two-axis Textarea dragging were exercised.                                                |
| Form / Table            | PASS   | `/FormShowcase` and `/TableShowcase` render 7 and 19 API tables respectively, with runnable examples.                                                                                              |
| Foundation / overlays   | PASS   | `/FoundationShowcase`, `/PlatformCapabilities`, `/RuntimeCapabilities`, `/RouterMenuShowcase`, `/OverlayShowcase` and `/TooltipEllipsisShowcase` load without build or route errors.               |
| Icons / services        | PASS   | `/IconsSearch`, `/HttpShowcase`, `/I18nShowcase`, `/TanstackQueryShowcase`, `/StoreShowcase`, `/RenderCodeShowcase`, `/WatermarkShowcase` and `/LoggerShowcase` load with examples and API tables. |
| Hierarchical navigation | PASS   | Dashboard uses `/SystemConfig/SystemAdvanced/Dashboard`; Foundation, Platform and Router demos use a complete menu key or unique Code rather than the ambiguous duplicate `Dashboard` Code.        |

## Final regression and handoff status (2026-09-29)

- `TableColumnSettings` now keeps a complete order state: after a non-fixed column is moved with its up/down controls, hiding and showing it again restores its moved relative position. Fixed columns remain locked, visible, non-sortable and at their table boundary. The new regression case brings the React Table functional suite to 22 passing tests.
- `pnpm check`, the full public-package build, `pnpm build:demo:all`, ESLint, Prettier, Knip and direct package test runs passed; 190 tests passed in this run.
- The current execution environment forbids Node/Rsbuild from listening on local ports and forbids the `tsx` IPC pipe (`EPERM`). Therefore 9001/9002 could not be restarted here and the CLI scenario script could not be re-run at process level. This is an environment limitation rather than a source assertion failure; start the services from a terminal that permits local listeners, following the clean-acceptance instructions, before browser acceptance.
- After cleanup, the foundation package `dist/` folders, Demo `dist/` folders and `.biu/foundation` snapshots were regenerated. They remain local acceptance artifacts and must not be committed.

### Documentation and generated-artifact rules

- `docs/biu-foundation-components-capabilities.md` and this English file are the only comprehensive specification and regression archive. The README files index them plus package API/usage manuals.
- `docs/http.md`, `docs/logger.md`, `docs/render-code.md`, `docs/watermark.md` and `docs/package-graph.md` are package manuals or architecture references, not a second Spec set; API changes must still update the comprehensive archive.
- Do not retain or create `docs/specs/`, `docs/en/specs/` or equivalent phase-specific Spec directories. New scope must update the comprehensive archive and obtain user confirmation when it changes the agreed design before source edits.
- `dist/` and `.biu/` are local generated files required by the running CLI/Demo and are never committed. Stop the service before cleaning stale output, rebuild the foundation packages, and then start the Demo to regenerate snapshots; deleting them while the service is running causes missing-module or missing-snapshot errors.
- Before delivery run `git diff --check`, inspect documentation links, `git status --short` and generated-artifact scope. Never reset, checkout or overwrite existing user changes.
