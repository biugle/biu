import * as React from "react";
import type { Column } from "./types.js";
import { fixedIndexFor, offsetFor } from "./column-utils.js";

export function fixedColumnStyle<T extends object>(
  columns: Column<T>[],
  column: Column<T>,
  fixedIndex: number,
  widths: Record<string, number | string>,
  leadingWidth: number,
  zIndex = 4,
): React.CSSProperties | undefined {
  if (!column.fixed || fixedIndex < 0) return undefined;
  return {
    position: "sticky",
    [column.fixed]: offsetFor(columns, fixedIndex, column.fixed, column.fixed === "left" ? leadingWidth : 0, widths),
    zIndex,
  };
}

export function useFixedColumnStyles<T extends object>(
  columns: Column<T>[],
  widths: Record<string, number | string>,
  leadingWidth: number,
) {
  return React.useMemo(() => {
    const styles = new Map<string, React.CSSProperties>();
    for (const column of columns) {
      if (!column.fixed) continue;
      const fixedIndex = fixedIndexFor(columns, column);
      const style = fixedColumnStyle(columns, column, fixedIndex, widths, leadingWidth);
      if (style) styles.set(column.key, style);
    }
    return styles;
  }, [columns, leadingWidth, widths]);
}
