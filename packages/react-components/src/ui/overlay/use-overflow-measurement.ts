import * as React from "react";

function isOverflowing(element: HTMLElement) {
  return element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1;
}

export function isTooltipOverflowing(host: HTMLElement) {
  // Detail values and table cells can clip a fitting Ellipsis child at an
  // overflow-hidden ancestor, so include the clipping box in the same check.
  return (
    [host, ...Array.from(host.querySelectorAll<HTMLElement>("*"))].some(isOverflowing) || hasOverflowingAncestor(host)
  );
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

// Ellipsis appears in dense tables, so observers and resize listeners are
// shared package-wide and released when the last subscriber unmounts.
const windowResizeSubscribers = new Set<() => void>();
let windowResizeBound = false;
const elementResizeSubscribers = new Map<Element, Set<() => void>>();
let sharedResizeObserver: ResizeObserver | undefined;
let elementResizeFrame: number | undefined;
const pendingResizeElements = new Set<Element>();
const elementVisibilitySubscribers = new Map<Element, Set<(visible: boolean) => void>>();
let sharedIntersectionObserver: IntersectionObserver | undefined;

function notifyWindowResize() {
  // Keep the shared listener synchronous so resize-driven overflow state keeps
  // the same immediate update contract as the original per-instance listener.
  [...windowResizeSubscribers].forEach((listener) => listener());
}

function subscribeWindowResize(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  windowResizeSubscribers.add(listener);
  if (!windowResizeBound) {
    window.addEventListener("resize", notifyWindowResize);
    windowResizeBound = true;
  }
  return () => {
    windowResizeSubscribers.delete(listener);
    if (!windowResizeSubscribers.size && windowResizeBound) {
      window.removeEventListener("resize", notifyWindowResize);
      windowResizeBound = false;
    }
  };
}

function subscribeElementResize(element: Element, listener: () => void) {
  if (typeof ResizeObserver === "undefined") return () => undefined;
  if (!sharedResizeObserver) {
    sharedResizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => pendingResizeElements.add(entry.target));
      if (elementResizeFrame !== undefined) return;
      const run = () => {
        elementResizeFrame = undefined;
        const elements = [...pendingResizeElements];
        pendingResizeElements.clear();
        elements.forEach((element) => {
          [...(elementResizeSubscribers.get(element) ?? [])].forEach((subscriber) => subscriber());
        });
      };
      if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
        elementResizeFrame = window.requestAnimationFrame(run);
      } else if (typeof window !== "undefined") {
        elementResizeFrame = window.setTimeout(run, 0);
      } else {
        run();
      }
    });
  }
  const subscribers = elementResizeSubscribers.get(element) ?? new Set<() => void>();
  subscribers.add(listener);
  elementResizeSubscribers.set(element, subscribers);
  sharedResizeObserver.observe(element);
  return () => {
    const current = elementResizeSubscribers.get(element);
    current?.delete(listener);
    if (current && !current.size) {
      elementResizeSubscribers.delete(element);
      sharedResizeObserver?.unobserve?.(element);
    }
    if (!elementResizeSubscribers.size) {
      pendingResizeElements.clear();
      if (elementResizeFrame !== undefined && typeof window !== "undefined") {
        if (typeof window.cancelAnimationFrame === "function") window.cancelAnimationFrame(elementResizeFrame);
        else window.clearTimeout(elementResizeFrame);
        elementResizeFrame = undefined;
      }
      sharedResizeObserver?.disconnect();
      sharedResizeObserver = undefined;
    }
  };
}

function subscribeElementVisibility(element: Element, listener: (visible: boolean) => void) {
  if (typeof IntersectionObserver === "undefined") return undefined;
  if (!sharedIntersectionObserver) {
    sharedIntersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        [...(elementVisibilitySubscribers.get(entry.target) ?? [])].forEach((subscriber) =>
          subscriber(entry.isIntersecting || entry.intersectionRatio > 0),
        );
      });
    });
  }
  const subscribers = elementVisibilitySubscribers.get(element) ?? new Set<(visible: boolean) => void>();
  subscribers.add(listener);
  elementVisibilitySubscribers.set(element, subscribers);
  sharedIntersectionObserver.observe(element);
  return () => {
    const current = elementVisibilitySubscribers.get(element);
    current?.delete(listener);
    if (current && !current.size) {
      elementVisibilitySubscribers.delete(element);
      sharedIntersectionObserver?.unobserve?.(element);
    }
    if (!elementVisibilitySubscribers.size) {
      sharedIntersectionObserver?.disconnect();
      sharedIntersectionObserver = undefined;
    }
  };
}

export function useOverflowMeasurement(
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
    const next = isTooltipOverflowing(target);
    setOverflowed((current) => (current === next ? current : next));
  }, [enabled, targetRef]);

  React.useLayoutEffect(() => {
    if (!enabled || typeof window === "undefined") {
      update();
      return undefined;
    }
    const target = targetRef.current;
    if (!target) return undefined;
    let stopResizeSubscriptions = () => undefined;
    const startResizeSubscriptions = () => {
      stopResizeSubscriptions();
      const unsubscribeWindowResize = subscribeWindowResize(update);
      const resizeTargets = [target, target.parentElement].filter(
        (element, index, list): element is HTMLElement => Boolean(element) && list.indexOf(element) === index,
      );
      const unsubscribeElementResize = resizeTargets.map((element) => subscribeElementResize(element, update));
      stopResizeSubscriptions = () => {
        unsubscribeWindowResize();
        unsubscribeElementResize.forEach((unsubscribe) => unsubscribe());
        stopResizeSubscriptions = () => undefined;
      };
    };
    const visibilitySubscription = subscribeElementVisibility(target, (visible) => {
      if (visible) {
        update();
        startResizeSubscriptions();
      } else {
        stopResizeSubscriptions();
        setOverflowed(false);
      }
    });
    if (!visibilitySubscription) startResizeSubscriptions();
    return () => {
      visibilitySubscription?.();
      stopResizeSubscriptions();
    };
  }, [enabled, targetRef, update, ...dependencies]);

  return [overflowed, update] as const;
}
