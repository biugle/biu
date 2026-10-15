import * as React from "react";
import type { Column } from "./types.js";
import { columnGeometrySignature, sizeMapSignature } from "./column-utils.js";

/** Keep the latest accepted target out of automatic surplus allocation.
 * Viewport changes fill other ordinary leaves; reject/reset/structural changes
 * release the protection without reviving a previous commit.
 */
export function useColumnFillProtection<T extends object>(
  columns: Column<T>[],
  widths: Record<string, number | string>,
  structure: string,
) {
  const [lock, setLock] = React.useState<{
    key: string;
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
  const commit = (next: Record<string, number | string>, key?: string) => {
    if (!key) {
      setLock(undefined);
      return;
    }
    setLock({
      key,
      geometry,
      baseSignature: signature,
      committedSignature: sizeMapSignature(next),
      structure,
      accepted: false,
    });
  };
  return { key: active ? lock!.key : undefined, commit };
}
