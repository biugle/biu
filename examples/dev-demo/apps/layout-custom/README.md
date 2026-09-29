# layout-custom

验证 React 独立自定义模式：`customLayout.source` 指向项目自己的 `src/custom-layout.tsx`，页面和外壳完全由项目拥有，基座不渲染官方导航栏、侧栏、页签和面包屑，只提供 Runtime、错误隔离、更新检查、认证开关、Message、事件总线和可选的 Dialog/Drawer 能力。CLI 会自动注入 `@biugle/biu-preset/custom.css`，因此本 Demo 不需要额外维护 `custom.css` 或 CSS 类型声明；业务样式仍由 Demo 自己负责。首页按钮演示 `fire(Dialog)` 和 `fire.render()`：它们都将内容挂载到 body，后者展示普通自定义内容如何通过 `close()` 自行关闭。
