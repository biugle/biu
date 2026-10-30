# Biu 基座、组件与公共能力最终说明

> 状态：已确认实施并作为后续维护、回归、文档和交付的唯一规范入口。更新日期：2026-10-30。

本文件收敛组件库、基座、Demo、公共包和历次回归中形成的设计、功能、兼容性、文档与交付规则。原 `docs/specs/` 与 `docs/en/specs/` 下的分阶段 Spec 已全部并入本文及英文对应文件并移除；后续实现、修复、验收和 Agent 交接只以本文、英文对应文件和各公共包 API/使用手册为准，不再新建或维护第二套 Spec 目录。

## 1. 目标与参考边界

### 1.1 目标

- 基座只负责 Portal/APP 的布局骨架、路由菜单、状态编排、生命周期和响应式约束。
- `@biugle/react-components` 提供可直接使用的 UI 结构组件、Pro 页面预设、Overlay、Message、Fire 和公共交互行为。
- `@biugle/react-form` 提供标准表单状态、校验、`Form.Item`、`Form.Group`/`FormGroup` 和布局组合。
- `@biugle/react-table` 提供 UI Table、ProTable、`EditableTable` 和 `useQueryTable`，不复制请求客户端。Table 单元格默认自动换行并使用四边 `6px` 内边距；`Column.ellipsis` 显式使用公共省略能力，`Column.noWrap` 显式保持单行，未设置宽度的单行列可按内容扩展。列宽和行高调整均默认关闭，只有显式配置 `resizable: true` 或 `rowResizable` 才渲染拖动手柄；桌面端所有列宽手柄统一在表头悬停、手柄键盘聚焦或拖动时显示；触屏设备上的启用手柄统一以低对比度提示常显，避免依赖 hover；拖动使用单一 document 级会话，`pointerup`、`pointercancel` 和窗口失焦都会可靠清理，完成拖动后提交最终值，不再用 `Esc` 回滚。密度菜单底部的“重置表格”恢复默认尺寸。独立的 Table 尺寸调整 Demo 放在 EditableTable 标准页之后，EditableTable 和普通 Table 能力页不再开启尺寸手柄；列宽配置或拖动导致内容超宽时，仅内容视口横向滚动；表格内容视口默认纵向 auto：受 PageBox/flex 高度约束且内容超出时在表内滚动；自然高度布局随内容撑开，不出现空滚动条。EditableTable 复用公共文本、下拉、数字、文本域、日期和时间控件，编辑态在控件上方右侧提供三个紧凑的 outlined 按钮，取消为灰色、清空为红色、保存为绿色；按钮都带边框且不占用列宽。清空只更新草稿且保持编辑态，文本类控件继续支持失焦保存，选择/日期/时间控件不会因打开弹层失焦而提前提交。`EditableColumn.renderEditor` 可接入自定义编辑控件，context 提供草稿读写、保存、取消和清空方法，`onDoubleClick` 可监听桌面双击进入编辑；桌面仍使用双击，触屏单击和 Enter/Space 可启动编辑，单元格内链接或按钮不会误触发编辑；`onEditAction` 以及 `onEditStart`、`onEditSave`、`onEditCancel`、`onEditClear`、`onEditBlur` 分别提供完整编辑动作回调。
- Table/ProTable 的 `fillRemainingSpace: boolean` 默认 true。表格使用一个稳定的动态普通列：显式 `elasticColumn` 指定的叶子；未指定时默认最后一个可见普通叶子列。首次布局时，该列承接视口余量。动态列手柄与其他列统一在表头悬停、手柄键盘聚焦或拖动时显示，并位于列的逻辑尾边界（LTR 右侧、RTL 左侧）；触屏设备使用统一的低对比度提示。指针直接拖动动态列时，拖动过程中仅预览线跟随可接受的指针增量、列宽保持稳定，并在释放指针时一起提交目标列与最近前置普通列的反向补偿；该补偿在目标列或邻列任一达到边界时停止，不新增尾部填充空白；已有填充槽余量可在动态列扩宽时使用。拖动其他普通列时，先由动态列从当前提交宽度渐进吸收变化，动态列达到边界后再由它的前一普通列承接余量；可接受增量受目标列和补偿列的总边界容量约束。动态角色不会切换到相邻列，也不会每次提交后重新自动填满视口。动态自动填充或作为补偿列时可超过 `maxWidth`，直接拖动目标列仍受 `minWidth`/`maxWidth` 约束。`fixed`、`actionColumn` 和选择/展开辅助列不参与补偿。调用方无需声明弹性列；`fillRemainingSpace={false}`、`elasticColumn={false}` 或 `scroll.x="max-content"` 显式进入精确内容宽度和独立调整模式，不自动填充，也不进行列间补偿。
- `@biugle/http` 保持 `ts-xhttp` 的兼容基线；扩展只能向后兼容。
- i18n、events、bridge、router、store、http、logger、render-code、watermark、icons 和 query core 均可脱离 React 基座独立复用。
- Demo 同时承担展示、API 文档、回归入口和迁移示例职责。

### 1.2 参考边界

- `imd`：只参考组件功能、属性、交互和视觉设计，不复制其“下载到项目本地”的分层安装模式。
- `design-imile`、`imi`：参考组件规范、基座交互、布局和业务页面组合方式。
- `ds-web`：参考真实业务页面，尤其是 `useAntdTable` 对应的 `useQueryTable`、Form 页面、筛选区、工具栏和 CRUD 表格组合。
- `antd`、`Radix UI`、Tailwind CSS：使用成熟的 API 与行为；Radix 用于 focus、dismiss、portal、keyboard、collision，Tailwind 是内部编译层，组件仍保留独立 CSS、CSS variables、根 `className` 和 slot `classNames`。
- `ts-xhttp`：逐个方法、参数顺序、默认值、Hook、返回值、取消、重试、上传和异常行为建立兼容回归。

Chart、RichText、Editor、Preview Server 不属于基础包，本阶段只保留未来 adapter/peer 扩展边界。

## 2. 包结构与依赖关系

完整图见 [`docs/package-graph.md`](package-graph.md)。简化边界如下：

```mermaid
flowchart LR
  icons[@biugle/icons]
  neutral[@biugle/biu-i18n / events / bridge / router / store]
  transport[@biugle/http]
  logger[@biugle/logger]
  code[@biugle/render-code]
  watermark[@biugle/watermark]
  components[@biugle/react-components]
  form[@biugle/react-form]
  table[@biugle/react-table]
  query[@biugle/tanstack-query]
  runtime[@biugle/biu-runtime]
  preset[@biugle/biu-preset]
  cli[@biugle/biu-cli]

  components --> icons
  form --> components
  form --> icons
  table --> components
  table --> query
  runtime --> neutral
  runtime --> components
  preset --> runtime
  preset --> components
  preset --> watermark
  cli --> runtime
  cli --> preset
```

### 2.1 独立包规则

| 包                         | 责任                                            | React 依赖                   |
| -------------------------- | ----------------------------------------------- | ---------------------------- |
| `@biugle/biu-i18n`         | 语言归一化、资源、回退、运行时切换              | 无                           |
| `@biugle/biu-events`       | 同文档类型事件总线                              | 无                           |
| `@biugle/biu-bridge`       | Origin 校验、跨窗口协议、数据脱敏               | 无                           |
| `@biugle/biu-router`       | 菜单树、完整 URL、权限过滤、导航查询            | 无                           |
| `@biugle/biu-store`        | Zustand 标准封装、偏好/认证/菜单/会话           | 无                           |
| `@biugle/http`             | Axios 传输、取消、重试、上传、Hook 和异常       | 无                           |
| `@biugle/logger`           | 原生 console 封装、保护、监听和调试输出         | 无                           |
| `@biugle/render-code`      | 原生 QRCode/Barcode、SVG 与 base64 图片降级     | 无                           |
| `@biugle/watermark`        | 原生 DOM/SVG 水印与刷新销毁                     | 无                           |
| `@biugle/icons`            | 统一图标和分类查询                              | 无                           |
| `@biugle/tanstack-query`   | TanStack Query core；React 能力从 `/react` 导出 | root 无，`/react` 可选 React |
| `@biugle/react-components` | React UI、Pro、Overlay、Message、Fire           | React                        |
| `@biugle/react-form`       | react-hook-form 表单标准层                      | React                        |
| `@biugle/react-table`      | UI Table、ProTable、`useQueryTable`             | React                        |

禁止新增 `biu-ui` 第二套入口、第二套 Message/Tooltip/Ellipsis 实现或 Runtime/Preset 私有转发 API。Demo 使用公开入口。

## 3. 统一视觉与交互契约

### 3.1 DOM 与可覆写性

- 每个组件根节点必须有稳定的 `biu-ui-*` 或 `biu-pro-*` 前缀类名。
- 内部可定制区域必须有对应 slot 类名，例如 `__content`、`__trigger`、`__input`、`__footer`、`__close`。
- `className` 只追加到根节点；`classNames` 用于 root 和内部 slot；CSS variables 用于尺寸、颜色、阴影等主题覆写。
- Tailwind 可作为调用方样式覆盖，例如 `className="w-full"`；组件自己的复杂规则仍维护在组件目录/包 CSS 中。
- 不允许为了 Demo 手搓一套与组件行为重复的控件；Demo 的搜索、筛选、下拉、按钮、弹层、Tooltip、Ellipsis、Table 均使用公共包。
- `@biugle/react-components` 的 Menu 默认保留至少 12px 左侧内容间距，并通过 submenu 偏移表达层级；菜单项基础层级预留 2px 左侧间距，只有 `.biu-ui-menu__submenu > button` 的嵌套菜单 hover/active 状态使用约 4px 左移并扣除对应宽度，让状态背景不贴住层级直线且不溢出；最高层级保持原宽度和位置，避免 hover 抖动。Preset Sidebar/Topbar 可以在宿主边界使用更紧凑的导航覆盖。UI Menu、Preset Sidebar/Topbar 和移动菜单最多渲染五层，第五层之后的子节点全部忽略；粗指针设备上，展开侧栏中的收藏和新标签次级操作常显，避免必须依赖 hover 才能触发。
- 所有多语言资源和 `$t`/`i18n.$t`/`t` 调用统一使用中文原文作为 key，例如 `$t("列设置")`；英文只作为 `en-US` 资源值，禁止新增 `columnSettings`、`submit` 等英文或编码 key。
- Checkbox、Radio、Switch 与相邻文案必须垂直居中；showCount 的 TextField/Textarea 与同排控件共享顶部基线；Demo 的连续操作按钮和展示区域保持统一上下 margin/gap。

