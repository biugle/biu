import * as React from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import type { FieldPath, FieldValues } from "react-hook-form";
import { Tooltip } from "@biugle/react-components";
import { CircleHelp } from "@biugle/icons";
import { FormItemContext, FormScope, useBiuFormLocale } from "../form/context.js";
import type { FormItemProps } from "../types.js";

export function Item<T extends FieldValues, N extends FieldPath<T>>({
  name,
  label,
  required,
  rules,
  help,
  extra,
  children,
  className,
  classNames,
  hidden = false,
  noStyle = false,
  tooltip,
  colon = true,
  requiredSymbol,
  validateTrigger,
  dependencies,
  shouldUpdate,
  preserve,
}: FormItemProps<T, N>) {
  const form = useFormContext<T>();
  const scope = React.useContext(FormScope);
  const text = useBiuFormLocale();
  const id = `biu-form-control-${React.useId().replace(/:/g, "")}`;
  const helpId = `${id}-help`;
  const error = name ? form.getFieldState(name, form.formState).error : undefined;
  const message = error?.message ?? help;
  const fieldRules = React.useMemo(() => {
    const next = required && rules?.required === undefined ? { ...rules, required: text["请输入此字段"] } : rules;
    return dependencies?.length ? { ...next, deps: dependencies } : next;
  }, [dependencies, required, rules, text["请输入此字段"]]);
  const validationTriggers = React.useMemo(
    () => new Set(Array.isArray(validateTrigger) ? validateTrigger : validateTrigger ? [validateTrigger] : []),
    [validateTrigger],
  );

  // RHF's Controller already subscribes to its own value. `shouldUpdate=true`
  // additionally subscribes to the requested dependencies (or the whole form),
  // while a predicate only invalidates this item when its comparison returns
  // true. This keeps dependent render-prop fields useful without making every
  // Form.Item rerender on every form change.
  const shouldUpdateValues = useWatch({
    control: form.control,
    name: (shouldUpdate === true && dependencies?.length ? dependencies : undefined) as FieldPath<T>[],
    disabled: shouldUpdate !== true,
  });
  void shouldUpdateValues;
  const [, forcePredicateUpdate] = React.useState(0);
  const previousValuesRef = React.useRef<T>(form.getValues());
  React.useEffect(() => {
    if (typeof shouldUpdate !== "function") return undefined;
    const subscription = form.watch((values) => {
      const previous = previousValuesRef.current;
      const current = values as T;
      previousValuesRef.current = current;
      if (shouldUpdate(previous, current)) forcePredicateUpdate((value) => value + 1);
    });
    return () => subscription.unsubscribe();
  }, [form, shouldUpdate]);
  React.useEffect(() => {
    if (!dependencies?.length || !name) return undefined;
    const dependencySet = new Set<string>(dependencies.map((value) => String(value)));
    const subscription = form.watch((_values, info) => {
      const changedName = info.name;
      if (
        changedName &&
        [...dependencySet].some((dependency) => changedName === dependency || changedName.startsWith(`${dependency}.`))
      ) {
        void form.trigger(name);
      }
    });
    return () => subscription.unsubscribe();
  }, [dependencies, form, name]);
  const renderField =
    name && typeof children === "function" ? (
      <Controller
        control={form.control}
        name={name}
        rules={fieldRules}
        disabled={scope.disabled}
        shouldUnregister={preserve === false}
        render={({ field, fieldState }) => (
          <>
            {children({
              field: {
                ...field,
                onChange: (...args: Parameters<typeof field.onChange>) => {
                  field.onChange(...args);
                  if (validationTriggers.has("onChange")) void form.trigger(name);
                },
                onBlur: (...args: Parameters<typeof field.onBlur>) => {
                  field.onBlur(...args);
                  if (validationTriggers.has("onBlur")) void form.trigger(name);
                },
                id,
                disabled: scope.disabled || field.disabled,
                readOnly: scope.readOnly,
                "aria-invalid": Boolean(fieldState.error),
                "aria-required": Boolean(required || fieldRules?.required),
                "aria-describedby": message ? helpId : undefined,
              },
              fieldState,
              formState: form.formState,
              disabled: scope.disabled,
              readOnly: scope.readOnly,
            })}
          </>
        )}
      />
    ) : typeof children === "function" ? null : (
      children
    );
  const item = (
    <div
      className={[
        "biu-form-item",
        noStyle && "biu-form-item--nostyle",
        hidden && "biu-form-item--hidden",
        className,
        classNames?.item,
      ]
        .filter(Boolean)
        .join(" ")}
      data-field-name={name ? String(name) : undefined}
      data-invalid={Boolean(error) || undefined}
    >
      {!noStyle && label !== undefined ? (
        <label htmlFor={id} className={["biu-form-item__label", classNames?.label].filter(Boolean).join(" ")}>
          <span>
            {label}
            {colon ? ":" : ""}
          </span>
          {scope.requiredMark !== false && (required || rules?.required) ? (
            <em aria-hidden="true">{requiredSymbol ?? "*"}</em>
          ) : null}
          {tooltip ? (
            <Tooltip content={tooltip} onlyOverflow={false}>
              <button
                type="button"
                className="biu-form-item__tooltip"
                aria-label={typeof tooltip === "string" ? tooltip : undefined}
              >
                <CircleHelp size={13} aria-hidden="true" />
              </button>
            </Tooltip>
          ) : null}
          {extra ? <small>{extra}</small> : null}
        </label>
      ) : null}
      <div className={["biu-form-item__control", classNames?.control].filter(Boolean).join(" ")}>{renderField}</div>
      {!noStyle ? (
        <span
          id={helpId}
          className={["biu-form-item__help", !error && "biu-form-item__help--muted", classNames?.help]
            .filter(Boolean)
            .join(" ")}
          role={error ? "alert" : undefined}
        >
          {message}
        </span>
      ) : null}
    </div>
  );
  return <FormItemContext.Provider value={{ id }}>{item}</FormItemContext.Provider>;
}

export function FormControl({ children, className }: { children: React.ReactNode; className?: string }) {
  const field = React.useContext(FormItemContext);
  return (
    <div className={["biu-form-control", className].filter(Boolean).join(" ")} data-form-control-id={field?.id}>
      {children}
    </div>
  );
}

export function FormDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={["biu-form-description", className].filter(Boolean).join(" ")}>{children}</p>;
}

export function FormMessage({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <span className={["biu-form-message", className].filter(Boolean).join(" ")} role="alert">
      {children}
    </span>
  );
}
