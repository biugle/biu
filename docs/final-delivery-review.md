# Biu 最终交付审计

本文件记录首次开源发布前的最终回归结果、交付评分、已完成事项、剩余 TODO 和 GitHub Actions 配置要求。它不是业务系统上线承诺；生产认证、权限、网关、域名和部署安全仍由项目方负责。

## 当前结论

功能回归、本地发布门禁和本轮浏览器验收均已通过，可进入代码评审；当前验收标签已能正常加载标准 Table 页面。但源码结构仍有 11 个基座文件超过仓库规定的 800 行边界，在拆分这些模块或记录经认可的明确例外前，不建议正式提交或发布。生产 SSO、正式域名/CSP、GitHub Secrets、npm/Vercel 发布和真实业务接口仍属于部署方职责；综合规范见 [`docs/biu-foundation-components-capabilities.md`](biu-foundation-components-capabilities.md)。

本轮重点修复了独立 HTML APP 收起态：HTML、React、Vue APP 共用 `@biugle/biu-preset/sidebar` 和 `LayoutFrame`，收起时统一为 60px 图标栏，底部只保留一个收起/展开按钮；顶部恢复按钮只在“隐藏菜单栏”状态出现，避免两套按钮叠加导致菜单错位。组件能力页现为单一统一目录，按顺序展示完整组件效果和 UI Table API 表，不再维护 UI/Pro 两份页面；文件上传/列表/预览、Icons 搜索分类、单一 Query、Render Code 和 Watermark 包也有专属能力页。

针对组件和基座回归又补齐了受控 Table 分页、虚拟滚动分页隔离、Ellipsis 内部文本节点溢出检测，以及 Components Dialog/Drawer 的 viewport 遮罩和面板层级。浏览器验收确认 1280×720 遮罩覆盖完整视口，Drawer 面板高度覆盖视口；侧栏可在 220px 与 60px 收起态之间恢复，菜单省略文本仍由 Components Tooltip 展示完整内容。

2026-09-27 的视觉回归继续收敛了范围 Date/Time Picker 的连接符居中、`PageFilter.Item` 的浮动 label 与子控件原始尺寸、FileItem 多行信息与图标的中心线、Primary/Warning/Success 统一色板（`#1677ff` / `#faad14` / `#52c41a`）以及 Overlay Demo 操作区间距。追加修复了 RangeTimePicker 连接符按两侧实际 Select 控件行对齐的问题，并将 Popover、Popconfirm、Dropdown 统一为“浮层外壳不滚动、内部列表滚动”的契约，避免首次碰撞测量时短暂出现滚动条。浏览器实测 PageFilter TextField 为 36px、Select 为 38px，范围触发器和时间面板连接符中心偏差为 0px；底部收藏浮层在 491px 窄视口内向上展开且 bottom 为 944px，Drawer footer 显示“取消/确定”并保持独立按钮间距；Demo 生成的 `dist/` 已清理，9002 已使用重新生成的 `.biu` 快照启动。

本轮基座非菜单回归将默认认证页、Runtime 状态/错误/远程重试、Demo 登录、个人信息、修改密码和工作栏统一切换到 `@biugle/react-components` 的公开控件，并补充 Runtime 静态渲染契约测试；Icons 与 Watermark 能力页的交互控件也统一复用 `Button`、`TextField` 和 `InputNumber`。菜单树、页签上下文菜单和导航骨架继续由 Preset 维护；Portal 真实账户接口、远程业务页面、原生文件触发器和只读错误日志区保持明确边界。

2026-09-28 的交付回归补充了表格筛选 Drawer 的 body-Portal 交互保护：Drawer 内 Select 等下拉控件选择后不会误关闭父层；PageFilter 浮动 label 增加 4px 圆角且不改变子控件尺寸。ProTable 列设置现在同步持久化非固定列上移/下移后的顺序，固定列使用锁图标而不显示“锁”文字。账户面板移除内容区重复的“保存”按钮，Dialog footer 的“确定”统一触发 Portal 注册的保存/校验回调，校验失败时保持打开。Form/Table Demo API 表按单个公开属性或方法逐行列出完整类型、默认值、行为说明和可运行案例，该规则已写入 `AGENTS.md` 与双语能力规范。

