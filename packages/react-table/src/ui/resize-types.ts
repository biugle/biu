import type * as React from "react";
import type { Column, TableProps } from "./types.js";

export interface ResizeOptions<T extends object> extends Pick<
  TableProps<T>,
  | "columns"
  | "columnWidths"
  | "rowHeights"
  | "virtual"
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
  protectedFillKeys: string[];
  dynamicFillKey?: string;
  fillPinned: boolean;
  onWidthCommit: (
    widths: Record<string, number | string>,
    protectedFillKeys: string[],
    fillKey?: string,
    fillPinned?: boolean,
    fillViewportWidth?: number,
  ) => void;
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
      /** Keeps the table dimensions unchanged while a dynamic-column guide follows the pointer. */
      deferred?: boolean;
      /** Widths to commit when the pointer is released after a deferred preview. */
      commitWidths?: Record<string, number>;
    }
  | { axis: "row"; position: number; key: string; value: number }
  | undefined;

/** Per-pointer snapshot used to commit or restore one resize transaction. */
export type ResizeSession =
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
      originalBodyCellWidths: Array<{ cell: HTMLTableCellElement; width: string }>;
      compensation: Array<{
        key: string;
        startWidth: number;
        minWidth: number;
        maxWidth: number;
        element: HTMLTableColElement | null;
      }>;
      fillSlack: number;
      tableElement: HTMLTableElement | null;
      columnElements: HTMLTableColElement[];
      fillColumnElement: HTMLTableColElement | null;
      headerElements: HTMLTableCellElement[];
      headerCell: HTMLTableCellElement | null;
      originalColumnWidths: Record<string, string>;
      originalFillColumnWidth: string;
      originalTableWidth: string;
      originalTableMinWidth: string;
      fillWidth: number;
      protectedFillKeys: string[];
      dynamicFillKey?: string;
      fillPinned: boolean;
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
      originalRowHeight: string;
      originalCellHeights: Array<{ cell: HTMLTableCellElement; height: string }>;
      originalHandleValue: string | null;
      pointerTarget: HTMLElement | null;
    };
