import type * as React from "react";
import type { BiuTableLocale, BiuTableLocaleTextOverrides } from "../locale/index.js";

export type TableSortOrder = "ascend" | "descend";
export interface TableSorter {
  field?: string;
  order?: TableSortOrder;
}
export type TableFilters = Record<string, unknown>;

export interface ColumnFilterOption {
  label: React.ReactNode;
  value: string;
  disabled?: boolean;
}

export interface TableFilterDropdownContext {
  /** The currently applied filter values. */
  selectedKeys: React.Key[];
  /** Apply a pending selection immediately while keeping the panel open. */
  setSelectedKeys: (keys: React.Key[]) => void;
  /** Apply the current selection and optionally close the panel. */
  confirm: (options?: { closeDropdown?: boolean }) => void;
  /** Clear the column filter and close the panel. */
  clearFilters: () => void;
  /** Close the panel without changing the applied value. */
  close: () => void;
  filters?: ColumnFilterOption[];
}

export interface Column<T extends object> {
  key: string;
  title: React.ReactNode;
  /** Renders a question-mark Tooltip beside the header title. */
  tooltip?: React.ReactNode;
  dataIndex?: keyof T | string;
  width?: number | string;
  align?: "left" | "center" | "right";
  render?: (value: unknown, record: T, index: number) => React.ReactNode;
  renderCell?: (value: unknown, record: T, index: number) => React.ReactNode;
  children?: Column<T>[];
  sortable?: boolean;
  sorter?: boolean | ((left: T, right: T) => number);
  sortField?: string;
  filters?: ColumnFilterOption[];
  filterMultiple?: boolean;
  filterRender?: (options: ColumnFilterOption[], value: unknown, onChange: (value: unknown) => void) => React.ReactNode;
  filterDropdown?: (context: TableFilterDropdownContext) => React.ReactNode;
  filterIcon?: React.ReactNode | ((filtered: boolean) => React.ReactNode);
  ellipsis?: boolean | { tooltip?: boolean; maxWidth?: number | string };
  /** Keeps this column on one line; an unbounded column can grow with its content. */
  noWrap?: boolean;
  colSpan?: number | ((record?: T) => number);
  rowSpan?: number | ((record: T) => number);
  fixed?: "left" | "right";
  /** Enables this column's handle. Fixed leaves change only through their own explicitly enabled handle. */
  resizable?: boolean;
  /** Marks a row-action column. Its default width follows the table viewport: 60px below 560px, 160px below 800px, otherwise 190px. */
  actionColumn?: boolean;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
  hidden?: boolean;
}

export interface TablePagination {
  current: number;
  pageSize: number;
  total: number;
  onChange?: (current: number, pageSize: number) => void;
  onShowSizeChange?: (current: number, pageSize: number) => void;
  pageSizeOptions?: number[];
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  quickJumperWidth?: number | string;
  showTotal?: (total: number, range: [number, number]) => React.ReactNode;
  simple?: boolean;
  responsive?: boolean;
  hideOnSinglePage?: boolean;
  showLessItems?: boolean;
  itemRender?: (page: number, type: "page" | "prev" | "next", element: React.ReactNode) => React.ReactNode;
  previousText?: React.ReactNode;
  nextText?: React.ReactNode;
  locale?: BiuTableLocale;
  localeText?: BiuTableLocaleTextOverrides;
}

export interface TableRowSelection<T extends object> {
  selectedRowKeys: React.Key[];
  onChange: (keys: React.Key[], rows: T[]) => void;
  onSelect?: (record: T, selected: boolean, selectedRows: T[]) => void;
  onSelectAll?: (selected: boolean, selectedRows: T[], changedRows: T[]) => void;
  getCheckboxProps?: (record: T) => { disabled?: boolean; "aria-label"?: string };
  preserveSelectedRowKeys?: boolean;
}

export interface TableExpandable<T extends object> {
  expandedRowKeys?: React.Key[];
  defaultExpandedRowKeys?: React.Key[];
  onExpandedRowsChange?: (keys: React.Key[]) => void;
  expandedRowRender: (record: T, index: number) => React.ReactNode;
  rowExpandable?: (record: T) => boolean;
}

