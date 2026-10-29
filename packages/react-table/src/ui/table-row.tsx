import * as React from "react";
import type { Row } from "@tanstack/react-table";
import { Ellipsis } from "@biugle/react-components";
import { Minus, Plus } from "@biugle/icons";
import type { Column, TableProps } from "./types.js";
import type { BiuTableLocaleText } from "../locale/index.js";
import { valueAt } from "./data.js";
import { actionColumnMaxCount } from "./column-sizing.js";
import { checkboxPropsFor, columnWidth, cx, resolvedSpan } from "./column-utils.js";

interface RenderRowProps<T extends object> {
  row: Row<T>;
  index: number;
  visibleColumns: Column<T>[];
  fixedStyles: ReadonlyMap<string, React.CSSProperties>;
  rowSelection?: TableProps<T>["rowSelection"];
  selected: Set<React.Key>;
  getKey: (record: T, index: number) => React.Key;
  onSelect: (record: T, index: number) => void;
  expandable?: TableProps<T>["expandable"];
  onExpand: (record: T, index: number) => void;
  onRow?: TableProps<T>["onRow"];
  rowClassName?: TableProps<T>["rowClassName"];
  expandedRowClassName?: TableProps<T>["expandedRowClassName"];
  classNames?: TableProps<T>["classNames"];
  components?: TableProps<T>["components"];
  text: BiuTableLocaleText;
  columnWidths?: Record<string, number | string>;
  actionViewportWidth: number;
  rowHeight?: number;
  rowResizable?: boolean;
  minRowHeight: number;
  maxRowHeight: number;
  onRowResizeStart?: (event: React.PointerEvent, key: string, row: HTMLTableRowElement | null) => void;
  onRowResizeByKeyboard?: (
    event: React.KeyboardEvent<HTMLElement>,
    key: string,
    row: HTMLTableRowElement | null,
  ) => void;
  stretchColumnKey?: string;
  resizeFillColumnKey?: string;
  resizeFillPosition?: "before" | "after";
}

export function createTableExpandHandler<T extends object>(
  expandedKeys: React.Key[],
  expandable: TableProps<T>["expandable"],
  getKey: (record: T, index: number) => React.Key,
  setInternalExpanded: React.Dispatch<React.SetStateAction<React.Key[]>>,
) {
  return (record: T, index: number) => {
    const key = getKey(record, index);
    const next = expandedKeys.includes(key) ? expandedKeys.filter((item) => item !== key) : [...expandedKeys, key];
    if (expandable?.expandedRowKeys === undefined) setInternalExpanded(next);
    expandable?.onExpandedRowsChange?.(next);
  };
}

