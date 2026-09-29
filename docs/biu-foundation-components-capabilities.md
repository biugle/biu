# Biu 基座、组件与公共能力最终说明

> 状态：已确认实施并作为后续维护、回归、文档和交付的唯一规范入口。更新日期：2026-09-29。

本文件收敛组件库、基座、Demo、公共包和历次回归中形成的设计、功能、兼容性、文档与交付规则。原 `docs/specs/` 与 `docs/en/specs/` 下的分阶段 Spec 已全部并入本文及英文对应文件并移除；后续实现、修复、验收和 Agent 交接只以本文、英文对应文件和各公共包 API/使用手册为准，不再新建或维护第二套 Spec 目录。

## 1. 目标与参考边界

### 1.1 目标

- 基座只负责 Portal/APP 的布局骨架、路由菜单、状态编排、生命周期和响应式约束。
- `@biugle/react-components` 提供可直接使用的 UI 结构组件、Pro 页面预设、Overlay、Message、Fire 和公共交互行为。
- `@biugle/react-form` 提供标准表单状态、校验、`Form.Item`、`Form.Group`/`FormGroup` 和布局组合。
- `@biugle/react-table` 提供 UI Table、ProTable 和 `useQueryTable`，不复制请求客户端。
- `@biugle/http` 保持 `/Users/bexhe/WorkSpace/ts-xhttp/` 的兼容基线；扩展只能向后兼容。
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
- `@biugle/react-components` 的 Menu 默认保留至少 12px 左侧内容间距，并通过 submenu 偏移表达层级；Preset Sidebar/Topbar 可以在宿主边界使用更紧凑的导航覆盖。UI Menu、Preset Sidebar/Topbar 和移动菜单最多渲染五层，第五层之后的子节点全部忽略。
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

组件能力页只有一个入口；所有组件类型按固定顺序各自独占一个标题块，并在同一页同时展示可运行效果和紧跟其后的专属 API 属性/方法表。页面末尾的完整表只作索引。原 Pro 深链接保留为统一页面兼容别名，菜单不再拆分 UI/Pro 两页；企业场景能力在同一顺序的案例中呈现。

### 4.1 基础输入

- `Button/ButtonGroup`：`primary/warning/error/success/secondary/dark/default`，`contained/text/outlined`，icon 前/后/中、`onlyIcon` 独立图标按钮、`tooltip` 文案覆盖、loading、iconSize、disabled、block、shape、readonly、className、classNames、点击反馈和整体 gap。`onlyIcon` 由 Button 自己负责方形尺寸、图标居中、移除文字节点和 Tooltip，调用方不再添加独立 icon 按钮样式。
- `TextField/Textarea`：固定默认宽度，不随输入内容增长；支持 `onChange`、`onInput`、`allowClear`、`showCount`、`maxLength`、`addonBefore/After`、`size`、`inputProps`、autocomplete、错误态和宽度覆盖。
- `Textarea` 默认 `resize="both"`，由组件自己的受限角落命中区同时更新外层 frame 与 textarea 的宽高；右下角显示小型拖拽标识，不启用浏览器第二套原生句柄，支持 `horizontal/vertical/none`，`w-full` 可通过 `className` 覆盖且不能把组件拖出父容器。
- `InputNumber`：`decimal` 取代不易读的 precision，同时保留兼容别名；支持滚轮、范围、formatter/parser、stringMode，左右按钮尺寸充足并有 focus ring。
- `Checkbox/Radio/Switch`：受控/非受控、表单联动、禁用、只读、分组和自定义渲染。Switch 轨道不渲染文字，不被 Form.Item 的 `width:100%` 拉伸，白色 thumb 始终为圆形。

### 4.2 选择与日期时间

