import { useState } from "react";
import {
  Checkbox,
  PageFilter,
  PageFilterItem,
  ProTextField,
  Stack,
  Typography,
  biuMessage,
  splitString,
} from "@biugle/react-components";
import { useBiuI18n } from "@biugle/biu-runtime";
import type { CapabilityApiRow } from "../CapabilityPage/index.js";

type Entry = [string, string, string, string, string];
const entries: Entry[] = [
  ["value", "string", "undefined", "任意文本", "受控原始文本；多个值使用批量编辑查看和修改。"],
  ["defaultValue", "string", '""', "任意文本", "非受控初始文本。"],
  [
    "onChange",
    "(value: string, items: string[]) => void",
    "undefined",
    "value, items",
    "普通输入即时回传原文及解析列表；失焦时按已开启分隔符拆分并格式化；批量应用回传换行规范文本。",
  ],
  [
    "onApply",
    "(value: string, items: string[]) => void | boolean | Promise<void | boolean>",
    "undefined",
    "value, items",
    "批量确认可异步校验；返回 false 保留草稿，异常显示可重试提示。",
  ],
  [
    "expandable",
    "boolean",
    "true",
    "true | false",
    "显示24px批量编辑入口，可在浮层中粘贴多行文本；关闭入口后，失焦分隔仍生效。",
  ],
  ["separatorIncludesSpace", "boolean", "false", "true | false", "开启后空白字符也作为分隔符，默认保留词组内部空格。"],
  ["separatorIncludesComma", "boolean", "false", "true | false", "开启后同时接受英文逗号和中文逗号。"],
  [
    "locale",
    "BiuComponentsLocale",
    "ConfigProvider / zh-CN",
    "zh-CN | en-US",
    "覆盖批量编辑按钮、提示与统计文案语言。",
  ],
  ["localeText", "BiuComponentsLocaleTextOverrides", "undefined", "中文原文 key", "按中文 key 覆写批量编辑文案。"],
  ["onCancel", "() => void", "undefined", "无参数", "取消、点击外部或 Escape 关闭草稿编辑时回调。"],
  ["onOpenChange", "(open: boolean) => void", "undefined", "open", "批量编辑浮层打开或关闭后通知调用方。"],
  ["popoverWidth", "number | string", "420", "像素或 CSS 宽度", "设置编辑浮层宽度，自动约束到视口可用空间。"],
  [
    "textareaProps",
    'Omit<TextareaProps, "value" | "defaultValue" | "onChange" | "disabled" | "readOnly">',
    "undefined",
    "Textarea 属性",
    "覆写草稿文本域的行数、长度限制、占位和样式。",
  ],
  ["expandText", "React.ReactNode", "批量输入", "任意 ReactNode", "覆写图标入口的 Tooltip 文案。"],
  ["applyText", "React.ReactNode", "应用", "任意 ReactNode", "覆写确认按钮文案。"],
  ["cancelText", "React.ReactNode", "取消", "任意 ReactNode", "覆写取消按钮文案。"],
  ["clearText", "React.ReactNode", "清除", "任意 ReactNode", "覆写清空动作文案。"],
  [
    "classNames",
    "ProTextFieldClassNames",
    "undefined",
    "ControlClassNames & { editor?: string; description?: string; actions?: string }",
    "分别覆写输入控件与浮层区域样式。",
  ],
  ["size", '"small" | "medium" | "large"', "small", "small | medium | large", "默认与筛选控件保持相同的小尺寸。"],
  ["allowClear", "boolean", "true", "true | false", "允许清空已提交的文本，草稿内清空需确认才提交。"],
  [
    "inputRule",
    '"number" | "letter" | "alphanumeric"',
    "undefined",
    "number | letter | alphanumeric",
    "单行和批量按每项应用字符过滤，保留已开启的分隔符。",
  ],
  [
    "inputPattern",
    "string | RegExp",
    "undefined",
    "增量正则",
    "单行和批量按每项应用增量正则过滤，保留已开启的分隔符。",
  ],
  ["error", "React.ReactNode", "undefined", "任意 ReactNode", "设置主输入错误状态；批量提交失败保留独立重试提示。"],
  ["loading", "boolean", "false", "true | false", "显示加载并禁止输入、清空和打开批量编辑。"],
  ["onClear", "() => void", "undefined", "无参数", "清空已提交值时回调；草稿内清空需应用后才提交。"],
  ["showCount", "boolean", "false", "true | false", "显示主输入字符计数；编辑浮层另外显示解析后的项数。"],
  ["addonBefore", "React.ReactNode", "undefined", "任意 ReactNode", "在主输入左侧显示前置内容。"],
  ["addonAfter", "React.ReactNode", "undefined", "任意 ReactNode", "在主输入右侧显示自定义内容，并与批量入口组合。"],
  [
    "inputProps",
    "React.InputHTMLAttributes<HTMLInputElement>",
    "undefined",
    "原生 input 属性",
    "透传主输入属性；顶层值缺省时使用其 value/defaultValue，批量草稿仍由 ProTextField 管理。",
  ],
  ["className", "string", "undefined", "CSS class", "追加到 ProTextField 根节点；PageFilter.Item 自动追加 w-full。"],
  ["disabled", "boolean", "false", "true | false", "禁止输入、清空及批量编辑，并关闭已打开的编辑浮层。"],
  ["readOnly", "boolean", "false", "true | false", "保留文本可读，禁止输入、清空及批量编辑。"],
  ["placeholder", "string", "undefined", "任意文本", "主输入占位文案；草稿占位由 textareaProps.placeholder 覆写。"],
  ["maxLength", "number", "undefined", "非负整数", "限制主输入长度，草稿默认继承，可由 textareaProps.maxLength 覆写。"],
  [
    "onPaste",
    "(event: React.ClipboardEvent<HTMLInputElement>) => void",
    "undefined",
    "event",
    "主输入粘贴前回调；preventDefault 可阻止多行粘贴自动打开草稿。",
  ],
  [
    "onKeyDown",
    "(event: React.KeyboardEvent<HTMLInputElement>) => void",
    "undefined",
    "event",
    "主输入按键回调，Enter 可打开多行汇总；草稿内 Ctrl/Command+Enter 应用编辑。",
  ],
  [
    "onClick",
    "(event: React.MouseEvent<HTMLInputElement>) => void",
    "undefined",
    "event",
    "主输入点击回调；未 preventDefault 时点击多行汇总打开原文编辑。",
  ],
  [
    "onBlur",
    "(event: React.FocusEvent<HTMLInputElement>) => void",
    "undefined",
    "event",
    "主输入失焦先通知调用方，再按已开启分隔符拆分并格式化；文本变化时通过 onChange(value, items) 回传。",
  ],
  [
    "onInput",
    "(event: React.FormEvent<HTMLInputElement>) => void",
    "undefined",
    "event",
    "观察主输入原生 input 事件；值同步使用 onChange(value, items)。",
  ],
  ["ref", "React.Ref<HTMLInputElement>", "undefined", "HTMLInputElement", "转发到主输入，支持聚焦和读取选择范围。"],
];

