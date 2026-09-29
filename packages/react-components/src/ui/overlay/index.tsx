import * as React from "react";
import { createPortal } from "react-dom";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Copy } from "@biugle/icons";
import { cx } from "../../shared/utils.js";
import {
  useComponentsLocale,
  type BiuComponentsLocale,
  type BiuComponentsLocaleTextOverrides,
} from "../../provider.js";

export type TooltipSide = "top" | "right" | "bottom" | "left";
export type TooltipAlign = "start" | "center" | "end";
export type TooltipPlacement =
  | "TOP"
  | "BOTTOM"
  | "LEFT"
  | "RIGHT"
  | "TOP_START"
  | "TOP_END"
  | "BOTTOM_START"
  | "BOTTOM_END"
  | "LEFT_START"
  | "LEFT_END"
  | "RIGHT_START"
  | "RIGHT_END"
  | "TOP_RIGHT"
  | "TOP_LEFT"
  | "BOTTOM_RIGHT"
  | "BOTTOM_LEFT"
  | "TOP-RIGHT"
  | "TOP-LEFT"
  | "BOTTOM-RIGHT"
  | "BOTTOM-LEFT"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | (string & {});

export interface TooltipOptions {
  onlyOverflow?: boolean;
  placement?: TooltipPlacement;
  delayDuration?: number;
  sideOffset?: number;
  alignOffset?: number;
  collisionPadding?: number | { top?: number; right?: number; bottom?: number; left?: number };
  arrowPadding?: number;
  avoidCollisions?: boolean;
  maxWidth?: number | string;
  disableHoverableContent?: boolean;
  color?: string;
}

export interface TooltipClassNames {
  root?: string;
  trigger?: string;
  content?: string;
  arrow?: string;
}

export interface TooltipProps extends TooltipOptions {
  content: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  classNames?: TooltipClassNames;
  disabled?: boolean;
}

const TooltipConfigContext = React.createContext<TooltipOptions>({});

function BiuPortal({ children }: { children: React.ReactNode }) {
  if (typeof document === "undefined") return <>{children}</>;
  return createPortal(children, document.body);
}

export function TooltipProvider({
  children,
  delayDuration = 0,
  disableHoverableContent,
  ...options
}: TooltipOptions & { children: React.ReactNode }) {
  return (
    <TooltipConfigContext.Provider value={{ delayDuration, disableHoverableContent, ...options }}>
      <TooltipPrimitive.Provider delayDuration={delayDuration} disableHoverableContent={disableHoverableContent}>
        {children}
      </TooltipPrimitive.Provider>
    </TooltipConfigContext.Provider>
  );
}

export const TooltipRoot = TooltipProvider;

function normalizePlacement(value: TooltipPlacement | undefined): {
  side: TooltipSide;
  align: TooltipAlign;
  value: string;
} {
  const normalized = String(value ?? "TOP")
    .trim()
    .replace(/-/g, "_")
    .toUpperCase();
  const placement = normalized === "TOP_RIGHT" ? "TOP_END" : normalized === "TOP_LEFT" ? "TOP_START" : normalized;
  const bottomPlacement =
    placement === "BOTTOM_RIGHT" ? "BOTTOM_END" : placement === "BOTTOM_LEFT" ? "BOTTOM_START" : placement;
  const match = bottomPlacement.match(/^(TOP|RIGHT|BOTTOM|LEFT)(?:_(START|CENTER|END))?$/);
  if (!match) return { side: "top", align: "center", value: "TOP" };
  const side = match[1].toLowerCase() as TooltipSide;
  const align = (match[2] ?? "CENTER").toLowerCase() as TooltipAlign;
  return { side, align, value: normalized };
}

function isOverflowing(element: HTMLElement) {
  return element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1;
}

function isTooltipOverflowing(host: HTMLElement) {
  return [host, ...Array.from(host.querySelectorAll<HTMLElement>("*"))].some(isOverflowing);
}

function hasOverflowingAncestor(host: HTMLElement) {
  if (typeof window === "undefined") return false;
  let current: HTMLElement | null = host.parentElement;
  while (current && current !== document.body) {
    const style = window.getComputedStyle(current);
    const clips = [style.overflow, style.overflowX, style.overflowY].some((value) =>
      ["hidden", "clip", "auto", "scroll"].includes(value),
    );
    if (clips && isOverflowing(current)) return true;
    current = current.parentElement;
  }
  return false;
}

