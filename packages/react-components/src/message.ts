import {
  getBiuComponentsLocaleText,
  type BiuComponentsLocale,
  type BiuComponentsLocaleTextOverrides,
} from "./locale/index.js";

export type BiuMessageType = "success" | "info" | "warning" | "error" | "primary" | "default";
export interface BiuMessageAction {
  label: string;
  onClick: () => void;
  /** The built-in icon currently supported by the framework-neutral message host. */
  icon?: "refresh";
}
export interface BiuMessageOptions {
  type?: BiuMessageType;
  duration?: number;
  id?: string;
  closable?: boolean;
  locale?: BiuComponentsLocale;
  localeText?: BiuComponentsLocaleTextOverrides;
  closeText?: string;
  className?: string;
  /** Opt into the filled semantic surface; the default stays minimal. */
  complex?: boolean;
  /** Optional independent action rendered before the fixed right-side close button. */
  action?: BiuMessageAction;
  /** Allow this fixed message to be moved within the viewport by dragging its content. */
  draggable?: boolean;
}
let sequence = 0;
const active = new Map<string, HTMLElement>();
function host() {
  if (typeof document === "undefined") return undefined;
  let element = document.querySelector<HTMLElement>("[data-biu-message-host]");
  if (!element) {
    element = document.createElement("div");
    element.dataset.biuMessageHost = "true";
    document.body.appendChild(element);
  }
  return element;
}
function close(id: string) {
  const element = active.get(id);
  if (!element) return;
  active.delete(id);
  element.classList.add("biu-message-leaving");
  window.setTimeout(() => element.remove(), 160);
}

function createMessageIcon(type: BiuMessageType) {
  const icon = document.createElement("span");
  icon.className = "biu-message__icon";
  icon.setAttribute("aria-hidden", "true");
  const markup =
    type === "success"
      ? '<svg viewBox="0 0 24 24" focusable="false"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="m8 12 2.6 2.6L16.5 9" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>'
      : type === "warning"
        ? '<svg viewBox="0 0 24 24" focusable="false"><path d="m12 4 9 16H3L12 4Z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="2"/><path d="M12 9v5m0 3h.01" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2"/></svg>'
        : type === "error"
          ? '<svg viewBox="0 0 24 24" focusable="false"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="m9 9 6 6m0-6-6 6" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2"/></svg>'
          : '<svg viewBox="0 0 24 24" focusable="false"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 10v6m0-9h.01" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2"/></svg>';
  icon.innerHTML = markup;
  return icon;
}

function createRefreshIcon() {
  const icon = document.createElement("span");
  icon.className = "biu-message__action-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.innerHTML =
    '<svg viewBox="0 0 24 24" focusable="false"><path d="M20 11a8 8 0 0 0-14.7-4L4 9m0 0V4m0 5h5M4 13a8 8 0 0 0 14.7 4L20 15m0 0v5m0-5h-5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>';
  return icon;
}

function show(content: string, options: BiuMessageOptions = {}) {
  const container = host();
  if (!container) return "";
  const id = options.id ?? `biu-message-${Date.now()}-${sequence++}`;
  const type = options.type ?? "info";
  const element = document.createElement("div");
  element.id = id;
  const normalizedType = type === "primary" || type === "default" ? "info" : type;
  element.className = [
    "biu-message",
    `biu-message-${type}`,
    options.complex && "biu-message--complex",
    options.draggable && "biu-message--draggable",
    options.className,
  ]
    .filter(Boolean)
    .join(" ");
  element.dataset.biuMessageType = type;
  if (options.draggable) {
    let offset = { x: 0, y: 0 };
    let drag: { pointerId: number; startX: number; startY: number; startOffset: { x: number; y: number } } | undefined;
    element.onpointerdown = (event) => {
      if (event.button !== 0) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("button, a, input, textarea, select, [role='button']")) return;
      drag = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, startOffset: offset };
      element.setPointerCapture?.(event.pointerId);
    };
    element.onpointermove = (event) => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      const rect = element.getBoundingClientRect();
      const baseLeft = rect.left - drag.startOffset.x;
      const baseTop = rect.top - drag.startOffset.y;
      const padding = 8;
      const nextX = drag.startOffset.x + event.clientX - drag.startX;
      const nextY = drag.startOffset.y + event.clientY - drag.startY;
      offset = {
        x: Math.min(Math.max(padding - baseLeft, nextX), window.innerWidth - rect.width - padding - baseLeft),
        y: Math.min(Math.max(padding - baseTop, nextY), window.innerHeight - rect.height - padding - baseTop),
      };
      element.style.transform = `translate(${offset.x}px, ${offset.y}px)`;
    };
    const endDrag = (event: PointerEvent) => {
      if (drag?.pointerId === event.pointerId) drag = undefined;
    };
    element.onpointerup = endDrag;
    element.onpointercancel = endDrag;
  }
  element.setAttribute("role", normalizedType === "error" ? "alert" : "status");
  element.appendChild(createMessageIcon(type));
  const contentNode = document.createElement("span");
  contentNode.className = "biu-message__content";
  contentNode.textContent = content;
  element.appendChild(contentNode);
  if (options.action) {
    const action = document.createElement("button");
    action.type = "button";
    action.className = "biu-message__action biu-message__action--primary biu-message__action--outlined";
    action.setAttribute("aria-label", options.action.label);
    action.title = options.action.label;
    if (options.action.icon === "refresh") action.appendChild(createRefreshIcon());
    else action.textContent = options.action.label;
    action.onclick = () => {
      close(id);
      options.action?.onClick();
    };
    element.appendChild(action);
  }
  if (options.closable !== false) {
    const text = options.closeText ?? getBiuComponentsLocaleText(options.locale, options.localeText)["关闭"];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "biu-message__close";
    button.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m7 7 10 10M17 7 7 17" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2"/></svg>';
    button.setAttribute("aria-label", text);
    button.title = text;
    button.onclick = () => close(id);
    element.appendChild(button);
  }
  container.appendChild(element);
  active.set(id, element);
  const duration = options.duration ?? 3200;
  if (duration > 0) window.setTimeout(() => close(id), duration);
  return id;
}
export const message = {
  show,
  success: (content: string, options?: Omit<BiuMessageOptions, "type">) =>
    show(content, { ...options, type: "success" }),
  info: (content: string, options?: Omit<BiuMessageOptions, "type">) => show(content, { ...options, type: "info" }),
  primary: (content: string, options?: Omit<BiuMessageOptions, "type">) =>
    show(content, { ...options, type: "primary" }),
  default: (content: string, options?: Omit<BiuMessageOptions, "type">) =>
    show(content, { ...options, type: "default" }),
  warning: (content: string, options?: Omit<BiuMessageOptions, "type">) =>
    show(content, { ...options, type: "warning" }),
  error: (content: string, options?: Omit<BiuMessageOptions, "type">) => show(content, { ...options, type: "error" }),
  close,
  clear: () => [...active.keys()].forEach(close),
};
