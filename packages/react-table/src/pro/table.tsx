import * as React from "react";
import { ArrowDown, ArrowUp, GripVertical, Lock, Maximize2, Minimize2, Settings } from "@biugle/icons";
import { Button, Checkbox, Popover } from "@biugle/react-components";
import { Table } from "../ui/table.js";
import type { Column, TableClassNames, TableProps } from "../ui/types.js";
import { valueAt } from "../ui/data.js";
import { getBiuTableLocaleText, type BiuTableLocale, type BiuTableLocaleTextOverrides } from "../locale/index.js";

export type TableDensity = "compact" | "default" | "comfortable";

export interface ProTableClassNames extends TableClassNames {
  root?: string;
  toolbar?: string;
  toolbarLeft?: string;
  toolbarRight?: string;
  batchActions?: string;
  selectedCount?: string;
  columnSettings?: string;
  tableRoot?: string;
}

export interface ProTableActionContext<T extends object> {
  selectedKeys: React.Key[];
  selectedRows: T[];
  dataSource: T[];
}

export interface ProTableBatchAction<T extends object> {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean | ((context: ProTableActionContext<T>) => boolean);
  onClick: (context: ProTableActionContext<T>) => void | Promise<void>;
}

function leafColumns<T extends object>(columns: Column<T>[]): Column<T>[] {
  return columns.flatMap((column) => (column.children?.length ? leafColumns(column.children) : [column]));
}

function columnOrderOf<T extends object>(column: Column<T>, order: Map<string, number>) {
  return Math.min(...leafColumns([column]).map((leaf) => order.get(leaf.key) ?? Number.POSITIVE_INFINITY));
}

function filterColumnTree<T extends object>(
  columns: Column<T>[],
  activeKeys: Set<string>,
  order: Map<string, number>,
): Column<T>[] {
  return columns
    .flatMap((column) => {
      if (!column.children?.length) return activeKeys.has(column.key) ? [column] : [];
      const children = filterColumnTree(column.children, activeKeys, order);
      return children.length ? [{ ...column, children }] : [];
    })
    .sort((left, right) => columnOrderOf(left, order) - columnOrderOf(right, order));
}

function normalizeColumnKeys<T extends object>(columns: Column<T>[], keys: string[]) {
  const leaves = leafColumns(columns);
  const groups = new Map(
    columns
      .filter((column) => column.children?.length)
      .map((column) => [column.key, leafColumns([column]).map((item) => item.key)]),
  );
  const expanded = [...new Set(keys.flatMap((key) => groups.get(key) ?? [key]))];
  const leafByKey = new Map(leaves.map((column) => [column.key, column]));
  const requested = new Set(expanded);
  // Fixed columns are structural table columns: they are always visible and
  // stay at their original left/right boundary. Only ordinary columns use the
  // caller's reorder/hide state.
  const fixedLeft = leaves.filter((column) => column.fixed === "left").map((column) => column.key);
  const fixedRight = leaves.filter((column) => column.fixed === "right").map((column) => column.key);
  const middle = expanded.filter((key) => {
    const column = leafByKey.get(key);
    return Boolean(column && !column.fixed && requested.has(key));
  });
  return [...fixedLeft, ...middle, ...fixedRight];
}

/**
 * Build the complete settings order from the visible order while retaining
 * the declaration position of hidden ordinary columns.  The visible value is
 * intentionally a set of checked keys, so using it directly to render the
 * settings panel would append a hidden column to the end after it is toggled
 * back on.
 */
function buildColumnSettingsOrder<T extends object>(columns: Column<T>[], visibleKeys: string[]) {
  const leaves = leafColumns(columns);
  const visible = normalizeColumnKeys(leaves, visibleKeys);
  const complete = [...visible];
  const visibleSet = new Set(visible);
  const leafKeys = leaves.map((column) => column.key);
  for (const column of leaves) {
    if (visibleSet.has(column.key)) continue;
    const declarationIndex = leafKeys.indexOf(column.key);
    const nextVisibleKey = leafKeys.slice(declarationIndex + 1).find((key) => visibleSet.has(key));
    const insertAt = nextVisibleKey === undefined ? complete.length : complete.indexOf(nextVisibleKey);
    complete.splice(insertAt < 0 ? complete.length : insertAt, 0, column.key);
  }
  return normalizeColumnKeys(leaves, complete);
}

function rowKeyOf<T extends object>(row: T, index: number, rowKey: TableProps<T>["rowKey"]): React.Key {
  if (!rowKey) return String(index);
  if (typeof rowKey === "function") return rowKey(row, index);
  const value = row[rowKey];
  return value === undefined || value === null ? String(index) : (value as React.Key);
}

