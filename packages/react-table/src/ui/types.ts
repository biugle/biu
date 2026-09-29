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
  colSpan?: number | ((record?: T) => number);
  rowSpan?: number | ((record: T) => number);
  fixed?: "left" | "right";
  /** Enables the drag handle in the header. Defaults to true for leaf columns. */
  resizable?: boolean;
  minWidth?: number;
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
  pagination?: false | TablePagination;
  sorter?: TableSorter;
  onSorterChange?: (sorter?: TableSorter) => void;
  filters?: TableFilters;
  onFilterChange?: (filters: TableFilters) => void;
  onChange?: (pagination: TablePagination | undefined, sorter?: TableSorter, filters?: TableFilters) => void;
  rowSelection?: TableRowSelection<T>;
  expandable?: TableExpandable<T>;
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
