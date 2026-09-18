# 企业级场景与迁移验证矩阵

本文将 `imi`、`ds-web`、`design-imile` 中与企业级前端开发相关的能力，映射到 biu 的边界，重点验证后续迁移业务是否需要改架构。

## 1. 参考能力映射

| 能力                  | 参考项目体现                         | biu 当前承载方式                                                                                            | 结论                             |
| --------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------- | -------------------------------- |
| 基座脚手架            | imi 可独立发包并生成项目             | `biu create` 生成 PORTAL/APP 独立项目、环境文件和目录约定                                                   | 满足                             |
| 主应用/子应用         | ds-web Portal 与 APP 分开服务和部署  | Portal、APP 同级、独立端口/域名、Portal 通过环境 `APP_URL` iframe 加载                                      | 满足                             |
| 页面平级              | 业务页面最终按 Code 定位             | Portal/APP 业务页面统一 `src/pages/<CODE>`；固定根首页使用 `src/pages/index.*`，后端虚拟层级只参与菜单/权限 | 满足                             |
| 菜单与权限            | ds-web 目录、菜单、组件权限          | 三类接口协议、Tree/Code Schema 校验、目录/菜单过滤、组件 Hook                                               | 满足                             |
| 权限 fail-closed      | 企业门户不允许权限失败时展示全部菜单 | 配置权限接口失败时不渲染未过滤 fallback；可用 `fallback: false` 严格阻断                                    | 满足                             |
| 运行时动态布局        | imi/ds-web Layout 与全局状态         | `@biugle/biu-preset` 官方 preset，项目只配 `layout` 数据和开关                                              | 满足                             |
| 多语言/时区/方向/主题 | ds-web 全局状态和 iframe 上下文      | Runtime 状态 + `HOST_CONTEXT` 的 LOCALE/TIMEZONE/DIRECTION/THEME                                            | 满足                             |
| 远程 APP              | ds-web iframe、生命周期和遮罩        | 默认 iframe，Origin 校验、READY/ERROR/UNLOAD、宿主 Chrome 遮罩                                              | 满足                             |
| Loader 扩展           | 未来可能需要 Wujie/qiankun           | `BiuRemoteAppLoader` 边界和生命周期已抽象，当前不引入额外运行时                                             | 可扩展                           |
| 页面框架              | React 为主，业务需要 Vue 等          | React 官方 Adapter、HTML 内置 Adapter；Vue 示例；Svelte/Angular 契约                                        | 满足                             |
| 业务组件              | design-imile Table/Form/Drawer/Modal | 业务组件作为独立包接入页面，基座只提供 Overlay/Context/权限边界                                             | 架构满足，组件包另建             |
| 请求、Mock、监控      | imi 插件生态、ds-web Sentry          | 基座提供导航/远程/错误监控出口；请求、Mock、Sentry 由业务包接入                                             | 边界清晰                         |
| 资源发布              | 内容 hash、静态资源独立管理          | Rsbuild 按 Code 目录产出，`static` 单独复制，Manifest 可追踪                                                | 满足                             |
| 工程模板              | 独立脚手架和团队规范                 | `biu create` 生成 package、校验、Husky、环境文件和 `src/pages`；Demo workspace 共享包可直接引用             | 满足                             |
| SSO 身份共享          | 多域名单点登录                       | 通过 Cookie/网关维持登录态，Bridge 只同步非敏感用户身份并提供登录动作出口                                   | 架构满足，认证服务接入由平台负责 |

## 2. ds-web 典型业务场景推演

| 场景                        | 操作链路                                                         | 是否满足                                                      |
| --------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------- |
| 只开发一个 APP 页面         | `pnpm start --filter child-app`，点击本地菜单进入页面            | 满足，APP 独立基座可运行                                      |
| 开发 Portal 自有页面        | `src/pages/<CODE>` + `local-routes/index.ts`                     | 满足，不依赖 APP 服务                                         |
| Portal 下加载 React APP     | Portal 菜单 `target: "APP"`，环境文件解析 `APP_URL`，iframe 加载 | 满足                                                          |
| Portal 下加载 Vue 3 APP     | Vue APP 自定义 Adapter，Portal 不感知框架                        | 满足，已有 Vue 3 Demo                                         |
| 子应用独立访问              | APP 根域名直接启动，使用自己的 Layout                            | 满足，已实测；实际端口以启动日志为准                          |
| 一个 APP 被多个 Portal 使用 | 各 Portal 在自己的环境配置中指向相同 APP_URL                     | 满足，Portal 上下文独立传入                                   |
| 只编译后端返回页面          | 编译期菜单 Tree/权限 Code 计算白名单                             | 满足                                                          |
| 后端返回空菜单              | 空树作为有效结果，不回退全量页面                                 | 满足                                                          |
| 后端接口暂不可用            | 本地 fallback 或 `fallback: false`，按环境选择                   | 满足，生产可 fail-closed                                      |
| 本地开发不依赖后端          | `local-routes/*.ts` 作为本地路由                                 | 满足                                                          |
| 一键排查全部页面            | `biu dev/build --all`                                            | 满足                                                          |
| 多标签业务                  | `tabs: true` 后拖动、右键、关闭                                  | 满足，默认关闭                                                |
| 子应用 Drawer               | APP `useBiuOverlay()` 报告 `HOST_CHROME`                         | 满足，已实测 Portal 导航区遮罩；任意弹窗内容仍由 APP 自己渲染 |
| Portal 切换语言             | 下拉选择并向激活 iframe 重发上下文                               | 满足，已实测 `en-US` 到 iframe                                |
| 大量页面开发                | 只生成被选 Code 的动态 import，未选页面不进依赖图                | 满足；`--all` 为排查例外                                      |
| 生产发布/回滚               | Portal 和 APP 各自 build、各自域名、各自 dist 和 hash 资源       | 满足                                                          |

## 3. 企业级交付边界

基座已经能承载 ds-web 类门户迁移，迁移时业务主要需要做四类工作：

1. 把旧菜单入口映射为统一 `local-routes/index.ts` 和后端 Tree/Permission Code；
2. 把 Portal 自有页面移动到当前 Portal 的 `src/pages/<CODE>`；
3. 把 APP 页面移动到平级 `src/pages/<CODE>`，保留业务组件和 API；
4. 把原有组件库、请求、Mock、监控能力作为业务/团队包接入 `BiuFrameworkAdapter`、`BiuPageContext` 和 `useBiuPermission`。

不需要迁移或复制基座 Layout、Tabs、语言、主题、时区、方向和 iframe 遮罩实现。真正上线仍必须由平台补齐认证、网关 CORS/CSP、后端接口鉴权、监控供应商、真实 E2E 和发布回滚策略。

## 4. 风险结论

- 当前最大的非阻断增强项是浏览器 E2E 和真实后端 Schema 合约测试；架构已留好边界。
- qiankun/Wujie 不提前安装是正确取舍；未来只新增 Loader 包，不改菜单协议和业务目录。
- design-imile 类复杂组件不应塞进基座，否则会把基座变成业务组件库并增加升级耦合。
- APP_URL 必须继续由各环境文件维护，不能回到后端返回地址，否则会削弱发布可控性和安全白名单校验。
