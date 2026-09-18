import { createRsbuild, type RsbuildInstance } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createConnection } from "node:net";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import fg from "fast-glob";
import { createJiti } from "jiti";
import { ensureFoundationPackages } from "./foundation.js";
import { t } from "./i18n/index.js";
import type {
  BiuConfig,
  BiuEnvironment,
  BiuEnvironmentConfig,
  DiscoveryResult,
  LocalRoute,
  MenuNode,
} from "./types.js";
const jiti = createJiti(import.meta.url);
function projectPath(projectRoot: string, value: string) {
  return isAbsolute(value) ? value : resolve(projectRoot, value);
}
function resolveBiuPackageAliases(projectRoot: string, preset: string) {
  const packagePath = (name: string, file: string) => {
    // Dev servers use a private snapshot so foundation rebuilds cannot invalidate them.
    const path = resolve(projectRoot, ".biu/foundation", name, file);
    return existsSync(path) ? path : undefined;
  };
  const aliases: Record<string, string> = {};
  const events = packagePath("events", "index.js");
  const i18n = packagePath("i18n", "index.js");
  const bridge = packagePath("bridge", "index.js");
  const router = packagePath("router", "index.js");
  const store = packagePath("store", "index.js");
  const ui = packagePath("ui", "index.js");
  const uiStyles = packagePath("ui", "styles.css");
  const runtime = packagePath("runtime", "index.js");
  const adapterReact = packagePath("adapter-react", "index.js");
  const presetJs = packagePath("preset", `${preset}.js`);
  const presetCss = packagePath("preset", `${preset}.css`);
  const toolbar = packagePath("preset", "toolbar.js");
  if (events) aliases["@biugle/biu-events"] = events;
  if (i18n) aliases["@biugle/biu-i18n"] = i18n;
  if (bridge) aliases["@biugle/biu-bridge"] = bridge;
  if (router) aliases["@biugle/biu-router"] = router;
  if (store) aliases["@biugle/biu-store"] = store;
  if (ui) aliases["@biugle/biu-ui"] = ui;
  if (uiStyles) aliases["@biugle/biu-ui/styles.css"] = uiStyles;
  if (runtime) aliases["@biugle/biu-runtime"] = runtime;
  if (adapterReact) aliases["@biugle/biu-adapter-react"] = adapterReact;
  if (presetJs) aliases[`@biugle/biu-preset/${preset}`] = presetJs;
  if (presetCss) aliases[`@biugle/biu-preset/${preset}.css`] = presetCss;
  if (toolbar) aliases["@biugle/biu-preset/toolbar"] = toolbar;
  return aliases;
}
function projectPackageVersion(projectRoot: string) {
  try {
    const packageJson = JSON.parse(readFileSync(resolve(projectRoot, "package.json"), "utf8")) as { version?: unknown };
    return typeof packageJson.version === "string" && packageJson.version.trim()
      ? packageJson.version.trim()
      : undefined;
  } catch {
    return undefined;
  }
}
function endpointPath(projectRoot: string, value: string) {
  return /^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : projectPath(projectRoot, value);
}
export function normalizeEnvironment(value: string | undefined, fallback: BiuEnvironment = "local"): BiuEnvironment {
  const environment = value || fallback;
  if (!/^[a-z][a-z0-9_-]*$/.test(environment)) {
    throw new Error(
      t("环境名称只能包含小写字母、数字、短横线和下划线：{environment}", {
        environment,
      }),
    );
  }
  return environment as BiuEnvironment;
}
function mergeConfig<T>(base: T, override: unknown): T {
  if (!override || typeof override !== "object" || Array.isArray(override)) return base;
  const result: Record<string, unknown> = {
    ...(base as Record<string, unknown>),
  };
  for (const [key, value] of Object.entries(override)) {
    const previous = result[key];
    result[key] =
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      previous &&
      typeof previous === "object" &&
      !Array.isArray(previous)
        ? mergeConfig(previous, value)
        : value;
  }
  return result as T;
}
export async function loadProjectConfig(
  projectRoot: string,
  portalOverride?: string,
  environmentOverride?: string,
): Promise<BiuConfig> {
  const path = resolve(projectRoot, "biu.config.ts");
  if (!existsSync(path)) throw new Error(t("找不到配置文件：{path}", { path }));
  const mod = (await jiti.import(path)) as any;
  const original = (mod.default ?? mod) as BiuConfig;
  const environment = normalizeEnvironment(environmentOverride ?? process.env.BIU_ENV, "local");
  const environmentDir = original.environmentConfigDir ?? "config";
  const environmentPath = resolve(projectRoot, environmentDir, `${environment}.ts`);
  let environmentConfig: BiuEnvironmentConfig = {};
  if (existsSync(environmentPath)) {
    const environmentModule = (await jiti.import(environmentPath)) as any;
    environmentConfig = (environmentModule.default ?? environmentModule) as BiuEnvironmentConfig;
  }
  const config: BiuConfig = mergeConfig(original, environmentConfig);
  config.environment = environment;
  if (typeof config.appId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/.test(config.appId))
    throw new Error(
      t("appId 必须是安全的非空标识：{appId}", {
        appId: String(config.appId ?? ""),
      }),
    );
  if (portalOverride) config.portal = { ...config.portal, code: portalOverride };
  if (config.projectType !== "PORTAL" && config.projectType !== "APP")
    throw new Error(t("projectType 必须明确配置为 PORTAL 或 APP"));
  if (config.projectType === "PORTAL" && !config.portal?.code) throw new Error(t("PORTAL 项目必须配置 portal.code"));
  if (config.projectType === "APP" && config.portal) throw new Error(t("APP 项目不能配置 portal"));
  if (config.layout?.preset === "custom" && config.framework !== "react")
    throw new Error(t("custom Layout preset 只支持 React"));
  if (
    config.layout?.preset === "custom" &&
    config.customLayout?.source &&
    !existsSync(projectPath(projectRoot, config.customLayout.source))
  )
    throw new Error(t("找不到 Custom Layout：{path}", { path: config.customLayout.source }));
  return config;
}
async function loadRouteFiles(projectRoot: string, config: BiuConfig): Promise<LocalRoute[]> {
  const files = config.routes?.files?.length ? config.routes.files : ["local-routes/index.ts"];
  const paths = [...new Set(await fg(files, { cwd: projectRoot, absolute: true, onlyFiles: true }))];
  const routeMap = new Map<string, LocalRoute>();
  for (const path of paths.sort()) {
    const mod = (await jiti.import(path)) as any;
    const value = mod.default ?? mod.routes ?? mod;
    const entries = Array.isArray(value) ? value : value.routes;
    if (!Array.isArray(entries)) throw new Error(t("路由文件必须导出数组：{path}", { path }));
    for (const route of entries) {
      const normalized = validateLocalRoute(route, path);
      if (normalized.code.startsWith("_") || normalized.code === "index" || normalized.path === "/") continue;
      // Code is the final page/menu identity inside one generated project.
      // Different projects may reuse it; one project must not generate two
      // page registries for the same Code.
      const key = normalized.code;
      if (routeMap.has(key)) throw new Error(t("路由 Code 重复：{code}", { code: normalized.code }));
      routeMap.set(key, normalized);
    }
  }
  return [...routeMap.values()];
}
function validateLocalRoute(value: unknown, sourcePath: string): LocalRoute {
  if (!value || typeof value !== "object") throw new Error(t("路由格式错误：{path}", { path: sourcePath }));
  const route = value as Partial<LocalRoute>;
  if (
    typeof route.code !== "string" ||
    !route.code ||
    route.code === "." ||
    route.code === ".." ||
    route.code.length > 120 ||
    /[\\/?#\s]/.test(route.code)
  ) {
    throw new Error(t("路由 Code 无效：{code}", { code: String(route.code ?? "") }));
  }
  if (
    route.type !== "MENU" ||
    (route.target !== "APP" && route.target !== "PORTAL") ||
    (route.source !== "APP" && route.source !== "PORTAL")
  ) {
    throw new Error(t("路由类型无效：{code}", { code: route.code }));
  }
  if (route.icon !== undefined && (typeof route.icon !== "string" || !/^[A-Za-z0-9._:-]{1,80}$/.test(route.icon))) {
    throw new Error(t("路由图标名称无效：{code}", { code: route.code }));
  }
  const invalidPath = (value: unknown) =>
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value
      .split(/[?#]/, 1)[0]
      .split("/")
      .some((segment) => segment === "." || segment === "..");
  if (route.path !== undefined && invalidPath(route.path)) {
    throw new Error(t("路由 Path 必须以 / 开头：{code}", { code: route.code }));
  }
  if (route.appId !== undefined && (typeof route.appId !== "string" || !route.appId)) {
    throw new Error(t("路由 appId 无效：{code}", { code: route.code }));
  }
  if (route.appPath !== undefined && invalidPath(route.appPath)) {
    throw new Error(t("路由 appPath 必须以 / 开头：{code}", { code: route.code }));
  }
  return { ...route } as LocalRoute;
}
interface FetchResult<T> {
  value: T;
  loaded: boolean;
}
function withQuery(endpoint: string, query: Record<string, string | undefined>) {
  const url = new URL(endpoint, "http://localhost");
  for (const [key, value] of Object.entries(query)) {
    if (value) url.searchParams.set(key, value);
  }
  return url.toString();
}
function unwrapResponse<T>(value: any): T {
  if (!value || typeof value !== "object" || typeof value.code !== "number") throw new Error(t("菜单接口响应格式错误"));
  if (value.code !== 0) throw new Error(value.message || t("菜单接口失败：{code}", { code: value.code }));
  return value.data as T;
}
async function requestJson<T>(endpoint: string, headers?: Record<string, string>, timeoutMs = 10_000): Promise<T> {
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 120_000) throw new Error(t("请求超时时间无效"));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(endpoint, {
      credentials: "include",
      headers,
      signal: controller.signal,
    });
  } catch (reason) {
    if (controller.signal.aborted) throw new Error(t("请求超时"));
    throw reason;
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) throw new Error(t("请求失败：{status} {endpoint}", { status: response.status, endpoint }));
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error(t("菜单接口响应格式错误"));
  }
  return unwrapResponse<T>(body);
}
async function fetchMenuTree(projectRoot: string, config: BiuConfig): Promise<FetchResult<MenuNode[]>> {
  const endpoint = config.menu?.portalTreeUrl;
  if (!endpoint) return { value: [], loaded: false };
  try {
    const value = await requestJson<unknown>(
      withQuery(endpointPath(projectRoot, endpoint), {
        portalCode: config.portal?.code,
        rootCode: config.portal?.menuRootCode ?? config.menu?.rootCode,
      }),
      config.menu?.headers,
      config.menu?.requestTimeoutMs,
    );
    const tree = validateCliMenuTree(value, "门户菜单接口");
    return {
      value: await expandDirectoryTree(projectRoot, config, tree),
      loaded: true,
    };
  } catch (reason) {
    if (config.menu?.fallback === false) throw reason;
    return { value: [], loaded: false };
  }
}
function validateCliMenuTree(value: unknown, source: string): MenuNode[] {
  if (!Array.isArray(value))
    throw new Error(t(source === "目录菜单接口" ? "目录菜单接口 data 必须是数组" : "门户菜单接口 data 必须是数组"));
  const validateNode = (input: unknown): MenuNode => {
    if (!input || typeof input !== "object") throw new Error(t("菜单节点格式错误"));
    const sourceNode = input as Record<string, unknown>;
    const rawType = sourceNode.type;
    const node: Record<string, unknown> = {
      ...sourceNode,
      type: rawType === "RESOURCE_DIR" ? "DIRECTORY" : rawType === "RESOURCE_MENU" ? "MENU" : rawType,
      titleKey:
        typeof sourceNode.titleKey === "string"
          ? sourceNode.titleKey
          : typeof sourceNode.title === "string"
            ? sourceNode.title
            : sourceNode.titleKey,
      permissionCode:
        typeof sourceNode.permissionCode === "string"
          ? sourceNode.permissionCode
          : typeof sourceNode.menuCode === "string"
            ? sourceNode.menuCode
            : sourceNode.permissionCode,
      permissionType:
        rawType === "RESOURCE_DIR" ? "DIRECTORY" : rawType === "RESOURCE_MENU" ? "MENU" : sourceNode.permissionType,
      meta: {
        id: sourceNode.id,
        parentId: sourceNode.parentId,
        menuCode: sourceNode.menuCode,
        systemResourceCode: sourceNode.systemResourceCode,
      },
    };
    if (typeof node.code !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/.test(node.code))
      throw new Error(t("菜单 Code 格式错误"));
    if (node.type !== "DIRECTORY" && node.type !== "MENU") throw new Error(t("菜单节点类型错误"));
    if (node.icon !== undefined && (typeof node.icon !== "string" || !/^[A-Za-z0-9._:-]{1,80}$/.test(node.icon)))
      throw new Error(t("菜单图标名称错误"));
    if (node.titleKey !== undefined && typeof node.titleKey !== "string") throw new Error(t("菜单标题格式错误"));
    if (node.permissionCode !== undefined && (typeof node.permissionCode !== "string" || !node.permissionCode))
      throw new Error(t("菜单权限 Code 格式错误"));
    if (node.permissionType !== undefined && !["DIRECTORY", "MENU", "COMPONENT"].includes(String(node.permissionType)))
      throw new Error(t("菜单权限类型错误"));
    if (node.target !== undefined && node.target !== "APP" && node.target !== "PORTAL")
      throw new Error(t("菜单目标类型错误"));
    if (
      node.path !== undefined &&
      (typeof node.path !== "string" || !node.path.startsWith("/") || node.path.startsWith("//"))
    )
      throw new Error(t("菜单 Path 格式错误"));
    if (node.appId !== undefined && (typeof node.appId !== "string" || !node.appId))
      throw new Error(t("菜单 appId 格式错误"));
    if (
      node.appPath !== undefined &&
      (typeof node.appPath !== "string" || !node.appPath.startsWith("/") || node.appPath.startsWith("//"))
    )
      throw new Error(t("菜单 appPath 格式错误"));
    const children = node.children === undefined ? undefined : validateCliMenuTree(node.children, source);
    return { ...node, children } as MenuNode;
  };
  return value.map(validateNode);
}

