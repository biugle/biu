# Biu 最终交付审计

本文件记录首次开源发布前的最终回归结果、交付评分、已完成事项、剩余 TODO 和 GitHub Actions 配置要求。它不是业务系统上线承诺；生产认证、权限、网关、域名和部署安全仍由项目方负责。

## 当前结论

截至 2026-10-29，当前工作树在清理旧产物后重新通过完整 `pnpm verify`，包含全包构建/类型检查/打包、全量单测、源码和构建预算、供应链门禁及六个 Demo 构建；工程与接入准备度维持 **88/100**。React 19 契约、同源 iframe 拒绝、Preset 单 CSS 产物、Runtime 的一次性 chunk 恢复、Vercel 缺失资源 404 配置校验、普通 main push 跳过 npm 发布保护，以及组件的窄屏/触屏兜底均有实现和回归覆盖。细项和本地验收服务状态见文末“2026-10-29 工作区全量回归、Changesets 收敛与验收环境”。

本轮仍不构成生产发布签核。2026-10-25 最近一次线上只读 HEAD 检查中，`https://biu-a.biugle.cn/b46ebfbd.js` 返回 **200 `text/html`**，同时带 `Content-Disposition: index.html` 和 `Cache-Control: public, max-age=14400`；对应 `.map` 返回 403。当前首页引用 `8a24170d.js`、`7f1f1676.js`、`412acc6b.js`，没有 `b46ebfbd`。这支持“旧页面请求已下线延迟 chunk，而 SPA 回退将缺失脚本伪装为 HTML”为高概率触发路径。本轮在工作树修正回退规则并增加客户端恢复，但没有部署或重新检查线上；此前缓存中的 HTML 可能持续到缓存失效。旧 chunk/新入口错位仍不能证明 `.reduce` 的具体首因，原始异常首行缺失且线上 source map 不可读。生产前仍需部署、清缓存或等待旧响应失效，并复测。

本文件较早的发布候选结论、分支状态、88/100、84/100 和 2026-10-23 的 81/100 分数均为历史快照；当前判断、评分依据和验收证据见文末“2026-10-29 工作区全量回归、Changesets 收敛与验收环境”。本文件继续作为最终交付审计归档，架构能力的唯一综合说明仍见 [docs/biu-foundation-components-capabilities.md](biu-foundation-components-capabilities.md)。

本轮调整了独立 HTML APP 的 Sidebar 控制：HTML、React、Vue APP 共用 `@biugle/biu-preset/sidebar` 和 `LayoutFrame`；菜单默认展开，顶部菜单边界按钮负责完整菜单与 60px 图标栏之间切换，底部工具栏第一项完全隐藏菜单，顶部按钮始终位于导航 `aside` 外并可恢复隐藏状态。Portal 导航栏不再显示侧栏控制按钮，菜单设置面板和 `hideSidebar`/`collapseSidebar`/`lockSidebar` 覆盖保持一致。组件能力页现为单一统一目录，按顺序展示完整组件效果和 UI Table API 表，不再维护 UI/Pro 两份页面；文件上传/列表/预览、Icons 搜索分类、单一 Query、Render Code 和 Watermark 包也有专属能力页。

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

## 历史评分（此前发布候选快照）

以下 88/100 分数保留此前候选审计的记录；当前综合评分见文末，评分维度和范围不同，不应直接横向比较。

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

## 2026-10-23 历史 CLI、打包与发布候选审计（当时快照）

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

### 前一轮候选 checklist 与当时判断

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

## 2026-10-23 全面项目审计、优化方案与评分（历史快照）

### 审计范围与方法

本次检查覆盖仓库架构与包边界、18 个公开包的 manifest 和导出、主要源文件规模、Demo 构建输出、CI/Release workflow、测试结构、安全边界文档和生产清单。自动化回归使用根目录统一门禁 pnpm verify；运行态抽查使用本地 Portal A 和 React/Vue/HTML APP 服务，并在浏览器中对标准 Table 页面执行 390px、700px、1280px 视口检查。没有连接真实 SSO、权限后端、生产 CDN、GitHub Actions 运行环境或生产域名，因此这些集成项按“未验收”记录。

当时的分数评价仓库交付和企业接入准备度，不等同于组件视觉质量或单纯架构设计完整度。此前记录的 9.6/10 架构评分属于设计方案复审；此前 88/100 属于早期候选发布审计。两者范围不同；本节 81/100 只代表 2026-10-23 快照，当前统一评分为文末 84/100。

### 综合评价与评分

| 维度               |       得分 | 依据                                                                                                                                                                         |
| ------------------ | ---------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 架构边界与包设计   |      22/25 | Portal/APP、Runtime/Preset、UI/Pro、Router/Store/Bridge 边界清楚，独立包和 ESM 输出成熟；React peer 依赖契约和少数超大模块扣分。                                             |
| 公开 API 与文档    |      18/20 | 中英文 README、数据契约、生产清单和逐属性 API 表覆盖面广；API 类型变化与文档表格仍主要靠人工同步。                                                                           |
| 自动化回归与 CI    |      18/20 | 本轮完整门禁通过，覆盖构建、类型、单测、lint、格式、Knip、依赖审计、打包、CLI 场景和六个 Demo；浏览器、无障碍、覆盖率与性能预算未进入 PR 门禁。                              |
| 安全与生产运行准备 |      12/20 | Bridge Origin 校验、敏感字段脱敏、权限 fail-closed、iframe sandbox 和 npm audit 已有实现；同源 sandbox 组合需加固，真实认证、网关、CSP、监控、灰度和回滚尚未在目标环境验收。 |
| 可维护性与发布治理 |      11/15 | Changesets、包打包检查、Security/Contributing 文档和 CI 已建立；多个文件过大、CSS 产物重复，供应链与 API 兼容性检查仍可加强。                                                |
| **总分**           | **81/100** | **工程基础扎实，具备受控试点条件；企业生产批准取决于高优先级风险关闭和目标环境验收。**                                                                                       |

**锐评：** Biu 的架构边界、公开组件广度和本地交付门禁都明显高于普通 Demo 型脚手架，文档也有相当完整度。当前短板集中在包的版本承诺与实际依赖解析不一致、iframe 隔离依赖调用方遵守约定、UI 回归无法在 CI 重放，以及少数代码文件过度集中。项目现在最需要提高“可消费、可验证、可运营”的确定性，继续扩充组件数量的边际收益较低。

### 本轮回归与运行态结果

| 检查项                | 本轮结果                                                                                                                                                                                                                                                                                                                                                       |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| pnpm verify           | **PASS，退出码 0。** 包含 foundation 构建、公共包与六个 Demo 类型检查、已配置单测、ESLint、Prettier、Knip、生产依赖审计、CLI 场景、全量 Demo 构建及 git diff --check。                                                                                                                                                                                         |
| 公开包打包            | **PASS，18 个包。** 脚本核对 README、LICENSE、导出目标、版本、workspace 依赖替换和生成物泄漏；它没有安装 tarball 验证外部消费者的 React 版本解析。                                                                                                                                                                                                             |
| CLI 场景              | **PASS，100 个不同 create 输入、7 个 Portal/APP preset 构建场景**；覆盖 local/dev/test/pre/prod 环境。                                                                                                                                                                                                                                                         |
| Demo 构建             | **PASS，六个 Demo：** React Portal A/B、React APP、Vue APP、HTML APP、React Custom。                                                                                                                                                                                                                                                                           |
| 生产依赖审计          | **PASS，npm audit 未报告已知漏洞。** 它不覆盖代码级安全审计、许可证政策或 GitHub 账户安全设置。                                                                                                                                                                                                                                                                |
| 本地 HTTP 冒烟        | **PASS，9001、8001、8002 均返回 HTTP 200。**                                                                                                                                                                                                                                                                                                                   |
| 浏览器标准 Table 回归 | **PASS。** Portal A 标准 Table 页面显示 20 条当前页数据、共 110 条记录；列设置菜单可打开；页面无可见横向溢出。390px 操作列 60px 且仅显示“更多”，分页每页数和跳页控件外框均为 45px；700px 操作列 160px、显示 2 个操作加“更多”，两个分页控件均为 45px；1280px 操作列 190px、显示 4 个操作加“更多”，两个分页控件均为 90px。三个视口的 document 宽度均与视口相等。 |
| 浏览器日志            | **PASS。** 本次验收标签没有捕获到 error/warning 级 console 日志；临时视口检查后已恢复默认大小。                                                                                                                                                                                                                                                                |
| 构建提示              | 有一条既有 caniuse-lite 数据过期提醒；没有阻断构建。                                                                                                                                                                                                                                                                                                           |

