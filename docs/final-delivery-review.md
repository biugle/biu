# Biu 最终交付审计

更新日期：2026-10-30。本文只记录发布审计、验证证据、优化清单和外部接入待办；架构、组件/API、Demo 与实施约束见[综合能力规范](biu-foundation-components-capabilities.md)，操作手册见[文档中心](README.md)。

## 当前结论与证据边界

本轮保持功能设计、路由和公开 API，完成瘦身、隐藏问题修复、模块解耦与双语文档完善。最终完整 `pnpm verify` 通过 477 项测试与全部交付门禁；六种运行形态已重启并完成浏览器验收。

生产旧 hash 缓存、GitHub 分支保护、真实 SSO/CSP/监控和 30 分钟浏览器 heap 仍缺目标环境证据，保留为上线前待办。

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

## 最终验证记录

2026-10-30 发版前再回归先通过 472 项测试，随后只读复核发现更新检查器语言切换/退役响应和 ArrayBuffer 上传身份两个边界问题。补充的 5 条回归均在旧实现失败、修复后通过；同时修正 Release 默认单 pending 队列会替换待发布运行的配置。最终代码重新执行完整 `pnpm verify`，以 **exit 0** 结束，**477 项测试全部通过，0 失败**；全部类型检查、真实 tarball 消费、创建/环境场景、六 Demo 构建与体积预算、静态检查和生产依赖审计通过。之后仅更新审计和验收截图，补跑格式、文档链接、污染和 diff 检查。

| 最终 checklist                                   | 结果                                                                                          |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| 公共包与六个 Demo 类型检查                       | PASS                                                                                          |
| 18 个公开包实际 tarball、exports 与污染检查      | PASS                                                                                          |
| 2 个仓库外 CLI 安装消费者，实际 dev / prod build | PASS                                                                                          |
| 公共包、CLI、发布来源、模块边界与 Demo 回归      | 477 / 477 PASS                                                                                |
| 100 个 CLI 创建输入、7 种 preset、五环境场景     | PASS                                                                                          |
| ESLint、Prettier、Knip、git diff --check         | PASS                                                                                          |
| 生产依赖审计                                     | 无已知漏洞                                                                                    |
| 18 公共包、6 Demo、467 源文件模块边界与循环检查  | PASS                                                                                          |
| 704 个代码/CSS 文件的 800 行预算                 | 0 超限，0 豁免                                                                                |
| 六个 Demo 生产构建与 gzip 预算                   | PASS                                                                                          |
| 最后清理与重启                                   | 前轮清理 30 个旧生成目录；本次停服清理 12 个 Demo 生成目录并重启六服务，0 空源码目录/散落日志 |
| Changeset                                        | 仅保留一份本轮 patch，正文“性能与整体收缩，文档优化。”                                        |

浏览器实际验收：

| 运行模式/页面                   | 结果                                                                                                                    |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Sidebar Portal 与标准 Table     | 默认 110 条、每页 20；查询 19 条、重置 110；字段隐藏/恢复；列宽 180→212→重置180px；桌面无外层横向溢出                   |
| 窄屏标准 Table                  | 本次实测 innerWidth/pageWidth 均 390px：更多筛选 Drawer 与外层状态同步、操作列 60px、页面无外层横向溢出                 |
| Topbar Portal                   | 两级菜单完整可见，子目录按钮宽度 208px，完整层级 Overview URL 正常                                                      |
| React / Vue / HTML APP          | 共享 LayoutFrame 的收起栏均 60px、底部单一恢复按钮；React 隐藏后顶部恢复有效                                            |
| Vue / HTML 语言                 | 正文、菜单与浏览器标题完整切换英文；Vue 计数从 0 到 1；HTML 显式项目 Adapter 生效                                       |
| ComponentUI / Form / Table 能力 | 本次英文 API/案例刷新正常；日期选 9 月 20 日即时回显、Escape 关闭；Form 必填校验与 aria-invalid 通过，控制台无错误/警告 |
| React Custom                    | fire.render body 内容与 Dialog 挂载、关闭正常，浏览器控制台无错误/警告                                                  |
| 六服务健康检查                  | HTML 与 /manifest/routes.json 均 200，JSON MIME、appId、local 环境一致                                                  |

5 张 README 实拍仅含脱敏 Demo 数据。前轮 36 项临时审计条目及独立 CSS 备份目录已删除；本次两份回归日志在归档后清理。保留服务当前需要的忽略产物 `.biu/`、公共包 `dist/` 和依赖；运行中不删除快照。生成的 `.husky/_/` 不保留，源码 pre-commit 保留。未提交、推送或发布，提交前仍须检查 staged diff。

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

## 当前 manifest 版本

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

当前仓库已增加 Release PR 来源校验：普通 push 安全跳过 npm publish，来源无法确认时失败关闭。此代码防线不替代 GitHub required checks；此前归档的远端检查显示 `main.protected=false`，本轮不声称管理员规则已启用。

### 旧 hash 脚本被 SPA fallback 当成 HTML 缓存

2026-10-25 的线上只读 HEAD 记录显示 `https://biu-a.biugle.cn/b46ebfbd.js` 返回 `200 text/html`、`Content-Disposition: index.html`、`Cache-Control: public, max-age=14400`（4 小时）；对应 source map 返回 403，当时首页没有引用该旧 hash。

这支持“旧页面请求已下线 lazy chunk，缺失脚本命中 HTML fallback”的版本错位路径，仍不能证明 `.reduce` 异常的具体首因。仓库 [vercel.json](../vercel.json) 已配置缺失带扩展名资源 404/no-store、入口 no-cache；Runtime 对明确 chunk 错误最多一次受冷却限制的恢复，并保留手动刷新。没有本轮线上部署或缓存复测证据，生产问题仍开放。