async function expandDirectoryTree(
  projectRoot: string,
  config: BiuConfig,
  nodes: MenuNode[],
  visited = new Set<string>(),
): Promise<MenuNode[]> {
  const endpoint = config.menu?.directoryTreeUrl;
  if (!endpoint) return nodes;
  const result: MenuNode[] = [];
  for (const node of nodes) {
    if (node.type !== "DIRECTORY" || node.children !== undefined || visited.has(node.code)) {
      result.push(
        node.children
          ? {
              ...node,
              children: await expandDirectoryTree(projectRoot, config, node.children, visited),
            }
          : node,
      );
      continue;
    }
    visited.add(node.code);
    try {
      const value = await requestJson<unknown>(
        withQuery(endpointPath(projectRoot, endpoint), {
          portalCode: config.portal?.code,
          directoryCode: node.code,
        }),
        config.menu?.headers,
        config.menu?.requestTimeoutMs,
      );
      const children = validateCliMenuTree(value, "目录菜单接口");
      result.push({
        ...node,
        children: await expandDirectoryTree(projectRoot, config, children, visited),
      });
    } catch (reason) {
      if (config.menu?.fallback === false) throw reason;
      result.push(node);
    }
  }
  return result;
}

async function fetchPermissionCodes(projectRoot: string, config: BiuConfig): Promise<Set<string> | undefined> {
  const endpoint = config.menu?.permissionCodesUrl;
  if (!endpoint) return undefined;
  try {
    const value = await requestJson<unknown>(
      withQuery(endpointPath(projectRoot, endpoint), {
        portalCode: config.portal?.code,
      }),
      config.menu?.headers,
      config.menu?.requestTimeoutMs,
    );
    if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item.trim()))
      throw new Error(t("权限接口 Code 格式错误"));
    return new Set(value);
  } catch (reason) {
    if (config.menu?.fallback === false) throw reason;
    return undefined;
  }
}