### 高优先级发现

#### F-01 React 公共包的 peer 依赖契约不一致（P1）

@biugle/react-components、@biugle/react-table 和 @biugle/biu-runtime 在 peerDependencies 声明 React/ReactDOM >=18，同时又把 React ^19.0.0 放在 dependencies。react-components 还直接依赖 ReactDOM 19。@biugle/biu-preset 和 @biugle/biu-adapter-react 把 React/ReactDOM 19 放在 dependencies，未声明 React peer。工作区 Demo 使用 React 19，所以当前类型检查和构建不会暴露 React 18 外部消费者问题。

外部 React 18 项目可能同时解析宿主 React 18 和包内 React 19，形成双 React 实例、Hook dispatcher 不一致或根挂载行为差异；现有 pack 检查只验证归档和导出目标，没有执行外部消费者安装。下一次对外发布前应统一 React 宿主依赖策略：将 React/ReactDOM 作为 peer，开发期版本放入 devDependencies，并明确经过验证的范围；添加 tarball 消费者夹具，分别安装 React 18 与 19，断言依赖树只有一个 React 实例并实际渲染 Runtime、Preset、组件和 Adapter。

#### F-02 iframe sandbox 允许“脚本 + 同源”，而同源 APP 配置未被拒绝（P1，条件性安全风险）

packages/runtime/src/remote.tsx 对 iframe 固定使用 sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"。CLI 对相对 APP_URL 不要求 ALLOWED_ORIGINS；Runtime 会以门户 origin 解析相对地址；当前单测也明确接受 /same-origin。当远程内容最终与 Portal 同源时，allow-scripts 与 allow-same-origin 的组合会削弱 sandbox 隔离，同源脚本可以访问嵌入元素并尝试移除限制。仓库规定生产 Portal/APP 使用独立域名，但当前实现没有把这项架构约束变成校验。

这不是本轮独立域名 Demo 的复现故障，而是允许危险配置进入运行态的防御缺口。应在 Runtime/CLI 明确拒绝生产同源 APP，或对同源场景去掉 allow-same-origin 并验证所需 Cookie/Bridge 行为；加入同源、跨源、相对 URL 和恶意 Origin 的端到端用例。

#### F-03 UI 回归没有进入 CI，复杂 Preset 缺少包级单测（P1）

pnpm verify 覆盖类型、Node/JS DOM 单测、CLI 场景和 Demo 构建，但没有 Playwright/Cypress 浏览器任务、视觉快照、axe/WCAG 扫描或覆盖率阈值。根测试脚本纳入 15 个包；@biugle/biu-preset、@biugle/biu-adapter-react 和 @biugle/icons 没有 package test 脚本。Preset 负责最复杂的布局、导航、弹层、iframe 和响应式行为，失败影响面最大。本轮人工验证了 Table 的三个断点，不能替代 PR 上的可重复浏览器覆盖。

优先给 Portal Sidebar/Topbar、React/Vue/HTML APP、Custom 加浏览器冒烟；重点覆盖深链刷新、权限失败、iframe ready/error/retry、Bridge 拒绝非白名单来源、主题/语言/RTL、侧栏收起、Drawer/Popover 遮挡和 Table 响应式。加入键盘焦点、读屏名称、颜色对比与 axe 检查；将浏览器门禁放入 pnpm verify 或独立必需 CI job。

#### F-04 生产接入条件仍没有真实环境证据（上线阻断项）

项目已经正确把业务 SSO、权限决策、网关、CSP、域名、CDN、错误监控和业务菜单 API 划为宿主责任，并在 docs/production-checklist.md 中列出要求。本轮验证的是本地服务和 mock Demo；没有生产身份提供方、真实接口、HTTPS 安全头、frame-ancestors/frame-src、部署 SPA fallback、旧 hash 资源保留、灰度或 Portal/APP 成对回滚的运行证据。配置边界存在不代表集成已通过。

正式生产评审需由平台/业务负责人提供一份具体环境矩阵与验收记录：认证登录/退出/刷新及权限撤销、菜单失败 fail-closed、精确 Origin、CSP 和 Cookie 属性、错误脱敏上报、发布回滚以及深链刷新。每一项需标明负责人、环境、证据和回退办法。

### 中优先级架构与效能问题

#### F-05 800 行架构规则目前没有自动门禁（P2）

当前有 11 个基座源码文件超过 800 行：

| 文件                                                  | 行数 |
| ----------------------------------------------------- | ---: |
| packages/react-components/src/ui/control/index.tsx    | 2658 |
| packages/react-components/src/ui/navigation/index.tsx | 1769 |
| packages/preset/src/layout-frame.tsx                  | 1233 |
| packages/runtime/src/index.tsx                        | 1201 |
| packages/react-components/src/ui/overlay/index.tsx    | 1118 |
| packages/cli/src/project.ts                           | 1020 |
| packages/preset/src/layout-components.tsx             | 1006 |
| packages/react-components/src/ui/scroll/index.tsx     |  927 |
| packages/react-table/src/ui/table.tsx                 |  888 |
| packages/react-components/src/ui/file/index.tsx       |  805 |
| packages/react-table/src/ui/use-table-resize.ts       |  802 |

Demo 也有集中度风险：ComponentUIShowcase/index.tsx 约 5,395 行，TableShowcase/index.tsx 约 1,878 行，CapabilityPage/index.tsx 约 1,518 行，FormShowcase/index.tsx 约 1,288 行；react-table/test/table-functional.test.ts 约 4,058 行。单文件体积会放大评审冲突、测试定位和后续团队并行成本。将组件实现拆到组件私有目录、把 Runtime/CLI 按职责拆分、将 Demo API 示例抽成数据或子组件；在 pnpm verify 加 800 行软/硬限制，并允许带负责人和复审日期的例外清单。

#### F-06 Preset 发布六份逐字节相同的 CSS（P2）

本轮构建后，packages/preset/dist/{sidebar,topbar,blank,dashboard,mobile,custom}.css 的 SHA-256 完全相同，每份 92,226 字节，总计 553,356 字节未压缩内容。调用方任选一个入口都会获得整份 CSS；六个入口增加了包内重复文件和误以为各 preset 有独立样式子集的可能性。

保留兼容导出时可让六个 CSS 子路径指向同一份公共样式文件；新主入口提供唯一 styles.css，并明确布局 CSS 实际共享。打包门禁增加产物体积和重复哈希检查。

#### F-07 构建产物已有可见体积信号，缺少预算与首屏数据（P2）

本轮 Portal A 的完整 Demo 构建产物合计约 2,528.4 KB、gzip 约 700.4 KB；最大单个 JS chunk 为 744.8 KB、gzip 约 206.7 KB。此统计包含所有 route chunks，不能据此推断首屏下载量或 LCP；当前门禁没有记录路由首屏网络瀑布、Core Web Vitals 或 bundle budget。

添加 Rsbuild stats/bundle analyzer，分别记录 Portal 壳层首屏、标准 Table、组件目录等典型路由的实际初始与延迟加载字节；追踪图标/通用组件 tree-shaking、重复依赖、按页面拆包和 CSS 加载。基于目标浏览器和企业网络实测设置 gzip 首屏与关键路由预算，并在 CI 中展示趋势。

#### F-08 包 API 与发布供应链仍偏人工治理（P2）

verify:pack 验证 tarball 内容、export/bin 目标和 workspace 依赖替换；它不比较发布 API 签名，不验证 React 主版本消费，也不证明 API 表与声明文件一致。当前没有 API Extractor/API report、发布兼容性矩阵或生成式 API 表校验。CI/Release workflow 使用 actions/checkout@v4、setup-node@v4、pnpm/action-setup@v4、changesets/action@v1 等 tag 引用，没有 commit SHA 固定；checkout 中也没有 Dependabot 或 CodeQL workflow。GitHub Secret Scanning、Push Protection、branch protection 和必需评审属于远端仓库设置，本地检查无法确认其状态。Release 使用长期 npm token secret；Trusted Publishing/provenance 尚未配置。

