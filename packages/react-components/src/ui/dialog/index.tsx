import * as React from "react";
import { createPortal } from "react-dom";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "@biugle/icons";
import { cx, mergeRefs, useControllableState, useIdPrefix } from "../../shared/utils.js";

export type DialogCloseReason = "trigger" | "escape" | "overlay" | "close" | "programmatic";

export interface DialogClassNames {
  root?: string;
  content?: string;
  overlay?: string;
  panel?: string;
  header?: string;
  body?: string;
  footer?: string;
  title?: string;
  description?: string;
  close?: string;
}

export interface DialogProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, reason?: DialogCloseReason) => void;
  modal?: boolean;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
  component?: "dialog" | "drawer";
  layer?: "ui" | "pro";
  position?: "center" | "top" | "bottom" | "left" | "right";
  offsetTop?: number | string;
  offsetLeft?: number | string;
  fullscreen?: boolean;
  /** Allow the dialog panel to be moved within the viewport by dragging non-interactive panel content. */
  draggable?: boolean;
  destroyOnClose?: boolean;
  container?: Element | null;
  classNames?: DialogClassNames;
}

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean, reason?: DialogCloseReason) => void;
  setPendingReason: (reason: DialogCloseReason) => void;
  triggerRef: React.MutableRefObject<HTMLButtonElement | null>;
  dialogId: string;
  contentId: string;
  titleId: string;
  descriptionId: string;
  modal: boolean;
  closeOnOverlayClick: boolean;
  closeOnEscape: boolean;
  component: "dialog" | "drawer";
  layer: "ui" | "pro";
  position: "center" | "top" | "bottom" | "left" | "right";
  fullscreen: boolean;
  draggable: boolean;
  destroyOnClose: boolean;
  container?: Element | null;
  rootClassName?: string;
  rootStyle?: React.CSSProperties;
  classNames?: DialogClassNames;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);
let modalLockCount = 0;
let previousBodyOverflow = "";

function useDialog() {
  const value = React.useContext(DialogContext);
  if (!value) throw new Error("Dialog parts must be used within Dialog");
  return value;
}

function useBodyScrollLock(open: boolean, modal: boolean) {
  React.useEffect(() => {
    if (!open || !modal || typeof document === "undefined") return undefined;
    if (modalLockCount === 0) previousBodyOverflow = document.body.style.overflow;
    modalLockCount += 1;
    document.body.style.overflow = "hidden";
    return () => {
      modalLockCount = Math.max(0, modalLockCount - 1);
      if (modalLockCount === 0) document.body.style.overflow = previousBodyOverflow;
    };
  }, [modal, open]);
}