### Locale 资源请求循环与内存观测

2026-10-23，配置 `localeUrl` 且未提供 `locales` 时，默认语言列表在重渲染中反复创建，请求成功更新 revision 后重新触发 effect。约 19 秒观察到同一 locale 资源约 250 次请求；浏览器任务管理器显示约 133% CPU、约 13.1GB 内存，同期 JS heap 约 131MB。

默认 locale/选项稳定引用和真实挂载回归已覆盖该循环，状态更新后只请求一次。任务管理器内存不等于 JS heap，历史服务 RSS 或短时空闲采样也不能证明浏览器长期 heap 无增长；不能把所有 OOM 都归因于这一故障。30 分钟真实浏览器 soak 仍是后续验证。

## 工程与接入准备度评分

| 维度                |       得分 | 依据和限制                                                                                   |
| ------------------- | ---------: | -------------------------------------------------------------------------------------------- |
| 架构边界与包设计    |      24/25 | 独立包、核心与编排分层、源码DAG自动检查；真实平台集成证据待补                                |
| 公开 API 与消费体验 |      19/20 | React 19 契约和 API 文档统一；真实 tarball 消费已验证；声明 API 快照与 React 19 迁移演练待补 |
| 自动化回归与 CI     |      19/20 | 完整本地门禁与专项回归存在；真实浏览器/无障碍尚未成为 required CI                            |
| 安全与生产准备      |      13/20 | chunk 恢复和路由缓存防线已实现；分支保护、生产 SSO/CSP/监控尚缺本轮证据                      |
| 可维护性与发布治理  |      15/15 | Changesets与发布来源校验、零行数豁免、职责拆分、文档及CI去重                                 |
| **合计**            | **90/100** | **维持既有工程评分；本地门禁通过，外部上线待办仍未签核**                                     |

## GitHub Secrets 与两条部署链路

| 配置                      | 用途                                                        | 当前验收要求                                                            |
| ------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------- |
| `NPM_GIT_BIUGLE`          | 具有 `@biugle` 发布权限的 npm granular token                | 管理员在 Repository Secrets 中确认，发布工作流验收；不写入代码或 Vercel |
| `CHANGESETS_GITHUB_TOKEN` | 最小权限 GitHub token，让生成的 Release PR 触发 required CI | Release PR 需要 CI 时配置并验证检查实际产生；不得复用 npm token         |
| `GITHUB_TOKEN`            | GitHub 自动提供的 workflow token                            | 不手工建立同名 Secret；默认 token 创建的 PR 不自动触发其他 workflow     |

npm 链路：功能 PR/Changeset → main 的完整门禁 → Version PR → 评审合并 Release PR → 来源校验 → 仅发布受影响包。校验同仓库、已合并 `changeset-release/<branch>` PR、base branch、固定标题和提交关联；API 验证失败关闭。

Vercel 链路：每个 Portal/APP Project 的原生 Git 集成独立构建部署。npm guard 不阻止 Vercel 部署 main；手动 `deploy-demo.yml` 只上传验收 artifact，不调用 Vercel CLI。六个 Project 的域名、Production Branch 和构建配置需由部署负责人核验。操作步骤见[发布手册](release.md)与[Vercel 指南](vercel-deploy.md)。

## 优化优先级与未闭环清单

| 优先级 | 事项                                              | 完成标准                                                                                           |
| ------ | ------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| P0     | GitHub main Ruleset 与 Release PR required checks | 要求 PR/CI、禁止强推和删除、限制 bypass；实际 Release PR 产生必需检查                              |
| P0     | 生产旧 hash 路由与缓存                            | 部署后有效 JS MIME 正确；缺失 JS/CSS/map 为 404/no-store，入口不缓存；旧页恢复只发生一次           |
| P0     | 真实 SSO、权限、Origin、CSP 和 Cookie             | 登录/退出/刷新/权限撤销、fail-closed、精确 Origin、frame-src/frame-ancestors、深链均有目标环境证据 |
| P1     | 监控与 Portal/APP 成对回滚                        | 脱敏错误、导航、远程加载事件进监控；灰度/回滚后版本、清单与 APP_URL 匹配                           |
| P1     | 真实浏览器 E2E 与无障碍 CI                        | 覆盖 Portal A/B、三种 APP、Custom、窄屏 Table/浮层和键盘；稳定后接入 required checks               |
| P1     | 30 分钟浏览器 heap soak                           | 连续导航、筛选、拖动、语言切换和 iframe 开关；记录 heap/节点/监听器基线、峰值和释放后趋势          |
| P2     | 扩展消费者与迁移夹具                              | 安装实际 tarball，覆盖 React 宿主唯一性、ESM、CSS、CLI create/start/build 和 legacy config         |
| P2     | 浏览器兼容数据库与依赖更新                        | 更新 caniuse-lite 和锁文件；按目标浏览器验证并继续满足 gzip 预算                                   |

已从 TODO 移除：8 个代码行数例外、5 个超长 CSS、13 处 important、child-app/main-b 文案缺口、CI 重复 prepare 构建、仓库外安装夹具缺失。评分是基于架构、回归、安全接入与维护证据的工程评估，不是第三方质量认证。

正式 npm/Vercel 发布及生产控制变更仍由配置好 Secrets 和平台规则后的受控流程执行。本轮只完成仓库范围内的瘦身排错和文档完善。安装门禁按当前 CLI 子进程公告的实际端口验收，并核对 appId，避免端口回退导致误报；Query core 保持可选 React 边界。
