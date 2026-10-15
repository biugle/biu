# Biu CLI Agent Contract

代码、Demo、测试、文档和清理规则必须同步更新；交付门禁、产物清理和 staged diff 规则统一按“最终交付归档”和“产物与 Git”执行。

## 架构约束

- `@biugle/react-components` 的 CSS 按组件归属维护：组件私有样式放在对应的 `src/ui/<component>/styles.css` 或 `src/pro/<component>/styles.css`，根 `src/styles.css` 只负责主题文件、样式导入和确实跨越多个组件的公共契约；禁止在根样式中重复覆盖组件私有几何。
- CSS 默认禁止新增 `!important`，也应逐步清理历史遗留用法。优先通过组件作用域、明确的 DOM 层级、导入顺序和选择器设计解决层叠关系；只有无法控制的第三方 DOM/样式覆盖确有必要时才允许保留，并在相邻注释说明原因。基础组件样式不得用 `!important` 阻断调用方定制。
- `react-components` 的 `ui` 入口只提供可组合的基础组件和原子行为；面向业务的默认值、状态编排、国际化、弹层 `fire` 能力和页面级布局由同名 `pro` 入口二次封装。新增组件应保持 `ui/<component>` 与 `pro/<component>` 的镜像入口，不能再把业务能力偷偷塞回 UI 原子组件。`react-form` 统一只有根入口，不建立 `ui/pro` 两套公开入口；`react-table` 的基础表格留在 `ui`，可编辑、查询、列设置等业务交互留在 `pro`。
- TypeScript ESM 源码中的相对运行时导入保留显式 `.js` 扩展名，这是 `moduleResolution: Bundler` 下生成可直接运行的 ESM 所需，不得为了“看起来像 TS”改成无扩展名或 `.ts`；只有确实被运行时执行的 Node 脚本才使用 `.mjs`，并且每个脚本必须有明确的包/CLI 调用方。

- Portal 与 APP 同级、独立启动、独立构建、独立部署、独立域名；Portal 默认用环境配置的 `remoteApps[APP_ID].APP_URL` iframe 加载 APP，不打包 APP 页面源码。
- `TARGET` 只允许 `APP`/`PORTAL`；`TYPE` 只允许 `DIRECTORY`/`MENU`/`COMPONENT` 权限语义，菜单节点使用 `DIRECTORY`/`MENU`。协议枚举值大写，标题和字段不强制大写。
- 页面在项目内按最终 Code 平铺在 `src/pages/<Code>`；后端虚拟层级只用于筛选、展示和权限，不改变前端目录。
- 菜单节点的 `code`、菜单 `path` 每一段以及本地页面目录 Code 统一使用首字母大写的驼峰命名（例如 `ComponentUIShowcase`、`/SystemConfig/UserManagement`）；新增菜单禁止使用短横线、下划线或全小写路径。菜单树最多渲染五层，第五层之后的子节点必须忽略；`@biugle/react-components` 的 `Menu` 默认保留至少 12px 左侧内容间距，并通过 submenu 偏移表达层级；基座壳层如果需要紧凑导航，可在宿主边界单独覆盖，不得改变组件默认层级感。`appId`、域名、locale 等非菜单身份字段不套用这条规则。
- 运行时菜单/权限优先；`local-routes/index.ts` 是本地开发和受控 fallback，`--all` 仅为排查，不是生产默认。
- 默认 iframe；Runtime 只抽象 Loader 和生命周期边界，不提前安装 qiankun/Wujie。

## 目录约定

```text
apps/<project>/
├── biu.config.ts
├── local-routes/index.ts       # 统一导出 common.ts、business.ts 等
├── config/{local,dev,test,pre,prod}.ts
└── src/pages/<Code>/           # Portal 自有页和 APP 页统一目录
```

项目共享代码使用 workspace package，不强制生成 `src/shared`；业务项目不生成 `src/i18n`，多语言由 `@biugle/biu-runtime` 提供，项目只配置接口或资源。

## 基座维护边界

