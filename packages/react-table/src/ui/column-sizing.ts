import type { Column } from "./types.js";

function actionViewportWidth(viewportWidth: number) {
  return Number.isFinite(viewportWidth) && viewportWidth > 0 ? viewportWidth : 800;
}

export function actionColumnWidth(viewportWidth: number) {
  const availableWidth = actionViewportWidth(viewportWidth);
  if (availableWidth < 560) return 60;
  if (availableWidth < 800) return 160;
  return 190;
}

export function actionColumnMaxCount(viewportWidth: number, width?: number | string) {
  const availableViewport = actionViewportWidth(viewportWidth);
  const responsiveLimit = availableViewport < 560 ? 1 : availableViewport < 800 ? 3 : 5;
  const resolvedWidth = pixelWidth(width, availableViewport) ?? actionColumnWidth(availableViewport);
  const availableWidth = Math.max(0, resolvedWidth - 12);
  const fittingSlots = Math.max(1, Math.floor((availableWidth + 6) / 36));
  return Math.min(responsiveLimit, fittingSlots);
}

export function columnBounds(column: Pick<Column<object>, "minWidth" | "maxWidth">) {
  const minimum = Number.isFinite(column.minWidth) && column.minWidth! > 0 ? Math.max(1, column.minWidth!) : 48;
  const maximum = Math.max(minimum, Number.isFinite(column.maxWidth) ? column.maxWidth! : Number.POSITIVE_INFINITY);
  return { minimum, maximum };
}

export function pixelWidth(value: number | string | undefined, viewport = 0): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value !== "string") return undefined;
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)(px|%)$/i);
  if (!match) return undefined;
  return match[2] === "%" ? (viewport > 0 ? (Number(match[1]) * viewport) / 100 : undefined) : Number(match[1]);
}

export interface ColumnSizingInput {
  key: string;
  fixed?: "left" | "right";
  actionColumn?: boolean;
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
}

/** Resolve every leaf before asking the browser to lay out a fixed table.
 * A 100%-wide table with a full numeric colgroup redistributes spare pixels
 * across all columns, including sticky ones. The table and colgroup must
 * instead receive the same exact sum; only ordinary leaves receive surplus.
 */
export function resolveColumnLayout(
  columns: ColumnSizingInput[],
  viewportWidth: number,
  extraWidth: number,
  fillKey: string | undefined,
  measuredWidths: Record<string, number> = {},
  widthBasis = viewportWidth,
  protectedFillKey?: string,
  responsiveViewportWidth = viewportWidth,
) {
  const widths: Record<string, number> = {};
  for (const column of columns) {
    const { minimum, maximum } = columnBounds(column);
    const configured = pixelWidth(column.width, widthBasis);
    const fallback = column.actionColumn
      ? actionColumnWidth(responsiveViewportWidth)
      : (measuredWidths[column.key] ?? 120);
    const resolved = Math.max(minimum, configured ?? fallback);
    widths[column.key] = column.key === protectedFillKey ? resolved : Math.min(maximum, resolved);
  }
  let remaining = Math.max(
    0,
    viewportWidth - extraWidth - Object.values(widths).reduce((sum, width) => sum + width, 0),
  );
  const ordinary = columns.filter((column) => !column.fixed && !column.actionColumn && column.key !== protectedFillKey);
  const candidates = [ordinary.find((column) => column.key === fillKey), ...[...ordinary].reverse()].filter(
    (column, index, items): column is ColumnSizingInput => Boolean(column) && items.indexOf(column) === index,
  );
  for (const column of candidates) {
    if (remaining <= 0) break;
    const capacity = Math.max(0, columnBounds(column).maximum - widths[column.key]!);
    const added = Math.min(capacity, remaining);
    widths[column.key]! += added;
    remaining -= added;
  }
  // maxWidth limits a user-driven resize. It cannot leave an enabled,
  // fillable table with unused viewport space, so the highest-priority
  // ordinary leaf absorbs any residual after every candidate reaches its
  // configured bound. Fixed, action, and auxiliary columns stay excluded.
  if (remaining > 0 && candidates.length) widths[candidates[0]!.key]! += remaining;
  return { widths, totalWidth: Object.values(widths).reduce((sum, width) => sum + width, extraWidth) };
}

interface ColumnResizeParticipant {
  key: string;
  startWidth: number;
  minWidth: number;
  maxWidth: number;
}

export interface ColumnResizeGeometry extends ColumnResizeParticipant {
  baseColumnWidths: Record<string, number>;
  compensation: ColumnResizeParticipant[];
}

/** Snapshot-based resizing makes consecutive drags independent of browser
 * redistribution and keeps every participant inside its own range.
 */
export function calculateColumnResize(state: ColumnResizeGeometry, rawDelta: number) {
  const growCapacity = state.compensation.reduce(
    (total, participant) => total + Math.max(0, participant.maxWidth - participant.startWidth),
    0,
  );
  const shrinkCapacity = state.compensation.reduce(
    (total, participant) => total + Math.max(0, participant.startWidth - participant.minWidth),
    0,
  );
  const requestedDelta = Math.min(
    state.maxWidth - state.startWidth,
    Math.max(state.minWidth - state.startWidth, rawDelta),
  );
  const delta = state.compensation.length
    ? Math.min(shrinkCapacity, Math.max(-growCapacity, requestedDelta))
    : requestedDelta;
  const widths = { ...state.baseColumnWidths, [state.key]: state.startWidth + delta };
  let remaining = -delta;
  for (const participant of state.compensation) {
    if (Math.abs(remaining) < 0.001) break;
    const next =
      remaining > 0
        ? Math.min(participant.maxWidth, participant.startWidth + remaining)
        : Math.max(participant.minWidth, participant.startWidth + remaining);
    widths[participant.key] = next;
    remaining -= next - participant.startWidth;
  }
  return widths;
}
