import * as React from "react";
import type { FieldPath, FieldValues, UseFormReturn } from "react-hook-form";
import type { FormErrorEntry } from "../types.js";
import { useBiuFormLocale } from "../form/context.js";
import type { BiuFormLocale, BiuFormLocaleTextOverrides } from "../locale/index.js";
import type { FormGroupProps } from "../types.js";

export function Section({
  title,
  children,
  className,
  description,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={["biu-form-section", className].filter(Boolean).join(" ")}>
      {title !== undefined ? <legend>{title}</legend> : null}
      {description ? <p className="biu-form-section__description">{description}</p> : null}
      {children}
    </fieldset>
  );
}

export function Group({
  icon,
  title,
  description,
  children,
  columns = 2,
  gap = 16,
  bordered = true,
  className,
  classNames,
}: FormGroupProps) {
  const style = {
    "--biu-form-group-columns": typeof columns === "number" ? String(columns) : columns,
    "--biu-form-group-gap": typeof gap === "number" ? `${gap}px` : gap,
  } as React.CSSProperties;

  return (
    <section
      className={["biu-form-group", !bordered && "biu-form-group--borderless", className, classNames?.root]
        .filter(Boolean)
        .join(" ")}
      data-biu-component="form-group"
      style={style}
    >
      {title !== undefined || description !== undefined ? (
        <header className={["biu-form-group__header", classNames?.header].filter(Boolean).join(" ")}>
          {title !== undefined || icon !== undefined ? (
            <h3 className={["biu-form-group__title", classNames?.title].filter(Boolean).join(" ")}>
              {icon !== undefined ? (
                <span className={["biu-form-group__icon", classNames?.icon].filter(Boolean).join(" ")}>{icon}</span>
              ) : null}
              {title}
            </h3>
          ) : null}
          {description !== undefined ? (
            <p className={["biu-form-group__description", classNames?.description].filter(Boolean).join(" ")}>
              {description}
            </p>
          ) : null}
        </header>
      ) : null}
      <div className={["biu-form-group__body", classNames?.body].filter(Boolean).join(" ")}>{children}</div>
    </section>
  );
}

export function Grid({
  children,
  columns = 2,
  className,
}: {
  children: React.ReactNode;
  columns?: number;
  className?: string;
}) {
  return (
    <div
      className={["biu-form-grid", className].filter(Boolean).join(" ")}
      style={{ "--biu-form-columns": columns } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
export function Actions({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={["biu-form-actions", className].filter(Boolean).join(" ")}>{children}</div>;
}

function flattenErrors(value: unknown, prefix = ""): FormErrorEntry[] {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === "object" && ("message" in child || "type" in child))
      return [{ path, error: child as FormErrorEntry["error"] }];
    return flattenErrors(child, path);
  });
}

export function ErrorSummary<T extends FieldValues>({
  form,
  title,
  className,
  locale,
  localeText,
}: {
  form: UseFormReturn<T>;
  title?: React.ReactNode;
  className?: string;
  locale?: BiuFormLocale;
  localeText?: BiuFormLocaleTextOverrides;
}) {
  const text = useBiuFormLocale(locale, localeText);
  const errors = flattenErrors(form.formState.errors);
  if (!errors.length) return null;
  return (
    <div className={["biu-form-error-summary", className].filter(Boolean).join(" ")} role="alert" aria-live="assertive">
      <strong>{title ?? text["请检查以下字段"]}</strong>
      <ul>
        {errors.map(({ path, error }) => (
          <li key={path}>
            <button type="button" onClick={() => form.setFocus(path as FieldPath<T>)}>
              {path}: {String(error.message ?? error.type)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export { flattenErrors };
