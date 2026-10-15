import * as React from "react";
import { createPortal } from "react-dom";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Maximize2, X } from "@biugle/icons";
import { Button } from "../../ui/button/index.js";
import {
  Textarea,
  TextField,
  type ControlClassNames,
  type TextareaProps,
  type TextFieldProps,
} from "../../ui/control/index.js";
import { cx, mergeRefs } from "../../shared/utils.js";
import { createInputFilter } from "../../shared/input-filter.js";
import { useComponentsLocale } from "../../provider.js";
import { splitString, stringSeparatorPattern } from "./split-string.js";

export interface ProTextFieldClassNames extends ControlClassNames {
  editor?: string;
  description?: string;
  actions?: string;
}

export interface ProTextFieldProps extends Omit<TextFieldProps, "value" | "defaultValue" | "onChange" | "classNames"> {
  value?: string;
  defaultValue?: string;
  /** Direct edits, clearing and accepted batch edits use the same raw-text and parsed-items contract. */
  onChange?: (value: string, items: string[]) => void;
  /** Enable the draft-based batch editor. Defaults to true. */
  expandable?: boolean;
  /** Include whitespace in the separators. Defaults to false. */
  separatorIncludesSpace?: boolean;
  /** Include English and Chinese commas in the separators. Defaults to false. */
  separatorIncludesComma?: boolean;
  /** Return false to retain the draft without changing the committed value. */
  onApply?: (value: string, items: string[]) => void | boolean | Promise<void | boolean>;
  onCancel?: () => void;
  onOpenChange?: (open: boolean) => void;
  popoverWidth?: number | string;
  textareaProps?: Omit<TextareaProps, "value" | "defaultValue" | "onChange" | "disabled" | "readOnly">;
  expandText?: React.ReactNode;
  applyText?: React.ReactNode;
  cancelText?: React.ReactNode;
  clearText?: React.ReactNode;
  classNames?: ProTextFieldClassNames;
}

