import { useBiuI18n } from "@biugle/biu-runtime";
import { useState } from "react";
import { FormActions, FormErrorSummary, ProForm, useForm } from "@biugle/react-form";
import { Alert, Button, ConfigProvider, Tag, Stack } from "@biugle/react-components";
import { useBiuContext } from "@biugle/biu-runtime";
import {
  CapabilityApiBlock,
  CapabilityApiRegion,
  CapabilityApiTable,
  CapabilityCard,
  CapabilityGrid,
  CapabilityPage,
} from "../CapabilityPage/index.js";
import type { FormValues } from "./types.js";
import { createDefaultFormValues } from "./mock.js";
import {
  formCoreApiRows,
  formItemApiRows,
  formGroupApiRows,
  formListApiRows,
  formActionApiRows,
  formLayoutApiRows,
} from "./api-reference/index.js";
import { BasicFields } from "./sections/basic-fields.js";
import { InputRulesFields } from "./sections/input-rules-fields.js";
import { CardNumberFields } from "./sections/card-number-fields.js";
import { SliderFields } from "./sections/slider-fields.js";
import { DateFields } from "./sections/date-fields.js";
import { WorkflowFields } from "./sections/workflow-fields.js";
import { ContactsFields } from "./sections/contacts-fields.js";
import "@biugle/react-form/styles.css";
export default function FormShowcase() {
  const { $t } = useBiuI18n();
  const { locale } = useBiuContext();
  const form = useForm<FormValues>({
    defaultValues: createDefaultFormValues(),
    mode: "onBlur",
  });
  const needsApproval = form.watch("needsApproval");
  const [submitted, setSubmitted] = useState<FormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [contactsSort, setContactsSort] = useState("未调整");
  return (
    <ConfigProvider locale={locale}>
      <CapabilityPage
        title={$t("Form 能力展示")}
        description={$t("Form 基于 react-hook-form，Item 只管理字段状态和校验，通过 render props 渲染业务控件。")}
      >
        <CapabilityGrid>
          <CapabilityCard title="Form / Item / Field">
            <ProForm
              form={form}
              locale={locale}
              localeText={{ required: $t("请填写该字段") }}
              readOnly={readOnly}
              loading={submitting}
              actions={null}
              onSubmit={async (values) => {
                setSubmitting(true);
                await new Promise((resolve) => setTimeout(resolve, 450));
                setSubmitted(values);
                setSubmitting(false);
              }}
            >
              <BasicFields />
              <InputRulesFields />
              <CardNumberFields />
              <SliderFields />
              <DateFields locale={locale} />
              <WorkflowFields needsApproval={needsApproval} />
              <ContactsFields contactsSort={contactsSort} setContactsSort={setContactsSort} />
              <FormErrorSummary
                form={form}
                locale={locale}
                localeText={{ errorSummaryTitle: $t("请先修正以下字段") }}
              />
              <Alert status="info" title={$t("验证与状态")}>
                {$t("姓名支持异步校验；开启审批后会动态增加必填字段，Form 不克隆业务控件。")}
              </Alert>
              <FormActions>
                <Button type="submit" loading={submitting} disabled={readOnly}>
                  {$t("提交表单")}
                </Button>
                <Button type="button" variant="secondary" disabled={submitting} onClick={() => form.reset()}>
                  {$t("重置")}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setReadOnly((value) => !value)}>
                  {readOnly ? $t("恢复编辑") : $t("只读预览")}
                </Button>
              </FormActions>
            </ProForm>
            <CapabilityApiRegion>
              <CapabilityApiBlock title={$t("Form / ProForm 本区域 API")}>
                <CapabilityApiTable rows={formCoreApiRows} />
              </CapabilityApiBlock>
              <CapabilityApiBlock title={$t("Form.Item / Field 本区域 API")}>
                <CapabilityApiTable rows={formItemApiRows} />
              </CapabilityApiBlock>
              <CapabilityApiBlock title={$t("FormGroup / Form.Group 本区域 API")}>
                <CapabilityApiTable rows={formGroupApiRows} />
              </CapabilityApiBlock>
              <CapabilityApiBlock title={$t("Form.List 本区域 API")}>
                <CapabilityApiTable rows={formListApiRows} />
              </CapabilityApiBlock>
              <CapabilityApiBlock title={$t("Form.Grid / Form.Section 本区域 API")}>
                <CapabilityApiTable rows={formLayoutApiRows} />
              </CapabilityApiBlock>
            </CapabilityApiRegion>
          </CapabilityCard>
          <CapabilityCard title={$t("提交结果 / 状态反馈")}>
            {submitted ? (
              <>
                <Tag color="success">{$t("提交成功")}</Tag>
                <pre className="biu-capability-code">{JSON.stringify(submitted, null, 2)}</pre>
              </>
            ) : (
              <Tag color="default">{$t("尚未提交")}</Tag>
            )}
            <Stack align={"center"} gap={8} wrap="wrap" style={{ marginTop: 12 }}>
              <Tag color={form.formState.isDirty ? "warning" : "default"}>
                {form.formState.isDirty ? $t("有未保存修改") : $t("初始状态")}
              </Tag>
              <Tag color={needsApproval ? "info" : "default"}>
                {needsApproval ? $t("审批字段已启用") : $t("无审批")}
              </Tag>
            </Stack>
            <p>{$t("Form.Item 不克隆输入组件，错误状态通过 render props 显式传递。")}</p>
            <CapabilityApiRegion>
              <CapabilityApiBlock title={$t("提交状态 API")}>
                <CapabilityApiTable rows={formActionApiRows} />
              </CapabilityApiBlock>
            </CapabilityApiRegion>
          </CapabilityCard>
        </CapabilityGrid>
      </CapabilityPage>
    </ConfigProvider>
  );
}
