export default {
  appId: "html-child",
  projectType: "APP",
  framework: "html",
  dev: { port: 8003 },
  layout: { preset: "sidebar", tabs: false, breadcrumb: true, includeInDevelopment: true, includeInBuild: false },
  menu: { fallback: true },
  routes: { files: ["local-routes/index.ts"] },
};
