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

The query function receives an `AbortSignal` and may return `items/total`, `data/total`, or the legacy `results/pagination.totalResult` response shape. Request clients, filters and domain fields remain owned by the application.

Table 的默认空态、加载态、分页、列设置、表格密度和无障碍文案为中文。`Table`、`TablePagination`、`TableEmpty`、`TableLoading`、`ProTable` 和 `TableColumnSettings` 支持 `locale` 与 `localeText`，`localeText` 的 key 始终使用中文原文，例如 `localeText={{ "列设置": "Columns" }}`；显式的 `empty`、`loadingContent`、`errorContent`、`previousText` 和 `nextText` 会覆盖资源。中英文默认资源位于 `src/locale/zh-CN.json` 和 `src/locale/en-US.json`。
每个 `Column` 都可以单独配置 `tooltip?: React.ReactNode`。传入后，表头列名右侧会显示垂直居中的问号图标，hover/focus 使用公共 Tooltip 展示列说明；标题文本、排序图标和说明 Tooltip 均有独立元素，普通、可排序和分组表头共用对齐结构。Tooltip 两层包装与 SVG 以文本 span 的中心对齐，不使用图标偏移；它不改变列宽、排序按钮或筛选按钮的布局。
带 `dataSource` 的本地表格会按当前筛选、排序状态派生可见行，并在 `pagination.total <= dataSource.length` 时裁切本地分页；服务端 `useQueryTable` 返回的分页数据会保留服务端分页语义。受控的 `sorter`/`filters` 仍通过对应回调由调用方管理。

`ProTable` 在 UI Table 之上提供列设置、密度和全屏三个结构工具。新增、导出、刷新及其他业务按钮全部由调用方通过 `toolbarLeft`、`toolbarRight` 或 `toolbarActions` 传入，组件不会擅自生成 CRUD 动作。密度菜单底部提供可关闭的空心 `重置表格` 操作，恢复默认密度、列显示/顺序和非受控的宽高状态，并清理 `columnStorageKey`。列设置同时负责列显隐和顺序：固定列保留原位置，前面显示锁图标且不可隐藏或排序；非 `fixed` 列在设置面板中通过每行最前面的上移/下移按钮排序，顺序立即同步面板和表格顺序。顺序通过 `onColumnKeysChange` 回传，并可由 `columnStorageKey` 持久化。`batchActions` 接收 `{ selectedKeys, selectedRows, dataSource }`，仅在有选中行时可用。异步动作会进入 loading 状态，异常通过 `onActionError` 交给业务处理；需要 CSV 时可直接调用公开的 `buildCsv` 或由业务自行实现导出。

ProTable 的标准 CRUD 工具区按 `toolbarLeft`、业务 `toolbarRight`/`toolbarActions`、密度、列设置、全屏的顺序组织；密度、列设置和全屏均可独立关闭，全部关闭时不渲染分隔线。列设置中的固定列只显示锁图标且不可隐藏或排序，普通列使用每行最前面的上移/下移按钮调整顺序，并立即同步表格顺序、受控回调和可选的 localStorage。表头标题、排序、筛选和列宽图标共享垂直居中基线。`Table.footer` 是表格滚动区与 Pagination 之间的独立区域，Toolbar、footer 与 Pagination 不互相污染。

Table Pagination inherits the responsive three-band layout: below 560px it shows only the current page with previous/next actions; from 560px through 799px it keeps the full page list, hides the optional range/total and sets the page-size and quick-jump controls to 45px; at 800px and wider it uses the standard layout and the configured `quickJumperWidth` (90px by default). Set `pagination.responsive={false}` to disable these viewport adjustments.

固定列在桌面端和窄视口中均保持 sticky 定位、不透明背景、层级和边界阴影，横向滚动只发生在表格内容区。只有明确设置 `resizable: true` 的固定叶子列可调整自身：`fixed: "left"` 使用物理右侧内边界，右拖变宽；`fixed: "right"` 使用物理左侧内边界，左拖变宽。键盘左右箭头移动同一物理边界，因此右固定列的 ArrowLeft 增宽；固定列的边界和方向不随 RTL 镜像。其它列拖动、容器变化与余量分配仍不能改变固定列宽。

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

`Table` 与 `ProTable` 的 `fillRemainingSpace` 默认 true。表格只指定一个稳定的动态普通列：显式 `elasticColumn` 指定的列；未指定时使用最后一个可见普通叶子列。调整其他普通列时，以这一动态列作为固定平衡点，从当前提交宽度逐步调整；不会逐列传递、切换到相邻列，也不会每次提交后自动拉回视口最大宽度。动态列的可用范围、表格现有填充槽和目标列边界共同决定实际接受的变化量。直接调整动态列时由最近前置普通列等量反向补偿，任一列到达边界后拖动停止，不继续缩小动态列并新建尾部空白；动态列扩宽时可先消耗已有填充槽余量。指针直接拖动动态列时仅预览线随指针移动，目标列和前置补偿列在 pointerup 时一起提交；拖动其他普通列仍实时预览宽度。后续调整其他列仍由原动态列渐进参与平衡。fixed、操作列、选择/展开辅助列不参与补偿。动态自动填充或平衡时可超过 `maxWidth`；用户直接拖动的目标仍遵守 `minWidth`/`maxWidth`。显式 false 关闭填充与补偿，使用真实内容总宽；`elasticColumn=false` 和 `scroll.x="max-content"` 保留相同的独立调整语义。精确内容短于视口时，fixed 列仍锚定物理视口边缘，因此 LTR 空白可能位于普通列与右固定列之间，RTL 空白可能位于左固定列与普通列之间；普通列尾边界仍随被接受的指针增量移动。外部宽度映射变化、重置或列结构变化会清除手动宽度保护。受控调用方应应用 `onColumnWidthsChange` 的完整最终映射，而不能只保存目标列。

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
