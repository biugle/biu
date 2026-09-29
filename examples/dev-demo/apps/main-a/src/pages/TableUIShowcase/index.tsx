import { useMemo, useState } from "react";
import { ProTable, Table, TableBox, useQueryTable, type Column, type BiuTableLocale } from "@biugle/react-table";
import {
  Button,
  ButtonList,
  PageFilter,
  PageFilterItem,
  Select,
  Tabs,
  Tag,
  TextField,
  biuMessage,
} from "@biugle/react-components";
import { useBiuContext } from "@biugle/biu-runtime";
import { Copy, Eye, Trash2 } from "@biugle/icons";
import {
  CapabilityApiTable,
  CapabilityActions,
  CapabilityCard,
  CapabilityGrid,
  CapabilityPage,
  type CapabilityApiRow,
} from "../CapabilityPage/index.js";
import "@biugle/react-table/styles.css";

type Row = { id: number; name: string; owner: string; status: string; version: string };
const rows: Row[] = [
  { id: 1, name: "LayoutFrame", owner: "Foundation", status: "ready", version: "0.1.0" },
  { id: 2, name: "Form.Item", owner: "Form", status: "ready", version: "0.1.0" },
  { id: 3, name: "useQueryTable", owner: "Table", status: "beta", version: "0.1.0" },
  { id: 4, name: "XHttp", owner: "HTTP", status: "ready", version: "0.1.0" },
  { id: 5, name: "Biu I18n", owner: "i18n", status: "ready", version: "0.1.0" },
  { id: 6, name: "Biu Query", owner: "Query", status: "beta", version: "0.1.0" },
];

type QueryRow = { id: number; name: string; category: string; state: string };
type QueryMode = "standard" | "legacy" | "error";

type ApiEntry = [name: string, type: string, defaultValue: string, description: string, demo: string];
const apiRows = (component: string, entries: ApiEntry[]): CapabilityApiRow[] =>
  entries.map(([name, type, defaultValue, description, demo]) => ({
    component,
    name,
    type,
    defaultValue,
    description,
    demo,
  }));

const tableApiRows = apiRows("Table", [
  ["columns", "Column<T>[]", "必填", "列树；叶子列决定实际单元格，多级 children 决定表头层级。", "name / ownerGroup"],
  ["dataSource", "T[]", "[]", "表格渲染的数据源；客户端筛选、排序和分页基于此数组计算。", "6 条能力"],
  [
    "rowKey",
    "keyof T | (record, index) => React.Key",
    "index",
    "为选择、展开和分页提供稳定行键；未传时使用数据源索引。",
    'rowKey="id"',
  ],
  ["loading", "boolean", "false", "显示加载态并替换当前行；不会清除外部 dataSource。", "加载状态"],
  ["error", "unknown", "undefined", "存在错误时显示 errorContent；可配合 ProTable 重试动作。", "模拟错误"],
  ["empty", "React.ReactNode", "locale.empty", "无数据时替换默认空态文案或组件。", "无数据"],
  ["loadingContent", "React.ReactNode", "locale.loading", "自定义加载态内容，适合接入 Loading 或 Skeleton。", "加载中"],
  [
    "errorContent",
    "React.ReactNode",
    "locale.errorRetry",
    "自定义错误态内容，通常放置 Alert/Result 和重试按钮。",
    "表格加载失败",
  ],
  ["className", "string", "undefined", "追加到表格根节点；组件仍保留 biu-table 前缀类。", "自定义根类"],
  [
    "classNames",
    "TableClassNames",
    "{}",
    "逐区域覆盖 table/header/body/row/cell/filter/pagination 等槽位类名。",
    "Table API 表",
  ],
  ["caption", "React.ReactNode", "undefined", "渲染表格 caption，提供可访问的表格摘要。", "能力清单"],
  ["stickyHeader", "boolean", "false", "让表头在滚动容器内保持顶部吸附，并保留 fixed 列层级。", "sticky header"],
  ["showHeader", "boolean", "true", "是否渲染表头、排序、筛选和列宽调整区域。", "显示表头"],
  [
    "pagination",
    "false | TablePagination",
    "undefined",
    "关闭分页或传入受控分页配置；客户端数据会按 current/pageSize 截取。",
    "分页与页大小",
  ],
  ["sorter", "TableSorter", "undefined", "受控排序字段和方向；传入后由外部保存排序状态。", "status asc"],
  [
    "onSorterChange",
    "(sorter?) => void",
    "undefined",
    "列排序循环变化时回调，未排序时参数为 undefined。",
    "点击能力名称",
  ],
  ["filters", "TableFilters", "{}", "受控筛选值；键为 Column.key，值为单值或多选值。", "团队筛选"],
  ["onFilterChange", "(filters) => void", "undefined", "内置/自定义筛选应用或清除后返回完整筛选对象。", "应用筛选"],
  [
    "onChange",
    "(pagination?, sorter?, filters?) => void",
    "undefined",
    "分页、排序或筛选任一状态变化时统一回调。",
    "状态回调",
  ],
  ["rowSelection", "TableRowSelection<T>", "undefined", "启用行复选框并控制选中键、选中行、全选和禁用行。", "清空选择"],
  ["expandable", "TableExpandable<T>", "undefined", "启用展开行并控制展开键、展开渲染和可展开条件。", "展开内容"],
  ["scroll", "TableScroll", "undefined", "设置 x/y 滚动尺寸；内部滚动区承载 fixed 列和 sticky header。", "x=680,y=360"],
  [
    "virtual",
    "boolean | TableVirtualOptions",
    "false",
    "启用 TanStack Virtual；仅滚动列表区域，需估算行高。",
    "overscan=8",
  ],
  ["layer", '"ui" | "pro"', '"ui"', "声明表格所在层级，用于选择对应的样式语义和 z-index。", "ProTable 自动传 pro"],
  [
    "onRow",
    "(record, index) => HTMLAttributes<HTMLTableRowElement>",
    "undefined",
    "为每行追加原生属性和事件，不替换 Table 的行状态。",
    "行事件",
  ],
  [
    "rowClassName",
    "string | (record, index) => string",
    "undefined",
    "为数据行追加类名；可根据记录返回不同状态类。",
    "状态行",
  ],
  ["expandedRowClassName", "string | (record, index) => string", "undefined", "为展开内容行追加类名。", "展开行"],
  ["summary", "(data: T[]) => React.ReactNode", "undefined", "在当前展示数据之后渲染汇总区域。", "当前数据 6 条"],
  [
    "footer",
    "React.ReactNode",
    "undefined",
    "渲染在表格滚动区与 Pagination 之间的独立扩展区域；不会混入 Toolbar、表格行或分页状态。",
    "清空选择",
  ],
  ["columnWidths", "Record<string, number | string>", "undefined", "受控列宽映射，键为 Column.key。", "受控列宽"],
  ["defaultColumnWidths", "Record<string, number | string>", "{}", "非受控列宽的初始值。", "默认宽度"],
  ["onColumnWidthsChange", "(widths) => void", "undefined", "列宽受控变化时返回完整列宽映射。", "列宽变化"],
  [
    "onColumnResize",
    "(key, width) => void",
    "undefined",
    "拖动可调整叶子列的手柄后返回列 key 和不小于 minWidth 的宽度。",
    "拖动表头",
  ],
  ["components", "TableComponents", "{}", "替换 table/header/body/row/cell 元素类型；不会改变数据状态。", "自定义元素"],
  ["locale", '"zh-CN" | "en-US"', '"zh-CN"', "选择分页、空态、筛选和选择相关的默认文案。", "中文默认"],
  ["localeText", "BiuTableLocaleTextOverrides", "{}", "逐项覆盖表格包内置文案。", "自定义 empty"],
]);

