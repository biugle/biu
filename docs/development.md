# biu 开发文档

## 工作区

```text
biu/
├── .editorconfig            # 编辑器统一编码、缩进、换行和列宽
├── eslint.config.js         # 根工作区 ESLint 门禁
├── .prettierrc.json         # 根工作区格式规范
├── .husky/pre-commit        # 提交前 lint-staged 门禁
├── packages/cli/            CLI、发现、Rsbuild、Manifest
├── packages/bridge/         框架无关的跨窗口协议、Origin 和报文校验
├── packages/runtime/        Shell、页面生命周期和运行时编排
├── packages/i18n/           框架无关的多语言核心
├── packages/events/         框架无关的事件总线
├── packages/router/         菜单树、完整路径、权限过滤和导航查询
├── packages/store/          偏好、认证、菜单交互和 Tabs 会话状态
├── packages/ui/             可独立复用的 Message、Tooltip、Modal、Drawer、fire
├── packages/preset/         官方 Layout 与分区 CSS
├── packages/adapter-react/  React Adapter
├── examples/dev-demo/apps/  独立 Portal、React/Vue/HTML APP
└── docs/
```

每个 Demo 项目有独立 `package.json`、README、环境文件、检查命令和入口；共享业务代码放 `examples/dev-demo/packages/*` workspace package。禁止用跨应用深层相对路径复用业务代码。

根工作区和生成项目都保留 ESLint、Prettier、EditorConfig、Husky 与 lint-staged。根目录门禁覆盖公共包、CLI、脚本和 Demo；生成项目可脱离本仓库独立安装和执行自己的门禁。`@biugle/biu-store` 使用 Zustand 作为唯一状态库，偏好、认证、菜单和会话 Store 都从该包公开入口导出，不能替换成第二套状态实现。

## 代码边界

- CLI 只负责读取 `biu.config.ts`、合并 `config/<ENV>.ts`、发现 `local-routes/index.ts`、按 Code 筛选和调用 Rsbuild。
- Runtime 不扫描文件，消费 CLI 生成的 `pageRegistry`，负责菜单、权限、导航、页面加载、Bridge 和错误边界；i18n 和 events 通过独立包提供公共核心能力。
- `@biugle/biu-bridge` 不依赖 React、Runtime 或 Layout，负责跨窗口协议与安全校验；Runtime 的 `remoteAppFor()`、`authContextFor()` 只是运行时配置适配器。
- `@biugle/biu-ui` 不依赖 Runtime，面向 React/Custom 和业务页面提供通用浮层能力；Runtime、Preset 和 Demo 统一从各自独立公开包入口获取，不维护未公开的内部转发入口。直接使用时引入 `@biugle/biu-ui/styles.css`。
- Preset 负责官方 Layout、菜单交互、Tabs、Header、遮罩和响应式 CSS；样式必须放 `packages/preset/src/styles/` 分区文件。
- Custom Layout 也由 CLI 自动注入 `@biugle/biu-preset/custom.css`。该公共样式由基座负责弹层、遮罩、层级、基础组件和响应式基础规则；Custom Demo 不需要创建 `custom.css`、CSS 类型声明或复制一套基座样式。Demo 只维护自己的业务外壳和业务内容样式。
- Adapter 负责框架实例挂载和销毁。官方 React；Vue/Svelte/Angular/HTML 通过明确 Adapter。
- 运行模式按职责选择：Portal 使用 `sidebar` 或 `topbar`；独立 APP 可以选择 `sidebar`、`topbar`、`blank`、`dashboard`、`mobile`；完全自定义的独立 React 项目使用 `custom`，不渲染官方导航但仍接入 Runtime Context、错误边界、认证出口和更新检查。
- CLI 提供 `biu init` 交互式向导：先选择 Portal 双栏、Portal 顶部导航、独立 APP 或 React Custom 默认模式，再一次生成多个 Portal 与 APP，并逐项目引导认证、Tabs、面包屑、菜单来源和 Portal 插槽；`biu create <name> --type ... --preset ...` 用于非交互式单项目生成。公开包通过 Changesets 管理版本和发布。
- 单个基座源码文件原则上不超过 800 行；Store、菜单、认证、偏好和 CSS 按职责拆分。

每个 Portal/APP 的根路由固定为 `/`，由 `src/pages/index.*` 提供，不需要加入 `local-routes`，也不进入普通页面 Registry。`src/pages/_*` 是项目内部页面目录，CLI 不扫描、不生成菜单和动态 chunk；公开业务页面仍使用 `src/pages/<Code>` 并在 `local-routes/index.ts` 中显式声明。

## 菜单适配

编译期和运行时都校验 `{ code, message, data }`。`RESOURCE_DIR`/`RESOURCE_MENU` 适配为 `DIRECTORY`/`MENU`，`title` 适配为 `titleKey`，原始 `id`、`parentId`、`menuCode` 和 `systemResourceCode` 放入 `meta`。本地路由按 Code 补充部署元数据。树的第一级目录直接作为双栏模式的左侧分组，不重复维护 group 配置；每个一级目录的 children 可混排 `DIRECTORY` 与 `MENU`，目录 children 继续递归支持目录和菜单，右侧层级不渲染图标。不同目录分支可以出现同名菜单 Code，编译发现仍要求本地页面路由 Code 唯一，避免页面模块和按 Code 加载映射产生歧义。

