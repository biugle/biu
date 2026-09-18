import { i18n, type BiuLocale } from "@biugle/biu-i18n";
import type { BiuRouterConfig, MenuNode } from "./types.js";

export function flattenMenus(nodes: MenuNode[]): MenuNode[] {
  return nodes.flatMap((node) => [node, ...flattenMenus(node.children ?? [])]);
}

export function menuNodeKey(node: MenuNode) {
  const value = node.meta?.__BIU_MENU_KEY;
  return typeof value === "string" && value ? value : node.code;
}

function routeSegments(path: string) {
  return normalizePath(path).split("/").filter(Boolean);
}

function canonicalMenuPath(node: MenuNode, parentSegments: string[] = []) {
  if (node.meta?.__BIU_SYNTHETIC_ROOT === true && parentSegments.length === 0) return "/";
  const explicit = node.path ? routeSegments(node.path) : [];
  if (node.path && normalizePath(node.path) === "/") return "/";
  // A backend may already persist the complete code path. Keep that exact
  // path; a short legacy path such as /PageA remains only an alias and the
  // canonical URL still follows the complete menu hierarchy.
  if (explicit.length > 1 && explicit.at(-1) === node.code) return normalizePath(`/${explicit.join("/")}`);
  return normalizePath(`/${[...parentSegments, node.code].join("/")}`);
}

export function annotateMenuKeys(nodes: MenuNode[], parentKey = "", parentRouteSegments: string[] = []): MenuNode[] {
  return nodes.map((node) => {
    const key = parentKey ? `${parentKey}/${node.code}` : node.code;
    const nextParentKey = node.meta?.__BIU_SYNTHETIC_ROOT === true && !parentKey ? "" : key;
    const routePath = canonicalMenuPath(node, parentRouteSegments);
    const nextParentRouteSegments =
      node.meta?.__BIU_SYNTHETIC_ROOT === true && !parentKey ? parentRouteSegments : routeSegments(routePath);
    return {
      ...node,
      meta: { ...node.meta, __BIU_MENU_KEY: key, __BIU_MENU_PATH: routePath },
      children: node.children ? annotateMenuKeys(node.children, nextParentKey, nextParentRouteSegments) : node.children,
    };
  });
}

export function findMenuByKey(nodes: MenuNode[], key?: string) {
  if (!key) return undefined;
  return flattenMenus(nodes).find((node) => menuNodeKey(node) === key);
}

function unwrapResponse<T>(value: unknown, locale?: BiuLocale): T {
  if (!value || typeof value !== "object" || typeof (value as { code?: unknown }).code !== "number")
    throw new Error(i18n.$t("菜单接口响应格式错误", undefined, locale));
  const response = value as { code: number; message?: unknown; data?: unknown };
  if (response.code !== 0)
    throw new Error(
      typeof response.message === "string"
        ? response.message
        : i18n.$t("菜单接口失败：{code}", { code: response.code }, locale),
    );
  return response.data as T;
}

function endpointWithQuery(endpoint: string, query: Record<string, string | undefined>) {
  const url = new URL(endpoint, window.location.origin);
  for (const [key, value] of Object.entries(query)) if (value) url.searchParams.set(key, value);
  return url.toString();
}

async function request<T>(
  endpoint: string,
  config: BiuRouterConfig,
  query: Record<string, string | undefined> = {},
  locale = config.locale,
) {
  const timeout = config.menu?.requestTimeoutMs ?? 10_000;
  if (!Number.isInteger(timeout) || timeout < 1000 || timeout > 120_000)
    throw new Error(i18n.$t("请求超时时间无效", undefined, locale));
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);
  let response: Response;
  try {
    response = await fetch(endpointWithQuery(endpoint, query), {
      credentials: "include",
      headers: config.menu?.headers,
      signal: controller.signal,
    });
  } catch (reason) {
    if (controller.signal.aborted) throw new Error(i18n.$t("请求超时", undefined, locale));
    throw reason;
  } finally {
    window.clearTimeout(timer);
  }
  if (!response.ok) throw new Error(i18n.$t("请求失败：{status}", { status: response.status }, locale));
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error(i18n.$t("菜单接口响应格式错误", undefined, locale));
  }
  return unwrapResponse<T>(body, locale);
}