本次范围控件回归进一步收敛了交互：`RangeDatePicker` 只保留连续两次日历点击，第一次开始、第二次完成，完成后再次点击会开始新范围；反向日期自动规范为起止顺序。`RangeTimePicker` 不再依赖起止切换器，直接操作左右时分秒下拉；只调整一侧时，另一侧保留已有值或填充该侧当前显示的默认值，并始终规范为时间顺序。新增前侧/后侧选择回归用例，9002 重启后浏览器实测通过。

Table CRUD 筛选区本轮按最终布局契约收敛：字段默认使用约半列宽（最大 240px），主区域最多展示两行，超出字段进入完整筛选 Drawer；更多、重置、查询三个 small 按钮固定同宽、右对齐并保持垂直居中，语义分别为 `secondary + outlined`、`secondary + contained` 和 `dark + contained`。Drawer 默认扩展到约 720px 并复用相同控件尺寸和受控状态。Toolbar 自定义动作保留图标与文本，表格默认操作列明确使用 icon-only；列设置中的 fixed 列仅显示锁图标且不可隐藏或排序，非 fixed 列通过行首上移/下移按钮调整顺序并在实际面板和表头同步。表头文字、排序/筛选/列宽操作也统一到同一中心线。

2026-09-29 的最终源码回归补强了 `TableColumnSettings` 的完整顺序状态：普通列上移/下移后再隐藏/恢复仍回到调整后的相对位置，列设置已移除全部拖动排序逻辑，新增回归用例通过。随后完成发布前清理并重新构建基础包和全量 Demo；根目录 `pnpm check`、`pnpm test`、组件浏览器回归和 `main-a` 全量构建均通过，本次根测试共 200 项通过。9001/9002 已停止并按发布前流程重新启动验证；构建后的 `dist/` 与 `.biu/` 仅作为本地验收快照保留，不提交仓库。

首版发布说明曾由单一 `.changeset/first-formal-release.md` 维护，已在 `changeset version` 后消费并写入各包 `CHANGELOG.md`。18 个公开 `@biugle/*` 包当前均为正式版 `1.0.0`，未发现 alpha、beta、rc、snapshot 或 canary 临时版本；package.json 版本由 Changesets 生成，未手工改写。

2026-10-08 的 1.0.0 发布候选回归全部通过：`pnpm check`、`pnpm test`、`pnpm lint`、`pnpm format:check`、`pnpm audit:unused` 和 `pnpm build:demo:all` 均成功；Portal A/B、React、Vue、HTML 和 Custom Demo 全量构建通过，`git diff --check` 通过，Changesets status 确认 18 个公开包全部进入 major 计划。`docs/specs/` 不存在，构建生成的 `dist/` 与 `.biu/` 仅保留为本地运行快照，不提交仓库。

2026-10-17 的本地验收在清理旧生成物后重新完成：`pnpm check`、`pnpm test`、`pnpm build:demo` 和 `git diff --check` 均通过，唯一构建提示是已有的 Browserslist 数据过期提醒。浏览器回归覆盖 `ComponentUIShowcase`、`FormShowcase`、`TableShowcase`、`StandardTableTabsShowcase` 和 `TableResizeShowcase`；组件页、Form 字段、默认中文 Table、20 条分页、110 条脱敏数据、更多筛选 Drawer 的输入/下拉/外层同步，以及五类列宽/行高案例均可见且可操作。旧 9001 进程已停止，精确生成目录移入系统废纸篓后重建，服务已用新快照重新启动在 `http://localhost:9001`。当前源码保留的 13 处历史 `!important` 只用于 Preset 宿主/Overlay 边界和 Form 错误态，本轮未新增。

