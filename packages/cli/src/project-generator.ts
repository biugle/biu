import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { glob } from "tinyglobby";
import { t } from "./i18n/index.js";
import { isPortalProject, projectPath, toImportPath, validateRemoteApp } from "./project-utils.js";
import type { DiscoveryResult, LocalRoute } from "./types.js";

function pageFileNames(framework: string | undefined) {
  switch (framework) {
    case "html":
      return ["index.html"];
    case "vue":
      return ["index.vue"];
    case "svelte":
      return ["index.svelte"];
    case "angular":
      return ["index.ts"];
    case "react":
      return ["index.tsx", "index.ts", "index.jsx", "index.js"];
    default:
      return ["index.tsx", "index.ts", "index.jsx", "index.js"];
  }
}

function findPageSource(base: string, framework: string | undefined) {
  const names = pageFileNames(framework);
  const nested = names.map((name) => resolve(base, name));
  const flat = names.map((name) => resolve(dirname(base), `${basename(base)}${name.slice("index".length)}`));
  return [...nested, ...flat].find((path) => existsSync(path));
}

function pageSource(root: string, route: LocalRoute, framework: string | undefined) {
  if (route.code.startsWith("_")) return undefined;
  const base = resolve(root, "src/pages", route.code);
  return findPageSource(base, framework);
}

export function shouldIncludeLayout(discovery: DiscoveryResult, mode: "dev" | "build") {
  // Portal navigation is part of the portal product. These APP-only output
  // switches must not accidentally strip a Portal shell from its deployment.
  if (isPortalProject(discovery.config)) return true;
  const configured =
    mode === "dev" ? discovery.config.layout?.includeInDevelopment : discovery.config.layout?.includeInBuild;
  // Projects created before these fields existed keep their previous output.
  return configured ?? true;
}

export function homePageSource(root: string, framework: string | undefined) {
  return findPageSource(resolve(root, "src/pages", "index"), framework);
}

