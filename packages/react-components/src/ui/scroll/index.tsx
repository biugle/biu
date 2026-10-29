import * as React from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronRight, Move, X } from "@biugle/icons";
import { cx } from "../../shared/utils.js";
import { buildHeadingTree, collectHeadings, headingsKey, mutationTouchesHeading } from "./anchor-utils.js";
import type { AnchorHeading, AnchorHeadingLevel, AnchorHeadingNode } from "./anchor-utils.js";
import {
  useComponentsConfig,
  useComponentsLocale,
  type BiuComponentsLocale,
  type BiuComponentsLocaleTextOverrides,
} from "../../provider.js";

export type { AnchorHeadingLevel } from "./anchor-utils.js";

type ElementReference = HTMLElement | { readonly current: HTMLElement | null } | string;

export type ScrollTarget = Window | HTMLElement | { readonly current: HTMLElement | null } | string;

export interface AnchorClassNames {
  root?: string;
  header?: string;
  actions?: string;
  dragHandle?: string;
  closeButton?: string;
  list?: string;
  item?: string;
  node?: string;
  nodeToggle?: string;
  activeItem?: string;
  toggle?: string;
}

export type AnchorPosition = "left" | "right" | "start" | "end";
export type AnchorMode = "static" | "fixed";
export type NavigationArrowPosition = "left" | "right" | "start" | "end";

const useIsomorphicLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

// Resolve logical viewport edges from the configured direction before the menu is portaled to document.body.
function resolveAnchorPosition(position: AnchorPosition, direction?: "ltr" | "rtl"): AnchorPosition {
  if (!direction || position === "left" || position === "right") return position;
  if (position === "start") return direction === "rtl" ? "right" : "left";
  return direction === "rtl" ? "left" : "right";
}

// A closed catalog stays hidden across SPA route unmounts and resets on full page reload.
const dismissedAnchorKeys = new Set<string>();

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
  /** Position of node collapse arrows; start/end follow the current text direction. */
  arrowPosition?: NavigationArrowPosition;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Controlled keys for independently collapsed heading nodes. */
  collapsedKeys?: string[];
  defaultCollapsedKeys?: string[];
  onCollapsedKeysChange?: (keys: string[]) => void;
  /** Render as a normal flow element or as a viewport-edge floating menu. */
  mode?: AnchorMode;
  /** Floating viewport edge; start/end follow the current text direction. Defaults to logical end. */
  position?: AnchorPosition;
  /** Show a dedicated handle that moves the fixed catalog anywhere inside the viewport. */
  draggable?: boolean;
  /** Show a close action; a stable root id keeps it dismissed across SPA remounts until page reload. */
  closable?: boolean;
  /** Hide the floating/static anchor below the mobile breakpoint. */
  hideOnMobile?: boolean;
  locale?: BiuComponentsLocale;
  localeText?: BiuComponentsLocaleTextOverrides;
  onChange?: (id: string, heading: HTMLElement) => void;
  classNames?: AnchorClassNames;
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

function headingScrollPosition(heading: HTMLElement, target: Window | HTMLElement, offsetTop: number) {
  const headingTop = heading.getBoundingClientRect().top;
  if (isWindowTarget(target)) {
    return Math.max(0, headingTop + (window.scrollY || window.pageYOffset || 0) - offsetTop);
  }
  return Math.max(0, target.scrollTop + headingTop - target.getBoundingClientRect().top - offsetTop);
}

function scrollToHeading(
  heading: HTMLElement,
  target: Window | HTMLElement,
  offsetTop: number,
  behavior: ScrollBehavior = "smooth",
) {
  const top = headingScrollPosition(heading, target, offsetTop);
  if (typeof target.scrollTo === "function") target.scrollTo({ top, behavior });
  else if (isWindowTarget(target)) heading.scrollIntoView({ behavior, block: "start" });
  else target.scrollTop = top;
}

