import * as React from "react";
import { cx } from "../../shared/utils.js";

export function Result({
  status = "info",
  title,
  description,
  action,
  className,
}: {
  status?: "info" | "success" | "warning" | "error";
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx("biu-pro-result", `biu-pro-result--${status}`, className)}
      role={status === "error" ? "alert" : undefined}
    >
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  );
}