- `packages/store/src/store/` 分为 `preference-store.ts`、`auth-store.ts`、`menu-store.ts`、`session-store.ts`；Zustand 是唯一状态库，Runtime 只保留兼容导出。
- `packages/router/src/` 负责菜单树、完整层级 URL、权限过滤、菜单接口和导航查询；Runtime 只负责运行时编排。
- `packages/preset/src` 负责 Sidebar、Topbar、Blank、Dashboard、Mobile、Custom、Tabs、Header、菜单配置、多级菜单、遮罩和响应式；样式只放 `styles/index.css`、`tokens.css`、`base.css`、`header.css`、`sidebar.css`、`tabs.css`、`content.css`、`overlays.css`、`responsive.css`、`themes.css`。
- `packages/i18n`、`packages/events`、`packages/bridge`、`packages/router`、`packages/store`、`packages/icons`、`packages/render-code`、`packages/watermark`、`packages/logger`、`packages/react-components`、`packages/react-form`、`packages/react-table`、`packages/http` 和 `packages/tanstack-query` 是可独立复用的公共包；Runtime/Preset 和 Demo 使用这些包的公开入口，禁止再添加第二套转发入口。
- `@biugle/react-components`、`@biugle/react-form` 和 `@biugle/react-table` 的默认可见文案必须为中文；有用户可见默认文案的包分别维护本地 `zh-CN.json`/`en-US.json`，并通过 `locale`/`localeText` 或显式文案参数允许调用方覆写。依赖边界和关系图统一维护在 `docs/package-graph.md`。
- 所有多语言资源和 `$t`/`i18n.$t`/`t` 调用统一使用中文原文作为 key，例如 `$t("列设置")`；禁止使用 `columnSettings`、`submit` 等英文或编码 key。英文只作为 `en-US` 资源值，组件内部字段映射不得把英文字段名重新暴露为资源 key。
- 普通菜单默认无图标；只有目录使用配置图标，无配置使用默认目录图标，禁止通过 Code/标题关键词猜图标。
- Portal 可通过 `portalSlots.workbar`/`toolbar` 插槽扩展或替换工具区；APP 不修改宿主 DOM/CSS。
- 运行模式固定分为：Portal Sidebar、Portal Topbar、独立 APP（可选官方 preset）和 React Custom；Custom 不渲染官方导航，只保留 Runtime、错误边界、更新检查和可选认证出口。
- React Portal 可通过 `portalSlots.toolbarActions` 声明标准化工具项；该契约同时渲染桌面工具栏和窄屏折叠菜单，稳定的基座文案可用 `labelKey`/`tooltipKey` 接入 i18n，任意 ReactNode 插槽不自动推断移动端行为。
- 页面可通过 `useBiuContext()` 的 `navigate`、`setLayoutOverrides`、`resetLayoutOverrides`、`login`、`logout`、`refreshAuth` 和偏好 setters 控制基座；页面离开前由 Runtime 导航自动清理页面级布局覆盖。
- 基座单文件原则上不超过 800 行；超过需拆分，特殊情况必须在文档说明。
- 标准 Table Demo 的业务状态必须使用 `@biugle/biu-store` 的 Zustand 封装；仅响应式测量、临时焦点和纯展示开关可以留在 `useState`。页面 store 只保留聚合的 `queryParams`、`storeState` 和 `dispatcher`，通过 `dispatcher.setQueryParams`、`resetQueryParams`、`setStoreState`、`resetStoreState` 更新或重置，禁止为每个字段再复制一套 setter。标准无 Tab 页的 `api.ts` 只放查询/接口入口，页面目录内的 `mock.ts` 只放脱敏数据；多 Tab 页根目录的 store 只管理公共 Tab 状态，`TabPages/<TabCode>/` 各自维护 `index.tsx`、`api.ts`、`mock.ts` 和 `store.ts`，共享渲染逻辑放在 `TabPages/shared/`。
- 开发服务使用项目级 `.biu/foundation` 快照解析 `@biugle/*`；修改 foundation 或 CLI 后必须重新构建并重启验收服务，快照不得提交。

## Table 与标准页面契约

- `Table`/`ProTable` 的列宽、行高、字段显隐、列顺序和密度都必须支持受控值及对应回调（包括 `onColumnWidthsChange`、`onRowHeightsChange`、`onColumnKeysChange`、`onDensityChange`）；ProTable 的重置必须通过 `onResetTable` 暴露完整的新状态。默认行高不得低于 40px，默认分页每页 20 条。
- 列宽和行高调整默认关闭；只有列或行明确配置为可调整时才渲染拖动手柄。启用后每一列（包括最后一列）都可拖动，遵守列的 `minWidth/maxWidth` 和行的最小/最大高度，拖动预览线必须与指针实时对齐，并在会话期间禁止文本选中。
- 组件不要求调用方手动指定弹性列：当配置宽度不足以填满容器时自动分配剩余空间；当最小宽度总和超出容器时只在表格内容区横向滚动，不产生外层空白或无意义的页面滚动条。调整最后一列时不得越过前列的最小宽度。
- 列紧凑程度菜单底部的“重置表格”恢复默认列宽、行高、字段显隐、列顺序和密度，并触发回调；不再提供 ESC 回滚本次拖动的行为。
- 标准页只允许一个最外层 `PageBox`：无外边距、6px 内边距、白色背景和 8px 圆角；`PageBody` 只负责撑满容器的布局，不追加第二层内容背景或固定尺寸。`PageContent` 是唯一内容面，使用 `whitesmoke` 背景、6px 内边距和 6px 圆角。`PageHeader`、`PageFilter`、`PageToolbar`、`PageContent`、`PageFooter` 都是可选的自然高度区域，空区域不占空间；区域间距固定为 header/filter 8px、filter/toolbar 8px、toolbar/content 6px、content/footer 4px，表格内容区吸收剩余高度。
- `PageFilter` 桌面端每行最多 6 个字段且最多 2 行；超出的字段进入与外层共用同一份受控状态的更多筛选 Drawer，不能生成第三行。字段控件填满自己的 Grid 轨道，操作区作为同级 Grid item，放得下时靠右，筛选区保持无边框；字段区上下内边距 10px，操作区上下内边距 6px。
- 表格操作列根据浏览器视口自动分为三档：小于 560px 固定为 60px 且 `ButtonList maxCount=1`；560–799px 为 160px 且 `maxCount=3`；800px 起为 190px 且 `maxCount=5`。`maxCount` 包含最后一个“更多”槽位，因此三档分别直接显示 0、2、4 个操作；操作列不可因响应式布局消失。显式列宽和调用方配置的 `maxCount` 优先，`ButtonList` 本身不增加 small/default/large 尺寸概念；操作按钮命中区和间距保持不变。
- 小屏分页保留“上一页、当前页、下一页、页码大小、跳至、跳页输入框、页”的顺序；页码大小和跳页输入框统一使用当前实现的 45px 宽度，默认桌面宽度为 90px。

