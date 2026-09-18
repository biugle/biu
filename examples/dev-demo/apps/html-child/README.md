# html-child

独立原生 HTML APP Demo，通过内置 HTML Adapter 接入基座，可单独启动或被 Portal 加载。

```bash
pnpm start --filter html-child
pnpm --filter html-child build
```

根首页固定为 `src/pages/index.html`，HTML 页面位于 `src/pages/<CODE>`，`src/pages/_*` 是不会自动解析的内部页面目录；页面样式独立放在 `public/static` 或页面自己的 CSS 文件中，菜单入口位于根目录 `local-routes/index.ts`。
