import { DatePicker, type DatePickerProps } from "./date-picker.js";

export interface TimePickerProps extends Omit<DatePickerProps, "min" | "max" | "disabledDate" | "range"> {
  range?: boolean;
}

export function TimePicker({ format = "HH:mm", range = false, ...props }: TimePickerProps) {
  return <DatePicker {...props} format={format} range={range} showTime={false} timeOnly />;
}

export const RangeTimePicker = (props: Omit<TimePickerProps, "range">) => <TimePicker {...props} range />;
