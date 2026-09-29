# Biu 最终交付审计

本文件记录首次开源发布前的最终回归结果、交付评分、已完成事项、剩余 TODO 和 GitHub Actions 配置要求。它不是业务系统上线承诺；生产认证、权限、网关、域名和部署安全仍由项目方负责。

## 当前结论

当前约定范围的基座、公共包、Demo、CLI、文档和质量门禁已经完成，代码可进入本地验收。生产 SSO、正式域名/CSP、GitHub Secrets、npm/Vercel 发布和真实业务接口仍属于部署方职责；综合实现规范、回归证据和文档归档详见 [`docs/biu-foundation-components-capabilities.md`](biu-foundation-components-capabilities.md)。

本轮重点修复了独立 HTML APP 收起态：HTML、React、Vue APP 共用 `@biugle/biu-preset/sidebar` 和 `LayoutFrame`，收起时统一为 60px 图标栏，底部只保留一个收起/展开按钮；顶部恢复按钮只在“隐藏菜单栏”状态出现，避免两套按钮叠加导致菜单错位。组件能力页现为单一统一目录，按顺序展示完整组件效果和 UI Table API 表，不再维护 UI/Pro 两份页面；文件上传/列表/预览、Icons 搜索分类、单一 Query、Render Code 和 Watermark 包也有专属能力页。

针对组件和基座回归又补齐了受控 Table 分页、虚拟滚动分页隔离、Ellipsis 内部文本节点溢出检测，以及 Components Dialog/Drawer 的 viewport 遮罩和面板层级。浏览器验收确认 1280×720 遮罩覆盖完整视口，Drawer 面板高度覆盖视口；侧栏可在 220px 与 60px 收起态之间恢复，菜单省略文本仍由 Components Tooltip 展示完整内容。

2026-09-27 的视觉回归继续收敛了范围 Date/Time Picker 的连接符居中、`PageFilter.Item` 的浮动 label 与子控件原始尺寸、FileItem 多行信息与图标的中心线、Primary/Warning/Success 统一色板（`#1677ff` / `#faad14` / `#52c41a`）以及 Overlay Demo 操作区间距。追加修复了 RangeTimePicker 连接符按两侧实际 Select 控件行对齐的问题，并将 Popover、Popconfirm、Dropdown 统一为“浮层外壳不滚动、内部列表滚动”的契约，避免首次碰撞测量时短暂出现滚动条。浏览器实测 PageFilter TextField 为 36px、Select 为 38px，范围触发器和时间面板连接符中心偏差为 0px；底部收藏浮层在 491px 窄视口内向上展开且 bottom 为 944px，Drawer footer 显示“取消/确定”并保持独立按钮间距；Demo 生成的 `dist/` 已清理，9002 已使用重新生成的 `.biu` 快照启动。

本轮基座非菜单回归将默认认证页、Runtime 状态/错误/远程重试、Demo 登录、个人信息、修改密码和工作栏统一切换到 `@biugle/react-components` 的公开控件，并补充 Runtime 静态渲染契约测试；Icons 与 Watermark 能力页的交互控件也统一复用 `Button`、`TextField` 和 `InputNumber`。菜单树、页签上下文菜单和导航骨架继续由 Preset 维护；Portal 真实账户接口、远程业务页面、原生文件触发器和只读错误日志区保持明确边界。

2026-09-28 的交付回归补充了表格筛选 Drawer 的 body-Portal 交互保护：Drawer 内 Select 等下拉控件选择后不会误关闭父层；PageFilter 浮动 label 增加 4px 圆角且不改变子控件尺寸。ProTable 列设置现在同步持久化非固定列上移/下移后的顺序，固定列使用锁图标而不显示“锁”文字。账户面板移除内容区重复的“保存”按钮，Dialog footer 的“确定”统一触发 Portal 注册的保存/校验回调，校验失败时保持打开。Form/Table Demo API 表按单个公开属性或方法逐行列出完整类型、默认值、行为说明和可运行案例，该规则已写入 `AGENTS.md` 与双语能力规范。

