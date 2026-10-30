import { useBiuI18n } from "@biugle/biu-runtime";
import { Form, FormGroup } from "@biugle/react-form";
import { DatePicker, RangeDatePicker, RangeTimePicker, TimePicker } from "@biugle/react-components";

export function DateFields({ locale }: { locale?: string }) {
  const { $t } = useBiuI18n();
  return (
    <FormGroup title={$t("日期与通知")} description={$t("日期、时间和区间控件使用同一套受控字段协议。")}>
      <Form.Item name="date" label={$t("生效日期")} rules={{ required: $t("请选择生效日期") }}>
        {({ field }) => <DatePicker value={field.value as never} onChange={field.onChange} locale={locale} />}
      </Form.Item>
      <Form.Item name="rangeDate" label={$t("有效区间")}>
        {({ field }) => <RangeDatePicker value={field.value as never} onChange={field.onChange} locale={locale} />}
      </Form.Item>
      <Form.Item name="time" label={$t("提醒时间")}>
        {({ field }) => (
          <TimePicker value={field.value as never} onChange={field.onChange} locale={locale} format="HH:mm:ss" />
        )}
      </Form.Item>
      <Form.Item name="rangeTime" label={$t("提醒区间")}>
        {({ field }) => (
          <RangeTimePicker value={field.value as never} onChange={field.onChange} locale={locale} format="HH:mm:ss" />
        )}
      </Form.Item>
    </FormGroup>
  );
}
