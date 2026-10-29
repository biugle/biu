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

/** Resolve one eligible leaf that owns all remaining viewport space. */
export function columnFillKey(
  columns: ColumnSizingInput[],
  fillKey: string | undefined,
  protectedFillKeys?: string | readonly string[],
) {
  const protectedKeys = new Set(
    typeof protectedFillKeys === "string" ? [protectedFillKeys] : (protectedFillKeys ?? []),
  );
  const allOrdinary = columns.filter((column) => !column.fixed && !column.actionColumn);
  const ordinary = allOrdinary.filter((column) => !protectedKeys.has(column.key));
  // The configured fill column owns the role even after a user resizes it.
  // Protection preserves its measured width; it must not silently transfer
  // the role to a preceding column on the next render.
  if (fillKey && allOrdinary.some((column) => column.key === fillKey)) return fillKey;
  return ordinary.at(-1)?.key ?? allOrdinary.at(-1)?.key;
}

/** Resolve resize balancing order in fill mode: dynamic column first, then its previous ordinary neighbor. */
export function columnResizeCompensationKeys(
  columns: ColumnSizingInput[],
  fillKey: string | undefined,
  targetKey: string,
): string[] {
  const targetIndex = columns.findIndex((column) => column.key === targetKey);
  const target = columns[targetIndex];
  if (!target || target.fixed || target.actionColumn || !fillKey) return [];
  const fillColumn = columns.find((column) => column.key === fillKey && !column.fixed && !column.actionColumn);
  if (!fillColumn) return [];
  const fillIndex = columns.findIndex((column) => column.key === fillColumn.key);
  const previousColumn = columns
    .slice(0, fillIndex)
    .filter((column) => !column.fixed && !column.actionColumn)
    .at(-1);

  // A direct drag on the dynamic leaf is balanced by its previous ordinary
  // neighbor. Other resizable leaves use the dynamic leaf first, then that
  // same neighbor if the dynamic leaf reaches its min/max bound.
  const candidates = target.key === fillColumn.key ? [previousColumn] : [fillColumn, previousColumn];
  return candidates
    .filter((column): column is ColumnSizingInput => column !== undefined && column.key !== target.key)
    .map((column) => column.key);
}

/** Resolve every leaf before asking the browser to lay out a fixed table.
 * A 100%-wide table with a full numeric colgroup redistributes spare pixels
 * across all columns, including sticky ones. The table and colgroup must
 * instead receive the same exact sum; only the designated dynamic ordinary
 * leaf receives viewport surplus.
 */
export function resolveColumnLayout(
  columns: ColumnSizingInput[],
  viewportWidth: number,
  extraWidth: number,
  fillKey: string | undefined,
  measuredWidths: Record<string, number> = {},
  widthBasis = viewportWidth,
  protectedFillKey?: string | readonly string[],
  responsiveViewportWidth = viewportWidth,
  fillPinned = false,
) {
  const protectedKeys = new Set(typeof protectedFillKey === "string" ? [protectedFillKey] : (protectedFillKey ?? []));
  const activeFillKey = columnFillKey(columns, fillKey, protectedFillKey);
  if (fillPinned && activeFillKey) protectedKeys.add(activeFillKey);
  const widths: Record<string, number> = {};
  for (const column of columns) {
    const { minimum, maximum } = columnBounds(column);
    const configured = pixelWidth(column.width, widthBasis);
    const fallback = column.actionColumn
      ? actionColumnWidth(responsiveViewportWidth)
      : (measuredWidths[column.key] ?? 120);
    const resolved = Math.max(minimum, configured ?? fallback);
    widths[column.key] = protectedKeys.has(column.key) ? resolved : Math.min(maximum, resolved);
  }
  const remaining = Math.max(
    0,
    viewportWidth - extraWidth - Object.values(widths).reduce((sum, width) => sum + width, 0),
  );
  // Keep the fill role on one visible leaf. Spreading surplus across several
  // columns makes a later resize appear to undo earlier user choices. Auto
  // fill may exceed maxWidth; that limit applies to direct user resizing.
  if (remaining > 0 && activeFillKey && !fillPinned) widths[activeFillKey]! += remaining;
  const contentWidth = Object.values(widths).reduce((sum, width) => sum + width, extraWidth);
  // Once a user has pinned a resized fill column, keep the table at its
  // viewport floor with an explicit spacer. That preserves the chosen width
  // while still allowing the same fill column to absorb later drag deltas.
  const totalWidth = fillPinned && activeFillKey ? Math.max(viewportWidth, contentWidth) : contentWidth;
  return { widths, totalWidth };
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
  /** Existing table spacer that can absorb growth after the fill column hits its minimum. */
  fillSlack?: number;
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
  // Treat the target and its compensation columns as one bounded resize. In
  // particular, a direct drag on the dynamic leaf must stop when its adjacent
  // ordinary neighbor can no longer absorb the opposite delta; otherwise the
  // target keeps shrinking and creates a misleading spacer beside it.
  const delta = state.compensation.length
    ? Math.min(shrinkCapacity + Math.max(0, state.fillSlack ?? 0), Math.max(-growCapacity, requestedDelta))
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
