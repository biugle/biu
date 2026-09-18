# child-app

独立 React APP Demo，可单独启动或被 Portal 通过环境配置的 `APP_URL` 以 iframe 加载。

```bash
pnpm start --filter child-app
pnpm --filter child-app build
```

根首页固定为 `src/pages/index.tsx`，业务页面位于 `src/pages/<CODE>`；`src/pages/_*` 是不会自动解析的内部页面目录，本地菜单位于根目录 `local-routes/index.ts`。
