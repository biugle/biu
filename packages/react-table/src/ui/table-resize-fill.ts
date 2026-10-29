import type { ResizePreview } from "./use-table-resize.js";
import type { Column } from "./types.js";
import { leafColumns } from "./column-utils.js";

interface TableResizeFillInput<T extends object> {
  columns: Column<T>[];
  tableLeafColumns: Column<T>[];
  header: Column<T>[][];
  preview?: ResizePreview;
  pinnedFillWidth?: number;
  selectionWidth: number;
}

export function getTableResizeFillLayout<T extends object>({
  columns,
  tableLeafColumns,
  header,
  preview,
  pinnedFillWidth = 0,
  selectionWidth,
}: TableResizeFillInput<T>) {
  const previewColumn = preview?.axis === "column" ? preview : undefined;
  const previewing = Boolean(previewColumn && previewColumn.fillWidth > 0 && tableLeafColumns.length > 0);
  const columnWidth =
    previewing && previewColumn
      ? Math.max(
          0,
          previewColumn.fillWidth -
            Object.values(previewColumn.widths).reduce((sum, width) => sum + width, selectionWidth),
        )
      : Math.max(0, pinnedFillWidth);
  // Render a zero-width preview spacer at pointer-down so direct DOM updates
  // can grow it during pointer-move without forcing a full table rerender.
  const active = Boolean(tableLeafColumns.length && (previewing || columnWidth > 0));
  const firstRightFixedColumnKey = active
    ? tableLeafColumns.find((column) => column.fixed === "right")?.key
    : undefined;
  const columnKey = firstRightFixedColumnKey ?? (active ? tableLeafColumns.at(-1)?.key : undefined);
  const path = columnKey ? findColumnPath(columns, columnKey) : undefined;
  const anchorIndex = path
    ? firstRightFixedColumnKey
      ? Math.max(
          0,
          path.findIndex((column) => {
            const leaves = leafColumns([column]);
            return leaves.length > 0 && leaves.every((leaf) => leaf.fixed === "right");
          }),
        )
      : path.length - 1
    : -1;
  const anchorColumnKey = path?.[anchorIndex]?.key;
  const ancestors = new Set(path?.slice(0, anchorIndex).map((column) => column.key) ?? []);
  const headerRowIndex = anchorColumnKey
    ? header.findIndex((row) => row.some((column) => column.key === anchorColumnKey))
    : -1;
  return {
    active,
    firstRightFixedColumnKey,
    columnKey,
    anchorColumnKey,
    ancestors,
    headerRowIndex,
    columnWidth,
  };
}

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
