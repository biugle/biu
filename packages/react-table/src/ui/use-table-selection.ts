import * as React from "react";
import { checkboxPropsFor } from "./column-utils.js";
import type { TableRowSelection } from "./types.js";

interface UseTableSelectionOptions<T extends object> {
  rowSelection?: TableRowSelection<T>;
  displayedData: T[];
  getKey: (record: T, index: number) => React.Key;
}

export function useTableSelection<T extends object>({
  rowSelection,
  displayedData,
  getKey,
}: UseTableSelectionOptions<T>) {
  const availableRows = React.useMemo(() => {
    if (!rowSelection) return [] as Array<{ record: T; index: number; key: React.Key }>;
    return displayedData.flatMap((record, index) =>
      checkboxPropsFor(rowSelection, record).disabled ? [] : [{ record, index, key: getKey(record, index) }],
    );
  }, [displayedData, getKey, rowSelection]);
  const allAvailableKeys = React.useMemo(() => availableRows.map(({ key }) => key), [availableRows]);
  const selectedKeySet = React.useMemo(
    () => new Set(rowSelection?.selectedRowKeys ?? []),
    [rowSelection?.selectedRowKeys],
  );
  const allSelected = Boolean(
    rowSelection && allAvailableKeys.length && allAvailableKeys.every((key) => selectedKeySet.has(key)),
  );
  const someSelected = Boolean(rowSelection && allAvailableKeys.some((key) => selectedKeySet.has(key)) && !allSelected);

  const selectRow = (record: T, index: number) => {
    if (!rowSelection) return;
    const key = getKey(record, index);
    const current = new Set(rowSelection.selectedRowKeys);
    const selected = !current.has(key);
    if (selected) current.add(key);
    else current.delete(key);
    const keys = [...current];
    const selectedRows = displayedData.filter((item, itemIndex) => current.has(getKey(item, itemIndex)));
    rowSelection.onChange(keys, selectedRows);
    rowSelection.onSelect?.(record, selected, selectedRows);
  };

  const selectAll = () => {
    if (!rowSelection) return;
    const nextSelection = new Set(rowSelection.selectedRowKeys);
    if (allSelected) allAvailableKeys.forEach((key) => nextSelection.delete(key));
    else allAvailableKeys.forEach((key) => nextSelection.add(key));
    const next = [...nextSelection];
    const selectedRows = displayedData.filter((record, index) => nextSelection.has(getKey(record, index)));
    rowSelection.onChange(next, selectedRows);
    rowSelection.onSelectAll?.(
      !allSelected,
      selectedRows,
      availableRows.map(({ record }) => record),
    );
  };
  const selectAllRef = React.useRef<HTMLInputElement>(null);

  React.useLayoutEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected;
  }, [someSelected]);

  return { selectRow, selectAll, allAvailableKeys, allSelected, selectedKeySet, selectAllRef };
}
