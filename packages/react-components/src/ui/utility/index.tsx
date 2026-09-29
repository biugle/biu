import * as React from "react";
import { Bell, Image as ImageIcon, LoaderCircle, X } from "@biugle/icons";
import { cx } from "../../shared/utils.js";

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  ellipsis?: boolean;
  strong?: boolean;
  muted?: boolean;
  color?: "primary" | "success" | "warning" | "error" | "default" | string;
}

export function Typography({
  as: Component = "span",
  ellipsis = false,
  strong = false,
  muted = false,
  color,
  style,
  className,
  ...props
}: TypographyProps) {
  const semanticColor = color === "primary" || color === "success" || color === "warning" || color === "error" || color === "default";
  return (
    <Component
      {...props}
      className={cx(
        "biu-ui-typography",
        ellipsis && "biu-ui-typography--ellipsis",
        strong && "biu-ui-typography--strong",
        muted && "biu-ui-typography--muted",
        semanticColor && `biu-ui-typography--${color}`,
        className,
      )}
      style={{ ...style, ...(!semanticColor && color ? { color } : {}) }}
    />
  );
}

export interface TitleProps extends Omit<TypographyProps, "as"> {
  level?: 1 | 2 | 3 | 4 | 5;
}

export function Title({ level = 3, ...props }: TitleProps) {
  return <Typography {...props} as={`h${level}`} className={cx("biu-ui-typography__title", props.className)} />;
}

export function Paragraph(props: TypographyProps) {
  return <Typography {...props} as="p" className={cx("biu-ui-typography__paragraph", props.className)} />;
}

export interface SpaceProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "horizontal" | "vertical";
  size?: number | string | "small" | "middle" | "large";
  align?: React.CSSProperties["alignItems"];
  wrap?: boolean;
  split?: React.ReactNode;
}

const spaceSizes = { small: 8, middle: 12, large: 16 } as const;

function resolveSpaceSize(size: SpaceProps["size"]) {
  if (typeof size === "number") return `${size}px`;
  if (size === "small" || size === "middle" || size === "large") return `${spaceSizes[size]}px`;
  return size ?? "8px";
}

export function Space({
  direction = "horizontal",
  size = "small",
  align = "center",
  wrap = false,
  split,
  children,
  style,
  className,
  ...props
}: SpaceProps) {
  const items = React.Children.toArray(children);
  const gap = resolveSpaceSize(size);
  return (
    <div
      {...props}
      className={cx("biu-ui-space", `biu-ui-space--${direction}`, wrap && "biu-ui-space--wrap", className)}
      style={{ gap, alignItems: align, ...style }}
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && split ? <span className="biu-ui-space__split">{split}</span> : null}
          <span className="biu-ui-space__item">{item}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

export interface ListProps<T = React.ReactNode> extends React.HTMLAttributes<HTMLDivElement> {
  dataSource?: T[];
  renderItem?: (item: T, index: number) => React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  bordered?: boolean;
  size?: "small" | "default" | "large";
}

export function List<T = React.ReactNode>({
  dataSource = [],
  renderItem,
  header,
  footer,
  bordered = false,
  size = "default",
  className,
  ...props
}: ListProps<T>) {
  return (
    <div {...props} className={cx("biu-ui-list", `biu-ui-list--${size}`, bordered && "biu-ui-list--bordered", className)}>
      {header !== undefined ? <div className="biu-ui-list__header">{header}</div> : null}
      <div className="biu-ui-list__items">
        {dataSource.map((item, index) => (
          <div className="biu-ui-list__item" key={index}>
            {renderItem ? renderItem(item, index) : (item as React.ReactNode)}
          </div>
        ))}
      </div>
      {footer !== undefined ? <div className="biu-ui-list__footer">{footer}</div> : null}
    </div>
  );
}

export interface ColorPickerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  showText?: boolean;
  presets?: string[];
  disabled?: boolean;
}

