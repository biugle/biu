# html-child

独立原生 HTML APP Demo，项目 Adapter 复用内置 HTML Adapter 接入基座，可单独启动或被 Portal 加载。

```bash
pnpm start --filter html-child
pnpm --filter html-child build
```

根首页固定为 `src/pages/index.html`，HTML 页面位于 `src/pages/<CODE>`，`src/pages/_*` 是不会自动解析的内部页面目录；页面样式独立放在 `public/static` 或页面自己的 CSS 文件中，菜单入口位于根目录 `local-routes/index.ts`。

`public/demo-locale.json` 独立维护中英文资源；页面可翻译的叶节点声明 `data-biu-locale="中文原文"`，项目 `src/adapters/html.ts` 通过公共 I18n 翻译，语言和资源更新后同步刷新，卸载时清理订阅。外层布局仍统一使用公共 LayoutFrame。
