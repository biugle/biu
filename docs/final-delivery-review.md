# Biu 最终交付审计

更新日期：2026-11-02。本文只记录发布审计、验证证据、优化清单和外部接入待办；架构、组件/API、Demo 与实施约束见[综合能力规范](biu-foundation-components-capabilities.md)，操作手册见[文档中心](README.md)。

## 当前结论与证据边界

本轮保持功能设计、路由和公开 API，完成瘦身、隐藏问题修复、模块解耦与双语文档完善。最新完整 `pnpm verify` 通过 496 项测试与全部交付门禁；六种运行形态已重启，本轮浏览器重点回归及重建后最终复验通过。

生产旧 hash 缓存、真实 SSO/CSP/监控和 30 分钟浏览器 heap 仍缺目标环境证据。最近一次公开 GitHub API 检查（2026-10-30）确认 `main.protected=false`、private vulnerability reporting 的 `enabled=false`；这两项及安全维护版本政策必须在本次发版前由管理员落实。

## 瘦身、排错与模块优化清单

| 范围                  | 完成项                                                                                                              | 保持的边界                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 核心与编排            | Preset 直接消费 I18n/Router/Store 公共入口；File/Preview 抽共用类型；增加包、Demo 与源码循环检查                    | 核心包独立复用，Runtime 兼容出口与公开类型保留    |
| 认证与偏好            | auth-store 单一身份来源；旧偏好认证读写兼容投影；缺失缓存保持配置；只持久化四项偏好                                 | 登录/退出/更新同步，身份及凭证不写偏好存储        |
| 语言                  | 业务 localeUrl 叠加内置资源；同语言异步刷新重译 memo 文案；补“首页”内置资源、菜单/API/案例翻译和 Form 控件 Provider | 中文原文 key，addLocale 公开替换语义不变          |
| HTTP/Query/Table      | 循环序列化、异常列表与 total 归一；不同二进制请求体按身份区分                                                       | 有效数据、公开序列化标记与正常请求行为兼容        |
| Router/Runtime/Events | 超时覆盖 JSON 响应体；并发更新单次提示和基线竞态；旧 unsubscribe 与 onError 隔离                                    | 导航、更新提示和事件 API 不变                     |
| CLI                   | 真实安装包快照、实际模板版本、React Query peer、JSON dev manifest、参数缺值、filter 转发与子进程清理                | create/init/start/build、7种preset和5环境保留     |
| 页面与测试            | 4大Demo页与4大测试按职责拆分，共享fixture；逐项保持API和场景；补展示7条Form布局API                                  | 单路由、原交互与展示顺序保留                      |
| CSS                   | 5个超长CSS按归属拆分；去掉123条已覆盖声明和13处important；Table按原顺序打包一个CSS入口                              | 主题、尺寸与可定制行为保留，Preset沿用规定文件    |
| 文档与README          | 删除6份重复阶段文档，统一综合规范与审计；双语关系图、使用说明与5张脱敏实拍；替换8份旧图                             | 公开API手册和有效历史事故证据保留                 |
| Actions/脚本          | 保留CI/CodeQL/Release/手动Demo四种职责，取消重复push构建；CI prepare避免重复build；去旧软链接夹具和baseline         | 依赖安装脚本、本地prepare、全部发布与交付门禁保留 |

未发现可无损删除的整份无调用方脚本；实际无用分支与重复记录已删除。所有 JS/JSX/MJS/TS/TSX/CSS 统一不超过 800 行，无豁免。JSON 语言资源和锁文件属于数据，保留完整结构而不为凑行数拆分。中英文资源增加是补齐原先缺失的可见文案，代码拆分后的文件数增加对应清晰职责。

浏览器补充排错：Demo 翻译递归曾将 Dayjs 日期范围实例复制为普通对象，导致 DatePicker 崩溃；现保留实例原型/身份，并加入两项回归。共享 LayoutFrame 的 60px 收起栏统一为底部单一恢复按钮，完全隐藏时仍使用导航外的顶部恢复；展开/隐藏/恢复与公开受控布局参数保留。通知正文、真实 mock 值和英文长标题边界案例属于已明确说明的数据/展示例外。

