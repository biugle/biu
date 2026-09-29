import type { Column, TableFilters, TableSorter } from "./types.js";

export function valueAt<T extends object>(record: T, column: Column<T>) {
  if (column.dataIndex === undefined) return undefined;
  if (typeof column.dataIndex === "string" && column.dataIndex.includes(".")) {
    return column.dataIndex
      .split(".")
      .reduce<unknown>(
        (current, part) =>
          current && typeof current === "object" ? (current as Record<string, unknown>)[part] : undefined,
        record,
      );
  }
  return record[column.dataIndex as keyof T];
}

function hasFilterValue(value: unknown) {
  return value !== undefined && value !== null && value !== "" && (!Array.isArray(value) || value.length > 0);
}

function matchesFilter(recordValue: unknown, filterValue: unknown) {
  if (Array.isArray(filterValue)) {
    if (Array.isArray(recordValue)) return filterValue.some((value) => recordValue.includes(value));
    return filterValue.some((value) => String(value) === String(recordValue));
  }
  if (Array.isArray(recordValue)) return recordValue.some((value) => String(value) === String(filterValue));
  return String(recordValue ?? "") === String(filterValue);
}

function compareValues(left: unknown, right: unknown) {
  if (left === right) return 0;
  if (left === undefined || left === null || left === "") return 1;
  if (right === undefined || right === null || right === "") return -1;
  if (typeof left === "number" && typeof right === "number") return left - right;
  return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: "base" });
}

export function deriveTableData<T extends object>(
  dataSource: T[],
  columns: Column<T>[],
  sorter?: TableSorter,
  filters: TableFilters = {},
) {
  const filtered = dataSource.filter((record) =>
    Object.entries(filters).every(([key, filterValue]) => {
      if (!hasFilterValue(filterValue)) return true;
      const column = columns.find((item) => item.key === key);
      return column ? matchesFilter(valueAt(record, column), filterValue) : true;
    }),
  );
  if (!sorter?.field || !sorter.order) return filtered;
  const column = columns.find((item) => (item.sortField ?? item.key) === sorter.field || item.key === sorter.field);
  if (!column) return filtered;
  return filtered
    .map((record, index) => ({ record, index }))
    .sort((left, right) => {
      const result =
        typeof column.sorter === "function"
          ? column.sorter(left.record, right.record)
          : compareValues(valueAt(left.record, column), valueAt(right.record, column));
      return result === 0 ? left.index - right.index : sorter.order === "ascend" ? result : -result;
    })
    .map(({ record }) => record);
}

export function paginateTableData<T>(data: T[], current: number, pageSize: number) {
  const safePageSize = Math.max(1, pageSize);
  const safeCurrent = Math.max(1, current);
  const start = (safeCurrent - 1) * safePageSize;
  return data.slice(start, start + safePageSize);
}
