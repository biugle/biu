import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { createPortal } from "react-dom";
import dayjs, { type Dayjs } from "dayjs";
import { Calendar, Check, ChevronDown, ChevronLeft, ChevronRight, Clock, Minus, Plus, X } from "@biugle/icons";
import { cx, mergeRefs, type BiuClassNames, type BiuSize } from "../../shared/utils.js";
import { Ellipsis, Tooltip } from "../overlay/index.js";
import {
  useComponentsLocale,
  type BiuComponentsLocale,
  type BiuComponentsLocaleTextOverrides,
} from "../../provider.js";

export interface ControlClassNames extends BiuClassNames {
  root?: string;
  control?: string;
  input?: string;
  clear?: string;
  prefix?: string;
  suffix?: string;
  error?: string;
  count?: string;
  handle?: string;
  trigger?: string;
  panel?: string;
  header?: string;
  body?: string;
  footer?: string;
  option?: string;
  search?: string;
  tag?: string;
  label?: string;
  icon?: string;
  track?: string;
  thumb?: string;
  decrement?: string;
  increment?: string;
}

export interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  error?: React.ReactNode;
  loading?: boolean;
  allowClear?: boolean;
  onClear?: () => void;
  showCount?: boolean;
  addonBefore?: React.ReactNode;
  addonAfter?: React.ReactNode;
  size?: BiuSize;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  classNames?: ControlClassNames;
  locale?: BiuComponentsLocale;
  localeText?: BiuComponentsLocaleTextOverrides;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
    error,
    loading = false,
    allowClear = false,
    onClear,
    showCount = false,
    addonBefore,
    addonAfter,
    inputProps,
    size = "medium",
    locale,
    localeText,
    className,
    classNames,
    value,
    defaultValue,
    maxLength,
    disabled,
    readOnly,
    onChange,
    onInput,
    ...props
  },
  ref,
) {
  const text = useComponentsLocale(locale, localeText);
  const controlled = value !== undefined;
  const [internalValue, setInternalValue] =
    React.useState<React.InputHTMLAttributes<HTMLInputElement>["value"]>(defaultValue);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const currentValue = controlled ? value : internalValue;
  const canClear = allowClear && !disabled && !readOnly && String(currentValue ?? "").length > 0;
  const {
    className: inputClassName,
    onChange: inputOnChange,
    onInput: inputOnInput,
    value: inputValue,
    defaultValue: inputDefaultValue,
    ...restInputProps
  } = inputProps ?? {};
  const inputControlled = controlled || inputValue !== undefined;
  const activeValue = inputControlled ? (controlled ? value : inputValue) : undefined;
  return (
    <span
      className={cx(
        "biu-ui-textfield",
        `biu-ui-textfield--${size}`,
        error && "biu-ui-control--error",
        disabled && "biu-ui-control--disabled",
        readOnly && "biu-ui-control--readonly",
        className,
        classNames?.root,
      )}
      data-biu-component="textfield"
      data-state={error ? "error" : disabled ? "disabled" : readOnly ? "readonly" : "default"}
    >
      <span className={cx("biu-ui-textfield__control", classNames?.control)}>
        {addonBefore ? (
          <span className={cx("biu-ui-textfield__addon", "biu-ui-textfield__addon--before", classNames?.prefix)}>
            {addonBefore}
          </span>
        ) : null}
        <input
          {...props}
          {...restInputProps}
          ref={mergeRefs(ref, inputRef)}
          value={activeValue}
          onChange={(event) => {
            if (!controlled) setInternalValue(event.target.value);
            onChange?.(event);
            inputOnChange?.(event);
          }}
          onInput={(event) => {
            onInput?.(event);
            inputOnInput?.(event);
          }}
          defaultValue={inputControlled ? undefined : (inputDefaultValue ?? defaultValue)}
          maxLength={maxLength}
          disabled={disabled || loading}
          readOnly={readOnly}
          className={cx("biu-ui-textfield__input", inputClassName, classNames?.input)}
          data-biu-slot="textfield-input"
        />
        {loading ? <span className="biu-ui-textfield__spinner" aria-hidden="true" /> : null}
        {canClear ? (
          <button
            type="button"
            className={cx("biu-ui-textfield__clear", classNames?.clear)}
            aria-label={text["清除"]}
            title={text["清除"]}
            onClick={() => {
              if (!controlled) setInternalValue("");
              const input = inputRef.current;
              if (input) {
                const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
                setter?.call(input, "");
              }
              const clearEvent = {
                target: input ?? ({ value: "" } as HTMLInputElement),
                currentTarget: input ?? ({ value: "" } as HTMLInputElement),
              } as React.ChangeEvent<HTMLInputElement>;
              onChange?.(clearEvent);
              inputOnChange?.(clearEvent);
              onClear?.();
            }}
          >
            <X size={14} aria-hidden="true" />
          </button>
        ) : null}
        {addonAfter ? (
          <span className={cx("biu-ui-textfield__addon", "biu-ui-textfield__addon--after", classNames?.suffix)}>
            {addonAfter}
          </span>
        ) : null}
      </span>
      {showCount && maxLength ? (
        <span className={cx("biu-ui-textfield__count", classNames?.count)}>
          {String(currentValue ?? "").length}/{maxLength}
        </span>
      ) : null}
      {error ? (
        <span className={cx("biu-ui-control__error", classNames?.error)} role="alert">
          {error}
        </span>
      ) : null}
    </span>
  );
});

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: React.ReactNode;
  allowClear?: boolean;
  onClear?: () => void;
  showCount?: boolean;
  addonBefore?: React.ReactNode;
  addonAfter?: React.ReactNode;
  size?: BiuSize;
  /** Resize direction. The component owns the resize handle and dimensions. */
  resize?: "both" | "horizontal" | "vertical" | "none";
  textareaProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
  classNames?: ControlClassNames;
  locale?: BiuComponentsLocale;
  localeText?: BiuComponentsLocaleTextOverrides;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    error,
    allowClear = false,
    onClear,
    showCount = false,
    addonBefore,
    addonAfter,
    textareaProps,
    size = "medium",
    resize = "both",
    locale,
    localeText,
    className,
    classNames,
    style: textareaStyle,
    value,
    defaultValue,
    maxLength,
    disabled,
    readOnly,
    onChange,
    onInput,
    ...props
  },
  ref,
) {
  const text = useComponentsLocale(locale, localeText);
  const controlled = value !== undefined;
  const [internalValue, setInternalValue] =
    React.useState<React.TextareaHTMLAttributes<HTMLTextAreaElement>["value"]>(defaultValue);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const currentValue = controlled ? value : internalValue;
  const canClear = allowClear && !disabled && !readOnly && String(currentValue ?? "").length > 0;
  const {
    className: textareaClassName,
    onChange: textareaOnChange,
    onInput: textareaOnInput,
    value: textareaValue,
    defaultValue: textareaDefaultValue,
    ...restTextareaProps
  } = textareaProps ?? {};
  const inputControlled = controlled || textareaValue !== undefined;
  const activeValue = inputControlled ? (controlled ? value : textareaValue) : undefined;
  const [dimensions, setDimensions] = React.useState<{ width?: number; height?: number }>({});
  const resizeSessionRef = React.useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);
  const resizeListenersRef = React.useRef<{ move: (event: PointerEvent) => void; up: () => void } | undefined>(
    undefined,
  );
  const stopResize = React.useCallback(() => {
    const listeners = resizeListenersRef.current;
    if (listeners && typeof window !== "undefined") {
      window.removeEventListener("pointermove", listeners.move, true);
      window.removeEventListener("pointerup", listeners.up, true);
      window.removeEventListener("pointercancel", listeners.up, true);
    }
    resizeListenersRef.current = undefined;
    resizeSessionRef.current = null;
  }, []);
  React.useEffect(() => stopResize, [stopResize]);
  const handleResizePointerDown = (event: React.PointerEvent<HTMLSpanElement>) => {
    if (resize === "none" || disabled || readOnly || event.button !== 0 || typeof window === "undefined") return;
    const handle = event.currentTarget.dataset.biuResizeHandle === "true";
    const controlElement = handle ? event.currentTarget.parentElement : (event.currentTarget as HTMLSpanElement | null);
    if (!controlElement) return;
    const control = controlElement.getBoundingClientRect();
    const inResizeCorner = handle || (event.clientX >= control.right - 24 && event.clientY >= control.bottom - 24);
    if (!inResizeCorner) return;
    const textarea = textareaRef.current;
    if (!textarea) return;
    event.preventDefault();
    event.stopPropagation();
    stopResize();
    const textareaRect = textarea.getBoundingClientRect();
    resizeSessionRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: textareaRect.width,
      startHeight: textareaRect.height,
    };
    const canResizeWidth = resize === "both" || resize === "horizontal";
    const canResizeHeight = resize === "both" || resize === "vertical";
    const move = (nativeEvent: PointerEvent) => {
      const session = resizeSessionRef.current;
      if (!session || session.pointerId !== nativeEvent.pointerId) return;
      setDimensions((current) => ({
        ...current,
        ...(canResizeWidth
          ? { width: Math.max(160, Math.round(session.startWidth + nativeEvent.clientX - session.startX)) }
          : {}),
        ...(canResizeHeight
          ? { height: Math.max(72, Math.round(session.startHeight + nativeEvent.clientY - session.startY)) }
          : {}),
      }));
      nativeEvent.preventDefault();
    };
    const up = () => stopResize();
    resizeListenersRef.current = { move, up };
    window.addEventListener("pointermove", move, true);
    window.addEventListener("pointerup", up, true);
    window.addEventListener("pointercancel", up, true);
  };
  return (
    <span
      className={cx(
        "biu-ui-textarea",
        `biu-ui-textarea--${size}`,
        error && "biu-ui-control--error",
        disabled && "biu-ui-control--disabled",
        readOnly && "biu-ui-control--readonly",
        resizeSessionRef.current && "biu-ui-textarea--resizing",
        className,
        classNames?.root,
      )}
      data-biu-component="textarea"
      style={dimensions.width ? { width: `${dimensions.width}px`, maxWidth: "100%" } : undefined}
    >
      {addonBefore ? <span className={cx("biu-ui-textarea__addon", classNames?.prefix)}>{addonBefore}</span> : null}
      <span
        className={cx("biu-ui-textarea__control", classNames?.control)}
        onPointerDown={handleResizePointerDown}
        style={dimensions.height ? { height: `${dimensions.height}px` } : undefined}
        data-biu-resize={resize}
      >
        <textarea
          {...props}
          {...restTextareaProps}
          ref={mergeRefs(ref, textareaRef)}
          value={activeValue}
          onChange={(event) => {
            if (!controlled) setInternalValue(event.target.value);
            onChange?.(event);
            textareaOnChange?.(event);
          }}
          onInput={(event) => {
            onInput?.(event);
            textareaOnInput?.(event);
          }}
          defaultValue={inputControlled ? undefined : (textareaDefaultValue ?? defaultValue)}
          maxLength={maxLength}
          disabled={disabled}
          readOnly={readOnly}
          style={
            {
              ...textareaStyle,
              "--biu-textarea-resize": resize,
              height: dimensions.height ? `${dimensions.height}px` : textareaStyle?.height,
            } as React.CSSProperties
          }
          className={cx("biu-ui-textarea__input", textareaClassName, classNames?.input)}
          data-biu-slot="textarea-input"
        />
        {canClear ? (
          <button
            type="button"
            className={cx("biu-ui-textarea__clear", classNames?.clear)}
            aria-label={text["清除"]}
            title={text["清除"]}
            onClick={() => {
              if (!controlled) setInternalValue("");
              const textarea = textareaRef.current;
              if (textarea) {
                const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
                setter?.call(textarea, "");
              }
              const clearEvent = {
                target: textarea ?? ({ value: "" } as HTMLTextAreaElement),
                currentTarget: textarea ?? ({ value: "" } as HTMLTextAreaElement),
              } as React.ChangeEvent<HTMLTextAreaElement>;
              onChange?.(clearEvent);
              textareaOnChange?.(clearEvent);
              onClear?.();
            }}
          >
            <X size={14} aria-hidden="true" />
          </button>
        ) : null}
        {resize !== "none" ? (
          <span
            aria-hidden="true"
            className="biu-ui-textarea__resize-handle"
            data-biu-resize-handle="true"
            onPointerDown={handleResizePointerDown}
          />
        ) : null}
      </span>
      {addonAfter ? <span className={cx("biu-ui-textarea__addon", classNames?.suffix)}>{addonAfter}</span> : null}
      {showCount && maxLength ? (
        <span className={cx("biu-ui-textarea__count", classNames?.count)}>
          {String(currentValue ?? "").length}/{maxLength}
        </span>
      ) : null}
      {error ? (
        <span className={cx("biu-ui-control__error", classNames?.error)} role="alert">
          {error}
        </span>
      ) : null}
    </span>
  );
});