function useOverflowMeasurement(
  targetRef: React.MutableRefObject<HTMLElement | null>,
  enabled: boolean,
  dependencies: React.DependencyList,
) {
  const [overflowed, setOverflowed] = React.useState(!enabled);

  const update = React.useCallback(() => {
    if (!enabled) {
      setOverflowed(true);
      return;
    }
    const target = targetRef.current;
    if (!target || typeof window === "undefined") return;
    setOverflowed(isTooltipOverflowing(target) || hasOverflowingAncestor(target));
  }, [enabled, targetRef]);

  React.useLayoutEffect(() => {
    update();
    if (!enabled || typeof window === "undefined") return undefined;
    window.addEventListener("resize", update);
    const resizeObserver =
      typeof ResizeObserver !== "undefined" && targetRef.current ? new ResizeObserver(update) : undefined;
    if (resizeObserver && targetRef.current) {
      resizeObserver.observe(targetRef.current);
      if (targetRef.current.parentElement) resizeObserver.observe(targetRef.current.parentElement);
    }
    const mutationObserver =
      typeof MutationObserver !== "undefined" && targetRef.current ? new MutationObserver(update) : undefined;
    mutationObserver?.observe(targetRef.current as Node, { childList: true, subtree: true, characterData: true });
    const fonts = document.fonts;
    fonts?.addEventListener?.("loadingdone", update);
    return () => {
      window.removeEventListener("resize", update);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      fonts?.removeEventListener?.("loadingdone", update);
    };
  }, [enabled, targetRef, update, ...dependencies]);

  return [overflowed, update] as const;
}

export function Tooltip({
  content,
  children,
  onlyOverflow: onlyOverflowProp,
  placement: placementProp,
  delayDuration: delayDurationProp,
  sideOffset: sideOffsetProp,
  alignOffset: alignOffsetProp,
  collisionPadding: collisionPaddingProp,
  arrowPadding: arrowPaddingProp,
  avoidCollisions: avoidCollisionsProp,
  maxWidth: maxWidthProp,
  disableHoverableContent: disableHoverableContentProp,
  color,
  className,
  style,
  classNames,
  disabled = false,
}: TooltipProps) {
  const defaults = React.useContext(TooltipConfigContext);
  const onlyOverflow = onlyOverflowProp ?? defaults.onlyOverflow ?? false;
  const placement = normalizePlacement(placementProp ?? defaults.placement);
  const delayDuration = delayDurationProp ?? defaults.delayDuration ?? 0;
  const sideOffset = sideOffsetProp ?? defaults.sideOffset ?? 8;
  const alignOffset = alignOffsetProp ?? defaults.alignOffset ?? 0;
  const collisionPadding = collisionPaddingProp ?? defaults.collisionPadding ?? 8;
  const arrowPadding = arrowPaddingProp ?? defaults.arrowPadding ?? 6;
  const avoidCollisions = avoidCollisionsProp ?? defaults.avoidCollisions ?? true;
  const maxWidth = maxWidthProp ?? defaults.maxWidth ?? "min(320px, calc(100vw - 24px))";
  const disableHoverableContent = disableHoverableContentProp ?? defaults.disableHoverableContent ?? false;
  const tooltipColor = color ?? defaults.color;
  const targetRef = React.useRef<HTMLElement | null>(null);
  const [overflowed] = useOverflowMeasurement(targetRef, onlyOverflow, [children, content]);
  const blocked = disabled || (onlyOverflow && !overflowed);
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    if (blocked) setOpen(false);
  }, [blocked]);
  const rootClassName = cx(
    "biu-ui-tooltip",
    onlyOverflow && "biu-ui-tooltip--overflow",
    blocked && "biu-ui-tooltip--hidden",
    classNames?.root,
    className,
  );
  const tooltipId = "biu-tooltip-" + React.useId().replace(/:/g, "");
  const triggerClassName = cx("biu-ui-tooltip__trigger", classNames?.trigger);

  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration} disableHoverableContent={disableHoverableContent}>
      <TooltipPrimitive.Root open={blocked ? false : open} onOpenChange={setOpen}>
        <span
          ref={targetRef}
          className={rootClassName}
          style={style}
          data-biu-component="tooltip"
          data-biu-tooltip-placement={placement.value}
          data-biu-tooltip-side={placement.side}
          data-biu-tooltip-align={placement.align}
          aria-describedby={blocked ? undefined : tooltipId}
        >
          <TooltipPrimitive.Trigger asChild>
            <span className={triggerClassName} data-biu-slot="tooltip-trigger">
              {children}
            </span>
          </TooltipPrimitive.Trigger>
        </span>
        {!blocked && open ? (
          <BiuPortal>
            <TooltipPrimitive.Content
              ref={(node) => {
                if (node) node.id = tooltipId;
              }}
              id={tooltipId}
              side={placement.side}
              align={placement.align}
              sideOffset={sideOffset}
              alignOffset={alignOffset}
              collisionPadding={collisionPadding}
              arrowPadding={arrowPadding}
              avoidCollisions={avoidCollisions}
              className={cx("biu-ui-tooltip__content", classNames?.content)}
              style={{
                maxWidth,
                background: tooltipColor ?? "var(--biu-tooltip-color, #172033)",
                ...({
                  "--biu-tooltip-max-width": maxWidth,
                  "--biu-tooltip-color": tooltipColor,
                } as React.CSSProperties),
              }}
              data-biu-component="tooltip"
              data-biu-slot="tooltip-content"
              data-biu-tooltip-placement={placement.value}
            >
              {content}
              <TooltipPrimitive.Arrow
                width={10}
                height={5}
                className={cx("biu-ui-tooltip__arrow", classNames?.arrow)}
                data-biu-slot="tooltip-arrow"
              />
            </TooltipPrimitive.Content>
          </BiuPortal>
        ) : null}
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