### 路由身份与 URL

Runtime 以 `annotateMenuKeys()` 生成的完整菜单 Key 作为路由身份，`menuPath()` 作为 URL 与菜单路径的唯一规范来源：后端提供以菜单 Code 结尾的完整 `node.path` 时原样使用，否则生成 `/<directory-code>/<menu-code>` 的完整递归链路。`menuRoutePath()`、`menuPath()`、`findMenuByPath()`、`findMenuByKey()` 必须使用同一规则；禁止通过 URL 最后一段 Code 回退匹配。`findMenuByPath()` 只接受完整标准 URL，或唯一的显式 `node.path` 兼容别名；重复别名必须返回未命中。

`navigateByCode()` 仅在 Code 唯一时导航；重复 Code 使用 `navigateByKey()`，并在权限、审计、监控事件中记录 `menuKey` 与 `routePath`。`resolveMenuPath()` 用于生成可分享的 `<a href>`。独立 APP 的 CLI 合成根目录标记为 `__BIU_SYNTHETIC_ROOT`，不进入 URL 和面包屑；Portal/后端真实目录不跳过。宿主层级 URL 与远程 APP 的 `appPath` 解耦：前者用于分享、权限和审计，后者只用于 iframe 内部页面加载。

## 状态与 i18n

```text
packages/store/src/store/
├── preference-store.ts
├── auth-store.ts
├── menu-store.ts
├── session-store.ts
packages/router/src/
├── navigation.ts
└── types.ts
```

`menu-store.ts` 同时管理当前目录作用域、单栏/双栏配置、目录展开状态、门户隔离的收藏和最近使用记录；收藏通过 `BIU_MENU_STATE:<PORTAL_CODE>:<ENVIRONMENT>` 持久化到 `localStorage`，收藏最多 100 条、最近使用最多 10 条。`session-store.ts` 通过 `BIU_TABS_SESSION:<PORTAL_CODE>:<ENVIRONMENT>` 将 Tabs 顺序和当前页持久化到当前会话；偏好 store 使用同一 scope 的 `BIU_PREFERENCES_SESSION:` 前缀保存语言、主题、时区和方向。任何菜单入口都应通过统一导航回调记录最近使用，恢复旧记录时保留原路径 Key，由 Runtime 的页面不存在兜底负责提示。Store 切换 scope 时会先清空未命中 scope 的内存状态，再读取对应存储，避免门户切换串状态。

React 使用 `useBiuI18n().$t("中文 key")`，非 Hook 使用 `i18n.$t("中文 key")`。`@biugle/biu-i18n` 提供框架无关核心，Runtime 负责基座生命周期和远程资源刷新；目标语言缺失时英文、中文、key 依次回退。业务项目不生成 `src/i18n`，只通过 `localeUrl` 或资源配置扩展。

语言切换是一次运行时刷新边界：Runtime 先归一化 locale，再从可选 `localeUrl?locale=<locale>` 读取业务语言资源并注册到 i18n，同时重新请求 Portal Tree/Directory Tree（请求参数包含 `locale`），因此后端菜单标题可以按语言返回。页面或门户可通过 `useBiuContext().reloadLocale(locale?)`、`reloadMenus(locale?)` 主动触发同一流程；`BiuRuntimeConfig.onLocaleChange` 用于接入业务侧缓存或接口钩子。资源不可用时仍按英文、中文、key 回退，不阻断菜单加载。

配置、sessionStorage 和 Portal/APP Bridge 的语言值统一经过 `normalizeBiuLocale`。空值、空白值、大小写不一致或不在项目语言清单中的值不会进入 UI，默认回退到 `zh-CN`；语言清单中的自定义语言仍可按配置使用。新增基座文案必须在 `packages/i18n/src/zh-CN.ts` 与 `en-US.ts` 同步维护，Hook 组件使用中文 key，不直接拼接翻译函数。

进入页面后，Preset 会分别把当前页签、菜单项和顶部导航滚动到可见位置；这只滚动对应的菜单/Tabs 容器，不改变 APP iframe 的内容滚动。CLI 为没有后端菜单树的 Portal/APP 生成的合成根目录只用于路由，不会在顶部导航中占用一个菜单项，顶部导航直接展示其真实子菜单；后端返回的真实根目录仍按原层级展示。Breadcrumb 和 Tabs Tooltip 都使用完整菜单链路且从第一级真实目录开始，不包含 Portal Code（如 `main-a`）；Breadcrumb 在窄屏下默认隐藏，桌面端作为一个整体文本省略并保留完整 Tooltip，Tabs 可见文本只显示最后一级页面名。

## 构建链

