import * as React from "react";
import {
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
  type ColumnDef,
  type ExpandedState,
  type Row,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Button, Ellipsis, Popover, Select, Tooltip } from "@biugle/react-components";
import { ArrowDown, ArrowDownUp, ArrowUp, CircleHelp, Filter, GripVertical, Minus, Plus } from "@biugle/icons";
import type { Column, TableFilters, TableProps, TableSorter } from "./types.js";
import { getBiuTableLocaleText, type BiuTableLocaleText } from "../locale/index.js";
import { deriveTableData, paginateTableData, valueAt } from "./data.js";

function cx(...values: Array<React.ReactNode | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function nextSorter<T extends object>(column: Column<T>, current?: TableSorter): TableSorter | undefined {
  if (!column.sortable && !column.sorter) return current;
  const field = column.sortField ?? column.key;
  if (current?.field !== field) return { field, order: "ascend" };
  if (current.order === "ascend") return { field, order: "descend" };
  return undefined;
}

function checkboxPropsFor<T extends object>(selection: TableProps<T>["rowSelection"], record: T) {
  return selection?.getCheckboxProps?.(record) ?? {};
}

function offsetFor<T extends object>(columns: Column<T>[], index: number, side: "left" | "right", leading = 0) {
  const relevant = columns.filter((column) => column.fixed === side);
  const preceding = side === "left" ? relevant.slice(0, index) : relevant.slice(index + 1);
  return preceding.reduce<number | string>((total, column) => {
    const width = column.width ?? 120;
    if (typeof total === "string" || typeof width === "string") {
      const left = typeof total === "number" ? `${total}px` : total;
      const right = typeof width === "number" ? `${width}px` : width;
      return `calc(${left} + ${right})`;
    }
    return Number(total) + Number(width);
  }, leading);
}

function leafColumns<T extends object>(columns: Column<T>[]): Column<T>[] {
  return columns.flatMap((column) => (column.children?.length ? leafColumns(column.children) : [column]));
}

function applyColumnWidths<T extends object>(
  columns: Column<T>[],
  widths: Record<string, number | string>,
): Column<T>[] {
  return columns.map((column) => ({
    ...column,
    width: column.children?.length ? column.width : (widths[column.key] ?? column.width),
    children: column.children?.length ? applyColumnWidths(column.children, widths) : column.children,
  }));
}

function widthValue(width: number | string | undefined): number | undefined {
  if (typeof width === "number" && Number.isFinite(width)) return width;
  if (typeof width !== "string") return undefined;
  const value = Number.parseFloat(width);
  return Number.isFinite(value) && /^\s*\d+(?:\.\d+)?px\s*$/i.test(width) ? value : undefined;
}

function columnWidth<T extends object>(column: Column<T>, widths: Record<string, number | string>) {
  return widths[column.key] ?? column.width;
}

function leafWidth<T extends object>(column: Column<T>, widths: Record<string, number | string>) {
  return columnWidth(column, widths);
}

function sumLeafWidths<T extends object>(
  column: Column<T>,
  widths: Record<string, number | string>,
): number | undefined {
  if (!column.children?.length) return widthValue(leafWidth(column, widths));
  const values: Array<number | undefined> = column.children.map((child) => sumLeafWidths(child, widths));
  return values.every((value): value is number => value !== undefined)
    ? values.reduce((total, value) => total + value, 0)
    : undefined;
}

function columnDepth<T extends object>(columns: Column<T>[]): number {
  return columns.reduce(
    (depth, column) => Math.max(depth, column.children?.length ? 1 + columnDepth(column.children) : 1),
    1,
  );
}

function columnLeafCount<T extends object>(column: Column<T>): number {
  return column.children?.length ? column.children.reduce((count, child) => count + columnLeafCount(child), 0) : 1;
}

function headerRows<T extends object>(columns: Column<T>[]) {
  const rows: Array<Column<T>[]> = [];
  const visit = (items: Column<T>[], level: number) => {
    rows[level] ??= [];
    for (const item of items) {
      rows[level].push(item);
      if (item.children?.length) visit(item.children, level + 1);
    }
  };
  visit(columns, 0);
  return rows;
}

function resolvedSpan<T extends object>(span: Column<T>["colSpan"] | Column<T>["rowSpan"], record: T) {
  return typeof span === "function" ? span(record) : span;
}

interface RenderRowProps<T extends object> {
  row: Row<T>;
  index: number;
  visibleColumns: Column<T>[];
  rowSelection?: TableProps<T>["rowSelection"];
  selected: Set<React.Key>;
  getKey: (record: T, index: number) => React.Key;
  onSelect: (record: T, index: number) => void;
  expandable?: TableProps<T>["expandable"];
  onExpand: (record: T, index: number) => void;
  onRow?: TableProps<T>["onRow"];
  rowClassName?: TableProps<T>["rowClassName"];
  expandedRowClassName?: TableProps<T>["expandedRowClassName"];
  classNames?: TableProps<T>["classNames"];
  components?: TableProps<T>["components"];
  text: BiuTableLocaleText;
}

function RenderRow<T extends object>({
  row,
  index,
  visibleColumns,
  rowSelection,
  selected,
  getKey,
  onSelect,
  expandable,
  onExpand,
  onRow,
  rowClassName,
  expandedRowClassName,
  classNames,
  components,
  text,
}: RenderRowProps<T>) {
  const record = row.original;
  const key = getKey(record, index);
  const Row = components?.row ?? "tr";
  const Cell = components?.cell ?? "td";
  const checkboxProps = checkboxPropsFor(rowSelection, record);
  const expandableAllowed = Boolean(expandable && (!expandable.rowExpandable || expandable.rowExpandable(record)));
  const rowProps = onRow?.(record, index);
  const cells = visibleColumns.map((column) => {
    const fixedIndex = visibleColumns.filter((item) => item.fixed === column.fixed && item.fixed).indexOf(column);
    const fixedStyle = column.fixed
      ? {
          position: "sticky" as const,
          [column.fixed]: offsetFor(
            visibleColumns,
            fixedIndex,
            column.fixed,
            column.fixed === "left" ? (rowSelection ? 42 : 0) + (expandable ? 42 : 0) : 0,
          ),
          zIndex: 4,
        }
      : undefined;
    return (
      <Cell
        key={column.key}
        className={cx(
          classNames?.cell,
          column.className,
          column.fixed && "biu-table__cell--fixed",
          column.fixed === "left" && "biu-table__cell--fixed-left",
          column.fixed === "right" && "biu-table__cell--fixed-right",
          column.ellipsis && "biu-table__cell--ellipsis",
        )}
        style={{
          width: column.width,
          maxWidth: typeof column.ellipsis === "object" ? column.ellipsis.maxWidth : undefined,
          textAlign: column.align,
          ...fixedStyle,
        }}
        colSpan={resolvedSpan(column.colSpan, record)}
        rowSpan={resolvedSpan(column.rowSpan, record)}
      >
        {(() => {
          const value =
            column.renderCell || column.render
              ? (column.renderCell ?? column.render)?.(valueAt(record, column), record, index)
              : (valueAt(record, column) as React.ReactNode);
          return column.ellipsis ? (
            <Ellipsis
              content={value}
              maxWidth={typeof column.ellipsis === "object" ? column.ellipsis.maxWidth : undefined}
              className="biu-table__ellipsis"
            >
              {value}
            </Ellipsis>
          ) : (
            value
          );
        })()}
      </Cell>
    );
  });
  return (
    <React.Fragment key={String(key)}>
      <Row
        {...rowProps}
        className={cx(
          classNames?.row,
          rowProps?.className,
          typeof rowClassName === "function" ? rowClassName(record, index) : rowClassName,
          row.getIsExpanded() && "biu-table__row--expanded",
        )}
      >
        {rowSelection ? (
          <Cell
            className="biu-table__selection-cell biu-table__cell--fixed biu-table__cell--fixed-left"
            style={{ position: "sticky", left: 0, zIndex: 7 }}
          >
            <input
              type="checkbox"
              checked={selected.has(key)}
              disabled={checkboxProps?.disabled}
              aria-label={
                checkboxProps?.["aria-label"] ?? text["选择第 {index} 行"].replace("{index}", String(index + 1))
              }
              onChange={() => onSelect(record, index)}
            />
          </Cell>
        ) : null}
        {expandable ? (
          <Cell
            className="biu-table__expand-cell biu-table__cell--fixed biu-table__cell--fixed-left"
            style={{ position: "sticky", left: rowSelection ? 42 : 0, zIndex: 7 }}
          >
            {expandableAllowed ? (
              <button
                type="button"
                className="biu-table__expand-button"
                aria-label={row.getIsExpanded() ? text["收起行"] : text["展开行"]}
                aria-expanded={row.getIsExpanded()}
                onClick={() => onExpand(record, index)}
              >
                <span aria-hidden="true">{row.getIsExpanded() ? <Minus size={14} /> : <Plus size={14} />}</span>
              </button>
            ) : null}
          </Cell>
        ) : null}
        {cells}
      </Row>
      {row.getIsExpanded() ? (
        <Row
          className={cx(
            classNames?.expanded,
            "biu-table__expanded-row",
            typeof expandedRowClassName === "function" ? expandedRowClassName(record, index) : expandedRowClassName,
          )}
        >
          <Cell colSpan={visibleColumns.length + (rowSelection ? 1 : 0) + (expandable ? 1 : 0)}>
            {expandable?.expandedRowRender(record, index)}
          </Cell>
        </Row>
      ) : null}
    </React.Fragment>
  );
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
  pagination,
  sorter,
  onSorterChange,
  filters,
  onFilterChange,
  onChange,
  rowSelection,
  expandable,
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
  locale,
  localeText,
}: TableProps<T>) {
  const text = getBiuTableLocaleText(locale, localeText);
  const emptyContent = empty ?? text["暂无数据"];
  const tableLoadingContent = loadingContent ?? text["加载中…"];
  const tableErrorContent = errorContent ?? text["加载失败，请重试"];
  const paginationText = getBiuTableLocaleText(
    typeof pagination === "object" ? (pagination.locale ?? locale) : locale,
    {
      ...localeText,
      ...(typeof pagination === "object" ? pagination.localeText : undefined),
    },
  );
  const [internalSorter, setInternalSorter] = React.useState<TableSorter>();
  const [internalFilters, setInternalFilters] = React.useState<TableFilters>({});
  const [internalExpanded, setInternalExpanded] = React.useState<React.Key[]>(expandable?.defaultExpandedRowKeys ?? []);
  const [internalColumnWidths, setInternalColumnWidths] = React.useState<Record<string, number | string>>(
    defaultColumnWidths ?? {},
  );
  const activeColumnWidths = columnWidths ?? internalColumnWidths;
  const resolvedColumns = React.useMemo(
    () => applyColumnWidths(columns, activeColumnWidths),
    [activeColumnWidths, columns],
  );
  const activeSorter = sorter ?? internalSorter;
  const activeFilters = filters ?? internalFilters;
  const visibleColumns = React.useMemo(
    () => leafColumns(resolvedColumns.filter((column) => !column.hidden)),
    [resolvedColumns],
  );
  const header = React.useMemo(() => headerRows(resolvedColumns.filter((column) => !column.hidden)), [resolvedColumns]);
  const headerDepth = React.useMemo(
    () => columnDepth(resolvedColumns.filter((column) => !column.hidden)),
    [resolvedColumns],
  );
  const tableLeafColumns = visibleColumns;
  const explicitTableWidth = React.useMemo(() => {
    const widths = tableLeafColumns.map((column) => widthValue(column.width));
    return widths.every((width): width is number => width !== undefined)
      ? widths.reduce((total, width) => total + width, 0) + (rowSelection ? 42 : 0) + (expandable ? 42 : 0)
      : undefined;
  }, [expandable, rowSelection, tableLeafColumns]);
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
      // Keep the implicit key stable when client pagination changes the visible
      // index.  Using the page-local index makes row selection/expansion point
      // at a different record after moving between pages.  Explicit rowKey
      // callbacks still receive the rendered row index for compatibility.
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
  const virtualOptions = typeof virtual === "object" ? virtual : {};
  const virtualizer = useVirtualizer({
    enabled: Boolean(virtual),
    count: virtual ? rowModel.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => virtualOptions.estimateSize ?? 44,
    overscan: virtualOptions.overscan ?? 5,
  });
  const effectiveCurrent = effectivePagination?.current;
  const effectivePageSize = effectivePagination?.pageSize;
  const [quickPage, setQuickPage] = React.useState(String(effectiveCurrent ?? 1));
  React.useEffect(() => {
    setQuickPage(String(effectiveCurrent ?? 1));
  }, [effectiveCurrent]);
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
  const resizeState = React.useRef<
    | {
        key: string;
        pointerId: number;
        startX: number;
        startWidth: number;
        minWidth: number;
        baseWidths: Record<string, number | string>;
      }
    | undefined
  >(undefined);
  const resizeCleanupRef = React.useRef<(() => void) | undefined>(undefined);
  const updateResizeAt = (clientX: number) => {
    const state = resizeState.current;
    if (!state) return;
    const nextWidth = Math.max(state.minWidth, Math.round(state.startWidth + clientX - state.startX));
    const next = { ...state.baseWidths, [state.key]: nextWidth };
    if (columnWidths === undefined) setInternalColumnWidths(next);
    onColumnWidthsChange?.(next);
    onColumnResize?.(state.key, nextWidth);
  };
  const finishResize = () => {
    resizeCleanupRef.current?.();
    resizeState.current = undefined;
  };
  const beginResize = (event: React.PointerEvent, column: Column<T>) => {
    if (!column.resizable) return;
    event.preventDefault();
    event.stopPropagation();
    resizeCleanupRef.current?.();
    const headerCell = event.currentTarget.closest("th");
    const measuredWidth = headerCell?.getBoundingClientRect().width ?? 0;
    const currentWidth = measuredWidth || Number(column.width ?? 120);
    resizeState.current = {
      key: column.key,
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: Number.isFinite(currentWidth) ? currentWidth : 120,
      minWidth: Math.max(48, column.minWidth ?? 72),
      baseWidths: activeColumnWidths,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const move = (nativeEvent: PointerEvent) => {
      const state = resizeState.current;
      if (!state || state.pointerId !== nativeEvent.pointerId) return;
      updateResizeAt(nativeEvent.clientX);
      nativeEvent.preventDefault();
    };
    const up = () => finishResize();
    window.addEventListener("pointermove", move, true);
    window.addEventListener("pointerup", up, true);
    window.addEventListener("pointercancel", up, true);
    resizeCleanupRef.current = () => {
      window.removeEventListener("pointermove", move, true);
      window.removeEventListener("pointerup", up, true);
      window.removeEventListener("pointercancel", up, true);
      resizeCleanupRef.current = undefined;
    };
  };
  React.useEffect(
    () => () => {
      resizeCleanupRef.current?.();
      resizeState.current = undefined;
    },
    [],
  );
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
  const colSpan = Math.max(1, visibleColumns.length + (rowSelection ? 1 : 0) + (expandable ? 1 : 0));
  const pageCount = effectivePagination
    ? Math.max(1, Math.ceil(effectivePagination.total / Math.max(1, effectivePagination.pageSize)))
    : 1;
  const pageItems = React.useMemo<Array<number | "ellipsis">>(() => {
    if (!effectivePagination || effectivePagination.simple) return [];
    if (pageCount <= (effectivePagination.showLessItems ? 5 : 7))
      return Array.from({ length: pageCount }, (_, index) => index + 1);
    const current = effectivePagination.current;
    const pages = new Set([1, pageCount, current, Math.max(1, current - 1), Math.min(pageCount, current + 1)]);
    const sorted = [...pages].sort((a, b) => a - b);
    const result: Array<number | "ellipsis"> = [];
    sorted.forEach((page, index) => {
      if (index > 0 && page - sorted[index - 1] > 1) result.push("ellipsis");
      result.push(page);
    });
    return result;
  }, [effectivePagination, pageCount]);
  const paginationHidden = Boolean(effectivePagination?.hideOnSinglePage && pageCount <= 1);
  const rangeStart = effectivePagination
    ? Math.min(effectivePagination.total, (effectivePagination.current - 1) * effectivePagination.pageSize + 1)
    : 0;
  const rangeEnd = effectivePagination
    ? Math.min(effectivePagination.total, effectivePagination.current * effectivePagination.pageSize)
    : 0;
  const renderRows = (rows: typeof rowModel) =>
    rows.map((row, index) => (
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
      />
    ));
  return (
    <div
      className={cx(
        "biu-table",
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
        style={{ maxHeight: scroll?.y, overflowY: scroll?.y ? "auto" : undefined }}
      >
        <TableComponent className={classNames?.table} style={{ minWidth: scroll?.x ?? explicitTableWidth }}>
          <colgroup>
            {rowSelection ? <col className="biu-table__selection-col" style={{ width: 42 }} /> : null}
            {expandable ? <col className="biu-table__expand-col" style={{ width: 42 }} /> : null}
            {tableLeafColumns.map((column) => (
              <col key={column.key} style={{ width: leafWidth(column, activeColumnWidths) }} />
            ))}
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
                    const fixedIndex = visibleColumns
                      .filter((item) => item.fixed === column.fixed && item.fixed)
                      .indexOf(column);
                    const fixedStyle =
                      column.fixed && !hasChildren
                        ? {
                            position: "sticky" as const,
                            [column.fixed]: offsetFor(
                              visibleColumns,
                              fixedIndex,
                              column.fixed,
                              column.fixed === "left" ? (rowSelection ? 42 : 0) + (expandable ? 42 : 0) : 0,
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
                    return (
                      <HeaderCellComponent
                        key={column.key}
                        colSpan={hasChildren ? columnLeafCount(column) : undefined}
                        rowSpan={hasChildren ? undefined : headerDepth - rowIndex}
                        style={{
                          width: hasChildren ? sumLeafWidths(column, activeColumnWidths) : column.width,
                          textAlign: column.align,
                          ...fixedStyle,
                        }}
                        className={cx(
                          classNames?.headerCell,
                          column.className,
                          column.fixed && "biu-table__cell--fixed",
                          column.fixed === "left" && "biu-table__cell--fixed-left",
                          column.fixed === "right" && "biu-table__cell--fixed-right",
                        )}
                        scope="col"
                      >
                        <div
                          className="biu-table__header-content"
                          style={{
                            justifyContent:
                              column.align === "right"
                                ? "flex-end"
                                : column.align === "center"
                                  ? "center"
                                  : "flex-start",
                          }}
                        >
                          {column.sortable ? (
                            <button
                              type="button"
                              className="biu-table__sort-button"
                              onClick={() => updateSorter(column)}
                            >
                              {column.title}
                              <span aria-hidden="true">
                                {active === "ascend" ? (
                                  <ArrowUp size={14} />
                                ) : active === "descend" ? (
                                  <ArrowDown size={14} />
                                ) : (
                                  <ArrowDownUp size={14} />
                                )}
                              </span>
                            </button>
                          ) : (
                            <span className="biu-table__header-title">{column.title}</span>
                          )}
                          {column.tooltip ? (
                            <Tooltip content={column.tooltip} onlyOverflow={false}>
                              <button
                                type="button"
                                className="biu-table__header-tooltip"
                                aria-label={typeof column.tooltip === "string" ? column.tooltip : undefined}
                              >
                                <CircleHelp size={13} aria-hidden="true" />
                              </button>
                            </Tooltip>
                          ) : null}
                          {filterTrigger}
                          {column.filters?.length && !column.filterDropdown && column.filterRender
                            ? column.filterRender(column.filters, activeFilters[column.key], (value) =>
                                updateFilter(column.key, value),
                              )
                            : null}
                          {column.resizable !== false && !hasChildren ? (
                            <span
                              role="separator"
                              aria-orientation="vertical"
                              aria-label={`${String(column.title)}${text["列宽"]}`}
                              className={cx("biu-table__resize-handle", classNames?.resizeHandle)}
                              onPointerDown={(event) => beginResize(event, column)}
                              onPointerUp={finishResize}
                              onPointerCancel={finishResize}
                            >
                              <GripVertical size={12} aria-hidden="true" />
                            </span>
                          ) : null}
                        </div>
                      </HeaderCellComponent>
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
                    {rowModel[item.index] ? (
                      <RenderRow
                        row={rowModel[item.index]}
                        index={item.index}
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
                      />
                    ) : null}
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
      </div>
      {footer ? <div className={cx("biu-table__footer", classNames?.footer)}>{footer}</div> : null}
      {effectivePagination && !paginationHidden ? (
        <div
          className={cx(
            "biu-table__pagination",
            effectivePagination.responsive && "biu-table__pagination--responsive",
            classNames?.pagination,
          )}
          aria-label={paginationText["分页"]}
        >
          <button
            type="button"
            disabled={effectivePagination.current <= 1}
            onClick={() => changePagination(effectivePagination.current - 1, effectivePagination.pageSize)}
          >
            {effectivePagination.itemRender?.(
              effectivePagination.current - 1,
              "prev",
              effectivePagination.previousText ?? paginationText["上一页"],
            ) ??
              effectivePagination.previousText ??
              paginationText["上一页"]}
          </button>
          {effectivePagination.simple ? (
            <span>
              {effectivePagination.current} / {pageCount}
            </span>
          ) : (
            pageItems.map((item, index) =>
              item === "ellipsis" ? (
                <span key={`ellipsis-${index}`} aria-hidden="true">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  className={item === effectivePagination.current ? "is-active" : undefined}
                  aria-current={item === effectivePagination.current ? "page" : undefined}
                  onClick={() => changePagination(item, effectivePagination.pageSize)}
                >
                  {effectivePagination.itemRender?.(item, "page", item) ?? item}
                </button>
              ),
            )
          )}
          {effectivePagination.showTotal ? (
            <span>{effectivePagination.showTotal(effectivePagination.total, [rangeStart, rangeEnd])}</span>
          ) : null}
          <button
            type="button"
            disabled={
              effectivePagination.current >=
              Math.max(1, Math.ceil(effectivePagination.total / Math.max(1, effectivePagination.pageSize)))
            }
            onClick={() => changePagination(effectivePagination.current + 1, effectivePagination.pageSize)}
          >
            {effectivePagination.itemRender?.(
              effectivePagination.current + 1,
              "next",
              effectivePagination.nextText ?? paginationText["下一页"],
            ) ??
              effectivePagination.nextText ??
              paginationText["下一页"]}
          </button>
          {effectivePagination.showSizeChanger !== false ? (
            <Select
              className="biu-table__pagination-select"
              value={String(effectivePagination.pageSize)}
              options={[
                ...new Set([...(effectivePagination.pageSizeOptions ?? [10, 20, 50]), effectivePagination.pageSize]),
              ]
                .filter((size) => Number.isFinite(Number(size)) && Number(size) > 0)
                .sort((left, right) => Number(left) - Number(right))
                .map((size) => ({
                  value: String(size),
                  label: `${size} ${paginationText["条/页"]}`,
                }))}
              onChange={(value) => {
                const nextPageSize = Number(value);
                changePagination(1, nextPageSize);
                effectivePagination.onShowSizeChange?.(1, nextPageSize);
              }}
              aria-label={paginationText["每页条数"]}
            />
          ) : null}
          {effectivePagination.showQuickJumper ? (
            <label className="biu-table__quick-jumper">
              {paginationText["跳至"]}{" "}
              <input
                type="number"
                min={1}
                max={pageCount}
                value={quickPage}
                onChange={(event) => setQuickPage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    const next = Math.max(1, Math.min(pageCount, Number(quickPage)));
                    changePagination(next, effectivePagination.pageSize);
                  }
                }}
              />{" "}
              {paginationText["页"]}
            </label>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export type { Column, TableProps, TableSorter } from "./types.js";
