import { useBiuI18n } from "@biugle/biu-runtime";
import { Form, FormGroup } from "@biugle/react-form";
import { Slider } from "@biugle/react-components";

export function SliderFields() {
  const { $t } = useBiuI18n();
  return (
    <FormGroup
      title={$t("滑块数值")}
      description={$t("Slider 通过 Form.Item 受控写入单值和范围值；表单提交时得到可直接传给后端的数字。")}
      columns={3}
    >
      <Form.Item name="volume" label={$t("音量")} tooltip={$t("控制播放器音量百分比。")}>
        {({ field }) => (
          <div className="biu-form-value-demo">
            <Slider
              value={Number(field.value ?? 0)}
              onChange={(next) => field.onChange(typeof next === "number" ? next : next[0])}
              tooltip="always"
              aria-label={$t("表单音量")}
            />
            <small>
              {$t("实际值：")}
              {String(field.value ?? 0)}%
            </small>
          </div>
        )}
      </Form.Item>
      <Form.Item name="brightness" label={$t("亮度")} tooltip={$t("以 10 为步进调整屏幕亮度。")}>
        {({ field }) => (
          <div className="biu-form-value-demo">
            <Slider
              value={Number(field.value ?? 0)}
              min={0}
              max={100}
              step={10}
              dots
              onChange={(next) => field.onChange(typeof next === "number" ? next : next[0])}
              aria-label={$t("表单亮度")}
            />
            <small>
              {$t("实际值：")}
              {String(field.value ?? 0)}%
            </small>
          </div>
        )}
      </Form.Item>
      <Form.Item name="temperatureRange" label={$t("温度范围")} tooltip={$t("选择允许的天气温度区间。")}>
        {({ field }) => (
          <div className="biu-form-value-demo">
            <Slider
              range
              min={-20}
              max={45}
              value={(field.value ?? [12, 28]) as [number, number]}
              onChange={(next) => field.onChange(next)}
              tooltip="always"
              aria-label={$t("表单温度范围")}
            />
            <small>
              {$t("实际值：")}
              {JSON.stringify(field.value ?? [12, 28])}
            </small>
          </div>
        )}
      </Form.Item>
    </FormGroup>
  );
}
