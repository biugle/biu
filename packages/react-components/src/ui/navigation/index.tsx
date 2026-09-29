import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  FileText,
  Folder,
  MoreHorizontal,
  X,
} from "@biugle/icons";
import { Button, type ButtonProps } from "../button/index.js";
import { TextField } from "../control/index.js";
import { Ellipsis, Tooltip } from "../overlay/index.js";
import { Select } from "../control/index.js";
import { cx } from "../../shared/utils.js";
import {
  useComponentsLocale,
  type BiuComponentsLocale,
  type BiuComponentsLocaleTextOverrides,
} from "../../provider.js";

const MAX_MENU_DEPTH = 5;

interface NavigationLocaleProps {
  locale?: BiuComponentsLocale;
  localeText?: BiuComponentsLocaleTextOverrides;
}

export interface DropdownMenuItem {
  key: string;
  label?: React.ReactNode;
  disabled?: boolean;
  /** Optional action invoked after Radix accepts the item selection. */
  onClick?: () => void;
  icon?: React.ReactNode;
  shortcut?: React.ReactNode;
  type?: "item" | "checkbox" | "radio" | "separator" | "label";
  checked?: boolean;
  /** Radio items in the same group share one selected value. */
  radioGroup?: string;
  children?: DropdownMenuItem[];
}

interface DropdownRenderContext {
  checkedKeys: Set<string>;
  toggleChecked: (key: string, checked: boolean) => void;
  radioValues: Record<string, string | undefined>;
  selectRadio: (group: string, value: string) => void;
}

function renderDropdownLabel(label: React.ReactNode) {
  return (
    <Ellipsis tooltipContent={label} className="biu-ui-dropdown-menu__label-text" maxWidth="100%">
      {label}
    </Ellipsis>
  );
}

function collectDropdownState(items: DropdownMenuItem[], checked: string[], radios: Record<string, string>) {
  for (const item of items) {
    if (item.type === "checkbox" && item.checked) checked.push(item.key);
    if (item.type === "radio" && item.checked) radios[item.radioGroup ?? "default"] = item.key;
    if (item.children?.length) collectDropdownState(item.children, checked, radios);
  }
}

function collectDropdownRadioGroups(items: DropdownMenuItem[], groups: string[] = []) {
  for (const item of items) {
    if (item.type === "radio") {
      const group = item.radioGroup ?? "default";
      if (!groups.includes(group)) groups.push(group);
    }
    if (item.children?.length) collectDropdownRadioGroups(item.children, groups);
  }
  return groups;
}

function renderRadioItem(item: DropdownMenuItem, className?: string, onSelect?: (key: string) => void) {
  return (
    <DropdownMenuPrimitive.RadioItem
      key={item.key}
      value={item.key}
      disabled={item.disabled}
      onSelect={() => {
        onSelect?.(item.key);
        item.onClick?.();
      }}
      className={cx("biu-ui-dropdown-menu__item", className)}
    >
      {item.icon ? <span className="biu-ui-dropdown-menu__icon">{item.icon}</span> : null}
      {renderDropdownLabel(item.label)}
      {item.shortcut ? <kbd className="biu-ui-dropdown-menu__shortcut">{item.shortcut}</kbd> : null}
      <DropdownMenuPrimitive.ItemIndicator className="biu-ui-dropdown-menu__indicator">
        <Check size={14} aria-hidden="true" />
      </DropdownMenuPrimitive.ItemIndicator>
    </DropdownMenuPrimitive.RadioItem>
  );
}

