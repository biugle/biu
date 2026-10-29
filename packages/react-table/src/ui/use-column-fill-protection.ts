import * as React from "react";
import type { Column } from "./types.js";
import { columnGeometrySignature, sizeMapSignature } from "./column-utils.js";

const NO_PROTECTED_COLUMNS: string[] = [];

/**
 * Retain every manually resized ordinary leaf until an external width change,
 * reset, or geometry change replaces the current width map. Keep the table's
 * designated dynamic leaf stable across those drags: directly resizing it pins
 * its chosen width, while later resizes of other leaves compensate through it.
 */
export function useColumnFillProtection<T extends object>(
  columns: Column<T>[],
  widths: Record<string, number | string>,
  structure: string,
) {
  const [lock, setLock] = React.useState<{
    keys: string[];
    fillKey?: string;
    fillPinned: boolean;
    fillViewportWidth?: number;
    geometry: string;
    baseSignature: string;
    committedSignature: string;
    structure: string;
    accepted: boolean;
  }>();
  const signature = sizeMapSignature(widths);
  const geometry = columnGeometrySignature(columns);
  const sameGeometry = Boolean(lock && lock.geometry === geometry && lock.structure === structure);
  const active = sameGeometry && lock!.committedSignature === signature;
  React.useLayoutEffect(() => {
    if (
      lock &&
      (!sameGeometry || ((lock.accepted || signature !== lock.baseSignature) && signature !== lock.committedSignature))
    )
      setLock(undefined);
    else if (lock && active && !lock.accepted) setLock({ ...lock, accepted: true });
  }, [active, lock, sameGeometry, signature, widths]);
  const commit = (
    next: Record<string, number | string>,
    keys: string[],
    fillKey?: string,
    fillPinned = false,
    fillViewportWidth?: number,
  ) => {
    const protectedKeys = [...new Set(keys)];
    if (!protectedKeys.length) {
      setLock(undefined);
      return;
    }
    setLock({
      keys: protectedKeys,
      fillKey,
      fillPinned,
      fillViewportWidth,
      geometry,
      baseSignature: signature,
      committedSignature: sizeMapSignature(next),
      structure,
      accepted: false,
    });
  };
  return {
    keys: active ? lock!.keys : NO_PROTECTED_COLUMNS,
    fillKey: active ? lock!.fillKey : undefined,
    fillPinned: active ? lock!.fillPinned : false,
    fillViewportWidth: active ? lock!.fillViewportWidth : undefined,
    commit,
  };
}
