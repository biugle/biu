import { createApp, reactive, type Component } from "vue";
import type { BiuFrameworkAdapter } from "@biugle/biu-runtime";
import type { BiuPageContext } from "@biugle/biu-runtime";

const mountedPages = new WeakMap<Element, { page: unknown; context: Record<string, unknown>; unmount: () => void }>();

const vueAdapter: BiuFrameworkAdapter = {
  framework: "vue",
  loadPage(module) {
    if (module && typeof module === "object" && "default" in module) return (module as { default: unknown }).default;
    return module;
  },
  renderPage(container, page, context) {
    if (!page || typeof page !== "object") throw new Error(`Vue 页面模块无效：${context.code}`);
    const contextState = reactive({ ...context }) as Record<string, unknown>;
    const app = createApp(page as Component, { context: contextState });
    app.mount(container);
    const unmount = () => {
      app.unmount();
      mountedPages.delete(container);
    };
    mountedPages.set(container, { page, context: contextState, unmount });
    return unmount;
  },
  updatePage(container, page, context: BiuPageContext) {
    const mounted = mountedPages.get(container);
    if (!mounted || mounted.page !== page) return;
    for (const key of Object.keys(mounted.context)) {
      if (!(key in context)) delete mounted.context[key];
    }
    Object.assign(mounted.context, context);
  },
};

export default vueAdapter;