const columnApiRows = apiRows("Column", [
  ["key", "string", "必填", "列的稳定唯一键，用于排序、筛选、列宽、显示隐藏和列设置持久化。", "status"],
  ["title", "React.ReactNode", "必填", "表头显示内容；支持图标、Tooltip 或自定义 ReactNode。", "状态"],
  [
    "dataIndex",
    "keyof T | string",
    "undefined",
    "从记录读取单元格值的路径；不传时可完全使用 render/renderCell。",
    "name",
  ],
  ["width", "number | string", "undefined", "列宽；数字按像素处理，参与 fixed 偏移和滚动布局。", "180"],
  ["align", '"left" | "center" | "right"', '"left"', "设置表头和单元格的文本对齐方式。", "版本居中"],
  [
    "render",
    "(value, record, index) => ReactNode",
    "undefined",
    "将原始值转换为单元格内容；ellipsis 会包裹最终内容。",
    "Tag 状态",
  ],
  [
    "renderCell",
    "(value, record, index) => ReactNode",
    "undefined",
    "render 的显式别名，优先级高于 render，便于表达单元格渲染。",
    "自定义单元格",
  ],
  ["children", "Column<T>[]", "undefined", "创建多级表头；父列只参与表头，叶子列参与数据单元格。", "归属信息"],
  ["sortable", "boolean", "false", "启用内置升序/降序/取消排序循环。", "能力名称"],
  ["sorter", "boolean | (left, right) => number", "false", "boolean 启用排序；函数为客户端比较器。", "自定义比较"],
  ["sortField", "string", "key", "向 onSorterChange 暴露的服务端排序字段名。", "createdAt"],
  [
    "filters",
    "ColumnFilterOption[]",
    "undefined",
    "声明内置筛选选项；选项支持 label、value、disabled。",
    "ready / beta",
  ],
  ["filterMultiple", "boolean", "false", "允许一次选择多个 filters；多选值通过数组传递。", "团队多选"],
  [
    "filterRender",
    "(options, value, onChange) => ReactNode",
    "undefined",
    "在表头内渲染自定义筛选控件；适合不需要弹层的简单场景。",
    "内嵌筛选",
  ],
  [
    "filterDropdown",
    "(context) => ReactNode",
    "undefined",
    "替换默认筛选面板；context 提供 selectedKeys、confirm、clearFilters、close。",
    "Select 筛选面板",
  ],
  [
    "filterIcon",
    "ReactNode | (filtered) => ReactNode",
    "Filter",
    "替换筛选按钮图标；函数可根据当前是否已筛选改变图标。",
    "高亮筛选",
  ],
  [
    "ellipsis",
    "boolean | { tooltip?; maxWidth? }",
    "false",
    "超出时使用公共 Ellipsis；可控制 Tooltip 和特殊最大宽度。",
    "长标题",
  ],
  ["colSpan", "number | (record?) => number", "undefined", "设置表头/单元格横向合并数量。", "合并单元格"],
  ["rowSpan", "number | (record) => number", "undefined", "设置数据单元格纵向合并数量。", "跨行"],
  [
    "fixed",
    '"left" | "right"',
    "undefined",
    "将列固定在滚动容器左右；固定单元格保持不透明背景和正确层级。",
    "固定左列",
  ],
  ["resizable", "boolean", "true", "是否允许该叶子列拖动调整宽度；默认开启，设置 false 可关闭。", "关闭调整"],
  ["minWidth", "number", "72", "列宽拖动时允许的最小像素宽度。", "最小 120"],
  ["className", "string", "undefined", "追加到该列 header/cell 的类名。", "列样式"],
  ["hidden", "boolean", "false", "隐藏列；ProTable 列设置默认也会将 hidden 排除。", "隐藏列"],
]);

const filterDropdownApiRows = apiRows("TableFilterDropdownContext", [
  ["selectedKeys", "React.Key[]", "当前已应用值", "当前列已应用或待应用的筛选键。", "回显选择"],
  ["setSelectedKeys", "(keys: React.Key[]) => void", "-", "更新待应用值，不立即关闭筛选面板。", "Select onChange"],
  [
    "confirm",
    "(options?: { closeDropdown?: boolean }) => void",
    "关闭面板",
    "应用待选值；closeDropdown=false 时保留面板打开。",
    "应用",
  ],
  ["clearFilters", "() => void", "-", "清空当前列筛选并关闭面板。", "清除"],
  ["close", "() => void", "-", "关闭面板但不改变已应用筛选值。", "取消"],
  ["filters", "ColumnFilterOption[] | undefined", "undefined", "当前列声明的可选项。", "团队选项"],
]);