export async function fetchPortalMenuTree(config: BiuRouterConfig, locale = config.locale): Promise<MenuNode[]> {
  const endpoint = config.menu?.portalTreeUrl;
  if (!endpoint) return config.fallbackMenus ?? [];
  const value = await request<unknown[]>(
    endpoint,
    config,
    {
      portalCode: config.portalCode,
      rootCode: config.menuRootCode,
      locale,
    },
    locale,
  );
  return validateMenuTree(value, locale, "门户菜单接口");
}

export async function fetchDirectoryMenuTree(
  config: BiuRouterConfig,
  directoryCode: string,
  locale = config.locale,
): Promise<MenuNode[]> {
  const endpoint = config.menu?.directoryTreeUrl;
  if (!endpoint) return [];
  const value = await request<unknown[]>(
    endpoint,
    config,
    {
      portalCode: config.portalCode,
      directoryCode,
      locale,
    },
    locale,
  );
  return validateMenuTree(value, locale, "目录菜单接口");
}

export async function fetchPermissionCodes(
  config: BiuRouterConfig,
  locale = config.locale,
): Promise<Set<string> | undefined> {
  const endpoint = config.menu?.permissionCodesUrl;
  if (!endpoint) return undefined;
  const value = await request<string[]>(
    endpoint,
    config,
    {
      portalCode: config.portalCode,
    },
    locale,
  );
  if (!Array.isArray(value)) throw new Error(i18n.$t("权限接口 data 必须是数组", undefined, locale));
  if (value.some((item) => typeof item !== "string" || !item.trim()))
    throw new Error(i18n.$t("权限接口 Code 格式错误", undefined, locale));
  return new Set(value);
}

function validateMenuTree(value: unknown, locale: BiuLocale | undefined, source: string): MenuNode[] {
  if (!Array.isArray(value))
    throw new Error(
      i18n.$t(
        source === "目录菜单接口" ? "目录菜单接口 data 必须是数组" : "门户菜单接口 data 必须是数组",
        undefined,
        locale,
      ),
    );
  const validateNode = (input: unknown): MenuNode => {
    if (!input || typeof input !== "object") throw new Error(i18n.$t("菜单节点格式错误", undefined, locale));
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
        ...(sourceNode.meta && typeof sourceNode.meta === "object" ? sourceNode.meta : {}),
        id: sourceNode.id,
        parentId: sourceNode.parentId,
        menuCode: sourceNode.menuCode,
        systemResourceCode: sourceNode.systemResourceCode,
      },
    };
    if (typeof node.code !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/.test(node.code))
      throw new Error(i18n.$t("菜单 Code 格式错误", undefined, locale));
    if (node.type !== "DIRECTORY" && node.type !== "MENU")
      throw new Error(i18n.$t("菜单节点类型错误", undefined, locale));
    if (node.titleKey !== undefined && typeof node.titleKey !== "string")
      throw new Error(i18n.$t("菜单标题格式错误", undefined, locale));
    if (node.permissionCode !== undefined && (typeof node.permissionCode !== "string" || !node.permissionCode))
      throw new Error(i18n.$t("菜单权限 Code 格式错误", undefined, locale));
    if (node.permissionType !== undefined && !["DIRECTORY", "MENU", "COMPONENT"].includes(String(node.permissionType)))
      throw new Error(i18n.$t("菜单权限类型错误", undefined, locale));
    if (node.target !== undefined && node.target !== "APP" && node.target !== "PORTAL")
      throw new Error(i18n.$t("菜单目标类型错误", undefined, locale));
    if (
      node.path !== undefined &&
      (typeof node.path !== "string" || !node.path.startsWith("/") || node.path.startsWith("//"))
    )
      throw new Error(i18n.$t("菜单 Path 格式错误", undefined, locale));
    if (node.appId !== undefined && (typeof node.appId !== "string" || !node.appId))
      throw new Error(i18n.$t("菜单 appId 格式错误", undefined, locale));
    if (
      node.appPath !== undefined &&
      (typeof node.appPath !== "string" || !node.appPath.startsWith("/") || node.appPath.startsWith("//"))
    )
      throw new Error(i18n.$t("菜单 appPath 格式错误", undefined, locale));
    const children = node.children === undefined ? undefined : validateMenuTree(node.children, locale, source);
    return { ...node, children } as MenuNode;
  };
  return value.map(validateNode);
}