增加 API 声明快照与 breaking-change review、React 兼容消费者 matrix、workflow SHA pin 和自动更新；在 GitHub 仓库启用 CodeQL、依赖更新、secret scanning/push protection、分支保护和 required checks；评估 npm Trusted Publishing 与 provenance。当前已有 SECURITY.md、CONTRIBUTING.md、CODE_OF_CONDUCT.md，这些开源治理资产应继续保留。

#### F-09 安装/校验路径可能重复构建（P2）

根 prepare 脚本执行完整 pnpm build；CI 随后执行 pnpm verify，其 check 阶段又从 pnpm build 开始。该结构在安装生命周期触发 prepare 的环境中会重复编译全部 foundation 包。确认 GitHub runner 实际耗时后，将本地初始化快照构建与 CI 验证分离，避免以安装副作用代替唯一显式构建步骤。

### 低优先级代码健康项

- 当前源码仍有 13 处历史 !important，集中在 Preset 宿主/弹层边界和 Form 错误态。逐处确认第三方覆盖原因，在必须保留的声明旁写明理由；其余改为组件作用域和明确层级规则。
- pnpm verify 构建输出提示 caniuse-lite 数据已过期。通过常规依赖更新 PR 刷新 Browserslist 数据并检查目标浏览器策略。
- 已有中英文文档和详细 API 表，但没有自动从 TypeScript 声明生成 API 对比。公开包新增/改名/删除属性时，将声明 API 报告、Demo API 表、回归用例和 Changeset 放入同一发布流程。

### 企业级实施路线

| 阶段                            | 优先工作                                                                                                                                                   | 可验收结果                                                                                |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **P0：下一次公开包/生产接入前** | 修复 React peer/dependency 约束；为 iframe 同源场景加运行时保护或安全策略；确认目标 React 版本和支持矩阵。                                                 | React 18/19 外部 tarball 消费者测试通过；没有双 React；同源和跨源 iframe 安全用例通过。   |
| **P1：2–4 周**                  | 为六种运行模式建立 Playwright 冒烟和关键交互回归；增加 axe/键盘焦点检查；接入 CodeQL、依赖更新、Secret Scanning/Push Protection；固定 Actions commit SHA。 | PR 必需检查能覆盖深链、权限、Bridge、Drawer、主题/语言、关键响应式和约定目标浏览器。      |
| **P2：30–60 天**                | 拆分 11 个超限基座文件和 4 个超大 Demo；加架构规则检查；合并重复 CSS；建立 bundle 与首屏性能预算、API report、release provenance。                         | 文件规模违规逐步归零或进入批准例外；包大小、首屏字节和 API breaking change 在发布前可见。 |
| **P3：生产接入门禁**            | 连接真实 SSO/菜单/权限 API、监控适配器、HTTPS/CSP/CDN、SPA fallback、灰度和成对回滚。                                                                      | 生产清单每一项均有环境、负责人、测试证据和回滚结果；完成平台/业务共同签收。               |

### 当时决策（2026-10-23 历史快照）

- **可以进入：** 工程评审、内部 Demo、架构验证和带明确集成负责人的受控试点准备。
- **生产批准暂缓：** F-01/F-02 兼容与隔离策略需要先明确；随后完成真实身份/权限/部署环境验收以及可重复浏览器 CI。
- 代码未做改动、未暂存或发布；本轮改动仅为中英文审计文档。完整交付前仍应在提交时复核 staged diff 和远端仓库安全设置。

## 2026-10-25 全面复审、优化结果与评分

### 执行摘要

本节是当前审计口径；上方按日期记录的 2026-10-23 结论保留为历史快照。审计检查了工作区架构与包边界、React peer 契约、Runtime iframe 安全、Vercel 回退配置、主要实现文件规模、Preset CSS 产物、Demo gzip 预算、CI/供应链配置、已配置回归门禁和本地 390px 浏览器表现。当前代码改动仍留在工作树，没有暂存、提交、发布或部署。

**评分：84/100。** 包级构建与维护门禁较扎实，React 版本分裂、同源 iframe 风险入口、Preset 重复 CSS 和三个窄屏组件问题均已处理；本轮进一步定位到 `main` 未受保护导致普通 push 可触发 npm 发布，已经在工作树增加 Release PR 来源校验。剩余主要风险仍在真实部署：线上旧 JS URL 返回可缓存 HTML，Vercel 修正尚未部署；`.reduce` 具体首因不明；GitHub required checks、浏览器 E2E/无障碍门禁、真实 SSO、CSP、网关、监控和回滚尚未完成目标环境验收。因此结果可以交付代码评审和预发布验收，不能解释为生产发布批准。

### 评分报告

| 维度                |       得分 | 依据                                                                                                                                               |
| ------------------- | ---------: | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 架构边界与包设计    |      23/25 | Portal/APP、Runtime/Preset、UI/Pro 边界清晰；八个 React 公共包使用一致宿主版本，iframe 同源配置 fail-closed。扣分项是生产集成证据仍在仓库外。      |
| 公开 API 与消费体验 |      18/20 | React 19 peer 范围统一，公开入口与逐属性 API 文档覆盖较好；此 major 变更仍需要 React 19 外部 tarball 消费者夹具和迁移公告，尚无声明 API 快照门禁。 |
| 自动化回归与 CI     |      17/20 | `pnpm verify` 覆盖包、场景、六个 Demo、测试、静态质量、依赖审计和预算；远端未启用 required checks，关键浏览器、键盘及无障碍回归仍未成为 PR 门禁。  |
| 安全与生产准备      |      12/20 | 同源 iframe 被拒绝，Origin 白名单、Bridge 脱敏、Actions SHA 固定、CodeQL/Dependabot 已落地；`main` 未保护且线上旧资源回退错误尚未部署修复。        |
| 可维护性与发布治理  |      14/15 | 核心大文件拆分、CSS 单产物、文件规模和 gzip 预算、Changesets 范围修正及 Release PR 来源校验已落地；远端分支规则仍需管理员配置。                    |
| **总分**            | **84/100** | **工程质量达到可审查、可预发布验证水平；生产签核仍依赖线上故障闭环、GitHub 分支规则和宿主环境验收。**                                              |

评分表示此工作树的工程状态和企业接入准备度，不表示线上服务已修复，也不表示任何外部系统或生产控制已验证。

### 全量回归与运行态证据

