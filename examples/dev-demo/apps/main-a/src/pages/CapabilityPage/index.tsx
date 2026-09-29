import { memo, useMemo, type ReactNode } from "react";
import { PageBox } from "@biugle/react-components";
import { Table, type Column } from "@biugle/react-table/ui";
import "@biugle/react-components/styles.css";
import "@biugle/react-table/styles.css";
import "./styles.css";

export interface CapabilityApiRow {
  component: string;
  name: string;
  type: string;
  defaultValue: string;
  /** Explicit allowed values or method parameters shown as a separate column. */
  options?: string;
  description: string;
  demo?: string;
  /** Optional per-property overrides for legacy grouped entries. */
  propertyDetails?: Record<
    string,
    Partial<Pick<CapabilityApiRow, "type" | "defaultValue" | "options" | "description" | "demo">>
  >;
}

function splitApiSegments(value: string) {
  return value
    .split(/\s+\/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitComponentSegments(value: string) {
  return splitApiSegments(value);
}

function inferredOptions(type: string) {
  const normalized = type.replace(/^\s*['"]|['"]\s*$/g, "");
  if (normalized.includes("|") && !normalized.includes("=>")) return normalized.replace(/"/g, "");
  if (type === "boolean") return "true | false";
  if (type.includes("=>") || type.toLowerCase().includes("callback")) return "按类型签名传入函数";
  if (type === "string") return "任意字符串";
  if (type === "number") return "任意数字（受组件边界约束）";
  if (type.includes("ReactNode")) return "任意 ReactNode";
  if (type.endsWith("[]")) return "数组元素由类型定义";
  return "见类型签名";
}

type CapabilityPropertyDetail = Partial<
  Pick<CapabilityApiRow, "type" | "defaultValue" | "options" | "description" | "demo">
>;

/**
 * The capability tables are also the public API reference.  A grouped source
 * row may be convenient to author, but it must never make several properties
 * share one vague description after it is expanded.  These entries provide a
 * precise, reusable definition for the common property names used by the UI,
 * form, table and service catalogues.
 */
const commonApiPropertyDetails: Record<string, CapabilityPropertyDetail> = {
  type: {
    options: "组件公开的语义类型值",
    description: "选择组件的语义类型；每个可选值对应一套颜色、行为或结构语义。",
  },
  variant: {
    options: "contained | text | outlined",
    description: "选择实体、文字或描边视觉变体，不改变组件的交互事件。",
  },
  value: {
    options: "受控值；范围组件为 [start, end]",
    description: "传入外部状态作为当前值；配合 onChange 使用时由调用方负责回写。",
  },
  defaultValue: {
    options: "组件对应的初始值",
    description: "仅在非受控模式首次渲染时使用的初始值，后续由组件内部管理。",
  },
  onChange: {
    options: "最新值及组件约定的 option/index 或事件参数",
    description: "值或选择状态变化后触发；回调参数包含当前值和该组件约定的上下文信息。",
  },
  open: {
    options: "true | false",
    description: "受控打开状态；传入后需要在 onOpenChange 中同步新的状态。",
  },
  defaultOpen: {
    options: "true | false",
    description: "非受控浮层首次打开状态，后续打开关闭由组件内部维护。",
  },
  onOpenChange: {
    options: "(open, reason?) => void",
    description: "浮层打开状态变化时触发；reason 可用于区分遮罩、ESC、按钮或程序关闭。",
  },
  disabled: {
    options: "true | false",
    description: "禁用用户交互、键盘操作和对应的提交行为，并保持禁用视觉。",
  },
  readOnly: {
    options: "true | false",
    description: "展示当前值但禁止修改；与 disabled 的区别是仍保留可读和可聚焦语义。",
  },
  loading: {
    options: "true | false",
    description: "展示进行中的状态并阻止重复操作，完成后由外部或异步回调解除。",
  },
  children: {
    options: "任意 ReactNode",
    description: "组件内部要渲染的内容或触发器节点，保留调用方传入的结构。",
  },
  className: {
    options: "CSS class 字符串",
    description: "追加到组件根节点；不会移除 biu 组件前缀类，可用于局部 Tailwind/CSS 定制。",
  },
  classNames: {
    options: "公开 slot 名到 CSS class 的映射",
    description: "按区域追加样式类，适合精确覆盖根节点、内容、触发器或操作区。",
  },
  style: {
    options: "React.CSSProperties",
    description: "向组件根节点追加内联样式；适合少量运行时尺寸或主题变量覆盖。",
  },
  title: {
    options: "字符串或 ReactNode",
    description: "渲染组件标题区域的主文案，可使用 ReactNode 扩展图标或链接。",
  },
  description: {
    options: "字符串或 ReactNode，可包含换行",
    description: "渲染标题下方的详细说明；多行内容会保留换行并为操作区预留空间。",
  },
  icon: {
    options: "ReactNode；false 表示隐藏内置图标",
    description: "替换语义图标或状态图标；传 false 时不渲染图标占位。",
  },
  action: {
    options: "任意 ReactNode",
    description: "在内容区域末尾渲染操作入口，组件会为按钮保留独立点击区域。",
  },
  options: {
    options: "label/value/disabled 以及组件扩展字段",
    description: "提供可选择或可展示的条目数据；组件据此处理标签、禁用态、索引和自定义渲染。",
  },
  items: {
    options: "key、label、children、disabled 等条目字段",
    description: "提供菜单、Tabs 或 Dropdown 的条目树；key 用于受控状态和事件定位。",
  },
  data: {
    options: "组件定义的数据节点数组",
    description: "提供 Tree 等数据展示组件的节点源；节点 key、children 和标题决定层级呈现。",
  },
  dataSource: {
    options: "业务记录数组",
    description: "提供 Table 或 Transfer 的业务数据源；每条记录由 rowKey 或 key 稳定标识。",
  },
  render: {
    options: "(value, record, index) => ReactNode",
    description: "将原始业务值转换为展示内容；返回结果作为该区域最终渲染节点。",
  },
  renderCell: {
    options: "(date) => ReactNode",
    description: "替换日期面板单元格的默认数字内容，同时保留日期选择和禁用逻辑。",
  },
  optionRender: {
    options: "(option, index/level) => ReactNode",
    description: "自定义下拉、级联或分组选项的内容，option 仍保留原始值和禁用状态。",
  },
  labelRender: {
    options: "(value, option) => ReactNode",
    description: "自定义 Select 单选触发器中已选标签的展示，不改变实际选中值。",
  },
  tagRender: {
    options: "(option, onClose) => ReactNode",
    description: "自定义 Select 多选标签并使用 onClose 移除对应值，超长内容由调用方控制。",
  },
  displayRender: {
    options: "(labels, selectedOptions) => ReactNode",
    description: "自定义 Cascader 触发器中完整路径的展示文本。",
  },
  dropdownRender: {
    options: "(menu, context?) => ReactNode",
    description: "包裹或扩展下拉面板，可在原菜单前后增加搜索提示、批量操作或说明。",
  },
  showSearch: {
    options: "true | false 或搜索配置对象",
    description: "显示并启用列表内搜索；搜索输入与选项区域保持同一面板和滚动上下文。",
  },
  search: {
    options: "字符串或搜索回调配置",
    description: "控制节点列表的过滤关键词或搜索能力，过滤结果不会改变原始数据源。",
  },
  multiple: {
    options: "true | false",
    description: "允许同时选择多个值；组件会以数组值、标签和全选逻辑处理结果。",
  },
  mode: {
    options: "single | multiple",
    description: "决定单值还是多值选择模型，并影响触发器标签与 onChange 参数。",
  },
  checkable: {
    options: "true | false",
    description: "为 Tree 节点启用复选选择，并按 checkedKeys 维护勾选状态。",
  },
  selectedKeys: {
    options: "节点或条目 key[]",
    description: "受控当前选择项；组件根据 key 高亮对应节点或条目。",
  },
  expandedKeys: {
    options: "节点 key[]",
    description: "受控 Tree 展开节点集合；更新后只展开集合内的父节点。",
  },
  checkedKeys: {
    options: "节点或菜单 key[]",
    description: "受控复选选中集合；与 Tree 的级联勾选或 Dropdown checkbox 菜单同步。",
  },
  targetKeys: {
    options: "Transfer 条目 key[]",
    description: "受控已移动到右侧的数据 key 集合，顺序决定右侧显示顺序。",
  },
  current: {
    options: "大于等于 1 的页码",
    description: "Pagination 当前页码；受控模式下翻页后必须通过 onChange 回写。",
  },
  pageSize: {
    options: "正整数",
    description: "每页展示的数据条数；改变后组件会重新计算总页数并校正当前页。",
  },
  pageSizeOptions: {
    options: "正整数数组",
    description: "页大小选择器的可选条数，当前 pageSize 不在数组时仍会保留当前值。",
  },
  showSizeChanger: {
    options: "true | false",
    description: "显示每页条数下拉框，并通过分页 onChange 返回新的 pageSize。",
  },
  showQuickJumper: {
    options: "true | false",
    description: "显示页码输入框，回车或确认后跳转到指定页。",
  },
  showTotal: {
    options: "(total, range) => ReactNode",
    description: "在分页左侧展示总条数或当前记录范围。",
  },
  responsive: {
    options: "true | false",
    description: "在窄屏下允许分页控件换行并收敛页码布局。",
  },
  itemRender: {
    options: "(page, type, originalElement) => ReactNode",
    description: "自定义页码、上一页、下一页或跳转项的渲染节点。",
  },
  format: {
    options: "yyyy-mm-dd、yyyy-mm-dd hh:ii:ss、HH:mm 等 dayjs 格式",
    description: "决定日期/时间面板列和触发器输出文本的格式，不使用原生浏览器时间控件。",
  },
  presets: {
    options: "label + Dayjs/范围或返回值的函数数组",
    description: "在面板侧边渲染快捷选择列表；单日期默认今天/明天/昨天，范围默认近一周/近一月。",
  },
  disabledDate: {
    options: "(date) => boolean",
    description: "返回 true 的日期不可选择，仍会显示在日历中但使用禁用状态。",
  },
  disabledTime: {
    options: "(date, position) => disabledHours/Minutes/Seconds",
    description: "按起止位置禁用时间列中的小时、分钟或秒选项。",
  },
  needConfirm: {
    options: "true | false",
    description: "把面板选择先保存在草稿，只有点击确定才触发 onChange 并关闭面板。",
  },
  hour12: {
    options: "true | false",
    description: "切换 12 小时制与 24 小时制，并在 12 小时制显示上午/下午切换。",
  },
  position: {
    options: "center | top | right | bottom | left",
    description: "设置 Dialog 面板在视口中的停靠位置。",
  },
  placement: {
    options: "top | right | bottom | left",
    description: "设置 Drawer 或浮层的优先出现方向；空间不足时由碰撞系统自动调整。",
  },
  side: {
    options: "top | right | bottom | left",
    description: "设置 Popover/Dropdown 优先靠近触发器的方向，不能容纳时自动避障。",
  },
  align: {
    options: "start | center | end",
    description: "设置浮层边缘相对触发器的对齐点；箭头会跟随实际碰撞后位置。",
  },
  offsetTop: {
    options: "数字像素或 CSS 长度",
    description: "为 Dialog 顶部定位增加偏移，用于避开固定头部或自定义安全区。",
  },
  offsetLeft: {
    options: "数字像素或 CSS 长度",
    description: "为 Dialog 左侧定位增加偏移，用于配合侧栏或自定义安全区。",
  },
  fullscreen: {
    options: "true | false",
    description: "让 Dialog/Drawer 占满视口，并将内容区、滚动区和 footer 统一铺满。",
  },
  destroyOnClose: {
    options: "true | false",
    description: "关闭后是否卸载内容；false 会保留草稿、焦点和内部组件状态。",
  },
  container: {
    options: "Element | null",
    description: "指定 Portal 挂载容器；不传时挂载 document.body 以避免被基座层级裁剪。",
  },
  size: {
    options: "small | medium | large 或 CSS 长度",
    description: "设置组件尺寸；Popover/Popconfirm 以内容宽度为准，Drawer 以边缘宽度为准。",
  },
  onlyOverflow: {
    options: "true | false",
    description: "仅在内容实际超出可视区域时打开 Tooltip；false 时悬停即显示。",
  },
  alwaysTooltip: {
    options: "true | false",
    description: "即使内容未溢出也显示完整提示，适合基座多标签页等固定提示场景。",
  },
  maxWidth: {
    options: "数字像素或 CSS width",
    description: "手动限制文本测量和浮层宽度，响应式布局下仍由 Ellipsis 负责省略。",
  },
  closable: {
    options: "true | false",
    description: "显示右侧独立关闭按钮；按钮固定在内容右侧并垂直居中，不与多行文本重叠。",
  },
  maskClosable: {
    options: "true | false",
    description: "点击遮罩是否关闭 Drawer/Dialog；内部 Portal 控件点击不会被误判为遮罩。",
  },
  footer: {
    options: "ReactNode；不传时使用组件默认操作区",
    description: "渲染底部操作区域；Dialog/Drawer 默认提供带间距的取消和确定按钮。",
  },
  status: {
    options: "default | info | success | warning | error",
    description: "设置状态语义并联动图标、边框、背景和文本颜色。",
  },
  color: {
    options: "组件支持的语义值或 CSS color",
    description: "设置 Tag/Badge/Tooltip 等组件的主题颜色；CSS color 可覆盖默认色板。",
  },
  percent: {
    options: "0 - 100",
    description: "设置 Progress 的完成百分比，组件会将值限制在 0 到 100。",
  },
  strokeWidth: {
    options: "正数像素",
    description: "设置进度轨道或环形进度的描边宽度。",
  },
  showInfo: {
    options: "true | false",
    description: "是否显示进度百分比文本。",
  },
  gap: {
    options: "数字像素或 CSS 长度",
    description: "设置 Stack、Grid、ButtonGroup 等直接子项之间的统一间距。",
  },
  direction: {
    options: "row | column 或 horizontal | vertical",
    description: "设置布局或选项组的主轴方向，并保持子项间距规则一致。",
  },
  columns: {
    options: "正整数或列配置",
    description: "设置 Grid/FormGroup 的列数或列布局配置，子项按网格自动排布。",
  },
  bordered: {
    options: "true | false",
    description: "控制 Card/FormGroup 等容器是否绘制边框；默认保持统一的内容内边距。",
  },
  accept: {
    options: "MIME、扩展名或 image/* 等通配符",
    description: "限制 Upload 可选择和校验的文件类型。",
  },
  maxSize: {
    options: "字节数",
    description: "限制单个文件大小，超出时在文件状态中报告校验失败。",
  },
  maxCount: {
    options: "非负整数",
    description: "限制文件列表最多保留的文件数量。",
  },
  beforeUpload: {
    options: "(file) => boolean | Promise<boolean>",
    description: "在文件进入上传队列前执行同步或异步校验，返回 false 时拒绝该文件。",
  },
  customRequest: {
    options: "(options) => void | Promise<void>",
    description: "替换默认传输实现，并通过 options 回报进度、成功、失败和取消。",
  },
  onProgress: {
    options: "(percent, file) => void",
    description: "上传过程中回报当前文件进度，用于更新进度条和文件状态。",
  },
  preview: {
    options: "true | false 或预览回调",
    description: "控制文件卡片是否提供图片/PDF 等可预览入口。",
  },
};

function describeCapabilityProperty(
  component: string,
  name: string,
  type: string,
  sourceDescription: string,
): CapabilityPropertyDetail {
  const detail = commonApiPropertyDetails[name];
  if (detail) return detail;
  return {
    options: inferredOptions(type),
    description: `${component}.${name} 接收 ${type} 类型值；${sourceDescription} 当前案例演示该字段在 ${component} 中的实际效果。`,
  };
}

/** Precise metadata for framework-neutral service pages whose source catalogue
 * still contains compact method families. */
const frameworkApiPropertyDetails: Record<string, CapabilityPropertyDetail> = {
  "Table.columns": {
    type: "Column<T>[]",
    defaultValue: "必填",
    options: "叶子列或带 children 的列树",
    description: "声明表头和单元格列；叶子列渲染数据，带 children 的列负责组织多级表头。",
  },
  "ProTable.columns": {
    type: "Column<T>[]",
    defaultValue: "必填",
    options: "叶子列或带 children 的列树",
    description: "传给内部 Table 的列配置；fixed、hidden 和普通列顺序共同决定页面表格布局。",
  },
  "Column.align": {
    type: '"left" | "center" | "right"',
    defaultValue: '"left"',
    options: "left | center | right",
    description: "设置当前列的表头和数据单元格文本对齐方式，不影响列宽或固定定位。",
  },
  "Column.fixed": {
    type: '"left" | "right"',
    defaultValue: "undefined",
    options: "left | right",
    description: "将当前列固定在横向滚动容器的一侧；固定列不能隐藏或改变列设置顺序。",
  },
  "Popconfirm.onCancel": {
    type: "() => void",
    defaultValue: "undefined",
    options: "无参数",
    description: "点击气泡确认的取消按钮后触发；确认流程不会被启动。",
  },
  "Tabs.onClose": {
    type: "(key: string) => void",
    defaultValue: "undefined",
    options: "可关闭 Tab 的 key",
    description: "点击某个 Tab 的关闭按钮后触发；调用方负责从 items 中移除该 key。",
  },
  "Menu.onSelect": {
    type: "(key: string, item: MenuItem) => void",
    defaultValue: "undefined",
    options: "菜单 key 和完整 MenuItem",
    description: "点击叶子菜单项后触发；目录项只切换展开状态，不触发选择回调。",
  },
  "Breadcrumb.onClick": {
    type: "BreadcrumbItem.onClick?: () => void",
    defaultValue: "undefined",
    options: "在对应 items 项上配置",
    description: "Breadcrumb 没有根级 onClick；可点击行为属于每个 BreadcrumbItem 的 onClick。",
  },
  "Tree.loadData": {
    type: "(node: TreeNode) => TreeNode[] | void | Promise<TreeNode[] | void>",
    defaultValue: "undefined",
    options: "当前节点；返回子节点或 Promise",
    description: "展开尚未加载的节点时按需加载子节点；失败由 onLoadError 接收并保留当前树状态。",
  },
  "Alert.onClose": {
    type: "() => void",
    defaultValue: "undefined",
    options: "无参数",
    description: "点击 Alert 右侧垂直居中的关闭按钮后触发；由调用方移除或隐藏 Alert。",
  },
  "Message.success": {
    type: "(content: string, options?) => string",
    defaultValue: "生成实例 id",
    options: "消息文本和 BiuMessageOptions（type 除外）",
    description: "显示 success 语义的全局消息并返回实例 id；默认使用简约表面。",
  },
  "Message.show": {
    type: "(content: string, options?: BiuMessageOptions) => string",
    defaultValue: "生成实例 id",
    options: "消息文本和完整 BiuMessageOptions",
    description: "显示指定 type 或默认 info 的全局消息并返回实例 id。",
  },
  "Message.primary": {
    type: "(content: string, options?) => string",
    defaultValue: "生成实例 id",
    options: "消息文本和 BiuMessageOptions（type 除外）",
    description: "显示 primary 语义的全局消息并返回实例 id；默认使用简约表面。",
  },
  "Message.default": {
    type: "(content: string, options?) => string",
    defaultValue: "生成实例 id",
    options: "消息文本和 BiuMessageOptions（type 除外）",
    description: "显示 default 语义的全局消息并返回实例 id；默认使用简约表面。",
  },
  "Message.info": {
    type: "(content: string, options?) => string",
    defaultValue: "生成实例 id",
    options: "消息文本和 BiuMessageOptions（type 除外）",
    description: "显示 info 语义的全局消息并返回实例 id；默认使用简约表面。",
  },
  "Message.warning": {
    type: "(content: string, options?) => string",
    defaultValue: "生成实例 id",
    options: "消息文本和 BiuMessageOptions（type 除外）",
    description: "显示 warning 语义的全局消息并返回实例 id；默认使用简约表面。",
  },
  "Message.error": {
    type: "(content: string, options?) => string",
    defaultValue: "生成实例 id",
    options: "消息文本和 BiuMessageOptions（type 除外）",
    description: "显示 error 语义的全局消息并返回实例 id；默认使用简约表面。",
  },
  "Message.duration": {
    type: "number",
    defaultValue: "3200",
    options: "0 或正毫秒数；0 表示不自动关闭",
    description: "控制消息自动关闭的延迟；关闭按钮仍可立即关闭消息。",
  },
  "Message.locale": {
    type: "BiuComponentsLocale",
    defaultValue: "zh-CN",
    options: "zh-CN | en-US",
    description: "选择关闭按钮等内置文案的语言；localeText 可继续逐项覆写。",
  },
  "Message.complex": {
    type: "boolean",
    defaultValue: "false",
    options: "true | false",
    description: "切换简约表面与整块语义底色表面；复杂模式会同步调整文字和图标对比度。",
  },
  "Message.closable": {
    type: "boolean",
    defaultValue: "true",
    options: "true | false",
    description: "控制是否渲染右侧独立关闭按钮；关闭按钮始终垂直居中且不挤压正文。",
  },
  "Tag.onClose": {
    type: "() => void",
    defaultValue: "undefined",
    options: "无参数",
    description: "点击 Tag 关闭按钮后触发；由调用方从标签集合中移除该项。",
  },
  "Box.as": {
    type: "React.ElementType",
    defaultValue: "div",
    options: "HTML 标签或 React 组件",
    description: "替换 Box 根节点元素，同时保留 biu-ui-box 根类和传入属性。",
  },
  "Stack.justify": {
    type: "React.CSSProperties['justifyContent']",
    defaultValue: "start",
    options: "start | center | end | space-between | space-around | space-evenly",
    description: "设置 Stack 主轴上的分布方式；实际值透传到 CSS justify-content。",
  },
  "biuIconCatalog.name": {
    type: "string",
    defaultValue: "完整 catalog",
    options: "公开图标名称",
    description: "图标的稳定导出名称。",
  },
  "biuIconCatalog.category": {
    type: "BiuIconCategory",
    defaultValue: "完整 catalog",
    options: "按区域分类值",
    description: "图标所属分类，用于分组和筛选。",
  },
  "biuIconCatalog.icon": {
    type: "BiuIconComponent",
    defaultValue: "完整 catalog",
    options: "React 组件",
    description: "可直接渲染的图标组件。",
  },
  "searchBiuIcons.query": {
    type: "string",
    defaultValue: "空字符串",
    options: "任意搜索文本",
    description: "按图标名称过滤 catalog。",
  },
  "searchBiuIcons.category": {
    type: "BiuIconCategory | undefined",
    defaultValue: "undefined",
    options: "分类值或 undefined",
    description: "按分类进一步过滤图标。",
  },
  "React icon.size": {
    type: "number | string",
    defaultValue: "组件默认值",
    options: "像素数字或 CSS 尺寸",
    description: "设置 SVG 图标宽高。",
  },
  "React icon.color": {
    type: "string",
    defaultValue: "currentColor",
    options: "CSS color",
    description: "设置 SVG stroke/fill 颜色。",
  },
  "React icon.className": {
    type: "string",
    defaultValue: "undefined",
    options: "CSS class",
    description: "追加图标根节点样式类。",
  },
  "XHttpClass.constructor": {
    type: "(options?, axiosConfig?) => XHttpClass",
    defaultValue: "Axios / timeout=30000",
    options: "XHttpOptions、AxiosRequestConfig",
    description: "创建独立、非 React 的 HTTP 客户端。",
  },
  "XHttpClass.config": {
    type: "XHttpOptions",
    defaultValue: "库内安全默认值",
    options: "请求、重试、Hook 和重复请求配置",
    description: "客户端运行时使用的完整配置对象。",
  },
  "XHttpClass.request": {
    type: "<T>(method, url, config?, isWhiteList?) => Promise<T>",
    defaultValue: "返回 data",
    options: "HTTP 方法、URL、配置、白名单标记",
    description: "发起请求并返回响应 data。",
  },
  "XHttpClass.requestRaw": {
    type: "<T>(method, url, config?, isWhiteList?) => Promise<AxiosResponse<T>>",
    defaultValue: "返回原始 response",
    options: "HTTP 方法、URL、配置、白名单标记",
    description: "发起请求并保留完整 Axios 响应。",
  },
  "XHttpClass.get": {
    type: "<T>(url, params?, config?, isWhiteList?) => Promise<T>",
    defaultValue: "返回 data",
    options: "URL、查询参数、配置、白名单标记",
    description: "GET 请求兼容入口。",
  },
  "XHttpClass.post": {
    type: "<T>(url, data?, config?, isWhiteList?) => Promise<T>",
    defaultValue: "返回 data",
    options: "URL、请求体、配置、白名单标记",
    description: "POST 请求兼容入口。",
  },
  "XHttpClass.put": {
    type: "<T>(url, data?, config?, isWhiteList?) => Promise<T>",
    defaultValue: "返回 data",
    options: "URL、请求体、配置、白名单标记",
    description: "PUT 请求兼容入口。",
  },
  "XHttpClass.patch": {
    type: "<T>(url, data?, config?, isWhiteList?) => Promise<T>",
    defaultValue: "返回 data",
    options: "URL、请求体、配置、白名单标记",
    description: "PATCH 请求兼容入口。",
  },
  "XHttpClass.delete": {
    type: "<T>(url, params?, config?, isWhiteList?) => Promise<T>",
    defaultValue: "返回 data",
    options: "URL、查询参数、配置、白名单标记",
    description: "DELETE 请求兼容入口。",
  },
  "XHttpClass.axiosRequest": {
    type: "<T>(url?, config?) => Promise<T>",
    defaultValue: "返回 data",
    options: "URL 和完整 RequestConfig",
    description: "兼容旧项目的 Axios 请求入口。",
  },
  "XHttpClass.allInRequest": {
    type: "<T>(config) => Promise<T>",
    defaultValue: "返回 data",
    options: "完整 RequestConfig",
    description: "兼容旧项目的统一请求入口。",
  },
  "XHttpClass.postForm": {
    type: "<T>(url, data, hasBrackets?, hasIndex?, config?, isWhiteList?) => Promise<T>",
    defaultValue: "返回 data",
    options: "URL、表单数据、数组序列化、配置、白名单标记",
    description: "将对象/数组序列化为 FormData 后提交。",
  },
  "XHttpClass.postFile": {
    type: "<T>(url, files, name?, hasBrackets?, hasIndex?, config?, isWhiteList?) => Promise<T>",
    defaultValue: "返回 data",
    options: "URL、文件、字段名、数组序列化、配置、白名单标记",
    description: "提交单文件或多文件 FormData。",
  },
  "XHttpClass.cancelRequest": {
    type: "(key?) => void",
    defaultValue: "undefined",
    options: "请求 key 或 undefined",
    description: "取消普通请求。",
  },
  "XHttpClass.cancelWhiteListRequest": {
    type: "(key?) => void",
    defaultValue: "undefined",
    options: "白名单请求 key 或 undefined",
    description: "取消白名单请求。",
  },
  "XHttpClass.setBaseURL": {
    type: "(baseURL) => XHttpClass",
    defaultValue: "当前 baseURL",
    options: "字符串 URL",
    description: "链式更新客户端默认 baseURL。",
  },
  "XHttpClass.setHeaders": {
    type: "(headers) => XHttpClass",
    defaultValue: "当前 headers",
    options: "Record<string, string>",
    description: "链式合并客户端默认请求头。",
  },
  "XHttpClass.setAuthToken": {
    type: "(token?) => XHttpClass",
    defaultValue: "undefined",
    options: "Token 或 undefined",
    description: "链式更新鉴权 Token。",
  },
  "XHttpUtils.stableSerialize": {
    type: "(value) => string",
    defaultValue: "undefined",
    options: "任意可序列化值",
    description: "按稳定键顺序生成请求去重/取消 key。",
  },
  "XHttpUtils.typeof": {
    type: "(value) => string",
    defaultValue: "undefined",
    options: "任意值",
    description: "提供兼容旧项目的安全类型判断工具。",
  },
  "createI18n.defaultLocale": {
    type: "BiuLocale",
    defaultValue: "zh-CN",
    options: "zh-CN | en-US",
    description: "实例初始化的默认语言。",
  },
  "createI18n.fallbackLocale": {
    type: "BiuLocale",
    defaultValue: "zh-CN",
    options: "zh-CN | en-US",
    description: "目标资源缺失时的回退语言。",
  },
  "I18n.$t": {
    type: "(key, params?) => string",
    defaultValue: "返回 key",
    options: "翻译 key 和插值参数",
    description: "读取资源、执行插值并按目标语言→英文→中文→key 回退。",
  },
  "I18n.setLocale": {
    type: "(locale) => void",
    defaultValue: "zh-CN",
    options: "合法 BiuLocale",
    description: "归一化并切换当前语言。",
  },
  "I18n.getLocale": {
    type: "() => BiuLocale",
    defaultValue: "zh-CN",
    options: "无参数",
    description: "读取当前已归一化语言。",
  },
  "I18n.addLocale": {
    type: "(locale, resource) => void",
    defaultValue: "undefined",
    options: "语言和资源对象",
    description: "动态注册语言资源。",
  },
  "I18n.removeLocale": {
    type: "(locale) => void",
    defaultValue: "undefined",
    options: "合法 BiuLocale",
    description: "移除运行时资源。",
  },
  "I18n.has": {
    type: "(key, locale?) => boolean",
    defaultValue: "false",
    options: "key 和可选 locale",
    description: "检测指定语言资源是否包含 key。",
  },
  "I18n.getResource": {
    type: "(locale?) => BiuLocaleResource",
    defaultValue: "当前语言资源",
    options: "可选 locale",
    description: "读取单语言资源对象。",
  },
  "I18n.getTranslations": {
    type: "(locale?) => Record<string, string>",
    defaultValue: "当前语言资源",
    options: "可选 locale",
    description: "读取完整翻译字典。",
  },
  "I18n.subscribe": {
    type: "(listener) => () => void",
    defaultValue: "undefined",
    options: "locale listener",
    description: "订阅语言变化并返回取消订阅函数。",
  },
  "I18n.normalizeBiuLocale": {
    type: "(value) => BiuLocale",
    defaultValue: "zh-CN",
    options: "任意输入，非法回退中文",
    description: "把非法语言值归一化为合法 locale。",
  },
  "@biugle/tanstack-query.createBiuQueryClient": {
    type: "(options?) => QueryClient",
    defaultValue: "Biu defaults",
    options: "QueryClientOptions",
    description: "创建 framework-neutral QueryClient。",
  },
  "@biugle/tanstack-query.createBiuQueryKeys": {
    type: "(scope) => { all, list, detail }",
    defaultValue: "undefined",
    options: "scope string",
    description: "生成统一的 all/list/detail 查询 key。",
  },
  "/react.useBiuQuery": {
    type: "(options) => UseQueryResult",
    defaultValue: "TanStack defaults",
    options: "UseQueryOptions",
    description: "React 绑定的标准 useQuery 封装。",
  },
  "/react.useBiuRequest": {
    type: "(options) => UseQueryResult",
    defaultValue: "AbortSignal 自动传入",
    options: "queryKey + request({ signal })",
    description: "使用标准 AbortSignal 执行请求并管理缓存状态。",
  },
  "/react.useBiuMutationRequest": {
    type: "(options) => UseMutationResult",
    defaultValue: "undefined",
    options: "mutationFn、success/error callbacks",
    description: "封装 mutation 请求、取消、成功和错误状态。",
  },
  "/react.useBiuRequest + queryKey": {
    type: "{ queryKey, request({ signal }) }",
    defaultValue: "请求自动取消",
    options: "queryKey 和 AbortSignal request",
    description: "以 queryKey 驱动缓存、分页和请求取消。",
  },
  "/react.useQueryClient().invalidateQueries": {
    type: "({ queryKey }) => Promise<void>",
    defaultValue: "undefined",
    options: "QueryFilters",
    description: "使指定查询缓存失效并重新获取。",
  },
  "core.createBiuMutationController": {
    type: "() => { signal, cancel }",
    defaultValue: "undefined",
    options: "signal 和 cancel",
    description: "为 framework-neutral mutation 提供 AbortController。",
  },
  "core.normalizeBiuListResponse": {
    type: "(response) => { items, total }",
    defaultValue: "[] / 0",
    options: "items/records/results 和 total 字段",
    description: "归一化常见列表响应。",
  },
  "core.shouldRetryBiuQuery": {
    type: "(failureCount, error) => boolean",
    defaultValue: "network only",
    options: "失败次数和错误",
    description: "只对可恢复网络错误进行重试判断。",
  },
  "core.isAbortError": {
    type: "(error) => boolean",
    defaultValue: "false",
    options: "任意错误",
    description: "识别请求取消错误。",
  },
  "renderQRCode.value": {
    type: "string",
    defaultValue: "必填",
    options: "二维码文本",
    description: "需要编码的文本或 URL。",
  },
  "renderQRCode.target": {
    type: "HTMLElement | undefined",
    defaultValue: "undefined",
    options: "DOM 容器",
    description: "传入时挂载 canvas；不传时返回 data URL。",
  },
  "renderQRCode.width": {
    type: "number",
    defaultValue: "qrcode 默认值",
    options: "正整数像素",
    description: "二维码输出尺寸。",
  },
  "renderQRCode.margin": {
    type: "number",
    defaultValue: "qrcode 默认值",
    options: "非负整数",
    description: "二维码周围留白模块数。",
  },
  "renderBarcode.value": {
    type: "string",
    defaultValue: "必填",
    options: "条码文本",
    description: "需要编码的条码内容。",
  },
  "renderBarcode.target": {
    type: "HTMLElement | SVGElement",
    defaultValue: "undefined",
    options: "DOM 容器",
    description: "传入时挂载 SVG；不传时返回 SVG data URL。",
  },
  "renderBarcode.format": {
    type: "string",
    defaultValue: "CODE128",
    options: "JsBarcode 支持的格式",
    description: "条码编码格式。",
  },
  "renderBarcode.displayValue": {
    type: "boolean",
    defaultValue: "true",
    options: "true | false",
    description: "是否在条码下方显示原始值。",
  },
  "renderQRCodeImage / renderBarcodeImage.target": {
    type: "HTMLImageElement",
    defaultValue: "必填",
    options: "img 元素",
    description: "写入兼容旧打印插件的 img.src。",
  },
  "renderQRCodeImage / renderBarcodeImage.alt": {
    type: "string",
    defaultValue: "undefined",
    options: "替代文本",
    description: "设置图片 alt。",
  },
  "renderQRCodeImage / renderBarcodeImage.clear": {
    type: "boolean",
    defaultValue: "true",
    options: "true | false",
    description: "渲染前是否清理旧 src/内容。",
  },
  "barcodeDataUrl.node": {
    type: "SVGElement",
    defaultValue: "必填",
    options: "SVG 节点",
    description: "将 SVG 条码序列化为 data URL。",
  },
  "downloadCode.dataUrl": {
    type: "string",
    defaultValue: "必填",
    options: "data URL",
    description: "需要下载的编码图片内容。",
  },
  "downloadCode.fileName": {
    type: "string",
    defaultValue: "biu-code.png",
    options: "文件名",
    description: "浏览器下载文件名。",
  },
  "createBiuStore.name": {
    type: "string",
    defaultValue: "必填",
    options: "store 名称",
    description: "创建 store 的稳定名称。",
  },
  "createBiuStore.initialState": {
    type: "State",
    defaultValue: "必填",
    options: "初始状态对象",
    description: "store 初始状态和 action。",
  },
  "BiuStore.hook": {
    type: "Zustand hook",
    defaultValue: "undefined",
    options: "selector 可选",
    description: "React 页面订阅 store 状态。",
  },
  "BiuStore.getState": {
    type: "() => State",
    defaultValue: "当前 state",
    options: "无参数",
    description: "在非 React 代码中读取当前状态。",
  },
  "BiuStore.setState": {
    type: "(partial | updater) => void",
    defaultValue: "undefined",
    options: "部分状态或 updater",
    description: "更新 store 并通知订阅者。",
  },
  "createBiuTabStore.tabs": {
    type: "readonly string[]",
    defaultValue: "必填",
    options: "Tab key[]",
    description: "声明需要隔离参数的 Tab 集合。",
  },
  "createBiuTabStore.initialParams": {
    type: "(tab) => Params",
    defaultValue: "{}",
    options: "Tab key -> params",
    description: "为每个 Tab 生成初始查询参数。",
  },
  "BiuTabStore.setActiveTab": {
    type: "(tab) => void",
    defaultValue: "首个 Tab",
    options: "Tab key",
    description: "切换当前 Tab。",
  },
  "BiuTabStore.patchTabParams": {
    type: "(tab, params) => void",
    defaultValue: "undefined",
    options: "Tab key 和部分 params",
    description: "局部更新指定 Tab 查询参数。",
  },
  "BiuStore.persist": {
    type: "PersistOptions",
    defaultValue: "脱敏持久化",
    options: "storage、partialize 等",
    description: "持久化状态并过滤敏感字段。",
  },
  "BiuStore.subscribe": {
    type: "(listener) => () => void",
    defaultValue: "undefined",
    options: "state listener",
    description: "订阅状态变化并返回取消函数。",
  },
  "Logger.log": {
    type: "(type, ...data) => void",
    defaultValue: "default",
    options: "default | primary | success | warning | error",
    description: "按语义颜色输出多参数日志。",
  },
  "Logger.debug": {
    type: "(...data) => void",
    defaultValue: "undefined",
    options: "任意日志参数",
    description: "输出 debug 日志。",
  },
  "Logger.info": {
    type: "(...data) => void",
    defaultValue: "undefined",
    options: "任意日志参数",
    description: "输出 info 日志。",
  },
  "Logger.success": {
    type: "(...data) => void",
    defaultValue: "undefined",
    options: "任意日志参数",
    description: "输出 success 语义日志。",
  },
  "Logger.warning": {
    type: "(...data) => void",
    defaultValue: "undefined",
    options: "任意日志参数",
    description: "输出 warning 语义日志。",
  },
  "Logger.error": {
    type: "(...data) => void",
    defaultValue: "undefined",
    options: "任意日志参数",
    description: "输出 error 语义日志。",
  },
  "Logger.primary": {
    type: "(...data) => void",
    defaultValue: "undefined",
    options: "任意日志参数",
    description: "输出 primary 语义日志。",
  },
  "Logger.default": {
    type: "(...data) => void",
    defaultValue: "undefined",
    options: "任意日志参数",
    description: "输出默认语义日志。",
  },
  "Logger.start": {
    type: "() => void",
    defaultValue: "自动 start",
    options: "无参数",
    description: "启动 guard、检测和定时任务。",
  },
  "Logger.stop": {
    type: "() => void",
    defaultValue: "undefined",
    options: "无参数",
    description: "停止 guard、检测和定时任务。",
  },
  "Logger.restoreConsole": {
    type: "() => void",
    defaultValue: "undefined",
    options: "无参数",
    description: "恢复被替换的 console 方法。",
  },
  "Logger.destroy": {
    type: "() => void",
    defaultValue: "undefined",
    options: "无参数",
    description: "停止并清理 logger 资源。",
  },
  "BiuLoggerOptions.disableConsole": {
    type: "boolean | ConsoleMethod[]",
    defaultValue: "false",
    options: "true | false | 方法数组",
    description: "禁止全部或指定 console 方法。",
  },
  "BiuLoggerOptions.detectConsoleOpen": {
    type: "boolean",
    defaultValue: "false",
    options: "true | false",
    description: "启用最佳努力的 DevTools/Console 打开检测。",
  },
  "BiuLoggerOptions.onConsoleOpen": {
    type: "(event) => void",
    defaultValue: "undefined",
    options: "ConsoleOpenEvent",
    description: "检测到 console 访问时回调，可通知水印刷新。",
  },
  "BiuLoggerOptions.onWatermarkRefresh": {
    type: "() => void",
    defaultValue: "undefined",
    options: "无参数",
    description: "检测后节流通知业务刷新水印。",
  },
  "BiuLoggerOptions.refreshThrottleMs": {
    type: "number",
    defaultValue: "1200",
    options: "非负毫秒数",
    description: "限制检测回调和水印刷新的频率。",
  },
  "createWatermark.target": {
    type: "HTMLElement",
    defaultValue: "必填",
    options: "DOM 容器",
    description: "水印挂载容器。",
  },
  "createWatermark.text": {
    type: "string | string[]",
    defaultValue: "[]",
    options: "单行或多行文案",
    description: "重复绘制的水印文本。",
  },
  "createWatermark.color": {
    type: "string",
    defaultValue: "#64748b",
    options: "CSS color",
    description: "水印文字颜色。",
  },
  "createWatermark.opacity": { type: "number", defaultValue: "0.14", options: "0 - 1", description: "水印透明度。" },
  "WatermarkOptions.fontSize": {
    type: "number",
    defaultValue: "组件默认值",
    options: "正数像素",
    description: "水印字号。",
  },
  "WatermarkOptions.fontFamily": {
    type: "string",
    defaultValue: "系统字体",
    options: "CSS font-family",
    description: "水印字体。",
  },
  "WatermarkOptions.rotate": {
    type: "number",
    defaultValue: "组件默认值",
    options: "角度",
    description: "水印旋转角度。",
  },
  "WatermarkOptions.gap": {
    type: "[number, number]",
    defaultValue: "组件默认值",
    options: "横向/纵向像素间距",
    description: "重复水印之间的间隔。",
  },
  "WatermarkOptions.offset": {
    type: "[number, number]",
    defaultValue: "组件默认值",
    options: "横向/纵向像素偏移",
    description: "水印起始偏移。",
  },
  "WatermarkOptions.observeTamper": {
    type: "boolean",
    defaultValue: "false",
    options: "true | false",
    description: "监听水印 DOM 被移除或改写。",
  },
  "WatermarkOptions.refreshThrottleMs": {
    type: "number",
    defaultValue: "1200",
    options: "非负毫秒数",
    description: "限制篡改恢复刷新频率。",
  },
  "WatermarkHandle.update": {
    type: "(options) => void",
    defaultValue: "undefined",
    options: "部分 WatermarkOptions",
    description: "运行时更新水印配置。",
  },
  "WatermarkHandle.refresh": {
    type: "() => void",
    defaultValue: "undefined",
    options: "无参数",
    description: "主动重绘水印。",
  },
  "WatermarkHandle.destroy": {
    type: "() => void",
    defaultValue: "undefined",
    options: "无参数",
    description: "移除水印并清理观察器。",
  },
  "Logger 联动.onConsoleOpen": {
    type: "(event) => void",
    defaultValue: "undefined",
    options: "ConsoleOpenEvent",
    description: "把 logger 检测事件传递给业务。",
  },
  "Logger 联动.onWatermarkRefresh": {
    type: "() => void",
    defaultValue: "undefined",
    options: "无参数",
    description: "按节流策略触发水印刷新。",
  },
};

/**
 * Older capability pages were initially authored with compact grouped rows.
 * Keep that source data readable, but make the rendered documentation precise:
 * every slash-separated property becomes its own row and gets its own type,
 * default, allowed-values/parameters and example cell. New pages can provide
 * propertyDetails when one grouped entry needs non-positional metadata.
 */
export function normalizeCapabilityApiRows(rows: CapabilityApiRow[]) {
  return rows.flatMap((row) => {
    const components = splitComponentSegments(row.component);
    const names = splitApiSegments(row.name);
    return components.flatMap((component) => {
      if (names.length <= 1) {
        const common = commonApiPropertyDetails[row.name] ?? {};
        const specific = {
          ...frameworkApiPropertyDetails[`${component}.${row.name}`],
          ...frameworkApiPropertyDetails[`${row.component}.${row.name}`],
          ...row.propertyDetails?.[row.name],
        };
        return [
          {
            ...row,
            component,
            // Author-written or framework-specific metadata is authoritative;
            // common property guidance only fills a missing field. This keeps a
            // precise description from being replaced by a generic sentence.
            type: specific.type ?? row.type ?? common.type ?? "unknown",
            defaultValue: specific.defaultValue ?? row.defaultValue ?? common.defaultValue ?? "undefined",
            options: specific.options ?? row.options ?? common.options ?? inferredOptions(specific.type ?? row.type),
            description: specific.description ?? row.description ?? common.description ?? "",
            demo: specific.demo ?? row.demo,
            propertyDetails: undefined,
          },
        ];
      }
      const typeSegments = splitApiSegments(row.type);
      const defaultSegments = splitApiSegments(row.defaultValue);
      return names.map((name, index) => {
        const detail =
          row.propertyDetails?.[name] ??
          frameworkApiPropertyDetails[`${component}.${name}`] ??
          frameworkApiPropertyDetails[`${row.component}.${name}`] ??
          {};
        const type = detail.type ?? typeSegments[index] ?? row.type;
        const fallback = describeCapabilityProperty(component, name, type, row.description);
        return {
          ...row,
          component,
          name,
          type,
          defaultValue: detail.defaultValue ?? defaultSegments[index] ?? row.defaultValue,
          options: detail.options ?? row.options ?? fallback.options ?? inferredOptions(type),
          // For a real component row, the authored description is more useful
          // than the generic inferred sentence. The old order always selected
          // `fallback.description`, which made unrelated components inherit
          // text such as Progress/Tag/Table guidance.
          description: detail.description ?? row.description ?? fallback.description,
          demo: detail.demo ?? row.demo,
          propertyDetails: undefined,
        };
      });
    });
  });
}

function dedupeCapabilityApiRows(rows: CapabilityApiRow[]) {
  const unique = new Map<string, CapabilityApiRow>();
  for (const row of rows) {
    // A property can be authored once in a grouped row and once in an
    // explicit supplemental row. The rendered documentation must expose one
    // authoritative row per component/property pair.
    unique.set(`${row.component}::${row.name}`, row);
  }
  return [...unique.values()];
}

export const CapabilityApiTable = memo(function CapabilityApiTable({ rows }: { rows: CapabilityApiRow[] }) {
  const normalizedRows = useMemo(() => dedupeCapabilityApiRows(normalizeCapabilityApiRows(rows)), [rows]);
  const groupedRows = useMemo(() => {
    const groups = new Map<string, CapabilityApiRow[]>();
    normalizedRows.forEach((row) => {
      const group = groups.get(row.component) ?? [];
      group.push(row);
      groups.set(row.component, group);
    });
    return [...groups.entries()];
  }, [normalizedRows]);
  const columns: Column<CapabilityApiRow>[] = [
    { key: "component", title: "组件", dataIndex: "component", width: 150, fixed: "left" },
    { key: "name", title: "属性 / 方法", dataIndex: "name", width: 190 },
    { key: "type", title: "类型", dataIndex: "type", width: 220, ellipsis: true },
    { key: "defaultValue", title: "默认值", dataIndex: "defaultValue", width: 150, ellipsis: true },
    { key: "options", title: "可选值 / 参数", dataIndex: "options", width: 230, ellipsis: true },
    { key: "description", title: "效果与说明", dataIndex: "description", width: 360, ellipsis: true },
    { key: "demo", title: "案例", dataIndex: "demo", width: 190, ellipsis: true },
  ];
  return (
    <div className="biu-capability-table-wrap">
      {groupedRows.map(([component, componentRows]) => (
        <section className="biu-capability-component-api" key={component}>
          <h4>{component}</h4>
          <Table<CapabilityApiRow>
            columns={columns}
            dataSource={componentRows}
            rowKey={(row, index) => `${row.component}-${row.name}-${index}`}
            pagination={false}
            // API tables are documentation, not an inner data grid. Let the page
            // own vertical scrolling so every region has one predictable scroll
            // context; keep only horizontal overflow for the wide contract.
            scroll={{ x: 1490 }}
          />
        </section>
      ))}
    </div>
  );
});
CapabilityApiTable.displayName = "CapabilityApiTable";

export function CapabilityPage({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <main className={["biu-capability-page", className].filter(Boolean).join(" ")}>
      <PageBox title={title} description={description} actions={actions}>
        {children}
      </PageBox>
    </main>
  );
}

export function CapabilityCard({
  id,
  title,
  description,
  children,
  className,
}: {
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={["biu-capability-card", className].filter(Boolean).join(" ")}>
      <h2>{title}</h2>
      {description ? <p className="biu-capability-card__description">{description}</p> : null}
      {children}
    </section>
  );
}

export function CapabilityGrid({ children }: { children: ReactNode }) {
  return <div className="biu-capability-grid">{children}</div>;
}

export function CapabilityActions({ children }: { children: ReactNode }) {
  return <div className="biu-capability-actions">{children}</div>;
}