function filterCliMenus(nodes: MenuNode[], permissions?: Set<string>): MenuNode[] {
  if (!permissions) return nodes;
  return nodes.flatMap((node) => {
    const children = filterCliMenus(node.children ?? [], permissions);
    if (node.type === "DIRECTORY")
      return children.length || !node.permissionCode || permissions.has(node.permissionCode)
        ? [{ ...node, children }]
        : [];
    return !node.permissionCode || permissions.has(node.permissionCode) ? [{ ...node, children }] : [];
  });
}

function mergeMenuMetadata(nodes: MenuNode[], fallback: MenuNode[]): MenuNode[] {
  const fallbackMap = new Map(collectMenuNodes(fallback).map((node) => [node.code, node]));
  return nodes.map((node) => {
    const local = fallbackMap.get(node.code);
    return {
      ...local,
      ...node,
      children: node.children ? mergeMenuMetadata(node.children, fallback) : local?.children,
    };
  });
}

function collectMenuNodes(nodes: MenuNode[]): MenuNode[] {
  return nodes.flatMap((node) => [node, ...collectMenuNodes(node.children ?? [])]);
}

function collectCodes(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item: any) => [item.code, item.permissionCode, ...collectCodes(item.children)]).filter(Boolean);
}

function portalPrefix(config: BiuConfig) {
  return config.portal?.permissionPrefix ?? `portal-${config.portal?.code ?? "default"}`;
}