本次范围控件回归进一步收敛了交互：`RangeDatePicker` 只保留连续两次日历点击，第一次开始、第二次完成，完成后再次点击会开始新范围；反向日期自动规范为起止顺序。`RangeTimePicker` 不再依赖起止切换器，直接操作左右时分秒下拉；只调整一侧时，另一侧保留已有值或填充该侧当前显示的默认值，并始终规范为时间顺序。新增前侧/后侧选择回归用例，9002 重启后浏览器实测通过。

Table CRUD 筛选区本轮按最终布局契约收敛：字段默认使用约半列宽（最大 240px），主区域最多展示两行，超出字段进入完整筛选 Drawer；更多、重置、查询三个 small 按钮固定同宽、右对齐并保持垂直居中，语义分别为 `secondary + outlined`、`secondary + contained` 和 `dark + contained`。Drawer 默认扩展到约 720px 并复用相同控件尺寸和受控状态。Toolbar 自定义动作保留图标与文本，表格默认操作列明确使用 icon-only；列设置中的 fixed 列仅显示锁图标且不可隐藏或排序，非 fixed 列通过行首上移/下移按钮调整顺序并在实际面板和表头同步。表头文字、排序/筛选/列宽操作也统一到同一中心线。

2026-09-29 的最终源码回归补强了 `TableColumnSettings` 的完整顺序状态：普通列上移/下移后再隐藏/恢复仍回到调整后的相对位置，列设置已移除全部拖动排序逻辑，新增回归用例通过。随后完成发布前清理并重新构建基础包和全量 Demo；根目录 `pnpm check`、`pnpm test`、组件浏览器回归和 `main-a` 全量构建均通过，本次根测试共 200 项通过。9001/9002 已停止并按发布前流程重新启动验证；构建后的 `dist/` 与 `.biu/` 仅作为本地验收快照保留，不提交仓库。

本次发布说明已收敛为单一 `.changeset/foundation-capabilities.md`，18 个公开 `@biugle/*` 包统一声明 minor：增加组件库、开发库等基础能力，扩展基座能力范围。包版本仍由 Changesets Version PR 统一生成，未手工修改 package.json 版本号。

## 自动化回归结果

| 检查项                                        | 结果                                                             |
| --------------------------------------------- | ---------------------------------------------------------------- |
| 公共包构建和类型检查                          | PASS                                                             |
| Portal A/B、React、Vue、HTML、Custom 类型检查 | PASS                                                             |
| 单元测试                                      | PASS，200 个测试                                                 |
| ESLint                                        | PASS，无 warning                                                 |
| Prettier                                      | PASS（本次定向格式修复后）                                       |
| Knip                                          | PASS                                                             |
| 生产依赖漏洞审计                              | PASS，未发现已知漏洞                                             |
| CLI/project 场景                              | 历史回归 PASS，100 个场景；本次沙箱重跑受 IPC 限制               |
| 代表性构建                                    | PASS，7 个场景                                                   |
| 全量 Demo 构建                                | PASS，Portal A/B、React/Vue/HTML APP、Custom                     |
| 公开包本地打包检查                            | PASS，18 个包写入临时目录，未执行 publish                        |
| 本地 HTTP 冒烟                                | PASS，9001/9002 重启后浏览器验证                                 |
| 中英文资源 key                                | PASS，默认资源由同一 `MessageKey` 类型约束，并有实际调用回归测试 |
| 旧 fixtures、旧布局名、旧品牌遗留             | PASS，未发现源码/文档引用                                        |

## 已完成 checklist