function scrollToHeadingWithDuration(
  heading: HTMLElement,
  target: Window | HTMLElement,
  offsetTop: number,
  duration = 800,
): (() => void) | undefined {
  const start = isWindowTarget(target) ? window.scrollY || window.pageYOffset || 0 : target.scrollTop;
  const destination = headingScrollPosition(heading, target, offsetTop);
  const distance = destination - start;
  if (Math.abs(distance) < 1 || typeof window === "undefined") {
    scrollToHeading(heading, target, offsetTop, "smooth");
    return undefined;
  }
  const startedAt = window.performance?.now?.() ?? Date.now();
  const ease = (progress: number) => 1 - (1 - progress) ** 3;
  let animationFrame: number | undefined;
  let cancelled = false;
  const cancel = () => {
    cancelled = true;
    if (animationFrame !== undefined) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = undefined;
    }
  };
  const frame = (now: number) => {
    if (cancelled) return;
    const progress = Math.min(1, Math.max(0, (now - startedAt) / duration));
    // Content above an anchor can materialize while scrolling (for example a
    // distant section using `content-visibility: auto`). Re-measure the live
    // target on every frame so preceding layout shifts do not leave the
    // heading stranded between sections.
    const liveDestination = headingScrollPosition(heading, target, offsetTop);
    const next = start + (liveDestination - start) * ease(progress);
    if (isWindowTarget(target)) {
      target.scrollTo({ top: next, behavior: progress < 1 ? "auto" : "smooth" });
    } else if (typeof target.scrollTo === "function") {
      // The container may itself declare scroll-behavior: smooth. Each frame
      // must be an immediate write or the browser queues a second animation.
      target.scrollTo({ top: next, behavior: "auto" });
    } else target.scrollTop = next;
    if (progress < 1) animationFrame = window.requestAnimationFrame(frame);
    else animationFrame = undefined;
  };
  animationFrame = window.requestAnimationFrame(frame);
  return cancel;
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

