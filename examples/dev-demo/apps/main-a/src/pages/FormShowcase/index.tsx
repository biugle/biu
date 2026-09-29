import { useState } from "react";
import { Form, FormActions, FormErrorSummary, FormGroup, ProForm, useForm } from "@biugle/react-form";
import {
  Alert,
  Button,
  Checkbox,
  DatePicker,
  InputNumber,
  RangeDatePicker,
  RangeTimePicker,
  Select,
  Tag,
  Textarea,
  TextField,
  TimePicker,
  Switch,
  RadioGroup,
} from "@biugle/react-components";
import { useBiuContext } from "@biugle/biu-runtime";
import {
  CapabilityApiTable,
  CapabilityCard,
  CapabilityGrid,
  CapabilityPage,
  type CapabilityApiRow,
} from "../CapabilityPage/index.js";
import "@biugle/react-form/styles.css";

interface FormValues {
  name: string;
  email: string;
  department: string;
  amount: number;
  note: string;
  needsApproval: boolean;
  approver: string;
  date: unknown;
  rangeDate: unknown;
  time: unknown;
  rangeTime: unknown;
  notify: boolean;
  channel: string;
  contacts: Array<{ value: string; role: string; enabled: boolean }>;
}

const formApiRows: CapabilityApiRow[] = [
  {
    component: "Form",
    name: "form",
    type: "UseFormReturn<T>",
    defaultValue: "必填",
    description: "接收 react-hook-form 创建的表单实例；字段注册、校验、reset、watch 和提交状态均从此实例读取。",
    demo: "ProForm form={form}",
  },
  {
    component: "Form",
    name: "onSubmit",
    type: "(values: T, event?: React.BaseSyntheticEvent) => void | Promise<void>",
    defaultValue: "undefined",
    description: "校验通过后的提交回调；Form 会先调用 form.handleSubmit，再把完整值传给该回调，支持异步处理。",
    demo: "提交表单",
  },
  {
    component: "Form",
    name: "onInvalid",
    type: "(errors, event?) => void",
    defaultValue: "undefined",
    description: "校验失败时接收 react-hook-form 的 errors 对象；适合记录失败状态或聚焦错误汇总。",
    demo: "FormErrorSummary",
  },
  {
    component: "Form",
    name: "disabled",
    type: "boolean",
    defaultValue: "false",
    description: "禁用整个表单 fieldset，并把字段上下文的 disabled 设为 true；提交中的 loading 也会禁用字段。",
    demo: "只读/加载状态",
  },
  {
    component: "Form",
    name: "readOnly",
    type: "boolean",
    defaultValue: "false",
    description: "把只读语义传给 Form.Item 的 render props；具体输入控件是否禁止编辑由控件消费 readOnly。",
    demo: "只读预览",
  },
  {
    component: "Form",
    name: "layout",
    type: '"vertical" | "horizontal"',
    defaultValue: '"vertical"',
    description: "设置表单项的纵向或横向布局类名；不改变字段值和校验行为。",
    demo: "默认纵向布局",
  },
  {
    component: "Form",
    name: "columns",
    type: "number",
    defaultValue: "undefined",
    description: "通过 --biu-form-columns 设置表单根栅格列数；未传时保留 CSS 默认布局。",
    demo: "FormGroup columns",
  },
  {
    component: "Form",
    name: "labelWidth",
    type: "number | string",
    defaultValue: "undefined",
    description: "设置横向布局标签列宽；数字会转换为 px，字符串可传 CSS 长度。",
    demo: "Form.Item label",
  },
  {
    component: "Form",
    name: "requiredMark",
    type: "boolean",
    defaultValue: "true",
    description: "控制带 required/rules.required 的 Form.Item 是否显示必填符号。",
    demo: "必填字段 *",
  },
  {
    component: "Form",
    name: "loading",
    type: "boolean",
    defaultValue: "false",
    description: "标记异步提交中；设置 aria-busy 并禁用 fieldset，避免重复编辑和提交。",
    demo: "提交按钮 loading",
  },
  {
    component: "Form",
    name: "classNames",
    type: "FormClassNames",
    defaultValue: "{}",
    description: "为 root、item、label、control、help、description、message 等区域追加稳定类名。",
    demo: "根节点样式契约",
  },
  {
    component: "Form",
    name: "locale",
    type: '"zh-CN" | "en-US"',
    defaultValue: '"zh-CN"',
    description: "选择表单内置文案语言；默认中文，缺失资源按包内回退规则处理。",
    demo: "中文必填提示",
  },
  {
    component: "Form",
    name: "localeText",
    type: "BiuFormLocaleTextOverrides",
    defaultValue: "{}",
    description: "逐项覆写 required、reset、submit、errorSummaryTitle 等内置文案，不改变 locale 资源。",
    demo: "required: 请填写该字段",
  },
  {
    component: "Form",
    name: "children",
    type: "React.ReactNode",
    defaultValue: "必填",
    description: "表单内容；通常由 Form.Group、Form.Item、Form.List、FormErrorSummary 和 FormActions 组成。",
    demo: "完整表单区域",
  },
  {
    component: "Form",
    name: "className",
    type: "string",
    defaultValue: "undefined",
    description: "追加到根 form 的 biu-form 前缀类名之后，用于页面级布局覆盖。",
    demo: "公共 className 契约",
  },
  {
    component: "Form",
    name: "style",
    type: "React.CSSProperties",
    defaultValue: "undefined",
    description: "透传到根 form；columns 和 labelWidth 变量会与该 style 合并。",
    demo: "CSS variables",
  },
  {
    component: "Form",
    name: "noValidate",
    type: "boolean",
    defaultValue: "true",
    description: "默认关闭浏览器原生校验，让 react-hook-form rules 成为唯一校验来源。",
    demo: "Form rules",
  },
  {
    component: "ProForm",
    name: "toolbar",
    type: "React.ReactNode",
    defaultValue: "undefined",
    description: "在表单字段前渲染工具栏区域，适合放置筛选说明、状态或批量动作。",
    demo: "ProForm toolbar",
  },
  {
    component: "ProForm",
    name: "actions",
    type: "React.ReactNode",
    defaultValue: "undefined",
    description: "覆盖默认 Form.Actions；传入 null 可完全隐藏默认重置/提交操作区。",
    demo: "本页自定义 actions",
  },
  {
    component: "ProForm",
    name: "showReset",
    type: "boolean",
    defaultValue: "true",
    description: "默认操作区是否显示重置按钮；重置会调用 form.reset()。",
    demo: "重置",
  },
  {
    component: "ProForm",
    name: "resetText",
    type: "React.ReactNode",
    defaultValue: "重置",
    description: "覆盖默认重置按钮的显示内容；未传时使用当前语言的 reset 文案。",
    demo: "重置",
  },
  {
    component: "ProForm",
    name: "submitText",
    type: "React.ReactNode",
    defaultValue: "提交",
    description: "覆盖默认提交按钮的显示内容；未传时使用当前语言的 submit 文案。",
    demo: "提交表单",
  },
  {
    component: "ProForm",
    name: "onReset",
    type: "() => void",
    defaultValue: "undefined",
    description: "form.reset() 执行后触发的回调，适合同步页面外部查询参数或提示。",
    demo: "重置动作",
  },
  {
    component: "Form.Item",
    name: "name",
    type: "FieldPath<T> | undefined",
    defaultValue: "undefined",
    description: "字段路径；传入时使用 Controller 注册到 form，支持嵌套路径和数组路径。",
    demo: "name / email",
  },
  {
    component: "Form.Item",
    name: "label",
    type: "React.ReactNode",
    defaultValue: "undefined",
    description: "字段标签；渲染在控件上方/左侧，和 required、tooltip、extra 同处于 label 区域。",
    demo: "姓名",
  },
  {
    component: "Form.Item",
    name: "required",
    type: "boolean",
    defaultValue: "undefined",
    description: "声明字段必填；当 rules 未提供 required 时自动注入当前语言的 required 文案。",
    demo: "请输入姓名",
  },
  {
    component: "Form.Item",
    name: "rules",
    type: "RegisterOptions<T, N>",
    defaultValue: "undefined",
    description: "传递给 Controller 的 react-hook-form 校验规则，支持 required、pattern、min、validate 等。",
    demo: "邮箱格式 / admin 异步校验",
  },
  {
    component: "Form.Item",
    name: "help",
    type: "React.ReactNode",
    defaultValue: "undefined",
    description: "没有校验错误时显示的辅助说明；有错误时错误 message 优先显示。",
    demo: "可选字段",
  },
  {
    component: "Form.Item",
    name: "extra",
    type: "React.ReactNode",
    defaultValue: "undefined",
    description: "在字段标签区域显示额外说明，不参与字段值和校验。",
    demo: "标签旁说明",
  },
  {
    component: "Form.Item",
    name: "children",
    type: "(context: FormRenderContext<T, N>) => ReactNode | ReactNode",
    defaultValue: "必填",
    description: "可用 render props 取得 field、fieldState、formState、disabled、readOnly；组件不会克隆子节点。",
    demo: "Select / DatePicker",
  },
  {
    component: "Form.Item",
    name: "className",
    type: "string",
    defaultValue: "undefined",
    description: "追加到 Item 根节点，用于单个字段布局覆盖。",
    demo: "备注占满分组",
  },
  {
    component: "Form.Item",
    name: "classNames",
    type: 'Pick<FormClassNames, "item" | "label" | "control" | "help">',
    defaultValue: "{}",
    description: "分别定制 Item、label、control、help 插槽，保留 biu-form-item 前缀类。",
    demo: "备注占满分组",
  },
  {
    component: "Form.Item",
    name: "hidden",
    type: "boolean",
    defaultValue: "false",
    description: "保留字段注册和当前值，但隐藏 Item 的可见布局。",
    demo: "动态审批字段",
  },
  {
    component: "Form.Item",
    name: "noStyle",
    type: "boolean",
    defaultValue: "false",
    description: "去掉 label/help 外壳，仅渲染 render props 返回的控件。",
    demo: "动态审批字段",
  },
  {
    component: "Form.Item",
    name: "tooltip",
    type: "React.ReactNode",
    defaultValue: "undefined",
    description: "在标签旁显示公共 Tooltip；提示内容由调用方提供，不重复维护浮层实现。",
    demo: "字段说明",
  },
  {
    component: "Form.Item",
    name: "colon",
    type: "boolean",
    defaultValue: "true",
    description: "控制 label 文本后是否显示冒号。",
    demo: "姓名:",
  },
  {
    component: "Form.Item",
    name: "requiredSymbol",
    type: "React.ReactNode",
    defaultValue: "*",
    description: "覆盖 requiredMark 使用的必填符号或图标。",
    demo: "自定义必填符号",
  },
  {
    component: "Form.Item",
    name: "validateTrigger",
    type: '"onChange" | "onBlur" | "onSubmit" | Array<...>',
    defaultValue: "undefined",
    description: "指定依赖字段触发 form.trigger 的时机；未传时保留 react-hook-form 默认校验时机。",
    demo: "失焦校验",
  },
  {
    component: "Form.Item",
    name: "dependencies",
    type: "FieldPath<T>[]",
    defaultValue: "undefined",
    description: "声明依赖字段；依赖变化时触发当前字段校验，适合联动字段。",
    demo: "需要审批 → 审批人",
  },
  {
    component: "Form.Item",
    name: "shouldUpdate",
    type: "boolean | ((previous: T, current: T) => boolean)",
    defaultValue: "undefined",
    description: "订阅依赖或表单值并按需刷新 render props，避免所有 Item 因无关字段变化重渲染。",
    demo: "动态审批区域",
  },
  {
    component: "Form.Item",
    name: "preserve",
    type: "boolean",
    defaultValue: "true",
    description: "为 false 时字段卸载后注销 Controller；为 true 时保留字段值，适合可切换的业务区域。",
    demo: "动态字段",
  },
  {
    component: "Form.Group",
    name: "icon",
    type: "React.ReactNode",
    defaultValue: "undefined",
    description: "标题前的图标插槽；只渲染在标题存在或 icon 显式传入的 header 中。",
    demo: "分组标题图标",
  },
  {
    component: "Form.Group",
    name: "title",
    type: "React.ReactNode",
    defaultValue: "undefined",
    description: "分组标题；与 description 一起生成 header，未传时分组仍可作为带边框 Grid 使用。",
    demo: "基本信息",
  },
  {
    component: "Form.Group",
    name: "description",
    type: "React.ReactNode",
    defaultValue: "undefined",
    description: "显示在标题下方的分组说明，不参与表单提交。",
    demo: "字段可嵌套说明",
  },
  {
    component: "Form.Group",
    name: "children",
    type: "React.ReactNode",
    defaultValue: "必填",
    description: "分组内容；通常放置 Form.Item、Form.Grid 或 Form.List，内容在 body Grid 中渲染。",
    demo: "多个字段分区",
  },
  {
    component: "Form.Group",
    name: "columns",
    type: "number | string",
    defaultValue: "2",
    description: "设置分组 Grid 列数或 CSS grid-template-columns 值；窄屏由包内样式收敛为单列。",
    demo: "联系人 columns=1",
  },
  {
    component: "Form.Group",
    name: "gap",
    type: "number | string",
    defaultValue: "16",
    description: "设置分组字段之间的行列间距；数字转换为 px。",
    demo: "统一字段间距",
  },
  {
    component: "Form.Group",
    name: "bordered",
    type: "boolean",
    defaultValue: "true",
    description: "控制分组是否显示边框；false 只保留标题、Grid 和 spacing。",
    demo: "borderless 分组",
  },
  {
    component: "Form.Group",
    name: "className",
    type: "string",
    defaultValue: "undefined",
    description: "追加到分组根节点。",
    demo: "分组样式",
  },
  {
    component: "Form.Group",
    name: "classNames",
    type: "FormGroupClassNames",
    defaultValue: "{}",
    description: "分别定制 root、header、icon、title、description、body 插槽。",
    demo: "分组 slot 样式",
  },
  {
    component: "Form.Grid",
    name: "children",
    type: "React.ReactNode",
    defaultValue: "必填",
    description: "栅格内容；Form.Item 会占据一个 grid track，控件由 Form 样式统一拉伸。",
    demo: "Grid 字段布局",
  },
  {
    component: "Form.Grid",
    name: "columns",
    type: "number",
    defaultValue: "2",
    description: "设置 --biu-form-columns 的列数，决定直接子项的栅格分布。",
    demo: "两列布局",
  },
  {
    component: "Form.Grid",
    name: "className",
    type: "string",
    defaultValue: "undefined",
    description: "追加到 biu-form-grid 根节点的自定义类名。",
    demo: "Grid className",
  },
  {
    component: "Form.Section",
    name: "title",
    type: "React.ReactNode",
    defaultValue: "undefined",
    description: "渲染 fieldset 的 legend 标题。",
    demo: "Section 标题",
  },
  {
    component: "Form.Section",
    name: "description",
    type: "React.ReactNode",
    defaultValue: "undefined",
    description: "渲染 legend 下方的说明段落，不负责字段状态。",
    demo: "Section 标题",
  },
  {
    component: "Form.Section",
    name: "children",
    type: "React.ReactNode",
    defaultValue: "必填",
    description: "区域内容；适合不需要 Form.Group header 的简单分区。",
    demo: "Section 内容",
  },
  {
    component: "Form.Section",
    name: "className",
    type: "string",
    defaultValue: "undefined",
    description: "追加到 biu-form-section 根节点。",
    demo: "Section 内容",
  },
  {
    component: "Form.List",
    name: "name",
    type: "FieldArrayPath<TFieldValues>",
    defaultValue: "必填",
    description: "useFieldArray 的数组字段路径；字段名通过 fields 的 name/index 拼接到 Form.Item。",
    demo: "contacts",
  },
  {
    component: "Form.List",
    name: "control",
    type: "Control<TFieldValues>",
    defaultValue: "FormProvider.control",
    description: "覆盖 useFieldArray 使用的 control；未传时读取当前 FormProvider。",
    demo: "FormProvider",
  },
  {
    component: "Form.List",
    name: "rules",
    type: "UseFieldArrayProps<T>['rules']",
    defaultValue: "undefined",
    description: "传递数组级校验规则给 react-hook-form useFieldArray。",
    demo: "数组规则",
  },
  {
    component: "Form.List",
    name: "initialValue",
    type: "Array<FieldArray<TFieldValues, TFieldArrayName>>",
    defaultValue: "undefined",
    description: "列表首次挂载且没有字段时写入的初始数组值。",
    demo: "联系人默认项",
  },
  {
    component: "Form.List",
    name: "addValue",
    type: "FieldArray<TFieldValues, TFieldArrayName>",
    defaultValue: "{}（columns 模式）",
    description:
      "columns 模式点击默认新增按钮时追加的行值；未传时追加空对象，render props 模式仍可由 operations.add(value) 自定义。",
    demo: "新增联系人行",
  },
  {
    component: "Form.List",
    name: "columns",
    type: "FormListColumn<FieldArray<TFieldValues, TFieldArrayName>>[]",
    defaultValue: "undefined",
    description: "表格化一行多字段定义；每列独立声明 label/name/width/render，render 可组合 Form.Item 与任意控件。",
    demo: "动态字段表格",
  },
  {
    component: "Form.List",
    name: "columns[].tooltip",
    type: "React.ReactNode",
    defaultValue: "undefined",
    description: "在对应 Form.List 表头文字后显示问号 Tooltip，用于解释该列的填写规则。",
    demo: "联系人列说明",
  },
  {
    component: "Form.List",
    name: "addText",
    type: "React.ReactNode",
    defaultValue: "新增",
    description: "columns 模式默认新增按钮的文案或自定义节点。",
    demo: "添加联系人",
  },
  {
    component: "Form.List",
    name: "removeText",
    type: "React.ReactNode",
    defaultValue: "删除",
    description: "columns 模式每行删除按钮的文案或自定义节点。",
    demo: "删除联系人",
  },
  {
    component: "Form.List",
    name: "showAdd",
    type: "boolean",
    defaultValue: "true",
    description: "是否渲染 columns 模式底部新增按钮；false 时仍可通过 children operations.add 增加。",
    demo: "新增开关",
  },
  {
    component: "Form.List",
    name: "showRemove",
    type: "boolean",
    defaultValue: "true",
    description: "是否为 columns 模式每行渲染删除按钮；false 时保留字段但不显示内置删除动作。",
    demo: "删除开关",
  },
  {
    component: "Form.List",
    name: "minRows",
    type: "number",
    defaultValue: "0",
    description: "允许的最少行数，范围 0..99999；达到下限时内置删除动作自动禁用。",
    demo: "至少保留 1 行",
  },
  {
    component: "Form.List",
    name: "maxRows",
    type: "number",
    defaultValue: "99999",
    description: "允许的最多行数，范围 0..99999；达到上限时内置新增动作自动禁用。",
    demo: "最多 5 行",
  },
  {
    component: "Form.List",
    name: "sortable",
    type: "boolean",
    defaultValue: "true",
    description: "columns 模式是否允许拖动整行排序；排序结果由 Form.List 内部维护并通过 operations.move 暴露。",
    demo: "拖动行排序",
  },
  {
    component: "Form.List",
    name: "showSort",
    type: "boolean",
    defaultValue: "false",
    description: "是否在最前面显示排序列；开启后显示拖动手柄以及上移/下移按钮。",
    demo: "排序列",
  },
  {
    component: "Form.List",
    name: "sortLabel",
    type: "React.ReactNode",
    defaultValue: "排序",
    description: "排序列标题；仅在 showSort=true 时渲染。",
    demo: "排序",
  },
  {
    component: "Form.List",
    name: "onSortChange",
    type: "(from: number, to: number) => void",
    defaultValue: "undefined",
    description: "内置拖动或上移/下移完成后返回源行和目标行索引；列表值仍由 Form.List 内部同步。",
    demo: "记录排序变化",
  },
  {
    component: "Form.List",
    name: "children",
    type: "(fields, operations, meta) => ReactNode",
    defaultValue: "必填",
    description: "render props 返回稳定 key 的 fields、add/remove/move/replace 操作和 errors 元信息。",
    demo: "添加联系人",
  },
  {
    component: "Form.List",
    name: "className",
    type: "string",
    defaultValue: "undefined",
    description: "追加到 biu-form-list 根节点。",
    demo: "列表样式",
  },
  {
    component: "Form.List",
    name: "classNames",
    type: "FormListClassNames",
    defaultValue: "{}",
    description: "分别定制 root 和 field 插槽类名，不改变 useFieldArray 状态。",
    demo: "列表样式",
  },
  {
    component: "Form.Actions",
    name: "children",
    type: "React.ReactNode",
    defaultValue: "必填",
    description: "操作区内容；按钮间距由公共 ButtonGroup 或 Actions CSS 负责。",
    demo: "提交 / 重置 / 只读",
  },
  {
    component: "Form.Actions",
    name: "className",
    type: "string",
    defaultValue: "undefined",
    description: "追加到 biu-form-actions 根节点。",
    demo: "提交 / 重置 / 只读",
  },
  {
    component: "Form.ErrorSummary",
    name: "form",
    type: "UseFormReturn<T>",
    defaultValue: "必填",
    description: "读取 formState.errors 并生成可点击错误路径；点击后调用 form.setFocus。",
    demo: "请先修正以下字段",
  },
  {
    component: "Form.ErrorSummary",
    name: "title",
    type: "React.ReactNode",
    defaultValue: "locale.errorSummaryTitle",
    description: "覆盖错误汇总标题；没有错误时整个组件返回 null。",
    demo: "错误汇总标题",
  },
  {
    component: "Form.ErrorSummary",
    name: "className",
    type: "string",
    defaultValue: "undefined",
    description: "追加到错误汇总根节点。",
    demo: "错误汇总标题",
  },
  {
    component: "Form.ErrorSummary",
    name: "locale",
    type: "BiuFormLocale",
    defaultValue: "Form scope locale",
    description: "控制错误汇总默认文案语言；未传时读取 Form scope。",
    demo: "中文错误文案",
  },
  {
    component: "Form.ErrorSummary",
    name: "localeText",
    type: "BiuFormLocaleTextOverrides",
    defaultValue: "{}",
    description: "覆盖错误汇总标题等内置文案；优先级高于 Form scope。",
    demo: "中文错误文案",
  },
];

