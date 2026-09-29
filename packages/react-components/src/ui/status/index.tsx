import * as React from "react";
import { CircleCheck, CircleX, Info, TriangleAlert, X } from "@biugle/icons";
import { cx } from "../../shared/utils.js";
import {
  useComponentsLocale,
  type BiuComponentsLocale,
  type BiuComponentsLocaleTextOverrides,
} from "../../provider.js";

export interface StatusLocaleProps {
  locale?: BiuComponentsLocale;
  localeText?: BiuComponentsLocaleTextOverrides;
}

export type AlertStatus = "default" | "info" | "success" | "warning" | "error";

export interface AlertClassNames {
  root?: string;
  icon?: string;
  content?: string;
  title?: string;
  description?: string;
  action?: string;
  close?: string;
}

export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">, StatusLocaleProps {
  status?: AlertStatus;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  closable?: boolean;
  onClose?: () => void;
  banner?: boolean;
  bordered?: boolean;
  classNames?: AlertClassNames;
}

export function Alert({
  status = "info",
  title,
  description,
  icon,
  action,
  children,
  closable = false,
  onClose,
  banner = false,
  bordered = true,
  className,
  locale,
  localeText,
  classNames,
  ...props
}: AlertProps) {
  const text = useComponentsLocale(locale, localeText);
  return (
    <div
      {...props}
      className={cx(
        "biu-ui-alert",
        `biu-ui-alert--${status}`,
        banner && "biu-ui-alert--banner",
        !bordered && "biu-ui-alert--borderless",
        classNames?.root,
        className,
      )}
      data-biu-component="alert"
      role={status === "error" ? "alert" : "status"}
    >
      <span className={cx("biu-ui-alert__icon", classNames?.icon)} aria-hidden={icon ? undefined : true}>
        {icon ??
          (status === "success" ? (
            <CircleCheck size={18} />
          ) : status === "warning" ? (
            <TriangleAlert size={18} />
          ) : status === "error" ? (
            <CircleX size={18} />
          ) : (
            <Info size={18} />
          ))}
      </span>
      <div className={cx("biu-ui-alert__content", classNames?.content)}>
        {title ? <strong className={classNames?.title}>{title}</strong> : null}
        {description !== undefined ? (
          <div className={classNames?.description}>{description}</div>
        ) : children ? (
          <div className={classNames?.description}>{children}</div>
        ) : null}
      </div>
      {action ? <div className={cx("biu-ui-alert__action", classNames?.action)}>{action}</div> : null}
      {closable ? (
        <button
          type="button"
          className={cx("biu-ui-alert__close", classNames?.close)}
          onClick={onClose}
          aria-label={text["关闭"]}
        >
          <X size={14} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

export function Empty({
  description,
  className,
  classNames,
  locale,
  localeText,
}: {
  description?: React.ReactNode;
  className?: string;
  classNames?: { root?: string; content?: string };
} & StatusLocaleProps) {
  const text = useComponentsLocale(locale, localeText);
  return (
    <div className={cx("biu-ui-empty", classNames?.root, className)} role="status">
      <span className={classNames?.content}>{description ?? text["暂无数据"]}</span>
    </div>
  );
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, StatusLocaleProps {
  color?: "default" | "success" | "warning" | "danger" | "info";
  count?: React.ReactNode;
  dot?: boolean;
  classNames?: { root?: string; count?: string; dot?: string };
}

export function Badge({
  color = "default",
  count,
  dot = false,
  children,
  className,
  classNames,
  locale,
  localeText,
  ...props
}: BadgeProps) {
  const text = useComponentsLocale(locale, localeText);
  return (
    <span
      {...props}
      className={cx("biu-ui-badge", `biu-ui-badge--${color}`, classNames?.root, className)}
      data-biu-component="badge"
    >
      {children}
      {dot ? (
        <span className={cx("biu-ui-badge__dot", classNames?.dot)} aria-label={text["有新内容"]} />
      ) : count !== undefined ? (
        <span className={cx("biu-ui-badge__count", classNames?.count)}>{count}</span>
      ) : null}
    </span>
  );
}

export function Loading({
  label,
  className,
  classNames,
  locale,
  localeText,
}: {
  label?: React.ReactNode;
  className?: string;
  classNames?: { root?: string; spinner?: string; label?: string };
} & StatusLocaleProps) {
  const text = useComponentsLocale(locale, localeText);
  return (
    <div className={cx("biu-ui-loading", classNames?.root, className)} role="status" aria-live="polite">
      <span className={cx("biu-ui-loading__spinner", classNames?.spinner)} aria-hidden="true" />
      <span className={classNames?.label}>{label ?? text["加载中…"]}</span>
    </div>
  );
}

export function Skeleton({
  rows = 3,
  className,
  classNames,
}: {
  rows?: number;
  className?: string;
  classNames?: { root?: string; row?: string };
}) {
  return (
    <div className={cx("biu-ui-skeleton", classNames?.root, className)} aria-hidden="true">
      {Array.from({ length: Math.max(0, rows) }, (_, index) => (
        <span className={classNames?.row} key={index} />
      ))}
    </div>
  );
}
