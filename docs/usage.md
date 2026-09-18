# biu 使用手册

## 创建项目

Node.js 22+，项目创建后可独立安装和运行：

```bash
biu create portal-a --type PORTAL
biu create child-app --type APP
# 交互式创建多个门户和子应用
biu init
cd portal-a
pnpm install
pnpm start
```

生成项目包含 `package.json`、README、TypeScript、ESLint、Prettier、Husky/lint-staged、`.gitignore`、环境文件、根目录 `local-routes/index.ts` 和 `src/pages`。不生成项目级 `src/i18n`、`src/shared`、`portal.ts` 或自动生成的 `.husky/_/`。

`biu init` 是面向首次使用者的一键向导：先选择默认模式（Portal 双栏、Portal 顶部导航、独立 APP 或 React Custom），再填写 Portal/APP 数量和名称；每个项目继续引导选择布局、认证开关、Tabs/面包屑，Portal 还可以选择本地 fallback 或远程菜单接口，以及是否生成 `src/portal-slots.tsx` 插槽示例。非交互场景使用 `biu create <name> --type ... --preset ...`，生成后再按项目 README 安装依赖。

## 工作区启动

```bash
pnpm start --filter main-a
pnpm start --filter main-b
pnpm start --filter child-app
pnpm start --filter vue-child
pnpm start --filter html-child
pnpm start --filter layout-custom
pnpm start --filter main-a -- --apps ../child-app,../vue-child
```

Portal 和 APP 是独立服务。`--apps` 只为本地联调启动 APP 服务并临时覆盖当前 Portal 的 `remoteApps.APP_URL`，不会把 APP 源码编译进 Portal。生产环境仍只读取 `config/<ENV>.ts`。Portal 默认从 `9001–9999` 递增，APP 默认从 `8001–8888` 递增，`dev.port` 或 `--port` 可覆盖。

Demo 地址：

| 项目            | 类型             | 默认地址                 |
| --------------- | ---------------- | ------------------------ |
| `main-a`        | Portal           | `http://localhost:9001/` |
| `main-b`        | Portal           | `http://localhost:9002/` |
| `child-app`     | React APP        | `http://localhost:8001/` |
| `vue-child`     | Vue 3 APP        | `http://localhost:8002/` |
| `html-child`    | HTML APP         | `http://localhost:8003/` |
| `layout-custom` | React Custom APP | `http://localhost:8007/` |

## 构建

```bash
pnpm build
pnpm build:demo:all
pnpm --filter main-a biu build --env dev
pnpm --filter main-a biu build --env test
BIU_ENV=pre pnpm --filter main-a biu build
```

公共配置在 `biu.config.ts`，差异在 `config/local.ts`、`dev.ts`、`test.ts`、`pre.ts`、`prod.ts`。环境优先级为 `--env` > `BIU_ENV` > 命令默认值。生产产物使用 `dist/index.html`、按 `pages/<Code>/` 的 chunk、`static/` 和 `manifest/`，Portal 与 APP 分别发布。

## 目录与路由

```text
project/
├── biu.config.ts
├── local-routes/
│   ├── index.ts
│   ├── common.ts
│   └── business.ts
├── config/
└── src/pages/
    ├── index.tsx                 # 固定根首页（/）
    ├── _internal/                # 内置/内嵌页面目录，不自动解析
    ├── PageA/index.tsx
    └── PageB/index.tsx
```

`local-routes/index.ts` 是唯一发现入口，统一导出其他路由文件：

```ts
import common from "./common";
import business from "./business";
export default [...common, ...business];
```

页面 Code 在单个项目内唯一，后端虚拟层级不进入目录。Portal 自有页面与 APP 页面都放 `src/pages`；Portal 的 APP 路由只写 `appId` 和 `appPath`，APP_URL 在环境文件：

```ts
export default {
  remoteApps: {
    "child-app": {
      APP_URL: "http://localhost:8001",
      ALLOWED_ORIGINS: ["http://localhost:8001"],
      OVERLAY_MODE: "IFRAME",
    },
  },
};
```

每个 Portal 和 APP 都有固定的根路由 `/`。CLI 默认读取 `src/pages/index.*` 作为根首页（React 为 `index.tsx`，Vue 为 `index.vue`，HTML 为 `index.html`）；它不需要在 `local-routes` 中声明，也不受 Tabs 开关影响。启用 Tabs 时，根首页会作为始终保留、不可关闭的保底页签；关闭全部页签或关闭最后一个普通页签都会回到 `/`。`src/pages/_*` 目录属于登录、错误、内嵌等项目内部页面，CLI 不会自动解析，也不会生成普通菜单或页面 chunk；需要公开为业务菜单时，请使用不带 `_` 前缀的目录并在 `local-routes/index.ts` 中显式声明。