export function Dialog({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  modal = true,
  closeOnEscape = true,
  closeOnOverlayClick = true,
  component = "dialog",
  layer = "ui",
  position = "center",
  offsetTop,
  offsetLeft,
  fullscreen = false,
  draggable = false,
  destroyOnClose = true,
  container,
  children,
  className,
  classNames,
  style,
  ...props
}: DialogProps) {
  const [open, setOpen] = useControllableState({ value: openProp, defaultValue: defaultOpen });
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const pendingReasonRef = React.useRef<DialogCloseReason | undefined>(undefined);
  const dialogId = useIdPrefix("biu-dialog-instance");
  const contentId = useIdPrefix("biu-dialog");
  const titleId = contentId + "-title";
  const descriptionId = contentId + "-description";

  useBodyScrollLock(open, modal);

  const setPendingReason = React.useCallback((reason: DialogCloseReason) => {
    pendingReasonRef.current = reason;
  }, []);

  const rootChange = React.useCallback(
    (next: boolean) => {
      const reason = pendingReasonRef.current ?? (next ? "trigger" : "programmatic");
      pendingReasonRef.current = undefined;
      setOpen(next);
      onOpenChange?.(next, reason);
    },
    [onOpenChange, setOpen],
  );

  const requestChange = React.useCallback(
    (next: boolean, reason: DialogCloseReason = "programmatic") => {
      pendingReasonRef.current = reason;
      setOpen(next);
      onOpenChange?.(next, reason);
    },
    [onOpenChange, setOpen],
  );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={rootChange} modal={modal}>
      <DialogContext.Provider
        value={{
          open,
          onOpenChange: requestChange,
          setPendingReason,
          triggerRef,
          dialogId,
          contentId,
          titleId,
          descriptionId,
          modal,
          closeOnOverlayClick,
          closeOnEscape,
          component,
          layer,
          position,
          fullscreen,
          draggable,
          destroyOnClose,
          container,
          rootClassName: className,
          rootStyle: {
            ...style,
            ...(offsetTop !== undefined
              ? { "--biu-dialog-offset-top": typeof offsetTop === "number" ? `${offsetTop}px` : offsetTop }
              : {}),
            ...(offsetLeft !== undefined
              ? { "--biu-dialog-offset-left": typeof offsetLeft === "number" ? `${offsetLeft}px` : offsetLeft }
              : {}),
          } as React.CSSProperties,
          classNames,
        }}
      >
        <div
          {...props}
          className={cx("biu-ui-dialog", classNames?.root, className)}
          style={
            {
              ...style,
              ...(offsetTop !== undefined
                ? { "--biu-dialog-offset-top": typeof offsetTop === "number" ? `${offsetTop}px` : offsetTop }
                : {}),
              ...(offsetLeft !== undefined
                ? { "--biu-dialog-offset-left": typeof offsetLeft === "number" ? `${offsetLeft}px` : offsetLeft }
                : {}),
            } as React.CSSProperties
          }
          data-biu-component={component}
          data-biu-layer={layer}
          data-state={open ? "open" : "closed"}
        >
          {children}
        </div>
      </DialogContext.Provider>
    </DialogPrimitive.Root>
  );
}

export const DialogTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  function DialogTrigger({ onClick, ...props }, ref) {
    const dialog = useDialog();
    return (
      <DialogPrimitive.Trigger asChild>
        <button
          {...props}
          ref={mergeRefs(ref, dialog.triggerRef)}
          type="button"
          aria-haspopup="dialog"
          data-biu-slot="dialog-trigger"
          onClick={(event) => {
            onClick?.(event);
            if (!event.defaultPrevented) dialog.setPendingReason("trigger");
          }}
        />
      </DialogPrimitive.Trigger>
    );
  },
);

export function DialogPortal({
  children,
  container,
  forceMount = false,
}: {
  children: React.ReactNode;
  container?: Element | null;
  forceMount?: boolean;
}) {
  // Radix's Portal intentionally waits for its layout effect before resolving
  // the default body container.  That is ideal for hydration, but it also
  // means a controlled open dialog can be absent for the first render in a
  // test/SSR-like document.  Resolve the same body container synchronously;
  // Radix still owns Content, focus scope, dismiss and collision behavior.
  if (typeof document === "undefined") return <>{children}</>;
  const host = container ?? document.body;
  if (!host) return <>{children}</>;
  void forceMount;
  return createPortal(children, host);
}

export const DialogOverlay = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function DialogOverlay({ className, onClick, ...props }, ref) {
    const dialog = useDialog();
    return (
      <DialogPrimitive.Overlay asChild>
        <div
          {...props}
          ref={ref}
          className={cx("biu-ui-dialog__overlay", dialog.classNames?.overlay, className)}
          data-biu-component={dialog.component}
          data-biu-layer={dialog.layer}
          data-biu-slot="dialog-overlay"
          data-state={dialog.open ? "open" : "closed"}
          onClick={(event) => {
            onClick?.(event);
            if (!event.defaultPrevented && dialog.closeOnOverlayClick) {
              dialog.setPendingReason("overlay");
              dialog.onOpenChange(false, "overlay");
            }
          }}
        />
      </DialogPrimitive.Overlay>
    );
  },
);

