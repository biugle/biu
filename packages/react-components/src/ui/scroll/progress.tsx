import * as React from "react";
import { ArrowUp } from "@biugle/icons";
import { cx } from "../../shared/utils.js";
import { Ellipsis } from "../overlay/index.js";
import {
  useComponentsLocale,
  type BiuComponentsLocale,
  type BiuComponentsLocaleTextOverrides,
} from "../../provider.js";

type ProgressScrollTarget = Window | HTMLElement | { readonly current: HTMLElement | null } | string;
type ProgressMode = "static" | "fixed";

function resolveScrollTarget(target?: ProgressScrollTarget): Window | HTMLElement | null {
  if (typeof window === "undefined") return null;
  if (!target) return window;
  if (typeof target === "string") return document.querySelector<HTMLElement>(target) ?? window;
  if (typeof target === "object" && "current" in target) return target.current ?? window;
  return target;
}

function isWindowTarget(target: Window | HTMLElement | null): target is Window {
  return typeof window !== "undefined" && target === window;
}

export interface ScrollProgressClassNames {
  root?: string;
  progress?: string;
  value?: string;
  label?: string;
  button?: string;
}

export type ScrollProgressPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface ScrollProgressProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "title"> {
  /** Window, scrollable element, ref or selector to measure. */
  target?: ProgressScrollTarget;
  /** Render the numeric percentage alongside the progress bar. */
  showPercentage?: boolean;
  /** Use the compact small-screen layout with only percentage and back-to-top controls. */
  mobileMode?: boolean;
  /** Render the label before the progress bar when a label is provided. */
  showLabel?: boolean;
  /** Render the small back-to-top button after the threshold is reached. */
  showBackTop?: boolean;
  /** Show the back-to-top button only after the threshold, or always. */
  backTopMode?: "threshold" | "always";
  /** Scroll distance in pixels before the back-to-top button appears. */
  backTopThreshold?: number;
  /** Scroll behavior used by the back-to-top action. */
  behavior?: ScrollBehavior;
  /** Optional label rendered before the progress value. */
  label?: React.ReactNode;
  /** Render in normal flow or float at a viewport corner. */
  mode?: ProgressMode;
  /** Floating viewport corner used when mode is fixed. */
  position?: ScrollProgressPosition;
  /** Allow the fixed progress indicator to be moved within the viewport. */
  draggable?: boolean;
  locale?: BiuComponentsLocale;
  localeText?: BiuComponentsLocaleTextOverrides;
  onBackTop?: () => void;
  classNames?: ScrollProgressClassNames;
}

function readScrollState(target: Window | HTMLElement) {
  if (isWindowTarget(target)) {
    const documentElement = document.documentElement;
    const body = document.body;
    const scrollTop = window.scrollY || window.pageYOffset || documentElement.scrollTop || body?.scrollTop || 0;
    const scrollHeight = Math.max(documentElement.scrollHeight, body?.scrollHeight ?? 0);
    const viewportHeight = window.innerHeight || documentElement.clientHeight || 0;
    return { scrollTop, maxScroll: Math.max(0, scrollHeight - viewportHeight) };
  }
  return { scrollTop: target.scrollTop, maxScroll: Math.max(0, target.scrollHeight - target.clientHeight) };
}

function scrollTargetToTop(target: Window | HTMLElement, behavior: ScrollBehavior) {
  if (typeof target.scrollTo === "function") target.scrollTo({ top: 0, behavior });
  else if (isWindowTarget(target)) window.scrollTo(0, 0);
  else target.scrollTop = 0;
}

