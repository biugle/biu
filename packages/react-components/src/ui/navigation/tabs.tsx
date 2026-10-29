import * as React from "react";
import { ChevronLeft, ChevronRight, X } from "@biugle/icons";
import { Button } from "../button/index.js";
import { Select, TextField } from "../control/index.js";
import { Ellipsis } from "../overlay/index.js";
import { cx } from "../../shared/utils.js";
import {
  useComponentsLocale,
  type BiuComponentsLocale,
  type BiuComponentsLocaleTextOverrides,
} from "../../provider.js";
import type { NavigationLocaleProps } from "./types.js";

export interface TabItem {
  key: string;
  label: React.ReactNode;
  children?: React.ReactNode;
  disabled?: boolean;
  closable?: boolean;
}

export type TabsType = "line" | "card" | "tag";
export interface TabsClassNames {
  root?: string;
  list?: string;
  tab?: string;
  panel?: string;
  arrow?: string;
  close?: string;
}

export function Tabs({
  items,
  value,
  defaultValue,
  onChange,
  onClose,
  type = "line",
  orientation = "horizontal",
  showArrows = "auto",
  scrollable = true,
  width = "100%",
  addButton,
  onAdd,
  classNames,
  style,
  className,
  locale,
  localeText,
}: {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (key: string) => void;
  onClose?: (key: string) => void;
  type?: TabsType;
  orientation?: "horizontal" | "vertical";
  showArrows?: "auto" | "both" | "none";
  scrollable?: boolean;
  width?: number | string;
  addButton?: React.ReactNode;
  onAdd?: () => void;
  classNames?: TabsClassNames;
  style?: React.CSSProperties;
  className?: string;
  locale?: BiuComponentsLocale;
  localeText?: BiuComponentsLocaleTextOverrides;
}) {
  const text = useComponentsLocale(locale, localeText);
  const first = items.find((item) => !item.disabled)?.key;
  const [internal, setInternal] = React.useState(defaultValue ?? first);
  const active = value ?? (items.some((item) => item.key === internal && !item.disabled) ? internal : first);
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const [overflowed, setOverflowed] = React.useState(false);
  const updateOverflow = React.useCallback(() => {
    const element = listRef.current;
    if (!element) return;
    setOverflowed(
      orientation === "horizontal"
        ? element.scrollWidth > element.clientWidth + 1
        : element.scrollHeight > element.clientHeight + 1,
    );
  }, [orientation]);
  React.useLayoutEffect(() => {
    updateOverflow();
    if (typeof window === "undefined") return undefined;
    window.addEventListener("resize", updateOverflow);
    const observer =
      typeof ResizeObserver !== "undefined" && listRef.current ? new ResizeObserver(updateOverflow) : undefined;
    if (observer && listRef.current) {
      observer.observe(listRef.current);
      Array.from(listRef.current.children).forEach((child) => observer.observe(child));
    }
    return () => {
      window.removeEventListener("resize", updateOverflow);
      observer?.disconnect();
    };
  }, [items, updateOverflow]);
  const scroll = (direction: -1 | 1) => {
    const element = listRef.current;
    if (!element) return;
    const left = orientation === "horizontal" ? direction * 180 : 0;
    const top = orientation === "vertical" ? direction * 120 : 0;
    if (typeof element.scrollBy === "function") {
      element.scrollBy({ left, top, behavior: "smooth" });
    } else {
      element.scrollLeft += left;
      element.scrollTop += top;
    }
  };
  // `both` controls the two arrow sides; it must not force arrows when the
  // tabs actually fit in the available space.
  const showArrow = scrollable && showArrows !== "none" && overflowed;
  const activeItem = items.find((item) => item.key === active);
  const hasPanel = activeItem?.children !== undefined && activeItem?.children !== null;
  return (
    <div
      className={cx("biu-ui-tabs", `biu-ui-tabs--${type}`, `biu-ui-tabs--${orientation}`, classNames?.root, className)}
      style={{ width, ...style }}
    >
      <div className="biu-ui-tabs__bar">
        {showArrow ? (
          <button
            type="button"
            className={cx("biu-ui-tabs__arrow", classNames?.arrow)}
            aria-label={text["向前滚动"]}
            onClick={() => scroll(-1)}
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
        ) : null}
        <div
          ref={listRef}
          className={cx("biu-ui-tabs__list", scrollable && "biu-ui-tabs__list--scrollable", classNames?.list)}
          role="tablist"
          aria-orientation={orientation}
        >
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              id={`biu-tab-${item.key}`}
              role="tab"
              aria-selected={item.key === active}
              aria-controls={`biu-tabpanel-${item.key}`}
              disabled={item.disabled}
              className={cx("biu-ui-tabs__tab", classNames?.tab)}
              onClick={() => {
                if (item.disabled) return;
                if (value === undefined) setInternal(item.key);
                onChange?.(item.key);
              }}
            >
              <Ellipsis content={item.label} maxWidth={orientation === "horizontal" ? 220 : 180} alwaysTooltip>
                {item.label}
              </Ellipsis>
              {item.closable ? (
                <span
                  className={cx("biu-ui-tabs__close", classNames?.close)}
                  role="button"
                  tabIndex={0}
                  aria-label={text["关闭 {text}"].replace("{text}", String(item.label))}
                  onClick={(event) => {
                    event.stopPropagation();
                    onClose?.(item.key);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      event.stopPropagation();
                      onClose?.(item.key);
                    }
                  }}
                >
                  <X size={12} aria-hidden="true" />
                </span>
              ) : null}
            </button>
          ))}
          {addButton ? (
            <button type="button" className="biu-ui-tabs__add" onClick={onAdd}>
              {addButton}
            </button>
          ) : null}
        </div>
        {showArrow ? (
          <button
            type="button"
            className={cx("biu-ui-tabs__arrow", classNames?.arrow)}
            aria-label={text["向后滚动"]}
            onClick={() => scroll(1)}
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {hasPanel ? (
        <div
          id={active ? `biu-tabpanel-${active}` : undefined}
          className={cx("biu-ui-tabs__content", classNames?.panel)}
          role="tabpanel"
          aria-labelledby={active ? `biu-tab-${active}` : undefined}
        >
          {activeItem?.children}
        </div>
      ) : null}
    </div>
  );
}

