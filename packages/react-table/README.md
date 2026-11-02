# @biugle/react-table

Enterprise React table rendering and query state. The package root exports the Pro table; `@biugle/react-table/ui` exports composable table structure parts. `useQueryTable` handles server pagination, filters, sorting, loading, errors and refetch without owning a request client.

```bash
pnpm add @biugle/react-table react
```

```tsx
import { Table, useQueryTable } from "@biugle/react-table";
import "@biugle/react-table/styles.css";

const table = useQueryTable({
  queryKey: ["users"],
  params: { keyword },
  queryFn: ({ pagination, params, signal }) =>
    request("/users", { signal, data: { ...params, page: pagination.current, size: pagination.pageSize } }),
});

<Table columns={columns} {...table.tableProps} />;
```

The query function receives an `AbortSignal` and may return `items/total`, `data/total`, or the legacy `results/pagination.totalResult` response shape. `normalizeQueryTableResponse` accepts only arrays as items, retains a valid total and falls back to the safe array length when total is missing or invalid. Malformed list values therefore yield an empty list and a fallback total of zero without reading an invalid `length`. Query-key `stableSerialize` handles circular arrays/objects with the existing `[Circular]` marker and preserves repeated non-circular references. Request clients, filters and domain fields remain owned by the application.

Table defaults to Chinese text for empty/loading states, pagination, column settings, density and accessible labels. `Table`, `TablePagination`, `TableEmpty`, `TableLoading`, `ProTable` and `TableColumnSettings` accept `locale` and `localeText`. Override keys use Chinese source text, for example `localeText={{ "列设置": "Columns" }}`; explicit `empty`, `loadingContent`, `errorContent`, `previousText` and `nextText` take precedence. Default resources live in `src/locale/zh-CN.json` and `src/locale/en-US.json`. Column resizing, filtering and column-order controls separate English words in their accessible labels and tooltips, while preserving Chinese labels and caller-supplied spacing. ReactNode headers derive accessible labels and CSV headings from nested text and fall back to the column key when no readable text is available; custom components are never executed to obtain text. CSV cell values and quoting rules remain unchanged.
Each `Column` accepts `tooltip?: React.ReactNode`, adding a vertically centered question-mark action after the header title. Hover and focus use the shared Tooltip. Separate title, sorting and hint elements align consistently in plain, sortable and grouped headers without changing column width or action layout.
A local table with `dataSource` derives visible rows from current filters and sorting and applies local pagination when `pagination.total <= dataSource.length`. Server-paginated `useQueryTable` results retain server pagination semantics. Controlled `sorter` and `filters` remain caller-owned through their callbacks.

`ProTable` adds column settings, density and fullscreen tools above UI Table. The caller supplies create, export, refresh and other business actions through `toolbarLeft`, `toolbarRight` or `toolbarActions`; the component does not generate CRUD actions. The density menu includes an optional outlined Reset table action that restores default density, visibility, order and uncontrolled sizes and clears `columnStorageKey`. Column settings keep fixed columns locked in their original positions; ordinary columns use leading up/down controls. `onColumnKeysChange` reports order, and `columnStorageKey` enables persistence. `batchActions` receives `{ selectedKeys, selectedRows, dataSource }` and is available only with selected rows. Async actions show loading and report failures through `onActionError`. Use the public `buildCsv` helper or application-owned export logic for CSV.

The standard ProTable toolbar orders `toolbarLeft`, business `toolbarRight`/`toolbarActions`, density, column settings and fullscreen. Each structural tool can be disabled independently; no separator renders when all are disabled. Table titles, sorting, filtering and resize icons share a vertical center line. `Table.footer` is an independent region between scrolling content and Pagination; Toolbar, footer and Pagination retain separate boundaries.

Table Pagination inherits the responsive three-band layout: below 560px it shows only the current page with previous/next actions; from 560px through 799px it keeps the full page list, hides the optional range/total and sets the page-size and quick-jump controls to 45px; at 800px and wider it uses the standard layout and the configured `quickJumperWidth` (90px by default). Set `pagination.responsive={false}` to disable these viewport adjustments.

Fixed columns retain sticky positioning, opaque backgrounds, stacking and boundary shadows at desktop and narrow viewports; horizontal scrolling stays within table content. Only explicitly resizable fixed leaves expose handles: `fixed: "left"` resizes its physical right inner edge and grows when dragged right, while `fixed: "right"` resizes its physical left inner edge and grows when dragged left. Keyboard arrows move the same physical edge, so ArrowLeft grows a right-fixed column. RTL does not mirror these fixed edges. Other-column resizing, container changes and surplus distribution cannot change fixed widths.

