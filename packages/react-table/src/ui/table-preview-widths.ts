import { columnBounds } from "./column-sizing.js";
import type { ResizePreview } from "./use-table-resize.js";
import type { Column } from "./types.js";
import { leafColumns } from "./column-utils.js";

export function getPreviewColumnWidths<T extends object>(
  columns: Column<T>[],
  activeColumnWidths: Record<string, number | string>,
  preview?: ResizePreview,
) {
  if (preview?.axis !== "column") return activeColumnWidths;
  const resizingColumn = leafColumns(columns).find((column) => column.key === preview.key);
  const previewWidth = resizingColumn ? Math.max(columnBounds(resizingColumn).minimum, preview.value) : preview.value;
  return {
    ...activeColumnWidths,
    ...preview.widths,
    [preview.key]: preview.deferred ? (preview.widths[preview.key] ?? previewWidth) : previewWidth,
  };
}
