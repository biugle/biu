import * as React from "react";
import type { FieldValues } from "react-hook-form";
import { Button, ButtonGroup } from "@biugle/react-components";
import { Form } from "../form/root.js";
import { useBiuFormLocale } from "../form/context.js";
import type { FormProps } from "../types.js";
import { Actions } from "../layout/index.js";

export interface ProFormProps<T extends FieldValues> extends FormProps<T> {
  toolbar?: React.ReactNode;
  actions?: React.ReactNode;
  showReset?: boolean;
  resetText?: React.ReactNode;
  submitText?: React.ReactNode;
  onReset?: () => void;
}

export function ProForm<T extends FieldValues>({
  toolbar,
  actions,
  showReset = true,
  resetText,
  submitText,
  onReset,
  form,
  children,
  className,
  ...props
}: ProFormProps<T>) {
  const text = useBiuFormLocale(props.locale, props.localeText);
  const reset = () => {
    form.reset();
    onReset?.();
  };
  return (
    <Form {...props} form={form} className={["biu-pro-form", className].filter(Boolean).join(" ")}>
      {toolbar ? <div className="biu-pro-form__toolbar">{toolbar}</div> : null}
      {children}
      {actions !== undefined ? (
        actions
      ) : (
        <Actions>
          <ButtonGroup>
            {showReset ? (
              <Button type="default" variant="outlined" htmlType="button" onClick={reset}>
                {resetText ?? text["重置"]}
              </Button>
            ) : null}
            <Button type="primary" htmlType="submit">
              {submitText ?? text["提交"]}
            </Button>
          </ButtonGroup>
        </Actions>
      )}
    </Form>
  );
}

export function FormToolbar({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <div className={["biu-pro-form__toolbar-content", className].filter(Boolean).join(" ")}>{children}</div>;
}