## 多语言与全局状态

```tsx
import { useBiuI18n } from "@biugle/biu-runtime";

const { $t } = useBiuI18n();
return <span>{$t("菜单")}</span>;
```

非 Hook 使用 `import { i18n } from "@biugle/biu-runtime"` 后调用 `i18n.$t("菜单")`。基座默认中文/英文，缺少英文时回退中文，仍缺失时显示 key。语言、主题、时区、方向、菜单交互状态由可独立复用的 `@biugle/biu-store` 管理；菜单树、完整 URL 和导航查询由 `@biugle/biu-router` 管理，Runtime 只是编排层。Portal 更新后会通过 Bridge 同步给 iframe APP。

业务项目如果只需要状态或菜单能力，可以直接使用：

```ts
import { useBiuMenuStore, useBiuTheme } from "@biugle/biu-store";
import { findMenuByPath, menuPath } from "@biugle/biu-router";
```

菜单是 locale 感知资源。切换语言时基座会重新请求菜单树，并向菜单接口传递 `locale`；配置 `localeUrl` 时还会加载并注册业务语言资源。业务页面需要主动刷新时可使用：

```tsx
const { setLocale, reloadLocale, reloadMenus } = useBiuContext();
setLocale("en-US");
reloadLocale();
reloadMenus();
```

`reloadLocale(locale?)` 和 `reloadMenus(locale?)` 由 Runtime 统一管理，门户可通过 `onLocaleChange` 接入业务缓存更新。语言资源接口推荐返回 `{ code: 0, data: { key, desc, translation } }`；资源失败不影响内置回退。

## 菜单层级 URL 与导航

页面分享 URL 与 Runtime 的规范化菜单路径完全一致：优先使用后端提供的完整 `path`（必须以该菜单 `code` 结尾），没有完整 `path` 时使用菜单树的稳定 `code` 层级。不使用多语言标题，也不把同名菜单压缩成最后一级。例如：

```text
/system-config/system-basic/PageA
/enterprise-operations-center/international-governance/LongAuditPage
```

同一门户中不同目录下的 `PageA`、`Dashboard` 会拥有不同 URL；权限、审计和监控应使用完整菜单 Key（例如 `system-config/system-basic/PageA`）或同一个 `menuPath`。切换语言不会改变 URL。Portal 菜单节点的 `appPath` 仍然只是 iframe/远程 APP 内部路径，不会替代宿主菜单 URL。

菜单上的 `path` 仍可配置为 `/Login`、`/Register` 等固定业务路径，但只作为兼容别名；基座首次恢复或导航后会规范化到完整层级 URL。重复的旧 `path` 不会自动选择其中一个，必须使用完整 URL 或菜单 Key。

```tsx
const { navigate, navigateByKey, navigateByCode, resolveMenuPath } = useBiuContext();
navigateByKey("system-config/system-basic/PageA");
// code 在当前菜单树中唯一时可用；重复 code 会返回 false，避免误跳
navigateByCode("PageA");
resolveMenuPath("PageA", "system-config/system-basic/PageA");
```

独立 APP 的 CLI 合成根目录不进入 URL，因此其顶层页面仍为 `/PageA`；真实后端目录节点全部进入层级 URL。旧的“按最后一段 code 匹配”已移除，避免分享链接和权限判断落到错误目录。`menuPath()` 是 URL、菜单匹配、分享链接和监控事件共同使用的唯一规范化路径函数。

## 菜单接口

三个接口统一包装为 `{ code: 0, message?: string, data }`：Portal Tree、Directory Tree、Permission Codes。支持后端 `RESOURCE_DIR`/`RESOURCE_MENU`，基座分别转为 `DIRECTORY`/`MENU`，同时保留后端标识到 `meta`。菜单加载期间只显示 Loading；权限接口失败按 fail-closed 处理，生产建议 `fallback: false`。

## Layout 与嵌套

除 Portal 常用的 `sidebar`、`topbar` 外，独立 APP 还可选择 `blank`、`dashboard`、`mobile`；完全自行定义外壳的 React 独立 APP 使用 `custom`。Custom 不渲染官方导航，但仍保留 Runtime Context、错误边界、认证出口和更新检查。