export interface InputNumberProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "defaultValue" | "onChange"
> {
  value?: number | string;
  defaultValue?: number | string;
  decimal?: number;
  /** @deprecated Use decimal. */
  precision?: number;
  changeOnWheel?: boolean;
  formatter?: (value: number | string | undefined) => string;
  parser?: (value: string) => number | string | undefined;
  stringMode?: boolean;
  onChange?: (value: number | string | undefined, event?: React.ChangeEvent<HTMLInputElement>) => void;
  classNames?: ControlClassNames;
  locale?: BiuComponentsLocale;
  localeText?: BiuComponentsLocaleTextOverrides;
}

export const InputNumber = React.forwardRef<HTMLInputElement, InputNumberProps>(function InputNumber(
  {
    value,
    defaultValue,
    onChange,
    decimal,
    precision,
    changeOnWheel = false,
    formatter,
    parser,
    stringMode = false,
    className,
    classNames,
    disabled,
    readOnly,
    onWheel,
    onKeyDown,
    step = 1,
    min,
    max,
    locale,
    localeText,
    ...props
  },
  ref,
) {
  const text = useComponentsLocale(locale, localeText);
  const digits = decimal ?? precision;
  const [internal, setInternal] = React.useState<number | string | undefined>(defaultValue);
  const active = value === undefined ? internal : value;
  const display = formatter ? formatter(active) : (active ?? "");
  const numericStep = Number(step) || 1;
  const normalize = (next: number) => {
    const bounded = Math.max(
      min === undefined ? -Infinity : Number(min),
      Math.min(max === undefined ? Infinity : Number(max), next),
    );
    return digits === undefined ? bounded : Number(bounded.toFixed(digits));
  };
  const commit = (next: number | string | undefined, event?: React.ChangeEvent<HTMLInputElement>) => {
    if (value === undefined) setInternal(next);
    onChange?.(next, event);
  };
  const changeBy = (direction: 1 | -1, event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || readOnly) return;
    const current = Number(active ?? 0);
    const next = normalize(current + numericStep * direction);
    commit(stringMode ? String(next) : next);
    event.currentTarget.blur();
  };
  const handleWheel = (event: React.WheelEvent<HTMLInputElement>) => {
    onWheel?.(event);
    if (!changeOnWheel || disabled || readOnly || event.deltaY === 0) return;
    const activeElement = typeof document === "undefined" ? null : document.activeElement;
    if (activeElement !== event.currentTarget) return;
    event.preventDefault();
    const next = normalize(Number(active ?? 0) + (event.deltaY < 0 ? numericStep : -numericStep));
    commit(stringMode ? String(next) : next);
  };
  return (
    <span
      className={cx(
        "biu-ui-input-number",
        disabled && "biu-ui-control--disabled",
        readOnly && "biu-ui-control--readonly",
        className,
        classNames?.root,
      )}
      data-biu-component="input-number"
      data-state={disabled ? "disabled" : readOnly ? "readonly" : "default"}
    >
      <button
        type="button"
        className={cx("biu-ui-input-number__button", "biu-ui-input-number__decrement", classNames?.decrement)}
        aria-label={text["减少"]}
        disabled={disabled || readOnly || (min !== undefined && Number(active ?? 0) <= Number(min))}
        tabIndex={-1}
        onClick={(event) => changeBy(-1, event)}
      >
        <Minus size={16} aria-hidden="true" />
      </button>
      <input
        {...props}
        ref={ref}
        type="text"
        inputMode="decimal"
        role="spinbutton"
        aria-valuenow={active === undefined || active === "" ? undefined : Number(active)}
        aria-valuemin={min === undefined ? undefined : Number(min)}
        aria-valuemax={max === undefined ? undefined : Number(max)}
        className={cx("biu-ui-input-number__input", classNames?.input)}
        value={display}
        disabled={disabled}
        readOnly={readOnly}
        onWheel={handleWheel}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || disabled || readOnly) return;
          if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            event.preventDefault();
            const next = normalize(Number(active ?? 0) + (event.key === "ArrowUp" ? numericStep : -numericStep));
            commit(stringMode ? String(next) : next);
          }
        }}
        onChange={(event) => {
          const raw = event.target.value;
          const parsed = raw === "" ? undefined : parser ? parser(raw) : stringMode ? raw : Number(raw);
          const normalized =
            typeof parsed === "number" && digits !== undefined ? Number(parsed.toFixed(digits)) : parsed;
          commit(normalized, event);
        }}
      />
      <button
        type="button"
        className={cx("biu-ui-input-number__button", "biu-ui-input-number__increment", classNames?.increment)}
        aria-label={text["增加"]}
        disabled={disabled || readOnly || (max !== undefined && Number(active ?? 0) >= Number(max))}
        tabIndex={-1}
        onClick={(event) => changeBy(1, event)}
      >
        <Plus size={16} aria-hidden="true" />
      </button>
    </span>
  );
});

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

