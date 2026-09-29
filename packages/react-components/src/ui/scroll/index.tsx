import * as React from "react";
import { ArrowUp, ChevronDown, ChevronRight } from "@biugle/icons";
import { cx } from "../../shared/utils.js";
import {
  useComponentsLocale,
  type BiuComponentsLocale,
  type BiuComponentsLocaleTextOverrides,
} from "../../provider.js";

export type AnchorHeadingLevel = 1 | 2 | 3 | 4 | 5;

type ElementReference = HTMLElement | { readonly current: HTMLElement | null } | string;

export type ScrollTarget = Window | HTMLElement | { readonly current: HTMLElement | null } | string;

export interface AnchorClassNames {
  root?: string;
  header?: string;
  list?: string;
  item?: string;
  node?: string;
  nodeToggle?: string;
  activeItem?: string;
  toggle?: string;
}

export type AnchorPosition = "left" | "right";
export type AnchorMode = "static" | "fixed";

export interface AnchorProps extends Omit<React.HTMLAttributes<HTMLElement>, "title" | "children" | "onChange"> {
  /** Element or selector containing the headings to index. Defaults to document. */
  container?: ElementReference;
  /** Window, scrollable element, ref or selector used by the headings. */
  scrollContainer?: ScrollTarget;
  /** Heading levels scanned by the default or custom selector. */
  levels?: AnchorHeadingLevel[];
  /** Custom heading selector. Non-heading matches are ignored. */
  selector?: string;
  /** Safe space reserved for a sticky header when scrolling to a heading. */
  offsetTop?: number;
  /** Optional title rendered above the anchor list. */
  title?: React.ReactNode;
  /** Limit the number of rendered heading links. */
  maxItems?: number;
  /** Allow the heading list to be collapsed from its header. */
  collapsible?: boolean;
  /** Heading levels whose child lists can be collapsed independently. */
  collapsibleLevels?: AnchorHeadingLevel[];
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Controlled keys for independently collapsed heading nodes. */
  collapsedKeys?: string[];
  defaultCollapsedKeys?: string[];
  onCollapsedKeysChange?: (keys: string[]) => void;
  /** Render as a normal flow element or as a viewport-edge floating menu. */
  mode?: AnchorMode;
  /** Floating edge used when mode is fixed. */
  position?: AnchorPosition;
  /** Allow the fixed catalog to be repositioned vertically by dragging its header. */
  draggable?: boolean;
  /** Hide the floating/static anchor below the mobile breakpoint. */
  hideOnMobile?: boolean;
  locale?: BiuComponentsLocale;
  localeText?: BiuComponentsLocaleTextOverrides;
  onChange?: (id: string, heading: HTMLElement) => void;
  classNames?: AnchorClassNames;
}

interface AnchorHeading {
  id: string;
  level: AnchorHeadingLevel;
  label: string;
  element: HTMLElement;
}

interface AnchorHeadingNode extends AnchorHeading {
  children: AnchorHeadingNode[];
}

function resolveElement(target?: ElementReference): HTMLElement | null {
  if (!target || typeof document === "undefined") return null;
  if (typeof target === "string") return document.querySelector<HTMLElement>(target);
  if (typeof target === "object" && "current" in target) return target.current;
  return target;
}

function resolveScrollTarget(target?: ScrollTarget): Window | HTMLElement | null {
  if (typeof window === "undefined") return null;
  if (!target) return window;
  if (typeof target === "string") return document.querySelector<HTMLElement>(target) ?? window;
  if (typeof target === "object" && "current" in target) return target.current ?? window;
  return target;
}

function isWindowTarget(target: Window | HTMLElement | null): target is Window {
  return typeof window !== "undefined" && target === window;
}

function headingLevel(element: HTMLElement): AnchorHeadingLevel | null {
  const value = Number(element.tagName.slice(1));
  return value >= 1 && value <= 5 ? (value as AnchorHeadingLevel) : null;
}

function headingSlug(label: string, index: number) {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `biu-anchor-${slug || `section-${index + 1}`}`;
}

function collectHeadings(root: ParentNode, selector: string, levels: Set<AnchorHeadingLevel>) {
  let nodes: HTMLElement[] = [];
  try {
    nodes = Array.from(root.querySelectorAll<HTMLElement>(selector));
  } catch {
    return [];
  }
  const usedIds = new Set<string>();
  return nodes.reduce<AnchorHeading[]>((result, element, index) => {
    const level = headingLevel(element);
    if (!level || !levels.has(level)) return result;
    const label = element.textContent?.trim() ?? "";
    if (!label) return result;

    let id = element.id || headingSlug(label, index);
    let suffix = 2;
    while (usedIds.has(id)) id = `${element.id || headingSlug(label, index)}-${suffix++}`;
    if (element.id !== id) element.id = id;
    usedIds.add(id);
    result.push({ id, level, label, element });
    return result;
  }, []);
}

