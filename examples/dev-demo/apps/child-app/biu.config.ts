export default {
  appId: "child-app",
  projectType: "APP",
  locale: "zh-CN",
  localeUrl: "/demo-locale.json",
  framework: "react",
  dev: { port: 8001 },
  layout: { preset: "sidebar", tabs: false, breadcrumb: true, includeInDevelopment: true, includeInBuild: false },
  menu: { fallback: true },
  routes: { files: ["local-routes/index.ts"] },
};