function configuredOrigin(value: string) {
  try {
    const url = new URL(value, "http://localhost");
    if ((url.protocol !== "http:" && url.protocol !== "https:") || url.username || url.password) return undefined;
    return {
      origin: url.origin,
      relative: !/^[a-z][a-z\d+.-]*:\/\//i.test(value),
    };
  } catch {
    return undefined;
  }
}

function validateRemoteApp(
  route: LocalRoute,
  config: BiuConfig,
  remote: NonNullable<NonNullable<BiuConfig["remoteApps"]>[string]>,
) {
  const parsed = configuredOrigin(remote.APP_URL);
  if (!parsed) throw new Error(t("远程 APP_URL 必须是 HTTP(S) 地址：{code}", { code: route.code }));
  const origins = remote.ALLOWED_ORIGINS ?? config.remoteAppOrigins ?? [];
  if (
    !parsed.relative &&
    (!origins.length || !origins.some((origin) => configuredOrigin(origin)?.origin === parsed.origin))
  ) {
    throw new Error(t("远程 APP_URL 必须配置 ALLOWED_ORIGINS：{code}", { code: route.code }));
  }
  for (const origin of origins) {
    if (!configuredOrigin(origin)) throw new Error(t("远程 APP 白名单地址无效：{code}", { code: route.code }));
  }
}