const paginationApiRows = apiRows("TablePagination", [
  ["current", "number", "必填", "当前页码，从 1 开始。", "current=1"],
  ["pageSize", "number", "必填", "当前页大小；与 showSizeChanger 一起控制每页条数。", "4 条/页"],
  ["total", "number", "必填", "总记录数；服务端分页时由接口返回。", "6 条"],
  ["onChange", "(current, pageSize) => void", "undefined", "页码或页大小变化时回调。", "翻页"],
  ["onShowSizeChange", "(current, pageSize) => void", "undefined", "页大小下拉变化时单独回调。", "10/20 条"],
  [
    "pageSizeOptions",
    "number[]",
    "[10, 20, 50, 100]",
    "页大小下拉选项；当前 pageSize 不在其中时会保留当前值。",
    "选择页大小",
  ],
  ["showSizeChanger", "boolean", "true", "是否展示页大小选择器。", "每页条数"],
  ["showQuickJumper", "boolean", "false", "是否显示输入页码并支持回车快速跳转。", "快速跳转"],
  ["showTotal", "(total, range) => ReactNode", "undefined", "自定义总数和当前范围文案。", "第 1-4 条"],
  ["simple", "boolean", "false", "切换为简洁上一页/下一页布局。", "simple"],
  ["responsive", "boolean", "false", "窄屏时压缩页码布局和可见控件。", "响应式"],
  ["hideOnSinglePage", "boolean", "false", "总页数不超过 1 时隐藏分页器。", "单页隐藏"],
  ["showLessItems", "boolean", "false", "减少中间页码数量，保留首尾和当前附近页。", "少页码"],
  [
    "itemRender",
    "(page, type, element) => ReactNode",
    "默认元素",
    "自定义 page/prev/next 三类页码节点。",
    "自定义箭头",
  ],
  ["previousText", "React.ReactNode", "上一页", "上一页按钮的文案或图标。", "上一页"],
  ["nextText", "React.ReactNode", "下一页", "下一页按钮的文案或图标。", "下一页"],
  ["locale", '"zh-CN" | "en-US"', '"zh-CN"', "分页局部语言。", "中文"],
  ["localeText", "BiuTableLocaleTextOverrides", "{}", "覆盖分页局部文案。", "页大小文案"],
]);

const selectionApiRows = apiRows("TableRowSelection", [
  ["selectedRowKeys", "React.Key[]", "必填", "受控选中行键；传入后由外部维护选中状态。", "selected"],
  ["onChange", "(keys, rows) => void", "必填", "单行或全选变化后返回键和当前页对应的行。", "清空选择"],
  ["onSelect", "(record, selected, rows) => void", "undefined", "单行切换后触发。", "单行勾选"],
  ["onSelectAll", "(selected, rows, changedRows) => void", "undefined", "全选/取消全选后返回当前页和变化行。", "全选"],
  [
    "getCheckboxProps",
    "(record) => { disabled?; aria-label? }",
    "undefined",
    "按记录禁用复选框或设置可访问名称。",
    "禁用行",
  ],
  ["preserveSelectedRowKeys", "boolean", "false", "数据源变化或分页后是否保留不存在于当前页的已选键。", "跨页选择"],
]);

const expandableApiRows = apiRows("TableExpandable", [
  ["expandedRowKeys", "React.Key[]", "undefined", "受控展开行键。", "受控展开"],
  ["defaultExpandedRowKeys", "React.Key[]", "[]", "非受控模式的初始展开行键。", "默认展开"],
  ["onExpandedRowsChange", "(keys) => void", "undefined", "展开键变化时返回完整键数组。", "展开状态"],
  ["expandedRowRender", "(record, index) => ReactNode", "必填", "渲染展开行内容。", "维护信息"],
  ["rowExpandable", "(record) => boolean", "全部可展开", "按记录决定是否显示展开按钮。", "可展开条件"],
]);

const tableOptionsApiRows = [
  ...apiRows("TableScroll", [
    ["x", "number | string", "undefined", "横向滚动尺寸；fixed 列在该容器中吸附。", "680"],
    ["y", "number | string", "undefined", "纵向滚动尺寸；虚拟列表使用该滚动容器。", "360"],
  ]),
  ...apiRows("TableVirtualOptions", [
    ["height", "number | string", "滚动容器高度", "虚拟列表可用高度提示。", "360px"],
    ["estimateSize", "number", "44", "虚拟行初始高度估算，用于定位和滚动计算。", "44"],
    ["overscan", "number", "5", "视口上下额外渲染的行数，越大越平滑但占用更多 DOM。", "8"],
  ]),
  ...apiRows("TableClassNames", [
    ["root", "string", "undefined", "表格根节点类名。", "根样式"],
    ["table", "string", "undefined", "原生 table 元素类名。", "表格元素"],
    ["header", "string", "undefined", "表头区域类名。", "表头"],
    ["headerCell", "string", "undefined", "表头单元格类名。", "表头单元格"],
    ["body", "string", "undefined", "tbody 区域类名。", "表体"],
    ["row", "string", "undefined", "数据行类名。", "数据行"],
    ["cell", "string", "undefined", "单元格类名。", "单元格"],
    [
      "footer",
      "string",
      "undefined",
      "调用方 footer 区域类名；只作用于表格 footer，不改变 pagination 类名。",
      "footer",
    ],
    ["pagination", "string", "undefined", "分页区域类名。", "分页"],
    ["empty", "string", "undefined", "空态行类名。", "空态"],
    ["loading", "string", "undefined", "加载行类名。", "加载态"],
    ["error", "string", "undefined", "错误行类名。", "错误态"],
    ["expanded", "string", "undefined", "展开行类名。", "展开行"],
    ["summary", "string", "undefined", "汇总区域类名。", "汇总"],
    ["filter", "string", "undefined", "筛选面板类名。", "筛选"],
    ["resizeHandle", "string", "undefined", "列宽拖动手柄类名。", "拖动手柄"],
  ]),
];

