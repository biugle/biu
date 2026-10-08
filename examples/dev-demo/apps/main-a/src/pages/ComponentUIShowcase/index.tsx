import * as React from "react";
import { useRef, useState, type ReactNode } from "react";
import dayjs from "dayjs";
import {
  Alert,
  Affix,
  Anchor,
  Badge,
  Box,
  Breadcrumb,
  Button,
  ButtonGroup,
  Card,
  Cascader,
  Checkbox,
  CheckboxGroup,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  ColorPicker,
  ContextMenu,
  CopyText,
  DatePicker,
  Detail,
  Dialog as UIDialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Divider,
  DropdownMenu,
  Drawer as UIDrawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  Ellipsis,
  Empty,
  FileCard,
  FilePreviewDialog,
  FileRender,
  Grid,
  InputNumber,
  Image,
  Loading,
  List,
  Menu,
  Notification,
  notification,
  Pagination,
  Popconfirm,
  Popover,
  Progress,
  Paragraph,
  RadioGroup,
  RangeDatePicker,
  RangeTimePicker,
  ResizeBox,
  Select,
  Stack,
  Space,
  Spin,
  ScrollProgress,
  Steps,
  Switch,
  Tabs,
  Tag,
  Textarea,
  TextField,
  Timeline,
  Title,
  Typography,
  TimePicker,
  Tooltip,
  Transfer,
  Tree,
  Upload,
  type BiuFileItem,
} from "@biugle/react-components/ui";
import { biuMessage, ConfigProvider } from "@biugle/react-components";
import { useBiuContext } from "@biugle/biu-runtime";
import { Check, Plus, Settings, X } from "@biugle/icons";
import {
  CapabilityActions,
  CapabilityCard,
  CapabilityGrid,
  CapabilityPage,
  CapabilityApiTable,
  type CapabilityApiRow,
} from "../CapabilityPage/index.js";

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}) {
  const apiRows = sectionApiRows[id] ?? [];
  return (
    <CapabilityCard id={id} title={title} description={description}>
      {children}
      {apiRows.length ? (
        <div className="biu-capability-section-api">
          <h3>属性与方法</h3>
          <CapabilityApiTable rows={apiRows} />
        </div>
      ) : null}
    </CapabilityCard>
  );
}

/** The Pro page reuses the same ordered UI catalog, while this table makes the
 * public UI contract inspectable without opening source files. */
export const uiApiRows: CapabilityApiRow[] = [
  {
    component: "Button / ButtonGroup",
    name: "type / variant / shape",
    type: "primary | warning | error | success | secondary | dark | default / contained | text | outlined",
    defaultValue: "default / contained / default",
    description: "语义色、三种视觉变体、圆角/圆形/方形和只读状态。",
    demo: "按钮色彩与 Group",
  },
  {
    component: "Button",
    name: "icon / iconPosition / loading / block",
    type: "ReactNode / before | after | center / boolean",
    defaultValue: "- / before / false / false",
    description: "图标、加载、整行按钮、disabled、className 与 classNames。",
    demo: "Loading、Block",
  },
  {
    component: "ButtonGroup",
    name: "gap / className / classNames",
    type: "number | string / string / { root?: string; item?: string }",
    defaultValue: "8 / undefined / {}",
    description: "控制按钮之间的间距、根节点 className，以及批量覆写根节点和子按钮样式。",
    demo: "按钮组间距",
  },
  {
    component: "TextField / Textarea",
    name: "value / onChange / onInput / allowClear",
    type: "string / event callback / boolean",
    defaultValue: "- / - / - / false",
    description: "受控输入、清除、输入回调，固定宽度不随内容变化。",
    demo: "关键字输入",
  },
  {
    component: "TextField / Textarea",
    name: "showCount / maxLength / addonBefore / addonAfter / inputProps",
    type: "boolean / number / ReactNode / HTML attributes",
    defaultValue: "false / - / - / - / {}",
    description: "计数、长度限制、前后缀、autocomplete 与双向 resize。",
    demo: "备注与计数",
  },
  {
    component: "InputNumber",
    name: "min / max / step / decimal / changeOnWheel",
    type: "number / number / number / number / boolean",
    defaultValue: "- / - / 1 / - / false",
    description: "数字范围、精度（decimal）、滚轮变更、formatter/parser 和 stringMode。",
    demo: "金额输入",
  },
  {
    component: "Checkbox / Radio / Switch",
    name: "checked / value / onChange / disabled / readOnly",
    type: "controlled value + event callback",
    defaultValue: "false / - / - / false / false",
    description: "表单联动、禁用、只读和稳定 focus ring；点击区域带 pointer。",
    demo: "表单联动",
  },
  {
    component: "CheckboxGroup / RadioGroup",
    name: "direction / optionRender / classNames",
    type: "horizontal | vertical / (option, index) => ReactNode / slot map",
    defaultValue: "horizontal / - / -",
    description: "支持纵向布局、自定义选项内容和 root/option/input/label 样式插槽。",
    demo: "下方分组案例",
  },
  {
    component: "Select",
    name: "options / mode / hasAllOption / allowAllSelect",
    type: "SelectOption[] / single | multiple / boolean",
    defaultValue: "[] / single / false / false",
    description: "单选、多选、全部选项和多选一键全选。",
    demo: "全部与多选",
  },
  {
    component: "Select",
    name: "onChange / optionRender / labelRender / tagRender",
    type: "(value, option, index) / render callbacks",
    defaultValue: "-",
    description: "onChange 三参数、自定义选项/标签、maxTagCount/maxCount。",
    demo: "自定义 option",
  },
  {
    component: "Select",
    name: "searchable / dropdownRender / onLoadMore",
    type: "boolean / ReactNode callback / async callback",
    defaultValue: "false / - / -",
    description: "sticky 搜索、下拉头尾、懒加载和碰撞定位。",
    demo: "搜索下拉面板",
  },
  {
    component: "DatePicker / RangeDatePicker",
    name: "format / value / presets / disabledDate",
    type: "string / Dayjs | tuple / preset[] / callback",
    defaultValue: "yyyy-mm-dd / null / [] / -",
    description: "自定义日历、单日期/范围、预设和日期禁用。",
    demo: "日期范围",
  },
  {
    component: "TimePicker / RangeTimePicker",
    name: "format / hour12 / disabledTime / needConfirm",
    type: "format / boolean / callback / boolean",
    defaultValue: "HH:mm / false / - / false",
    description: "自定义时分秒面板、12/24 小时、禁用时段和确认 footer。",
    demo: "时间范围",
  },
  {
    component: "Dialog / Drawer",
    name: "open / onOpenChange / position / placement",
    type: "boolean / callback / center | top | ... / top | right | ...",
    defaultValue: "false / - / center / right",
    description: "受控开关、位置/方向、遮罩、ESC、Portal 和 viewport 尺寸。",
    demo: "Dialog、Drawer",
  },
  {
    component: "Dialog / Drawer",
    name: "offsetTop / offsetLeft / fullscreen / destroyOnClose",
    type: "number / number / boolean / boolean",
    defaultValue: "- / - / false / false",
    description: "偏移、全屏、关闭销毁和根/面板/关闭按钮 classNames。",
    demo: "企业弹层",
  },
  {
    component: "Tooltip / Ellipsis",
    name: "content / placement / onlyOverflow / maxWidth",
    type: "ReactNode / placement / boolean / number | string",
    defaultValue: "- / top / false / -",
    description: "Radix collision、居中箭头、自动避障、真实溢出和手动宽度。",
    demo: "长文本提示",
  },
  {
    component: "Popover / Popconfirm",
    name: "open / side / align / size / disabled",
    type: "controlled overlay options",
    defaultValue: "false / bottom / center / auto / false",
    description: "可控状态、尺寸、方向、避障、异步确认和禁用。",
    demo: "确认删除",
  },
  {
    component: "DropdownMenu",
    name: "items / checkedKeys / radioValues / onSelect / dropdownRender",
    type: "menu item[] / string[] / record / callback",
    defaultValue: "[] / [] / {} / -",
    description: "标签、分隔线、快捷键、checkbox、radio、submenu、头尾插槽和自定义菜单内容。",
    demo: "更多操作",
  },
  {
    component: "Tabs / Menu",
    name: "items / type / value / onChange / onClose",
    type: "item[] / line | card | tag / controlled callbacks",
    defaultValue: "[] / line / - / - / -",
    description: "多风格标签页、滚动箭头、关闭/新增和多语言长度适配。",
    demo: "Tabs 与菜单",
  },
  {
    component: "PageFilter",
    name: "moreFields / drawerTitle / drawerWidth",
    type: "ReactNode / ReactNode / string | number",
    defaultValue: "- / 更多筛选 / medium",
    description: "高级筛选项自动放入 body-mounted Drawer，支持受控开关、底部插槽和 classNames。",
    demo: "Table UI / Pro Table",
  },
  {
    component: "Pagination",
    name: "current / pageSize / showSizeChanger / showQuickJumper",
    type: "number / number / boolean / boolean",
    defaultValue: "1 / 10 / false / false",
    description: "页码、页大小、快速跳转、总数、响应式和简洁模式。",
    demo: "分页与页大小",
  },
  {
    component: "Tree / Transfer",
    name: "data / selectedKeys / checkedKeys / search / onChange",
    type: "tree[] / key[] / key[] / string / callback",
    defaultValue: "[] / [] / [] / - / -",
    description: "树搜索/展开/多选与 Transfer 双栏搜索、禁用和性能边界。",
    demo: "树与穿梭框",
  },
  {
    component: "Alert / Empty / Loading / Progress",
    name: "status / title / description / icon / action / percent",
    type: "default | info | success | warning | error / ReactNode / number",
    defaultValue: "info / - / - / 0",
    description: "统一状态色、可替换图标、操作区、空态、加载态和进度展示。",
    demo: "反馈与状态",
  },
  {
    component: "Tag / Badge / Steps",
    name: "color / count / items / current",
    type: "semantic color / number / item[] / number",
    defaultValue: "default / - / [] / 0",
    description: "轻量状态标签、徽标计数和步骤过程。",
    demo: "标签与步骤",
  },
  {
    component: "Upload / File Preview",
    name: "accept / maxSize / multiple / beforeUpload / onChange",
    type: "string / number / boolean / callback",
    defaultValue: "- / - / false / - / -",
    description: "选择/拖拽、类型大小校验、进度、取消、重试、预览、下载和移除。",
    demo: "文件列表与预览",
  },
  {
    component: "Box / Grid / Stack / Card / Divider / Collapsible",
    name: "className / classNames / gap / direction",
    type: "string / slot map / number / row | column",
    defaultValue: "- / - / 8 / row",
    description: "无业务假设的布局原语，根节点和内部 slot 均可覆写。",
    demo: "布局原语",
  },
];

const supplementalApiRows: CapabilityApiRow[] = [
  {
    component: "Cascader",
    name: "options / value / onChange",
    type: "CascaderOption[] / string[] / (value, option) => void",
    defaultValue: "[] / [] / -",
    description: "级联节点、受控路径和选择回调；支持禁用节点与 changeOnSelect。",
    demo: "中国 / 华东 / 上海",
  },
  {
    component: "Cascader",
    name: "changeOnSelect / optionRender / displayRender",
    type: "boolean / render callback / render callback",
    defaultValue: "false / - / -",
    description: "控制中间节点是否可选，并允许自定义选项和触发器显示内容。",
    demo: "自定义级联内容",
  },
  {
    component: "Dialog",
    name: "open / onOpenChange / position / container",
    type: "boolean / callback / center | top | bottom / HTMLElement | selector",
    defaultValue: "false / - / center / body",
    description: "受控显示、位置、挂载容器、ESC 和遮罩点击行为。",
    demo: "打开 Dialog",
  },
  {
    component: "Dialog",
    name: "offsetTop / offsetLeft / fullscreen / destroyOnClose",
    type: "number / number / boolean / boolean",
    defaultValue: "- / - / false / false",
    description: "偏移、全屏和关闭后的内容销毁策略；支持 header/body/footer slot classNames。",
    demo: "Dialog footer",
  },
  {
    component: "Dialog",
    name: "draggable",
    type: "boolean",
    defaultValue: "false",
    options: "true | false",
    description: "允许在视窗范围内拖动 Dialog 面板；全屏模式不会响应拖动，默认位置仍由 position 和 offset 属性决定。",
    demo: "可拖动 Dialog",
  },
  {
    component: "Drawer",
    name: "placement / size / open / onOpenChange",
    type: "top | right | bottom | left / number | string / boolean / callback",
    defaultValue: "right / medium / false / -",
    description: "四方向抽屉、尺寸、受控显示和 viewport 边缘布局。",
    demo: "打开 Drawer",
  },
  {
    component: "Drawer",
    name: "closable / maskClosable / footer / destroyOnClose",
    type: "boolean / boolean / ReactNode / boolean",
    defaultValue: "true / true / Cancel + Confirm / false",
    description: "关闭按钮、遮罩关闭、底部操作区和关闭销毁策略。",
    demo: "Drawer footer",
  },
  {
    component: "Tooltip",
    name: "content / placement / sideOffset / color",
    type: "ReactNode / placement / number / semantic color",
    defaultValue: "- / top / 6 / default",
    description: "说明内容、方向、间距、颜色和 Radix collision 自动避障。",
    demo: "悬停查看 Tooltip",
  },
  {
    component: "Tooltip",
    name: "onlyOverflow / alwaysTooltip / maxWidth / classNames",
    type: "boolean / boolean / number | string / slot map",
    defaultValue: "false / false / - / -",
    description: "溢出触发、永远显示、最大宽度和根/内容/箭头样式覆写。",
    demo: "溢出提示",
  },
  {
    component: "Ellipsis",
    name: "children / maxWidth / lines / alwaysTooltip",
    type: "ReactNode / number | string / number / boolean",
    defaultValue: "- / auto / 1 / false",
    description: "自动检测文本溢出，支持手动宽度、多行截断和始终显示 Tooltip。",
    demo: "长标题省略",
  },
  {
    component: "Popover",
    name: "content / open / onOpenChange / size",
    type: "ReactNode / boolean / callback / number | string | auto",
    defaultValue: "- / false / - / auto",
    description: "受控气泡、内容尺寸、方向、对齐、碰撞避障和 body Portal。",
    demo: "打开 Popover",
  },
  {
    component: "Popconfirm",
    name: "title / description / onConfirm / onCancel",
    type: "ReactNode / ReactNode / callback | Promise / callback",
    defaultValue: "- / - / - / -",
    description: "快捷确认、说明、异步确认 loading、取消回调和危险语义。",
    demo: "删除确认",
  },
  {
    component: "DropdownMenu",
    name: "items / onSelect / disabled / side / align",
    type: "DropdownItem[] / callback / boolean / side / align",
    defaultValue: "[] / - / false / bottom / start",
    description: "菜单项、禁用、方向、对齐和碰撞避障。",
    demo: "更多操作",
  },
  {
    component: "DropdownMenu",
    name: "checkedKeys / radioValues / shortcut / submenu",
    type: "string[] / Record / string / DropdownItem[]",
    defaultValue: "[] / {} / - / -",
    description: "checkbox、radio、快捷键、分隔项、submenu 以及 header/footer 插槽。",
    demo: "复选与单选菜单",
  },
  {
    component: "Tabs",
    name: "items / value / onChange / type",
    type: "TabItem[] / string / callback / line | card | tag",
    defaultValue: "[] / - / - / line",
    description: "受控标签、三种视觉样式、禁用项和面板内容。",
    demo: "Tabs 样式",
  },
  {
    component: "Tabs",
    name: "showArrows / onClose / addButton / direction",
    type: "auto | both | none / callback / ReactNode / horizontal | vertical",
    defaultValue: "auto / - / - / horizontal",
    description: "仅溢出显示滚动箭头，支持关闭、新增、垂直滚动和多语言自适应。",
    demo: "滚动与关闭",
  },
  {
    component: "Menu",
    name: "items / selectedKey / openKeys / onSelect",
    type: "MenuItem[] / string / string[] / callback",
    defaultValue: "[] / - / [] / -",
    description: "菜单树、选中项、展开项、目录层级和键盘导航。",
    demo: "基座菜单结构",
  },
  {
    component: "Menu",
    name: "collapsed / mode / inlineIndent / classNames",
    type: "boolean / vertical | horizontal / number / slot map",
    defaultValue: "false / vertical / 16 / -",
    description: "收起状态、菜单模式、层级缩进、Ellipsis 标题和插槽样式。",
    demo: "收起菜单",
  },
  {
    component: "Breadcrumb",
    name: "items / separator",
    type: "BreadcrumbItem[] / ReactNode",
    defaultValue: "[] / /",
    description: "层级路径和分隔符；可点击行为在对应 BreadcrumbItem.onClick 上配置，基座面包屑复用同一实现。",
    demo: "基座能力 / Menu",
  },
  {
    component: "Pagination",
    name: "itemRender / showTotal / pageSizeOptions / responsive",
    type: "render callback / render callback / number[] / boolean",
    defaultValue: "- / - / [10, 20, 50] / false",
    description: "自定义页码、总数、页大小选项和窄屏响应式布局。",
    demo: "页大小与快速跳转",
  },
  {
    component: "Tree",
    name: "data / expandedKeys / selectedKeys / checkedKeys",
    type: "TreeNode[] / key[] / key[] / key[]",
    defaultValue: "[] / [] / [] / []",
    description: "受控树节点、展开、选中、勾选和半选状态。",
    demo: "树节点联动",
  },
  {
    component: "Tree",
    name: "showSearch / checkable / multiple / loadData",
    type: "boolean / boolean / boolean / async callback",
    defaultValue: "false / false / false / -",
    description: "搜索过滤、复选、多选、异步加载、节点图标和禁用节点。",
    demo: "搜索与层级图标",
  },
  {
    component: "Transfer",
    name: "dataSource / targetKeys / onChange / titles",
    type: "TransferItem[] / key[] / callback / [ReactNode, ReactNode]",
    defaultValue: "[] / [] / - / [可用, 已选]",
    description: "双栏数据、受控目标项、变更回调和自定义栏标题。",
    demo: "双栏选择",
  },
  {
    component: "Transfer",
    name: "showSearch / oneWay / render / disabled",
    type: "boolean / boolean / render callback / boolean",
    defaultValue: "false / false / - / false",
    description: "两侧搜索、单向模式、自定义内容、禁用项和批量移动。",
    demo: "搜索与批量移动",
  },
  {
    component: "Alert",
    name: "status / title / description / icon / action",
    type: "default | info | success | warning | error / ReactNode",
    defaultValue: "info / - / - / - / -",
    description: "五种语义状态、标题、详细说明、图标和操作区。",
    demo: "多行 Alert",
  },
  {
    component: "Alert",
    name: "closable / onClose / classNames",
    type: "boolean / callback / slot map",
    defaultValue: "false / - / -",
    description: "右侧垂直居中关闭按钮和根/content/icon/action 样式插槽。",
    demo: "关闭 Alert",
  },
  {
    component: "Message",
    name: "success / info / warning / error / duration",
    type: "(content, options?) => id / number",
    defaultValue: "- / - / - / - / 3000",
    description: "全局消息、语义类型、自动关闭时间和返回实例 id。",
    demo: "简约多行消息",
  },
  {
    component: "Message",
    name: "show / primary / default / complex / closable / locale",
    type: "(content, options?) => id / (content, options?) => id / (content, options?) => id / boolean / boolean / BiuComponentsLocale",
    defaultValue: "- / - / - / false / true / zh-CN",
    description: "通用显示、primary/default 语义、简约/复杂表面、关闭按钮和中英文文案。",
    demo: "复杂多行消息",
  },
  {
    component: "Empty",
    name: "description / image / action",
    type: "ReactNode / ReactNode / ReactNode",
    defaultValue: "暂无数据 / default / -",
    description: "空状态说明、占位图和可选操作按钮。",
    demo: "筛选无数据",
  },
  {
    component: "Loading",
    name: "spinning / size / tip / overlay",
    type: "boolean / small | default | large / ReactNode / boolean",
    defaultValue: "true / default / 加载中… / false",
    description: "统一加载指示、尺寸、提示文案和容器遮罩。",
    demo: "加载状态",
  },
  {
    component: "Progress",
    name: "percent / status / strokeWidth / showInfo",
    type: "number / normal | success | exception / number / boolean",
    defaultValue: "0 / normal / 8 / true",
    description: "连续进度、语义状态、线宽和百分比展示。",
    demo: "进度反馈",
  },
  {
    component: "Tag",
    name: "color / closable / onClose / bordered",
    type: "semantic color / boolean / callback / boolean",
    defaultValue: "default / false / - / true",
    description: "轻量状态标签、关闭行为、语义颜色和边框。",
    demo: "状态标签",
  },
  {
    component: "Badge",
    name: "count / dot / color / overflowCount",
    type: "number | ReactNode / boolean / semantic color / number",
    defaultValue: "- / false / primary / 99",
    description: "数字徽标、圆点徽标、语义颜色和超量省略。",
    demo: "消息徽标",
  },
  {
    component: "Steps",
    name: "items / current / status / direction",
    type: "StepItem[] / number / process | finish | error / horizontal | vertical",
    defaultValue: "[] / 0 / process / horizontal",
    description: "流程节点、当前步骤、状态和排列方向；图标与文字垂直居中。",
    demo: "流程进度",
  },
  {
    component: "Box",
    name: "as / className / classNames",
    type: "ElementType / string / slot map",
    defaultValue: "div / - / -",
    description: "基础容器元素和根/内部样式插槽。",
    demo: "Box 内容区域",
  },
  {
    component: "Grid",
    name: "columns / gap / minColumnWidth / className",
    type: "number | string / number | string / number | string / string",
    defaultValue: "- / 8 / - / -",
    description: "响应式列数、间隙和最小列宽。",
    demo: "Grid 项目",
  },
  {
    component: "Stack",
    name: "direction / gap / align / justify",
    type: "row | column / number / flex-align / flex-justify",
    defaultValue: "row / 8 / stretch / start",
    description: "统一处理横向/纵向排列、间隙、对齐和分布。",
    demo: "Stack 项目",
  },
  {
    component: "Card",
    name: "title / extra / bordered / classNames",
    type: "ReactNode / ReactNode / boolean / slot map",
    defaultValue: "- / - / true / -",
    description: "标题、右侧扩展、边框和 header/body/footer 样式插槽。",
    demo: "Card 标题",
  },
  {
    component: "Divider",
    name: "orientation / dashed / children / className",
    type: "horizontal | vertical / boolean / ReactNode / string",
    defaultValue: "horizontal / false / - / -",
    description: "水平/垂直分隔、虚线、分隔文本和根样式。",
    demo: "上下内容分隔",
  },
  {
    component: "Collapsible",
    name: "open / defaultOpen / onOpenChange / disabled",
    type: "boolean / boolean / callback / boolean",
    defaultValue: "- / false / - / false",
    description: "受控/非受控展开、变更回调和禁用状态。",
    demo: "展开更多",
  },
  {
    component: "Upload / File Preview",
    name: "accept / maxSize / multiple / maxCount / drag",
    type: "string / number / boolean / number / boolean",
    defaultValue: "- / - / false / - / false",
    description: "文件类型、大小、数量、拖拽选择和队列限制。",
    demo: "拖拽上传",
  },
  {
    component: "Upload / File Preview",
    name: "beforeUpload / customRequest / onProgress / preview",
    type: "callback / callback / callback / boolean",
    defaultValue: "- / - / - / true",
    description: "上传前校验、自定义传输、进度、取消/重试和文件预览。",
    demo: "图片/PDF/Markdown",
  },
];

