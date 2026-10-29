import * as React from "react";
import { cx } from "../../shared/utils.js";
import { decimalInteger, decimalPlaces, decimalString } from "./decimal.js";
import type { ControlClassNames } from "./types.js";

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
  // Keep the native range input in its established LTR direction; shell RTL
  // must not reverse its thumb or change its emitted-value interaction.
  return (
    <div
      {...props}
      ref={ref}
      dir="ltr"
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
