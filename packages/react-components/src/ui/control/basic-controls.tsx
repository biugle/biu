import * as React from "react";
import { Minus, Plus, X } from "@biugle/icons";
import { cx, mergeRefs, type BiuSize } from "../../shared/utils.js";
import { createInputFilter } from "../../shared/input-filter.js";
import {
  useComponentsLocale,
  type BiuComponentsLocale,
  type BiuComponentsLocaleTextOverrides,
} from "../../provider.js";
import {
  addDecimal,
  decimalPlaces,
  getInputNumberLimitIssue,
  INPUT_NUMBER_MAX_DECIMAL_PLACES,
  INPUT_NUMBER_MAX_VALUE,
  roundDecimal,
  type InputNumberLimitIssue,
} from "./decimal.js";
import type { ControlClassNames } from "./types.js";

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
    <>
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
    </>
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
  /** Configured decimal precision; capped at 15 decimal places for safe Number-backed values. */
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
  /** Return string values from onChange; JavaScript safe-range and precision limits still apply. */
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
  const requestedDigits = integer ? 0 : (decimal ?? precision);
  const configuredDigits =
    requestedDigits === undefined || !Number.isFinite(requestedDigits)
      ? undefined
      : Math.min(INPUT_NUMBER_MAX_DECIMAL_PLACES, Math.max(0, Math.floor(requestedDigits)));
  const fractionDigits = configuredDigits ?? INPUT_NUMBER_MAX_DECIMAL_PLACES;
  const signSource = sign === "negative" ? "-" : sign === "positive" ? "" : "-?";
  const limitMessage = (issue?: InputNumberLimitIssue) =>
    issue === "invalid"
      ? text["请输入有效数字"]
      : issue === "range"
        ? text["数值超出安全范围，请改用文本输入框"]
        : issue === "precision"
          ? text["数值精度超出 JavaScript 安全限制（小数最多15位且转换后不能舍入），请改用文本输入框"]
          : undefined;
  const groupSeparator =
    thousandSeparator === true ? "," : typeof thousandSeparator === "string" ? thousandSeparator : "";
  const editingBodySource =
    fractionDigits === 0 ? "\\d+" : `(?:\\d+(?:\\.\\d{0,${fractionDigits}})?|\\.\\d{1,${fractionDigits}})`;
  const editingPattern = new RegExp(`^${signSource}${editingBodySource}$`);
  const [invalidError, setInvalidError] = React.useState<React.ReactNode>();
  const [internal, setInternal] = React.useState<number | string | undefined>(defaultValue);
  const [unsafeDraft, setUnsafeDraft] = React.useState<{ value: number | string | undefined; text: string }>();
  const active = value === undefined ? internal : value;
  const unsafeInput = unsafeDraft && Object.is(unsafeDraft.value, active) ? unsafeDraft.text : undefined;
  const activeLimitIssue = getInputNumberLimitIssue(active);
  const activeLimitMessage = limitMessage(activeLimitIssue);
  const activeNumber = Number(active ?? 0);
  const getSafeBound = (bound: number | string | undefined, fallback: number) => {
    if (bound === undefined || bound === "") return fallback;
    const numeric = Number(bound);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.min(INPUT_NUMBER_MAX_VALUE, Math.max(-INPUT_NUMBER_MAX_VALUE, numeric));
  };
  const safeMinimum = getSafeBound(min, -INPUT_NUMBER_MAX_VALUE);
  const safeMaximum = Math.max(safeMinimum, getSafeBound(max, INPUT_NUMBER_MAX_VALUE));
  const errorId = React.useId();
  const safetyBlocked = Boolean(activeLimitIssue || unsafeInput !== undefined);

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
  const display =
    unsafeInput ??
    (activeLimitIssue ? String(active ?? "") : formatter ? formatter(active) : formatNumericText(active));
  const parsedStep = Number(step);
  const numericStep =
    Number.isFinite(parsedStep) && parsedStep !== 0 && !getInputNumberLimitIssue(step) ? parsedStep : 1;
  const sanitizeNumericInput = (raw: string, truncateToConfiguredDigits = true) => {
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
    const fraction =
      truncateToConfiguredDigits && configuredDigits !== undefined
        ? fractionSource.slice(0, configuredDigits)
        : fractionSource;
    return `${hasLeadingMinus ? "-" : ""}${whole}.${fraction}`;
  };
  const getParserPrecisionIssue = (raw: string): InputNumberLimitIssue | undefined => {
    if (!parser) return undefined;
    let candidate = raw.trim();
    if (groupSeparator) candidate = candidate.split(groupSeparator).join("");
    if (decimalSeparator !== ".") candidate = candidate.split(decimalSeparator).join(".");
    candidate = candidate.replace(/[^\d.+-]/g, "");
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(candidate)) return undefined;
    return getInputNumberLimitIssue(candidate) === "precision" ? "precision" : undefined;
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
    return stringMode
      ? normalized
      : Number(roundDecimal(normalized, configuredDigits ?? INPUT_NUMBER_MAX_DECIMAL_PLACES));
  };
  const normalize = (next: number | string) => {
    if (getInputNumberLimitIssue(next) === "precision") return String(next);
    const numericNext = Number(next);
    if (!Number.isFinite(numericNext)) return String(next);
    const bounded = Math.max(safeMinimum, Math.min(safeMaximum, numericNext));
    const source = bounded === numericNext ? String(next) : String(bounded);
    const inferredDigits = Math.max(
      decimalPlaces(source),
      decimalPlaces(numericStep),
      decimalPlaces(min),
      decimalPlaces(max),
    );
    const targetDigits = configuredDigits ?? Math.min(INPUT_NUMBER_MAX_DECIMAL_PLACES, inferredDigits);
    const rounded = roundDecimal(source, targetDigits);
    return getInputNumberLimitIssue(rounded) ? roundDecimal(source, INPUT_NUMBER_MAX_DECIMAL_PLACES) : rounded;
  };
  const commit = (next: number | string | undefined, event?: React.ChangeEvent<HTMLInputElement>) => {
    const issue = next === undefined ? undefined : getInputNumberLimitIssue(next);
    if (issue) {
      setInvalidError(limitMessage(issue));
      return false;
    }
    if (value === undefined) setInternal(next);
    onChange?.(next, event);
    return true;
  };
  const commitStep = (next: number | string) => {
    const normalized = normalize(next);
    const issue = getInputNumberLimitIssue(normalized);
    if (issue) {
      setInvalidError(limitMessage(issue));
      return;
    }
    setInvalidError(undefined);
    commit(stringMode ? String(normalized) : Number(normalized));
  };
  const draftLimitIssue = unsafeInput === undefined ? undefined : getInputNumberLimitIssue(unsafeInput);
  const safetyMessage = activeLimitMessage ?? limitMessage(draftLimitIssue);
  const visibleError = safetyMessage ?? error ?? invalidError ?? (safetyBlocked ? text["请输入有效数字"] : undefined);
  const describedBy = [props["aria-describedby"], visibleError ? errorId : undefined].filter(Boolean).join(" ");
  const changeBy = (direction: 1 | -1, event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || readOnly || safetyBlocked) return;
    const current = Number(active ?? 0);
    if (!Number.isFinite(current)) return;
    commitStep(addDecimal(active ?? 0, numericStep, direction));
    event.currentTarget.blur();
  };
  const handleWheel = (event: React.WheelEvent<HTMLInputElement>) => {
    onWheel?.(event);
    if (!changeOnWheel || disabled || readOnly || safetyBlocked || event.deltaY === 0) return;
    const activeElement = typeof document === "undefined" ? null : document.activeElement;
    if (activeElement !== event.currentTarget) return;
    event.preventDefault();
    commitStep(addDecimal(active ?? 0, numericStep, event.deltaY < 0 ? 1 : -1));
  };
  return (
    <>
      <span
        className={cx(
          "biu-ui-input-number",
          (error || invalidError || activeLimitIssue || unsafeInput !== undefined) && "biu-ui-control--error",
          disabled && "biu-ui-control--disabled",
          readOnly && "biu-ui-control--readonly",
          className,
          classNames?.root,
        )}
        data-biu-component="input-number"
        data-state={
          error || invalidError || activeLimitIssue || unsafeInput !== undefined
            ? "error"
            : disabled
              ? "disabled"
              : readOnly
                ? "readonly"
                : "default"
        }
      >
        {controls ? (
          <button
            type="button"
            className={cx("biu-ui-input-number__button", "biu-ui-input-number__decrement", classNames?.decrement)}
            aria-label={text["减少"]}
            disabled={disabled || readOnly || safetyBlocked || activeNumber <= safeMinimum}
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
            active === undefined || active === "" || activeLimitIssue || !Number.isFinite(activeNumber)
              ? undefined
              : activeNumber
          }
          aria-valuemin={safeMinimum}
          aria-valuemax={safeMaximum}
          aria-invalid={Boolean(
            props["aria-invalid"] || error || invalidError || activeLimitIssue || unsafeInput !== undefined,
          )}
          aria-describedby={describedBy || undefined}
          title={props.title ?? (typeof visibleError === "string" ? visibleError : activeLimitMessage)}
          className={cx("biu-ui-input-number__input", classNames?.input)}
          value={display}
          disabled={disabled}
          readOnly={readOnly}
          onBlur={(event) => {
            const current = String(unsafeInput ?? active ?? "");
            const currentIssue = getInputNumberLimitIssue(current);
            if (currentIssue) {
              setInvalidError(limitMessage(currentIssue));
            } else if (!parser && current && !["-", ".", "-.", ""].includes(current) && editingPattern.test(current)) {
              const next = normalizedValue(current);
              if (next !== active) {
                setInvalidError(undefined);
                setUnsafeDraft(undefined);
                commit(next);
              }
            }
            onBlur?.(event);
          }}
          onWheel={handleWheel}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (event.defaultPrevented || disabled || readOnly || safetyBlocked) return;
            if (event.key === "ArrowUp" || event.key === "ArrowDown") {
              event.preventDefault();
              if (!Number.isFinite(Number(active ?? 0))) return;
              commitStep(addDecimal(active ?? 0, numericStep, event.key === "ArrowUp" ? 1 : -1));
            }
          }}
          onChange={(event) => {
            const raw = event.target.value;
            const truncateToConfiguredDigits =
              configuredDigits !== undefined && configuredDigits < INPUT_NUMBER_MAX_DECIMAL_PLACES;
            const sanitized = sanitizeNumericInput(raw, !parser && truncateToConfiguredDigits);
            const parsed =
              sanitized === "" ? undefined : parser ? parser(sanitized) : stringMode ? sanitized : Number(sanitized);
            if (sanitized === "-" || sanitized === "." || sanitized === "-.") {
              setInvalidError(undefined);
              setUnsafeDraft(undefined);
              if (sanitized !== raw) event.target.value = sanitized;
              commit(sanitized, event);
              return;
            }
            const safetyIssue = parser
              ? (getParserPrecisionIssue(raw) ?? getInputNumberLimitIssue(parsed))
              : getInputNumberLimitIssue(sanitized);
            if (safetyIssue) {
              setInvalidError(limitMessage(safetyIssue));
              const safeDraft = sanitized.slice(0, 256);
              setUnsafeDraft({ value: active, text: safeDraft });
              if (safeDraft !== raw) event.target.value = safeDraft;
              return;
            }
            if (sanitized === "") {
              setInvalidError(undefined);
              setUnsafeDraft(undefined);
              commit(undefined, event);
              return;
            }
            if (unsafeInput !== undefined) setUnsafeDraft(undefined);
            if (!parser && sanitized.endsWith(".")) {
              setInvalidError(undefined);
              if (sanitized !== raw) event.target.value = sanitized;
              commit(sanitized, event);
              return;
            }
            if (!parser && !editingPattern.test(sanitized)) {
              setInvalidError(text["请输入有效数字"]);
              if (sanitized !== raw) event.target.value = sanitized;
              commit(sanitized || undefined, event);
              return;
            }
            if (typeof parsed === "number" && !Number.isFinite(parsed)) {
              setInvalidError(text["请输入有效数字"]);
              commit(undefined, event);
              return;
            }
            const numericValue = Number(parsed);
            const signInvalid =
              sign === "positive" ? numericValue <= 0 : sign === "negative" ? numericValue >= 0 : false;
            const rangeInvalid = numericValue < safeMinimum || numericValue > safeMaximum;
            setInvalidError(signInvalid || rangeInvalid ? text["请输入范围内的数字"] : undefined);
            if (sanitized !== raw) event.target.value = sanitized;
            const normalizedText = normalizeNumericText(sanitized);
            const next = normalizedText === sanitized ? parsed : sanitized;
            if (commit(next, event)) {
              setUnsafeDraft(undefined);
              setInvalidError(signInvalid || rangeInvalid ? text["请输入范围内的数字"] : undefined);
            }
          }}
        />
        {controls ? (
          <button
            type="button"
            className={cx("biu-ui-input-number__button", "biu-ui-input-number__increment", classNames?.increment)}
            aria-label={text["增加"]}
            disabled={disabled || readOnly || safetyBlocked || activeNumber >= safeMaximum}
            tabIndex={-1}
            onClick={(event) => changeBy(1, event)}
          >
            <Plus size={16} aria-hidden="true" />
          </button>
        ) : null}
      </span>
      {visibleError ? (
        <span
          id={errorId}
          className={cx("biu-ui-control__error", "biu-ui-input-number__error", classNames?.error)}
          role="alert"
        >
          {visibleError}
        </span>
      ) : null}
    </>
  );
});

export const SearchTextField = React.forwardRef<HTMLInputElement, TextFieldProps>(function SearchTextField(props, ref) {
  return <TextField {...props} ref={ref} type="search" className={cx("biu-ui-search-textfield", props.className)} />;
});
