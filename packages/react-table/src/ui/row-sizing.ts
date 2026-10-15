export interface RowHeightBounds {
  minimum: number;
  maximum: number;
}

export function rowHeightBounds(minRowHeight = 40, maxRowHeight = Number.POSITIVE_INFINITY): RowHeightBounds {
  const minimum = Number.isFinite(minRowHeight) && minRowHeight > 0 ? Math.max(24, minRowHeight) : 40;
  const maximum = Number.isFinite(maxRowHeight) ? Math.max(minimum, maxRowHeight) : Number.POSITIVE_INFINITY;
  return { minimum, maximum };
}

export function clampRowHeight(height: number, minRowHeight = 40, maxRowHeight = Number.POSITIVE_INFINITY): number {
  const { minimum, maximum } = rowHeightBounds(minRowHeight, maxRowHeight);
  return Math.min(maximum, Math.max(minimum, Number.isFinite(height) ? height : minimum));
}

export function resizeRowHeight(
  startHeight: number,
  delta: number,
  minRowHeight = 40,
  maxRowHeight = Number.POSITIVE_INFINITY,
): number {
  return clampRowHeight(Math.round(startHeight + delta), minRowHeight, maxRowHeight);
}
