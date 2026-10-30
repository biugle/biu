export function mockPageFilterWidth(width: number | (() => number), actionWidth: number | (() => number) = 0) {
  const original = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = function () {
    const rect = original.call(this);
    if (this.hasAttribute("data-biu-page-filter-actions")) {
      const measuredActionWidth = typeof actionWidth === "function" ? actionWidth() : actionWidth;
      return {
        x: rect.x,
        y: rect.y,
        width: measuredActionWidth,
        height: rect.height,
        top: rect.top,
        right: rect.left + measuredActionWidth,
        bottom: rect.bottom,
        left: rect.left,
        toJSON: () => ({}),
      } as DOMRect;
    }
    if (!this.classList.contains("biu-pro-page-filter__fields")) return rect;
    const measuredWidth = typeof width === "function" ? width() : width;
    return {
      x: rect.x,
      y: rect.y,
      width: measuredWidth,
      height: rect.height,
      top: rect.top,
      right: rect.left + measuredWidth,
      bottom: rect.bottom,
      left: rect.left,
      toJSON: () => ({}),
    } as DOMRect;
  };
  return () => {
    HTMLElement.prototype.getBoundingClientRect = original;
  };
}