- `Select`：单选/多选、`hasAllOption`、`allowAllSelect`、三参数 `onChange(value, option, index)`、option/label/tag render、`maxTagCount`、`maxCount`、搜索 sticky 区、header/footer、懒加载和自定义下拉内容。
- `Select`：除上述行为外支持 `size="small" | "medium" | "large"`，用于和 PageFilter、Toolbar 的 TextField/Button 保持同一高度。
- 多选 tag、`+N` 汇总 tag 和下拉选项默认使用 Ellipsis；悬停每个 tag 显示完整内容，`+N` 显示剩余全部值。
- `Cascader`：列式级联、路径受控、禁用、`changeOnSelect`、optionRender/displayRender、Popover 避障。
- `DatePicker/RangeDatePicker`：手搓日历，支持 `YYYY-MM-DD`、`YYYY-MM-DD HH:mm:ss` 和可读格式 `yyyy-mm-dd hh:ii:ss`，dayjs、范围、preset、disabledDate、disabledTime、needConfirm、showNow、footer、12/24 小时制、中文/英文和文案覆写。单值日期默认快捷项为“今天/明天/昨天”，日期范围默认“近一周/近一月”，均可通过 `presets` 覆盖；范围面板直接连续选择开始和结束日期，不再渲染额外的起止切换器，用户反向选择时自动规范为前后顺序；确认会提交并关闭面板。
- `TimePicker/RangeTimePicker`：自定义 Select 时间面板，不使用原生 time input；支持 `HH:mm`、`HH:mm:ss`、范围横杠、两侧等宽、`disabledTime`、12/24 小时、确认和快捷预设。范围时间默认快捷项为“近一小时”“近一天”，日期范围默认“近一周”“近一月”；范围任一侧先调整时，另一侧会保留已有值或填入该下拉列当前显示的默认值；窄视口下主区可收缩，右侧时分秒不会溢出。
- Range trigger 和 Range panel 都使用三列布局：左值、居中 `—`、右值，值区可收缩并 Ellipsis。

### 4.3 Overlay 与导航

- `Dialog/Drawer`：受控 `open/onOpenChange`、position/placement、offsetTop/offsetLeft、fullscreen、destroyOnClose、尺寸、遮罩、ESC、Portal、焦点和 classNames。
- Pro 只保留 `Confirm` 快捷入口 `fireConfirm`；复杂内容由用户组合 Dialog/Modal，不维护重复 Modal 层。
- `Tooltip`：默认允许展示，`onlyOverflow` 默认 false，自动避障、箭头居中、collision padding、placement、颜色和 maxWidth。`Ellipsis` 默认只在真实溢出时显示 Tooltip，`alwaysTooltip` 可强制打开；基座多标签页等需要始终提示的地方显式使用 true。
- `Popover/Popconfirm`：disabled、受控、尺寸、方向、异步确认、描述、操作区和自定义 classNames；Popconfirm 的打开过程不得产生页面滚动条。
- `DropdownMenu`：label、separator、icon、shortcut、checkbox、radio、submenu、头尾插槽、自定义内容和内容溢出保护。
- `Tabs`：line/card/tag、水平/垂直、关闭/新增、仅溢出显示箭头、前后箭头、可选不显示箭头、滚动定位和中英文长度变化自适应。
- `Menu/Breadcrumb`：目录层级、openKeys、collapsed、选中、快捷导航、Ellipsis、图标和基座侧栏行为；普通菜单无图标，目录图标只来自配置，不通过标题猜测。

### 4.4 数据展示与文件

- `Pagination`：页大小选择、quick jumper、showTotal、itemRender、responsive、simple、hideOnSinglePage、showLessItems 和完整页码布局。
- `Tree`：搜索、展开、选择/多选、checkable、半选、禁用、异步加载、层级引导线、目录/文件图标、Ellipsis 和性能边界。
- `Transfer`：双栏、搜索、全选、禁用、标题、统计、长文本 Ellipsis、批量移动和受控 target。
- `Alert/Empty/Loading/Progress/Tag/Badge/Steps`：标准语义色、可替换 icon、关闭、action、空态、加载、进度、轻量状态和步骤流程。Alert 与 Message 都提供多行案例，关闭按钮独占最右侧并垂直居中；Steps 数字与文本垂直居中。
- `Upload/FilePreview/FileCard/FileRender`：拖拽/选择、accept、大小校验、multiple、进度、取消、重试、移除、下载、图片/PDF/Markdown 预览、文件大小和状态展示；文件项的图标、文件名与实际存在的元信息垂直居中，无元信息时不保留空行。
- `Box/Grid/Stack/Card/Divider/Collapsible`：纯布局原语，不带业务假设；Divider 必须实际绘制分隔线。

### 4.5 内容导航与滚动反馈

