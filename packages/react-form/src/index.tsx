import { Form as FormRoot } from "./form/root.js";
import { FormField as Field } from "./form/context.js";
import { Item, FormControl, FormDescription, FormMessage } from "./field/item.js";
import { ProForm } from "./pro/form.js";
import { List as FormList } from "./form/list.js";
import {
  Section as FormSection,
  Group as FormGroup,
  Grid as FormGrid,
  Actions as FormActions,
  ErrorSummary as FormErrorSummary,
} from "./layout/index.js";

export const Form = Object.assign(FormRoot, {
  Item,
  Control: FormControl,
  Description: FormDescription,
  Message: FormMessage,
  Field,
  Section: FormSection,
  Group: FormGroup,
  Grid: FormGrid,
  Actions: FormActions,
  ErrorSummary: FormErrorSummary,
  List: FormList,
  Pro: ProForm,
});
export { FormField, useBiuFormLocale, useBiuFormScope, useFormField, FormItemContext } from "./form/context.js";
export { Item, FormControl, FormDescription, FormMessage } from "./field/item.js";
export { FormList };
export { List } from "./form/list.js";
export { Actions, ErrorSummary, Grid, Group, Section } from "./layout/index.js";
export { Item as FormItem } from "./field/item.js";
export * from "./pro/index.js";
export {
  Section as FormSection,
  Group as FormGroup,
  Grid as FormGrid,
  Actions as FormActions,
  ErrorSummary as FormErrorSummary,
} from "./layout/index.js";
export { Field };
export { useForm, useFormContext, FormProvider, Controller } from "react-hook-form";
export type {
  ControllerFieldState,
  ControllerRenderProps,
  FieldPath,
  FieldValues,
  Path,
  RegisterOptions,
  SubmitErrorHandler,
  SubmitHandler,
  UseFormReturn,
  ControllerProps,
} from "react-hook-form";
export type {
  FormClassNames,
  FormErrorEntry,
  FormGroupClassNames,
  FormGroupProps,
  FormItemProps,
  FormProps,
  FormRenderContext,
} from "./types.js";
export type {
  FormListClassNames,
  FormListField,
  FormListMeta,
  FormListOperations,
  FormListProps,
  FormListColumn,
  FormListColumnRenderContext,
} from "./form/list.js";
export {
  getBiuFormLocaleText,
  biuFormLocales,
  type BiuFormLocale,
  type BiuFormLocaleText,
  type BiuFormLocaleTextOverrides,
} from "./locale/index.js";
