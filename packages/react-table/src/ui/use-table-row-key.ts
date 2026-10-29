import * as React from "react";
import type { TableProps } from "./types.js";

/** Resolve stable source indexes without repeatedly scanning a large data set. */
export function useTableRowKey<T extends object>(dataSource: T[], rowKey: TableProps<T>["rowKey"]) {
  const sourceIndexByRecord = React.useMemo(() => {
    if (rowKey) return undefined;
    const indexes = new Map<T, number>();
    dataSource.forEach((record, index) => {
      // Preserve Array#indexOf's first-match behavior for repeated object refs.
      if (!indexes.has(record)) indexes.set(record, index);
    });
    return indexes;
  }, [dataSource, rowKey]);

  return React.useCallback(
    (record: T, index: number): React.Key => {
      if (!rowKey) return String(sourceIndexByRecord?.get(record) ?? index);
      if (rowKey instanceof Function) return rowKey(record, index);
      const value = record[rowKey];
      return value === undefined || value === null ? String(index) : (value as React.Key);
    },
    [rowKey, sourceIndexByRecord],
  );
}
