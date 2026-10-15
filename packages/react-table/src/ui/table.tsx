import * as React from "react";
import {
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
  type ColumnDef,
  type ExpandedState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Button, Popover, Select } from "@biugle/react-components";
import { Filter, GripVertical } from "@biugle/icons";
import type { Column, TableFilters, TableProps, TableSorter } from "./types.js";
import { getBiuTableLocaleText } from "../locale/index.js";
import { deriveTableData, paginateTableData, valueAt } from "./data.js";
import { useColumnLayout } from "./use-column-layout.js";
import { useTableColumns } from "./use-table-columns.js";
import { useColumnFillProtection } from "./use-column-fill-protection.js";
import { columnBounds } from "./column-sizing.js";
import { RenderRow } from "./table-row.js";
import { TableHeaderContent } from "./table-header-content.js";
import { TablePagination } from "./table-pagination.js";
import { useTableResize, type ResizePreview } from "./use-table-resize.js";
import { clampRowHeight, rowHeightBounds } from "./row-sizing.js";
import {
  checkboxPropsFor,
  columnLeafCount,
  cx,
  fixedIndexFor,
  leafColumns,
  leafWidth,
  nextSorter,
  offsetFor,
  sumLeafWidths,
  widthValue,
} from "./column-utils.js";

function findColumnPath<T extends object>(columns: Column<T>[], key: string): Column<T>[] | undefined {
  for (const column of columns) {
    if (column.hidden) continue;
    if (column.key === key) return [column];
    if (column.children?.length) {
      const nested = findColumnPath(column.children, key);
      if (nested) return [column, ...nested];
    }
  }
  return undefined;
}