export function RenderRow<T extends object>({
  row,
  index,
  visibleColumns,
  fixedStyles,
  rowSelection,
  selected,
  getKey,
  onSelect,
  expandable,
  onExpand,
  onRow,
  rowClassName,
  expandedRowClassName,
  classNames,
  components,
  text,
  columnWidths,
  actionViewportWidth,
  rowHeight,
  rowResizable = false,
  minRowHeight,
  maxRowHeight,
  onRowResizeStart,
  onRowResizeByKeyboard,
  stretchColumnKey,
  resizeFillColumnKey,
  resizeFillPosition,
}: RenderRowProps<T>) {
  const record = row.original;
  const key = getKey(record, index);
  const Row = components?.row ?? "tr";
  const Cell = components?.cell ?? "td";
  const checkboxProps = checkboxPropsFor(rowSelection, record);
  const expandableAllowed = Boolean(expandable && (!expandable.rowExpandable || expandable.rowExpandable(record)));
  const rowProps = onRow?.(record, index);
  const cells = visibleColumns.map((column) => {
    const actionLimit = column.actionColumn
      ? actionColumnMaxCount(actionViewportWidth, columnWidth(column, columnWidths ?? {}))
      : undefined;
    const fixedStyle = column.fixed ? fixedStyles.get(column.key) : undefined;
    return (
      <Cell
        key={column.key}
        data-biu-column-key={column.key}
        data-biu-fixed={column.fixed}
        data-biu-table-action-limit={actionLimit}
        className={cx(
          classNames?.cell,
          column.className,
          column.actionColumn && "biu-table__actions-column",
          column.fixed && "biu-table__cell--fixed",
          column.fixed === "left" && "biu-table__cell--fixed-left",
          column.fixed === "right" && "biu-table__cell--fixed-right",
          column.ellipsis && "biu-table__cell--ellipsis",
          column.noWrap && "biu-table__cell--nowrap",
        )}
        style={{
          width: column.key === stretchColumnKey ? undefined : columnWidth(column, columnWidths ?? {}),
          minWidth: column.minWidth,
          maxWidth: typeof column.ellipsis === "object" ? column.ellipsis.maxWidth : undefined,
          textAlign: column.align,
          ...fixedStyle,
          ...(rowHeight !== undefined ? { height: rowHeight } : {}),
        }}
        colSpan={resolvedSpan(column.colSpan, record)}
        rowSpan={resolvedSpan(column.rowSpan, record)}
      >
        {(() => {
          const value =
            column.renderCell || column.render
              ? (column.renderCell ?? column.render)?.(valueAt(record, column), record, index)
              : (valueAt(record, column) as React.ReactNode);
          return column.ellipsis ? (
            <Ellipsis
              content={value}
              maxWidth={typeof column.ellipsis === "object" ? column.ellipsis.maxWidth : undefined}
              className="biu-table__ellipsis"
            >
              {value}
            </Ellipsis>
          ) : (
            value
          );
        })()}
      </Cell>
    );
  });
  const cellsWithResizeHandle =
    rowResizable && cells.length
      ? cells.map((cell, cellIndex) =>
          cellIndex === cells.length - 1
            ? React.cloneElement(cell, {
                children: (
                  <>
                    {cell.props.children}
                    <span
                      role="separator"
                      aria-orientation="horizontal"
                      aria-label={`${text["行高"]} ${index + 1}`}
                      aria-valuemin={minRowHeight}
                      aria-valuemax={Number.isFinite(maxRowHeight) ? maxRowHeight : undefined}
                      aria-valuenow={rowHeight}
                      tabIndex={0}
                      className="biu-table__row-resize-handle"
                      onPointerDown={(event) =>
                        onRowResizeStart?.(event, String(key), event.currentTarget.closest("tr"))
                      }
                      onKeyDown={(event) =>
                        onRowResizeByKeyboard?.(event, String(key), event.currentTarget.closest("tr"))
                      }
                    />
                  </>
                ),
              })
            : cell,
        )
      : cells;
  const resizeFillCell =
    resizeFillColumnKey && resizeFillPosition ? (
      <Cell key="__biu-resize-fill" className="biu-table__resize-fill-cell" aria-hidden="true" />
    ) : null;
  const resizeFillAnchorIndex = resizeFillColumnKey
    ? cellsWithResizeHandle.findIndex((cell) => cell.props["data-biu-column-key"] === resizeFillColumnKey)
    : -1;
  const cellsWithResizeFill =
    resizeFillCell && resizeFillAnchorIndex >= 0
      ? [
          ...cellsWithResizeHandle.slice(0, resizeFillAnchorIndex + (resizeFillPosition === "after" ? 1 : 0)),
          resizeFillCell,
          ...cellsWithResizeHandle.slice(resizeFillAnchorIndex + (resizeFillPosition === "after" ? 1 : 0)),
        ]
      : cellsWithResizeHandle;
  return (
    <React.Fragment key={String(key)}>
      <Row
        {...rowProps}
        style={{ ...rowProps?.style, ...(rowHeight ? { height: rowHeight } : {}) }}
        className={cx(
          classNames?.row,
          rowProps?.className,
          typeof rowClassName === "function" ? rowClassName(record, index) : rowClassName,
          row.getIsExpanded() && "biu-table__row--expanded",
        )}
      >
        {rowSelection ? (
          <Cell
            className="biu-table__selection-cell biu-table__cell--fixed biu-table__cell--fixed-left"
            style={{ position: "sticky", left: 0, zIndex: 7 }}
          >
            <input
              type="checkbox"
              checked={selected.has(key)}
              disabled={checkboxProps?.disabled}
              aria-label={
                checkboxProps?.["aria-label"] ?? text["选择第 {index} 行"].replace("{index}", String(index + 1))
              }
              onChange={() => onSelect(record, index)}
            />
          </Cell>
        ) : null}
        {expandable ? (
          <Cell
            className="biu-table__expand-cell biu-table__cell--fixed biu-table__cell--fixed-left"
            style={{ position: "sticky", left: rowSelection ? 42 : 0, zIndex: 7 }}
          >
            {expandableAllowed ? (
              <button
                type="button"
                className="biu-table__expand-button"
                aria-label={row.getIsExpanded() ? text["收起行"] : text["展开行"]}
                aria-expanded={row.getIsExpanded()}
                onClick={() => onExpand(record, index)}
              >
                <span aria-hidden="true">{row.getIsExpanded() ? <Minus size={14} /> : <Plus size={14} />}</span>
              </button>
            ) : null}
          </Cell>
        ) : null}
        {cellsWithResizeFill}
      </Row>
      {row.getIsExpanded() ? (
        <Row
          className={cx(
            classNames?.expanded,
            "biu-table__expanded-row",
            typeof expandedRowClassName === "function" ? expandedRowClassName(record, index) : expandedRowClassName,
          )}
        >
          <Cell
            colSpan={visibleColumns.length + (rowSelection ? 1 : 0) + (expandable ? 1 : 0) + (resizeFillCell ? 1 : 0)}
          >
            {expandable?.expandedRowRender(record, index)}
          </Cell>
        </Row>
      ) : null}
    </React.Fragment>
  );
}