2026-10-20 的最终回归修复了最后一列连续拖动的基准漂移：拖动按实际渲染表头宽度计算，最后一列保持尾部手柄，连续拖动会由补偿列吸收差值。`@biugle/react-table` 的 53 项测试通过，浏览器实测两次连续拖动后宽度从 447px 调到 402px 再到 367px，前列同步补偿且没有跳列。`TableShowcase` 与 `StandardTableTabsShowcase` 共用同一页面布局，操作列桌面为 222px、窄屏为 60px，操作按钮为 30px 命中区、15px 图标。`ComponentUIShowcase` 首屏即时加载，其余区块随内容滚动延迟挂载，完整滚动无浏览器错误或警告。CLI 工厂重新验证 100 个不同组合和 7 个代表性构建，全部通过。验收服务使用新快照运行于 `http://localhost:9001`、`http://localhost:8001` 和 `http://localhost:8002`；`.biu/`、`dist/`、依赖目录及缓存均为忽略的本地产物。首版 release 文件尚未提交前，`pnpm changeset status` 会把已版本化的包改动报告为待处理工作树；提交该 release diff 后即可回到干净状态，不需要再添加一个 1.0.1 changeset。

## 2026-10-22 列宽、筛选与批量输入回归

列宽调整改为统一的数值布局和受控提交模型。普通列调整、剩余空间分配都排除 fixed、操作、选择和展开列；末列保留用户接受的宽度，默认将余量分配给其他普通列。`fillRemainingSpace=false`、`elasticColumn=false` 或 `scroll.x="max-content"` 使用精确内容宽度。最小/最大宽度、连续调整、RTL、受控拒绝、等价 props 重渲染、外部状态变化取消、回调抛错后的监听和禁选清理均纳入专项回归。

PageFilter 消除了动作区产生隐式 Grid 轨道的问题，字段填满均衡轨道，并按容器和动作区测量保持最多六列、默认两行。更多 Drawer 共用受控字段状态；排除可见字段时仍保留折叠字段，扩大窗口不会卸载已打开的 Drawer。标准页增加 Filter/Detail 帮助图标和 ProTextField 批量关键词案例，单行与弹层共用输入过滤，换行默认分隔，空白和中英文逗号可分别开启。

浏览器逐个测量 Table、Filter、Detail、Form 的标签文本和帮助 SVG：Table 三处中心偏差约 0.008px，Filter 三处为 0px，Detail 两处小于 0.001px，Form.Item 七处及 Form.List 两处均为 0px。TableShowcase 五个筛选字段均为 335px；末个普通列从 273px 拖到最小 48px，松手并触发父级重渲染后仍保持 48px，其它普通列补满至表格与内容区同为 1027px，名称/操作列保持 180px，选择/展开列保持 42px。操作列表头与表体的宽度和物理位置一致。

填充开关的实际鼠标对比确认：默认模式末列 467→367px，普通模块列 200→300px，表格保持 1027px；关闭模式保留精确内容宽度，右 fixed 列从左侧内边 180→130px 后，表头/表体右边界保持一致，随后普通列缩小仍保留 fixed 的 130px。标准页批量输入“北岸，云港\n沈禾”返回 52 条区域或负责人匹配记录；390px 视口操作列为 60px，页面宽度与视口同为 390px，Drawer 清除同步外层并恢复 110 条记录。组件页 ProTextField 的五个案例均为 30px，批量、只读、禁用及分隔选项正常，日志无错误或警告。Demo 翻译层使用稳定子 key，Checkbox 案例按公开 label 契约渲染。

