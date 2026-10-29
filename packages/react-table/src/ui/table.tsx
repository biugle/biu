import * as React from "react";
import {
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
  type ColumnDef,
  type ExpandedState,
} from "@tanstack/react-table";
import { Button, Popover, Select } from "@biugle/react-components";
import { Filter, GripVertical } from "@biugle/icons";
import type { Column, TableFilters, TableProps, TableSorter } from "./types.js";
import { getBiuTableLocaleText } from "../locale/index.js";
import { deriveTableData, normalizeFilterKeys, paginateTableData, valueAt } from "./data.js";
import { useColumnLayout } from "./use-column-layout.js";
import { useTableColumns } from "./use-table-columns.js";
import { useColumnFillProtection } from "./use-column-fill-protection.js";
import { columnBounds } from "./column-sizing.js";
import { createTableExpandHandler, RenderRow } from "./table-row.js";
import { TableHeaderContent } from "./table-header-content.js";
import { TablePagination } from "./table-pagination.js";
import { useTableResize, type ResizePreview } from "./use-table-resize.js";
import { TableResizePreview } from "./table-resize-preview.js";
import { getPreviewColumnWidths } from "./table-preview-widths.js";
import { useTableResizeLayout } from "./use-table-resize-layout.js";
import { getTableScrollStyle } from "./table-scroll-style.js";
import { getTableWidthStyle } from "./table-width-style.js";
import { useTableSelection } from "./use-table-selection.js";
import { useTableRowKey } from "./use-table-row-key.js";
import { useTableVirtualizer } from "./use-table-virtualizer.js";
import { fixedColumnStyle, useFixedColumnStyles } from "./use-fixed-column-styles.js";
import { clampRowHeight, rowHeightBounds } from "./row-sizing.js";
import {
  columnLeafCount,
  cx,
  fixedIndexFor,
  leafWidth,
  nextSorter,
  sumLeafWidths,
  widthValue,
} from "./column-utils.js";

export function Table<T extends object>({
  dir = "ltr",
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
  const renderColumnWidths = getPreviewColumnWidths(columns, activeColumnWidths, liveResizePreview);
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
  const getKey = useTableRowKey(dataSource, rowKey);
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
  const dynamicFillColumnKey = fillProtection.fillKey ?? layoutStretchColumnKey;
  const columnLayout = useColumnLayout(
    scrollRef,
    visibleColumns,
    activeColumnWidths,
    dynamicFillColumnKey,
    (rowSelection ? 42 : 0) + (expandable ? 42 : 0),
    scroll?.x,
    fillRemainingSpace && elasticColumn !== false,
    fillProtection.keys,
    fillProtection.fillPinned,
    fillProtection.fillViewportWidth,
  );
  const resizeLayout = useTableResizeLayout({
    columns,
    tableLeafColumns,
    header,
    preview: liveResizePreview,
    columnLayout,
    fillPinned: fillProtection.fillPinned,
    hasRowSelection: Boolean(rowSelection),
    hasExpandable: Boolean(expandable),
  });
  const {
    active: resizeFillActive,
    firstRightFixedColumnKey,
    columnKey: resizeFillColumnKey,
    anchorColumnKey: resizeFillAnchorColumnKey,
    ancestors: resizeFillAncestors,
    headerRowIndex: resizeFillHeaderRowIndex,
    columnWidth: resizeFillColumnWidth,
  } = resizeLayout;
  const displayColumnWidths =
    liveResizePreview?.axis === "column" ? renderColumnWidths : (columnLayout?.widths ?? renderColumnWidths);
  const {
    selectedKeySet: selectedRowKeySet,
    selectRow,
    selectAll,
    allAvailableKeys,
    allSelected,
    selectAllRef,
  } = useTableSelection({
    rowSelection,
    displayedData,
    getKey,
  });
  const rowFixedStyles = useFixedColumnStyles(
    visibleColumns,
    displayColumnWidths,
    (rowSelection ? 42 : 0) + (expandable ? 42 : 0),
  );
  const tableStyle = getTableWidthStyle({
    preview: liveResizePreview,
    columnLayout,
    configuredMinWidth: configuredTableMinWidth,
    fillRemainingSpace,
    elasticColumn,
    horizontalWidth: scroll?.x,
    selectionWidth: rowSelection ? 42 : 0,
    expandable: Boolean(expandable),
    hasColumnLayout: Boolean(columnLayout),
    hasConfiguredColumnWidths,
    hasResizableColumns,
  });
  const { virtualizer, virtualItems } = useTableVirtualizer({
    virtual,
    rows: rowModel,
    scrollRef,
    estimateRowHeight: getRenderedRowHeight,
  });
  const effectiveCurrent = effectivePagination?.current;
  const effectivePageSize = effectivePagination?.pageSize;
  React.useLayoutEffect(() => {
    if (effectiveCurrent === undefined || !scrollRef.current) return;
    virtualizer.scrollToOffset(0);
  }, [effectiveCurrent, effectivePageSize, virtualizer]);
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
    virtual,
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
    protectedFillKeys: fillProtection.keys,
    dynamicFillKey: dynamicFillColumnKey,
    fillPinned: fillProtection.fillPinned,
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
  const TableComponent = components?.table ?? "table";
  const HeaderComponent = components?.header ?? "thead";
  const HeaderCellComponent = components?.headerCell ?? "th";
  const BodyComponent = components?.body ?? "tbody";
  const RowComponent = components?.row ?? "tr";
  const CellComponent = components?.cell ?? "td";
  const updateExpand = createTableExpandHandler(expandedKeys, expandable, getKey, setInternalExpanded);
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
        fixedStyles={rowFixedStyles}
        rowSelection={rowSelection}
        selected={selectedRowKeySet}
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
      dir={dir}
      data-biu-component="table"
      data-biu-layer={layer}
      data-biu-state={loading ? "loading" : error ? "error" : !displayedData.length ? "empty" : "ready"}
    >
      <div
        ref={scrollRef}
        className="biu-table__scroll"
        style={getTableScrollStyle({
          height,
          scroll,
          hasResizableColumns,
          hasConfiguredColumnWidths,
        })}
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
                    const fixedStyle = fixedColumnStyle(
                      visibleColumns,
                      column,
                      fixedIndex,
                      displayColumnWidths,
                      column.fixed === "left" ? (rowSelection ? 42 : 0) + (expandable ? 42 : 0) : 0,
                      6,
                    );
                    const filterKeys = pendingFilterKeys[column.key] ?? normalizeFilterKeys(activeFilters[column.key]);
                    const filtered = normalizeFilterKeys(activeFilters[column.key]).length > 0;
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
                              [column.key]: normalizeFilterKeys(activeFilters[column.key]),
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
                              className={cx(
                                "biu-table__resize-handle",
                                fillRemainingSpace !== false &&
                                  elasticColumn !== false &&
                                  scroll?.x !== "max-content" &&
                                  dynamicFillColumnKey === column.key &&
                                  "biu-table__resize-handle--dynamic",
                                classNames?.resizeHandle,
                              )}
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
              rowModel.map(renderRow)
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
        <TableResizePreview preview={liveResizePreview} previewRef={resizePreviewElementRef} />
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
