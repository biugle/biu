import * as React from "react";
import { MoreHorizontal } from "@biugle/icons";
import { Button, type ButtonProps } from "../button/index.js";
import { Tooltip } from "../overlay/index.js";
import { cx } from "../../shared/utils.js";
import {
  useComponentsLocale,
  type BiuComponentsLocale,
  type BiuComponentsLocaleTextOverrides,
} from "../../provider.js";
import { DropdownMenu } from "./dropdown-menu.js";

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
  /** Maximum visible slots below 800px; defaults to 3 outside a Table action column. */
  compactMaxCount?: number;
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
  compactMaxCount,
  iconOnly = false,
  className,
  overflowLabel,
  overflowIcon = <MoreHorizontal size={16} />,
  locale,
  localeText,
}: ButtonListProps) {
  const text = useComponentsLocale(locale, localeText);
  const listRef = React.useRef<HTMLDivElement>(null);
  const [tableActionMaxCount, setTableActionMaxCount] = React.useState<number>();
  const compactQuery = "(max-width: 799px)";
  const microQuery = "(max-width: 559px)";
  const [compactViewport, setCompactViewport] = React.useState(
    () => typeof window !== "undefined" && (window.matchMedia?.(compactQuery)?.matches ?? false),
  );
  const [microViewport, setMicroViewport] = React.useState(
    () => typeof window !== "undefined" && (window.matchMedia?.(microQuery)?.matches ?? false),
  );
  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const query = window.matchMedia?.(compactQuery);
    const micro = window.matchMedia?.(microQuery);
    if (!query || !micro) return undefined;
    const update = () => {
      setCompactViewport(query.matches);
      setMicroViewport(micro.matches);
    };
    update();
    query.addEventListener?.("change", update);
    micro.addEventListener?.("change", update);
    return () => {
      query.removeEventListener?.("change", update);
      micro.removeEventListener?.("change", update);
    };
  }, []);
  React.useLayoutEffect(() => {
    const list = listRef.current;
    const configuredLimit = Number(
      list?.closest<HTMLElement>("[data-biu-table-action-limit]")?.dataset.biuTableActionLimit,
    );
    const next =
      iconOnly && Number.isFinite(configuredLimit) && configuredLimit > 0 ? Math.floor(configuredLimit) : undefined;
    setTableActionMaxCount((previous) => (previous === next ? previous : next));
  });
  const resolvedOverflowLabel = overflowLabel ?? text["更多操作"];
  const configuredLimit = compactViewport && compactMaxCount !== undefined ? compactMaxCount : maxCount;
  const defaultResponsiveLimit = microViewport ? 1 : compactViewport ? 3 : undefined;
  const visibleLimit = configuredLimit ?? tableActionMaxCount ?? defaultResponsiveLimit;
  // maxCount is the total number of visible slots. The last slot is reserved
  // for the overflow menu once the action list reaches that limit.
  const overflowed = visibleLimit !== undefined && visibleLimit > 0 && items.length >= visibleLimit;
  const visibleCount = overflowed ? Math.max(0, visibleLimit - 1) : items.length;
  const visibleItems = items.slice(0, visibleCount);
  const overflowItems = items.slice(visibleCount);
  const renderAction = (item: ButtonListItem) => {
    const renderIconOnly = iconOnly && Boolean(item.icon);
    const actionSize = item.buttonProps?.size ?? "small";
    const button = (
      <Button
        {...item.buttonProps}
        type={item.buttonProps?.type ?? "secondary"}
        variant={item.buttonProps?.variant ?? "contained"}
        size={actionSize}
        iconSize={item.buttonProps?.iconSize ?? (renderIconOnly && actionSize === "small" ? 15 : undefined)}
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
    <div ref={listRef} className={cx("biu-ui-button-list", className)} data-biu-component="button-list">
      {visibleItems.map(renderAction)}
      {overflowed ? (
        <DropdownMenu
          trigger={
            <Button
              type="secondary"
              variant="contained"
              size="small"
              iconSize={15}
              icon={overflowIcon}
              onlyIcon
              tooltip={resolvedOverflowLabel}
              aria-label={typeof resolvedOverflowLabel === "string" ? resolvedOverflowLabel : text["更多操作"]}
              className="biu-ui-button-list__overflow"
            >
              {resolvedOverflowLabel}
            </Button>
          }
          classNames={{ content: "biu-ui-button-list__menu" }}
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
