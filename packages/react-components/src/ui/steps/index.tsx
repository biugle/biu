import * as React from "react";
import { Check } from "@biugle/icons";
import { cx } from "../../shared/utils.js";

export interface StepItem {
  key: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  status?: "wait" | "process" | "finish" | "error";
  disabled?: boolean;
}

export interface StepsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  items: StepItem[];
  current?: number;
  defaultCurrent?: number;
  onChange?: (current: number, item: StepItem) => void;
  direction?: "horizontal" | "vertical";
  classNames?: { root?: string; item?: string; trigger?: string; index?: string; text?: string; line?: string };
}

export function Steps({
  items,
  current,
  defaultCurrent = 0,
  onChange,
  direction = "horizontal",
  className,
  classNames,
  ...props
}: StepsProps) {
  const [internal, setInternal] = React.useState(defaultCurrent);
  const active = current ?? internal;
  return (
    <div
      {...props}
      className={cx("biu-ui-steps", `biu-ui-steps--${direction}`, classNames?.root, className)}
      role="list"
    >
      {items.map((item, index) => {
        const status = item.status ?? (index < active ? "finish" : index === active ? "process" : "wait");
        return (
          <div key={item.key} className={cx("biu-ui-step", `biu-ui-step--${status}`, classNames?.item)} role="listitem">
            <button
              type="button"
              disabled={item.disabled}
              className={cx("biu-ui-step__trigger", classNames?.trigger)}
              aria-current={index === active ? "step" : undefined}
              onClick={() => {
                if (item.disabled) return;
                if (current === undefined) setInternal(index);
                onChange?.(index, item);
              }}
            >
              <span className={cx("biu-ui-step__index", classNames?.index)}>
                {status === "finish" ? <Check size={14} strokeWidth={2.5} aria-hidden="true" /> : index + 1}
              </span>
              <span className={cx("biu-ui-step__text", classNames?.text)}>
                <strong>{item.title}</strong>
                {item.description ? <small>{item.description}</small> : null}
              </span>
            </button>
            {index < items.length - 1 ? (
              <span className={cx("biu-ui-step__line", classNames?.line)} aria-hidden="true" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
