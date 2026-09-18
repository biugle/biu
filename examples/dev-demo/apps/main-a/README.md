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
