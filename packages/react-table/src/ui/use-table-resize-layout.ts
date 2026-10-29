import { getTableResizeFillLayout } from "./table-resize-fill.js";
import type { Column } from "./types.js";
import type { ResizePreview } from "./resize-types.js";

interface TableResizeLayoutInput<T extends object> {
  columns: Column<T>[];
  tableLeafColumns: Column<T>[];
  header: Column<T>[][];
  preview?: ResizePreview;
  columnLayout?: { totalWidth: number; widths: Record<string, number> };
  fillPinned: boolean;
  hasRowSelection: boolean;
  hasExpandable: boolean;
}

/** Keep spacer geometry and preview guidance derived from the same dynamic leaf. */
export function useTableResizeLayout<T extends object>({
  columns,
  tableLeafColumns,
  header,
  preview,
  columnLayout,
  fillPinned,
  hasRowSelection,
  hasExpandable,
}: TableResizeLayoutInput<T>) {
  const selectionWidth = (hasRowSelection ? 42 : 0) + (hasExpandable ? 42 : 0);
  const pinnedFillWidth =
    fillPinned && columnLayout
      ? Math.max(
          0,
          columnLayout.totalWidth -
            Object.values(columnLayout.widths).reduce((sum, width) => sum + width, selectionWidth),
        )
      : 0;
  const resizeFillLayout = getTableResizeFillLayout({
    columns,
    tableLeafColumns,
    header,
    preview,
    pinnedFillWidth,
    selectionWidth,
  });

  return resizeFillLayout;
}
