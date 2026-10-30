import type { CapabilityPropertyDetail } from "./api-types.js";

export const commonApiPropertyDetails: Record<string, CapabilityPropertyDetail> = {
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
    description:
      "小于 560px 时只显示当前页；560–799px 保留完整页码但隐藏范围/总数；800px 起使用标准布局。小于 800px 时页大小与跳页控件均为 45px。",
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
    description: "选择后立即回传并保持面板打开；日期日历同步聚焦到目标月份，范围优先聚焦结束日期。",
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
    description: "显示确定按钮；选择仍即时触发 onChange，点击确定只关闭面板。",
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