function renderDropdownItems(
  items: DropdownMenuItem[],
  onSelect: ((key: string) => void) | undefined,
  context: DropdownRenderContext,
  className?: string,
): React.ReactNode {
  const result: React.ReactNode[] = [];
  let radioItems: DropdownMenuItem[] = [];
  let radioGroup = "";
  const flushRadioItems = () => {
    if (!radioItems.length) return;
    const group = radioGroup;
    const itemsForGroup = radioItems;
    result.push(
      <DropdownMenuPrimitive.RadioGroup
        key={`radio-group-${group}-${itemsForGroup.map((item) => item.key).join("-")}`}
        value={context.radioValues[group] ?? ""}
        onValueChange={(value) => context.selectRadio(group, value)}
      >
        {itemsForGroup.map((item) => renderRadioItem(item, className, onSelect))}
      </DropdownMenuPrimitive.RadioGroup>,
    );
    radioItems = [];
    radioGroup = "";
  };

  for (const item of items) {
    if (item.type === "radio") {
      const nextGroup = item.radioGroup ?? "default";
      if (radioItems.length && radioGroup !== nextGroup) flushRadioItems();
      radioGroup = nextGroup;
      radioItems.push(item);
      continue;
    }
    flushRadioItems();
    if (item.type === "separator") {
      result.push(<DropdownMenuPrimitive.Separator key={item.key} className="biu-ui-dropdown-menu__separator" />);
    } else if (item.type === "label") {
      result.push(
        <DropdownMenuPrimitive.Label key={item.key} className="biu-ui-dropdown-menu__label">
          {renderDropdownLabel(item.label)}
        </DropdownMenuPrimitive.Label>,
      );
    } else if (item.children?.length) {
      result.push(
        <DropdownMenuPrimitive.Sub key={item.key}>
          <DropdownMenuPrimitive.SubTrigger
            className={cx("biu-ui-dropdown-menu__item", className)}
            disabled={item.disabled}
          >
            {item.icon ? <span className="biu-ui-dropdown-menu__icon">{item.icon}</span> : null}
            {renderDropdownLabel(item.label)}
            <ChevronRight className="biu-ui-dropdown-menu__chevron" size={14} aria-hidden="true" />
          </DropdownMenuPrimitive.SubTrigger>
          <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.SubContent
              className="biu-ui-popover__content biu-ui-dropdown__content"
              sideOffset={4}
              collisionPadding={8}
              data-biu-overlay-interactive="true"
            >
              {renderDropdownItems(item.children, onSelect, context, className)}
            </DropdownMenuPrimitive.SubContent>
          </DropdownMenuPrimitive.Portal>
        </DropdownMenuPrimitive.Sub>,
      );
    } else if (item.type === "checkbox") {
      result.push(
        <DropdownMenuPrimitive.CheckboxItem
          key={item.key}
          checked={context.checkedKeys.has(item.key)}
          disabled={item.disabled}
          onCheckedChange={(checked) => context.toggleChecked(item.key, checked)}
          onSelect={() => {
            onSelect?.(item.key);
            item.onClick?.();
          }}
          className={cx("biu-ui-dropdown-menu__item", className)}
        >
          {item.icon ? <span className="biu-ui-dropdown-menu__icon">{item.icon}</span> : null}
          {renderDropdownLabel(item.label)}
          {item.shortcut ? <kbd className="biu-ui-dropdown-menu__shortcut">{item.shortcut}</kbd> : null}
          <DropdownMenuPrimitive.ItemIndicator className="biu-ui-dropdown-menu__indicator">
            <Check size={14} aria-hidden="true" />
          </DropdownMenuPrimitive.ItemIndicator>
        </DropdownMenuPrimitive.CheckboxItem>,
      );
    } else {
      result.push(
        <DropdownMenuPrimitive.Item
          key={item.key}
          disabled={item.disabled}
          onSelect={() => {
            onSelect?.(item.key);
            item.onClick?.();
          }}
          className={cx("biu-ui-dropdown-menu__item", className)}
        >
          {item.icon ? <span className="biu-ui-dropdown-menu__icon">{item.icon}</span> : null}
          {renderDropdownLabel(item.label)}
          {item.shortcut ? <kbd className="biu-ui-dropdown-menu__shortcut">{item.shortcut}</kbd> : null}
        </DropdownMenuPrimitive.Item>,
      );
    }
  }
  flushRadioItems();
  return result;
}

export interface DropdownMenuClassNames {
  root?: string;
  trigger?: string;
  content?: string;
  menu?: string;
  item?: string;
  label?: string;
  separator?: string;
  header?: string;
  footer?: string;
}

