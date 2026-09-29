export interface WatermarkOptions {
  text?: string | string[];
  color?: string;
  opacity?: number;
  fontSize?: number;
  fontFamily?: string;
  rotate?: number;
  gap?: [number, number];
  offset?: [number, number];
  zIndex?: number;
  className?: string;
  observeTamper?: boolean;
  refreshThrottleMs?: number;
}

export interface WatermarkHandle {
  update: (next: Partial<WatermarkOptions>) => void;
  refresh: () => void;
  destroy: () => void;
}

function escapeXml(value: string) {
  return value.replace(
    /[<>&'"]/g,
    (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[character] ?? character,
  );
}

function createDataUri(options: WatermarkOptions) {
  const lines = Array.isArray(options.text) ? options.text : [options.text ?? "Biu"];
  const fontSize = Math.max(8, options.fontSize ?? 14);
  const gap = options.gap ?? [100, 80];
  const width = Math.max(220, Math.round(fontSize * 10 + gap[0]));
  const height = Math.max(120, Math.round(fontSize * Math.max(2, lines.length) + gap[1]));
  const opacity = Math.min(1, Math.max(0, options.opacity ?? 0.16));
  const text = lines
    .map(
      (line, index) =>
        `<text x="${gap[0] / 2}" y="${fontSize * (index + 1) + gap[1] / 2}" fill="${escapeXml(options.color ?? "#64748b")}" fill-opacity="${opacity}" font-family="${escapeXml(options.fontFamily ?? "Arial, sans-serif")}" font-size="${fontSize}">${escapeXml(line)}</text>`,
    )
    .join("");
  const rotate = options.rotate ?? -22;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><g transform="rotate(${rotate} ${width / 2} ${height / 2})">${text}</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function createWatermark(target: HTMLElement, initial: WatermarkOptions = {}): WatermarkHandle {
  let options = { ...initial };
  const node = document.createElement("div");
  const refreshThrottleMs = Math.max(100, options.refreshThrottleMs ?? 500);
  let refreshTimer: ReturnType<typeof setTimeout> | undefined;
  let destroyed = false;
  node.className = ["biu-watermark", options.className].filter(Boolean).join(" ");
  node.setAttribute("aria-hidden", "true");
  node.dataset.biuComponent = "watermark";
  const computedPosition = getComputedStyle(target).position || "static";
  const shouldRestorePosition = computedPosition === "static" && target.style.position === "";
  const ensureAttached = () => {
    if (!target.contains(node)) target.appendChild(node);
  };
  const render = () => {
    if (destroyed) return;
    ensureAttached();
    node.style.position = "absolute";
    node.style.inset = "0";
    node.style.zIndex = String(options.zIndex ?? 10);
    node.style.pointerEvents = "none";
    node.style.backgroundImage = createDataUri(options);
    node.style.backgroundRepeat = "repeat";
    const offset = options.offset ?? [0, 0];
    node.style.backgroundPosition = `${offset[0]}px ${offset[1]}px`;
    if ((getComputedStyle(target).position || "static") === "static") target.style.position = "relative";
  };
  const refresh = () => {
    if (destroyed) return;
    render();
  };
  const scheduleRefresh = () => {
    if (destroyed || refreshTimer !== undefined) return;
    refreshTimer = setTimeout(() => {
      refreshTimer = undefined;
      refresh();
    }, refreshThrottleMs);
  };
  render();
  const observer =
    options.observeTamper && typeof MutationObserver !== "undefined"
      ? new MutationObserver(() => {
          const expectedBackground = createDataUri(options);
          const tampered =
            !target.contains(node) ||
            node.style.backgroundImage !== expectedBackground ||
            node.style.pointerEvents !== "none" ||
            node.getAttribute("aria-hidden") !== "true";
          if (tampered) scheduleRefresh();
        })
      : undefined;
  observer?.observe(target, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class"] });
  return {
    update(next) {
      options = { ...options, ...next };
      node.className = ["biu-watermark", options.className].filter(Boolean).join(" ");
      refresh();
    },
    refresh() {
      refresh();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      if (refreshTimer !== undefined) clearTimeout(refreshTimer);
      refreshTimer = undefined;
      observer?.disconnect();
      node.remove();
      if (shouldRestorePosition) target.style.position = "";
    },
  };
}

export function applyWatermark(target: HTMLElement, options?: WatermarkOptions) {
  return createWatermark(target, options);
}
