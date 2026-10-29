import type { RefObject } from "react";
import type { Row as TableRow } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { TableProps } from "./types.js";

interface TableVirtualizerOptions<T extends object> {
  virtual: NonNullable<TableProps<T>["virtual"]>;
  rows: TableRow<T>[];
  scrollRef: RefObject<HTMLDivElement | null>;
  estimateRowHeight: (record: T, index: number) => number | undefined;
}

export function useTableVirtualizer<T extends object>({
  virtual,
  rows,
  scrollRef,
  estimateRowHeight,
}: TableVirtualizerOptions<T>) {
  const virtualOptions = typeof virtual === "object" ? virtual : {};
  const virtualizer = useVirtualizer({
    enabled: Boolean(virtual),
    count: virtual ? rows.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => {
      const row = rows[index];
      return row ? (estimateRowHeight(row.original, index) ?? virtualOptions.estimateSize ?? 44) : 44;
    },
    getItemKey: (index) => rows[index]?.id ?? index,
    overscan: virtualOptions.overscan ?? 5,
  });
  return { virtualizer, virtualItems: virtual ? virtualizer.getVirtualItems() : [] };
}
