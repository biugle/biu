# Biu Adapter 接入手册

本文说明页面框架如何接入 `biu`。基座的 Shell 和官方 Layout 使用 React；这不限制业务页面的技术栈。

支持边界固定如下：

| 页面技术  | 官方实现                    | 页面文件       | 需要的配置                            |
| --------- | --------------------------- | -------------- | ------------------------------------- |
| React     | `@biugle/biu-adapter-react` | `index.tsx`    | 默认配置即可                          |
| 原生 HTML | Runtime 内置 `htmlAdapter`  | `index.html`   | `framework: "html"`                   |
| Vue       | 不提供官方 Adapter          | `index.vue`    | 自定义 Adapter + Vue Rsbuild 插件     |
| Svelte    | 不提供官方 Adapter          | `index.svelte` | 自定义 Adapter + Svelte Rsbuild 插件  |
| Angular   | 不提供官方 Adapter          | `index.ts`     | 自定义 Adapter + Angular Rsbuild 插件 |

## 1. 共同配置

每个公开业务页面都要有一个本地路由 Code。根首页是例外：`src/pages/index.*` 固定对应根路由 `/`，不需要写入路由表。`src/pages/_*` 目录保留给登录、错误、内嵌等内部页面，CLI 不会自动解析。其余 `src/pages` 下的业务页面按 Code 平级管理，Code 只负责最终页面定位：

```ts
// local-routes/orders.ts
export default [
  {
    code: "OrderList",
    type: "MENU",
    target: "APP",
    source: "APP",
    titleKey: "订单列表",
  },
];
```

页面放在：

```text
src/pages/OrderList/index.<framework>
```

根首页示例：

```text
src/pages/index.tsx       # React
src/pages/index.vue       # Vue
src/pages/index.html      # HTML
```

门户自己的页面可使用目录入口或同级文件入口：

```text
src/pages/<Code>/index.<framework>
src/pages/<Code>.<framework>
```

CLI 会先按菜单接口或本地 fallback 选择 Code，再只把选中的页面写入动态 `import()` 注册表。运行时点击菜单时才请求对应 chunk；`--all` 才会把全部本地页面纳入本次编译。

## 2. React：官方 Adapter

```ts
// biu.config.ts
export default {
  appId: "order-portal",
  projectType: "APP",
  framework: "react",
  routes: { files: ["local-routes/index.ts"] },
};
```

```tsx
// src/pages/OrderList/index.tsx
export default function OrderList() {
  return (
    <section>
      <h1>订单列表</h1>
    </section>
  );
}
```

React 由 `@biugle/biu-adapter-react` 负责把基座 Shell 挂载到 `#root`，业务项目不需要手工创建 React root。

## 3. 原生 HTML：内置 Adapter

原生 HTML 不需要安装 Adapter，也不需要引入 React 页面组件：

```ts
// biu.config.ts
export default {
  appId: "html-portal",
  projectType: "APP",
  framework: "html",
  routes: { files: ["local-routes/index.ts"] },
};
```

```html
<!-- src/pages/OrderList/index.html -->
<section class="order-page">
  <h1>订单列表</h1>
</section>
```

CLI 使用 Rsbuild 的 `asset/source` 将 HTML 编译为字符串，Runtime 内置的 `htmlAdapter` 在页面容器中挂载和清空它。页面 CSS 放在独立文件，例如 `src/pages/OrderList/order.css`，通过页面静态资源或 HTML `<link>` 引用，不把 CSS 写入 JS。

可直接运行的示例在 [examples/dev-demo/apps/html-child](../examples/dev-demo/apps/html-child)；构建命令：

```bash
pnpm build:html-child
```

## 4. 自定义 Adapter Contract

Adapter 文件必须 `default export` 一个对象：

```ts
import type { BiuFrameworkAdapter } from "@biugle/biu-runtime";

const adapter: BiuFrameworkAdapter = {
  framework: "custom",
  loadPage(module, context) {
    // module 是页面的动态 import 结果；context 可用于门户/环境适配。
    return (module as { default: unknown }).default;
  },
  renderPage(container, page, context) {
    // 挂载 page 到 container。
    // 可以返回同步或异步 cleanup 函数。
    return () => {
      // 卸载 page。
    };
  },
};

export default adapter;
```

