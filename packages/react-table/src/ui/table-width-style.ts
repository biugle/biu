import type { CSSProperties } from "react";
import type { ResizePreview } from "./resize-types.js";

interface TableWidthStyleInput {
  preview?: ResizePreview;
  columnLayout?: { totalWidth: number; widths: Record<string, number> };
  configuredMinWidth?: number;
  fillRemainingSpace: boolean;
  elasticColumn?: string | false;
  horizontalWidth?: number | string;
  selectionWidth: number;
  expandable: boolean;
  hasColumnLayout: boolean;
  hasConfiguredColumnWidths: boolean;
  hasResizableColumns: boolean;
}

export function getTableWidthStyle({
  preview,
  columnLayout,
  configuredMinWidth,
  fillRemainingSpace,
  elasticColumn,
  horizontalWidth,
  selectionWidth,
  expandable,
  hasColumnLayout,
  hasConfiguredColumnWidths,
  hasResizableColumns,
}: TableWidthStyleInput): CSSProperties {
  const extraWidth = selectionWidth + (expandable ? 42 : 0);
  const renderedWidth =
    preview?.axis === "column"
      ? Math.max(
          preview.fillWidth,
          Object.values(preview.widths).reduce((sum, width) => sum + width, extraWidth),
        )
      : columnLayout?.totalWidth;
  return {
    width:
      renderedWidth ??
      (!fillRemainingSpace || elasticColumn === false || horizontalWidth === "max-content"
        ? "max-content"
        : (horizontalWidth ?? "100%")),
    minWidth: renderedWidth ?? configuredMinWidth,
    tableLayout: hasColumnLayout || hasConfiguredColumnWidths || hasResizableColumns ? "fixed" : undefined,
  };
}