export interface TableClassNames {
  root?: string;
  table?: string;
  header?: string;
  headerCell?: string;
  body?: string;
  row?: string;
  cell?: string;
  pagination?: string;
  footer?: string;
  empty?: string;
  loading?: string;
  error?: string;
  expanded?: string;
  summary?: string;
  filter?: string;
  resizeHandle?: string;
}

export interface TableScroll {
  x?: number | string;
  y?: number | string;
}

export interface TableVirtualOptions {
  height?: number | string;
  estimateSize?: number;
  overscan?: number;
}

export type TableRowResizable<T extends object> = boolean | ((record: T, index: number) => boolean);

export interface TableSizeState {
  columnWidths: Record<string, number | string>;
  rowHeights: Record<string, number>;
}

export interface TableProps<T extends object> {
  columns: Column<T>[];
  dataSource?: T[];
  rowKey?: keyof T | ((record: T, index: number) => React.Key);
  loading?: boolean;
  error?: unknown;
  empty?: React.ReactNode;
  loadingContent?: React.ReactNode;
  errorContent?: React.ReactNode;
  className?: string;
  classNames?: TableClassNames;
  caption?: React.ReactNode;
  stickyHeader?: boolean;
  showHeader?: boolean;
  /** Alternates a very light background on even body rows; disabled by default. */
  striped?: boolean;
  pagination?: false | TablePagination;
  sorter?: TableSorter;
  onSorterChange?: (sorter?: TableSorter) => void;
  filters?: TableFilters;
  onFilterChange?: (filters: TableFilters) => void;
  onChange?: (pagination: TablePagination | undefined, sorter?: TableSorter, filters?: TableFilters) => void;
  rowSelection?: TableRowSelection<T>;
  expandable?: TableExpandable<T>;
  /** Height of the table viewport. Pagination remains outside this scroll area. */
  height?: number | string;
  scroll?: TableScroll;
  virtual?: boolean | TableVirtualOptions;
  layer?: "ui" | "pro";
  onRow?: (record: T, index: number) => React.HTMLAttributes<HTMLTableRowElement>;
  rowClassName?: string | ((record: T, index: number) => string);
  expandedRowClassName?: string | ((record: T, index: number) => string);
  summary?: (data: T[]) => React.ReactNode;
  /** Render a custom area between the table scroll region and pagination. */
  footer?: React.ReactNode;
  /** Controlled column widths keyed by Column.key. */
  columnWidths?: Record<string, number | string>;
  defaultColumnWidths?: Record<string, number | string>;
  onColumnWidthsChange?: (widths: Record<string, number | string>) => void;
  onColumnResize?: (key: string, width: number) => void;
  /** Controlled row heights keyed by rowKey; values are pixels. */
  rowHeights?: Record<string, number>;
  /** Initial row heights for uncontrolled tables. */
  defaultRowHeights?: Record<string, number>;
  /** Minimum height applied while resizing a row. */
  minRowHeight?: number;
  /** Maximum height applied while resizing a row. */
  maxRowHeight?: number;
  /** Enables row-boundary resizing globally or per record. */
  rowResizable?: TableRowResizable<T>;
  /** Fills remaining viewport space by default. A committed ordinary target keeps its width;
   * other ordinary leaves absorb surplus, and the preferred ordinary leaf may exceed maxWidth
   * when needed to prevent an empty tail. False uses exact content widths and independent resizing.
   */
  fillRemainingSpace?: boolean;
  /** Default: fill ordinary leaves and compensate with following ordinary leaves.
   * A key prioritizes that ordinary leaf when fillRemainingSpace is enabled.
   * False or scroll.x="max-content" uses exact content widths and independent resizing.
   * Fixed/action leaves never absorb another column's resize or viewport surplus. Automatic
   * viewport fill can exceed maxWidth; direct user resizing still follows minWidth/maxWidth.
   */
  elasticColumn?: string | false;
  /** Called once when a row resize is committed. */
  onRowHeightsChange?: (heights: Record<string, number>) => void;
  /** Called once with the committed row key and height. */
  onRowResize?: (key: string, height: number) => void;
  components?: {
    table?: React.ElementType;
    header?: React.ElementType;
    headerCell?: React.ElementType;
    body?: React.ElementType;
    row?: React.ElementType;
    cell?: React.ElementType;
  };
  locale?: BiuTableLocale;
  localeText?: BiuTableLocaleTextOverrides;
}