```tsx
<ProTable
  {...tableProps}
  toolbarRight={
    <>
      <Button onClick={() => openCreateForm()}>新增</Button>
      <Button onClick={() => exportRows(tableProps.dataSource ?? [])}>导出</Button>
    </>
  }
  batchActions={[{ key: "disable", label: "批量停用", onClick: ({ selectedRows }) => disableRows(selectedRows) }]}
/>
```

## Table advanced contracts

UI `Table` also exposes the enterprise cases that are easy to miss when only
looking at the basic example:

- `Column.filterDropdown(context)` receives `selectedKeys`,
  `setSelectedKeys`, `confirm`, `clearFilters`, `close` and `filters`. The
  panel is mounted through the Components `Popover`, so it keeps keyboard,
  outside-click and collision behavior instead of requiring a second dropdown
  implementation.
- Column width resizing is opt-in: only a leaf column with `resizable: true`
  renders a handle. On desktop, every column handle uses the same hover, focus
  and active visibility; coarse-pointer devices show enabled handles with a
  subtle resting affordance. `minWidth`/`maxWidth` control the clamped range. `width`
  accepts a pixel number or CSS width string as the initial/fixed width. Grouped
  headers resize through their leaf columns, and the header, body cells and
  horizontal scroll track share the same leaf-column widths. `columnWidths`/
  `defaultColumnWidths` and `onColumnWidthsChange` provide a controlled
  contract; `onColumnResize` reports each clamped width.
  Pointerup commits an effective change once; a no-op pointer or keyboard
  adjustment publishes nothing, so CSS/percentage widths stay responsive. A
  direct pointer drag on the dynamic leaf moves only its guide until pointerup,
  when its width and the compensating neighbor are applied together; other
  ordinary leaves retain live width previews.
  Pointercancel, blur, changed sizing props or viewport geometry cancel and
  clean up the session. `fillRemainingSpace` defaults to true and fills through
  one stable dynamic ordinary leaf: `elasticColumn`, or the final visible
  ordinary leaf when no key is supplied. Resizing another ordinary leaf uses
  that dynamic leaf as the stable balance point. Each adjustment starts from its
  currently committed width and progresses with the accepted pointer delta; the
  role never jumps to an adjacent column or refills to the viewport maximum
  after every commit. Its handle stays at the logical trailing edge (right in
  LTR, left in RTL). Directly resizing the dynamic leaf uses the nearest
  preceding ordinary leaf as the opposing balance; when resizing another leaf,
  the dynamic leaf absorbs the change first and its preceding ordinary leaf
  absorbs only any remainder after a bound. Accepted target movement is capped
  by the available capacity of its compensation columns. A direct dynamic-leaf
  drag stops when its preceding neighbor reaches a bound instead of creating a
  new trailing spacer; existing spacer slack can be consumed when the dynamic
  leaf grows. The committed dynamic width
  stays selected instead of moving the fill role to a neighbor. Automatic fill and balancing may exceed `maxWidth`. Fixed/action
  and 42px selection/expansion columns never absorb another column's resize or
  viewport surplus. An explicitly resizable
  fixed leaf adjusts its own physical inner boundary: right edge for
  `fixed: "left"` and left edge for `fixed: "right"`. Dragging right grows a
  left-fixed column, while dragging left grows a right-fixed column. Keyboard
  arrows move that same physical boundary, so ArrowLeft grows a right-fixed
  column. These fixed-column edges and directions do not mirror in RTL.
  Previously resized leaves keep their chosen widths. The dynamic leaf keeps the
  same identity after it is directly resized; that action pins its selected width
  and leaves viewport surplus in the spacer. A later resize of another ordinary
  leaf adjusts the designated dynamic leaf from its current committed width.
  Available spacer slack or the resize bounds handle any remaining difference,
  producing gradual adjustments instead of a jump to a different column. Fixed,
  action and auxiliary widths remain unchanged, and a
  direct drag respects the target's configured min/max range. Automatic fill or
  balancing may exceed `maxWidth` to avoid a blank tail. Viewport changes keep the
  designated dynamic key and protect manually resized leaves; reset,
  external width-map changes or column-structure changes release that protection. `onColumnWidthsChange` reports
  the complete final distribution once, while `onColumnResize` reports the same
  exact target width. Controlled callbacks may be accepted
  asynchronously or refused without forcing the new layout. Equivalent fresh
  column arrays and width-map copies preserve an active session.
  `fillRemainingSpace={false}`, `elasticColumn={false}` and `scroll.x="max-content"` opt into exact content
  widths and independent resizing without filling or compensation. Overflow
  stays within the table scroll region; when exact content is narrower than the
  viewport, fixed columns remain anchored to their physical viewport edges,
  which can leave unused space between ordinary and fixed columns. Ordinary-column trailing handles,
  pointer deltas and keyboard arrows mirror in RTL, including negative
  horizontal scroll offsets. The
  guide stops at the accepted min/max boundary when the pointer exceeds it.