/** A text field with a batch editor. Draft edits only reach forms and filters after Apply. */
export const ProTextField = React.forwardRef<HTMLInputElement, ProTextFieldProps>(function ProTextField(
  {
    value,
    defaultValue,
    onChange,
    expandable = true,
    separatorIncludesSpace = false,
    separatorIncludesComma = false,
    onApply,
    onCancel,
    onOpenChange,
    onClear,
    popoverWidth = 420,
    textareaProps,
    expandText,
    applyText,
    cancelText,
    clearText,
    className,
    classNames,
    locale,
    localeText,
    size = "small",
    inputProps,
    allowClear = true,
    disabled,
    readOnly,
    loading,
    addonAfter,
    onPaste,
    onKeyDown,
    onClick,
    onInput,
    onBlur,
    inputRule,
    inputPattern,
    ...props
  },
  ref,
) {
  const text = useComponentsLocale(locale, localeText);
  const {
    value: nativeValue,
    defaultValue: nativeDefaultValue,
    onPaste: nativeOnPaste,
    onKeyDown: nativeOnKeyDown,
    onClick: nativeOnClick,
    onBlur: nativeOnBlur,
    ...nativeInputProps
  } = inputProps ?? {};
  const controlledValue = value ?? (nativeValue !== undefined ? String(nativeValue) : undefined);
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? String(nativeDefaultValue ?? ""));
  const currentValue = controlledValue ?? internalValue;
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(currentValue);
  const [submitting, setSubmitting] = React.useState(false);
  const [submissionError, setSubmissionError] = React.useState(false);
  const submittingRef = React.useRef(false);
  const mountedRef = React.useRef(true);
  const operationRef = React.useRef(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const draftRef = React.useRef<HTMLTextAreaElement>(null);
  const inactive = Boolean(disabled || readOnly || loading);
  const multiline = expandable && /[\r\n]/.test(currentValue);
  const inputFilter = React.useMemo(() => createInputFilter(inputRule, inputPattern), [inputRule, inputPattern]);
  const directInputSeparators = React.useMemo(
    () => new RegExp(`(${stringSeparatorPattern(separatorIncludesSpace, separatorIncludesComma)})`),
    [separatorIncludesSpace, separatorIncludesComma],
  );
  const filterDirectInput = (raw: string) =>
    raw
      .split(directInputSeparators)
      .map((part, index) => (index % 2 === 0 ? inputFilter.filter(part) : part))
      .join("");
  const parse = (raw: string) =>
    splitString(raw, separatorIncludesSpace, separatorIncludesComma)
      .map(inputFilter.filter)
      .map((item) => item.trim())
      .filter(Boolean);
  const items = parse(draft);
  const change = (next: string, nextItems = parse(next)) => {
    if (controlledValue === undefined) setInternalValue(next);
    onChange?.(next, nextItems);
  };
  const changeOpen = (next: boolean, nextDraft = currentValue) => {
    if (inactive || submittingRef.current) return;
    if (next) {
      setDraft(nextDraft);
      setSubmissionError(false);
    } else if (open) {
      operationRef.current++;
      onCancel?.();
    }
    setOpen(next);
    onOpenChange?.(next);
  };
  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      operationRef.current++;
    };
  }, []);
  React.useEffect(() => {
    if (!inactive && expandable) return;
    if (open) {
      operationRef.current++;
      setOpen(false);
      onOpenChange?.(false);
    }
  }, [inactive, expandable, open, onOpenChange]);
  const clear = () => {
    change("");
    onClear?.();
    inputRef.current?.focus();
  };
  const apply = async () => {
    if (inactive || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setSubmissionError(false);
    const nextItems = parse(draft);
    const next = nextItems.join("\n");
    const operation = operationRef.current;
    try {
      if ((await onApply?.(next, nextItems)) === false) return;
      if (!mountedRef.current || operation !== operationRef.current) return;
      change(next, nextItems);
      if (!next && currentValue) onClear?.();
      setOpen(false);
      onOpenChange?.(false);
    } catch {
      if (mountedRef.current && operation === operationRef.current) setSubmissionError(true);
    } finally {
      submittingRef.current = false;
      if (mountedRef.current) setSubmitting(false);
    }
  };
  const separators = [
    text["换行"],
    ...(separatorIncludesSpace ? [text["空格"]] : []),
    ...(separatorIncludesComma ? [text["中英文逗号"]] : []),
  ].join(" / ");
  const editor = (
    <PopoverPrimitive.Content
      align="start"
      side="bottom"
      sideOffset={6}
      collisionPadding={8}
      aria-label={text["批量输入"]}
      className={cx("biu-pro-textfield__editor", classNames?.editor)}
      style={{ width: popoverWidth }}
      onOpenAutoFocus={(event) => {
        event.preventDefault();
        draftRef.current?.focus();
      }}
      onInteractOutside={(event) => {
        if (submittingRef.current) event.preventDefault();
      }}
      onEscapeKeyDown={(event) => {
        if (submittingRef.current) event.preventDefault();
      }}
      data-biu-overlay-interactive="true"
    >
      <div className="biu-pro-textfield__title">{text["批量输入"]}</div>
      <p className={cx("biu-pro-textfield__description", classNames?.description)}>
        {text["按 {separators} 分隔，空项自动忽略"].replace("{separators}", separators)}
      </p>
      <Textarea
        {...textareaProps}
        ref={draftRef}
        className={cx("w-full", textareaProps?.className)}
        value={draft}
        rows={textareaProps?.rows ?? 7}
        resize={textareaProps?.resize ?? "vertical"}
        maxLength={textareaProps?.maxLength ?? props.maxLength}
        disabled={inactive || submitting}
        aria-label={textareaProps?.["aria-label"] ?? text["批量输入"]}
        placeholder={textareaProps?.placeholder ?? text["每行输入一项，也可粘贴多行文本"]}
        locale={locale}
        localeText={localeText}
        onChange={(event) => setDraft(event.currentTarget.value)}
        onKeyDown={(event) => {
          textareaProps?.onKeyDown?.(event);
          if (!event.defaultPrevented && event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            void apply();
          }
        }}
      />
      {submissionError ? (
        <p role="alert" className="biu-pro-textfield__error">
          {text["应用失败，请重试"]}
        </p>
      ) : null}
      <div className={cx("biu-pro-textfield__actions", classNames?.actions)}>
        <span role="status" className="biu-pro-textfield__count">
          {text["共 {count} 项"].replace("{count}", String(items.length))}
        </span>
        <Button
          size="small"
          type="secondary"
          variant="text"
          disabled={inactive || submitting || !draft}
          onClick={() => setDraft("")}
        >
          {clearText ?? text["清除"]}
        </Button>
        <Button size="small" type="secondary" disabled={submitting} onClick={() => changeOpen(false)}>
          {cancelText ?? text["取消"]}
        </Button>
        <Button size="small" type="dark" loading={submitting} disabled={inactive} onClick={() => void apply()}>
          {applyText ?? text["应用"]}
        </Button>
      </div>
    </PopoverPrimitive.Content>
  );
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={changeOpen}>
      <PopoverPrimitive.Anchor asChild>
        <span
          className={cx("biu-pro-textfield", classNames?.root, className)}
          data-biu-component="pro-textfield"
          data-biu-layer="pro"
        >
          <TextField
            {...props}
            ref={mergeRefs(ref, inputRef)}
            inputProps={nativeInputProps}
            className="w-full"
            classNames={{ ...classNames, root: undefined }}
            value={multiline ? parse(currentValue).join(", ") : currentValue}
            readOnly={readOnly || multiline}
            disabled={disabled}
            loading={loading}
            size={size}
            locale={locale}
            localeText={localeText}
            allowClear={allowClear && !multiline}
            onClear={onClear}
            onInput={(event) => {
              event.currentTarget.value = filterDirectInput(event.currentTarget.value);
              onInput?.(event);
            }}
            onChange={(event) => {
              const next = filterDirectInput(event.currentTarget.value);
              event.currentTarget.value = next;
              change(next);
            }}
            onClick={(event) => {
              onClick?.(event);
              nativeOnClick?.(event);
              if (!event.defaultPrevented && multiline) changeOpen(true);
            }}
            onBlur={(event) => {
              onBlur?.(event);
              nativeOnBlur?.(event);
              if (event.defaultPrevented || inactive || multiline || open) return;
              const nextItems = parse(event.currentTarget.value);
              const separator = separatorIncludesSpace
                ? separatorIncludesComma
                  ? ","
                  : " "
                : separatorIncludesComma
                  ? ", "
                  : "\n";
              const formatted = nextItems.join(separator);
              if (formatted !== event.currentTarget.value) {
                event.currentTarget.value = formatted;
                change(formatted, nextItems);
              }
            }}
            onKeyDown={(event) => {
              onKeyDown?.(event);
              nativeOnKeyDown?.(event);
              if (!event.defaultPrevented && multiline && event.key === "Enter") {
                event.preventDefault();
                changeOpen(true);
              }
            }}
            onPaste={(event) => {
              onPaste?.(event);
              nativeOnPaste?.(event);
              const pasted = event.clipboardData.getData("text");
              if (event.defaultPrevented || !expandable || inactive || !/[\r\n]/.test(pasted)) return;
              event.preventDefault();
              const input = event.currentTarget;
              const nextDraft = multiline
                ? pasted
                : currentValue.slice(0, input.selectionStart ?? 0) +
                  pasted +
                  currentValue.slice(input.selectionEnd ?? currentValue.length);
              changeOpen(true, nextDraft);
            }}
            addonAfter={
              addonAfter || expandable ? (
                <>
                  {addonAfter}
                  {expandable ? (
                    <span
                      className="biu-pro-textfield__action-anchor"
                      data-has-clear={(multiline && allowClear && !inactive) || undefined}
                    >
                      <span className="biu-pro-textfield__inline-actions">
                        {multiline && allowClear && !inactive ? (
                          <Button
                            size="small"
                            type="secondary"
                            variant="text"
                            onlyIcon
                            className="biu-pro-textfield__inline-action-button"
                            icon={<X size={12} />}
                            onClick={clear}
                          >
                            {clearText ?? text["清除"]}
                          </Button>
                        ) : null}
                        <PopoverPrimitive.Trigger asChild>
                          <Button
                            size="small"
                            type="secondary"
                            variant="text"
                            onlyIcon
                            className="biu-pro-textfield__inline-action-button"
                            icon={<Maximize2 size={12} />}
                            disabled={inactive}
                          >
                            {expandText ?? text["批量输入"]}
                          </Button>
                        </PopoverPrimitive.Trigger>
                      </span>
                    </span>
                  ) : null}
                </>
              ) : undefined
            }
          />
        </span>
      </PopoverPrimitive.Anchor>
      {open && typeof document !== "undefined" ? createPortal(editor, document.body) : null}
    </PopoverPrimitive.Root>
  );
});
