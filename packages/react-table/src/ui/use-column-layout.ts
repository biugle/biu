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
  protectedFillKey?: string,
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
    const observer = new ResizeObserver(measure);
    observer.observe(scroll);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
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
    const sizingColumns = columns.map((column) => ({ ...column, width: widths[column.key] ?? column.width }));
    const layout = resolveColumnLayout(
      sizingColumns,
      targetWidth,
      extraWidth,
      fillKey,
      measurement.widths,
      measurement.viewport,
      protectedFillKey,
      measurement.responsiveViewport,
    );
    return {
      ...layout,
      viewportWidth: measurement.viewport,
      actionViewportWidth: measurement.responsiveViewport,
    };
  }, [columns, extraWidth, fillAvailableSpace, fillKey, horizontalWidth, measurement, protectedFillKey, widths]);
}