export function mergeMenuMetadata(nodes: MenuNode[], fallback: MenuNode[]): MenuNode[] {
  const fallbackMap = new Map(flattenMenus(fallback).map((node) => [node.code, node]));
  return nodes.map((node) => {
    const local = fallbackMap.get(node.code);
    return {
      ...local,
      ...node,
      children: node.children ? mergeMenuMetadata(node.children, fallback) : local?.children,
    };
  });
}

export function filterMenus(nodes: MenuNode[], permissions?: Set<string>): MenuNode[] {
  if (!permissions) return nodes;
  return nodes.flatMap((node) => {
    const children = filterMenus(node.children ?? [], permissions);
    const allowed = !node.permissionCode || permissions.has(node.permissionCode) || permissions.has(menuNodeKey(node));
    if (node.type === "DIRECTORY")
      return children.length || (Boolean(node.permissionCode) && allowed) ? [{ ...node, children }] : [];
    return allowed ? [{ ...node, children }] : [];
  });
}

export function normalizePath(path: string) {
  const clean = path.split(/[?#]/)[0].replace(/\/+$/, "");
  return clean || "/";
}

function isSyntheticRouteRoot(node: MenuNode) {
  return node.meta?.__BIU_SYNTHETIC_ROOT === true;
}

/**
 * Returns the canonical, stable URL for a menu item.
 *
 * Menu codes are used instead of translated titles or business `path` values,
 * so a locale switch cannot invalidate a shared link. The annotated menu key
 * already contains the complete directory chain. Synthetic roots generated
 * for standalone APP projects are intentionally excluded from that chain.
 */
export function menuRoutePath(node: MenuNode) {
  if (isSyntheticRouteRoot(node)) return "/";
  const storedPath = node.meta?.__BIU_MENU_PATH;
  if (typeof storedPath === "string" && storedPath) return normalizePath(storedPath);
  const key = menuNodeKey(node);
  return canonicalMenuPath(node, key.split("/").slice(0, -1));
}

export function menuPath(node: MenuNode) {
  return menuRoutePath(node);
}

export function findMenuByPath(nodes: MenuNode[], path: string) {
  const normalized = normalizePath(path);
  const entries: Array<{ node: MenuNode; path: string }> = [];
  const visit = (items: MenuNode[], parentSegments: string[] = []) => {
    for (const node of items) {
      const syntheticRoot = isSyntheticRouteRoot(node) && parentSegments.length === 0;
      const routePath = canonicalMenuPath(node, parentSegments);
      if (node.type === "MENU") entries.push({ node, path: routePath });
      visit(node.children ?? [], syntheticRoot ? parentSegments : routeSegments(routePath));
    }
  };
  visit(nodes);
  const canonical = entries.filter((entry) => entry.path === normalized);
  if (canonical.length === 1) return canonical[0]!.node;

  // `path` remains a compatibility alias for fixed business routes such as
  // /Login and /Register. It is accepted only when unambiguous; the old
  // last-segment Code fallback is deliberately removed because it can select
  // the wrong PageA/PageB when two directories contain the same Code.
  const aliases = entries.filter((entry) => entry.node.path && normalizePath(entry.node.path) === normalized);
  return aliases.length === 1 ? aliases[0]!.node : undefined;
}

export function findMenuTrail(nodes: MenuNode[], code?: string): MenuNode[] {
  if (!code) return [];
  for (const node of nodes) {
    if (node.code === code) return [node];
    const trail = findMenuTrail(node.children ?? [], code);
    if (trail.length) return [node, ...trail];
  }
  return [];
}

export function findMenuTrailByKey(nodes: MenuNode[], key?: string): MenuNode[] {
  if (!key) return [];
  for (const node of nodes) {
    if (menuNodeKey(node) === key) return [node];
    const trail = findMenuTrailByKey(node.children ?? [], key);
    if (trail.length) return isSyntheticRouteRoot(node) ? trail : [node, ...trail];
  }
  return [];
}

export function addQuery(path: string, query?: string | Record<string, string>) {
  if (!query) return path;
  const params = new URLSearchParams(typeof query === "string" ? query : query);
  return `${path}${params.toString() ? `?${params}` : ""}`;
}

export function replaceDirectoryChildren(nodes: MenuNode[], code: string, children: MenuNode[]): MenuNode[] {
  return nodes.map((node) =>
    node.code === code
      ? { ...node, children }
      : { ...node, children: node.children ? replaceDirectoryChildren(node.children, code, children) : node.children },
  );
}