type ApiPropertyDetail = NonNullable<CapabilityApiRow["propertyDetails"]>[string];

type ApiSpec = [name: string, type: string, defaultValue: string, options: string, description: string, demo: string];

function createApiRows(component: string, specs: ApiSpec[]): CapabilityApiRow[] {
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

/**
 * The catalog is intentionally authored as one component per row.  The
 * earlier grouped shorthand was useful while the library was being formed,
 * but it made a Checkbox description leak into Radio/Switch and made it too
 * easy to document props that a component does not actually expose.  Keep the
 * executable demo and this contract next to one another so the page remains
 * a dependable API reference.
 */
const canonicalApiRows: CapabilityApiRow[] = [
  ...createApiRows("Button", [
    [
      "type",
      "ButtonDesignType | button | submit | reset",
      "primary",
      "primary | warning | error | success | secondary | dark | default | danger",
      "按钮语义色；danger 是 error 的兼容别名。",
      "按钮色彩",
    ],
    [
      "variant",
      "ButtonVariant | legacy alias",
      "contained",
      "contained | text | outlined（兼容 primary/secondary/ghost/danger/link）",
      "选择实体、文字或描边视觉变体。",
      "三种变体",
    ],
    ["size", "BiuSize", "medium", "small | medium | large", "控制按钮的高度、字号和内边距。", "尺寸"],
    ["icon", "ReactNode", "undefined", "任意 ReactNode", "渲染按钮图标。", "图标按钮"],
    ["iconSize", "number | string", "undefined", "CSS 尺寸", "覆盖图标的宽度、高度和字号。", "图标尺寸"],
    [
      "onlyIcon",
      "boolean",
      "false",
      "true | false",
      "将按钮转换为组件统一控制的方形独立图标按钮；按钮内不渲染文字，文字自动作为 Tooltip 内容。",
      "独立图标按钮",
    ],
    [
      "tooltip",
      "ReactNode",
      "children / aria-label",
      "任意 ReactNode",
      "覆盖 onlyIcon 按钮的 Tooltip 文案；普通按钮不渲染 Tooltip。",
      "Tooltip 文案",
    ],
    [
      "iconPosition",
      "ButtonIconPosition",
      "before",
      "before | after | center",
      "控制图标位于文字前、后或仅居中显示。",
      "图标位置",
    ],
    ["loading", "boolean", "false", "true | false", "显示加载状态，同时阻止按钮操作。", "Loading"],
    ["block", "boolean", "false", "true | false", "让按钮占满父容器宽度。", "Block 按钮"],
    ["shape", "ButtonShape", "default", "default | round | circle | square", "控制按钮圆角、圆形或方形形状。", "形状"],
    ["readonly", "boolean", "false", "true | false", "保留可读视觉但阻止点击修改。", "只读按钮"],
    ["disabled", "boolean", "false", "true | false", "禁用鼠标、键盘和提交交互。", "禁用按钮"],
    [
      "className",
      "string",
      "undefined",
      "CSS class 字符串",
      "追加到按钮根节点，保留 biu-ui-button 前缀类。",
      "样式覆写",
    ],
    [
      "classNames",
      "ButtonClassNames",
      "{}",
      "root | icon | spinner | content",
      "按根节点、图标、加载器和文字区域覆写样式。",
      "区域样式",
    ],
    [
      "htmlType",
      '"button" | "submit" | "reset"',
      "button",
      "button | submit | reset",
      "设置原生 button 的提交语义；不改变按钮语义色。",
      "表单提交",
    ],
  ]),
  ...createApiRows("ButtonGroup", [
    ["gap", "number | string", "8", "数字像素或 CSS 长度", "设置按钮组子项之间的统一间距。", "按钮组间距"],
    ["className", "string", "undefined", "CSS class 字符串", "追加到 ButtonGroup 根节点。", "根节点样式"],
    [
      "classNames",
      "{ root?: string; item?: string }",
      "{}",
      "root | item",
      "分别覆写组根节点和克隆子按钮的样式。",
      "区域样式",
    ],
  ]),
  ...createApiRows("TextField", [
    [
      "value",
      "string | number | readonly string[]",
      "undefined",
      "受控输入值",
      "受控输入内容；需配合 onChange 回写。",
      "关键字输入",
    ],
    [
      "defaultValue",
      "string | number | readonly string[]",
      "undefined",
      "初始输入值",
      "非受控模式的初始内容。",
      "默认值",
    ],
    [
      "onChange",
      "(event: ChangeEvent<HTMLInputElement>) => void",
      "undefined",
      "React 输入事件",
      "输入值变化时回调。",
      "输入联动",
    ],
    [
      "onInput",
      "(event: FormEvent<HTMLInputElement>) => void",
      "undefined",
      "React input 事件",
      "原生 input 事件回调。",
      "输入联动",
    ],
    ["allowClear", "boolean", "false", "true | false", "有值时显示清除按钮并触发 onClear。", "清除"],
    ["onClear", "() => void", "undefined", "无参数", "点击清除按钮后的回调。", "清除"],
    ["showCount", "boolean", "false", "true | false", "配合 maxLength 显示当前字数和上限。", "计数"],
    ["maxLength", "number", "undefined", "非负整数", "限制输入的最大字符数。", "长度限制"],
    ["addonBefore", "ReactNode", "undefined", "任意 ReactNode", "在输入框左侧渲染前置内容。", "前缀"],
    ["addonAfter", "ReactNode", "undefined", "任意 ReactNode", "在输入框右侧渲染后置内容。", "后缀"],
    ["size", "BiuSize", "medium", "small | medium | large", "控制输入框高度和内部间距。", "尺寸"],
    [
      "inputProps",
      "InputHTMLAttributes<HTMLInputElement>",
      "{}",
      "原生 input 属性",
      "透传 autocomplete、name、aria-* 等原生属性。",
      "原生属性",
    ],
    ["autoComplete", "string", "浏览器默认", "off | on 或浏览器 token", "设置原生 input 的自动填充策略。", "自动填充"],
    ["loading", "boolean", "false", "true | false", "显示输入加载状态并暂时禁用输入。", "加载"],
    ["error", "ReactNode", "undefined", "任意 ReactNode", "显示校验错误并切换错误样式。", "错误状态"],
    ["disabled", "boolean", "false", "true | false", "禁用输入和清除操作。", "禁用"],
    ["readOnly", "boolean", "false", "true | false", "保留内容可读但禁止编辑。", "只读"],
    ["className", "string", "undefined", "CSS class 字符串", "追加到 TextField 根节点。", "样式覆写"],
    [
      "classNames",
      "ControlClassNames",
      "{}",
      "root | control | input | clear | prefix | suffix | error | count",
      "按输入框区域覆写样式。",
      "区域样式",
    ],
  ]),
  ...createApiRows("Textarea", [
    [
      "value",
      "string | number | readonly string[]",
      "undefined",
      "受控输入值",
      "受控文本内容；需配合 onChange 回写。",
      "备注输入",
    ],
    [
      "defaultValue",
      "string | number | readonly string[]",
      "undefined",
      "初始输入值",
      "非受控模式的初始内容。",
      "默认值",
    ],
    [
      "onChange",
      "(event: ChangeEvent<HTMLTextAreaElement>) => void",
      "undefined",
      "React 输入事件",
      "文本变化时回调。",
      "输入联动",
    ],
    [
      "onInput",
      "(event: FormEvent<HTMLTextAreaElement>) => void",
      "undefined",
      "React input 事件",
      "原生 input 事件回调。",
      "输入联动",
    ],
    ["allowClear", "boolean", "false", "true | false", "有值时显示清除按钮并触发 onClear。", "清除"],
    ["onClear", "() => void", "undefined", "无参数", "点击清除按钮后的回调。", "清除"],
    ["showCount", "boolean", "false", "true | false", "配合 maxLength 显示当前字数和上限。", "计数"],
    ["maxLength", "number", "undefined", "非负整数", "限制输入的最大字符数。", "长度限制"],
    ["addonBefore", "ReactNode", "undefined", "任意 ReactNode", "在文本域左侧渲染前置内容。", "前缀"],
    ["addonAfter", "ReactNode", "undefined", "任意 ReactNode", "在文本域右侧渲染后置内容。", "后缀"],
    ["size", "BiuSize", "medium", "small | medium | large", "控制文本域外层控件尺寸。", "尺寸"],
    [
      "resize",
      '"both" | "horizontal" | "vertical" | "none"',
      "both",
      "both | horizontal | vertical | none",
      "控制原生文本域可调整的方向，组件不绘制额外拖拽图标。",
      "双向调整",
    ],
    [
      "textareaProps",
      "TextareaHTMLAttributes<HTMLTextAreaElement>",
      "{}",
      "原生 textarea 属性",
      "透传 rows、placeholder、aria-* 等原生属性。",
      "原生属性",
    ],
    ["error", "ReactNode", "undefined", "任意 ReactNode", "显示校验错误并切换错误样式。", "错误状态"],
    ["disabled", "boolean", "false", "true | false", "禁用文本域和清除操作。", "禁用"],
    ["readOnly", "boolean", "false", "true | false", "保留内容可读但禁止编辑。", "只读"],
    ["className", "string", "undefined", "CSS class 字符串", "追加到 Textarea 根节点。", "样式覆写"],
    [
      "classNames",
      "ControlClassNames",
      "{}",
      "root | control | input | clear | prefix | suffix | error | count",
      "按文本域区域覆写样式。",
      "区域样式",
    ],
  ]),
  ...createApiRows("InputNumber", [
    ["value", "number | string", "undefined", "受控数字或字符串", "受控数值；需配合 onChange 回写。", "金额输入"],
    ["defaultValue", "number | string", "undefined", "初始数值", "非受控模式的初始数值。", "默认值"],
    ["min", "number", "undefined", "任意数字", "允许输入的最小值。", "范围"],
    ["max", "number", "undefined", "任意数字", "允许输入的最大值。", "范围"],
    ["step", "number", "1", "非零数字", "加减按钮、键盘和滚轮每次变更的步长。", "步长"],
    ["decimal", "number", "undefined", "0 或正整数", "保留的小数位数；优先于兼容属性 precision。", "精度"],
    ["precision", "number", "undefined", "兼容属性", "decimal 的废弃兼容别名。", "兼容性"],
    ["changeOnWheel", "boolean", "false", "true | false", "聚焦时允许滚轮修改数值。", "滚轮变更"],
    ["formatter", "(value) => string", "undefined", "格式化回调", "把内部值转换为输入框展示文本。", "格式化"],
    ["parser", "(value) => number | string | undefined", "undefined", "解析回调", "把输入文本转换为提交值。", "解析"],
    ["stringMode", "boolean", "false", "true | false", "以字符串回调数值，适用于高精度金额。", "高精度"],
    ["onChange", "(value, event?) => void", "undefined", "number | string | undefined", "数值变化回调。", "表单联动"],
  ]),
  ...createApiRows("Checkbox", [
    ["checked", "boolean", "false", "true | false", "受控勾选状态。", "独立 Checkbox"],
    ["defaultChecked", "boolean", "false", "true | false", "非受控模式的初始勾选状态。", "默认勾选"],
    [
      "value",
      "string | number | readonly string[]",
      "undefined",
      "原生表单值",
      "提交表单时对应的原生 value。",
      "表单值",
    ],
    ["label", "ReactNode", "undefined", "任意 ReactNode", "在复选框右侧渲染标签。", "标签对齐"],
    [
      "onChange",
      "ChangeEventHandler<HTMLInputElement>",
      "undefined",
      "原生 ChangeEvent",
      "勾选变化时触发。",
      "表单联动",
    ],
    ["disabled", "boolean", "false", "true | false", "禁用复选框和标签点击。", "禁用"],
    ["className", "string", "undefined", "CSS class 字符串", "追加到复选框 label 根节点。", "样式覆写"],
    [
      "classNames",
      "ControlClassNames",
      "{}",
      "root | input | label",
      "按根节点、原生 input 和标签区域覆写样式。",
      "区域样式",
    ],
  ]),
  ...createApiRows("CheckboxGroup", [
    [
      "options",
      "GroupOption[]",
      "[]",
      "label | value | disabled 及扩展字段",
      "定义复选选项和每项的禁用状态。",
      "复选分组",
    ],
    ["value", "string[]", "undefined", "受控选项值数组", "受控已选值；需配合 onChange 回写。", "联动"],
    ["defaultValue", "string[]", "[]", "初始选项值数组", "非受控模式的初始选择。", "默认值"],
    ["onChange", "(value: string[]) => void", "undefined", "最新值数组", "选项变化后的分组回调。", "联动"],
    ["direction", "GroupDirection", "horizontal", "horizontal | vertical", "设置选项排列方向。", "布局"],
    ["optionRender", "(option, index) => ReactNode", "undefined", "选项和索引", "自定义每个选项的内容。", "自定义选项"],
    ["classNames", "GroupClassNames", "{}", "root | option | input | label", "按分组和选项区域覆写样式。", "区域样式"],
  ]),
  ...createApiRows("Radio", [
    ["checked", "boolean", "false", "true | false", "受控单选状态。", "独立 Radio"],
    ["defaultChecked", "boolean", "false", "true | false", "非受控模式的初始选中状态。", "默认选中"],
    [
      "value",
      "string | number | readonly string[]",
      "undefined",
      "原生表单值",
      "提交表单时对应的原生 value。",
      "表单值",
    ],
    ["label", "ReactNode", "undefined", "任意 ReactNode", "在单选框右侧渲染标签。", "标签对齐"],
    [
      "onChange",
      "ChangeEventHandler<HTMLInputElement>",
      "undefined",
      "原生 ChangeEvent",
      "选中变化时触发。",
      "表单联动",
    ],
    ["disabled", "boolean", "false", "true | false", "禁用单选框和标签点击。", "禁用"],
    ["className", "string", "undefined", "CSS class 字符串", "追加到单选框 label 根节点。", "样式覆写"],
    [
      "classNames",
      "ControlClassNames",
      "{}",
      "root | input | label",
      "按根节点、原生 input 和标签区域覆写样式。",
      "区域样式",
    ],
  ]),
  ...createApiRows("RadioGroup", [
    [
      "options",
      "GroupOption[]",
      "[]",
      "label | value | disabled 及扩展字段",
      "定义单选选项和每项的禁用状态。",
      "单选分组",
    ],
    ["value", "string", "undefined", "受控选项值", "受控已选值；需配合 onChange 回写。", "联动"],
    ["defaultValue", "string", "undefined", "初始选项值", "非受控模式的初始选择。", "默认值"],
    ["onChange", "(value: string) => void", "undefined", "最新值", "选项变化后的分组回调。", "联动"],
    ["name", "string", "自动生成", "原生 radio name", "指定原生 radio 分组名称。", "表单分组"],
    ["direction", "GroupDirection", "horizontal", "horizontal | vertical", "设置选项排列方向。", "布局"],
    ["optionRender", "(option, index) => ReactNode", "undefined", "选项和索引", "自定义每个选项的内容。", "自定义选项"],
    ["classNames", "GroupClassNames", "{}", "root | option | input | label", "按分组和选项区域覆写样式。", "区域样式"],
  ]),
  ...createApiRows("Switch", [
    ["checked", "boolean", "false", "true | false", "受控开关状态。", "开关"],
    ["defaultChecked", "boolean", "false", "true | false", "非受控模式的初始开关状态。", "默认状态"],
    [
      "onChange",
      "(checked, event?) => void",
      "undefined",
      "boolean 及可选 MouseEvent",
      "开关状态变化后的回调。",
      "表单联动",
    ],
    ["loading", "boolean", "false", "true | false", "显示加载状态并暂时禁止操作。", "加载"],
    ["size", "BiuSize", "medium", "small | medium | large", "控制轨道和滑块尺寸。", "尺寸"],
    ["readOnly", "boolean", "false", "true | false", "保留当前状态但禁止切换。", "只读"],
    ["disabled", "boolean", "false", "true | false", "禁用开关。", "禁用"],
    [
      "checkedChildren / unCheckedChildren",
      "ReactNode",
      "undefined",
      "兼容属性；当前轨道不渲染文字",
      "保留兼容签名但开关视觉只展示圆形滑块，避免文字导致变形。",
      "无文字开关",
    ],
    ["className", "string", "undefined", "CSS class 字符串", "追加到 Switch 根按钮。", "样式覆写"],
    ["classNames", "ControlClassNames", "{}", "root | thumb", "按开关根节点和滑块区域覆写样式。", "区域样式"],
  ]),
  ...createApiRows("Select", [
    ["options", "SelectOption[]", "[]", "label | value | disabled 及扩展字段", "提供下拉选项数据。", "选项"],
    ["value", "string | string[]", "undefined", "单值或多值", "受控选择值；需配合 onChange 回写。", "受控选择"],
    ["defaultValue", "string | string[]", "undefined", "单值或多值", "非受控模式的初始选择。", "默认值"],
    ["mode", "SelectMode", "single", "single | multiple", "选择单选或多选模型。", "单选 / 多选"],
    ["multiple", "boolean", "false", "true | false", "mode=multiple 的兼容开关。", "兼容配置"],
    ["hasAllOption", "boolean", "false", "true | false", "在选项首位自动添加“全部”。", "全部选项"],
    ["allowAllSelect", "boolean", "false", "true | false", "多选模式下提供一键全选/取消全选。", "全选"],
    ["allOption", "SelectOption", "内置“全部”", "自定义 label/value/disabled", "覆盖自动添加的全部选项。", "全部选项"],
    [
      "onChange",
      "(value, option?, index?) => void",
      "undefined",
      "值、当前 option、选项索引",
      "选择变化时按三个参数回调；多选 option 可为数组。",
      "三参数回调",
    ],
    [
      "optionRender",
      "(option, index) => ReactNode",
      "undefined",
      "选项和索引",
      "自定义下拉列表项渲染。",
      "自定义 option",
    ],
    [
      "labelRender",
      "(value, option?) => ReactNode",
      "undefined",
      "值和 option",
      "自定义单选触发器中的标签。",
      "自定义 label",
    ],
    [
      "tagRender",
      "(option, onClose) => ReactNode",
      "undefined",
      "option 和关闭回调",
      "自定义多选标签；超长内容仍建议包裹 Ellipsis。",
      "自定义 tag",
    ],
    [
      "maxTagCount",
      "number | responsive",
      "undefined",
      "数字或 responsive",
      "限制触发器内可见标签数，超出显示 +N。",
      "标签省略",
    ],
    ["maxCount", "number", "undefined", "非负整数", "限制多选最多可选的值数量。", "数量限制"],
    ["searchable", "boolean", "false", "true | false", "在同一个下拉面板顶部启用 sticky 搜索。", "搜索"],
    ["searchValue", "string", "undefined", "受控搜索文本", "受控搜索关键词。", "搜索联动"],
    ["onSearch", "(value: string) => void", "undefined", "搜索文本", "搜索词变化后的回调。", "搜索联动"],
    [
      "filterOption",
      "(input, option) => boolean | boolean",
      "内部按 label/value 过滤",
      "回调或 false",
      "自定义或关闭本地选项过滤。",
      "过滤",
    ],
    ["dropdownRender", "(menu) => ReactNode", "undefined", "原菜单节点", "扩展下拉面板整体内容。", "面板扩展"],
    [
      "dropdownHeader / dropdownFooter",
      "ReactNode",
      "undefined",
      "任意 ReactNode",
      "在下拉面板顶部或底部渲染业务内容。",
      "面板插槽",
    ],
    [
      "onLoadMore",
      "() => void | Promise<void>",
      "undefined",
      "异步加载函数",
      "滚动到选项底部时加载更多数据。",
      "懒加载",
    ],
    ["hasMore / loadingMore", "boolean", "false", "true | false", "标记是否还有数据及当前是否正在加载。", "懒加载"],
    ["disabled / loading", "boolean", "false", "true | false", "禁用选择或显示加载状态。", "禁用 / 加载"],
    ["size", "BiuSize", "medium", "small | medium | large", "控制触发器高度；单选与多选保持同一尺寸。", "尺寸"],
    [
      "classNames",
      "SelectClassNames",
      "{}",
      "root | trigger | value | option | search | tag 等",
      "按触发器、面板、选项和标签区域覆写样式。",
      "区域样式",
    ],
  ]),
  ...createApiRows("DatePicker", [
    ["value", "Dayjs | null", "null", "Dayjs 或 null", "受控日期值。", "单日期"],
    ["defaultValue", "Dayjs | null", "null", "Dayjs 或 null", "非受控模式的初始日期。", "默认日期"],
    [
      "onChange",
      "(value, dateString?) => void",
      "undefined",
      "Dayjs|null 及格式化字符串",
      "日期确认后的回调。",
      "表单联动",
    ],
    [
      "format",
      "string",
      "YYYY-MM-DD",
      "YYYY-MM-DD | YYYY-MM-DD HH:mm:ss 等",
      "决定面板列和触发器输出格式。",
      "日期格式",
    ],
    ["showTime", "boolean", "false", "true | false", "在日期选择中增加时间列。", "日期时间"],
    ["hour12", "boolean", "false", "true | false", "时间列使用 12 小时制或 24 小时制。", "12 / 24 小时"],
    ["needConfirm", "boolean", "false", "true | false", "把面板选择保存在草稿，点击确定后提交并关闭。", "确定关闭"],
    ["showNow", "boolean", "true", "true | false", "显示“今天”快捷操作。", "今天"],
    ["allowClear", "boolean", "true", "true | false", "显示清除当前日期的操作。", "清除"],
    ["placeholder", "string", "请选择日期", "单个占位文案", "设置触发器占位文案。", "占位文案"],
    [
      "presets",
      "DatePickerPreset[]",
      "今天 / 明天 / 昨天",
      "label + value 或函数",
      "覆盖左侧快捷日期列表。",
      "快捷选择",
    ],
    ["disabledDate", "(date: Dayjs) => boolean", "undefined", "返回 true 禁用", "按日期禁用选择。", "禁用日期"],
    [
      "disabledTime",
      "(date, position?) => DisabledTime",
      "undefined",
      "小时 / 分钟 / 秒禁用配置",
      "按时间列禁用具体时段。",
      "禁用时间",
    ],
    ["min / max", "Dayjs", "undefined", "Dayjs 边界", "限制可选择的最早和最晚日期。", "日期范围"],
    [
      "open / defaultOpen / onOpenChange",
      "boolean / boolean / callback",
      "false / false / undefined",
      "受控或非受控浮层",
      "控制面板显示并接收开关变化。",
      "面板状态",
    ],
    ["disabled / readOnly", "boolean", "false", "true | false", "禁止打开或修改日期。", "禁用 / 只读"],
    [
      "classNames",
      "DatePickerClassNames",
      "{}",
      "root | trigger | panel | calendar | time | presets 等",
      "按日期、时间、预设和 footer 区域覆写样式。",
      "区域样式",
    ],
  ]),
  ...createApiRows("RangeDatePicker", [
    [
      "value",
      "[Dayjs | null, Dayjs | null]",
      "[null, null]",
      "起止日期元组",
      "受控日期范围；组件自动规范起止顺序。",
      "日期范围",
    ],
    [
      "defaultValue",
      "[Dayjs | null, Dayjs | null]",
      "[null, null]",
      "起止日期元组",
      "非受控模式的初始日期范围。",
      "默认范围",
    ],
    [
      "onChange",
      "(value, dateString?) => void",
      "undefined",
      "范围元组及字符串数组",
      "范围完成或点击确定后的回调。",
      "表单联动",
    ],
    ["format", "string", "YYYY-MM-DD", "YYYY-MM-DD | YYYY-MM-DD HH:mm:ss 等", "决定两侧日期输出格式。", "日期格式"],
    ["needConfirm", "boolean", "false", "true | false", "点击确定后提交范围并关闭面板。", "确定关闭"],
    [
      "presets",
      "DatePickerPreset[]",
      "近一周 / 近一月",
      "label + range 或函数",
      "覆盖左侧快捷范围列表。",
      "范围快捷选择",
    ],
    [
      "placeholder",
      "[string, string] | string",
      "请选择日期",
      "起始/结束占位文案",
      "设置两侧触发器占位文案。",
      "占位文案",
    ],
    [
      "disabledDate / disabledTime",
      "callback",
      "undefined",
      "日期或起止时间禁用配置",
      "限制范围中的日期或时间选项。",
      "禁用规则",
    ],
    [
      "open / defaultOpen / onOpenChange",
      "boolean / boolean / callback",
      "false / false / undefined",
      "受控或非受控浮层",
      "控制范围面板显示状态。",
      "面板状态",
    ],
    ["disabled / readOnly", "boolean", "false", "true | false", "禁止打开或修改日期范围。", "禁用 / 只读"],
    [
      "classNames",
      "DatePickerClassNames",
      "{}",
      "root | trigger | panel | calendar | time | presets 等",
      "按范围两侧、日历和快捷选择区域覆写样式。",
      "区域样式",
    ],
  ]),
  ...createApiRows("TimePicker", [
    ["value", "Dayjs | null", "null", "Dayjs 或 null", "受控时间值。", "单时间"],
    ["defaultValue", "Dayjs | null", "null", "Dayjs 或 null", "非受控模式的初始时间。", "默认时间"],
    [
      "onChange",
      "(value, dateString?) => void",
      "undefined",
      "Dayjs|null 及格式化字符串",
      "时间选择变化后的回调。",
      "表单联动",
    ],
    ["format", "string", "HH:mm", "HH:mm | HH:mm:ss | hh:mm A", "决定时间列和输出格式。", "时间格式"],
    ["hour12", "boolean", "false", "true | false", "切换 12 小时制和 24 小时制。", "12 / 24 小时"],
    ["needConfirm", "boolean", "false", "true | false", "点击确定后提交草稿并关闭面板。", "确定关闭"],
    ["presets", "DatePickerPreset[]", "[]", "label + time 或函数", "配置左侧快捷时间列表。", "快捷时间"],
    [
      "disabledTime",
      "(date, position?) => DisabledTime",
      "undefined",
      "小时 / 分钟 / 秒禁用配置",
      "禁用具体时段。",
      "禁用时间",
    ],
    [
      "open / defaultOpen / onOpenChange",
      "boolean / boolean / callback",
      "false / false / undefined",
      "受控或非受控浮层",
      "控制时间面板显示状态。",
      "面板状态",
    ],
    ["disabled / readOnly", "boolean", "false", "true | false", "禁止打开或修改时间。", "禁用 / 只读"],
    [
      "classNames",
      "DatePickerClassNames",
      "{}",
      "root | trigger | panel | time | footer 等",
      "按时间列、连接符和 footer 区域覆写样式。",
      "区域样式",
    ],
  ]),
  ...createApiRows("RangeTimePicker", [
    [
      "value",
      "[Dayjs | null, Dayjs | null]",
      "[null, null]",
      "起止时间元组",
      "受控时间范围；编辑任一侧都会保留另一侧值。",
      "时间范围",
    ],
    [
      "defaultValue",
      "[Dayjs | null, Dayjs | null]",
      "[null, null]",
      "起止时间元组",
      "非受控模式的初始时间范围。",
      "默认范围",
    ],
    ["onChange", "(value, dateString?) => void", "undefined", "范围元组及字符串数组", "时间变化后的回调。", "表单联动"],
    ["format", "string", "HH:mm", "HH:mm | HH:mm:ss | hh:mm A", "决定两侧时间输出格式。", "时间格式"],
    ["hour12", "boolean", "false", "true | false", "切换两侧的 12 小时制和 24 小时制。", "12 / 24 小时"],
    ["needConfirm", "boolean", "false", "true | false", "点击确定后提交时间范围并关闭面板。", "确定关闭"],
    [
      "presets",
      "DatePickerPreset[]",
      "近一小时 / 近一天",
      "label + range 或函数",
      "配置左侧快捷时间范围列表。",
      "范围快捷选择",
    ],
    [
      "disabledTime",
      "(date, position) => DisabledTime",
      "undefined",
      "start | end 及禁用配置",
      "按起止位置禁用时间选项。",
      "禁用时间",
    ],
    [
      "open / defaultOpen / onOpenChange",
      "boolean / boolean / callback",
      "false / false / undefined",
      "受控或非受控浮层",
      "控制时间范围面板显示状态。",
      "面板状态",
    ],
    ["disabled / readOnly", "boolean", "false", "true | false", "禁止打开或修改时间范围。", "禁用 / 只读"],
    [
      "classNames",
      "DatePickerClassNames",
      "{}",
      "root | trigger | panel | time | footer 等",
      "按两侧时间、连接符和 footer 区域覆写样式。",
      "区域样式",
    ],
  ]),
  ...createApiRows("Dialog", [
    ["open / defaultOpen", "boolean", "false", "true | false", "控制受控或非受控打开状态。", "打开 Dialog"],
    [
      "onOpenChange",
      "(open, reason?) => void",
      "undefined",
      "open + trigger/escape/overlay/close/programmatic",
      "接收 Dialog 状态和关闭原因。",
      "状态同步",
    ],
    ["modal", "boolean", "true", "true | false", "启用模态焦点管理和背景交互隔离。", "模态行为"],
    [
      "closeOnEscape / closeOnOverlayClick",
      "boolean",
      "true",
      "true | false",
      "控制 ESC 或遮罩点击是否关闭。",
      "关闭行为",
    ],
    [
      "position",
      "DialogPosition",
      "center",
      "center | top | bottom | left | right",
      "设置面板在视口中的停靠位置。",
      "位置",
    ],
    ["offsetTop / offsetLeft", "number | string", "undefined", "像素或 CSS 长度", "为面板定位增加安全区偏移。", "偏移"],
    ["fullscreen", "boolean", "false", "true | false", "让 Dialog 占满视口。", "全屏"],
    ["destroyOnClose", "boolean", "true", "true | false", "关闭时是否卸载组合内容。", "销毁策略"],
    [
      "container",
      "Element | null",
      "document.body",
      "Portal 挂载元素",
      "指定 Portal 容器，默认挂载 body 避免层级裁剪。",
      "Portal",
    ],
    [
      "className / classNames",
      "string / DialogClassNames",
      "undefined / {}",
      "root | overlay | panel | header | body | footer 等",
      "保留根前缀并按弹层区域覆写样式。",
      "区域样式",
    ],
  ]),
  ...createApiRows("Drawer", [
    [
      "placement",
      "DrawerPlacement",
      "right",
      "top | right | bottom | left",
      "设置 Drawer 从哪个视口边缘滑入。",
      "位置",
    ],
    ["size", "string | number", "420", "small | medium | large 或 CSS 长度", "设置侧向宽度或上下方向高度。", "尺寸"],
    ["open / defaultOpen", "boolean", "false", "true | false", "控制受控或非受控打开状态。", "打开 Drawer"],
    [
      "onOpenChange",
      "(open, reason?) => void",
      "undefined",
      "open + close reason",
      "接收 Drawer 状态和关闭原因。",
      "状态同步",
    ],
    ["modal", "boolean", "true", "true | false", "启用模态焦点管理和背景隔离。", "模态行为"],
    [
      "closeOnEscape / closeOnOverlayClick",
      "boolean",
      "true",
      "true | false",
      "控制 ESC 或遮罩点击是否关闭。",
      "关闭行为",
    ],
    ["destroyOnClose", "boolean", "true", "true | false", "关闭时是否卸载组合内容。", "销毁策略"],
    [
      "className / classNames",
      "string / DialogClassNames",
      "undefined / {}",
      "root | overlay | panel | header | body | footer 等",
      "按 Drawer 根节点和各区域覆写样式。",
      "区域样式",
    ],
  ]),
  ...createApiRows("Tooltip", [
    ["content", "ReactNode", "必填", "任意 ReactNode", "悬浮或聚焦时展示的说明内容。", "Tooltip"],
    [
      "placement",
      "TooltipPlacement",
      "TOP",
      "TOP | RIGHT | BOTTOM | LEFT 及对齐变体",
      "设置优先方向；Radix 根据空间自动翻转和避障。",
      "方向",
    ],
    ["onlyOverflow", "boolean", "false", "true | false", "仅在触发内容真实溢出时显示 Tooltip。", "溢出判断"],
    ["delayDuration", "number", "0", "非负毫秒数", "设置显示延迟。", "显示延迟"],
    ["sideOffset / alignOffset", "number", "8 / 0", "像素", "调整提示与触发器的距离及对齐偏移。", "间距"],
    [
      "collisionPadding / arrowPadding",
      "number | object / number",
      "8 / 6",
      "像素或四边配置",
      "为浮层和箭头避障保留边距。",
      "避障",
    ],
    ["avoidCollisions", "boolean", "true", "true | false", "启用 Radix 碰撞检测和自动翻转。", "自动避障"],
    ["maxWidth", "number | string", "min(320px, calc(100vw - 24px))", "CSS width", "限制提示内容最大宽度。", "宽度"],
    ["color", "string", "#172033", "CSS color", "覆盖提示背景色，同时箭头同步使用该颜色。", "颜色"],
    ["disabled", "boolean", "false", "true | false", "禁用 Tooltip 打开。", "禁用"],
    [
      "className / classNames",
      "string / TooltipClassNames",
      "undefined / {}",
      "root | trigger | content | arrow",
      "按触发器、内容和箭头区域覆写样式。",
      "区域样式",
    ],
  ]),
  ...createApiRows("Ellipsis", [
    ["children / content", "ReactNode", "children", "任意 ReactNode", "显示在省略区域中的文本或节点。", "短文本"],
    [
      "tooltipContent",
      "ReactNode",
      "content 或 children",
      "任意 ReactNode",
      "覆盖 Tooltip 中展示的完整内容。",
      "完整文本",
    ],
    [
      "maxWidth",
      "number | string",
      "undefined",
      "像素或 CSS width",
      "手动限制测量宽度，实际溢出后才显示 Tooltip。",
      "固定宽度",
    ],
    ["lines / rows", "number", "1", "正整数", "设置单行或多行省略行数。", "多行省略"],
    [
      "alwaysTooltip",
      "boolean",
      "false",
      "true | false",
      "即使没有溢出也显示完整 Tooltip；默认只在真实溢出时显示。",
      "永远提示",
    ],
    ["as", "React.ElementType", "span", "HTML 标签或 React 组件", "替换文本目标节点类型。", "节点类型"],
    [
      "className / style",
      "string / CSSProperties",
      "undefined",
      "CSS class 或内联样式",
      "追加到省略目标节点；Tooltip 由组件统一维护。",
      "样式覆写",
    ],
  ]),
  ...createApiRows("CopyText", [
    [
      "text",
      "string",
      "必填",
      "任意字符串",
      "复制到剪贴板的原始文本；即使 content 自定义展示，也始终复制该值。",
      "复制长文本",
    ],
    ["content", "ReactNode", "text", "任意 ReactNode", "替换省略区域的展示内容，不改变实际复制值。", "自定义展示内容"],
    ["lines", "number", "1", "正整数", "控制省略内容的行数。", "多行复制"],
    ["maxWidth", "number | string", "undefined", "像素或 CSS width", "限制省略文本的最大宽度。", "固定宽度"],
    [
      "alwaysTooltip",
      "boolean",
      "false",
      "true | false",
      "传给 Ellipsis；默认仅真实溢出时显示完整文本 Tooltip。",
      "溢出提示",
    ],
    [
      "copyOnHover",
      "boolean",
      "false",
      "true | false",
      "复制按钮默认持续展示；开启后仅容器 hover 或 focus 时展示。",
      "仅悬停显示",
    ],
    [
      "copyLabel / copiedLabel",
      "ReactNode",
      "复制文本 / 已复制",
      "任意 ReactNode",
      "分别设置复制按钮和复制成功状态的 Tooltip/无障碍文案。",
      "按钮提示",
    ],
    [
      "onCopy",
      "(text: string) => void | Promise<void>",
      "undefined",
      "复制成功后的回调",
      "复制成功后接收原始文本；组件优先使用 Clipboard API，失败时降级到 execCommand。",
      "复制回调",
    ],
    [
      "className / classNames",
      "string / CopyTextClassNames",
      "undefined / {}",
      "root | text | button",
      "追加根节点 className，或覆写 CopyText 各区域样式。",
      "区域样式",
    ],
  ]),
  ...createApiRows("Detail", [
    ["data", "T", "必填", "任意对象", "当前详情记录；字段默认从该对象读取。", "详情数据"],
    [
      "sections",
      "DetailSection<T>[]",
      "必填",
      "分组配置数组",
      "按顺序渲染详情分组，每个分组可以有自己的列数和边框。",
      "详情分组",
    ],
    ["columns", "number", "4", "正整数", "设置所有分组的默认栅格列数，分组可单独覆盖。", "四列布局"],
    ["gap", "number | string", "20", "像素或 CSS gap", "设置详情分组之间的间距。", "分组间距"],
    ["bordered", "boolean", "true", "true | false", "控制详情分组默认是否使用浅色背景和圆角边框。", "边框样式"],
    [
      "className / classNames",
      "string / DetailClassNames",
      "undefined / {}",
      "根节点和区域 class",
      "覆写根节点、分组、字段、标签和值区域，同时保留 biu-ui-detail 前缀。",
      "样式扩展",
    ],
  ]),
  ...createApiRows("DetailSection", [
    ["title", "ReactNode", "undefined", "任意 ReactNode", "分组标题；可以只传 icon 或完全不传。", "分组标题"],
    ["icon", "ReactNode", "undefined", "任意 ReactNode", "渲染在分组标题前的图标。", "分组图标"],
    ["items", "DetailItem<T>[]", "[]", "详情字段数组", "定义该区域中的标签、值、渲染方式和跨列规则。", "字段列表"],
    ["columns", "number", "继承 Detail.columns", "正整数", "覆盖当前分组的栅格列数。", "分组列数"],
    ["bordered", "boolean", "继承 Detail.bordered", "true | false", "只控制当前分组是否显示背景和边框。", "分组边框"],
  ]),
  ...createApiRows("DetailItem", [
    [
      "key / dataIndex",
      "keyof T | string | (record, index) => unknown",
      "key 必填",
      "对象路径或取值函数",
      "读取字段值；dataIndex 传入后优先于 key。支持 user.name 这类点路径。",
      "字段取值",
    ],
    ["title", "ReactNode", "必填", "任意 ReactNode", "渲染字段标签。", "字段标签"],
    [
      "render",
      "(value, record, index) => ReactNode",
      "undefined",
      "任意 ReactNode",
      "自定义字段值，适合 Tag、状态图标、组合文本和复杂内容。",
      "自定义值",
    ],
    ["span", "number", "1", "1 至当前分组列数", "控制字段横跨的栅格数量。", "跨列字段"],
    [
      "tooltip",
      "ReactNode",
      "undefined",
      "任意 ReactNode",
      "在字段标签后渲染问号图标，hover/focus 展示说明。",
      "字段说明",
    ],
    [
      "ellipsis",
      "boolean | EllipsisOptions",
      "false",
      "true | false | maxWidth/lines/tooltip",
      "使用公共 Ellipsis 展示长值，默认仅溢出时提示。",
      "长文本",
    ],
    [
      "className / classNames",
      "string / DetailItemClassNames",
      "undefined / {}",
      "root | label | value | tooltip",
      "覆写字段根节点、标签、值和说明按钮样式。",
      "字段样式",
    ],
  ]),
  ...createApiRows("Popover", [
    ["content", "ReactNode", "必填", "任意 ReactNode", "气泡中渲染的业务内容。", "Popover"],
    ["open / defaultOpen", "boolean", "false", "true | false", "控制受控或非受控显示状态。", "状态"],
    ["onOpenChange", "(open: boolean) => void", "undefined", "open", "气泡显示状态变化后的回调。", "状态同步"],
    [
      "side / align",
      "TooltipSide / TooltipAlign",
      "bottom / start",
      "top | right | bottom | left / start | center | end",
      "设置优先方向和对齐方式；空间不足时自动调整。",
      "方向",
    ],
    ["width / minWidth / maxWidth", "number | string", "undefined", "像素或 CSS width", "控制气泡内容尺寸。", "尺寸"],
    [
      "modal / sticky",
      "boolean / partial | always",
      "false / partial",
      "模态开关及粘性策略",
      "控制背景交互和碰撞时的定位策略。",
      "交互",
    ],
    ["disabled", "boolean", "false", "true | false", "禁用触发器和打开行为。", "禁用"],
    ["showArrow", "boolean", "true", "true | false", "显示跟随实际碰撞位置的箭头。", "箭头"],
    [
      "className / classNames",
      "string / PopoverClassNames",
      "undefined / {}",
      "root | trigger | content | arrow",
      "按气泡各区域覆写样式。",
      "区域样式",
    ],
  ]),
  ...createApiRows("Popconfirm", [
    ["title", "ReactNode", "必填", "任意 ReactNode", "确认气泡的主标题。", "确认删除"],
    ["description", "ReactNode", "undefined", "任意 ReactNode，可多行", "标题下的补充说明。", "多行说明"],
    [
      "onConfirm",
      "() => void | boolean | Promise<void | boolean>",
      "undefined",
      "返回 false 保持打开",
      "点击确定后的同步或异步处理；返回 false 不关闭。",
      "异步确认",
    ],
    ["onCancel", "() => void", "undefined", "无参数", "点击取消后的回调。", "取消"],
    [
      "type",
      "PopconfirmType",
      "default",
      "default | danger | success | warning | error | info",
      "控制确认语义色和确定按钮样式。",
      "语义类型",
    ],
    ["showCancel / showConfirm", "boolean", "true", "true | false", "控制取消或确定按钮是否渲染。", "操作按钮"],
    [
      "confirmProps / cancelProps",
      "ButtonHTMLAttributes<HTMLButtonElement>",
      "{}",
      "原生按钮属性",
      "覆写确认或取消按钮属性和样式。",
      "按钮定制",
    ],
    [
      "width / minWidth / maxWidth",
      "number | string",
      "undefined",
      "像素或 CSS width",
      "控制气泡内容尺寸，避免窄屏溢出。",
      "尺寸",
    ],
    ["disabled", "boolean", "false", "true | false", "禁用触发器和打开行为。", "禁用"],
  ]),
  ...createApiRows("DropdownMenu", [
    ["trigger", "ReactNode", "必填", "任意 ReactNode", "下拉菜单触发器。", "更多操作"],
    [
      "items",
      "DropdownMenuItem[]",
      "[]",
      "item | checkbox | radio | separator | label | children",
      "定义菜单项、分组、复选、单选和子菜单。",
      "菜单项",
    ],
    ["open / defaultOpen", "boolean", "false", "true | false", "控制受控或非受控打开状态。", "状态"],
    ["onOpenChange", "(open: boolean) => void", "undefined", "open", "菜单打开状态变化后的回调。", "状态同步"],
    ["onSelect", "(key: string) => void", "undefined", "菜单 key", "普通菜单项被选择后的回调。", "选择"],
    ["disabled", "boolean", "false", "true | false", "禁用触发器和整组菜单。", "禁用"],
    [
      "checkedKeys / defaultCheckedKeys",
      "string[]",
      "[]",
      "checkbox item key[]",
      "受控或非受控复选项状态。",
      "复选菜单",
    ],
    ["onCheckedChange", "(keys: string[]) => void", "undefined", "复选 key 数组", "复选项变化后的回调。", "复选菜单"],
    [
      "radioValues / defaultRadioValues",
      "Record<string, string | undefined>",
      "{}",
      "group -> key",
      "受控或非受控单选菜单状态。",
      "单选菜单",
    ],
    ["onRadioChange", "(value, group) => void", "undefined", "value 和 group", "单选菜单值变化后的回调。", "单选菜单"],
    [
      "dropdownRender / dropdownHeader / dropdownFooter",
      "callback / ReactNode / ReactNode",
      "undefined",
      "菜单节点及头尾节点",
      "扩展下拉面板整体、顶部或底部内容。",
      "面板插槽",
    ],
    [
      "classNames",
      "DropdownMenuClassNames",
      "{}",
      "root | trigger | content | menu | item | header | footer",
      "按菜单区域覆写样式。",
      "区域样式",
    ],
  ]),
  ...createApiRows("Tabs", [
    [
      "items",
      "TabItem[]",
      "[]",
      "key | label | children | disabled | closable",
      "定义标签、面板内容和关闭状态。",
      "Tabs",
    ],
    ["value / defaultValue", "string", "首个可用 key", "受控或非受控 key", "控制当前标签。", "受控 Tab"],
    ["onChange", "(key: string) => void", "undefined", "Tab key", "当前标签变化后的回调。", "切换"],
    [
      "onClose",
      "(key: string) => void",
      "undefined",
      "可关闭 Tab key",
      "点击关闭按钮后的回调；调用方负责移除 item。",
      "关闭 Tab",
    ],
    ["type", "TabsType", "line", "line | card | tag", "控制标签页视觉风格。", "三种样式"],
    ["orientation", "horizontal | vertical", "horizontal", "horizontal | vertical", "设置标签列表方向。", "方向"],
    [
      "showArrows",
      "auto | both | none",
      "auto",
      "auto | both | none",
      "仅在实际溢出时显示箭头；none 保留滚动但不显示箭头。",
      "溢出滚动",
    ],
    ["scrollable", "boolean", "true", "true | false", "允许标签列表滚动。", "滚动"],
    ["width", "number | string", "100%", "像素或 CSS width", "设置 Tab 容器宽度。", "容器宽度"],
    [
      "addButton / onAdd",
      "ReactNode / () => void",
      "undefined",
      "新增节点及回调",
      "在标签列表末尾渲染新增操作。",
      "新增 Tab",
    ],
    [
      "classNames",
      "TabsClassNames",
      "{}",
      "root | list | tab | panel | arrow | close",
      "按标签、面板、滚动箭头和关闭按钮覆写样式。",
      "区域样式",
    ],
  ]),
  ...createApiRows("Menu", [
    ["items", "MenuItem[]", "[]", "key | label | icon | disabled | children", "定义目录和菜单树。", "基座菜单"],
    ["selectedKey", "string", "undefined", "菜单 key", "受控当前选中菜单项。", "选中"],
    [
      "onSelect",
      "(key: string, item: MenuItem) => void",
      "undefined",
      "菜单 key 和 MenuItem",
      "叶子菜单项被选择后的回调。",
      "选择",
    ],
    ["openKeys / defaultOpenKeys", "string[]", "[]", "目录 key 数组", "控制受控或非受控展开目录。", "展开"],
    ["onOpenChange", "(keys: string[]) => void", "undefined", "目录 key 数组", "展开目录变化后的回调。", "展开联动"],
    ["collapsed", "boolean", "false", "true | false", "收起菜单文本，仅保留图标栏语义。", "收起菜单"],
    [
      "mode",
      '"inline" | "vertical" | "horizontal"',
      "inline",
      "inline | vertical | horizontal",
      "设置菜单的排列模式。",
      "菜单模式",
    ],
    [
      "className / classNames",
      "string / MenuClassNames",
      "undefined / {}",
      "root | group | item | icon | label | arrow | submenu",
      "按菜单层级和标签区域覆写样式。",
      "区域样式",
    ],
  ]),
  ...createApiRows("Breadcrumb", [
    ["items", "BreadcrumbItem[]", "[]", "key | label | href | onClick", "定义面包屑层级和每项导航行为。", "路径"],
    ["separator", "ReactNode", "/", "任意 ReactNode", "设置相邻面包屑之间的分隔符。", "分隔符"],
    [
      "className / classNames",
      "string / { root?: string; list?: string; item?: string; separator?: string }",
      "undefined / {}",
      "公开 slot",
      "按根节点、列表、项和分隔符覆写样式。",
      "区域样式",
    ],
  ]),
  ...createApiRows("Pagination", [
    ["current", "number", "1", "大于等于 1 的页码", "当前页码。", "分页"],
    ["pageSize", "number", "20", "正整数", "每页条数。", "分页"],
    ["total", "number", "0", "非负整数", "总数据条数。", "分页"],
    ["pageSizeOptions", "number[]", "[10, 20, 50]", "正整数数组", "页大小选择器的可选项。", "页大小"],
    ["showSizeChanger", "boolean", "false", "true | false", "显示每页条数选择器。", "页大小"],
    ["showQuickJumper", "boolean", "false", "true | false", "显示页码输入并支持回车快速跳转。", "快速跳转"],
    [
      "showTotal",
      "(total, range) => ReactNode",
      "undefined",
      "总数和 [start, end]",
      "自定义总数和当前范围展示。",
      "总数",
    ],
    ["simple", "boolean", "false", "true | false", "使用简洁的当前页/总页数布局。", "简洁模式"],
    ["responsive", "boolean", "true", "true | false", "窄屏时允许分页布局收敛。", "响应式"],
    ["hideOnSinglePage", "boolean", "false", "true | false", "只有一页时隐藏整个分页器。", "单页隐藏"],
    ["showLessItems", "boolean", "false", "true | false", "减少中间可见页码数量。", "页码布局"],
    [
      "itemRender",
      "(page, type, element) => ReactNode",
      "undefined",
      "page | prev | next",
      "自定义页码、上一页和下一页节点。",
      "自定义页码",
    ],
    ["onChange", "(page, pageSize) => void", "undefined", "页码和页大小", "分页或页大小变化后的回调。", "联动"],
  ]),
  ...createApiRows("Tree", [
    ["data", "TreeNode[]", "[]", "key | title | children | icon | disabled", "定义树节点层级和节点状态。", "树节点"],
    ["selectedKeys / defaultSelectedKeys", "string[]", "[]", "节点 key 数组", "控制受控或非受控选中节点。", "选中"],
    ["onSelect", "(keys: string[]) => void", "undefined", "节点 key 数组", "节点选中变化后的回调。", "联动"],
    ["expandedKeys / defaultExpandedKeys", "string[]", "[]", "节点 key 数组", "控制受控或非受控展开节点。", "展开"],
    ["onExpand", "(keys: string[]) => void", "undefined", "节点 key 数组", "节点展开变化后的回调。", "展开联动"],
    ["checkedKeys / defaultCheckedKeys", "string[]", "[]", "节点 key 数组", "控制受控或非受控勾选节点。", "勾选"],
    [
      "onCheck",
      "(keys, info) => void",
      "undefined",
      "keys + node/checked/halfCheckedKeys",
      "勾选变化后的回调。",
      "勾选联动",
    ],
    [
      "multiple / checkable / checkStrictly",
      "boolean",
      "false",
      "true | false",
      "启用多选、复选以及是否级联父子勾选。",
      "选择模式",
    ],
    ["showSearch", "boolean", "false", "true | false", "显示树内搜索框。", "搜索"],
    ["searchValue / defaultSearchValue", "string", "空字符串", "受控或非受控关键词", "控制树搜索文本。", "搜索"],
    [
      "filterTreeNode / titleRender",
      "callback",
      "undefined",
      "节点和关键词 / 节点",
      "自定义过滤和节点标题渲染。",
      "自定义节点",
    ],
    [
      "loadData",
      "(node) => TreeNode[] | void | Promise<TreeNode[] | void>",
      "undefined",
      "当前节点及异步子节点",
      "展开节点时按需加载子节点。",
      "懒加载",
    ],
    [
      "classNames",
      "TreeClassNames",
      "{}",
      "root | search | node | toggle | checkbox | icon | title",
      "按搜索框、层级、图标和标题区域覆写样式。",
      "区域样式",
    ],
  ]),
  ...createApiRows("Transfer", [
    ["source", "TransferItem[]", "[]", "label | value | disabled | icon", "定义左侧可选数据。", "双栏数据"],
    ["target", "TransferItem[]", "undefined", "右侧受控数据", "受控右侧目标数据。", "受控目标"],
    ["defaultTarget", "TransferItem[]", "[]", "初始目标数据", "非受控模式的初始右侧数据。", "默认目标"],
    ["onChange", "(target: TransferItem[]) => void", "undefined", "目标数据数组", "移动操作后的回调。", "联动"],
    ["titles", "[ReactNode, ReactNode]", "本地化默认值", "左侧、右侧标题", "自定义两栏标题。", "标题"],
    ["showSearch", "boolean", "false", "true | false", "在两栏内显示搜索框。", "搜索"],
    ["searchValue", "[string, string]", "['', '']", "左侧、右侧关键词", "受控两栏搜索文本。", "搜索联动"],
    [
      "onSearch",
      "(value, direction) => void",
      "undefined",
      "关键词和 left/right",
      "搜索文本变化后的回调。",
      "搜索联动",
    ],
    ["filterOption", "(input, item) => boolean", "label/value 包含匹配", "过滤回调", "自定义选项过滤规则。", "过滤"],
    ["selectedKeys / defaultSelectedKeys", "string[]", "[]", "条目 value 数组", "控制两栏当前勾选项。", "勾选"],
    ["onSelectChange", "(keys: string[]) => void", "undefined", "条目 value 数组", "勾选项变化后的回调。", "勾选联动"],
    ["oneWay", "boolean", "false", "true | false", "只允许从左侧移动到右侧。", "单向模式"],
    ["render", "(item, direction) => ReactNode", "undefined", "条目和方向", "自定义两栏中的条目内容。", "自定义条目"],
    [
      "operations / footer",
      "[ReactNode, ReactNode] / callback",
      "默认箭头 / undefined",
      "操作节点或 footer 回调",
      "自定义移动操作和列表底部内容。",
      "扩展区域",
    ],
    [
      "classNames",
      "TransferClassNames",
      "{}",
      "root | list | header | search | items | item | operations 等",
      "按双栏、搜索、列表项和操作区覆写样式。",
      "区域样式",
    ],
  ]),
  ...createApiRows("Alert", [
    [
      "status",
      "AlertStatus",
      "info",
      "default | info | success | warning | error",
      "设置提示语义色、边框和内置图标。",
      "状态",
    ],
    ["title", "ReactNode", "undefined", "任意 ReactNode", "渲染提示标题。", "标题"],
    [
      "description / children",
      "ReactNode",
      "undefined",
      "任意 ReactNode，可多行",
      "渲染详细说明；未传 description 时使用 children。",
      "多行提示",
    ],
    ["icon", "ReactNode", "内置语义图标", "任意 ReactNode", "替换内置图标；当前实现不以空白图标占位。", "自定义图标"],
    ["action", "ReactNode", "undefined", "任意 ReactNode", "在内容右侧渲染操作区。", "操作"],
    [
      "closable / onClose",
      "boolean / () => void",
      "false / undefined",
      "true | false 及关闭回调",
      "显示并处理右侧垂直居中的关闭按钮。",
      "关闭",
    ],
    ["banner / bordered", "boolean", "false / true", "true | false", "控制横幅模式和边框显示。", "视觉变体"],
    [
      "classNames",
      "AlertClassNames",
      "{}",
      "root | icon | content | title | description | action | close",
      "按提示各区域覆写样式。",
      "区域样式",
    ],
  ]),
  ...createApiRows("Message", [
    [
      "show",
      "(content, options?) => string",
      "生成实例 id",
      "content + BiuMessageOptions",
      "显示指定 type 的全局消息并返回实例 id。",
      "复杂消息",
    ],
    [
      "success / info / warning / error / primary / default",
      "(content, options?) => string",
      "生成实例 id",
      "content + 非 type 选项",
      "显示对应语义类型的全局消息。",
      "语义消息",
    ],
    ["duration", "number", "3200", "0 或正毫秒数；0 表示不自动关闭", "控制消息自动关闭时间。", "自动关闭"],
    ["closable", "boolean", "true", "true | false", "控制右侧独立关闭按钮。", "关闭按钮"],
    ["complex", "boolean", "false", "true | false", "false 为简约表面，true 为整块语义底色。", "简约 / 复杂"],
    [
      "draggable",
      "boolean",
      "false",
      "true | false",
      "允许拖动 fixed 消息在视窗内调整位置；普通流布局不适用。",
      "可拖动消息",
    ],
    [
      "locale / localeText",
      "BiuComponentsLocale / overrides",
      "zh-CN / {}",
      "zh-CN | en-US 及文案覆盖",
      "设置关闭按钮等内置文案。",
      "多语言",
    ],
    ["className", "string", "undefined", "CSS class 字符串", "追加到消息根节点。", "样式覆写"],
  ]),
  ...createApiRows("Empty", [
    ["description", "ReactNode", "暂无数据", "任意 ReactNode", "渲染空状态说明。", "空状态"],
    [
      "className / classNames",
      "string / { root?: string; content?: string }",
      "undefined / {}",
      "root | content",
      "按空状态根节点和文案区域覆写样式。",
      "区域样式",
    ],
  ]),
  ...createApiRows("Loading", [
    ["label", "ReactNode", "本地化“加载中…”", "任意 ReactNode", "替换加载器旁的提示文案。", "加载"],
    [
      "locale / localeText",
      "BiuComponentsLocale / overrides",
      "zh-CN / {}",
      "zh-CN | en-US 及文案覆盖",
      "设置默认加载文案。",
      "多语言",
    ],
    [
      "className / classNames",
      "string / { root?: string; spinner?: string; label?: string }",
      "undefined / {}",
      "root | spinner | label",
      "按加载器和文案区域覆写样式。",
      "区域样式",
    ],
  ]),
  ...createApiRows("Progress", [
    ["percent", "number", "必填", "0 - 100（组件自动截断）", "设置完成百分比。", "进度"],
    [
      "className / classNames",
      "string / { root?: string; track?: string; fill?: string }",
      "undefined / {}",
      "root | track | fill",
      "按进度根节点、轨道和填充条覆写样式。",
      "区域样式",
    ],
  ]),
  ...createApiRows("Tag", [
    [
      "color",
      '"default" | "success" | "warning" | "danger" | "info"',
      "default",
      "default | success | warning | danger | info",
      "设置轻量状态颜色。",
      "状态标签",
    ],
    ["children", "ReactNode", "必填", "任意 ReactNode", "渲染标签内容。", "标签"],
    [
      "className / classNames",
      "string / { root?: string }",
      "undefined / {}",
      "CSS class 或 root",
      "追加或覆写标签根节点样式。",
      "样式覆写",
    ],
  ]),
  ...createApiRows("Badge", [
    ["count", "ReactNode", "undefined", "数字或任意节点", "显示数字或自定义徽标内容。", "数字徽标"],
    ["dot", "boolean", "false", "true | false", "显示圆点徽标并忽略 count 展示。", "圆点徽标"],
    [
      "color",
      '"default" | "success" | "warning" | "danger" | "info"',
      "default",
      "default | success | warning | danger | info",
      "设置徽标颜色。",
      "颜色",
    ],
    ["children", "ReactNode", "undefined", "任意 ReactNode", "徽标附着的业务内容。", "徽标"],
    [
      "className / classNames",
      "string / { root?: string; count?: string; dot?: string }",
      "undefined / {}",
      "root | count | dot",
      "按徽标根节点、数字和圆点区域覆写样式。",
      "区域样式",
    ],
  ]),
  ...createApiRows("Steps", [
    [
      "items",
      "StepItem[]",
      "[]",
      "key | title | description | status | disabled",
      "定义步骤标题、说明、状态和禁用状态。",
      "流程步骤",
    ],
    ["current / defaultCurrent", "number", "0", "从 0 开始的步骤索引", "控制受控或非受控当前步骤。", "当前步骤"],
    ["onChange", "(current, item) => void", "undefined", "索引和 StepItem", "点击步骤后的回调。", "步骤联动"],
    ["direction", "horizontal | vertical", "horizontal", "horizontal | vertical", "设置步骤排列方向。", "方向"],
    [
      "classNames",
      "StepsClassNames",
      "{}",
      "root | item | trigger | index | text | line",
      "按数字、文本和连接线区域覆写样式。",
      "区域样式",
    ],
  ]),
  ...createApiRows("Typography", [
    ["as", "React.ElementType", "span", "HTML 标签或 React 组件", "设置文本语义元素。", "语义标签"],
    ["ellipsis", "boolean", "false", "true | false", "内容超出可用宽度时显示单行省略。", "超长文本"],
    ["strong", "boolean", "false", "true | false", "使用强调字重显示文本。", "强调文本"],
    ["muted", "boolean", "false", "true | false", "使用弱化文本颜色显示内容。", "弱化文本"],
    [
      "color",
      '"primary" | "success" | "warning" | "error" | "default" | string',
      "undefined",
      "语义色或 CSS 颜色值",
      "设置文本颜色；支持主题语义色和自定义颜色。",
      "语义色文本",
    ],
    ["Title.level", "1 | 2 | 3 | 4 | 5", "3", "h1-h5", "渲染对应级别的标题。", "标题"],
  ]),
  ...createApiRows("Space", [
    ["direction", "horizontal | vertical", "horizontal", "horizontal | vertical", "设置子项排列方向。", "方向"],
    [
      "size / align / wrap / split",
      "number | string | small | middle | large / CSSProperties['alignItems'] / boolean / ReactNode",
      "small / center / false / undefined",
      "尺寸、对齐、换行和分隔节点",
      "统一管理子项间距和排列。",
      "间距布局",
    ],
  ]),
  ...createApiRows("List", [
    ["dataSource", "T[]", "[]", "任意数据数组", "提供列表渲染数据源。", "数据列表"],
    [
      "renderItem",
      "(item: T, index: number) => ReactNode",
      "undefined",
      "列表条目渲染函数",
      "自定义每一项的内容。",
      "自定义条目",
    ],
    ["header / footer", "ReactNode", "undefined", "任意 ReactNode", "在列表顶部或底部渲染附加内容。", "列表区域"],
    [
      "bordered / size",
      "boolean / small | default | large",
      "false / default",
      "边框和尺寸配置",
      "设置列表边框及条目密度。",
      "列表样式",
    ],
  ]),
  ...createApiRows("ColorPicker", [
    ["value / defaultValue", "string", "#2563eb", "CSS 颜色值", "受控或非受控地设置当前颜色。", "当前颜色"],
    ["onChange", "(value: string) => void", "undefined", "CSS 颜色值", "颜色选择或预设颜色变化后的回调。", "颜色变化"],
    ["showText", "boolean", "true", "true | false", "是否显示当前颜色文本值。", "颜色文本"],
    ["presets", "string[]", "[]", "CSS 颜色值数组", "展示可快速选择的预设色块。", "预设颜色"],
    ["disabled", "boolean", "false", "true | false", "禁用颜色选择和预设色块。", "禁用状态"],
  ]),
  ...createApiRows("ContextMenu", [
    ["items", "ContextMenuItem[]", "[]", "key / label / disabled / onClick", "配置右键菜单条目及其操作。", "菜单条目"],
    ["children", "ReactNode", "-", "任意 ReactNode", "包裹需要响应右键菜单的内容区域。", "目标区域"],
  ]),
  ...createApiRows("ConfigProvider", [
    ["locale", "string", "zh-CN", "zh-CN | en-US 或兼容语言值", "为组件树提供全局语言配置。", "全局语言"],
    [
      "localeText",
      "Partial<Record<string, string>>",
      "{}",
      "中文 key 到覆写文案的映射",
      "覆写当前语言资源中的组件文案。",
      "文案覆写",
    ],
    [
      "theme / direction",
      "string / ltr | rtl",
      "undefined / ltr",
      "主题标识和文字方向",
      "向组件树提供全局主题标识和方向配置。",
      "全局配置",
    ],
  ]),
  ...createApiRows("Timeline", [
    [
      "items",
      "TimelineItem[]",
      "[]",
      "title | content | time | color | dot",
      "渲染时间线节点、内容、时间和自定义圆点。",
      "时间线",
    ],
    [
      "mode",
      "left | right | alternate",
      "left",
      "left | right | alternate",
      "设置纵向时间线的内容布局模式。",
      "纵向布局",
    ],
    [
      "direction",
      "vertical | horizontal",
      "vertical",
      "vertical | horizontal",
      "设置节点按纵向或横向排列。",
      "横向布局",
    ],
    ["pending", "ReactNode", "undefined", "任意 ReactNode", "在末尾渲染待处理节点。", "等待状态"],
    ["reverse", "boolean", "false", "true | false", "按相反顺序渲染节点。", "倒序"],
  ]),
  ...createApiRows("Spin", [
    [
      "spinning / tip / size",
      "boolean / ReactNode / small | default | large",
      "true / undefined / default",
      "加载状态、提示和尺寸",
      "渲染独立或覆盖在内容上的加载指示器。",
      "加载",
    ],
    ["fullscreen", "boolean", "false", "true | false", "独立 Spin 时覆盖当前视口。", "全屏加载"],
  ]),
  ...createApiRows("Image", [
    [
      "src / alt / width / height",
      "string / string / number | string / number | string",
      "undefined / '' / undefined / undefined",
      "图片地址、替代文本和尺寸",
      "渲染可约束尺寸的图片。",
      "基础图片",
    ],
    [
      "lazy / placeholder / fallback",
      "boolean / ReactNode / ReactNode",
      "false / undefined / undefined",
      "懒加载、加载中和失败内容",
      "提供图片加载状态的降级渲染。",
      "加载降级",
    ],
    [
      "preview / objectFit",
      "boolean / CSSProperties['objectFit']",
      "false / cover",
      "true | false / cover | contain 等",
      "点击打开预览，并控制图片适配方式。",
      "缩略图预览",
    ],
  ]),
  ...createApiRows("Notification", [
    [
      "notification.open",
      "(options: NotificationOptions) => { close() }",
      "-",
      "title | description | type | duration | closable",
      "在页面右上角打开可关闭通知。",
      "通知",
    ],
    [
      "notification.info / success / warning / error",
      "(description, options?) => handle",
      "-",
      "ReactNode + options",
      "按语义类型快速打开通知。",
      "语义通知",
    ],
  ]),
  ...createApiRows("Affix", [
    ["offsetTop / offsetBottom", "number", "0 / undefined", "像素偏移量", "滚动时将内容固定在视口边缘。", "固定位置"],
    [
      "target / onChange",
      "() => HTMLElement | null / (affixed) => void",
      "window / undefined",
      "滚动容器和状态回调",
      "监听指定滚动容器并通知固定状态。",
      "滚动监听",
    ],
  ]),
  ...createApiRows("ResizeBox", [
    [
      "width / height / resize",
      "number / number / width | height | both",
      "320 / 180 / both",
      "尺寸和调整方向",
      "渲染受边界约束的可调整容器。",
      "调整尺寸",
    ],
    [
      "minWidth / maxWidth / minHeight / maxHeight",
      "number",
      "120 / 1200 / 80 / 900",
      "非负像素值",
      "限制用户调整后的容器范围。",
      "尺寸边界",
    ],
    [
      "onResize",
      "(size: { width: number; height: number }) => void",
      "undefined",
      "最新宽高",
      "尺寸变化后同步当前宽高。",
      "尺寸回调",
    ],
  ]),
  ...createApiRows("Box", [
    ["as", "React.ElementType", "div", "HTML 标签或 React 组件", "替换容器根元素。", "容器"],
    [
      "css",
      "BoxStyle",
      "undefined",
      "CSSProperties | BoxStyle[] | (theme) => BoxStyle",
      "以 CSS-in-JS 对象、数组或函数设置根节点样式；数组按顺序合并。",
      "css 对象",
    ],
    [
      "sx",
      "BoxStyle",
      "undefined",
      "CSSProperties | BoxStyle[] | (theme) => BoxStyle",
      "css 的简写入口；合并顺序晚于 css、早于 style。",
      "sx 对象",
    ],
    [
      "style",
      "React.CSSProperties",
      "undefined",
      "CSSProperties",
      "使用原生 style 覆写 css 和 sx 的同名样式。",
      "最终覆写",
    ],
    [
      "className / classNames",
      "string / { root?: string }",
      "undefined / {}",
      "CSS class 或 root",
      "追加或覆写 Box 根节点样式。",
      "样式覆写",
    ],
  ]),
  ...createApiRows("Grid", [
    ["columns", "number | string", "2", "正整数或 CSS grid-template-columns", "设置网格列数或列模板。", "网格"],
    ["gap", "number | string", "12", "数字像素或 CSS 长度", "设置行列间距。", "间距"],
    [
      "className / classNames",
      "string / { root?: string }",
      "undefined / {}",
      "CSS class 或 root",
      "追加或覆写 Grid 根节点样式。",
      "样式覆写",
    ],
  ]),
  ...createApiRows("Stack", [
    ["direction", "row | column", "row", "row | column", "设置子项主轴方向。", "排列"],
    ["gap", "number | string", "8", "数字像素或 CSS 长度", "设置子项间距。", "间距"],
    ["align", "CSSProperties['alignItems']", "undefined", "start | center | end 等", "设置交叉轴对齐方式。", "对齐"],
    [
      "justify",
      "CSSProperties['justifyContent']",
      "undefined",
      "start | center | space-between 等",
      "设置主轴分布方式。",
      "分布",
    ],
    ["wrap", "CSSProperties['flexWrap']", "undefined", "wrap | nowrap | wrap-reverse", "控制子项是否换行。", "换行"],
  ]),
  ...createApiRows("Card", [
    ["title / description", "ReactNode", "undefined", "任意 ReactNode", "渲染卡片头部标题和说明。", "卡片头部"],
    ["footer", "ReactNode", "undefined", "任意 ReactNode", "渲染卡片底部区域。", "卡片底部"],
    [
      "className / classNames",
      "string / LayoutClassNames",
      "undefined / {}",
      "root | header | body | footer 等",
      "按卡片各区域覆写样式。",
      "区域样式",
    ],
  ]),
  ...createApiRows("Divider", [
    ["orientation", "horizontal | vertical", "horizontal", "horizontal | vertical", "设置分隔线方向。", "分隔线"],
    ["dashed", "boolean", "false", "true | false", "使用虚线样式。", "虚线"],
    ["children", "ReactNode", "undefined", "任意 ReactNode", "在分隔线上渲染文本或节点。", "带文字分隔"],
    [
      "className / classNames",
      "string / { root?: string; content?: string }",
      "undefined / {}",
      "root | content",
      "按分隔线和中间内容覆写样式。",
      "区域样式",
    ],
  ]),
  ...createApiRows("Collapsible", [
    ["open / defaultOpen", "boolean", "false", "true | false", "控制受控或非受控展开状态。", "折叠"],
    ["onOpenChange", "(open: boolean) => void", "undefined", "open", "展开状态变化后的回调。", "状态同步"],
    [
      "className / classNames",
      "string / CollapsibleClassNames",
      "undefined / {}",
      "root | trigger | content",
      "按根节点、触发器和内容区域覆写样式。",
      "区域样式",
    ],
  ]),
  ...createApiRows("Upload", [
    ["fileList / defaultFileList", "BiuFileItem[]", "[]", "受控或非受控文件数组", "控制当前上传队列。", "文件列表"],
    [
      "onFileListChange",
      "(items: BiuFileItem[]) => void",
      "undefined",
      "文件数组",
      "文件列表变化后的受控回调。",
      "文件列表",
    ],
    [
      "onFiles / onChange",
      "(files) => void / ChangeEventHandler<HTMLInputElement>",
      "undefined",
      "文件数组或原生事件",
      "选择文件后的业务回调。",
      "选择文件",
    ],
    ["accept", "string", "undefined", "MIME、扩展名或通配符", "限制可选择和校验的文件类型。", "类型校验"],
    ["maxSize", "number", "undefined", "字节数", "限制单个文件大小。", "大小校验"],
    ["maxCount", "number", "undefined", "非负整数", "限制队列中的文件数量。", "数量限制"],
    ["multiple / drag", "boolean", "false", "true | false", "启用多选和拖拽选择。", "拖拽上传"],
    [
      "beforeUpload",
      "(file, current) => boolean | void | Promise<boolean | void>",
      "undefined",
      "返回 false 拒绝",
      "文件进入队列前执行校验或异步预处理。",
      "上传前校验",
    ],
    [
      "customRequest",
      "(options) => void | Promise | abort handle",
      "undefined",
      "file/signal/onProgress/onSuccess/onError",
      "替换默认上传传输并回报进度。",
      "自定义上传",
    ],
    [
      "autoUpload / showFileList",
      "boolean",
      "true / true",
      "true | false",
      "控制是否自动上传及是否渲染文件列表。",
      "上传队列",
    ],
    [
      "onUploadStart / onUploadProgress / onUploadSuccess / onUploadError",
      "callbacks",
      "undefined",
      "文件及状态参数",
      "监听上传生命周期。",
      "上传状态",
    ],
    [
      "onPreview / onRemove / onCancel",
      "callbacks",
      "undefined",
      "文件项回调",
      "配置预览、移除、取消操作。",
      "文件操作",
    ],
    [
      "className / classNames",
      "string / FileClassNames",
      "undefined / {}",
      "root | list | item | icon | actions 等",
      "按上传区、列表、文件项和操作区覆写样式。",
      "区域样式",
    ],
  ]),
  ...createApiRows("FileList", [
    ["items", "BiuFileItem[]", "必填", "文件项数组", "渲染上传文件列表。", "文件列表"],
    ["showPreview / showDownload", "boolean", "true", "true | false", "控制文件项的预览和下载操作。", "文件操作"],
    [
      "onRemove / onPreview / onRetry / onCancel",
      "callbacks",
      "undefined",
      "BiuFileItem 回调",
      "处理文件项操作。",
      "文件操作",
    ],
    [
      "classNames",
      "FileClassNames",
      "{}",
      "list | item | icon | main | meta | actions 等",
      "按文件列表和文件项区域覆写样式。",
      "区域样式",
    ],
  ]),
  ...createApiRows("FileItem", [
    ["item", "BiuFileItem", "必填", "uid/name/size/type/status 等", "渲染单个文件项及上传状态。", "文件项"],
    ["showPreview / showDownload", "boolean", "true", "true | false", "控制预览和下载操作。", "文件操作"],
    [
      "onPreview / onRetry / onCancel / onRemove",
      "() => void",
      "undefined",
      "无参数操作回调",
      "处理当前文件项操作。",
      "文件操作",
    ],
  ]),
  ...createApiRows("FileCard", [
    ["name", "string", "必填", "文件名", "渲染文件名。", "文件卡片"],
    ["size", "string", "undefined", "格式化文件大小", "在文件名下方显示文件大小。", "文件大小"],
    ["onRemove", "() => void", "undefined", "无参数", "显示移除按钮并处理点击。", "移除"],
    [
      "locale / localeText",
      "BiuComponentsLocale / overrides",
      "zh-CN / {}",
      "zh-CN | en-US 及文案覆盖",
      "设置移除按钮等文案。",
      "多语言",
    ],
  ]),
  ...createApiRows("FilePreview", [
    ["file", "BiuFileItem | string", "必填", "文件项或 URL", "指定需要预览的文件。", "文件预览"],
    ["name", "string", "文件项名称", "文件名", "覆盖预览标题和下载文件名。", "文件名"],
    [
      "kind",
      "FilePreviewKind",
      "auto",
      "auto | image | pdf | video | audio | text | unsupported",
      "指定或自动识别预览类型。",
      "类型识别",
    ],
    ["height", "number | string", "320", "像素或 CSS 高度", "设置图片、PDF、视频或文本预览高度。", "预览尺寸"],
    [
      "onDownload / downloadName",
      "() => void / string",
      "undefined",
      "下载回调或文件名",
      "自定义下载行为或下载文件名。",
      "下载",
    ],
  ]),
  ...createApiRows("FileRender", [
    ["src", "string", "必填", "文件 URL", "以 URL 渲染统一文件预览。", "文件渲染"],
    [
      "name / kind",
      "string / FilePreviewKind",
      "URL 文件名 / auto",
      "文件名及预览类型",
      "指定展示文件名和预览类型。",
      "文件渲染",
    ],
    ["onDownload / downloadName", "() => void / string", "undefined", "下载回调或文件名", "配置下载行为。", "下载"],
  ]),
  ...createApiRows("FilePreviewDialog", [
    ["open", "boolean", "false", "true | false", "控制预览 Dialog 显示状态。", "打开预览"],
    ["onOpenChange", "(open: boolean) => void", "必填", "open", "接收预览弹层开关变化。", "状态同步"],
    [
      "file / title",
      "BiuFileItem | string / ReactNode",
      "必填 / 文件名",
      "文件或 URL 及标题",
      "配置预览文件和 Dialog 标题。",
      "预览 Dialog",
    ],
    [
      "kind / height",
      "FilePreviewKind / number | string",
      "auto / 320",
      "预览类型及高度",
      "传递给 FilePreview 的展示配置。",
      "预览配置",
    ],
  ]),
  ...createApiRows("Cascader", [
    ["options", "CascaderOption[]", "[]", "label/value/children/disabled", "定义多级级联节点。", "级联选择"],
    ["value / defaultValue", "string[]", "[]", "受控或非受控路径", "控制当前选中的级联路径。", "受控路径"],
    ["onChange", "(value, options) => void", "undefined", "路径及 CascaderOption[]", "级联路径变化后的回调。", "联动"],
    ["changeOnSelect", "boolean", "false", "true | false", "允许选择中间层级节点。", "中间节点"],
    [
      "optionRender / displayRender",
      "callbacks",
      "undefined",
      "选项和路径渲染回调",
      "自定义面板选项和触发器路径展示。",
      "自定义渲染",
    ],
    [
      "open / defaultOpen / onOpenChange",
      "boolean / boolean / callback",
      "false / false / undefined",
      "受控或非受控面板",
      "控制级联面板显示状态。",
      "面板状态",
    ],
    [
      "disabled / classNames",
      "boolean / CascaderClassNames",
      "false / {}",
      "true | false 及 root/trigger/content 等",
      "禁用交互并按区域覆写样式。",
      "状态与样式",
    ],
  ]),
  ...createApiRows("Anchor", [
    [
      "container",
      "HTMLElement | RefObject<HTMLElement> | string",
      "document",
      "DOM 元素、React ref 或 CSS selector",
      "指定要扫描标题的内容容器；未传入时扫描当前 document。",
      "内容容器",
    ],
    [
      "scrollContainer",
      "Window | HTMLElement | RefObject<HTMLElement> | string",
      "window",
      "window、滚动容器、React ref 或 CSS selector",
      "指定标题定位和当前项计算所使用的滚动上下文。",
      "容器滚动",
    ],
    [
      "levels",
      "AnchorHeadingLevel[]",
      "[1, 2, 3, 4, 5]",
      "1 | 2 | 3 | 4 | 5",
      "限制自动扫描的标题层级；组件最多支持 h1 到 h5。",
      "标题层级",
    ],
    [
      "selector",
      "string",
      "h1, h2, h3, h4, h5",
      "CSS selector",
      "自定义扫描选择器；非 h1-h5 节点会被安全忽略。",
      "自定义扫描",
    ],
    [
      "offsetTop",
      "number",
      "0",
      "非负像素值",
      "为吸顶 Header 预留顶部空间，同时应用于激活判断和点击定位。",
      "吸顶偏移",
    ],
    ["title", "ReactNode | null", "目录", "ReactNode 或 null", "自定义目录标题；传入 null 隐藏标题区域。", "目录标题"],
    ["maxItems", "number", "undefined", "非负整数", "限制渲染的标题链接数量。", "目录数量"],
    [
      "collapsibleLevels",
      "AnchorHeadingLevel[]",
      "[1, 2]",
      "1 | 2 | 3 | 4 | 5",
      "指定可以独立折叠子标题的层级；collapsible=true 时默认允许一级和二级标题折叠。",
      "节点折叠层级",
    ],
    [
      "collapsedKeys / defaultCollapsedKeys / onCollapsedKeysChange",
      "string[] / string[] / (keys: string[]) => void",
      "[] / [] / undefined",
      "标题 id 数组",
      "受控或非受控管理一级、二级目录节点的折叠状态。",
      "节点折叠状态",
    ],
    [
      "mode",
      '"static" | "fixed"',
      '"fixed"',
      "static | fixed",
      "static 按普通元素参与布局；fixed 悬浮在视窗左右边缘并限制最大高度。",
      "渲染模式",
    ],
    [
      "position",
      '"left" | "right"',
      '"right"',
      "left | right",
      "fixed 模式下选择锚点菜单靠近视窗左侧或右侧。",
      "悬浮位置",
    ],
    [
      "draggable",
      "boolean",
      "false",
      "true | false；仅 fixed 模式生效",
      "允许拖动目录标题在视窗内调整垂直位置；static 普通布局不响应拖动。",
      "可拖动目录",
    ],
    [
      "hideOnMobile",
      "boolean",
      "true",
      "true | false",
      "小屏自动隐藏 Anchor，避免目录挤压内容；static 模式同样遵守该约束。",
      "移动端隐藏",
    ],
    [
      "onChange",
      "(id: string, heading: HTMLElement) => void",
      "undefined",
      "标题 id 和 DOM 节点",
      "当前标题因滚动或点击变化时回调。",
      "当前标题",
    ],
    [
      "className",
      "string",
      "undefined",
      "CSS class 字符串",
      "追加到 Anchor 根节点并保留 biu-ui-anchor 前缀。",
      "根节点样式",
    ],
    [
      "classNames",
      "AnchorClassNames",
      "{}",
      "root | header | list | item | activeItem",
      "按目录区域追加定制 class。",
      "区域样式",
    ],
  ]),
  ...createApiRows("ScrollProgress", [
    [
      "target",
      "Window | HTMLElement | RefObject<HTMLElement> | string",
      "window",
      "window、滚动容器、React ref 或 CSS selector",
      "指定要计算滚动进度并执行回顶的对象。",
      "容器进度",
    ],
    ["showPercentage", "boolean", "true", "true | false", "是否显示当前滚动百分比；进度条始终反映真实比例。", "百分比"],
    [
      "showBackTop",
      "boolean",
      "true",
      "true | false",
      "是否显示回到顶部按钮；滚动距离超过 backTopThreshold 后出现。",
      "回顶按钮",
    ],
    ["backTopThreshold", "number", "8", "非负像素值", "控制回顶按钮出现的最小滚动距离。", "显示阈值"],
    ["behavior", "ScrollBehavior", "smooth", "smooth | auto", "设置回到顶部时的滚动动画行为。", "平滑回顶"],
    [
      "mode",
      '"static" | "fixed"',
      '"fixed"',
      "static | fixed",
      "static 作为普通元素渲染，fixed 悬浮在视窗角落；组件卡片展示使用 static。",
      "渲染模式",
    ],
    [
      "position",
      '"top-left" | "top-right" | "bottom-left" | "bottom-right"',
      '"bottom-right"',
      "四个视窗角落",
      "fixed 模式下设置进度条和回顶按钮的悬浮位置。",
      "悬浮位置",
    ],
    [
      "draggable",
      "boolean",
      "false",
      "true | false；仅 fixed 模式生效",
      "允许在视窗范围内拖动进度组件；static 普通布局保持调用方安排的位置。",
      "可拖动进度",
    ],
    [
      "label",
      "ReactNode",
      "undefined",
      "任意 ReactNode",
      "在进度条前显示可选说明，窄屏会自动隐藏以保留按钮空间。",
      "进度说明",
    ],
    [
      "onBackTop",
      "() => void",
      "undefined",
      "无参数回调",
      "用户点击回顶按钮后触发，可用于埋点或同步外部状态。",
      "回顶回调",
    ],
    [
      "className",
      "string",
      "undefined",
      "CSS class 字符串",
      "追加到 ScrollProgress 根节点并保留 biu-ui-scroll-progress 前缀。",
      "根节点样式",
    ],
    [
      "classNames",
      "ScrollProgressClassNames",
      "{}",
      "root | progress | value | label | button",
      "按进度、数值、说明和回顶按钮区域追加定制 class。",
      "区域样式",
    ],
  ]),
];

/* Keep the compact source catalogue readable while preserving exact metadata
 * for the properties whose public signatures cannot be inferred positionally
 * (for example Button.block has a fourth property but the old compact type
 * string only had three segments). */
const apiPropertyDetails: Record<string, Record<string, ApiPropertyDetail>> = {
  "Button / ButtonGroup": {
    type: {
      type: "ButtonType",
      defaultValue: "default",
      options: "primary | warning | error | success | secondary | dark | default",
      description: "按钮语义色；contained 按钮使用对应的主色背景。",
    },
    variant: {
      type: "ButtonVariant",
      defaultValue: "contained",
      options: "contained | text | outlined",
      description: "控制按钮是实体、文字还是描边视觉。",
    },
    shape: {
      type: "ButtonShape",
      defaultValue: "default",
      options: "default | round | circle | square",
      description: "控制按钮圆角、圆形图标按钮或方形按钮形状。",
    },
  },
  Button: {
    icon: {
      type: "ReactNode",
      defaultValue: "undefined",
      options: "任意 ReactNode",
      description: "在按钮中渲染图标。",
    },
    iconPosition: {
      type: "ButtonIconPosition",
      defaultValue: "before",
      options: "before | after | center",
      description: "控制图标位于文字前、后或居中。",
    },
    loading: {
      type: "boolean",
      defaultValue: "false",
      options: "true | false",
      description: "显示加载状态并阻止重复点击。",
    },
    block: { type: "boolean", defaultValue: "false", options: "true | false", description: "让按钮占满父容器一整行。" },
  },
  "TextField / Textarea": {
    value: { type: "string", defaultValue: "undefined", options: "任意字符串", description: "受控输入值。" },
    onChange: {
      type: "(event) => void",
      defaultValue: "undefined",
      options: "React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>",
      description: "输入值变化时回调。",
    },
    onInput: {
      type: "(event) => void",
      defaultValue: "undefined",
      options: "React.FormEvent<HTMLInputElement | HTMLTextAreaElement>",
      description: "原生 input 事件回调。",
    },
    allowClear: {
      type: "boolean",
      defaultValue: "false",
      options: "true | false",
      description: "有值时显示清除按钮并回调 onClear。",
    },
    showCount: {
      type: "boolean",
      defaultValue: "false",
      options: "true | false",
      description: "显示当前长度与最大长度计数。",
    },
    maxLength: { type: "number", defaultValue: "undefined", options: "非负整数", description: "限制输入最大字符数。" },
    addonBefore: {
      type: "ReactNode",
      defaultValue: "undefined",
      options: "任意 ReactNode",
      description: "在输入框左侧渲染前置内容。",
    },
    addonAfter: {
      type: "ReactNode",
      defaultValue: "undefined",
      options: "任意 ReactNode",
      description: "在输入框右侧渲染后置内容。",
    },
    inputProps: {
      type: "HTMLInput/HTMLTextArea attributes",
      defaultValue: "{}",
      options: "原生属性",
      description: "透传 autocomplete、name、aria-* 等原生属性。",
    },
  },
  InputNumber: {
    min: { type: "number", defaultValue: "undefined", options: "任意数字", description: "允许输入的最小值。" },
    max: { type: "number", defaultValue: "undefined", options: "任意数字", description: "允许输入的最大值。" },
    step: { type: "number", defaultValue: "1", options: "正数", description: "点击加减按钮或滚轮时的增量。" },
    decimal: {
      type: "number",
      defaultValue: "undefined",
      options: "0 或正整数",
      description: "保留的小数位数；替代可读性较差的 precision。",
    },
    changeOnWheel: {
      type: "boolean",
      defaultValue: "false",
      options: "true | false",
      description: "聚焦时允许滚轮修改数值。",
    },
  },
  "Checkbox / Radio / Switch": {
    checked: { type: "boolean", defaultValue: "false", options: "true | false", description: "受控选中或开关状态。" },
    value: {
      type: "string | number",
      defaultValue: "undefined",
      options: "业务值",
      description: "单项或分组提交时对应的选项值。",
    },
    onChange: {
      type: "(value, event?) => void",
      defaultValue: "undefined",
      options: "最新值及事件",
      description: "状态变化后的表单联动回调。",
    },
    disabled: {
      type: "boolean",
      defaultValue: "false",
      options: "true | false",
      description: "禁用交互并使用 not-allowed 光标。",
    },
    readOnly: {
      type: "boolean",
      defaultValue: "false",
      options: "true | false",
      description: "保留可读状态但阻止修改。",
    },
  },
  "CheckboxGroup / RadioGroup": {
    direction: {
      type: "horizontal | vertical",
      defaultValue: "horizontal",
      options: "horizontal | vertical",
      description: "设置选项横向或纵向排列。",
    },
    optionRender: {
      type: "(option, index) => ReactNode",
      defaultValue: "undefined",
      options: "选项和索引",
      description: "自定义每个选项的展示内容。",
    },
    classNames: {
      type: "GroupClassNames",
      defaultValue: "{}",
      options: "root | option | input | label",
      description: "覆盖分组和选项区域样式。",
    },
  },
  Select: {
    options: {
      type: "SelectOption[]",
      defaultValue: "[]",
      options: "label/value/disabled 等字段",
      description: "下拉选项数据。",
    },
    mode: {
      type: "single | multiple",
      defaultValue: "single",
      options: "single | multiple",
      description: "选择单值或多值。",
    },
    hasAllOption: {
      type: "boolean",
      defaultValue: "false",
      options: "true | false",
      description: "在选项首位自动添加“全部”选项。",
    },
    allowAllSelect: {
      type: "boolean",
      defaultValue: "false",
      options: "true | false",
      description: "多选模式下显示一键全选/取消全选操作。",
    },
    onChange: {
      type: "(value, option, index) => void",
      defaultValue: "undefined",
      options: "值、当前 option、选项索引",
      description: "选择变化回调，按约定提供三个参数。",
    },
    optionRender: {
      type: "(option, index) => ReactNode",
      defaultValue: "undefined",
      options: "选项和索引",
      description: "自定义下拉列表项渲染。",
    },
    labelRender: {
      type: "(value, option) => ReactNode",
      defaultValue: "undefined",
      options: "值和 option",
      description: "自定义触发器中的单选标签。",
    },
    tagRender: {
      type: "(option, onClose) => ReactNode",
      defaultValue: "undefined",
      options: "option 和关闭回调",
      description: "自定义多选标签。",
    },
    searchable: {
      type: "boolean",
      defaultValue: "false",
      options: "true | false",
      description: "在下拉面板顶部启用 sticky 搜索框。",
    },
    dropdownRender: {
      type: "(menu) => ReactNode",
      defaultValue: "undefined",
      options: "下拉菜单节点",
      description: "自定义下拉面板顶部、底部或整体内容。",
    },
    onLoadMore: {
      type: "() => void | Promise<void>",
      defaultValue: "undefined",
      options: "异步加载函数",
      description: "滚动到选项底部时加载更多数据。",
    },
  },
  "DatePicker / RangeDatePicker": {
    format: {
      type: "string",
      defaultValue: "YYYY-MM-DD",
      options: "dayjs 格式串",
      description: "决定触发器和回调日期字符串格式。",
    },
    value: {
      type: "Dayjs | null | [Dayjs | null, Dayjs | null]",
      defaultValue: "null / [null, null]",
      options: "单值或起止元组",
      description: "受控日期或日期范围。",
    },
    presets: {
      type: "DatePickerPreset[]",
      defaultValue: "内置今日/明日/昨日",
      options: "label + value/function",
      description: "左侧快捷日期列表；单日期默认使用今天、明天、昨天。",
    },
    disabledDate: {
      type: "(date) => boolean",
      defaultValue: "undefined",
      options: "返回 true 禁用",
      description: "按日期禁用选择。",
    },
  },
  "TimePicker / RangeTimePicker": {
    format: {
      type: "string",
      defaultValue: "HH:mm",
      options: "HH:mm | HH:mm:ss 等",
      description: "决定时分秒选择列和输出格式。",
    },
    hour12: {
      type: "boolean",
      defaultValue: "false",
      options: "true | false",
      description: "切换 12 小时制和 24 小时制。",
    },
    disabledTime: {
      type: "(date, position) => DisabledTime",
      defaultValue: "undefined",
      options: "start | end",
      description: "按小时、分钟、秒禁用时间选项。",
    },
    needConfirm: {
      type: "boolean",
      defaultValue: "false",
      options: "true | false",
      description: "需要点击确定提交草稿并关闭面板。",
    },
  },
  "Dialog / Drawer": {
    open: { type: "boolean", defaultValue: "false", options: "true | false", description: "受控显示状态。" },
    onOpenChange: {
      type: "(open, reason) => void",
      defaultValue: "undefined",
      options: "open/close reason",
      description: "遮罩、ESC、关闭按钮或 footer 操作导致状态变化时回调。",
    },
    position: {
      type: "DialogPosition",
      defaultValue: "center",
      options: "center | top | right | bottom | left",
      description: "Dialog 面板在 viewport 中的定位。",
    },
    placement: {
      type: "DrawerPlacement",
      defaultValue: "right",
      options: "top | right | bottom | left",
      description: "Drawer 从哪个边缘滑入。",
    },
  },
  "Tooltip / Ellipsis": {
    content: { type: "ReactNode", defaultValue: "undefined", options: "任意 ReactNode", description: "悬浮提示内容。" },
    placement: {
      type: "TooltipPlacement",
      defaultValue: "top",
      options: "top | right | bottom | left 及对齐变体",
      description: "提示相对触发器的方向，Radix 负责碰撞调整。",
    },
    onlyOverflow: {
      type: "boolean",
      defaultValue: "false",
      options: "true | false",
      description: "仅文本实际溢出时触发 Tooltip。",
    },
    maxWidth: {
      type: "number | string",
      defaultValue: "undefined",
      options: "CSS width",
      description: "手动限制测量和截断宽度。",
    },
  },
  "Popover / Popconfirm": {
    open: { type: "boolean", defaultValue: "false", options: "true | false", description: "受控气泡显示状态。" },
    side: {
      type: "top | right | bottom | left",
      defaultValue: "bottom",
      options: "top | right | bottom | left",
      description: "气泡优先出现方向，空间不足时自动避障。",
    },
    align: {
      type: "start | center | end",
      defaultValue: "center",
      options: "start | center | end",
      description: "气泡相对触发器的横向/纵向对齐。",
    },
    size: {
      type: "number | string | auto",
      defaultValue: "auto",
      options: "CSS width",
      description: "限制气泡内容宽度。",
    },
    disabled: {
      type: "boolean",
      defaultValue: "false",
      options: "true | false",
      description: "禁用触发器和打开行为。",
    },
  },
  DropdownMenu: {
    items: {
      type: "DropdownItem[]",
      defaultValue: "[]",
      options: "item | checkbox | radio | submenu 等",
      description: "菜单项、分隔项、标签和子菜单树。",
    },
    checkedKeys: { type: "string[]", defaultValue: "[]", options: "菜单 key[]", description: "受控复选菜单项。" },
    radioValues: {
      type: "Record<string, string>",
      defaultValue: "{}",
      options: "radio group -> key",
      description: "受控单选菜单值。",
    },
    onSelect: {
      type: "(key, item) => void",
      defaultValue: "undefined",
      options: "菜单 key 和 item",
      description: "点击菜单项后的选择回调。",
    },
    dropdownRender: {
      type: "(menu, context) => ReactNode",
      defaultValue: "undefined",
      options: "菜单节点和状态上下文",
      description: "自定义菜单顶部、底部或整体渲染。",
    },
  },
  "Tabs / Menu": {
    items: {
      type: "TabItem[] | MenuItem[]",
      defaultValue: "[]",
      options: "key、label、children 等",
      description: "标签页或菜单节点数据。",
    },
    type: {
      type: "line | card | tag",
      defaultValue: "line",
      options: "line | card | tag",
      description: "Tabs 视觉样式。",
    },
    value: { type: "string", defaultValue: "首个可用项", options: "item key", description: "受控当前标签或菜单项。" },
    onChange: {
      type: "(key) => void",
      defaultValue: "undefined",
      options: "item key",
      description: "当前标签或菜单项变化回调。",
    },
    onClose: {
      type: "(key) => void",
      defaultValue: "undefined",
      options: "可关闭 item key",
      description: "关闭标签页回调。",
    },
  },
  "Alert / Empty / Loading / Progress": {
    status: {
      type: "default | info | success | warning | error",
      defaultValue: "info",
      options: "default | info | success | warning | error",
      description: "状态语义和对应颜色。",
    },
    title: { type: "ReactNode", defaultValue: "undefined", options: "任意 ReactNode", description: "状态组件标题。" },
    description: {
      type: "ReactNode",
      defaultValue: "undefined",
      options: "任意 ReactNode",
      description: "支持多行的详细说明内容。",
    },
    icon: {
      type: "ReactNode | false",
      defaultValue: "内置语义图标",
      options: "ReactNode 或 false",
      description: "替换或隐藏状态图标。",
    },
    action: {
      type: "ReactNode",
      defaultValue: "undefined",
      options: "任意 ReactNode",
      description: "在状态内容末尾渲染操作。",
    },
    percent: { type: "number", defaultValue: "0", options: "0 - 100", description: "Progress 当前完成百分比。" },
  },
  "Upload / File Preview": {
    accept: {
      type: "string",
      defaultValue: "undefined",
      options: "MIME、扩展名或通配符",
      description: "限制可选择的文件类型。",
    },
    maxSize: { type: "number", defaultValue: "undefined", options: "字节数", description: "限制单个文件大小。" },
    multiple: {
      type: "boolean",
      defaultValue: "false",
      options: "true | false",
      description: "允许一次选择多个文件。",
    },
    beforeUpload: {
      type: "(file) => boolean | Promise<boolean>",
      defaultValue: "undefined",
      options: "返回 false 拒绝",
      description: "上传前执行校验或异步预处理。",
    },
    onChange: {
      type: "(files, info) => void",
      defaultValue: "undefined",
      options: "文件列表和变更信息",
      description: "文件新增、进度、成功、失败或移除时回调。",
    },
  },
};

// Keep the legacy arrays above for source-level comparison while rendering
// only the exact catalogue.  This prevents an old shorthand row from adding a
// stale prop such as Transfer.dataSource or Loading.spinning back into the
// public documentation.
void uiApiRows;
void supplementalApiRows;
const allApiRows = canonicalApiRows.map((row) => {
  const details = apiPropertyDetails[row.component];
  return details ? { ...row, propertyDetails: { ...details, ...row.propertyDetails } } : row;
});

const exactComponentNames = new Set(
  allApiRows.filter((row) => !row.component.includes(" / ")).map((row) => row.component),
);

function rowsForComponents(...components: string[]) {
  const wanted = new Set(components);
  return allApiRows.flatMap((row) =>
    row.component
      .split(/\s+\/\s+/)
      .map((component) => component.trim())
      .filter((component) => wanted.has(component))
      .filter((component) => {
        // Legacy grouped rows are still accepted as authoring shorthand, but
        // once an independent component catalogue exists they must not leak
        // into another component's section. Button keeps the shared visual
        // row; ButtonGroup has its own exact gap/classNames row above.
        if (row.component === "Button / ButtonGroup") return component === "Button";
        return !row.component.includes(" / ") || !exactComponentNames.has(component);
      })
      .map((component) => ({ ...row, component })),
  );
}

const sectionApiRows: Record<string, CapabilityApiRow[]> = {
  button: rowsForComponents("Button", "ButtonGroup"),
  cascader: rowsForComponents("Cascader"),
  "textfield-textarea": rowsForComponents("TextField", "Textarea"),
  "input-number": rowsForComponents("InputNumber"),
  checkbox: rowsForComponents("Checkbox", "CheckboxGroup"),
  radio: rowsForComponents("Radio", "RadioGroup"),
  switch: rowsForComponents("Switch"),
  select: rowsForComponents("Select"),
  "date-picker": rowsForComponents("DatePicker", "RangeDatePicker"),
  "time-picker": rowsForComponents("TimePicker", "RangeTimePicker"),
  dialog: rowsForComponents("Dialog"),
  drawer: rowsForComponents("Drawer"),
  tooltip: rowsForComponents("Tooltip"),
  ellipsis: rowsForComponents("Ellipsis"),
  "copy-text": rowsForComponents("CopyText"),
  detail: rowsForComponents("Detail", "DetailSection", "DetailItem"),
  popover: rowsForComponents("Popover"),
  popconfirm: rowsForComponents("Popconfirm"),
  "dropdown-menu": rowsForComponents("DropdownMenu"),
  tabs: rowsForComponents("Tabs"),
  menu: rowsForComponents("Menu", "Breadcrumb"),
  pagination: rowsForComponents("Pagination"),
  tree: rowsForComponents("Tree"),
  transfer: rowsForComponents("Transfer"),
  alert: rowsForComponents("Alert"),
  message: rowsForComponents("Message"),
  empty: rowsForComponents("Empty"),
  loading: rowsForComponents("Loading"),
  progress: rowsForComponents("Progress"),
  tag: rowsForComponents("Tag"),
  badge: rowsForComponents("Badge"),
  steps: rowsForComponents("Steps"),
  typography: rowsForComponents("Typography"),
  space: rowsForComponents("Space"),
  list: rowsForComponents("List"),
  colorpicker: rowsForComponents("ColorPicker"),
  "context-menu": rowsForComponents("ContextMenu"),
  "config-provider": rowsForComponents("ConfigProvider"),
  timeline: rowsForComponents("Timeline"),
  spin: rowsForComponents("Spin"),
  image: rowsForComponents("Image"),
  notification: rowsForComponents("Notification"),
  affix: rowsForComponents("Affix"),
  resizebox: rowsForComponents("ResizeBox"),
  box: rowsForComponents("Box"),
  grid: rowsForComponents("Grid"),
  stack: rowsForComponents("Stack"),
  card: rowsForComponents("Card"),
  divider: rowsForComponents("Divider"),
  collapsible: rowsForComponents("Collapsible"),
  "anchor-scroll-progress": rowsForComponents("Anchor", "ScrollProgress"),
  "upload-file-preview": rowsForComponents(
    "Upload",
    "FileList",
    "FileItem",
    "FileCard",
    "FilePreview",
    "FileRender",
    "FilePreviewDialog",
  ),
};

function ComponentCatalogRenderer({ pro }: { pro: boolean }) {
  const { locale } = useBiuContext();
  const [buttonClicks, setButtonClicks] = useState(0);
  const [text, setText] = useState("组件库");
  const [number, setNumber] = useState<number | string>(3.14);
  const [checks, setChecks] = useState(["ui"]);
  const [radio, setRadio] = useState("react");
  const [switched, setSwitched] = useState(false);
  const [select, setSelect] = useState<string | string[]>(pro ? ["platform"] : "platform");
  const [multiSelect, setMultiSelect] = useState<string[]>(["platform", "product", "design"]);
  const [cascade, setCascade] = useState<string[]>(["china", "east", "shanghai"]);
  const [date, setDate] = useState<React.ComponentProps<typeof DatePicker>["value"]>(dayjs("2026-09-01 09:09:09"));
  const [rangeDate, setRangeDate] = useState<React.ComponentProps<typeof RangeDatePicker>["value"]>([
    dayjs("2026-09-01 09:09:09"),
    dayjs("2026-09-30 18:30:00"),
  ]);
  const [time, setTime] = useState<React.ComponentProps<typeof TimePicker>["value"]>(dayjs("2026-09-01 09:09:09"));
  const [rangeTime, setRangeTime] = useState<React.ComponentProps<typeof RangeTimePicker>["value"]>([
    dayjs("2026-09-01 09:09:00"),
    dayjs("2026-09-01 18:30:00"),
  ]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [menuKey, setMenuKey] = useState("overview");
  const [dropdownChecks, setDropdownChecks] = useState(["compact"]);
  const [dropdownRadio, setDropdownRadio] = useState("light");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [treeSelected, setTreeSelected] = useState(["control"]);
  const [transfer, setTransfer] = useState<Array<{ label: ReactNode; value: string }>>([
    { label: "Runtime", value: "runtime" },
  ]);
  const scrollDemoRef = useRef<HTMLDivElement>(null);
  const [previewFile, setPreviewFile] = useState<BiuFileItem>();
  const [files, setFiles] = useState<BiuFileItem[]>([
    { uid: "logo", name: "logo.svg", type: "image/svg+xml", url: "/logo.svg", status: "success" },
    { uid: "guide", name: "guide.pdf", type: "application/pdf", url: "/guide.pdf", status: "ready" },
  ]);
  const options = [
    { label: "平台工程与基础架构团队", value: "platform" },
    { label: "业务研发与数据应用团队", value: "product" },
    { label: "体验设计与设计系统团队", value: "design", disabled: pro },
  ];
  const showButtonMessage = (type: "primary" | "warning" | "error" | "success" | "secondary" | "dark" | "default") => {
    setButtonClicks((value) => value + 1);
    const messageType = type === "dark" ? "primary" : type === "secondary" ? "info" : type;
    biuMessage[messageType](`${type} 按钮已点击`, { locale });
  };

  return (
    <CapabilityGrid>
      <Section
        id="button"
        title="按钮 Button / ButtonGroup"
        description="语义类型、contained/text/outlined、图标位置、loading、readonly、block 和交互反馈。"
      >
        <ButtonGroup className="biu-showcase-button-group">
          <Button type="primary" onClick={() => showButtonMessage("primary")}>
            Primary
          </Button>
          <Button type="warning" onClick={() => showButtonMessage("warning")}>
            Warning
          </Button>
          <Button type="error" onClick={() => showButtonMessage("error")}>
            Error
          </Button>
          <Button
            type="success"
            icon={<Check size={15} />}
            iconPosition="after"
            onClick={() => showButtonMessage("success")}
          >
            Success
          </Button>
          <Button type="secondary" onClick={() => showButtonMessage("secondary")}>
            Secondary
          </Button>
          <Button type="dark" shape="round" onClick={() => showButtonMessage("dark")}>
            Dark
          </Button>
          <Button type="default" loading>
            Loading
          </Button>
          <Button
            type="default"
            variant="outlined"
            icon={<Plus size={14} />}
            iconPosition="before"
            iconSize={14}
            onClick={() => showButtonMessage("default")}
          >
            Default
          </Button>
          <Button type="secondary" size="small" onlyIcon icon={<Settings size={15} />} aria-label="独立图标按钮">
            独立图标按钮
          </Button>
        </ButtonGroup>
        <CapabilityActions>
          <span>点击次数：{buttonClicks}</span>
          <Button type="primary" variant="outlined" block>
            Block 按钮
          </Button>
        </CapabilityActions>
      </Section>

      <Section
        id="detail"
        title="详情 Detail"
        description="通过 data、sections 和字段配置渲染分组详情；支持跨列、自定义值、状态标签、tooltip 和长文本省略。"
      >
        <Detail
          data={{
            code: "DEMO-001",
            name: "示例服务节点",
            type: "演示机构",
            status: "启用",
            address: "示例地址：组件能力展示环境",
            owner: "演示用户",
          }}
          sections={[
            {
              key: "basic",
              title: "示例分组一",
              items: [
                { key: "code", title: "示例编号" },
                { key: "name", title: "示例名称", tooltip: "用于展示详情记录的示例名称。" },
                { key: "type", title: "示例类型", tooltip: "用于展示详情字段说明。" },
                {
                  key: "status",
                  title: "示例状态",
                  render: (value) => <Tag color="success">{String(value ?? "-")}</Tag>,
                },
              ],
            },
            {
              key: "location",
              title: "示例分组二",
              items: [
                {
                  key: "address",
                  title: "示例说明",
                  tooltip: "用于演示长文本 tooltip 和省略显示。",
                  ellipsis: { maxWidth: 260 },
                },
                { key: "owner", title: "示例负责人", span: 2 },
              ],
            },
          ]}
        />
      </Section>

      <Section
        id="cascader"
        title="级联选择 Cascader"
        description="列式级联面板，支持受控路径、禁用节点、自定义 option/display 渲染和 changeOnSelect。"
      >
        <Cascader
          options={[
            {
              label: "中国",
              value: "china",
              children: [
                {
                  label: "华东",
                  value: "east",
                  children: [
                    { label: "上海", value: "shanghai" },
                    { label: "杭州", value: "hangzhou" },
                  ],
                },
                { label: "华南（暂不可选）", value: "south", disabled: true },
              ],
            },
            { label: "海外", value: "overseas", children: [{ label: "新加坡", value: "singapore" }] },
          ]}
          value={cascade}
          onChange={setCascade}
          optionRender={(option) => <span>{option.label}</span>}
        />
      </Section>

      <Section
        id="textfield-textarea"
        title="文本框 TextField / Textarea"
        description="筛选区和 Form.Item 均可直接组合；输入、清除、计数、前后缀和原生 inputProps 均可覆写。"
      >
        <div className="biu-capability-control-row biu-capability-control-row--text-controls">
          <TextField
            value={text}
            onChange={(event) => setText(event.target.value)}
            allowClear
            onClear={() => setText("")}
            showCount
            maxLength={20}
            addonBefore="关键字"
            placeholder="请输入"
          />
          <TextField type="search" placeholder="筛选条件" inputProps={{ autoComplete: "off" }} />
          <Textarea placeholder="备注信息" showCount maxLength={80} rows={3} />
        </div>
      </Section>

      <Section
        id="input-number"
        title="数字输入框 InputNumber"
        description="decimal 是精度主参数，兼容 precision、changeOnWheel、formatter/parser 和 stringMode。"
      >
        <div className="biu-capability-control-row">
          <InputNumber
            value={number}
            decimal={2}
            changeOnWheel
            onChange={(value) => setNumber(value ?? "")}
            aria-label="金额"
          />
          <span>当前值：{number}</span>
        </div>
      </Section>

      <Section
        id="checkbox"
        title="复选框 Checkbox / CheckboxGroup"
        description="受控和非受控联动，onChange 返回最新值，选项可独立禁用。"
      >
        <Checkbox
          label="独立 Checkbox"
          checked={checks.includes("standalone")}
          onChange={(event) =>
            setChecks((current) =>
              event.currentTarget.checked
                ? [...current, "standalone"]
                : current.filter((value) => value !== "standalone"),
            )
          }
        />
        <CheckboxGroup
          options={[
            { label: "UI", value: "ui" },
            { label: "Pro", value: "pro" },
            { label: "Query", value: "query" },
          ]}
          value={checks}
          direction={pro ? "vertical" : "horizontal"}
          optionRender={pro ? (option) => <span>{option.label}（可自定义）</span> : undefined}
          onChange={setChecks}
        />
        <p>已选择：{checks.join("、") || "无"}</p>
      </Section>

      <Section id="radio" title="单选框 Radio / RadioGroup" description="标准表单联动、name 隔离和禁用项。">
        <RadioGroup
          name="showcase-entry"
          options={[
            { label: "React", value: "react" },
            { label: "Vue", value: "vue" },
            { label: "HTML", value: "html" },
          ]}
          value={radio}
          direction={pro ? "vertical" : "horizontal"}
          optionRender={pro ? (option) => <span>{option.label} 入口</span> : undefined}
          onChange={setRadio}
        />
        <p>当前入口：{radio}</p>
      </Section>

      <Section
        id="switch"
        title="开关 Switch"
        description="支持受控、loading、只读和受控联动；开关本体保持纯胶囊轨道，不在内部显示文字。"
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <Switch checked={switched} onChange={setSwitched} aria-label="开关" />
          <span>{switched ? "已开启" : "已关闭"}</span>
        </span>
      </Section>

      <Section
        id="select"
        title="选择器 Select"
        description="搜索框与选项同属一个面板并 sticky；支持全部、全选、三参数 onChange、自定义 option/label/tag、懒加载和下拉插槽。"
      >
        <div className="biu-capability-control-row">
          <Select
            options={options}
            hasAllOption
            searchable
            allowClear
            value={typeof select === "string" ? select : undefined}
            onChange={(value, option, index) => {
              setSelect(value ?? "");
              biuMessage.info(`值：${String(value)}，索引：${index}`);
            }}
            optionRender={(option) => (
              <>
                <strong>{option.label}</strong>
                {option.disabled ? "（暂不可用）" : ""}
              </>
            )}
            dropdownHeader={<small>请选择所属团队</small>}
            dropdownFooter={
              <Button
                type="default"
                variant="text"
                size="small"
                block
                onClick={() => biuMessage.info("自定义底部操作")}
              >
                自定义底部操作
              </Button>
            }
          />
          <Select
            mode="multiple"
            options={options}
            hasAllOption
            allowAllSelect
            searchable
            maxTagCount={1}
            maxCount={pro ? 3 : undefined}
            value={multiSelect}
            onChange={(value, option, index) => {
              setMultiSelect(Array.isArray(value) ? value : value ? [value] : []);
              biuMessage.info(`多选索引：${index}`);
            }}
            labelRender={(_value, option) => option?.label ?? "未命名"}
            tagRender={(option, onClose) => (
              <Tag color="info">
                <span>{option.label}</span>
                <Button
                  type="default"
                  variant="text"
                  size="small"
                  shape="circle"
                  icon={<X size={12} />}
                  aria-label={`移除 ${option.label}`}
                  className="biu-capability-tag-close"
                  onClick={onClose}
                />
              </Tag>
            )}
          />
        </div>
      </Section>

      <Section
        id="date-picker"
        title="日期选择器 DatePicker / RangeDatePicker"
        description="手搓日历面板，支持 YYYY-MM-DD、YYYY-MM-DD HH:mm:ss、范围、preset、footer、needConfirm 和中英文。"
      >
        <div className="biu-capability-control-row">
          <DatePicker value={date} onChange={setDate} locale={locale} format="YYYY-MM-DD" placeholder="YYYY-MM-DD" />
          <DatePicker
            value={date}
            onChange={setDate}
            locale={locale}
            format="YYYY-MM-DD HH:mm:ss"
            placeholder="YYYY-MM-DD HH:mm:ss"
            showTime
            needConfirm={pro}
          />
          <RangeDatePicker
            value={rangeDate}
            onChange={setRangeDate}
            locale={locale}
            format="YYYY-MM-DD"
            placeholder={["开始日期", "结束日期"]}
            needConfirm={pro}
          />
          <RangeDatePicker
            value={rangeDate}
            onChange={setRangeDate}
            locale={locale}
            format="YYYY-MM-DD HH:mm:ss"
            placeholder={["开始时间", "结束时间"]}
            showTime
            needConfirm={pro}
          />
        </div>
      </Section>

      <Section
        id="time-picker"
        title="时间选择器 TimePicker / RangeTimePicker"
        description="自定义时分秒面板，不使用原生 time input；支持 12/24 小时制、disabledTime、确认和范围。"
      >
        <div className="biu-capability-control-row">
          <TimePicker
            value={time}
            onChange={setTime}
            locale={locale}
            format="HH:mm"
            placeholder="HH:mm"
            needConfirm={pro}
          />
          <TimePicker
            value={time}
            onChange={setTime}
            locale={locale}
            format="HH:mm:ss"
            placeholder="HH:mm:ss"
            hour12={pro}
            needConfirm={pro}
          />
          <RangeTimePicker
            value={rangeTime}
            onChange={setRangeTime}
            locale={locale}
            format="HH:mm:ss"
            needConfirm={pro}
          />
        </div>
      </Section>

      <Section
        id="dialog"
        title="对话框 Dialog"
        description="UI Dialog 只提供可组合结构；支持 position、offset、fullscreen、destroyOnClose、container 和 classNames。"
      >
        <Button type="primary" onClick={() => setDialogOpen(true)}>
          打开 Dialog
        </Button>
        <UIDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          position={pro ? "top" : "center"}
          offsetTop={pro ? 72 : undefined}
          destroyOnClose
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>可组合 Dialog</DialogTitle>
              <DialogClose aria-label="关闭" />
            </DialogHeader>
            <DialogBody>
              <p>内容、按钮和表单由业务自由组合，焦点、ESC、遮罩和 Portal 由组件处理。</p>
            </DialogBody>
            <DialogFooter>
              <Button type="secondary" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  setDialogOpen(false);
                  biuMessage.success("已完成");
                }}
              >
                确定
              </Button>
            </DialogFooter>
          </DialogContent>
        </UIDialog>
      </Section>

      <Section
        id="drawer"
        title="抽屉 Drawer"
        description="四方向占满对应 viewport 边缘，支持 size、fullscreen 和可组合头部/底部。"
      >
        <Button type="secondary" onClick={() => setDrawerOpen(true)}>
          打开 Drawer
        </Button>
        <UIDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          placement={pro ? "left" : "right"}
          size={pro ? 520 : 380}
        >
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>可组合 Drawer</DrawerTitle>
              <DrawerClose aria-label="关闭" />
            </DrawerHeader>
            <DrawerBody>
              <p>Drawer 内容区域可滚动，面板保持对应方向完整高度。</p>
            </DrawerBody>
            <DrawerFooter>
              <Button type="secondary" onClick={() => setDrawerOpen(false)}>
                取消
              </Button>
              <Button onClick={() => setDrawerOpen(false)}>确定</Button>
            </DrawerFooter>
          </DrawerContent>
        </UIDrawer>
      </Section>

      <Section
        id="tooltip"
        title="提示 Tooltip"
        description="基于 Radix collision 行为，箭头自动跟随实际对齐位置，支持 color、maxWidth、onlyOverflow 和 classNames。"
      >
        <Tooltip content="固定说明类提示" color={pro ? "#0f766e" : undefined}>
          <Button type="default" variant="text">
            悬停查看 Tooltip
          </Button>
        </Tooltip>
        <Tooltip content="只有溢出时显示" onlyOverflow>
          <span style={{ display: "inline-block", maxWidth: 180 }}>这是一个很长的溢出提示示例</span>
        </Tooltip>
      </Section>

      <Section
        id="ellipsis"
        title="省略 Ellipsis"
        description="自动测量溢出，也支持 maxWidth 和多行；基座所有省略提示统一使用该组件。"
      >
        <Ellipsis maxWidth={pro ? 320 : 220} lines={pro ? 2 : 1}>
          基座和业务页面中的超长文本都会自动检测并在需要时显示完整 Tooltip 内容。
        </Ellipsis>
        <Ellipsis maxWidth={pro ? 320 : 220} alwaysTooltip>
          即使没有溢出也可以通过 alwaysTooltip 永远显示完整 Tooltip。
        </Ellipsis>
      </Section>

      <Section
        id="copy-text"
        title="复制文本 CopyText"
        description="在 Ellipsis 后提供统一复制按钮；按钮默认显示，也可以配置为仅在 hover/focus 时显示。"
      >
        <div className="biu-capability-control-row">
          <CopyText
            text="这是一段可以复制的长文本，展示区域会根据宽度自动省略，点击右侧图标即可复制完整值。"
            maxWidth={pro ? 360 : 240}
            alwaysTooltip
            onCopy={() => {
              biuMessage.success("文本已复制");
            }}
          />
          <CopyText
            text="悬停或聚焦后显示复制按钮"
            maxWidth={pro ? 260 : 200}
            copyOnHover
            content="悬停后显示复制按钮"
          />
        </div>
      </Section>

      <Section
        id="popover"
        title="气泡 Popover"
        description="支持 disabled、受控状态、方向、碰撞避障和自定义 classNames。"
      >
        <Popover
          content={
            <div>
              <strong>Popover 内容</strong>
              <p>复杂内容可以直接放入。</p>
            </div>
          }
        >
          <Button type="default" variant="outlined">
            打开 Popover
          </Button>
        </Popover>
      </Section>

      <Section
        id="popconfirm"
        title="气泡确认 Popconfirm"
        description="确认/取消、异步 loading、danger 类型、description 和 disabled。"
      >
        <Popconfirm
          title="确认删除这条记录？"
          description="删除后无法恢复"
          type="danger"
          locale={locale}
          onConfirm={() => {
            biuMessage.success("已确认删除");
          }}
        >
          <Button type="error" variant="outlined">
            删除
          </Button>
        </Popconfirm>
      </Section>

      <Section
        id="dropdown-menu"
        title="下拉菜单 DropdownMenu"
        description="支持分隔、标签、图标、快捷键、checkbox 和 submenu。"
      >
        <DropdownMenu
          trigger={<Button type="secondary">更多操作</Button>}
          items={[
            { key: "label", type: "label", label: "常用操作" },
            { key: "copy", label: "复制", shortcut: "⌘ C" },
            { key: "compact", type: "checkbox", label: "紧凑模式", checked: true },
            { key: "light", type: "radio", radioGroup: "theme", label: "浅色主题" },
            { key: "dark-theme", type: "radio", radioGroup: "theme", label: "深色主题" },
            { key: "line", type: "separator" },
            { key: "advanced", label: "高级", children: [{ key: "settings", label: "设置" }] },
          ]}
          checkedKeys={dropdownChecks}
          radioValues={{ theme: dropdownRadio }}
          dropdownHeader={<strong>常用操作</strong>}
          dropdownFooter={<span>支持自定义头部、尾部和菜单渲染</span>}
          onCheckedChange={setDropdownChecks}
          onRadioChange={(value, group) => {
            if (group === "theme") setDropdownRadio(value);
          }}
          onSelect={(key) => biuMessage.info(`选择：${key}`)}
        />
      </Section>

      <Section
        id="tabs"
        title="标签页 Tabs"
        description="line/card/tag 三种风格，支持方向、可关闭、添加、滚动箭头和多语言长度适配。"
      >
        <Tabs
          type={pro ? "card" : "line"}
          items={[
            { key: "overview", label: "概览 / Overview", children: <p>Tab 内容一</p>, closable: pro },
            { key: "config", label: "配置与权限 Configuration", children: <p>Tab 内容二</p>, closable: pro },
            { key: "disabled", label: "禁用", disabled: true },
          ]}
          value={activeTab}
          onChange={setActiveTab}
          onClose={(key) => biuMessage.info(`关闭：${key}`)}
          showArrows={pro ? "both" : "auto"}
          addButton={pro ? <Plus size={15} aria-hidden="true" /> : undefined}
          onAdd={() => biuMessage.success("新增 Tab")}
        />
      </Section>

      <Section
        id="menu"
        title="菜单 Menu / 面包屑 Breadcrumb"
        description="菜单目录、折叠、openKeys、选中状态和 Ellipsis 标题均可用于基座导航。"
      >
        <Menu
          selectedKey={menuKey}
          collapsed={false}
          onSelect={setMenuKey}
          items={[
            {
              key: "foundation",
              label: "基座能力展示",
              children: [
                { key: "overview", label: "菜单概览与一个很长的标题用于省略" },
                { key: "layout", label: "布局" },
              ],
            },
            {
              key: "components",
              label: "组件能力展示",
              children: [
                { key: "ui", label: "UI 组件" },
                { key: "pro", label: "Pro 组件" },
              ],
            },
          ]}
        />
        <Breadcrumb
          items={[
            { label: "基座能力" },
            { label: "组件能力", onClick: () => biuMessage.info("返回组件能力") },
            { label: "Menu" },
          ]}
        />
        <p>当前菜单：{menuKey}</p>
      </Section>

      <Section
        id="pagination"
        title="分页 Pagination"
        description="支持快速跳转、总数、itemRender、responsive、simple、hideOnSinglePage、showLessItems 和 pageSize。"
      >
        <Pagination
          current={page}
          pageSize={pageSize}
          total={128}
          showSizeChanger
          pageSizeOptions={[10, 20, 50]}
          showQuickJumper
          showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
          responsive
          showLessItems
          onChange={(next, nextPageSize) => {
            setPage(next);
            setPageSize(nextPageSize);
          }}
          locale={locale}
        />
      </Section>

      <Section id="tree" title="树 Tree" description="树节点展开、选择、多选和禁用状态。">
        <Tree
          data={[
            {
              key: "root",
              title: "组件库",
              children: [
                { key: "ui", title: "UI", children: [{ key: "control", title: "表单控件" }] },
                { key: "pro", title: "Pro" },
              ],
            },
          ]}
          defaultExpandedKeys={["root", "ui"]}
          selectedKeys={treeSelected}
          onSelect={setTreeSelected}
          multiple={pro}
          checkable
          defaultCheckedKeys={["ui"]}
          showSearch
          locale={locale}
        />
      </Section>

      <Section
        id="transfer"
        title="穿梭框 Transfer"
        description="双栏数据转移，支持搜索/禁用/自定义标题的企业业务基础场景。"
      >
        <Transfer
          source={[
            { label: "Components", value: "components" },
            { label: "Runtime", value: "runtime" },
            { label: "Preset", value: "preset" },
            { label: "Router", value: "router" },
          ]}
          target={transfer}
          onChange={setTransfer}
          showSearch
          titles={pro ? ["可用包", "已选包"] : undefined}
          locale={locale}
        />
      </Section>

      <Section
        id="alert"
        title="提示 Alert"
        description="default、info、success、warning、error 五种状态，支持自定义 icon、description、action 和关闭。"
      >
        <div className="biu-capability-status-grid">
          <Alert status="default" title="默认提示">
            这是默认信息。
          </Alert>
          <Alert status="info" title="信息提示">
            数据正在同步。
          </Alert>
          <Alert status="success" title="操作成功">
            数据已保存。
          </Alert>
          <Alert status="warning" title="注意">
            部分字段尚未填写。
          </Alert>
          <Alert
            status="info"
            title="多行说明"
            closable
            description={
              <>
                第一行说明当前同步范围。
                <br />
                第二行说明完成后可以继续编辑，关闭按钮保持在右侧垂直居中。
              </>
            }
          />
          <Alert
            status="error"
            title="操作失败"
            description="请检查网络后重试。"
            icon={<X size={18} aria-hidden="true" />}
            action={
              <Button
                type="error"
                variant="outlined"
                size="small"
                onClick={() => biuMessage.info("正在重试", { locale })}
              >
                重试
              </Button>
            }
            closable
            onClose={() => biuMessage.info("提示已关闭", { locale })}
          />
        </div>
      </Section>

      <Section
        id="message"
        title="消息 Message"
        description="默认是轻量简约样式；复杂样式使用 complex=true。四个案例覆盖单行、多行和不同语义色，关闭按钮始终独占最右侧。"
      >
        <div className="biu-capability-actions">
          <Button type="primary" size="small" onClick={() => biuMessage.info("这是一条简约单行消息", { locale })}>
            简约单行
          </Button>
          <Button
            type="warning"
            size="small"
            onClick={() => biuMessage.warning("第一行简约说明\n第二行补充当前状态和下一步处理建议。", { locale })}
          >
            简约多行
          </Button>
          <Button
            type="success"
            size="small"
            onClick={() => biuMessage.success("复杂样式单行消息", { locale, complex: true })}
          >
            复杂单行
          </Button>
          <Button
            type="error"
            size="small"
            onClick={() =>
              biuMessage.error("第一行复杂错误说明\n第二行说明处理建议，右侧关闭按钮不会覆盖正文。", {
                locale,
                complex: true,
              })
            }
          >
            复杂多行
          </Button>
        </div>
      </Section>

      <Section id="empty" title="空状态 Empty" description="无数据时提供明确的视觉反馈和可选操作。">
        <Empty locale={locale} description="当前筛选条件下暂无数据" />
      </Section>

      <Section id="loading" title="加载 Loading" description="提供统一的加载指示和中文/英文文案。">
        <Loading locale={locale} />
      </Section>

      <Section id="progress" title="进度 Progress" description="支持百分比、状态色和连续进度反馈。">
        <Progress percent={pro ? 86 : 62} />
      </Section>

      <Section id="tag" title="标签 Tag" description="用于表达轻量状态，支持语义颜色和自定义内容。">
        <div className="biu-capability-actions">
          <Tag color="default">默认</Tag>
          <Tag color="info">信息</Tag>
          <Tag color="success">成功</Tag>
          <Tag color="warning">处理中</Tag>
          <Tag color="danger">失败</Tag>
        </div>
      </Section>

      <Section id="badge" title="徽标 Badge" description="支持数字徽标、圆点徽标和语义颜色。">
        <div className="biu-capability-actions">
          <Badge count={pro ? 8 : 3}>消息</Badge>
          <Badge dot color="success">
            在线
          </Badge>
          <Badge count={99} color="danger">
            通知
          </Badge>
        </div>
      </Section>

      <Section id="steps" title="步骤 Steps" description="展示流程进度和当前处理节点。">
        <Steps
          current={pro ? 1 : 0}
          items={[
            { key: "a", title: "准备" },
            { key: "b", title: "审核" },
            { key: "c", title: "完成" },
          ]}
        />
      </Section>

      <Section id="typography" title="文本排版 Typography" description="统一文本语义、标题层级、弱化和单行省略。">
        <Space direction="vertical" size="small" style={{ width: "100%" }}>
          <Title level={3}>示例标题</Title>
          <Paragraph>这是一段用于展示文本排版的演示内容，支持普通文本、强调文本和弱化文本。</Paragraph>
          <Space size="middle">
            <Typography strong>强调文本</Typography>
            <Typography muted>弱化文本</Typography>
            <Typography color="primary">Primary 文本</Typography>
            <Typography color="success">Success 文本</Typography>
            <Typography color="warning">Warning 文本</Typography>
            <Typography color="error">Error 文本</Typography>
            <Typography ellipsis style={{ maxWidth: 180 }}>
              这是一段超长文本的单行省略展示
            </Typography>
          </Space>
        </Space>
      </Section>

      <Section id="space" title="间距 Space" description="使用统一间距排列一组内容，支持方向、对齐、换行和分隔节点。">
        <Space size="middle" split={<Divider orientation="vertical" />} wrap>
          <Button size="small">项目一</Button>
          <Button size="small">项目二</Button>
          <Button size="small">项目三</Button>
        </Space>
      </Section>

      <Section id="list" title="列表 List" description="使用数据源和 renderItem 渲染统一的列表容器。">
        <List
          bordered
          header="最近操作"
          footer="共 3 条记录"
          dataSource={["创建订单", "更新收货地址", "导出报表"]}
          renderItem={(item, index) => (
            <Space style={{ width: "100%", justifyContent: "space-between" }}>
              <Typography>{item}</Typography>
              <Typography muted>第 {index + 1} 项</Typography>
            </Space>
          )}
        />
      </Section>

      <Section id="colorpicker" title="颜色选择 ColorPicker" description="支持当前颜色、颜色文本和常用预设色。">
        <ColorPicker showText presets={["#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed"]} />
      </Section>

      <Section id="context-menu" title="右键菜单 ContextMenu" description="在指定内容区域打开可操作的右键菜单。">
        <ContextMenu
          items={[
            { key: "refresh", label: "刷新内容", onClick: () => biuMessage.success("内容已刷新") },
            { key: "copy", label: "复制地址", onClick: () => biuMessage.info("地址已复制") },
            { key: "disabled", label: "暂不可用", disabled: true },
          ]}
        >
          <Box css={{ padding: 24, border: "1px dashed #94a3b8", borderRadius: 6, textAlign: "center" }}>
            在此区域点击右键
          </Box>
        </ContextMenu>
      </Section>

      <Section
        id="config-provider"
        title="全局配置 ConfigProvider"
        description="通过 Provider 向组件树统一提供语言、文案、主题和方向配置。"
      >
        <ConfigProvider locale="zh-CN" localeText={{ 暂无数据: "暂无可用记录" }}>
          <Empty description="ConfigProvider 已提供全局中文文案" />
        </ConfigProvider>
      </Section>

      <Section id="timeline" title="时间线 Timeline" description="展示时间顺序、处理状态和进行中节点。">
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Timeline
            items={[
              { title: "示例节点一", content: "已完成的演示步骤", time: "09:00", color: "success" },
              { title: "示例节点二", content: "当前处理中的演示步骤", time: "10:30", color: "primary" },
            ]}
            pending="等待下一个示例节点"
          />
          <Timeline
            direction="horizontal"
            items={[
              { title: "提交", content: "申请已提交", time: "09:00", color: "success" },
              { title: "审核", content: "正在审核", time: "10:30", color: "primary" },
              { title: "完成", content: "等待处理", time: "--:--", color: "default" },
            ]}
          />
        </Space>
      </Section>

      <Section id="spin" title="加载 Spin" description="提供独立加载指示器或覆盖在内容区域上的加载状态。">
        <Space size="large">
          <Spin tip="加载中" />
          <Spin spinning size="small" tip="已完成" />
        </Space>
      </Section>

      <Section
        id="image"
        title="图片 Image"
        description="支持尺寸约束、懒加载、加载降级和点击预览；上传缩略图继续使用 Upload/FilePreview。"
      >
        <Space size="middle" align="start">
          <Image src="/logo.svg" alt="示例图片" width={120} height={80} preview />
          <Image src="/not-found-demo.png" alt="失败图片" width={120} height={80} fallback={<span>加载失败</span>} />
          <Image
            src="/logo.svg"
            alt="懒加载图片"
            width={120}
            height={80}
            lazy
            placeholder={<Spin size="small" />}
            preview
          />
        </Space>
      </Section>

      <Section
        id="notification"
        title="通知 Notification"
        description="右上角通知支持标题、描述、语义类型、关闭和自动销毁。"
      >
        <Space>
          <Button size="small" onClick={() => notification.success("示例操作已完成", { title: "成功通知" })}>
            打开通知
          </Button>
          <Notification title="静态通知" description="通知也可以直接作为受控内容渲染。" type="info" duration={0} />
        </Space>
      </Section>

      <Section id="affix" title="固定 Affix" description="滚动时固定工具或提示内容，支持指定滚动容器和状态回调。">
        <Affix offsetTop={12}>
          <span className="biu-showcase-affix-demo">滚动时固定的示例内容</span>
        </Affix>
      </Section>

      <Section
        id="resizebox"
        title="调整尺寸 ResizeBox"
        description="普通容器支持受边界约束的宽高调整，并通过回调同步最新尺寸。"
      >
        <ResizeBox width={280} height={110}>
          <Space direction="vertical">
            <Typography strong>可调整容器</Typography>
            <Typography muted>拖动右下角调整大小，子内容保持在容器内部。</Typography>
          </Space>
        </ResizeBox>
      </Section>

      <Section id="box" title="布局 Box" description="最小布局容器，支持 css/sx CSS-in-JS 对象、数组和函数样式。">
        <Space direction="vertical" size="small">
          <Box css={{ padding: 12, border: "1px solid #dbe3ee", borderRadius: 6 }}>css 对象样式</Box>
          <Box sx={[{ padding: 12, border: "1px solid #bfdbfe" }, { color: "#2563eb" }]}>sx 数组样式</Box>
          <Box sx={() => ({ padding: 12, border: "1px solid #bbf7d0", color: "#16a34a" })}>sx 函数样式</Box>
        </Space>
      </Section>

      <Section id="grid" title="布局 Grid" description="响应式网格，统一处理列数和间距。">
        <Grid columns={pro ? 3 : 2} gap={12}>
          <Box>Grid 项目一</Box>
          <Box>Grid 项目二</Box>
          <Box>Grid 项目三</Box>
        </Grid>
      </Section>

      <Section id="stack" title="布局 Stack" description="统一处理横向或纵向排列及间距。">
        <Stack gap={6}>
          <span>Stack 项目一</span>
          <span>Stack 项目二</span>
          <span>Stack 项目三</span>
        </Stack>
      </Section>

      <Section id="card" title="卡片 Card" description="用于承载一组相关内容，保持标题、内容和间距一致。">
        <Card title="Card 标题">Card 内容区域</Card>
      </Section>

      <Section id="divider" title="分隔线 Divider" description="在内容组之间提供清晰的视觉分隔。">
        <Stack direction="column" gap={8}>
          <span>上方内容</span>
          <Divider />
          <span>下方内容</span>
        </Stack>
      </Section>

      <Section id="collapsible" title="折叠面板 Collapsible" description="支持展开、收起和自定义触发器。">
        <Collapsible defaultOpen>
          <CollapsibleTrigger>展开更多</CollapsibleTrigger>
          <CollapsibleContent>Collapsible 内容区。</CollapsibleContent>
        </Collapsible>
      </Section>

      <Section
        id="anchor-scroll-progress"
        title="标题锚点 Anchor / 滚动进度 ScrollProgress"
        description="自动扫描 h1-h5 标题生成右侧目录，并同步指定滚动容器的阅读进度与回到顶部操作。"
      >
        <div className="biu-showcase-anchor-layout">
          <div ref={scrollDemoRef} className="biu-showcase-anchor-layout__viewport">
            <div className="biu-showcase-anchor-layout__content">
              <h3>组件概览</h3>
              <p>Anchor 会扫描当前内容容器中的标题，并为没有 id 的标题生成稳定锚点。</p>
              <h4>自动识别层级</h4>
              <p>最多支持 h1 到 h5；层级通过缩进表达，当前滚动位置会高亮对应标题。</p>
              <h5>可访问的链接</h5>
              <p>每个目录项都是带 href 的真实链接，支持键盘聚焦、点击定位和自定义偏移。</p>
              <h3>滚动状态</h3>
              <p>ScrollProgress 可监听窗口，也可监听表格、Drawer 或本示例这样的独立滚动容器。</p>
              <h4>进度与回顶</h4>
              <p>底部进度条按 scrollTop 与可滚动总高度计算；滚动超过阈值后显示小型回顶按钮。</p>
              <h5>保持组件轻量</h5>
              <p>组件只注册必要的 scroll、resize 和 ResizeObserver 监听，卸载时会完整清理。</p>
            </div>
          </div>
          <aside className="biu-showcase-anchor-layout__aside">
            <Anchor
              container={scrollDemoRef}
              scrollContainer={scrollDemoRef}
              levels={[3, 4, 5]}
              offsetTop={12}
              title="本区目录"
              collapsible
              mode="static"
            />
            <div className="biu-showcase-anchor-layout__progress">
              <ScrollProgress target={scrollDemoRef} label="阅读进度" mode="static" />
            </div>
          </aside>
        </div>
      </Section>

      <Section
        id="upload-file-preview"
        title="上传与文件预览 Upload / File Preview"
        description="拖拽或选择文件，演示类型/大小校验、模拟上传进度、取消/重试、大小/时间、下载和预览。"
      >
        <Upload
          multiple
          drag
          accept="image/*,.pdf,.md"
          maxSize={5 * 1024 * 1024}
          showFileList
          fileList={files}
          locale={locale}
          onFileListChange={setFiles}
          onFiles={(selected) => biuMessage.success(`选择 ${selected.length} 个文件`)}
          onFileRejected={(_file, reason) =>
            biuMessage.warning(reason === "accept" ? "文件类型不支持" : "文件不能超过 5 MB")
          }
          onCancel={() => biuMessage.info("上传已取消")}
          customRequest={({ onProgress, onSuccess, signal }) => {
            let percent = 0;
            const timer = window.setInterval(() => {
              if (signal.aborted) {
                window.clearInterval(timer);
                return;
              }
              percent += 25;
              onProgress(percent);
              if (percent >= 100) {
                window.clearInterval(timer);
                onSuccess();
              }
            }, 160);
            return { abort: () => window.clearInterval(timer) };
          }}
          onPreview={setPreviewFile}
        >
          <div>
            <span className="biu-showcase-upload-button">选择文件或拖拽到这里</span>
            <p>支持图片、PDF、Markdown；单文件不超过 5 MB。</p>
          </div>
        </Upload>
        <FileCard name="architecture.md" size="12 KB" locale={locale} />
        <FilePreviewDialog
          open={Boolean(previewFile)}
          onOpenChange={(open) => {
            if (!open) setPreviewFile(undefined);
          }}
          file={previewFile ?? files[0]}
          locale={locale}
        />
        <FileRender src="/logo.svg" name="logo.svg" kind="image" locale={locale} />
      </Section>
    </CapabilityGrid>
  );
}