export function Table<T extends object>({
  columns,
  dataSource = [],
  rowKey,
  loading = false,
  error,
  empty,
  loadingContent,
  errorContent,
  className,
  classNames,
  caption,
  stickyHeader = false,
  showHeader = true,
  striped = false,
  pagination,
  sorter,
  onSorterChange,
  filters,
  onFilterChange,
  onChange,
  rowSelection,
  expandable,
  height,
  scroll,
  virtual = false,
  layer = "ui",
  onRow,
  rowClassName,
  expandedRowClassName,
  summary,
  footer,
  components,
  columnWidths,
  defaultColumnWidths,
  onColumnWidthsChange,
  onColumnResize,
  rowHeights,
  defaultRowHeights,
  minRowHeight = 40,
  maxRowHeight = Number.POSITIVE_INFINITY,
  rowResizable = false,
  elasticColumn,
  fillRemainingSpace = true,
  onRowHeightsChange,
  onRowResize,
  locale,
  localeText,
}: TableProps<T>) {
  const text = getBiuTableLocaleText(locale, localeText);
  const emptyContent = empty ?? text["暂无数据"];
  const tableLoadingContent = loadingContent ?? text["加载中…"];
  const tableErrorContent = errorContent ?? text["加载失败，请重试"];
  const [internalSorter, setInternalSorter] = React.useState<TableSorter>();
  const [internalFilters, setInternalFilters] = React.useState<TableFilters>({});
  const [internalExpanded, setInternalExpanded] = React.useState<React.Key[]>(expandable?.defaultExpandedRowKeys ?? []);
  const [internalColumnWidths, setInternalColumnWidths] = React.useState<Record<string, number | string>>(
    defaultColumnWidths ?? {},
  );
  const [internalRowHeights, setInternalRowHeights] = React.useState<Record<string, number>>(defaultRowHeights ?? {});
  const activeRowHeights = rowHeights ?? internalRowHeights;
  const activeColumnWidths = columnWidths ?? internalColumnWidths;
  const [resizePreview, setResizePreview] = React.useState<ResizePreview>();
  const resizePreviewRef = React.useRef<typeof resizePreview>(undefined);
  const resizePreviewElementRef = React.useRef<HTMLSpanElement>(null);
  // Direct DOM updates keep pointer movement independent of the row model.
  // Read the live snapshot on unrelated renders so React cannot restore stale
  // preview widths; controlled state is published only when a change commits.
  const liveResizePreview = resizePreviewRef.current ?? resizePreview;
  const renderColumnWidths = (() => {
    if (liveResizePreview?.axis !== "column") return activeColumnWidths;
    const resizingColumn = leafColumns(columns).find((column) => column.key === liveResizePreview.key);
    const previewWidth = resizingColumn
      ? Math.max(columnBounds(resizingColumn).minimum, liveResizePreview.value)
      : liveResizePreview.value;
    const next = {
      ...activeColumnWidths,
      ...liveResizePreview.widths,
      [liveResizePreview.key]: previewWidth,
    };
    return next;
  })();
  const {
    visibleColumns,
    layoutStretchColumnKey,
    canResizeColumn,
    header,
    headerDepth,
    tableLeafColumns,
    hasResizableColumns,
    hasConfiguredColumnWidths,
    configuredTableMinWidth,
  } = useTableColumns(
    columns,
    activeColumnWidths,
    renderColumnWidths,
    elasticColumn,
    scroll?.x,
    (rowSelection ? 42 : 0) + (expandable ? 42 : 0),
    fillRemainingSpace,
  );
  const resizeFillActive = Boolean(
    liveResizePreview?.axis === "column" && liveResizePreview.fillWidth > 0 && tableLeafColumns.length,
  );
  const firstRightFixedColumnKey = resizeFillActive
    ? tableLeafColumns.find((column) => column.fixed === "right")?.key
    : undefined;
  const resizeFillColumnKey = firstRightFixedColumnKey ?? (resizeFillActive ? tableLeafColumns.at(-1)?.key : undefined);
  const resizeFillPath = resizeFillColumnKey ? findColumnPath(columns, resizeFillColumnKey) : undefined;
  const resizeFillAnchorIndex = resizeFillPath
    ? firstRightFixedColumnKey
      ? Math.max(
          0,
          resizeFillPath.findIndex((column) => {
            const leaves = leafColumns([column]);
            return leaves.length > 0 && leaves.every((leaf) => leaf.fixed === "right");
          }),
        )
      : resizeFillPath.length - 1
    : -1;
  const resizeFillAnchorColumnKey = resizeFillPath?.[resizeFillAnchorIndex]?.key;
  const resizeFillAncestors = new Set(
    resizeFillPath?.slice(0, resizeFillAnchorIndex).map((column) => column.key) ?? [],
  );
  const resizeFillHeaderRowIndex = resizeFillAnchorColumnKey
    ? header.findIndex((row) => row.some((column) => column.key === resizeFillAnchorColumnKey))
    : -1;
  const resizeFillColumnWidth =
    resizeFillActive && liveResizePreview?.axis === "column"
      ? Math.max(
          0,
          liveResizePreview.fillWidth -
            Object.values(liveResizePreview.widths).reduce(
              (sum, width) => sum + width,
              (rowSelection ? 42 : 0) + (expandable ? 42 : 0),
            ),
        )
      : 0;
  const activeSorter = sorter ?? internalSorter;
  const activeFilters = filters ?? internalFilters;
  const derivedData = React.useMemo(
    () => deriveTableData(dataSource, visibleColumns, activeSorter, activeFilters),
    [activeFilters, activeSorter, dataSource, visibleColumns],
  );
  const clientPagination = Boolean(pagination && pagination.total <= dataSource.length);
  const displayedData = React.useMemo(
    () =>
      pagination && clientPagination
        ? paginateTableData(derivedData, pagination.current, pagination.pageSize)
        : derivedData,
    [clientPagination, derivedData, pagination],
  );
  const effectivePagination = pagination
    ? { ...pagination, total: clientPagination ? derivedData.length : pagination.total }
    : undefined;
  const getKey = React.useCallback(
    (record: T, index: number) => {
      // Source indexes keep implicit selection/expansion stable across pages.
      // Explicit rowKey callbacks still receive the rendered row index.
      if (!rowKey) {
        const sourceIndex = dataSource.indexOf(record);
        return String(sourceIndex >= 0 ? sourceIndex : index);
      }
      if (rowKey instanceof Function) return rowKey(record, index);
      const value = record[rowKey];
      return value === undefined || value === null ? String(index) : (value as React.Key);
    },
    [dataSource, rowKey],
  );
  const expandedKeys = expandable?.expandedRowKeys ?? internalExpanded;
  const tableColumns = React.useMemo(
    () =>
      visibleColumns.map<ColumnDef<T, unknown>>((column) => ({
        id: column.key,
        accessorFn: (record: T) => valueAt(record, column),
        header: () => column.title,
      })),
    [visibleColumns],
  );
  const table = useReactTable({
    data: displayedData,
    columns: tableColumns,
    getRowId: (record, index) => String(getKey(record, index)),
    state: { expanded: Object.fromEntries(expandedKeys.map((key) => [String(key), true])) as ExpandedState },
    onExpandedChange: (updater) => {
      const current = Object.keys(table.getState().expanded as Record<string, boolean>);
      const next = typeof updater === "function" ? updater(table.getState().expanded) : updater;
      const keys = Object.entries(next)
        .filter(([, value]) => value)
        .map(([key]) => key);
      if (keys.join(",") !== current.join(",")) setInternalExpanded(keys);
    },
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: (row) =>
      Boolean(expandable && (!expandable.rowExpandable || expandable.rowExpandable(row.original))),
  });
  const rowModel = table.getRowModel().rows;
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const resolvedRowBounds = rowHeightBounds(minRowHeight, maxRowHeight);
  const isRowResizable = (record: T, index: number) =>
    typeof rowResizable === "function" ? rowResizable(record, index) : rowResizable;
  const getRenderedRowHeight = (record: T, index: number, resizable = isRowResizable(record, index)) => {
    const key = String(getKey(record, index));
    const preview =
      liveResizePreview?.axis === "row" && liveResizePreview.key === key ? liveResizePreview.value : undefined;
    const height = preview ?? activeRowHeights[key];
    if (height !== undefined) return clampRowHeight(height, resolvedRowBounds.minimum, resolvedRowBounds.maximum);
    return resizable ? resolvedRowBounds.minimum : undefined;
  };
  const fillProtection = useColumnFillProtection(
    columns,
    activeColumnWidths,
    JSON.stringify([Boolean(rowSelection), Boolean(expandable), scroll?.x, elasticColumn, fillRemainingSpace]),
  );
  const columnLayout = useColumnLayout(
    scrollRef,
    visibleColumns,
    activeColumnWidths,
    layoutStretchColumnKey,
    (rowSelection ? 42 : 0) + (expandable ? 42 : 0),
    scroll?.x,
    fillRemainingSpace && elasticColumn !== false,
    fillProtection.key,
  );
  const displayColumnWidths =
    liveResizePreview?.axis === "column" ? renderColumnWidths : (columnLayout?.widths ?? renderColumnWidths);
  const renderedTableWidth =
    liveResizePreview?.axis === "column"
      ? Math.max(
          liveResizePreview.fillWidth,
          Object.values(liveResizePreview.widths).reduce(
            (sum, width) => sum + width,
            (rowSelection ? 42 : 0) + (expandable ? 42 : 0),
          ),
        )
      : columnLayout?.totalWidth;
  const tableStyle: React.CSSProperties = {
    width:
      renderedTableWidth ??
      (!fillRemainingSpace || elasticColumn === false || scroll?.x === "max-content"
        ? "max-content"
        : (scroll?.x ?? "100%")),
    minWidth: renderedTableWidth ?? configuredTableMinWidth,
    tableLayout: columnLayout || hasConfiguredColumnWidths || hasResizableColumns ? "fixed" : undefined,
  };
  const virtualOptions = typeof virtual === "object" ? virtual : {};
  const virtualizer = useVirtualizer({
    enabled: Boolean(virtual),
    count: virtual ? rowModel.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => {
      const row = rowModel[index];
      return row ? (getRenderedRowHeight(row.original, index) ?? virtualOptions.estimateSize ?? 44) : 44;
    },
    getItemKey: (index) => rowModel[index]?.id ?? index,
    overscan: virtualOptions.overscan ?? 5,
  });
  const effectiveCurrent = effectivePagination?.current;
  const effectivePageSize = effectivePagination?.pageSize;
  React.useLayoutEffect(() => {
    if (effectiveCurrent === undefined || !scrollRef.current) return;
    virtualizer.scrollToOffset(0);
  }, [effectiveCurrent, effectivePageSize, virtualizer]);
  const virtualItems = virtual ? virtualizer.getVirtualItems() : [];
  const selectRow = (record: T, index: number) => {
    if (!rowSelection) return;
    const key = getKey(record, index);
    const current = new Set(rowSelection.selectedRowKeys);
    if (current.has(key)) current.delete(key);
    else current.add(key);
    const keys = [...current];
    const selectedRows = displayedData.filter((item, itemIndex) => keys.includes(getKey(item, itemIndex)));
    rowSelection.onChange(keys, selectedRows);
    rowSelection.onSelect?.(record, !current.has(key), selectedRows);
  };
  const selectAll = () => {
    if (!rowSelection) return;
    const available = displayedData.flatMap((record, index) =>
      checkboxPropsFor(rowSelection, record).disabled ? [] : [{ record, index }],
    );
    const keys = available.map(({ record, index }) => getKey(record, index));
    const allSelected = keys.length > 0 && keys.every((key) => rowSelection.selectedRowKeys.includes(key));
    const next = allSelected
      ? rowSelection.selectedRowKeys.filter((key) => !keys.includes(key))
      : [...new Set([...rowSelection.selectedRowKeys, ...keys])];
    rowSelection.onChange(
      next,
      displayedData.filter((record, index) => next.includes(getKey(record, index))),
    );
    rowSelection.onSelectAll?.(
      !allSelected,
      displayedData.filter((record, index) => next.includes(getKey(record, index))),
      available.map(({ record }) => record),
    );
  };
  const changePagination = (current: number, pageSize: number) => {
    if (!effectivePagination) return;
    const nextPagination = { ...effectivePagination, current, pageSize };
    effectivePagination.onChange?.(current, pageSize);
    onChange?.(nextPagination, activeSorter, activeFilters);
  };
  const updateSorter = (column: Column<T>) => {
    const next = nextSorter(column, activeSorter);
    if (sorter === undefined) setInternalSorter(next);
    onSorterChange?.(next);
    onChange?.(pagination || undefined, next, activeFilters);
  };
  const updateFilter = (key: string, value: unknown) => {
    const next = { ...activeFilters, [key]: value || undefined };
    if (!value) delete next[key];
    if (filters === undefined) setInternalFilters(next);
    onFilterChange?.(next);
    onChange?.(pagination || undefined, activeSorter, next);
  };
  const { beginResize, beginRowResize, resizeColumnByKeyboard, resizeRowByKeyboard } = useTableResize({
    columns,
    columnWidths,
    rowHeights,
    scroll,
    elasticColumn,
    fillRemainingSpace,
    rowSelection,
    expandable,
    onColumnWidthsChange,
    onColumnResize,
    onRowHeightsChange,
    onRowResize,
    visibleColumns,
    activeColumnWidths,
    displayColumnWidths,
    tableStyle,
    hasColumnLayout: Boolean(columnLayout),
    activeRowHeights,
    minRowHeight,
    maxRowHeight,
    layoutStretchColumnKey,
    onWidthCommit: fillProtection.commit,
    setInternalColumnWidths,
    setInternalRowHeights,
    scrollRef,
    resizePreviewRef,
    resizePreviewElementRef,
    setResizePreview,
  });
  const [openFilterKey, setOpenFilterKey] = React.useState<string>();
  const [pendingFilterKeys, setPendingFilterKeys] = React.useState<Record<string, React.Key[]>>({});
  const getFilterKeys = (key: string) => {
    const value = activeFilters[key];
    if (Array.isArray(value)) return value as React.Key[];
    return value === undefined || value === null || value === "" ? [] : [value as React.Key];
  };
  const TableComponent = components?.table ?? "table";
  const HeaderComponent = components?.header ?? "thead";
  const HeaderCellComponent = components?.headerCell ?? "th";
  const BodyComponent = components?.body ?? "tbody";
  const RowComponent = components?.row ?? "tr";
  const CellComponent = components?.cell ?? "td";
  const updateExpand = (record: T, index: number) => {
    const key = getKey(record, index);
    const next = expandedKeys.includes(key) ? expandedKeys.filter((item) => item !== key) : [...expandedKeys, key];
    if (expandable?.expandedRowKeys === undefined) setInternalExpanded(next);
    expandable?.onExpandedRowsChange?.(next);
  };
  const allAvailableKeys = rowSelection
    ? displayedData
        .filter((record) => !checkboxPropsFor(rowSelection, record).disabled)
        .map((record, index) => getKey(record, index))
    : [];
  const allSelected = Boolean(
    rowSelection &&
    allAvailableKeys.length &&
    allAvailableKeys.every((key) => rowSelection.selectedRowKeys.includes(key)),
  );
  const someSelected = Boolean(
    rowSelection && allAvailableKeys.some((key) => rowSelection.selectedRowKeys.includes(key)) && !allSelected,
  );
  const selectAllRef = React.useRef<HTMLInputElement>(null);
  React.useLayoutEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected;
  }, [someSelected]);
  const colSpan = Math.max(
    1,
    visibleColumns.length + (rowSelection ? 1 : 0) + (expandable ? 1 : 0) + (resizeFillActive ? 1 : 0),
  );
  const renderRow = (row: (typeof rowModel)[number], index: number) => {
    const rowResizableValue = isRowResizable(row.original, index);
    return (
      <RenderRow
        key={row.id}
        row={row}
        index={index}
        visibleColumns={visibleColumns}
        rowSelection={rowSelection}
        selected={new Set(rowSelection?.selectedRowKeys ?? [])}
        getKey={getKey}
        onSelect={selectRow}
        expandable={expandable}
        onExpand={updateExpand}
        onRow={onRow}
        rowClassName={rowClassName}
        expandedRowClassName={expandedRowClassName}
        classNames={classNames}
        components={components}
        text={text}
        columnWidths={displayColumnWidths}
        actionViewportWidth={
          columnLayout?.actionViewportWidth ?? (typeof window === "undefined" ? 800 : window.innerWidth)
        }
        resizeFillColumnKey={resizeFillActive ? resizeFillColumnKey : undefined}
        resizeFillPosition={firstRightFixedColumnKey ? "before" : "after"}
        stretchColumnKey={columnLayout || liveResizePreview?.axis === "column" ? undefined : layoutStretchColumnKey}
        rowHeight={getRenderedRowHeight(row.original, index, rowResizableValue)}
        rowResizable={rowResizableValue}
        minRowHeight={resolvedRowBounds.minimum}
        maxRowHeight={resolvedRowBounds.maximum}
        onRowResizeStart={beginRowResize}
        onRowResizeByKeyboard={resizeRowByKeyboard}
      />
    );
  };
  const renderRows = (rows: typeof rowModel) => rows.map(renderRow);
  return (
    <div
      className={cx(
        "biu-table",
        striped && "biu-table--striped",
        resizePreview && "biu-table--resizing",
        loading && "biu-table--loading",
        Boolean(error) && "biu-table--error",
        !displayedData.length && "biu-table--empty",
        className,
        classNames?.root,
      )}
      data-biu-component="table"
      data-biu-layer={layer}
      data-biu-state={loading ? "loading" : error ? "error" : !displayedData.length ? "empty" : "ready"}
    >
      <div
        ref={scrollRef}
        className="biu-table__scroll"
        style={{
          height,
          maxHeight: scroll?.y,
          minHeight: height !== undefined ? 0 : undefined,
          overflow: scroll?.x || scroll?.y || hasResizableColumns || hasConfiguredColumnWidths ? undefined : "hidden",
          overflowX: scroll?.x || hasResizableColumns || hasConfiguredColumnWidths ? "auto" : "hidden",
          overflowY: scroll?.y || height !== undefined ? "auto" : "hidden",
        }}
      >
        <TableComponent className={classNames?.table} style={tableStyle}>
          <colgroup>
            {rowSelection ? <col className="biu-table__selection-col" style={{ width: 42 }} /> : null}
            {expandable ? <col className="biu-table__expand-col" style={{ width: 42 }} /> : null}
            {tableLeafColumns.map((column) => (
              <React.Fragment key={column.key}>
                {resizeFillActive && firstRightFixedColumnKey === column.key ? (
                  <col
                    data-biu-resize-fill
                    className="biu-table__resize-fill-col"
                    style={{ width: resizeFillColumnWidth }}
                  />
                ) : null}
                <col
                  data-biu-column-key={column.key}
                  data-biu-fixed={column.fixed}
                  className={column.actionColumn ? "biu-table__actions-column" : undefined}
                  style={{
                    width:
                      !columnLayout && column.key === layoutStretchColumnKey && liveResizePreview?.axis !== "column"
                        ? undefined
                        : leafWidth(column, displayColumnWidths),
                    minWidth: column.minWidth,
                  }}
                />
              </React.Fragment>
            ))}
            {resizeFillActive && !firstRightFixedColumnKey ? (
              <col
                data-biu-resize-fill
                className="biu-table__resize-fill-col"
                style={{ width: resizeFillColumnWidth }}
              />
            ) : null}
          </colgroup>
          {caption ? <caption>{caption}</caption> : null}
          {showHeader ? (
            <HeaderComponent className={cx(classNames?.header, stickyHeader && "biu-table__header--sticky")}>
              {header.map((row, rowIndex) => (
                <RowComponent key={`header-${rowIndex}`}>
                  {rowIndex === 0 && rowSelection ? (
                    <HeaderCellComponent
                      className="biu-table__selection-cell biu-table__cell--fixed biu-table__cell--fixed-left"
                      rowSpan={headerDepth}
                      style={{ position: "sticky", left: 0, zIndex: 9 }}
                    >
                      <input
                        ref={selectAllRef}
                        type="checkbox"
                        checked={allSelected}
                        onChange={selectAll}
                        aria-label={text["全选"]}
                        disabled={!allAvailableKeys.length}
                      />
                    </HeaderCellComponent>
                  ) : null}
                  {rowIndex === 0 && expandable ? (
                    <HeaderCellComponent
                      className="biu-table__expand-cell biu-table__cell--fixed biu-table__cell--fixed-left"
                      rowSpan={headerDepth}
                      aria-label={text["展开"]}
                      style={{ position: "sticky", left: rowSelection ? 42 : 0, zIndex: 9 }}
                    />
                  ) : null}
                  {row.map((column) => {
                    const hasChildren = Boolean(column.children?.length);
                    const field = column.sortField ?? column.key;
                    const active = activeSorter?.field === field ? activeSorter.order : undefined;
                    const fixedIndex = fixedIndexFor(visibleColumns, column);
                    const fixedStyle =
                      column.fixed && fixedIndex >= 0
                        ? {
                            position: "sticky" as const,
                            [column.fixed]: offsetFor(
                              visibleColumns,
                              fixedIndex,
                              column.fixed,
                              column.fixed === "left" ? (rowSelection ? 42 : 0) + (expandable ? 42 : 0) : 0,
                              displayColumnWidths,
                            ),
                            zIndex: 6,
                          }
                        : undefined;
                    const filterKeys = pendingFilterKeys[column.key] ?? getFilterKeys(column.key);
                    const filtered = getFilterKeys(column.key).length > 0;
                    const filterContent = column.filterDropdown ? (
                      column.filterDropdown({
                        selectedKeys: filterKeys,
                        setSelectedKeys: (keys) =>
                          setPendingFilterKeys((current) => ({ ...current, [column.key]: keys })),
                        confirm: (options) => {
                          const nextValue = column.filterMultiple ? filterKeys : filterKeys[0];
                          updateFilter(column.key, nextValue);
                          if (options?.closeDropdown !== false) setOpenFilterKey(undefined);
                        },
                        clearFilters: () => {
                          setPendingFilterKeys((current) => {
                            const next = { ...current };
                            delete next[column.key];
                            return next;
                          });
                          updateFilter(column.key, undefined);
                          setOpenFilterKey(undefined);
                        },
                        close: () => setOpenFilterKey(undefined),
                        filters: column.filters,
                      })
                    ) : column.filters?.length && !column.filterRender ? (
                      <>
                        <Select
                          className="biu-table__filter-select"
                          aria-label={`${text["筛选"]}${String(column.title)}`}
                          mode={column.filterMultiple ? "multiple" : "single"}
                          value={column.filterMultiple ? filterKeys.map(String) : String(filterKeys[0] ?? "")}
                          options={[
                            ...(!column.filterMultiple ? [{ label: text["全部"], value: "" }] : []),
                            ...column.filters.map((option) => ({
                              label: option.label,
                              value: option.value,
                              disabled: option.disabled,
                            })),
                          ]}
                          onChange={(value) =>
                            setPendingFilterKeys((current) => ({
                              ...current,
                              [column.key]: Array.isArray(value)
                                ? value.map((item) => String(item))
                                : value === undefined || value === null || value === ""
                                  ? []
                                  : [String(value)],
                            }))
                          }
                          allowClear={column.filterMultiple}
                        />
                        <div className="biu-table__filter-actions">
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => {
                              const nextValue = column.filterMultiple ? filterKeys : filterKeys[0];
                              updateFilter(column.key, nextValue);
                              setOpenFilterKey(undefined);
                            }}
                          >
                            {text["应用"]}
                          </Button>
                          <Button
                            type="button"
                            variant="text"
                            size="small"
                            onClick={() => {
                              setPendingFilterKeys((current) => {
                                const next = { ...current };
                                delete next[column.key];
                                return next;
                              });
                              updateFilter(column.key, undefined);
                              setOpenFilterKey(undefined);
                            }}
                          >
                            {text["清除"]}
                          </Button>
                        </div>
                      </>
                    ) : null;
                    const filterTrigger = filterContent ? (
                      <Popover
                        open={openFilterKey === column.key}
                        onOpenChange={(open) => {
                          setOpenFilterKey(open ? column.key : undefined);
                          if (open)
                            setPendingFilterKeys((current) => ({
                              ...current,
                              [column.key]: getFilterKeys(column.key),
                            }));
                        }}
                        content={
                          <div className={cx("biu-table__filter-dropdown", classNames?.filter)}>{filterContent}</div>
                        }
                        minWidth={220}
                        maxWidth={360}
                        classNames={{ content: "biu-table__filter-popover" }}
                      >
                        <button
                          type="button"
                          className="biu-table__filter-button"
                          aria-label={`${text["筛选"]}${String(column.title)}`}
                          aria-pressed={filtered}
                        >
                          {typeof column.filterIcon === "function"
                            ? column.filterIcon(filtered)
                            : (column.filterIcon ?? <Filter size={13} aria-hidden="true" />)}
                        </button>
                      </Popover>
                    ) : null;
                    const isResizeFillAnchor =
                      resizeFillActive &&
                      rowIndex === resizeFillHeaderRowIndex &&
                      column.key === resizeFillAnchorColumnKey;
                    const groupWidth = hasChildren ? sumLeafWidths(column, displayColumnWidths) : undefined;
                    const headerWidth =
                      hasChildren && resizeFillAncestors.has(column.key) && groupWidth !== undefined
                        ? groupWidth + resizeFillColumnWidth
                        : groupWidth;
                    return (
                      <React.Fragment key={column.key}>
                        {isResizeFillAnchor && firstRightFixedColumnKey ? (
                          <HeaderCellComponent
                            className="biu-table__resize-fill-cell"
                            rowSpan={headerDepth - rowIndex}
                            aria-hidden="true"
                          />
                        ) : null}
                        <HeaderCellComponent
                          data-biu-column-key={column.key}
                          data-biu-fixed={fixedIndex >= 0 ? column.fixed : undefined}
                          colSpan={
                            hasChildren
                              ? columnLeafCount(column) + (resizeFillAncestors.has(column.key) ? 1 : 0)
                              : undefined
                          }
                          rowSpan={hasChildren ? undefined : headerDepth - rowIndex}
                          style={{
                            width:
                              hasChildren ||
                              columnLayout ||
                              column.key !== layoutStretchColumnKey ||
                              liveResizePreview?.axis === "column"
                                ? hasChildren
                                  ? headerWidth
                                  : leafWidth(column, displayColumnWidths)
                                : undefined,
                            minWidth: column.minWidth,
                            textAlign: column.align,
                            ...fixedStyle,
                          }}
                          className={cx(
                            classNames?.headerCell,
                            column.className,
                            column.actionColumn && "biu-table__actions-column",
                            canResizeColumn(column) && !hasChildren && "biu-table__header-cell--resizable",
                            column.fixed && "biu-table__cell--fixed",
                            column.fixed === "left" && "biu-table__cell--fixed-left",
                            column.fixed === "right" && "biu-table__cell--fixed-right",
                            column.ellipsis && "biu-table__cell--ellipsis",
                            column.noWrap && "biu-table__cell--nowrap",
                          )}
                          scope="col"
                        >
                          <TableHeaderContent
                            column={column}
                            sortOrder={active}
                            onSort={updateSorter}
                            filterTrigger={filterTrigger}
                            filterValue={activeFilters[column.key]}
                            onFilterChange={(value) => updateFilter(column.key, value)}
                          />
                          {canResizeColumn(column) && !hasChildren ? (
                            <span
                              role="separator"
                              aria-orientation="vertical"
                              aria-label={`${String(column.title)}${text["列宽"]}`}
                              aria-valuemin={columnBounds(column).minimum}
                              aria-valuemax={
                                column.maxWidth !== undefined && Number.isFinite(column.maxWidth)
                                  ? Math.max(
                                      columnBounds(column).maximum,
                                      widthValue(leafWidth(column, displayColumnWidths)) ??
                                        columnBounds(column).minimum,
                                    )
                                  : undefined
                              }
                              aria-valuenow={widthValue(leafWidth(column, displayColumnWidths) ?? column.width)}
                              tabIndex={0}
                              className={cx("biu-table__resize-handle", classNames?.resizeHandle)}
                              onPointerDown={(event) => beginResize(event, column)}
                              onKeyDown={(event) => resizeColumnByKeyboard(event, column)}
                            >
                              <GripVertical size={12} aria-hidden="true" />
                            </span>
                          ) : null}
                        </HeaderCellComponent>
                        {isResizeFillAnchor && !firstRightFixedColumnKey ? (
                          <HeaderCellComponent
                            className="biu-table__resize-fill-cell"
                            rowSpan={headerDepth - rowIndex}
                            aria-hidden="true"
                          />
                        ) : null}
                      </React.Fragment>
                    );
                  })}
                </RowComponent>
              ))}
            </HeaderComponent>
          ) : null}
          <BodyComponent className={classNames?.body}>
            {loading ? (
              <RowComponent>
                <CellComponent colSpan={colSpan} className={classNames?.loading}>
                  {tableLoadingContent}
                </CellComponent>
              </RowComponent>
            ) : error ? (
              <RowComponent>
                <CellComponent colSpan={colSpan} className={classNames?.error}>
                  {tableErrorContent}
                </CellComponent>
              </RowComponent>
            ) : !rowModel.length ? (
              <RowComponent>
                <CellComponent colSpan={colSpan} className={classNames?.empty}>
                  {emptyContent}
                </CellComponent>
              </RowComponent>
            ) : virtual ? (
              <>
                {virtualItems.length ? (
                  <RowComponent aria-hidden="true">
                    <CellComponent
                      colSpan={colSpan}
                      style={{ height: virtualItems[0]?.start ?? 0, padding: 0, border: 0 }}
                    />
                  </RowComponent>
                ) : null}
                {virtualItems.map((item) => (
                  <React.Fragment key={rowModel[item.index]?.id}>
                    {rowModel[item.index] ? renderRow(rowModel[item.index], item.index) : null}
                  </React.Fragment>
                ))}
                {virtualItems.length ? (
                  <RowComponent aria-hidden="true">
                    <CellComponent
                      colSpan={colSpan}
                      style={{
                        height: Math.max(
                          0,
                          virtualizer.getTotalSize() - (virtualItems[virtualItems.length - 1]?.end ?? 0),
                        ),
                        padding: 0,
                        border: 0,
                      }}
                    />
                  </RowComponent>
                ) : null}
              </>
            ) : (
              renderRows(rowModel)
            )}
          </BodyComponent>
          {summary ? (
            <tfoot className={classNames?.summary}>
              <RowComponent>
                <CellComponent colSpan={colSpan}>{summary(derivedData)}</CellComponent>
              </RowComponent>
            </tfoot>
          ) : null}
        </TableComponent>
        {liveResizePreview ? (
          <span
            aria-hidden="true"
            className={cx(
              "biu-table__resize-preview",
              liveResizePreview.axis === "column"
                ? "biu-table__resize-preview--column"
                : "biu-table__resize-preview--row",
            )}
            style={
              liveResizePreview.axis === "column"
                ? { left: liveResizePreview.position }
                : { top: liveResizePreview.position }
            }
            ref={resizePreviewElementRef}
          />
        ) : null}
      </div>
      {footer ? <div className={cx("biu-table__footer", classNames?.footer)}>{footer}</div> : null}
      {effectivePagination ? (
        <TablePagination
          pagination={effectivePagination}
          className={classNames?.pagination}
          pageSizeText={text["条/页"]}
          onChange={changePagination}
        />
      ) : null}
    </div>
  );
}

export type { Column, TableProps, TableSorter } from "./types.js";