本次发版复核新增修复：语言切换不再重置更新清单基线，提示使用当前语言；卸载、禁用或更换清单 URL 后的迟到响应不再提示。ArrayBuffer、DataView 和 TypedArray 上传使用 client 内对象身份，不误取消不同实例，也不遍历大数组字节；相同实例仍去重，公开序列化输出不变。Release 使用 `queue: max` 保留最多 100 个 pending，后续普通 push 不再替换排队的 Release PR 合并运行；目标 GitHub Actions 的实际发布运行仍需平台验收。

## 本轮全仓扫描新增修复

10 月 30 日从干净的已提交基线再次扫描，保持功能设计和公开 API；没有修改 CSS。实际修复以下边界：

- Bridge 对显式空/非法目标 Origin 不再回退到未校验的父站点；未知宿主的 Overlay 不发送通知。
- APP 收到宿主 APP_EVENT 后只投递本地事件总线，避免回声；本地业务事件仍正常转发。
- iframe HOST_CONTEXT 从唯一 Auth Store 同步当前身份；登录、刷新、退出均发送脱敏身份，不重建 iframe。
- createBiuStore 保留 Zustand 稳定、包含 action 的初始快照，避免 SSR/hydration 得到缺失 action 或不稳定对象；reset 工厂保持原语义。
- Demo 翻译递归的 children 只遍历一次，消除 React key 警告、保留嵌套 code/pre 原文并减少重复翻译。独立 fire 根、标准页、控件和动态回调显式接收当前 locale；类型筛选文案改为“负责人类型”；Table 英文列宽、筛选和排序标签补齐单词间隔，中文标签与 localeText 覆写保持兼容。

文档与开源检查：18 个公开包补齐 repository/directory、homepage、bugs 元数据，真实 tarball 门禁校验这些字段。唯一 Changeset 现覆盖 18 个公开包的 patch，正文仍为“性能与整体收缩，文档优化。”；未执行版本变更或发布。92 份 Markdown 的本地链接、锚点、语法、内部参照名及中英文契约复核完成；10 套文档示例和 37 行 HTTP 字段案例通过 TypeScript 校验。

API 数据按实际源码纠错：删除虚假 XHttpClass.config；纠正 HTTP 取消参数、DELETE 请求体、Header 替换、I18n 链式返回与资源注册、Query 回调及默认值；Table 修正 56 个类型字段，并将尺寸、EditableCellConfig、ButtonListItem 和查询上下文归回正确模块。实际执行的 ComponentUI/Form/Table 共 1258 个展示行、1092 个独立组件/属性组合，最终可翻译文案缺失为 0；另有静态对象式 API 提取补充覆盖。该统计不等同每个公共包全部 API 的自动快照。

main-a 中英文资源各 3411 条，英文资源从本轮基线 2742 条增至 3411 条，净增 669 条，补齐原缺失的 144 个中文 key；child-app 补齐 PageB。故意缺失 key 案例、可运行代码、真实 mock 数据和明确的长标题边界案例保留原文。资源唯一键、中英文键一致、英文值与插值校验接入现有 Demo 测试；失效说明资源和临时审计文件已删除。

## 2026-11-02 拉取合并复核

本地提交 `691b1b93137fe3444b3234600c88135066cd2945` 重放到上游发布提交 `842274816d18a2d9b60fead5c72c54f71ea0dcdc`。708 个源码与测试文件逐 blob 核对，完整保留本地提交内容；18 个公开包保留上游版本和包依赖，13 份上游 CHANGELOG 保留。上游已消费旧的 12 包 Changeset，新建 `.changeset/performance-and-docs-followup.md` 承接本地新增修复与元数据：18 包 patch，正文仍为“性能与整体收缩，文档优化。”。不回退已发布版本，也不执行 npm publish。

