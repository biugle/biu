# @biugle/react-components

React UI primitives, enterprise Pro components and `fire` body mounting utilities. The package root exports Pro components; `@biugle/react-components/ui` exports composable UI parts.

```bash
pnpm add @biugle/react-components react react-dom
```

```tsx
import { Button, Dialog, PageBox, fire, message } from "@biugle/react-components";
import "@biugle/react-components/styles.css";

<PageBox title="用户管理" actions={<Button>新增</Button>} />;
fire(Dialog)({ title: "详情", children: <p>业务内容由调用方提供。</p> });
message.success("保存成功");
```

The default entry is the Pro layer with stable presets and component-prefixed classes. Use the UI entry when you need to assemble a structure yourself:

```tsx
import { Dialog, DialogBody, DialogFooter, DialogHeader, DialogTitle } from "@biugle/react-components/ui";
```

`fire(Component)(props)` mounts any React component under `body` and returns `{ update, close, destroy }`. `fire.node(node)` mounts an existing node, while `fire.render(({ close, update }) => node)` is intended for fully custom content.

UI `Popover`, `Popconfirm` and `DropdownMenu` accept Button-like interactive triggers and manage toggle, outside click, Escape and accessibility state. `Popover`/`Popconfirm` support width constraints; `DropdownMenu` supports checkbox/radio/submenu items, header/footer slots and a `dropdownRender` wrapper. `Ellipsis` includes overflow detection and Tooltip. `CopyText` composes `Ellipsis` with a copy action: `text` is the exact clipboard value, `content` can customize the rendered value, and `copyOnHover` hides the action until hover/focus. Copying prefers `navigator.clipboard.writeText` and falls back to a temporary textarea with `document.execCommand("copy")` for older webviews. Pro `Dialog` and `Drawer` add preset sizes, async confirmation, footer, mask closing, four-way placement and fullscreen Drawer behavior.

The UI entry includes the main catalog used by the Demo: controls (`TextField`, `Textarea`, `InputNumber`, `Select`, `Cascader`, `DatePicker`, `RangeDatePicker`, `TimePicker`, `RangeTimePicker`, `Checkbox`, `CheckboxGroup`, `Radio`, `RadioGroup`, `Switch`), navigation and data display (`Tabs`, `DropdownMenu`, `Menu`, `Tree`, `Transfer`, `Pagination`, `Tag`, `Progress`, `Anchor`, `ScrollProgress`, `Detail`), overlays and feedback (`Tooltip`, `Ellipsis`, `CopyText`, `Popover`, `Popconfirm`, `Dialog`, `Drawer`, `Alert`, `Empty`, `Loading`), layout (`Box`, `Stack`, `Grid`, `Card`, `Divider`, `ScrollArea`, `Collapsible`, `Steps`) and file capabilities (`Upload`, `FileList`, `FileCard`, `FilePreview`, `FilePreviewDialog`, `FileRender`). `SearchTextField`, `Autocomplete` and `Skeleton` remain deprecated compatibility exports only; they are not part of the new main catalog or Demo order. The root/Pro entry re-exports the UI components and adds PageBox, PageFilter (with the floating-label `PageFilterItem` / `PageFilter.Item`), Result and Confirm presets.

`Switch` keeps `checkedChildren` and `unCheckedChildren` as compatibility props, but its visual track intentionally never renders text: provide `aria-label` (or a nearby label) for the accessible state name. Select multi-value tags and dropdown/menu labels use shrinkable content layers so long values remain inside their collision-constrained panels. Date preset labels use `Ellipsis` and inherit its Tooltip behavior.

`PageFilterItem.tooltip` renders a question-mark action after the floating label and uses the shared `Tooltip`; it does not add another field border. The same contract is available on table `Column.tooltip`, where the question mark is vertically aligned with the header title. Both props accept any `ReactNode`.

`Detail` renders configuration-driven read-only records. Pass `data` and `sections`; each `DetailSection` supports `title`, `icon`, `items`, `columns` and `bordered`, while each `DetailItem` supports `key`/`dataIndex` (including dotted paths), `title`, `render`, `span`, `tooltip`, `ellipsis`, `className` and `classNames`. Values default to `-` when empty, long values use the shared Ellipsis contract, and responsive layouts collapse from four columns to two and then one column.