/** A compact progress indicator that can also provide a back-to-top action. */
export function ScrollProgress({
  target,
  showPercentage = true,
  mobileMode = false,
  showLabel = true,
  showBackTop = true,
  backTopMode = "threshold",
  backTopThreshold = 8,
  behavior = "smooth",
  label,
  mode = "fixed",
  position = "bottom-right",
  draggable = false,
  locale,
  localeText,
  onBackTop,
  className,
  classNames,
  style,
  ...props
}: ScrollProgressProps) {
  const text = useComponentsLocale(locale, localeText);
  const [percent, setPercent] = React.useState(0);
  const [scrollTop, setScrollTop] = React.useState(0);
  const [dragOffset, setDragOffset] = React.useState<{ x: number; y: number }>();
  const targetRef = React.useRef<Window | HTMLElement | null>(null);
  const dragRef = React.useRef<
    | {
        pointerId: number;
        startX: number;
        startY: number;
        startOffset: { x: number; y: number };
      }
    | undefined
  >(undefined);

  React.useEffect(() => {
    const resolved = resolveScrollTarget(target);
    if (!resolved) return undefined;
    targetRef.current = resolved;
    let frame: number | undefined;
    const update = () => {
      frame = undefined;
      const state = readScrollState(resolved);
      const nextPercent = state.maxScroll ? Math.min(100, Math.max(0, (state.scrollTop / state.maxScroll) * 100)) : 0;
      setScrollTop(state.scrollTop);
      setPercent(nextPercent);
    };
    const schedule = () => {
      if (frame !== undefined) return;
      if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
        frame = window.requestAnimationFrame(update);
      } else {
        update();
      }
    };
    resolved.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined" && !isWindowTarget(resolved)) {
      resizeObserver = new ResizeObserver(schedule);
      resizeObserver.observe(resolved);
    }
    update();
    return () => {
      resolved.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      resizeObserver?.disconnect();
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      targetRef.current = null;
    };
  }, [target]);

  const handleBackTop = () => {
    const resolved = targetRef.current ?? resolveScrollTarget(target);
    if (!resolved) return;
    onBackTop?.();
    scrollTargetToTop(resolved, behavior);
  };
  const percentage = Math.round(percent);
  const handleDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggable || mode !== "fixed" || event.button !== 0) return;
    const current = dragOffset ?? { x: 0, y: 0 };
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffset: current,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const handleDragMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || typeof window === "undefined") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const padding = 8;
    const baseLeft = rect.left - drag.startOffset.x;
    const baseTop = rect.top - drag.startOffset.y;
    const nextX = drag.startOffset.x + event.clientX - drag.startX;
    const nextY = drag.startOffset.y + event.clientY - drag.startY;
    const x = Math.min(Math.max(padding - baseLeft, nextX), window.innerWidth - rect.width - padding - baseLeft);
    const y = Math.min(Math.max(padding - baseTop, nextY), window.innerHeight - rect.height - padding - baseTop);
    setDragOffset({ x, y });
  };
  const handleDragEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = undefined;
  };
  const rootStyle = {
    "--biu-scroll-progress": `${percent}%`,
    ...(dragOffset ? { transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)` } : {}),
    ...style,
  } as React.CSSProperties;

  return (
    <div
      {...props}
      className={cx(
        "biu-ui-scroll-progress",
        `biu-ui-scroll-progress--${mode}`,
        `biu-ui-scroll-progress--${position}`,
        mobileMode && "biu-ui-scroll-progress--mobile",
        draggable && mode === "fixed" && "biu-ui-scroll-progress--draggable",
        classNames?.root,
        className,
      )}
      style={rootStyle}
      data-biu-component="scroll-progress"
      data-biu-scroll-progress-mode={mode}
      data-biu-scroll-progress-position={position}
      data-biu-scroll-progress-mobile={mobileMode ? "true" : "false"}
      data-percent={percentage}
      onPointerDown={handleDragStart}
      onPointerMove={handleDragMove}
      onPointerUp={handleDragEnd}
      onPointerCancel={handleDragEnd}
    >
      {!mobileMode && showLabel && label !== undefined ? (
        <Ellipsis content={label} className={cx("biu-ui-scroll-progress__label", classNames?.label)} maxWidth="100%" />
      ) : null}
      {!mobileMode ? (
        <div
          className={cx("biu-ui-scroll-progress__progress", classNames?.progress)}
          role="progressbar"
          aria-label={text["滚动进度"]}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percentage}
        >
          <span className={cx("biu-ui-scroll-progress__value", classNames?.value)} style={{ width: `${percent}%` }} />
        </div>
      ) : null}
      {showPercentage || mobileMode ? <span className="biu-ui-scroll-progress__percentage">{percentage}%</span> : null}
      {(showBackTop || mobileMode) && (backTopMode === "always" || scrollTop > Math.max(0, backTopThreshold)) ? (
        <button
          type="button"
          className={cx("biu-ui-scroll-progress__button", classNames?.button)}
          onClick={handleBackTop}
          aria-label={text["回到顶部"]}
          title={text["回到顶部"]}
        >
          <ArrowUp size={15} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
