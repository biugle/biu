import * as React from "react";
import type { Column, TableProps } from "./types.js";
import { calculateColumnResize, columnBounds, pixelWidth, resolveColumnLayout } from "./column-sizing.js";
import { columnGeometrySignature, leafColumns, leafWidth, sizeMapSignature, widthValue } from "./column-utils.js";
import { syncFixedColumnAnchors } from "./fixed-column-anchors.js";
import { clampRowHeight, resizeRowHeight, rowHeightBounds } from "./row-sizing.js";

interface ResizeOptions<T extends object> extends Pick<
  TableProps<T>,
  | "columns"
  | "columnWidths"
  | "rowHeights"
  | "scroll"
  | "elasticColumn"
  | "fillRemainingSpace"
  | "rowSelection"
  | "expandable"
  | "onColumnWidthsChange"
  | "onColumnResize"
  | "onRowHeightsChange"
  | "onRowResize"
> {
  visibleColumns: Column<T>[];
  activeColumnWidths: Record<string, number | string>;
  displayColumnWidths: Record<string, number | string>;
  tableStyle: React.CSSProperties;
  hasColumnLayout: boolean;
  activeRowHeights: Record<string, number>;
  minRowHeight: number;
  maxRowHeight: number;
  layoutStretchColumnKey?: string;
  onWidthCommit: (widths: Record<string, number | string>, protectedFillKey?: string) => void;
  setInternalColumnWidths: React.Dispatch<React.SetStateAction<Record<string, number | string>>>;
  setInternalRowHeights: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  resizePreviewRef: React.RefObject<ResizePreview>;
  resizePreviewElementRef: React.RefObject<HTMLSpanElement | null>;
  setResizePreview: React.Dispatch<React.SetStateAction<ResizePreview>>;
}
export type ResizePreview =
  | {
      axis: "column";
      position: number;
      key: string;
      value: number;
      widths: Record<string, number>;
      fillWidth: number;
    }
  | { axis: "row"; position: number; key: string; value: number }
  | undefined;