最终新快照再次通过 RTL 实际鼠标回归：关闭填充时，操作列从物理左内边 180→130px，表头和表体始终贴住内容区右边界；普通模块列 200→240px，左边界同步左移 40px，固定名称列保持 180px，操作列保持 130px。末个普通列 160→120px 停在最小宽度，松手后保留结果。RTL 手柄按实际 direction 使用物理 left/right，精确短表在左 fixed 与普通列之间留白。TableShowcase 最终普通列 293→233px 后，父级选择状态重渲染仍保留列宽，操作列表头/表体保持 180px；四类标签帮助图标再次逐项测量，最大中心偏差小于 0.01px。390px 新视口复核操作列为 60px、每行只显示一个更多按钮，页面无外层横向溢出。最终全量单测 322 项（Table 84 项），六个 Demo 构建、类型检查、ESLint、Knip 与格式检查通过。

## 2026-10-23 操作列断点、分页与开发服务退出回归

操作列按浏览器视口统一接管三个尺寸：小于 560px 为 60px/`maxCount=1`，560–799px 为 160px/`maxCount=3`，800px 起为 190px/`maxCount=5`。`maxCount` 包含“更多”槽位，因此分别显示 0、2、4 个直接操作；`ButtonList` 保持通用组件，不增加尺寸概念，调用方显式限制优先。浏览器在 500、559、560、700、799、800、1000px 实测了操作列宽、属性值和可见按钮，边界均符合规则；恢复默认视口后标准 Table 页面留在验收标签。

分页器也按 560px 和 800px 断点回归：小于 560px 保留现有紧凑布局，560–799px 隐藏记录总数说明并保留完整页码按钮，同时将页大小选择器和跳页输入框设为 45px，800px 起使用标准桌面布局。修改已应用到标准 Table、标准多 Tab 和 EditableTable Demo。

开发服务检查发现了可导致重复启动累积的真实代码问题：通过 `--apps` 启动子应用时，CLI 的 SIGINT/SIGTERM 监听器会终止子应用，却吞掉父开发服务器的默认退出信号。现在会先停止子应用，再将原信号交还父进程，并新增 CLI 回归用例。重启后 9001 只有一个监听进程；服务 RSS 在短时两次采样中从约 88MB 降至 77MB、CPU 约 0.7%，未观察到持续增长。标准 Table 页面有 2298 个 DOM 节点、21 行和 441 个表格单元；浏览器未开放 JS heap 指标，因此这次测量不代表长期内存曲线。结论是 `--apps` 场景确有因信号处理不完整而残留服务的风险；当前单 Portal 服务没有重复实例，无法据此认定其他 OOM 都由同一原因导致。

本轮 `@biugle/biu-cli` 升至正式稳定版 1.0.1，修复通过 CLI 17 项测试、类型检查和构建；改动文件的 ESLint、Prettier 与 `git diff --check` 均通过。Changesets 已生成稳定版 changelog，未创建 beta 预发布版本，也未直接发布 npm；正式发布仍由配置 Secrets 后的 GitHub Actions 执行。

## 2026-10-23 Runtime 默认语言资源请求循环回归

开发时内存检查进一步定位到一条实际请求循环：配置 `localeUrl` 且未提供 `locales` 时，Runtime 每次渲染都会复制默认语言列表；语言资源加载后更新 revision 状态，导致 locale 选项引用变化、请求 effect 再次发起同一请求。此前一次约 19 秒的观察记录到 `demo-locale.json?locale=zh-CN` 约 250 次请求；当时浏览器任务管理器显示该页 CPU 约 133%、内存约 13.1GB，DOM 约 593 个节点、JS heap 约 131MB。该证据与持续请求循环相符，不能据此断定所有开发时 OOM 都由此问题造成。