| 检查项                | 结果                                                                                                                                                                                                                                                                                                                             |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm verify`         | **PASS，退出码 0。** 包含 React peer 合同、源码规模、类型检查、18 个公开包打包目标、已配置单测与 10 项发布来源用例、ESLint、Prettier、Knip、生产依赖审计、100 个 CLI 输入、7 种 preset/环境构建、六个 Demo 构建、体积预算及 `git diff --check`。npm audit 未报告已知生产依赖漏洞；仍提示 `caniuse-lite` 数据过期。               |
| React peer 检查       | **PASS。** 8 个公共包声明 `react: ^19.0.0` peer；开发期依赖与该范围一致，Runtime 包不把 React/ReactDOM 作为运行时依赖。React 19 是正式稳定版；本次将 React 18 宿主支持移除并准备 major Changeset，尚未发布。                                                                                                                     |
| 源码规模门禁          | **PASS。** 除显式例外外，不允许新增超过 800 行的 TS/JS 源文件。8 个旧例外均有负责人、原因和 2026-12-31 复审时间，且没有超过登记上限。组件实现拆分已显著降低单文件集中度；Demo 目录和部分长测试仍待继续拆分。                                                                                                                     |
| Preset CSS 与构建预算 | **PASS。** `packages/preset/dist` 仅生成 `styles.css`，旧 CSS 子路径保持兼容映射；Preset CSS 为 **11.4 KiB gzip**（门槛 128 KiB）。六个 Demo 最大单 JS chunk 为 **188.4–201.8 KiB gzip**（门槛 280 KiB），总 JS/CSS 均在预算内。预算检查测量的是构建产物总量和 chunk，不等同于首屏网络瀑布或 Core Web Vitals。                   |
| 六个 Demo gzip 结果   | **PASS。** JS/CSS 总量：main-a **685.4 KiB**、main-b **339.4 KiB**、child-app **339.6 KiB**、vue-child **361.5 KiB**、html-child **336.9 KiB**、layout-custom **321.8 KiB**。门槛分别为 JS 900 KiB、CSS 220 KiB、JS+CSS 1120 KiB。                                                                                               |
| 390px 窄屏手动抽查    | **PASS（本地浏览器）。** RangeTimePicker 弹层 rect 为 left 8px/right 382px/width 374px，文档宽度仍为 390px；时间列和预设区留在浮层内。Switch 白色 thumb 保持圆形。Form.List 在自身可滚动容器内横向查看后续列，没有把外层页面撑宽。窄屏 Portal 双侧导航仍占较大宽度，内容密度仍值得单独产品决策。                                 |
| 线上旧 hash 资源      | **FAIL（线上当前状态，尚未部署修正）。** 2026-10-25 `/b46ebfbd.js` 返回 HTTP 200、`text/html; charset=utf-8`、`Content-Disposition: index.html`，响应缓存策略允许本地缓存 4 小时；对应 `.map` 返回 403。当前入口引用 `8a24170d.js`、`7f1f1676.js`、`412acc6b.js`，三个均返回 JavaScript MIME，当前入口包中没有 `b46ebfbd` 资源。 |
| Release workflow 历史 | **FAIL（远端策略，代码防线待合并）。** GitHub 报告 `main.protected=false`。2026-10-23 `Docs: NEW VERSION FIRST` 直接 push 到 `main`，没有关联 PR；Release run [39960428226](https://github.com/biugle/biu/actions/runs/39960428226) 成功，同一窗口发布 18 个包版本。当前 Changesets 来源校验仅存在于未提交工作树。               |

390px DOM 复核记录：Form.List 内部横向滚动视口为 102px、内容宽 248px（实测 `scrollLeft=128`），`documentElement.scrollWidth` 仍为 390px；Switch track 为 42×24px，thumb 为 18×18px、`border-radius: 50%` 且 `flex-shrink: 0`。完成窄屏 Form/组件页交互后，当前标签没有捕获到 error/warn 级 console 日志。

### 用户反馈的线上 `.reduce` 报错

**锐评：哈希本身没有证据显示发生冲突；被证实的是旧部署资源与当前资源集不一致，以及 SPA fallback 把缺失脚本伪装成成功的 HTML。** 当前 `/` 入口加载 `8a24170d.js`、`7f1f1676.js`、`412acc6b.js`，不再引用 `b46ebfbd.js`；旧 hash URL 仍返回 `index.html`，其响应声明可本地缓存 4 小时。内容哈希只保证不同构建产物使用不同 URL，不会让旧部署的 lazy chunk 在切换新部署后继续存在。仓库中没有注册 Service Worker 的实现；当前工作树的 `ComponentUIShowcase/index.tsx` 也没有直接调用 `.reduce()`，相关库代码的 reduce 调用均来自数组或受类型/分支保护。由于线上 source map 返回 403，无法把旧 minified frame 映射到当前源码。用户报告的延迟进入场景与旧页面/旧 runtime 请求旧 chunk 相符，但 `.reduce` 是否由 chunk 缺失触发，还是旧 bundle 中的独立运行时错误，仍无法定论。

工作树的 [vercel.json](../vercel.json) 已调整为先查静态文件、仅对无扩展名路径执行 SPA fallback、对缺失的带扩展名资源返回 `no-store` 404，并让 `/`、`/index.html` 与 SPA fallback 使用 `no-cache, no-store, must-revalidate`。线上尚未更新。生产验收需要：部署后确认真实 JS 返回 JavaScript MIME、未知 `.js` 返回 404 而非 HTML、入口响应不被边缘缓存；在无法保留旧 chunk 的 Vercel 部署中验证旧页面能通过 Runtime 错误边界提示刷新；按部署版本启用私有 source map/错误监控并收集异常首行、Build ID、浏览器版本与 chunk 请求结果。完成这些步骤前，`.reduce` 原因必须标为**未定位**。

### CI/CD 与 Changesets 历史核查

- **正常发布样例：** 2026-10-08 的 Changesets PR [#6](https://github.com/biugle/biu/pull/6) 由 `changeset-release/main` 生成并合并，随后 Release workflow 发布 0.6 系列；这是预期的 PR 发布流。
- **直接发布的真实原因：** 2026-10-23 的 `Docs: NEW VERSION FIRST`（commit `3e7e40d`）直接成为 `main` 新 HEAD，GitHub commit-to-PR API 返回空结果；该提交更新 18 个公开包 manifest 版本，没有待处理 Changeset 发布文件。Release workflow [run 39960428226](https://github.com/biugle/biu/actions/runs/39960428226) 于 13:20–13:25 UTC 成功，18 个 v1 GitHub Releases/npm 版本在该时间窗口产生。Release workflow 监听所有 `main` push；Changesets Action 检测到本地 package 版本高于 registry 后执行 `pnpm release`，旧脚本没有检查提交是否来自 Release PR。
- **部署是另一条链路：** `.github/workflows/deploy-demo.yml` 只构建并上传验收 artifact，不调用 Vercel。若 Vercel Project 关联此 GitHub 仓库，Production 部署由 Vercel 原生 Git 集成独立触发；所以直接 push 既可能触发 Release workflow，也可能触发 Vercel 部署，但这两个动作不是同一个 workflow。
- **远端规则状态：** GitHub Branch API 返回 `main.protected=false`，普通 push 可以绕过 PR/required checks。无认证请求无法读取保护规则详情和 Actions 日志；当前环境没有 `gh` CLI 或 GitHub/Vercel 管理凭据，不能通过本地工作区启用 Ruleset 或核验 Vercel Project 的 Production Branch。
- **本轮代码防线：** `pnpm release:publish` 先执行 `scripts/verify-release-origin.mjs`，要求 GitHub API 将当前 SHA 关联到同仓库、已合并且符合 `changeset-release/<branch>`、目标分支和固定标题契约的 PR；校验不绑定 PR 创建者，因此兼容默认 `GITHUB_TOKEN` 和 PAT 作者。Oct 8 的 release merge commit 关联到 PR #6，而 Oct 23 的普通 push 不关联 PR。该门禁有隔离 GitHub API 的本地回归测试，并由 `pnpm verify` 执行。发布脚本通过来源检查后才运行 `changeset publish`。这项修正合并到 `main` 后可阻止普通 push/手工改版本触发 npm 发布，但**不会**阻止直推触发 Vercel。
- **Changesets 版本范围：** `pnpm changeset status` 报告 8 个 React 包 major：adapter-react、preset、runtime、icons、react-components、react-form、react-table、tanstack-query；5 个 patch：biu-cli、biu-i18n，以及因内部依赖升级联动的 biu-bridge、biu-router、biu-store；没有 minor 包。CLI 共享 Preset CSS 快照改造和 i18n 新错误文案各自有 patch Changeset。
- **远端管理员待办：** 在 GitHub 启用 main Ruleset，要求 Pull Request、CI `validate`、禁止强推/删除并限制 bypass。Changesets Action 默认使用 `GITHUB_TOKEN`，GitHub 不会为该 token 触发的 PR 自动运行其他 workflow；如果 Release PR 也必须通过 required CI，配置最小权限 fine-grained PAT 到 `CHANGESETS_GITHUB_TOKEN`（workflow 已优先读取该 secret），再确认 bot PR 实际产生该检查。分支保护完成前，来源 guard 只拦截 npm 发布，不拦截 Vercel 生产部署。

### 已完成的优化

- **React 主版本：** React 19 已于 2024 年正式发布，当前是稳定正式版。对新一代公共组件基座，统一到 React 19 比继续在 peer 与 runtime 依赖中混用 18/19 更可预测。8 个包统一声明 React `^19.0.0` peer，移除重复 React runtime 安装，并加入合同检查与 major Changeset。消费者需要升级到 React 19 后再采用新 major；不得宣称 React 18 兼容。
- **iframe sandbox：** 保留 `allow-scripts` 和 `allow-same-origin`，但 Runtime 现在拒绝与 Portal 相同 origin 的 iframe APP。对独立子域 APP，sandbox origin 仍受浏览器同源策略隔离；移除 `allow-same-origin` 会让 APP 获得 opaque origin，破坏 Cookie/存储依赖和精确 Origin 的 Bridge 校验。生产仍必须使用独立 HTTPS Origin、精确 `ALLOWED_ORIGINS` 和认证网关；sandbox 不能替代 CSP。
- **大型源码与 CSS：** React Components、Preset、Runtime、CLI、Table 的集中实现已拆成按职责/组件归属文件；Preset 只发布一个共享 CSS 文件，旧子路径别名仍指向它。CLI foundation 快照检查同步改为单样式产物契约。
- **维护与供应链门禁：** `pnpm verify` 增加 React peer 合同、800 行源码规模例外清单、Preset/Demo gzip 预算；GitHub Actions 固定到 commit SHA，增加 Dependabot 与 CodeQL workflow。npm 生产依赖审计通过。
- **Changesets 发布来源：** 新增发布前 GitHub PR 关联校验，避免普通 main push 或手工版本号误触发 npm 发布；补充 CLI 和 i18n 的 patch Changeset。远端 main 保护仍需要管理员启用。
- **用户反馈的移动端控件：** RangeTimePicker 浮层按窄视口收敛；Switch thumb 禁止横向压缩；Form.List 使用内部横向滚动区。这三项均在 390px 本地视口抽查。
- **触屏输入兜底：** 多选 Select 按触发器宽度收缩标签并聚合为 `+N`；窄容器 Transfer 上下排列两个列表并纵向排列操作按钮；Tooltip/Ellipsis 支持可取消的长按提示；copyOnHover 和 Preset 展开侧栏的 hover 操作在粗指针设备可见；EditableTable 桌面仍双击，触屏单击与 Enter/Space 可编辑。每项均有针对性回归用例。
- **非 ReactDOM 包：** Icons、TanStack Query 不再声明无需要的 ReactDOM peer/开发依赖；`FileView`、`TooltipRoot` 兼容导出通过显式包装器保留既有调用形态。

### 尚存问题与企业级路线

| 优先级                | 问题/工作                                                                                                                                        | 完成标准                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| **P0 生产前**         | 合并 Release PR 来源 guard；启用 main Ruleset；部署 Vercel 回退/缓存修正；用完整 source map/错误首行闭环 `.reduce`。                             | 普通 push 无法 npm publish；分支 required checks 生效；缺失脚本不回 HTML；错误映射到源码和 Build ID。 |
| **P0 生产前**         | 在目标环境验收 Portal/APP 域名、HTTPS、`ALLOWED_ORIGINS`、CSP `frame-src`/`frame-ancestors`、Cookie 属性、SSO/权限撤销、监控脱敏及成对回滚。     | 平台/业务负责人逐项签名并保留环境证据、负责人和回滚记录。                                             |
| **P1 下一个发布周期** | 增加 React 19 packed-consumer 安装/渲染夹具；补充 React 18 → 19 major 迁移说明；增加 API 声明快照。                                              | 从打包 tarball 安装所有 React 包，无重复 React，实际 mount/render 成功；Breaking API diff 可审阅。    |
| **P1 下一个发布周期** | 将 Portal/APP、iframe 错误重试、深链刷新、Bridge 来源拒绝、390/560/800px 响应式和 Form/Picker 等关键浏览器场景加入必需 CI；加入键盘和 axe 检查。 | PR 可自动阻止关键路由、交互、无障碍和主要断点回归。                                                   |
| **P2 30–60 天**       | 拆分 `source-size-baseline.json` 中 8 个例外：4 个组件测试、4 个超大 Demo 页面；收敛窄屏 Portal 双导航占比。                                     | 例外数量逐步归零，或每次延期仍有负责人、原因和截止日；移动端主要内容达到业务可用宽度。                |
| **P2 30–60 天**       | 继续建立真实首屏分析、Core Web Vitals 趋势、许可证策略、npm Trusted Publishing/provenance 和远端 secret scanning/branch protection。             | 预算按关键路由首屏而非仅所有构建文件总 gzip 设定；远端保护配置由仓库管理员提供可验证证据。            |

### 最终结论

**客观评价：** Biu 的包边界、组件覆盖、文档密度和本地交付自动化明显优于普通 Demo 基座；代码层欠账已明显收敛。但远端 main 曾允许直接 push 并触发 18 个包的实际发布，说明此前 Release 流程在团队规则之外并不安全。本轮加了来源 guard，但它尚未合并；GitHub main 保护也仍关闭。线上还存在旧资源 URL 返回 HTML 的直接证据，用户报告的 `.reduce` 首因待 source map 与完整错误栈确认，宿主认证/安全头/监控/回滚没有真实环境验收。完成 P0 并在 Vercel 上验收之前，不建议生产签核。

本轮 `pnpm verify` 已通过；代码、文档和配置修改均保留在未提交工作树。没有执行 Git stage、commit、npm 发布或线上部署。

## 2026-10-26 旧 hash 资源恢复、触屏交互与发布流水线复核

### 当前评分

**88/100。** 相比 2026-10-25 的 84 分，自动回归与生产韧性各增加 1 分；本轮又通过可审计的 Tooltip 触屏 API 文档、窄屏 Select/Transfer 与 EditableTable 触屏/键盘回归，各增加 1 分。缺失静态资源的 Vercel 路由有门禁；Runtime 对明确识别的 lazy chunk 错误最多尝试一次恢复；普通 main push 不再进入 npm 发布命令。生产域名尚未部署验证，所以没有把线上风险记为关闭。

| 维度                |       得分 | 当前判断                                                                                                                      |
| ------------------- | ---------: | ----------------------------------------------------------------------------------------------------------------------------- |
| 架构边界与包设计    |      23/25 | 模块与运行边界稳定；生产环境集成证据仍不足。                                                                                  |
| 公开 API 与消费体验 |      19/20 | React 19 peer 契约一致；Tooltip 触屏策略已加入公开 API 表、README 和 Changeset；仍缺 tarball 外部消费夹具和迁移演练。         |
| 自动化回归与 CI     |      19/20 | 全量门禁覆盖窄屏 Select/Transfer、触屏 Tooltip、EditableTable 触屏/键盘和 Preset 操作入口；浏览器 E2E/无障碍仍未成为必需 CI。 |
| 安全与生产准备      |      13/20 | 加入缺失 chunk 恢复与 no-store 404 规则；Production 尚未部署，分支保护与 SSO/CSP/监控验收缺证据。                             |
| 可维护性与发布治理  |      14/15 | Changesets 与 Release PR 来源检查齐备；远端管理员规则仍未启用。                                                               |
| **合计**            | **88/100** | **适合代码评审和本地验收，不能据此签生产发布。**                                                                              |

### chunk 问题的判断与修复

哈希碰撞不是现有证据支持的解释。内容哈希让不同构建产物有不同 URL；部署替换后，旧页面仍可能请求旧 lazy chunk。此前旧 URL 命中 SPA fallback，获得 `200 text/html` 并声明 4 小时缓存，这是服务端路由/缓存契约缺陷。刷新重新取入口后恢复，与版本错位相符，但 `.reduce` 首因没有 source map 和完整异常首行，仍标记为未定位。

工作树现在有两层处理：

- [vercel.json](../vercel.json) 先查现存文件；无扩展名路由回退到 `index.html`；缺失的带扩展名资源返回 `404`、`no-store`；入口 HTML 使用 `no-cache, no-store, must-revalidate`。新增 `pnpm verify:vercel-routing` 锁住路由顺序、JS/CSS/map 404 和入口缓存规则。
- Runtime 只识别动态模块、Webpack/Rsbuild chunk 加载失败，及带 JS 资源栈的 HTML 解析失败；在 `sessionStorage` 按页面和资源做 10 分钟冷却，最多自动刷新一次。同一失败再次发生或存储不可用时，错误边界显示“页面资源加载失败，可能是页面版本已更新”及手动刷新按钮。普通业务异常（包括单独的 `.reduce` TypeError）不会自动刷新，避免掩盖真实代码错误或造成刷新循环。错误监控事件增加 `CHUNK_LOAD` 分类。

这套处理不会让已删除的旧 chunk 重新出现。部署之后，旧页面应得到可识别的 404 并刷新到当前入口；新页面不会把缺失 JS 当成 HTML 成功缓存。部署前仍沿用上次观察到的线上行为，最终以生产请求检查为准。部署验收要检查有效 JS MIME、未知 JS 的 404/no-store、首页 no-cache，并验证旧页面遇到 chunk 失败后只自动刷新一次。

### Tooltip 与触屏交互的组件库对照

本轮核对了 [MUI Tooltip 官方文档](https://mui.com/material-ui/react-tooltip/)（当前页面版本 v9.5.0）和 [Ant Design Tooltip 官方文档](https://ant.design/components/tooltip/)（当前页面版本 v6.6.8）。MUI 对移动端使用长按，默认约 700ms 打开、松手后约 1500ms 收起，并允许用 `disableTouchListener` 关闭；Ant Design 的 `trigger` 默认是 `hover`，可选 `focus`、`click` 和 `contextMenu`，键盘 focus 需显式启用。

Biu 采用分层兜底：说明型 Tooltip 默认沿用 MUI 的触屏长按时序，支持 `touchActivation={false}`；移动超过 10px 会取消，短按仍执行原操作，长按后的合成 click 会被消费。只在悬停时出现的复制、收藏/新标签和表格尺寸操作，在粗指针设备上改为可见；EditableTable 保留桌面双击，同时允许触屏单击及键盘 Enter/Space 进入编辑，并排除单元格里的链接和按钮。这样不把每个 Tooltip 都改成 click，避免说明浮层和按钮原有点击动作争抢同一次触摸。单测覆盖这些触屏与键盘契约；真实 iOS/Android 浏览器和读屏器仍需纳入后续 E2E/无障碍门禁。

### CI/CD 与 Changesets 复核

2026-10-23 的直接发布原因已在前一节还原：Release workflow 监听所有 main push；那次直接 push 改动了 18 个包版本且没有待处理 Changeset，旧 Changesets Action 因此运行 publish。当前发布入口通过 `scripts/release-publish.mjs` 先校验当前 commit 是否关联到同仓库已合并的 `changeset-release/<branch>` PR：普通 main push 会安全跳过 `changeset publish`；只有来源通过才执行发布；GitHub API 不能验证来源时失败关闭。新增 13 项来源/执行器回归覆盖正常 Release PR、普通 push、伪造/错误 PR 和 GitHub API 失败。

这没有阻止 Vercel 原生 Git 对 main push 自动部署。最近一次远端检查仍显示 `main.protected=false`；仓库管理员仍需设置 required PR/CI Ruleset。Release workflow 由 Actions SHA 固定、在 Changesets 前跑 `pnpm verify`；`deploy-demo.yml` 只上传验收 artifact，不是 Vercel 部署流程。`stale-chunk-recovery`、`touch-interaction-fallbacks` 和 `responsive-range-controls` Changesets 分别记录 chunk 恢复和窄屏交互修复。当前 `pnpm changeset status` 显示 8 个 React 19 相关 major，以及 CLI、i18n、Bridge、Router、Store 的 5 个 patch；React 18 peer 支持移除是 major 原因，已列 major 的包会将兼容功能说明并入该主版本发布说明。

### 本轮回归与验收状态

- `pnpm verify`：通过，退出码 0。覆盖 18 个公开包打包、全包和 Demo 类型检查、全量单测、ESLint、Prettier、Knip、生产依赖审计、100 个 CLI 创建输入、7 个 preset/环境组合、6 个 Demo 构建、构建体积预算和 `git diff --check`。
- 新增定向回归：Runtime 24 项通过；发布来源/跳过逻辑 13 项通过；Vercel 路由契约检查通过。依赖审计无已知生产漏洞；构建仍提示已有 `caniuse-lite` 数据过期。
- 本地验收服务在清理旧产物、重建基础包后启动于 `http://localhost:9001`，React 子应用 `http://localhost:8001`，Vue 子应用 `http://localhost:8002`。服务使用新生成的 foundation 快照；可从 Portal A 的 `ComponentUIShowcase` 验收。
- 清理、重建并重启后的窄屏浏览器复核：自然视口为 457×665，RangeTimePicker 弹层宽 441px、可滚动内容高 553px/可视高 347px；起止时间上下排列，滚动后“确定”可见，页面宽度仍为 457px。Form.List 横向滚动视口为 158px、内容宽 674px（`scrollLeft=516`）；最右行边框与滚动视口右边界同在 x=408，页面宽度仍为 457px，边界没有把滚动区撑出容器。另在 390×844 窄屏复核 Select：标签区显示一个选中项和 `+5`，页面 `scrollWidth` 为 390px；打开下拉后选项最右到 x=377、最下到 y=813，均处于视口内，控制台无 error/warn。Transfer 在同一窄屏下按单列上下排列两个列表，操作按钮纵向堆叠。
- 重启后服务冒烟检查：Portal A、React APP、Vue APP 分别在 9001、8001、8002 返回 HTTP 200。浏览器日志只保留重启前 08:10:50/51 UTC 的两条旧错误：包清理/重建期间旧 watcher 暂时读不到 `@biugle/biu-adapter-react`，随后对应 HMR 更新中止并整页重载；截至 08:19 UTC 的复查没有重启后新增的 error/warn 日志。
- 改动仍保留在未暂存工作树；没有提交、创建/推送 PR、npm 发布或线上部署。线上 chunk 修复仍待部署并做真实域名复核。