`layout.preset` 可选 `sidebar`、`topbar`、`blank`、`dashboard`、`mobile`；`tabs` 和 `breadcrumb` 独立配置。Sidebar 底部有菜单选项、收藏、最近使用、搜索、收起/展开；收起侧栏时只显示收起/展开。菜单选项中的“顶部展示搜索按钮”开启后，复用底部搜索弹窗组件，在通知按钮左侧显示搜索按钮，并移除底部重复按钮；“隐藏菜单栏”只关闭菜单栏。收藏和最近使用由菜单 Store 管理，并按门户 Code 与环境隔离写入 `localStorage`，收藏上限 100 条、最近使用上限 10 条。开启 Tabs 后，页签顺序和当前页按同一 scope 写入 `sessionStorage`；语言、主题、时区和方向也只在当前会话内按 Portal/环境隔离。可选双栏模式，目录标题选项仅双栏模式有效。双栏模式的一级目录显示在左侧图标栏，一级目录下的目录和菜单可以同级，目录还可以继续嵌套；右侧顶部显示当前一级目录标题，右侧目录与菜单统一不显示图标，一级目录过多时可通过上下箭头滚动，标题超长自动省略并通过黑色气泡 Tooltip 查看完整内容。普通菜单展开时无图标，收起侧栏时显示统一的页面占位图标；目录图标来自配置或默认目录图标。Portal 可通过 `portalSlots.workbar` 和 `portalSlots.toolbar` 扩展或替换工具区。

Custom React 是第四种模式：`projectType: "APP"`、`framework: "react"`、`layout.preset: "custom"`。它不渲染官方导航，项目自行定义页面和外壳，但仍可使用 Runtime Context、错误边界、默认首页、认证出口、更新检测和跨应用事件总线。完整示例见 `examples/dev-demo/apps/layout-custom`。认证能力默认开启；需要完全关闭基座登录/注册入口时配置 `auth: { enabled: false }`，项目可以自行实现认证页面。

Header 的门户切换始终保留文本入口（窄屏也不改成孤立图标），不额外渲染下拉箭头；搜索/通知放在左侧，主题、语言、时区、方向和 Portal 插槽工具放在右侧，actions 与用户区相邻并按内容自适应，区域不设置最小宽度，只以 max-width 约束溢出滚动；单个图标按钮保留自身尺寸以避免图标裁切。工具区超出时显示左右滚动按钮，滚动按钮本身不展示 Tooltip；菜单、页签、用户和面包屑仅在真实溢出时显示黑色气泡 Tooltip，固定功能按钮则始终显示 Tooltip，并自动避开视口边缘。Topbar 的搜索/通知位于菜单前，Sidebar 与 Topbar 共用同一门户切换组件和内容自适应规则。

时区不再作为默认桌面工具栏固定项；门户需要展示时应通过 `portalSlots.toolbarActions` 传入，基座会在桌面工具栏和窄屏“更多操作”中复用它。Portal A/B Demo 的 `src/portal-slots.tsx` 都演示时区菜单和中间工作栏，工具栏有空间时完整展示，空间不足时才显示左右滚动控制；`toolbarIconOnly: true` 可让门户默认只展示图标，窄屏空间不足时中间 workbar 插槽会隐藏。

基座用户菜单提供个人信息、修改密码、登录、注册和退出登录的稳定动作出口。Demo 的 `main-a/src/mock/` 仅用于演示 `admin/admin`，生产项目应接入自己的 SSO/登录服务。页面级隐藏菜单、Tabs、面包屑或锁定菜单使用 `useBiuContext().setLayoutOverrides`，不把这类一次性状态写入菜单 Store。接口字段、Bridge、更新清单和脱敏规则见 [数据规范](./data-contracts.md)。

基座默认对未知深链显示 404；需要在业务页面、权限接口或自定义错误出口展示 HTTP 状态时，可使用 `@biugle/biu-runtime` 的 `BiuStatusView`，支持 400、401、403、404 和 500，并复用统一的错误详情脱敏与复制样式。认证门禁负责未登录用户的 401 场景，权限判断仍由业务或后端接口决定。

### Tooltip

菜单选项面板中的展开/折叠全部、单目录/多目录、显示/隐藏目录标题和单栏/双栏状态统一由 Menu Store 管理。双栏模式切换一级目录时，全部展开/折叠只作用当前右侧菜单区域，不会重置其他区域。

