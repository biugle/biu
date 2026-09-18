import { pluginVue } from "@rsbuild/plugin-vue";

export default {
  appId: "vue-child",
  projectType: "APP",
  locale: "zh-CN",
  framework: "vue",
  adapter: "./src/adapters/vue.ts",
  buildPlugins: [pluginVue()],
  dev: { port: 8002 },
  layout: { preset: "sidebar", tabs: false, breadcrumb: true },
  menu: { fallback: true },
  routes: { files: ["local-routes/index.ts"] },
};
