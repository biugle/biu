import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cx } from "../../shared/utils.js";
import { BiuPortal } from "./portal.js";
import { useTouchLongPress } from "./touch-tooltip.js";
import { isTooltipOverflowing, useOverflowMeasurement } from "./use-overflow-measurement.js";

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
  /** Keep the trigger tree mounted when disabled so a later enable preserves focus and DOM identity. */
  keepMounted?: boolean;
  /** @internal Open the interactive tree on the first activation after a lazy measurement. */
  openOnMount?: boolean;
  /** @internal EllipsisLazy owns activation until it has measured overflow. */
  touchActivation?: boolean;
}

const TooltipConfigContext = React.createContext<TooltipOptions>({});

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

export function TooltipRoot(props: TooltipOptions & { children: React.ReactNode }) {
  return <TooltipProvider {...props} />;
}

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

interface TooltipInteractiveProps {
  content: React.ReactNode;
  children?: React.ReactNode;
  onlyOverflow: boolean;
  placement: ReturnType<typeof normalizePlacement>;
  delayDuration: number;
  sideOffset: number;
  alignOffset: number;
  collisionPadding: number | { top?: number; right?: number; bottom?: number; left?: number };
  arrowPadding: number;
  avoidCollisions: boolean;
  maxWidth: number | string;
  disableHoverableContent: boolean;
  tooltipColor?: string;
  className?: string;
  style?: React.CSSProperties;
  classNames?: TooltipClassNames;
  disabled: boolean;
  openOnMount: boolean;
  touchActivation: boolean;
}

