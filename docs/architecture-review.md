# biu 企业级架构复审

## 结论

运行形态已明确收敛为四类：Sidebar/Topbar Portal、使用官方 preset 的独立 APP、以及 React `custom` 独立自定义 APP。它们共用 Runtime 的导航、认证、错误和更新检查契约，只有官方 Layout 是否接管页面外壳不同。

当前方案适合作为新的现代化前端基座和脚手架交付：Portal、APP 同级独立部署，Portal 只负责布局、菜单和权限编排，APP 通过环境配置的 `APP_URL` 以 iframe 加载；业务页面按 Code 平铺并按菜单/权限结果编译。核心边界清晰，后续可以在不改变业务页面目录和菜单协议的前提下扩展新的加载器。

本次复审评分为 **9.6 / 10**。本轮补齐了 Custom React Demo、认证开关、居中 Message、Drawer/fire、Shell/导航生命周期、类型化事件总线和 buildId 更新清单。企业接入阶段仍需要业务平台完成真实认证、网关安全响应头、监控平台、菜单接口和视觉截图基线；这些不应塞进基座，否则会破坏独立部署和模块化边界。

## 模块边界

| 模块                         | 负责内容                                                                  | 明确不负责                             |
| ---------------------------- | ------------------------------------------------------------------------- | -------------------------------------- |
| `@biugle/biu-cli`            | 项目生成、环境合并、菜单筛选、按需页面发现、Rsbuild 构建、端口分配        | 业务 API、登录服务、业务组件           |
| `@biugle/biu-i18n`           | 框架无关的语言资源、归一化、插值和回退                                    | 业务语言接口、业务文案资源             |
| `@biugle/biu-events`         | 框架无关的同文档类型化事件总线                                            | iframe 跨窗口通信、Origin 鉴权         |
| `@biugle/biu-bridge`         | 框架无关的跨窗口协议、Origin 校验、报文 Schema 和身份脱敏                 | React、Runtime 配置解析、业务鉴权      |
| `@biugle/biu-router`         | 菜单树、完整 URL、权限过滤、导航查询和菜单接口适配                        | 业务路由页面、权限决策服务             |
| `@biugle/biu-store`          | 偏好、认证、菜单交互和 Tabs 会话状态，可直接被业务项目使用                | Token、密码和业务服务端会话            |
| `@biugle/biu-runtime`        | Shell 编排、iframe Loader、生命周期、Bridge、SSO 身份上下文和错误边界     | 传递 Token、跨域共享内存、具体监控 SDK |
| `@biugle/biu-preset`         | 官方 Layout、Header、Sidebar、Tabs、Breadcrumb、Popover、主题和响应式 CSS | 业务页面布局、业务组件样式             |
| `@biugle/icons`              | 统一图标公开入口                                                          | Layout、业务组件实现                   |
| `@biugle/react-components`   | UI/Pro 组件、Message、Tooltip、Dialog、Drawer 和 body 挂载 `fire()`       | 官方 Layout、业务表单和业务数据        |
| `@biugle/react-form`         | react-hook-form Form、Form.Item render props                              | 业务接口和业务校验策略                 |
| `@biugle/react-table`        | Table 与 useQueryTable 查询交互                                           | 请求客户端和业务字段                   |
| Adapter                      | React 官方实现；Vue、Svelte、Angular、原生 HTML 按同一生命周期契约接入    | 修改基座 DOM 或 CSS                    |
| `src/pages` / `local-routes` | APP 业务页面、Portal 自有页面和菜单入口                                   | 复制基座实现、覆盖 `.biu-*` 样式       |
| `config/<ENV>.ts`            | 环境地址、远程 APP、权限接口和安全白名单                                  | 密钥、Token、长期凭证                  |

## 关键设计判断

### 独立部署与运行

- 每个 Portal 和 APP 都是独立 workspace package、独立端口、独立 `dist` 和独立域名。
- Portal 不打包 APP 页面源码；发布物中只保留 Portal 自己的页面和远程 APP 元数据。
- APP 可以单独启动开发，也可以由 Portal 的 `--apps` 参数并行启动后通过 iframe 联调。
- 默认路径是服务根路径和页面 Code，不引入 `/portals/<code>` 这类虚拟部署前缀。

### 按需编译

- 默认以远程菜单树、目录菜单树、权限 Code 与本地 `local-routes` 的交集决定页面注册表。
- 接口没有返回的页面不会进入编译入口；接口异常是否 fallback 由配置决定，生产建议 `fallback: false`。
- `--all` 是排查和复现开关，不是生产默认。
- 本地路由支持多个文件，业务线可以按领域拆分，不需要维护一份巨大路由文件。

### Layout 与 UI