- [x] Portal Sidebar 与 Topbar 布局
- [x] 独立 React、Vue、HTML APP 接入
- [x] React Custom 独立自定义模式
- [x] 完整菜单层级 URL、权限过滤和重复 Code 隔离
- [x] Zustand Store：偏好、认证、菜单、Tabs 会话状态
- [x] `@biugle/biu-i18n`、`@biugle/biu-events`、`@biugle/biu-bridge`、`@biugle/biu-router`、`@biugle/biu-store`、`@biugle/icons`、`@biugle/render-code`、`@biugle/watermark`、`@biugle/react-components`、`@biugle/react-form`、`@biugle/react-table`、`@biugle/http`、`@biugle/tanstack-query` 独立包
- [x] Components 统一目录与 API 表、Form.Item render props、useQueryTable、文件上传/预览、图标搜索分类和单一 Query 标准包
- [x] Runtime/Preset/Demo 从公开包入口使用能力
- [x] Render Code 原生 QR/Barcode 导出、下载、img base64 降级和 Demo；Watermark update/destroy、Logger 联动与 `layout.watermark` 基座接入
- [x] Message、Tooltip、Modal、Drawer、`fire()`、错误边界、复制详情
- [x] 基座非菜单页面统一复用 TextField、Button、Result、Alert 和 biuMessage；Demo 账户面板同步使用公开控件
- [x] 生命周期、导航钩子、应用通信、Origin 校验 Bridge
- [x] 运行时更新检查：启动建立基线，用户操作时单次检查，不轮询、不强刷
- [x] Changesets、npm 发布 workflow、Vercel 原生 Git 部署说明、Demo 构建 workflow、CI workflow
- [x] ESLint、Prettier、EditorConfig、Husky、lint-staged、Knip
- [x] 中文/英文 README、文档、数据规范、生产 checklist
- [x] Logo、截图、Issue/PR 模板、LICENSE、贡献与安全策略
- [x] Demo fixtures 和无效旧 workspace 配置清理
- [x] 生成物清理后重新构建验证
- [x] 浏览器回归：Dialog/Drawer 遮罩、层级、全视口尺寸，侧栏收起/恢复、底部 Popover 避障和 Ellipsis Tooltip
- [x] 2026-09-27 视觉回归：范围连接符、PageFilter 控件尺寸、文件行中心线、Primary/Warning/Success 色板、Drawer footer 和统一组件 API 表
- [x] 2026-09-28 交付回归：筛选 Drawer 内 Portal 控件交互、PageFilter label 圆角、ProTable 非固定列排序与固定列锁图标、账户 Dialog footer 提交契约、Form/Table 逐属性 API 文档表

## 待完成 TODO

### 首次提交前

- [ ] `git add` 后检查 staged diff，确认没有 Token、Cookie、密码、内部域名或本地用户数据
- [ ] 创建首个 `main` commit 并推送到 `git@github.com:biugle/biu.git`
- [ ] 在 GitHub Settings/Actions 中确认 Actions 已启用
- [ ] 配置 `NPM_GIT_BIUGLE`；Vercel 使用原生 Git，无需 Vercel Token
- [ ] 设置 `main` 分支保护并要求 CI `validate` job 通过

### 本轮实现缺口

无。约定的 UI、Pro、Form、Table、HTTP、i18n、Query、Store、Render Code、Watermark、Logger、基座回归、Demo 文档和自动化门禁均已完成；Playwright 视觉自动化属于后续 CI 增强，不阻塞本地验收。

### 开源增强项

- [ ] 启用 Dependabot 或 Renovate
- [ ] 启用 CodeQL
- [ ] 启用 Secret Scanning 和 Push Protection
- [ ] npm 后续切换 Trusted Publishing 与 provenance
- [ ] 补充 Playwright 浏览器级自动化验收

### 生产接入项

- [ ] 接入真实 SSO、认证、权限和菜单接口
- [ ] 配置生产 HTTPS、CSP、`frame-ancestors`、SPA fallback
- [ ] 配置正式域名、CDN 缓存、旧资源保留和回滚策略
- [ ] 接入生产监控 `onMonitorEvent` 或 `window.__BIU_MONITOR__`
- [ ] 验证远程 APP 的 `APP_URL` 与 `ALLOWED_ORIGINS` 精确匹配

## GitHub Actions 配置

必须配置的 Repository Secrets：

| Secret           | 用途                                                                    |
| ---------------- | ----------------------------------------------------------------------- |
| `NPM_GIT_BIUGLE` | Changesets 发布 `@biugle/*` 包的 npm granular token，建议只授予发布权限 |
| `GITHUB_TOKEN`   | GitHub Actions 自动提供，无需手工创建                                   |

