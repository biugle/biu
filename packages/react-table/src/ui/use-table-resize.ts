import * as React from "react";
import type { Column } from "./types.js";
import {
  calculateColumnResize,
  columnBounds,
  columnResizeCompensationKeys,
  pixelWidth,
  resolveColumnLayout,
} from "./column-sizing.js";
import {
  columnGeometrySignature,
  columnWidth,
  leafColumns,
  leafWidth,
  sizeMapSignature,
  widthValue,
} from "./column-utils.js";
import { syncFixedColumnAnchors } from "./fixed-column-anchors.js";
import { clampRowHeight, resizeRowHeight, rowHeightBounds } from "./row-sizing.js";
import { applyColumnResizeDom, applyRowResizeDom, restoreResizeDom } from "./resize-dom.js";
import type { ResizeOptions, ResizePreview, ResizeSession } from "./resize-types.js";
export type { ResizePreview } from "./resize-types.js";

function getColumnBoundaryPosition(
  state: Extract<ResizeSession, { axis: "column" }>,
  scrollElement: HTMLElement | null,
  fallback: number,
) {
  const headerCell = state.headerCell;
  if (!scrollElement || !headerCell?.isConnected) return fallback;
  const viewportRect = scrollElement.getBoundingClientRect();
  const headerRect = headerCell.getBoundingClientRect();
  if (headerRect.width <= 0) return fallback;

  // Use the rendered boundary after applying the width snapshot. Compensation
  // can move a neighboring column while keeping the dragged column's outer
  // edge fixed, so a target-width-only calculation becomes visibly stale.
  const boundary = state.resizeDirection === -1 ? headerRect.left : headerRect.right;
  return boundary - viewportRect.left - scrollElement.clientLeft + scrollElement.scrollLeft;
}