function buildHeadingTree(headings: AnchorHeading[]) {
  const roots: AnchorHeadingNode[] = [];
  const stack: AnchorHeadingNode[] = [];
  for (const heading of headings) {
    const node: AnchorHeadingNode = { ...heading, children: [] };
    while (stack.length && stack[stack.length - 1].level >= node.level) stack.pop();
    const parent = stack[stack.length - 1];
    if (parent) parent.children.push(node);
    else roots.push(node);
    stack.push(node);
  }
  return roots;
}

function scrollToHeading(heading: HTMLElement, target: Window | HTMLElement, offsetTop: number) {
  const headingRect = heading.getBoundingClientRect();
  if (isWindowTarget(target)) {
    const top = Math.max(0, headingRect.top + (window.scrollY || window.pageYOffset || 0) - offsetTop);
    if (typeof target.scrollTo === "function") target.scrollTo({ top, behavior: "smooth" });
    else heading.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const containerRect = target.getBoundingClientRect();
  const top = Math.max(0, target.scrollTop + headingRect.top - containerRect.top - offsetTop);
  if (typeof target.scrollTo === "function") target.scrollTo({ top, behavior: "smooth" });
  else target.scrollTop = top;
}

function findActiveHeading(headings: AnchorHeading[], target: Window | HTMLElement, offsetTop: number) {
  if (!headings.length) return undefined;
  const viewportTop = isWindowTarget(target) ? 0 : target.getBoundingClientRect().top;
  const threshold = viewportTop + Math.max(0, offsetTop) + 8;
  let active = headings[0];
  let activeTop = Number.NEGATIVE_INFINITY;
  for (const heading of headings) {
    const top = heading.element.getBoundingClientRect().top;
    if (top <= threshold && top >= activeTop) {
      active = heading;
      activeTop = top;
    }
  }
  return active;
}

/**
 * A small, content-driven table of contents. It scans h1-h5 headings, keeps
 * the active heading in sync with the configured scroll context and uses the
 * same offset for click scrolling as it does for active-state detection.
 */
export function Anchor({
  container,
  scrollContainer,
  levels = [1, 2, 3, 4, 5],
  selector = "h1, h2, h3, h4, h5",
  offsetTop = 0,
  title,
  maxItems,
  collapsible = false,
  collapsibleLevels = [1, 2],
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
  collapsedKeys: collapsedKeysProp,
  defaultCollapsedKeys = [],
  onCollapsedKeysChange,
  mode = "fixed",
  position = "right",
  draggable = false,
  hideOnMobile = true,
  locale,
  localeText,
  onChange,
  className,
  classNames,
  style: styleProp,
  ...props
}: AnchorProps) {
  const text = useComponentsLocale(locale, localeText);
  const [isMobile, setIsMobile] = React.useState(false);
  const [headings, setHeadings] = React.useState<AnchorHeading[]>([]);
  const [activeId, setActiveId] = React.useState<string>();
  const [scrollViewportHeight, setScrollViewportHeight] = React.useState<number>();
  const [internalCollapsed, setInternalCollapsed] = React.useState(defaultCollapsed);
  const [internalCollapsedKeys, setInternalCollapsedKeys] = React.useState(defaultCollapsedKeys);
  const [dragTop, setDragTop] = React.useState<number>();
  const anchorRef = React.useRef<HTMLElement | null>(null);
  const dragRef = React.useRef<{ pointerId: number; startY: number; startTop: number } | undefined>(undefined);
  const activeIdRef = React.useRef<string | undefined>(undefined);
  const levelsKey = levels.join(",");

  React.useEffect(() => {
    if (!hideOnMobile || typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
    const media = window.matchMedia("(max-width: 760px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, [hideOnMobile]);

  React.useEffect(() => {
    const resolvedContainer = resolveElement(container);
    const root = resolvedContainer ?? (container === undefined && typeof document !== "undefined" ? document : null);
    if (!root) {
      setHeadings([]);
      return undefined;
    }
    const update = () => setHeadings(collectHeadings(root, selector, new Set(levels)));
    update();
    if (typeof MutationObserver === "undefined") return undefined;
    const observer = new MutationObserver(update);
    observer.observe(root === document ? document.body : root, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [container, levelsKey, selector]);

  React.useEffect(() => {
    const target = resolveScrollTarget(scrollContainer);
    if (!target || typeof window === "undefined") {
      setScrollViewportHeight(undefined);
      return undefined;
    }
    const updateSize = () => {
      const height = isWindowTarget(target)
        ? window.innerHeight
        : target.clientHeight || target.getBoundingClientRect().height;
      setScrollViewportHeight(height > 0 ? Math.floor(height * 0.8) : undefined);
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    const resizeObserver =
      !isWindowTarget(target) && typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateSize) : undefined;
    if (resizeObserver && !isWindowTarget(target)) resizeObserver.observe(target);
    return () => {
      window.removeEventListener("resize", updateSize);
      resizeObserver?.disconnect();
    };
  }, [scrollContainer]);

  React.useEffect(() => {
    const target = resolveScrollTarget(scrollContainer);
    if (!target || !headings.length) {
      activeIdRef.current = undefined;
      setActiveId(undefined);
      return undefined;
    }
    let frame: number | undefined;
    const update = () => {
      frame = undefined;
      const active = findActiveHeading(headings, target, offsetTop);
      if (!active || active.id === activeIdRef.current) return;
      activeIdRef.current = active.id;
      setActiveId(active.id);
      onChange?.(active.id, active.element);
    };
    const schedule = () => {
      if (frame !== undefined) return;
      if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
        frame = window.requestAnimationFrame(update);
      } else {
        update();
      }
    };
    target.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();
    return () => {
      target.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame !== undefined) window.cancelAnimationFrame(frame);
    };
  }, [headings, offsetTop, onChange, scrollContainer]);

  const visibleHeadings = maxItems === undefined ? headings : headings.slice(0, Math.max(0, maxItems));
  const headingTree = React.useMemo(() => buildHeadingTree(visibleHeadings), [visibleHeadings]);
  const collapsed = collapsedProp ?? internalCollapsed;
  const collapsedKeys = collapsedKeysProp ?? internalCollapsedKeys;
  const collapsedKeySet = React.useMemo(() => new Set(collapsedKeys), [collapsedKeys]);
  if (isMobile || !visibleHeadings.length) return null;

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>, heading: AnchorHeading) => {
    event.preventDefault();
    const target = resolveScrollTarget(scrollContainer);
    if (!target) return;
    scrollToHeading(heading.element, target, offsetTop);
    activeIdRef.current = heading.id;
    setActiveId(heading.id);
    onChange?.(heading.id, heading.element);
  };
  const toggleCollapsed = () => {
    const next = !collapsed;
    if (collapsedProp === undefined) setInternalCollapsed(next);
    onCollapsedChange?.(next);
  };
  const toggleHeading = (id: string) => {
    const next = collapsedKeySet.has(id) ? collapsedKeys.filter((key) => key !== id) : [...collapsedKeys, id];
    if (collapsedKeysProp === undefined) setInternalCollapsedKeys(next);
    onCollapsedKeysChange?.(next);
  };
  const handleDragStart = (event: React.PointerEvent<HTMLElement>) => {
    if (!draggable || mode !== "fixed" || !anchorRef.current || event.button !== 0) return;
    const rect = anchorRef.current.getBoundingClientRect();
    dragRef.current = { pointerId: event.pointerId, startY: event.clientY, startTop: rect.top };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const handleDragMove = (event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !anchorRef.current || typeof window === "undefined") return;
    const rect = anchorRef.current.getBoundingClientRect();
    const padding = 8;
    const nextTop = Math.min(
      Math.max(padding, drag.startTop + event.clientY - drag.startY),
      Math.max(padding, window.innerHeight - rect.height - padding),
    );
    setDragTop(nextTop);
  };
  const handleDragEnd = (event: React.PointerEvent<HTMLElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = undefined;
  };
  const renderNodes = (nodes: AnchorHeadingNode[]): React.ReactNode =>
    nodes.map((heading) => {
      const active = heading.id === activeId;
      const canCollapse = collapsible && collapsibleLevels.includes(heading.level) && heading.children.length > 0;
      const nodeCollapsed = collapsedKeySet.has(heading.id);
      return (
        <li
          key={heading.id}
          className={cx(
            "biu-ui-anchor__item",
            heading.children.length > 0 && "biu-ui-anchor__item--has-children",
            active && "biu-ui-anchor__item--active",
            classNames?.node,
          )}
          data-level={heading.level}
        >
          <div className="biu-ui-anchor__item-row">
            {canCollapse ? (
              <button
                type="button"
                className={cx("biu-ui-anchor__node-toggle", classNames?.nodeToggle)}
                aria-expanded={!nodeCollapsed}
                aria-label={heading.label}
                onClick={() => toggleHeading(heading.id)}
              >
                {nodeCollapsed ? (
                  <ChevronRight size={13} aria-hidden="true" />
                ) : (
                  <ChevronDown size={13} aria-hidden="true" />
                )}
              </button>
            ) : null}
            <a
              href={`#${heading.id}`}
              className={cx(classNames?.item, active && classNames?.activeItem)}
              data-level={heading.level}
              aria-current={active ? "location" : undefined}
              onClick={(event) => handleClick(event, heading)}
            >
              {heading.label}
            </a>
          </div>
          {heading.children.length && !nodeCollapsed ? (
            <ol className="biu-ui-anchor__nested">{renderNodes(heading.children)}</ol>
          ) : null}
        </li>
      );
    });

  return (
    <nav
      {...props}
      ref={anchorRef}
      className={cx(
        "biu-ui-anchor",
        `biu-ui-anchor--${mode}`,
        `biu-ui-anchor--${position}`,
        hideOnMobile && "biu-ui-anchor--hide-mobile",
        collapsed && "biu-ui-anchor--collapsed",
        draggable && mode === "fixed" && "biu-ui-anchor--draggable",
        classNames?.root,
        className,
      )}
      aria-label={props["aria-label"] ?? text["目录"]}
      data-biu-component="anchor"
      data-biu-anchor-mode={mode}
      data-biu-anchor-position={position}
      style={{
        ...styleProp,
        ...(scrollViewportHeight
          ? ({ "--biu-anchor-max-height": `${scrollViewportHeight}px` } as React.CSSProperties)
          : {}),
        ...(dragTop !== undefined ? ({ "--biu-anchor-top": `${dragTop}px` } as React.CSSProperties) : {}),
      }}
    >
      {title !== null ? (
        collapsible ? (
          <button
            type="button"
            className={cx("biu-ui-anchor__header", "biu-ui-anchor__toggle", classNames?.header, classNames?.toggle)}
            aria-expanded={!collapsed}
            onClick={toggleCollapsed}
            onPointerDown={handleDragStart}
            onPointerMove={handleDragMove}
            onPointerUp={handleDragEnd}
            onPointerCancel={handleDragEnd}
          >
            <span>{title ?? text["目录"]}</span>
            {collapsed ? <ChevronRight size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
          </button>
        ) : (
          <div
            className={cx("biu-ui-anchor__header", classNames?.header)}
            onPointerDown={handleDragStart}
            onPointerMove={handleDragMove}
            onPointerUp={handleDragEnd}
            onPointerCancel={handleDragEnd}
          >
            {title ?? text["目录"]}
          </div>
        )
      ) : null}
      <ol className={cx("biu-ui-anchor__list", classNames?.list)} aria-hidden={collapsed}>
        {renderNodes(headingTree)}
      </ol>
    </nav>
  );
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
  target?: ScrollTarget;
  /** Render the numeric percentage alongside the progress bar. */
  showPercentage?: boolean;
  /** Render the small back-to-top button after the threshold is reached. */
  showBackTop?: boolean;
  /** Scroll distance in pixels before the back-to-top button appears. */
  backTopThreshold?: number;
  /** Scroll behavior used by the back-to-top action. */
  behavior?: ScrollBehavior;
  /** Optional label rendered before the progress value. */
  label?: React.ReactNode;
  /** Render in normal flow or float at a viewport corner. */
  mode?: AnchorMode;
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
  showBackTop = true,
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
        draggable && mode === "fixed" && "biu-ui-scroll-progress--draggable",
        classNames?.root,
        className,
      )}
      style={rootStyle}
      data-biu-component="scroll-progress"
      data-biu-scroll-progress-mode={mode}
      data-biu-scroll-progress-position={position}
      data-percent={percentage}
      onPointerDown={handleDragStart}
      onPointerMove={handleDragMove}
      onPointerUp={handleDragEnd}
      onPointerCancel={handleDragEnd}
    >
      {label !== undefined ? (
        <span className={cx("biu-ui-scroll-progress__label", classNames?.label)}>{label}</span>
      ) : null}
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
      {showPercentage ? <span className="biu-ui-scroll-progress__percentage">{percentage}%</span> : null}
      {showBackTop && scrollTop > Math.max(0, backTopThreshold) ? (
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