- `Column.actionColumn` marks a row-action column and excludes it from filling
  and compensation. Its default width follows the browser viewport: 60px below
  560px, 160px from 560px through 799px, and 190px at 800px and above. An
  explicit `width` or controlled `columnWidths` value takes precedence.
  Resizing still requires `resizable: true`, including for fixed action columns.
  An icon-only `ButtonList` in an action cell receives the Table-computed
  default `maxCount`: 1 below 560px, 3 from 560px through 799px, and 5 at
  800px and above. Counts include the overflow button and shrink when the
  rendered cell is narrower; explicit ButtonList limits always take precedence.
  Standalone ButtonList keeps its own responsive defaults. Table pagination is
  centered consistently across UI Table and ProTable.
- `striped` is opt-in and defaults to `false`. When enabled, even body rows use
  a very light grey surface, while hover keeps the stronger shared hover surface;
  fixed cells follow the same row background.
- Row resizing is opt-in through `rowResizable: true` or a per-row callback;
  `minRowHeight`/`maxRowHeight`, `rowHeights`/`defaultRowHeights`, `onRowHeightsChange` and
  `onRowResize` provide the controlled contract. A row handle is rendered only
  for enabled rows. Pointerup commits the clamped row height; the density
  menu's reset-table action restores the default size state.
  The preview line follows the accepted cell boundary while dragging. Configured
  or resized widths exceeding the container scroll only within table content;
  without `scroll.y`/`height`, no extra inner vertical scrollbar is introduced.
- Cells wrap by default and keep `6px` padding on all sides. Set
  `ellipsis` to use the shared Ellipsis/Tooltip behavior, or set `noWrap` to
  keep a column on one line; an unbounded `noWrap` column may grow to fit its
  content. A column with neither option wraps and increases the row height.
- `Column.tooltip` adds the shared help Tooltip after the header title. Plain,
  sortable and grouped headers separately wrap text, sort icons and help hints.
  Both Tooltip layers and the SVG center on the actual title span without icon
  offsets or changes to column widths.
- `rowSelection.onSelect` and `rowSelection.onSelectAll` report the changed
  record set. `expandedRowClassName` styles the expanded row without replacing
  the stable `biu-table-*` classes.
- `components.table/header/headerCell/body/row/cell` are real render slots,
  not declaration-only types. Every slot receives the original table props and
  keeps the Biu class names unless the replacement explicitly overrides them.

All public slots remain prefixed and can be extended with `className`,
`classNames`, inline CSS variables and Tailwind utility classes.

## Remaining-space sizing

`fillRemainingSpace` is the explicit choice for Table and ProTable. Its default
`true` chooses one stable dynamic ordinary leaf: `elasticColumn` when provided,
otherwise the final visible ordinary leaf. Resizing another ordinary leaf uses
that same dynamic leaf as the balance point, starting from its current committed
width and preserving the gradual change across repeated drags. The role never
moves to a neighbor or snaps back to the viewport maximum after each commit.
The dynamic handle stays at the logical trailing edge (right in LTR, left in
RTL). Resizing the dynamic leaf itself adjusts the nearest preceding ordinary
leaf in the opposite direction; the paired resize stops when either leaf
reaches a configured bound, so it cannot create a new trailing spacer.
Resizing another ordinary leaf is absorbed by the dynamic leaf first; the
preceding ordinary leaf absorbs only any remainder after a dynamic-column
bound. Accepted movement is capped by the available compensation capacity,
while existing spacer slack can be consumed when the dynamic leaf grows. The
selected dynamic width is preserved on commit. Set it to
`false` when exact independent content widths and deliberate spare space are
desired. Legacy `elasticColumn={false}` and `scroll.x="max-content"` also select
independent mode. When dragging the dynamic leaf, its preceding ordinary leaf
balances the change; other ordinary-leaf drags progress through the dynamic
leaf from its current committed width.
When exact content is narrower than the viewport, fixed columns remain anchored
to their physical viewport edges, which can leave unused space between ordinary
and fixed columns. Ordinary trailing resize boundaries still follow the accepted
pointer delta.

`Table` and `ProTable` accept `dir="ltr" | "rtl"` and default to LTR. Direction
is opt-in per instance; these components do not read Runtime or ConfigProvider
direction. RTL mirrors reading-start text alignment and ordinary-column resize
edges. A column's explicit `align="left" | "right"` remains physical, while the
default alignment follows the selected reading start. Fixed-column resize edges
remain on their physical inner sides.

### Table