export const proTextFieldApiRows: CapabilityApiRow[] = entries.map(
  ([name, type, defaultValue, options, description]) => ({
    component: "ProTextField",
    name,
    type,
    defaultValue,
    options,
    description,
    demo: "批量关键词筛选",
  }),
);

export const splitStringApiRows: CapabilityApiRow[] = [
  {
    component: "splitString",
    name: "splitString",
    type: "(str: string, separatorIncludesSpace?: boolean, separatorIncludesComma?: boolean) => string[]",
    defaultValue: "false, false",
    options: "str, separatorIncludesSpace = false, separatorIncludesComma = false",
    description: "按换行和回车切分，去掉首尾空白与空项；可分别开启空白分隔和中英文逗号分隔，保留顺序及重复值。",
    demo: "三种分隔规则",
  },
  {
    component: "splitString",
    name: "str",
    type: "string",
    defaultValue: "必传",
    options: "输入文本",
    description: "仅解析输入，不修改原文；空字符串、纯空白和运行时非字符串值返回空列表。",
    demo: "三种分隔规则",
  },
  {
    component: "splitString",
    name: "separatorIncludesSpace",
    type: "boolean",
    defaultValue: "false",
    options: "true | false",
    description: "开启后所有空白字符参与分隔，默认保留词组内部空格。",
    demo: "三种分隔规则",
  },
  {
    component: "splitString",
    name: "separatorIncludesComma",
    type: "boolean",
    defaultValue: "false",
    options: "true | false",
    description: "独立开启中英文逗号分隔，可与空白分隔组合。",
    demo: "三种分隔规则",
  },
];

export function ProTextFieldDemo() {
  const { $t, locale } = useBiuI18n();
  const [value, setValue] = useState("华东，华南\n唐宁");
  const [includeSpace, setIncludeSpace] = useState(false);
  const parsed = splitString(value, includeSpace, true);
  return (
    <Stack direction="column" gap={14}>
      <Typography>{$t("主筛选区与更多筛选共用同一份值，批量编辑确认后生效，取消保留原值。")}</Typography>
      <PageFilter
        onReset={() => setValue("")}
        onSearch={() => biuMessage.info(`${$t("解析结果")}：${JSON.stringify(parsed)}`)}
        maxRows={1}
      >
        <PageFilterItem label={$t("批量关键词")} tooltip={$t("支持输入多个区域或负责人，换行和中英文逗号均可分隔。")}>
          <ProTextField
            locale={locale}
            size="small"
            value={value}
            onChange={(next) => setValue(next)}
            separatorIncludesSpace={includeSpace}
            separatorIncludesComma
            allowClear
            placeholder={$t("输入关键词")}
          />
        </PageFilterItem>
      </PageFilter>
      <Checkbox
        label={$t("同时使用空白字符分隔")}
        checked={includeSpace}
        onChange={(event) => setIncludeSpace(event.target.checked)}
      />
      <Typography>
        {$t("解析结果")}：{JSON.stringify(parsed)}
      </Typography>
      <Stack gap={12} wrap="wrap">
        <ProTextField locale={locale} defaultValue={"Hello world\nGood luck!"} aria-label={$t("默认保留词组空格")} />
        <ProTextField
          locale={locale}
          defaultValue="Hello world，Good luck!"
          separatorIncludesSpace
          separatorIncludesComma
          aria-label={$t("空白与逗号分隔")}
        />
        <ProTextField locale={locale} value={"BIU-001\nBIU-002"} readOnly aria-label={$t("只读批量文本")} />
        <ProTextField locale={locale} defaultValue="BIU-003" disabled aria-label={$t("禁用批量文本")} />
      </Stack>
    </Stack>
  );
}
