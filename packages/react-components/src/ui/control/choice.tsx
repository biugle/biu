import * as React from "react";
import { cx, type BiuSize } from "../../shared/utils.js";
import {
  useComponentsLocale,
  type BiuComponentsLocale,
  type BiuComponentsLocaleTextOverrides,
} from "../../provider.js";
import type { ControlClassNames } from "./types.js";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  classNames?: ControlClassNames;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className, classNames, ...props },
  ref,
) {
  return (
    <label className={cx("biu-ui-checkbox", className, classNames?.root)} data-biu-component="checkbox">
      <input {...props} ref={ref} type="checkbox" className={classNames?.input} />
      {label !== undefined ? <span className={cx("biu-ui-checkbox__label", classNames?.label)}>{label}</span> : null}
    </label>
  );
});

export const Radio = React.forwardRef<HTMLInputElement, CheckboxProps>(function Radio(
  { label, className, classNames, ...props },
  ref,
) {
  return (
    <label className={cx("biu-ui-radio", className, classNames?.root)} data-biu-component="radio">
      <input {...props} ref={ref} type="radio" className={classNames?.input} />
      {label !== undefined ? <span className={cx("biu-ui-radio__label", classNames?.label)}>{label}</span> : null}
    </label>
  );
});

export interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean;
  defaultChecked?: boolean;
  loading?: boolean;
  checkedChildren?: React.ReactNode;
  unCheckedChildren?: React.ReactNode;
  size?: BiuSize;
  readOnly?: boolean;
  onChange?: (checked: boolean, event?: React.MouseEvent<HTMLButtonElement>) => void;
  classNames?: ControlClassNames;
  locale?: BiuComponentsLocale;
  localeText?: BiuComponentsLocaleTextOverrides;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  {
    checked,
    defaultChecked = false,
    onChange,
    loading = false,
    checkedChildren,
    unCheckedChildren,
    size = "medium",
    className,
    classNames,
    locale,
    localeText,
    disabled,
    readOnly = false,
    ...props
  },
  ref,
) {
  const text = useComponentsLocale(locale, localeText);
  // Kept for source compatibility; Switch visuals intentionally never put
  // text inside the track.
  void checkedChildren;
  void unCheckedChildren;
  const [internal, setInternal] = React.useState(defaultChecked);
  const active = checked ?? internal;
  return (
    <button
      {...props}
      ref={ref}
      type="button"
      disabled={disabled || loading}
      role="switch"
      aria-checked={active}
      aria-busy={loading || undefined}
      aria-readonly={readOnly || undefined}
      data-readonly={readOnly || undefined}
      className={cx(
        "biu-ui-switch",
        `biu-ui-switch--${size}`,
        active && "biu-ui-switch--checked",
        readOnly && "biu-ui-control--readonly",
        className,
        classNames?.root,
      )}
      onClick={(event) => {
        if (readOnly) return;
        const next = !active;
        if (checked === undefined) setInternal(next);
        onChange?.(next, event);
      }}
      aria-label={props["aria-label"] ?? text["开关"]}
    >
      <span className={cx("biu-ui-switch__thumb", classNames?.thumb)} />
    </button>
  );
});
