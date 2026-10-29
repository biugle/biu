import * as React from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, X } from "@biugle/icons";
import { Button } from "../button/index.js";
import { TextField } from "../control/index.js";
import { Ellipsis } from "../overlay/index.js";
import { cx } from "../../shared/utils.js";
import { useComponentsLocale } from "../../provider.js";
import type { NavigationLocaleProps } from "./types.js";
import { nodeText } from "./utils.js";

export interface TransferItem {
  label: React.ReactNode;
  value: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface TransferClassNames {
  root?: string;
  list?: string;
  header?: string;
  search?: string;
  items?: string;
  item?: string;
  itemSelect?: string;
  itemActions?: string;
  checkbox?: string;
  operations?: string;
  footer?: string;
  empty?: string;
}

export function Transfer({
  source = [],
  target,
  defaultTarget = [],
  onChange,
  className,
  titles,
  disabled = false,
  showSearch = false,
  searchValue,
  onSearch,
  filterOption,
  render,
  itemActions,
  oneWay = false,
  operations,
  selectedKeys,
  defaultSelectedKeys = [],
  onSelectChange,
  footer,
  listStyle,
  classNames,
  locale,
  localeText,
}: {
  source?: TransferItem[];
  target?: TransferItem[];
  defaultTarget?: TransferItem[];
  onChange?: (target: TransferItem[]) => void;
  className?: string;
  titles?: [React.ReactNode, React.ReactNode];
  disabled?: boolean;
  showSearch?: boolean;
  searchValue?: [string, string];
  onSearch?: (value: string, direction: "left" | "right") => void;
  filterOption?: (inputValue: string, item: TransferItem) => boolean;
  render?: (item: TransferItem, direction: "left" | "right") => React.ReactNode;
  /** Render actions at the far end of each item. The right side defaults to remove when bidirectional. */
  itemActions?: (item: TransferItem, direction: "left" | "right") => React.ReactNode;
  oneWay?: boolean;
  operations?: [React.ReactNode, React.ReactNode];
  selectedKeys?: string[];
  defaultSelectedKeys?: string[];
  onSelectChange?: (keys: string[]) => void;
  footer?: (items: TransferItem[], direction: "left" | "right") => React.ReactNode;
  listStyle?: React.CSSProperties | [React.CSSProperties | undefined, React.CSSProperties | undefined];
  classNames?: TransferClassNames;
} & NavigationLocaleProps) {
  const text = useComponentsLocale(locale, localeText);
  const [internalTarget, setInternalTarget] = React.useState(defaultTarget);
  const activeTarget = target ?? internalTarget;
  const resolvedTitles = titles ?? [text["待选"], text["已选"]];
  const targetKeys = new Set(activeTarget.map((item) => item.value));
  const sourceKeys = new Set(source.map((item) => item.value));
  const leftItems = source.filter((item) => !targetKeys.has(item.value));
  const rightItems = [
    ...activeTarget.filter((item) => !sourceKeys.has(item.value)),
    ...activeTarget.filter((item) => sourceKeys.has(item.value)),
  ];
  const [internalSelected, setInternalSelected] = React.useState(defaultSelectedKeys);
  const [internalSearch, setInternalSearch] = React.useState<[string, string]>(["", ""]);
  const activeSelected = selectedKeys ?? internalSelected;
  const activeSearch = searchValue ?? internalSearch;
  const setSelected = (keys: string[]) => {
    if (selectedKeys === undefined) setInternalSelected(keys);
    onSelectChange?.(keys);
  };
  const visible = (items: TransferItem[], direction: "left" | "right") => {
    const query = activeSearch[direction === "left" ? 0 : 1].trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) =>
      filterOption
        ? filterOption(query, item)
        : nodeText(item.label).includes(query) || item.value.toLowerCase().includes(query),
    );
  };
  const move = (direction: "right" | "left") => {
    if (disabled) return;
    const selected = new Set(activeSelected);
    if (direction === "right") {
      const next = [...activeTarget, ...leftItems.filter((item) => selected.has(item.value) && !item.disabled)];
      if (target === undefined) setInternalTarget(next);
      onChange?.(next);
      setSelected(activeSelected.filter((key) => !next.some((item) => item.value === key)));
    } else if (!oneWay) {
      const next = activeTarget.filter((item) => !(selected.has(item.value) && !item.disabled));
      if (target === undefined) setInternalTarget(next);
      onChange?.(next);
      setSelected(activeSelected.filter((key) => !next.some((item) => item.value === key)));
    }
  };
  const renderList = (items: TransferItem[], direction: "left" | "right") => {
    const shown = visible(items, direction);
    const isOrphan = (item: TransferItem) => direction === "right" && !sourceKeys.has(item.value);
    const selectable = shown.filter((item) => !item.disabled && !isOrphan(item));
    const selectedVisible = selectable.filter((item) => activeSelected.includes(item.value));
    const allSelected = selectable.length > 0 && selectedVisible.length === selectable.length;
    return (
      <section
        className={cx("biu-ui-transfer__list", classNames?.list)}
        style={Array.isArray(listStyle) ? listStyle[direction === "left" ? 0 : 1] : listStyle}
      >
        <header className={cx("biu-ui-transfer__header", classNames?.header)}>
          <label>
            <input
              type="checkbox"
              className={classNames?.checkbox}
              checked={allSelected}
              disabled={disabled || selectable.length === 0}
              ref={(element) => {
                if (element) element.indeterminate = selectedVisible.length > 0 && !allSelected;
              }}
              onChange={(event) => {
                const current = new Set(activeSelected);
                selectable.forEach((item) =>
                  event.currentTarget.checked ? current.add(item.value) : current.delete(item.value),
                );
                setSelected([...current]);
              }}
            />
            <strong>{resolvedTitles[direction === "left" ? 0 : 1]}</strong>
          </label>
          <span>
            {selectedVisible.length}/{items.length}
          </span>
        </header>
        {showSearch ? (
          <TextField
            className={cx("biu-ui-transfer__search", classNames?.search)}
            value={activeSearch[direction === "left" ? 0 : 1]}
            allowClear
            placeholder={text["搜索"]}
            aria-label={`${resolvedTitles[direction === "left" ? 0 : 1]} ${text["搜索"]}`}
            onChange={(event) => {
              const next: [string, string] = [...activeSearch] as [string, string];
              next[direction === "left" ? 0 : 1] = event.target.value;
              if (searchValue === undefined) setInternalSearch(next);
              onSearch?.(event.target.value, direction);
            }}
            onClear={() => {
              const next: [string, string] = [...activeSearch] as [string, string];
              next[direction === "left" ? 0 : 1] = "";
              if (searchValue === undefined) setInternalSearch(next);
              onSearch?.("", direction);
            }}
          />
        ) : null}
        <div className={cx("biu-ui-transfer__items", classNames?.items)}>
          {shown.map((item) => {
            const customActions = itemActions?.(item, direction);
            const actions =
              customActions !== undefined ? (
                customActions
              ) : direction === "right" && !oneWay ? (
                <Button
                  type="secondary"
                  variant="text"
                  size="small"
                  onlyIcon
                  icon={<X size={14} aria-hidden="true" />}
                  tooltip={text["移除"]}
                  aria-label={text["移除"]}
                  disabled={disabled || item.disabled}
                  onClick={() => {
                    if (item.disabled) return;
                    const next = activeTarget.filter((candidate) => candidate.value !== item.value);
                    if (target === undefined) setInternalTarget(next);
                    onChange?.(next);
                    setSelected(activeSelected.filter((key) => key !== item.value));
                  }}
                />
              ) : null;
            return (
              <div
                key={item.value}
                className={cx(
                  "biu-ui-transfer__item",
                  (item.disabled || isOrphan(item)) && "is-disabled",
                  isOrphan(item) && "is-orphan",
                  classNames?.item,
                )}
              >
                <label
                  className={cx(
                    "biu-ui-transfer__item-select",
                    (item.disabled || isOrphan(item)) && "is-disabled",
                    classNames?.itemSelect,
                  )}
                >
                  <input
                    type="checkbox"
                    className={classNames?.checkbox}
                    checked={activeSelected.includes(item.value)}
                    disabled={disabled || item.disabled || isOrphan(item)}
                    onChange={(event) => {
                      const next = new Set(activeSelected);
                      if (event.currentTarget.checked) next.add(item.value);
                      else next.delete(item.value);
                      setSelected([...next]);
                    }}
                  />
                  <span className="biu-ui-transfer__item-content">
                    {item.icon ? (
                      <span className="biu-ui-transfer__item-icon" aria-hidden="true">
                        {item.icon}
                      </span>
                    ) : null}
                    <Ellipsis tooltipContent={item.label} className="biu-ui-transfer__item-label">
                      {render?.(item, direction) ?? item.label}
                    </Ellipsis>
                  </span>
                </label>
                {actions ? (
                  <span className={cx("biu-ui-transfer__item-actions", classNames?.itemActions)}>{actions}</span>
                ) : null}
              </div>
            );
          })}
          {!shown.length ? (
            <span className={cx("biu-ui-transfer__empty", classNames?.empty)}>{text["暂无数据"]}</span>
          ) : null}
        </div>
        {footer ? (
          <footer className={cx("biu-ui-transfer__footer", classNames?.footer)}>{footer(items, direction)}</footer>
        ) : null}
      </section>
    );
  };
  return (
    <div className={cx("biu-ui-transfer", classNames?.root, className)} data-biu-component="transfer">
      {/* Keep the responsive grid inside its width container so app-shell sidebars count toward the breakpoint. */}
      <div className="biu-ui-transfer__layout">
        {renderList(leftItems, "left")}
        <div className={cx("biu-ui-transfer__operations", classNames?.operations)}>
          <Button
            size="small"
            aria-label={String(operations?.[0] ?? text["已选"])}
            disabled={
              disabled || !activeSelected.some((key) => leftItems.some((item) => item.value === key && !item.disabled))
            }
            onClick={() => move("right")}
          >
            {operations?.[0] ?? (
              <>
                <span className="biu-ui-transfer__operation-icon--desktop" aria-hidden="true">
                  <ChevronRight size={15} />
                </span>
                <span className="biu-ui-transfer__operation-icon--mobile" aria-hidden="true">
                  <ChevronDown size={15} />
                </span>
              </>
            )}
          </Button>
          {!oneWay ? (
            <Button
              size="small"
              aria-label={String(operations?.[1] ?? text["待选"])}
              disabled={
                disabled ||
                !activeSelected.some((key) => activeTarget.some((item) => item.value === key && !item.disabled))
              }
              onClick={() => move("left")}
            >
              {operations?.[1] ?? (
                <>
                  <span className="biu-ui-transfer__operation-icon--desktop" aria-hidden="true">
                    <ChevronLeft size={15} />
                  </span>
                  <span className="biu-ui-transfer__operation-icon--mobile" aria-hidden="true">
                    <ChevronUp size={15} />
                  </span>
                </>
              )}
            </Button>
          ) : null}
        </div>
        {renderList(rightItems, "right")}
      </div>
    </div>
  );
}