Vercel 使用原生 Git 部署，不需要 `VERCEL_PROJECT_ID` 或其他 Vercel Secret。需要预先创建以下六个 Project，并分别绑定域名、构建命令和产物目录：

```text
biu-portal-a
biu-portal-b
biu-react-app
biu-vue-app
biu-html-app
biu-custom-app
```

外部 Fork PR 不会获得 npm 发布 Secret。发布前还需要确保仓库存在首个 `main` 提交，Actions 启用且分支保护要求 CI 通过。

## 评分

| 维度                | 得分 | 说明                                                                   |
| ------------------- | ---: | ---------------------------------------------------------------------- |
| 架构边界与可扩展性  | 9/10 | 包边界清晰，Runtime/Preset 保留统一入口；生产插件生态仍可继续扩展      |
| 多框架兼容          | 9/10 | React/Vue/HTML/iframe 已验证，其他框架依赖 Adapter Contract            |
| 路由、菜单与权限    | 9/10 | 完整链路 URL、权限过滤和 store 隔离已覆盖                              |
| 状态与通信          | 9/10 | Zustand、事件总线、Origin 校验 Bridge 已覆盖                           |
| UI 基础能力         | 9/10 | Message、Tooltip、Modal、Drawer、fire 和错误态已具备                   |
| CLI、构建与开发体验 | 9/10 | init/create、端口治理、Rsbuild、场景工厂已验证                         |
| 测试与质量门禁      | 9/10 | 类型、200 项单测、Lint、格式、Knip、100 场景和代表性浏览器回归均通过   |
| 发布与 CI/CD        | 8/10 | Changesets/Actions 完整，尚未在真实 GitHub/npm/Vercel 账号上跑正式发布 |
| 安全边界            | 8/10 | 前端敏感信息边界和依赖审计完成，生产 CSP/SSO/网关仍需接入              |
| 文档与开源资产      | 9/10 | 中英文文档、模板、Logo、截图和清单齐全                                 |

**总评分：88/100。**

扣分主要来自真实发布账号、生产部署、安全策略和浏览器级自动化尚未执行；不代表当前源码质量门禁失败。

## Agent 归档规则

- 基座公共能力必须从对应 `@biugle/*` 公共包公开入口获取，禁止 Runtime/Preset/Demo 复制第二套实现。
- HTML、Vue、React APP 统一使用 `LayoutFrame`/Preset；差异只允许来自 Adapter 和业务页面，不能复制菜单、收起按钮或响应式 CSS。
- 修改 Runtime、Preset、CLI 或公共包后，必须重新 `pnpm build` 并重启本地验收服务；`.biu` 是临时快照，不提交。
- 新增页面或 UI 文案必须同时更新中英文资源，并通过资源 key 回归测试。
- Demo mock 只放 `examples/dev-demo/apps/*/src/mock/`；基座只提供生产级契约，不内置 Demo 账号或业务数据。
- 交付前必须执行 `pnpm check`、`pnpm test`、`pnpm lint`、`pnpm format:check`、`pnpm audit:unused`、`pnpm verify:scenarios` 和 `pnpm build:demo:all`；本轮源码回归直接通过 200 项单测、全量 Demo 构建、类型、Lint、格式和 Knip，9001/9002 已重启并完成浏览器验证。FormGroup 分区、Table Biu 筛选面板、范围控件、Alert/Message、双向 Textarea 调整、Select 长标签 Tooltip、Divider、Tree/Transfer、PageFilter 原始尺寸保持、文件行中心线、非菜单账户页面组件复用、筛选 Drawer Portal 交互、列设置排序、账户 Dialog footer 提交和窄屏浏览器回归已纳入证据。Chart、RichText、Editor、Preview Server 按已确认范围保持未实现且不进入基础包。
- 清理只针对明确生成物和临时目录；不要在服务运行中删除 `.biu`/`dist`，不要删除 `node_modules`，不要 reset 或 checkout 用户工作区。
