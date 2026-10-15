import * as React from "react";
import type { Column } from "./types.js";
import { applyColumnWidths, columnDepth, headerRows, leafColumns, leafWidth, widthValue } from "./column-utils.js";

export function useTableColumns<T extends object>(
  columns: Column<T>[],
  activeColumnWidths: Record<string, number | string>,
  renderColumnWidths: Record<string, number | string>,
  elasticColumn: string | false | undefined,
  horizontalWidth: number | string | undefined,
  extraWidth: number,
  fillRemainingSpace = true,
) {
  const resolvedColumns = React.useMemo(
    () => applyColumnWidths(columns, activeColumnWidths),
    [columns, activeColumnWidths],
  );
  const visibleColumns = React.useMemo(
    () => leafColumns(resolvedColumns.filter((column) => !column.hidden)),
    [resolvedColumns],
  );
  // Keep the last ordinary column flexible internally. This is an automatic
  // layout detail, not a public configuration requirement: explicit widths
  // remain exact while the remaining viewport width is absorbed here.
  const defaultLayoutStretchColumnKey = React.useMemo(
    () => [...visibleColumns].reverse().find((column) => !column.fixed && !column.actionColumn)?.key,
    [visibleColumns],
  );
  const defaultStretchColumnKey = React.useMemo(() => {
    if (elasticColumn === false) return undefined;
    if (typeof elasticColumn === "string") {
      return visibleColumns.some((column) => column.key === elasticColumn && !column.fixed && !column.actionColumn)
        ? elasticColumn
        : undefined;
    }
    return defaultLayoutStretchColumnKey;
  }, [defaultLayoutStretchColumnKey, elasticColumn, visibleColumns]);
  // Default layout fills only ordinary leaves. Explicit false/max-content
  // opt into exact content widths and independent column resizing.
  const layoutStretchColumnKey =
    !fillRemainingSpace || horizontalWidth === "max-content" ? undefined : defaultStretchColumnKey;
  const canResizeColumn = React.useCallback((column: Column<T>) => column.resizable === true, []);
  const header = React.useMemo(() => headerRows(resolvedColumns.filter((column) => !column.hidden)), [resolvedColumns]);
  const headerDepth = React.useMemo(
    () => columnDepth(resolvedColumns.filter((column) => !column.hidden)),
    [resolvedColumns],
  );
  const tableLeafColumns = visibleColumns;
  const hasResizableColumns = visibleColumns.some((column) => canResizeColumn(column));
  const hasConfiguredColumnWidths = visibleColumns.some(
    (column) => widthValue(leafWidth(column, renderColumnWidths)) !== undefined,
  );
  const configuredTableMinWidth = React.useMemo(() => {
    const columnWidths = tableLeafColumns.map((column) => widthValue(leafWidth(column, renderColumnWidths)));
    if (!columnWidths.some((width) => width !== undefined)) return undefined;
    return columnWidths.reduce<number>((total, width) => total + (width ?? 0), 0) + extraWidth;
  }, [extraWidth, renderColumnWidths, tableLeafColumns]);
  return {
    visibleColumns,
    layoutStretchColumnKey,
    canResizeColumn,
    header,
    headerDepth,
    tableLeafColumns,
    hasResizableColumns,
    hasConfiguredColumnWidths,
    configuredTableMinWidth,
  };
}