export interface SelectOption {
  label: React.ReactNode;
  value: string;
  disabled?: boolean;
  [key: string]: unknown;
}

export type SelectMode = "single" | "multiple";
export interface SelectClassNames extends ControlClassNames {
  value?: string;
  placeholder?: string;
  menu?: string;
  allOption?: string;
}

export interface SelectProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  options?: SelectOption[];
  value?: string | string[];
  defaultValue?: string | string[];
  mode?: SelectMode;
  multiple?: boolean;
  disabled?: boolean;
  loading?: boolean;
  size?: BiuSize;
  allowClear?: boolean;
  searchable?: boolean;
  searchValue?: string;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  filterOption?: ((input: string, option: SelectOption) => boolean) | boolean;
  hasAllOption?: boolean;
  allowAllSelect?: boolean;
  allOption?: SelectOption;
  optionRender?: (option: SelectOption, index: number) => React.ReactNode;
  labelRender?: (value: string, option?: SelectOption) => React.ReactNode;
  tagRender?: (option: SelectOption, onClose: () => void) => React.ReactNode;
  dropdownRender?: (menu: React.ReactNode) => React.ReactNode;
  dropdownHeader?: React.ReactNode;
  dropdownFooter?: React.ReactNode;
  notFoundContent?: React.ReactNode;
  maxTagCount?: number | "responsive";
  maxCount?: number;
  onLoadMore?: () => void | Promise<void>;
  onLoadError?: (error: unknown) => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  onChange?: (value: string | string[] | undefined, option?: SelectOption | SelectOption[], index?: number) => void;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  defaultOpen?: boolean;
  placeholder?: React.ReactNode;
  locale?: BiuComponentsLocale;
  localeText?: BiuComponentsLocaleTextOverrides;
  classNames?: SelectClassNames;
}

const ALL_OPTION_VALUE = "__biu_select_all__";