export function useTableResize<T extends object>(options: ResizeOptions<T>) {
  const {
    columns,
    columnWidths,
    rowHeights,
    virtual,
    scroll,
    elasticColumn,
    fillRemainingSpace,
    rowSelection,
    expandable,
    onColumnWidthsChange,
    onColumnResize,
    onRowHeightsChange,
    onRowResize,
    visibleColumns,
    activeColumnWidths,
    displayColumnWidths,
    tableStyle,
    hasColumnLayout,
    activeRowHeights,
    minRowHeight,
    maxRowHeight,
    layoutStretchColumnKey,
    protectedFillKeys,
    dynamicFillKey,
    fillPinned,
    onWidthCommit,
    setInternalColumnWidths,
    setInternalRowHeights,
    scrollRef,
    resizePreviewRef,
    resizePreviewElementRef,
    setResizePreview,
  } = options;
  const canResizeColumn = (column: Column<T>) => column.resizable === true;
  const resizeState = React.useRef<ResizeSession | undefined>(undefined);
  const resizeCleanupRef = React.useRef<(() => void) | undefined>(undefined);
  const virtualRows = Boolean(virtual);
  const clearResizeTargets = () => {
    if (resizeState.current?.axis === "column") {
      resizeState.current.targets.forEach((target) => target.classList.remove("biu-table__resize-target"));
    }
  };
  const releaseResizePointer = (state: ResizeSession | undefined) => {
    if (!state?.pointerTarget?.hasPointerCapture?.(state.pointerId)) return;
    state.pointerTarget.releasePointerCapture(state.pointerId);
  };
  const scrollRect = () => scrollRef.current?.getBoundingClientRect();
  const setPreview = (preview: ResizePreview) => {
    resizePreviewRef.current = preview;
    setResizePreview(preview);
  };
  const setPreviewPosition = (preview: NonNullable<ResizePreview>) => {
    const element = resizePreviewElementRef.current;
    if (!element) return;
    if (preview.axis === "column") element.style.left = `${preview.position}px`;
    else element.style.top = `${preview.position}px`;
  };
  const clearResizeListeners = () => {
    releaseResizePointer(resizeState.current);
    resizeCleanupRef.current?.();
  };
  const committedColumnLayout = (state: Extract<ResizeSession, { axis: "column" }>, widths: Record<string, number>) => {
    // Persist the exact widths from this drag. Re-running automatic fill here
    // would immediately undo a manual reduction of the designated dynamic
    // column and make later drags appear to jump between columns.
    const fillKey = state.dynamicFillKey ?? layoutStretchColumnKey;
    const layout = state.fillPinned
      ? undefined
      : resolveColumnLayout(
          visibleColumns.map((column) => ({ ...column, width: widths[column.key] })),
          state.fillWidth,
          state.tableExtraWidth,
          fillKey,
          {},
          state.fillWidth,
          state.protectedFillKeys,
          state.fillWidth,
        );
    const layoutWidths = layout?.widths ?? { ...state.baseColumnWidths, ...widths };
    const next: Record<string, number | string> = { ...state.baseWidths, ...layoutWidths };
    for (const [key, width] of Object.entries(state.protectedWidths)) {
      if (width === undefined) delete next[key];
      else next[key] = width;
    }
    return {
      widths: next,
      layoutWidths,
      protectedFillKeys: state.protectedFillKeys,
      dynamicFillKey: state.dynamicFillKey,
      fillPinned: state.fillPinned,
      // Directly resizing the designated dynamic column is an explicit width
      // choice, so viewport growth stays in the spacer. When another column
      // was resized, the compensated fill column retains its responsive role.
      fillViewportWidth: state.fillPinned && state.key !== state.dynamicFillKey ? state.fillWidth : undefined,
    };
  };
  const finishResize = () => {
    const state = resizeState.current;
    const preview = resizePreviewRef.current;
    try {
      if (state && preview) {
        if (
          state.axis === "column" &&
          preview.axis === "column" &&
          Math.abs(preview.value - state.startWidth) > 0.001
        ) {
          const value = Math.max(state.minWidth, preview.value);
          const committed = committedColumnLayout(state, {
            ...(preview.commitWidths ?? preview.widths),
            [state.key]: value,
          });
          // React may have rendered the live preview during an unrelated
          // parent update. Keep the DOM aligned with the final committed
          // layout before clearing that preview; restoring the original
          // widths here can leave a same-valued React style diff unapplied.
          applyColumnResizeDom(
            state,
            committed.layoutWidths,
            scrollRef.current,
            state.fillPinned ? state.fillWidth : 0,
          );
          const next = committed.widths;
          if (columnWidths === undefined) setInternalColumnWidths(next);
          onWidthCommit(
            next,
            committed.protectedFillKeys,
            committed.dynamicFillKey,
            committed.fillPinned,
            committed.fillViewportWidth,
          );
          onColumnWidthsChange?.(next);
          onColumnResize?.(state.key, value);
        } else {
          restoreResizeDom(state, scrollRef.current);
        }
        if (state.axis === "row" && preview.axis === "row") {
          if (Math.abs(preview.value - state.startHeight) > 0.001) {
            const next = { ...state.baseHeights, [state.key]: preview.value };
            if (rowHeights === undefined) setInternalRowHeights(next);
            onRowHeightsChange?.(next);
            onRowResize?.(state.key, preview.value);
          } else {
            // A press without a real size change should not persist a measured
            // natural row height or emit a misleading resize callback.
            restoreResizeDom(state, scrollRef.current);
          }
        }
      }
    } finally {
      clearResizeTargets();
      clearResizeListeners();
      resizeState.current = undefined;
      resizePreviewRef.current = undefined;
      setResizePreview(undefined);
    }
  };
  const cancelResize = (restoreDom = true) => {
    try {
      if (restoreDom && resizeState.current) restoreResizeDom(resizeState.current, scrollRef.current);
    } finally {
      clearResizeTargets();
      clearResizeListeners();
      resizeState.current = undefined;
      resizePreviewRef.current = undefined;
      setResizePreview(undefined);
    }
  };
  const updateResizeFromPointer = (event: PointerEvent, isPointerMove = false) => {
    const state = resizeState.current;
    if (!state || (event.pointerId !== undefined && event.pointerId !== state.pointerId)) return false;
    if (isPointerMove) state.hasPointerMove = true;
    if (state.axis === "column") {
      const currentViewport = scrollRect();
      const direction = getComputedStyle(state.pointerTarget ?? scrollRef.current!).direction === "rtl" ? -1 : 1;
      if (
        direction !== state.direction ||
        (currentViewport &&
          (Math.abs(currentViewport.left - state.viewportLeft) > 0.5 ||
            Math.abs(currentViewport.width - state.viewportWidth) > 0.5))
      ) {
        cancelResize();
        return false;
      }
    } else if (!state.row?.isConnected) {
      cancelResize();
      return false;
    }
    event.preventDefault();
    if (state.axis === "column") {
      const pointerDelta =
        state.resizeDirection *
        Math.round(
          event.clientX -
            state.startX +
            (state.fixed ? 0 : (scrollRef.current?.scrollLeft ?? 0) - state.startScrollLeft),
        );
      const widths = calculateColumnResize(state, pointerDelta);
      const nextWidth = widths[state.key] ?? state.startWidth;
      // The guide follows the accepted boundary. Once any participant reaches
      // its limit it stops there instead of crossing earlier/fixed columns.
      const fallbackBoundaryPosition =
        state.startBoundary +
        state.resizeDirection * (nextWidth - state.startWidth) +
        (state.fixed ? (scrollRef.current?.scrollLeft ?? 0) - state.startScrollLeft : 0);
      const deferDynamicColumnResize = state.key === state.dynamicFillKey;
      if (!deferDynamicColumnResize) applyColumnResizeDom(state, widths, scrollRef.current);
      // A direct drag on the fill column previews only the accepted guide
      // position. Keep the table widths stable while dragging so the coupled
      // neighbor compensation does not make the handle feel stuck; commit both
      // widths together on pointerup. Ordinary columns retain live DOM preview.
      const boundaryPosition = deferDynamicColumnResize
        ? fallbackBoundaryPosition
        : getColumnBoundaryPosition(state, scrollRef.current, fallbackBoundaryPosition);
      const preview = {
        axis: "column",
        key: state.key,
        value: nextWidth,
        widths: deferDynamicColumnResize ? state.baseColumnWidths : widths,
        position: boundaryPosition,
        fillWidth: state.fillWidth,
        deferred: deferDynamicColumnResize,
        ...(deferDynamicColumnResize ? { commitWidths: widths } : {}),
      } as const;
      // The snapshot and accepted delta share content coordinates with the
      // overlay, including horizontal scrolling during an active drag.
      resizePreviewRef.current = preview;
      setPreviewPosition(preview);
      return true;
    }
    const nextHeight = resizeRowHeight(
      state.startHeight,
      event.clientY - state.startY,
      state.minHeight,
      state.maxHeight,
    );
    const preview = {
      axis: "row",
      key: state.key,
      value: nextHeight,
      position: state.startBoundary + nextHeight - state.startHeight,
    } as const;
    const currentPreview = resizePreviewRef.current;
    if (currentPreview?.axis === "row" && currentPreview.value === preview.value) return true;
    if (virtualRows) {
      // Virtual rows need React's row-model update so TanStack Virtual can
      // recalculate downstream offsets as the active row changes size.
      setPreview(preview);
    } else {
      // A non-virtual Table can contain thousands of rows. Keep pointer
      // movement local to the active row instead of re-rendering every cell.
      resizePreviewRef.current = preview;
      applyRowResizeDom(state, nextHeight);
      setPreviewPosition(preview);
    }
    return true;
  };
  const bindResizeEvents = () => {
    const move = (event: PointerEvent) => {
      updateResizeFromPointer(event, true);
    };
    const up = (event: PointerEvent) => {
      const state = resizeState.current;
      if (!state || (event.pointerId !== undefined && event.pointerId !== state.pointerId)) return;
      if (!state.hasPointerMove && !updateResizeFromPointer(event)) return;
      finishResize();
    };
    const cancel = (event: Event) => {
      if (
        event.type === "pointercancel" &&
        resizeState.current &&
        (event as PointerEvent).pointerId !== undefined &&
        (event as PointerEvent).pointerId !== resizeState.current.pointerId
      )
        return;
      cancelResize();
    };
    window.addEventListener("pointermove", move, true);
    window.addEventListener("pointerup", up, true);
    window.addEventListener("pointercancel", cancel, true);
    window.addEventListener("blur", cancel, true);
    document.body.classList.add(
      "biu-table-resizing-global",
      `biu-table-resizing-global--${resizeState.current?.axis ?? "column"}`,
    );
    resizeCleanupRef.current = () => {
      window.removeEventListener("pointermove", move, true);
      window.removeEventListener("pointerup", up, true);
      window.removeEventListener("pointercancel", cancel, true);
      window.removeEventListener("blur", cancel, true);
      document.body.classList.remove("biu-table-resizing-global");
      document.body.classList.remove("biu-table-resizing-global--column", "biu-table-resizing-global--row");
      resizeCleanupRef.current = undefined;
    };
  };
  const createColumnResizeSession = (
    column: Column<T>,
    pointerId: number,
    startX: number,
    pointerTarget: HTMLElement | null,
  ): Extract<ResizeSession, { axis: "column" }> | undefined => {
    if (!canResizeColumn(column)) return undefined;
    const headerCell = pointerTarget?.closest("th") ?? null;
    const tableElement = scrollRef.current?.querySelector<HTMLTableElement>("table") ?? null;
    const columnElements = Array.from(
      tableElement?.querySelectorAll<HTMLTableColElement>("col[data-biu-column-key]") ?? [],
    );
    const elementFor = (key: string) => columnElements.find((element) => element.dataset.biuColumnKey === key) ?? null;
    const headerElements = Array.from(
      tableElement?.querySelectorAll<HTMLTableCellElement>("th[data-biu-column-key]") ?? [],
    );
    const fillColumnElement = tableElement?.querySelector<HTMLTableColElement>("col[data-biu-resize-fill]") ?? null;
    const headerElementFor = (key: string) =>
      headerElements.find((element) => element.dataset.biuColumnKey === key) ?? null;
    const baseColumnWidths = Object.fromEntries(
      visibleColumns.map((item) => {
        // The browser may leave an automatic stretch <col> without an inline
        // width. The leaf header is the rendered boundary the user actually
        // grabbed, so use it before the col/configured fallbacks. This keeps a
        // consecutive drag anchored to the width committed by the previous
        // session instead of the original column definition.
        const headerMeasured = headerElementFor(item.key)?.getBoundingClientRect().width ?? 0;
        const columnMeasured = elementFor(item.key)?.getBoundingClientRect().width ?? 0;
        return [
          item.key,
          Math.max(
            columnBounds(item).minimum,
            headerMeasured || columnMeasured || widthValue(displayColumnWidths[item.key] ?? item.width) || 120,
          ),
        ];
      }),
    ) as Record<string, number>;
    const minimumWidth = columnBounds(column).minimum;
    const measuredWidth = headerCell?.getBoundingClientRect().width ?? 0;
    const currentWidth = Math.max(minimumWidth, measuredWidth || baseColumnWidths[column.key] || 120);
    baseColumnWidths[column.key] = currentWidth;
    const rect = scrollRect();
    const viewportWidth = scrollRef.current?.clientWidth || rect?.width || 0;
    const fillsViewport = fillRemainingSpace !== false && elasticColumn !== false && scroll?.x !== "max-content";
    const fillWidth = fillsViewport ? Math.max(viewportWidth, pixelWidth(scroll?.x, viewportWidth) ?? 0) : 0;
    const tableExtraWidth = (rowSelection ? 42 : 0) + (expandable ? 42 : 0);
    const ordinaryTarget = !column.fixed && !column.actionColumn;
    const protectedKeySet = new Set(
      fillsViewport ? [...protectedFillKeys, ...(ordinaryTarget ? [column.key] : [])] : [],
    );
    const configuredFillKey = dynamicFillKey ?? layoutStretchColumnKey;
    const activeFillColumn = visibleColumns.find(
      (item) => item.key === configuredFillKey && !item.fixed && !item.actionColumn,
    );
    const currentFillKey = activeFillColumn?.key;
    const nextFillPinned = Boolean(fillsViewport && currentFillKey && (fillPinned || ordinaryTarget));
    if (nextFillPinned && currentFillKey) protectedKeySet.add(currentFillKey);
    const compensationKeys =
      fillsViewport && ordinaryTarget ? columnResizeCompensationKeys(visibleColumns, currentFillKey, column.key) : [];
    // The ordered participants preserve the dynamic leaf as the primary
    // balance point; its previous ordinary neighbor only absorbs any remainder.
    const compensationColumns = compensationKeys
      .map((key) => visibleColumns.find((item) => item.key === key))
      .filter((item): item is Column<T> => Boolean(item));
    const compensation = compensationColumns.map((item) => {
      const startWidth = baseColumnWidths[item.key] ?? 120;
      const bounds = columnBounds(item);
      const canGrowPastConfiguredMax = fillWidth > 0 && item.key === currentFillKey;
      return {
        key: item.key,
        startWidth,
        minWidth: bounds.minimum,
        maxWidth: canGrowPastConfiguredMax
          ? Math.max(bounds.maximum, startWidth + Math.max(0, currentWidth - minimumWidth))
          : Math.max(bounds.maximum, startWidth),
        element: elementFor(item.key),
      };
    });
    const groupLeafKeys = new Map<string, string[]>();
    const collectGroupLeafKeys = (items: Column<T>[]) => {
      items.forEach((item) => {
        if (item.hidden) return;
        if (!item.children?.length) return;
        groupLeafKeys.set(
          item.key,
          leafColumns([item]).map((leaf) => leaf.key),
        );
        collectGroupLeafKeys(item.children);
      });
    };
    collectGroupLeafKeys(columns);
    const originalHeaderCellWidths = headerElements.map((cell) => ({ cell, width: cell.style.width ?? "" }));
    const affectedColumnKeys = new Set([
      column.key,
      ...compensation.map((item) => item.key),
      ...(currentFillKey ? [currentFillKey] : []),
    ]);
    const originalBodyCellWidths: Array<{ cell: HTMLTableCellElement; width: string }> = [];
    // A resize can affect only the dragged leaf and fill-compensation leaves.
    // Snapshotting every body cell makes pointer movement work and temporary
    // memory scale with the full table, even when only one or two columns change.
    if (tableElement) {
      for (const body of Array.from(tableElement.tBodies)) {
        for (let rowIndex = 0; rowIndex < body.rows.length; rowIndex += 1) {
          const row = body.rows.item(rowIndex);
          if (!row) continue;
          for (let cellIndex = 0; cellIndex < row.cells.length; cellIndex += 1) {
            const cell = row.cells.item(cellIndex);
            if (!cell || cell.colSpan !== 1) continue;
            const key = cell.dataset.biuColumnKey;
            if (key && affectedColumnKeys.has(key)) {
              originalBodyCellWidths.push({ cell, width: cell.style.width ?? "" });
            }
          }
        }
      }
    }
    // Auto-fill can grow a leaf past its configured maxWidth to occupy the
    // viewport. Treat that rendered width as the current drag ceiling so the
    // first pointer move remains anchored and can shrink without a jump.
    const effectiveMaxWidth = Math.max(columnBounds(column).maximum, currentWidth);
    // Anchor the guide to the actual table boundary. The resize handle is a
    // hit area inside the header cell, so using the pointer's initial x
    // coordinate makes the preview start at a different position depending
    // on where the user grabbed the handle. That becomes visible on the last
    // column and after consecutive resizes.
    const headerRect = headerCell?.getBoundingClientRect();
    const direction = getComputedStyle(pointerTarget ?? scrollRef.current!).direction === "rtl" ? -1 : 1;
    const resizeDirection = (column.fixed === "left" ? 1 : column.fixed === "right" ? -1 : direction) as 1 | -1;
    const headerBoundary = resizeDirection === -1 ? headerRect?.left : headerRect?.right;
    const startBoundary =
      rect && rect.width > 0 && headerRect && headerRect.width > 0 && headerBoundary !== undefined
        ? headerBoundary - rect.left - scrollRef.current!.clientLeft + scrollRef.current!.scrollLeft
        : rect
          ? startX - rect.left + scrollRef.current!.scrollLeft
          : startX;
    const originalColumnWidths = Object.fromEntries(
      columnElements.map((element) => [element.dataset.biuColumnKey ?? "", element.style.width ?? ""]),
    );
    return {
      axis: "column",
      key: column.key,
      pointerId,
      hasPointerMove: false,
      startX,
      startWidth: Number.isFinite(currentWidth) ? currentWidth : 120,
      minWidth: minimumWidth,
      maxWidth: effectiveMaxWidth,
      baseWidths: activeColumnWidths,
      baseWidthSignature: sizeMapSignature(activeColumnWidths),
      protectedWidths: Object.fromEntries(
        visibleColumns
          .filter((item) => item.key !== column.key && (item.fixed || item.actionColumn))
          .map((item) => [item.key, activeColumnWidths[item.key] ?? item.width]),
      ),
      sourceGeometry: columnGeometrySignature(columns),
      sourceScrollWidth: scroll?.x,
      sourceElasticColumn: elasticColumn,
      sourceFillRemainingSpace: fillRemainingSpace,
      direction,
      resizeDirection,
      viewportLeft: rect?.left ?? 0,
      viewportWidth: rect?.width ?? 0,
      baseColumnWidths,
      startBoundary,
      startScrollLeft: scrollRef.current?.scrollLeft ?? 0,
      fixed: column.fixed,
      groupLeafKeys,
      originalHeaderCellWidths,
      originalBodyCellWidths,
      compensation,
      tableElement,
      columnElements,
      fillColumnElement,
      headerElements,
      headerCell,
      originalColumnWidths,
      originalFillColumnWidth: fillColumnElement?.style.width ?? "",
      originalTableWidth: tableElement?.style.width ?? "",
      originalTableMinWidth: tableElement?.style.minWidth ?? "",
      fillWidth,
      protectedFillKeys: [...protectedKeySet],
      dynamicFillKey: currentFillKey,
      fillPinned: nextFillPinned,
      fillSlack: Math.max(
        0,
        fillWidth - tableExtraWidth - Object.values(baseColumnWidths).reduce((sum, width) => sum + width, 0),
      ),
      tableExtraWidth,
      pointerTarget,
      targets: Array.from(scrollRef.current?.querySelectorAll<HTMLElement>("[data-biu-column-key]") ?? []).filter(
        (target) => target.dataset.biuColumnKey === column.key,
      ),
    };
  };
  const beginResize = (event: React.PointerEvent, column: Column<T>) => {
    if (!canResizeColumn(column) || event.button !== 0 || event.isPrimary === false) return;
    event.preventDefault();
    event.stopPropagation();
    cancelResize();
    const state = createColumnResizeSession(column, event.pointerId, event.clientX, event.currentTarget as HTMLElement);
    if (!state) return;
    resizeState.current = state;
    const previewWidths = state.baseColumnWidths;
    resizeState.current.targets.forEach((target) => target.classList.add("biu-table__resize-target"));
    setPreview({
      axis: "column",
      key: column.key,
      value: state.startWidth,
      widths: previewWidths,
      position: state.startBoundary,
      fillWidth: state.fillWidth,
      deferred: state.key === state.dynamicFillKey,
    });
    applyColumnResizeDom(state, previewWidths, scrollRef.current);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    bindResizeEvents();
  };
  const resizeColumnByKeyboard = (event: React.KeyboardEvent<HTMLElement>, column: Column<T>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const state = createColumnResizeSession(column, -1, 0, event.currentTarget);
    if (!state) return;
    const direction = state.resizeDirection;
    const step = event.shiftKey ? 50 : 10;
    const delta =
      event.key === "ArrowRight"
        ? step * direction
        : event.key === "ArrowLeft"
          ? -step * direction
          : event.key === "Home"
            ? state.minWidth - state.startWidth
            : event.key === "End" && Number.isFinite(state.maxWidth)
              ? state.maxWidth - state.startWidth
              : undefined;
    if (delta === undefined) return;
    event.preventDefault();
    const widths = calculateColumnResize(state, delta);
    const value = widths[column.key] ?? state.startWidth;
    if (Math.abs(value - state.startWidth) <= 0.001) return;
    const committed = committedColumnLayout(state, widths);
    const next = committed.widths;
    if (columnWidths === undefined) setInternalColumnWidths(next);
    onWidthCommit(
      next,
      committed.protectedFillKeys,
      committed.dynamicFillKey,
      committed.fillPinned,
      committed.fillViewportWidth,
    );
    onColumnWidthsChange?.(next);
    onColumnResize?.(column.key, value);
  };
  const beginRowResize = (event: React.PointerEvent, key: string, row: HTMLTableRowElement | null) => {
    if (event.button !== 0 || event.isPrimary === false) return;
    event.preventDefault();
    event.stopPropagation();
    cancelResize();
    const rect = scrollRect();
    const rowRect = row?.getBoundingClientRect();
    const { minimum: minimumHeight, maximum: maximumHeight } = rowHeightBounds(minRowHeight, maxRowHeight);
    const measuredHeight = activeRowHeights[key] ?? rowRect?.height ?? minimumHeight;
    const currentHeight = clampRowHeight(measuredHeight, minimumHeight, maximumHeight);
    const startBoundary = rect && rowRect ? rowRect.bottom - rect.top + scrollRef.current!.scrollTop : 0;
    resizeState.current = {
      axis: "row",
      key,
      pointerId: event.pointerId,
      hasPointerMove: false,
      startY: event.clientY,
      startHeight: currentHeight,
      minHeight: minimumHeight,
      maxHeight: maximumHeight,
      baseHeights: { ...activeRowHeights },
      baseHeightSignature: sizeMapSignature(activeRowHeights),
      sourceMinHeight: minRowHeight,
      sourceMaxHeight: maxRowHeight,
      startBoundary,
      row,
      originalRowHeight: row?.style.height ?? "",
      originalCellHeights: Array.from(row?.querySelectorAll<HTMLTableCellElement>("td") ?? []).map((cell) => ({
        cell,
        height: cell.style.height,
      })),
      originalHandleValue: (event.currentTarget as HTMLElement).getAttribute("aria-valuenow"),
      pointerTarget: event.currentTarget as HTMLElement,
    };
    setPreview({ axis: "row", key, value: currentHeight, position: startBoundary });
    event.currentTarget.setPointerCapture?.(event.pointerId);
    bindResizeEvents();
  };
  const resizeRowByKeyboard = (
    event: React.KeyboardEvent<HTMLElement>,
    key: string,
    row: HTMLTableRowElement | null,
  ) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const { minimum, maximum } = rowHeightBounds(minRowHeight, maxRowHeight);
    const measuredHeight = activeRowHeights[key] ?? row?.getBoundingClientRect().height ?? minimum;
    const startHeight = clampRowHeight(measuredHeight, minimum, maximum);
    const step = event.shiftKey ? 50 : 10;
    const delta =
      event.key === "ArrowDown"
        ? step
        : event.key === "ArrowUp"
          ? -step
          : event.key === "Home"
            ? minimum - startHeight
            : event.key === "End" && Number.isFinite(maximum)
              ? maximum - startHeight
              : undefined;
    if (delta === undefined) return;
    const height = resizeRowHeight(startHeight, delta, minimum, maximum);
    if (height === startHeight) return;
    event.preventDefault();
    const next = { ...activeRowHeights, [key]: height };
    if (rowHeights === undefined) setInternalRowHeights(next);
    onRowHeightsChange?.(next);
    onRowResize?.(key, height);
  };
  React.useLayoutEffect(() => {
    const session = resizeState.current;
    if (
      session?.axis === "column" &&
      (session.sourceGeometry !== columnGeometrySignature(columns) ||
        session.baseWidthSignature !== sizeMapSignature(activeColumnWidths) ||
        session.tableExtraWidth !== (rowSelection ? 42 : 0) + (expandable ? 42 : 0) ||
        session.sourceScrollWidth !== scroll?.x ||
        session.sourceElasticColumn !== elasticColumn ||
        session.sourceFillRemainingSpace !== fillRemainingSpace)
    ) {
      // React has just rendered new controlled props using the live preview.
      // Restoring old inline styles here can overwrite the new committed
      // value when it happens to equal the preview (React then sees no diff).
      // Clear the preview and let React reconcile from that current DOM.
      cancelResize(false);
    } else if (
      session?.axis === "row" &&
      (session.baseHeightSignature !== sizeMapSignature(activeRowHeights) ||
        session.sourceMinHeight !== minRowHeight ||
        session.sourceMaxHeight !== maxRowHeight)
    ) {
      cancelResize(false);
    }
  }, [
    columns,
    activeColumnWidths,
    activeRowHeights,
    rowSelection,
    expandable,
    scroll?.x,
    elasticColumn,
    fillRemainingSpace,
    minRowHeight,
    maxRowHeight,
  ]);
  React.useLayoutEffect(() => {
    const table = scrollRef.current?.querySelector<HTMLTableElement>("table");
    if (!table) return;
    syncFixedColumnAnchors(scrollRef.current, table);
    if (resizeState.current) return;
    // A parent render during a drag can make React's style cache equal the
    // preview. Explicitly synchronize the final model after restoring DOM;
    // otherwise an accepted/rejected commit may leave stale inline widths.
    const cssWidth = (value: number | string | undefined) => (typeof value === "number" ? `${value}px` : (value ?? ""));
    const columnsByKey = new Map(visibleColumns.map((column) => [column.key, column]));
    table.querySelectorAll<HTMLTableColElement>("col[data-biu-column-key]").forEach((element) => {
      const column = columnsByKey.get(element.dataset.biuColumnKey ?? "");
      if (!column) return;
      const value =
        !hasColumnLayout && column.key === layoutStretchColumnKey ? undefined : leafWidth(column, displayColumnWidths);
      const width = cssWidth(value);
      if (element.style.width !== width) element.style.width = width;
    });
    table.querySelectorAll<HTMLTableCellElement>("tbody td[data-biu-column-key]").forEach((cell) => {
      if (cell.colSpan !== 1) return;
      const column = columnsByKey.get(cell.dataset.biuColumnKey ?? "");
      if (!column) return;
      const width = cssWidth(columnWidth(column, displayColumnWidths));
      if (cell.style.width !== width) cell.style.width = width;
    });
    const width = cssWidth(tableStyle.width);
    const minWidth = cssWidth(tableStyle.minWidth);
    if (table.style.width !== width) table.style.width = width;
    if (table.style.minWidth !== minWidth) table.style.minWidth = minWidth;
    syncFixedColumnAnchors(scrollRef.current, table);
  }, [displayColumnWidths, hasColumnLayout, layoutStretchColumnKey, scrollRef, tableStyle, visibleColumns]);
  React.useLayoutEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;
    const cancelIfGeometryChanged = () => {
      const session = resizeState.current;
      const viewport = scrollElement.getBoundingClientRect();
      if (
        session?.axis === "column" &&
        (Math.abs(viewport.left - session.viewportLeft) > 0.5 || Math.abs(viewport.width - session.viewportWidth) > 0.5)
      )
        cancelResize();
      if (!session || (session.axis === "column" && session.fixed))
        syncFixedColumnAnchors(scrollElement, scrollElement.querySelector<HTMLTableElement>("table"));
    };
    const synchronizeScroll = () => {
      const session = resizeState.current;
      const preview = resizePreviewRef.current;
      if (!session) {
        syncFixedColumnAnchors(scrollElement, scrollElement.querySelector<HTMLTableElement>("table"));
        return;
      }
      if (session.axis !== "column" || !session.fixed || preview?.axis !== "column") return;
      syncFixedColumnAnchors(scrollElement, session.tableElement);
      const fallbackPosition =
        session.startBoundary +
        session.resizeDirection * (preview.value - session.startWidth) +
        scrollElement.scrollLeft -
        session.startScrollLeft;
      const position = getColumnBoundaryPosition(session, scrollElement, fallbackPosition);
      resizePreviewRef.current = { ...preview, position };
      setPreviewPosition({ ...preview, position });
    };
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(cancelIfGeometryChanged);
    observer?.observe(scrollElement);
    const table = scrollElement.querySelector<HTMLTableElement>("table");
    if (table) observer?.observe(table);
    window.addEventListener("resize", cancelIfGeometryChanged);
    scrollElement.addEventListener("scroll", synchronizeScroll);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", cancelIfGeometryChanged);
      scrollElement.removeEventListener("scroll", synchronizeScroll);
    };
  }, [scrollRef]);
  React.useEffect(
    () => () => {
      clearResizeListeners();
      clearResizeTargets();
      resizeState.current = undefined;
      resizePreviewRef.current = undefined;
    },
    [],
  );
  return { beginResize, beginRowResize, resizeColumnByKeyboard, resizeRowByKeyboard };
}
