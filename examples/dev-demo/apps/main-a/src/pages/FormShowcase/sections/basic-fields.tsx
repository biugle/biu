import { useBiuI18n } from "@biugle/biu-runtime";
import { Form, FormGroup } from "@biugle/react-form";
import { InputNumber, Select, TextField } from "@biugle/react-components";

export function BasicFields() {
  const { $t } = useBiuI18n();
  return (
    <FormGroup title={$t("基本信息")} description={$t("字段可嵌套、可禁用并保持显式控件绑定。")}>
      <Form.Item
        name="name"
        label={$t("姓名")}
        tooltip={$t("用于展示字段标签后的帮助说明。")}
        rules={{
          required: $t("请输入姓名"),
          validate: async (value) => {
            await new Promise((resolve) => setTimeout(resolve, 120));
            return String(value).toLowerCase() !== "admin" || $t("该名称已被占用");
          },
        }}
      >
        {({ field }) => <TextField {...field} placeholder={$t("请输入姓名")} />}
      </Form.Item>
      <Form.Item
        name="email"
        label={$t("邮箱")}
        tooltip={$t("请输入可接收通知的邮箱地址。")}
        rules={{ required: $t("请输入邮箱"), pattern: { value: /^\S+@\S+$/, message: $t("邮箱格式不正确") } }}
      >
        {({ field }) => <TextField {...field} type="email" placeholder="name@example.com" />}
      </Form.Item>

      <Form.Item name="department" label={$t("部门")}>
        {({ field }) => (
          <Select
            {...field}
            hasAllOption
            options={[
              { label: $t("平台工程"), value: "platform" },
              { label: $t("业务研发"), value: "product" },
            ]}
          />
        )}
      </Form.Item>
      <Form.Item
        name="amount"
        label={$t("预算金额")}
        rules={{
          required: $t("请输入预算金额"),
          validate: (value) =>
            (value !== "" && value !== undefined && value !== null && Number.isFinite(Number(value))) ||
            $t("请输入有效数字"),
        }}
      >
        {({ field }) => (
          <InputNumber
            value={(field.value ?? "") as number | string}
            min={0}
            changeOnWheel
            aria-label={$t("预算金额")}
            onChange={(value, event) => {
              event?.stopPropagation();
              field.onChange(value ?? "");
            }}
            onBlur={field.onBlur}
          />
        )}
      </Form.Item>
    </FormGroup>
  );
}