function optionText(option: SelectOption) {
  return typeof option.label === "string" ? option.label : String(option.value);
}

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(function Select(
  {
    options = [],
    value,
    defaultValue,
    mode,
    multiple,
    disabled = false,
    loading = false,
    size = "medium",
    allowClear = false,
    searchable = false,
    searchValue,
    searchPlaceholder,
    onSearch,
    filterOption = true,
    hasAllOption = false,
    allowAllSelect = false,
    allOption,
    optionRender,
    labelRender,
    tagRender,
    dropdownRender,
    dropdownHeader,
    dropdownFooter,
    notFoundContent,
    maxTagCount,
    maxCount,
    onLoadMore,
    onLoadError,
    hasMore = false,
    loadingMore = false,
    onChange,
    onOpenChange,
    open,
    defaultOpen = false,
    placeholder,
    locale,
    localeText,
    className,
    classNames,
    ...props
  },
  ref,
) {
  const text = useComponentsLocale(locale, localeText);
  const resolvedSearchPlaceholder = searchPlaceholder ?? text["搜索"];
  const isMultiple = multiple ?? mode === "multiple";
  // Keep the sentinel value under our control when the caller only customizes
  // the label. A custom value is still supported for single-select use cases,
  // but all internal comparisons must use that same value consistently.
  const allValue = allOption?.value ?? ALL_OPTION_VALUE;
  const all = { ...allOption, label: allOption?.label ?? text["全部"], value: allValue };
  const sourceOptions = React.useMemo(() => (hasAllOption ? [all, ...options] : options), [all, hasAllOption, options]);
  const [internalValue, setInternalValue] = React.useState<string | string[] | undefined>(defaultValue);
  const activeValue = value ?? internalValue ?? (isMultiple ? [] : undefined);
  const selectedValues = new Set(
    Array.isArray(activeValue) ? activeValue : activeValue === undefined ? [] : [activeValue],
  );
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const activeOpen = !disabled && !loading && (open ?? internalOpen);
  const [internalSearch, setInternalSearch] = React.useState("");
  const activeSearch = searchValue ?? internalSearch;
  const [loadPending, setLoadPending] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const setRef = (node: HTMLDivElement | null) => {
    rootRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };
  const setOpen = (next: boolean) => {
    if (disabled || loading) return;
    if (open === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };
  const filteredOptions = React.useMemo(() => {
    if (!activeSearch) return sourceOptions;
    return sourceOptions.filter((option) => {
      if (option.value === allValue) return true;
      return typeof filterOption === "function"
        ? filterOption(activeSearch, option)
        : filterOption
          ? optionText(option).toLowerCase().includes(activeSearch.toLowerCase())
          : true;
    });
  }, [activeSearch, filterOption, sourceOptions]);
  const selectedOptions = sourceOptions.filter((option) => selectedValues.has(option.value));
  const responsiveTagLimit = maxTagCount === "responsive" ? 3 : undefined;
  const numericMaxTagCount = typeof maxTagCount === "number" ? maxTagCount : responsiveTagLimit;
  const visibleSelected =
    numericMaxTagCount === undefined ? selectedOptions : selectedOptions.slice(0, numericMaxTagCount);
  const hiddenSelectedCount = selectedOptions.length - visibleSelected.length;
  const hiddenSelected = selectedOptions.slice(visibleSelected.length);
  const hiddenSelectedTooltip = hiddenSelected.length ? (
    <div className="biu-ui-select__hidden-tags-tooltip">
      {hiddenSelected.map((item) => (
        <Ellipsis key={item.value} content={item.label} maxWidth="100%" alwaysTooltip>
          {item.label}
        </Ellipsis>
      ))}
    </div>
  ) : null;

  const emit = (
    next: string | string[] | undefined,
    option: SelectOption | SelectOption[] | undefined,
    index: number,
  ) => {
    if (value === undefined) setInternalValue(next);
    onChange?.(next, option, index);
  };
  const selectOption = (option: SelectOption, index: number) => {
    if (disabled || loading || option.disabled) return;
    if (option.value === allValue && isMultiple && allowAllSelect) {
      const enabled = sourceOptions.filter((item) => item.value !== allValue && !item.disabled);
      const allSelected = enabled.length > 0 && enabled.every((item) => selectedValues.has(item.value));
      emit(allSelected ? [] : enabled.slice(0, maxCount ?? enabled.length).map((item) => item.value), option, index);
      return;
    }
    if (isMultiple) {
      const current = Array.isArray(activeValue) ? activeValue : [];
      const exists = current.includes(option.value);
      if (exists)
        emit(
          current.filter((item) => item !== option.value),
          option,
          index,
        );
      else if (maxCount !== undefined && current.length >= maxCount) return;
      else emit([...current, option.value], option, index);
      return;
    }
    emit(option.value, option, index);
    setOpen(false);
  };
  const removeValue = (target: string) => {
    if (disabled || loading) return;
    if (!isMultiple) {
      emit(undefined, undefined, -1);
      return;
    }
    emit(
      (Array.isArray(activeValue) ? activeValue : []).filter((item) => item !== target),
      sourceOptions.find((item) => item.value === target),
      sourceOptions.findIndex((item) => item.value === target),
    );
  };
  const clearValue = () => {
    if (disabled || loading) return;
    emit(isMultiple ? [] : undefined, undefined, -1);
  };
  const handleScroll = async (event: React.UIEvent<HTMLDivElement>) => {
    if (!onLoadMore || loadingMore || loadPending || !hasMore) return;
    const target = event.currentTarget;
    if (target.scrollHeight - target.scrollTop - target.clientHeight > 32) return;
    setLoadPending(true);
    try {
      await onLoadMore();
    } catch (error) {
      onLoadError?.(error);
    } finally {
      setLoadPending(false);
    }
  };
  const triggerText = !isMultiple
    ? (() => {
        const selected = sourceOptions.find((item) => item.value === activeValue);
        return selected ? (labelRender?.(selected.value, selected) ?? selected.label) : (placeholder ?? text["请选择"]);
      })()
    : visibleSelected.length
      ? visibleSelected.map((item) => {
          const onClose = () => removeValue(item.value);
          const customTag = tagRender?.(item, onClose);
          if (customTag !== undefined && customTag !== null) {
            const customTagNode = React.isValidElement(customTag) ? (
              React.cloneElement(customTag, { key: item.value })
            ) : (
              <span className="biu-ui-select__custom-tag-content">{customTag}</span>
            );
            return (
              <Tooltip
                key={item.value}
                content={item.label}
                onlyOverflow
                placement="TOP"
                className="biu-ui-select__custom-tag-tooltip"
              >
                {customTagNode}
              </Tooltip>
            );
          }
          return (
            <span key={item.value} className={cx("biu-ui-select__tag", classNames?.tag)}>
              <Ellipsis content={item.label} className="biu-ui-select__tag-label" maxWidth="100%">
                {item.label}
              </Ellipsis>
              <span
                role="button"
                tabIndex={0}
                className="biu-ui-select__tag-remove"
                aria-disabled={disabled || loading || undefined}
                aria-label={text["移除 {text}"].replace("{text}", optionText(item))}
                onClick={(event) => {
                  event.stopPropagation();
                  onClose();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    event.stopPropagation();
                    onClose();
                  }
                }}
              >
                <X size={12} aria-hidden="true" />
              </span>
            </span>
          );
        })
      : (placeholder ?? text["请选择"]);
  const menu = (
    <div className={cx("biu-ui-select__menu", classNames?.menu)} data-biu-slot="select-menu">
      {dropdownHeader ? (
        <div className={cx("biu-ui-select__dropdown-header", classNames?.header)}>{dropdownHeader}</div>
      ) : null}
      {searchable ? (
        <div className={cx("biu-ui-select__search", classNames?.search)}>
          <input
            value={activeSearch}
            placeholder={resolvedSearchPlaceholder}
            aria-label={searchPlaceholder}
            onChange={(event) => {
              if (searchValue === undefined) setInternalSearch(event.target.value);
              onSearch?.(event.target.value);
            }}
            onKeyDown={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
      <div className="biu-ui-select__options" onScroll={(event) => void handleScroll(event)}>
        {filteredOptions.length ? (
          filteredOptions.map((option) => {
            const index = sourceOptions.indexOf(option);
            const selected =
              option.value === allValue && isMultiple && allowAllSelect
                ? sourceOptions
                    .filter((item) => item.value !== allValue && !item.disabled)
                    .every((item) => selectedValues.has(item.value))
                : selectedValues.has(option.value);
            return (
              <button
                type="button"
                key={option.value}
                disabled={disabled || loading || option.disabled}
                className={cx(
                  "biu-ui-select__option",
                  selected && "is-selected",
                  option.disabled && "is-disabled",
                  option.value === allValue && classNames?.allOption,
                  classNames?.option,
                )}
                role="option"
                aria-selected={selected}
                onClick={() => selectOption(option, index)}
              >
                {isMultiple ? (
                  <span className={cx("biu-ui-select__check", selected && "is-checked")} aria-hidden="true">
                    {selected ? <Check size={12} aria-hidden="true" /> : null}
                  </span>
                ) : null}
                <Ellipsis tooltipContent={option.label} className="biu-ui-select__option-label" maxWidth="100%">
                  {optionRender?.(option, index) ?? option.label}
                </Ellipsis>
              </button>
            );
          })
        ) : (
          <div className="biu-ui-select__empty">{notFoundContent ?? text["暂无数据"]}</div>
        )}
        {loadingMore || loadPending ? <div className="biu-ui-select__loading-more">{text["加载中…"]}</div> : null}
      </div>
      {dropdownFooter ? (
        <div className={cx("biu-ui-select__dropdown-footer", classNames?.footer)}>{dropdownFooter}</div>
      ) : null}
    </div>
  );
  return (
    <div
      {...props}
      ref={setRef}
      className={cx(
        "biu-ui-select",
        `biu-ui-select--${size}`,
        isMultiple && "biu-ui-select--multiple",
        disabled && "is-disabled",
        className,
        classNames?.root,
      )}
      data-biu-component="select"
      data-state={activeOpen ? "open" : "closed"}
    >
      <PopoverPrimitive.Root open={activeOpen} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>
          <div
            role="combobox"
            tabIndex={disabled ? -1 : 0}
            className={cx("biu-ui-select__trigger", classNames?.trigger)}
            aria-expanded={activeOpen}
            aria-disabled={disabled || undefined}
            aria-haspopup="listbox"
            onKeyDown={(event) => {
              if (disabled) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setOpen(!activeOpen);
              }
            }}
          >
            <span
              className={cx("biu-ui-select__value", !selectedOptions.length && "is-placeholder", classNames?.value)}
            >
              {triggerText}
            </span>
            {isMultiple && hiddenSelectedCount > 0 ? (
              <Tooltip content={hiddenSelectedTooltip} onlyOverflow={false} placement="TOP">
                <span
                  className="biu-ui-select__tag biu-ui-select__more-tag"
                  role="button"
                  tabIndex={0}
                  aria-label={text["还有 {count} 项"].replace("{count}", String(hiddenSelectedCount))}
                >
                  +{hiddenSelectedCount}
                </span>
              </Tooltip>
            ) : null}
            {allowClear && (isMultiple ? selectedOptions.length > 0 : activeValue !== undefined) ? (
              <span
                className="biu-ui-select__clear"
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation();
                  clearValue();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    event.stopPropagation();
                    clearValue();
                  }
                }}
              >
                <X size={13} aria-hidden="true" />
              </span>
            ) : (
              <span className="biu-ui-select__arrow" aria-hidden="true">
                <ChevronDown size={15} />
              </span>
            )}
          </div>
        </PopoverPrimitive.Trigger>
        {activeOpen && typeof document !== "undefined"
          ? createPortal(
              <PopoverPrimitive.Content
                className={cx("biu-ui-select__content", classNames?.panel)}
                sideOffset={6}
                collisionPadding={8}
                align="start"
                data-biu-overlay-interactive="true"
                onOpenAutoFocus={(event) => {
                  if (!searchable) event.preventDefault();
                }}
              >
                {dropdownRender ? dropdownRender(menu) : menu}
              </PopoverPrimitive.Content>,
              document.body,
            )
          : null}
      </PopoverPrimitive.Root>
    </div>
  );
});