- `Anchor`：扫描传入 `container` 或默认 document 中的 `h1`–`h5`，通过 `levels`/`selector` 限定范围；为无 `id` 标题生成稳定 id，按标题层级缩进，使用 `scrollContainer` 监听当前标题，点击时按 `offsetTop` 平滑定位，并提供 `collapsible`、`collapsibleLevels`、受控折叠 keys、`mode="fixed" | "static"`、`position="left" | "right"`、`hideOnMobile`、`onChange`、`maxItems`、`className` 和 slot `classNames`。`collapsible` 同时提供目录总开关和节点开关，默认允许一级、二级标题独立折叠；fixed 默认贴近右侧视窗边缘，顶部位置稳定，高度上限为监听容器可视高度的 80%，使用单条左侧连接线表达目录层级，不渲染圆点，目录列表内部滚动，static 模式作为普通元素交给调用方布局，小屏默认逻辑级不渲染。
- `ScrollProgress`：默认监听 window，也支持 HTMLElement、ref 和 selector；按 `scrollTop / (scrollHeight - clientHeight)` 展示百分比和进度条，超过 `backTopThreshold` 显示小型回顶按钮，支持 `showPercentage`、`showBackTop`、`behavior`、`mode="fixed" | "static"`、四角 `position`、`draggable`、`onBackTop`、中文/英文 locale 和区域 classNames。fixed 适合页面级阅读反馈，开启 `draggable` 后可在视窗范围内移动；static 适合组件卡片或自定义容器内嵌展示且不响应拖动。两个组件都必须清理 scroll/resize/observer，不能造成重复监听或页面卡顿。

## 5. Pro、Form 与 Table

### 5.0 菜单命名约束

所有公开菜单节点的 `code`、菜单 `path` 的每个段以及对应的本地页面目录必须使用首字母大写的驼峰命名（例如 `ComponentUIShowcase`、`/SystemConfig/UserManagement`）。禁止新增短横线、下划线或全小写的菜单路径；菜单最多渲染五层，第五层之后的子节点全部忽略；`appId`、域名、locale 等非菜单身份字段不受此规则影响。

### 5.1 Pro 预设能力

- `PageBox`：页面标题、描述、actions、loading、empty、footer 和稳定页面间距。
- `PageFilter/PageFilterItem`：筛选字段、操作区和高级字段 Drawer。`PageFilterItem` 的 label 必须以白底浮在唯一控件边框左上角；控件本身是正常 Select/TextField，不额外套第二层框，直接子控件自动追加 `w-full` 并占满当前 Grid item，同时保留调用方的 `className`。主区域根据容器宽度以约 220px 最小轨道自适应列数，item 填满各自轨道，最多两行；操作区永远作为同级 Grid item 位于当前行最后一格且不附加额外内边距，若上一行刚好填满则位于下一行最右侧并垂直居中。Drawer 内固定两列，小屏一列；更多筛选使用 secondary outlined，重置使用 secondary contained，查询使用 dark contained，三者保持 small、同宽并通过公共 Ellipsis/Tooltip 处理长文案；`maxRows` 可调整行数，`autoCollapse` 默认自动把超出字段收敛到更宽的 `large` Drawer。
- `Form.Item.tooltip`、`PageFilterItem.tooltip` 和 `Table.Column.tooltip`：每个属性都接收 `ReactNode`；前两者在 label 后、表头列名后分别渲染公共 Tooltip 问号按钮，图标与文本垂直居中，不改变控件/列的尺寸，也不创建第二层边框。
- `CopyText`：以 `Ellipsis` 展示文本并在末尾提供复制按钮。`text` 是准确复制值，`content` 只改变展示内容；`lines`、`maxWidth`、`alwaysTooltip` 控制省略；`copyOnHover` 默认 `false`，开启后按钮只在 hover/focus 显示；`copyLabel`、`copiedLabel`、`onCopy`、`classNames` 分别控制提示文案、成功文案、回调和区域样式。复制优先使用 Clipboard API，失败时使用临时 textarea + `document.execCommand("copy")` 降级，适配旧浏览器和打印 WebView。
- `Detail`：配置驱动的只读详情展示组件，使用 `data` + `sections` 渲染分组栅格。`DetailSection` 支持 `title`、`icon`、`items`、`columns`、`bordered`；`DetailItem` 支持点路径 `key/dataIndex`、`render`、`span`、`tooltip`、`ellipsis`、`className` 和 `classNames`。空值统一展示 `-`，长值复用公共 Ellipsis，默认四列并在窄屏收敛为两列/一列。
- `PageToolbar/PageTableBox`：用于标准 Table CRUD 页的工具区和内容区组合，基座不复制一套业务表格样式。
- `Result`：success/error/info/warning/empty 状态和 action。
- `Message/Fire/fireConfirm`：Message 为全局能力；默认简约样式，`complex:true` 使用完整语义底色；多行正文、action 和关闭按钮拥有独立区域，`draggable` 开启后可在视窗范围内移动 fixed 消息；窄视口下 Alert 的 action 自动换到内容下方；Fire 负责 body 挂载和销毁；确认入口只保留 `fireConfirm`。