## i18n / SSO

- React 页面使用 `useBiuI18n().$t("中文 key")`；非 Hook 使用 `i18n.$t("中文 key")`。
- Demo 页面及 Demo 中所有用户可见的标题、说明、按钮、表单标签、占位文案、提示、状态消息、表格文案和 API 展示说明必须经过当前语言的 `$t`/`i18n.$t`；公共 Demo 页面壳层可以使用 `LocalizedDemoTree` 统一处理，但新增动态文案仍需在状态更新和回调中显式使用 `$t`。组件名、属性名、TypeScript 类型、代码示例、接口字段名、路由/权限 Code、URL、文件名、真实数据值、单位和协议枚举属于不可翻译标识或示例数据，可保留原文；其余硬编码可见文案必须列为明确例外并说明原因。
- 配置、sessionStorage 和 Bridge 的语言值必须先经过 `normalizeBiuLocale`；空值、空白和非法值回退到合法中文，不能把原始非法值渲染到选择器。
- 中文和英文资源独立维护；目标语言缺失时回退英文、中文、key。
- Bridge 只传语言、主题、时区、方向、环境、门户 Code 和非敏感用户身份；Token/session id 不传递，SSO Cookie/网关负责鉴权。
- 主题、方向、时区等来自配置、sessionStorage 或 Bridge 的值必须先归一化；非法值分别回退浅色、LTR、Asia/Shanghai。`system` 主题必须监听 `prefers-color-scheme`。
- 全局提示统一从 `@biugle/react-components` 使用 `biuMessage.success/info/warning/error`。Runtime/Preset 不转发 UI API；React、Vue、HTML APP 都可调用；不得复制各框架的消息实现。
- Runtime 可通过 `updateCheck` 在首次加载建立 manifest 基线，并在用户导航时单次检查远程更新；不做轮询，不自动刷新，发现更新使用 Message 提示用户。Bridge 协议本身由 `@biugle/biu-bridge` 独立维护。
- `auth.enabled=false` 完全关闭基座默认认证入口；`@biugle/react-components` 提供顶部居中 `biuMessage`、React Pro `Dialog`/`Drawer` 和 `fire(Component)(props)` body 挂载能力。复杂业务内容由项目负责。
- Shell 生命周期使用 `MOUNT`/`UNMOUNT`，导航生命周期使用 `BEFORE`/`AFTER`/`ERROR`；`BEFORE` 返回 `false` 可取消。应用通信使用类型化事件总线，iframe 通过 Origin 校验的 `APP_EVENT` 转发。
- CLI 支持 `biu init` 交互式创建多个 Portal/APP，并可选择 Portal Sidebar/Topbar、APP preset/Custom React；非交互式仍使用 `biu create <name> --type ... --preset ...`。公开包通过 Changesets 发布。

## 最终交付归档

