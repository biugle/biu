import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronRight } from "@biugle/icons";
import { cx } from "../../shared/utils.js";
import { Ellipsis } from "../overlay/index.js";
import {
  useComponentsLocale,
  type BiuComponentsLocale,
  type BiuComponentsLocaleTextOverrides,
} from "../../provider.js";
import type { SelectLoadMoreTrigger, SelectOption } from "./select.js";

export interface CascaderOption extends SelectOption {
  children?: CascaderOption[];
  /** Mark a node as a leaf when children are loaded on demand. */
  isLeaf?: boolean;
  /** Show an expand affordance before its children have been loaded. */
  hasChildren?: boolean;
}
export type CascaderLoadMoreTrigger = SelectLoadMoreTrigger;
export interface CascaderProps {
  options: CascaderOption[];
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[], options: CascaderOption[]) => void;
  changeOnSelect?: boolean;
  searchable?: boolean;
  /** Limit search inputs to specific zero-based column levels. */
  searchLevels?: number[];
  searchValue?: string | Record<number, string>;
  defaultSearchValue?: string | Record<number, string>;
  searchPlaceholder?: string;
  onSearch?: (value: string, level?: number) => void;
  loadChildren?: (option: CascaderOption, level: number) => CascaderOption[] | Promise<CascaderOption[]>;
  loadMoreChildren?: (
    option: CascaderOption,
    level: number,
    currentOptions: CascaderOption[],
    searchValue: string,
  ) => CascaderOption[] | Promise<CascaderOption[]>;
  loadSearchChildren?: (
    option: CascaderOption,
    level: number,
    searchValue: string,
  ) => CascaderOption[] | Promise<CascaderOption[]>;
  hasMore?: boolean | ((option: CascaderOption, level: number, searchValue: string) => boolean);
  loadingMore?: boolean;
  loadMoreTrigger?: CascaderLoadMoreTrigger;
  loadMoreText?: React.ReactNode;
  placeholder?: React.ReactNode;
  optionRender?: (option: CascaderOption, level: number) => React.ReactNode;
  displayRender?: (labels: React.ReactNode[], selected: CascaderOption[]) => React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  classNames?: {
    root?: string;
    trigger?: string;
    content?: string;
    menu?: string;
    column?: string;
    option?: string;
    value?: string;
    search?: string;
  };
  disabled?: boolean;
  locale?: BiuComponentsLocale;
  localeText?: BiuComponentsLocaleTextOverrides;
}

const MAX_CASCADER_LEVELS = 6;

