import type { CSSProperties } from "react";
import type { TableScroll } from "./types.js";

export function getTableScrollStyle({
  height,
  scroll,
  hasResizableColumns,
  hasConfiguredColumnWidths,
}: {
  height?: CSSProperties["height"];
  scroll?: TableScroll;
  hasResizableColumns: boolean;
  hasConfiguredColumnWidths: boolean;
}): CSSProperties {
  const horizontalScroll = Boolean(scroll?.x || hasResizableColumns || hasConfiguredColumnWidths);
  return {
    height,
    maxHeight: scroll?.y,
    minHeight: height !== undefined ? 0 : undefined,
    overflow: scroll?.x || scroll?.y || hasResizableColumns || hasConfiguredColumnWidths ? undefined : "hidden",
    overflowX: horizontalScroll ? "auto" : "hidden",
    // Standard PageBox tables may be height-constrained by a flex parent
    // without an explicit scroll.y, so their body must still be scrollable.
    overflowY: "auto",
  };
}
