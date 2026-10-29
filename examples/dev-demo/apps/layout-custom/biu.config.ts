export default {
  appId: "layout-custom",
  projectType: "APP",
  locale: "zh-CN",
  framework: "react",
  auth: { mode: "NONE", authenticated: true, enabled: false },
  dev: { port: 8007 },
  layout: {
    preset: "custom",
    tabs: false,
    breadcrumb: false,
    brandLabel: "Custom React",
    includeInDevelopment: true,
    includeInBuild: true,
  },
  customLayout: { source: "./src/custom-layout.tsx" },
  menu: { fallback: true },
  routes: { files: ["local-routes/index.ts"] },
};