function csvValue(value: unknown) {
  const text = value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function buildCsv<T extends object>(columns: Column<T>[], rows: T[]) {
  const visible = leafColumns(columns).filter((column) => !column.hidden);
  return [
    visible.map((column) => csvValue(column.title)).join(","),
    ...rows.map((row) => visible.map((column) => csvValue(valueAt(row, column))).join(",")),
  ].join("\n");
}

export interface TableColumnSettingsProps<T extends object> {
  columns: Column<T>[];
  value?: string[];
  defaultValue?: string[];
  onChange?: (keys: string[]) => void;
  storageKey?: string;
  className?: string;
  title?: React.ReactNode;
  /** Render the compact icon-only trigger used by ProTable toolbars. */
  iconOnly?: boolean;
  locale?: BiuTableLocale;
  localeText?: BiuTableLocaleTextOverrides;
}

export function reorderColumnKeys(keys: string[], sourceKey: string, targetKey: string) {
  return reorderColumnKeysAt(keys, sourceKey, targetKey, "before");
}

export function reorderColumnKeysAt(
  keys: string[],
  sourceKey: string,
  targetKey: string,
  position: "before" | "after" = "before",
) {
  if (sourceKey === targetKey) return keys;
  const sourceIndex = keys.indexOf(sourceKey);
  if (sourceIndex < 0 || keys.indexOf(targetKey) < 0) return keys;
  const next = [...keys];
  next.splice(sourceIndex, 1);
  next.splice(next.indexOf(targetKey) + (position === "after" ? 1 : 0), 0, sourceKey);
  return next;
}

function readStoredColumns(storageKey: string | undefined) {
  if (!storageKey || typeof window === "undefined") return undefined;
  try {
    const value = JSON.parse(window.localStorage.getItem(storageKey) ?? "null");
    return Array.isArray(value) && value.every((key) => typeof key === "string") ? (value as string[]) : undefined;
  } catch {
    return undefined;
  }
}

function sameColumnOrder(left: string[], right: string[]) {
  return left.length === right.length && left.every((key, index) => key === right[index]);
}

export function TableColumnSettings<T extends object>({
  columns,
  value,
  defaultValue,
  onChange,
  storageKey,
  className,
  title,
  iconOnly = false,
  locale,
  localeText,
}: TableColumnSettingsProps<T>) {
  const text = getBiuTableLocaleText(locale, localeText);
  const resolvedTitle = title ?? text["列设置"];
  const leafOptions = React.useMemo(() => leafColumns(columns), [columns]);
  const initial = normalizeColumnKeys(
    leafOptions,
    defaultValue ??
      readStoredColumns(storageKey) ??
      leafOptions.filter((column) => !column.hidden).map((column) => column.key),
  );
  const [internal, setInternal] = React.useState(initial);
  // Keep the complete order separately from the visible key set. This lets a
  // hidden ordinary column return to its previous position instead of being
  // appended to the end; fixed columns are still normalized to their table
  // boundaries by normalizeColumnKeys.
  const columnOrderRef = React.useRef<string[]>(buildColumnSettingsOrder(leafOptions, initial));
  const [columnOrder, setColumnOrder] = React.useState(() => columnOrderRef.current);
  React.useEffect(() => {
    const available = new Set(leafOptions.map((column) => column.key));
    const current = columnOrderRef.current.filter((key) => available.has(key));
    const missing = leafOptions.map((column) => column.key).filter((key) => !current.includes(key));
    const nextOrder = normalizeColumnKeys(leafOptions, [...current, ...missing]);
    if (!sameColumnOrder(columnOrderRef.current, nextOrder)) {
      columnOrderRef.current = nextOrder;
      setColumnOrder(nextOrder);
    }
  }, [leafOptions]);
  const active = value ?? internal;
  const normalizedActive = React.useMemo(() => normalizeColumnKeys(leafOptions, active), [active, leafOptions]);
  const activeKeysRef = React.useRef(normalizedActive);
  React.useEffect(() => {
    activeKeysRef.current = normalizedActive;
  }, [normalizedActive]);
  const displayKeys = normalizedActive;
  const orderedLeafOptions = React.useMemo(() => {
    const order = new Map(columnOrder.map((key, index) => [key, index]));
    return [...leafOptions].sort(
      (left, right) =>
        (order.get(left.key) ?? Number.POSITIVE_INFINITY) - (order.get(right.key) ?? Number.POSITIVE_INFINITY),
    );
  }, [columnOrder, leafOptions]);
  const update = (next: string[], nextOrder?: string[]) => {
    const normalized = normalizeColumnKeys(leafOptions, next);
    const normalizedOrder = normalizeColumnKeys(leafOptions, nextOrder ?? columnOrderRef.current);
    columnOrderRef.current = normalizedOrder;
    setColumnOrder(normalizedOrder);
    activeKeysRef.current = normalized;
    if (value === undefined) setInternal(normalized);
    if (storageKey && typeof window !== "undefined") {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(normalized));
      } catch {
        /* private mode/quota is non-fatal */
      }
    }
    onChange?.(normalized);
  };
  const isMovable = (column: Column<T>) => !column.fixed;
  const movableColumnKey = (key: string | undefined) => {
    if (!key) return false;
    const column = leafOptions.find((item) => item.key === key);
    return Boolean(column && isMovable(column));
  };
  const moveColumn = (key: string, direction: -1 | 1) => {
    const movableKeys = columnOrderRef.current.filter((item) => movableColumnKey(item));
    const index = movableKeys.indexOf(key);
    const targetKey = index >= 0 ? movableKeys[index + direction] : undefined;
    if (!targetKey) return;
    update(
      reorderColumnKeysAt(activeKeysRef.current, key, targetKey, direction < 0 ? "before" : "after"),
      reorderColumnKeysAt(columnOrderRef.current, key, targetKey, direction < 0 ? "before" : "after"),
    );
  };
  const trigger = (
    <Button
      type="secondary"
      variant="contained"
      size="small"
      icon={<Settings size={15} />}
      aria-label={typeof resolvedTitle === "string" ? resolvedTitle : text["列设置"]}
      onlyIcon={iconOnly}
    >
      {resolvedTitle}
    </Button>
  );
  return (
    <Popover
      className={["biu-pro-table__column-settings", className].filter(Boolean).join(" ")}
      minWidth={260}
      showArrow={false}
      classNames={{ content: "biu-pro-table__column-settings-popover" }}
      content={
        <div className="biu-pro-table__column-settings-panel" data-column-order={displayKeys.join(",")}>
          {orderedLeafOptions.map((column) => (
            <div
              key={column.key}
              className={[
                "biu-pro-table__column-setting-row",
                column.fixed && "biu-pro-table__column-setting-row--fixed",
              ]
                .filter(Boolean)
                .join(" ")}
              data-column-key={column.key}
              data-column-position={String(columnOrder.indexOf(column.key))}
            >
              {column.fixed ? (
                <span className="biu-pro-table__column-setting-handle" aria-hidden="true" title={text["固定列"]}>
                  <Lock size={13} />
                </span>
              ) : (
                <span
                  className="biu-pro-table__column-setting-move"
                  aria-label={`${String(column.title)}${text["排序"]}`}
                >
                  <button
                    type="button"
                    aria-label={`${text["上移"]}${String(column.title)}`}
                    title={`${text["上移"]}${String(column.title)}`}
                    disabled={columnOrder.filter((key) => movableColumnKey(key)).indexOf(column.key) === 0}
                    onClick={() => moveColumn(column.key, -1)}
                  >
                    <ArrowUp size={12} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`${text["下移"]}${String(column.title)}`}
                    title={`${text["下移"]}${String(column.title)}`}
                    disabled={
                      columnOrder.filter((key) => movableColumnKey(key)).indexOf(column.key) ===
                      columnOrder.filter((key) => movableColumnKey(key)).length - 1
                    }
                    onClick={() => moveColumn(column.key, 1)}
                  >
                    <ArrowDown size={12} aria-hidden="true" />
                  </button>
                </span>
              )}
              <Checkbox
                label={column.title}
                checked={displayKeys.includes(column.key)}
                disabled={Boolean(column.fixed)}
                onChange={() => {
                  if (column.fixed) return;
                  if (displayKeys.includes(column.key)) {
                    update(displayKeys.filter((key) => key !== column.key));
                    return;
                  }
                  const next = [...displayKeys];
                  const columnIndex = columnOrderRef.current.indexOf(column.key);
                  const nextVisibleKey = columnOrderRef.current
                    .slice(columnIndex + 1)
                    .find((key) => displayKeys.includes(key));
                  const insertAt = nextVisibleKey === undefined ? next.length : next.indexOf(nextVisibleKey);
                  next.splice(insertAt < 0 ? next.length : insertAt, 0, column.key);
                  update(next);
                }}
              />
            </div>
          ))}
        </div>
      }
    >
      {trigger}
    </Popover>
  );
}