export const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
    Pick<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>, "onEscapeKeyDown" | "onPointerDownOutside"> & {
      forceMount?: boolean;
      panelClassName?: string;
      panelStyle?: React.CSSProperties;
    }
>(function DialogContent(
  {
    className,
    children,
    forceMount = false,
    panelClassName,
    panelStyle,
    onEscapeKeyDown,
    onPointerDownOutside,
    style,
    ...props
  },
  ref,
) {
  const dialog = useDialog();
  const [dragOffset, setDragOffset] = React.useState<{ x: number; y: number }>();
  const dragRef = React.useRef<
    | {
        pointerId: number;
        startX: number;
        startY: number;
        startOffset: { x: number; y: number };
      }
    | undefined
  >(undefined);
  const shouldForceMount = forceMount || !dialog.destroyOnClose;
  if (!dialog.open && !shouldForceMount) return null;
  const handleDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dialog.draggable || dialog.fullscreen || event.button !== 0) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest("button, input, textarea, select, a, [role='button'], [data-biu-dialog-no-drag='true']"))
      return;
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
    const baseLeft = rect.left - drag.startOffset.x;
    const baseTop = rect.top - drag.startOffset.y;
    const padding = 8;
    const nextX = drag.startOffset.x + event.clientX - drag.startX;
    const nextY = drag.startOffset.y + event.clientY - drag.startY;
    setDragOffset({
      x: Math.min(Math.max(padding - baseLeft, nextX), window.innerWidth - rect.width - padding - baseLeft),
      y: Math.min(Math.max(padding - baseTop, nextY), window.innerHeight - rect.height - padding - baseTop),
    });
  };
  const handleDragEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = undefined;
  };
  const content = (
    <div
      ref={ref}
      className={cx(
        "biu-ui-dialog__content",
        `biu-ui-dialog__content--${dialog.position}`,
        dialog.fullscreen && "biu-ui-dialog__content--fullscreen",
        dialog.rootClassName,
        dialog.classNames?.content,
        className,
      )}
      style={{ ...dialog.rootStyle, ...style }}
      data-biu-component={dialog.component}
      data-biu-layer={dialog.layer}
      data-biu-slot="dialog-content"
      data-state={dialog.open ? "open" : "closed"}
    >
      <DialogPrimitive.Overlay asChild>
        <div
          className={cx("biu-ui-dialog__overlay", dialog.classNames?.overlay)}
          data-biu-component={dialog.component}
          data-biu-layer={dialog.layer}
          data-biu-slot="dialog-overlay"
          data-state={dialog.open ? "open" : "closed"}
          onClick={(event) => {
            if (dialog.closeOnOverlayClick && event.target === event.currentTarget) dialog.setPendingReason("overlay");
            if (dialog.closeOnOverlayClick && event.target === event.currentTarget) {
              dialog.onOpenChange(false, "overlay");
            }
          }}
        />
      </DialogPrimitive.Overlay>
      <DialogPrimitive.Content
        {...props}
        asChild
        id={dialog.contentId}
        forceMount={shouldForceMount ? true : undefined}
        aria-labelledby={dialog.titleId}
        aria-describedby={dialog.descriptionId}
        className={cx("biu-ui-dialog__panel", dialog.classNames?.panel, panelClassName)}
        style={{
          ...panelStyle,
          ...(dragOffset ? { transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)` } : {}),
        }}
        data-biu-dialog-draggable={dialog.draggable ? "true" : undefined}
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
        onEscapeKeyDown={(event) => {
          onEscapeKeyDown?.(event);
          if (!event.defaultPrevented && dialog.closeOnEscape) dialog.setPendingReason("escape");
          if (!dialog.closeOnEscape) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          onPointerDownOutside?.(event);
          // Select, DatePicker, Popover and Dropdown content is intentionally
          // portalled to body. When one is opened from a Drawer/Dialog, its
          // option clicks are outside the parent panel from Radix's point of
          // view, but they are still part of the active interaction. Keep the
          // parent overlay open while the portalled control handles the click.
          const target = event.target as HTMLElement | null;
          const path = typeof event.composedPath === "function" ? event.composedPath() : [event.target];
          const isInteractiveOverlay =
            Boolean(target?.closest?.('[data-biu-overlay-interactive="true"]')) ||
            path.some((node: EventTarget | null) =>
              Boolean(
                node &&
                typeof (node as { matches?: unknown }).matches === "function" &&
                (node as Element).matches('[data-biu-overlay-interactive="true"]'),
              ),
            );
          if (isInteractiveOverlay) {
            event.preventDefault();
            return;
          }
          if (!event.defaultPrevented && dialog.closeOnOverlayClick) dialog.setPendingReason("overlay");
          if (!dialog.closeOnOverlayClick) event.preventDefault();
        }}
        onOpenAutoFocus={(event) => {
          if (!dialog.open) event.preventDefault();
        }}
        onCloseAutoFocus={(event) => {
          if (dialog.triggerRef.current?.isConnected) {
            event.preventDefault();
            dialog.triggerRef.current.focus({ preventScroll: true });
          }
        }}
      >
        <section>{children}</section>
      </DialogPrimitive.Content>
    </div>
  );
  return (
    <DialogPortal container={dialog.container} forceMount={shouldForceMount}>
      {content}
    </DialogPortal>
  );
});

export const DialogHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function DialogHeader({ className, ...props }, ref) {
    const dialog = useDialog();
    return (
      <header
        {...props}
        ref={ref}
        className={cx("biu-ui-dialog__header", dialog.classNames?.header, className)}
        data-biu-slot="dialog-header"
      />
    );
  },
);

export const DialogBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function DialogBody(
  { className, ...props },
  ref,
) {
  const dialog = useDialog();
  return (
    <div
      {...props}
      ref={ref}
      className={cx("biu-ui-dialog__body", dialog.classNames?.body, className)}
      data-biu-slot="dialog-body"
    />
  );
});

export const DialogFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function DialogFooter({ className, ...props }, ref) {
    const dialog = useDialog();
    return (
      <footer
        {...props}
        ref={ref}
        className={cx("biu-ui-dialog__footer", dialog.classNames?.footer, className)}
        data-biu-slot="dialog-footer"
      />
    );
  },
);

export const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  function DialogTitle({ className, id, ...props }, ref) {
    const dialog = useDialog();
    return (
      <DialogPrimitive.Title
        {...props}
        ref={ref}
        id={id ?? dialog.titleId}
        className={cx("biu-ui-dialog__title", dialog.classNames?.title, className)}
        data-biu-slot="dialog-title"
      />
    );
  },
);

export const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  function DialogDescription({ className, id, ...props }, ref) {
    const dialog = useDialog();
    return (
      <DialogPrimitive.Description
        {...props}
        ref={ref}
        id={id ?? dialog.descriptionId}
        className={cx("biu-ui-dialog__description", dialog.classNames?.description, className)}
        data-biu-slot="dialog-description"
      />
    );
  },
);

export const DialogClose = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  function DialogClose({ children, onClick, className, ...props }, ref) {
    const dialog = useDialog();
    return (
      <DialogPrimitive.Close asChild>
        <button
          {...props}
          ref={ref}
          type="button"
          className={cx("biu-ui-dialog__close", dialog.classNames?.close, className)}
          data-biu-slot="dialog-close"
          onClick={(event) => {
            onClick?.(event);
            if (!event.defaultPrevented) dialog.setPendingReason("close");
          }}
        >
          {children ?? <X size={16} aria-hidden="true" />}
        </button>
      </DialogPrimitive.Close>
    );
  },
);

export { useDialog };
