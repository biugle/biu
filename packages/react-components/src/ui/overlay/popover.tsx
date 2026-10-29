import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cx } from "../../shared/utils.js";
import {
  useComponentsLocale,
  type BiuComponentsLocale,
  type BiuComponentsLocaleTextOverrides,
} from "../../provider.js";
import { type TooltipSide, type TooltipAlign } from "./tooltip.js";
import { BiuPortal } from "./portal.js";

export interface PopoverClassNames {
  root?: string;
  trigger?: string;
  content?: string;
  arrow?: string;
}

export interface PopoverProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  classNames?: PopoverClassNames;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  side?: TooltipSide;
  align?: TooltipAlign;
  sideOffset?: number;
  collisionPadding?: number;
  avoidCollisions?: boolean;
  sticky?: "partial" | "always";
  disabled?: boolean;
  /** Render the collision-aware visual arrow. Defaults to true. */
  showArrow?: boolean;
  /** Fixed or responsive content width. */
  width?: number | string;
  minWidth?: number | string;
  maxWidth?: number | string;
  contentStyle?: React.CSSProperties;
  onOpenAutoFocus?: (event: Event) => void;
  onCloseAutoFocus?: (event: Event) => void;
}

export function Popover({
  content,
  children,
  className,
  classNames,
  open,
  defaultOpen,
  onOpenChange,
  modal = false,
  side = "bottom",
  align = "start",
  sideOffset = 8,
  collisionPadding = 8,
  avoidCollisions = true,
  sticky = "partial",
  disabled = false,
  showArrow = true,
  width,
  minWidth,
  maxWidth,
  contentStyle,
  onOpenAutoFocus,
  onCloseAutoFocus,
}: PopoverProps) {
  const [internal, setInternal] = React.useState(defaultOpen ?? false);
  const active = open ?? internal;
  const set = (next: boolean) => {
    if (disabled) return;
    if (open === undefined) setInternal(next);
    onOpenChange?.(next);
  };
  return (
    <PopoverPrimitive.Root open={active} onOpenChange={set} modal={modal}>
      <div
        className={cx("biu-ui-popover", classNames?.root, className)}
        data-biu-component="popover"
        data-state={active ? "open" : "closed"}
        data-disabled={disabled || undefined}
      >
        <PopoverPrimitive.Trigger asChild>
          <span
            className={cx("biu-ui-popover__trigger", classNames?.trigger)}
            aria-expanded={active}
            aria-disabled={disabled || undefined}
            data-biu-slot="popover-trigger"
          >
            {children}
          </span>
        </PopoverPrimitive.Trigger>
        {active ? (
          <BiuPortal>
            <PopoverPrimitive.Content
              side={side}
              align={align}
              sideOffset={sideOffset}
              collisionPadding={collisionPadding}
              avoidCollisions={avoidCollisions}
              sticky={sticky}
              onOpenAutoFocus={onOpenAutoFocus}
              onCloseAutoFocus={onCloseAutoFocus}
              className={cx("biu-ui-popover__content", classNames?.content)}
              style={{
                width: width === undefined ? undefined : typeof width === "number" ? `${width}px` : width,
                minWidth:
                  minWidth === undefined ? undefined : typeof minWidth === "number" ? `${minWidth}px` : minWidth,
                maxWidth:
                  maxWidth === undefined ? undefined : typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth,
                ...contentStyle,
              }}
              data-biu-slot="popover-content"
              data-biu-overlay-interactive="true"
            >
              {content}
              {showArrow ? (
                <PopoverPrimitive.Arrow
                  width={12}
                  height={6}
                  className={cx("biu-ui-popover__arrow", classNames?.arrow)}
                  data-biu-slot="popover-arrow"
                />
              ) : null}
            </PopoverPrimitive.Content>
          </BiuPortal>
        ) : null}
      </div>
    </PopoverPrimitive.Root>
  );
}

export interface PopconfirmProps {
  title: React.ReactNode;
  onConfirm?: () => void | boolean | Promise<void | boolean>;
  onCancel?: () => void;
  children: React.ReactNode;
  locale?: BiuComponentsLocale;
  localeText?: BiuComponentsLocaleTextOverrides;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  confirmProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  cancelProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  disabled?: boolean;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  showCancel?: boolean;
  showConfirm?: boolean;
  type?: "default" | "danger" | "success" | "warning" | "error" | "info";
  width?: number | string;
  minWidth?: number | string;
  maxWidth?: number | string;
  className?: string;
  classNames?: { root?: string; content?: string; actions?: string };
}

export function Popconfirm({
  title,
  onConfirm,
  onCancel,
  children,
  locale,
  localeText,
  open,
  defaultOpen,
  onOpenChange,
  confirmProps,
  cancelProps,
  disabled = false,
  description,
  icon,
  showCancel = true,
  showConfirm = true,
  type = "default",
  width,
  minWidth,
  maxWidth,
  className,
  classNames,
}: PopconfirmProps) {
  const text = useComponentsLocale(locale, localeText);
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen ?? false);
  const [loading, setLoading] = React.useState(false);
  const active = open ?? internalOpen;
  const setActive = (next: boolean) => {
    if (open === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };
  const confirm = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if ((await onConfirm?.()) !== false) setActive(false);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Popover
      disabled={disabled}
      open={active}
      onOpenChange={setActive}
      side="top"
      align="center"
      collisionPadding={12}
      avoidCollisions
      sticky="always"
      content={
        <div
          className={cx("biu-ui-popconfirm", `biu-ui-popconfirm--${type}`, classNames?.root, className)}
          data-biu-component="popconfirm"
        >
          <div className="biu-ui-popconfirm__heading">
            {icon ? (
              <span className="biu-ui-popconfirm__icon" aria-hidden="true">
                {icon}
              </span>
            ) : null}
            <div>
              <p className="biu-ui-popconfirm__title">{title}</p>
              {description ? <p className="biu-ui-popconfirm__description">{description}</p> : null}
            </div>
          </div>
          <div className={cx("biu-ui-popconfirm__actions", classNames?.actions)}>
            {showCancel ? (
              <button
                {...cancelProps}
                type="button"
                className={cx("biu-ui-popconfirm__cancel", cancelProps?.className)}
                disabled={loading || cancelProps?.disabled}
                onClick={(event) => {
                  cancelProps?.onClick?.(event);
                  if (!event.defaultPrevented) {
                    onCancel?.();
                    setActive(false);
                  }
                }}
              >
                {cancelProps?.children ?? text["取消"]}
              </button>
            ) : null}
            {showConfirm ? (
              <button
                {...confirmProps}
                type="button"
                className={cx("biu-ui-popconfirm__confirm", confirmProps?.className)}
                disabled={loading || confirmProps?.disabled}
                onClick={(event) => {
                  confirmProps?.onClick?.(event);
                  if (!event.defaultPrevented) void confirm();
                }}
              >
                {confirmProps?.children ?? (loading ? text["加载中…"] : text["确定"])}
              </button>
            ) : null}
          </div>
        </div>
      }
      width={width}
      minWidth={minWidth}
      maxWidth={maxWidth}
      classNames={{
        content: cx("biu-ui-popconfirm__popover-content", classNames?.content),
      }}
    >
      {children}
    </Popover>
  );
}