### 3.2 颜色和状态

当前默认语义色：

| 语义    | 默认色                          |
| ------- | ------------------------------- |
| Primary | `#1677ff`，明亮蓝色，不使用紫色 |
| Warning | `#faad14`，鲜明金琥珀色         |
| Success | `#52c41a`，浅亮绿色             |
| Error   | `#ff4d4f`，明确红色             |

Button、TextField、InputNumber、Select、Date/Time Picker、Popover、Dropdown 和 Switch 的 hover/focus 都采用同一套轻量边框阴影。Button 不位移、不跳动；active 与 180ms `pressed` 状态使用细微 outline/inset ring，所有 type 都可感知点击。

Button 在鼠标或键盘激活后必须保留 focus，并与 hover、active、focus-visible 使用同一套语义 border/shadow ring；`default` 实体按钮文字为黑色，`success` 实体按钮文字为白色。任何 type/variant 都不能因为颜色较深而失去点击反馈。

所有可点击区域必须有 `cursor: pointer`，包括按钮、关闭图标、Select、Dropdown、Popover、Tabs、Menu、Tree、Transfer、Pagination、InputNumber 上下按钮和文件操作。禁用状态使用 `not-allowed`。

### 3.3 Portal 与层级

- Dialog/Drawer/Popover/Tooltip/Popconfirm/Select/DatePicker 的浮层挂到 `document.body`，不挂在基座内容节点下。
- Dialog/Drawer 面板、遮罩、关闭按钮和内容区保持独立层级；Drawer 面板覆盖对应 viewport 边缘。
- Radix collision 负责避障、方向翻转和键盘行为；不要用硬编码 transform 把箭头再次平移。
- Drawer 内的 Select、DatePicker、Popover、Dropdown 等 Portal 控件点击事件按 composed path 判断为内部交互，不得被外层 Dialog/Drawer 的 outside click 或 focus 处理吞掉；Drawer 内控件保持 PageFilter 的默认高度，只在可用宽度上占满。
- Popconfirm 打开/关闭不改变 `documentElement.clientWidth`，不闪出垂直滚动条。
- Fire 根节点为 fixed、最高层级和独立 stacking context，复杂内容通过 `fire(Component)(props)` 挂载。

## 4. UI 组件清单与要求

组件能力页只有一个入口；所有组件类型按固定顺序各自独占一个标题块，并在同一页同时展示可运行效果和紧跟其后的专属 API 属性/方法表。页面末尾的完整表只作索引。原 Pro 深链接保留为统一页面兼容别名，菜单不再拆分 UI/Pro 两页；企业场景能力在同一顺序的案例中呈现。`@biugle/react-form` 是例外的公开包边界：Form 与 ProForm 统一从根入口导出，不提供 UI/Pro 子路径。

### 4.1 基础输入

- `Button/ButtonGroup`：`primary/warning/error/success/secondary/dark/default`，`contained/text/outlined`，icon 前/后/中、`onlyIcon` 独立图标按钮、`tooltip` 文案覆盖、loading、iconSize、disabled、block、shape、readonly、className、classNames、点击反馈和整体 gap。`onlyIcon` 由 Button 自己负责方形尺寸、图标居中、移除文字节点和 Tooltip，调用方不再添加独立 icon 按钮样式。
- `TextField/Textarea`：固定默认宽度，不随输入内容增长；支持 `onChange`、`onInput`、`allowClear`、`showCount`、`maxLength`、`addonBefore/After`、`size`、`inputProps`、autocomplete、错误态和宽度覆盖。 `TextField.inputRule` 提供 `number`、`letter`、`alphanumeric` 三种基础输入过滤，`inputPattern` 接收 `string | RegExp` 做增量正则过滤；两者都会处理键盘输入和粘贴内容，允许清空后继续编辑。固定长度等最终业务校验仍通过 `Form.Item.rules.pattern` 完成。
- `Textarea` 默认 `resize="both"`，由组件自己的受限角落命中区同时更新外层 frame 与 textarea 的宽高；右下角显示小型拖拽标识，不启用浏览器第二套原生句柄，支持 `horizontal/vertical/none`，`w-full` 可通过 `className` 覆盖且不能把组件拖出父容器。
- `InputNumber`：数值绝对值限制在 `Number.MAX_SAFE_INTEGER`（`9007199254740991`）以内，小数最多 15 位，并检查输入文本转成 JavaScript Number 后再转回十进制文本是否发生舍入；整数位较多时，可安全保留的小数位可能越少。超限或 Number 往返会改变输入时，保留原有效值并提示改用 TextField。`stringMode` 只改变回调类型，不放宽数值边界，也不适合任意精度金额、超大 ID 或编码。`decimal` 取代不易读的 precision 并保留兼容别名，最大有效值为 15；可与 `integer`、`sign` 组合使用。组件仍支持滚轮、范围、formatter/parser、`controls`、`thousandSeparator` 和 `decimalSeparator`；输入过程保留负号和小数点中间态，失焦时会把 `00.001`、`0.000`、`0100` 等有效数字规范化，绝不提交 `NaN`。按钮、键盘和滚轮步进使用十进制安全计算，避免 `0.1 + 0.2` 或 `3.14 + 1` 暴露浮点尾差。需要超出这些限制的精确数值、业务字符串（例如允许 `0000` 的卡号段）应使用 TextField 保存原始文本，并在业务层选择合适的十进制数值方案。
- `Checkbox/Radio/Switch`：受控/非受控、表单联动、禁用、只读、分组和自定义渲染。Switch 轨道不渲染文字，不被 Form.Item 的 `width:100%` 拉伸，白色 thumb 始终为圆形。
- `Slider`：支持单值和 `range` 双值、`min/max/step` 十进制安全步进、`marks`、`dots`、`tooltip="hover" | "always" | "never"`、`opacity`（0 - 1）、垂直/反向、禁用、受控/非受控以及 `onChange/onChangeComplete`。`hover` 在悬浮、聚焦或触屏拖动手柄时显示当前值，`always` 常驻显示，`never` 隐藏；历史 `auto` 值兼容为 `hover`。Slider 使用原生 range 输入承载键盘和无障碍语义，可见轨道和原生滑块使用一致端点，数值提示使用浅色浮层；轨道点击与拖动均按步进吸附；天气范围、音量、亮度、评分、透明度案例位于 Switch 后，Form.Item 同步展示单值与范围值。

### 4.2 选择与日期时间

- `Select`：单选/多选、`hasAllOption`、`allowAllSelect`、三参数 `onChange(value, option, index)`、option/label/tag render、`maxTagCount`、`maxCount`、搜索 sticky 区、header/footer、`loadMoreTrigger="scroll" | "click" | "both"`、空心加载更多按钮和自定义下拉内容。组件展示页必须同时提供一个当前 `options` 不包含但由后端传入的 `value` 回显案例。
- `Select`：除上述行为外支持 `size="small" | "medium" | "large"`，用于和 PageFilter、Toolbar 的 TextField/Button 保持同一高度。
- 多选 tag、`+N` 汇总 tag 和下拉选项默认使用 Ellipsis；悬停每个 tag 显示完整内容，`+N` 显示剩余全部值。设置 `maxTagCount="responsive"` 时按触发器宽度保留 0–3 个可见标签；触发器能够容纳一个短标签、`+N` 和尾部控件时优先保留第一个标签，只有空间低于这一最小阈值才收敛为 `+N`，更宽时再按约 104px 的标签预算追加可见项。紫色 `+N` 不参与压缩，Tooltip 展示全部隐藏值。
- `Cascader`：列式级联、路径受控、禁用、`changeOnSelect`、optionRender/displayRender；`searchable` 为每列提供独立搜索，`searchLevels` 可限制搜索列（例如 `[3]` 只搜索第四层），`loadChildren(option, level)` 加载首批子节点，`loadMoreChildren(option, level, currentOptions, searchValue)` 支持增量页，`hasMore` 与 `loadMoreTrigger="scroll" | "click" | "both"` 控制懒加载方式，`loadSearchChildren` 支持当前列远程搜索，叶子节点使用 `isLeaf: true`。组件最多渲染六层，超过第六层的子节点忽略；面板按列内容自适应宽度，六列无法同时展示时仅面板内部横向滚动，父节点选择不会提前关闭面板。组件展示页同时提供无搜索、各列搜索、第四层懒加载以及后端未知路径回显案例。
- `DatePicker/RangeDatePicker`：手搓日历，支持 `YYYY-MM-DD`、`YYYY-MM-DD HH:mm:ss` 和可读格式 `yyyy-mm-dd hh:ii:ss`，dayjs、范围、preset、disabledDate、disabledTime、needConfirm、showNow、footer、12/24 小时制、中文/英文和文案覆写。日历标题可直接输入年份并单独选择月份，保留上一月/下一月导航；`min/max` 限制日期、月份和翻页边界。单值日期默认快捷项为“今天/明天/昨天”，日期范围默认“近一周/近一月”，均可通过 `presets` 覆盖；点击日期、快捷项、Today、时间列或清除时立即更新值并触发 `onChange`，选择动作不会自动关闭面板。`needConfirm` 只控制是否显示确认关闭按钮，确认不会重复提交；触发器切换、点击面板外部和 Escape 仍可关闭。快捷日期立即将日历跳到目标月份，范围只显示一个月时聚焦结束日期所在月份；范围面板直接连续选择开始和结束日期，未完成的起始值也即时回传，反向选择会自动规范为前后顺序。Demo 提供 `YYYY-MM-DD hh:mm A` 12 小时制日期时间案例。
- `TimePicker/RangeTimePicker`：自定义 Select 时间面板，不使用原生 time input；支持 `HH:mm`、`HH:mm:ss`、12 小时制 `hh:mm A`、范围横杠、两侧等宽、`disabledTime`、确认和快捷预设。时间列、快捷项和清除每次变化都立即更新值并触发 `onChange`，且不会自动关闭面板；`needConfirm` 只增加确认关闭按钮，点击确认不重复提交，面板也可通过触发器、外部点击或 Escape 关闭。范围时间默认快捷项为“近一小时”“近一天”，范围任一侧先调整时，另一侧会保留已有值或填入该下拉列当前显示的默认值；桌面端时分秒选择器按范围容器收缩，不产生弹层横向滚动条；窄视口下主区可收缩，右侧时分秒不会溢出。Demo 同时展示 24 小时制和 `hh:mm A` 12 小时制。
- Range trigger 和 Range panel 都使用三列布局：左值、居中 `—`、右值，值区可收缩并 Ellipsis。