### 2026-10-26 Sidebar 三态控制浏览器验收

本轮在本地 Portal A 的组件能力页及基座能力页完成交互验收。浏览器最终恢复到 ComponentUIShowcase 的 Transfer 锚点，菜单处于默认展开态，并保留为验收页面。

- **默认展开与最小化：** 顶部侧栏边界按钮把完整菜单收为 60px 图标栏，按钮名称切换为“展开菜单栏”；再次点击直接恢复完整菜单。实际截图确认按钮位于菜单与主内容区交界处。
- **完全隐藏与恢复：** 展开态侧栏底部第一项“隐藏菜单栏”可完全隐藏导航。隐藏期间导航从可访问性树中移除，边界恢复按钮仍可访问；点击后完整菜单及底部工具栏恢复。导航栏没有重复的侧栏控制按钮。
- **布局覆盖同步：** PlatformCapabilities 的展开、折叠、隐藏操作分别输出一致的 hideSidebar/collapseSidebar 状态；顶部恢复操作把两项状态都设为 false；“重置覆盖”恢复空对象。验收结束时已清空页面覆盖。
- **lockSidebar：** 演示页没有可交互的锁定开关，因此本轮没有声称完成运行态切换验证。实现与定向回归检查确认边界按钮、工具栏隐藏按钮和菜单设置项均受 lockSidebar 禁用，状态切换处理器也会在锁定时提前返回。
- **控制台：** 最终日志没有 error。仅有一条 10:17:36 UTC 的旧 HMR lazy-compilation-proxy warning，早于本轮菜单交互；验收期间没有新增错误或警告。

