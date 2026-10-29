import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { createPortal } from "react-dom";
import { Check, ChevronDown, X } from "@biugle/icons";
import { cx, type BiuSize } from "../../shared/utils.js";
import { Ellipsis, Tooltip } from "../overlay/index.js";
import {
  useComponentsLocale,
  type BiuComponentsLocale,
  type BiuComponentsLocaleTextOverrides,
} from "../../provider.js";
import type { ControlClassNames } from "./types.js";

export interface SelectOption {
  label: React.ReactNode;
  value: string;
  disabled?: boolean;
  [key: string]: unknown;
}

export type SelectMode = "single" | "multiple";
export type SelectLoadMoreTrigger = "scroll" | "click" | "both";
export interface SelectClassNames extends ControlClassNames {
  value?: string;
  placeholder?: string;
  menu?: string;
  allOption?: string;
}

export interface SelectProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  options?: SelectOption[];
  value?: string | string[];
  defaultValue?: string | string[];
  mode?: SelectMode;
  multiple?: boolean;
  disabled?: boolean;
  loading?: boolean;
  size?: BiuSize;
  allowClear?: boolean;
  searchable?: boolean;
  searchValue?: string;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  filterOption?: ((input: string, option: SelectOption) => boolean) | boolean;
  hasAllOption?: boolean;
  allowAllSelect?: boolean;
  allOption?: SelectOption;
  optionRender?: (option: SelectOption, index: number) => React.ReactNode;
  labelRender?: (value: string, option?: SelectOption) => React.ReactNode;
  tagRender?: (option: SelectOption, onClose: () => void) => React.ReactNode;
  dropdownRender?: (menu: React.ReactNode) => React.ReactNode;
  dropdownHeader?: React.ReactNode;
  dropdownFooter?: React.ReactNode;
  notFoundContent?: React.ReactNode;
  maxTagCount?: number | "responsive";
  maxCount?: number;
  onLoadMore?: () => void | Promise<void>;
  onLoadError?: (error: unknown) => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  loadMoreTrigger?: SelectLoadMoreTrigger;
  loadMoreText?: React.ReactNode;
  onChange?: (value: string | string[] | undefined, option?: SelectOption | SelectOption[], index?: number) => void;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  defaultOpen?: boolean;
  placeholder?: React.ReactNode;
  locale?: BiuComponentsLocale;
  localeText?: BiuComponentsLocaleTextOverrides;
  classNames?: SelectClassNames;
}

const ALL_OPTION_VALUE = "__biu_select_all__";
const useIsomorphicLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

