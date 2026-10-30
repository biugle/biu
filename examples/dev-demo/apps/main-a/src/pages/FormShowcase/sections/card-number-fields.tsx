import { useBiuI18n } from "@biugle/biu-runtime";
import { Form, FormGroup } from "@biugle/react-form";
import { Select, TextField, Stack } from "@biugle/react-components";
const cardPrefixes = [
  { label: "6222", value: "6222" },
  { label: "6217", value: "6217" },
  { label: "6230", value: "6230" },
];
function parseCardNumber(value: string) {
  const [prefix = "", serial = "", letters = ""] = value.split("-");
  return { prefix, serial, letters };
}
function joinCardNumber(prefix: string, serial: string, letters: string) {
  return [prefix, serial, letters].join("-");
}
export function CardNumberFields() {
  const { $t } = useBiuI18n();
  return (
    <FormGroup
      title={$t("自定义渲染字段")}
      description={$t("三个控件共同维护一个 cardNumber 字段，提交时作为一个完整值传给后端。")}
    >
      <Form.Item
        name="cardNumber"
        label={$t("卡号")}
        tooltip={$t("前缀来自枚举，中间为三位数字，末段只允许英文字符。")}
        rules={{
          required: $t("请输入完整卡号"),
          pattern: { value: /^\d{4}-\d{3}-[A-Za-z]{4}$/, message: $t("卡号格式应为 4 位枚举-3 位数字-4 位英文") },
        }}
      >
        {({ field, fieldState }) => {
          const { prefix, serial, letters } = parseCardNumber(String(field.value ?? ""));
          const prefixInvalid = fieldState.invalid && !cardPrefixes.some((option) => option.value === prefix);
          const serialInvalid = fieldState.invalid && !/^\d{3}$/.test(serial);
          const lettersInvalid = fieldState.invalid && !/^[A-Za-z]{4}$/.test(letters);
          return (
            <Stack gap={8} align="center" justify="space-between" className="biu-form-card-number">
              <Select
                className={prefixInvalid ? "biu-form-card-number__control--invalid" : undefined}
                value={prefix}
                options={cardPrefixes}
                placeholder={$t("选择前缀")}
                aria-label={$t("卡号前缀")}
                onChange={(value) => field.onChange(joinCardNumber(String(value ?? ""), serial, letters))}
                onBlur={field.onBlur}
              />
              <TextField
                className={serialInvalid ? "biu-form-card-number__control--invalid" : undefined}
                value={serial}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                aria-label={$t("卡号数字段")}
                placeholder={$t("三位数字")}
                onChange={(event) => {
                  event.stopPropagation();
                  const next = event.target.value.replace(/[^0-9]/g, "").slice(0, 4);
                  field.onChange(joinCardNumber(prefix, next, letters));
                }}
                onBlur={field.onBlur}
              />
              <TextField
                className={lettersInvalid ? "biu-form-card-number__control--invalid" : undefined}
                value={letters}
                maxLength={4}
                aria-label={$t("卡号英文段")}
                placeholder={$t("英文段")}
                onChange={(event) => {
                  event.stopPropagation();
                  const next = event.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 4);
                  field.onChange(joinCardNumber(prefix, serial, next));
                }}
                onBlur={field.onBlur}
              />
            </Stack>
          );
        }}
      </Form.Item>
    </FormGroup>
  );
}