export function DropdownMenu({
  trigger,
  items,
  onSelect,
  className,
  open,
  defaultOpen,
  onOpenChange,
  disabled = false,
  classNames,
  checkedKeys,
  defaultCheckedKeys,
  onCheckedChange,
  radioValue,
  defaultRadioValue,
  radioValues,
  defaultRadioValues,
  onRadioChange,
  dropdownRender,
  dropdownHeader,
  dropdownFooter,
}: {
  trigger: React.ReactNode;
  items: DropdownMenuItem[];
  onSelect?: (key: string) => void;
  className?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  classNames?: DropdownMenuClassNames;
  checkedKeys?: string[];
  defaultCheckedKeys?: string[];
  onCheckedChange?: (keys: string[]) => void;
  radioValue?: string;
  defaultRadioValue?: string;
  radioValues?: Record<string, string | undefined>;
  defaultRadioValues?: Record<string, string | undefined>;
  onRadioChange?: (value: string, group: string) => void;
  dropdownRender?: (menu: React.ReactNode) => React.ReactNode;
  dropdownHeader?: React.ReactNode;
  dropdownFooter?: React.ReactNode;
}) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen ?? false);
  const initialState = React.useMemo(() => {
    const checked: string[] = [];
    const radios: Record<string, string> = {};
    collectDropdownState(items, checked, radios);
    const groups = collectDropdownRadioGroups(items);
    if (defaultRadioValue !== undefined && groups.length && !Object.values(radios).length) {
      radios[groups[0]] = defaultRadioValue;
    }
    return { checked, radios };
  }, [defaultRadioValue, items]);
  const [internalCheckedKeys, setInternalCheckedKeys] = React.useState<string[]>(
    defaultCheckedKeys ?? initialState.checked,
  );
  const [internalRadioValues, setInternalRadioValues] = React.useState<Record<string, string | undefined>>(() => ({
    ...initialState.radios,
    ...defaultRadioValues,
    ...(defaultRadioValue === undefined ? {} : { default: defaultRadioValue }),
  }));
  const active = open ?? internalOpen;
  const activeCheckedKeys = checkedKeys ?? internalCheckedKeys;
  const activeRadioValues = radioValues ?? internalRadioValues;
  const setActive = (next: boolean) => {
    if (disabled) return;
    if (open === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };
  const context: DropdownRenderContext = {
    checkedKeys: new Set(activeCheckedKeys),
    toggleChecked: (key, checked) => {
      const next = checked
        ? [...new Set([...activeCheckedKeys, key])]
        : activeCheckedKeys.filter((current) => current !== key);
      if (checkedKeys === undefined) setInternalCheckedKeys(next);
      onCheckedChange?.(next);
    },
    radioValues: {
      ...activeRadioValues,
      ...(radioValue === undefined ? {} : { default: radioValue }),
    },
    selectRadio: (group, value) => {
      const next = { ...activeRadioValues, [group]: value };
      if (radioValues === undefined) setInternalRadioValues(next);
      onRadioChange?.(value, group);
    },
  };
  const triggerNode = React.isValidElement(trigger) ? (
    React.cloneElement(
      trigger as React.ReactElement<{ className?: string; disabled?: boolean; "aria-disabled"?: boolean }>,
      {
        className: cx(
          (trigger.props as { className?: string }).className,
          "biu-ui-dropdown__trigger-control",
          classNames?.trigger,
        ),
        disabled: disabled || (trigger.props as { disabled?: boolean }).disabled,
        "aria-disabled": disabled || (trigger.props as { "aria-disabled"?: boolean })["aria-disabled"] || undefined,
      },
    )
  ) : (
    <button type="button" className={cx("biu-ui-dropdown__trigger-control", classNames?.trigger)} disabled={disabled}>
      {trigger}
    </button>
  );
  return (
    <DropdownMenuPrimitive.Root open={active} onOpenChange={setActive}>
      <div
        className={cx("biu-ui-popover biu-ui-dropdown", classNames?.root, className)}
        data-biu-component="dropdown-menu"
        data-state={active ? "open" : "closed"}
      >
        <DropdownMenuPrimitive.Trigger asChild>{triggerNode}</DropdownMenuPrimitive.Trigger>
        <DropdownMenuPrimitive.Portal container={typeof document === "undefined" ? undefined : document.body}>
          <DropdownMenuPrimitive.Content
            className={cx("biu-ui-popover__content biu-ui-dropdown__content", classNames?.content)}
            sideOffset={6}
            collisionPadding={8}
            align="start"
            data-biu-slot="dropdown-content"
            data-biu-overlay-interactive="true"
          >
            {dropdownHeader ? (
              <div className={cx("biu-ui-dropdown__header", classNames?.header)}>{dropdownHeader}</div>
            ) : null}
            {dropdownRender?.(
              <ul className={cx("biu-ui-dropdown-menu", classNames?.menu)}>
                {renderDropdownItems(items, onSelect, context, classNames?.item)}
              </ul>,
            ) ?? (
              <ul className={cx("biu-ui-dropdown-menu", classNames?.menu)}>
                {renderDropdownItems(items, onSelect, context, classNames?.item)}
              </ul>
            )}
            {dropdownFooter ? (
              <div className={cx("biu-ui-dropdown__footer", classNames?.footer)}>{dropdownFooter}</div>
            ) : null}
          </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
      </div>
    </DropdownMenuPrimitive.Root>
  );
}