- `sidebar`、`topbar`、`blank`、`dashboard`、`mobile` 是官方 preset；项目通过配置选择，不维护基座 JSX。
- CSS 按 tokens、base、header、sidebar、tabs、content、overlay、responsive、theme 分文件维护。
- 下拉面板保留圆角；面板内选项 hover 为直角，避免每个选项出现突兀的胶囊块。
- Header 工具区和 Tabs 都有溢出滚动控制；没有溢出时不渲染箭头。
- APP 内容占满所有剩余区域；iframe 内部 Drawer 只能覆盖 iframe viewport，APP 的 overlay 消息可以遮罩 Portal Chrome，避免误点击。
- Portal 切换和用户区是内容自适应的固定边界，工具滚动区不包含用户头像；小屏保留完整图标，不会裁切半个按钮。所有基座 Popover 点击文档空白、Escape 或 iframe 后都会关闭。

### 状态、国际化与 SSO

- Zustand 是 Portal 或独立 APP 内的共享偏好状态库，提供 locale、theme、timezone、direction、非敏感 auth 选择器。
- React 使用 `useBiuI18n().$t("中文 key")`；非 Hook 使用 `i18n.$t("中文 key")`。
- 中文 key 由独立 `zh-CN` 资源维护，英文缺失时回退英文内置资源、中文资源，最后展示 key。
- Runtime 同步设置宿主 `document.documentElement.lang`，让文案状态与浏览器语义保持一致。
- Bridge 只传用户身份摘要和偏好，不传 Token、Cookie、session id；真实 SSO 仍由同域 Cookie 或认证网关负责。
- Bridge 所有消息必须通过父窗口来源和精确 Origin 白名单验证。

## Loader 扩展策略

当前默认 Loader 是受限 iframe，生命周期统一为 `LOAD_START`、`READY`、`ERROR`、`UNLOAD`。未来如果接入 qiankun、Wujie 或同类运行时，只需新增一个 `BiuRemoteAppLoader` 实现并复用：

1. `node`、环境和远程配置解析；
2. `onLifecycle` 生命周期出口；
3. `onOverlayChange` 宿主遮罩出口；
4. `HOST_CONTEXT`、`AUTH_ACTION` 和页面 Code 上下文协议；
5. 错误边界、重试和监控事件。

因此不提前引入多套微前端运行时，也不会把 iframe 特有代码散落到 Layout 或业务页面。未来 Loader 扩展的主要工作量是新增实现、适配挂载/卸载和对应 E2E，而不是重写目录、权限、菜单或页面代码。

## 安全与生产责任边界

基座已覆盖 Origin 校验、远程地址白名单、菜单 Schema 校验、权限 fail-closed、iframe sandbox、Bridge 脱敏和错误隔离。生产平台仍必须补齐 CSP、`frame-ancestors`、`frame-src`、HTTPS、SPA fallback、缓存策略、认证网关和监控上报；这些由部署平台或业务基础设施负责，清单见 `production-checklist.md`。

## 参考项目迁移结论

- 相比 `imi`：保留“可独立发包、脚手架生成、基座动态注入”的优点，改为平级页面目录、显式环境配置和按需编译，降低字符串模板维护成本。
- 相比 `ds-web`：保留 Portal/APP 独立服务、布局、Tabs、菜单权限、全局偏好同步和 iframe 联调模式；用标准协议和 Loader 边界替代对具体业务目录的耦合。
- 相比 `design-imile` 类业务组件方案：基座只提供壳、上下文和安全边界，Table/Form/复杂 Drawer/Modal 作为独立业务组件包接入，避免基座变成业务大杂烩。
- 统一 `biuMessage` 作为跨框架顶部居中 Toast；React 项目从 `@biugle/react-components` 统一入口使用 Dialog/Drawer/fire，业务内容仍由页面或业务组件负责，iframe 内的 Drawer 不越过 iframe 边界。组件库只通过 `@biugle/icons` 暴露图标，不允许业务直接导入底层图标依赖。
- 相比参考 UI：保留侧栏、顶栏、工具区、Tabs、拖动、右键菜单、主题/语言/时区/方向切换和宿主遮罩；颜色收敛为官方浅色/深色主题，内部 CSS 不依赖参考项目源码。

## AI 协作与持续验收规则

每次变更都必须同时检查源码、生成器、Demo、文档、`.gitignore` 和构建产物；架构、协议、目录、UI、命令或安全边界变化必须同步本文件以及 `AGENTS.md`、`docs/design.md`、`docs/development.md`、`docs/usage.md`、`docs/adapters.md`、矩阵和清单。交付前至少执行 `pnpm check`、`pnpm test`、四类 Demo 构建，并完成 Portal A/B、独立 APP、深色、英文、窄屏和溢出交互回归。
