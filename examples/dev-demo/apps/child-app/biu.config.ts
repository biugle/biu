export default {
  appId: "child-app",
  projectType: "APP",
  locale: "zh-CN",
  framework: "react",
  dev: { port: 8001 },
  layout: { preset: "sidebar", tabs: false, breadcrumb: true },
  menu: { fallback: true },
  routes: { files: ["local-routes/index.ts"] },
};