配置使用相对路径或包名均可：

```ts
export default {
  framework: "custom",
  adapter: "./src/adapters/custom.ts",
  buildPlugins: [],
};
```

`buildPlugins` 只负责让 Rsbuild 能够编译框架页面；`adapter` 只负责页面模块的加载、挂载和卸载。不要在 Adapter 中复制菜单、权限、Layout 或 Code 路由逻辑。

## 5. Vue 接入

安装 Vue 和团队选择的 Rsbuild Vue 插件后，页面使用 `index.vue`。下面是 Vue 3 的 Adapter 核心实现：

```ts
// src/adapters/vue.ts
import { createApp, type Component } from "vue";
import type { BiuFrameworkAdapter } from "@biugle/biu-runtime";

const vueAdapter: BiuFrameworkAdapter = {
  framework: "vue",
  loadPage(module) {
    return (module as { default: Component }).default;
  },
  renderPage(container, page) {
    const app = createApp(page as Component);
    app.mount(container);
    return () => app.unmount();
  },
};

export default vueAdapter;
```

```ts
// biu.config.ts
import { pluginVue } from "@rsbuild/plugin-vue";

export default {
  appId: "vue-portal",
  projectType: "APP",
  framework: "vue",
  adapter: "./src/adapters/vue.ts",
  buildPlugins: [pluginVue()],
};
```

仓库内的 `examples/dev-demo/apps/vue-child` 是一个最小 Vue 3 子应用示例。它使用 Vue 3 页面、独立 CSS、Biu Vue Adapter 和 Rsbuild Vue 插件；Portal 仍只通过环境文件中的 `remoteApps.APP_URL` 加载它。

```bash
pnpm start --filter main-a -- --apps ../child-app,../vue-child
```

点击 main-a 的“Vue 3 子应用”菜单即可验证。Vue 子应用也可以直接访问自身启动日志中的根地址独立开发；Demo 配置默认从 `8002` 起步，端口占用时由 CLI 递增。

## 6. Svelte 接入

Svelte 页面使用 `index.svelte`。以下示例按 Svelte 5 的 `mount` / `unmount` API 编写：

```ts
// src/adapters/svelte.ts
import { mount, unmount } from "svelte";
import type { Component } from "svelte";
import type { BiuFrameworkAdapter } from "@biugle/biu-runtime";

const svelteAdapter: BiuFrameworkAdapter = {
  framework: "svelte",
  loadPage(module) {
    return (module as { default: Component }).default;
  },
  renderPage(container, page) {
    const instance = mount(page as Component, { target: container });
    return () => unmount(instance);
  },
};

export default svelteAdapter;
```

```ts
// biu.config.ts
import { pluginSvelte } from "@rsbuild/plugin-svelte";

export default {
  appId: "svelte-portal",
  projectType: "APP",
  framework: "svelte",
  adapter: "./src/adapters/svelte.ts",
  buildPlugins: [pluginSvelte()],
};
```

## 7. Angular 接入

Angular 页面使用 standalone component，并由项目自己的 Adapter 创建和销毁 Angular 应用实例。由于 Angular 应用创建通常是异步的，`renderPage` 可以返回 Promise：

```ts
// src/adapters/angular.ts
import { createComponent, type Type } from "@angular/core";
import { createApplication } from "@angular/platform-browser";
import type { BiuFrameworkAdapter } from "@biugle/biu-runtime";

const angularAdapter: BiuFrameworkAdapter = {
  framework: "angular",
  loadPage(module) {
    return (module as { default: Type<unknown> }).default;
  },
  async renderPage(container, page) {
    const application = await createApplication({ providers: [] });
    const componentRef = createComponent(page as Type<unknown>, {
      environmentInjector: application.injector,
      hostElement: container,
    });
    application.attachView(componentRef.hostView);
    componentRef.changeDetectorRef.detectChanges();
    return () => {
      application.detachView(componentRef.hostView);
      componentRef.destroy();
      application.destroy();
    };
  },
};

export default angularAdapter;
```

```ts
// biu.config.ts（Angular 插件名称由项目选定的 Rsbuild 集成提供）
import { angularPlugin } from "<your-angular-rsbuild-plugin>";

export default {
  appId: "angular-portal",
  projectType: "APP",
  framework: "angular",
  adapter: "./src/adapters/angular.ts",
  buildPlugins: [angularPlugin()],
};
```

