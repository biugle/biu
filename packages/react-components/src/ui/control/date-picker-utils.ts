import type { Dayjs } from "dayjs";

export type DatePickerValue = Dayjs | null | [Dayjs | null, Dayjs | null];

// Preserve a three-digit display for early calendar years so the entry remains
// consistent with the year field's 3–4 digit contract.
export function formatCalendarYear(year: number) {
  const value = String(year);
  return /^\d{1,2}$/.test(value) ? value.padStart(3, "0") : value;
}

export function sanitizeCalendarYearInput(value: string) {
  return value.replace(/\D/g, "").slice(0, 4);
}

// Short intermediate values are useful while typing; only complete 3–4 digit
// entries can be committed to the calendar.
export function parseCalendarYearInput(value: string) {
  if (!/^\d{3,4}$/.test(value)) return null;
  const year = Number(value);
  return Number.isInteger(year) ? year : null;
}

export function normalizeDateFormat(format: string, fallback: string, hour12 = false) {
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

export function isRangeValue(value: DatePickerValue | undefined): value is [Dayjs | null, Dayjs | null] {
  return Array.isArray(value);
}

export function formatDateValue(value: Dayjs | null | undefined, format: string) {
  return value ? value.format(format) : "";
}

export function resolvePreset<T>(value: T | (() => T)): T {
  return typeof value === "function" ? (value as () => T)() : value;
}

export function getDateValueKey(value: DatePickerValue) {
  const keyFor = (item: Dayjs | null | undefined) => (item ? String(item.valueOf()) : "empty");
  return isRangeValue(value) ? `range:${keyFor(value[0])}:${keyFor(value[1])}` : `single:${keyFor(value)}`;
}

export function getCalendarFocusValue(value: DatePickerValue) {
  return isRangeValue(value) ? (value[1] ?? value[0]) : value;
}