export interface ProTableProps<T extends object> extends Omit<TableProps<T>, "classNames"> {
  classNames?: ProTableClassNames;
  toolbar?: React.ReactNode;
  toolbarLeft?: React.ReactNode;
  toolbarRight?: React.ReactNode;
  showColumnSettings?: boolean;
  columnKeys?: string[];
  defaultColumnKeys?: string[];
  onColumnKeysChange?: (keys: string[]) => void;
  columnStorageKey?: string;
  density?: TableDensity;
  batchActions?: ProTableBatchAction<T>[];
  onActionError?: (error: unknown, action: string) => void;
  toolbarActions?: React.ReactNode;
  fullscreen?: boolean;
  onFullscreenChange?: (fullscreen: boolean) => void;
  /** Show the density tool in the default toolbar. */
  showDensity?: boolean;
  /** Show the full-screen tool in the default toolbar. */
  showFullscreen?: boolean;
  /** Notify the caller when the density tool changes the active density. */
  onDensityChange?: (density: TableDensity) => void;
  localeText?: BiuTableLocaleTextOverrides;
}

export function ProTable<T extends object>({
  columns,
  toolbar,
  toolbarLeft,
  toolbarRight,
  showColumnSettings = true,
  columnKeys,
  defaultColumnKeys,
  onColumnKeysChange,
  columnStorageKey,
  density = "default",
  batchActions = [],
  onActionError,
  toolbarActions,
  fullscreen: fullscreenProp,
  onFullscreenChange,
  showDensity = false,
  showFullscreen = true,
  onDensityChange,
  locale,
  localeText,
  className,
  classNames,
  ...props
}: ProTableProps<T>) {
  const text = getBiuTableLocaleText(locale, localeText);
  const [internalKeys, setInternalKeys] = React.useState<string[]>(
    () =>
      defaultColumnKeys ??
      readStoredColumns(columnStorageKey) ??
      leafColumns(columns)
        .filter((column) => !column.hidden)
        .map((column) => column.key),
  );
  const activeKeys = columnKeys ?? internalKeys;
  const normalizedActiveKeys = React.useMemo(() => normalizeColumnKeys(columns, activeKeys), [activeKeys, columns]);
  const [internalFullscreen, setInternalFullscreen] = React.useState(false);
  const [internalDensity, setInternalDensity] = React.useState<TableDensity>(density);
  const [pendingAction, setPendingAction] = React.useState<string>();
  const fullscreen = fullscreenProp ?? internalFullscreen;
  const updateDensity = (next: TableDensity) => {
    setInternalDensity(next);
    onDensityChange?.(next);
  };
  const activeDensity = onDensityChange ? density : internalDensity;
  const updateKeys = (next: string[]) => {
    if (columnKeys === undefined) setInternalKeys(next);
    onColumnKeysChange?.(next);
  };
  const visibleColumns = React.useMemo(
    () =>
      filterColumnTree(
        columns,
        new Set(normalizedActiveKeys),
        new Map(normalizedActiveKeys.map((key, index) => [key, index])),
      ),
    [columns, normalizedActiveKeys],
  );
  const toggleFullscreen = () => {
    const next = !fullscreen;
    if (fullscreenProp === undefined) setInternalFullscreen(next);
    onFullscreenChange?.(next);
  };
  const selectedKeys = props.rowSelection?.selectedRowKeys ?? [];
  const selectedRows = React.useMemo(() => {
    const source = props.dataSource ?? [];
    return source.filter((record, index) => {
      const key = props.rowKey
        ? rowKeyOf(record, index, props.rowKey)
        : String(source.indexOf(record) >= 0 ? source.indexOf(record) : index);
      return selectedKeys.includes(key);
    });
  }, [props.dataSource, props.rowKey, selectedKeys]);
  const actionContext: ProTableActionContext<T> = { selectedKeys, selectedRows, dataSource: props.dataSource ?? [] };
  const runAction = async (action: string, callback: () => void | Promise<void>) => {
    setPendingAction(action);
    try {
      await callback();
    } catch (error) {
      onActionError?.(error, action);
    } finally {
      setPendingAction(undefined);
    }
  };
  // CRUD actions are caller-owned toolbar content. The three structural tools
  // (density, column settings and fullscreen) are the only actions ProTable
  // adds from its own layout contract.
  const {
    root: rootClassName,
    toolbar: toolbarClassName,
    toolbarLeft: toolbarLeftClassName,
    toolbarRight: toolbarRightClassName,
    batchActions: batchActionsClassName,
    selectedCount: selectedCountClassName,
    columnSettings: columnSettingsClassName,
    tableRoot: tableRootClassName,
    ...tableClassNames
  } = classNames ?? {};
  return (
    <section
      className={[
        "biu-pro-table",
        `biu-pro-table--${activeDensity}`,
        fullscreen && "biu-pro-table--fullscreen",
        rootClassName,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-biu-component="pro-table"
      data-biu-state={fullscreen ? "fullscreen" : "ready"}
    >
      <div className={["biu-pro-table__toolbar", toolbarClassName].filter(Boolean).join(" ")}>
        <div className={["biu-pro-table__toolbar-left", toolbarLeftClassName].filter(Boolean).join(" ")}>
          {toolbarLeft}
          {toolbar}
        </div>
        <div className={["biu-pro-table__toolbar-right", toolbarRightClassName].filter(Boolean).join(" ")}>
          {batchActions.length ? (
            <div
              className={["biu-pro-table__batch-actions", batchActionsClassName].filter(Boolean).join(" ")}
              aria-label={text["已选 {count} 项"].replace("{count}", String(selectedRows.length))}
            >
              <span className={["biu-pro-table__selected-count", selectedCountClassName].filter(Boolean).join(" ")}>
                {text["已选 {count} 项"].replace("{count}", String(selectedRows.length))}
              </span>
              {batchActions.map((action) => {
                const disabled =
                  typeof action.disabled === "function" ? action.disabled(actionContext) : action.disabled;
                return (
                  <Button
                    key={action.key}
                    type={action.danger ? "error" : "default"}
                    variant="outlined"
                    size="small"
                    icon={action.icon}
                    disabled={Boolean(disabled) || selectedRows.length === 0}
                    loading={pendingAction === action.key}
                    onClick={() => void runAction(action.key, () => action.onClick(actionContext))}
                  >
                    {action.label}
                  </Button>
                );
              })}
            </div>
          ) : null}
          {toolbarRight}
          {toolbarActions}
          {showDensity || showColumnSettings || showFullscreen ? (
            <span className="biu-pro-table__toolbar-divider" aria-hidden="true" />
          ) : null}
          {showDensity ? (
            <Popover
              minWidth={150}
              showArrow={false}
              className="biu-pro-table__density-settings"
              content={
                <div className="biu-pro-table__density-menu" role="menu" aria-label={text["表格密度"]}>
                  {(["compact", "default", "comfortable"] as TableDensity[]).map((item) => (
                    <Button
                      key={item}
                      type={activeDensity === item ? "primary" : "default"}
                      variant={activeDensity === item ? "contained" : "text"}
                      size="small"
                      block
                      onClick={() => updateDensity(item)}
                    >
                      {item === "compact" ? text["紧凑"] : item === "comfortable" ? text["宽松"] : text["默认"]}
                    </Button>
                  ))}
                </div>
              }
            >
              <Button
                type="secondary"
                variant="contained"
                size="small"
                icon={<GripVertical size={15} />}
                aria-label={text["表格密度"]}
                onlyIcon
              >
                {text["表格密度"]}
              </Button>
            </Popover>
          ) : null}
          {showColumnSettings ? (
            <TableColumnSettings
              title={text["列设置"]}
              columns={columns}
              value={normalizedActiveKeys}
              onChange={updateKeys}
              storageKey={columnStorageKey}
              className={columnSettingsClassName}
              iconOnly
              locale={locale}
              localeText={localeText}
            />
          ) : null}
          {showFullscreen ? (
            <Button
              type="secondary"
              variant="contained"
              size="small"
              icon={fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              aria-label={fullscreen ? text["退出全屏"] : text["全屏"]}
              onlyIcon
              onClick={toggleFullscreen}
            >
              {fullscreen ? text["退出全屏"] : text["全屏"]}
            </Button>
          ) : null}
        </div>
      </div>
      <Table
        {...props}
        locale={locale}
        localeText={localeText}
        columns={visibleColumns}
        className={tableRootClassName}
        classNames={tableClassNames}
        layer="pro"
      />
    </section>
  );
}

export function TableToolbar({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <div
      className={["biu-pro-table__toolbar-content", className].filter(Boolean).join(" ")}
      data-biu-component="table-toolbar"
    >
      {children}
    </div>
  );
}

export function TableBox({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <section className={["biu-pro-table-box", className].filter(Boolean).join(" ")} data-biu-component="table-box">
      {children}
    </section>
  );
}