const pageFilterApiRows = apiRows("PageFilter", [
  [
    "children",
    "React.ReactNode",
    "undefined",
    "PageFilter.Item 字段；主区域根据容器宽度计算等分 Grid 列数，字段和 actions 各占完整格子，超过 maxRows 的字段仍保留在 DOM 中供 Drawer 复用。",
    "关键字 / 状态",
  ],
  [
    "actions",
    "React.ReactNode",
    "undefined",
    "右侧操作区；组件只负责布局、对齐和间距，调用方负责按钮事件与受控查询状态。",
    "更多 / 重置 / 查询",
  ],
  [
    "moreFields",
    "React.ReactNode",
    "undefined",
    "追加到完整筛选 Drawer 的字段；与可见字段共同组成 Drawer 内容。",
    "负责人 / 版本",
  ],
  [
    "moreLabel",
    "React.ReactNode",
    "更多",
    "高级筛选入口按钮的文案；字符串和数字会经 Ellipsis 包裹，只有发生溢出时才显示 Tooltip。",
    "更多",
  ],
  [
    "includeVisibleFieldsInDrawer",
    "boolean",
    "true",
    "是否把主区域可见字段也放入 Drawer；保持两处使用同一份受控状态，设为 false 才只展示 additional fields。",
    "完整筛选区",
  ],
  ["maxRows", "number", "2", "主筛选区最多显示的行数；超过行数的字段由 autoCollapse 收敛到 Drawer。", "最多两行"],
  [
    "autoCollapse",
    "boolean",
    "true",
    "自动根据实际字段换行检测是否溢出；溢出时显示更多筛选按钮，字段仍使用相同的受控状态。",
    "超出后更多",
  ],
  [
    "moreButtonProps",
    'Omit<React.ComponentProps<typeof Button>, "children" | "onClick">',
    "secondary + outlined + small",
    "覆写高级筛选入口；标准 CRUD 页面应保持 secondary outlined、small、与其他操作按钮同宽。",
    "更多",
  ],
  [
    "drawerTitle",
    "React.ReactNode",
    "更多筛选",
    "完整筛选 Drawer 的标题；不改变 Drawer 的关闭、取消和确定行为。",
    "更多筛选条件",
  ],
  [
    "drawerWidth",
    '"small" | "medium" | "large" | number',
    '"large"',
    "设置完整筛选 Drawer 宽度；large 是默认宽度，适合两列字段布局。",
    "约 720px",
  ],
  [
    "drawerOpen / defaultDrawerOpen",
    "boolean",
    "false",
    "分别控制受控和非受控 Drawer 初始打开状态；受控模式需配合 onDrawerOpenChange 回写。",
    "打开完整筛选",
  ],
  [
    "onDrawerOpenChange",
    "(open: boolean) => void",
    "undefined",
    "Drawer 打开或关闭后回调；取消、确定、关闭图标和遮罩关闭都会进入同一状态通道。",
    "同步 Drawer 状态",
  ],
  [
    "drawerFooter",
    "React.ReactNode",
    "Drawer 默认取消 / 确定",
    "覆盖 Drawer 底部操作区；未传时保留标准带 padding 的取消和确定按钮。",
    "底部操作",
  ],
  [
    "drawerProps",
    'Omit<ProDrawerProps, "open" | "children" | "title" | "footer" | "size">',
    "{}",
    "透传 Drawer 的 placement、maskClosable、fullscreen、classNames 等配置；open/title/footer/size 由 PageFilter 管理。",
    "Drawer 行为覆写",
  ],
  ["className", "string", "undefined", "追加到 PageFilter 根节点并保留 biu-pro-page-filter 前缀类。", "根样式"],
  [
    "classNames",
    "PageFilterClassNames",
    "{}",
    "按 root、fields、actions、more、drawer、drawerPanel、drawerBody、drawerFooter 分别追加样式类。",
    "区域样式",
  ],
]);

const pageFilterItemApiRows = apiRows("PageFilterItem", [
  [
    "label",
    "React.ReactNode",
    "必填",
    "浮在唯一控件边框左上角的字段标题；白底和约 4px 圆角用于遮住边框而不创建第二层框。",
    "关键字",
  ],
  ["required", "boolean", "false", "在 label 后渲染必填标记；不改变控件宽度、高度或提交校验。", "必填字段"],
  [
    "children",
    "React.ReactNode",
    "undefined",
    "放置 TextField、Select、DatePicker 等实际筛选控件；控件保持自身边框，默认占满 item 宽度。",
    "Select",
  ],
  [
    "className",
    "string",
    "undefined",
    "追加到 item 根 label 节点，保留 biu-pro-page-filter__item 前缀类。",
    "自定义 item",
  ],
  [
    "classNames",
    "{ root?; label?; field? }",
    "{}",
    "分别覆盖 item、浮动 label 和 field 包装区域；不会移除子控件的组件前缀类。",
    "区域样式",
  ],
]);

const proTableApiRows = apiRows("ProTable", [
  [
    "classNames",
    "ProTableClassNames",
    "{}",
    "除 Table 槽位外支持 root、toolbar、toolbarLeft、toolbarRight、batchActions、selectedCount、columnSettings、tableRoot。",
    "页面级样式",
  ],
  ["toolbar", "React.ReactNode", "undefined", "追加到 toolbarLeft 的工具栏内容。", "工具栏"],
  [
    "toolbarLeft",
    "React.ReactNode",
    "undefined",
    "工具栏左侧内容，适合标题、已选数量、批量动作和快速筛选；与表格状态解耦。",
    "能力清单",
  ],
  ["toolbarRight", "React.ReactNode", "undefined", "工具栏右侧内容，排在内置动作之后。", "扩展动作"],
  [
    "showColumnSettings",
    "boolean",
    "true",
    "是否显示列设置；列设置负责显示隐藏和非固定列上移/下移排序，默认工具组使用 secondary contained 的居中图标按钮。",
    "列设置",
  ],
  ["columnKeys", "string[]", "undefined", "受控可见列键顺序；外部必须在 onColumnKeysChange 后保存新数组。", "受控顺序"],
  ["defaultColumnKeys", "string[]", "非 hidden 列", "非受控模式的初始列键顺序。", "默认列"],
  [
    "onColumnKeysChange",
    "(keys: string[]) => void",
    "undefined",
    "列显示/隐藏或上移/下移排序后返回完整键顺序。",
    "排序后顺序",
  ],
  [
    "columnStorageKey",
    "string",
    "undefined",
    "使用 localStorage 持久化列显示和排序；存储失败不会阻断表格。",
    "持久化列设置",
  ],
  ["density", '"compact" | "default" | "comfortable"', '"default"', "控制表格行的纵向密度。", "紧凑/默认/宽松"],
  [
    "showDensity",
    "boolean",
    "false",
    "是否在工具栏显示紧凑/默认/宽松密度菜单；关闭时不渲染密度按钮，显示时使用 secondary contained 的居中图标按钮。",
    "紧凑设置",
  ],
  [
    "showFullscreen",
    "boolean",
    "true",
    "是否在工具栏显示全屏切换按钮；可与列设置、密度工具独立关闭，显示时使用 secondary contained 的居中图标按钮。",
    "全屏",
  ],
  [
    "onDensityChange",
    "(density) => void",
    "undefined",
    "密度菜单选择后回调新的密度值；与 density 一起使用时由调用方受控。",
    "density 回调",
  ],
  [
    "batchActions",
    "ProTableBatchAction<T>[]",
    "[]",
    "批量动作配置；无选中行时默认禁用，支持异步 loading 和 danger。",
    "批量通过",
  ],
  [
    "onActionError",
    "(error, action) => void",
    "undefined",
    "批量动作异常时回调；新增、导出等业务动作由 toolbarRight 自行管理。",
    "动作异常",
  ],
  [
    "toolbarActions",
    "React.ReactNode",
    "undefined",
    "追加到工具栏右侧末尾的自定义内容；组件不内置新增、导出或刷新按钮。",
    "更多动作",
  ],
  ["fullscreen", "boolean", "false", "受控全屏状态；全屏时 ProTable 固定覆盖可用视口。", "全屏"],
  ["onFullscreenChange", "(fullscreen: boolean) => void", "undefined", "全屏切换后的受控状态回调。", "进入/退出全屏"],
  ["localeText", "BiuTableLocaleTextOverrides", "{}", "覆盖列设置、密度、全屏和批量选择等结构工具文案。", "中文文案"],
]);

