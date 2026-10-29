import * as React from "react";
import type { Column } from "./types.js";
import { pixelWidth, resolveColumnLayout } from "./column-sizing.js";

export function useColumnLayout<T extends object>(
  scrollRef: React.RefObject<HTMLDivElement | null>,
  columns: Column<T>[],
  widths: Record<string, number | string>,
  fillKey: string | undefined,
  extraWidth: number,
  horizontalWidth: number | string | undefined,
  fillAvailableSpace = true,
  protectedFillKeys?: string[],
  fillPinned = false,
  fillPinnedViewportWidth?: number,
) {
  const [measurement, setMeasurement] = React.useState({
    viewport: 0,
    responsiveViewport: 0,
    widths: {} as Record<string, number>,
  });
  React.useLayoutEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    const measure = () => {
      const viewport = scroll.clientWidth || scroll.getBoundingClientRect().width;
      if (!viewport) return;
      const responsiveViewport = window.innerWidth || viewport;
      const measured: Record<string, number> = {};
      for (const column of columns) {
        const width = widths[column.key] ?? column.width;
        if (pixelWidth(width, viewport) !== undefined || column.actionColumn) continue;
        if (typeof width === "string") {
          const ruler = document.createElement("span");
          ruler.style.cssText =
            "position:absolute;visibility:hidden;pointer-events:none;height:0;box-sizing:border-box";
          ruler.style.width = width;
          scroll.append(ruler);
          const pixels = ruler.getBoundingClientRect().width;
          ruler.remove();
          if (pixels > 0) measured[column.key] = pixels;
        }
      }
      setMeasurement((previous) =>
        previous.viewport === viewport &&
        previous.responsiveViewport === responsiveViewport &&
        JSON.stringify(previous.widths) === JSON.stringify(measured)
          ? previous
          : { viewport, responsiveViewport, widths: measured },
      );
    };
    measure();
    // Window resize remains the fallback for embedded browsers without
    // ResizeObserver; mounting a Table must not fail just because that API is
    // unavailable.
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(measure);
    observer?.observe(scroll);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [columns, scrollRef, widths]);
  return React.useMemo(() => {
    if (
      !measurement.viewport ||
      columns.every(
        (column) =>
          !column.fixed &&
          !column.actionColumn &&
          !column.resizable &&
          !column.minWidth &&
          !column.maxWidth &&
          (widths[column.key] ?? column.width) === undefined,
      )
    )
      return undefined;
    const targetWidth =
      !fillAvailableSpace || horizontalWidth === "max-content"
        ? 0
        : Math.max(measurement.viewport, pixelWidth(horizontalWidth, measurement.viewport) ?? 0);
    // Preserve the user-sized dynamic width at the commit viewport, then let
    // it grow only by newly available viewport space. Shrinking the viewport
    // returns it to the committed width instead of redistributing old width
    // choices to unrelated columns.
    const viewportGrowth =
      fillPinned && fillPinnedViewportWidth !== undefined ? Math.max(0, targetWidth - fillPinnedViewportWidth) : 0;
    const sizingColumns = columns.map((column) => {
      const width = widths[column.key] ?? column.width;
      const fillWidth = column.key === fillKey ? pixelWidth(width, measurement.viewport) : undefined;
      return {
        ...column,
        width: viewportGrowth > 0 && fillWidth !== undefined ? fillWidth + viewportGrowth : width,
      };
    });
    const layout = resolveColumnLayout(
      sizingColumns,
      targetWidth,
      extraWidth,
      fillKey,
      measurement.widths,
      measurement.viewport,
      protectedFillKeys,
      measurement.responsiveViewport,
      fillPinned,
    );
    return {
      ...layout,
      viewportWidth: measurement.viewport,
      actionViewportWidth: measurement.responsiveViewport,
    };
  }, [
    columns,
    extraWidth,
    fillAvailableSpace,
    fillKey,
    fillPinned,
    fillPinnedViewportWidth,
    horizontalWidth,
    measurement,
    protectedFillKeys,
    widths,
  ]);
}