export interface ButtonListItem {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  tooltip?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  buttonProps?: Omit<ButtonProps, "children" | "onClick" | "icon" | "className">;
  className?: string;
}

export interface ButtonListProps {
  items: ButtonListItem[];
  /** Maximum number of visible slots, including the overflow button. */
  maxCount?: number;
  /** Render visible actions as icon-only buttons. The overflow menu always uses text labels. */
  iconOnly?: boolean;
  className?: string;
  overflowLabel?: React.ReactNode;
  overflowIcon?: React.ReactNode;
  locale?: BiuComponentsLocale;
  localeText?: BiuComponentsLocaleTextOverrides;
}

/**
 * Compact action list for table rows and toolbars. The caller keeps a complete
 * semantic action list; when maxCount is exceeded, the final visible slot is
 * replaced by an ellipsis dropdown containing the remaining actions.
 */
export function ButtonList({
  items,
  maxCount,
  iconOnly = false,
  className,
  overflowLabel,
  overflowIcon = <MoreHorizontal size={16} />,
  locale,
  localeText,
}: ButtonListProps) {
  const text = useComponentsLocale(locale, localeText);
  const resolvedOverflowLabel = overflowLabel ?? text["更多操作"];
  const overflowed = maxCount !== undefined && maxCount > 0 && items.length > maxCount;
  const visibleCount = overflowed ? Math.max(0, maxCount - 1) : items.length;
  const visibleItems = items.slice(0, visibleCount);
  const overflowItems = items.slice(visibleCount);
  const renderAction = (item: ButtonListItem) => {
    const renderIconOnly = iconOnly && Boolean(item.icon);
    const button = (
      <Button
        {...item.buttonProps}
        type={item.buttonProps?.type ?? "secondary"}
        variant={item.buttonProps?.variant ?? "contained"}
        size={item.buttonProps?.size ?? "small"}
        icon={item.icon}
        onlyIcon={renderIconOnly}
        tooltip={item.tooltip ?? item.label}
        disabled={item.disabled || item.buttonProps?.disabled}
        className={cx(
          "biu-ui-button-list__action",
          renderIconOnly && "biu-ui-button-list__action--icon-only",
          item.className,
        )}
        aria-label={typeof item.label === "string" ? item.label : undefined}
        onClick={item.onClick}
      >
        {item.label}
      </Button>
    );
    return item.tooltip !== undefined && !renderIconOnly ? (
      <Tooltip key={item.key} content={item.tooltip} onlyOverflow={false}>
        {button}
      </Tooltip>
    ) : (
      React.cloneElement(button, { key: item.key })
    );
  };
  return (
    <div className={cx("biu-ui-button-list", className)} data-biu-component="button-list">
      {visibleItems.map(renderAction)}
      {overflowed ? (
        <DropdownMenu
          trigger={
            <Button
              type="secondary"
              variant="contained"
              size="small"
              icon={overflowIcon}
              onlyIcon
              tooltip={resolvedOverflowLabel}
              aria-label={typeof resolvedOverflowLabel === "string" ? resolvedOverflowLabel : text["更多操作"]}
            >
              {resolvedOverflowLabel}
            </Button>
          }
          items={overflowItems.map((item) => ({
            key: item.key,
            label: item.label,
            disabled: item.disabled || item.buttonProps?.disabled,
            onClick: item.onClick,
          }))}
        />
      ) : null}
    </div>
  );
}

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
      <div
        id={active ? `biu-tabpanel-${active}` : undefined}
        className={cx("biu-ui-tabs__content", classNames?.panel)}
        role="tabpanel"
        aria-labelledby={active ? `biu-tab-${active}` : undefined}
      >
        {items.find((item) => item.key === active)?.children}
      </div>
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
  };
} & NavigationLocaleProps) {
  const text = useComponentsLocale(locale, localeText);
  const safePageSize = Math.max(1, pageSize);
  const pages = Math.max(1, Math.ceil(Math.max(0, total) / safePageSize));
  const activeCurrent = Math.max(1, Math.min(current, pages));
  const [quickPage, setQuickPage] = React.useState(String(activeCurrent));
  React.useEffect(() => setQuickPage(String(activeCurrent)), [activeCurrent]);
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
      {simple ? (
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
                className={cx(classNames?.button, classNames?.item)}
                onClick={() => onChange?.(page, safePageSize)}
              >
                {itemRender?.(page, "page", page) ?? page}
              </Button>
            )}
          </React.Fragment>
        ))
      )}
      {showTotal ? (
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
          className={cx("biu-ui-pagination__size-select", classNames?.sizeSelect)}
          aria-label={text["每页数量"]}
          value={String(safePageSize)}
          options={pageSizeOptions.map((size) => ({ value: String(size), label: `${size} ${text["/ 页"]}` }))}
          onChange={(next) => onChange?.(1, Math.max(1, Number(next)))}
          locale={locale}
          localeText={localeText}
        />
      ) : null}
      {showQuickJumper ? (
        <label className={cx("biu-ui-pagination__jumper", classNames?.jumper)}>
          {text["跳至"]}{" "}
          <input
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

export interface MenuItem {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  children?: MenuItem[];
}

export interface MenuClassNames {
  root?: string;
  group?: string;
  item?: string;
  icon?: string;
  label?: string;
  arrow?: string;
  submenu?: string;
}

export interface MenuProps {
  items: MenuItem[];
  selectedKey?: string;
  onSelect?: (key: string, item: MenuItem) => void;
  collapsed?: boolean;
  mode?: "inline" | "vertical" | "horizontal";
  openKeys?: string[];
  defaultOpenKeys?: string[];
  onOpenChange?: (keys: string[]) => void;
  className?: string;
  classNames?: MenuClassNames;
}

export function Menu({
  items,
  selectedKey,
  onSelect,
  collapsed = false,
  mode = "inline",
  openKeys,
  defaultOpenKeys = [],
  onOpenChange,
  className,
  classNames,
}: MenuProps) {
  const [internalOpenKeys, setInternalOpenKeys] = React.useState(defaultOpenKeys);
  const activeOpenKeys = openKeys ?? internalOpenKeys;
  const toggle = (key: string) => {
    const next = activeOpenKeys.includes(key)
      ? activeOpenKeys.filter((item) => item !== key)
      : [...activeOpenKeys, key];
    if (openKeys === undefined) setInternalOpenKeys(next);
    onOpenChange?.(next);
  };

  const renderItem = (item: MenuItem, level: number): React.ReactNode => {
    const hasChildren = Boolean(item.children?.length) && level < MAX_MENU_DEPTH - 1;
    const isOpen = activeOpenKeys.includes(item.key);
    const icon = item.icon ?? (hasChildren ? <Folder size={16} /> : null);
    const itemButton = (
      <button
        type="button"
        data-menu-item="true"
        data-menu-key={item.key}
        data-menu-level={level}
        disabled={item.disabled}
        className={cx(
          "biu-ui-menu__item",
          hasChildren && "biu-ui-menu__directory",
          item.key === selectedKey && "is-active",
          classNames?.item,
        )}
        style={{ "--biu-menu-level": level } as React.CSSProperties}
        aria-expanded={hasChildren ? isOpen : undefined}
        onClick={() => {
          if (hasChildren) toggle(item.key);
          else onSelect?.(item.key, item);
        }}
      >
        {icon ? (
          <span className={cx("biu-ui-menu__icon", classNames?.icon)} aria-hidden={item.icon ? undefined : true}>
            {icon}
          </span>
        ) : null}
        {!collapsed ? (
          <Ellipsis content={item.label} className={cx("biu-ui-menu__label", classNames?.label)}>
            {item.label}
          </Ellipsis>
        ) : null}
        {hasChildren && !collapsed ? (
          <span className={cx("biu-ui-menu__arrow", classNames?.arrow)} aria-hidden="true">
            {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </span>
        ) : null}
      </button>
    );
    const visibleItem = collapsed ? (
      <Tooltip content={item.label} onlyOverflow={false} className="biu-ui-menu__tooltip">
        {itemButton}
      </Tooltip>
    ) : (
      itemButton
    );
    return (
      <React.Fragment key={item.key}>
        {visibleItem}
        {hasChildren && isOpen && level < MAX_MENU_DEPTH - 1 ? (
          <div className={cx("biu-ui-menu__submenu", classNames?.submenu)} data-menu-submenu="true">
            {item.children?.map((child) => renderItem(child, level + 1))}
          </div>
        ) : null}
      </React.Fragment>
    );
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('[data-menu-item="true"]:not(:disabled)'),
    );
    if (!items.length) return;
    const current = document.activeElement as HTMLButtonElement | null;
    const index = current ? items.indexOf(current) : -1;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      items[(index + 1 + items.length) % items.length]?.focus();
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      items[(index - 1 + items.length) % items.length]?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      items[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      items[items.length - 1]?.focus();
    }
  };

  return (
    <nav
      className={cx(
        "biu-ui-menu",
        `biu-ui-menu--${mode}`,
        collapsed && "biu-ui-menu--collapsed",
        classNames?.root,
        className,
      )}
      onKeyDown={handleKeyDown}
      role="menu"
    >
      <div className={cx("biu-ui-menu__group", classNames?.group)}>{items.map((item) => renderItem(item, 0))}</div>
    </nav>
  );
}

export interface BreadcrumbItem {
  key?: string;
  label: React.ReactNode;
  href?: string;
  onClick?: () => void;
}

export function Breadcrumb({
  items,
  separator = "/",
  className,
  classNames,
}: {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  className?: string;
  classNames?: { root?: string; list?: string; item?: string; separator?: string };
}) {
  return (
    <nav className={cx("biu-ui-breadcrumb", classNames?.root, className)} aria-label="Breadcrumb">
      <ol className={classNames?.list}>
        {items.map((item, index) => (
          <React.Fragment key={item.key ?? `${index}-${String(item.label)}`}>
            <li className={classNames?.item}>
              {item.href ? (
                <a href={item.href} onClick={item.onClick}>
                  {item.label}
                </a>
              ) : item.onClick ? (
                <button type="button" onClick={item.onClick}>
                  {item.label}
                </button>
              ) : (
                <span>{item.label}</span>
              )}
            </li>
            {index < items.length - 1 ? (
              <li className={cx("biu-ui-breadcrumb__separator", classNames?.separator)} aria-hidden="true">
                {separator}
              </li>
            ) : null}
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
}

export interface TreeNode {
  key: string;
  title: React.ReactNode;
  children?: TreeNode[];
  disabled?: boolean;
  isLeaf?: boolean;
  icon?: React.ReactNode;
}

export interface TreeClassNames {
  root?: string;
  search?: string;
  node?: string;
  toggle?: string;
  checkbox?: string;
  icon?: string;
  title?: string;
}

function nodeText(value: React.ReactNode) {
  if (typeof value === "string" || typeof value === "number") return String(value).toLowerCase();
  return "";
}

function collectDescendantKeys(node: TreeNode, childrenFor: (node: TreeNode) => TreeNode[]): string[] {
  return childrenFor(node).flatMap((child) => [child.key, ...collectDescendantKeys(child, childrenFor)]);
}

export function Tree({
  data,
  selectedKeys,
  defaultSelectedKeys = [],
  onSelect,
  className,
  multiple = false,
  defaultExpandedKeys = [],
  expandedKeys,
  onExpand,
  checkable = false,
  checkStrictly = false,
  checkedKeys,
  defaultCheckedKeys = [],
  onCheck,
  showSearch = false,
  searchValue,
  defaultSearchValue = "",
  onSearch,
  filterTreeNode,
  titleRender,
  loadData,
  onLoadError,
  classNames,
  locale,
  localeText,
}: {
  data: TreeNode[];
  selectedKeys?: string[];
  defaultSelectedKeys?: string[];
  onSelect?: (keys: string[]) => void;
  className?: string;
  multiple?: boolean;
  defaultExpandedKeys?: string[];
  expandedKeys?: string[];
  onExpand?: (keys: string[]) => void;
  checkable?: boolean;
  checkStrictly?: boolean;
  checkedKeys?: string[];
  defaultCheckedKeys?: string[];
  onCheck?: (keys: string[], info: { node: TreeNode; checked: boolean; halfCheckedKeys: string[] }) => void;
  showSearch?: boolean;
  searchValue?: string;
  defaultSearchValue?: string;
  onSearch?: (value: string) => void;
  filterTreeNode?: (node: TreeNode, searchValue: string) => boolean;
  titleRender?: (node: TreeNode) => React.ReactNode;
  loadData?: (node: TreeNode) => TreeNode[] | void | Promise<TreeNode[] | void>;
  onLoadError?: (error: unknown, node: TreeNode) => void;
  classNames?: TreeClassNames;
} & NavigationLocaleProps) {
  const text = useComponentsLocale(locale, localeText);
  const [internalExpanded, setInternalExpanded] = React.useState(defaultExpandedKeys);
  const [internalSelected, setInternalSelected] = React.useState<string[]>(selectedKeys ?? defaultSelectedKeys);
  const [internalChecked, setInternalChecked] = React.useState(defaultCheckedKeys);
  const [internalSearch, setInternalSearch] = React.useState(defaultSearchValue);
  const [loadedChildren, setLoadedChildren] = React.useState<Record<string, TreeNode[]>>({});
  const [loadingKeys, setLoadingKeys] = React.useState<string[]>([]);
  const activeExpanded = expandedKeys ?? internalExpanded;
  const activeSelected = selectedKeys ?? internalSelected;
  const activeChecked = checkedKeys ?? internalChecked;
  const activeSearch = searchValue ?? internalSearch;
  const childrenFor = React.useCallback(
    (node: TreeNode) =>
      Object.prototype.hasOwnProperty.call(loadedChildren, node.key) ? loadedChildren[node.key] : (node.children ?? []),
    [loadedChildren],
  );
  const findNode = React.useCallback(
    (nodes: TreeNode[], key: string): TreeNode | undefined => {
      for (const node of nodes) {
        if (node.key === key) return node;
        const found = findNode(childrenFor(node), key);
        if (found) return found;
      }
      return undefined;
    },
    [childrenFor],
  );
  const setExpanded = (key: string) => {
    const next = activeExpanded.includes(key)
      ? activeExpanded.filter((item) => item !== key)
      : [...activeExpanded, key];
    if (expandedKeys === undefined) setInternalExpanded(next);
    onExpand?.(next);
  };
  const toggle = async (node: TreeNode) => {
    const isOpening = !activeExpanded.includes(node.key);
    if (isOpening && loadData && !node.isLeaf && !Object.prototype.hasOwnProperty.call(loadedChildren, node.key)) {
      setLoadingKeys((current) => [...new Set([...current, node.key])]);
      let loaded = true;
      try {
        const children = await loadData(node);
        if (children) setLoadedChildren((current) => ({ ...current, [node.key]: children }));
      } catch (error) {
        loaded = false;
        onLoadError?.(error, node);
      } finally {
        setLoadingKeys((current) => current.filter((key) => key !== node.key));
      }
      if (!loaded) return;
    }
    setExpanded(node.key);
  };
  const filteredData = React.useMemo(() => {
    const query = activeSearch.trim().toLowerCase();
    if (!query) return data;
    const filter = (nodes: TreeNode[]): TreeNode[] =>
      nodes.flatMap((node) => {
        const children = filter(childrenFor(node));
        const matched = filterTreeNode ? filterTreeNode(node, activeSearch) : nodeText(node.title).includes(query);
        return matched || children.length ? [{ ...node, children }] : [];
      });
    return filter(data);
  }, [activeSearch, childrenFor, data, filterTreeNode]);
  const searchExpandedKeys = React.useMemo(() => {
    const query = activeSearch.trim().toLowerCase();
    if (!query) return new Set<string>();
    const keys = new Set<string>();
    const visit = (nodes: TreeNode[]): boolean => {
      let matchedAny = false;
      for (const node of nodes) {
        const children = childrenFor(node);
        const childMatched = visit(children);
        const matched = filterTreeNode ? filterTreeNode(node, activeSearch) : nodeText(node.title).includes(query);
        if (childMatched) keys.add(node.key);
        matchedAny ||= matched || childMatched;
      }
      return matchedAny;
    };
    visit(data);
    return keys;
  }, [activeSearch, childrenFor, data, filterTreeNode]);
  const expandedForRender = React.useMemo(
    () => (activeSearch.trim() ? new Set([...activeExpanded, ...searchExpandedKeys]) : new Set(activeExpanded)),
    [activeExpanded, activeSearch, searchExpandedKeys],
  );
  const render = (nodes: TreeNode[], level = 0) => (
    <ul>
      {nodes.map((node) => (
        <li key={node.key}>
          <div
            className={cx("biu-ui-tree__node", classNames?.node)}
            style={{ "--biu-tree-level": level } as React.CSSProperties}
          >
            {childrenFor(node).length || (loadData && !node.isLeaf) ? (
              <button
                type="button"
                className={cx("biu-ui-tree__toggle", classNames?.toggle)}
                aria-label={activeExpanded.includes(node.key) ? text["收起行"] : text["展开行"]}
                aria-expanded={expandedForRender.has(node.key)}
                disabled={node.disabled || loadingKeys.includes(node.key)}
                onClick={() => void toggle(node)}
              >
                {loadingKeys.includes(node.key) ? (
                  <span className="biu-ui-tree__loading" aria-hidden="true" />
                ) : expandedForRender.has(node.key) ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </button>
            ) : (
              <span className={cx("biu-ui-tree__toggle", classNames?.toggle)} aria-hidden="true" />
            )}
            {checkable
              ? (() => {
                  const descendants = collectDescendantKeys(node, childrenFor);
                  const checked = activeChecked.includes(node.key);
                  const checkedDescendants = descendants.filter((key) => activeChecked.includes(key));
                  const halfChecked = !checked && checkedDescendants.length > 0;
                  return (
                    <input
                      type="checkbox"
                      className={classNames?.checkbox}
                      checked={checked || halfChecked}
                      ref={(element) => {
                        if (element) element.indeterminate = halfChecked;
                      }}
                      disabled={node.disabled}
                      aria-label={typeof node.title === "string" ? node.title : node.key}
                      onChange={(event) => {
                        if (node.disabled) return;
                        const keys = new Set(activeChecked);
                        const affected = checkStrictly ? [node.key] : [node.key, ...descendants];
                        affected.forEach((key) => (event.currentTarget.checked ? keys.add(key) : keys.delete(key)));
                        const next = [...keys];
                        if (checkedKeys === undefined) setInternalChecked(next);
                        onCheck?.(next, {
                          node,
                          checked: event.currentTarget.checked,
                          halfCheckedKeys: checkStrictly ? [] : checkedDescendants,
                        });
                      }}
                    />
                  );
                })()
              : null}
            <span className={cx("biu-ui-tree__icon", classNames?.icon)} aria-hidden="true">
              {node.icon ??
                (childrenFor(node).length || (loadData && !node.isLeaf) ? (
                  <Folder size={16} />
                ) : (
                  <FileText size={16} />
                ))}
            </span>
            <button
              type="button"
              disabled={node.disabled}
              className={cx("biu-ui-tree__title", activeSelected.includes(node.key) && "is-active", classNames?.title)}
              onClick={() => {
                if (node.disabled) return;
                const next = multiple
                  ? activeSelected.includes(node.key)
                    ? activeSelected.filter((key) => key !== node.key)
                    : [...activeSelected, node.key]
                  : [node.key];
                if (selectedKeys === undefined) setInternalSelected(next);
                onSelect?.(next);
              }}
            >
              <Ellipsis tooltipContent={node.title} className="biu-ui-tree__title-label">
                {titleRender?.(node) ?? node.title}
              </Ellipsis>
            </button>
          </div>
          {childrenFor(node).length && expandedForRender.has(node.key) ? render(childrenFor(node), level + 1) : null}
        </li>
      ))}
    </ul>
  );
  return (
    <div className={cx("biu-ui-tree", className, classNames?.root)} data-biu-component="tree">
      {showSearch ? (
        <TextField
          className={cx("biu-ui-tree__search", classNames?.search)}
          value={activeSearch}
          allowClear
          onChange={(event) => {
            if (searchValue === undefined) setInternalSearch(event.target.value);
            onSearch?.(event.target.value);
          }}
          onClear={() => {
            if (searchValue === undefined) setInternalSearch("");
            onSearch?.("");
          }}
          placeholder={text["搜索"]}
          aria-label={text["搜索"]}
        />
      ) : null}
      {render(filteredData)}
    </div>
  );
}

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
  render?: (item: TransferItem) => React.ReactNode;
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
  const leftItems = source.filter((item) => !targetKeys.has(item.value));
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
    const selectable = shown.filter((item) => !item.disabled);
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
          {shown.map((item) => (
            <label
              key={item.value}
              className={cx("biu-ui-transfer__item", item.disabled && "is-disabled", classNames?.item)}
            >
              <input
                type="checkbox"
                className={classNames?.checkbox}
                checked={activeSelected.includes(item.value)}
                disabled={disabled || item.disabled}
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
                  {render?.(item) ?? item.label}
                </Ellipsis>
              </span>
            </label>
          ))}
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
          {operations?.[0] ?? <ChevronRight size={15} aria-hidden="true" />}
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
            {operations?.[1] ?? <ChevronLeft size={15} aria-hidden="true" />}
          </Button>
        ) : null}
      </div>
      {renderList(activeTarget, "right")}
    </div>
  );
}