- 窄屏范围时间回归：RangeDatePicker(showTime) 与 RangeTimePicker 共用移动端弹层布局；桌面面板收缩到容器内且没有横向滚动条。窄屏 preset 区在顶部横向滚动，起止时间分组上下排列，每组时/分/秒控件按剩余宽度自动换行，所有控件限制在浮层边界内。

### 4.3 Overlay 与导航

- `Dialog/Drawer`：受控 `open/onOpenChange`、position/placement、offsetTop/offsetLeft、fullscreen、destroyOnClose、尺寸、遮罩、ESC、Portal、焦点和 classNames。Dialog 默认允许按住 header 非交互区域在浏览器视口内拖动，按钮、链接和输入控件不启动拖动；关闭后再次打开恢复 `position`/offset 初始位置，`draggable={false}` 可关闭拖动。Drawer 仍默认不可拖动。UI/Pro Drawer 未传 `placement` 时默认从右侧打开，平台能力 Demo 显式使用 `placement="right"`。
- Pro 只保留 `Confirm` 快捷入口 `fireConfirm`；复杂内容由用户组合 Dialog/Modal，不维护重复 Modal 层。
- `Tooltip`：默认允许展示，`onlyOverflow` 默认 false，自动避障、箭头居中、collision padding、placement、颜色和 maxWidth。`Ellipsis` 默认只在真实溢出时显示 Tooltip，`alwaysTooltip` 可强制打开；溢出测量同时检查 `overflow: hidden/clip/auto/scroll` 的裁切祖先，因此 Detail 等窄屏容器中被父级裁切的内容也能触发提示；基座多标签页等需要始终提示的地方显式使用 true。触屏长按约 700ms 显示 Tooltip，移动超过 10px 会取消，松手后约 1.5s 收起；`touchActivation` 默认 true，传 false 可关闭长按；普通 Tooltip 的短按保留原操作，长按会消费合成 click，避免误触包裹的按钮；纯文本溢出 Ellipsis 支持短按显示完整文本约 2.2 秒，位于按钮、链接、菜单项或表单标签内时不截获原操作，仍可长按查看。
- `Popover/Popconfirm`：disabled、受控、尺寸、方向、异步确认、描述、操作区和自定义 classNames；Popover 默认使用舒适的内容密度（180px 起、最大 420px、12px 内边距、10px 圆角），Popconfirm 保持紧凑尺寸，打开过程不得产生页面滚动条。
- `DropdownMenu`：label、separator、icon、shortcut、checkbox、radio、submenu、头尾插槽、自定义内容和内容溢出保护。默认使用与 Popconfirm 一致的紧凑菜单密度（4px 外壳内边距、30px 菜单项高度、8px 圆角）；超长菜单仅内部列表滚动，浮层外壳不产生滚动条。
- `Tabs`：根节点和横向 tablist 默认占满父容器宽度，底部分隔线延伸到整行；line/card/tag、水平/垂直、关闭/新增、仅溢出显示箭头、前后箭头、可选不显示箭头、滚动定位和中英文长度变化自适应。
- `Menu/Breadcrumb`：目录层级、openKeys、collapsed、选中、快捷导航、Ellipsis、图标和基座侧栏行为；Menu 支持 `dir="ltr" | "rtl"`，默认固定 LTR，由调用方显式选择，RTL 会镜像阅读顺序、层级引导和横向键盘焦点方向；组件不自动读取 Runtime 或 ConfigProvider。普通菜单无图标，目录图标只来自配置，不通过标题猜测。

### 4.4 数据展示与文件

- `Pagination`：页大小选择、quick jumper、showTotal、itemRender、responsive、simple、hideOnSinglePage、showLessItems 和完整页码布局。页大小必须使用组件库 `Select` 的 small 尺寸，quick jumper 必须使用组件库 `TextField` 的 small 尺寸，禁止混用原生输入控件。`quickJumperWidth` 默认 `90px`，接受数字像素值或 CSS 宽度字符串，并同时控制页大小下拉与跳页输入框；`responsive=true` 时小于 `560px` 只显示当前页，`560–799px` 保留完整页码但隐藏可选的范围/总数，两档下拉和跳页输入框统一为 `45px`；`800px` 起使用标准布局及配置宽度。基础 Pagination 与 Table Pagination 使用同一契约，`responsive=false` 可关闭视口适配。
- `Tree`：搜索、展开、选择/多选、checkable、半选、禁用、异步加载、层级引导线、目录/文件图标、Ellipsis 和性能边界。
- `Transfer`：双栏、搜索、全选、禁用、标题、统计、长文本 Ellipsis、批量移动和受控 target；`oneWay` 控制单向或双向移动，`itemActions(item, direction)` 自定义条目最右侧操作区。双向模式右侧未自定义操作时默认显示独立删除按钮，点击后将条目移回左侧；单向模式不渲染移回操作。组件展示页同时提供普通双向、后端未知目标项和 `oneWay` 单向三个可操作案例。视口不超过 640px 时两个列表上下排列；宽屏下仅当组件容器不超过 480px 才采用窄屏布局，按钮在列表间横向排列并使用下/上箭头；有足够空间时列表并排、操作按钮纵向排列并使用左右箭头。这样双栏 Demo 即使在较宽屏幕上被放入半宽卡片，也不会过早切换为竖排。
- `Alert/Empty/Loading/Progress/Tag/Badge/Steps`：标准语义色、可替换 icon、关闭、action、空态、加载、进度、轻量状态和步骤流程。Alert 支持显式 `dir="ltr" | "rtl"`，默认固定 LTR；Alert、Notification 和 `biuMessage` 都由调用方逐实例传入方向，不自动跟随 Runtime 或 ConfigProvider。RTL 下语义边线、图标、正文、操作和关闭区域沿阅读方向排列；Notification 堆栈放在所选方向的行内末端。Alert 与 Message 都提供多行案例，关闭按钮独占逻辑末端并垂直居中；Steps 数字与文本垂直居中。
- `Upload/FilePreview/FileCard/FileRender`：拖拽/选择、accept、大小校验、multiple、进度、取消、重试、移除、下载、图片/PDF/Markdown 预览、文件大小和状态展示；文本预览禁用 iframe 脚本，PDF 预览只允许隔离源中的脚本，所有预览 iframe 不携带 referrer；危险脚本 URL 不作为文件源加载。预览与下载动作统一 small 尺寸，下载链接不显示浏览器默认下划线，下载文字在按钮框内视觉居中；文件项的图标、文件名与实际存在的元信息垂直居中，无元信息时不保留空行。
- `Box/Grid/Stack/Card/Divider/Collapsible`：纯布局原语，不带业务假设；Divider 必须实际绘制分隔线。

### 4.5 内容导航与滚动反馈

- `Anchor`：扫描传入 `container` 或默认 document 中的 `h1`–`h5`，通过 `levels`/`selector` 限定范围；为无 `id` 标题生成稳定 id，按标题层级缩进，使用 `scrollContainer` 监听当前标题，点击时按 `offsetTop` 平滑定位，并在滚动期间持续校正目标位置以适应延迟布局的上方内容。支持目录折叠、`collapsibleLevels`、受控折叠 keys、`arrowPosition="left" | "right" | "start" | "end"`、`mode="fixed" | "static"`、`position="left" | "right" | "start" | "end"`、`draggable`、`closable`、`hideOnMobile`、`onChange`、`maxItems`、`className` 和 slot `classNames`。`start/end` 跟随 `ConfigProvider.direction` 或继承的 `dir`；固定目录默认放在逻辑末端，即 LTR 右侧、RTL 左侧。fixed 模式下 `draggable` 显示专用拖动按钮，可用鼠标、触屏或方向键将整块目录移动到浏览器视窗内任意位置；逻辑定位方向变化时会清除旧的物理拖动坐标并回到对应边缘，显式 `left/right` 仍保持物理定位。`closable` 显示关闭按钮，关闭后整页刷新前隐藏，提供稳定根 `id` 时 SPA 切页再返回仍保持关闭；关闭时清理该目录的观察器和监听器。折叠、拖动和关闭是分离的操作，不会因拖动误触折叠；static 模式不提供浮层控制。目录标题、层级缩进、连接线及逻辑方向箭头会随 LTR/RTL 镜像；目录高度上限为监听容器可视高度的 80%，只在列表内部滚动，小屏默认逻辑级不渲染。
- `ScrollProgress`：默认监听 window，也支持 HTMLElement、ref 和 selector；按 `scrollTop / (scrollHeight - clientHeight)` 展示百分比和进度条，超过 `backTopThreshold` 显示小型回顶按钮，支持自定义 `label`、`showLabel`、`showPercentage`、`showBackTop`、`mobileMode`、`backTopMode="threshold" | "always"`、`behavior`、`mode="fixed" | "static"`、四角 `position`、`draggable`、`onBackTop`、中文/英文 locale 和区域 classNames。`mobileMode` 手动开启小屏紧凑布局，只渲染百分比文本和回顶按钮，忽略 label 与进度条；label 使用公共 Ellipsis，溢出时显示完整 Tooltip；fixed 适合页面级阅读反馈，开启 `draggable` 后可在视窗范围内移动；static 适合组件卡片或自定义容器内嵌展示且不响应拖动。两个组件都必须清理 scroll/resize/observer，不能造成重复监听或页面卡顿。

## 5. Pro、Form 与 Table

### 5.0 菜单命名约束