本次浏览器证据补充了 88/100 交付评分中的 Preset 菜单操作回归记录，不改变评分。最终 `pnpm verify` 已在本轮最新源码上完成并通过；本轮新增的 lockSidebar 静态契约断言另行定向复核。

### 2026-10-26 窄屏控件与标准表格滚动收尾

- **多选 Select：** 响应式模式先减少普通标签数量，空间不足时保留紫色、不可压缩的 `+N` 汇总；窄触发器收紧间距和尾部图标占位。测试覆盖 80/160/220px 触发器宽度。
- **Tooltip / Ellipsis：** 触屏长按显示说明；纯文本省略项允许短按短暂显示完整内容；位于按钮、链接、菜单等交互祖先内的短按仍执行原动作。菜单标签明确显示 `pointer`，禁用项保持 `not-allowed`。
- **Transfer：** 宽容器维持桌面双栏和左右箭头；窄容器将两个列表上下排列，中间一行放置两个操作按钮，并按上下顺序使用下/上箭头。
- **RangeTimePicker：** 面板宽度受视口约束，桌面不产生横向溢出；窄屏起止控件换行，面板内容可纵向滚动。
- **标准 Table：** 即使调用方只传 `scroll.x` 而未传 `scroll.y`，内部视口也允许纵向滚动；`TableBox`、`ProTable` 和 Table 的 flex 链路继续传递剩余高度。滚动样式抽到独立模块后，`table.tsx` 为 799 行；新回归放入独立测试文件，旧测试文件回到其 4057 行预算。
- **最新全量门禁：** `pnpm verify` 通过，覆盖 18 个包打包、所有包与 Demo 类型检查、全部单测、lint/format、依赖审计、CLI/Preset 场景、6 个 Demo 构建、体积预算和 diff 检查。第一轮门禁曾发现以上文件预算超限；拆分后完整重跑通过。构建仅保留 `caniuse-lite` 数据过期提示。
- **验收边界：** 清理并重建后，Portal A/React APP/Vue APP 服务分别在 9001/8001/8002 返回 HTTP 200。最新这组视觉调整尚未做新的设备截图验收，当前服务留给验收者进行真实小屏确认；生产 chunk 修复仍未部署。