| Component | Property           | TypeScript type   | Default                     | Values                   | Behavior                                                                                                                                                                                                                                                                                                                                                                                       | Example                                                                    |
| --------- | ------------------ | ----------------- | --------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Table     | fillRemainingSpace | `boolean`         | true                        | true, false              | Uses one stable dynamic ordinary column. Direct resize balances it one-to-one with the preceding ordinary column and stops when either reaches a bound, avoiding a new trailing spacer; other columns use the dynamic leaf first, then its preceding neighbor after a bound. Its handle stays on the logical trailing edge. False disables filling/compensation and keeps exact content width. | `<Table columns={columns} dataSource={rows} fillRemainingSpace={false} />` |
| Table     | dir                | `"ltr" \| "rtl"`  | `"ltr"`                     | `ltr`, `rtl`             | Sets this Table instance's direction explicitly. RTL mirrors reading-start text alignment and ordinary-column resize edges; omission uses LTR and does not inspect global Runtime direction. Explicit Column `align="left" \| "right"` stays physical.                                                                                                                                         | `<Table dir="rtl" columns={columns} dataSource={rows} />`                  |
| Table     | elasticColumn      | `string \| false` | final visible ordinary leaf | ordinary leaf key, false | Selects the stable dynamic leaf; direct resize pairs it with the preceding ordinary leaf and stops when either reaches a bound. It stays the balance point for other drags and keeps its handle on the logical trailing edge. False disables dynamic filling and compensation.                                                                                                                 | `<Table columns={columns} dataSource={rows} elasticColumn="updatedAt" />`  |

### ProTable

| Component | Property           | TypeScript type   | Default                     | Values                   | Behavior                                                                                                                                                                                                                                                                                          | Example                                                                       |
| --------- | ------------------ | ----------------- | --------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| ProTable  | fillRemainingSpace | `boolean`         | true                        | true, false              | Forwards the stable Table balance point. Direct resize pairs the dynamic leaf with its preceding ordinary leaf and stops at either bound, avoiding a new trailing spacer; other ordinary-column resizes use the dynamic leaf first, then its preceding neighbor. False keeps exact content width. | `<ProTable columns={columns} dataSource={rows} fillRemainingSpace={false} />` |
| ProTable  | dir                | `"ltr" \| "rtl"`  | `"ltr"`                     | `ltr`, `rtl`             | Sets the direction for the ProTable shell and its Table. Omission uses the LTR default; RTL mirrors reading-start alignment and ordinary-column resize edges without consulting global direction.                                                                                                 | `<ProTable dir="rtl" columns={columns} dataSource={rows} />`                  |
| ProTable  | elasticColumn      | `string \| false` | final visible ordinary leaf | ordinary leaf key, false | Forwards the stable Table dynamic-leaf selection; other-column changes are absorbed by it first, while direct resize pairs it with the preceding ordinary leaf and stops at either bound. Its handle stays on the logical trailing edge. False disables dynamic filling and compensation.         | `<ProTable columns={columns} dataSource={rows} elasticColumn="updatedAt" />`  |

## Demo and performance contract

The companion Demo keeps these contracts visible in `/TableShowcase`, which combines UI Table, ProTable, EditableTable, query and resize APIs. Separate standard-page routes cover tabbed CRUD, tabless CRUD and EditableTable; `TableResizeShowcase` isolates bounded, row-only, elastic and non-elastic resize behavior. Use these pages when checking column geometry, pagination, filters or locale.

For large local data sets, `virtual` is opt-in and must receive a bounded scroll viewport. Normal tables keep their existing wrapping, fixed-column and pagination behavior. Resize sessions use one document-level pointer lifecycle, update the preview DOM during movement and commit controlled state on pointerup; cleanup also runs on pointercancel and window blur. This keeps pointer movement responsive without changing the rendered data contract.

`EditableTable` is the opt-in editing wrapper. Double-click an editable cell
to use the shared TextField, Select, InputNumber, Textarea, DatePicker or
TimePicker editor. Enter/blur saves text-like editors, while Select/date/time
values stay in draft while the picker is open and are committed with the
save action. Every editor exposes three compact outlined mouse actions above
the control: grey `取消编辑`, red `清空编辑值` and green `保存编辑`; all three
actions have a border. Clearing keeps the editor focused and does not commit. Text-like editors still save
on blur, and Escape remains available for keyboard users. `onEditAction` and
the specific `onEditStart`, `onEditSave`, `onEditCancel`, `onEditClear` and
`onEditBlur` callbacks expose the same action context without replacing the
default flow. Set
`editable.renderEditor` to provide a custom editor with `draft`, `setDraft`,
`save`, `cancel` and `clear` actions; `editable.onDoubleClick` observes the
entry event. `onChange` returns the updated data plus the changed row, column
and value.