### 5.2 React Form

`@biugle/react-form` 以 `react-hook-form` 为状态基线：

- `Form` 负责 submit、invalid、disabled、readOnly、vertical/horizontal、columns、labelWidth、locale。
- `Form.Item` 负责 name、label、required、rules、help、extra、tooltip、dependencies、shouldUpdate、preserve 和 render props。
- `Form.Grid` 负责栅格列和 gap；`Form.List` 支持一行多个异构控件列、增删、上移/下移、可选拖动排序和 `showSort`，`minRows`/`maxRows` 的范围为 `0..99999`，行数据和排序由组件内部维护并可受控接入。每个 `columns[]` 可独立配置 `tooltip?: React.ReactNode`，在对应表头后显示垂直居中的问号 Tooltip。表头和行复用同一份 grid track，排序序号默认隐藏，开启时与拖动/上下移共用排序列，操作列固定在右侧并使用 secondary 小按钮。
- `Form.Group`/`FormGroup` 是带标题和样式的 Grid 区域，支持 `title`、`icon`、`description`、`columns`、`gap`、`bordered`、根和 header/title/body classNames；Form.Item 内的控件默认占满当前 grid track。
- Demo 必须将 Form.Item、Form.Group、Grid 与 TextField、Select、DatePicker、TimePicker、Checkbox、Radio、Switch、InputNumber 组合使用，并展示校验、联动、数组字段和提交结果。

### 5.3 React Table

- UI Table 负责列定义、多级表头、render、sorter、filters、filterDropdown、selection、expand、fixed/sticky、ellipsis、resizable、summary、virtual scroll 和 pagination。叶子列默认支持列宽调整，`resizable: false` 可关闭；`width` 支持数字像素值或 CSS 宽度字符串。多级表头只通过叶子列调整，表头、单元格和横向滚动轨道共享叶子列宽度，`minWidth` 负责最小值约束。
- ProTable/`useQueryTable` 负责 PageBox、PageFilter、PageToolbar、TableBox、请求状态、分页和 query 约定，不改变 UI Table 的基础渲染契约；新增、导出、刷新等业务按钮全部由页面通过 toolbar 插槽传入，ProTable 只提供密度、列设置和全屏三个结构工具；`PageFilter` 的高级 Drawer 默认包含主筛选区全部 `PageFilterItem` 与 `moreFields`，两处必须共用受控状态。
- fixed 列必须有不透底的背景和正确的 z-index/阴影；滚动区域、筛选区、空态、分页和长文本都不得退化为原生浏览器样式。
- Table Demo 统一收敛为 `/TableShowcase` 一个页面：同页展示标准的 filter / toolbar-left-right / Table / footer / Pagination CRUD 结构、页面级 `ProTable` 和 `useQueryTable` 的可运行案例；Table、ProTable、PageFilter、PageFilterItem、查询示例和查询生命周期区域分别紧跟自己的属性/方法表，页面末尾保留完整索引。筛选、Tabs、PageFilter、PageToolbar 和 TableBox 全部使用本仓库公共组件，并额外展示单行、两行、超出两行三种筛选布局。ProTable 的默认工具顺序为紧凑设置（可选）、列设置、全屏；业务新增、导出、刷新由调用方通过 toolbar 插槽传入。列设置支持显示/隐藏，`fixed` 列只显示锁图标、不能隐藏或改变顺序，非 fixed 列只通过每行最前面的上移/下移按钮排序，隐藏后的普通列再次显示恢复隐藏前的位置。设置面板顺序与表格实际列顺序保持同步。表头标题、排序、筛选和列宽图标必须垂直居中；列宽拖动以当前实际表头宽度为起点，并在全局 pointermove/pointerup 中完成，不能因指针离开窄命中区而中断。Toolbar 与 Table/Pagination/footer 互不耦合；自定义 Toolbar `ButtonList` 默认显示图标和文本，默认表格操作/操作列显式使用 Button `onlyIcon`，其溢出下拉只显示文本。

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
- 基座所有“文本超出省略并展示完整提示”的位置统一使用 Components 的 `Ellipsis`；固定说明使用 Components 的 `Tooltip`。菜单左侧竖栏、右侧菜单、Tabs、工具栏和最近使用均适用，不再按问题逐点补丁。
- 收藏、最近使用和搜索结果中的每个菜单条目都必须拆分为左侧文本按钮与右侧“新标签页打开”图标按钮：点击文本在当前页面打开，点击图标新开标签页打开；图标使用公共 `Tooltip` 和 `newTab` 图标，不能通过嵌套按钮实现。
- 基座不再维护独立 Tooltip、Ellipsis、Message、Modal、Drawer、Select、Table、Form 行为；只保留布局骨架、尺寸约束和适配器边界。
- 基座骨架、原有菜单交互、收起/展开逻辑、Tabs、响应式和页面布局不能因组件抽离而改变。Portal 与 APP 同级、独立启动、独立构建、独立部署；默认 iframe。
- 收起状态保持 60px 图标栏和底部单一控制按钮；顶部恢复按钮只用于隐藏菜单栏。所有基座浮层必须从公共组件的 body Portal 出现。