function isPortalProject(config: BiuConfig) {
  return config.projectType === "PORTAL";
}

export const DEFAULT_DEV_PORT_RANGES = {
  PORTAL: { start: 9001, end: 9999 },
  APP: { start: 8001, end: 8888 },
} as const;

export function getDevPortRange(config: Pick<BiuConfig, "projectType" | "portal" | "dev">) {
  const defaultRange = isPortalProject(config as BiuConfig)
    ? DEFAULT_DEV_PORT_RANGES.PORTAL
    : DEFAULT_DEV_PORT_RANGES.APP;
  return config.dev?.portRange ?? defaultRange;
}

function canListen(port: number) {
  return new Promise<boolean>((resolvePort) => {
    // A bind/close probe can be a false positive when the existing dev server
    // enables SO_REUSEPORT. A short TCP connect probe observes the port the
    // same way Rsbuild does and prevents a Portal from retaining a stale APP
    // address after the child process auto-increments.
    const socket = createConnection({ host: "127.0.0.1", port });
    let settled = false;
    const finish = (available: boolean) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolvePort(available);
    };
    socket.once("connect", () => finish(false));
    socket.once("error", () => finish(true));
    socket.setTimeout(200, () => finish(true));
  });
}

export async function resolveDevPort(config: BiuConfig, requested?: number, reservedPorts?: ReadonlySet<number>) {
  const configured = requested ?? config.dev?.port;
  if (configured !== undefined) {
    if (!Number.isInteger(configured) || configured < 1 || configured > 65535)
      throw new Error(t("开发端口无效：{port}", { port: configured }));
    if (!reservedPorts?.has(configured) && (await canListen(configured))) return configured;
  }
  const range = getDevPortRange(config);
  if (
    !Number.isInteger(range.start) ||
    !Number.isInteger(range.end) ||
    range.start < 1 ||
    range.end > 65535 ||
    range.start > range.end
  ) {
    throw new Error(
      t("开发端口范围无效：{start}-{end}", {
        start: range.start,
        end: range.end,
      }),
    );
  }
  const start =
    configured !== undefined && configured >= range.start && configured <= range.end ? configured : range.start;
  for (let port = start; port <= range.end; port += 1) {
    if (reservedPorts?.has(port)) continue;
    if (await canListen(port)) return port;
  }
  throw new Error(
    t("没有可用的开发端口：{start}-{end}", {
      start: range.start,
      end: range.end,
    }),
  );
}