export const TooltipTrigger = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  function TooltipTrigger({ className, ...props }, ref) {
    return (
      <span {...props} ref={ref} className={cx("biu-ui-tooltip__trigger", className)} data-biu-slot="tooltip-trigger" />
    );
  },
);

export const TooltipContent = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  function TooltipContent({ className, ...props }, ref) {
    return (
      <span
        {...props}
        ref={ref}
        className={cx("biu-ui-tooltip__content", className)}
        data-biu-slot="tooltip-content"
        role="tooltip"
      />
    );
  },
);

interface EllipsisContextValue {
  content: React.ReactNode;
  active: boolean;
}
const EllipsisContext = React.createContext<EllipsisContextValue | null>(null);

export interface EllipsisProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "content"> {
  content?: React.ReactNode;
  tooltipContent?: React.ReactNode;
  children?: React.ReactNode;
  lines?: number;
  rows?: number;
  maxWidth?: number | string;
  /** Show the full content on hover even when the rendered text fits. */
  alwaysTooltip?: boolean;
  as?: React.ElementType;
}

function ellipsisLineCount(lines: number | undefined, rows: number | undefined) {
  const value = lines ?? rows ?? 1;
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1;
}

export const Ellipsis = React.forwardRef<HTMLSpanElement, EllipsisProps>(function Ellipsis(
  {
    content,
    tooltipContent,
    children,
    lines,
    rows,
    maxWidth,
    alwaysTooltip = false,
    as: Component = "span",
    className,
    style,
    ...props
  },
  ref,
) {
  const value = content ?? children ?? "";
  const fullValue = tooltipContent ?? value;
  const lineCount = ellipsisLineCount(lines, rows);
  const targetRef = React.useRef<HTMLElement | null>(null);
  const [active, setActive] = React.useState(false);

  React.useLayoutEffect(() => {
    const update = () => {
      const target = targetRef.current;
      setActive(Boolean(target && isTooltipOverflowing(target)));
    };
    update();
    if (typeof window === "undefined") return undefined;
    window.addEventListener("resize", update);
    const resizeObserver =
      typeof ResizeObserver !== "undefined" && targetRef.current ? new ResizeObserver(update) : undefined;
    if (resizeObserver && targetRef.current) {
      resizeObserver.observe(targetRef.current);
      if (targetRef.current.parentElement) resizeObserver.observe(targetRef.current.parentElement);
    }
    const mutationObserver =
      typeof MutationObserver !== "undefined" && targetRef.current ? new MutationObserver(update) : undefined;
    mutationObserver?.observe(targetRef.current as Node, { childList: true, subtree: true, characterData: true });
    document.fonts?.addEventListener?.("loadingdone", update);
    return () => {
      window.removeEventListener("resize", update);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      document.fonts?.removeEventListener?.("loadingdone", update);
    };
  }, [lineCount, value]);
  const tooltipActive = alwaysTooltip || active;
  const resolvedMaxWidth =
    maxWidth === undefined ? undefined : typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth;

  return (
    <EllipsisContext.Provider value={{ content: fullValue, active: tooltipActive }}>
      <Tooltip
        content={fullValue}
        onlyOverflow={false}
        disabled={!tooltipActive}
        placement="TOP"
        className="biu-ui-ellipsis__tooltip"
        style={resolvedMaxWidth ? { maxWidth: resolvedMaxWidth } : undefined}
      >
        <span
          {...props}
          ref={(node) => {
            targetRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          className={cx(
            "biu-ui-ellipsis",
            lineCount === 1 ? "biu-ui-ellipsis--single" : "biu-ui-ellipsis--multi",
            className,
          )}
          style={{
            WebkitLineClamp: lineCount,
            maxWidth:
              maxWidth === undefined ? style?.maxWidth : typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth,
            ...style,
          }}
          data-biu-component="ellipsis"
          data-biu-ellipsis-active={tooltipActive || undefined}
          data-biu-ellipsis-always={alwaysTooltip || undefined}
        >
          <Component>{value}</Component>
        </span>
      </Tooltip>
    </EllipsisContext.Provider>
  );
});

export const EllipsisContent = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  function EllipsisContent({ className, children, ...props }, ref) {
    const context = React.useContext(EllipsisContext);
    return (
      <span {...props} ref={ref} className={cx("biu-ui-ellipsis__content", className)}>
        {children ?? context?.content}
      </span>
    );
  },
);

export const EllipsisTooltip = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  function EllipsisTooltip({ className, ...props }, ref) {
    const context = React.useContext(EllipsisContext);
    if (!context?.active) return null;
    return (
      <TooltipContent {...props} ref={ref} className={className}>
        {context.content}
      </TooltipContent>
    );
  },
);

