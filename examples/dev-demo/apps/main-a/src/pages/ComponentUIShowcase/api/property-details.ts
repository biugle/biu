import type { CapabilityApiRow } from "../../CapabilityPage/index.js";

type ApiPropertyDetail = NonNullable<CapabilityApiRow["propertyDetails"]>[string];

/** Per-property details supplement the independent component catalogues. */
export const apiPropertyDetails: Record<string, Record<string, ApiPropertyDetail>> = {
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
      type: "(value: string | string[] | undefined, option?: SelectOption | SelectOption[], index?: number) => void",
      defaultValue: "undefined",
      options: "值、当前 option、选项索引",
      description: "选择变化回调，按约定提供三个参数。",
    },
    optionRender: {
      type: "(option: SelectOption, index: number) => ReactNode",
      defaultValue: "undefined",
      options: "选项和索引",
      description: "自定义下拉列表项渲染。",
    },
    labelRender: {
      type: "(value: string, option?: SelectOption) => ReactNode",
      defaultValue: "undefined",
      options: "值和 option",
      description: "自定义触发器中的单选标签。",
    },
    tagRender: {
      type: "(option: SelectOption, onClose: () => void) => ReactNode",
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
      type: "(menu: ReactNode) => ReactNode",
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
      type: "(key: string) => void",
      defaultValue: "undefined",
      options: "菜单 key 和 item",
      description: "点击菜单项后的选择回调。",
    },
    dropdownRender: {
      type: "(menu: ReactNode) => ReactNode",
      defaultValue: "undefined",
      options: "菜单节点和状态上下文",
      description: "自定义菜单顶部、底部或整体渲染。",
    },
  },
};
