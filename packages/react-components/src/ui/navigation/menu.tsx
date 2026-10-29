import * as React from "react";
import { ChevronDown, ChevronUp, Folder } from "@biugle/icons";
import { Ellipsis, Tooltip } from "../overlay/index.js";
import { cx, safeAnchorHref } from "../../shared/utils.js";

const MAX_MENU_DEPTH = 5;

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
  /** Set the text direction explicitly; omitted values use LTR. */
  dir?: "ltr" | "rtl";
  /** Position submenu arrows at the logical start (`left`) or end (`right`) for the selected `dir`. */
  arrowPosition?: "left" | "right";
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
  dir = "ltr",
  arrowPosition = "right",
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
        {hasChildren && !collapsed && arrowPosition === "left" ? (
          <span className={cx("biu-ui-menu__arrow", "biu-ui-menu__arrow--left", classNames?.arrow)} aria-hidden="true">
            {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </span>
        ) : null}
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
        {hasChildren && !collapsed && arrowPosition === "right" ? (
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
    const forwardKey = dir === "rtl" ? "ArrowLeft" : "ArrowRight";
    const backwardKey = dir === "rtl" ? "ArrowRight" : "ArrowLeft";
    if (event.key === "ArrowDown" || event.key === forwardKey) {
      event.preventDefault();
      items[(index + 1 + items.length) % items.length]?.focus();
    } else if (event.key === "ArrowUp" || event.key === backwardKey) {
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
      dir={dir}
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
              {safeAnchorHref(item.href) ? (
                <a href={safeAnchorHref(item.href)} onClick={item.onClick}>
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
