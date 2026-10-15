# 双门户 Demo：main-a / main-b

[English README](README.en.md)

这个示例演示三个同级、独立的 Biu 项目：

- `main-a`：独立 Portal，默认 9001 起步，sidebar Layout，显式开启多标签页；
- `main-b`：独立 Portal，默认 9002 起步，topbar Layout；
- `child-app`：独立 React APP，默认 8001 起步，提供 PageA、PageB；
- `vue-child`：独立 Vue 3 APP，默认 8002 起步，提供 VuePage。

启动方式：

```bash
pnpm start --filter main-a -- --apps ../child-app,../vue-child
pnpm start --filter main-b
pnpm start --filter layout-custom
```

根首页固定为 `src/pages/index.tsx`；Portal 业务页面位于 `src/pages/<Code>`，`src/pages/_*` 仅用于内部页面，不会被 CLI 自动解析。打开启动日志中的 Portal 地址，点击菜单即可看到 Portal 通过当前环境文件中的 `remoteApps.APP_URL` 加载 React 和 Vue 3 子应用。APP 也可以直接打开各自启动日志中的根地址独立开发。

Portal 不把 APP 页面打包进自己的产物；每个项目都输出自己的 `dist/index.html`，上线时分别绑定独立域名。

## 组件能力验收入口

main-a 的能力 Demo 使用真实公开包入口，不复制一套页面组件实现。重点页面如下：

- `/ComponentCapabilities/ComponentUIShowcase`：组件交互、Overlay、Notification、Upload、Anchor、Slider 和 API 表；
- `/FormCapabilities/FormShowcase`：标准 Form、默认尺寸、校验、输入归一化与实际提交值；
- `/TableShowcase`：Table/ProTable/EditableTable、查询、列设置、斑马色和尺寸调整 API；
- `/StandardTableTabsShowcase`、`/StandardTablePageShowcase`：标准 PageBox、Filter、Toolbar、Table、Footer 和分页布局；
- `/EditableTablePageShowcase`：双击编辑、失焦保存、取消/清空/保存操作和分页；
- `/TableResizeShowcase`：列宽边界、行高、弹性列、无弹性列和横向滚动。

页面级查询参数、Zustand store、`api.ts` 和脱敏 `mock.ts` 分离维护；多 Tab 页的根 store 只保存公共 Tab 状态，各 `TabPages/<TabCode>/` 目录拥有自己的页面实现。语言切换、表格筛选和 Drawer 内控件应在这些入口逐项回归。
