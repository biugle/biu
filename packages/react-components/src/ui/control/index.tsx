import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { createPortal } from "react-dom";
import dayjs, { type Dayjs } from "dayjs";
import { Calendar, Check, ChevronDown, ChevronLeft, ChevronRight, Clock, Minus, Plus, X } from "@biugle/icons";
import { cx, mergeRefs, type BiuClassNames, type BiuSize } from "../../shared/utils.js";
import { createInputFilter } from "../../shared/input-filter.js";
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
  /** Built-in character filters for common business fields. */
  inputRule?: "number" | "letter" | "alphanumeric";
  /** Incremental regular expression used to filter typed and pasted values. */
  inputPattern?: string | RegExp;
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
    inputRule,
    inputPattern,
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
  const inputFilter = React.useMemo(() => createInputFilter(inputRule, inputPattern), [inputRule, inputPattern]);
  const inputPatternAttribute = props.pattern ?? inputFilter.pattern;
  const applyInputFilter = (event: React.SyntheticEvent<HTMLInputElement>) => {
    const nextValue = inputFilter.filter(event.currentTarget.value);
    if (nextValue !== event.currentTarget.value) {
      event.currentTarget.value = nextValue;
    }
    if (!controlled) setInternalValue(nextValue);
  };
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
          onInput={(event) => {
            applyInputFilter(event);
            onInput?.(event);
            inputOnInput?.(event);
          }}
          defaultValue={inputControlled ? undefined : (inputDefaultValue ?? defaultValue)}
          pattern={inputPatternAttribute}
          maxLength={maxLength}
          disabled={disabled || loading}
          readOnly={readOnly}
          className={cx("biu-ui-textfield__input", inputClassName, classNames?.input)}
          data-biu-slot="textfield-input"
          onChange={(event) => {
            applyInputFilter(event);
            onChange?.(event);
            inputOnChange?.(event);
          }}
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
  error?: React.ReactNode;
  value?: number | string;
  defaultValue?: number | string;
  decimal?: number;
  /** @deprecated Use decimal. */
  precision?: number;
  /** Restrict the input to integers when true. */
  integer?: boolean;
  /** Restrict the sign while retaining normal editing states. */
  sign?: "any" | "positive" | "negative";
  /** Add a thousands separator to the displayed value. `true` uses a comma. */
  thousandSeparator?: string | boolean;
  /** Change the displayed and parsed decimal mark. */
  decimalSeparator?: string;
  controls?: boolean;
  changeOnWheel?: boolean;
  formatter?: (value: number | string | undefined) => string;
  parser?: (value: string) => number | string | undefined;
  stringMode?: boolean;
  onChange?: (value: number | string | undefined, event?: React.ChangeEvent<HTMLInputElement>) => void;
  classNames?: ControlClassNames;
  locale?: BiuComponentsLocale;
  localeText?: BiuComponentsLocaleTextOverrides;
}

function decimalPlaces(value: number | string | undefined) {
  if (value === undefined || value === null || value === "") return 0;
  const source = String(value).trim().toLowerCase();
  if (!Number.isFinite(Number(source))) return 0;
  const [coefficient, exponentText] = source.split("e");
  const exponent = Number(exponentText ?? 0);
  return Math.max(0, (coefficient.split(".")[1]?.length ?? 0) - exponent);
}

function decimalInteger(value: number | string | undefined) {
  const source = String(value ?? "")
    .trim()
    .toLowerCase();
  const match = source.match(/^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/);
  if (!match || (!match[2] && !match[3])) return undefined;
  const sign = match[1] === "-" ? -1 : 1;
  const whole = match[2] ?? "";
  const fraction = match[3] ?? "";
  const exponent = Number(match[4] ?? 0);
  let scale = fraction.length - exponent;
  let digits = BigInt(`${whole}${fraction}` || "0");
  if (scale < 0) {
    digits *= 10n ** BigInt(-scale);
    scale = 0;
  }
  return { digits: BigInt(sign) * digits, scale };
}

function decimalString(integer: bigint, scale: number) {
  if (integer === 0n) return "0";
  const negative = integer < 0n;
  const digits = (negative ? -integer : integer).toString();
  const padded = digits.padStart(scale + 1, "0");
  const splitAt = padded.length - scale;
  const whole = padded.slice(0, splitAt) || "0";
  const fraction = padded.slice(splitAt).replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}

function addDecimal(left: number | string, right: number | string, direction: 1 | -1) {
  const leftParts = decimalInteger(left);
  const rightParts = decimalInteger(right);
  if (!leftParts || !rightParts) return String(Number(left) + direction * Number(right));
  const scale = Math.max(leftParts.scale, rightParts.scale);
  const leftInteger = leftParts.digits * 10n ** BigInt(scale - leftParts.scale);
  const rightInteger = rightParts.digits * 10n ** BigInt(scale - rightParts.scale);
  return decimalString(leftInteger + BigInt(direction) * rightInteger, scale);
}