## 2026-10-26 Table 拖动、代码安全与内存生命周期复审

### Table 列宽和行高拖动结论

**设计通过，当前没有发现需要改动公共交互模型的阻断问题。** 列宽与行高调整默认关闭，调用方显式开启后才出现手柄；受控值通过变更回调提交，非受控值由 Table 管理。拖动按列宽/行高边界限制，兼容固定列、分组表头、RTL 和虚拟行；方向键与 Home/End 可调整尺寸，手柄提供 separator 语义和当前值。pointerup、pointercancel、窗口失焦、布局配置变化和组件卸载都会结束本次会话并释放全局监听器及指针捕获。

普通表格的行高预览只改活动行及其单元格 DOM，pointermove 不再重渲染整张表；虚拟表格仍通过 React 更新行尺寸，以便虚拟器重新计算后续偏移。列宽拖动保存必要的列/表头快照，在每次指针移动时更新列宽、补偿列和预览线；工作量随列数增长，与行数无关。标准管理表使用几十列时是合理取舍；列数达到数百或实测出现掉帧后，再考虑按 animation frame 合并预览更新并做浏览器性能对比。

有两项体验边界应继续留意：触屏端列宽手柄宽 18px、行高手柄高 10px，虽已常显且支持 Pointer Events，行高边界仍不容易精确命中；扩大命中区前要在手机上确认不会挡住末列操作内容。未启用虚拟化的 Table 会为全部数据行创建 DOM，超大数据应提供稳定 rowKey 并评估 virtual；拖动优化不能代替数据量对应的渲染策略。

### 全仓安全与资源生命周期

- 生产依赖审计未报告当前 lockfile 中的已知漏洞。人工静态搜索没有发现可直接确认的高危执行器；本结论不等同于独立 SAST、渗透测试或“零漏洞”证明。CodeQL workflow 已配置，但本次本地 pnpm verify 不运行 CodeQL，远端扫描结果需查看 GitHub Actions。
- HTML Adapter 的 renderPage 使用 innerHTML，当前注释明确要求内容来自应用自身可信模块。不得将用户输入或接口返回的原始 HTML 直接传入；消息正文使用 textContent，消息图标使用固定 SVG 字符串。
- Runtime Bridge 对消息来源和精确 Origin 做校验；远程 APP URL 还需通过允许 Origin 检查。iframe 的 allow-scripts / allow-same-origin 组合只用于独立跨 Origin APP，Runtime 会拒绝 Portal 同源 APP。文件预览 URL 限制协议，PDF/文本预览 iframe 不获得 allow-same-origin。
- 生命周期抽查覆盖了 Runtime 的 message/resize/popstate 监听、请求和超时取消，Table 拖动会话、Table/Select/PageFilter 的 ResizeObserver，Overlay 的共享 ResizeObserver/IntersectionObserver 与 animation frame，文件预览 Object URL 回收，水印 MutationObserver/节流定时器，以及 Logger/查询刷新 interval；检查到的实例都有对应取消、移除、断开或卸载路径。
- HTTP 合并 AbortSignal 已修复：请求结束、内部取消和准备阶段异常都会移除调用方长期复用的 signal listener；否则共享 signal 会随着请求数累积监听器。该修复已有 HTTP 回归测试。
- 既往开发验收曾观测到 locale 资源请求循环，并在浏览器任务管理器中记录过约 13.1GB 内存；根因是 Runtime 重渲染时重复创建默认 locale 配置引用，造成请求 effect 反复运行。稳定引用后新增真实挂载回归，断言状态更新后只请求一次。该历史故障已在代码层关闭，但不应把短时本地服务 RSS 采样当作浏览器长期 heap 测试。

### 发现项与可用性建议

| 优先级 | 发现                                                                                                         | 影响与建议                                                                                                                                          |
| ------ | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1     | 线上旧 hash 的 .js 曾返回可缓存 HTML；生产站点还没有部署验证本地 Vercel 路由规则和 Runtime 单次 chunk 恢复。 | 继续按前文 P0 清单部署并检查有效 JS MIME、未知 JS 的 404/no-store、入口 HTML 不缓存和旧页面只刷新一次。.reduce 首因仍需 source map 与异常首行确认。 |
| P1     | 最近一次远端检查显示 GitHub main 未启用保护，Release PR 来源校验仍在当前工作树。                             | 合并代码防线并由仓库管理员启用 required PR/checks；普通 main push 是否能发布的最终证据必须来自真实 Actions 运行。                                   |
| P2     | 触屏行高手柄只有 10px 高；Table 默认非虚拟模式会渲染完整数据集。                                             | 将命中区作为独立体验改进评估；大数据使用 virtual 与稳定 rowKey，并用真实设备和浏览器 Performance/Memory 面板验收。                                  |
| P2     | useQueryTable 的 resetOnUnmount 不改变运行行为：请求本来就在卸载时取消，Hook 状态也随组件销毁。              | 保留当前兼容性；下一次公开 API major 中考虑弃用/移除，或明确它仅用于表达局部状态所有权，避免调用方误以为它控制跨挂载缓存。                          |
| P2     | 当前自动门禁没有真实浏览器 E2E、可访问性和长期 heap soak 必需检查。                                          | 以 PR 浏览器矩阵覆盖 Portal/APP、键盘/触屏和关键拖动；对长列表、重复路由挂载、反复上传/预览做至少 30 分钟 heap 趋势回归。                           |

**评分维持 88/100。** 本次确认了 Table 拖动的状态边界和关键资源清理路径，并覆盖了 HTTP 长生命周期 signal 的实际监听器累积问题。总分仍按企业接入准备度评估；线上 chunk 修正、Release PR 防线、分支保护、生产 SSO/CSP/监控和浏览器自动门禁尚未取得新的外部验收证据。

### 回归与交付边界

- 最新一次完整 pnpm verify 在上述代码变更后通过，退出码 0；包括所有已配置单测、18 个公开包打包、类型检查、Lint/Prettier/Knip、生产依赖审计、CLI/Preset 场景、六个 Demo 构建、体积预算和 git diff 检查。定向测试结果：react-table 100/100、react-components 154/154、http 31/31。
- 当前没有本轮新的真实浏览器 heap snapshot、长时间压力测试、生产部署或 CodeQL Action 运行结果。依赖审计通过不能证明业务输入安全或不存在内存峰值。
- 复查时本地 Portal A/React APP/Vue APP 分别在 9001/8001/8002 返回 HTTP 200，可用于验收。所有代码和文档仍保留在未暂存工作树；没有提交、创建 PR、发布包或部署生产。

## 2026-10-26 全量回归复跑、产物清理与重新评分