function normalizeDateFormat(format: string, fallback: string, hour12 = false) {
  if (!format) return fallback;
  // Keep the public format vocabulary readable (`yyyy-mm-dd hh:ii:ss`) while
  // mapping it to dayjs tokens. `mm` means month in a date format and `ii`
  // means minute in a time format, so mark minutes before converting months.
  let normalized = format
    .replace(/yyyy/g, "YYYY")
    .replace(/yy/g, "YY")
    .replace(/ii/g, "__BIU_MINUTE__")
    .replace(/hh/g, hour12 ? "hh" : "HH")
    .replace(/dd/g, "DD");
  if (/(yyyy|yy|dd)/i.test(format)) {
    const separator = normalized.search(/[ T]/);
    const datePart = separator < 0 ? normalized : normalized.slice(0, separator);
    normalized = `${datePart.replace(/mm/g, "MM")}${separator < 0 ? "" : normalized.slice(separator)}`;
  }
  return normalized.replace(/__BIU_MINUTE__/g, "mm");
}

export interface DatePickerPreset {
  label: React.ReactNode;
  value: Dayjs | [Dayjs | null, Dayjs | null] | (() => Dayjs | [Dayjs | null, Dayjs | null]);
}

export interface DatePickerClassNames extends ControlClassNames {
  content?: string;
  calendar?: string;
  weekdays?: string;
  week?: string;
  day?: string;
  time?: string;
  presets?: string;
}

export interface DatePickerProps {
  value?: Dayjs | null | [Dayjs | null, Dayjs | null];
  defaultValue?: Dayjs | null | [Dayjs | null, Dayjs | null];
  onChange?: (value: Dayjs | null | [Dayjs | null, Dayjs | null], dateString?: string | string[]) => void;
  range?: boolean;
  format?: string;
  showTime?: boolean;
  /** Internal shared mode used by TimePicker; consumers should use TimePicker. */
  timeOnly?: boolean;
  hour12?: boolean;
  needConfirm?: boolean;
  showNow?: boolean;
  allowClear?: boolean;
  placeholder?: string | [string, string];
  presets?: DatePickerPreset[];
  footer?: React.ReactNode;
  disabledDate?: (date: Dayjs) => boolean;
  disabledTime?: (
    date: Dayjs | null,
    position?: "start" | "end",
  ) => {
    disabledHours?: () => number[];
    disabledMinutes?: (hour: number) => number[];
    disabledSeconds?: (hour: number, minute: number) => number[];
  };
  min?: Dayjs;
  max?: Dayjs;
  disabled?: boolean;
  readOnly?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
  classNames?: DatePickerClassNames;
  locale?: BiuComponentsLocale;
  localeText?: BiuComponentsLocaleTextOverrides;
  id?: string;
  error?: React.ReactNode;
  renderCell?: (date: Dayjs) => React.ReactNode;
}

function isRangeValue(value: DatePickerProps["value"]): value is [Dayjs | null, Dayjs | null] {
  return Array.isArray(value);
}

function formatDateValue(value: Dayjs | null | undefined, format: string) {
  return value ? value.format(format) : "";
}

function resolvePreset(value: DatePickerPreset["value"]) {
  return typeof value === "function" ? value() : value;
}

