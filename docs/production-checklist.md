# Biu CLI 生产交付检查清单

这份清单用于 Portal 和独立 APP 上线前验收。`biu` 负责生成前端产物和运行时边界；认证、接口网关、HTTP 安全响应头和部署平台仍由业务系统负责。

## 必须项

- `biu.config.ts` 明确配置 `projectType: "PORTAL"` 或 `projectType: "APP"`；Portal 必须有 `portal.code`，APP 不得配置 `portal`。
- 四种模式分别验收：Portal Sidebar、Portal Topbar、独立 APP preset、React Custom APP；Custom 不应渲染官方导航，但 Runtime Context、错误边界、认证出口和更新检测仍必须可用。
- 明确 `auth.enabled`：`false` 时不能渲染基座默认登录/注册页；自定义认证项目必须自行接入登录态和回调。
- 每个环境都有独立的 `config/<ENV>.ts`，生产构建明确执行 `biu build --env prod`。
- Portal 的每个 `APP` 路由都能在当前环境找到 `remoteApps[APP_ID].APP_URL`。
- 所有跨域 `APP_URL` 都配置 `ALLOWED_ORIGINS`，并且至少包含 APP 的精确 Origin；不要使用 `*`。
- 菜单、目录和权限接口在生产环境配置 HTTPS 地址；接口响应统一为 `{ code, message, data }`。
- 菜单和目录接口必须读取并使用 `locale` 查询参数；如配置 `localeUrl`，验证语言资源响应和缺失资源时的英文/中文/key 回退；验证 `reloadLocale`/`reloadMenus` 钩子不会破坏当前稳定菜单 Key。
- 权限接口启用时，接口失败必须阻断受保护导航；不要通过无权限 fallback 继续展示菜单。
- 菜单和权限加载期间必须只展示基座 Loading；首屏不得先渲染本地菜单再被远程结果覆盖。
- 生产菜单接口不需要本地 fallback 时配置 `menu.fallback: false`，避免接口异常时编译全部本地页面。
- Portal 和 APP 分别部署，分别拥有自己的域名、`dist/index.html` 和静态资源目录。
- 生产服务器设置 `Content-Security-Policy`、`frame-ancestors`、`X-Content-Type-Options: nosniff`、`Referrer-Policy` 和 HTTPS；`frame-src` 只放行业务 APP 域名。
- 不把 Token、Cookie、密钥或长期凭证写入 `menu.headers`、环境配置或前端页面代码。前端包内配置都会被用户看到。

## 构建与产物

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm audit:unused
pnpm --filter <project> biu build --env prod
```

上线前确认：

- `dist/index.html` 存在且只引用当前构建的 hash 资源；
- `dist/static` 中的团队静态资源没有覆盖 Rsbuild 生成的 `css` 或 `assets` 产物；
- `dist/manifest/index.json` 与 `manifest/routes.json` 的环境、Portal Code、页面 Code 正确；
- `manifest/routes.json` 包含当前构建 `buildId`，不同构建不会复用旧清单；
- APP 直接访问根域名和页面路径可用；Portal 通过 `APP_URL + appPath` 加载同一个 APP；
- 页面不存在、菜单接口失败、权限接口失败、APP 超时和 iframe 重试均有可见错误态；
- 页面渲染错误会被 `BiuErrorBoundary` 隔离；生产入口必须配置 `onMonitorEvent` 或 `window.__BIU_MONITOR__`，并验证 `ERROR`、`NAVIGATION`、`REMOTE_APP` 事件能进入监控平台；基座不包含具体监控 SDK。
- APP 如果会收到无 referrer 的嵌套请求，必须配置 `hostOrigins` 精确白名单；来源无法验证时 Runtime 应拒绝宿主消息。
- 发布平台配置 SPA fallback，使 `/PageCode` 刷新时仍返回 `index.html`。
- 生成入口注入的项目 `package.json.version` 已校验；Portal 的 `V` 来自主 Portal package.json，远程 APP 的 `S` 来自 iframe 通过 Origin 校验的 `BIU_READY.VERSION` 握手；缺失值显示 `-`，不使用括号或竖线。
- Bridge 报文不包含 Token 或 session id；子应用可通过 Zustand 选择器读取 Portal 同步的偏好状态。
- 生成项目已执行 `pnpm install --frozen-lockfile`、`pnpm check`、`pnpm lint` 和 `pnpm format:check`；Husky 不依赖开发者本机的全局工具。
- 低于 800 行的基座文件约束已通过源码行数检查；新增超长模块必须先拆分职责。
- 如启用 `updateCheck`，确认生产服务器可访问 `manifest/routes.json` 且缓存策略允许读取最新内容；该能力只在启动和用户操作时检查，不替代 CDN 缓存失效和灰度发布策略。
- 全局 Message 必须通过 `@biugle/biu-runtime` 调用并在深浅色、英文和窄屏下检查；不得把业务敏感信息放入常驻通知内容。
- Message 必须验证顶部居中、四种类型、堆叠、关闭、`duration=0` 和 `clear`；React `fire` 必须验证 `fire(modal)`、`fire(drawer)`、`fire(<Node />)`、`fireRender(close => ...)`、句柄关闭、Escape、遮罩和销毁。
- 验证 `runtimeHooks` 的 Shell 生命周期、导航取消、导航完成和 `events.publish/subscribe`；嵌入 APP 需验证 `APP_EVENT` 只在白名单 Origin 下转发。
- Portal 自定义工具若需要移动端能力，必须使用 `portalSlots.toolbarActions`，并验证桌面完整展示、窄屏折叠入口和滚动边界；时区/部门/角色等业务数据留在门户或后端，不写入基座默认工具。
- 登录、注册、个人信息和修改密码只由 Demo mock 演示；生产必须接入 SSO/业务服务，并确认 `BiuAuthContext.extra` 不包含 Token、Cookie、密码或 session id。
- `docs/data-contracts.md` 与菜单、通知、用户、Bridge、更新清单及错误字段实现保持同步。

## 联调与回滚

- 先单独启动 APP，再启动 Portal；Portal 不编译 APP 页面。
- 使用 `pnpm start --filter <portal> -- --apps ../<app>` 做本地联调。
- 工作区首次安装后先执行一次 `pnpm build` 生成本地基座包，之后可直接使用 `pnpm start --filter <portal-or-app>`；独立生成项目安装依赖后直接执行自身 `pnpm start`。
- 联调时确认 CLI 输出的每个 APP 实际端口与 Portal iframe 请求地址一致；端口占用时由 CLI 递增分配并仅覆盖本地运行配置。
- 同一环境的 Portal 与 APP 必须成组发布；若 APP 回滚，Portal 的 `APP_URL` 和 `ALLOWED_ORIGINS` 必须仍然匹配。
- 资源使用内容 hash，部署时保留旧资源一段时间，避免 Portal HTML 和 CDN 缓存中的旧引用短暂失效。
