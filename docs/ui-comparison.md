# biu UI 回归对照

本文只比较 `web_all_in_one` 的可见 UI 与交互能力，不比较其架构实现。结论来自参考页面实际运行观察、`biu` 浏览器回归和源码/构建检查。

## 1. 结论

`biu` 已经覆盖基座日常使用的核心交互，并把 UI 维护集中在 `@biugle/biu-preset`，业务项目只配置 preset 和数据。标准 `sidebar` Layout 现在采用左侧全高品牌区、菜单区、底部收起按钮，以及右侧工作区顶部的全局操作区；DOM 层级与 `web_all_in_one` 的“侧栏 + 工作区”结构一致，Portal 与独立 APP 均可独立运行。

本轮视觉复刻进一步采用参考项目的紧凑工具栏、当前时间显示、无方框菜单图标、深色激活菜单、轻量 Tabs、页签滚动/刷新/关闭工具组和低对比度内容画布；颜色、文案和上下文通信仍由 biu 自己管理。

本轮回归使用启动日志输出的实际地址；端口被占用时 CLI 会按配置范围递增，因此文档不固化某一轮运行端口：

| 页面      | 结果                                            |
| --------- | ----------------------------------------------- |
| Portal A  | `pnpm start --filter main-a`，根路径独立启动    |
| Portal B  | `pnpm start --filter main-b`，根路径独立启动    |
| React APP | `pnpm start --filter child-app`，根路径独立启动 |
| Vue 3 APP | `pnpm start --filter vue-child`，根路径独立启动 |
| 参考 UI   | `web_all_in_one` 本地开发页                     |

## 2. 功能映射

| `web_all_in_one` 能力         | biu 实现                                                     | 回归结论                                  |
| ----------------------------- | ------------------------------------------------------------ | ----------------------------------------- |
| 左侧全高品牌与门户标识        | `@biugle/biu-preset/sidebar` 的 `biu-sidebar-brand`          | 已覆盖                                    |
| 侧栏与工作区独立分栏          | `biu-body` + `biu-main`                                      | 已覆盖，Header 不再占用侧栏顶部           |
| 门户/系统切换                 | `systemOptions` + `onSystemChange`                           | 已覆盖，地址切换由项目配置决定            |
| 侧栏目录、菜单、激活态        | 后端 Tree / local-routes + `MenuCollection`                  | 已覆盖                                    |
| 侧栏收起                      | 底部 `biu-sidebar-collapse`                                  | 已覆盖                                    |
| 顶部搜索                      | 搜索下拉和 Code/标题过滤                                     | 已覆盖                                    |
| 通知                          | 通知下拉、未读点、空态                                       | 已覆盖                                    |
| 多语言                        | 独立下拉，不轮换；可扩展 `locales`                           | 已覆盖；切换会同步 iframe                 |
| 时区                          | 独立下拉，默认 Shanghai/London/New York                      | 已覆盖；通过 `HOST_CONTEXT.TIMEZONE` 同步 |
| LTR/RTL                       | 独立下拉、根节点 `dir`、侧栏/菜单方向样式                    | 已覆盖；浏览器实测 RTL                    |
| Light/Dark/System             | 独立下拉、CSS 变量、系统主题监听                             | 已覆盖；浏览器实测 Dark                   |
| 用户区                        | 用户下拉、运行时设置、退出事件出口                           | 已覆盖，业务接入退出逻辑                  |
| Breadcrumb                    | `breadcrumb` 配置开关                                        | 已覆盖                                    |
| 多标签                        | 默认关闭，`tabs: true` 开启                                  | 已覆盖                                    |
| Tabs 关闭                     | 当前页关闭、单页关闭按钮                                     | 已覆盖                                    |
| Tabs 拖动                     | 原生 Drag and Drop，按 BEFORE/AFTER 重排，虚线占位和拖动间距 | 已覆盖                                    |
| Tabs 右键菜单                 | 刷新、左右、其他、全部                                       | 已覆盖                                    |
| Tabs 工具组                   | 左右滚动、刷新当前页、刷新整个页面、关闭全部                 | 已覆盖                                    |
| iframe 子应用                 | Portal 只加载 `APP_URL`，APP 独立部署                        | 已覆盖                                    |
| Drawer/Modal 宿主遮罩         | `useBiuOverlay` + `HOST_CHROME` mask                         | 已覆盖；实测导航、侧栏、Tabs 不可误点击   |
| Blank/Topbar/Dashboard/Mobile | 五个官方 preset                                              | 已覆盖                                    |

## 3. 有意保留的差异

- `biu` 不复制参考项目的业务组件、Table、Form、Workbench；这些属于独立业务组件包，不应进入基座。
- Tabs 当前使用基座内置 Pointer 拖拽状态机和上下文菜单，按移动阈值进入拖动，统一计算 BEFORE/AFTER 占位并在全局 pointerup/pointercancel 时提交或清理排序；普通点击不会捕获指针，避免点击与拖动互相干扰；未引入额外拖拽/UI 依赖，便于独立发包和长期维护。
- Portal 默认 iframe，Drawer 只在 iframe 内容区内展示；宿主遮罩仅覆盖 Portal Chrome，保证 Drawer 自身仍可操作。
- 主题、方向、时区由基座统一下发，但 APP 页面内部的业务文案和业务 CSS 仍由 APP 自己维护；APP 不能修改 Portal DOM 或基座 CSS。

本轮像素级回归还固定了以下基线：深色菜单的非选中 Hover 使用高对比文字、选中态保持独立高亮；顶部操作区域按内容自适应，不设置区域最小宽度，仅通过最大宽度和窄屏横向滚动箭头处理溢出，单个图标按钮保留自身尺寸；门户切换下拉为无图标的矩形文本列表；Tabs 只保留 6px 级别的内容间距；Breadcrumb 渲染完整菜单路径并支持窄屏横向查看；深色主题 Loading 使用深色画布；未折叠侧栏在窄屏仍保留菜单文本。

Topbar 选中菜单使用底部横线，不使用竖向标记；在 390px 等窄屏下，导航区和工具区都保留左右滚动箭头，至少展示一个带省略号的菜单/图标项；工具区不包含用户头像，搜索、通知、主题为纯图标。

## 4. 验收边界

本轮 UI 回归额外固定以下细节：菜单左侧层级线与文本区采用紧凑间距，文本和收藏/新标签操作区独立分栏，溢出只显示省略号并由黑色 Tooltip 展示全量内容；门户切换在窄屏保留名称且不显示冗余箭头；Breadcrumb 窄屏保留门户、首段省略提示和最后一段；Header actions 区域无最小宽度、内容自适应并以 max-width 控制滚动，工具栏与用户区相邻；Sidebar、Topbar、Mobile、Blank、Dashboard 均复用同一套主题变量、Tooltip 和滚动策略。基座底部菜单工具栏的浮层外壳不滚动，最近使用/收藏记录与搜索结果只有一个内部滚动区；空间足够时自然展开，超出时才显示纵向滚动条，并禁止横向滚动。

源码、构建和浏览器回归已覆盖 UI 主链路；生产发布前仍应由业务项目补充真实浏览器 E2E、真实身份/权限数据和视觉回归截图。当前项目按需求不把 iframe E2E 作为阻断项。
