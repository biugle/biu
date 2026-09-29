import type * as React from "react";
import type {
  ControllerFieldState,
  ControllerRenderProps,
  FieldError,
  FieldPath,
  FieldValues,
  RegisterOptions,
  UseFormReturn,
} from "react-hook-form";
import type { BiuFormLocale, BiuFormLocaleTextOverrides } from "./locale/index.js";

export interface FormClassNames {
  root?: string;
  item?: string;
  label?: string;
  control?: string;
  help?: string;
  description?: string;
  message?: string;
}
export interface FormGroupClassNames {
  root?: string;
  header?: string;
  icon?: string;
  title?: string;
  description?: string;
  body?: string;
}
export interface FormGroupProps {
  icon?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  columns?: number | string;
  gap?: number | string;
  bordered?: boolean;
  className?: string;
  classNames?: FormGroupClassNames;
}
export interface FormProps<T extends FieldValues> extends Omit<
  React.FormHTMLAttributes<HTMLFormElement>,
  "onSubmit" | "onInvalid"
> {
  form: UseFormReturn<T>;
  onSubmit?: (values: T, event?: React.BaseSyntheticEvent) => void | Promise<void>;
  onInvalid?: (errors: UseFormReturn<T>["formState"]["errors"], event?: React.BaseSyntheticEvent) => void;
  disabled?: boolean;
  readOnly?: boolean;
  layout?: "vertical" | "horizontal";
  columns?: number;
  labelWidth?: number | string;
  requiredMark?: boolean;
  loading?: boolean;
  classNames?: FormClassNames;
  locale?: BiuFormLocale;
  localeText?: BiuFormLocaleTextOverrides;
}
export interface FormRenderContext<T extends FieldValues, N extends FieldPath<T>> {
  field: ControllerRenderProps<T, N> & {
    id: string;
    disabled?: boolean;
    readOnly?: boolean;
    "aria-invalid": boolean;
    "aria-required"?: boolean;
    "aria-describedby"?: string;
  };
  fieldState: ControllerFieldState;
  formState: UseFormReturn<T>["formState"];
  disabled: boolean;
  readOnly: boolean;
}
export interface FormItemProps<T extends FieldValues, N extends FieldPath<T>> {
  name?: N;
  label?: React.ReactNode;
  required?: boolean;
  rules?: RegisterOptions<T, N>;
  help?: React.ReactNode;
  extra?: React.ReactNode;
  children: ((context: FormRenderContext<T, N>) => React.ReactNode) | React.ReactNode;
  className?: string;
  classNames?: Pick<FormClassNames, "item" | "label" | "control" | "help">;
  hidden?: boolean;
  noStyle?: boolean;
  tooltip?: React.ReactNode;
  colon?: boolean;
  requiredSymbol?: React.ReactNode;
  validateTrigger?: "onChange" | "onBlur" | "onSubmit" | Array<"onChange" | "onBlur" | "onSubmit">;
  dependencies?: FieldPath<T>[];
  shouldUpdate?: boolean | ((previous: T, current: T) => boolean);
  preserve?: boolean;
}
export type FormErrorEntry = { path: string; error: FieldError };