- **清理与重建：** 先停止 9001/8001/8002 服务，盘点后删除六个 Demo 的 `.biu/` 与 `dist/`，以及 18 个公共包的 `dist/`；验收末尾也清除 Husky 自动生成的 `.husky/_/`，保留 `.husky/pre-commit`。未触碰 `.git/`、`node_modules/`、源码和已有工作树改动。随后重新运行全量门禁、构建六个 Demo，并通过 CLI 启动服务以重新生成 foundation 快照。
- **全量门禁：** 本轮 `pnpm verify` 退出码 0。React peer 统一契约、源码行数预算、Vercel 缺失资源路由检查、全包/Demo TypeScript 检查、18 个公开包打包、所有配置单测、ESLint、Prettier、Knip、生产依赖审计、100 个 CLI 输入、7 种 Portal/APP 与环境场景、六个 Demo 构建、构建体积预算和 `git diff --check` 均通过。生产依赖审计报告未发现已知漏洞。构建仍输出既有的 `caniuse-lite` 数据过期提示，不影响本次构建。
- **服务验收：** 使用 `pnpm start --filter main-a -- --apps ../child-app,../vue-child` 重启后，`http://localhost:9001/`、`http://localhost:8001/` 和 `http://localhost:8002/` 均返回 `200 text/html`；三项服务仍在运行，可直接打开验收。
- **内存观察：** 启动约 27 秒后，三个本地 Node 开发进程的单次 RSS 采样约为 268 MiB（Portal A）、239 MiB（React APP）和 262 MiB（Vue APP）。这些值包括开发服务器/打包器进程，不是浏览器页面 heap；单次 RSS 不能证明泄漏或证明不存在泄漏。本轮没有浏览器 heap snapshot、长时间压力测试或移动端真机内存趋势结果。
- **代码质量与生命周期：** 本轮全量门禁重新覆盖 HTTP AbortSignal 清理、Runtime 语言资源只请求一次、chunk 自动恢复限流、Table 拖动会话清理等回归；既有静态生命周期抽查所覆盖的事件监听、Observer、定时器、Object URL 和卸载清理记录见上文。未发现门禁失败或新的阻断项。
- **重新评分：88/100（维持）。** 本轮干净清理后的重新构建、全量门禁和 HTTP 冒烟验证提升了本地回归可信度，但没有新增生产部署证据、远端分支保护/Release Action 证据、真实浏览器自动化或 heap soak，因此不据此虚增企业生产就绪分。生产旧 chunk 回退、GitHub 分支保护和 30 分钟浏览器堆趋势仍是待闭环事项。
- **交付边界：** 本轮只新增本次复验记录；此前源码、Changesets 和 CI/CD 文档改动仍留在未暂存工作树，没有提交、创建/推送 PR、发布包或部署生产。

## 2026-10-27 侧栏展开按钮位置修正

根据验收反馈，侧栏边界控制恢复到 28×28px（图标 14px），回到 60px Header 行的垂直中心，并依据文档根节点 `dir` 分别锚定 LTR/RTL 侧栏边界。水平定位过渡与侧栏宽度使用相同的 220ms 动画，按钮会随边界移动；完全隐藏时锚点落在页面对应的逻辑起始边缘。面包屑左右内边距为 12px。Transfer 在视口宽度不超过 640px 时纵向排列；桌面端只在组件容器不超过 480px 时采用紧凑布局，较宽容器保持双栏横向排列。三态交互与权限行为不变。

侧栏底部操作按状态区分：展开态保留首位“隐藏菜单栏”操作；收起为 60px 图标栏时只显示“菜单选项”配置按钮，避免底部继续显示完整隐藏动作，同时保持菜单展开、折叠和隐藏设置可访问。

## 2026-10-29 工作区全量回归、Changesets 收敛与验收环境

- **全量门禁：** 在停止服务并清理旧生成物后执行 `pnpm verify`，退出码 0。React 19 peer 合同、源码规模预算、Vercel 缺失资源路由、18 个公开包构建/类型检查/打包、6 个 Demo 类型检查与构建、全量配置单测、ESLint、Prettier、Knip、生产依赖审计、100 组 CLI 输入、7 组 Portal/APP preset 环境、构建体积预算和 `git diff --check` 均通过。React peer 检查覆盖 8 个公共包；源码规模门禁没有新增超 800 行文件，8 个已登记旧例外均未超上限。生产依赖审计未报告已知漏洞。
- **构建预算：** 六个 Demo 和 Preset CSS 的预算均通过。Portal A 全部 JS 产物 gzip 合计 617.9 KiB、CSS 81.5 KiB，最大 JS chunk 201.9 KiB；该汇总含异步路由产物，不代表首屏下载量或 LCP。构建仍提示 `caniuse-lite` 数据过期，不阻断门禁。
- **定向回归：** Table resize hardening 与目标列 DOM 预览测试 10/10 通过；Runtime chunk 恢复 4/4；HTTP AbortSignal 与兼容性回归 23/23。Table 覆盖动态列边界、重复拖动渐进补偿、行高预览不重渲染全部行、指针取消回滚和列头/内容对齐。Chunk 自动恢复限制为明确资源失败的单次、按页面/资源冷却恢复；普通业务异常不触发刷新。
- **生命周期与内存检查：** 静态抽查确认 Table 拖动会话在完成/取消/失焦时解绑全局指针监听并释放捕获，几何观察器在 effect 清理时断开；Overlay、Anchor/滚动进度、Runtime 媒体/消息/导航监听及 locale 请求都有清理或取消路径；HTTP 合并的调用方 AbortSignal 监听在请求完成和准备失败时移除。未找到这些检查路径上的确定性泄漏。jsdom 单测与静态检查不等于真实浏览器 heap soak；本轮没有 30 分钟 heap 趋势或真机内存测量。非虚拟 Table 会为完整数据集创建行，大数据应使用分页或虚拟滚动并提供稳定 `rowKey`。
- **文档与 Changesets：** 删除 8 份重复/重叠的阶段 Changesets，合并为 `.changeset/production-ready-known-fixes.md`；`pnpm changeset status` 确认 8 个 major、CLI 1 个 minor、5 个 patch。React 公共集成的 major 变更明确标注升级至 React 19 并停止 React 18 宿主支持。没有删除其他文档：中文/英文文件和架构评审、生产清单、最终交付审计分别被索引引用且职责不同；修正了清单中“11 个文件超限”的过时结论。
- **清理与重启：** 服务停止后移除了 18 个公共包与 6 个 Demo 的旧 `dist/`、`.biu/` 快照及 `node_modules/.cache`；全量构建生成新产物，随后启动 Portal A 与 React/Vue 子应用并重新生成开发快照。Portal `http://localhost:9001/`、Table 尺寸调整路由、React APP `http://localhost:8001/`、Vue APP `http://localhost:8002/` 均返回 `200 text/html`。浏览器当前打开 Table 尺寸调整 Demo，可供验收。
- **评分：88/100（维持）。** 本地全量门禁、包体预算和专项生命周期回归通过；评分不因单测或本地服务结果上调，因为生产旧 hash 缓存修正尚无部署证据、GitHub 远端保护/CodeQL 状态未在本轮验证，也没有真实浏览器长时 heap 测量或端到端 CI 浏览器门禁。
- **发布安全审计补充：** 当前发布候选为 219 个 staged 路径；工作区没有额外 unstaged 或 untracked 文件。对 staged diff 和 3 个本地 stash 执行了高置信凭据与产物路径扫描，没有发现命中。三个 stash 均未应用或改写：`stash@{0}` 是 289 路径的大型历史快照，其中含未加 sandbox 的旧文件预览 iframe 和过时 Changesets；`stash@{1}` 含旧文档 Changeset、README、LICENSE 与包元数据；`stash@{2}` 是 README/包元数据的较小 autostash，与 `stash@{1}` 部分重叠。它们不属于本次候选，尤其不要整体恢复 `stash@{0}`。
- **Bridge 凭据过滤：** `publicAuthContext` 增加了对 API/access/auth/signing key 与 JWT 字段名的递归过滤；调用方仍必须确保 `extra` 的任意值不含秘密信息。Bridge 4 项测试、TypeScript 检查、定向 ESLint/Prettier 和 staged/unstaged `git diff --check` 均通过。完整 `pnpm verify` 是在这项小补丁前通过的，本次未重新运行全量构建以避免改写正在使用的验收产物。
- **远端发布门禁：** 2026-10-29 对 GitHub Branch API 的只读查询仍返回 `main.protected=false`。npm 来源校验能阻止普通 push 直接运行 `changeset publish`，但不会阻止 Vercel 原生 Git 集成部署 `main`。生产部署前需要仓库管理员设置要求 PR/CI、禁止强推和删除的 Ruleset；还需在 GitHub Actions 中确认 `NPM_GIT_BIUGLE` Secret 已配置。若 Release PR 也要求 CI，需配置最小权限的 `CHANGESETS_GITHUB_TOKEN`，否则 GitHub 默认不会为 `GITHUB_TOKEN` 创建的 PR 启动 CI workflow。
- **交付边界：** 本轮修改仍留在 staged 候选中；没有提交、推送、创建 PR、发布 npm 包或部署生产。验收服务保持运行，3 个 stash 原样保留。
- **交付边界：** 源码与文档改动仍在未暂存工作区；没有提交、创建/推送 PR、改包版本、发布 npm 包或部署生产。验收服务保持运行。