function fallbackMenus(routes: LocalRoute[], config: BiuConfig): MenuNode[] {
  if (config.localMenuTree?.length) return validateCliMenuTree(config.localMenuTree, "本地菜单配置");
  const portalCode = config.portal?.code ?? "default";
  return [
    {
      code: config.portal?.menuRootCode ?? (config.portal ? `portal-${portalCode}` : config.appId),
      type: "DIRECTORY",
      titleKey: portalCode,
      meta: { __BIU_SYNTHETIC_ROOT: true },
      children: routes.map((route) => ({
        code: route.code,
        type: "MENU" as const,
        icon: route.icon,
        target: route.target,
        titleKey: route.titleKey ?? route.code,
        permissionCode:
          route.permissionCode ?? (route.source === "PORTAL" ? `${portalPrefix(config)}_${route.code}` : route.code),
        permissionType: "MENU",
        path: route.path ?? `/${route.code}`,
        appId: route.appId,
        appPath: route.appPath,
      })),
    },
  ];
}

function toImportPath(from: string, target: string) {
  let value = relative(dirname(from), target).replace(/\\/g, "/");
  if (!value.startsWith(".")) value = `./${value}`;
  return value;
}

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

function homePageSource(root: string, framework: string | undefined) {
  return findPageSource(resolve(root, "src/pages", "index"), framework);
}