- 首版发布前的回归结果、评分、已完成项、TODO、GitHub Secrets 和生产接入边界统一记录在 `docs/final-delivery-review.md` 及 `docs/en/final-delivery-review.md`。
- HTML、Vue、React 独立 APP 必须共用 `@biugle/biu-preset` 的 `LayoutFrame`；收起状态统一为 60px 图标栏和底部单一控制按钮，顶部恢复按钮只用于“隐藏菜单栏”，禁止 Adapter 或 Demo 自行复制收起逻辑。
- 交付门禁统一执行 `pnpm verify`：公共包/Demo 类型检查、18 个公开包打包目标与污染检查、公共包回归单测、ESLint、Prettier、Knip、生产依赖审计、100 个 CLI 创建输入、7 种 Portal/APP preset 与环境构建、全量 Demo 构建和 `git diff --check`；正式 npm/Vercel 发布仍需配置仓库 Secrets 后由 GitHub Actions 执行。
- 首次提交前必须检查 staged diff，确保无 Token、Cookie、密码、内部域名或本地用户数据；不要提交 `dist/`、`.biu/`、`node_modules/`、缓存和 `.husky/_/`。
- 组件、基座、公共包、Demo、API、设计决策、浏览器回归和交付约束的唯一综合记录是 `docs/biu-foundation-components-capabilities.md` 及其 `docs/en/` 英文对应文件；`docs/final-delivery-review.md` 只保存发布审计，不得再建立或保留 `docs/specs/` 阶段性 Spec 目录。

## 产物与 Git

- `.biu/`、`dist/`、coverage、缓存、日志、临时错误记录、`node_modules/` 和 `.husky/_/` 不提交。
- 保留源码 `.husky/pre-commit`；不保留自动生成的 `.husky/_/`。
- 不提交构建产物、截图、调试入口、废弃目录和无效记录；验收前清理明确的历史产物。
- `.biu/` 与 `dist/` 是本地运行所需的忽略生成物：清理必须先停止服务，再删除旧产物，执行基础包构建后重新启动 Demo 生成快照；服务运行期间不得直接删除，否则 CLI 或页面会出现缺模块/缺快照错误。
- Demo API 表是公开 API 的可核对文档：Form、Table、ProTable、useQueryTable 及其每个展示区域必须逐个列出公开属性和方法，不得把多个属性合并成模糊的一行。每行至少包含组件/模块、单个属性或方法名、完整 TypeScript 类型、默认值、可选值/方法参数、准确效果说明和可运行案例；展示层必须展开历史合并行；新增或修改公开 API 时必须同步更新中英文文档、Demo API 表和回归测试。
- 组件能力页的 API 表同样遵守逐属性规则：每个组件独立成表，第一列必须是该组件自身名称；不得用 `Checkbox / Radio / Switch`、`TextField / Textarea` 或 `Upload / File Preview` 等合并名称冒充独立文档。组合展示可以保留在案例标题，不能合并公开属性、默认值、可选值或说明。
- Table CRUD Demo 的筛选操作按钮统一 small 尺寸和宽度：更多筛选使用 secondary outlined，重置使用 secondary contained，查询使用 dark contained；按钮文本超出必须使用公共 Ellipsis/Tooltip 契约。`PageFilter` 的 `maxRows`/`autoCollapse` 与完整 Drawer 必须保持同一份受控字段状态，Drawer 默认使用较宽的 large 尺寸（约 620px）并保持相同控件高度。
- `Button.onlyIcon` 是独立图标按钮的唯一视觉入口：Button 自己负责方形尺寸、居中、无文字节点和 Tooltip 文案（可用 `tooltip` 覆写），调用方禁止再用额外的 toolbar icon CSS 或外层 Tooltip 补间距。`ButtonList` 默认用于带文本的自定义 Toolbar 操作；只有表格默认操作列等明确场景才传 `iconOnly`，内部必须转为 Button `onlyIcon`。icon-only 操作保持方形命中区，溢出 DropdownMenu 只展示文本，不重复展示图标。Table 表头标题、排序、筛选、列宽图标必须垂直居中；列设置 fixed 列只显示锁图标、不能隐藏或改变顺序，非 fixed 列只通过行首上移/下移按钮排序，禁止拖动排序；隐藏后重新显示应恢复到隐藏前的位置。
- Checkbox、Radio、Switch 及其相邻文案必须共享垂直中心线；TextField/Textarea 的 showCount 案例也必须与同排控件顶部对齐。所有 Demo 操作组和能力卡片中的连续按钮保留统一上下间距，不允许按钮与展示内容贴边。
- Textarea 的 `resize="both" | "horizontal" | "vertical" | "none"` 必须由组件维护单一的受限 resize 契约；不得叠加第二套自绘句柄，宽高变化要同步外层 frame 和 textarea，且不能越出父容器。
- Demo mock 必须放在所属项目内：页面业务数据放页面目录的 `mock.ts`，跨页面共享 mock 才放项目 `src/mock/`；基座只提供生产级数据契约和能力，不内置 Demo 账号逻辑。
- 数据字段、接口响应、Bridge、更新清单和脱敏规则统一维护在 `docs/data-contracts.md`；代码或契约变化必须同步更新该文档及对外 API 文档。

## 常用命令

```bash
pnpm start --filter main-a
pnpm start --filter child-app
pnpm start --filter main-a -- --apps ../child-app,../vue-child
pnpm --filter main-a biu build --all
```
