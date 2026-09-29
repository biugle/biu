import * as React from "react";
import { cx } from "../../shared/utils.js";

export interface GroupOption {
  label: React.ReactNode;
  value: string;
  disabled?: boolean;
  [key: string]: unknown;
}

export interface GroupClassNames {
  root?: string;
  option?: string;
  input?: string;
  label?: string;
}

export type GroupDirection = "horizontal" | "vertical";

export interface CheckboxGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  options: GroupOption[];
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  direction?: GroupDirection;
  optionRender?: (option: GroupOption, index: number) => React.ReactNode;
  classNames?: GroupClassNames;
}

export function CheckboxGroup({
  options,
  value,
  defaultValue = [],
  onChange,
  direction = "horizontal",
  optionRender,
  className,
  classNames,
  ...props
}: CheckboxGroupProps) {
  const [internal, setInternal] = React.useState(defaultValue);
  const active = value ?? internal;
  return (
    <div
      {...props}
      className={cx("biu-ui-checkbox-group", `biu-ui-checkbox-group--${direction}`, className, classNames?.root)}
      role="group"
    >
      {options.map((option, index) => (
        <label key={option.value} className={cx(classNames?.option)} data-biu-slot="checkbox-option">
          <input
            type="checkbox"
            value={option.value}
            disabled={option.disabled}
            className={classNames?.input}
            data-biu-slot="checkbox-input"
            checked={active.includes(option.value)}
            onChange={() => {
              const next = active.includes(option.value)
                ? active.filter((item) => item !== option.value)
                : [...active, option.value];
              if (value === undefined) setInternal(next);
              onChange?.(next);
            }}
          />
          <span className={classNames?.label}>{optionRender?.(option, index) ?? option.label}</span>
        </label>
      ))}
    </div>
  );
}

export interface RadioGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  options: GroupOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;
  direction?: GroupDirection;
  optionRender?: (option: GroupOption, index: number) => React.ReactNode;
  classNames?: GroupClassNames;
}

export function RadioGroup({
  options,
  value,
  defaultValue,
  onChange,
  name,
  direction = "horizontal",
  optionRender,
  className,
  classNames,
  ...props
}: RadioGroupProps) {
  const [internal, setInternal] = React.useState(defaultValue);
  const active = value ?? internal;
  const groupName = name ?? `biu-radio-group-${React.useId().replace(/:/g, "")}`;
  return (
    <div
      {...props}
      className={cx("biu-ui-radio-group", `biu-ui-radio-group--${direction}`, className, classNames?.root)}
      role="radiogroup"
    >
      {options.map((option, index) => (
        <label key={option.value} className={cx(classNames?.option)} data-biu-slot="radio-option">
          <input
            type="radio"
            name={groupName}
            value={option.value}
            disabled={option.disabled}
            className={classNames?.input}
            data-biu-slot="radio-input"
            checked={active === option.value}
            onChange={() => {
              if (value === undefined) setInternal(option.value);
              onChange?.(option.value);
            }}
          />
          <span className={classNames?.label}>{optionRender?.(option, index) ?? option.label}</span>
        </label>
      ))}
    </div>
  );
}