function optionText(option: SelectOption) {
  return typeof option.label === "string" ? option.label : String(option.value);
}

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(function Select(
  {
    options = [],
    value,
    defaultValue,
    mode,
    multiple,
    disabled = false,
    loading = false,
    size = "medium",
    allowClear = false,
    searchable = false,
    searchValue,
    searchPlaceholder,
    onSearch,
    filterOption = true,
    hasAllOption = false,
    allowAllSelect = false,
    allOption,
    optionRender,
    labelRender,
    tagRender,
    dropdownRender,
    dropdownHeader,
    dropdownFooter,
    notFoundContent,
    maxTagCount,
    maxCount,
    onLoadMore,
    onLoadError,
    hasMore = false,
    loadingMore = false,
    loadMoreTrigger = "scroll",
    loadMoreText,
    onChange,
    onOpenChange,
    open,
    defaultOpen = false,
    placeholder,
    locale,
    localeText,
    className,
    classNames,
    "aria-label": ariaLabel,
    ...props
  },
  ref,
) {
  const text = useComponentsLocale(locale, localeText);
  const resolvedSearchPlaceholder = searchPlaceholder ?? text["搜索"];
  const isMultiple = multiple ?? mode === "multiple";
  // Keep the sentinel value under our control when the caller only customizes
  // the label. A custom value is still supported for single-select use cases,
  // but all internal comparisons must use that same value consistently.
  const allValue = allOption?.value ?? ALL_OPTION_VALUE;
  const all = { ...allOption, label: allOption?.label ?? text["全部"], value: allValue };
  const sourceOptions = React.useMemo(() => (hasAllOption ? [all, ...options] : options), [all, hasAllOption, options]);
  const [internalValue, setInternalValue] = React.useState<string | string[] | undefined>(defaultValue);
  const activeValue = value ?? internalValue ?? (isMultiple ? [] : undefined);
  const selectedValues = new Set(
    Array.isArray(activeValue) ? activeValue : activeValue === undefined ? [] : [activeValue],
  );
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const activeOpen = !disabled && !loading && (open ?? internalOpen);
  const [internalSearch, setInternalSearch] = React.useState("");
  const activeSearch = searchValue ?? internalSearch;
  const [loadPending, setLoadPending] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const [responsiveTagLimit, setResponsiveTagLimit] = React.useState(3);
  const setRef = (node: HTMLDivElement | null) => {
    rootRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };
  useIsomorphicLayoutEffect(() => {
    if (maxTagCount !== "responsive" || typeof window === "undefined") return undefined;
    const trigger = rootRef.current?.querySelector<HTMLElement>(".biu-ui-select__trigger");
    if (!trigger) return undefined;

    const updateLimit = () => {
      const width = trigger.getBoundingClientRect().width;
      if (!width) return;
      const clearWidth =
        trigger.querySelector<HTMLElement>(".biu-ui-select__clear")?.getBoundingClientRect().width ?? 0;
      // Keep a short first tag beside the +N badge once the trigger can fit the
      // chip chrome and trailing controls. Wider tags still use a conservative
      // budget so the overflow count does not disappear on narrow screens.
      const controlReserve = 56 + clearWidth;
      const firstTagThreshold = 112 + clearWidth;
      const fittingTags = Math.floor((width - controlReserve) / 104);
      const nextLimit = width < firstTagThreshold ? 0 : Math.max(1, Math.min(3, fittingTags));
      setResponsiveTagLimit((current) => (current === nextLimit ? current : nextLimit));
    };

    updateLimit();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateLimit);
      observer.observe(trigger);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", updateLimit);
    return () => window.removeEventListener("resize", updateLimit);
  }, [maxTagCount]);
  const setOpen = (next: boolean) => {
    if (disabled || loading) return;
    if (open === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };
  const filteredOptions = React.useMemo(() => {
    if (!activeSearch) return sourceOptions;
    return sourceOptions.filter((option) => {
      if (option.value === allValue) return true;
      return typeof filterOption === "function"
        ? filterOption(activeSearch, option)
        : filterOption
          ? optionText(option).toLowerCase().includes(activeSearch.toLowerCase())
          : true;
    });
  }, [activeSearch, filterOption, sourceOptions]);
  const selectedOptions = Array.from(selectedValues).map(
    (selectedValue) =>
      sourceOptions.find((option) => option.value === selectedValue) ?? {
        value: selectedValue,
        label: selectedValue,
        disabled: true,
      },
  );
  const numericMaxTagCount =
    typeof maxTagCount === "number" ? maxTagCount : maxTagCount === "responsive" ? responsiveTagLimit : undefined;
  const visibleSelected =
    numericMaxTagCount === undefined ? selectedOptions : selectedOptions.slice(0, numericMaxTagCount);
  const hiddenSelectedCount = selectedOptions.length - visibleSelected.length;
  const hiddenSelected = selectedOptions.slice(visibleSelected.length);
  const hiddenSelectedTooltip = hiddenSelected.length ? (
    <div className="biu-ui-select__hidden-tags-tooltip">
      {hiddenSelected.map((item) => (
        <div key={item.value} className="biu-ui-select__hidden-tag-label">
          {item.label}
        </div>
      ))}
    </div>
  ) : null;

  const emit = (
    next: string | string[] | undefined,
    option: SelectOption | SelectOption[] | undefined,
    index: number,
  ) => {
    if (value === undefined) setInternalValue(next);
    onChange?.(next, option, index);
  };
  const selectOption = (option: SelectOption, index: number) => {
    if (disabled || loading || option.disabled) return;
    if (option.value === allValue && isMultiple && allowAllSelect) {
      const enabled = sourceOptions.filter((item) => item.value !== allValue && !item.disabled);
      const allSelected = enabled.length > 0 && enabled.every((item) => selectedValues.has(item.value));
      emit(allSelected ? [] : enabled.slice(0, maxCount ?? enabled.length).map((item) => item.value), option, index);
      return;
    }
    if (isMultiple) {
      const current = Array.isArray(activeValue) ? activeValue : [];
      const exists = current.includes(option.value);
      if (exists)
        emit(
          current.filter((item) => item !== option.value),
          option,
          index,
        );
      else if (maxCount !== undefined && current.length >= maxCount) return;
      else emit([...current, option.value], option, index);
      return;
    }
    emit(option.value, option, index);
    setOpen(false);
  };
  const removeValue = (target: string) => {
    if (disabled || loading) return;
    if (!isMultiple) {
      emit(undefined, undefined, -1);
      return;
    }
    emit(
      (Array.isArray(activeValue) ? activeValue : []).filter((item) => item !== target),
      sourceOptions.find((item) => item.value === target),
      sourceOptions.findIndex((item) => item.value === target),
    );
  };
  const clearValue = () => {
    if (disabled || loading) return;
    emit(isMultiple ? [] : undefined, undefined, -1);
  };
  const loadMore = async () => {
    if (!onLoadMore || loadingMore || loadPending || !hasMore) return;
    setLoadPending(true);
    try {
      await onLoadMore();
    } catch (error) {
      onLoadError?.(error);
    } finally {
      setLoadPending(false);
    }
  };
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (loadMoreTrigger === "click") return;
    const target = event.currentTarget;
    if (target.scrollHeight - target.scrollTop - target.clientHeight > 32) return;
    void loadMore();
  };
  const triggerText = !isMultiple
    ? (() => {
        const selected = sourceOptions.find((item) => item.value === activeValue);
        return selected
          ? (labelRender?.(selected.value, selected) ?? selected.label)
          : activeValue !== undefined
            ? activeValue
            : (placeholder ?? text["请选择"]);
      })()
    : visibleSelected.length
      ? visibleSelected.map((item) => {
          const onClose = () => removeValue(item.value);
          const customTag = tagRender?.(item, onClose);
          if (customTag !== undefined && customTag !== null) {
            const customTagNode = React.isValidElement(customTag) ? (
              React.cloneElement(customTag, { key: item.value })
            ) : (
              <span className="biu-ui-select__custom-tag-content">{customTag}</span>
            );
            return (
              <Tooltip
                key={item.value}
                content={item.label}
                onlyOverflow
                placement="TOP"
                className="biu-ui-select__custom-tag-tooltip"
              >
                {customTagNode}
              </Tooltip>
            );
          }
          return (
            <span key={item.value} className={cx("biu-ui-select__tag", classNames?.tag)}>
              <Ellipsis content={item.label} className="biu-ui-select__tag-label" maxWidth="100%">
                {item.label}
              </Ellipsis>
              <span
                role="button"
                tabIndex={0}
                className="biu-ui-select__tag-remove"
                aria-disabled={disabled || loading || undefined}
                aria-label={text["移除 {text}"].replace("{text}", optionText(item))}
                onClick={(event) => {
                  event.stopPropagation();
                  onClose();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    event.stopPropagation();
                    onClose();
                  }
                }}
              >
                <X size={12} aria-hidden="true" />
              </span>
            </span>
          );
        })
      : // A zero responsive limit leaves the trigger to the separately rendered +N summary.
        selectedOptions.length
        ? null
        : (placeholder ?? text["请选择"]);
  const menu = (
    <div className={cx("biu-ui-select__menu", classNames?.menu)} data-biu-slot="select-menu">
      {dropdownHeader ? (
        <div className={cx("biu-ui-select__dropdown-header", classNames?.header)}>{dropdownHeader}</div>
      ) : null}
      {searchable ? (
        <div className={cx("biu-ui-select__search", classNames?.search)}>
          <input
            value={activeSearch}
            placeholder={resolvedSearchPlaceholder}
            aria-label={searchPlaceholder}
            onChange={(event) => {
              if (searchValue === undefined) setInternalSearch(event.target.value);
              onSearch?.(event.target.value);
            }}
            onKeyDown={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
      <div className="biu-ui-select__options" onScroll={(event) => void handleScroll(event)}>
        {filteredOptions.length ? (
          filteredOptions.map((option) => {
            const index = sourceOptions.indexOf(option);
            const selected =
              option.value === allValue && isMultiple && allowAllSelect
                ? sourceOptions
                    .filter((item) => item.value !== allValue && !item.disabled)
                    .every((item) => selectedValues.has(item.value))
                : selectedValues.has(option.value);
            return (
              <button
                type="button"
                key={option.value}
                disabled={disabled || loading || option.disabled}
                className={cx(
                  "biu-ui-select__option",
                  selected && "is-selected",
                  option.disabled && "is-disabled",
                  option.value === allValue && classNames?.allOption,
                  classNames?.option,
                )}
                role="option"
                aria-selected={selected}
                onClick={() => selectOption(option, index)}
              >
                {isMultiple ? (
                  <span className={cx("biu-ui-select__check", selected && "is-checked")} aria-hidden="true">
                    {selected ? <Check size={12} aria-hidden="true" /> : null}
                  </span>
                ) : null}
                <Ellipsis tooltipContent={option.label} className="biu-ui-select__option-label" maxWidth="100%">
                  {optionRender?.(option, index) ?? option.label}
                </Ellipsis>
              </button>
            );
          })
        ) : (
          <div className="biu-ui-select__empty">{notFoundContent ?? text["暂无数据"]}</div>
        )}
        {loadingMore || loadPending ? <div className="biu-ui-select__loading-more">{text["加载中…"]}</div> : null}
      </div>
      {hasMore && (loadMoreTrigger === "click" || loadMoreTrigger === "both") ? (
        <button
          type="button"
          className="biu-ui-select__load-more"
          disabled={disabled || loading || loadingMore || loadPending}
          onClick={() => void loadMore()}
        >
          {loadMoreText ?? text["加载更多"]}
        </button>
      ) : null}
      {dropdownFooter ? (
        <div className={cx("biu-ui-select__dropdown-footer", classNames?.footer)}>{dropdownFooter}</div>
      ) : null}
    </div>
  );
  // Select is intentionally LTR until it has a public direction contract.
  // Its dropdown is portaled, so both roots declare the baseline direction.
  return (
    <div
      {...props}
      ref={setRef}
      dir="ltr"
      className={cx(
        "biu-ui-select",
        `biu-ui-select--${size}`,
        isMultiple && "biu-ui-select--multiple",
        disabled && "is-disabled",
        className,
        classNames?.root,
      )}
      data-biu-component="select"
      data-state={activeOpen ? "open" : "closed"}
    >
      <PopoverPrimitive.Root open={activeOpen} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>
          <div
            role="combobox"
            tabIndex={disabled ? -1 : 0}
            className={cx("biu-ui-select__trigger", classNames?.trigger)}
            aria-label={ariaLabel}
            aria-expanded={activeOpen}
            aria-disabled={disabled || undefined}
            aria-haspopup="listbox"
            onKeyDown={(event) => {
              if (disabled) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setOpen(!activeOpen);
              }
            }}
          >
            <span
              className={cx("biu-ui-select__value", !selectedOptions.length && "is-placeholder", classNames?.value)}
            >
              {triggerText}
            </span>
            {isMultiple && hiddenSelectedCount > 0 ? (
              <Tooltip content={hiddenSelectedTooltip} onlyOverflow={false} placement="TOP">
                <span
                  className="biu-ui-select__tag biu-ui-select__more-tag"
                  role="button"
                  tabIndex={0}
                  aria-label={text["还有 {count} 项"].replace("{count}", String(hiddenSelectedCount))}
                >
                  +{hiddenSelectedCount}
                </span>
              </Tooltip>
            ) : null}
            {allowClear && (isMultiple ? selectedOptions.length > 0 : activeValue !== undefined) ? (
              <span
                className="biu-ui-select__clear"
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation();
                  clearValue();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    event.stopPropagation();
                    clearValue();
                  }
                }}
              >
                <X size={13} aria-hidden="true" />
              </span>
            ) : (
              <span className="biu-ui-select__arrow" aria-hidden="true">
                <ChevronDown size={15} />
              </span>
            )}
          </div>
        </PopoverPrimitive.Trigger>
        {activeOpen && typeof document !== "undefined"
          ? createPortal(
              <PopoverPrimitive.Content
                dir="ltr"
                className={cx("biu-ui-select__content", classNames?.panel)}
                sideOffset={6}
                collisionPadding={8}
                align="start"
                data-biu-overlay-interactive="true"
                onOpenAutoFocus={(event) => {
                  if (!searchable) event.preventDefault();
                }}
              >
                {dropdownRender ? dropdownRender(menu) : menu}
              </PopoverPrimitive.Content>,
              document.body,
            )
          : null}
      </PopoverPrimitive.Root>
    </div>
  );
});