const columnSettingsApiRows = apiRows("TableColumnSettings", [
  ["columns", "Column<T>[]", "必填", "用于生成列设置项；只处理叶子列，fixed 列保持原位置且不可隐藏或排序。", "列列表"],
  ["value", "string[]", "undefined", "受控的可见列键和顺序；配合 onChange 保存显示隐藏与上移/下移结果。", "受控列顺序"],
  ["defaultValue", "string[]", "非 hidden 列", "非受控模式初始可见列键和顺序。", "默认列"],
  [
    "onChange",
    "(keys: string[]) => void",
    "undefined",
    "列显示隐藏或非 fixed 列上移/下移完成后返回完整键顺序。",
    "上移/下移排序",
  ],
  ["storageKey", "string", "undefined", "使用 localStorage 持久化列可见性和顺序；存储失败不会阻断表格。", "持久化"],
  ["iconOnly", "boolean", "false", "只显示列设置图标按钮并通过 Tooltip 说明；false 时显示标题文本。", "工具栏图标"],
  ["className", "string", "undefined", "追加到列设置根节点，保留 biu-pro-table 前缀类。", "自定义样式"],
]);

const columnOrderApiRows = apiRows("reorderColumnKeysAt", [
  [
    "keys",
    "string[]",
    "必填",
    "当前可见叶子列键顺序；函数不会修改传入数组，而是返回新的顺序数组。",
    "[name, owner, status]",
  ],
  ["sourceKey", "string", "必填", "需要移动的非 fixed 列键；不存在或与 targetKey 相同则原样返回。", "owner"],
  ["targetKey", "string", "必填", "作为占位参照的非 fixed 列键；拖动时由当前指针所在 item 提供。", "status"],
  [
    "position",
    '"before" | "after"',
    '"before"',
    "决定 sourceKey 插入 targetKey 前还是后；列设置面板用该值绘制前后虚线占位。",
    "before / after",
  ],
]);

const buttonListApiRows = apiRows("ButtonList", [
  [
    "items",
    "ButtonListItem[]",
    "必填",
    "完整的语义动作列表；列表负责显示、Tooltip、禁用和溢出收敛。",
    "查看/复制/移除",
  ],
  [
    "maxCount",
    "number",
    "undefined",
    "最多可见槽位，包含 ellipsis 溢出按钮；超出项自动放入 DropdownMenu，maxCount=3 时显示前 2 项和第 3 个省略按钮。",
    "maxCount=3",
  ],
  [
    "iconOnly",
    "boolean",
    "false",
    "仅在表格默认操作列等明确场景设为 true；可见动作变为方形 icon-only 按钮并使用 Tooltip，Toolbar 自定义动作默认保留图标和文本。",
    "操作列 icon-only",
  ],
  ["className", "string", "undefined", "追加到 ButtonList 根节点，保留 biu-ui-button-list 前缀类。", "动作间距"],
  ["overflowLabel", "React.ReactNode", "更多操作", "溢出按钮的 Tooltip 和无障碍名称文案。", "更多操作"],
  [
    "overflowIcon",
    "React.ReactNode",
    "MoreHorizontal",
    "替换溢出按钮图标；按钮仍保留 secondary contained small 语义，菜单项只显示文本。",
    "省略图标",
  ],
  [
    "ButtonListItem.onClick",
    "() => void",
    "undefined",
    "动作被直接点击或从溢出菜单选择时执行；不伪造 MouseEvent。",
    "消息反馈",
  ],
  [
    "ButtonListItem.icon",
    "React.ReactNode",
    "undefined",
    "动作图标；默认与文本一起渲染，只有 ButtonList 的 iconOnly=true 且该动作有图标时才变为 icon-only 并使用 Tooltip。",
    "Eye",
  ],
  [
    "ButtonListItem.buttonProps",
    "Omit<ButtonProps, ...>",
    "{}",
    "覆写单个按钮的 size/type/variant/disabled 等属性；默认 secondary contained small。",
    "按钮覆写",
  ],
]);

const proBatchApiRows = apiRows("ProTableBatchAction", [
  ["key", "string", "必填", "批量动作稳定唯一键，也用于 pendingAction 和错误回调。", "approve"],
  ["label", "React.ReactNode", "必填", "动作按钮显示内容。", "批量通过"],
  ["icon", "React.ReactNode", "undefined", "动作按钮前的图标。", "Check"],
  ["danger", "boolean", "false", "使用 error 语义色渲染危险操作。", "批量移除"],
  ["disabled", "boolean | (context) => boolean", "false", "静态或按选中上下文计算禁用状态。", "无选中禁用"],
  [
    "onClick",
    "(context) => void | Promise<void>",
    "必填",
    "接收 selectedKeys、selectedRows、dataSource 的同步/异步动作。",
    "批量动作",
  ],
]);