### 7.1 非菜单页面的组件复用边界

- 默认认证页的账号、密码字段和登录/注册动作统一使用 `@biugle/react-components` 的 `TextField` 与 `Button`；认证状态、SSO 跳转和业务校验仍由 Runtime/Portal 负责。
- Runtime 的状态页、错误边界、错误详情复制和远程 APP 重试统一使用 Components 的 `Result`、`Alert`、`Button` 与 `biuMessage`。错误堆栈 `<pre>` 仍保留为专用只读日志区域，不把日志伪装成表单控件。
- Demo Portal 的登录、个人信息、修改密码和工作栏均使用公开 Components 控件；账户面板由 Portal 通过 `portalSlots.profilePanel`/`passwordPanel` 提供，基座不保存密码，也不替业务接口做假提交。
- 菜单树、页签右键菜单、侧栏/顶部导航工具按钮属于导航骨架，继续由 Preset 维护其尺寸、键盘和布局约束；远程 APP 内的业务页面、文件输入底层触发器和错误详情滚动区也不由基座强行替换。
- 因此“统一组件样式”不等于改变 Portal/APP 的业务契约：能由公共包完整表达的页面控件必须统一，认证协议、菜单布局和业务提交逻辑必须保留在原有边界。

## 8. Demo 作为文档

Demo 菜单使用真实能力名称：基座能力展示、组件能力展示、Form 能力展示、Table 能力展示、基础服务、系统配置等；Icons 支持搜索、分类、尽可能完整展示和点击复制名称。

组件能力页是唯一的组件文档入口：UI 与 Pro 不再拆成两个可见页面，组件案例、Pro 预设和每个组件自己的 API 表按同一顺序呈现。`ComponentProShowcase` 只保留兼容深链接，不产生第二份案例或 API 数据。表格第一列必须是单一真实组件名，不能出现 `Checkbox / Radio / Switch` 一类合并名称；属性、方法、类型、默认值、可选值/参数、准确说明和案例均逐项填写。

