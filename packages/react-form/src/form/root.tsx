import * as React from "react";
import { FormProvider } from "react-hook-form";
import type { FieldValues } from "react-hook-form";
import { FormScope } from "./context.js";
import type { FormProps } from "../types.js";

export function Form<T extends FieldValues>({
  form,
  onSubmit,
  onInvalid,
  children,
  className,
  disabled = false,
  readOnly = false,
  layout = "vertical",
  columns,
  labelWidth,
  requiredMark = true,
  loading = false,
  classNames,
  locale,
  localeText,
  noValidate = true,
  ...props
}: FormProps<T>) {
  return (
    <FormProvider {...form}>
      <FormScope.Provider value={{ disabled, readOnly, requiredMark, locale, localeText }}>
        <form
          {...props}
          className={["biu-form", `biu-form--${layout}`, className, classNames?.root].filter(Boolean).join(" ")}
          style={
            {
              ...(columns ? { "--biu-form-columns": columns } : {}),
              ...(labelWidth
                ? { "--biu-form-label-width": typeof labelWidth === "number" ? `${labelWidth}px` : labelWidth }
                : {}),
              ...props.style,
            } as React.CSSProperties
          }
          onSubmit={form.handleSubmit(
            (values, event) => onSubmit?.(values, event),
            (errors, event) => onInvalid?.(errors, event),
          )}
          aria-disabled={disabled || undefined}
          aria-readonly={readOnly || undefined}
          aria-busy={loading || undefined}
          noValidate={noValidate}
        >
          <fieldset className="biu-form__fieldset" disabled={disabled || loading}>
            {children}
          </fieldset>
        </form>
      </FormScope.Provider>
    </FormProvider>
  );
}
