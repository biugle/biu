# biu 前端架构设计基线

## 1. 目标与边界

`biu` 是现代化、前后端分离、可拆卸的前端基座。Portal 与 APP 是同级项目，分别启动、构建、部署和绑定独立域名。Portal 不打包 APP 页面源码，默认通过当前环境的 `remoteApps[APP_ID].APP_URL` 使用 iframe 加载。

页面在项目内按最终 Code 平铺，后端可以用虚拟层级区分门户、目录和权限，但不改变前端目录。当前默认加载器只有 iframe；Runtime 对 Loader 和生命周期已经抽象，未来增加 ESM、qiankun、Wujie 只新增 Loader，不改菜单协议、权限协议和业务页面。

## 2. 包职责

```text
@biugle/biu-cli             项目创建、环境合并、按权限发现页面、Rsbuild 构建、Manifest
@biugle/biu-i18n            框架无关的语言资源、切换、插值和回退
@biugle/biu-events          框架无关的同文档类型化事件总线
@biugle/biu-bridge          框架无关的跨窗口协议、Origin 校验和报文 Schema
@biugle/biu-router          菜单树、完整路径、权限过滤、导航和菜单接口适配
@biugle/biu-store           偏好、认证、菜单交互和 Tabs 会话状态
@biugle/biu-ui              Message、Tooltip、Modal、Drawer 和 fire 等通用 React UI
@biugle/biu-runtime         Shell、页面加载、生命周期、SSO 身份上下文和运行时编排
@biugle/biu-preset          Sidebar / Topbar / Blank / Dashboard / Mobile 与分区 CSS
@biugle/biu-adapter-react   React 官方 Adapter
```

Vue、Svelte、Angular 和原生 HTML 通过明确 Adapter 接入；原生 HTML 使用 Runtime 的 `htmlAdapter`。基座包默认使用编译期本地 npm/workspace 版本，不从 CDN 加载基座代码。APP_URL 只在 `config/<ENV>.ts` 管理，不写入菜单协议。

## 3. 工程目录

```text
project/
├── biu.config.ts
├── local-routes/
│   ├── index.ts                 # 唯一发现入口，统一导出其他路由文件
│   ├── common.ts
│   └── business.ts
├── config/
│   ├── local.ts
│   ├── dev.ts
│   ├── test.ts
│   ├── pre.ts
│   └── prod.ts
├── public/static/               # 独立管理、复制和发布的业务静态资源
└── src/
    └── pages/
        ├── PageA/index.tsx      # Portal 自有页面或 APP 页面都统一放这里
        └── PageB/index.tsx
```

项目级共享组件、hooks、工具和类型放 workspace package，不强制生成 `src/shared`。Portal 自有页面没有独立目录，`source: "PORTAL"` 的本地页面仍然位于 `src/pages`；`source: "APP"` 的 Portal 路由只保存远程 APP 元数据。

## 4. 配置与环境

```ts
export default {
  appId: "portal-a",
  projectType: "PORTAL", // PORTAL | APP
  environmentConfigDir: "config",
  framework: "react", // react | vue | svelte | angular | html
  portal: {
    code: "portal-a",
    menuRootCode: "portal-a",
    permissionPrefix: "portal-a",
  },
  layout: { preset: "sidebar", tabs: true, breadcrumb: true },
  routes: { files: ["local-routes/index.ts"] },
  menu: {
    portalTreeUrl: "/api/menu/portal-tree",
    directoryTreeUrl: "/api/menu/directory-tree",
    permissionCodesUrl: "/api/menu/codes",
  },
};
```

APP 不配置 `portal`。公共配置写入 `biu.config.ts`，差异写入 `config/local.ts`、`dev.ts`、`test.ts`、`pre.ts`、`prod.ts`，优先级为 `--env` > `BIU_ENV` > 命令默认值。Portal 的门户列表、工具栏和自定义工作栏只能依据配置或接口权限展示，不扫描进程，也不根据当前启动了什么服务猜测。

## 5. 菜单、权限与编译

三类接口统一返回 `{ code: 0, message?: string, data: ... }`：

1. Portal 目录和菜单 Tree：传 `portalCode`、可选 `rootCode`。
2. 目录菜单 Tree：传 `portalCode`、`directoryCode`，目录点击时按需加载。
3. Portal 权限 Code 平铺数组：传 `portalCode`，目录、菜单、组件权限 Code 全局唯一。

后端若返回 `RESOURCE_DIR`、`RESOURCE_MENU`，基座分别适配成 `DIRECTORY`、`MENU`，将 `title` 适配为 `titleKey`、`sortNo` 适配为排序信息，并把 `id`、`parentId`、`menuCode`、`systemResourceCode` 放入 `meta`。本地路由元数据会按 Code 补齐 `target`、`appId`、`appPath`，避免后端菜单树缺少部署信息时无法加载。

```ts
export default [
  {
    code: "PageA",
    type: "MENU",
    target: "APP",
    source: "APP",
    titleKey: "页面 A",
    appId: "child-app",
    appPath: "/PageA",
  },
  {
    code: "Dashboard",
    type: "MENU",
    target: "PORTAL",
    source: "PORTAL",
    titleKey: "概览",
    path: "/Dashboard",
  },
];
```