首次完整验证的 496 项测试通过，但生产审计发现 [GHSA-mrwp-f3q8-3g9p](https://github.com/advisories/GHSA-mrwp-f3q8-3g9p)：锁定的 `follow-redirects 1.16.1` 属于受影响版本。根 workspace override 与锁文件已改为修复版 `1.16.2`；Axios 版本和业务 API 保持不变。该根配置只约束本仓库，不会随 npm 公共包自动约束下游；下游若锁定 `1.16.0` / `1.16.1`，须更新自己的锁文件或 override 并重新审计。

修复后于 **2026-11-02 09:48:16–2026-11-02 09:50:38（UTC+8）** 重新完整执行 `pnpm verify`，exit 0、496/496 通过，0 失败/取消/跳过，生产依赖审计无已知漏洞。18 个实际 tarball、2 个 CLI 安装消费者、100 个创建输入、7 种 preset/五环境、六 Demo 构建及其余交付门禁均通过。之后仅更新本双语审计；提交前检查 staged diff，无凭证、私密数据、冲突标记或生成物。

停服清理 12 个 Demo 生成目录后重启六个验收端点；HTML 与 manifest 均为 200，JSON MIME、appId 和 local 环境正确。临时验证日志和结果文件在归档后删除，运行所需忽略快照保留。10 月 30 日的浏览器、评分及版本表继续作为带日期的历史证据；本段不新增生产环境或长期 heap 验收结论。

## 本次独立复查归档

复查日期：2026-10-30（Asia/Shanghai）。验收基线为 HEAD `b4907166c375f0406329bd48dba7531b883cf0f1` 加当前未提交修改，不是已发布版本。本次发现并修复两个遗漏边界：

- 认证清空后旧身份复活：配置只用于首次初始化，Shell 与 iframe 后续只读唯一 Auth Store；`clear()` / `setAuth(undefined)` 保持空身份，required auth gate 正确显示，旧 HOST_CONTEXT 不覆盖新身份，iframe 不重建。
- ReactNode 表头：筛选、列宽、列设置及 CSV 表头读取嵌套文本，空/图标/不可读取标题使用列 key；不执行自定义组件，保留原表头、CSV 单元格值与转义规则。既有尺寸案例改用同文案 span，API 表、中英资源、README 和综合规范同步。

新增 7 项回归（Runtime 2 项、Table 5 项）。本次完整门禁实际执行于 **2026-10-30 20:35:17–2026-10-30 20:37:36（UTC+8）**；结果见下表，不能与此前 489 项记录混用。源码、脚本、Demo、manifest 和工作流相对该 HEAD 的差异指纹（含新增测试）为 SHA-256 `d15fc1eddc7a7e1f02c5e63685bf7baff6754f8972c40c97b98f31db14595c8b`。之后只更新交付档案与本地验收截图。

公开 GitHub API 本次再次返回 200：仓库公开、默认 main、`main.protected=false`、private vulnerability reporting `enabled=false`。没有读取 Secret 值或修改平台设置。11 条未闭环 TODO 已补充适用阶段、建议负责人角色和完成证据；评分保持 90/100。

## 最终验证记录

前次发版复核通过 477 项测试，前次全仓扫描新增 12 项后完整 `pnpm verify` 通过 489 项；其一次中间格式失败已修正并保留为历史记录。本次独立复查再新增 7 项，最终完整 `pnpm verify` 以 **exit 0** 结束，**496 项测试全部通过，0 失败、0 取消、0 跳过**。公共包/Demo 类型、18 个真实 tarball 元数据/exports、两个仓库外 CLI 消费项目、100 个创建输入、7 种 preset 与五环境、六 Demo 构建及体积、ESLint/Prettier/Knip、生产依赖审计和 diff 门禁全部通过。随后仅更新双语交付审计与本地验收截图，补跑格式、本地链接、产物和 diff 检查。

| 最终 checklist                                   | 结果                                                                                             |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| 公共包与六个 Demo 类型检查                       | PASS                                                                                             |
| 18 个公开包实际 tarball、exports 与污染检查      | PASS                                                                                             |
| 2 个仓库外 CLI 安装消费者，实际 dev / prod build | PASS                                                                                             |
| 公共包、CLI、发布来源、模块边界与 Demo 回归      | 496 / 496 PASS                                                                                   |
| 100 个 CLI 创建输入、7 种 preset、五环境场景     | PASS                                                                                             |
| ESLint、Prettier、Knip、git diff --check         | PASS                                                                                             |
| 生产依赖审计                                     | 无已知漏洞                                                                                       |
| 18 公共包、6 Demo、467 源文件模块边界与循环检查  | PASS                                                                                             |
| 708 个代码/CSS 文件的 800 行预算                 | 0 超限，0 豁免                                                                                   |
| 六个 Demo 生产构建与 gzip 预算                   | PASS                                                                                             |
| 最后清理与重启                                   | 本次先停服清理 6 个旧快照；完整门禁后清理 12 个 Demo 生成目录并重启六服务；0 空源码目录/散落日志 |
| Changeset                                        | 仅保留一份覆盖 18 个包的 patch，正文“性能与整体收缩，文档优化。”                                 |

前轮已完成的浏览器记录（477 项测试对应版本，保留为历史证据）：

| 运行模式/页面                   | 结果                                                                                                                    |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Sidebar Portal 与标准 Table     | 默认 110 条、每页 20；查询 19 条、重置 110；字段隐藏/恢复；列宽 180→212→重置180px；桌面无外层横向溢出                   |
| 窄屏标准 Table                  | 当时实测 innerWidth/pageWidth 均 390px：更多筛选 Drawer 与外层状态同步、操作列 60px、页面无外层横向溢出                 |
| Topbar Portal                   | 两级菜单完整可见，子目录按钮宽度 208px，完整层级 Overview URL 正常                                                      |
| React / Vue / HTML APP          | 共享 LayoutFrame 的收起栏均 60px、底部单一恢复按钮；React 隐藏后顶部恢复有效                                            |
| Vue / HTML 语言                 | 正文、菜单与浏览器标题完整切换英文；Vue 计数从 0 到 1；HTML 显式项目 Adapter 生效                                       |
| ComponentUI / Form / Table 能力 | 当时英文 API/案例刷新正常；日期选 9 月 20 日即时回显、Escape 关闭；Form 必填校验与 aria-invalid 通过，控制台无错误/警告 |
| React Custom                    | fire.render body 内容与 Dialog 挂载、关闭正常，浏览器控制台无错误/警告                                                  |
| 六服务健康检查                  | HTML 与 /manifest/routes.json 均 200，JSON MIME、appId、local 环境一致                                                  |

前次全仓扫描浏览器回归（489 项版本，保留为历史证据）：

| 范围       | 实际结果                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------- |
| 标准 Table | 110→查询19→重置110；字段隐藏/恢复；列宽180→212→重置180px；新增/取消 Drawer 正常                         |
| 390px 窄屏 | innerWidth/pageWidth=390px；操作列60px；更多筛选 Drawer 与外层共用状态；视口恢复1280px                  |
| 英文文案   | 七个基础服务页面、PageB、Vue/HTML及Custom已回归；批量输入和独立Drawer默认按钮均英文；Owner type准确     |
| 跨运行形态 | Topbar Overview正常；React收起栏约60px；Vue计数0→1；HTML英文标题与内容；Custom body/Modal挂载与关闭     |
| 最终新快照 | 全新浏览器页复验Platform Dialog与标准Table；英文标签词间空格正确；控制台0 error/0 warning，最终恢复中文 |
| 六服务健康 | 各HTML及manifest/routes.json为200；JSON MIME、appId与local环境一致                                      |

本次重启后的实际复验：六个 HTML 与 `/manifest/routes.json` 均为 200，JSON MIME、appId 和 local 环境正确；标准页恢复中文 110 条、每页 20 条，1280px 视口与页面宽度相同；实际 ReactNode 尺寸案例表头仍为“能力名称”，列宽标签正确，页面没有 `[object Object]` 标签，控制台 0 error/0 warning。重建前的本次查询 110→19→重置110、中文/英文新增与取消弹层也通过。本次未重复全部历史手工场景，长期 heap 和目标生产环境验收仍开放。92 份 Markdown、173 个本地链接/锚点复查零错误。

5 张 README 实拍仅含脱敏 Demo 数据。前轮 36 项临时审计条目及独立 CSS 备份目录已删除；前次三份门禁日志及临时 SSR/审计探针已清理；本次完整门禁日志与临时结果文件在归档后清理。保留服务当前需要的忽略产物 `.biu/`、公共包 `dist/` 和依赖；运行中不删除快照。生成的 `.husky/_/` 不保留，源码 pre-commit 保留。未提交、推送或发布，提交前仍须检查 staged diff。

验收入口：[Portal A / 标准 Table](http://localhost:9001/TableCapabilities/StandardTablePageShowcase)、[Portal B](http://localhost:9002/SystemConfig/BasicSettings/Overview)、[React APP](http://localhost:8001/PageA)、[Vue APP](http://localhost:8002/VuePage)、[HTML APP](http://localhost:8003/Welcome)、[Custom](http://localhost:8007/)。

门禁包含 18 个实际 tarball、2 个仓库外 CLI 消费项目、100 个创建输入、7 种 preset/五环境、六个 Demo 构建、公共包/Demo 类型检查、全量回归、ESLint、Prettier、Knip、生产依赖审计、包边界、800 行代码/CSS预算、构建体积和 `git diff --check`。生产平台与长期内存验收不计为本轮已通过。

构建仍有 caniuse-lite 数据库过旧的非阻断提示；更新兼容数据库和锁文件时需复验目标浏览器及体积预算。

## CLI 验收覆盖

| 边界             | 实际证据                                                                       |
| ---------------- | ------------------------------------------------------------------------------ |
| 帮助与语言       | 中英文 help 和诊断回归通过                                                     |
| init / create    | 真实终端多项目 init；100 个输入与 7 种 preset 构建通过                         |
| 生成项目质量     | 14 组模板格式通过；两个真实安装项目的 typecheck/lint/format 通过               |
| 独立安装与快照   | 当前 tarball 解析到消费者内部，不引用仓库相对目录；实际 dev 与 prod build 通过 |
| build 与菜单筛选 | 菜单有效/空结果/fallback 与环境回归通过，--all 保持排查语义                    |
| 参数与 filter    | 显式参数缺值报错、inline filter 转发及真实工作区启动通过                       |
| --apps 启停      | Portal/React/Vue 独立启动、appId/端口正确；SIGTERM 后全部端口释放              |

## 2026-10-30 manifest 版本快照（历史）

以下是 2026-10-30 仓库 `packages/*/package.json` 的实际版本快照，全部为稳定版本号。它不是 npm registry 查询结果，也不代表本轮已经发布；版本变更和发布由 Changesets 流程处理。

| 公开包                      | manifest 版本 |
| --------------------------- | ------------- |
| `@biugle/biu-adapter-react` | `2.0.0`       |
| `@biugle/biu-bridge`        | `1.0.1`       |
| `@biugle/biu-cli`           | `1.1.0`       |
| `@biugle/biu-events`        | `1.0.0`       |
| `@biugle/http`              | `1.0.1`       |
| `@biugle/biu-i18n`          | `1.0.1`       |
| `@biugle/icons`             | `2.0.0`       |
| `@biugle/logger`            | `1.0.0`       |
| `@biugle/biu-preset`        | `2.0.0`       |
| `@biugle/react-components`  | `2.0.0`       |
| `@biugle/react-form`        | `2.0.0`       |
| `@biugle/react-table`       | `2.0.0`       |
| `@biugle/render-code`       | `1.0.0`       |
| `@biugle/biu-router`        | `1.0.1`       |
| `@biugle/biu-runtime`       | `2.0.0`       |
| `@biugle/biu-store`         | `1.0.2`       |
| `@biugle/tanstack-query`    | `2.0.0`       |
| `@biugle/watermark`         | `1.0.0`       |

八个 React 相关公共包当前使用 React 19 peer 契约；宿主提供匹配的 React/React DOM，不把组件库自己的 React 副本打进发布包。消费者兼容说明与依赖关系见[公共包依赖图](package-graph.md)。

## 必须保留的历史事故证据

### Release 普通 main push 曾直接发布

2026-10-23，`Docs: NEW VERSION FIRST`（commit `3e7e40d`）直接进入 `main`，当时 commit-to-PR API 返回空关联；Release [run 39960428226](https://github.com/biugle/biu/actions/runs/39960428226) 在该窗口成功，18 个 v1 包版本随之发布。旧 workflow 监听所有 main push，旧发布入口未验证提交是否来自 Release PR。正常流程的参照是已合并的 Changesets [PR #6](https://github.com/biugle/biu/pull/6)。

当前仓库已增加 Release PR 来源校验：普通 push 安全跳过 npm publish，来源无法确认时失败关闭。此代码防线不替代 GitHub required checks；此前归档的远端检查显示 `main.protected=false`，本轮 API 再次确认 `main.protected=false`，管理员规则尚未启用。

### 旧 hash 脚本被 SPA fallback 当成 HTML 缓存

2026-10-25 的线上只读 HEAD 记录显示 `https://biu-a.biugle.cn/b46ebfbd.js` 返回 `200 text/html`、`Content-Disposition: index.html`、`Cache-Control: public, max-age=14400`（4 小时）；对应 source map 返回 403，当时首页没有引用该旧 hash。

这支持“旧页面请求已下线 lazy chunk，缺失脚本命中 HTML fallback”的版本错位路径，仍不能证明 `.reduce` 异常的具体首因。仓库 [vercel.json](../vercel.json) 已配置缺失带扩展名资源 404/no-store、入口 no-cache；Runtime 对明确 chunk 错误最多一次受冷却限制的恢复，并保留手动刷新。没有本轮线上部署或缓存复测证据，生产问题仍开放。

### Locale 资源请求循环与内存观测

2026-10-23，配置 `localeUrl` 且未提供 `locales` 时，默认语言列表在重渲染中反复创建，请求成功更新 revision 后重新触发 effect。约 19 秒观察到同一 locale 资源约 250 次请求；浏览器任务管理器显示约 133% CPU、约 13.1GB 内存，同期 JS heap 约 131MB。

默认 locale/选项稳定引用和真实挂载回归已覆盖该循环，状态更新后只请求一次。任务管理器内存不等于 JS heap，历史服务 RSS 或短时空闲采样也不能证明浏览器长期 heap 无增长；不能把所有 OOM 都归因于这一故障。30 分钟真实浏览器 soak 仍是后续验证。

## 工程与接入准备度评分

| 维度                 |       得分 | 依据和限制                                                                                   |
| -------------------- | ---------: | -------------------------------------------------------------------------------------------- |
| 架构边界与包设计     |      24/25 | 独立包、核心与编排分层、源码DAG自动检查；真实平台集成证据待补                                |
| 公开 API 与消费体验  |      19/20 | React 19 契约和 API 文档统一；真实 tarball 消费已验证；声明 API 快照与 React 19 迁移演练待补 |
| 自动化回归与 CI      |      19/20 | 完整本地门禁与专项回归存在；真实浏览器/无障碍尚未成为 required CI                            |
| 安全与生产准备       |      13/20 | chunk 恢复和路由缓存防线已实现；分支保护已确认未启用；SSO/CSP/监控仍缺目标环境验收           |
| 仓库内维护与发布防线 |      15/15 | Changesets与发布来源校验、零行数豁免、职责拆分、文档及CI去重                                 |
| **合计**             | **90/100** | **维持既有工程评分；本地门禁通过，外部上线待办仍未签核**                                     |

## GitHub Secrets 与两条部署链路

| 配置                      | 用途                                                        | 当前验收要求                                                            |
| ------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------- |
| `NPM_GIT_BIUGLE`          | 具有 `@biugle` 发布权限的 npm granular token                | 管理员在 Repository Secrets 中确认，发布工作流验收；不写入代码或 Vercel |
| `CHANGESETS_GITHUB_TOKEN` | 最小权限 GitHub token，让生成的 Release PR 触发 required CI | Release PR 需要 CI 时配置并验证检查实际产生；不得复用 npm token         |
| `GITHUB_TOKEN`            | GitHub 自动提供的 workflow token                            | 不手工建立同名 Secret；默认 token 创建的 PR 不自动触发其他 workflow     |

npm 链路：功能 PR/Changeset → main 的完整门禁 → Version PR → 评审合并 Release PR → 来源校验 → 仅发布受影响包。校验同仓库、已合并 `changeset-release/<branch>` PR、base branch、固定标题和提交关联；API 验证失败关闭。

Vercel 链路：每个 Portal/APP Project 的原生 Git 集成独立构建部署。npm guard 不阻止 Vercel 部署 main；手动 `deploy-demo.yml` 只上传验收 artifact，不调用 Vercel CLI。六个 Project 的域名、Production Branch 和构建配置需由部署负责人核验。操作步骤见[发布手册](release.md)与[Vercel 指南](vercel-deploy.md)。

## 优化优先级与未闭环清单

以下事项均未签核。发版前落实 R1、R2 和 R3 的发布配置；发版后完成 R3 的 registry 验收。D1–D2 属于业务生产部署条件。建议负责人是角色分工，不表示已指派具体人员。

| 编号 | 优先级 | 适用阶段               | 建议负责人          | 事项与完成标准                                                                                                                                                                                    |
| ---- | ------ | ---------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1   | P0     | 公共库发版前           | 仓库管理员          | main Ruleset 要求 PR/CI、禁止强推和删除、限制 bypass；真实 Release PR 产生并通过 required checks。                                                                                                |
| R2   | P0     | 公共库发版前           | 管理员 / 安全维护者 | 开启私密漏洞报告或公布已确认的私密渠道；按各包 major 或明确的 latest-stable 策略公布支持版本、停止支持及响应政策。                                                                                |
| R3   | P0     | 发版前配置及发版后验收 | 发布维护者          | 在平台确认 npm/GitHub Secrets 的权限与有效期；Release PR 实际触发 CI，发布 run 留下来源校验证据；发版后从 registry 安装受影响包并核对版本和消费者冒烟结果。记录只保留配置状态，不保留 Secret 值。 |
| D1   | P0     | 业务生产上线前         | 部署负责人          | 目标部署的有效 JS MIME 正确，缺失 JS/CSS/map 为 404/no-store，入口 no-cache；同一浏览器标签页会话的同页面/资源在 10 分钟冷却内最多自动恢复一次，重复失败保留手动刷新。                            |
| D2   | P0     | 业务生产上线前         | SSO / 后端 / 前端   | 登录、退出、刷新、权限撤销、fail-closed、精确 Origin、frame-src/frame-ancestors、Cookie 与深链均留下目标环境回归证据。                                                                            |
| O1   | P1     | 首次业务上线及后续演练 | 运维 / 前端         | 脱敏错误、导航和远程加载事件进入监控；完成一次 Portal/APP 成对回滚，版本、manifest 与 APP_URL 一致。                                                                                              |
| Q1   | P1     | 下个质量迭代           | 测试 / 前端         | Browser E2E 覆盖 Portal A/B、三种 APP、Custom、窄屏 Table/浮层和键盘；加入无障碍检查，稳定后接入 required CI。                                                                                    |
| Q2   | P1     | 下个质量迭代           | 测试 / 前端         | 同版本、同浏览器连续操作 30 分钟，记录 heap/DOM/监听器基线、峰值及释放后多次样本；清理后恢复稳定区间，无逐轮保留量增长及同 locale 请求循环。                                                      |
| C1   | P2     | 兼容性迭代             | 公共包维护者        | 保存实际 tarball 消费命令，覆盖 React 唯一实例、ESM/CSS、CLI create/start/build、legacy config 和已发布 v1 向当前包/React 19 契约迁移。                                                           |
| C2   | P2     | 维护迭代               | 公共包 / CI 维护者  | 自动校验公开 API 声明变更；审查 SHA 固定的官方 Actions，完成兼容验证后升级。                                                                                                                      |
| C3   | P2     | 维护迭代               | 前端维护者          | 更新 caniuse-lite 与锁文件，复验目标浏览器并继续满足 gzip 预算。                                                                                                                                  |

已从 TODO 移除：8 个代码行数例外、5 个超长 CSS、13 处 important、child-app/main-b 文案缺口、CI 重复 prepare 构建、仓库外安装夹具缺失。评分是基于架构、回归、安全接入与维护证据的工程评估，不是第三方质量认证。

正式 npm/Vercel 发布及生产控制变更仍由配置好 Secrets 和平台规则后的受控流程执行。本轮只完成仓库范围内的瘦身排错和文档完善。安装门禁按当前 CLI 子进程公告的实际端口验收，并核对 appId，避免端口回退导致误报；Query core 保持可选 React 边界。