function generateEntry(root: string, discovery: DiscoveryResult, mode: "dev" | "build") {
  const generatedRoot = resolve(root, ".biu/generated", mode);
  rmSync(generatedRoot, { recursive: true, force: true });
  mkdirSync(generatedRoot, { recursive: true });
  const entryPath = join(generatedRoot, "entry.tsx");
  const preset = discovery.config.layout?.preset ?? "sidebar";
  const presetExports: Record<string, string> = {
    sidebar: "SidebarLayout",
    topbar: "TopbarLayout",
    blank: "BlankLayout",
    dashboard: "DashboardLayout",
    mobile: "MobileLayout",
    custom: "CustomLayout",
  };
  const presetExport = presetExports[preset];
  if (!presetExport) throw new Error(t("不支持的 Layout preset：{preset}", { preset }));
  const customLayoutSource = preset === "custom" ? discovery.config.customLayout?.source : undefined;
  const layoutImport = customLayoutSource
    ? `import CustomLayout from ${JSON.stringify(toImportPath(entryPath, projectPath(root, customLayoutSource)))};`
    : `import { ${presetExport} as CustomLayout } from "@biugle/biu-preset/${preset}";`;
  const layoutCssImport = customLayoutSource
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
    layout: ${JSON.stringify(discovery.config.layout ?? {})},
    layoutComponent: CustomLayout,
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

async function writeManifest(output: string, discovery: DiscoveryResult, portalCode: string, entryName: string) {
  const files = await fg(["**/*"], {
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

async function copyStaticAssets(source: string, output: string) {
  if (!existsSync(source)) return;
  const files = await fg(["**/*"], {
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

export async function discoverProject(
  projectRoot: string,
  all = false,
  portalOverride?: string,
  environment?: string,
  remoteAppOverrides?: Record<string, string>,
): Promise<DiscoveryResult> {
  const root = resolve(projectRoot);
  const config = await loadProjectConfig(root, portalOverride, environment);
  if (remoteAppOverrides && config.remoteApps) {
    config.remoteApps = Object.fromEntries(
      Object.entries(config.remoteApps).map(([appId, remote]) =>
        remoteAppOverrides[appId]
          ? [
              appId,
              {
                ...remote,
                APP_URL: remoteAppOverrides[appId],
                ALLOWED_ORIGINS: [new URL(remoteAppOverrides[appId]).origin],
              },
            ]
          : [appId, remote],
      ),
    );
  }
  const routes = await loadRouteFiles(root, config);
  const menuResult = await fetchMenuTree(root, config);
  const permissionCodes = await fetchPermissionCodes(root, config);
  const localMenus = fallbackMenus(routes, config);
  const sourceMenus = menuResult.loaded ? mergeMenuMetadata(menuResult.value, localMenus) : localMenus;
  const effectiveMenus = filterCliMenus(sourceMenus, permissionCodes);
  const localCodes = routes.map((route) => route.code);
  const remoteCodes = collectCodes(effectiveMenus);
  const selectedCodes = all
    ? localCodes
    : menuResult.loaded || permissionCodes !== undefined
      ? routes
          .filter((route) => remoteCodes.includes(route.code) || remoteCodes.includes(route.permissionCode ?? ""))
          .map((route) => route.code)
      : localCodes;
  const homePage = homePageSource(root, config.framework);
  return {
    config,
    packageVersion: projectPackageVersion(root),
    routes,
    menus: menuResult.loaded ? effectiveMenus : localMenus,
    fallbackMenus: localMenus,
    selectedCodes,
    homePage: homePage && existsSync(homePage) ? homePage : undefined,
  };
}

export async function buildProject(
  projectRoot: string,
  options: {
    all?: boolean;
    watch?: boolean;
    portal?: string;
    port?: number;
    environment?: string;
    remoteAppOverrides?: Record<string, string>;
  } = {},
) {
  const root = resolve(projectRoot);
  const defaultEnvironment = options.watch ? "local" : "prod";
  const environment = normalizeEnvironment(options.environment ?? process.env.BIU_ENV, defaultEnvironment);
  const discovery = await discoverProject(root, options.all, options.portal, environment, options.remoteAppOverrides);
  const entry = generateEntry(root, discovery, options.watch ? "dev" : "build");
  const preset = discovery.config.layout?.preset ?? "sidebar";
  await ensureFoundationPackages(root, preset);
  // Keep dev-server output isolated so starting a local service never destroys
  // the independently deployable production dist.
  const output = resolve(root, options.watch ? ".biu/dev" : "dist");
  const portalCode = discovery.config.portal?.code ?? "default";
  // Every Biu project is independently deployed. The portal or APP domain
  // serves its own root index; portalCode is a permission/config scope, not a URL prefix.
  const entryName = "index";
  const devPort = options.watch ? await resolveDevPort(discovery.config, options.port) : undefined;
  const rsbuild = await createRsbuild({
    cwd: root,
    config: {
      plugins: [pluginReact(), ...((discovery.config.buildPlugins ?? []) as any[])],
      source: { entry: { [entryName]: entry } },
      html: { template: resolve(root, "public/index.html") },
      server: devPort === undefined ? {} : { port: devPort },
      output: {
        distPath: {
          root: output,
          js: ".",
          css: "static/css",
          assets: "static/assets",
        },
        cleanDistPath: true,
        filename: {
          html: "index.html",
          js: "[contenthash:8].js",
          css: "[name]/[contenthash:8].css",
        },
      },
      tools: {
        rspack: {
          resolve: {
            alias: resolveBiuPackageAliases(root, preset),
            extensions: [".tsx", ".ts", ".jsx", ".js", ".vue", ".svelte", ".html"],
          },
          module: {
            rules: [
              {
                test: /\.html$/,
                exclude: [resolve(root, "public")],
                type: "asset/source",
              },
            ],
          },
          output: { chunkFilename: "[name]/[contenthash:8].js" },
        },
      },
    },
  });
  if (options.watch) {
    const server = await rsbuild.startDevServer();
    console.log(`[biu] ${t("开发服务器：{url}", { url: `http://localhost:${server.port}` })}`);
  } else {
    await rsbuild.build();
    const staticSource = resolve(root, "public/static");
    await copyStaticAssets(staticSource, output);
    await writeManifest(output, discovery, portalCode, entryName);
  }
  if (options.watch) {
    mkdirSync(resolve(output, "manifest"), { recursive: true });
    writeFileSync(
      resolve(output, "manifest/routes.json"),
      JSON.stringify(
        {
          buildId: `dev-${Date.now()}`,
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
  return { discovery, rsbuild } as {
    discovery: DiscoveryResult;
    rsbuild: RsbuildInstance;
  };
}