// Keep the floating catalog reachable inside the browser viewport after pointer or keyboard repositioning.
function clampAnchorPosition(left: number, top: number, width: number, height: number) {
  const padding = 8;
  const maxLeft = Math.max(padding, window.innerWidth - width - padding);
  const maxTop = Math.max(padding, window.innerHeight - height - padding);
  return {
    left: Math.min(maxLeft, Math.max(padding, left)),
    top: Math.min(maxTop, Math.max(padding, top)),
  };
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
  arrowPosition = "end",
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
  collapsedKeys: collapsedKeysProp,
  defaultCollapsedKeys = [],
  onCollapsedKeysChange,
  mode = "fixed",
  position = "end",
  draggable = false,
  closable = false,
  hideOnMobile = true,
  locale,
  localeText,
  onChange,
  className,
  classNames,
  style: styleProp,
  ...props
}: AnchorProps) {
  const { direction } = useComponentsConfig();
  const configuredDirection = props.dir ?? direction;
  const positionDirection =
    props.dir === "ltr" || props.dir === "rtl" ? props.dir : props.dir === "auto" ? undefined : direction;
  const resolvedPosition = resolveAnchorPosition(position, positionDirection);
  const text = useComponentsLocale(locale, localeText);
  const dismissalKey =
    props.id && typeof window !== "undefined" ? `${window.location.pathname}\u0000${props.id}` : undefined;
  const [dismissed, setDismissed] = React.useState(() =>
    Boolean(dismissalKey && dismissedAnchorKeys.has(dismissalKey)),
  );
  const [isMobile, setIsMobile] = React.useState(false);
  const [headings, setHeadings] = React.useState<AnchorHeading[]>([]);
  const [activeId, setActiveId] = React.useState<string>();
  const [scrollViewportHeight, setScrollViewportHeight] = React.useState<number>();
  const [portalHost, setPortalHost] = React.useState<HTMLElement | null>(null);
  const [internalCollapsed, setInternalCollapsed] = React.useState(defaultCollapsed);
  const [internalCollapsedKeys, setInternalCollapsedKeys] = React.useState(defaultCollapsedKeys);
  const [dragPosition, setDragPosition] = React.useState<{ left: number; top: number }>();
  const anchorRef = React.useRef<HTMLElement | null>(null);
  const dragRef = React.useRef<
    { pointerId: number; startX: number; startY: number; startLeft: number; startTop: number } | undefined
  >(undefined);
  const activeIdRef = React.useRef<string | undefined>(undefined);
  const headingsKeyRef = React.useRef("");
  const scrollAnimationRef = React.useRef<(() => void) | undefined>(undefined);
  const hashTimerRef = React.useRef<number | undefined>(undefined);
  const initialHashHandledRef = React.useRef(false);
  const handledHashRef = React.useRef<string | undefined>(undefined);
  const levelsKey = levels.join(",");
  const previousPlacementRef = React.useRef({ position, direction: positionDirection });

  useIsomorphicLayoutEffect(() => {
    const previous = previousPlacementRef.current;
    previousPlacementRef.current = { position, direction: positionDirection };

    // Drag coordinates are physical viewport pixels. When a logical edge (or
    // the requested edge itself) changes, drop that override so start/end can
    // resolve against the new LTR/RTL direction instead of pinning the menu
    // to the old side. Explicit left/right positions stay physical.
    const logicalEdgeChanged = (position === "start" || position === "end") && previous.direction !== positionDirection;
    if (previous.position !== position || logicalEdgeChanged) {
      dragRef.current = undefined;
      setDragPosition(undefined);
    }
  }, [position, positionDirection]);

  useIsomorphicLayoutEffect(() => {
    if (mode !== "fixed" || !draggable || typeof document === "undefined" || !document.body) {
      setPortalHost(null);
      return;
    }
    // A draggable viewport menu must escape transformed, clipped, or scrolling
    // page containers so its viewport coordinates and drag bounds agree.
    setPortalHost(document.body);
  }, [draggable, mode]);

  React.useEffect(() => {
    if (dismissed || !hideOnMobile || typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }
    const media = window.matchMedia("(max-width: 760px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, [dismissed, hideOnMobile]);

  React.useEffect(() => {
    if (dismissed) return undefined;
    const resolvedContainer = resolveElement(container);
    const root = resolvedContainer ?? (container === undefined && typeof document !== "undefined" ? document : null);
    if (!root) {
      headingsKeyRef.current = "";
      setHeadings([]);
      return undefined;
    }
    const levelSet = new Set(levels);
    let frame: number | undefined;
    let disposed = false;
    const update = () => {
      frame = undefined;
      if (disposed) return;
      const next = collectHeadings(root, selector, levelSet);
      const nextKey = headingsKey(next);
      if (nextKey === headingsKeyRef.current) return;
      headingsKeyRef.current = nextKey;
      setHeadings(next);
    };
    const schedule = () => {
      if (frame !== undefined) return;
      if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
        frame = window.requestAnimationFrame(update);
      } else update();
    };
    update();
    if (typeof MutationObserver === "undefined") return undefined;
    const observer = new MutationObserver((records) => {
      // The catalog contains many interactive controls. Their listbox/table
      // mutations do not change the anchor index, so avoid rescanning the
      // whole page for unrelated child updates.
      if (records.some((record) => mutationTouchesHeading(record, selector))) schedule();
    });
    observer.observe(root === document ? document.body : root, { childList: true, subtree: true, characterData: true });
    return () => {
      disposed = true;
      observer.disconnect();
      if (frame !== undefined) window.cancelAnimationFrame(frame);
    };
  }, [container, dismissed, levelsKey, selector]);

  React.useEffect(() => {
    if (dismissed) return undefined;
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
  }, [dismissed, scrollContainer]);

  React.useEffect(() => {
    if (dismissed || !dragPosition || typeof window === "undefined") return undefined;
    const keepInsideViewport = () => {
      const element = anchorRef.current;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      setDragPosition((current) => {
        if (!current) return current;
        const next = clampAnchorPosition(current.left, current.top, rect.width, rect.height);
        return next.left === current.left && next.top === current.top ? current : next;
      });
    };
    window.addEventListener("resize", keepInsideViewport);
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(keepInsideViewport) : undefined;
    if (resizeObserver && anchorRef.current) resizeObserver.observe(anchorRef.current);
    return () => {
      window.removeEventListener("resize", keepInsideViewport);
      resizeObserver?.disconnect();
    };
  }, [dismissed, dragPosition]);

  React.useEffect(() => {
    if (dismissed) return undefined;
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
  }, [dismissed, headings, offsetTop, onChange, scrollContainer]);

  React.useEffect(() => {
    if (dismissed) return undefined;
    const target = resolveScrollTarget(scrollContainer);
    if (!target || !headings.length || typeof window === "undefined") return undefined;

    const syncHashHeading = (behavior: ScrollBehavior) => {
      const rawHash = window.location.hash.slice(1);
      if (!rawHash) return;
      if (handledHashRef.current === rawHash) return;
      let id = rawHash;
      try {
        id = decodeURIComponent(rawHash);
      } catch {
        // An invalidly encoded hash cannot identify a generated heading.
      }
      const heading = headings.find((item) => item.id === id);
      if (!heading) return;
      scrollAnimationRef.current?.();
      scrollAnimationRef.current =
        behavior === "smooth" ? scrollToHeadingWithDuration(heading.element, target, offsetTop) : undefined;
      if (behavior !== "smooth") scrollToHeading(heading.element, target, offsetTop, behavior);
      activeIdRef.current = heading.id;
      setActiveId(heading.id);
      onChange?.(heading.id, heading.element);
      handledHashRef.current = rawHash;
      return true;
    };

    const handleHashChange = () => {
      handledHashRef.current = undefined;
      syncHashHeading("smooth");
    };
    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("popstate", handleHashChange);
    if (window.location.hash && !initialHashHandledRef.current) {
      let attempts = 0;
      const retryInitialHash = () => {
        hashTimerRef.current = undefined;
        // Initial browser hash navigation may land using the placeholder size
        // of content-visibility sections. Use the same live-measured motion as
        // an in-page anchor click so sections materializing above the target
        // cannot leave the final position stale.
        if (syncHashHeading("smooth")) {
          initialHashHandledRef.current = true;
          return;
        }
        // Headings can be mounted by lazy demo sections after the first
        // render. Keep the URL target pending until the catalog is ready.
        attempts += 1;
        if (attempts < 30 && window.location.hash) {
          hashTimerRef.current = window.setTimeout(retryInitialHash, 50);
        } else {
          // Do not restart a bounded retry loop on every later heading
          // mutation when the URL points to a target this Anchor does not own.
          initialHashHandledRef.current = true;
        }
      };
      hashTimerRef.current = window.setTimeout(retryInitialHash, 0);
    }
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("popstate", handleHashChange);
      if (hashTimerRef.current !== undefined) {
        window.clearTimeout(hashTimerRef.current);
        hashTimerRef.current = undefined;
      }
      scrollAnimationRef.current?.();
      scrollAnimationRef.current = undefined;
    };
  }, [dismissed, headings, offsetTop, onChange, scrollContainer]);

  React.useEffect(() => {
    if (dismissed || !activeId || !anchorRef.current) return;
    const activeLink = Array.from(anchorRef.current.querySelectorAll<HTMLAnchorElement>("a[data-anchor-id]")).find(
      (link) => link.dataset.anchorId === activeId,
    );
    const list = anchorRef.current.querySelector<HTMLOListElement>(".biu-ui-anchor__list");
    if (!activeLink || !list) return;
    const linkRect = activeLink.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    if (linkRect.top < listRect.top) list.scrollTop -= listRect.top - linkRect.top;
    else if (linkRect.bottom > listRect.bottom) list.scrollTop += linkRect.bottom - listRect.bottom;
  }, [activeId, dismissed]);

  const visibleHeadings = maxItems === undefined ? headings : headings.slice(0, Math.max(0, maxItems));
  const headingTree = React.useMemo(() => buildHeadingTree(visibleHeadings), [visibleHeadings]);
  const collapsed = collapsedProp ?? internalCollapsed;
  const collapsedKeys = collapsedKeysProp ?? internalCollapsedKeys;
  const collapsedKeySet = React.useMemo(() => new Set(collapsedKeys), [collapsedKeys]);
  const showHeader = title !== null || (mode === "fixed" && (draggable || closable));
  if (dismissed || isMobile || !visibleHeadings.length) return null;

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>, heading: AnchorHeading) => {
    event.preventDefault();
    const target = resolveScrollTarget(scrollContainer);
    if (!target) return;
    scrollAnimationRef.current?.();
    scrollAnimationRef.current = scrollToHeadingWithDuration(heading.element, target, offsetTop);
    if (typeof window !== "undefined") {
      const nextUrl = `${window.location.pathname}${window.location.search}#${heading.id}`;
      if (typeof window.history?.pushState === "function") window.history.pushState(null, "", nextUrl);
      else window.location.hash = heading.id;
    }
    handledHashRef.current = heading.id;
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
    if (!draggable || mode !== "fixed" || !anchorRef.current || event.button !== 0 || event.isPrimary === false) {
      return;
    }
    const rect = anchorRef.current.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: rect.left,
      startTop: rect.top,
    };
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const handleDragMove = (event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !anchorRef.current || typeof window === "undefined") return;
    const rect = anchorRef.current.getBoundingClientRect();
    setDragPosition(
      clampAnchorPosition(
        drag.startLeft + event.clientX - drag.startX,
        drag.startTop + event.clientY - drag.startY,
        rect.width,
        rect.height,
      ),
    );
  };
  const handleDragEnd = (event: React.PointerEvent<HTMLElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = undefined;
  };
  const handleDragKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const directions: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const delta = directions[event.key];
    if (!delta || !anchorRef.current || typeof window === "undefined") return;
    event.preventDefault();
    const rect = anchorRef.current.getBoundingClientRect();
    const current = dragPosition ?? { left: rect.left, top: rect.top };
    const step = event.shiftKey ? 40 : 16;
    setDragPosition(
      clampAnchorPosition(current.left + delta[0] * step, current.top + delta[1] * step, rect.width, rect.height),
    );
  };
  const handleClose = () => {
    // Dismissal stays in memory only, so a full page reload restores the catalog.
    if (dismissalKey) dismissedAnchorKeys.add(dismissalKey);
    dragRef.current = undefined;
    setDismissed(true);
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
          <div className="biu-ui-anchor__item-row" data-arrow-position={arrowPosition}>
            <a
              href={`#${heading.id}`}
              className={cx(classNames?.item, active && classNames?.activeItem)}
              data-anchor-id={heading.id}
              data-level={heading.level}
              aria-current={active ? "location" : undefined}
              onClick={(event) => handleClick(event, heading)}
            >
              {heading.label}
            </a>
            {canCollapse ? (
              <button
                type="button"
                className={cx("biu-ui-anchor__node-toggle", classNames?.nodeToggle)}
                aria-expanded={!nodeCollapsed}
                aria-label={`${nodeCollapsed ? text["展开子标题"] : text["折叠子标题"]} ${heading.label}`}
                title={`${nodeCollapsed ? text["展开子标题"] : text["折叠子标题"]} ${heading.label}`}
                onClick={() => toggleHeading(heading.id)}
              >
                {nodeCollapsed ? (
                  <ChevronRight size={13} aria-hidden="true" />
                ) : (
                  <ChevronDown size={13} aria-hidden="true" />
                )}
              </button>
            ) : null}
          </div>
          {heading.children.length && !nodeCollapsed ? (
            <ol className="biu-ui-anchor__nested">{renderNodes(heading.children)}</ol>
          ) : null}
        </li>
      );
    });

  const anchorNode = (
    <nav
      {...props}
      ref={anchorRef}
      className={cx(
        "biu-ui-anchor",
        `biu-ui-anchor--${mode}`,
        `biu-ui-anchor--${resolvedPosition}`,
        hideOnMobile && "biu-ui-anchor--hide-mobile",
        collapsed && "biu-ui-anchor--collapsed",
        draggable && mode === "fixed" && "biu-ui-anchor--draggable",
        dragPosition && "biu-ui-anchor--dragged",
        classNames?.root,
        className,
      )}
      dir={configuredDirection}
      aria-label={props["aria-label"] ?? text["目录"]}
      data-biu-component="anchor"
      data-biu-anchor-mode={mode}
      data-biu-anchor-position={position}
      style={{
        ...styleProp,
        ...(scrollViewportHeight
          ? ({ "--biu-anchor-max-height": `${scrollViewportHeight}px` } as React.CSSProperties)
          : {}),
        ...(dragPosition ? { left: dragPosition.left, right: "auto", top: dragPosition.top } : {}),
      }}
    >
      {showHeader ? (
        <div className={cx("biu-ui-anchor__header", classNames?.header)}>
          {title !== null ? (
            collapsible ? (
              <button
                type="button"
                className={cx("biu-ui-anchor__toggle", classNames?.toggle)}
                aria-expanded={!collapsed}
                aria-label={collapsed ? text["展开目录"] : text["折叠目录"]}
                title={collapsed ? text["展开目录"] : text["折叠目录"]}
                onClick={toggleCollapsed}
              >
                <span>{title ?? text["目录"]}</span>
                {collapsed ? (
                  <ChevronRight className="biu-ui-anchor__collapse-icon" size={14} aria-hidden="true" />
                ) : (
                  <ChevronDown className="biu-ui-anchor__collapse-icon" size={14} aria-hidden="true" />
                )}
              </button>
            ) : (
              <span className="biu-ui-anchor__title">{title ?? text["目录"]}</span>
            )
          ) : null}
          {mode === "fixed" && (draggable || closable) ? (
            <div className={cx("biu-ui-anchor__actions", classNames?.actions)}>
              {draggable ? (
                <button
                  type="button"
                  className={cx("biu-ui-anchor__action", "biu-ui-anchor__drag-handle", classNames?.dragHandle)}
                  aria-label={text["拖动目录"]}
                  aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown"
                  title={text["拖动目录"]}
                  onKeyDown={handleDragKeyDown}
                  onPointerDown={handleDragStart}
                  onPointerMove={handleDragMove}
                  onPointerUp={handleDragEnd}
                  onPointerCancel={handleDragEnd}
                  onLostPointerCapture={handleDragEnd}
                >
                  <Move size={14} aria-hidden="true" />
                </button>
              ) : null}
              {closable ? (
                <button
                  type="button"
                  className={cx("biu-ui-anchor__action", "biu-ui-anchor__close", classNames?.closeButton)}
                  aria-label={text["关闭目录"]}
                  title={text["关闭目录"]}
                  onClick={handleClose}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
      <ol className={cx("biu-ui-anchor__list", classNames?.list)} aria-hidden={collapsed}>
        {renderNodes(headingTree)}
      </ol>
    </nav>
  );
  return portalHost && mode === "fixed" && draggable ? createPortal(anchorNode, portalHost) : anchorNode;
}

export { ScrollProgress } from "./progress.js";
export type { ScrollProgressClassNames, ScrollProgressPosition, ScrollProgressProps } from "./progress.js";
