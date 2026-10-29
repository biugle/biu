import * as React from "react";
import { useEffect, useRef, useState, type ReactNode } from "react";
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
  Slider,
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
  Transfer,
  Tree,
  Upload,
  type BiuFileItem,
} from "@biugle/react-components/ui";
import { biuMessage, ConfigProvider } from "@biugle/react-components";
import { useBiuContext, useBiuI18n } from "@biugle/biu-runtime";
import { Check, Plus, Search, Settings, X } from "@biugle/icons";
import { DirectionSwitch } from "./direction-switch.js";
import { AnchorScrollProgressDemo } from "./anchor-scroll-progress-demo.js";
import { ProTextFieldDemo, proTextFieldApiRows, splitStringApiRows } from "./pro-textfield.js";
import { OverlayInteractionSections } from "./overlay-interaction-sections.js";
import { InputNumberShowcaseSection, inputNumberApiRows } from "./input-number-showcase.js";
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
    demo: "按钮色彩与按钮组",
  },
  {
    component: "Button",
    name: "icon / iconPosition / loading / block",
    type: "ReactNode / before | after | center / boolean",
    defaultValue: "- / before / false / false",
    description: "图标、加载、整行按钮、disabled、className 与 classNames。",
    demo: "加载按钮、整行按钮",
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
    description: "绝对值不超过 Number.MAX_SAFE_INTEGER、小数最多15位；超出时提示使用 TextField。",
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
    demo: "自定义选项",
  },
  {
    component: "Select",
    name: "searchable / dropdownRender / onLoadMore / loadMoreTrigger",
    type: "boolean / ReactNode callback / async callback / scroll | click | both",
    defaultValue: "false / - / - / scroll",
    description: "sticky 搜索、下拉头尾、滚动或点击懒加载和碰撞定位。",
    demo: "搜索与懒加载下拉面板",
  },
  {
    component: "Select",
    name: "value（未知后端值）",
    type: "string | string[]",
    defaultValue: "undefined",
    options: "允许传入当前 options 中不存在的值",
    description: "后端回传的暂时未知值仍会直接回显；多选未知值保留为可移除但不可再次选择的标签。",
    demo: "后端未知值回显",
  },
  {
    component: "DatePicker / RangeDatePicker",
    name: "format / value / presets / disabledDate",
    type: "string / Dayjs | tuple / preset[] / callback",
    defaultValue: "yyyy-mm-dd / null / [] / -",
    description: "日期和快捷值即时回传并保持面板打开；快捷日期同步切换日历月份。",
    demo: "日期范围",
  },
  {
    component: "TimePicker / RangeTimePicker",
    name: "format / hour12 / disabledTime / needConfirm",
    type: "format / boolean / callback / boolean",
    defaultValue: "HH:mm / false / - / false",
    description: "时间值即时回传并保持面板打开；确认按钮只负责关闭。",
    demo: "时间范围",
  },
  {
    component: "Dialog / Drawer",
    name: "open / onOpenChange / position / placement",
    type: "boolean / callback / center | top | ... / top | right | ...",
    defaultValue: "false / - / center / right",
    description: "受控开关、位置/方向、遮罩、ESC、Portal 和 viewport 尺寸。",
    demo: "对话框、抽屉",
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
    demo: "标签页与菜单",
  },
  {
    component: "PageFilter",
    name: "moreFields / drawerTitle / drawerWidth",
    type: "ReactNode / ReactNode / string | number",
    defaultValue: "- / 更多筛选 / large",
    description: "高级筛选项自动放入 body-mounted Drawer，支持受控开关、底部插槽和 classNames。",
    demo: "基础表格 / Pro 表格",
  },
  {
    component: "Pagination",
    name: "current / pageSize / showSizeChanger / showQuickJumper",
    type: "number / number / boolean / boolean",
    defaultValue: "1 / 20 / false / false",
    description: "页码、页大小、快速跳转、总数、三档响应式布局和简洁模式。",
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
    component: "Cascader",
    name: "value（未知路径）",
    type: "string[]",
    defaultValue: "[]",
    options: "允许传入当前 options 中不存在的路径段",
    description: "后端回传但当前级联选项尚未加载的路径段仍会按原值显示，不会被静默丢弃。",
    demo: "后端未知路径回显",
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
    demo: "对话框底部区域",
  },
  {
    component: "Dialog",
    name: "draggable",
    type: "boolean",
    defaultValue: "true",
    options: "true | false",
    description:
      "默认允许按住 Dialog header 非交互区域在视窗内拖动；按钮和输入控件不启动拖动，全屏模式不响应，初始位置仍由 position 和 offset 属性决定。",
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
    demo: "抽屉底部区域",
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
    demo: "基座能力 / 菜单",
  },
  {
    component: "Pagination",
    name: "itemRender / showTotal / pageSizeOptions / responsive",
    type: "render callback / render callback / number[] / boolean",
    defaultValue: "- / - / [10, 20, 50] / true",
    description: "自定义页码、总数、页大小选项和三档响应式布局。",
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
    component: "Transfer",
    name: "oneWay",
    type: "boolean",
    defaultValue: "false",
    options: "true | false",
    description: "开启后只允许从左侧移入右侧，不渲染右侧移回操作；适合已选结果不可回退的业务场景。",
    demo: "单向穿梭框",
  },
  {
    component: "Transfer",
    name: "target（未知后端项）",
    type: "TransferItem[]",
    defaultValue: "[]",
    options: "target 中可包含 source 不存在的 value",
    description: "后端返回但当前 source 尚未包含的目标项置顶显示，禁止勾选但保留删除/移回入口。",
    demo: "后端未知项兜底",
  },
  {
    component: "Alert",
    name: "status / title / description / icon / action",
    type: "default | info | success | warning | error / ReactNode",
    defaultValue: "info / - / - / - / -",
    description: "五种语义状态、标题、详细说明、图标和操作区。",
    demo: "多行提示",
  },
  {
    component: "Alert",
    name: "closable / onClose / classNames",
    type: "boolean / callback / slot map",
    defaultValue: "false / - / -",
    description: "右侧垂直居中关闭按钮和根/content/icon/action 样式插槽。",
    demo: "关闭提示",
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
    demo: "容器内容区域",
  },
  {
    component: "Grid",
    name: "columns / gap / minColumnWidth / className",
    type: "number | string / number | string / number | string / string",
    defaultValue: "- / 8 / - / -",
    description: "响应式列数、间隙和最小列宽。",
    demo: "网格项目",
  },
  {
    component: "Stack",
    name: "direction / gap / align / justify",
    type: "row | column / number / flex-align / flex-justify",
    defaultValue: "row / 8 / stretch / start",
    description: "统一处理横向/纵向排列、间隙、对齐和分布。",
    demo: "堆叠项目",
  },
  {
    component: "Card",
    name: "title / extra / bordered / classNames",
    type: "ReactNode / ReactNode / boolean / slot map",
    defaultValue: "- / - / true / -",
    description: "标题、右侧扩展、边框和 header/body/footer 样式插槽。",
    demo: "卡片标题",
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
    ["loading", "boolean", "false", "true | false", "显示加载状态，同时阻止按钮操作。", "加载按钮"],
    ["block", "boolean", "false", "true | false", "让按钮占满父容器宽度。", "整行按钮"],
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
    [
      "inputRule",
      '"number" | "letter" | "alphanumeric"',
      "undefined",
      "number | letter | alphanumeric",
      "按字符过滤纯数字、纯英文字母或字母数字混合输入；空值仍可编辑，适合业务编码字段。",
      "输入规则",
    ],
    [
      "inputPattern",
      "string | RegExp",
      "undefined",
      "可增量匹配的正则表达式",
      "按可编辑前缀过滤输入和粘贴内容；固定长度等最终校验继续使用 Form.Item.rules.pattern。",
      "自定义正则",
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
  ...inputNumberApiRows,
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
  ...createApiRows("Slider", [
    ["min", "number", "0", "任意数字", "设置滑块可选范围的最小值。", "天气范围"],
    ["max", "number", "100", "任意数字且不小于 min", "设置滑块可选范围的最大值。", "天气范围"],
    ["step", "number", "1", "大于 0 的数字", "设置拖动、键盘和点击轨道时的步进，并按十进制精度吸附。", "亮度步进"],
    [
      "value / defaultValue",
      "number | [number, number]",
      "undefined",
      "单值或范围二元组",
      "分别控制受控值或非受控初始值；range 模式返回两个值。",
      "音量 / 天气范围",
    ],
    ["range", "boolean", "false", "true | false", "开启双滑块范围选择，返回 [start, end]。", "天气范围"],
    [
      "marks",
      "Record<number, ReactNode | SliderMark>",
      "undefined",
      "刻度值到文案或 { label, style }",
      "在指定数值位置展示刻度和标签。",
      "评分刻度",
    ],
    ["dots", "boolean", "false", "true | false", "在每个 step 位置显示辅助刻度点。", "亮度刻度"],
    [
      "tooltip",
      '"hover" | "always" | "never"',
      '"hover"',
      "hover | always | never",
      "控制当前值提示的展示方式：hover 在悬浮、键盘聚焦或触屏拖动时展示，always 常驻，never 隐藏；auto 仅作为 hover 的兼容别名。",
      "亮度 hover / 音量 always",
    ],
    ["opacity", "number", "1", "0 - 1", "设置滑块整体透明度，0 为完全透明，1 为完全不透明。", "透明度"],
    [
      "vertical / reverse",
      "boolean",
      "false / false",
      "true | false",
      "分别控制垂直布局和视觉方向反转，不改变实际数值语义。",
      "垂直亮度",
    ],
    ["disabled", "boolean", "false", "true | false", "禁用拖动、点击和键盘操作。", "禁用滑块"],
    [
      "onChange",
      "(value: number | [number, number]) => void",
      "undefined",
      "最新单值或范围值",
      "拖动、点击或键盘调整时同步最新值。",
      "受控联动",
    ],
    [
      "onChangeComplete",
      "(value: number | [number, number]) => void",
      "undefined",
      "最新单值或范围值",
      "一次拖动、点击或键盘操作结束时触发。",
      "完成回调",
    ],
    [
      "classNames",
      "SliderClassNames",
      "{}",
      "root | rail | track | input | mark | markLabel | tooltip",
      "按滑块各结构区域覆写样式，不改变交互。",
      "区域样式",
    ],
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
    ["optionRender", "(option, index) => ReactNode", "undefined", "选项和索引", "自定义下拉列表项渲染。", "自定义选项"],
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
      "按 loadMoreTrigger 配置加载更多数据。",
      "懒加载",
    ],
    [
      "loadMoreTrigger",
      '"scroll" | "click" | "both"',
      '"scroll"',
      "scroll | click | both",
      "选择仅滚动触底、仅点击加载或同时启用两种加载方式。",
      "加载方式",
    ],
    ["loadMoreText", "ReactNode", "内置“加载更多”", "任意 ReactNode", "自定义点击加载按钮文案或内容。", "加载按钮"],
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
      "日期、快捷项、时间和清除值每次变化时立即回调；面板不会因选择动作自动关闭。",
      "表单联动",
    ],
    [
      "format",
      "string",
      "YYYY-MM-DD",
      "YYYY-MM-DD | YYYY-MM-DD HH:mm:ss | YYYY-MM-DD hh:mm A 等",
      "决定面板列和触发器输出格式。",
      "日期格式",
    ],
    ["showTime", "boolean", "false", "true | false", "在日期选择中增加时间列。", "日期时间"],
    ["hour12", "boolean", "false", "true | false", "时间列使用 12 小时制或 24 小时制。", "12 / 24 小时"],
    [
      "needConfirm",
      "boolean",
      "false",
      "true | false",
      "true 时显示确定按钮；值仍即时回传，点击确定只关闭面板。",
      "确定关闭",
    ],
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
      "起止日期每次变化时立即回调，包括仅选择开始日期时的未完成范围。",
      "表单联动",
    ],
    ["format", "string", "YYYY-MM-DD", "YYYY-MM-DD | YYYY-MM-DD HH:mm:ss 等", "决定两侧日期输出格式。", "日期格式"],
    [
      "needConfirm",
      "boolean",
      "false",
      "true | false",
      "true 时显示确定按钮；范围值仍即时回传，点击确定只关闭面板。",
      "确定关闭",
    ],
    [
      "presets",
      "DatePickerPreset[]",
      "近一周 / 近一月",
      "label + range 或函数",
      "覆盖左侧快捷范围列表；选中后立即回传并聚焦到范围结束日期所在月份。",
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
      "时间列、快捷项和清除值每次变化时立即回调；面板保持打开。",
      "表单联动",
    ],
    ["format", "string", "HH:mm", "HH:mm | HH:mm:ss | hh:mm A", "决定时间列和输出格式。", "时间格式"],
    ["hour12", "boolean", "false", "true | false", "切换 12 小时制和 24 小时制。", "12 / 24 小时"],
    [
      "needConfirm",
      "boolean",
      "false",
      "true | false",
      "true 时显示确定按钮；时间值仍即时回传，点击确定只关闭面板。",
      "确定关闭",
    ],
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
    [
      "onChange",
      "(value, dateString?) => void",
      "undefined",
      "范围元组及字符串数组",
      "起止时间每次变化时立即回调；面板保持打开。",
      "表单联动",
    ],
    ["format", "string", "HH:mm", "HH:mm | HH:mm:ss | hh:mm A", "决定两侧时间输出格式。", "时间格式"],
    ["hour12", "boolean", "false", "true | false", "切换两侧的 12 小时制和 24 小时制。", "12 / 24 小时"],
    [
      "needConfirm",
      "boolean",
      "false",
      "true | false",
      "true 时显示确定按钮；时间范围仍即时回传，点击确定只关闭面板。",
      "确定关闭",
    ],
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
    [
      "draggable",
      "boolean",
      "true",
      "true | false",
      "默认开启 header 拖动；交互控件不启动拖动，Dialog 始终限制在视口范围内，全屏模式不响应。",
      "拖动 Dialog",
    ],
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
    ["content", "ReactNode", "必填", "任意 ReactNode", "桌面悬浮或键盘聚焦时展示；触屏设备长按后显示说明。", "Tooltip"],
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
      "touchActivation",
      "boolean",
      "true",
      "true | false",
      "允许触屏设备长按约 700ms 显示提示；移动超过 10px 会取消，松手约 1.5s 后收起。设为 false 可关闭触屏长按。",
      "触屏长按",
    ],
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
      "arrowPosition",
      '"left" | "right"',
      '"right"',
      "left | right",
      "left 表示阅读起点，right 表示阅读末端；方向随 dir 镜像（LTR 默认右侧、RTL 默认左侧）。",
      "展开箭头位置",
    ],
    [
      "dir",
      '"ltr" | "rtl"',
      "ltr",
      "ltr | rtl",
      "显式设置菜单阅读方向；组件不读取 Runtime 或 ConfigProvider 方向，未传时固定为 LTR；子菜单层级线、箭头和文本按所选方向排列。",
      "手动切换 LTR / RTL",
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
      "quickJumperWidth",
      "number | string",
      "90px",
      "数字像素值或 CSS 宽度字符串",
      "同时设置页大小下拉和快速跳转输入框宽度；默认 90px。responsive 小于 800px 时两者统一为 45px，560px 以下只显示当前页，560–799px 保留完整页码并隐藏范围/总数，800px 起使用此配置。",
      "96",
    ],
    [
      "showTotal",
      "(total, range) => ReactNode",
      "undefined",
      "总数和 [start, end]",
      "自定义总数和当前范围展示。",
      "总数",
    ],
    ["simple", "boolean", "false", "true | false", "使用简洁的当前页/总页数布局。", "简洁模式"],
    [
      "responsive",
      "boolean",
      "true",
      "true | false",
      "小于 560px 时只显示当前页；560–799px 保留完整页码但隐藏范围/总数；800px 起使用标准布局。小于 800px 时页大小与跳页控件均为 45px。",
      "响应式",
    ],
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
    [
      "render",
      "(item, direction) => ReactNode",
      "undefined",
      "条目和方向",
      "自定义两栏中的条目主体内容。",
      "自定义条目",
    ],
    [
      "itemActions",
      "(item, direction) => ReactNode",
      "右侧双向模式默认移除按钮",
      "left | right；undefined 表示使用默认行为",
      "渲染条目最右侧操作区；右侧双向模式未自定义时显示删除按钮，点击后将条目移回左侧。",
      "条目操作",
    ],
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
      "MenuClassNames",
      "{}",
      "root | group | item | icon | label | arrow | submenu",
      "按菜单导航、层级和条目区域覆写样式。",
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
    ["action", "ReactNode", "undefined", "任意 ReactNode", "在内容逻辑末端渲染操作区（LTR 右侧、RTL 左侧）。", "操作"],
    [
      "closable / onClose",
      "boolean / () => void",
      "false / undefined",
      "true | false 及关闭回调",
      "显示并处理逻辑末端垂直居中的关闭按钮（LTR 右侧、RTL 左侧）。",
      "关闭",
    ],
    ["banner / bordered", "boolean", "false / true", "true | false", "控制横幅模式和边框显示。", "视觉变体"],
    [
      "dir",
      '"ltr" | "rtl"',
      "ltr",
      "ltr | rtl",
      "显式设置提示的阅读方向；组件不读取 Runtime 或 ConfigProvider 方向，未传时固定为 LTR；图标、正文、操作和关闭按钮随方向调整。",
      "手动切换 LTR / RTL",
    ],
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
    ["closable", "boolean", "true", "true | false", "控制位于逻辑末端的独立关闭按钮。", "关闭按钮"],
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
      "dir",
      '"ltr" | "rtl"',
      "ltr",
      "ltr | rtl",
      "显式设置全局消息的阅读方向；组件不读取 Runtime 或 ConfigProvider 方向，未传时固定为 LTR；文本、语义边线和操作位置随方向调整。",
      "手动切换 LTR / RTL",
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
      "title | description | type | duration | closable | dir",
      "在页面行内末端打开可关闭通知（LTR 右侧、RTL 左侧）。",
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
    [
      "dir",
      '"ltr" | "rtl"',
      "ltr",
      "ltr | rtl",
      "显式设置通知卡片方向；组件不读取 Runtime 或 ConfigProvider 方向，未传时固定为 LTR，并按所选方向将通知放入行内末端堆栈。",
      "手动切换 LTR / RTL",
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
    ["searchable", "boolean", "false", "true | false", "在每个级联列启用紧凑搜索，只过滤当前列。", "列搜索"],
    [
      "searchLevels",
      "number[]",
      "undefined",
      "0-based level[]",
      "只在指定的级联列渲染搜索框；例如 [3] 仅搜索第四层。",
      "指定列搜索",
    ],
    [
      "searchValue / defaultSearchValue",
      "string | Record<number, string>",
      '"" / ""',
      "按级别受控或非受控搜索文本",
      "控制每个级联列的搜索关键词及初始值；搜索只过滤当前列，不改变已选路径。",
      "搜索状态",
    ],
    ["searchPlaceholder", "ReactNode", "内置“搜索”", "任意 ReactNode", "自定义级联搜索框的占位内容。", "搜索框"],
    [
      "onSearch",
      "(value: string, level?: number) => void",
      "undefined",
      "搜索文本和级别",
      "当前级联列搜索关键词变化后的回调。",
      "搜索联动",
    ],
    [
      "loadChildren",
      "(option, level) => CascaderOption[] | Promise<CascaderOption[]>",
      "undefined",
      "异步子节点加载函数",
      "按级联层级点击节点后懒加载子节点；返回空数组时将当前节点作为叶子提交。",
      "懒加载",
    ],
    [
      "loadMoreChildren / loadSearchChildren",
      "(option, level, currentOptions, searchValue) => CascaderOption[] | Promise<CascaderOption[]>",
      "undefined",
      "增量加载或当前列搜索加载函数",
      "为当前列追加下一页或按关键词替换远程结果；配合 hasMore 和 loadMoreTrigger 使用。",
      "增量懒加载与搜索",
    ],
    [
      "hasMore / loadingMore",
      "boolean | (option, level, searchValue) => boolean / boolean",
      "false / false",
      "true | false 或按节点判断",
      "控制当前级联列是否还有数据及是否处于加载中。",
      "加载状态",
    ],
    [
      "loadMoreTrigger / loadMoreText",
      '"scroll" | "click" | "both" / ReactNode',
      '"scroll" / 内置“加载更多”',
      '"scroll"、"click"、"both" / 任意 ReactNode',
      "配置滚动到底、点击空心按钮或两者触发下一页加载，并自定义按钮文案。",
      "加载更多",
    ],
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
      "id",
      "string",
      "undefined",
      "稳定且唯一的 DOM id",
      "设置 Anchor 根节点 id；closable 用它在 SPA 切页再返回时识别并保持关闭状态。",
      "关闭状态标识",
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
      "arrowPosition",
      '"left" | "right" | "start" | "end"',
      '"end"',
      "left | right | start | end",
      "设置可折叠标题节点的箭头位置；start/end 随 LTR/RTL 方向变化，left/right 指定物理边。",
      "折叠箭头位置",
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
      '"left" | "right" | "start" | "end"',
      '"end"',
      "left | right | start | end",
      "fixed 模式下选择悬浮边缘；默认 end 在 LTR 靠右、RTL 靠左，避免压住对应方向的侧栏。",
      "悬浮位置",
    ],
    [
      "draggable",
      "boolean",
      "false",
      "true | false；仅 fixed 模式生效",
      "显示独立拖动按钮；可用鼠标、触屏或键盘在视窗内移动整个目录，static 普通布局不响应拖动。",
      "可拖动目录",
    ],
    [
      "closable",
      "boolean",
      "false",
      "true | false；仅 fixed 模式生效",
      "显示关闭按钮；关闭后整页刷新前保持隐藏；稳定的 Anchor id 可保证 SPA 切页再返回后仍隐藏。",
      "关闭目录",
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
      "root | header | actions | dragHandle | closeButton | list | item | activeItem | node | nodeToggle | toggle",
      "按目录、折叠和工具按钮区域追加定制 class。",
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
    [
      "showLabel",
      "boolean",
      "true",
      "true | false",
      "是否显示 label 传入的进度说明；label 超出宽度时通过公共 Ellipsis 提供 Tooltip。",
      "进度说明",
    ],
    ["showPercentage", "boolean", "true", "true | false", "是否显示当前滚动百分比；进度条始终反映真实比例。", "百分比"],
    [
      "mobileMode",
      "boolean",
      "false",
      "true | false",
      "启用小屏紧凑模式；只渲染百分比文本和回到顶部按钮，并忽略 label 与进度条展示设置。",
      "小屏模式",
    ],
    [
      "showBackTop",
      "boolean",
      "true",
      "true | false",
      "是否显示回到顶部按钮；滚动距离超过 backTopThreshold 后出现。",
      "回顶按钮",
    ],
    [
      "backTopMode",
      '"threshold" | "always"',
      '"threshold"',
      "threshold | always",
      "threshold 按 backTopThreshold 按需显示；always 即使当前进度为 0 也始终显示回顶按钮。",
      "回顶显示模式",
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
  TextField: {
    inputRule: {
      type: '"number" | "letter" | "alphanumeric"',
      defaultValue: "undefined",
      options: "number | letter | alphanumeric",
      description: "按字符过滤纯数字、纯英文字母或字母数字混合输入；允许清空后继续编辑。",
    },
    inputPattern: {
      type: "string | RegExp",
      defaultValue: "undefined",
      options: "可增量匹配的正则表达式",
      description: "按可编辑前缀过滤输入和粘贴内容；固定长度等最终校验使用 Form.Item.rules.pattern。",
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
      description: "快捷项选择后立即回传并切换日历月份；范围日历以结束日期所在月份为焦点。",
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
      description: "显示确定按钮；选择仍即时触发 onChange，点击确定只关闭面板。",
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
  "pro-textfield": [
    ...proTextFieldApiRows,
    ...rowsForComponents("TextField")
      .filter((row) => !proTextFieldApiRows.some((own) => own.name === row.name))
      .map((row) => ({ ...row, component: "ProTextField" })),
    ...splitStringApiRows,
  ],
  checkbox: rowsForComponents("Checkbox", "CheckboxGroup"),
  radio: rowsForComponents("Radio", "RadioGroup"),
  switch: rowsForComponents("Switch"),
  slider: rowsForComponents("Slider"),
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

const selectLazyCatalog = Array.from({ length: 600 }, (_, index) => {
  const serial = String(index + 1).padStart(3, "0");
  return { label: `服务节点 ${serial}`, value: `service-${serial}` };
});
const cascaderLazyCatalog = Array.from({ length: 600 }, (_, index) => {
  const serial = String(index + 1).padStart(3, "0");
  return { label: `远程节点 ${serial}`, value: `remote-node-${serial}`, isLeaf: true };
});
const cascaderLazyPageSize = 40;

function ComponentCatalogRenderer({
  pro,
  direction: controlledDirection,
  onDirectionChange,
}: {
  pro: boolean;
  direction?: "ltr" | "rtl";
  onDirectionChange?: (direction: "ltr" | "rtl") => void;
}) {
  const { locale } = useBiuContext();
  const { $t } = useBiuI18n();
  const [buttonClicks, setButtonClicks] = useState(0);
  const [text, setText] = useState("组件库");
  const [numberText, setNumberText] = useState("2026");
  const [letterText, setLetterText] = useState("Biu");
  const [alphanumericText, setAlphanumericText] = useState("Biu2026");
  const [customPatternText, setCustomPatternText] = useState("BIU-2026");
  const [checks, setChecks] = useState(["ui"]);
  const [radio, setRadio] = useState("react");
  const [switched, setSwitched] = useState(false);
  const [weatherRange, setWeatherRange] = useState<[number, number]>([12, 28]);
  const [volume, setVolume] = useState(68);
  const [brightness, setBrightness] = useState(70);
  const [rating, setRating] = useState(4);
  const [sliderOpacity, setSliderOpacity] = useState(0.75);
  const [basicSelect, setBasicSelect] = useState("platform");
  const [select, setSelect] = useState<string | string[]>(pro ? ["platform"] : "platform");
  const [multiSelect, setMultiSelect] = useState<string[]>([
    "short",
    "platform",
    "product",
    "design",
    "quality",
    "operations",
  ]);
  const [unknownSelect, setUnknownSelect] = useState("backend-team-unknown");
  const [lazySelect, setLazySelect] = useState("service-001");
  const [lazySelectSearch, setLazySelectSearch] = useState("");
  const [lazySelectOptions, setLazySelectOptions] = useState(() => selectLazyCatalog.slice(0, 20));
  const [lazySelectLoadedCount, setLazySelectLoadedCount] = useState(20);
  const [lazySelectLoading, setLazySelectLoading] = useState(false);
  const [cascade, setCascade] = useState<string[]>(["china", "east", "shanghai"]);
  const [unknownCascade, setUnknownCascade] = useState<string[]>([
    "backend-domain-unknown",
    "backend-region-unknown",
    "backend-node-unknown",
  ]);
  const [cascaderLazyLoadedCount, setCascaderLazyLoadedCount] = useState(0);
  const [date, setDate] = useState<React.ComponentProps<typeof DatePicker>["value"]>(dayjs("2026-09-01 09:09:09"));
  const [date12Hour, setDate12Hour] = useState<React.ComponentProps<typeof DatePicker>["value"]>(
    dayjs("2026-09-01 15:09:09"),
  );
  const [rangeDate, setRangeDate] = useState<React.ComponentProps<typeof RangeDatePicker>["value"]>([
    dayjs("2026-09-01 09:09:09"),
    dayjs("2026-09-30 18:30:00"),
  ]);
  const [time, setTime] = useState<React.ComponentProps<typeof TimePicker>["value"]>(dayjs("2026-09-01 09:09:09"));
  const [time12Hour, setTime12Hour] = useState<React.ComponentProps<typeof TimePicker>["value"]>(
    dayjs("2026-09-01 15:09:09"),
  );
  const [rangeTime, setRangeTime] = useState<React.ComponentProps<typeof RangeTimePicker>["value"]>([
    dayjs("2026-09-01 09:09:00"),
    dayjs("2026-09-01 18:30:00"),
  ]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [menuKey, setMenuKey] = useState("overview");
  const [uncontrolledDirection, setUncontrolledDirection] = useState<"ltr" | "rtl">("ltr");
  const showcaseDirection = controlledDirection ?? uncontrolledDirection;
  const setShowcaseDirection = onDirectionChange ?? setUncontrolledDirection;
  const [dropdownChecks, setDropdownChecks] = useState(["compact"]);
  const [dropdownRadio, setDropdownRadio] = useState("light");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [treeSelected, setTreeSelected] = useState(["control"]);
  const [transfer, setTransfer] = useState<Array<{ label: ReactNode; value: string }>>([
    { label: "Runtime", value: "runtime" },
  ]);
  const [unknownTransfer, setUnknownTransfer] = useState<Array<{ label: ReactNode; value: string }>>([
    { label: "后端返回项：legacy-runtime（当前列表暂无）", value: "legacy-runtime" },
    { label: "Runtime", value: "runtime" },
  ]);
  const [oneWayTransfer, setOneWayTransfer] = useState<Array<{ label: ReactNode; value: string }>>([]);
  const [previewFile, setPreviewFile] = useState<BiuFileItem>();
  const [files, setFiles] = useState<BiuFileItem[]>([
    { uid: "logo", name: "logo.svg", type: "image/svg+xml", url: "/logo.svg", status: "success" },
    { uid: "guide", name: "guide.pdf", type: "application/pdf", url: "/guide.pdf", status: "ready" },
  ]);
  const options = React.useMemo(
    () => [
      { label: "平台工程与基础架构团队", value: "platform" },
      { label: "业务研发与数据应用团队", value: "product" },
      { label: "体验设计与设计系统团队", value: "design", disabled: pro },
      { label: "质量保障与自动化验证中心", value: "quality" },
      { label: "运营协同与客户成功支持中心", value: "operations" },
      { label: "超长选项：跨区域数据治理与服务编排联合工作组", value: "governance" },
    ],
    [pro],
  );
  const multiSelectOptions = React.useMemo(
    () => [
      { label: "短", value: "short" },
      ...options,
      { label: "超长选项：这是用于验证多选标签最大宽度和省略提示的演示内容", value: "very-long" },
    ],
    [options],
  );
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
                  ellipsis: { maxWidth: 140 },
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
        description="提供无搜索、全列搜索和指定第四层搜索/增量懒加载三个案例；搜索只过滤当前列，第四层首屏 40 条，支持滚动到底或点击加载更多，数据总量 600 条。"
      >
        <div className="biu-capability-cascader-demos">
          <div className="biu-capability-cascader-demo">
            <span>基础级联（无搜索）</span>
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
          </div>
          <div className="biu-capability-cascader-demo">
            <span>各级搜索</span>
            <Cascader
              options={[
                {
                  label: "中国",
                  value: "china-search",
                  children: [
                    {
                      label: "华东",
                      value: "east-search",
                      children: [
                        { label: "上海", value: "shanghai-search" },
                        { label: "杭州", value: "hangzhou-search" },
                      ],
                    },
                    { label: "华南", value: "south-search", children: [{ label: "深圳", value: "shenzhen-search" }] },
                  ],
                },
                { label: "海外", value: "overseas-search", children: [{ label: "新加坡", value: "singapore-search" }] },
              ]}
              searchable
              placeholder="可搜索当前列"
              optionRender={(option) => <span>{option.label}</span>}
            />
          </div>
          <div className="biu-capability-cascader-demo">
            <span>后端未知路径回显（当前 options 未加载）</span>
            <Cascader
              options={[{ label: "已知业务域", value: "known-domain", isLeaf: true }]}
              value={unknownCascade}
              onChange={setUnknownCascade}
              placeholder="后端未知路径"
            />
          </div>
          <div className="biu-capability-cascader-demo">
            <span>第四层搜索与懒加载（600 条）</span>
            <Cascader
              options={[
                {
                  label: "业务域",
                  value: "domain",
                  children: [
                    {
                      label: "仓库",
                      value: "warehouse",
                      children: [{ label: "远程节点目录", value: "remote-catalog", hasChildren: true }],
                    },
                  ],
                },
              ]}
              defaultValue={[]}
              searchLevels={[3]}
              searchable
              placeholder="先选择到第四层"
              loadChildren={async () => {
                await new Promise((resolve) => window.setTimeout(resolve, 180));
                setCascaderLazyLoadedCount(cascaderLazyPageSize);
                return cascaderLazyCatalog.slice(0, cascaderLazyPageSize);
              }}
              hasMore={(option, level, searchValue) =>
                level === 3 && !searchValue && cascaderLazyLoadedCount < cascaderLazyCatalog.length
              }
              loadMoreTrigger="both"
              loadMoreText="点击加载更多"
              loadMoreChildren={async (_option, level, currentOptions, searchValue) => {
                await new Promise((resolve) => window.setTimeout(resolve, 120));
                if (level !== 3 || searchValue) return [];
                const next = cascaderLazyCatalog.slice(
                  currentOptions.length,
                  currentOptions.length + cascaderLazyPageSize,
                );
                setCascaderLazyLoadedCount(currentOptions.length + next.length);
                return next;
              }}
              loadSearchChildren={async (_option, level, searchValue) => {
                await new Promise((resolve) => window.setTimeout(resolve, 120));
                if (level !== 3) return [];
                const query = searchValue.trim().toLowerCase();
                return query
                  ? cascaderLazyCatalog
                      .filter((item) => item.label.toLowerCase().includes(query))
                      .slice(0, cascaderLazyPageSize)
                  : cascaderLazyCatalog.slice(0, cascaderLazyPageSize);
              }}
              optionRender={(option) => <span>{option.label}</span>}
            />
          </div>
        </div>
      </Section>

      <Section
        id="select"
        title="选择器 Select"
        description="先展示基础单选，再展示搜索单选、600 条数据懒加载单选和多选；支持全部、全选、三参数 onChange、自定义 option/label/tag 和下拉插槽。"
      >
        <div className="biu-capability-select-demos">
          <div className="biu-capability-select-demo">
            <span>基础单选</span>
            <Select
              options={options}
              value={basicSelect}
              onChange={(value) => setBasicSelect(typeof value === "string" ? value : "")}
              placeholder="基础单选"
            />
          </div>
          <div className="biu-capability-select-demo">
            <span>后端未知值回显（不在 options 中）</span>
            <Select
              options={[{ label: "平台团队", value: "platform" }]}
              value={unknownSelect}
              allowClear
              onChange={(value) => setUnknownSelect(typeof value === "string" ? value : "")}
              placeholder="后端未知值"
            />
          </div>
          <div className="biu-capability-select-demo">
            <span>搜索单选、全部选项与自定义下拉区域</span>
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
          </div>
          <div className="biu-capability-select-demo">
            <span>搜索与懒加载单选（600 条，滚动或点击加载）</span>
            <Select
              options={lazySelectOptions}
              value={lazySelect}
              searchable
              searchValue={lazySelectSearch}
              onSearch={(value) => {
                setLazySelectSearch(value);
                const query = value.trim().toLowerCase();
                if (!query) return;
                const matches = selectLazyCatalog.filter((option) => option.label.toLowerCase().includes(query));
                setLazySelectOptions((current) => [
                  ...current,
                  ...matches.filter((option) => !current.some((item) => item.value === option.value)),
                ]);
              }}
              loadMoreTrigger="both"
              loadMoreText="点击加载更多"
              hasMore={lazySelectLoadedCount < selectLazyCatalog.length}
              loadingMore={lazySelectLoading}
              onChange={(value) => setLazySelect(typeof value === "string" ? value : "")}
              onLoadMore={async () => {
                if (lazySelectLoading || lazySelectLoadedCount >= selectLazyCatalog.length) return;
                setLazySelectLoading(true);
                await new Promise((resolve) => window.setTimeout(resolve, 250));
                const nextCount = Math.min(lazySelectLoadedCount + 20, selectLazyCatalog.length);
                setLazySelectOptions((current) => [
                  ...current,
                  ...selectLazyCatalog
                    .slice(lazySelectLoadedCount, nextCount)
                    .filter((option) => !current.some((item) => item.value === option.value)),
                ]);
                setLazySelectLoadedCount(nextCount);
                setLazySelectLoading(false);
              }}
              placeholder="滚动加载更多"
            />
            <span>已准备 {lazySelectOptions.length} / 600 条，可搜索、点击或滚动加载</span>
          </div>
          <div className="biu-capability-select-demo">
            <span>多选、全选与标签省略</span>
            <Select
              mode="multiple"
              options={multiSelectOptions}
              hasAllOption
              allowAllSelect
              searchable
              maxTagCount="responsive"
              value={multiSelect}
              onChange={(value, option, index) => {
                setMultiSelect(Array.isArray(value) ? value : value ? [value] : []);
                biuMessage.info(`多选索引：${index}`);
              }}
              labelRender={(_value, option) => option?.label ?? "未命名"}
              tagRender={(option, onClose) => (
                <span className="biu-ui-select__tag">
                  <Ellipsis
                    content={String(option.label ?? "未命名")}
                    maxWidth={150}
                    className="biu-ui-select__tag-label"
                  />
                  <button
                    type="button"
                    aria-label={`移除 ${option.label}`}
                    className="biu-capability-tag-close"
                    onClick={onClose}
                  >
                    <X size={12} aria-hidden="true" />
                  </button>
                </span>
              )}
            />
          </div>
        </div>
      </Section>

      <Section
        id="textfield-textarea"
        title="文本框 TextField / Textarea"
        description="筛选区和 Form.Item 均可直接组合；支持输入规则、正则过滤、清除、计数、前后缀和原生 inputProps。"
      >
        <Stack direction="column" gap={14}>
          <div className="biu-capability-demo-block">
            <strong>基础输入、搜索和文本域</strong>
            <Grid columns={3} gap={10} style={{ alignItems: "start" }}>
              <TextField
                value={text}
                onChange={(event) => setText(event.target.value)}
                allowClear
                onClear={() => setText("")}
                showCount
                maxLength={20}
                addonBefore="关键字"
                placeholder="请输入"
                aria-label="基础文本"
              />
              <TextField
                type="search"
                placeholder="筛选条件"
                inputProps={{ autoComplete: "off" }}
                aria-label="搜索文本"
              />
              <Textarea placeholder="备注信息" showCount maxLength={80} rows={3} aria-label="备注文本" />
            </Grid>
          </div>
          <div className="biu-capability-demo-block">
            <strong>内置输入规则：纯数字、纯字母、字母数字</strong>
            <Grid columns={3} gap={10} style={{ alignItems: "start" }}>
              <div>
                <TextField
                  value={numberText}
                  inputRule="number"
                  onChange={(event) => setNumberText(event.target.value)}
                  placeholder="仅允许数字"
                  aria-label="纯数字文本"
                />
                <span>实际值：{numberText || "（空）"}</span>
              </div>
              <div>
                <TextField
                  value={letterText}
                  inputRule="letter"
                  onChange={(event) => setLetterText(event.target.value)}
                  placeholder="仅允许英文字母"
                  aria-label="纯字母文本"
                />
                <span>实际值：{letterText || "（空）"}</span>
              </div>
              <div>
                <TextField
                  value={alphanumericText}
                  inputRule="alphanumeric"
                  onChange={(event) => setAlphanumericText(event.target.value)}
                  placeholder="允许字母和数字"
                  aria-label="字母数字文本"
                />
                <span>实际值：{alphanumericText || "（空）"}</span>
              </div>
            </Grid>
          </div>
          <div className="biu-capability-demo-block">
            <strong>自定义正则输入：大写字母、数字和短横线</strong>
            <Stack align={"center"} gap={10} wrap="wrap">
              <TextField
                value={customPatternText}
                inputPattern={/^[A-Z0-9-]*$/}
                onChange={(event) => setCustomPatternText(event.target.value)}
                placeholder="例如 BIU-2026"
                aria-label="自定义正则文本"
              />
              <span>实际值：{customPatternText || "（空）"}</span>
            </Stack>
          </div>
        </Stack>
      </Section>

      <Section
        id="pro-textfield"
        title="批量文本 ProTextField"
        description="换行、空白和中英文逗号可组合分隔；支持草稿确认、取消、清空及筛选区组合。"
      >
        <ProTextFieldDemo />
      </Section>

      <InputNumberShowcaseSection />

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
        id="slider"
        title="滑块 Slider"
        description="用于连续数值、范围和分档数值选择；支持键盘、点击轨道、刻度、范围双滑块、垂直方向和数值 Tooltip。"
      >
        <Stack direction="column" gap={14}>
          <div className="biu-capability-demo-block">
            <strong>天气范围</strong>
            <Stack align={"center"} gap={10} wrap="wrap">
              <Slider
                range
                min={-20}
                max={45}
                step={1}
                value={weatherRange}
                marks={{ [-20]: "-20℃", 0: "0℃", 20: "20℃", 45: "45℃" }}
                tooltip="always"
                onChange={(next) => setWeatherRange(next as [number, number])}
                aria-label="天气温度范围"
              />
            </Stack>
            <span>
              可接受温度：{weatherRange[0]}℃ 至 {weatherRange[1]}℃
            </span>
          </div>
          <div className="biu-capability-demo-block">
            <strong>音量</strong>
            <Stack align={"center"} gap={10} wrap="wrap">
              <Slider
                value={volume}
                onChange={(next) => setVolume(next as number)}
                tooltip="always"
                aria-label="音量"
              />
            </Stack>
            <span>当前音量：{volume}%</span>
          </div>
          <div className="biu-capability-demo-block">
            <strong>亮度与步进</strong>
            <Stack align={"center"} gap={10} wrap="wrap">
              <Slider
                value={brightness}
                min={0}
                max={100}
                step={10}
                dots
                tooltip="hover"
                onChange={(next) => setBrightness(next as number)}
                aria-label="屏幕亮度"
              />
            </Stack>
            <span>当前亮度：{brightness}%（每次调整 10%）</span>
          </div>
          <div className="biu-capability-demo-block biu-slider-rating-demo">
            <strong>评分设置</strong>
            <Slider
              value={rating}
              min={0}
              max={5}
              step={0.5}
              marks={{ 0: "0", 1: "1", 2: "2", 3: "3", 4: "4", 5: "5" }}
              tooltip="always"
              onChange={(next) => setRating(next as number)}
              aria-label="评分"
            />
            <span>当前评分：{rating} 分</span>
          </div>
          <div className="biu-capability-demo-block">
            <strong>透明度</strong>
            <Stack align={"center"} gap={10} wrap="wrap">
              <Slider
                value={sliderOpacity}
                min={0.2}
                max={1}
                step={0.05}
                opacity={sliderOpacity}
                tooltip="always"
                aria-label="滑块透明度"
                onChange={(next) => setSliderOpacity(next as number)}
              />
            </Stack>
            <span>当前透明度：{Math.round(sliderOpacity * 100)}%</span>
          </div>
        </Stack>
      </Section>

      <Section
        id="date-picker"
        title="日期选择器 DatePicker / RangeDatePicker"
        description="日期、时间、快捷项和清除均即时回传，选择后保持打开；可直接输入年份、选择月份，并提供 12 小时制日期时间案例。"
      >
        <Stack align={"center"} gap={10} wrap="wrap">
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
          <DatePicker
            value={date12Hour}
            onChange={setDate12Hour}
            locale={locale}
            format="YYYY-MM-DD hh:mm A"
            placeholder="YYYY-MM-DD hh:mm A"
            showTime
            hour12
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
        </Stack>
      </Section>

      <Section
        id="time-picker"
        title="时间选择器 TimePicker / RangeTimePicker"
        description="同时展示 24 小时制和 12 小时制；时间变化即时回传并保持面板打开，确认按钮只负责关闭。"
      >
        <Stack align={"center"} gap={10} wrap="wrap">
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
            hour12={false}
            needConfirm={pro}
          />
          <TimePicker
            value={time12Hour}
            onChange={setTime12Hour}
            locale={locale}
            format="hh:mm A"
            placeholder="hh:mm A"
            hour12
            needConfirm={pro}
          />
          <RangeTimePicker
            value={rangeTime}
            onChange={setRangeTime}
            locale={locale}
            format="HH:mm:ss"
            needConfirm={pro}
          />
        </Stack>
      </Section>

      <Section
        id="dialog"
        title="对话框 Dialog"
        description="UI Dialog 只提供可组合结构；默认可按住 header 非交互区域在浏览器视口内拖动，初始位置由 position 和 offset 决定；也支持 fullscreen、destroyOnClose、container 和 classNames。"
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

      <OverlayInteractionSections pro={pro} renderSection={(props) => <Section {...props} />} />

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
        <DirectionSwitch value={showcaseDirection} onChange={setShowcaseDirection} />
        <Typography muted>{$t("本页手动切换方向，只传给对应案例组件实例，不读取全局方向配置。")}</Typography>
        <Menu
          dir={showcaseDirection}
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
        description="响应式分为三档：小于 560px 显示当前页，560–799px 隐藏范围/总数并保留完整页码，800px 起使用标准样式；前两档的页大小和跳页控件宽度为 45px。"
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
        description="双栏数据转移，支持搜索/禁用/自定义标题和条目末端操作；双向模式右侧默认提供删除按钮，oneWay 模式只允许左侧移入右侧。"
      >
        <div className="biu-capability-transfer-demos">
          <div className="biu-capability-transfer-demo">
            <span>双向模式：右侧默认可删除移回</span>
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
              itemActions={(item, direction) =>
                direction === "left" ? (
                  <Button
                    type="secondary"
                    variant="text"
                    size="small"
                    onlyIcon
                    icon={<Search size={14} aria-hidden="true" />}
                    tooltip={`查看 ${String(item.label)}`}
                    aria-label={`查看 ${String(item.label)}`}
                    onClick={() => biuMessage.info(`查看：${String(item.label)}`, { locale })}
                  />
                ) : undefined
              }
              titles={pro ? ["可用包", "已选包"] : undefined}
              locale={locale}
            />
          </div>
          <div className="biu-capability-transfer-demo">
            <span>后端未知目标项：置顶、禁选，但仍可删除</span>
            <Transfer
              source={[
                { label: "Components", value: "components" },
                { label: "Runtime", value: "runtime" },
                { label: "Preset", value: "preset" },
              ]}
              target={unknownTransfer}
              onChange={setUnknownTransfer}
              showSearch
              titles={["当前可选", "后端已选"]}
              locale={locale}
            />
          </div>
          <div className="biu-capability-transfer-demo">
            <span>单向模式 oneWay：只能从左侧移入右侧</span>
            <Transfer
              source={[
                { label: "基础组件", value: "foundation" },
                { label: "业务组件", value: "business" },
                { label: "开发工具", value: "tooling" },
              ]}
              target={oneWayTransfer}
              onChange={setOneWayTransfer}
              oneWay
              titles={["待发布", "已发布"]}
              locale={locale}
            />
          </div>
        </div>
      </Section>

      <Section
        id="alert"
        title="提示 Alert"
        description="default、info、success、warning、error 五种状态，支持自定义 icon、description、action 和关闭。"
      >
        <DirectionSwitch value={showcaseDirection} onChange={setShowcaseDirection} />
        <div className="biu-capability-status-grid">
          <Alert dir={showcaseDirection} status="default" title="默认提示">
            这是默认信息。
          </Alert>
          <Alert dir={showcaseDirection} status="info" title="信息提示">
            数据正在同步。
          </Alert>
          <Alert dir={showcaseDirection} status="success" title="操作成功">
            数据已保存。
          </Alert>
          <Alert dir={showcaseDirection} status="warning" title="注意">
            部分字段尚未填写。
          </Alert>
          <Alert
            dir={showcaseDirection}
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
            dir={showcaseDirection}
            status="error"
            title="操作失败"
            description="请检查网络后重试。"
            icon={<X size={18} aria-hidden="true" />}
            action={
              <Button
                type="error"
                variant="outlined"
                size="small"
                onClick={() => biuMessage.info("正在重试", { locale, dir: showcaseDirection })}
              >
                重试
              </Button>
            }
            closable
            onClose={() => biuMessage.info("提示已关闭", { locale, dir: showcaseDirection })}
          />
        </div>
      </Section>

      <Section
        id="message"
        title="消息 Message"
        description="默认是轻量简约样式；复杂样式使用 complex=true。四个案例覆盖单行、多行和不同语义色，关闭按钮始终独占逻辑末端（LTR 右侧、RTL 左侧）。"
      >
        <DirectionSwitch value={showcaseDirection} onChange={setShowcaseDirection} />
        <Stack align={"center"} gap={8} wrap="wrap">
          <Button
            type="primary"
            size="small"
            onClick={() => biuMessage.info("这是一条简约单行消息", { locale, dir: showcaseDirection })}
          >
            简约单行
          </Button>
          <Button
            type="warning"
            size="small"
            onClick={() =>
              biuMessage.warning("第一行简约说明\n第二行补充当前状态和下一步处理建议。", {
                locale,
                dir: showcaseDirection,
              })
            }
          >
            简约多行
          </Button>
          <Button
            type="success"
            size="small"
            onClick={() => biuMessage.success("复杂样式单行消息", { locale, dir: showcaseDirection, complex: true })}
          >
            复杂单行
          </Button>
          <Button
            type="error"
            size="small"
            onClick={() =>
              biuMessage.error("第一行复杂错误说明\n第二行说明处理建议，右侧关闭按钮不会覆盖正文。", {
                locale,
                dir: showcaseDirection,
                complex: true,
              })
            }
          >
            复杂多行
          </Button>
        </Stack>
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
        <Stack align={"center"} gap={8} wrap="wrap">
          <Tag color="default">默认</Tag>
          <Tag color="info">信息</Tag>
          <Tag color="success">成功</Tag>
          <Tag color="warning">处理中</Tag>
          <Tag color="danger">失败</Tag>
        </Stack>
      </Section>

      <Section id="badge" title="徽标 Badge" description="支持数字徽标、圆点徽标和语义颜色。">
        <Stack align={"center"} gap={8} wrap="wrap">
          <Badge count={pro ? 8 : 3}>消息</Badge>
          <Badge dot color="success">
            在线
          </Badge>
          <Badge count={99} color="danger">
            通知
          </Badge>
        </Stack>
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
        description="通知支持标题、描述、语义类型、关闭和自动销毁；手动切换 LTR / RTL 时，通知堆栈跟随逻辑末端。"
      >
        <DirectionSwitch value={showcaseDirection} onChange={setShowcaseDirection} />
        <Space>
          <Button
            size="small"
            onClick={() => notification.success("示例操作已完成", { title: "成功通知", dir: showcaseDirection })}
          >
            打开通知
          </Button>
          <Notification
            dir={showcaseDirection}
            title="静态通知"
            description="通知也可以直接作为受控内容渲染。"
            type="info"
            duration={0}
          />
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
        description="自动扫描 h1-h5 标题生成目录；切换方向时，目录与阅读进度保持在同一侧。"
      >
        <AnchorScrollProgressDemo direction={showcaseDirection} onDirectionChange={setShowcaseDirection} />
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

export function ComponentUICatalog({
  direction,
  onDirectionChange,
}: {
  direction?: "ltr" | "rtl";
  onDirectionChange?: (direction: "ltr" | "rtl") => void;
} = {}) {
  // The catalog is the single documentation surface.  Use the richer preset
  // values here so the former Pro-only states are no longer hidden behind a
  // second page or a second menu entry.
  return <ComponentCatalogRenderer pro direction={direction} onDirectionChange={onDirectionChange} />;
}

export default function ComponentUIShowcase() {
  const catalogRef = useRef<HTMLDivElement>(null);
  const { locale, direction } = useBiuContext();
  // Keep the fixed catalog and reading-progress controls paired with the direction demo.
  const [showcaseDirection, setShowcaseDirection] = useState<"ltr" | "rtl">(direction === "rtl" ? "rtl" : "ltr");
  useEffect(() => {
    setShowcaseDirection(direction === "rtl" ? "rtl" : "ltr");
  }, [direction]);
  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash) return;
    const resetScroll = () =>
      document.querySelector<HTMLElement>(".biu-page-content")?.scrollTo({ top: 0, behavior: "auto" });
    const frame = window.requestAnimationFrame(resetScroll);
    const timer = window.setTimeout(resetScroll, 80);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, []);
  return (
    <ConfigProvider locale={locale}>
      <CapabilityPage
        title="组件能力展示"
        description="所有组件按统一顺序逐块展示；效果案例和属性/方法表同时作为可运行文档，基础能力与企业场景能力不再拆成两套页面。"
      >
        {/* Keep unsupported demos in their original LTR baseline; supported components receive dir explicitly. */}
        <div className="biu-component-showcase-layout" dir="ltr">
          <div ref={catalogRef} className="biu-component-showcase-layout__content">
            <ComponentUICatalog direction={showcaseDirection} onDirectionChange={setShowcaseDirection} />
          </div>
          <Anchor
            dir={showcaseDirection}
            position="end"
            container={catalogRef}
            scrollContainer=".biu-page-content"
            id="component-ui-showcase-anchor"
            levels={[2, 3, 4, 5]}
            title="组件目录"
            collapsible
            defaultCollapsed={false}
            mode="fixed"
            draggable
            closable
          />
          <ScrollProgress
            dir={showcaseDirection}
            target=".biu-page-content"
            label="页面阅读进度"
            mode="fixed"
            position={showcaseDirection === "rtl" ? "bottom-left" : "bottom-right"}
          />
        </div>
      </CapabilityPage>
    </ConfigProvider>
  );
}
