import { useState } from "react";
import { InputNumber, Stack } from "@biugle/react-components/ui";
import { useBiuI18n } from "@biugle/biu-runtime";
import {
  CapabilityApiTable,
  CapabilityCard,
  LocalizedDemoTree,
  type CapabilityApiRow,
} from "../CapabilityPage/index.js";

function createApiRows(
  component: string,
  specs: [string, string, string, string, string, string][],
): CapabilityApiRow[] {
  return specs.map(([name, type, defaultValue, options, description, demo]) => ({
    component,
    name,
    type,
    defaultValue,
    options,
    description,
    demo,
  }));
}

export const inputNumberApiRows: CapabilityApiRow[] = [
  ...createApiRows("InputNumber", [
    [
      "value",
      "number | string",
      "undefined",
      "受控安全数值",
      "受控数值；绝对值不得超过 Number.MAX_SAFE_INTEGER，小数最多15位；需配合 onChange 回写。",
      "金额输入",
    ],
    [
      "defaultValue",
      "number | string",
      "undefined",
      "安全范围内的初始数值",
      "非受控初始值；超出安全范围或精度时显示错误并阻止提交。",
      "默认值",
    ],
    [
      "min",
      "number",
      "undefined",
      "安全范围内的数值",
      "设置允许的最小值；组件输入值仍遵守 JavaScript 安全范围和精度上限。",
      "范围",
    ],
    [
      "max",
      "number",
      "undefined",
      "安全范围内的数值",
      "设置允许的最大值；组件输入值仍遵守 JavaScript 安全范围和精度上限。",
      "范围",
    ],
    [
      "step",
      "number",
      "1",
      "安全范围内的非零数值，最多15位小数",
      "加减按钮、键盘和滚轮每次变更的步长；不安全步长回退为 1。",
      "步长",
    ],
    [
      "decimal",
      "number",
      "undefined",
      "0 或正整数",
      "限制允许输入的小数位数，最高为15位；未配置时也最多允许15位。还会校验转换为 JavaScript Number 后是否发生舍入；整数位较多时，可安全保留的小数位可能越少。超限时提示改用文本输入框。",
      "精度",
    ],
    ["integer", "boolean", "false", "true | false", "只允许整数输入；与 decimal 同时传入时 integer 优先。", "整数限制"],
    [
      "sign",
      '"any" | "positive" | "negative"',
      '"any"',
      "any | positive | negative",
      "限制数值符号；positive 仅允许正数，negative 仅允许负数，any 同时允许正负数。",
      "正负限制",
    ],
    [
      "thousandSeparator",
      "string | boolean",
      "false",
      "true（逗号）或自定义字符串",
      "为展示值增加千分位分隔符；不改变 onChange 返回的数值或字符串。",
      "千分位展示",
    ],
    [
      "decimalSeparator",
      "string",
      '"."',
      "单字符字符串",
      "自定义小数分隔符；与 thousandSeparator 配合展示本地化数字。",
      "本地化分隔符",
    ],
    ["precision", "number", "undefined", "兼容属性", "decimal 的废弃兼容别名。", "兼容性"],
    ["changeOnWheel", "boolean", "false", "true | false", "聚焦时允许滚轮修改数值。", "滚轮变更"],
    [
      "controls",
      "boolean",
      "true",
      "true | false",
      "控制是否显示前后增减按钮；关闭后仅保留数字输入区域。",
      "纯输入数字",
    ],
    [
      "formatter",
      "(value) => string",
      "undefined",
      "格式化回调",
      "把安全范围内的内部值转换为输入框展示文本。",
      "格式化",
    ],
    [
      "parser",
      "(value) => number | string | undefined",
      "undefined",
      "解析回调",
      "把输入文本转换为提交值；解析结果仍受最大安全数值和15位小数限制。",
      "解析",
    ],
    [
      "stringMode",
      "boolean",
      "false",
      "true | false",
      "以字符串回调数值；仅改变返回类型，不放宽 JavaScript 安全范围或小数精度限制。",
      "字符串回调",
    ],
    ["error", "ReactNode", "undefined", "任意 ReactNode", "显示外部校验错误并切换错误样式。", "错误状态"],
    ["disabled", "boolean", "false", "true | false", "禁用输入框和增减按钮。", "禁用"],
    ["readOnly", "boolean", "false", "true | false", "保留值供查看，但禁止输入和步进。", "只读"],
    ["className", "string", "undefined", "CSS class 字符串", "追加到组件根节点。", "样式覆写"],
    [
      "classNames",
      "ControlClassNames",
      "{}",
      "root | control | input | decrement | increment | error 等",
      "按数字输入框各区域覆写样式。",
      "区域样式",
    ],
    ["locale", "BiuComponentsLocale", "继承 ConfigProvider", "zh-CN | en-US", "覆盖组件语言。", "语言"],
    [
      "localeText",
      "BiuComponentsLocaleTextOverrides",
      "{}",
      "文案 key-value 对象",
      "覆盖组件内置提示文案。",
      "文案覆写",
    ],
    [
      "onChange",
      "(value, event?) => void",
      "undefined",
      "number | string | undefined",
      "仅安全有效的数值会触发；超出范围或精度时保留原有效值并提示改用文本输入框。",
      "表单联动",
    ],
  ]),
];