export function Cascader({
  options,
  value,
  defaultValue = [],
  onChange,
  changeOnSelect = false,
  searchable = false,
  searchLevels,
  searchValue,
  defaultSearchValue = "",
  searchPlaceholder,
  onSearch,
  loadChildren,
  loadMoreChildren,
  loadSearchChildren,
  hasMore = false,
  loadingMore = false,
  loadMoreTrigger = "scroll",
  loadMoreText,
  placeholder,
  optionRender,
  displayRender,
  open,
  defaultOpen = false,
  onOpenChange,
  className,
  classNames,
  disabled = false,
  locale,
  localeText,
}: CascaderProps) {
  const text = useComponentsLocale(locale, localeText);
  const resolvedSearchPlaceholder = searchPlaceholder ?? text["搜索"];
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const [internalSearch, setInternalSearch] = React.useState<Record<number, string>>(
    typeof defaultSearchValue === "string" ? { 0: defaultSearchValue } : defaultSearchValue,
  );
  const [loadedChildren, setLoadedChildren] = React.useState<Record<string, CascaderOption[]>>({});
  const [loadingPath, setLoadingPath] = React.useState<string | null>(null);
  const [loadingMorePath, setLoadingMorePath] = React.useState<string | null>(null);
  const [loadingSearchPath, setLoadingSearchPath] = React.useState<string | null>(null);
  const searchRequestRef = React.useRef(0);
  const rawActiveValue = value ?? internalValue;
  const activeValue = React.useMemo(
    () => (rawActiveValue.length > MAX_CASCADER_LEVELS ? rawActiveValue.slice(0, MAX_CASCADER_LEVELS) : rawActiveValue),
    [rawActiveValue],
  );
  const [panelValue, setPanelValue] = React.useState(activeValue);
  React.useEffect(() => setPanelValue(activeValue), [activeValue]);
  const activeOpen = !disabled && (open ?? internalOpen);
  const childrenFor = React.useCallback(
    (option: CascaderOption, path: string[]) => loadedChildren[path.join("/")] ?? option.children ?? [],
    [loadedChildren],
  );
  const getSelected = React.useCallback(
    (path: string[]) => {
      const selected: CascaderOption[] = [];
      let current = options;
      const parentPath: string[] = [];
      for (const key of path) {
        const item = current.find((option) => option.value === key);
        const resolved = item ?? { value: key, label: key, disabled: true, isLeaf: true };
        selected.push(resolved);
        if (!item) {
          current = [];
          continue;
        }
        parentPath.push(item.value);
        current = childrenFor(item, parentPath);
      }
      return selected;
    },
    [childrenFor, options],
  );
  const selectedOptions = getSelected(panelValue);
  const displaySelectedOptions = getSelected(activeValue);
  const columns: Array<{ options: CascaderOption[]; parentPath: string[] }> = [{ options, parentPath: [] }];
  let parentPath: string[] = [];
  for (const item of selectedOptions) {
    if (columns.length >= MAX_CASCADER_LEVELS) break;
    const nextPath = [...parentPath, item.value];
    const children = childrenFor(item, nextPath);
    if (!children.length && item.isLeaf !== false && !item.hasChildren) break;
    columns.push({ options: children, parentPath: nextPath });
    parentPath = nextPath;
  }
  const getSearchValue = (level: number) =>
    typeof searchValue === "string" ? searchValue : (searchValue?.[level] ?? internalSearch[level] ?? "");
  const isSearchEnabled = (level: number) => searchable && (searchLevels === undefined || searchLevels.includes(level));
  const parentOptionFor = React.useCallback(
    (path: string[]) => (path.length ? getSelected(path).at(-1) : undefined),
    [getSelected],
  );
  const hasMoreFor = (option: CascaderOption | undefined, level: number, query: string) =>
    Boolean(option && loadMoreChildren && (typeof hasMore === "function" ? hasMore(option, level, query) : hasMore));
  const hasChildren = (option: CascaderOption, path: string[]) =>
    option.isLeaf !== true &&
    (childrenFor(option, path).length > 0 ||
      option.hasChildren === true ||
      (Boolean(loadChildren) && option.children === undefined));
  const setActiveOpen = (next: boolean) => {
    if (disabled) return;
    if (open === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };
  const updateSearch = (next: string, level: number) => {
    if (searchValue === undefined) setInternalSearch((current) => ({ ...current, [level]: next }));
    onSearch?.(next, level);
    if (!loadSearchChildren) return;
    const column = columns[level];
    const parentOption = parentOptionFor(column?.parentPath ?? []);
    if (!column || !parentOption) return;
    const pathKey = column.parentPath.join("/");
    const requestId = searchRequestRef.current + 1;
    searchRequestRef.current = requestId;
    setLoadingSearchPath(pathKey);
    void Promise.resolve(loadSearchChildren(parentOption, level, next))
      .then((nextOptions) => {
        if (searchRequestRef.current !== requestId) return;
        setLoadedChildren((current) => ({ ...current, [pathKey]: nextOptions }));
      })
      .finally(() => {
        if (searchRequestRef.current === requestId) setLoadingSearchPath(null);
      });
  };
  const loadMore = async (
    column: { options: CascaderOption[]; parentPath: string[] },
    level: number,
    query: string,
  ) => {
    const parentOption = parentOptionFor(column.parentPath);
    const pathKey = column.parentPath.join("/");
    if (!parentOption || !loadMoreChildren || loadingMore || loadingMorePath || !hasMoreFor(parentOption, level, query))
      return;
    setLoadingMorePath(pathKey);
    try {
      const nextOptions = await loadMoreChildren(parentOption, level, column.options, query);
      setLoadedChildren((current) => {
        const existing = current[pathKey] ?? column.options;
        const seen = new Set(existing.map((item) => item.value));
        return {
          ...current,
          [pathKey]: [...existing, ...nextOptions.filter((item) => !seen.has(item.value))],
        };
      });
    } finally {
      setLoadingMorePath(null);
    }
  };
  const selectOption = async (option: CascaderOption, level: number, currentParentPath: string[]) => {
    if (option.disabled || loadingPath) return;
    const next = [...currentParentPath, option.value].slice(0, MAX_CASCADER_LEVELS);
    const pathKey = next.join("/");
    let children = childrenFor(option, next);
    const canExpand = level < MAX_CASCADER_LEVELS - 1;
    const shouldLoad =
      canExpand &&
      Boolean(loadChildren) &&
      option.isLeaf !== true &&
      children.length === 0 &&
      (option.hasChildren === true || option.children === undefined) &&
      !Object.prototype.hasOwnProperty.call(loadedChildren, pathKey);
    if (shouldLoad) {
      setLoadingPath(pathKey);
      try {
        children = (await loadChildren?.(option, level)) ?? [];
        setLoadedChildren((current) => ({ ...current, [pathKey]: children }));
      } finally {
        setLoadingPath(null);
      }
    }
    setPanelValue(next);
    if (value === undefined) setInternalValue(next);
    if (changeOnSelect || !children.length || !canExpand) {
      onChange?.(next, getSelected(next));
      setActiveOpen(false);
    }
  };
  const labels = displaySelectedOptions.map((item) => item.label);
  const displayValue =
    displayRender?.(labels, displaySelectedOptions) ??
    (labels.length ? labels.map((label) => String(label)).join(" / ") : null);
  return (
    <div
      className={cx("biu-ui-cascader", classNames?.root, className)}
      data-biu-component="cascader"
      data-state={activeOpen ? "open" : "closed"}
    >
      <PopoverPrimitive.Root open={activeOpen} onOpenChange={setActiveOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button
            type="button"
            className={cx("biu-ui-cascader__trigger", classNames?.trigger)}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={activeOpen}
          >
            <Ellipsis
              content={displayValue ?? placeholder ?? text["请选择"]}
              className={cx("biu-ui-cascader__value", classNames?.value)}
            >
              {displayValue ?? placeholder ?? text["请选择"]}
            </Ellipsis>
            <ChevronDown size={15} aria-hidden="true" />
          </button>
        </PopoverPrimitive.Trigger>
        {activeOpen && typeof document !== "undefined"
          ? createPortal(
              <PopoverPrimitive.Content
                className={cx("biu-ui-cascader__content", classNames?.content)}
                sideOffset={6}
                collisionPadding={8}
                align="start"
                data-biu-overlay-interactive="true"
              >
                <div className={cx("biu-ui-cascader__menu", classNames?.menu)} role="listbox">
                  {columns.map((column, level) => {
                    const query = getSearchValue(level).trim().toLowerCase();
                    const parentOption = parentOptionFor(column.parentPath);
                    const isLastColumn = level === columns.length - 1;
                    const canLoadMore = isLastColumn && hasMoreFor(parentOption, level, query);
                    const loadingMoreCurrent = loadingMore || loadingMorePath === column.parentPath.join("/");
                    const loadingSearchCurrent = loadingSearchPath === column.parentPath.join("/");
                    const visibleOptions = query
                      ? column.options.filter((option) =>
                          `${String(option.label)} ${option.value}`.toLowerCase().includes(query),
                        )
                      : column.options;
                    return (
                      <div key={level} className={cx("biu-ui-cascader__column", classNames?.column)}>
                        {isSearchEnabled(level) ? (
                          <div className={cx("biu-ui-cascader__column-search", classNames?.search)}>
                            <input
                              value={getSearchValue(level)}
                              placeholder={resolvedSearchPlaceholder}
                              aria-label={`${resolvedSearchPlaceholder} ${level + 1}`}
                              onChange={(event) => updateSearch(event.target.value, level)}
                              onKeyDown={(event) => event.stopPropagation()}
                            />
                          </div>
                        ) : null}
                        <div
                          className="biu-ui-cascader__column-options"
                          onScroll={(event) => {
                            if (loadMoreTrigger === "click" || !canLoadMore) return;
                            const target = event.currentTarget;
                            if (target.scrollHeight - target.scrollTop - target.clientHeight <= 32)
                              void loadMore(column, level, query);
                          }}
                        >
                          {visibleOptions.length ? (
                            visibleOptions.map((option) => {
                              const optionPath = [...column.parentPath, option.value];
                              const optionHasChildren =
                                level < MAX_CASCADER_LEVELS - 1 && hasChildren(option, optionPath);
                              const loading = loadingPath === optionPath.join("/");
                              const selected = panelValue[level] === option.value;
                              return (
                                <button
                                  type="button"
                                  key={option.value}
                                  className={cx(
                                    "biu-ui-cascader__option",
                                    selected && "is-selected",
                                    classNames?.option,
                                  )}
                                  disabled={option.disabled || loading || loadingSearchCurrent}
                                  role="option"
                                  aria-selected={selected}
                                  onClick={() => void selectOption(option, level, column.parentPath)}
                                >
                                  <Ellipsis content={option.label} maxWidth="100%">
                                    {optionRender?.(option, level) ?? option.label}
                                  </Ellipsis>
                                  {loading ? <span className="biu-ui-cascader__loading">{text["加载中…"]}</span> : null}
                                  {!loading && optionHasChildren ? <ChevronRight size={14} aria-hidden="true" /> : null}
                                </button>
                              );
                            })
                          ) : (
                            <div className="biu-ui-cascader__empty">{text["暂无数据"]}</div>
                          )}
                          {loadingMoreCurrent || loadingSearchCurrent ? (
                            <div className="biu-ui-cascader__loading">{text["加载中…"]}</div>
                          ) : null}
                        </div>
                        {canLoadMore && (loadMoreTrigger === "click" || loadMoreTrigger === "both") ? (
                          <button
                            type="button"
                            className="biu-ui-cascader__load-more"
                            disabled={disabled || loadingMoreCurrent || loadingSearchCurrent}
                            onClick={() => void loadMore(column, level, query)}
                          >
                            {loadMoreText ?? text["加载更多"]}
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </PopoverPrimitive.Content>,
              document.body,
            )
          : null}
      </PopoverPrimitive.Root>
    </div>
  );
}