export function useTableResize<T extends object>(options: ResizeOptions<T>) {
  const {
    columns,
    columnWidths,
    rowHeights,
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
    onWidthCommit,
    setInternalColumnWidths,
    setInternalRowHeights,
    scrollRef,
    resizePreviewRef,
    resizePreviewElementRef,
    setResizePreview,
  } = options;
  const canResizeColumn = (column: Column<T>) => column.resizable === true;
  type ResizeSession =
    | {
        axis: "column";
        key: string;
        pointerId: number;
        hasPointerMove: boolean;
        startX: number;
        startWidth: number;
        minWidth: number;
        maxWidth: number;
        baseWidths: Record<string, number | string>;
        baseWidthSignature: string;
        protectedWidths: Record<string, number | string | undefined>;
        sourceGeometry: string;
        sourceScrollWidth: number | string | undefined;
        sourceElasticColumn: string | false | undefined;
        sourceFillRemainingSpace: boolean | undefined;
        direction: 1 | -1;
        resizeDirection: 1 | -1;
        viewportLeft: number;
        viewportWidth: number;
        baseColumnWidths: Record<string, number>;
        startBoundary: number;
        startScrollLeft: number;
        fixed?: "left" | "right";
        groupLeafKeys: Map<string, string[]>;
        originalHeaderCellWidths: Array<{ cell: HTMLTableCellElement; width: string }>;
        compensation: Array<{
          key: string;
          startWidth: number;
          minWidth: number;
          maxWidth: number;
          element: HTMLTableColElement | null;
        }>;
        tableElement: HTMLTableElement | null;
        headerCell: HTMLTableCellElement | null;
        originalColumnWidths: Record<string, string>;
        originalFillColumnWidth: string;
        originalTableWidth: string;
        originalTableMinWidth: string;
        fillWidth: number;
        protectedFillKey?: string;
        tableExtraWidth: number;
        pointerTarget: HTMLElement | null;
        targets: HTMLElement[];
      }
    | {
        axis: "row";
        key: string;
        pointerId: number;
        hasPointerMove: boolean;
        startY: number;
        startHeight: number;
        minHeight: number;
        maxHeight: number;
        baseHeights: Record<string, number>;
        baseHeightSignature: string;
        sourceMinHeight: number;
        sourceMaxHeight: number;
        startBoundary: number;
        row: HTMLTableRowElement | null;
        pointerTarget: HTMLElement | null;
      };
  const resizeState = React.useRef<ResizeSession | undefined>(undefined);
  const resizeCleanupRef = React.useRef<(() => void) | undefined>(undefined);
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
  const setColumnDomWidths = (widths: Record<string, number>, tableFillFloor?: number) => {
    const state = resizeState.current;
    if (!state || state.axis !== "column") return;
    // Always freeze the entire colgroup and its exact sum. Leaving the table
    // at 100% asks the browser to distribute spare pixels to fixed leaves too.
    const nextWidths = { ...state.baseColumnWidths, ...widths };
    state.tableElement?.querySelectorAll<HTMLTableColElement>("col[data-biu-column-key]").forEach((column) => {
      const width = nextWidths[column.dataset.biuColumnKey ?? ""];
      if (width !== undefined) column.style.width = `${width}px`;
    });
    const columnsWidth = Object.values(nextWidths).reduce((sum, width) => sum + width, 0);
    const tableWidth = Math.max(columnsWidth + state.tableExtraWidth, tableFillFloor ?? state.fillWidth);
    const fillWidth = Math.max(0, tableWidth - columnsWidth - state.tableExtraWidth);
    const fillColumn = state.tableElement?.querySelector<HTMLTableColElement>("col[data-biu-resize-fill]");
    if (fillColumn) fillColumn.style.width = `${fillWidth}px`;
    state.tableElement?.style.setProperty("width", `${tableWidth}px`);
    state.tableElement?.style.setProperty("min-width", `${tableWidth}px`);
    state.tableElement?.querySelectorAll<HTMLTableCellElement>("thead th[data-biu-column-key]").forEach((cell) => {
      const key = cell.dataset.biuColumnKey;
      if (!key) return;
      const descendants = state.groupLeafKeys.get(key);
      if (descendants) {
        const groupWidth = descendants.reduce((total, leafKey) => total + (nextWidths[leafKey] ?? 0), 0);
        const groupedFillWidth = cell.colSpan > descendants.length ? fillWidth : 0;
        cell.style.setProperty("width", `${groupWidth + groupedFillWidth}px`);
        return;
      }
      const width = nextWidths[key];
      if (width !== undefined) cell.style.setProperty("width", `${width}px`);
    });
    syncFixedColumnAnchors(scrollRef.current, state.tableElement);
  };
  const restoreResizeDom = (state: ResizeSession) => {
    if (state.axis !== "column") return;
    const columns = Array.from(
      state.tableElement?.querySelectorAll<HTMLTableColElement>("col[data-biu-column-key]") ?? [],
    );
    Object.entries(state.originalColumnWidths).forEach(([key, original]) => {
      const column = columns.find((item) => item.dataset.biuColumnKey === key);
      if (!column) return;
      if (original) column.style.setProperty("width", original);
      else column.style.removeProperty("width");
    });
    const fillColumn = state.tableElement?.querySelector<HTMLTableColElement>("col[data-biu-resize-fill]");
    if (fillColumn) {
      if (state.originalFillColumnWidth) fillColumn.style.setProperty("width", state.originalFillColumnWidth);
      else fillColumn.style.removeProperty("width");
    }
    state.originalHeaderCellWidths.forEach(({ cell, width }) => {
      if (!cell.isConnected) return;
      if (width) cell.style.setProperty("width", width);
      else cell.style.removeProperty("width");
    });
    state.tableElement?.style.setProperty("width", state.originalTableWidth);
    state.tableElement?.style.setProperty("min-width", state.originalTableMinWidth);
    syncFixedColumnAnchors(scrollRef.current, state.tableElement);
  };
  const clearResizeListeners = () => {
    releaseResizePointer(resizeState.current);
    resizeCleanupRef.current?.();
  };
  const committedColumnLayout = (state: Extract<ResizeSession, { axis: "column" }>, widths: Record<string, number>) => {
    // Preserve the accepted target, then fill only eligible ordinary leaves.
    // The live guide still follows the target's boundary before this commit.
    const layout = resolveColumnLayout(
      visibleColumns.map((column) => ({ ...column, width: widths[column.key] })),
      state.fillWidth,
      state.tableExtraWidth,
      layoutStretchColumnKey,
      {},
      state.fillWidth,
      state.protectedFillKey,
    );
    const next: Record<string, number | string> = { ...state.baseWidths, ...layout.widths };
    for (const [key, width] of Object.entries(state.protectedWidths)) {
      if (width === undefined) delete next[key];
      else next[key] = width;
    }
    return { widths: next, layoutWidths: layout.widths };
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
          const committed = committedColumnLayout(state, { ...preview.widths, [state.key]: value });
          // React may have rendered the live preview during an unrelated
          // parent update. Keep the DOM aligned with the final committed
          // layout before clearing that preview; restoring the original
          // widths here can leave a same-valued React style diff unapplied.
          setColumnDomWidths(committed.layoutWidths, 0);
          const next = committed.widths;
          if (columnWidths === undefined) setInternalColumnWidths(next);
          onWidthCommit(next, state.protectedFillKey);
          onColumnWidthsChange?.(next);
          onColumnResize?.(state.key, value);
        } else {
          restoreResizeDom(state);
        }
        if (state.axis === "row" && preview.axis === "row") {
          const next = { ...state.baseHeights, [state.key]: preview.value };
          if (rowHeights === undefined) setInternalRowHeights(next);
          onRowHeightsChange?.(next);
          onRowResize?.(state.key, preview.value);
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
    if (restoreDom && resizeState.current) {
      restoreResizeDom(resizeState.current);
    }
    clearResizeTargets();
    clearResizeListeners();
    resizeState.current = undefined;
    resizePreviewRef.current = undefined;
    setResizePreview(undefined);
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
      let boundaryPosition =
        state.startBoundary +
        state.resizeDirection * (nextWidth - state.startWidth) +
        (state.fixed ? (scrollRef.current?.scrollLeft ?? 0) - state.startScrollLeft : 0);
      setColumnDomWidths(widths);
      if (state.fixed && state.headerCell) {
        const boundary = state.headerCell.getBoundingClientRect();
        const viewport = scrollRect();
        if (boundary.width > 0 && viewport)
          boundaryPosition =
            (state.fixed === "right" ? boundary.left : boundary.right) -
            viewport.left +
            (scrollRef.current?.scrollLeft ?? 0);
      }
      const preview = {
        axis: "column",
        key: state.key,
        value: nextWidth,
        widths,
        position: boundaryPosition,
        fillWidth: state.fillWidth,
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
    if (
      currentPreview?.axis !== "row" ||
      currentPreview.value !== preview.value ||
      currentPreview.position !== preview.position
    )
      setPreview(preview);
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
    const targetIndex = visibleColumns.findIndex((item) => item.key === column.key);
    const followingColumns = visibleColumns.slice(targetIndex + 1).filter((item) => !item.fixed && !item.actionColumn);
    const elasticColumnItem = layoutStretchColumnKey
      ? visibleColumns.find((item) => item.key === layoutStretchColumnKey && !item.fixed)
      : undefined;
    // Prefer columns after the resized column so its trailing boundary can
    // follow the pointer. The last column changes the table content width;
    // earlier columns keep their configured widths during that interaction.
    const followingCompensation = [
      ...(elasticColumnItem && followingColumns.some((item) => item.key === elasticColumnItem.key)
        ? [elasticColumnItem]
        : []),
      ...followingColumns,
    ];
    const compensationColumns = (
      column.fixed ||
      column.actionColumn ||
      fillRemainingSpace === false ||
      elasticColumn === false ||
      scroll?.x === "max-content"
        ? []
        : followingCompensation
    ).filter((item, index, items) => items.findIndex((candidate) => candidate.key === item.key) === index);
    const minimumWidth = columnBounds(column).minimum;
    const measuredWidth = headerCell?.getBoundingClientRect().width ?? 0;
    const currentWidth = Math.max(minimumWidth, measuredWidth || baseColumnWidths[column.key] || 120);
    baseColumnWidths[column.key] = currentWidth;
    const compensation = compensationColumns.map((item) => {
      const startWidth = baseColumnWidths[item.key] ?? 120;
      return {
        key: item.key,
        startWidth,
        minWidth: columnBounds(item).minimum,
        maxWidth: columnBounds(item).maximum,
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
    const originalHeaderCellWidths = Array.from(
      tableElement?.querySelectorAll<HTMLTableCellElement>("thead th[data-biu-column-key]") ?? [],
    ).map((cell) => ({ cell, width: cell.style.width ?? "" }));
    const rect = scrollRect();
    const viewportWidth = scrollRef.current?.clientWidth || rect?.width || 0;
    const fillsViewport = fillRemainingSpace !== false && elasticColumn !== false && scroll?.x !== "max-content";
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
    const resizeDirection = column.fixed === "left" ? 1 : column.fixed === "right" ? -1 : direction;
    const headerBoundary = resizeDirection === -1 ? headerRect?.left : headerRect?.right;
    const startBoundary =
      rect && rect.width > 0 && headerRect && headerRect.width > 0 && headerBoundary !== undefined
        ? headerBoundary - rect.left + scrollRef.current!.scrollLeft
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
      compensation,
      tableElement,
      headerCell,
      originalColumnWidths,
      originalFillColumnWidth:
        tableElement?.querySelector<HTMLTableColElement>("col[data-biu-resize-fill]")?.style.width ?? "",
      originalTableWidth: tableElement?.style.width ?? "",
      originalTableMinWidth: tableElement?.style.minWidth ?? "",
      fillWidth: fillsViewport ? Math.max(viewportWidth, pixelWidth(scroll?.x, viewportWidth) ?? 0) : 0,
      protectedFillKey: fillsViewport && !column.fixed && !column.actionColumn ? column.key : undefined,
      tableExtraWidth: (rowSelection ? 42 : 0) + (expandable ? 42 : 0),
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
    });
    setColumnDomWidths(previewWidths);
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
    const { widths: next } = committedColumnLayout(state, widths);
    if (columnWidths === undefined) setInternalColumnWidths(next);
    onWidthCommit(next, state.protectedFillKey);
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
      syncFixedColumnAnchors(scrollElement, scrollElement.querySelector<HTMLTableElement>("table"));
    };
    const synchronizeScroll = () => {
      syncFixedColumnAnchors(scrollElement, scrollElement.querySelector<HTMLTableElement>("table"));
      const session = resizeState.current;
      const preview = resizePreviewRef.current;
      if (session?.axis !== "column" || !session.fixed || preview?.axis !== "column") return;
      const cell = session.headerCell?.getBoundingClientRect();
      const viewport = scrollElement.getBoundingClientRect();
      const position =
        cell && cell.width > 0
          ? (session.fixed === "right" ? cell.left : cell.right) - viewport.left + scrollElement.scrollLeft
          : session.startBoundary +
            session.resizeDirection * (preview.value - session.startWidth) +
            scrollElement.scrollLeft -
            session.startScrollLeft;
      resizePreviewRef.current = { ...preview, position };
      setPreviewPosition({ ...preview, position });
    };
    const observer = new ResizeObserver(cancelIfGeometryChanged);
    observer.observe(scrollElement);
    const table = scrollElement.querySelector<HTMLTableElement>("table");
    if (table) observer.observe(table);
    window.addEventListener("resize", cancelIfGeometryChanged);
    scrollElement.addEventListener("scroll", synchronizeScroll);
    return () => {
      observer.disconnect();
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