export function InputNumberShowcaseSection() {
  const { $t } = useBiuI18n();
  const [number, setNumber] = useState<number | string>(3.14);
  const [positiveNumber, setPositiveNumber] = useState<number | string>(12);

  return (
    <CapabilityCard
      id="input-number"
      title="数字输入框 InputNumber"
      description="数值绝对值不超过 Number.MAX_SAFE_INTEGER（9007199254740991），小数最多 15 位，并拒绝转换为 JavaScript Number 后会发生舍入的输入；整数位较多时，可安全保留的小数位可能越少。超限时保留原有效值并提示改用文本输入框，stringMode 也遵守相同限制。"
    >
      <LocalizedDemoTree
        node={
          <Stack direction="column" gap={14}>
            <div className="biu-capability-demo-block">
              <strong>安全范围与精度限制</strong>
              <Stack align="center" gap={10} wrap="wrap">
                <InputNumber
                  value={number}
                  changeOnWheel
                  onChange={(value) => setNumber(value ?? "")}
                  aria-label="默认数字"
                />
                <span>当前值：{number}</span>
                <InputNumber defaultValue="9007199254740991" aria-label="JavaScript 最大安全整数" />
                <InputNumber defaultValue="0.123456789012345" aria-label="最多十五位小数" />
              </Stack>
              <small>更大的数值或需要更高精度时，请用文本输入框保存原始字符串。</small>
            </div>
            <div className="biu-capability-demo-block">
              <strong>整数、正数与小数位限制</strong>
              <Stack align="center" gap={10} wrap="wrap">
                <InputNumber
                  value={positiveNumber}
                  integer
                  sign="positive"
                  onChange={(value) => setPositiveNumber(value ?? "")}
                  aria-label="正整数"
                />
                <InputNumber decimal={2} defaultValue="12.34" aria-label="两位小数" />
                <span>正整数：{positiveNumber}</span>
              </Stack>
            </div>
            <div className="biu-capability-demo-block">
              <strong>千分位与本地化分隔符</strong>
              <Stack align="center" gap={10} wrap="wrap">
                <InputNumber defaultValue="1234567.89" thousandSeparator aria-label="千分位" />
                <InputNumber
                  defaultValue="1234567.89"
                  thousandSeparator="."
                  decimalSeparator=","
                  aria-label="本地化数字"
                />
              </Stack>
            </div>
            <div className="biu-capability-demo-block">
              <strong>失焦规范化</strong>
              <Stack align="center" gap={10} wrap="wrap">
                <InputNumber defaultValue="00.001" aria-label="规范化零点" />
                <InputNumber defaultValue="0.000" aria-label="规范化零" />
                <InputNumber defaultValue="-01" aria-label="规范化负数" />
                <span>点击其他区域后分别变为 0.001、0、-1</span>
              </Stack>
            </div>
          </Stack>
        }
        $t={$t}
      />
      <div className="biu-capability-section-api">
        <h3>{$t("属性与方法")}</h3>
        <CapabilityApiTable rows={inputNumberApiRows} />
      </div>
    </CapabilityCard>
  );
}