export function generateEntry(root: string, discovery: DiscoveryResult, mode: "dev" | "build") {
  const generatedRoot = resolve(root, ".biu/generated", mode);
  rmSync(generatedRoot, { recursive: true, force: true });
  mkdirSync(generatedRoot, { recursive: true });
  const entryPath = join(generatedRoot, "entry.tsx");
  const preset = discovery.config.layout?.preset ?? "sidebar";
  const includeLayout = shouldIncludeLayout(discovery, mode);
  const presetExports: Record<string, string> = {
    sidebar: "SidebarLayout",
    topbar: "TopbarLayout",
    blank: "BlankLayout",
    dashboard: "DashboardLayout",
    mobile: "MobileLayout",
    custom: "CustomLayout",
  };
  const presetExport = presetExports[preset];
  if (includeLayout && !presetExport) throw new Error(t("不支持的 Layout preset：{preset}", { preset }));
  const customLayoutSource = includeLayout && preset === "custom" ? discovery.config.customLayout?.source : undefined;
  const layoutImport = !includeLayout
    ? ""
    : customLayoutSource
      ? `import CustomLayout from ${JSON.stringify(toImportPath(entryPath, projectPath(root, customLayoutSource)))};`
      : `import { ${presetExport} as CustomLayout } from "@biugle/biu-preset/${preset}";`;
  const layoutCssImport = !includeLayout
    ? ""
    : customLayoutSource
      ? `import "@biugle/biu-preset/custom.css";`
      : `import "@biugle/biu-preset/${preset}.css";`;
  const framework = discovery.config.framework ?? "react";
  const packageVersion = discovery.packageVersion;
  if (framework !== "react" && framework !== "html" && !discovery.config.adapter) {
    throw new Error(t("非 React 框架必须配置 Adapter：{framework}", { framework }));
  }
  const selectedRoutes = discovery.routes.filter(
    (route) => discovery.selectedCodes.includes(route.code) && route.path !== "/",
  );
  const localRoutes = selectedRoutes.filter((route) => !isPortalProject(discovery.config) || route.source === "PORTAL");
  const remoteRoutes = selectedRoutes.filter((route) => isPortalProject(discovery.config) && route.source === "APP");
  for (const route of remoteRoutes) {
    const remoteApp = route.appId ? discovery.config.remoteApps?.[route.appId] : undefined;
    if (!route.appId || !remoteApp?.APP_URL)
      throw new Error(
        t("门户 APP 必须在当前环境配置 remoteApps.APP_URL：{code}", {
          code: route.code,
        }),
      );
    validateRemoteApp(route, discovery.config, remoteApp);
  }
  const registryLines = localRoutes.map((route) => {
    const source = pageSource(root, route, framework);
    if (!source)
      throw new Error(
        t("找不到页面源码：{path}", {
          path: resolve(root, "src/pages", route.code),
        }),
      );
    const chunkName = `pages/${route.code}`;
    return `  ${JSON.stringify(route.code)}: () => import(/* webpackChunkName: ${JSON.stringify(chunkName)} */ ${JSON.stringify(toImportPath(entryPath, source))}),`;
  });
  const homePage = discovery.homePage;
  const homeImport =
    framework === "react" && homePage && existsSync(homePage)
      ? `import HomePage from ${JSON.stringify(toImportPath(entryPath, homePage))};`
      : "const HomePage = undefined;";
  const homePageLoader =
    framework !== "react" && homePage && existsSync(homePage)
      ? `const HomePageLoader = () => import(${JSON.stringify(toImportPath(entryPath, homePage))});`
      : "const HomePageLoader = undefined;";
  const adapterSource =
    discovery.config.adapter &&
    (/^(?:\.\.?\/|\/)/.test(discovery.config.adapter)
      ? toImportPath(entryPath, projectPath(root, discovery.config.adapter))
      : discovery.config.adapter);
  const adapterImport =
    framework === "html"
      ? `import { htmlAdapter as pageAdapter } from "@biugle/biu-runtime";`
      : framework === "react"
        ? "const pageAdapter = undefined;"
        : `import pageAdapter from ${JSON.stringify(adapterSource)};`;
  const portalSlotsSource = discovery.config.portalSlots?.source;
  const portalSlotsImport = portalSlotsSource
    ? `import PortalSlots from ${JSON.stringify(/^(?:\.\.?\/|\/)/.test(portalSlotsSource) ? toImportPath(entryPath, projectPath(root, portalSlotsSource)) : portalSlotsSource)};`
    : "const PortalSlots = undefined;";
  const runtimeHooksSource = discovery.config.runtimeHooks?.source;
  const runtimeHooksImport = runtimeHooksSource
    ? `import RuntimeHooks from ${JSON.stringify(/^(?:\.\.?\/|\/)/.test(runtimeHooksSource) ? toImportPath(entryPath, projectPath(root, runtimeHooksSource)) : runtimeHooksSource)};`
    : "const RuntimeHooks = {};";
  const runtimeLayout = { ...(discovery.config.layout ?? {}) };
  // Build-mode policy belongs to the CLI and is intentionally not leaked into
  // the Runtime layout options consumed by applications.
  delete runtimeLayout.includeInDevelopment;
  delete runtimeLayout.includeInBuild;
  const routesJson = JSON.stringify(selectedRoutes);
  const source = `import React from "react";
import { mountReactBiuApp } from "@biugle/biu-adapter-react";
${layoutImport}
${layoutCssImport}
import { BiuShell } from "@biugle/biu-runtime";
${homeImport}
${homePageLoader}
${adapterImport}
${portalSlotsImport}
${runtimeHooksImport}

const pageRegistry = {
${registryLines.join("\n")}
};

mountReactBiuApp(document.getElementById("root")!,
  <BiuShell config={{
    appId: ${JSON.stringify(discovery.config.appId)},
    version: ${packageVersion ? JSON.stringify(packageVersion) : "undefined"},
    projectType: ${JSON.stringify(isPortalProject(discovery.config) ? "PORTAL" : "APP")},
    environment: ${JSON.stringify(discovery.config.environment)},
    framework: ${JSON.stringify(framework)},
    locale: ${JSON.stringify(discovery.config.locale ?? "zh-CN")},
    locales: ${JSON.stringify(discovery.config.locales ?? [])},
    localeUrl: ${JSON.stringify(discovery.config.localeUrl)},
    portalCode: ${JSON.stringify(discovery.config.portal?.code)},
    menuRootCode: ${JSON.stringify(discovery.config.portal?.menuRootCode ?? discovery.config.menu?.rootCode)},
    menu: ${JSON.stringify(discovery.config.menu ?? {})},
    allowMenuFallback: ${JSON.stringify(discovery.config.menu?.fallback ?? true)},
    layout: ${JSON.stringify(runtimeLayout)},
    layoutComponent: ${includeLayout ? "CustomLayout" : "undefined"},
    remoteAppOrigins: ${JSON.stringify(discovery.config.remoteAppOrigins ?? [])},
    hostOrigins: ${JSON.stringify(discovery.config.hostOrigins ?? [])},
    auth: ${JSON.stringify(discovery.config.auth ?? {})},
    remoteApps: ${JSON.stringify(discovery.config.remoteApps ?? {})},
    updateCheck: ${JSON.stringify(discovery.config.updateCheck ?? {})},
    fallbackMenus: ${JSON.stringify(discovery.fallbackMenus)},
    routes: ${routesJson},
    pageRegistry,
    homePage: HomePage,
    homePageLoader: HomePageLoader,
    pageAdapter,
    portalSlots: PortalSlots,
    ...RuntimeHooks,
  }} />
);
`;
  writeFileSync(entryPath, source);
  writeFileSync(join(generatedRoot, "routes.json"), JSON.stringify(discovery.routes, null, 2));
  return entryPath;
}