/**
 * The Pro catalog is a first-class showcase entry, not an accidental prop on
 * the UI page. It intentionally delegates the ordered blocks to the same
 * catalog implementation so a new component cannot silently appear in only
 * one page; `pro` switches the richer presets and enterprise states inside
 * every applicable block.
 */
export function ComponentProCatalog() {
  return (
    <div className="biu-pro-component-catalog" data-biu-catalog-layer="pro">
      <ComponentCatalogRenderer pro />
    </div>
  );
}

export function ComponentUICatalog() {
  // The catalog is the single documentation surface.  Use the richer preset
  // values here so the former Pro-only states are no longer hidden behind a
  // second page or a second menu entry.
  return <ComponentCatalogRenderer pro />;
}

export default function ComponentUIShowcase() {
  const catalogRef = useRef<HTMLDivElement>(null);
  const { locale, direction } = useBiuContext();
  return (
    <ConfigProvider locale={locale} direction={direction}>
      <CapabilityPage
        title="组件能力展示"
        description="所有组件按统一顺序逐块展示；效果案例和属性/方法表同时作为可运行文档，基础能力与企业场景能力不再拆成两套页面。"
      >
        <div className="biu-component-showcase-layout">
          <div ref={catalogRef} className="biu-component-showcase-layout__content">
            <ComponentUICatalog />
          </div>
          <Anchor
            container={catalogRef}
            scrollContainer=".biu-page-content"
            levels={[2, 3, 4, 5]}
            title="组件目录"
            collapsible
            defaultCollapsed={false}
            mode="fixed"
            position="right"
          />
          <ScrollProgress target=".biu-page-content" label="页面阅读进度" mode="fixed" position="bottom-right" />
        </div>
      </CapabilityPage>
    </ConfigProvider>
  );
}