function CalendarPanel({
  value,
  range,
  month,
  setMonth,
  disabledDate,
  min,
  max,
  onSelect,
  renderCell,
  className,
  classNames,
  text,
}: {
  value: Dayjs | null | [Dayjs | null, Dayjs | null];
  range: boolean;
  month: Dayjs;
  setMonth: (value: Dayjs) => void;
  disabledDate?: (date: Dayjs) => boolean;
  min?: Dayjs;
  max?: Dayjs;
  onSelect: (date: Dayjs) => void;
  renderCell?: (date: Dayjs) => React.ReactNode;
  className?: string;
  classNames?: DatePickerClassNames;
  text: ReturnType<typeof useComponentsLocale>;
}) {
  const activeRange = isRangeValue(value) ? value : [value, null];
  const start = month.startOf("month").startOf("week");
  const dates = Array.from({ length: 42 }, (_, index) => start.add(index, "day"));
  const weekdays = (text["星期"] ?? "").split(",");
  return (
    <div className={cx("biu-ui-date-picker__calendar", classNames?.calendar, className)}>
      <div className="biu-ui-date-picker__calendar-header">
        <button type="button" aria-label={text["上个月"]} onClick={() => setMonth(month.subtract(1, "month"))}>
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        <strong>{month.format(text["年月"])}</strong>
        <button type="button" aria-label={text["下个月"]} onClick={() => setMonth(month.add(1, "month"))}>
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
      <div className={cx("biu-ui-date-picker__weekdays", classNames?.weekdays)}>
        {weekdays.map((day) => (
          <span className={classNames?.week} key={day}>
            {day}
          </span>
        ))}
      </div>
      <div className="biu-ui-date-picker__days">
        {dates.map((date) => {
          const outside = date.month() !== month.month();
          const blocked = Boolean(
            (min && date.isBefore(min, "day")) || (max && date.isAfter(max, "day")) || disabledDate?.(date),
          );
          const selected = activeRange.some((item) => item?.isSame(date, "day"));
          const between =
            range &&
            activeRange[0] &&
            activeRange[1] &&
            date.isAfter(activeRange[0], "day") &&
            date.isBefore(activeRange[1], "day");
          return (
            <button
              key={date.format("YYYY-MM-DD")}
              type="button"
              disabled={blocked}
              className={cx(
                "biu-ui-date-picker__day",
                classNames?.day,
                outside && "is-outside",
                selected && "is-selected",
                between && "is-between",
              )}
              data-date={date.format("YYYY-MM-DD")}
              onClick={() => onSelect(date)}
            >
              {renderCell?.(date) ?? date.date()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TimePanel({
  value,
  hour12,
  showSeconds,
  onChange,
  disabledTime,
  position,
  className,
  text,
}: {
  value: Dayjs | null;
  hour12: boolean;
  showSeconds: boolean;
  onChange: (value: Dayjs) => void;
  disabledTime?: DatePickerProps["disabledTime"];
  position?: "start" | "end";
  className?: string;
  text: ReturnType<typeof useComponentsLocale>;
}) {
  const active = value ?? dayjs("2000-01-01T00:00:00");
  const disabled = disabledTime?.(active, position);
  const hours = Array.from({ length: hour12 ? 12 : 24 }, (_, index) => (hour12 ? index + 1 : index));
  const minuteValues = Array.from({ length: 60 }, (_, index) => index);
  const secondValues = Array.from({ length: 60 }, (_, index) => index);
  const visibleHour = hour12 ? active.hour() % 12 || 12 : active.hour();
  const hourOptions = hours.map((item) => ({
    value: String(item),
    label: String(item).padStart(2, "0"),
    disabled: (disabled?.disabledHours?.() ?? []).includes(
      hour12 ? (active.hour() >= 12 ? (item % 12) + 12 : item % 12) : item,
    ),
  }));
  const minuteOptions = minuteValues.map((item) => ({
    value: String(item),
    label: String(item).padStart(2, "0"),
    disabled: (disabled?.disabledMinutes?.(active.hour()) ?? []).includes(item),
  }));
  const secondOptions = secondValues.map((item) => ({
    value: String(item),
    label: String(item).padStart(2, "0"),
    disabled: (disabled?.disabledSeconds?.(active.hour(), active.minute()) ?? []).includes(item),
  }));
  const setPart = (kind: "hour" | "minute" | "second", raw: number) => {
    let next = active.clone();
    if (kind === "hour") next = next.hour(hour12 ? (active.hour() >= 12 ? (raw % 12) + 12 : raw % 12) : raw);
    if (kind === "minute") next = next.minute(raw);
    if (kind === "second") next = next.second(raw);
    onChange(next);
  };
  return (
    <div className={cx("biu-ui-date-picker__time", className)}>
      <label>
        {text["时"]}
        <Select
          className="biu-ui-date-picker__time-select"
          value={String(visibleHour)}
          options={hourOptions}
          onChange={(next) => setPart("hour", Number(next))}
          aria-label={text["时"]}
        />
      </label>
      <span>:</span>
      <label>
        {text["分"]}
        <Select
          className="biu-ui-date-picker__time-select"
          value={String(active.minute())}
          options={minuteOptions}
          onChange={(next) => setPart("minute", Number(next))}
          aria-label={text["分"]}
        />
      </label>
      {showSeconds ? (
        <>
          <span>:</span>
          <label>
            {text["秒"]}
            <Select
              className="biu-ui-date-picker__time-select"
              value={String(active.second())}
              options={secondOptions}
              onChange={(next) => setPart("second", Number(next))}
              aria-label={text["秒"]}
            />
          </label>
        </>
      ) : null}
      {hour12 ? (
        <button
          type="button"
          onClick={() => onChange(active.hour(active.hour() >= 12 ? active.hour() - 12 : active.hour() + 12))}
        >
          {active.hour() >= 12 ? text["下午"] : text["上午"]}
        </button>
      ) : null}
    </div>
  );
}

export function DatePicker({
  value,
  defaultValue,
  onChange,
  range = false,
  format,
  showTime = false,
  timeOnly = false,
  hour12 = false,
  needConfirm = false,
  showNow = true,
  allowClear = true,
  placeholder,
  presets,
  footer,
  disabledDate,
  disabledTime,
  min,
  max,
  disabled = false,
  readOnly = false,
  open,
  defaultOpen = false,
  onOpenChange,
  className,
  style,
  classNames,
  locale,
  localeText,
  id,
  error,
  renderCell,
}: DatePickerProps) {
  const text = useComponentsLocale(locale, localeText);
  const resolvedPresets =
    presets ??
    (range
      ? timeOnly
        ? [
            {
              label: text["近一小时"],
              value: () => {
                const end = dayjs();
                return [end.subtract(1, "hour"), end] as [Dayjs, Dayjs];
              },
            },
            {
              label: text["近一天"],
              value: () => {
                const end = dayjs();
                return [end.subtract(1, "day"), end] as [Dayjs, Dayjs];
              },
            },
          ]
        : [
            {
              label: text["近一周"],
              value: () => {
                const end = dayjs();
                return [end.subtract(6, "day").startOf("day"), end.endOf("day")] as [Dayjs, Dayjs];
              },
            },
            {
              label: text["近一月"],
              value: () => {
                const end = dayjs();
                return [end.subtract(1, "month").add(1, "day").startOf("day"), end.endOf("day")] as [Dayjs, Dayjs];
              },
            },
          ]
      : timeOnly
        ? []
        : [
            {
              label: text["今天"],
              value: () => dayjs(),
            },
            {
              label: text["明天"],
              value: () => dayjs().add(1, "day"),
            },
            {
              label: text["昨天"],
              value: () => dayjs().subtract(1, "day"),
            },
          ]);
  const dateFormat = normalizeDateFormat(
    format ?? (timeOnly ? "HH:mm" : showTime ? "YYYY-MM-DD HH:mm:ss" : "YYYY-MM-DD"),
    timeOnly ? "HH:mm" : showTime ? "YYYY-MM-DD HH:mm:ss" : "YYYY-MM-DD",
    hour12,
  );
  const showSeconds = /s{1,2}/.test(dateFormat);
  const [internal, setInternal] = React.useState<DatePickerProps["value"]>(
    defaultValue ?? (range ? [null, null] : null),
  );
  const activeValue = value === undefined ? internal : value;
  const resolvedValue: Exclude<DatePickerProps["value"], undefined> = activeValue ?? (range ? [null, null] : null);
  const firstValue = isRangeValue(resolvedValue) ? resolvedValue[0] : resolvedValue;
  const [draft, setDraft] = React.useState<Exclude<DatePickerProps["value"], undefined>>(resolvedValue);
  const [month, setMonth] = React.useState((firstValue ?? dayjs()).startOf("month"));
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const activeOpen = !disabled && !readOnly && (open ?? internalOpen);
  React.useEffect(() => setDraft(resolvedValue), [resolvedValue]);
  const setOpen = (next: boolean) => {
    if (disabled || readOnly) return;
    if (open === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };
  const emit = (next: DatePickerProps["value"], close = true) => {
    if (disabled || readOnly) return;
    if (value === undefined) setInternal(next);
    const dateString = isRangeValue(next)
      ? next.map((item) => formatDateValue(item, dateFormat))
      : formatDateValue(next, dateFormat);
    onChange?.(next ?? null, dateString);
    if (!needConfirm && close) setOpen(false);
  };
  const currentRange = isRangeValue(draft) ? draft : ([draft, null] as [Dayjs | null, Dayjs | null]);
  const selectDate = (date: Dayjs) => {
    if (range) {
      // Range selection is intentionally a tiny state machine: the first
      // click starts a new range, the second click completes it. There is no
      // start/end toggle in the panel and no hidden side that users must
      // select before continuing. A completed range starts over on the next
      // click, while reversed clicks are normalized for the trigger/value.
      const next: [Dayjs | null, Dayjs | null] =
        currentRange[0] && currentRange[1]
          ? [date, null]
          : currentRange[0]
            ? currentRange[0].isAfter(date, "day")
              ? [date, currentRange[0]]
              : [currentRange[0], date]
            : currentRange[1]
              ? currentRange[1].isAfter(date, "day")
                ? [date, currentRange[1]]
                : [currentRange[1], date]
              : [date, null];
      const complete = Boolean(next[0] && next[1]);
      setDraft(next);
      if (!needConfirm) emit(next, complete && !showTime);
      return;
    }
    const next = showTime
      ? date
          .hour((firstValue ?? dayjs()).hour())
          .minute((firstValue ?? dayjs()).minute())
          .second((firstValue ?? dayjs()).second())
      : date;
    setDraft(next);
    if (!showTime && !needConfirm) emit(next);
  };
  const updateTime = (next: Dayjs, position: "start" | "end" = "start") => {
    if (disabled || readOnly) return;
    const defaultTime = timeOnly ? dayjs("2000-01-01T00:00:00") : next.startOf("day");
    const rawRange: [Dayjs, Dayjs] =
      position === "end" ? [currentRange[0] ?? defaultTime, next] : [next, currentRange[1] ?? defaultTime];
    const orderedRange: [Dayjs, Dayjs] = rawRange[0].isAfter(rawRange[1]) ? [rawRange[1], rawRange[0]] : rawRange;
    const nextValue: Exclude<DatePickerProps["value"], undefined> = range ? orderedRange : next;
    setDraft(nextValue);
    if (!needConfirm) {
      if (value === undefined) setInternal(nextValue);
      const dateString = isRangeValue(nextValue)
        ? nextValue.map((item) => formatDateValue(item, dateFormat))
        : formatDateValue(nextValue, dateFormat);
      onChange?.(nextValue, dateString);
    }
  };
  const commit = () => {
    emit(draft);
    setOpen(false);
  };
  const clear = () => emit(range ? [null, null] : null);
  const display = isRangeValue(activeValue)
    ? activeValue.map((item) => formatDateValue(item, dateFormat))
    : formatDateValue(activeValue, dateFormat);
  const displayValues = Array.isArray(display) ? display : [display];
  const resolvedPlaceholder = Array.isArray(placeholder)
    ? placeholder
    : [placeholder ?? text["请选择"], placeholder ?? text["请选择"]];
  const panel = (
    <div className={cx("biu-ui-date-picker__panel", classNames?.panel)} data-biu-slot="date-panel">
      {resolvedPresets.length ? (
        <aside className={cx("biu-ui-date-picker__presets", classNames?.presets)}>
          {resolvedPresets.map((preset) => (
            <button
              key={String(preset.label)}
              type="button"
              onClick={() => {
                const next = resolvePreset(preset.value);
                setDraft(next);
                if (!needConfirm) emit(next);
              }}
            >
              <Ellipsis content={preset.label} maxWidth="100%" className="biu-ui-date-picker__preset-label" />
            </button>
          ))}
        </aside>
      ) : null}
      <div className="biu-ui-date-picker__panel-main">
        {!timeOnly ? (
          <CalendarPanel
            value={draft}
            range={range}
            month={month}
            setMonth={setMonth}
            min={min}
            max={max}
            disabledDate={disabledDate}
            onSelect={selectDate}
            renderCell={renderCell}
            classNames={classNames}
            text={text}
          />
        ) : null}
        {timeOnly || showTime ? (
          range ? (
            <div className="biu-ui-date-picker__time-range" data-biu-slot="time-range">
              <TimePanel
                value={currentRange[0] ?? (currentRange[1] ? currentRange[1].startOf("day") : dayjs("2000-01-01"))}
                hour12={hour12}
                showSeconds={showSeconds}
                onChange={(next) => updateTime(next, "start")}
                disabledTime={disabledTime}
                position="start"
                className={classNames?.time}
                text={text}
              />
              <span className="biu-ui-date-picker__time-range-separator" aria-hidden="true">
                —
              </span>
              <TimePanel
                value={currentRange[1] ?? (currentRange[0] ? currentRange[0].startOf("day") : dayjs("2000-01-01"))}
                hour12={hour12}
                showSeconds={showSeconds}
                onChange={(next) => updateTime(next, "end")}
                disabledTime={disabledTime}
                position="end"
                className={classNames?.time}
                text={text}
              />
            </div>
          ) : (
            <TimePanel
              value={currentRange[0]}
              hour12={hour12}
              showSeconds={showSeconds}
              onChange={(next) => updateTime(next, "start")}
              disabledTime={disabledTime}
              position="start"
              className={classNames?.time}
              text={text}
            />
          )
        ) : null}
        <div className={cx("biu-ui-date-picker__footer", classNames?.footer)}>
          {footer}
          {showNow && !timeOnly ? (
            <button
              type="button"
              onClick={() => {
                const now = dayjs();
                setDraft(range ? [now, null] : now);
                if (!needConfirm) emit(range ? [now, null] : now);
              }}
            >
              {text["今天"]}
            </button>
          ) : null}
          <span className="biu-ui-date-picker__footer-actions">
            {allowClear ? (
              <button type="button" onClick={clear}>
                {text["清除"]}
              </button>
            ) : null}
            {needConfirm ? (
              <button type="button" className="biu-ui-date-picker__confirm" onClick={commit}>
                {text["确定"]}
              </button>
            ) : null}
          </span>
        </div>
      </div>
    </div>
  );
  const trigger = (
    <button
      type="button"
      id={id}
      disabled={disabled || readOnly}
      className={cx("biu-ui-date-picker__trigger", classNames?.trigger)}
      aria-expanded={activeOpen}
    >
      {range ? (
        <span
          className={cx("biu-ui-date-picker__range-value", !displayValues.some(Boolean) && "is-placeholder")}
          aria-label={`${displayValues[0] || resolvedPlaceholder[0]} ${text["至"]} ${displayValues[1] || resolvedPlaceholder[1]}`}
        >
          <span
            className={cx("biu-ui-date-picker__range-part", !displayValues[0] && "is-placeholder", classNames?.value)}
            data-range-position="start"
          >
            {displayValues[0] || resolvedPlaceholder[0]}
          </span>
          <span className="biu-ui-date-picker__range-separator" aria-hidden="true">
            —
          </span>
          <span
            className={cx("biu-ui-date-picker__range-part", !displayValues[1] && "is-placeholder", classNames?.value)}
            data-range-position="end"
          >
            {displayValues[1] || resolvedPlaceholder[1]}
          </span>
        </span>
      ) : (
        <span
          className={cx(
            "biu-ui-date-picker__value",
            !displayValues.some(Boolean) && "is-placeholder",
            classNames?.value,
          )}
        >
          {displayValues[0] || resolvedPlaceholder[0]}
        </span>
      )}
      {allowClear && displayValues.some(Boolean) && !readOnly ? (
        <span
          className={cx("biu-ui-date-picker__clear", classNames?.clear)}
          role="button"
          tabIndex={0}
          onClick={(event) => {
            event.stopPropagation();
            clear();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              event.stopPropagation();
              clear();
            }
          }}
        >
          <X size={13} aria-hidden="true" />
        </span>
      ) : (
        <span className={cx("biu-ui-date-picker__icon", classNames?.icon)} aria-hidden="true">
          {timeOnly ? <Clock size={16} strokeWidth={1.8} /> : <Calendar size={16} strokeWidth={1.8} />}
        </span>
      )}
    </button>
  );
  return (
    <div
      className={cx(
        "biu-ui-date-picker",
        range && "biu-ui-date-picker--range",
        disabled && "is-disabled",
        readOnly && "is-readonly",
        error && "biu-ui-control--error",
        classNames?.root,
        className,
      )}
      style={style}
      data-biu-component={
        range ? (timeOnly ? "range-time-picker" : "range-date-picker") : timeOnly ? "time-picker" : "date-picker"
      }
    >
      <PopoverPrimitive.Root open={activeOpen} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
        {activeOpen && typeof document !== "undefined"
          ? createPortal(
              <PopoverPrimitive.Content
                className={cx("biu-ui-date-picker__content", classNames?.content)}
                sideOffset={6}
                collisionPadding={8}
                align="start"
                data-biu-overlay-interactive="true"
              >
                {panel}
              </PopoverPrimitive.Content>,
              document.body,
            )
          : null}
      </PopoverPrimitive.Root>
      {error ? (
        <span className={cx("biu-ui-control__error", classNames?.error)} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export interface TimePickerProps extends Omit<DatePickerProps, "min" | "max" | "disabledDate" | "range"> {
  range?: boolean;
}

export function TimePicker({ format = "HH:mm", range = false, ...props }: TimePickerProps) {
  return <DatePicker {...props} format={format} range={range} showTime={false} timeOnly />;
}

export type { Dayjs };
export const RangeDatePicker = (props: Omit<DatePickerProps, "range">) => <DatePicker {...props} range />;
export const RangeTimePicker = (props: Omit<TimePickerProps, "range">) => <TimePicker {...props} range />;

/** @deprecated Use TextField with type="search" and the surrounding PageFilter/Form.Item. */
export const SearchTextField = React.forwardRef<HTMLInputElement, TextFieldProps>(function SearchTextField(props, ref) {
  return <TextField {...props} ref={ref} type="search" className={cx("biu-ui-search-textfield", props.className)} />;
});

export interface CascaderOption extends SelectOption {
  children?: CascaderOption[];
}
export interface CascaderProps {
  options: CascaderOption[];
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[], options: CascaderOption[]) => void;
  changeOnSelect?: boolean;
  placeholder?: React.ReactNode;
  optionRender?: (option: CascaderOption, level: number) => React.ReactNode;
  displayRender?: (labels: React.ReactNode[], selected: CascaderOption[]) => React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  classNames?: {
    root?: string;
    trigger?: string;
    content?: string;
    menu?: string;
    column?: string;
    option?: string;
    value?: string;
  };
  disabled?: boolean;
  locale?: BiuComponentsLocale;
  localeText?: BiuComponentsLocaleTextOverrides;
}
export function Cascader({
  options,
  value,
  defaultValue = [],
  onChange,
  changeOnSelect = false,
  placeholder,
  optionRender,
  displayRender,
  open,
  defaultOpen = false,
  onOpenChange,
  className,
  classNames,
  disabled = false,
  locale,
  localeText,
}: CascaderProps) {
  const text = useComponentsLocale(locale, localeText);
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const activeValue = value ?? internalValue;
  const [panelValue, setPanelValue] = React.useState(activeValue);
  React.useEffect(() => setPanelValue(activeValue), [activeValue]);
  const activeOpen = !disabled && (open ?? internalOpen);
  const getSelected = React.useCallback(
    (path: string[]) => {
      const selected: CascaderOption[] = [];
      let current = options;
      for (const key of path) {
        const item = current.find((option) => option.value === key);
        if (!item) break;
        selected.push(item);
        current = item.children ?? [];
      }
      return selected;
    },
    [options],
  );
  const selectedOptions = getSelected(panelValue);
  const displaySelectedOptions = getSelected(activeValue);
  const columns = [options];
  for (const item of selectedOptions) {
    if (!item.children?.length) break;
    columns.push(item.children);
  }
  const setActiveOpen = (next: boolean) => {
    if (disabled) return;
    if (open === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };
  const labels = displaySelectedOptions.map((item) => item.label);
  const displayValue =
    displayRender?.(labels, displaySelectedOptions) ??
    (labels.length ? labels.map((label) => String(label)).join(" / ") : null);
  return (
    <div
      className={cx("biu-ui-cascader", classNames?.root, className)}
      data-biu-component="cascader"
      data-state={activeOpen ? "open" : "closed"}
    >
      <PopoverPrimitive.Root open={activeOpen} onOpenChange={setActiveOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button
            type="button"
            className={cx("biu-ui-cascader__trigger", classNames?.trigger)}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={activeOpen}
          >
            <Ellipsis
              content={displayValue ?? placeholder ?? text["请选择"]}
              className={cx("biu-ui-cascader__value", classNames?.value)}
            >
              {displayValue ?? placeholder ?? text["请选择"]}
            </Ellipsis>
            <ChevronDown size={15} aria-hidden="true" />
          </button>
        </PopoverPrimitive.Trigger>
        {activeOpen && typeof document !== "undefined"
          ? createPortal(
              <PopoverPrimitive.Content
                className={cx("biu-ui-cascader__content", classNames?.content)}
                sideOffset={6}
                collisionPadding={8}
                align="start"
                data-biu-overlay-interactive="true"
              >
                <div className={cx("biu-ui-cascader__menu", classNames?.menu)} role="listbox">
                  {columns.map((column, level) => (
                    <div key={level} className={cx("biu-ui-cascader__column", classNames?.column)}>
                      {column.map((option) => {
                        const selected = panelValue[level] === option.value;
                        return (
                          <button
                            type="button"
                            key={option.value}
                            className={cx("biu-ui-cascader__option", selected && "is-selected", classNames?.option)}
                            disabled={option.disabled}
                            role="option"
                            aria-selected={selected}
                            onClick={() => {
                              if (option.disabled) return;
                              const next = [...panelValue.slice(0, level), option.value];
                              setPanelValue(next);
                              if (value === undefined) setInternalValue(next);
                              const nextSelected = getSelected(next);
                              if (changeOnSelect || !option.children?.length) {
                                onChange?.(next, nextSelected);
                                setActiveOpen(false);
                              }
                            }}
                          >
                            <Ellipsis content={option.label} maxWidth="100%">
                              {optionRender?.(option, level) ?? option.label}
                            </Ellipsis>
                            {option.children?.length ? <ChevronRight size={14} aria-hidden="true" /> : null}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </PopoverPrimitive.Content>,
              document.body,
            )
          : null}
      </PopoverPrimitive.Root>
    </div>
  );
}