`TYPE`/`TARGET` 的协议值使用大写；字段名和标题不强制大写。接口成功后只编译返回且本地存在的 Code，空树不会退回本地全量；接口未配置或明确允许失败兜底时才使用本地路由；`--all` 仅用于排查。运行时菜单加载完成前只显示 Loading，不闪现兜底菜单。

## 6. Layout 与扩展

官方 preset：

| preset      | 用途                                      |
| ----------- | ----------------------------------------- |
| `sidebar`   | 侧栏目录、顶部工具、可选 Tabs/Breadcrumb  |
| `topbar`    | 顶部横向菜单，选中项底部横线              |
| `blank`     | 门户独立设计页、无导航页面                |
| `dashboard` | 工作台和概览                              |
| `mobile`    | 移动端底部导航                            |
| `custom`    | React 独立自定义模式，仅保留 Runtime 能力 |

`tabs` 与 `breadcrumb` 是独立配置项，默认可以关闭。Sidebar 的目录箭头由 Menu Store 控制展开/收起；顶部控制按钮在菜单可见或侧栏收起时执行“隐藏菜单栏”，菜单完全隐藏时只显示恢复按钮并恢复完整侧栏；展开时底部依次提供菜单选项、收藏、最近使用、搜索、收起/展开，收起时只保留收起/展开。菜单配置面板提供全部展开、全部收起、展开/折叠菜单栏、隐藏菜单栏、单目录展开、多目录展开、顶部展示搜索按钮、目录标题显示和单栏/双栏模式，除“隐藏菜单栏”外操作不会关闭面板；顶部展示搜索按钮开启后复用菜单栏搜索组件，将搜索按钮放到通知按钮左侧并隐藏底部重复入口；显示/隐藏目录标题只在双栏模式生效。收藏按门户 scope 使用 Menu Store 和 localStorage 隔离，最多 100 条；最近使用最多 10 条，支持一次还原全部标签，旧记录保留并交给页面不存在兜底。双栏模式直接使用后端 Tree 的第一级目录作为左侧图标栏，右侧显示当前目录标题和菜单；第一级目录下允许目录和菜单同级，目录可以继续嵌套目录和菜单，右侧层级统一不显示图标；目录 Code 在不同分支下可以重复，实际页面仍以菜单节点自身的稳定路径 Key 为准。左侧目录栏高度受侧栏内容区约束，超出时显示上下滚动按钮；没有配置时保持单栏 Sidebar。普通菜单项默认无图标，只有目录显示配置图标，没有配置使用默认目录图标，不通过 Code 或标题猜图标。

菜单项 hover 时提供“新标签页打开”箭头，点击使用浏览器原生新标签页。展开侧栏时普通菜单不显示图标，收起侧栏时显示统一的页面占位图标；目录图标仍只来自显式配置或默认目录图标。菜单、Tabs、用户名称都限制最大宽度，超长省略并通过 Tooltip 展示完整文本。Breadcrumb 保留完整多级路径，Tabs 只展示最后一级页面名，完整链路仅作为 Tooltip。工具区、Tabs 区和导航区拥有独立溢出滚动；小屏保证至少展示一个 Tab/工具图标，门户切换空间不足时保留文本入口且不渲染冗余下拉箭头。Portal 可通过 `portalSlots.workbar` 和 `portalSlots.toolbar` 插入工作栏、部门/角色切换、自定义搜索和按钮，也可以完全替换默认工具栏。

需要桌面和窄屏共用的门户工具使用 `portalSlots.toolbarActions`；稳定的基座文案使用 `labelKey`/`tooltipKey`，业务数据仍由 Portal 或后端提供。基座默认工具栏不绑定时区，Portal A/B 都以时区和中间 workbar 作为插槽案例。空间不足时 toolbarActions 进入窄屏“更多操作”，中间 workbar 插槽允许隐藏。语言切换会携带 locale 重新加载菜单，并支持 `reloadLocale`/`reloadMenus` 钩子。页面可通过 Context 的 layout override 临时隐藏或锁定菜单、Tabs、Breadcrumb，下一次导航自动恢复。默认首页、认证动作出口和错误详情复制属于 Runtime 生产能力；`admin/admin`、通知、个人信息和改密提示仅存在于 Demo mock，字段与脱敏规则统一见 `docs/data-contracts.md`。

Tooltip、Message、Modal、Drawer 和 fire 由 `@biugle/biu-ui` 的单一入口提供，`layout.tooltip.onlyOverflow` 默认开启，只在真实溢出时展示；`layout.tooltip.placement` 统一控制方向，避免各页面自行实现一套提示样式。Preset/Layout 内部也只能从 `@biugle/biu-ui` 获取这些能力。

双栏模式通过 `setDirectoryScope` 注册当前右侧菜单区域；展开全部、折叠全部和手风琴策略只修改该区域，并保留其他一级目录区域的展开状态。菜单选项面板中的配置区和样式区均由 Menu Store 驱动。