`Select` accepts `size="small" | "medium" | "large"`; `small` is the compact geometry used by `PageFilter` and table toolbars. `Button` accepts `onlyIcon` for independent icon actions; Button owns the square geometry, icon centering, removal of the visible label node and Tooltip rendering. Pass `tooltip` to override the Tooltip content. `ButtonList` accepts a semantic `items` array and `maxCount`. Text actions render their icon and label by default; pass `iconOnly` for table-row actions and it delegates to Button `onlyIcon`. The overflow trigger is also a Button-owned icon-only action, and its DropdownMenu items intentionally render text labels without duplicate icons while invoking the same `onClick` callback.

`Textarea` owns one resize contract: `resize="both" | "horizontal" | "vertical" | "none"`. The visible control and its outer frame update together. A contained 24px corner target (`data-biu-resize-handle="true"`) with a small bottom-right drag mark is the only affordance; the browser-native second handle is disabled, so resizing cannot escape the component frame and `className="w-full"` remains stable.

The package uses Radix primitives for overlay behavior and Tailwind CSS for the compiled style layer while retaining `biu-ui-*`/`biu-pro-*` classes, CSS variables and `className`/`classNames` overrides. Group controls support vertical layout and `optionRender`; Alert supports custom icon, description, action and close slots. `Textarea` uses one component-owned resize contract (`resize="both" | "horizontal" | "vertical" | "none"`) with a max-width boundary, a small bottom-right drag mark, and no browser-native second handle. Range date/time controls use a direct range interaction: dates are chosen in two consecutive clicks and normalized into start/end order; time controls keep the opposite value or fill its visible default when one side is edited. `PageFilter` supports `PageFilter.Item` floating labels plus `moreFields` in a body-mounted Drawer. Each direct field control receives `w-full` while preserving caller classes, so it fills its responsive Grid track; the action cluster occupies the final track without extra padding, the inline area is limited to two rows by default (`maxRows`), and overflow fields are automatically exposed through the Drawer (`autoCollapse`). The Drawer includes visible filter items by default (`includeVisibleFieldsInDrawer`) so controlled field state stays synchronized, defaults to the wider `large` preset, and supports controlled `drawerOpen`, `drawerTitle`, `drawerWidth`, `drawerFooter` and Drawer class-name overrides. Chart, RichText, Editor and Preview Server are intentionally excluded from this base package and may be added later as optional adapters.

`Anchor` scans a configurable content container for `h1`–`h5`, generates missing stable ids, highlights the current heading while the window or a specified scroll container moves, and scrolls to a selected heading with `offsetTop` support. With `collapsible`, the catalog header and the configured heading levels (level one and two by default) can be collapsed independently through controlled or uncontrolled keys. `mode="fixed"` places the catalog near the configured left or right viewport edge, caps it below the viewport height, and scrolls only its list; `mode="static"` keeps it in normal flow so the caller controls its placement. `hideOnMobile` is a logical render guard (enabled by default), so the catalog is not mounted below the mobile breakpoint. `ScrollProgress` measures the same window/container boundary, renders a compact percentage progress indicator and exposes a thresholded smooth “回到顶部” button. It supports all four fixed viewport corners and `mode="static"` for embedding inside cards or custom layouts. Both components keep stable root/slot classes, accept `className`/`classNames`, clean up observers/listeners on unmount, and use the component locale contract for default labels.

默认文案为中文。使用 `ComponentsProvider locale="en-US"` 可切换内置英文资源；也可以在组件上使用 `locale` 和 `localeText`，例如 `Dialog localeText={{ "确定": "Continue" }}`。`localeText` 的 key 始终使用中文原文，组件内部的可见文案、动态文案、`aria-label` 和 `title` 也统一走同一资源，不维护英文属性名映射。中英文资源位于包内 `src/locale/zh-CN.json`、`src/locale/en-US.json`，并通过 `locale/zh-CN.json`、`locale/en-US.json` 公开。