基座内置 `BiuTooltip`，默认只有文本真实溢出时才显示黑色气泡；也可以通过 `layout.tooltip` 统一调整自动 Tooltip 行为和方向：

```ts
layout: {
  tooltip: {
    onlyOverflow: true,
    placement: "TOP_RIGHT",
  },
}
```

业务组件需要单独使用时，从 `@biugle/biu-ui` 引入 `BiuTooltip`。`placement` 支持 `TOP_RIGHT`、`TOP_LEFT`、`BOTTOM_RIGHT`、`BOTTOM_LEFT`、`RIGHT`、`LEFT`。建议保留 `onlyOverflow: true`，避免短文本出现多余提示；直接使用 UI 包时额外引入 `@biugle/biu-ui/styles.css`。

弹层由基座挂载到宿主文档，并在窗口边缘自动翻转和限位；点击宿主空白区域、按 Escape、宿主失焦或切换到 iframe 时关闭。远程 APP 的 pointer 事件不会冒泡到 Portal，因此基座同时监听 iframe focus/blur，保证搜索、通知、菜单选项、收藏和最近使用弹层不会残留。

### Message 与更新检测

基座提供不依赖框架的消息 API，React、Vue、原生 HTML 页面都可以调用：

```ts
import { biuMessage } from "@biugle/biu-ui";

biuMessage.success("保存成功");
biuMessage.warning("请先选择一条记录");
const id = biuMessage.error("请求失败", { duration: 0 });
biuMessage.close(id);
biuMessage.clear();
```

消息层是顶部居中的 Toast，使用当前基座主题；不要在子应用内重复实现全局 Toast。需要发布后检查远程更新时，在 `biu.config.ts` 配置 `updateCheck: { enabled: true }`，Runtime 会建立一次 manifest 基线，并在用户导航时使用 `cache: "no-store"` 加时间戳参数检查 `buildId`；缺少 `buildId` 时回退比较原始清单文本。出现更新只提示用户刷新，不会轮询、自动刷新或强制打断用户操作；启动时网络失败会在下一次用户操作时重新建立基线。

React 项目从统一的 `@biugle/biu-ui` 入口使用独立的 `fire` 方法将内容挂载到 `body`。标准 Modal/Drawer 仍可直接使用：

```tsx
import { drawer, fire, modal } from "@biugle/biu-ui";

fire(modal)({ title: "详情", children: <Profile /> });
fire(drawer)({ title: "筛选", placement: "right", children: <Filter /> });
```

任意 React Node 也可以直接挂载并通过句柄关闭：

```tsx
import { fire, fireRender } from "@biugle/biu-ui";

const mounted = fire(<CustomPanel />);
mounted.close();

fireRender((close) => <CustomPanel onClose={close} />);
```

`fire(Component)(props)` 会兼容普通组件调用，并注入 `open` 与 `onClose`；`fireRender` 适合需要显式使用关闭回调的自定义内容。所有挂载都会创建独立 body 容器，关闭时卸载 React Root 并移除容器。`BiuModal` 和 `BiuDrawer` 只提供通用容器，不内置业务表单、表格或接口请求。

### 生命周期与应用通信

通过 `runtimeHooks` 注入生成项目：

```ts
// src/runtime-hooks.ts
import { createBiuEventBus } from "@biugle/biu-runtime";

export default {
  eventBus: createBiuEventBus(),
  lifecycle: {
    onShellLifecycle: (event) => console.log("shell", event),
    onNavigation: (event) => event.to.path !== "/blocked",
  },
};
```

```ts
runtimeHooks: {
  source: "./src/runtime-hooks.ts";
}
```

页面内使用 `const { events } = useBiuContext()`，通过 `events.publish` 和 `events.subscribe` 通信；iframe APP 使用受 Origin 校验的结构化 `APP_EVENT` 转发。

APP 默认以 iframe 加载。APP 内 Drawer/Modal 只覆盖 iframe，`useBiuOverlay()` 可让 Portal 遮罩宿主导航区。不同域名之间不传 Token、DOM 或任意 HTML。未来的 qiankun/Wujie 通过 Loader 边界增加，不改变当前默认方案。

## 清理与发布

源码保留 `.husky/pre-commit`，忽略 `.husky/_/`；`.biu/`、`dist/`、日志、缓存、coverage 和临时记录都不提交。交付前运行根目录 `pnpm verify`，并确认 Portal/APP 可以用各自根地址独立访问。