export function ColorPicker({
  value,
  defaultValue = "#2563eb",
  onChange,
  showText = true,
  presets = [],
  disabled = false,
  className,
  ...props
}: ColorPickerProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const current = value ?? internalValue;
  const update = (next: string) => {
    if (value === undefined) setInternalValue(next);
    onChange?.(next);
  };
  return (
    <div {...props} className={cx("biu-ui-color-picker", disabled && "is-disabled", className)}>
      <button
        type="button"
        className="biu-ui-color-picker__trigger"
        aria-label="选择颜色"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        <span className="biu-ui-color-picker__swatch" style={{ backgroundColor: current }} aria-hidden="true" />
        {showText ? <span>{current}</span> : null}
      </button>
      <input
        ref={inputRef}
        className="biu-ui-color-picker__input"
        type="color"
        value={current}
        disabled={disabled}
        onChange={(event) => update(event.target.value)}
      />
      {presets.length > 0 ? (
        <div className="biu-ui-color-picker__presets" aria-label="预设颜色">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              className={cx("biu-ui-color-picker__preset", preset === current && "is-active")}
              aria-label={preset}
              style={{ backgroundColor: preset }}
              disabled={disabled}
              onClick={() => update(preset)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export interface ContextMenuItem {
  key: React.Key;
  label: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}

export interface ContextMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  items: ContextMenuItem[];
}

export function ContextMenu({ items, children, className, onContextMenu, ...props }: ContextMenuProps) {
  const [position, setPosition] = React.useState<{ x: number; y: number } | null>(null);
  React.useEffect(() => {
    if (!position) return;
    const close = () => setPosition(null);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [position]);
  return (
    <div
      {...props}
      className={cx("biu-ui-context-menu__target", className)}
      onPointerDown={(event) => {
        if (position && !(event.target as HTMLElement).closest(".biu-ui-context-menu")) setPosition(null);
      }}
      onClick={(event) => {
        if (position && !(event.target as HTMLElement).closest(".biu-ui-context-menu")) setPosition(null);
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        setPosition({ x: event.clientX, y: event.clientY });
        onContextMenu?.(event);
      }}
    >
      {children}
      {position ? (
        <div
          className="biu-ui-context-menu"
          role="menu"
          style={{ left: position.x, top: position.y }}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                if (item.disabled) return;
                item.onClick?.();
                setPosition(null);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export interface TimelineItem {
  key?: React.Key;
  title?: React.ReactNode;
  content?: React.ReactNode;
  time?: React.ReactNode;
  color?: "primary" | "success" | "warning" | "error" | "default" | string;
  dot?: React.ReactNode;
}
export interface TimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  items?: TimelineItem[];
  mode?: "left" | "right" | "alternate";
  direction?: "vertical" | "horizontal";
  pending?: React.ReactNode;
  reverse?: boolean;
}
export function Timeline({
  items = [],
  mode = "left",
  direction = "vertical",
  pending,
  reverse = false,
  className,
  ...props
}: TimelineProps) {
  const values = reverse ? [...items].reverse() : items;
  return (
    <div
      {...props}
      className={cx("biu-ui-timeline", `biu-ui-timeline--${mode}`, `biu-ui-timeline--${direction}`, className)}
    >
      {values.map((item, index) => (
        <div
          className={cx("biu-ui-timeline__item", `biu-ui-timeline__item--${item.color ?? "primary"}`)}
          key={item.key ?? index}
        >
          <span className="biu-ui-timeline__rail" aria-hidden="true">
            <span className="biu-ui-timeline__dot">{item.dot}</span>
          </span>
          <div className="biu-ui-timeline__body">
            {item.title ? <strong>{item.title}</strong> : null}
            {item.content ? <div>{item.content}</div> : null}
          </div>
          {item.time ? <time className="biu-ui-timeline__time">{item.time}</time> : null}
        </div>
      ))}
      {pending ? (
        <div className={cx("biu-ui-timeline__pending", `biu-ui-timeline__pending--${direction}`)}>
          <span className="biu-ui-timeline__dot" aria-hidden="true" />
          {pending}
        </div>
      ) : null}
    </div>
  );
}

export interface SpinProps extends React.HTMLAttributes<HTMLDivElement> {
  spinning?: boolean;
  tip?: React.ReactNode;
  size?: "small" | "default" | "large";
  fullscreen?: boolean;
}
export function Spin({
  spinning = true,
  tip,
  size = "default",
  fullscreen = false,
  children,
  className,
  ...props
}: SpinProps) {
  const indicator = (
    <span className="biu-ui-spin__indicator" aria-hidden="true">
      <LoaderCircle />
    </span>
  );
  if (!children)
    return spinning ? (
      <div
        {...props}
        className={cx("biu-ui-spin", `biu-ui-spin--${size}`, fullscreen && "biu-ui-spin--fullscreen", className)}
        role="status"
      >
        {indicator}
        {tip ? <span className="biu-ui-spin__tip">{tip}</span> : null}
      </div>
    ) : null;
  return (
    <div {...props} className={cx("biu-ui-spin__container", className)}>
      {children}
      {spinning ? (
        <div className={cx("biu-ui-spin", `biu-ui-spin--${size}`)} role="status">
          {indicator}
          {tip ? <span className="biu-ui-spin__tip">{tip}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

export interface ImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "loading"> {
  width?: number | string;
  height?: number | string;
  lazy?: boolean;
  preview?: boolean;
  fallback?: React.ReactNode;
  placeholder?: React.ReactNode;
  objectFit?: React.CSSProperties["objectFit"];
}
export function Image({
  lazy = false,
  preview = false,
  fallback,
  placeholder,
  objectFit = "cover",
  width,
  height,
  src,
  alt = "",
  className,
  style,
  onError,
  onLoad,
  ...props
}: ImageProps) {
  const [state, setState] = React.useState<"loading" | "loaded" | "error">(lazy ? "loading" : "loaded");
  const [open, setOpen] = React.useState(false);
  const img =
    state === "error" ? (
      (fallback ?? <ImageIcon size={28} />)
    ) : (
      <img
        {...props}
        src={src}
        alt={alt}
        loading={lazy ? "lazy" : "eager"}
        width={width}
        height={height}
        className={className}
        style={{ objectFit, ...style }}
        onLoad={(event) => {
          setState("loaded");
          onLoad?.(event);
        }}
        onError={(event) => {
          setState("error");
          onError?.(event);
        }}
      />
    );
  return (
    <>
      <span
        className={cx("biu-ui-image", preview && "biu-ui-image--preview", state === "loading" && "is-loading")}
        style={{ width, height }}
        onClick={() => preview && state === "loaded" && setOpen(true)}
      >
        {state === "loading" ? (
          <span className="biu-ui-image__placeholder">
            {placeholder ?? <LoaderCircle className="biu-ui-image__loading" size={22} />}
          </span>
        ) : null}
        {img}
      </span>
      {open ? (
        <div className="biu-ui-image__lightbox" role="dialog" aria-label={alt} onClick={() => setOpen(false)}>
          <button type="button" aria-label="关闭" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
          <img src={src} alt={alt} style={{ objectFit: "contain" }} />
        </div>
      ) : null}
    </>
  );
}

export interface NotificationOptions {
  title?: React.ReactNode;
  description?: React.ReactNode;
  type?: "info" | "success" | "warning" | "error";
  duration?: number;
  closable?: boolean;
}
export interface NotificationProps extends NotificationOptions {
  onClose?: () => void;
}
export function Notification({
  title,
  description,
  type = "info",
  duration = 4500,
  closable = true,
  onClose,
}: NotificationProps) {
  React.useEffect(() => {
    if (duration <= 0) return;
    const timer = window.setTimeout(() => onClose?.(), duration);
    return () => window.clearTimeout(timer);
  }, [duration, onClose]);
  return (
    <div
      className={cx("biu-ui-notification", `biu-ui-notification--${type}`)}
      role={type === "error" ? "alert" : "status"}
    >
      <span className="biu-ui-notification__icon">
        <Bell size={17} />
      </span>
      <div className="biu-ui-notification__body">
        {title ? <strong>{title}</strong> : null}
        {description ? <div>{description}</div> : null}
      </div>
      {closable ? (
        <button type="button" aria-label="关闭" onClick={onClose}>
          <X size={15} />
        </button>
      ) : null}
    </div>
  );
}

const notificationHandles = new Set<{ close: () => void }>();
function openNotification(options: NotificationOptions = {}) {
  if (typeof document === "undefined") return { close: () => undefined };
  const host =
    document.querySelector<HTMLElement>("[data-biu-notification-host]") ??
    (() => {
      const node = document.createElement("div");
      node.dataset.biuNotificationHost = "true";
      document.body.appendChild(node);
      return node;
    })();
  const root = document.createElement("div");
  host.appendChild(root);
  const close = () => {
    root.remove();
    notificationHandles.delete(handle);
  };
  const handle = { close };
  notificationHandles.add(handle);
  import("react-dom/client").then(({ createRoot }) => {
    const app = createRoot(root);
    app.render(
      <Notification
        {...options}
        onClose={() => {
          app.unmount();
          close();
        }}
      />,
    );
  });
  return handle;
}
export const notification = {
  open: openNotification,
  info: (description: React.ReactNode, options?: Omit<NotificationOptions, "description" | "type">) =>
    openNotification({ ...options, description, type: "info" }),
  success: (description: React.ReactNode, options?: Omit<NotificationOptions, "description" | "type">) =>
    openNotification({ ...options, description, type: "success" }),
  warning: (description: React.ReactNode, options?: Omit<NotificationOptions, "description" | "type">) =>
    openNotification({ ...options, description, type: "warning" }),
  error: (description: React.ReactNode, options?: Omit<NotificationOptions, "description" | "type">) =>
    openNotification({ ...options, description, type: "error" }),
  destroyAll: () => notificationHandles.forEach((item) => item.close()),
};

export interface AffixProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  offsetTop?: number;
  offsetBottom?: number;
  target?: () => HTMLElement | null;
  onChange?: (affixed: boolean) => void;
}
export function Affix({
  offsetTop = 0,
  offsetBottom,
  target,
  onChange,
  children,
  className,
  style,
  ...props
}: AffixProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [affixed, setAffixed] = React.useState(false);
  React.useEffect(() => {
    const scrollTarget = target?.() ?? window;
    const update = () => {
      const node = ref.current;
      if (!node) return;
      const next =
        offsetBottom === undefined
          ? node.getBoundingClientRect().top <= offsetTop
          : node.getBoundingClientRect().bottom >= window.innerHeight - offsetBottom;
      setAffixed((current) => {
        if (current !== next) onChange?.(next);
        return next;
      });
    };
    update();
    scrollTarget.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      scrollTarget.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [offsetBottom, offsetTop, onChange, target]);
  return (
    <div
      {...props}
      ref={ref}
      className={cx("biu-ui-affix", affixed && "is-affixed", className)}
      style={
        affixed
          ? {
              position: "fixed",
              top: offsetBottom === undefined ? offsetTop : undefined,
              bottom: offsetBottom,
              ...style,
            }
          : style
      }
    >
      {children}
    </div>
  );
}

export interface ResizeBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: number;
  height?: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  resize?: "width" | "height" | "both";
  onResize?: (size: { width: number; height: number }) => void;
}
export function ResizeBox({
  width = 320,
  height = 180,
  minWidth = 120,
  maxWidth = 1200,
  minHeight = 80,
  maxHeight = 900,
  resize = "both",
  onResize,
  children,
  style,
  className,
  ...props
}: ResizeBoxProps) {
  const [size, setSize] = React.useState({ width, height });
  const start = React.useRef<{ x: number; y: number; width: number; height: number } | undefined>(undefined);
  const move = React.useCallback(
    (event: PointerEvent) => {
      if (!start.current) return;
      const next = {
        width:
          resize === "height"
            ? start.current.width
            : Math.min(maxWidth, Math.max(minWidth, start.current.width + event.clientX - start.current.x)),
        height:
          resize === "width"
            ? start.current.height
            : Math.min(maxHeight, Math.max(minHeight, start.current.height + event.clientY - start.current.y)),
      };
      setSize(next);
      onResize?.(next);
    },
    [maxHeight, maxWidth, minHeight, minWidth, onResize, resize],
  );
  const stop = React.useCallback(() => {
    start.current = undefined;
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", stop);
  }, [move]);
  const begin = (event: React.PointerEvent) => {
    event.preventDefault();
    start.current = { x: event.clientX, y: event.clientY, ...size };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  };
  React.useEffect(() => stop, [stop]);
  return (
    <div
      {...props}
      className={cx("biu-ui-resize-box", className)}
      style={{ width: size.width, height: size.height, ...style }}
    >
      <div className="biu-ui-resize-box__content">{children}</div>
      <span
        className={cx("biu-ui-resize-box__handle", `biu-ui-resize-box__handle--${resize}`)}
        onPointerDown={begin}
        aria-hidden="true"
      />
    </div>
  );
}
