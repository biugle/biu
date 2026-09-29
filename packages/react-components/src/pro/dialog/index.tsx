import * as React from "react";
import {
  Button as UiButton,
  Dialog as UiDialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  type DialogCloseReason,
  type DialogProps,
} from "../../ui/index.js";
import { cx } from "../../shared/utils.js";
import {
  useComponentsLocale,
  type BiuComponentsLocale,
  type BiuComponentsLocaleTextOverrides,
} from "../../provider.js";

export interface ProDialogClassNames {
  content?: string;
  panel?: string;
  header?: string;
  icon?: string;
  heading?: string;
  title?: string;
  description?: string;
  body?: string;
  footer?: string;
  close?: string;
}

export interface ProDialogProps extends Omit<DialogProps, "title" | "onOpenChange"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  size?: "small" | "medium" | "large" | string;
  footer?: React.ReactNode;
  okText?: React.ReactNode;
  cancelText?: React.ReactNode;
  okButtonProps?: React.ComponentProps<typeof UiButton>;
  cancelButtonProps?: React.ComponentProps<typeof UiButton>;
  onOk?: () => void | boolean | Promise<void | boolean>;
  onCancel?: (reason?: DialogCloseReason) => void;
  onOpenChange?: (open: boolean, reason?: DialogCloseReason) => void;
  showCloseButton?: boolean;
  maskClosable?: boolean;
  locale?: BiuComponentsLocale;
  localeText?: BiuComponentsLocaleTextOverrides;
  classNames?: ProDialogClassNames;
}

export function Dialog({
  title,
  description,
  icon,
  size = "medium",
  footer,
  okText,
  cancelText,
  okButtonProps,
  cancelButtonProps,
  onOk,
  onCancel,
  onOpenChange,
  showCloseButton = true,
  maskClosable = true,
  children,
  className,
  locale,
  localeText,
  classNames,
  ...props
}: ProDialogProps) {
  const text = useComponentsLocale(locale, localeText);
  const [loading, setLoading] = React.useState(false);
  const submittingRef = React.useRef(false);
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
    <UiDialog
      {...props}
      layer="pro"
      closeOnOverlayClick={maskClosable}
      data-biu-component="dialog"
      data-biu-layer="pro"
      className={cx("biu-pro-dialog", `biu-pro-dialog--${size}`, classNames?.content, className)}
      onOpenChange={handleOpenChange}
    >
      <DialogContent panelClassName={classNames?.panel}>
        <DialogHeader className={classNames?.header}>
          {icon ? (
            <span className={cx("biu-pro-dialog__icon", classNames?.icon)} aria-hidden="true">
              {icon}
            </span>
          ) : null}
          <div className={cx("biu-pro-dialog__heading", classNames?.heading)}>
            {title !== undefined ? <DialogTitle className={classNames?.title}>{title}</DialogTitle> : null}
            {description ? (
              <DialogDescription className={classNames?.description}>{description}</DialogDescription>
            ) : null}
          </div>
          {showCloseButton ? <DialogClose className={classNames?.close} aria-label={text["关闭"]} /> : null}
        </DialogHeader>
        <DialogBody className={classNames?.body}>{children}</DialogBody>
        {footer !== undefined ? (
          footer
        ) : (
          <DialogFooter className={classNames?.footer}>
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
          </DialogFooter>
        )}
      </DialogContent>
    </UiDialog>
  );
}