const queryTableApiRows = apiRows("useQueryTable", [
  [
    "queryKey",
    "readonly unknown[]",
    "必填",
    "标识查询缓存边界；分页是否纳入由 includePaginationInQueryKey 控制。",
    "demo/table-capabilities",
  ],
  ["params", "P", "{}", "请求业务参数；变化时可按 resetPaginationOnParamsChange 重置到第一页。", "keyword"],
  ["enabled", "boolean", "true", "false 时不发起请求并将 loading/isFetching 置为 false。", "按条件查询"],
  [
    "initialPagination",
    "Partial<QueryPagination>",
    "current=1,pageSize=20",
    "设置初始 current/pageSize/total。",
    "pageSize=5",
  ],
  ["initialSorter", "TableSorter", "undefined", "设置首次请求使用的排序状态。", "name ascend"],
  ["initialFilters", "TableFilters", "{}", "设置首次请求使用的筛选状态。", "status=ready"],
  [
    "queryFn",
    "(context: QueryTableContext<P>) => Promise | value",
    "必填",
    "请求函数；context 提供 pagination、params、sorter、filters、signal、queryKey、queryParams。",
    "标准/legacy",
  ],
  [
    "selectResponse",
    "(response) => QueryTableResponse<T>",
    "内置归一化",
    "覆盖 data.items/total 和 results/pagination.totalResult 的响应转换。",
    "自定义响应",
  ],
  ["resetPaginationOnParamsChange", "boolean", "true", "params 变化时将 current 重置为 1。", "应用关键词"],
  ["keepPreviousData", "boolean", "true", "请求期间保留上一页数据；false 时清空并显示 loading。", "查询中"],
  ["refetchInterval", "number | false", "false", "大于 0 时按毫秒定时 refresh；默认不轮询。", "定时刷新"],
  ["resetOnUnmount", "boolean", "false", "声明卸载时清理本地查询状态的契约；请求始终会 abort。", "抽屉卸载"],
  [
    "paginationParamNames",
    "{ current?; pageSize?; total? }",
    "currentPage/showCount/total",
    "自定义发送给接口的分页参数名。",
    "历史接口",
  ],
  [
    "includePaginationInQueryKey",
    "boolean",
    "true",
    "决定 queryFn context.queryKey 是否追加 current/pageSize。",
    "缓存边界",
  ],
  ["onSuccess", "(response) => void", "undefined", "响应归一化成功后回调 QueryTableResponse<T>。", "成功统计"],
  ["onError", "(error) => void", "undefined", "请求未被取消且失败后回调原始错误。", "模拟 500"],
  [
    "tableProps",
    "TableProps<T>",
    "运行时生成",
    "可直接展开到 Table，包含 dataSource/loading/error/pagination/sorter/filters 和变更回调。",
    "Table {...tableProps}",
  ],
  [
    "query",
    "{ data; isLoading; isFetching; error; refetch; cancel; status }",
    "运行时生成",
    "面向查询状态的对象；cancel 会 abort 当前请求，refetch 触发新请求。",
    "取消 / 重试",
  ],
  ["setParams", "(next: P | (current: P) => P) => void", "-", "更新业务参数并重置分页到第一页。", "应用参数"],
  ["resetParams", "() => void", "-", "恢复初始参数、排序、筛选和分页并重新查询。", "重置查询"],
  ["setSorter", "(sorter?: TableSorter) => void", "-", "更新排序并重置分页。", "服务端排序"],
  ["setFilters", "(filters | updater) => void", "-", "更新筛选并重置分页。", "服务端筛选"],
  ["setPagination", "(partial: Partial<QueryPagination>) => void", "-", "局部更新分页状态。", "切页"],
  ["resetPagination", "() => void", "-", "只将 current 重置为 1。", "回到第一页"],
  [
    "refresh",
    "(options?: { resetCurrentPage?: boolean }) => void",
    "-",
    "增加查询版本并重新请求；可选重置当前页。",
    "重试 / 刷新",
  ],
  ["cancel", "(reason?: unknown) => void", "-", "取消当前 AbortController 并清除 loading/fetching 状态。", "取消请求"],
]);

const queryLifecycleApiRows = apiRows("QueryTableContext / 状态", [
  [
    "pagination",
    "QueryPagination",
    "current=1,pageSize=20,total=0",
    "queryFn 收到的分页状态和 hook 对外暴露的当前分页。",
    "生命周期卡片",
  ],
  ["sorter", "TableSorter | undefined", "undefined", "当前服务端排序状态。", "排序"],
  ["filters", "TableFilters", "{}", "当前服务端筛选状态。", "筛选"],
  ["signal", "AbortSignal", "每次请求新建", "用于取消旧请求、组件卸载请求和手动 cancel。", "AbortController"],
  [
    "queryParams",
    "Record<string, unknown>",
    "currentPage/showCount/total",
    "按 paginationParamNames 生成的接口分页参数。",
    "兼容旧接口",
  ],
  ["loading", "boolean", "enabled", "首屏请求或不保留旧数据时为 true；请求完成、失败或取消后为 false。", "首屏加载"],
  [
    "isFetching",
    "boolean",
    "enabled",
    "任意请求进行中为 true，包括保留上一页数据的后台刷新；请求结束或取消后为 false。",
    "后台刷新",
  ],
  ["error", "unknown | undefined", "undefined", "最近一次未取消请求的原始错误。", "error 模式"],
  ["status", '"pending" | "success" | "error"', '"pending"', "query.status 的标准状态值。", "状态 Tag"],
]);

const tableRegionApiRows = [
  ...tableApiRows,
  ...columnApiRows,
  ...filterDropdownApiRows,
  ...paginationApiRows,
  ...selectionApiRows,
  ...expandableApiRows,
  ...tableOptionsApiRows,
  ...pageFilterApiRows,
  ...pageFilterItemApiRows,
];
const proTableRegionApiRows = [
  ...proTableApiRows,
  ...proBatchApiRows,
  ...columnSettingsApiRows,
  ...columnOrderApiRows,
  ...buttonListApiRows,
];

function waitForQuery(signal: AbortSignal, delay = 420) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, delay);
    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