修复后，Runtime 对默认语言列表、支持语言代码和有效语言选项保持稳定引用，语言资源加载 effect 不再因自己的成功状态更新而重启。新增 JSDOM 集成回归真实挂载 `BiuShell`，在默认语言资源加载及随后的状态重渲染后断言只产生一次请求；用例通过。此前部分旧 In-app Browser 标签显示 Chromium 崩溃页，原因无法从崩溃页确认；随后在新的可用标签重新打开 `StandardTablePageShowcase`，筛选区、工具栏、完整表格和分页器均正常渲染，三个标准 Table 页面及列宽/行高回归也已完成。重启后的 9001、8001、8002 HTTP 冒烟均返回 200，三个端口各只有一个监听进程。服务运行 21 分 56 秒和 22 分 13 秒的两次采样中，RSS 均约为 77/64/64MiB，CPU 为 0%，系统可用内存约 52%，没有内存节流；这是服务进程的短时空闲观测，不代表浏览器渲染进程或长期内存曲线。

Changesets 已将本轮受影响包版本化为稳定版：`@biugle/biu-cli` 1.0.2、`@biugle/biu-store` 1.0.1、`@biugle/biu-runtime` 1.0.3 和依赖更新后的 `@biugle/biu-preset` 1.0.3。Runtime 的语言请求循环修复在 1.0.2，随后因 Store 升级再以 1.0.3 发布；Preset 同步为 1.0.3。Changeset 源文件已由 `changeset version` 消费，package、changelog 与 lockfile 变更仍在当前未提交工作树中；仓库没有预发布配置或带预发布后缀的当前版本。本轮未发布 npm。只读查询 npm registry 后确认，18 个稳定候选版本均未出现在已发布版本列表中；现有稳定版本最高为 0.6.0 或 0.4.0。npm registry 可能保留早期临时预发布版本的历史记录；已发布历史不能改写，本次只会发布尚未发布过的稳定候选版本。

## 自动化回归结果

| 检查项                                        | 结果                                                             |
| --------------------------------------------- | ---------------------------------------------------------------- |
| 公共包构建和类型检查                          | PASS                                                             |
| Portal A/B、React、Vue、HTML、Custom 类型检查 | PASS                                                             |
| 单元测试                                      | PASS，346 个测试                                                 |
| ESLint                                        | PASS，无 warning                                                 |
| Prettier                                      | PASS（本次定向格式修复后）                                       |
| Knip                                          | PASS                                                             |
| 生产依赖漏洞审计                              | PASS，未发现已知漏洞                                             |
| CLI/project 场景                              | PASS，100 个组合和 7 个代表性构建                                |
| 代表性构建                                    | PASS，7 个场景                                                   |
| 全量 Demo 构建                                | PASS，Portal A/B、React/Vue/HTML APP、Custom                     |
| 公开包本地打包检查                            | PASS，18 个包写入临时目录，未执行 publish                        |
| 本地 HTTP 冒烟                                | PASS，9001/8001/8002 返回 200；新验收标签正常加载标准 Table 页面 |
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
- [ ] 复核当前 `main` 比 `github/main` 多 1 个本地提交，并在结构债务清零后推送已审查的候选提交
- [ ] 在 GitHub Settings/Actions 中确认 Actions 已启用
- [ ] 配置 `NPM_GIT_BIUGLE`；Vercel 使用原生 Git，无需 Vercel Token
- [ ] 设置 `main` 分支保护并要求 CI `validate` job 通过

### 本轮实现缺口

功能用例和自动门禁通过；结构约束仍有 11 个基座源码文件超过 800 行，详见本报告最后的文件清单。旧浏览器标签中仍有崩溃页，但新验收标签已正常加载标准页，未复现当前服务故障。标准 Table 三页的三种断点、Table/Filter/Detail/Form 标签 Tooltip 对齐，以及列宽和行高拖动均已在浏览器复核。

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
| 测试与质量门禁      | 9/10 | 类型、346 项单测、Lint、格式、Knip、100 场景和历史浏览器回归均通过     |
| 发布与 CI/CD        | 8/10 | Changesets/Actions 完整，尚未在真实 GitHub/npm/Vercel 账号上跑正式发布 |
| 安全边界            | 8/10 | 前端敏感信息边界和依赖审计完成，生产 CSP/SSO/网关仍需接入              |
| 文档与开源资产      | 9/10 | 中英文文档、模板、Logo、截图和清单齐全                                 |

