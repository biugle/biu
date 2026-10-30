import { useBiuI18n } from "@biugle/biu-runtime";
import { Form, FormGroup } from "@biugle/react-form";
import { Select, TextField, Switch } from "@biugle/react-components";

export function ContactsFields({
  contactsSort,
  setContactsSort,
}: {
  contactsSort: string;
  setContactsSort: (value: string) => void;
}) {
  const { $t } = useBiuI18n();
  return (
    <FormGroup title={$t("联系人")} description={$t("Form.List columns 以动态表格方式组织一行多个字段。")} columns={1}>
      <Form.List
        name="contacts"
        addValue={{ value: "", role: "研发", enabled: true }}
        addText={$t("添加联系人")}
        minRows={1}
        maxRows={5}
        sortable
        showSort
        onSortChange={(from, to) => setContactsSort(`${from + 1} → ${to + 1}`)}
        columns={[
          {
            key: "value",
            label: $t("联系人"),
            tooltip: $t("联系人的显示名称或工作账号。"),
            name: "value",
            width: "34%",
            render: ({ fieldName }) => (
              <Form.Item name={fieldName as never} noStyle>
                {({ field: itemField }) => <TextField {...itemField} placeholder={$t("请输入联系人")} />}
              </Form.Item>
            ),
          },
          {
            key: "role",
            label: $t("职责"),
            tooltip: $t("选择该联系人的职责类型。"),
            name: "role",
            width: "30%",
            render: ({ fieldName }) => (
              <Form.Item name={fieldName as never} noStyle>
                {({ field: itemField }) => (
                  <Select
                    {...itemField}
                    options={[
                      { label: $t("产品负责人"), value: "产品负责人" },
                      { label: $t("研发"), value: "研发" },
                      { label: $t("测试"), value: "测试" },
                    ]}
                    placeholder={$t("选择职责")}
                  />
                )}
              </Form.Item>
            ),
          },
          {
            key: "enabled",
            label: $t("启用"),
            name: "enabled",
            width: "18%",
            render: ({ fieldName }) => (
              <Form.Item name={fieldName as never} noStyle>
                {({ field: itemField }) => (
                  <Switch
                    checked={Boolean(itemField.value)}
                    onChange={itemField.onChange}
                    aria-label={$t("启用联系人")}
                  />
                )}
              </Form.Item>
            ),
          },
        ]}
      />
      <p className="biu-form-list__sort-status">
        {$t("最近排序：")}
        {$t(contactsSort)}
      </p>
    </FormGroup>
  );
}