基座 CSS 按 `tokens`、`base`、`header`、`sidebar`、`tabs`、`content`、`overlays`、`responsive`、`themes` 拆分。业务页面自行决定内容间距，APP 区域由基座填满剩余空间，不预留多余空白。深浅主题只由变量切换，Loading、错误页、Popover、拖拽虚线和遮罩都必须使用当前主题变量。

四种实际开发形态分别是：Portal A/B 这类官方 Sidebar/Topbar 门户、使用官方 preset 的独立 APP、以及只由 React 项目自行定义页面和外壳的 `custom` APP。Custom 仍使用 Runtime 的认证开关、错误、更新检查、生命周期、事件总线和 Context；项目可以关闭认证入口并完全自行定义页面。`examples/dev-demo/apps/layout-custom` 是可运行样例，`biu init` 可交互生成对应项目。

## 7. Runtime、状态与安全

Store 使用 Zustand 并按职责拆分，Runtime 只通过 Store 的公开 API 读取和更新状态：

```text
packages/store/src/store/
├── preference-store.ts   locale、theme、timezone、direction
├── auth-store.ts         仅非敏感身份上下文
├── menu-store.ts         目录展开、菜单显示、菜单模式、当前目录组、收藏和最近使用
└── session-store.ts      当前 Portal 的 Tabs 会话恢复
```

React 页面使用 `useBiuI18n().$t("中文 key")`，非 Hook 使用 `i18n.$t("中文 key")`。默认中文和英文独立维护；目标语言缺失时回退英文，再回退中文，最后展示 key；来自配置、存储和 Bridge 的语言值先经 `normalizeBiuLocale`，空值或非法值回退合法中文。主题、方向、时区同样归一化，非法值回退浅色、LTR、`Asia/Shanghai`，`system` 主题监听 `prefers-color-scheme`。Portal 通过安全的 `postMessage` Bridge 将语言、主题、时区、方向、环境、门户 Code 和非敏感用户身份同步给 iframe APP；Token、session id 和任意 DOM/HTML 不进入 Bridge。SSO Cookie/网关继续负责真实鉴权。菜单收藏、最近使用、目录展开和菜单偏好写入 `localStorage`，按 `PORTAL_CODE:ENVIRONMENT` 隔离；Tabs 当前顺序/当前页以及语言、主题、时区、方向写入 `sessionStorage`，同样按 Portal 和环境隔离，关闭当前浏览器会话后不保留。进入页面后基座会将当前菜单、页签和顶部导航定位到可视区域，且不接管 iframe 内部滚动。Runtime 还提供跨框架 `biuMessage`，以及可选的按导航触发 manifest 更新检查，不轮询、不强制刷新。

APP 的 Drawer/Modal 默认只覆盖 iframe 内部；`useBiuOverlay()` 只通知宿主遮罩 Header、Sidebar、Tabs，避免误点击。Portal 自有 Drawer/Modal 由页面实现。统一跨域宿主弹窗留待后续 JSON Schema 协议，不传任意组件或 HTML。Tabs 拖动、关闭和右键操作均使用稳定菜单路径 Key，不使用可能重复的最终 Code。

每个 Portal/APP 的根 URL 都有固定保底首页：CLI 生成的 `src/pages/index.*` 是首页源码，`src/pages/_*` 目录不会被自动解析；首页不依赖 Tabs 配置，开启 Tabs 后会作为不可关闭的保底页签。页面切换和语言变化会更新 `document.title`：标题格式为“系统/门户前缀 - 当前语言菜单名”，菜单名缺失时依次回退页面 Code、系统/门户名和 appId；没有有效值时使用基座默认名。用户菜单底部用左右结构展示 `V` 主版本和 `S` 子应用版本，无值显示 `-`，不使用括号或竖线；版本分别来自各项目 package.json，APP 通过 `BIU_READY.VERSION` 回传给 Portal。

## 8. 启动、构建与发布

```bash
pnpm start --filter main-a
pnpm start --filter child-app
pnpm start --filter main-a -- --apps ../child-app,../vue-child
pnpm --filter main-a biu build --all
```

Portal 默认端口从 `9001–9999` 递增，APP 从 `8001–8888` 递增，也可用 `dev.port` 或 `--port` 覆盖。Portal、APP 分别输出自己的 `dist/index.html`；按 `pages/<Code>/` 产出 chunk 和 `manifest`，`public/static` 单独复制。开发服务会将 `@biugle/*` foundation 复制到项目 `.biu/foundation`，隔离 `tsup --clean` 对 workspace `packages/*/dist` 的影响；`.biu/`、`dist/`、日志、缓存和 `.husky/_/` 不提交；保留源码 `.husky/pre-commit`。

`pnpm start --filter <name>` 是日常入口，`biu` 仅用于创建、按需编译、全量排查和构建。Demo 与生成项目都必须带 `package.json`、README、TypeScript、ESLint、Prettier、Husky/lint-staged 和 `.gitignore`，可独立安装运行。
