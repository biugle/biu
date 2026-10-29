import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { createPortal } from "react-dom";
import dayjs, { type Dayjs } from "dayjs";
import { Calendar, ChevronLeft, ChevronRight, Clock, X } from "@biugle/icons";
import { cx } from "../../shared/utils.js";
import { Ellipsis } from "../overlay/index.js";
import {
  useComponentsConfig,
  useComponentsLocale,
  type BiuComponentsLocale,
  type BiuComponentsLocaleTextOverrides,
} from "../../provider.js";
import { Select } from "./select.js";
import {
  formatCalendarYear,
  formatDateValue,
  getCalendarFocusValue,
  getDateValueKey,
  isRangeValue,
  normalizeDateFormat,
  parseCalendarYearInput,
  resolvePreset,
  sanitizeCalendarYearInput,
} from "./date-picker-utils.js";
import type { ControlClassNames } from "./types.js";

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
  /** Shows a confirmation action that closes the panel; selection values still update immediately. */
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
  locale,
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
  locale?: BiuComponentsLocale;
  text: ReturnType<typeof useComponentsLocale>;
}) {
  const activeRange = isRangeValue(value) ? value : [value, null];
  const start = month.startOf("month").startOf("week");
  const dates = Array.from({ length: 42 }, (_, index) => start.add(index, "day"));
  const weekdays = (text["星期"] ?? "").split(",");
  const localeKey = locale?.trim().toLowerCase();
  const monthLocale = localeKey === "en" || localeKey?.startsWith("en-") ? "en-US" : "zh-CN";
  const monthLabelFormatter = React.useMemo(
    () => new Intl.DateTimeFormat(monthLocale, { month: "short", timeZone: "UTC" }),
    [monthLocale],
  );
  const monthOptions = Array.from({ length: 12 }, (_, index) => {
    const optionMonth = month.startOf("year").month(index).startOf("month");
    return {
      value: String(index),
      label: monthLabelFormatter.format(new Date(Date.UTC(2020, index, 1))),
      disabled: Boolean(
        (min && optionMonth.endOf("month").isBefore(min, "day")) || (max && optionMonth.isAfter(max, "day")),
      ),
    };
  });
  const [yearInput, setYearInput] = React.useState(formatCalendarYear(month.year()));
  React.useEffect(() => setYearInput(formatCalendarYear(month.year())), [month]);
  const commitYear = () => {
    const nextYear = parseCalendarYearInput(yearInput);
    if (nextYear === null) {
      setYearInput(formatCalendarYear(month.year()));
      return;
    }
    if ((min && nextYear < min.year()) || (max && nextYear > max.year())) {
      setYearInput(formatCalendarYear(month.year()));
      return;
    }
    // Direct year entry avoids repeated month paging; keep the selected month
    // when possible and move to the nearest valid boundary month otherwise.
    let nextMonth = month.year(nextYear).startOf("month");
    if (min && nextMonth.endOf("month").isBefore(min, "day")) nextMonth = min.startOf("month");
    if (max && nextMonth.isAfter(max, "day")) nextMonth = max.startOf("month");
    setMonth(nextMonth);
  };
  const previousMonthDisabled = Boolean(min && !month.isAfter(min, "month"));
  const nextMonthDisabled = Boolean(max && !month.isBefore(max, "month"));
  return (
    <div className={cx("biu-ui-date-picker__calendar", classNames?.calendar, className)}>
      <div className="biu-ui-date-picker__calendar-header">
        <button
          type="button"
          aria-label={text["上个月"]}
          disabled={previousMonthDisabled}
          onClick={() => setMonth(month.subtract(1, "month"))}
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        <div className="biu-ui-date-picker__calendar-controls">
          <label className="biu-ui-date-picker__calendar-year-field">
            {/* Keep mobile numeric keyboards while rejecting number-input signs, decimals, and exponent syntax. */}
            <input
              aria-label={text["年份"]}
              type="text"
              inputMode="numeric"
              minLength={3}
              maxLength={4}
              pattern="[0-9]{3,4}"
              autoComplete="off"
              value={yearInput}
              onChange={(event) => setYearInput(sanitizeCalendarYearInput(event.currentTarget.value))}
              onBlur={commitYear}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  event.currentTarget.blur();
                }
              }}
            />
            {text["年"] ? <span aria-hidden="true">{text["年"]}</span> : null}
          </label>
          <div className="biu-ui-date-picker__calendar-month-field">
            <Select
              size="small"
              className="biu-ui-date-picker__calendar-month-select"
              aria-label={text["月份"]}
              value={String(month.month())}
              options={monthOptions}
              onChange={(value) => {
                if (typeof value !== "string") return;
                setMonth(month.month(Number(value)).startOf("month"));
              }}
            />
          </div>
        </div>
        <button
          type="button"
          aria-label={text["下个月"]}
          disabled={nextMonthDisabled}
          onClick={() => setMonth(month.add(1, "month"))}
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
      <div className={cx("biu-ui-date-picker__weekdays", classNames?.weekdays)}>
        {weekdays.map((day, index) => (
          <span
            className={cx("biu-ui-date-picker__week", classNames?.week, (index === 0 || index === 6) && "is-weekend")}
            key={day}
          >
            {day}
          </span>
        ))}
      </div>
      <div className="biu-ui-date-picker__days">
        {dates.map((date) => {
          const outside = !date.isSame(month, "month");
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
                (date.day() === 0 || date.day() === 6) && "is-weekend",
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
  const { locale: configuredLocale } = useComponentsConfig();
  const text = useComponentsLocale(locale, localeText);
  const calendarLocale = locale ?? configuredLocale ?? "zh-CN";
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
  const [draft, setDraft] = React.useState<Exclude<DatePickerProps["value"], undefined>>(resolvedValue);
  const draftRef = React.useRef(draft);
  const lastEmittedValueKeyRef = React.useRef<string | null>(null);
  const setDraftValue = React.useCallback((next: Exclude<DatePickerProps["value"], undefined>) => {
    draftRef.current = next;
    setDraft(next);
  }, []);
  const resolvedValueKey = getDateValueKey(resolvedValue);
  const resolvedValueRef = React.useRef(resolvedValue);
  resolvedValueRef.current = resolvedValue;
  const syncedValueKeyRef = React.useRef(resolvedValueKey);
  const initialCalendarValue = getCalendarFocusValue(resolvedValue);
  const [month, setMonth] = React.useState((initialCalendarValue ?? min ?? max ?? dayjs()).startOf("month"));
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const activeOpen = !disabled && !readOnly && (open ?? internalOpen);
  React.useEffect(() => {
    if (syncedValueKeyRef.current === resolvedValueKey) return;
    syncedValueKeyRef.current = resolvedValueKey;
    const next = resolvedValueRef.current;
    draftRef.current = next;
    setDraft(next);
    const focusDate = getCalendarFocusValue(next);
    if (!timeOnly && focusDate) setMonth(focusDate.startOf("month"));
  }, [resolvedValueKey, timeOnly]);
  const setOpen = (next: boolean) => {
    if (disabled || readOnly) return;
    if (open === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };
  // Publish every picker change immediately. `needConfirm` only controls the
  // explicit close action below; it never creates a second unsubmitted value.
  const emit = (next: DatePickerProps["value"]) => {
    if (disabled || readOnly) return;
    const nextValue: Exclude<DatePickerProps["value"], undefined> = next ?? null;
    setDraftValue(nextValue);
    if (value === undefined) setInternal(nextValue);
    lastEmittedValueKeyRef.current = getDateValueKey(nextValue);
    const dateString = isRangeValue(next)
      ? next.map((item) => formatDateValue(item, dateFormat))
      : formatDateValue(next, dateFormat);
    onChange?.(nextValue, dateString);
  };
  const currentRange = isRangeValue(draft) ? draft : ([draft, null] as [Dayjs | null, Dayjs | null]);
  const selectDate = (date: Dayjs) => {
    const currentDraft = draftRef.current;
    const activeRange = isRangeValue(currentDraft)
      ? currentDraft
      : ([currentDraft, null] as [Dayjs | null, Dayjs | null]);
    setMonth(date.startOf("month"));
    if (range) {
      // Range selection is intentionally a tiny state machine: the first
      // click starts a new range, the second click completes it. There is no
      // start/end toggle in the panel and no hidden side that users must
      // select before continuing. A completed range starts over on the next
      // click, while reversed clicks are normalized for the trigger/value.
      const next: [Dayjs | null, Dayjs | null] =
        activeRange[0] && activeRange[1]
          ? [date, null]
          : activeRange[0]
            ? activeRange[0].isAfter(date, "day")
              ? [date, activeRange[0]]
              : [activeRange[0], date]
            : activeRange[1]
              ? activeRange[1].isAfter(date, "day")
                ? [date, activeRange[1]]
                : [activeRange[1], date]
              : [date, null];
      emit(next);
      return;
    }
    const activeDate = isRangeValue(currentDraft) ? currentDraft[0] : currentDraft;
    const next = showTime
      ? date
          .hour((activeDate ?? dayjs()).hour())
          .minute((activeDate ?? dayjs()).minute())
          .second((activeDate ?? dayjs()).second())
      : date;
    emit(next);
  };
  const updateTime = (next: Dayjs, position: "start" | "end" = "start") => {
    if (disabled || readOnly) return;
    const currentDraft = draftRef.current;
    const activeRange = isRangeValue(currentDraft)
      ? currentDraft
      : ([currentDraft, null] as [Dayjs | null, Dayjs | null]);
    const defaultTime = timeOnly ? dayjs("2000-01-01T00:00:00") : next.startOf("day");
    const rawRange: [Dayjs, Dayjs] =
      position === "end" ? [activeRange[0] ?? defaultTime, next] : [next, activeRange[1] ?? defaultTime];
    const orderedRange: [Dayjs, Dayjs] = rawRange[0].isAfter(rawRange[1]) ? [rawRange[1], rawRange[0]] : rawRange;
    const nextValue: Exclude<DatePickerProps["value"], undefined> = range ? orderedRange : next;
    emit(nextValue);
  };
  const commit = () => {
    // Read the ref because a selection and Confirm can occur before React has
    // rendered the queued state update. Only publish here when no action has
    // already emitted this exact value (for example, confirming an untouched
    // existing value).
    const latestValue = draftRef.current;
    if (lastEmittedValueKeyRef.current !== getDateValueKey(latestValue)) emit(latestValue);
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
                const focusDate = getCalendarFocusValue(next);
                if (!timeOnly && focusDate) setMonth(focusDate.startOf("month"));
                emit(next);
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
            locale={calendarLocale}
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
          <span className="biu-ui-date-picker__footer-leading">
            {footer}
            {showNow && !timeOnly ? (
              <button
                type="button"
                onClick={() => {
                  const now = dayjs();
                  setMonth(now.startOf("month"));
                  emit(range ? [now, null] : now);
                }}
              >
                {text["今天"]}
              </button>
            ) : null}
          </span>
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
          <span className="biu-ui-date-picker__footer-trailing" aria-hidden="true" />
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
  // Date/time controls keep their established LTR geometry until they expose
  // an explicit RTL contract; repeat dir on the body portal below because it
  // does not inherit direction from this trigger.
  return (
    <div
      dir="ltr"
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
                dir="ltr"
                className={cx(
                  "biu-ui-date-picker__content",
                  range && (timeOnly || showTime) && "biu-ui-date-picker__content--range-time",
                  classNames?.content,
                )}
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

export type { Dayjs };
export const RangeDatePicker = (props: Omit<DatePickerProps, "range">) => <DatePicker {...props} range />;