function QueryTableExample({ locale }: { locale?: BiuTableLocale }) {
  const [keywordInput, setKeywordInput] = useState("");
  const [params, setParams] = useState({ keyword: "" });
  const [mode, setMode] = useState<QueryMode>("standard");
  const [lastAction, setLastAction] = useState("尚未执行取消或重试");
  const columns = useMemo<Column<QueryRow>[]>(
    () => [
      { key: "id", title: "ID", dataIndex: "id", width: 80 },
      { key: "name", title: "名称", dataIndex: "name", sortable: true },
      { key: "category", title: "分类", dataIndex: "category" },
      {
        key: "state",
        title: "状态",
        dataIndex: "state",
        render: (value) => <Tag color="success">{String(value)}</Tag>,
      },
    ],
    [],
  );
  const table = useQueryTable<QueryRow, { keyword: string }>({
    queryKey: ["demo", "table-capabilities", mode],
    params,
    initialPagination: { pageSize: 5 },
    queryFn: async ({ pagination, signal }) => {
      await waitForQuery(signal);
      if (mode === "error") throw new Error("模拟接口返回 500");
      const allItems = Array.from({ length: 17 }, (_, index) => ({
        id: index + 1,
        name: `Query Row ${index + 1}`,
        category: index % 2 ? "business" : "platform",
        state: "ready",
      }));
      const items = allItems.filter((item) =>
        params.keyword ? item.name.toLowerCase().includes(params.keyword.toLowerCase()) : true,
      );
      const start = (pagination.current - 1) * pagination.pageSize;
      const page = items.slice(start, start + pagination.pageSize);
      return mode === "legacy"
        ? { results: page, pagination: { totalResult: items.length } }
        : { data: { items: page, total: items.length } };
    },
  });

  return (
    <CapabilityGrid>
      <CapabilityCard
        title="useQueryTable 查询示例"
        description="查询状态、取消、重试和响应归一化都在同一个 Table 能力页中展示。"
      >
        <div className="biu-capability-control-row">
          <TextField
            value={keywordInput}
            placeholder="按名称筛选"
            aria-label="查询关键词"
            onChange={(event) => setKeywordInput(event.target.value)}
            allowClear
            onClear={() => setKeywordInput("")}
          />
          <Select
            value={mode}
            aria-label="响应模式"
            options={[
              { value: "standard", label: "标准 data/items/total" },
              { value: "legacy", label: "兼容 results/pagination.totalResult" },
              { value: "error", label: "模拟错误" },
            ]}
            onChange={(value) => setMode(String(value ?? "standard") as QueryMode)}
          />
          <Button
            size="small"
            onClick={() => {
              setParams({ keyword: keywordInput });
              setLastAction("已应用查询参数");
            }}
          >
            应用参数
          </Button>
        </div>
        <div className="biu-capability-table-wrap" style={{ marginTop: 12 }}>
          <Table<QueryRow> columns={columns} locale={locale} {...table.tableProps} />
        </div>
        <CapabilityActions>
          <Button
            size="small"
            variant="secondary"
            onClick={() => {
              void table.refresh({ resetCurrentPage: true });
              setLastAction("已重新查询");
            }}
          >
            重试 / 刷新
          </Button>
          <Button
            size="small"
            variant="ghost"
            disabled={!table.isFetching}
            onClick={() => {
              table.query.cancel();
              setLastAction("已取消当前请求");
            }}
          >
            取消请求
          </Button>
          <span>
            {table.isFetching ? "查询中…" : `当前 ${table.pagination.current} 页，共 ${table.pagination.total} 条`}
          </span>
          <span>最近动作：{lastAction}</span>
        </CapabilityActions>
        <div className="biu-capability-region-api">
          <div className="biu-capability-region-api__block">
            <h3>useQueryTable 查询区域 API</h3>
            <CapabilityApiTable rows={queryTableApiRows} />
          </div>
        </div>
      </CapabilityCard>
      <CapabilityCard
        title="查询生命周期"
        description="请求函数可接入任意 HTTP 客户端，Table 只消费统一的 tableProps。"
      >
        <dl>
          <div>
            <dt>queryKey</dt>
            <dd>{JSON.stringify(["demo", "table-capabilities", mode])}</dd>
          </div>
          <div>
            <dt>参数</dt>
            <dd>{params.keyword || "（空）"}</dd>
          </div>
          <div>
            <dt>状态</dt>
            <dd>
              <Tag color={table.error ? "danger" : table.isFetching ? "warning" : "success"}>
                {table.error ? "error" : table.isFetching ? "fetching" : "success"}
              </Tag>
            </dd>
          </div>
        </dl>
        <p>参数、排序、筛选或分页变化时会取消旧请求；组件卸载时也会释放 AbortController。</p>
        <div className="biu-capability-region-api">
          <div className="biu-capability-region-api__block">
            <h3>查询生命周期 API</h3>
            <CapabilityApiTable rows={queryLifecycleApiRows} />
          </div>
        </div>
      </CapabilityCard>
    </CapabilityGrid>
  );
}

function FilterLayoutExamples() {
  const actions = (
    <>
      <Button type="secondary" size="small">
        重置
      </Button>
      <Button type="dark" size="small">
        查询
      </Button>
    </>
  );
  const item = (label: string, placeholder = label, tooltip?: string) => (
    <PageFilterItem key={label} label={label} tooltip={tooltip}>
      <TextField size="small" placeholder={placeholder} />
    </PageFilterItem>
  );
  return (
    <CapabilityCard
      title="筛选区布局案例"
      description="同一套 PageFilter 会根据字段数量呈现单行、两行和超出两行自动收敛到更多筛选。操作区始终作为同级 item 对齐。"
    >
      <div className="biu-table-demo__filter-examples">
        <section>
          <h3>单行</h3>
          <PageFilter maxRows={2} autoCollapse={false} actions={actions}>
            {item("关键字", "关键字", "支持按能力名称或负责人搜索。")}
            {item("状态")}
          </PageFilter>
        </section>
        <section>
          <h3>两行</h3>
          <PageFilter maxRows={2} autoCollapse={false} actions={actions}>
            {item("关键字")}
            {item("状态")}
            {item("负责人")}
            {item("版本")}
            {item("归属团队")}
          </PageFilter>
        </section>
        <section>
          <h3>超出两行</h3>
          <PageFilter maxRows={2} moreLabel="更多" actions={actions} drawerTitle="全部筛选条件">
            {item("关键字")}
            {item("状态")}
            {item("负责人")}
            {item("版本")}
            {item("归属团队")}
            {item("更新时间")}
            {item("创建人")}
            {item("数据来源")}
          </PageFilter>
        </section>
      </div>
    </CapabilityCard>
  );
}