**总评分：88/100。**

扣分主要来自 11 个源码文件超出 800 行架构边界，以及真实发布账号、生产部署、安全策略和浏览器级自动化尚未完成；本轮实际浏览器验收已通过。

## Agent 归档规则

- 基座公共能力必须从对应 `@biugle/*` 公共包公开入口获取，禁止 Runtime/Preset/Demo 复制第二套实现。
- HTML、Vue、React APP 统一使用 `LayoutFrame`/Preset；差异只允许来自 Adapter 和业务页面，不能复制菜单、收起按钮或响应式 CSS。
- 修改 Runtime、Preset、CLI 或公共包后，必须重新 `pnpm build` 并重启本地验收服务；`.biu` 是临时快照，不提交。
- 新增页面或 UI 文案必须同时更新中英文资源，并通过资源 key 回归测试。
- Demo mock 只放 `examples/dev-demo/apps/*/src/mock/`；基座只提供生产级契约，不内置 Demo 账号或业务数据。
- 交付前统一执行 `pnpm verify`；本轮通过 346 项单测、公开包打包检查、全量 Demo 构建、类型、Lint、格式、Knip、依赖审计和 CLI 场景。此前 FormGroup 分区、Table Biu 筛选面板、范围控件、Alert/Message、双向 Textarea 调整、Select 长标签 Tooltip、Divider、Tree/Transfer、PageFilter 原始尺寸保持、文件行中心线、非菜单账户页面组件复用、筛选 Drawer Portal 交互、列设置排序、账户 Dialog footer 提交和窄屏浏览器回归均有记录。Chart、RichText、Editor、Preview Server 按已确认范围保持未实现且不进入基础包。
- 清理只针对明确生成物和临时目录；不要在服务运行中删除 `.biu`/`dist`，不要删除 `node_modules`，不要 reset 或 checkout 用户工作区。

## 2026-10-23 补充回归记录

- 操作列按视口契约验证：`<560px` 为 `60px / maxCount 1`，`560–799px` 为 `160px / maxCount 3`，`≥800px` 为 `190px / maxCount 5`。`maxCount` 包含“更多”，因此分别显示“仅更多”“2 个操作 + 更多”“4 个操作 + 更多”；`ButtonList` 只接收数量上限，调用方显式 `maxCount` 优先。三个标准页面删除了重复的操作上限，页面没有自定义 CSS；标准页中的唯一内联尺寸只用于表格单元格内的进度条。
- 分页器在 500px、700px 和 1280px 浏览器视口完成 DOM 与视觉检查：小于 560px 只显示当前页，560–799px 隐藏范围/总数但保留页码，800px 起恢复标准布局；小于 800px 的页大小与跳页控件为 45px，桌面为 90px。
- 修复 CLI `--apps` 模式收到 `SIGINT`/`SIGTERM` 后只停止子应用、未退出父开发服务器的问题，并添加信号转发回归测试，避免反复启动时残留监听进程。验收期间 9001 只有一个 Node 监听进程（RSS 约 113MB）且 HTTP 返回 200。一个旧 In-app Browser 标签在切换视口时崩溃；新标签正常加载并完成桌面验收。该现象未显示本地服务内存溢出，但渲染器崩溃的具体原因尚不能确定。
- 受影响公共包已版本化为稳定版 `1.0.1`，Changesets 记录已写入各包 changelog，没有 beta 预发布版本；npm 发布仍由配置好 Secrets 的 GitHub Actions 执行。

## 2026-10-23 最终 CLI、打包与发布候选审计