export interface CopyTextClassNames {
  root?: string;
  text?: string;
  button?: string;
}

export interface CopyTextProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "content" | "onCopy"> {
  /** The exact string copied to the clipboard and used as fallback content. */
  text: string;
  /** Optional rendered value; the clipboard value always remains `text`. */
  content?: React.ReactNode;
  lines?: number;
  maxWidth?: number | string;
  alwaysTooltip?: boolean;
  /** Keep the copy action hidden until the row is hovered or focused. */
  copyOnHover?: boolean;
  copyLabel?: React.ReactNode;
  copiedLabel?: React.ReactNode;
  locale?: BiuComponentsLocale;
  localeText?: BiuComponentsLocaleTextOverrides;
  onCopy?: (text: string) => void | Promise<void>;
  classNames?: CopyTextClassNames;
}

async function writeClipboardText(value: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Fall through to the legacy DOM API for older printing/webview hosts.
    }
  }
  if (typeof document === "undefined") return false;
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand?.("copy") ?? false;
  textarea.remove();
  return copied;
}

export function CopyText({
  text,
  content,
  lines = 1,
  maxWidth,
  alwaysTooltip = false,
  copyOnHover = false,
  copyLabel,
  copiedLabel,
  locale,
  localeText,
  onCopy,
  className,
  classNames,
  ...props
}: CopyTextProps) {
  const textLocale = useComponentsLocale(locale, localeText);
  const resolvedCopyLabel = copyLabel ?? textLocale["复制文本"];
  const resolvedCopiedLabel = copiedLabel ?? textLocale["已复制"];
  const [copied, setCopied] = React.useState(false);
  const resetTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  React.useEffect(() => () => clearTimeout(resetTimer.current), []);
  const handleCopy = async () => {
    const success = await writeClipboardText(text);
    if (!success) return;
    setCopied(true);
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopied(false), 1600);
    await onCopy?.(text);
  };
  const activeLabel = copied ? resolvedCopiedLabel : resolvedCopyLabel;
  const accessibleLabel =
    typeof activeLabel === "string" ? activeLabel : copied ? textLocale["已复制"] : textLocale["复制文本"];
  return (
    <div
      {...props}
      className={cx("biu-ui-copy-text", copyOnHover && "biu-ui-copy-text--hover", classNames?.root, className)}
      data-biu-component="copy-text"
      data-biu-copy-state={copied ? "copied" : "idle"}
    >
      <Ellipsis
        content={content ?? text}
        tooltipContent={text}
        lines={lines}
        maxWidth={maxWidth}
        alwaysTooltip={alwaysTooltip}
        className={cx("biu-ui-copy-text__text", classNames?.text)}
      />
      <Tooltip content={activeLabel} onlyOverflow={false}>
        <button
          type="button"
          className={cx("biu-ui-copy-text__button", classNames?.button)}
          aria-label={accessibleLabel}
          onClick={handleCopy}
        >
          <Copy size={14} aria-hidden="true" />
        </button>
      </Tooltip>
    </div>
  );
}

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
