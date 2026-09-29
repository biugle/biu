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
每个 `Column` 都可以单独配置 `tooltip?: React.ReactNode`。传入后，表头列名右侧会显示垂直居中的问号图标，hover/focus 使用公共 Tooltip 展示列说明；它不改变列宽、排序按钮或筛选按钮的布局。
带 `dataSource` 的本地表格会按当前筛选、排序状态派生可见行，并在 `pagination.total <= dataSource.length` 时裁切本地分页；服务端 `useQueryTable` 返回的分页数据会保留服务端分页语义。受控的 `sorter`/`filters` 仍通过对应回调由调用方管理。

`ProTable` 在 UI Table 之上提供列设置、密度和全屏三个结构工具。新增、导出、刷新及其他业务按钮全部由调用方通过 `toolbarLeft`、`toolbarRight` 或 `toolbarActions` 传入，组件不会擅自生成 CRUD 动作。列设置同时负责列显隐和顺序：固定列保留原位置，前面显示锁图标且不可隐藏或排序；非 `fixed` 列在设置面板中通过每行最前面的上移/下移按钮排序，顺序立即同步面板和表格顺序。顺序通过 `onColumnKeysChange` 回传，并可由 `columnStorageKey` 持久化。`batchActions` 接收 `{ selectedKeys, selectedRows, dataSource }`，仅在有选中行时可用。异步动作会进入 loading 状态，异常通过 `onActionError` 交给业务处理；需要 CSV 时可直接调用公开的 `buildCsv` 或由业务自行实现导出。

ProTable 的标准 CRUD 工具区按 `toolbarLeft`、业务 `toolbarRight`/`toolbarActions`、密度、列设置、全屏的顺序组织；密度、列设置和全屏均可独立关闭，全部关闭时不渲染分隔线。列设置中的固定列只显示锁图标且不可隐藏或排序，普通列使用每行最前面的上移/下移按钮调整顺序，并立即同步表格顺序、受控回调和可选的 localStorage。表头标题、排序、筛选和列宽图标共享垂直居中基线。`Table.footer` 是表格滚动区与 Pagination 之间的独立区域，Toolbar、footer 与 Pagination 不互相污染。

固定列在桌面端保持不透明背景、层级和边界阴影；在 `640px` 及以下的窄视口中，表体固定列会自动释放 sticky 定位并保留横向滚动，避免多个固定列覆盖筛选按钮和表格内容，表头仍支持吸顶。

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
- Every leaf column has a resize handle by default; set `resizable: false` to
  opt out. `minWidth` controls the clamped minimum. `width` accepts a pixel
  number or CSS width string as the initial/fixed width. Grouped headers resize
  through their leaf columns, and the header, body cells and horizontal scroll
  track share the same leaf-column widths. `columnWidths`/
  `defaultColumnWidths` and `onColumnWidthsChange` provide a controlled
  contract; `onColumnResize` reports each clamped width.
- `rowSelection.onSelect` and `rowSelection.onSelectAll` report the changed
  record set. `expandedRowClassName` styles the expanded row without replacing
  the stable `biu-table-*` classes.
- `components.table/header/headerCell/body/row/cell` are real render slots,
  not declaration-only types. Every slot receives the original table props and
  keeps the Biu class names unless the replacement explicitly overrides them.

All public slots remain prefixed and can be extended with `className`,
`classNames`, inline CSS variables and Tailwind utility classes.