CLI 创建回归覆盖 100 组互不重复的项目名、大小写/参数写法、Portal/APP preset、语言和选项位置组合；另用 7 个代表构建覆盖 Portal Sidebar/Topbar 与 APP Sidebar/Blank/Dashboard/Mobile/Custom，并覆盖 local、dev、test、pre、prod 环境。场景项目放在仓库内唯一的 `.scenario-work-*` 临时目录中，以便 CLI 向上发现 workspace；脚本只清理自己创建的目录，成功回归后没有残留。`biu --version` 的源码入口和打包入口均与 `packages/cli/package.json` 版本一致。全仓只保留根目录一个 CLI 场景验证器和一个公开包打包验证器；`build:demo:all:built` 是 `pnpm verify` 在 `pnpm check` 已构建基础包后的复用入口，避免二次构建；`examples/dev-demo` 不再复制维护基础包清单。

公开包打包检查对 18 个包逐一执行本地 `pnpm pack`，校验声明的 exports/bin 目标、README/LICENSE、发布版本、workspace 依赖替换和构建产物污染；临时 tarball 目录在脚本退出时删除。修复了 `@biugle/biu-store/standard` 声明导出没有构建 JS/声明文件的问题。`pnpm verify` 当前记录为通过：346 项单测、六个 Demo 类型检查与构建、公开包打包、100 个 CLI 创建输入、7 个 preset/环境构建、ESLint、Prettier、Knip、生产依赖审计和 `git diff --check`。冻结锁文件的离线安装也通过。

### 2026-10-23 重启后浏览器与开发资源复核

- 按项目约定停止旧服务，清除 main-a、child-app、vue-child 的项目级 `.biu` 快照后只重启一组服务；CLI 从新构建的基础包重新生成快照。9001、8001、8002 均返回 HTTP 200，且每个端口只有一个监听进程。构建期间记录到的两条旧 HMR 缺模块错误在重启后未复现。
- `StandardTablePageShowcase`、`StandardTableTabsShowcase`、`EditableTablePageShowcase` 在 1280/700/390px 均完成浏览器复核。操作列分别为 190/160/60px，对应 ButtonList 槽位 5/3/1（包含“更多”）；页大小和跳页控件分别为 90/45/45px。宽屏筛选字段等宽，中窄屏筛选区收敛，document scrollWidth 与视口相等。
- Table 表头、PageFilter、Detail、Form Tooltip 图标与文本的 DOM 中心线偏差均为 0px。`TableResizeShowcase` 中拖动“最近更新”列从 457px 缩到 407px，补偿列“模块”从 200px 扩到 250px，右固定操作列保持 190px；表头与首行每列边界一致，没有尾部空白。仅行高案例首行从 48px 调到 64px，第二行仍为 48px。
- 新服务运行约 2 分 44 秒时，9001/8001/8002 的 Node 进程 RSS 约为 352/286/284MiB，空闲 CPU 为 0%，macOS 系统可用内存为 61%，没有内存节流。运行约 22 分钟后 RSS 降至并稳定在约 77/64/64MiB（合计约 204MiB），连续采样 CPU 为 0%，系统可用内存约 52%，没有内存节流。这没有显示重复监听或持续内存增长，但短时观测不能排除更长时间的应用内存问题。部分旧浏览器标签仍是崩溃页，具体渲染器原因尚未确定；新验收标签已正常加载。

### 当前 18 个公开包的稳定版本

| 包                          | 候选稳定版本 |
| --------------------------- | -----------: |
| `@biugle/biu-adapter-react` |      `1.0.0` |
| `@biugle/biu-bridge`        |      `1.0.0` |
| `@biugle/biu-cli`           |      `1.0.2` |
| `@biugle/biu-events`        |      `1.0.0` |
| `@biugle/http`              |      `1.0.0` |
| `@biugle/biu-i18n`          |      `1.0.0` |
| `@biugle/icons`             |      `1.0.0` |
| `@biugle/logger`            |      `1.0.0` |
| `@biugle/biu-preset`        |      `1.0.3` |
| `@biugle/react-components`  |      `1.0.1` |
| `@biugle/react-form`        |      `1.0.1` |
| `@biugle/react-table`       |      `1.0.1` |
| `@biugle/render-code`       |      `1.0.0` |
| `@biugle/biu-router`        |      `1.0.0` |
| `@biugle/biu-runtime`       |      `1.0.3` |
| `@biugle/biu-store`         |      `1.0.1` |
| `@biugle/tanstack-query`    |      `1.0.0` |
| `@biugle/watermark`         |      `1.0.0` |