export default function TableUIShowcase() {
  const { locale } = useBiuContext();
  const [selected, setSelected] = useState<React.Key[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [advancedOwner, setAdvancedOwner] = useState("");
  const [advancedVersion, setAdvancedVersion] = useState("");
  const [advancedModule, setAdvancedModule] = useState("");
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(4);
  const [density, setDensity] = useState<"compact" | "default" | "comfortable">("default");
  const visibleRows = rows.filter((row) => {
    const matchesKeyword = !keyword || `${row.name} ${row.owner}`.toLowerCase().includes(keyword.toLowerCase());
    const matchesStatus = filterStatus === "all" || row.status === filterStatus;
    const matchesOwner = !advancedOwner || row.owner === advancedOwner;
    const matchesVersion = !advancedVersion || row.version === advancedVersion;
    const matchesModule = !advancedModule || row.owner === advancedModule;
    return matchesKeyword && matchesStatus && matchesOwner && matchesVersion && matchesModule;
  });
  const columns = useMemo<Column<Row>[]>(
    () => [
      {
        key: "name",
        title: "能力名称",
        tooltip: "能力在组件库中的公开名称。",
        dataIndex: "name",
        sortable: true,
        resizable: true,
        fixed: "left",
        width: 180,
        ellipsis: true,
      },
      {
        key: "ownerGroup",
        title: "归属信息",
        children: [
          {
            key: "owner",
            title: "归属团队",
            tooltip: "维护该能力的功能团队。",
            dataIndex: "owner",
            resizable: true,
            width: 180,
            ellipsis: true,
          },
          {
            key: "version",
            title: "版本",
            dataIndex: "version",
            align: "center",
            resizable: true,
            width: 110,
          },
        ],
      },
      {
        key: "status",
        title: "状态",
        tooltip: "当前能力的发布状态。",
        dataIndex: "status",
        resizable: true,
        width: 110,
        render: (value) => <Tag color={value === "ready" ? "success" : "warning"}>{String(value)}</Tag>,
      },
      {
        key: "action",
        title: "操作",
        width: 120,
        fixed: "right",
        render: (_value, record) => (
          <ButtonList
            iconOnly
            maxCount={3}
            items={[
              {
                key: "view",
                label: "查看",
                icon: <Eye size={15} />,
                onClick: () => biuMessage.info(`查看：${record.name}`),
              },
              {
                key: "copy",
                label: "复制",
                icon: <Copy size={15} />,
                onClick: () => biuMessage.success(`已复制：${record.name}`),
              },
              {
                key: "remove",
                label: "移除",
                icon: <Trash2 size={15} />,
                onClick: () => biuMessage.warning(`移除：${record.name}`),
              },
              { key: "detail", label: "详情", onClick: () => biuMessage.info(`详情：${record.name}`) },
            ]}
          />
        ),
      },
    ],
    [],
  );
  return (
    <CapabilityPage
      title="Table 能力展示"
      description="统一展示 Table、ProTable、useQueryTable 的使用方式、交互能力和公开属性；筛选区、工具栏、表格区和分页区保持标准 CRUD 页面布局。"
    >
      <CapabilityCard
        title="Table 页面使用"
        description="一个完整页面同时展示筛选区、工具栏、Table/ProTable 组合、列设置显示隐藏与上移/下移、行操作收敛和独立分页；API 表紧跟在对应展示区域之后。"
      >
        <Tabs
          className="biu-table-demo__tabs"
          type="line"
          items={[
            { key: "all", label: "全部能力" },
            { key: "ready", label: "已完成" },
            { key: "beta", label: "Beta" },
          ]}
          value={activeTab}
          onChange={(next) => {
            setActiveTab(next);
            setFilterStatus(next);
            setCurrent(1);
          }}
        />
        <PageFilter
          moreLabel="更多"
          drawerTitle="更多筛选条件"
          maxRows={2}
          moreButtonProps={{ type: "secondary", variant: "outlined", size: "small" }}
          includeVisibleFieldsInDrawer
          actions={
            <>
              <Button
                type="secondary"
                size="small"
                onClick={() => {
                  setKeyword("");
                  setActiveTab("all");
                  setFilterStatus("all");
                  setAdvancedOwner("");
                  setAdvancedVersion("");
                  setAdvancedModule("");
                  setCurrent(1);
                }}
              >
                重置
              </Button>
              <Button
                type="dark"
                size="small"
                onClick={() => {
                  setCurrent(1);
                  setFilterStatus(activeTab);
                }}
              >
                查询
              </Button>
            </>
          }
        >
          <PageFilterItem label="关键字" tooltip="支持按能力名称或负责人搜索。">
            <TextField
              size="small"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              allowClear
              onClear={() => setKeyword("")}
              placeholder="搜索能力名称或团队"
            />
          </PageFilterItem>
          <PageFilterItem label="状态" tooltip="按能力当前状态筛选结果。">
            <Select
              size="small"
              value={filterStatus}
              onChange={(value) => {
                const next = String(value ?? "all");
                setFilterStatus(next);
                setActiveTab(next);
                setCurrent(1);
              }}
              options={[
                { label: "全部状态", value: "all" },
                { label: "已完成", value: "ready" },
                { label: "Beta", value: "beta" },
              ]}
            />
          </PageFilterItem>
          <PageFilterItem label="负责人">
            <TextField
              size="small"
              value={advancedOwner}
              placeholder="负责人"
              allowClear
              onChange={(event) => setAdvancedOwner(event.target.value)}
              onClear={() => setAdvancedOwner("")}
            />
          </PageFilterItem>
          <PageFilterItem label="版本">
            <Select
              size="small"
              value={advancedVersion}
              placeholder="选择版本"
              options={[
                { label: "0.1.0", value: "0.1.0" },
                { label: "Beta", value: "beta" },
              ]}
              allowClear
              onChange={(value) => setAdvancedVersion(String(value ?? ""))}
            />
          </PageFilterItem>
          <PageFilterItem label="归属团队">
            <Select
              size="small"
              value={advancedModule}
              placeholder="选择团队"
              options={[
                { label: "Foundation", value: "Foundation" },
                { label: "Form", value: "Form" },
                { label: "Table", value: "Table" },
                { label: "HTTP", value: "HTTP" },
              ]}
              allowClear
              onChange={(value) => setAdvancedModule(String(value ?? ""))}
            />
          </PageFilterItem>
        </PageFilter>
        <TableBox>
          <div className="biu-capability-table-wrap">
            <ProTable<Row>
              columns={columns}
              dataSource={visibleRows}
              rowKey="id"
              rowSelection={{ selectedRowKeys: selected, onChange: setSelected }}
              columnStorageKey="biu-demo-table-columns-v3"
              density={density}
              onDensityChange={setDensity}
              showDensity
              showColumnSettings
              showFullscreen
              toolbarLeft={
                <>
                  <span className="biu-table-demo__toolbar-label">能力清单</span>
                  <span>共 {visibleRows.length} 条</span>
                  {selected.length ? <Tag color="info">已选 {selected.length}</Tag> : null}
                </>
              }
              toolbarRight={
                <ButtonList
                  maxCount={3}
                  items={[
                    {
                      key: "create",
                      label: "新增",
                      icon: <Copy size={15} />,
                      onClick: () => biuMessage.success("已打开新增表单"),
                    },
                    {
                      key: "export",
                      label: "导出",
                      icon: <Eye size={15} />,
                      onClick: () => biuMessage.success("已导出当前筛选结果"),
                    },
                    {
                      key: "refresh",
                      label: "刷新",
                      icon: <Copy size={15} />,
                      onClick: () => biuMessage.info("已刷新"),
                    },
                    { key: "batch", label: "批量处理", onClick: () => biuMessage.info(`已选择 ${selected.length} 条`) },
                  ]}
                />
              }
              locale={locale}
              expandable={{
                expandedRowRender: (record) => (
                  <p>
                    展开内容：{record.name} 由 {record.owner} 维护。
                  </p>
                ),
              }}
              scroll={{ x: 760, y: 360 }}
              stickyHeader
              footer={
                <>
                  <span>footer 由调用方自定义，不混入 Toolbar 或 Pagination。</span>
                  <Button size="small" type="secondary" variant="text" onClick={() => setSelected([])}>
                    清空选择
                  </Button>
                </>
              }
              pagination={{
                current,
                pageSize,
                total: visibleRows.length,
                pageSizeOptions: [4, 8, 12],
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                onChange: (next, size) => {
                  setCurrent(next);
                  setPageSize(size);
                },
              }}
            />
          </div>
        </TableBox>
        <div className="biu-capability-region-api">
          <div className="biu-capability-region-api__block">
            <h3>Table / Column / Pagination 区域 API</h3>
            <CapabilityApiTable rows={tableRegionApiRows} />
          </div>
          <div className="biu-capability-region-api__block">
            <h3>ProTable / ButtonList 区域 API</h3>
            <CapabilityApiTable rows={proTableRegionApiRows} />
          </div>
        </div>
      </CapabilityCard>
      <FilterLayoutExamples />
      <QueryTableExample locale={locale} />
    </CapabilityPage>
  );
}
