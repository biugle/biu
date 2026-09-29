import * as React from "react";
import {
  Button as UiButton,
  Drawer as UiDrawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  type DialogCloseReason,
  type DrawerProps as UiDrawerProps,
} from "../../ui/index.js";
import { cx } from "../../shared/utils.js";
import {
  useComponentsLocale,
  type BiuComponentsLocale,
  type BiuComponentsLocaleTextOverrides,
} from "../../provider.js";

export type ProDrawerSize = "small" | "medium" | "large" | string | number;

export interface ProDrawerClassNames {
  content?: string;
  panel?: string;
  header?: string;
  title?: string;
  description?: string;
  body?: string;
  footer?: string;
  close?: string;
}

function resolveDrawerSize(
  size: ProDrawerSize,
  placement: NonNullable<UiDrawerProps["placement"]>,
  fullscreen: boolean,
) {
  if (fullscreen) return "100%";
  if (typeof size === "number") return size;
  if (!size) return "420px";
  if (!/^(small|medium|large)$/i.test(size)) return size;
  const values =
    placement === "left" || placement === "right"
      ? { small: 360, medium: 480, large: 720 }
      : { small: 280, medium: 420, large: 640 };
  return values[size.toLowerCase() as keyof typeof values];
}

export interface ProDrawerProps extends Omit<UiDrawerProps, "title" | "onOpenChange" | "size"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  okText?: React.ReactNode;
  cancelText?: React.ReactNode;
  okButtonProps?: React.ComponentProps<typeof UiButton>;
  cancelButtonProps?: React.ComponentProps<typeof UiButton>;
  onOk?: () => void | boolean | Promise<void | boolean>;
  showCloseButton?: boolean;
  maskClosable?: boolean;
  fullscreen?: boolean;
  size?: ProDrawerSize;
  onCancel?: (reason?: DialogCloseReason) => void;
  onOpenChange?: (open: boolean, reason?: DialogCloseReason) => void;
  locale?: BiuComponentsLocale;
  localeText?: BiuComponentsLocaleTextOverrides;
  classNames?: ProDrawerClassNames;
}

export function Drawer({
  title,
  description,
  footer,
  okText,
  cancelText,
  okButtonProps,
  cancelButtonProps,
  onOk,
  showCloseButton = true,
  maskClosable = true,
  fullscreen = false,
  placement = "right",
  size = "medium",
  children,
  onCancel,
  onOpenChange,
  className,
  locale,
  localeText,
  classNames,
  ...props
}: ProDrawerProps) {
  const text = useComponentsLocale(locale, localeText);
  const [loading, setLoading] = React.useState(false);
  const submittingRef = React.useRef(false);
  const resolvedSize = resolveDrawerSize(size, placement, fullscreen);
  const handleOpenChange = (open: boolean, reason?: DialogCloseReason) => {
    if (!open && reason === "overlay" && !maskClosable) return;
    if (!open) onCancel?.(reason);
    onOpenChange?.(open, reason);
  };
  const confirm = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    try {
      if ((await onOk?.()) !== false) handleOpenChange(false, "programmatic");
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };
  return (
    <UiDrawer
      {...props}
      layer="pro"
      placement={placement}
      size={resolvedSize}
      closeOnOverlayClick={maskClosable}
      data-biu-component="drawer"
      data-biu-layer="pro"
      className={cx("biu-pro-drawer", fullscreen && "biu-pro-drawer--fullscreen", classNames?.content, className)}
      onOpenChange={handleOpenChange}
    >
      <DrawerContent panelClassName={classNames?.panel}>
        <DrawerHeader className={classNames?.header}>
          <div>
            {title !== undefined ? <DrawerTitle className={classNames?.title}>{title}</DrawerTitle> : null}
            {description ? (
              <DrawerDescription className={classNames?.description}>{description}</DrawerDescription>
            ) : null}
          </div>
          {showCloseButton ? <DrawerClose className={classNames?.close} aria-label={text["关闭"]} /> : null}
        </DrawerHeader>
        <DrawerBody className={classNames?.body}>{children}</DrawerBody>
        {footer !== undefined ? (
          footer
        ) : (
          <DrawerFooter className={classNames?.footer}>
            <UiButton
              {...cancelButtonProps}
              variant={cancelButtonProps?.variant ?? "secondary"}
              onClick={(event) => {
                cancelButtonProps?.onClick?.(event);
                if (!event.defaultPrevented) handleOpenChange(false, "close");
              }}
            >
              {cancelText ?? text["取消"]}
            </UiButton>
            <UiButton
              {...okButtonProps}
              loading={loading || Boolean(okButtonProps?.loading)}
              onClick={(event) => {
                okButtonProps?.onClick?.(event);
                if (!event.defaultPrevented) void confirm();
              }}
            >
              {okText ?? text["确定"]}
            </UiButton>
          </DrawerFooter>
        )}
      </DrawerContent>
    </UiDrawer>
  );
}
