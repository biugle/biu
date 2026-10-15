import type * as React from "react";
import type { Column, TableProps, TableSorter } from "./types.js";
import { actionColumnWidth, columnBounds } from "./column-sizing.js";

export function columnGeometrySignature<T extends object>(columns: Column<T>[]): string {
  const geometry = (items: Column<T>[]): unknown[] =>
    items.map((column) => [
      column.key,
      column.fixed,
      column.actionColumn,
      column.width,
      column.minWidth,
      column.maxWidth,
      column.hidden,
      column.resizable,
      column.children ? geometry(column.children) : undefined,
    ]);
  return JSON.stringify(geometry(columns));
}

export function sizeMapSignature(widths: Record<string, number | string>): string {
  return JSON.stringify(
    Object.keys(widths)
      .sort()
      .map((key) => [key, widths[key]]),
  );
}

export function cx(...values: Array<React.ReactNode | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function nextSorter<T extends object>(column: Column<T>, current?: TableSorter): TableSorter | undefined {
  if (!column.sortable && !column.sorter) return current;
  const field = column.sortField ?? column.key;
  if (current?.field !== field) return { field, order: "ascend" };
  if (current.order === "ascend") return { field, order: "descend" };
  return undefined;
}

export function checkboxPropsFor<T extends object>(selection: TableProps<T>["rowSelection"], record: T) {
  return selection?.getCheckboxProps?.(record) ?? {};
}

export function offsetFor<T extends object>(
  columns: Column<T>[],
  index: number,
  side: "left" | "right",
  leading = 0,
  widths: Record<string, number | string> = {},
) {
  const relevant = columns.filter((column) => column.fixed === side);
  const preceding = side === "left" ? relevant.slice(0, index) : relevant.slice(index + 1);
  return preceding.reduce<number | string>((total, column) => {
    const width = leafWidth(column, widths) ?? 120;
    if (typeof total === "string" || typeof width === "string") {
      const left = typeof total === "number" ? `${total}px` : total;
      const right = typeof width === "number" ? `${width}px` : width;
      return `calc(${left} + ${right})`;
    }
    return Number(total) + Number(width);
  }, leading);
}

export function fixedIndexFor<T extends object>(columns: Column<T>[], column: Column<T>) {
  if (!column.fixed) return -1;
  const leaves = leafColumns([column]);
  if (leaves.some((leaf) => leaf.fixed !== column.fixed)) return -1;
  const key = column.fixed === "left" ? leaves[0]?.key : leaves.at(-1)?.key;
  return columns.filter((item) => item.fixed === column.fixed).findIndex((item) => item.key === key);
}

export function leafColumns<T extends object>(
  columns: Column<T>[],
  inherited: Pick<Column<T>, "fixed" | "actionColumn"> = {},
): Column<T>[] {
  return columns
    .filter((column) => !column.hidden)
    .flatMap((column) => {
      const fixed = column.fixed ?? inherited.fixed;
      const actionColumn = column.actionColumn ?? inherited.actionColumn;
      return column.children?.length
        ? leafColumns(column.children, { fixed, actionColumn })
        : [{ ...column, fixed, actionColumn }];
    });
}

export function applyColumnWidths<T extends object>(
  columns: Column<T>[],
  widths: Record<string, number | string>,
  inherited: Pick<Column<T>, "fixed" | "actionColumn"> = {},
): Column<T>[] {
  return columns
    .filter((column) => !column.hidden)
    .map((column) => ({
      ...column,
      fixed: column.fixed ?? inherited.fixed,
      actionColumn: column.actionColumn ?? inherited.actionColumn,
      width: column.children?.length ? column.width : clampColumnMinWidth(column, widths[column.key] ?? column.width),
      children: column.children?.length
        ? applyColumnWidths(
            column.children.filter((child) => !child.hidden),
            widths,
            {
              fixed: column.fixed ?? inherited.fixed,
              actionColumn: column.actionColumn ?? inherited.actionColumn,
            },
          )
        : column.children,
    }))
    .filter((column) => !column.children || column.children.length > 0);
}

export function widthValue(width: number | string | undefined): number | undefined {
  if (typeof width === "number" && Number.isFinite(width)) return width;
  if (typeof width !== "string") return undefined;
  const value = Number.parseFloat(width);
  return Number.isFinite(value) && /^\s*\d+(?:\.\d+)?px\s*$/i.test(width) ? value : undefined;
}

function clampColumnMinWidth<T extends object>(column: Column<T>, width: number): number;
function clampColumnMinWidth<T extends object>(column: Column<T>, width: string | undefined): string | undefined;
function clampColumnMinWidth<T extends object>(
  column: Column<T>,
  width: number | string | undefined,
): number | string | undefined;
function clampColumnMinWidth<T extends object>(column: Column<T>, width: number | string | undefined) {
  if (typeof width !== "number" || !Number.isFinite(width)) return width;
  const { minimum, maximum } = columnBounds(column);
  return Math.min(maximum, Math.max(minimum, width));
}

export function columnWidth<T extends object>(column: Column<T>, widths: Record<string, number | string>) {
  const width = widths[column.key] ?? column.width;
  if (typeof width !== "number" || !Number.isFinite(width)) return width;
  return Math.max(columnBounds(column).minimum, width);
}

export function leafWidth<T extends object>(column: Column<T>, widths: Record<string, number | string>) {
  const width = columnWidth(column, widths);
  const viewportWidth = typeof window === "undefined" ? 800 : window.innerWidth;
  return width === undefined && column.actionColumn ? actionColumnWidth(viewportWidth) : width;
}

export function sumLeafWidths<T extends object>(
  column: Column<T>,
  widths: Record<string, number | string>,
): number | undefined {
  if (!column.children?.length) return widthValue(leafWidth(column, widths));
  const values: Array<number | undefined> = column.children.map((child) => sumLeafWidths(child, widths));
  return values.every((value): value is number => value !== undefined)
    ? values.reduce((total, value) => total + value, 0)
    : undefined;
}

export function columnDepth<T extends object>(columns: Column<T>[]): number {
  return columns.reduce(
    (depth, column) => Math.max(depth, column.children?.length ? 1 + columnDepth(column.children) : 1),
    1,
  );
}

export function columnLeafCount<T extends object>(column: Column<T>): number {
  return column.children?.length ? column.children.reduce((count, child) => count + columnLeafCount(child), 0) : 1;
}

export function headerRows<T extends object>(columns: Column<T>[]) {
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

export function resolvedSpan<T extends object>(span: Column<T>["colSpan"] | Column<T>["rowSpan"], record: T) {
  return typeof span === "function" ? span(record) : span;
}