export function Tag({
  color = "default",
  children,
  className,
  classNames,
}: {
  color?: "default" | "success" | "warning" | "danger" | "info";
  children: React.ReactNode;
  className?: string;
  classNames?: { root?: string };
}) {
  return <span className={cx("biu-ui-tag", `biu-ui-tag--${color}`, classNames?.root, className)}>{children}</span>;
}

export function Progress({
  percent,
  className,
  classNames,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  percent: number;
  classNames?: { root?: string; track?: string; fill?: string };
}) {
  const value = Math.max(0, Math.min(100, percent));
  return (
    <div
      {...props}
      className={cx("biu-ui-progress", classNames?.root, className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <span className={cx("biu-ui-progress__track", classNames?.track)} data-biu-slot="progress-track">
        <span className={cx("biu-ui-progress__fill", classNames?.fill)} style={{ width: `${value}%` }} />
      </span>
    </div>
  );
}

export function Pagination({
  current = 1,
  pageSize = 20,
  total = 0,
  pageSizeOptions = [10, 20, 50],
  showSizeChanger = false,
  showQuickJumper = false,
  quickJumperWidth = 90,
  showTotal,
  simple = false,
  responsive = true,
  hideOnSinglePage = false,
  showLessItems = false,
  itemRender,
  onChange,
  className,
  classNames,
  locale,
  localeText,
}: {
  current?: number;
  pageSize?: number;
  total?: number;
  pageSizeOptions?: number[];
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  quickJumperWidth?: number | string;
  showTotal?: (total: number, range: [number, number]) => React.ReactNode;
  simple?: boolean;
  responsive?: boolean;
  hideOnSinglePage?: boolean;
  showLessItems?: boolean;
  itemRender?: (page: number, type: "page" | "prev" | "next", element: React.ReactNode) => React.ReactNode;
  onChange?: (page: number, pageSize: number) => void;
  className?: string;
  classNames?: {
    root?: string;
    button?: string;
    previous?: string;
    next?: string;
    item?: string;
    ellipsis?: string;
    total?: string;
    sizeSelect?: string;
    jumper?: string;
    jumperInput?: string;
  };
} & NavigationLocaleProps) {
  const text = useComponentsLocale(locale, localeText);
  const safePageSize = Math.max(1, pageSize);
  const pages = Math.max(1, Math.ceil(Math.max(0, total) / safePageSize));
  const activeCurrent = Math.max(1, Math.min(current, pages));
  const [quickPage, setQuickPage] = React.useState(String(activeCurrent));
  const [responsiveMode, setResponsiveMode] = React.useState<"small" | "medium" | "large">("large");
  const compactResponsive = responsive && responsiveMode === "small";
  const compactControlsResponsive = responsive && responsiveMode !== "large";
  React.useEffect(() => setQuickPage(String(activeCurrent)), [activeCurrent]);
  React.useEffect(() => {
    if (!responsive || typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
    const smallMedia = window.matchMedia("(max-width: 559px)");
    const mediumMedia = window.matchMedia("(max-width: 799px)");
    const update = () => setResponsiveMode(smallMedia.matches ? "small" : mediumMedia.matches ? "medium" : "large");
    update();
    smallMedia.addEventListener?.("change", update);
    mediumMedia.addEventListener?.("change", update);
    return () => {
      smallMedia.removeEventListener?.("change", update);
      mediumMedia.removeEventListener?.("change", update);
    };
  }, [responsive]);
  if (hideOnSinglePage && pages <= 1) return null;
  const range: [number, number] = [
    total === 0 ? 0 : Math.min(total, (activeCurrent - 1) * safePageSize + 1),
    Math.min(total, activeCurrent * safePageSize),
  ];
  const pageItems: Array<number | "ellipsis"> = [];
  const visiblePages = showLessItems ? 5 : 7;
  if (!simple) {
    if (pages <= visiblePages) {
      for (let page = 1; page <= pages; page += 1) pageItems.push(page);
    } else {
      const sibling = showLessItems ? 1 : 2;
      const start = Math.max(2, Math.min(activeCurrent - sibling, pages - visiblePages + 2));
      const end = Math.min(pages - 1, Math.max(activeCurrent + sibling, visiblePages - 1));
      pageItems.push(1);
      if (start > 2) pageItems.push("ellipsis");
      for (let page = start; page <= end; page += 1) pageItems.push(page);
      if (end < pages - 1) pageItems.push("ellipsis");
      pageItems.push(pages);
    }
  }
  return (
    <nav
      className={cx(
        "biu-ui-pagination",
        responsive && "biu-ui-pagination--responsive",
        simple && "biu-ui-pagination--simple",
        classNames?.root,
        className,
      )}
      style={
        {
          "--biu-pagination-control-width": compactControlsResponsive
            ? "45px"
            : typeof quickJumperWidth === "number"
              ? `${quickJumperWidth}px`
              : quickJumperWidth,
          "--biu-pagination-jumper-width": compactControlsResponsive
            ? "45px"
            : typeof quickJumperWidth === "number"
              ? `${quickJumperWidth}px`
              : quickJumperWidth,
        } as React.CSSProperties
      }
      aria-label={text["分页"]}
    >
      <Button
        size="small"
        variant="secondary"
        disabled={activeCurrent <= 1}
        aria-label={text["上一页"]}
        className={cx(classNames?.button, classNames?.previous)}
        onClick={() => onChange?.(activeCurrent - 1, safePageSize)}
      >
        {itemRender?.(activeCurrent - 1, "prev", text["上一页"]) ?? <ChevronLeft size={14} aria-hidden="true" />}
      </Button>
      {compactResponsive ? (
        <Button
          size="small"
          variant="contained"
          aria-current="page"
          aria-label={`${text["页"]} ${activeCurrent}`}
          className={cx("biu-ui-pagination__item", classNames?.button, classNames?.item)}
        >
          {activeCurrent}
        </Button>
      ) : simple ? (
        <span>
          {activeCurrent} / {pages}
        </span>
      ) : (
        pageItems.map((page, index) => (
          <React.Fragment key={`${page}-${index}`}>
            {page === "ellipsis" ? (
              <span className={cx("biu-ui-pagination__ellipsis", classNames?.ellipsis)} aria-hidden="true">
                …
              </span>
            ) : (
              <Button
                size="small"
                variant={page === activeCurrent ? "contained" : "outlined"}
                aria-current={page === activeCurrent ? "page" : undefined}
                aria-label={`${text["页"]} ${page}`}
                className={cx("biu-ui-pagination__item", classNames?.button, classNames?.item)}
                onClick={() => onChange?.(page, safePageSize)}
              >
                {itemRender?.(page, "page", page) ?? page}
              </Button>
            )}
          </React.Fragment>
        ))
      )}
      {showTotal && !compactControlsResponsive ? (
        <span className={cx("biu-ui-pagination__total", classNames?.total)}>{showTotal(total, range)}</span>
      ) : null}
      <Button
        size="small"
        variant="secondary"
        disabled={activeCurrent >= pages}
        aria-label={text["下一页"]}
        className={cx(classNames?.button, classNames?.next)}
        onClick={() => onChange?.(activeCurrent + 1, safePageSize)}
      >
        {itemRender?.(activeCurrent + 1, "next", text["下一页"]) ?? <ChevronRight size={14} aria-hidden="true" />}
      </Button>
      {showSizeChanger ? (
        <Select
          size="small"
          className={cx("biu-ui-pagination__size-select", classNames?.sizeSelect)}
          aria-label={text["每页数量"]}
          value={String(safePageSize)}
          options={pageSizeOptions.map((size) => ({ value: String(size), label: `${size} ${text["/ 页"]}` }))}
          labelRender={compactControlsResponsive ? () => String(safePageSize) : undefined}
          onChange={(next) => onChange?.(1, Math.max(1, Number(next)))}
          locale={locale}
          localeText={localeText}
        />
      ) : null}
      {showQuickJumper ? (
        <label
          className={cx("biu-ui-pagination__jumper", classNames?.jumper)}
          style={
            {
              "--biu-pagination-jumper-width": compactControlsResponsive
                ? "45px"
                : typeof quickJumperWidth === "number"
                  ? `${quickJumperWidth}px`
                  : quickJumperWidth,
            } as React.CSSProperties
          }
        >
          {text["跳至"]}{" "}
          <TextField
            size="small"
            aria-label={text["跳至"]}
            className={cx("biu-ui-pagination__jumper-input", classNames?.jumperInput)}
            type="number"
            min={1}
            max={pages}
            value={quickPage}
            onChange={(event) => setQuickPage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onChange?.(Math.max(1, Math.min(pages, Number(quickPage))), safePageSize);
            }}
          />{" "}
          {text["页"]}
        </label>
      ) : null}
    </nav>
  );
}
