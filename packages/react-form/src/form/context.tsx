import * as React from "react";
import type { ControllerProps, FieldPath, FieldValues } from "react-hook-form";
import { Controller, useFormContext } from "react-hook-form";
import type { BiuFormLocale, BiuFormLocaleText, BiuFormLocaleTextOverrides } from "../locale/index.js";
import { getBiuFormLocaleText } from "../locale/index.js";

export interface FormScopeValue {
  disabled: boolean;
  readOnly: boolean;
  requiredMark?: boolean;
  locale?: BiuFormLocale;
  localeText?: BiuFormLocaleTextOverrides;
}
export const FormScope = React.createContext<FormScopeValue>({ disabled: false, readOnly: false });

interface FormFieldContextValue<T extends FieldValues = FieldValues, N extends FieldPath<T> = FieldPath<T>> {
  name: N;
}
const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);
export const FormItemContext = React.createContext<{ id: string } | null>(null);

export function FormField<T extends FieldValues = FieldValues, N extends FieldPath<T> = FieldPath<T>>(
  props: ControllerProps<T, N>,
) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <ControllerContext {...props} />
    </FormFieldContext.Provider>
  );
}

function ControllerContext<T extends FieldValues, N extends FieldPath<T>>(props: ControllerProps<T, N>) {
  return <Controller {...props} />;
}

export function useFormField() {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const form = useFormContext();
  if (!fieldContext) throw new Error("useFormField must be used within <FormField>");
  if (!itemContext) throw new Error("useFormField must be used within <FormItem>");
  const fieldState = form.getFieldState(fieldContext.name, form.formState);
  const fieldName = String(fieldContext.name);
  const fieldId = `${fieldName.replace(/\./g, "-")}-field-${itemContext.id}`;
  return {
    id: itemContext.id,
    name: fieldContext.name,
    formItemId: fieldId,
    formDescriptionId: `${fieldId}-description`,
    formMessageId: `${fieldId}-error`,
    ...fieldState,
  };
}

export function useBiuFormScope() {
  return React.useContext(FormScope);
}

export function useBiuFormLocale(locale?: BiuFormLocale, localeText?: BiuFormLocaleTextOverrides): BiuFormLocaleText {
  const scope = React.useContext(FormScope);
  return React.useMemo(
    () => getBiuFormLocaleText(locale ?? scope.locale, { ...scope.localeText, ...localeText }),
    [locale, localeText, scope.locale, scope.localeText],
  );
}