所有候选版本均为正式 SemVer，无 `beta`、`alpha`、`rc` 或其他 prerelease 后缀。Changeset 文件已由 `changeset version` 消费；由于当前 package/changelog 版本差异尚未提交，`pnpm changeset status` 会以退出码 1 提示没有未消费的 Changeset。这是生成稳定版版本差异后的预期状态，不是 beta 或预发布配置；不应为此追加空或重复 Changeset。本轮没有额外创建会重复 bump 版本的 Changeset。版本和 changelog 尚未提交，npm registry 尚未发布本轮候选。

### 最终 checklist 与发布判断

- [x] 根目录和 CI 共用 `pnpm verify`，包含包构建、类型、单测、lint、格式、Knip、依赖审计、CLI、pack 和全量 Demo 构建。
- [x] CLI 创建脚本覆盖 100 种输入，7 个 preset/环境构建通过；没有重复维护的基础包构建清单。
- [x] 18 个公开包均可本地打包，所有 manifest 导出目标存在，未发现 workspace 依赖或生成物泄漏。
- [x] npm registry 只读检查确认 18 个候选版本当前均未被占用。
- [x] Changesets 已生成稳定版本与 changelog；未执行 commit、push 或 npm publish。
- [x] 9001、8001、8002 服务 HTTP 冒烟返回 200，分别只有一个监听进程；运行约 22 分钟时 RSS 稳定在约 77/64/64MiB（合计约 204MiB），CPU 为空闲状态，系统可用内存约 52%，没有内存节流。这是短期进程采样，不能替代长期内存曲线。
- [x] 重启后的标准 Table 三页在 1280/700/390px 验收；Table、Filter、Detail、Form Tooltip 中心线对齐；真实列宽拖动与行高拖动均通过。新验收标签正常，部分旧标签仍显示 Chromium 崩溃页，原因未能确认。
- [ ] 11 个基座文件仍超过 800 行，尚未拆分或记录经认可的例外；当前检查结果为 2658、1769、1233、1201、1118、1020、1006、927、888、805、802 行。
- [ ] 暂无 staged diff；首次提交前仍需检查 staged 内容中的 Token、Cookie、密码、内部域名和本地用户数据。
- [ ] 真实 npm/GitHub Release workflow 尚未执行。

超限文件为 `packages/react-components/src/ui/control/index.tsx`（2658）、`packages/react-components/src/ui/navigation/index.tsx`（1769）、`packages/preset/src/layout-frame.tsx`（1233）、`packages/runtime/src/index.tsx`（1201）、`packages/react-components/src/ui/overlay/index.tsx`（1118）、`packages/cli/src/project.ts`（1020）、`packages/preset/src/layout-components.tsx`（1006）、`packages/react-components/src/ui/scroll/index.tsx`（927）、`packages/react-table/src/ui/table.tsx`（888）、`packages/react-components/src/ui/file/index.tsx`（805）和 `packages/react-table/src/ui/use-table-resize.ts`（802）。

**结论：自动化和本轮浏览器回归门禁通过，可供代码评审；暂不建议把当前候选作为正式发布提交或执行发布。** 发布前需处理上述 11 个超限文件，并按首次提交清单检查 staged diff。当前分支比 `github/main` 领先 1 个本地提交，工作树另有未提交改动；本轮没有暂存、提交、推送或发布任何内容。