所有公开菜单节点的 `code`、菜单 `path` 的每个段以及对应的本地页面目录必须使用首字母大写的驼峰命名（例如 `ComponentUIShowcase`、`/SystemConfig/UserManagement`）。禁止新增短横线、下划线或全小写的菜单路径；菜单最多渲染五层，第五层之后的子节点全部忽略；`appId`、域名、locale 等非菜单身份字段不受此规则影响。

### 5.1 Pro 预设能力

- `PageBox`：页面标题、描述、actions、loading、empty、footer 和稳定页面间距；`header` 可接入完整的调用方 PageHeader 内容（例如整行 Tabs），由 PageBox 统一维持 Header/Body/Footer 结构。
- `PageFilter/PageFilterItem`：筛选字段、操作区和高级字段 Drawer。label 以白底浮在唯一控件边框左上角，不额外套第二层框；直接子控件追加 `w-full`，占满等宽显式 Grid 轨道并保留调用方类。`itemMinWidth: number` 默认 170px，容器宽度、固定项宽度和操作内容共同确定列数，最多六列，`maxRows` 默认 2 并归一化到 1..2。操作区右对齐且占最后一个显式轨道 `-2 / -1`；禁止使用 `grid-column: -1` 创建额外隐式窄列。`PageFilterItem.width` 保留显式单项定宽能力并限制在容器内。容器、字段配置、语言和操作区尺寸变化时重新计算，不为测量重复挂载隐藏控件。`autoCollapse=true` 将超出容量字段收敛到 `large` Drawer；`false` 保持所有字段自然展开，可超过两行。主区与 Drawer 共用调用方受控字段状态；includeVisibleFieldsInDrawer=false 时仅保留已折叠字段及 moreFields。窗口扩大时已打开的 Drawer 保持挂载，关闭后移除不再需要的入口，缩窄不会自动重开。Drawer 默认两列、小屏一列；窄容器的单行模式可只显示操作区，并在 Drawer 编辑全部字段。无字段或操作时不占空间。更多筛选使用 secondary outlined，重置使用 secondary contained，查询使用 dark contained，均为 small，并通过公共 Ellipsis/Tooltip 处理长文案。
- `Form.Item.tooltip`、`Form.List.columns[].tooltip`、`PageFilterItem.tooltip`、`Table.Column.tooltip` 和 `DetailItem.tooltip`：每个属性都接收 `ReactNode`，在对应 label 或表头文本后渲染公共 Tooltip 问号按钮。文本使用明确的独立 span，Tooltip 外层、trigger、按钮和 SVG 均在各组件样式内共享文本中心线；可排序表头也分别包裹标题文本和排序图标，分组表头使用相同结构。验收比较实际文本 span 与 SVG 的中心，不用整个标签容器代替文字，也不通过图标偏移补丁改变位置，不增加边框或改变控件/列尺寸。`StandardTablePageShowcase` 与 `TableShowcase` 提供筛选说明案例。
- `ProTextField`：由 Pro 层组合原子 `TextField`、`Textarea` 与 body 挂载编辑浮层，默认 small 并可直接放入 `PageFilter.Item`。多行粘贴打开独立草稿；普通输入即时通知 `onChange(value, items)`，失焦时按已开启的分隔符解析、去空项并格式化，文本变化后再次通过 `onChange` 回传。批量入口和清空按钮使用紧凑 20px 尺寸，比常规 TextField 清除按钮小一档。批量应用先调用可异步的 `onApply(value, items)`，通过后才提交以换行连接的规范化文本。返回 false 不提交；异常保留草稿并显示重试提示；等待期间禁止重复提交和关闭。取消、Escape 或点击外部丢弃草稿，不修改受控值。`separatorIncludesSpace`、`separatorIncludesComma` 分别默认 false，后者同时接受中英文逗号；`splitString(str, separatorIncludesSpace?, separatorIncludesComma?)` 保留旧的一/二参数调用，始终按换行/回车解析、trim 并去空项，不排序或去重。完整逐属性中英文 API 与可运行案例见 [`react-components README`](../packages/react-components/README.md#protextfield) 和 `/ComponentUIShowcase` 的独立 ProTextField 区域；标准区域页展示批量 OR 搜索，接口转换边界见 [`data-contracts`](data-contracts.md)。
- `CopyText`：以 `Ellipsis` 展示文本并在末尾提供复制按钮。`text` 是准确复制值，`content` 只改变展示内容；`lines`、`maxWidth`、`alwaysTooltip` 控制省略；`copyOnHover` 默认 `false`，开启后按钮在桌面仅于 hover/focus 显示，在无 hover/粗指针设备上常显；`copyLabel`、`copiedLabel`、`onCopy`、`classNames` 分别控制提示文案、成功文案、回调和区域样式。复制优先使用 Clipboard API，失败时使用临时 textarea + `document.execCommand("copy")` 降级，适配旧浏览器和打印 WebView。
- `Detail`：配置驱动的只读详情展示组件，使用 `data` + `sections` 渲染分组栅格。`DetailSection` 支持 `title`、`icon`、`items`、`columns`、`bordered`；`DetailItem` 支持点路径 `key/dataIndex`、`render`、`span`、`tooltip`、`ellipsis`、`className` 和 `classNames`。空值统一展示 `-`，长值复用公共 Ellipsis；默认四列并在窄屏收敛为两列/一列，字段跨列跨度同步收敛到当前可见列数。小屏长按省略值可查看完整文本，值区域等裁切祖先也纳入溢出判断。
- `PageToolbar/PageTableBox`：用于标准 Table CRUD 页的工具区和内容区组合，基座不复制一套业务表格样式。
- 标准业务 Table Demo：能力展示单独提供 `/StandardTableTabsShowcase`、`/StandardTablePageShowcase`、`/EditableTablePageShowcase` 和 `/TableResizeShowcase` 四个菜单。页面使用脱敏 mock，分别覆盖多 Tab 页面、无 Tab 标准页、双击/触屏/键盘编辑和独立列宽/行高调整；尺寸页完整展示最小/最大约束、预览线、受控尺寸、`elasticColumn` 指定弹性列、`elasticColumn={false}` 无弹性列和回调，EditableTable 与普通 Table 能力页默认关闭尺寸手柄。四个页面统一使用最多 `6px` 外间距/内边距、圆角 `PageBox`、真实 `PageFilter` 自动折叠 Drawer、`ProTable` 或同契约的 Editable Toolbar 与组件分页；工具栏与表格内容间距统一为 6px，分页器统一右对齐，`800px` 起显示配置的范围/总数，`560–799px` 隐藏范围/总数并将下拉和跳页框缩为 `45px`，小于 `560px` 时仅显示当前页；标准页业务状态使用 `@biugle/biu-store`，`api.ts`、`mock.ts`、`store.ts` 分工明确；多 Tab 页根 Store 只维护 Tab，`TabPages/<TabCode>/` 各自维护页面入口、API、mock 和 Store，共享渲染逻辑归档在 `TabPages/shared/`。
- `Result`：success/error/info/warning/empty 状态和 action。
- `Message/Fire/fireConfirm`：Message 为全局能力；默认简约样式，`complex:true` 使用完整语义底色；多行正文、action 和关闭按钮拥有独立区域，`draggable` 开启后可在视窗范围内移动 fixed 消息；窄视口下 Alert 的 action 自动换到内容下方；Fire 负责 body 挂载和销毁；确认入口只保留 `fireConfirm`。

### 5.2 React Form

`@biugle/react-form` 以 `react-hook-form` 为状态基线：

- `Form` 负责 submit、invalid、disabled、readOnly、vertical/horizontal、columns、labelWidth、locale。
- `Form.Item` 负责 name、label、required、rules、help、extra、tooltip、dependencies、shouldUpdate、preserve 和 render props。
- `Form.Grid` 负责栅格列和 gap；`Form.List` 支持一行多个异构控件列、增删、上移/下移、可选拖动排序和 `showSort`，`minRows`/`maxRows` 的范围为 `0..99999`，行数据和排序由组件内部维护并可受控接入。每个 `columns[]` 可独立配置 `tooltip?: React.ReactNode`，在对应表头后显示垂直居中的问号 Tooltip。表头和行复用同一份 grid track，排序序号默认隐藏，开启时与拖动/上下移共用排序列，操作列固定在右侧并使用 secondary 小按钮。
- `Form.Group`/`FormGroup` 是带标题和样式的 Grid 区域，支持 `title`、`icon`、`description`、`columns`、`gap`、`bordered`、根和 header/title/body classNames；Form.Item 内的控件默认占满当前 grid track。
- Demo 必须将 Form.Item、Form.Group、Grid 与 TextField、Select、DatePicker、TimePicker、Checkbox、Radio、Switch、InputNumber 组合使用，并展示校验、联动、数组字段和提交结果。TextField 与 InputNumber 的案例要同时显示用户看到的展示值和 Form 当前实际值，覆盖基础输入规则、格式化数字和清空重填。Form.Item 的 render props 还必须有一个自定义组合字段案例：多个控件（例如枚举 Select、数字段 TextField、英文 TextField）共同写入一个字段，提交结果以单个完整值传给后端；数字段是业务字符串时不得用 InputNumber，避免丢失前导零。

- 窄屏 Form.List 的字段视口在父级轨道内横向滚动；表头与数据行边框按完整网格内容扩展，避免滚动列绘制到行边界外或撑宽页面。

### 5.3 React Table

- Table 能力页的 EditableTable 案例下方必须紧接“列宽与行高调整”操作 Demo，真实展示 `resizable` 列宽手柄、`rowResizable` 行高分隔线、受控尺寸、最小/最大约束、弹性列与无弹性列、密度菜单重置和尺寸回调；普通 Table 与 EditableTable 编辑案例本身默认关闭尺寸手柄。
- UI Table 负责列定义、多级表头、render、sorter、filters、filterDropdown、selection、expand、fixed/sticky、ellipsis、可选列宽/行高调整、斑马纹、summary、virtual scroll 和 pagination。`striped` 默认关闭，开启后偶数数据行使用比 hover 更浅的灰色背景，fixed 单元格同步行背景；叶子列只有显式 `resizable: true` 才显示列宽拖动图标，`rowResizable` 负责行高拖动，未配置的列和能力 API 表不显示拖动图标；`width`/`minWidth`/`maxWidth` 与 `rowHeights`/`minRowHeight`/`maxRowHeight` 负责尺寸约束。多级表头只通过叶子列调整，表头、单元格和横向滚动轨道共享叶子列宽度。ProTable 紧凑程度下拉底部提供空心“重置表格”按钮，恢复默认密度、列状态和非受控尺寸。
- ProTable/`useQueryTable` 负责 PageBox、PageFilter、PageToolbar、TableBox、请求状态、分页和 query 约定，不改变 UI Table 的基础渲染契约；新增、导出、刷新等业务按钮全部由页面通过 toolbar 插槽传入，ProTable 只提供密度、列设置和全屏三个结构工具；`PageFilter` 的高级 Drawer 默认包含主筛选区全部 `PageFilterItem` 与 `moreFields`，两处必须共用受控状态。
- fixed 列必须有不透底的背景和正确的 z-index/阴影；滚动区域、筛选区、空态、分页和长文本都不得退化为原生浏览器样式。
- 列宽由同一份叶子列像素总和驱动 `colgroup`、表格和滚动内容，避免浏览器重新分配导致 fixed/操作列变宽。`fixed` 和 `actionColumn` 不参与其它列补偿；选择与展开列各固定 42px。操作列默认按浏览器视口宽度响应式设为 60px（小于 560px）、160px（560–799px）和 190px（800px 起）；显式 `width` 或受控 `columnWidths` 优先，列宽手柄仍必须显式 `resizable: true`。操作单元格中的 icon-only `ButtonList` 默认 `maxCount` 分别为 1/3/5（都包含更多按钮），并按实际单元格宽度收敛；调用方显式设置 `maxCount` 或 `compactMaxCount` 时优先。普通位置的 ButtonList 默认响应式上限仍为小于 560px 时 1 个槽位、560–799px 时 3 个槽位。普通列的 `resizable=false` 仅关闭自身手柄，仍可参与余量与补偿；需要锁宽时使用 `fixed`。fixed 叶子列只有明确 `resizable=true` 时可调整自身，继承分组 fixed 的叶子使用相同规则：左固定列拖物理右侧内边界，右固定列拖物理左侧内边界。左固定列右拖增宽，右固定列左拖增宽；键盘箭头移动同一物理边界，右固定列 ArrowLeft 增宽。固定列的边界与增量方向不随 RTL 改变，仍遵守自身 min/max，且不会受到其它列或视口余量影响。
- 默认填充模式中，动态列手柄与其他列统一在表头悬停、手柄键盘聚焦或拖动时显示，并位于逻辑尾边界（LTR 右侧、RTL 左侧）。指针拖动动态列时仅预览线跟随可接受增量，列宽保持稳定，并在释放指针时提交由最近前置普通列反向补偿后的宽度；目标列或邻列任一达到边界后，成对拖动停止，不会继续缩小动态列并新增长尾空白。拖动其他普通列时，动态列从当前提交宽度渐进吸收变化，只有到达边界后才由前置普通列承接余量；可接受增量受目标列和补偿列总容量约束，已有填充槽余量只用于动态列扩宽。不会切换到相邻动态角色或自动拉回视口最大宽度；后续拖动继续沿用同一动态角色。动态自动填充或平衡时可超过 `maxWidth`，用户直接拖动目标仍遵守自身 min/max。已手动调整的普通列宽度在连续操作和视口变化后继续受到保护；外部宽度映射变化、重置或列结构变化会释放保护，等价的新 columns 数组不会意外清除它。`fillRemainingSpace={false}`、`elasticColumn={false}` 和 `scroll.x="max-content"` 均不填充、不补偿，按真实内容总宽保留用户主动留出的空间。精确内容短于视口时，fixed 列仍锚定到物理视口边缘，因此空白可能留在普通列与固定列之间；内容超出视口时 fixed 列同样锚定到滚动视口。普通列尾边界仍随被接受的指针增量移动。
- 预览线按真实起始边界与被接受增量计算，越界后停在约束边界，保留抓取偏移；不能跨越前列的最小边界。普通列的列尾拖动边缘和键盘左右方向随 LTR/RTL 镜像，fixed 列保留物理内侧边界；两者使用相同的边界与约束算法。无有效增量的指针或键盘操作不触发尺寸回调，也不把 CSS/百分比值改写成像素。`onColumnWidthsChange` 在提交时一次性给出余量再分配后的完整映射，主动拖动列的值保持不变；`onColumnResize` 仍只报告目标 key 和最终宽度。未调整的 fixed 百分比/CSS 宽度保持原值，未配置宽度的操作列不被数值冻结。最小宽度总和超过容器时，只在内容区域横向滚动。
- Table Demo 统一收敛为 `/TableShowcase` 一个页面：同页展示标准的 filter / toolbar-left-right / Table / footer / Pagination CRUD 结构、页面级 `ProTable` 和 `useQueryTable` 的可运行案例；Table、ProTable、PageFilter、PageFilterItem、查询示例和查询生命周期区域分别紧跟自己的属性/方法表，页面末尾保留完整索引。筛选、Tabs、PageFilter、PageToolbar 和 TableBox 全部使用本仓库公共组件，并额外展示单行、两行、超出两行三种筛选布局。ProTable 的默认工具顺序为紧凑设置（可选）、列设置、全屏；业务新增、导出、刷新由调用方通过 toolbar 插槽传入。列设置支持显示/隐藏，`fixed` 列只显示锁图标、不能隐藏或改变顺序，非 fixed 列只通过每行最前面的上移/下移按钮排序，隐藏后的普通列再次显示恢复隐藏前的位置。设置面板顺序与表格实际列顺序保持同步。表头标题、排序、筛选和列宽图标必须垂直居中；列宽拖动以当前实际表头宽度为起点，并在全局 pointermove/pointerup 中完成，不能因指针离开窄命中区而中断。Toolbar 与 Table/Pagination/footer 互不耦合；自定义 Toolbar `ButtonList` 默认显示图标和文本，默认表格操作/操作列显式使用 Button `onlyIcon`，其溢出下拉只显示文本。

### Table 余量分配 API

| 组件  | 属性               | TypeScript 类型   | 默认值                 | 可选值                | 效果                                                                                                                                                                                                    | 案例                                                                       |
| ----- | ------------------ | ----------------- | ---------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Table | fillRemainingSpace | `boolean`         | true                   | true、false           | true 使用稳定动态列：直接拖动由最近前置普通列反向补偿，任一列到达边界后停止，不新增尾部填充空白；其他列先由动态列渐进吸收，再由前置普通列承接余量。手柄位于逻辑尾边界。false 使用精确内容总宽且不补偿。 | `<Table columns={columns} dataSource={rows} fillRemainingSpace={false} />` |
| Table | dir                | `"ltr" \| "rtl"`  | `"ltr"`                | `ltr`、`rtl`          | 显式设置此 Table 的方向，默认固定 LTR；组件不读取 Runtime 或 ConfigProvider。RTL 镜像阅读起点对齐和普通列拖动边界，显式 `align="left" \| "right"` 仍是物理方向。                                        | `<Table dir="rtl" columns={columns} dataSource={rows} />`                  |
| Table | elasticColumn      | `string \| false` | 最后一个可见普通叶子列 | 普通叶子列 key、false | 指定稳定动态列；其他列调整先由它渐进吸收变化，达到边界后前置普通列承接余量；直接拖动它时与前置普通列成对调整，任一边界到达后停止。false 关闭动态填充和补偿。                                            | `<Table columns={columns} dataSource={rows} elasticColumn="updatedAt" />`  |

### ProTable 余量分配 API

| 组件     | 属性               | TypeScript 类型   | 默认值                 | 可选值                | 效果                                                                                                                                                                                    | 案例                                                                          |
| -------- | ------------------ | ----------------- | ---------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| ProTable | fillRemainingSpace | `boolean`         | true                   | true、false           | 透传 Table 的稳定动态列平衡逻辑；直接拖动动态列时由前置普通列等量反向补偿，任一列到达边界后停止，不新增尾部空白；其他列先由动态列渐进吸收，再由前置普通列补余。false 使用精确内容总宽。 | `<ProTable columns={columns} dataSource={rows} fillRemainingSpace={false} />` |
| ProTable | dir                | `"ltr" \| "rtl"`  | `"ltr"`                | `ltr`、`rtl`          | 显式设置 ProTable 外壳和内部 Table 的方向，默认固定 LTR；组件不读取 Runtime 或 ConfigProvider。RTL 镜像阅读起点对齐和普通列拖动边界。                                                   | `<ProTable dir="rtl" columns={columns} dataSource={rows} />`                  |
| ProTable | elasticColumn      | `string \| false` | 最后一个可见普通叶子列 | 普通叶子列 key、false | 透传 Table 的稳定动态列选择；其他列由动态列优先补偿；直接拖动它时与前置普通列成对调整，任一边界到达后停止。false 关闭动态填充和补偿。                                                   | `<ProTable columns={columns} dataSource={rows} elasticColumn="updatedAt" />`  |

## 6. 框架无关公共能力

- `@biugle/http`：兼容 ts-xhttp 的客户端创建、请求方法、默认参数、headers、query/body、取消、超时、重试、生命周期 Hook、上传进度、错误归一化、响应提取和实例销毁。优化只在明确修复隐藏 bug 或扩展时做，不能破坏旧调用。
- `@biugle/biu-i18n`：合法 locale 归一化、中文默认、英文资源、缺失回退、运行时切换和资源刷新；组件包、Form、Table 各自维护 `zh-CN.json`/`en-US.json`，调用方可用 `localeText` 覆写。

### 组件多语言约束

- 所有公共组件包统一使用中文原文作为 locale key，例如 `localeText={{ "列设置": "Columns" }}`；禁止 `localeKeys`、`Record<keyof ...>` 或 `cancel`/`columnSettings` 这类英文属性到中文文案的映射。
- 组件默认的可见文案、动态模板文案、按钮文本、占位符、`aria-label`、`title` 和 Tooltip 文案必须来自对应包的 `zh-CN.json`/`en-US.json`。不得在组件实现中直接写死用户可见文本；调用方显式传入的属性文案仍具有最高优先级。
- `locale` 按组件显式值、Provider/FormScope、包默认中文的顺序解析；`localeText` 按包默认资源、Provider 覆写、组件覆写合并。动态文案使用资源模板中的 `{text}`、`{count}`、`{index}` 占位符替换，不能拼接未翻译的固定文本。
- `@biugle/react-components`、`@biugle/react-form`、`@biugle/react-table` 各自维护独立资源，新增 API 或 Demo 文案必须同时更新中英文资源、类型、测试、Demo API 表和中英文文档。
- `@biugle/tanstack-query`：单包结构，root/core 为 framework-neutral；`@biugle/tanstack-query/react` 才导出 QueryClientProvider、`useQuery`、`useMutation` 等 React hooks。Demo 必须解释 key、queryFn、enabled、staleTime、invalidate、状态和错误处理。
- `@biugle/biu-store`：偏好、认证、菜单、会话四类 store 和标准 Zustand 写法；Demo 展示创建 store、选择器、持久化 scope、Tabs/菜单状态和 reset。
- `@biugle/logger`：原生 JS，支持禁止 console、检测 DevTools 后 debugger 策略、打开 console 回调、彩色 `log/info/warning/success/error/primary/default`、分组内容和节流。Watermark 可订阅检测回调，在启用水印时刷新而不高频轮询。
- `@biugle/render-code`：QRCode/Barcode 的 SVG、Canvas 和 `img` base64 降级，便于旧打印插件；原生 DOM API，不绑定 React/Vue。
- `@biugle/watermark`：原生 DOM/SVG，多行文本、颜色、透明度、旋转、间距、销毁/刷新；基座只消费包，不再复制水印实现。

## 7. 基座维护边界

- Sidebar、Topbar、Blank、Dashboard、Mobile、Custom、Tabs、Header、菜单配置、多级菜单、遮罩、响应式和主题只由 `@biugle/biu-preset` 维护。
- Topbar 目录浮层和嵌套菜单的行、Popover/Tooltip 包装层保持完整可用宽度；图标与箭头占固定槽位，Ellipsis 外层分配剩余空间，内部 label 填满该空间。Sidebar 的直接 flex label 宽度规则不复用到这种嵌套结构，避免 Topbar 标签被压到 0；长标题保持省略和完整 Tooltip，hover/active 不改变行宽。该修复只在 Preset Topbar 浮层边界维护，不覆盖基础 Menu 几何。
- 基座所有“文本超出省略并展示完整提示”的位置统一使用 Components 的 `Ellipsis`；固定说明使用 Components 的 `Tooltip`。菜单左侧竖栏、右侧菜单、Tabs、工具栏和最近使用均适用，不再按问题逐点补丁。
- 收藏、最近使用和搜索结果中的每个菜单条目都必须拆分为左侧文本按钮与右侧“新标签页打开”图标按钮：点击文本在当前页面打开，点击图标新开标签页打开；图标使用公共 `Tooltip` 和 `newTab` 图标，不能通过嵌套按钮实现。
- 基座不再维护独立 Tooltip、Ellipsis、Message、Modal、Drawer、Select、Table、Form 行为；只保留布局骨架、尺寸约束和适配器边界。
- 基座骨架、原有菜单交互、收起/展开逻辑、Tabs、响应式和页面布局不能因组件抽离而改变。Portal 与 APP 同级、独立启动、独立构建、独立部署；默认 iframe。
- 独立 APP 的布局壳由 CLI 按开发/构建模式生成：`layout.includeInDevelopment` 与 `layout.includeInBuild` 分开控制 Preset/Custom 和 CSS 导入；新标准 APP 模板默认开发有模拟壳、生产无壳，显式选择 `custom` 的 APP 默认保留自有布局，`biu init` 可逐项目选择。旧配置未填写时延续原来的双模式布局输出，Portal 始终保留布局；关闭 APP 布局不会移除 Runtime、路由、认证出口或错误边界。
- Sidebar 默认完整展开；展开状态的 28px 圆形控制按钮（14px 图标）在 60px Header 内居中，按 LTR/RTL 锚定侧栏与内容分界，用于收起为 60px 图标栏。收起状态仅在底部保留一个恢复按钮；完全隐藏时则在 `aside` 外保留顶部恢复按钮，避免 `aria-hidden/inert` 阻断恢复，Header 为按钮和相邻操作保留 8px 间隙。展开侧栏底部依次提供隐藏、菜单选项、收藏、最近使用和按配置启用的搜索；`lockSidebar` 禁用全部内置切换，页面的受控覆盖继续有效。面包屑左右内边距各 12px，Runtime 文档根保持 LTR，基座按显式配置应用方向。

### 7.1 非菜单页面的组件复用边界

- 默认认证页的账号、密码字段和登录/注册动作统一使用 `@biugle/react-components` 的 `TextField` 与 `Button`；认证状态、SSO 跳转和业务校验仍由 Runtime/Portal 负责。
- Runtime 的状态页、错误边界、错误详情复制和远程 APP 重试统一使用 Components 的 `Result`、`Alert`、`Button` 与 `biuMessage`。错误堆栈 `<pre>` 仍保留为专用只读日志区域，不把日志伪装成表单控件。
- Demo Portal 的登录、个人信息、修改密码和工作栏均使用公开 Components 控件；账户面板由 Portal 通过 `portalSlots.profilePanel`/`passwordPanel` 提供，基座不保存密码，也不替业务接口做假提交。
- 菜单树、页签右键菜单、侧栏/顶部导航工具按钮属于导航骨架，继续由 Preset 维护其尺寸、键盘和布局约束；远程 APP 内的业务页面、文件输入底层触发器和错误详情滚动区也不由基座强行替换。
- Portal A 与 Portal B 的自定义工具栏统一使用公开 Components 控件和同一份 `portalSlots.toolbarActions` 契约；顶部多级目录菜单的嵌套层级从右侧避障展开，门户 CSS 禁止重新实现原生输入框或按钮。
- `examples/dev-demo` 的 React 页面、独立 React APP 和 Custom Layout 中，所有可由公共组件表达的交互控件必须使用 `@biugle/react-components` 的公开入口；不得在页面 CSS 中重做 Button/TextField 等控件。原生文件输入触发器、只读 `pre`、语义 `form/label` 容器以及 Vue/HTML 跨框架适配示例的原生控件属于明确边界，可保留。每次 Demo 回归都要扫描这些边界并同步检查 Portal A/B、独立 APP、Custom Layout 和能力展示页。
- 因此“统一组件样式”不等于改变 Portal/APP 的业务契约：能由公共包完整表达的页面控件必须统一，认证协议、菜单布局和业务提交逻辑必须保留在原有边界。

## 8. Demo 作为文档

`PlatformCapabilities` 的标题、上下文说明、布局操作、Dialog/Drawer 与反馈全部使用 `useBiuI18n().$t("中文 key")`，中文/英文资源独立维护。操作反馈在状态中保存 message key，渲染时再翻译并传入菜单 key 参数，因此语言切换也会更新已发布事件或已确认 Dialog 的旧反馈。Portal、APP ID、Environment、组件入口名和协议值保留为不可翻译标识。

Demo 菜单使用真实能力名称：基座能力展示、组件能力展示、Form 能力展示、Table 能力展示、基础服务、系统配置等；Icons 支持搜索、分类、尽可能完整展示和点击复制名称。

组件能力页是唯一的组件文档入口：UI 与 Pro 不再拆成两个可见页面，组件案例、Pro 预设和每个组件自己的 API 表按同一顺序呈现。`ComponentProShowcase` 只保留兼容深链接，不产生第二份案例或 API 数据。表格第一列必须是单一真实组件名，不能出现 `Checkbox / Radio / Switch` 一类合并名称；属性、方法、类型、默认值、可选值/参数、准确说明和案例均逐项填写。

- 组件能力页：按组件类型和固定顺序逐块展示可操作案例；每个组件区域的案例下方必须紧跟只属于该区域的 UI Table，列出属性、方法、类型、默认值、说明和案例。页面末尾的完整表只作为总索引，不替代区域级 API 表。
- 旧 Pro 深链接：仅作为统一组件能力页的兼容别名，不再维护第二份 Demo、顺序或样式。
- API 表精度规则：一个公开属性或方法必须占一行，不能使用“a / b / c”把多个 API 合并成模糊的一行。每行固定包含组件/模块、单个属性或方法名、完整 TypeScript 类型、默认值、可选值或方法参数、准确效果说明和可运行案例；展示层不得因为历史数据曾经合并过属性就恢复合并行。API 表与 README/API 文档保持同一契约，任何公开类型变更必须同步 Demo、双语文档和测试。文档表只保留横向滚动，纵向滚动由页面统一承担，禁止每个属性表叠加独立滚动上下文。能力展示 API 表默认自动换行，未设置宽度的属性列由表格剩余空间分配并受最大宽度限制，单元格保留约 4px 水平内边距；只有显式使用 Ellipsis/省略配置的内容才保持单行省略。
- API 表禁止泛化兜底说明（例如“具体作用见公开类型”）。历史合并行展开后，每个属性/方法必须拥有自己的类型、默认值、可选值/参数、逐字段效果说明和对应案例；如果缺少专属元数据，必须先补充能力目录元数据，不能把原行说明原样复制到所有拆出的属性。
- ProTable 列设置的普通列只通过行首上移/下移按钮更新表格和设置面板；fixed 列不可隐藏、不可排序、不可改变顺序，只显示锁图标，不显示“锁”文字，面板不显示额外操作提示。普通列隐藏后再显示应恢复隐藏前的相对位置。
- IconsSearch 的图标和名称同一行左对齐，名称紧跟图标并可省略；搜索、分类、复制和尺寸/颜色案例均使用公开 Biu 组件。
- Form/Table 页面：按真实 CRUD 页面组合展示；Form 的 Form、ProForm、Form.Item、FormGroup、Form.Grid、Form.Section、Form.List、Actions/ErrorSummary，Table 的基础 Table、Column、筛选上下文、分页、选择、展开、ProTable、批量动作、useQueryTable 选项/返回值及查询生命周期等每个案例区域都必须有自己的 API 表，页面末尾可保留完整索引。
- HTTP、i18n、Query、Store、Logger、Render Code、Watermark：以能力说明、方法表、案例和结果展示为主，而非伪造 UI 组件卡片。HTTP 文档必须逐项记录 `XHttpOptions` 的每个字段、`RequestConfig` 的每个 XHttp 扩展字段，以及 `Header`、`HttpResponse`、`AxiosRetryConfig`、`HandlerFunction`、`ErrorHandlerFunction`、`ResultFunction`、`XHttpMethod` 等公开类型；每一行包含完整 TypeScript 类型、默认值、可选值/参数、准确效果说明和可运行案例，不能只记录 `XHttpClass` 方法或合并字段。
- Demo 所有新增中文文案必须同步英文资源或明确说明是 API 示例数据；所有按钮和关闭图标均可点击并可感知状态。

## 9. 本轮回归项

本轮已经纳入实现与验证：

1. DatePicker/RangeDatePicker 增加 `YYYY-MM-DD` 与 `YYYY-MM-DD HH:mm:ss` 案例；TimePicker/RangeTimePicker 增加 `HH:mm`、`HH:mm:ss` 案例。
2. RangeTimePicker 默认快捷项切换为“近一小时”“近一天”；范围面板两侧等宽，中间显示横杠，窄视口下不裁切右侧选择器。
3. Popover、Popconfirm 和 Dropdown 的 Radix 浮层外壳连续打开/关闭不改变 viewport 宽度，不闪出页面滚动条；外壳不再使用 `overflow-y: auto`，长菜单只在内部列表区滚动，避免首次碰撞测量时短暂出现滚动条。
4. Message 增加简约单行、简约多行、复杂单行、复杂多行四类 Demo；复杂模式实际使用语义底色，正文与关闭按钮固定为独立网格列。
5. Alert action 与 close 独立列，关闭按钮右侧垂直居中，支持多行内容。
6. Steps 数字、文本和连接线垂直居中。
7. Primary 改为蓝色，Warning/Success 提亮并统一语义变量；所有 Button type 都有 hover/focus/active/pressed 反馈。
8. PageFilter label 浮在唯一字段边框左上角；外层不再创建独立边框，TextField、Select、DatePicker 等子控件保留自己的边框、背景、默认高度和 focus ring，避免尺寸漂移与双重边框。
9. RangeDatePicker/RangeTimePicker 的连接符使用独立居中 glyph box；FileItem 的图标、文件多行信息和操作区按行中心对齐；连续 Demo 操作区之间保持统一垂直间距。
10. Switch 固定轨道尺寸，thumb 为圆形且不会被表单宽度规则拉伸，轨道内部无文字。
11. Textarea 由组件内部受限角落命中区管理真实宽高调整，右下角保留小型拖拽标识，禁止浏览器第二套原生 resize；拖动必须同时改变组件 frame 与 textarea，不能越出父容器，支持 both/horizontal/vertical/none。
12. 基座 Tooltip trigger 改为有尺寸的 inline-flex，底部工具栏 Tooltip 通过 Radix 正确向上避障，箭头居中。
13. 基座收藏、最近使用、菜单设置等底部浮层移除会破坏 Radix 测量的 `position: fixed` 内层样式，改由 Radix wrapper 负责 fixed/collision，浮层在窄视口内保持可见。
14. Drawer Demo 使用默认 footer，统一显示带间距和内边距的“取消/确定”按钮；统一组件 Demo 页补充 API 属性/方法表。
15. RangeTimePicker 面板连接符按两侧实际 30px Select 控件行对齐，不再按包含小时/分钟/秒 label 的整块区域居中；浏览器实测连接符与左右选择器中心线偏差为 0px。
16. 基座菜单工具栏的 Popover 外壳始终不承担滚动；收藏/最近使用的记录列表与搜索结果分别是唯一的内部滚动区域，并使用 Radix 提供的可用高度。内容未超出时按自然高度完整展示，内容超出时只出现一条内部纵向滚动条，同时显式隐藏横向滚动，避免嵌套滚动条。
17. 菜单、筛选、表格设置和表单对齐按同一回归规则执行：组件 Menu 默认保留至少 12px 左侧间距并通过 submenu 表达层级，基座壳层可单独使用紧凑覆盖且最多五层；PageFilter 操作区是同级 item，最多两行放不下字段才出现“更多”；列设置的 fixed 行锁定显示与顺序，普通行只通过行首上移/下移按钮排序，隐藏后恢复原位，列宽拖动离开手柄后仍持续到 pointerup；Boolean controls 和文案共享中心线，按钮/能力卡片保留统一间距。

## 10. 验证与交付门禁

每次交付必须同步执行：

```bash
pnpm verify
```

完整门禁统一执行公共包/Demo 类型检查、18 包打包与仓库外 CLI 消费、公共包与发布来源回归、Lint、格式、Knip、生产依赖审计、100 组 CLI 创建、7 种 preset/环境、六个 Demo 构建、源码/包体预算和 `git diff --check`。开发阶段可按需要运行局部命令，交付以完整门禁为准。

浏览器验收至少覆盖：

- Sidebar 展开/收起、左侧长标题 Ellipsis、底部工具 Tooltip、Tabs 溢出箭头。
- 统一组件能力页、组件 API 表、FormGroup、PageFilter、Table fixed 列和筛选区。
- Button 七种 type、三种 variant、hover/focus/active/click。
- Select 多选 tag/+N/下拉选项 Tooltip、搜索 sticky、全部/全选。
- Date/Time 单值与范围、格式、快捷项、语言切换、避障。
- Dialog/Drawer/Popover/Popconfirm Portal、尺寸、关闭、滚动条和层级。
- Message/Alert 多行、复杂底色、action/close 不重叠。
- Textarea 宽高拖拽、Switch 尺寸、Tree/Transfer 搜索和长文本。
- HTTP、i18n、Query、Store、Logger、Render Code、Watermark 方法 Demo。

验收前先停止服务，再清理旧 `.biu/`、`dist/`、coverage、缓存、日志和临时验收截图；README 使用的脱敏页面截图作为文档资源保留；`.biu/foundation` 由 CLI 在启动时生成，不提交。完整回归结果与待办记录在 [`docs/final-delivery-review.md`](final-delivery-review.md)。

### 4.6 基础展示能力补充

`Typography/Title/Paragraph` 负责文本语义和排版，Typography 支持 `primary/success/warning/error/default` 语义色；`Space` 负责统一间距，`List` 负责数据列表，`ColorPicker` 提供当前颜色、预设颜色和受控值，`ContextMenu` 提供内容区域右键菜单；`Timeline` 负责时间节点并支持纵向/横向排列，`Spin` 负责独立或容器覆盖加载，`Image` 支持尺寸约束、懒加载、失败降级和点击预览，`Notification` 提供按阅读方向定位的通知 API（LTR 右上角、RTL 左上角），图标、内容和关闭按钮使用统一垂直对齐规则，`Affix` 提供滚动固定，`ResizeBox` 提供受边界约束的容器调整尺寸。`Box` 支持 `css`、`sx` CSS-in-JS 样式对象、数组和函数形式，合并顺序为 `css < sx < style`。`ConfigProvider` 是组件树的全局配置入口，统一提供 `locale`、`localeText`、`theme` 和 `direction`，`ComponentsProvider` 仅作为兼容别名保留。上传文件缩略图、文件状态和文件预览仍由 `Upload/FileList/FilePreview` 负责，不复制第二套上传模型。

### 4.7 受控值未知项保留规则

Select、Cascader、Transfer 等选择组件不得静默丢弃调用方或后端传入但当前选项源暂时没有的值。Select 单值直接回显原值，多值以可移除但禁选择的标签保留；Cascader 保留未知路径段并回显；Transfer 将 source 中不存在的 target 项置于右侧列表顶部，禁用勾选但保留独立删除操作。用户通过组件交互产生的非法选择仍必须按 disabled、选项源和 oneWay 规则限制。

### 10.1 2026-09-28 浏览器回归记录

本轮重启 9002 后按菜单能力逐页检查了以下页面：

| 页面范围                 | 结果 | 证据                                                                                                                                                                                       |
| ------------------------ | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 组件能力                 | PASS | `/ComponentUIShowcase` 正常渲染固定顺序的组件章节和 52 张区域 API 表；Button 点击计数、Textarea 双向拖动均实际操作通过。                                                                   |
| Form / Table             | PASS | `/FormShowcase`、`/TableShowcase` 正常渲染，分别包含 7 张、19 张 API 表及可运行案例。                                                                                                      |
| 基座 / Overlay / Tooltip | PASS | `/FoundationShowcase`、`/PlatformCapabilities`、`/RuntimeCapabilities`、`/RouterMenuShowcase`、`/OverlayShowcase`、`/TooltipEllipsisShowcase` 均正常加载。                                 |
| Icons / 服务能力         | PASS | `/IconsSearch`、`/HttpShowcase`、`/I18nShowcase`、`/TanstackQueryShowcase`、`/StoreShowcase`、`/RenderCodeShowcase`、`/WatermarkShowcase`、`/LoggerShowcase` 均正常加载并有案例与 API 表。 |
| 完整层级导航             | PASS | Dashboard 必须使用 `/SystemConfig/SystemAdvanced/Dashboard` 完整菜单路径；Foundation、Platform 和 Router Demo 已改为使用完整 menu key/唯一 Code，避免重复 `Dashboard` Code 造成假导航。    |

### 10.2 2026-09-29 最终回归与交付状态

- `TableColumnSettings` 增加完整顺序状态：普通列上移/下移后再隐藏/恢复，仍回到调整后的相对位置；fixed 列继续保持锁图标、不可隐藏、不可排序和边界位置。新增回归用例后，React Table 22 项测试全部通过。
- `pnpm check`、全量公共包构建、`pnpm build:demo:all`、ESLint、Prettier、Knip 和各公共包直接测试均通过；本轮直接运行的测试合计 190 项通过。
- 历史记录：2026-09-29 的执行环境曾禁止 Node/Rsbuild 监听本地端口，并限制 `tsx` 创建 IPC 管道（`EPERM`），因此当时未完成 9001/9002 的进程级重跑；这不代表源码断言失败。本轮已在允许本地监听的环境完成清理、重建、启动和浏览器验收。
- 本轮清理后已重新生成基础包 `dist/`、各 Demo `dist/` 与 `.biu/foundation` 快照；这些产物只用于本地验收，仍不得提交。

### 10.3 文档归档与产物生命周期

- 本轮标准 Table Demo 使用 110 条脱敏模拟记录，默认每页 20 条；`Table.height` 用于配置表体滚动视口，分页器独立固定在表格内容区底部。筛选区无外层边框并保留上下 10px 间距，筛选、Toolbar 和操作列按钮统一使用 8px 间距，操作列保留左右 10px 内边距。

- `docs/biu-foundation-components-capabilities.md` 与 `docs/en/biu-foundation-components-capabilities.md` 是唯一的综合规范和回归归档文件；`docs/README.md`、`docs/README.en.md` 只索引它们和按包维护的 API/使用手册。
- `docs/http.md`、`docs/logger.md`、`docs/render-code.md`、`docs/watermark.md`、`docs/package-graph.md` 等是公共包使用手册或架构资料，不是第二套 Spec；其 API 变化必须同步本综合文件。
- 不保留 `docs/specs/`、`docs/en/specs/` 或同义的阶段性 Spec 目录。新增范围先更新本文并在需要时由用户确认，再修改源码。
- `dist/` 和 `.biu/` 是运行所需的本地生成物，不进入 Git。清理时必须先停止服务，再清理旧产物，重新执行基础包构建和 Demo 启动生成快照；服务运行期间不得删除它们，否则 CLI 或页面会出现模块/快照缺失。
- 交付前必须检查 `git diff --check`、失效文档链接、`git status --short` 和生成物范围；不能 reset、checkout 或覆盖用户已有修改。

### 10.4 2026-10-17 当前浏览器验收记录

- 已清理旧服务和旧 `dist/`、`.biu/` 产物，重新构建基础包并启动 9001 Demo；运行时生成的 `dist/` 与 `.biu/foundation` 仅用于本地验收，不提交。
- 已逐页检查 `ComponentUIShowcase`、`FormShowcase`、`StandardTablePageShowcase`、`StandardTableTabsShowcase`、`EditableTablePageShowcase`、`TableShowcase` 和 `TableResizeShowcase`：组件章节、API 表、中文默认文案、筛选、更多筛选 Drawer、分页、操作列、编辑表格和尺寸调整案例均正常渲染。
- EditableTable 已实际验证文本编辑的输入、清空不失焦、失焦保存、取消不保存、显式保存、ESC 退出，以及下拉单元格选择和保存；标准 Table 已验证 20 条/页、110 条数据、筛选/重置、更多筛选内控件同步和横向滚动。
- 本轮浏览器回归未发现应用控制台错误；旧标签页自动化输入接口触发的浏览器崩溃页属于验收工具自身页面，不是 Demo 应用异常，已新建标签页继续完成回归。
- `TableResizeShowcase` 同时提供最小/最大列宽边界和仅行高调整的独立案例，便于单独验证每种拖动能力。

### 10.5 安装消费与边界可靠性

- CLI 在源码工作区使用本地构建包，仓库外使用项目已安装的公开包建立相同的 `.biu/foundation` 快照。先检查所有必需产物，再替换快照；共享构建完成后，每个等待项目都生成自己的快照。模板依赖版本在 CLI 构建时从公共包 manifest 内联，Changesets 更新版本后重新构建即可同步，发布后的 CLI 不读取源码目录。
- CLI 明确传入但缺值的参数必须报错；`--filter=value` 不丢失转发参数；协调 `--apps` 时先验证全部项目，再启动进程，启动失败清理已创建的 APP 进程。CLI 与 Router 菜单请求的超时覆盖响应头及 JSON 响应体读取。
- 偏好缓存只用明确存在的字段覆盖配置，覆盖前归一化；没有缓存的字段保持配置。写入 sessionStorage 只保存 locale/theme/direction/timezone，不连带持久化认证状态。
- Events 的旧退订只操作原订阅集合，不能删除 `clear()` 后的新订阅；订阅异常和 `onError` 自身同步异常都不阻断后续订阅。Runtime 的并发更新检查最多提示一次，迟到初始化成功/失败不能抹掉已建立的基线；语言切换保留检查器和基线并使用当前语言提示，卸载、关闭检查或切换 manifest URL 后禁止旧响应提示。HTTP、Query 与 Table 查询层的循环数组使用既有循环标记，保留非循环数据的稳定序列化；HTTP 的 FormData、Blob、ArrayBuffer 和其视图上传另以 client 内对象 identity 区分重复请求，内部 Key 不遍历二进制字节，公开序列化输出不变。Query 与 Table 查询层均先验证列表数组，异常列表归一为空数组并保留有效 total 或回退 0；React 模板显式安装 Query React peer，Query core 继续不绑定 React。开发 manifest 在 SPA fallback 前返回无缓存 JSON。
- `pnpm verify:cli-install` 使用实际打包文件在仓库外安装、创建、构建和启动代表项目，补足仓库内 100 组创建场景。实现细节、最终执行结果与优化待办统一记录在[最终交付审计](final-delivery-review.md)。

### 10.6 2026-10-29 Topbar 标签与页面国际化回归

- Topbar 目录菜单使用完整行宽：实际浏览器测量按钮约 208px、label 约 142px，深层叶子 label 约 155–176px；这些是本地验收尺寸，不是固定组件 API 值。嵌套包装层不再把文字压到 0，省略和 Tooltip 保持工作。
- `PlatformCapabilities` 已实际验证 en-US/zh-CN 切换、卡片/按钮/弹层翻译和动态操作反馈重译。README 五张 JPG 来自当前本地 Demo；完整执行结果和生产待办由[最终交付审计](final-delivery-review.md)记录。

### 10.7 2026-10-29 模块边界与零豁免拆分

- 核心包只依赖公共入口，Preset 的语言、路由和状态 API 直接来自 I18n/Router/Store；Runtime 保留运行编排、上下文和兼容出口。`pnpm verify:boundaries` 用 TypeScript AST 检查 18 个公共包、6 个 Demo 和 Demo 共享包的导入、exports 与依赖声明、跨项目相对导入、Components/Table 的 UI→Pro 反向依赖、包及源码循环（包括类型导入）。File/Preview 的共用类型移到 UI File 的独立类型模块，解除内部循环，公开类型导出不变。
- `auth-store` 是认证身份的唯一来源，`preference-store.auth` 仅为兼容投影；旧 `setAuth`、`initialize({ auth })` 和 bound store 的 partial/updater/replace 写法转交认证来源，身份不写入偏好缓存。Runtime 与 `useBiuAuth` 直接订阅认证来源，更新/退出保持同步。
- Runtime 加载业务 `localeUrl` 时以基座内置资源为底、业务 key 优先，公开 `i18n.addLocale` 仍保留替换语义。`useBiuI18n` 订阅稳定的资源快照，当前或回退资源变化时更新 `$t`，让同语言异步加载与 `reloadLocale` 触发 memo 文案重译，资源更新不重新触发 locale 请求循环。
- 四个大 Demo 页面按组件族/场景/单组件 API metadata 拆分，保留原有路由、场景顺序和交互；Form 原本未展示的七项布局 API 补为独立表。四个大测试文件按行为族拆分，共用 fixture，保留每个原用例。业务 mock 留在所属页面；子 APP、Topbar Demo、Form/Table 的默认值和动态反馈补齐独立中英文资源。
- 全仓库 JS/JSX/MJS/TS/TSX/CSS 文件统一不超过 800 行，删除历史 baseline，无例外。大 CSS 按样式职责拆分；Table 根样式只按原顺序导入 UI/Pro 样式，打包后仍提供同一个 CSS 入口；Preset 复用约定的样式文件。移除 123 条被后续规则覆盖的旧声明和全部 13 处 `!important`，宿主浮层、错误边界、Tab 按钮用明确作用域维持层叠。
- CI 的根 `prepare` 跳过重复的公共包构建和提交钩子安装，依赖自身安装脚本仍启用；本地安装保留原体验。CLI 场景去掉被真实 tarball 安装门禁替代的旧软链接夹具，保留 100 组输入、7 种 preset 和五环境覆盖。最终门禁、评分、清理和浏览器结果统一见[交付审计](final-delivery-review.md)。

### 10.8 浏览器补充修复与数据边界

- `LocalizedDemoTree` 只递归翻译普通对象的文案属性；Dayjs、Date、File 等实例保持原型与身份。日期范围默认值不能被复制为普通对象，否则 DatePicker 的 `startOf` 等方法失效。真实浏览器已复现该错误，旧实现负例和修复后日期范围/嵌套选项回归保留在 Demo 测试中。
- Form Demo 的独立控件通过 `ConfigProvider locale={locale}` 继承当前语言；ProForm 的表单文案语言不替代控件 Provider。组件章节、案例和 API 可见文案补齐英文资源，分页/查看/移除/动态序号用完整中文插值 key。菜单和已打开页签由当前资源即时重译，身份、地理 mock、日期、Code 和类型保持示例值。
- 收起的 60px 导航栏只保留底部恢复按钮，展开状态保留原有设置/隐藏操作；菜单完全隐藏时在导航外保留顶部恢复按钮，避免 `inert` 阻止恢复。Portal 与 React/Vue/HTML APP 共用 LayoutFrame 和同一状态变更入口，RTL 同步；公开布局参数不变。
- Vue/HTML Demo 各自通过 `localeUrl` 加载独立中英文资源。Vue 页面用项目级组合函数订阅公共 I18n；HTML 项目 Adapter 复用公共 `htmlAdapter`，只翻译显式 `data-biu-locale` 叶节点。语言与资源刷新都会更新正文，卸载时清理订阅；不向 Runtime 添加 Demo 文案或第二套布局。
- CLI 为 HTML 项目优先使用显式 `adapter`，未配置时继续使用内置 `htmlAdapter`；开发与生产入口均覆盖回归。Runtime 的文档标题在异步资源加载和同语言重载后同步重新翻译，不追加语言请求。
- 通知的 `title/description/time` 是通知接口返回的业务数据，基座原样展示；`src/mock/notifications.ts` 的两条中文通知是此数据契约的脱敏样例，属于明确文案例外。生产通知服务应按目标语言返回正文。英文长标题用例用于验证省略与多层导航边界，保留示例字符串；它们不进入语言资源作为英文 key。