```text
biu dev/build
  -> biu.config.ts + config/<ENV>.ts
  -> local-routes/index.ts
  -> Portal Tree / Directory Tree / Permission Codes
  -> Code 白名单（接口成功为空则为空；--all 才全量）
  -> .biu/generated/<mode>/entry.tsx
  -> Rsbuild
  -> dist/index.html、pages/<Code> chunk、static、manifest
```

Portal 的 APP 页面永远不进入本地 Registry；入口只保留远程 APP 元数据。开发输出 `.biu/dev`，生产输出 `dist`。开发默认使用 `pnpm start --filter <name>`，只有创建、按需编译和全量排查才使用 `biu` 子命令。

开发服务启动前会自动检查本地 `@biugle/*` foundation 包；首次运行不需要手工先构建。CLI 会把基座发布产物复制到当前项目的 `.biu/foundation` 快照，并保留包自身依赖解析路径，因此 `packages/*/dist` 被 `tsup --clean` 重建时不会打断已运行的 Portal/APP。`.biu/foundation` 与 `.biu/generated` 一样只属于开发临时产物，已纳入 ignore。

## 运行时协议

iframe 生命周期为 `LOAD_START`、`READY`、`ERROR`、`UNLOAD`；Shell 生命周期为 `MOUNT`、`UNMOUNT`；导航钩子为 `BEFORE`、`AFTER`、`ERROR`，`BEFORE` 返回 `false` 可取消导航。Bridge 只传语言、主题、时区、方向、环境、门户 Code 和非敏感身份；Token/session id 不传递。APP 的遮罩和 `APP_EVENT` 请求只允许结构化状态，不能传 DOM、HTML 或脚本。

Portal 插槽 API：

```tsx
<BiuShell
  config={{
    ...config,
    portalSlots: {
      workbar: <DepartmentSelect />,
      toolbar: <RoleSelect />,
      replaceToolbar: false,
    },
  }}
/>
```

需要让门户自定义工具在窄屏折叠菜单中仍可操作时，使用 `portalSlots: { source: "./src/portal-slots.tsx" }` 指向一个导出 `BiuPortalSlots` 的 React 模块，并用 `toolbarActions` 描述 `code`、`label`、可选 `labelKey`/`tooltipKey`、`icon`、`content` 和 `mobile`。任意 `toolbar` ReactNode 只保证桌面插槽，不由基座猜测其移动端语义。页面级控制使用 `useBiuContext().setLayoutOverrides({ hideSidebar, collapseSidebar, lockSidebar, hideTabs, hideBreadcrumb })`，导航到下一页会自动恢复。

认证边界：基座 Store 只保存非敏感身份，公开 `login`、`logout`、`refreshAuth`、`setAuth` 出口；`auth.required: true` 时 Runtime 提供无导航认证门禁，登录和注册使用同一个 `authPage` 组件，通过 `mode` 切换；开发者可通过 `portalSlots.authPage` 替换基础认证页。用户菜单的个人信息和修改密码不是路由页面，而是由 `portalSlots.profilePanel`/`passwordPanel` 提供内容、由基座 `BiuModal` 承载；Demo 的 `admin/admin`、通知和个人信息都放在 `src/mock/`，不能复制到 Runtime。完整字段和回退规则见 `docs/data-contracts.md`。

`BiuModal`、`BiuDrawer`、`BiuTooltip`、`biuMessage` 和 `fire()` 统一从 `@biugle/biu-ui` 暴露，默认支持 Esc、点击遮罩关闭和最多 4px 圆角；账户面板优先使用基座统一 Modal，业务只负责读取 Store 和提交接口。Runtime/Preset 内部同样只从公开包入口获取，不再维护转发入口。

## 验证

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build:demo:all
pnpm build:html-child
pnpm --filter main-a typecheck
pnpm --filter child-app typecheck
pnpm audit:unused
```

`pnpm audit:unused` 使用 Knip 检查公开包的未使用文件、依赖、导出和未解析引用。Demo 页面由 CLI 根据菜单和项目约定动态发现，不能按普通静态入口判断，因此 Demo 不纳入 Knip 的文件入口扫描；Demo 的完整性由 `pnpm verify:scenarios`、Demo 类型检查和构建检查负责。`useBiuStore` 是保留的公开兼容别名，已在 Knip 配置中明确标注，其他报告必须处理后才能合并。

手工验证 Portal A/B、React APP、Vue APP 的独立根地址、iframe 加载、主题/语言/时区/方向同步、Tabs 配置、Breadcrumb 配置、Sidebar 折叠、目录展开、多级菜单、菜单配置、新标签页、Drawer 遮罩、弹层边缘避障、iframe 点击关闭、登录/注册/首页/个人信息/修改密码 Demo 和 390px/大屏响应式。还要确认页面标题带门户/系统前缀、窄屏 Tabs 的路径省略和底部工具栏没有裁切。交付前清理 `.biu/`、`dist/`、日志、coverage、`.husky/_/`，只保留必要源码和 `.husky/pre-commit`。

每次启动会从最新的 workspace foundation `dist` 刷新项目级 `.biu/foundation` 快照，不复用旧快照；因此修改 Runtime、Preset 或 Adapter 后只需重新构建并重启服务，不会把旧别名或旧 UI 带入验收。
