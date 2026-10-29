import { syncFixedColumnAnchors } from "./fixed-column-anchors.js";
import type { ResizeSession } from "./resize-types.js";

export function applyColumnResizeDom(
  state: Extract<ResizeSession, { axis: "column" }>,
  widths: Record<string, number>,
  scrollElement: HTMLElement | null,
  tableFillFloor?: number,
) {
  // Freeze the entire colgroup and its exact sum; otherwise the browser can
  // distribute spare pixels to fixed leaves while the pointer is moving.
  const nextWidths = { ...state.baseColumnWidths, ...widths };
  state.columnElements.forEach((column) => {
    const width = nextWidths[column.dataset.biuColumnKey ?? ""];
    if (width !== undefined && column.style.width !== `${width}px`) column.style.width = `${width}px`;
  });
  const columnsWidth = Object.values(nextWidths).reduce((sum, width) => sum + width, 0);
  const tableWidth = Math.max(columnsWidth + state.tableExtraWidth, tableFillFloor ?? state.fillWidth);
  const fillWidth = Math.max(0, tableWidth - columnsWidth - state.tableExtraWidth);
  // The filler is rendered when the preview starts, so the first session
  // snapshot may precede its DOM node. Resolve it once after that render.
  const fillColumn =
    state.fillColumnElement ??
    state.tableElement?.querySelector<HTMLTableColElement>("col[data-biu-resize-fill]") ??
    null;
  if (fillColumn) state.fillColumnElement = fillColumn;
  if (fillColumn) fillColumn.style.width = `${fillWidth}px`;
  state.tableElement?.style.setProperty("width", `${tableWidth}px`);
  state.tableElement?.style.setProperty("min-width", `${tableWidth}px`);
  state.headerElements.forEach((cell) => {
    const key = cell.dataset.biuColumnKey;
    if (!key) return;
    const descendants = state.groupLeafKeys.get(key);
    if (descendants) {
      const groupWidth = descendants.reduce((total, leafKey) => total + (nextWidths[leafKey] ?? 0), 0);
      const groupedFillWidth = cell.colSpan > descendants.length ? fillWidth : 0;
      const width = `${groupWidth + groupedFillWidth}px`;
      if (cell.style.width !== width) cell.style.setProperty("width", width);
      return;
    }
    const width = nextWidths[key];
    if (width !== undefined && cell.style.width !== `${width}px`) cell.style.setProperty("width", `${width}px`);
  });
  // Table rows keep explicit inline widths too. Update the mounted data cells
  // alongside the colgroup and header so the preview line and body boundary
  // move together without re-rendering every row on each pointer event.
  state.originalBodyCellWidths.forEach(({ cell }) => {
    if (!cell.isConnected || cell.colSpan !== 1) return;
    const width = nextWidths[cell.dataset.biuColumnKey ?? ""];
    if (width !== undefined && cell.style.width !== `${width}px`) cell.style.setProperty("width", `${width}px`);
  });
  // Ordinary columns do not change fixed-column offsets. Avoid scanning and
  // measuring every body cell on each pointer move for that common case.
  if (state.fixed) syncFixedColumnAnchors(scrollElement, state.tableElement);
}

export function restoreResizeDom(state: ResizeSession, scrollElement: HTMLElement | null) {
  if (state.axis === "row") {
    if (state.row?.isConnected) {
      if (state.originalRowHeight) state.row.style.setProperty("height", state.originalRowHeight);
      else state.row.style.removeProperty("height");
    }
    state.originalCellHeights.forEach(({ cell, height }) => {
      if (!cell.isConnected) return;
      if (height) cell.style.setProperty("height", height);
      else cell.style.removeProperty("height");
    });
    if (state.pointerTarget?.isConnected) {
      if (state.originalHandleValue === null) state.pointerTarget.removeAttribute("aria-valuenow");
      else state.pointerTarget.setAttribute("aria-valuenow", state.originalHandleValue);
    }
    return;
  }
  Object.entries(state.originalColumnWidths).forEach(([key, original]) => {
    const column = state.columnElements.find((item) => item.dataset.biuColumnKey === key);
    if (!column) return;
    if (original) column.style.setProperty("width", original);
    else column.style.removeProperty("width");
  });
  const fillColumn =
    state.fillColumnElement ??
    state.tableElement?.querySelector<HTMLTableColElement>("col[data-biu-resize-fill]") ??
    null;
  if (fillColumn) state.fillColumnElement = fillColumn;
  if (fillColumn) {
    if (state.originalFillColumnWidth) fillColumn.style.setProperty("width", state.originalFillColumnWidth);
    else fillColumn.style.removeProperty("width");
  }
  state.originalHeaderCellWidths.forEach(({ cell, width }) => {
    if (!cell.isConnected) return;
    if (width) cell.style.setProperty("width", width);
    else cell.style.removeProperty("width");
  });
  state.originalBodyCellWidths.forEach(({ cell, width }) => {
    if (!cell.isConnected) return;
    if (width) cell.style.setProperty("width", width);
    else cell.style.removeProperty("width");
  });
  state.tableElement?.style.setProperty("width", state.originalTableWidth);
  state.tableElement?.style.setProperty("min-width", state.originalTableMinWidth);
  if (state.fixed) syncFixedColumnAnchors(scrollElement, state.tableElement);
}

export function applyRowResizeDom(state: Extract<ResizeSession, { axis: "row" }>, height: number) {
  const row = state.row;
  if (!row?.isConnected) return;
  const value = `${height}px`;
  if (row.style.height !== value) row.style.setProperty("height", value);
  state.originalCellHeights.forEach(({ cell }) => {
    if (!cell.isConnected) return;
    if (cell.style.height !== value) cell.style.setProperty("height", value);
  });
  state.pointerTarget?.setAttribute("aria-valuenow", String(height));
}
