# 干净验收说明

## 目的

验收时只看源码、配置、文档和最新一次验证产物。`.biu/` 是开发期生成目录，`dist/` 是构建产物，二者都已在根 `.gitignore` 中按任意层级忽略；它们不属于业务源码，也不会被提交。

## 清理范围

停止正在运行的 Portal、APP 和 Rsbuild 进程后，只清理仓库内明确的以下目录：

```text
packages/*/dist
examples/dev-demo/.biu
examples/dev-demo/dist
examples/dev-demo/apps/*/.biu
examples/dev-demo/apps/*/dist
```

最终交付前删除仓库内全部 `node_modules/` 和 `.pnpm-store/`，确保交付包只包含源码、锁文件、文档和必要配置。需要启动验收时再按锁文件恢复依赖；CI 始终从干净环境安装。

基座包的构建脚本使用 `tsup --clean`，每次重新构建会先清理对应 `packages/*/dist`，避免旧 chunk、旧错误记录或旧路径残留；开发服务使用项目级 `.biu/foundation` 快照，因此涉及基座包、CLI 或 Demo 源码的改动必须先停止服务，清理旧快照后重新构建并启动，不能在服务运行期间删除或替换运行中的 `.biu`/`dist`。

## 推荐验收顺序

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build:demo:all
```

然后分别启动 Portal 和 APP：

```bash
pnpm start --filter main-a -- --apps ../child-app,../vue-child
pnpm start --filter main-b
pnpm start --filter child-app
pnpm start --filter vue-child
pnpm start --filter layout-custom
```

端口以启动日志为准：Portal 默认从 `9001–9999`、APP 默认从 `8001–8888` 递增选择空闲端口。Portal 与 APP 始终是不同服务；Portal 只通过当前环境 `remoteApps[APP_ID].APP_URL` 的 iframe 加载 APP。

验收重点：

- Portal A、Portal B 都能独立打开，且不存在 `/portals/...` 路径前缀；
- APP 能脱离 Portal 独立打开，也能被 Portal 通过 iframe 加载；
- `blank`、`dashboard`、`mobile` 三种官方 preset 通过 CLI 生成项目流程验收，`custom` React 模式由默认 Demo 独立验收；
- React、Vue 3、原生 HTML APP 示例均可构建；
- 菜单加载期间不闪现未授权 fallback，`--all` 只用于排查；
- 语言、主题、时区、方向能同步到 APP；
- Layout、侧栏、Tabs、Drawer/Modal 遮罩和响应式行为正常；
- 菜单选项、收藏、最近使用和搜索弹窗可用；收藏/最近使用按门户隔离，数量上限和还原全部标签行为正常；
- `dist` 按项目分别产出，Portal 产物不包含 APP 页面源码 chunk。
- 用户下拉底部显示 Portal `V...` 和当前 APP `S...` 版本；英文缺失文案按中文/key 顺序兜底。
- `390px` 下侧栏未主动折叠时保留菜单文本，顶部操作区使用图标、箭头和横向滚动，不发生按钮挤压。
- 工具滚动轨道不包含用户头像；搜索、通知和主题保持紧凑图标按钮；侧栏收起按钮只显示图标，目录箭头始终靠右对齐。
- Tabs 使用 Pointer 拖拽提交排序，拖动后的占位虚线统一使用主题色，不能只出现占位而不提交排序。
- 下拉面板在底部空间不足时自动向上翻转；顶部导航小屏门户切换保留文本名称、不渲染冗余下拉箭头，菜单项 hover 保持直角。
- 未知深链进入 404 状态页；认证门禁负责 401，业务或权限接口可使用统一的 `BiuStatusView` 展示 400/401/403/404/500，错误详情支持脱敏复制。
