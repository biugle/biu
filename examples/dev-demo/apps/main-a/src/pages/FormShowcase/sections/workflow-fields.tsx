import { useBiuI18n } from "@biugle/biu-runtime";
import { Form, FormGroup } from "@biugle/react-form";
import { Checkbox, Textarea, TextField, Switch, RadioGroup } from "@biugle/react-components";

export function WorkflowFields({ needsApproval }: { needsApproval: boolean }) {
  const { $t } = useBiuI18n();
  return (
    <FormGroup title={$t("流程配置")} description={$t("根据表单状态动态展示审批字段，并保持字段联动。")}>
      <Form.Item name="note" label={$t("备注")} help={$t("可选字段")} className="biu-form-group__item--full">
        {({ field }) => <Textarea {...field} placeholder={$t("补充说明")} />}
      </Form.Item>
      <Form.Item name="needsApproval" label={$t("流程")}>
        {({ field }) => (
          <Checkbox
            checked={Boolean(field.value)}
            onChange={(event) => field.onChange(event.target.checked)}
            label={$t("需要审批")}
          />
        )}
      </Form.Item>
      <Form.Item name="channel" label={$t("通知渠道")}>
        {({ field }) => (
          <RadioGroup
            {...field}
            options={[
              { label: $t("浏览器"), value: "browser" },
              { label: $t("邮件"), value: "email" },
            ]}
          />
        )}
      </Form.Item>
      <Form.Item name="notify" label={$t("通知")}>
        {({ field }) => (
          <Switch
            checked={Boolean(field.value)}
            onChange={field.onChange}
            checkedChildren={$t("开启")}
            unCheckedChildren={$t("关闭")}
          />
        )}
      </Form.Item>
      {needsApproval ? (
        <Form.Item name="approver" label={$t("审批人")} rules={{ required: $t("请选择审批人") }}>
          {({ field }) => <TextField {...field} placeholder={$t("请输入审批人")} />}
        </Form.Item>
      ) : null}
    </FormGroup>
  );
}