Angular 的构建插件不是 `biu` 官方 Adapter 的一部分；项目需要按自身 Angular 版本选择可用的 Rsbuild 集成，并确保它能处理 `index.ts` 对应的 standalone component。

## 8. 生命周期与安全要求

- 切换页面时必须释放框架实例、事件监听和定时器。
- 页面差异通过 `context.code`、`context.portalCode`、`context.environment` 判断；不要从路径层级推断门户。
- 被 Portal iframe 加载时，Runtime 会在初始化和语言切换时发送 `HOST_CONTEXT`；Adapter 页面使用 `context.locale` 获取最新语言，不要只读取初始化配置。
- Adapter 不绕过 `useBiuPermission` 或后端接口鉴权。组件权限仍由后端最终校验。
- Adapter 不能动态从 CDN 注入基座代码；基座包默认由项目编译时本地依赖提供。
- 页面私有样式使用独立 `.css` 文件；基座 Layout 样式统一由 `@biugle/biu-preset` 管理。
- iframe 子应用的 Modal/Drawer 使用 `useBiuOverlay()` 报告 `HOST_CHROME` 遮罩状态；业务组件仍在自己的 iframe 内渲染，不能直接操作 Portal DOM。

## 9. 全局上下文与 SSO

页面可通过 `useBiuContext()` 获取 `locale`、`theme`、`timezone`、`direction`、`portalCode`、`currentCode` 和只读用户身份；React 页面也可以直接使用 `useBiuLocale`、`useBiuTheme`、`useBiuTimezone`、`useBiuDirection`、`useBiuAuth` 选择器。Portal 切换这些偏好后会重新发送 `HOST_CONTEXT`，Runtime 会同时更新 Zustand，所以 Adapter 页面不应只读取首次初始化值。`auth` 只包含非敏感身份信息；Token 和 session id 不经过 Bridge，登录态由 SSO Cookie/网关完成。

### 基座控制 API

```tsx
const {
  navigate,
  setLayoutOverrides,
  resetLayoutOverrides,
  login,
  logout,
  refreshAuth,
  setAuth,
  setLocale,
  reloadLocale,
  reloadMenus,
  setTheme,
  setDirection,
  setTimezone,
} = useBiuContext();

navigate("/Report", { query: { date: "today" }, replace: true });
setLayoutOverrides({ hideSidebar: true, hideTabs: true, hideBreadcrumb: true, lockSidebar: true });
// 页面业务完成后恢复；下一次基座导航也会自动清空本页覆盖。
resetLayoutOverrides();
```

`setLayoutOverrides` 只影响当前页面生命周期，不写入用户菜单 Store。用户身份 API 只更新非敏感身份状态，实际登录/登出仍由 SSO、网关或业务服务完成。

`setLocale` 会触发菜单和语言资源的统一刷新；当页面修改了后端语言配置或需要重新读取当前菜单时，分别调用 `reloadLocale()`、`reloadMenus()`。APP 不应自行复制门户菜单缓存，Bridge 会收到新的 `HOST_CONTEXT.LOCALE`。

### Portal 插槽

标准化工具项可以被桌面和移动端共同消费：

```tsx
export default {
  workbar: <DepartmentSelect />,
  toolbarActions: [
    {
      code: "timezone",
      label: "时区",
      labelKey: "时区",
      tooltip: "Switch time zone",
      tooltipKey: "切换时区",
      icon: <ClockIcon />,
      content: (close) => <TimezoneMenu close={close} />,
    },
  ],
} satisfies BiuPortalSlots;
```

`labelKey`/`tooltipKey` 可选，用于让基座统一翻译稳定的 Portal 工具标题；没有 key 时保留 `label`/`tooltip` 的业务自定义值。工具内容（例如时区选项）仍由 Portal 或后端按业务数据维护。

CLI 项目在 `biu.config.ts` 使用 `portalSlots: { source: "./src/portal-slots.tsx" }` 引入该模块。普通 `toolbar` 适合完整 React 组件；需要自动进入窄屏折叠菜单的门户工具使用 `toolbarActions`，避免基座猜测任意节点的交互。