export async function writeManifest(output: string, discovery: DiscoveryResult, portalCode: string, entryName: string) {
  const files = await glob(["**/*"], {
    cwd: output,
    onlyFiles: true,
    ignore: ["manifest/**"],
  });
  const selectedRoutes = discovery.routes.filter((route) => discovery.selectedCodes.includes(route.code));
  const buildHash = createHash("sha256");
  for (const file of [...files].sort()) {
    buildHash.update(file);
    buildHash.update(readFileSync(resolve(output, file)));
  }
  const buildId = buildHash.digest("hex").slice(0, 16);
  const apps = Object.fromEntries(
    selectedRoutes.map((route) => [
      route.code,
      {
        code: route.code,
        target: route.target,
        source: route.source,
        appId: route.appId,
        appPath: route.appPath,
        files: files.filter((file) => file.includes(`pages/${route.code}/`)),
      },
    ]),
  );
  const manifest = {
    version: 1,
    packageVersion: discovery.packageVersion,
    buildId,
    appId: discovery.config.appId,
    environment: discovery.config.environment,
    portalCode,
    entry:
      entryName === "index"
        ? files.filter((file) => (!file.includes("/") && file.endsWith(".js")) || file.startsWith("static/css/index/"))
        : files.filter((file) => file.startsWith(`${entryName}/`)),
    apps,
    staticDir: "static",
    selectedCodes: discovery.selectedCodes,
  };
  mkdirSync(resolve(output, "manifest"), { recursive: true });
  writeFileSync(resolve(output, "manifest/index.json"), JSON.stringify(manifest, null, 2));
  writeFileSync(
    resolve(output, "manifest/routes.json"),
    JSON.stringify(
      {
        buildId,
        appId: discovery.config.appId,
        environment: discovery.config.environment,
        portalCode,
        selectedCodes: discovery.selectedCodes,
      },
      null,
      2,
    ),
  );
}

export async function copyStaticAssets(source: string, output: string) {
  if (!existsSync(source)) return;
  const files = await glob(["**/*"], {
    cwd: source,
    absolute: true,
    onlyFiles: true,
    dot: true,
  });
  for (const file of files) {
    const destination = resolve(output, "static", relative(source, file));
    if (existsSync(destination)) {
      if (readFileSync(file).equals(readFileSync(destination))) continue;
      throw new Error(
        t("静态文件与构建产物冲突：{path}", {
          path: relative(output, destination),
        }),
      );
    }
    mkdirSync(dirname(destination), { recursive: true });
    cpSync(file, destination, { force: false, errorOnExist: true });
  }
}
