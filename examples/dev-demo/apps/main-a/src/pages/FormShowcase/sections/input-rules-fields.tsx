import { useBiuI18n } from "@biugle/biu-runtime";
import { Form, FormGroup } from "@biugle/react-form";
import { InputNumber, TextField } from "@biugle/react-components";

export function InputRulesFields() {
  const { $t } = useBiuI18n();
  return (
    <FormGroup
      title={$t("输入规则与实际值")}
      description={$t(
        "TextField 的输入过滤和 InputNumber 的展示格式都由控件处理；下方同时显示用户看到的内容与 Form 当前实际值。",
      )}
      columns={3}
    >
      <Form.Item
        name="formattedAmount"
        label={$t("格式化金额")}
        tooltip={$t("展示值带千分位，实际值保持可提交的数字。")}
      >
        {({ field }) => (
          <div className="biu-form-value-demo">
            <InputNumber
              value={(field.value ?? "") as number | string}
              thousandSeparator
              aria-label={$t("格式化金额")}
              onChange={(value) => field.onChange(value ?? "")}
              onBlur={field.onBlur}
            />
            <small>
              {$t("展示值：")}
              {field.value === "" ? $t("（空）") : Number(field.value).toLocaleString("en-US")}
              {$t("；实际值：")}
              {String(field.value ?? $t("（空）"))}
            </small>
          </div>
        )}
      </Form.Item>
      <Form.Item
        name="numericText"
        label={$t("纯数字文本")}
        rules={{ pattern: { value: /^\d*$/, message: $t("只允许输入数字") } }}
      >
        {({ field }) => (
          <div className="biu-form-value-demo">
            <TextField
              value={String(field.value ?? "")}
              inputRule="number"
              aria-label={$t("表单纯数字文本")}
              placeholder={$t("仅允许 0-9")}
              onChange={(event) => field.onChange(event.target.value)}
              onBlur={field.onBlur}
            />
            <small>
              {$t("展示值：")}
              {String(field.value || $t("（空）"))}
              {$t("；实际值：")}
              {String(field.value || $t("（空）"))}
            </small>
          </div>
        )}
      </Form.Item>
      <Form.Item
        name="letterText"
        label={$t("纯字母文本")}
        rules={{ pattern: { value: /^[A-Za-z]*$/, message: $t("只允许输入英文字母") } }}
      >
        {({ field }) => (
          <div className="biu-form-value-demo">
            <TextField
              value={String(field.value ?? "")}
              inputRule="letter"
              aria-label={$t("表单纯字母文本")}
              placeholder={$t("仅允许 A-Z")}
              onChange={(event) => field.onChange(event.target.value)}
              onBlur={field.onBlur}
            />
            <small>
              {$t("展示值：")}
              {String(field.value || $t("（空）"))}
              {$t("；实际值：")}
              {String(field.value || $t("（空）"))}
            </small>
          </div>
        )}
      </Form.Item>
      <Form.Item
        name="alphanumericText"
        label={$t("字母数字文本")}
        rules={{ pattern: { value: /^[A-Za-z0-9]*$/, message: $t("只允许字母和数字") } }}
      >
        {({ field }) => (
          <div className="biu-form-value-demo">
            <TextField
              value={String(field.value ?? "")}
              inputRule="alphanumeric"
              aria-label={$t("表单字母数字文本")}
              placeholder={$t("例如 Biu2026")}
              onChange={(event) => field.onChange(event.target.value)}
              onBlur={field.onBlur}
            />
            <small>
              {$t("展示值：")}
              {String(field.value || $t("（空）"))}
              {$t("；实际值：")}
              {String(field.value || $t("（空）"))}
            </small>
          </div>
        )}
      </Form.Item>
      <Form.Item
        name="customCode"
        label={$t("自定义正则")}
        rules={{ pattern: { value: /^[A-Z0-9-]*$/, message: $t("只允许大写字母、数字和短横线") } }}
      >
        {({ field }) => (
          <div className="biu-form-value-demo">
            <TextField
              value={String(field.value ?? "")}
              inputPattern={/^[A-Z0-9-]*$/}
              aria-label={$t("表单自定义正则")}
              placeholder={$t("例如 BIU-2026")}
              onChange={(event) => field.onChange(event.target.value)}
              onBlur={field.onBlur}
            />
            <small>
              {$t("展示值：")}
              {String(field.value || $t("（空）"))}
              {$t("；实际值：")}
              {String(field.value || $t("（空）"))}
            </small>
          </div>
        )}
      </Form.Item>
    </FormGroup>
  );
}