const formCoreApiRows = formApiRows.filter((row) => row.component === "Form" || row.component === "ProForm");
const formItemApiRows = formApiRows.filter((row) => row.component === "Form.Item");
const formGroupApiRows = formApiRows.filter((row) => row.component === "Form.Group");
const formListApiRows = formApiRows.filter((row) => row.component === "Form.List");
const formActionApiRows = formApiRows.filter(
  (row) => row.component === "Form.Actions" || row.component === "Form.ErrorSummary",
);

export default function FormShowcase() {
  const { locale } = useBiuContext();
  const form = useForm<FormValues>({
    defaultValues: {
      name: "",
      email: "",
      department: "platform",
      amount: 128.5,
      note: "",
      needsApproval: false,
      approver: "",
      date: null,
      rangeDate: [null, null],
      time: null,
      rangeTime: [null, null],
      notify: true,
      channel: "browser",
      contacts: [{ value: "项目负责人", role: "产品负责人", enabled: true }],
    },
    mode: "onBlur",
  });
  const needsApproval = form.watch("needsApproval");
  const [submitted, setSubmitted] = useState<FormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [contactsSort, setContactsSort] = useState("未调整");
  return (
    <CapabilityPage
      title="Form 能力展示"
      description="Form 基于 react-hook-form，Item 只管理字段状态和校验，通过 render props 渲染业务控件。"
    >
      <CapabilityGrid>
        <CapabilityCard title="Form / Item / Field">
          <ProForm
            form={form}
            locale={locale}
            localeText={{ required: "请填写该字段" }}
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
            <FormGroup title="基本信息" description="字段可嵌套、可禁用并保持显式控件绑定。">
              <Form.Item
                name="name"
                label="姓名"
                tooltip="用于展示字段标签后的帮助说明。"
                rules={{
                  required: "请输入姓名",
                  validate: async (value) => {
                    await new Promise((resolve) => setTimeout(resolve, 120));
                    return String(value).toLowerCase() !== "admin" || "该名称已被占用";
                  },
                }}
              >
                {({ field }) => <TextField {...field} placeholder="请输入姓名" />}
              </Form.Item>
              <Form.Item
                name="email"
                label="邮箱"
                tooltip="请输入可接收通知的邮箱地址。"
                rules={{ required: "请输入邮箱", pattern: { value: /^\S+@\S+$/, message: "邮箱格式不正确" } }}
              >
                {({ field }) => <TextField {...field} type="email" placeholder="name@example.com" />}
              </Form.Item>

              <Form.Item name="department" label="部门">
                {({ field }) => (
                  <Select
                    {...field}
                    hasAllOption
                    options={[
                      { label: "平台工程", value: "platform" },
                      { label: "业务研发", value: "product" },
                    ]}
                  />
                )}
              </Form.Item>
              <Form.Item name="amount" label="预算金额" rules={{ required: "请输入预算金额" }}>
                {({ field }) => (
                  <InputNumber
                    {...field}
                    value={field.value as number}
                    min={0}
                    decimal={2}
                    changeOnWheel
                    aria-label="预算金额"
                  />
                )}
              </Form.Item>
            </FormGroup>
            <FormGroup title="日期与通知" description="日期、时间和区间控件使用同一套受控字段协议。">
              <Form.Item name="date" label="生效日期" rules={{ required: "请选择生效日期" }}>
                {({ field }) => <DatePicker value={field.value as never} onChange={field.onChange} locale={locale} />}
              </Form.Item>
              <Form.Item name="rangeDate" label="有效区间">
                {({ field }) => (
                  <RangeDatePicker value={field.value as never} onChange={field.onChange} locale={locale} />
                )}
              </Form.Item>
              <Form.Item name="time" label="提醒时间">
                {({ field }) => (
                  <TimePicker
                    value={field.value as never}
                    onChange={field.onChange}
                    locale={locale}
                    format="HH:mm:ss"
                  />
                )}
              </Form.Item>
              <Form.Item name="rangeTime" label="提醒区间">
                {({ field }) => (
                  <RangeTimePicker
                    value={field.value as never}
                    onChange={field.onChange}
                    locale={locale}
                    format="HH:mm:ss"
                  />
                )}
              </Form.Item>
            </FormGroup>
            <FormGroup title="流程配置" description="根据表单状态动态展示审批字段，并保持字段联动。">
              <Form.Item name="note" label="备注" help="可选字段" className="biu-form-group__item--full">
                {({ field }) => <Textarea {...field} placeholder="补充说明" />}
              </Form.Item>
              <Form.Item name="needsApproval" label="流程">
                {({ field }) => (
                  <Checkbox
                    checked={Boolean(field.value)}
                    onChange={(event) => field.onChange(event.target.checked)}
                    label="需要审批"
                  />
                )}
              </Form.Item>
              <Form.Item name="channel" label="通知渠道">
                {({ field }) => (
                  <RadioGroup
                    {...field}
                    options={[
                      { label: "浏览器", value: "browser" },
                      { label: "邮件", value: "email" },
                    ]}
                  />
                )}
              </Form.Item>
              <Form.Item name="notify" label="通知">
                {({ field }) => (
                  <Switch
                    checked={Boolean(field.value)}
                    onChange={field.onChange}
                    checkedChildren="开启"
                    unCheckedChildren="关闭"
                  />
                )}
              </Form.Item>
              {needsApproval ? (
                <Form.Item name="approver" label="审批人" rules={{ required: "请选择审批人" }}>
                  {({ field }) => <TextField {...field} placeholder="请输入审批人" />}
                </Form.Item>
              ) : null}
            </FormGroup>
            <FormGroup title="联系人" description="Form.List columns 以动态表格方式组织一行多个字段。" columns={1}>
              <Form.List
                name="contacts"
                addValue={{ value: "", role: "研发", enabled: true }}
                addText="添加联系人"
                minRows={1}
                maxRows={5}
                sortable
                showSort
                onSortChange={(from, to) => setContactsSort(`${from + 1} → ${to + 1}`)}
                columns={[
                  {
                    key: "value",
                    label: "联系人",
                    tooltip: "联系人的显示名称或工作账号。",
                    name: "value",
                    width: "34%",
                    render: ({ fieldName }) => (
                      <Form.Item name={fieldName as never} noStyle>
                        {({ field: itemField }) => <TextField {...itemField} placeholder="请输入联系人" />}
                      </Form.Item>
                    ),
                  },
                  {
                    key: "role",
                    label: "职责",
                    tooltip: "选择该联系人的职责类型。",
                    name: "role",
                    width: "30%",
                    render: ({ fieldName }) => (
                      <Form.Item name={fieldName as never} noStyle>
                        {({ field: itemField }) => (
                          <Select
                            {...itemField}
                            options={[
                              { label: "产品负责人", value: "产品负责人" },
                              { label: "研发", value: "研发" },
                              { label: "测试", value: "测试" },
                            ]}
                            placeholder="选择职责"
                          />
                        )}
                      </Form.Item>
                    ),
                  },
                  {
                    key: "enabled",
                    label: "启用",
                    name: "enabled",
                    width: "18%",
                    render: ({ fieldName }) => (
                      <Form.Item name={fieldName as never} noStyle>
                        {({ field: itemField }) => (
                          <Switch
                            checked={Boolean(itemField.value)}
                            onChange={itemField.onChange}
                            aria-label="启用联系人"
                          />
                        )}
                      </Form.Item>
                    ),
                  },
                ]}
              />
              <p className="biu-form-list__sort-status">最近排序：{contactsSort}</p>
            </FormGroup>
            <FormErrorSummary form={form} locale={locale} localeText={{ errorSummaryTitle: "请先修正以下字段" }} />
            <Alert status="info" title="验证与状态">
              姓名支持异步校验；开启审批后会动态增加必填字段，Form 不克隆业务控件。
            </Alert>
            <FormActions>
              <Button type="submit" loading={submitting} disabled={readOnly}>
                提交表单
              </Button>
              <Button type="button" variant="secondary" disabled={submitting} onClick={() => form.reset()}>
                重置
              </Button>
              <Button type="button" variant="ghost" onClick={() => setReadOnly((value) => !value)}>
                {readOnly ? "恢复编辑" : "只读预览"}
              </Button>
            </FormActions>
          </ProForm>
          <div className="biu-capability-region-api">
            <div className="biu-capability-region-api__block">
              <h3>Form / ProForm 本区域 API</h3>
              <CapabilityApiTable rows={formCoreApiRows} />
            </div>
            <div className="biu-capability-region-api__block">
              <h3>Form.Item / Field 本区域 API</h3>
              <CapabilityApiTable rows={formItemApiRows} />
            </div>
            <div className="biu-capability-region-api__block">
              <h3>FormGroup / Form.Group 本区域 API</h3>
              <CapabilityApiTable rows={formGroupApiRows} />
            </div>
            <div className="biu-capability-region-api__block">
              <h3>Form.List 本区域 API</h3>
              <CapabilityApiTable rows={formListApiRows} />
            </div>
          </div>
        </CapabilityCard>
        <CapabilityCard title="提交结果 / 状态反馈">
          {submitted ? (
            <>
              <Tag color="success">提交成功</Tag>
              <pre className="biu-capability-code">{JSON.stringify(submitted, null, 2)}</pre>
            </>
          ) : (
            <Tag color="default">尚未提交</Tag>
          )}
          <div className="biu-capability-actions" style={{ marginTop: 12 }}>
            <Tag color={form.formState.isDirty ? "warning" : "default"}>
              {form.formState.isDirty ? "有未保存修改" : "初始状态"}
            </Tag>
            <Tag color={needsApproval ? "info" : "default"}>{needsApproval ? "审批字段已启用" : "无审批"}</Tag>
          </div>
          <p>Form.Item 不克隆输入组件，错误状态通过 render props 显式传递。</p>
          <div className="biu-capability-region-api">
            <div className="biu-capability-region-api__block">
              <h3>提交状态 API</h3>
              <CapabilityApiTable rows={formActionApiRows} />
            </div>
          </div>
        </CapabilityCard>
      </CapabilityGrid>
    </CapabilityPage>
  );
}