export const InputNumber = React.forwardRef<HTMLInputElement, InputNumberProps>(function InputNumber(
  {
    value,
    defaultValue,
    error,
    onChange,
    decimal,
    precision,
    integer = false,
    sign = "any",
    thousandSeparator = false,
    decimalSeparator = ".",
    controls = true,
    changeOnWheel = false,
    formatter,
    parser,
    stringMode = false,
    className,
    classNames,
    disabled,
    readOnly,
    onWheel,
    onBlur,
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
  const digits = integer ? 0 : (decimal ?? precision);
  const fractionDigits = digits === undefined ? undefined : Math.max(0, Math.floor(digits));
  const signSource = sign === "negative" ? "-" : sign === "positive" ? "" : "-?";
  const groupSeparator =
    thousandSeparator === true ? "," : typeof thousandSeparator === "string" ? thousandSeparator : "";
  const editingBodySource =
    fractionDigits === 0
      ? "\\d+"
      : fractionDigits === undefined
        ? "(?:\\d+\\.?\\d*|\\.\\d*)"
        : `(?:\\d+(?:\\.\\d{0,${fractionDigits}})?|\\.\\d{1,${fractionDigits}})`;
  const editingPattern = new RegExp(`^${signSource}${editingBodySource}$`);
  const [invalidError, setInvalidError] = React.useState<React.ReactNode>();
  const [internal, setInternal] = React.useState<number | string | undefined>(defaultValue);
  const active = value === undefined ? internal : value;
  const formatNumericText = (rawValue: number | string | undefined) => {
    if (rawValue === undefined || rawValue === null) return "";
    const raw = String(rawValue);
    if (!groupSeparator && decimalSeparator === ".") return raw;
    if (/^-?\.$/.test(raw)) return `${raw.startsWith("-") ? "-" : ""}${decimalSeparator}`;
    const negative = raw.startsWith("-");
    const unsigned = negative ? raw.slice(1) : raw;
    const [whole = "", fraction] = unsigned.split(".");
    const grouped = groupSeparator ? whole.replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator) : whole;
    return `${negative ? "-" : ""}${grouped}${fraction !== undefined ? `${decimalSeparator}${fraction}` : ""}`;
  };
  const display = formatter ? formatter(active) : formatNumericText(active);
  const numericStep = Number(step) || 1;
  const sanitizeNumericInput = (raw: string) => {
    if (parser) return raw;
    let source = raw;
    if (groupSeparator && groupSeparator !== decimalSeparator) source = source.split(groupSeparator).join("");
    if (decimalSeparator !== ".") source = source.split(decimalSeparator).join(".");
    const hasLeadingMinus = sign !== "positive" && source.startsWith("-");
    const unsigned = source.replace(/[^\d.]/g, "");
    const dotIndex = unsigned.indexOf(".");
    if (integer || fractionDigits === 0) {
      return `${hasLeadingMinus ? "-" : ""}${unsigned.replace(/\./g, "")}`;
    }
    if (dotIndex < 0) return `${hasLeadingMinus ? "-" : ""}${unsigned}`;
    const whole = unsigned.slice(0, dotIndex).replace(/\./g, "");
    const fractionSource = unsigned.slice(dotIndex + 1).replace(/\./g, "");
    const fraction = fractionDigits === undefined ? fractionSource : fractionSource.slice(0, fractionDigits);
    return `${hasLeadingMinus ? "-" : ""}${whole}.${fraction}`;
  };
  const normalizeNumericText = (raw: string) => {
    const negative = raw.startsWith("-");
    const unsigned = negative ? raw.slice(1) : raw;
    const [wholePart = "", fractionPart] = unsigned.split(".");
    const whole = wholePart.replace(/^0+(?=\d)/, "") || "0";
    const fraction = fractionPart?.replace(/0+$/, "");
    return `${negative && Number(raw) !== 0 ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
  };
  const normalizedValue = (raw: string): number | string => {
    const normalized = normalizeNumericText(raw);
    return stringMode ? normalized : Number(normalized);
  };
  const normalize = (next: number | string) => {
    const numericNext = Number(next);
    const bounded = Math.max(
      min === undefined ? -Infinity : Number(min),
      Math.min(max === undefined ? Infinity : Number(max), numericNext),
    );
    if (digits !== undefined) return Number(bounded.toFixed(digits));
    const precision = Math.max(
      decimalPlaces(bounded),
      decimalPlaces(numericStep),
      decimalPlaces(min),
      decimalPlaces(max),
    );
    const factor = 10 ** precision;
    return precision === 0 ? Math.round(bounded) : Math.round(bounded * factor) / factor;
  };
  const commit = (next: number | string | undefined, event?: React.ChangeEvent<HTMLInputElement>) => {
    if (value === undefined) setInternal(next);
    onChange?.(next, event);
  };
  const changeBy = (direction: 1 | -1, event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || readOnly) return;
    const current = Number(active ?? 0);
    if (!Number.isFinite(current)) return;
    const next = normalize(addDecimal(current, numericStep, direction));
    commit(stringMode ? String(next) : next);
    event.currentTarget.blur();
  };
  const handleWheel = (event: React.WheelEvent<HTMLInputElement>) => {
    onWheel?.(event);
    if (!changeOnWheel || disabled || readOnly || event.deltaY === 0) return;
    const activeElement = typeof document === "undefined" ? null : document.activeElement;
    if (activeElement !== event.currentTarget) return;
    event.preventDefault();
    const next = normalize(addDecimal(Number(active ?? 0), numericStep, event.deltaY < 0 ? 1 : -1));
    commit(stringMode ? String(next) : next);
  };
  return (
    <span
      className={cx(
        "biu-ui-input-number",
        (error || invalidError) && "biu-ui-control--error",
        disabled && "biu-ui-control--disabled",
        readOnly && "biu-ui-control--readonly",
        className,
        classNames?.root,
      )}
      data-biu-component="input-number"
      data-state={disabled ? "disabled" : readOnly ? "readonly" : "default"}
    >
      {controls ? (
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
      ) : null}
      <input
        {...props}
        ref={ref}
        type="text"
        inputMode="decimal"
        pattern={props.pattern ?? editingPattern.source}
        role="spinbutton"
        aria-valuenow={
          active === undefined || active === "" || !Number.isFinite(Number(active)) ? undefined : Number(active)
        }
        aria-valuemin={min === undefined ? undefined : Number(min)}
        aria-valuemax={max === undefined ? undefined : Number(max)}
        className={cx("biu-ui-input-number__input", classNames?.input)}
        value={display}
        disabled={disabled}
        readOnly={readOnly}
        onBlur={(event) => {
          const current = String(active ?? "");
          if (!parser && current && !["-", ".", "-.", ""].includes(current) && editingPattern.test(current)) {
            const next = normalizedValue(current);
            if (next !== active) commit(next);
          }
          onBlur?.(event);
        }}
        onWheel={handleWheel}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || disabled || readOnly) return;
          if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            event.preventDefault();
            const next = normalize(addDecimal(Number(active ?? 0), numericStep, event.key === "ArrowUp" ? 1 : -1));
            commit(stringMode ? String(next) : next);
          }
        }}
        onChange={(event) => {
          const raw = event.target.value;
          const sanitized = sanitizeNumericInput(raw);
          const parsed =
            sanitized === "" ? undefined : parser ? parser(sanitized) : stringMode ? sanitized : Number(sanitized);
          if (sanitized === "-" || sanitized === "." || sanitized === "-.") {
            setInvalidError(undefined);
            if (sanitized !== raw) event.target.value = sanitized;
            commit(sanitized, event);
            return;
          }
          if (!parser && sanitized.endsWith(".")) {
            setInvalidError(undefined);
            if (sanitized !== raw) event.target.value = sanitized;
            commit(sanitized, event);
            return;
          }
          if (!parser && !editingPattern.test(sanitized)) {
            setInvalidError("请输入有效数字");
            if (sanitized !== raw) event.target.value = sanitized;
            commit(sanitized || undefined, event);
            return;
          }
          if (typeof parsed === "number" && !Number.isFinite(parsed)) {
            setInvalidError("请输入有效数字");
            commit(undefined, event);
            return;
          }
          const numericValue = Number(parsed);
          const signInvalid = sign === "positive" ? numericValue <= 0 : sign === "negative" ? numericValue >= 0 : false;
          const rangeInvalid =
            (min !== undefined && numericValue < Number(min)) || (max !== undefined && numericValue > Number(max));
          setInvalidError(signInvalid || rangeInvalid ? "请输入范围内的数字" : undefined);
          if (sanitized !== raw) event.target.value = sanitized;
          const normalizedText = normalizeNumericText(sanitized);
          const next = normalizedText === sanitized ? parsed : sanitized;
          commit(next, event);
        }}
      />
      {controls ? (
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
      ) : null}
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

export type SliderValue = number | [number, number];

export interface SliderMark {
  label?: React.ReactNode;
  style?: React.CSSProperties;
}

export interface SliderClassNames extends ControlClassNames {
  rail?: string;
  track?: string;
  input?: string;
  mark?: string;
  markLabel?: string;
  tooltip?: string;
}

export type SliderTooltipMode = "hover" | "always" | "never";

export interface SliderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
  /** Minimum value of the slider. */
  min?: number;
  /** Maximum value of the slider. */
  max?: number;
  /** Increment used when dragging or using the keyboard. */
  step?: number;
  /** Controlled value; an array enables the range slider. */
  value?: SliderValue;
  /** Initial value for the uncontrolled slider. */
  defaultValue?: SliderValue;
  /** Render two handles and return a two-item value. */
  range?: boolean;
  /** Show a mark at every step instead of only the configured marks. */
  dots?: boolean;
  /** Render labelled marks; a mark value is clamped to the slider range. */
  marks?: Record<number, React.ReactNode | SliderMark>;
  /** Show the current value on hover/focus, always, or never. `auto` remains a compatibility alias for `hover`. */
  tooltip?: SliderTooltipMode | "auto";
  /** Set the visual opacity of the complete slider, from 0 to 1. */
  opacity?: number;
  /** Render the slider vertically. */
  vertical?: boolean;
  /** Reverse the visual direction without changing the emitted value. */
  reverse?: boolean;
  disabled?: boolean;
  onChange?: (value: SliderValue) => void;
  onChangeComplete?: (value: SliderValue) => void;
  classNames?: SliderClassNames;
}

function sliderParts(value: number | string | undefined) {
  return decimalInteger(value);
}

function scaleSliderInteger(value: number | string, scale: number) {
  const parts = sliderParts(value);
  if (!parts) return 0n;
  return parts.digits * 10n ** BigInt(scale - parts.scale);
}

function normalizeSliderNumber(value: number, min: number, max: number, step: number) {
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) ? Math.max(safeMin, max) : 100;
  const safeStep = Number.isFinite(step) && step > 0 ? step : 1;
  const scale = Math.max(decimalPlaces(safeMin), decimalPlaces(safeMax), decimalPlaces(safeStep), decimalPlaces(value));
  const low = scaleSliderInteger(safeMin, scale);
  const high = scaleSliderInteger(safeMax, scale);
  const increment = scaleSliderInteger(safeStep, scale);
  if (increment <= 0n) return safeMin;
  const current = scaleSliderInteger(Math.min(safeMax, Math.max(safeMin, Number(value) || 0)), scale);
  const offset = current - low;
  const snapped = low + ((offset + increment / 2n) / increment) * increment;
  const bounded = snapped < low ? low : snapped > high ? high : snapped;
  return Number(decimalString(bounded, scale));
}

function normalizeSliderValue(value: SliderValue | undefined, range: boolean, min: number, max: number, step: number) {
  if (range) {
    const source = Array.isArray(value) ? value : [min, value === undefined ? max : Number(value)];
    const next = source.map((item) => normalizeSliderNumber(Number(item), min, max, step)).sort((a, b) => a - b);
    return [next[0] ?? min, next[1] ?? max] as [number, number];
  }
  const source = Array.isArray(value) ? value[0] : value;
  return normalizeSliderNumber(Number(source ?? min), min, max, step);
}

function sliderPercentage(value: number, min: number, max: number) {
  if (max <= min) return 0;
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}

function isSliderMark(value: React.ReactNode | SliderMark): value is SliderMark {
  return typeof value === "object" && value !== null && !React.isValidElement(value) && "label" in value;
}

export const Slider = React.forwardRef<HTMLDivElement, SliderProps>(function Slider(
  {
    min = 0,
    max = 100,
    step = 1,
    value,
    defaultValue,
    range = false,
    dots = false,
    marks,
    tooltip = "hover",
    opacity = 1,
    vertical = false,
    reverse = false,
    disabled = false,
    onChange,
    onChangeComplete,
    className,
    classNames,
    style,
    ...props
  },
  ref,
) {
  const tooltipMode: SliderTooltipMode = tooltip === "auto" ? "hover" : tooltip;
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) ? Math.max(safeMin, max) : 100;
  const safeStep = Number.isFinite(step) && step > 0 ? step : 1;
  const controlled = value !== undefined;
  const [internal, setInternal] = React.useState<SliderValue>(() =>
    normalizeSliderValue(defaultValue, range, safeMin, safeMax, safeStep),
  );
  const active = normalizeSliderValue(controlled ? value : internal, range, safeMin, safeMax, safeStep);
  const activeValues = Array.isArray(active) ? active : [active];
  const updateValue = (index: number, raw: number, complete = false) => {
    const nextValue = normalizeSliderNumber(raw, safeMin, safeMax, safeStep);
    let next: SliderValue;
    if (range) {
      const rangeNext: [number, number] = [activeValues[0] ?? safeMin, activeValues[1] ?? safeMax];
      rangeNext[index] = nextValue;
      rangeNext.sort((left, right) => left - right);
      next = rangeNext;
    } else {
      next = nextValue;
    }
    if (!controlled) setInternal(next);
    onChange?.(next);
    if (complete) onChangeComplete?.(next);
  };
  const handleTrackPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || event.target instanceof HTMLInputElement) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = vertical
      ? (rect.bottom - event.clientY) / Math.max(1, rect.height)
      : (event.clientX - rect.left) / Math.max(1, rect.width);
    const visualRatio = reverse ? 1 - ratio : ratio;
    const raw = safeMin + Math.min(1, Math.max(0, visualRatio)) * (safeMax - safeMin);
    const index = range ? (Math.abs(raw - activeValues[0]) <= Math.abs(raw - activeValues[1]) ? 0 : 1) : 0;
    updateValue(index, raw, true);
  };
  const markEntries = Object.entries(marks ?? {})
    .map(([key, item]) => ({ value: Number(key), item }))
    .filter(({ value: markValue }) => Number.isFinite(markValue))
    .sort((left, right) => left.value - right.value);
  const percentage = (item: number) => {
    const normalized = sliderPercentage(item, safeMin, safeMax);
    return reverse ? 100 - normalized : normalized;
  };
  const trackStart = range
    ? Math.min(percentage(activeValues[0] ?? safeMin), percentage(activeValues[1] ?? safeMax))
    : 0;
  const trackEnd = range
    ? Math.max(percentage(activeValues[0] ?? safeMin), percentage(activeValues[1] ?? safeMax))
    : percentage(activeValues[0] ?? safeMin);
  const sliderOpacity = Number.isFinite(opacity) ? Math.min(1, Math.max(0, opacity)) : 1;
  const renderMarkLabel = (item: React.ReactNode | SliderMark): React.ReactNode =>
    isSliderMark(item) ? item.label : item;
  return (
    <div
      {...props}
      ref={ref}
      className={cx(
        "biu-ui-slider",
        vertical && "biu-ui-slider--vertical",
        reverse && "biu-ui-slider--reverse",
        disabled && "biu-ui-control--disabled",
        className,
        classNames?.root,
      )}
      data-biu-component="slider"
      data-state={disabled ? "disabled" : "default"}
      style={{ ...style, "--biu-slider-opacity": sliderOpacity } as React.CSSProperties}
      onPointerDown={handleTrackPointerDown}
    >
      <div
        className={cx("biu-ui-slider__rail", classNames?.rail)}
        style={{
          ...(vertical ? { background: "var(--biu-slider-rail)" } : undefined),
        }}
      >
        <span
          className={cx("biu-ui-slider__track", classNames?.track)}
          style={
            range
              ? ({
                  "--biu-slider-start": `${trackStart}%`,
                  "--biu-slider-end": `${trackEnd}%`,
                } as React.CSSProperties)
              : ({ "--biu-slider-start": "0%", "--biu-slider-end": `${trackEnd}%` } as React.CSSProperties)
          }
        />
        {dots
          ? Array.from({ length: Math.floor((safeMax - safeMin) / safeStep) + 1 }, (_, index) => {
              const dotCount = Math.floor((safeMax - safeMin) / safeStep) + 1;
              if (index === 0 || index === dotCount - 1) return null;
              const dotValue = normalizeSliderNumber(safeMin + index * safeStep, safeMin, safeMax, safeStep);
              return (
                <span
                  key={`dot-${dotValue}`}
                  className="biu-ui-slider__dot"
                  style={{ [vertical ? "bottom" : "left"]: `${percentage(dotValue)}%` }}
                />
              );
            })
          : null}
        {activeValues.map((item, index) => (
          <input
            key={index}
            className={cx("biu-ui-slider__input", classNames?.input)}
            type="range"
            min={safeMin}
            max={safeMax}
            step={safeStep}
            value={item}
            disabled={disabled}
            aria-label={
              range
                ? `${typeof props["aria-label"] === "string" ? props["aria-label"] : "范围滑块"}${index === 0 ? "最小值" : "最大值"}`
                : typeof props["aria-label"] === "string"
                  ? props["aria-label"]
                  : "滑块值"
            }
            onChange={(event) => updateValue(index, Number(event.currentTarget.value))}
            onKeyUp={(event) => {
              if (event.key.startsWith("Arrow") || event.key === "Home" || event.key === "End") {
                updateValue(index, Number(event.currentTarget.value), true);
              }
            }}
            onPointerUp={(event) => updateValue(index, Number(event.currentTarget.value), true)}
          />
        ))}
        {activeValues.map((item, index) =>
          tooltipMode !== "never" ? (
            <span
              key={`value-${index}`}
              className={cx(
                "biu-ui-slider__tooltip",
                tooltipMode === "always" && "biu-ui-slider__tooltip--always",
                classNames?.tooltip,
              )}
              style={{ [vertical ? "bottom" : "left"]: `${percentage(item)}%` }}
              aria-hidden="true"
            >
              {item}
            </span>
          ) : null,
        )}
      </div>
      {markEntries.length || dots ? (
        <div className="biu-ui-slider__marks">
          {markEntries.map(({ value: markValue, item }) => (
            <span
              key={markValue}
              className={cx("biu-ui-slider__mark", classNames?.mark)}
              style={{
                [vertical ? "bottom" : "left"]: `${percentage(markValue)}%`,
                ...(isSliderMark(item) ? item.style : {}),
              }}
            >
              {markEntries.length ? (
                <span className={cx("biu-ui-slider__mark-label", classNames?.markLabel)}>{renderMarkLabel(item)}</span>
              ) : null}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
});

export interface SelectOption {
  label: React.ReactNode;
  value: string;
  disabled?: boolean;
  [key: string]: unknown;
}

export type SelectMode = "single" | "multiple";
export type SelectLoadMoreTrigger = "scroll" | "click" | "both";
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
  loadMoreTrigger?: SelectLoadMoreTrigger;
  loadMoreText?: React.ReactNode;
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
    loadMoreTrigger = "scroll",
    loadMoreText,
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
  const selectedOptions = Array.from(selectedValues).map(
    (selectedValue) =>
      sourceOptions.find((option) => option.value === selectedValue) ?? {
        value: selectedValue,
        label: selectedValue,
        disabled: true,
      },
  );
  const responsiveTagLimit = maxTagCount === "responsive" ? 3 : undefined;
  const numericMaxTagCount = typeof maxTagCount === "number" ? maxTagCount : responsiveTagLimit;
  const visibleSelected =
    numericMaxTagCount === undefined ? selectedOptions : selectedOptions.slice(0, numericMaxTagCount);
  const hiddenSelectedCount = selectedOptions.length - visibleSelected.length;
  const hiddenSelected = selectedOptions.slice(visibleSelected.length);
  const hiddenSelectedTooltip = hiddenSelected.length ? (
    <div className="biu-ui-select__hidden-tags-tooltip">
      {hiddenSelected.map((item) => (
        <div key={item.value} className="biu-ui-select__hidden-tag-label">
          {item.label}
        </div>
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
  const loadMore = async () => {
    if (!onLoadMore || loadingMore || loadPending || !hasMore) return;
    setLoadPending(true);
    try {
      await onLoadMore();
    } catch (error) {
      onLoadError?.(error);
    } finally {
      setLoadPending(false);
    }
  };
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (loadMoreTrigger === "click") return;
    const target = event.currentTarget;
    if (target.scrollHeight - target.scrollTop - target.clientHeight > 32) return;
    void loadMore();
  };
  const triggerText = !isMultiple
    ? (() => {
        const selected = sourceOptions.find((item) => item.value === activeValue);
        return selected
          ? (labelRender?.(selected.value, selected) ?? selected.label)
          : activeValue !== undefined
            ? activeValue
            : (placeholder ?? text["请选择"]);
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
      {hasMore && (loadMoreTrigger === "click" || loadMoreTrigger === "both") ? (
        <button
          type="button"
          className="biu-ui-select__load-more"
          disabled={disabled || loading || loadingMore || loadPending}
          onClick={() => void loadMore()}
        >
          {loadMoreText ?? text["加载更多"]}
        </button>
      ) : null}
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
  /** Mark a node as a leaf when children are loaded on demand. */
  isLeaf?: boolean;
  /** Show an expand affordance before its children have been loaded. */
  hasChildren?: boolean;
}
export type CascaderLoadMoreTrigger = SelectLoadMoreTrigger;
export interface CascaderProps {
  options: CascaderOption[];
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[], options: CascaderOption[]) => void;
  changeOnSelect?: boolean;
  searchable?: boolean;
  /** Limit search inputs to specific zero-based column levels. */
  searchLevels?: number[];
  searchValue?: string | Record<number, string>;
  defaultSearchValue?: string | Record<number, string>;
  searchPlaceholder?: string;
  onSearch?: (value: string, level?: number) => void;
  loadChildren?: (option: CascaderOption, level: number) => CascaderOption[] | Promise<CascaderOption[]>;
  loadMoreChildren?: (
    option: CascaderOption,
    level: number,
    currentOptions: CascaderOption[],
    searchValue: string,
  ) => CascaderOption[] | Promise<CascaderOption[]>;
  loadSearchChildren?: (
    option: CascaderOption,
    level: number,
    searchValue: string,
  ) => CascaderOption[] | Promise<CascaderOption[]>;
  hasMore?: boolean | ((option: CascaderOption, level: number, searchValue: string) => boolean);
  loadingMore?: boolean;
  loadMoreTrigger?: CascaderLoadMoreTrigger;
  loadMoreText?: React.ReactNode;
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
    search?: string;
  };
  disabled?: boolean;
  locale?: BiuComponentsLocale;
  localeText?: BiuComponentsLocaleTextOverrides;
}

const MAX_CASCADER_LEVELS = 6;

export function Cascader({
  options,
  value,
  defaultValue = [],
  onChange,
  changeOnSelect = false,
  searchable = false,
  searchLevels,
  searchValue,
  defaultSearchValue = "",
  searchPlaceholder,
  onSearch,
  loadChildren,
  loadMoreChildren,
  loadSearchChildren,
  hasMore = false,
  loadingMore = false,
  loadMoreTrigger = "scroll",
  loadMoreText,
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
  const resolvedSearchPlaceholder = searchPlaceholder ?? text["搜索"];
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const [internalSearch, setInternalSearch] = React.useState<Record<number, string>>(
    typeof defaultSearchValue === "string" ? { 0: defaultSearchValue } : defaultSearchValue,
  );
  const [loadedChildren, setLoadedChildren] = React.useState<Record<string, CascaderOption[]>>({});
  const [loadingPath, setLoadingPath] = React.useState<string | null>(null);
  const [loadingMorePath, setLoadingMorePath] = React.useState<string | null>(null);
  const [loadingSearchPath, setLoadingSearchPath] = React.useState<string | null>(null);
  const searchRequestRef = React.useRef(0);
  const rawActiveValue = value ?? internalValue;
  const activeValue = React.useMemo(
    () => (rawActiveValue.length > MAX_CASCADER_LEVELS ? rawActiveValue.slice(0, MAX_CASCADER_LEVELS) : rawActiveValue),
    [rawActiveValue],
  );
  const [panelValue, setPanelValue] = React.useState(activeValue);
  React.useEffect(() => setPanelValue(activeValue), [activeValue]);
  const activeOpen = !disabled && (open ?? internalOpen);
  const childrenFor = React.useCallback(
    (option: CascaderOption, path: string[]) => loadedChildren[path.join("/")] ?? option.children ?? [],
    [loadedChildren],
  );
  const getSelected = React.useCallback(
    (path: string[]) => {
      const selected: CascaderOption[] = [];
      let current = options;
      const parentPath: string[] = [];
      for (const key of path) {
        const item = current.find((option) => option.value === key);
        const resolved = item ?? { value: key, label: key, disabled: true, isLeaf: true };
        selected.push(resolved);
        if (!item) {
          current = [];
          continue;
        }
        parentPath.push(item.value);
        current = childrenFor(item, parentPath);
      }
      return selected;
    },
    [childrenFor, options],
  );
  const selectedOptions = getSelected(panelValue);
  const displaySelectedOptions = getSelected(activeValue);
  const columns: Array<{ options: CascaderOption[]; parentPath: string[] }> = [{ options, parentPath: [] }];
  let parentPath: string[] = [];
  for (const item of selectedOptions) {
    if (columns.length >= MAX_CASCADER_LEVELS) break;
    const nextPath = [...parentPath, item.value];
    const children = childrenFor(item, nextPath);
    if (!children.length && item.isLeaf !== false && !item.hasChildren) break;
    columns.push({ options: children, parentPath: nextPath });
    parentPath = nextPath;
  }
  const getSearchValue = (level: number) =>
    typeof searchValue === "string" ? searchValue : (searchValue?.[level] ?? internalSearch[level] ?? "");
  const isSearchEnabled = (level: number) => searchable && (searchLevels === undefined || searchLevels.includes(level));
  const parentOptionFor = React.useCallback(
    (path: string[]) => (path.length ? getSelected(path).at(-1) : undefined),
    [getSelected],
  );
  const hasMoreFor = (option: CascaderOption | undefined, level: number, query: string) =>
    Boolean(option && loadMoreChildren && (typeof hasMore === "function" ? hasMore(option, level, query) : hasMore));
  const hasChildren = (option: CascaderOption, path: string[]) =>
    option.isLeaf !== true &&
    (childrenFor(option, path).length > 0 ||
      option.hasChildren === true ||
      (Boolean(loadChildren) && option.children === undefined));
  const setActiveOpen = (next: boolean) => {
    if (disabled) return;
    if (open === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };
  const updateSearch = (next: string, level: number) => {
    if (searchValue === undefined) setInternalSearch((current) => ({ ...current, [level]: next }));
    onSearch?.(next, level);
    if (!loadSearchChildren) return;
    const column = columns[level];
    const parentOption = parentOptionFor(column?.parentPath ?? []);
    if (!column || !parentOption) return;
    const pathKey = column.parentPath.join("/");
    const requestId = searchRequestRef.current + 1;
    searchRequestRef.current = requestId;
    setLoadingSearchPath(pathKey);
    void Promise.resolve(loadSearchChildren(parentOption, level, next))
      .then((nextOptions) => {
        if (searchRequestRef.current !== requestId) return;
        setLoadedChildren((current) => ({ ...current, [pathKey]: nextOptions }));
      })
      .finally(() => {
        if (searchRequestRef.current === requestId) setLoadingSearchPath(null);
      });
  };
  const loadMore = async (
    column: { options: CascaderOption[]; parentPath: string[] },
    level: number,
    query: string,
  ) => {
    const parentOption = parentOptionFor(column.parentPath);
    const pathKey = column.parentPath.join("/");
    if (!parentOption || !loadMoreChildren || loadingMore || loadingMorePath || !hasMoreFor(parentOption, level, query))
      return;
    setLoadingMorePath(pathKey);
    try {
      const nextOptions = await loadMoreChildren(parentOption, level, column.options, query);
      setLoadedChildren((current) => {
        const existing = current[pathKey] ?? column.options;
        const seen = new Set(existing.map((item) => item.value));
        return {
          ...current,
          [pathKey]: [...existing, ...nextOptions.filter((item) => !seen.has(item.value))],
        };
      });
    } finally {
      setLoadingMorePath(null);
    }
  };
  const selectOption = async (option: CascaderOption, level: number, currentParentPath: string[]) => {
    if (option.disabled || loadingPath) return;
    const next = [...currentParentPath, option.value].slice(0, MAX_CASCADER_LEVELS);
    const pathKey = next.join("/");
    let children = childrenFor(option, next);
    const canExpand = level < MAX_CASCADER_LEVELS - 1;
    const shouldLoad =
      canExpand &&
      Boolean(loadChildren) &&
      option.isLeaf !== true &&
      children.length === 0 &&
      (option.hasChildren === true || option.children === undefined) &&
      !Object.prototype.hasOwnProperty.call(loadedChildren, pathKey);
    if (shouldLoad) {
      setLoadingPath(pathKey);
      try {
        children = (await loadChildren?.(option, level)) ?? [];
        setLoadedChildren((current) => ({ ...current, [pathKey]: children }));
      } finally {
        setLoadingPath(null);
      }
    }
    setPanelValue(next);
    if (value === undefined) setInternalValue(next);
    if (changeOnSelect || !children.length || !canExpand) {
      onChange?.(next, getSelected(next));
      setActiveOpen(false);
    }
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
                  {columns.map((column, level) => {
                    const query = getSearchValue(level).trim().toLowerCase();
                    const parentOption = parentOptionFor(column.parentPath);
                    const isLastColumn = level === columns.length - 1;
                    const canLoadMore = isLastColumn && hasMoreFor(parentOption, level, query);
                    const loadingMoreCurrent = loadingMore || loadingMorePath === column.parentPath.join("/");
                    const loadingSearchCurrent = loadingSearchPath === column.parentPath.join("/");
                    const visibleOptions = query
                      ? column.options.filter((option) =>
                          `${String(option.label)} ${option.value}`.toLowerCase().includes(query),
                        )
                      : column.options;
                    return (
                      <div key={level} className={cx("biu-ui-cascader__column", classNames?.column)}>
                        {isSearchEnabled(level) ? (
                          <div className={cx("biu-ui-cascader__column-search", classNames?.search)}>
                            <input
                              value={getSearchValue(level)}
                              placeholder={resolvedSearchPlaceholder}
                              aria-label={`${resolvedSearchPlaceholder} ${level + 1}`}
                              onChange={(event) => updateSearch(event.target.value, level)}
                              onKeyDown={(event) => event.stopPropagation()}
                            />
                          </div>
                        ) : null}
                        <div
                          className="biu-ui-cascader__column-options"
                          onScroll={(event) => {
                            if (loadMoreTrigger === "click" || !canLoadMore) return;
                            const target = event.currentTarget;
                            if (target.scrollHeight - target.scrollTop - target.clientHeight <= 32)
                              void loadMore(column, level, query);
                          }}
                        >
                          {visibleOptions.length ? (
                            visibleOptions.map((option) => {
                              const optionPath = [...column.parentPath, option.value];
                              const optionHasChildren =
                                level < MAX_CASCADER_LEVELS - 1 && hasChildren(option, optionPath);
                              const loading = loadingPath === optionPath.join("/");
                              const selected = panelValue[level] === option.value;
                              return (
                                <button
                                  type="button"
                                  key={option.value}
                                  className={cx(
                                    "biu-ui-cascader__option",
                                    selected && "is-selected",
                                    classNames?.option,
                                  )}
                                  disabled={option.disabled || loading || loadingSearchCurrent}
                                  role="option"
                                  aria-selected={selected}
                                  onClick={() => void selectOption(option, level, column.parentPath)}
                                >
                                  <Ellipsis content={option.label} maxWidth="100%">
                                    {optionRender?.(option, level) ?? option.label}
                                  </Ellipsis>
                                  {loading ? <span className="biu-ui-cascader__loading">{text["加载中…"]}</span> : null}
                                  {!loading && optionHasChildren ? <ChevronRight size={14} aria-hidden="true" /> : null}
                                </button>
                              );
                            })
                          ) : (
                            <div className="biu-ui-cascader__empty">{text["暂无数据"]}</div>
                          )}
                          {loadingMoreCurrent || loadingSearchCurrent ? (
                            <div className="biu-ui-cascader__loading">{text["加载中…"]}</div>
                          ) : null}
                        </div>
                        {canLoadMore && (loadMoreTrigger === "click" || loadMoreTrigger === "both") ? (
                          <button
                            type="button"
                            className="biu-ui-cascader__load-more"
                            disabled={disabled || loadingMoreCurrent || loadingSearchCurrent}
                            onClick={() => void loadMore(column, level, query)}
                          >
                            {loadMoreText ?? text["加载更多"]}
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </PopoverPrimitive.Content>,
              document.body,
            )
          : null}
      </PopoverPrimitive.Root>
    </div>
  );
}
