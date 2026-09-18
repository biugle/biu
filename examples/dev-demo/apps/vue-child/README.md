# vue-child

独立 Vue 3 APP Demo，通过 Biu Adapter Contract 接入统一基座，可单独启动或被 Portal 加载。

```bash
pnpm start --filter vue-child
pnpm --filter vue-child build
```

根首页固定为 `src/pages/index.vue`，业务页面位于 `src/pages/<CODE>`；`src/pages/_*` 是不会自动解析的内部页面目录，本地菜单位于根目录 `local-routes/index.ts`。
