import * as React from "react";
import { Tooltip } from "@biugle/react-components";
import { ArrowDown, ArrowDownUp, ArrowUp, CircleHelp } from "@biugle/icons";
import type { Column, TableSortOrder } from "./types.js";

interface HeaderContentProps<T extends object> {
  column: Column<T>;
  sortOrder?: TableSortOrder;
  onSort: (column: Column<T>) => void;
  filterTrigger: React.ReactNode;
  filterValue: unknown;
  onFilterChange: (value: unknown) => void;
}

export function TableHeaderContent<T extends object>({
  column,
  sortOrder,
  onSort,
  filterTrigger,
  filterValue,
  onFilterChange,
}: HeaderContentProps<T>) {
  return (
    <div
      className="biu-table__header-content"
      style={{
        justifyContent: column.align === "right" ? "flex-end" : column.align === "center" ? "center" : "flex-start",
      }}
    >
      {column.sortable ? (
        <button type="button" className="biu-table__sort-button" onClick={() => onSort(column)}>
          <span className="biu-table__header-title">{column.title}</span>
          <span className="biu-table__sort-icon" aria-hidden="true">
            {sortOrder === "ascend" ? (
              <ArrowUp size={14} />
            ) : sortOrder === "descend" ? (
              <ArrowDown size={14} />
            ) : (
              <ArrowDownUp size={14} />
            )}
          </span>
        </button>
      ) : (
        <span className="biu-table__header-title">{column.title}</span>
      )}
      {column.tooltip ? (
        <Tooltip
          content={column.tooltip}
          onlyOverflow={false}
          classNames={{ root: "biu-table__header-tooltip-root", trigger: "biu-table__header-tooltip-trigger" }}
        >
          <button
            type="button"
            className="biu-table__header-tooltip"
            aria-label={typeof column.tooltip === "string" ? column.tooltip : undefined}
          >
            <CircleHelp size={13} aria-hidden="true" />
          </button>
        </Tooltip>
      ) : null}
      {filterTrigger}
      {column.filters?.length && !column.filterDropdown && column.filterRender
        ? column.filterRender(column.filters, filterValue, (value) => onFilterChange(value))
        : null}
    </div>
  );
}