- 组件能力页：按组件类型和固定顺序逐块展示可操作案例；每个组件区域的案例下方必须紧跟只属于该区域的 UI Table，列出属性、方法、类型、默认值、说明和案例。页面末尾的完整表只作为总索引，不替代区域级 API 表。
- 旧 Pro 深链接：仅作为统一组件能力页的兼容别名，不再维护第二份 Demo、顺序或样式。
- API 表精度规则：一个公开属性或方法必须占一行，不能使用“a / b / c”把多个 API 合并成模糊的一行。每行固定包含组件/模块、单个属性或方法名、完整 TypeScript 类型、默认值、可选值或方法参数、准确效果说明和可运行案例；展示层不得因为历史数据曾经合并过属性就恢复合并行。API 表与 README/API 文档保持同一契约，任何公开类型变更必须同步 Demo、双语文档和测试。文档表只保留横向滚动，纵向滚动由页面统一承担，禁止每个属性表叠加独立滚动上下文。
- API 表禁止泛化兜底说明（例如“具体作用见公开类型”）。历史合并行展开后，每个属性/方法必须拥有自己的类型、默认值、可选值/参数、逐字段效果说明和对应案例；如果缺少专属元数据，必须先补充能力目录元数据，不能把原行说明原样复制到所有拆出的属性。
- ProTable 列设置的普通列只通过行首上移/下移按钮更新表格和设置面板；fixed 列不可隐藏、不可排序、不可改变顺序，只显示锁图标，不显示“锁”文字，面板不显示额外操作提示。普通列隐藏后再显示应恢复隐藏前的相对位置。
- IconsSearch 的图标和名称同一行左对齐，名称紧跟图标并可省略；搜索、分类、复制和尺寸/颜色案例均使用公开 Biu 组件。
- Form/Table 页面：按真实 CRUD 页面组合展示；Form 的 Form、ProForm、Form.Item、FormGroup、Form.Grid、Form.Section、Form.List、Actions/ErrorSummary，Table 的基础 Table、Column、筛选上下文、分页、选择、展开、ProTable、批量动作、useQueryTable 选项/返回值及查询生命周期等每个案例区域都必须有自己的 API 表，页面末尾可保留完整索引。
- HTTP、i18n、Query、Store、Logger、Render Code、Watermark：以能力说明、方法表、案例和结果展示为主，而非伪造 UI 组件卡片。
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
pnpm check
pnpm test
pnpm lint
pnpm format:check
pnpm audit:unused
pnpm verify:scenarios
pnpm build:demo:all
git diff --check
```

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

验收前清理 `.biu/`、`dist/`、coverage、缓存、日志、截图和其他临时产物；`.biu/foundation` 由 CLI 在启动时生成，不提交。完整回归结果与待办记录在 [`docs/final-delivery-review.md`](final-delivery-review.md)。

### 4.6 基础展示能力补充

`Typography/Title/Paragraph` 负责文本语义和排版，Typography 支持 `primary/success/warning/error/default` 语义色；`Space` 负责统一间距，`List` 负责数据列表，`ColorPicker` 提供当前颜色、预设颜色和受控值，`ContextMenu` 提供内容区域右键菜单；`Timeline` 负责时间节点并支持纵向/横向排列，`Spin` 负责独立或容器覆盖加载，`Image` 支持尺寸约束、懒加载、失败降级和点击预览，`Notification` 提供右上角通知 API，图标、内容和关闭按钮使用统一垂直对齐规则，`Affix` 提供滚动固定，`ResizeBox` 提供受边界约束的容器调整尺寸。`Box` 支持 `css`、`sx` CSS-in-JS 样式对象、数组和函数形式，合并顺序为 `css < sx < style`。`ConfigProvider` 是组件树的全局配置入口，统一提供 `locale`、`localeText`、`theme` 和 `direction`，`ComponentsProvider` 仅作为兼容别名保留。上传文件缩略图、文件状态和文件预览仍由 `Upload/FileList/FilePreview` 负责，不复制第二套上传模型。

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
- 当前执行环境禁止 Node/Rsbuild 监听本地端口，并限制 `tsx` 创建 IPC 管道（`EPERM`），因此本轮无法在该环境重新启动 9001/9002 或完成 CLI 场景脚本的进程级重跑。该限制不代表源码断言失败；需在允许本地监听的终端按清理验收说明启动服务后再进行浏览器验收。
- 本轮清理后已重新生成基础包 `dist/`、各 Demo `dist/` 与 `.biu/foundation` 快照；这些产物只用于本地验收，仍不得提交。

### 10.3 文档归档与产物生命周期

- `docs/biu-foundation-components-capabilities.md` 与 `docs/en/biu-foundation-components-capabilities.md` 是唯一的综合规范和回归归档文件；`docs/README.md`、`docs/README.en.md` 只索引它们和按包维护的 API/使用手册。
- `docs/http.md`、`docs/logger.md`、`docs/render-code.md`、`docs/watermark.md`、`docs/package-graph.md` 等是公共包使用手册或架构资料，不是第二套 Spec；其 API 变化必须同步本综合文件。
- 不保留 `docs/specs/`、`docs/en/specs/` 或同义的阶段性 Spec 目录。新增范围先更新本文并在需要时由用户确认，再修改源码。
- `dist/` 和 `.biu/` 是运行所需的本地生成物，不进入 Git。清理时必须先停止服务，再清理旧产物，重新执行基础包构建和 Demo 启动生成快照；服务运行期间不得删除它们，否则 CLI 或页面会出现模块/快照缺失。
- 交付前必须检查 `git diff --check`、失效文档链接、`git status --short` 和生成物范围；不能 reset、checkout 或覆盖用户已有修改。