function TooltipInteractive({
  content,
  children,
  onlyOverflow,
  placement,
  delayDuration,
  sideOffset,
  alignOffset,
  collisionPadding,
  arrowPadding,
  avoidCollisions,
  maxWidth,
  disableHoverableContent,
  tooltipColor,
  className,
  style,
  classNames,
  disabled,
  openOnMount,
  touchActivation,
}: TooltipInteractiveProps) {
  const targetRef = React.useRef<HTMLElement | null>(null);
  const [overflowed] = useOverflowMeasurement(targetRef, onlyOverflow, [children, content]);
  const blocked = disabled || (onlyOverflow && !overflowed);
  const [open, setOpen] = React.useState(openOnMount);
  const touchOpenRef = React.useRef(false);
  const touchHandlers = useTouchLongPress(
    () => {
      if (blocked) return false;
      touchOpenRef.current = true;
      setOpen(true);
      return true;
    },
    () => {
      touchOpenRef.current = false;
      setOpen(false);
    },
  );
  const handleOpenChange = (next: boolean) => {
    if (!next && touchOpenRef.current) return;
    setOpen(next);
  };
  React.useEffect(() => {
    if (blocked) {
      touchOpenRef.current = false;
      setOpen(false);
    }
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
      <TooltipPrimitive.Root open={blocked ? false : open} onOpenChange={handleOpenChange}>
        <span
          ref={targetRef}
          className={rootClassName}
          style={style}
          onPointerDown={touchActivation ? touchHandlers.onPointerDown : undefined}
          onPointerMove={touchActivation ? touchHandlers.onPointerMove : undefined}
          onPointerUp={touchActivation ? touchHandlers.onPointerUp : undefined}
          onPointerCancel={touchActivation ? touchHandlers.onPointerCancel : undefined}
          onClickCapture={touchActivation ? touchHandlers.onClickCapture : undefined}
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
  keepMounted = false,
  openOnMount = false,
  touchActivation = true,
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
  const rootClassName = cx(
    "biu-ui-tooltip",
    onlyOverflow && "biu-ui-tooltip--overflow",
    disabled && "biu-ui-tooltip--hidden",
    classNames?.root,
    className,
  );
  const triggerClassName = cx("biu-ui-tooltip__trigger", classNames?.trigger);

  // Ellipsis renders thousands of disabled Tooltip instances in the API
  // tables. Keep the same DOM geometry and classes for disabled tooltips, but
  // avoid mounting a Radix provider/root/trigger tree until the tooltip can
  // actually be opened. Overflow and explicitly enabled tooltips still use
  // the full implementation below.
  if (disabled && !keepMounted) {
    return (
      <span
        className={rootClassName}
        style={style}
        data-biu-component="tooltip"
        data-biu-tooltip-placement={placement.value}
        data-biu-tooltip-side={placement.side}
        data-biu-tooltip-align={placement.align}
      >
        <span className={triggerClassName} data-biu-slot="tooltip-trigger">
          {children}
        </span>
      </span>
    );
  }

  return (
    <TooltipInteractive
      content={content}
      children={children}
      onlyOverflow={onlyOverflow}
      placement={placement}
      delayDuration={delayDuration}
      sideOffset={sideOffset}
      alignOffset={alignOffset}
      collisionPadding={collisionPadding}
      arrowPadding={arrowPadding}
      avoidCollisions={avoidCollisions}
      maxWidth={maxWidth}
      disableHoverableContent={disableHoverableContent}
      tooltipColor={tooltipColor}
      className={className}
      style={style}
      classNames={classNames}
      disabled={disabled}
      openOnMount={openOnMount}
      touchActivation={touchActivation}
    />
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

function hasInteractiveEllipsisAncestor(target: HTMLElement) {
  return Boolean(
    target.closest(
      'button, a[href], input, select, textarea, summary, label, [role="button"], [role="link"], [role="combobox"], [role="checkbox"], [role="radio"], [role="switch"], [role="tab"], [role="menuitem"], [role="option"], [contenteditable="true"]',
    ),
  );
}

interface EllipsisRenderOptions {
  value: React.ReactNode;
  fullValue: React.ReactNode;
  lineCount: number;
  maxWidth?: number | string;
  as: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
  targetProps: React.HTMLAttributes<HTMLSpanElement>;
  targetRef?: React.MutableRefObject<HTMLElement | null>;
  forwardedRef: React.ForwardedRef<HTMLSpanElement>;
  active: boolean;
  alwaysTooltip: boolean;
  openOnMount: boolean;
}

function renderEllipsis({
  value,
  fullValue,
  lineCount,
  maxWidth,
  as: Component,
  className,
  style,
  targetProps,
  targetRef,
  forwardedRef,
  active,
  alwaysTooltip,
  openOnMount,
}: EllipsisRenderOptions) {
  const tooltipActive = alwaysTooltip || active;
  const resolvedMaxWidth =
    maxWidth === undefined ? undefined : typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth;
  return (
    <EllipsisContext.Provider value={{ content: fullValue, active: tooltipActive }}>
      <Tooltip
        content={fullValue}
        onlyOverflow={false}
        disabled={!tooltipActive}
        openOnMount={openOnMount}
        touchActivation={alwaysTooltip}
        placement="TOP"
        className="biu-ui-ellipsis__tooltip"
        style={resolvedMaxWidth ? { maxWidth: resolvedMaxWidth } : undefined}
      >
        <span
          {...targetProps}
          ref={(node) => {
            if (targetRef) targetRef.current = node;
            if (typeof forwardedRef === "function") forwardedRef(node);
            else if (forwardedRef) forwardedRef.current = node;
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
}

const EllipsisAlways = React.forwardRef<HTMLSpanElement, Omit<EllipsisProps, "alwaysTooltip">>(function EllipsisAlways(
  { content, tooltipContent, children, lines, rows, maxWidth, as: Component = "span", className, style, ...props },
  ref,
) {
  const value = content ?? children ?? "";
  const fullValue = tooltipContent ?? value;
  const lineCount = ellipsisLineCount(lines, rows);
  return renderEllipsis({
    value,
    fullValue,
    lineCount,
    maxWidth,
    as: Component,
    className,
    style,
    targetProps: props,
    forwardedRef: ref,
    active: true,
    alwaysTooltip: true,
    openOnMount: false,
  });
});

const EllipsisLazy = React.forwardRef<HTMLSpanElement, Omit<EllipsisProps, "alwaysTooltip">>(function EllipsisLazy(
  {
    content,
    tooltipContent,
    children,
    lines,
    rows,
    maxWidth,
    as: Component = "span",
    className,
    style,
    onPointerEnter,
    onPointerMove,
    onPointerDown,
    onPointerUp,
    onPointerCancel,
    onClickCapture,
    onFocus,
    ...props
  },
  ref,
) {
  const value = content ?? children ?? "";
  const fullValue = tooltipContent ?? value;
  const lineCount = ellipsisLineCount(lines, rows);
  const targetRef = React.useRef<HTMLElement | null>(null);
  const [active, setActive] = React.useState(false);
  const touchTapCloseTimerRef = React.useRef<number | undefined>(undefined);
  const clearTouchTapCloseTimer = () => {
    if (touchTapCloseTimerRef.current === undefined || typeof window === "undefined") return;
    window.clearTimeout(touchTapCloseTimerRef.current);
    touchTapCloseTimerRef.current = undefined;
  };
  React.useEffect(() => () => clearTouchTapCloseTimer(), []);
  const measure = React.useCallback(() => {
    const target = targetRef.current;
    if (!target) return false;
    const next = isTooltipOverflowing(target);
    setActive((current) => (current === next ? current : next));
    return next;
  }, []);
  const touchHandlers = useTouchLongPress(
    () => {
      clearTouchTapCloseTimer();
      const next = measure();
      if (next) setActive(true);
      return next;
    },
    () => {
      clearTouchTapCloseTimer();
      setActive(false);
    },
    () => {
      const target = targetRef.current;
      // A tap reveals passive clipped text only. Interactive ancestors keep
      // their original short-tap action; those users can still long-press.
      if (!target || hasInteractiveEllipsisAncestor(target) || !measure()) return;
      clearTouchTapCloseTimer();
      setActive(true);
      touchTapCloseTimerRef.current = window.setTimeout(() => {
        touchTapCloseTimerRef.current = undefined;
        setActive(false);
      }, 2200);
    },
  );
  const handlePointerEnter: React.PointerEventHandler<HTMLSpanElement> = (event) => {
    onPointerEnter?.(event);
    if (event.pointerType !== "touch") measure();
  };
  const handlePointerMove: React.PointerEventHandler<HTMLSpanElement> = (event) => {
    onPointerMove?.(event);
    if (event.pointerType === "touch") touchHandlers.onPointerMove(event);
    else measure();
  };
  const handlePointerDown: React.PointerEventHandler<HTMLSpanElement> = (event) => {
    onPointerDown?.(event);
    touchHandlers.onPointerDown(event);
  };
  const handlePointerUp: React.PointerEventHandler<HTMLSpanElement> = (event) => {
    onPointerUp?.(event);
    touchHandlers.onPointerUp(event);
  };
  const handlePointerCancel: React.PointerEventHandler<HTMLSpanElement> = (event) => {
    onPointerCancel?.(event);
    touchHandlers.onPointerCancel(event);
  };
  const handleClickCapture: React.MouseEventHandler<HTMLSpanElement> = (event) => {
    touchHandlers.onClickCapture(event);
    onClickCapture?.(event);
  };
  const handleFocus: React.FocusEventHandler<HTMLSpanElement> = (event) => {
    onFocus?.(event);
    measure();
  };
  return renderEllipsis({
    value,
    fullValue,
    lineCount,
    maxWidth,
    as: Component,
    className,
    style,
    targetProps: {
      ...props,
      onPointerEnter: handlePointerEnter,
      onPointerMove: handlePointerMove,
      onPointerDown: handlePointerDown,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
      onClickCapture: handleClickCapture,
      onFocus: handleFocus,
    },
    targetRef,
    forwardedRef: ref,
    active,
    alwaysTooltip: false,
    openOnMount: active,
  });
});

export const Ellipsis = React.forwardRef<HTMLSpanElement, EllipsisProps>(function Ellipsis(props, ref) {
  const { alwaysTooltip, ...componentProps } = props;
  if (alwaysTooltip) return <EllipsisAlways {...componentProps} ref={ref} />;
  return <EllipsisLazy {...componentProps} ref={ref} />;
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
