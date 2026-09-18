import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  defaultBiuLocales,
  i18n,
  normalizeBiuLocale,
  type BiuLanguageResource,
  type BiuLocaleOption,
} from "@biugle/biu-i18n";
import {
  normalizeBiuDirection,
  normalizeBiuTheme,
  normalizeBiuTimezone,
  readBiuTabSession,
  useBiuMenuStore,
  useBiuStore,
  writeBiuTabSession,
} from "@biugle/biu-store";
import {
  isAppEventPayload,
  isAuthAction,
  isBridgeMessage,
  isHostContextPayload,
  normalizeOrigin,
  parentOrigin,
  postBiuMessage,
  publicAuthContext,
} from "@biugle/biu-bridge";
import { authContextFor } from "./bridge.js";
import {
  addQuery,
  annotateMenuKeys,
  fetchDirectoryMenuTree,
  fetchPermissionCodes,
  fetchPortalMenuTree,
  filterMenus,
  findMenuByKey,
  findMenuByPath,
  findMenuTrailByKey,
  flattenMenus,
  menuNodeKey,
  menuPath,
  mergeMenuMetadata,
  normalizePath,
  replaceDirectoryChildren,
} from "@biugle/biu-router";
import { RemoteAppFrame } from "./remote.js";
import { BiuErrorBoundary, BiuStatusView, ErrorView, FrameworkPage, reportMonitorEvent } from "./components.js";
import { biuMessage } from "@biugle/biu-ui";
import { createBiuUpdateChecker, type BiuUpdateChecker } from "./update-check.js";
import { BiuContext } from "./context.js";
import { resolveDocumentTitle } from "./title.js";
import { BiuDefaultHome } from "./default-home.js";
import { BiuAuthGate } from "./auth-page.js";
import { biuEventBus } from "./events.js";
import type {
  BiuHostOverlayState,
  BiuLayoutOverrides,
  BiuPageContext,
  BiuRuntimeConfig,
  BiuMonitorEvent,
  LayoutContentProps,
  MenuNode,
  RouteEntry,
} from "./types.js";
import type { BiuHostContextPayload } from "@biugle/biu-bridge";
export type {
  BiuAccountPanel,
  BiuAppLoadMode,
  BiuAuthConfig,
  BiuAuthContext,
  BiuAuthPageMode,
  BiuAuthPageProps,
  BiuAuthUser,
  BiuContextValue,
  BiuDirection,
  BiuEventBus,
  BiuEventEnvelope,
  BiuFrameworkAdapter,
  BiuHostOverlayState,
  BiuLayoutOption,
  BiuLayoutOptions,
  BiuLayoutOverrides,
  BiuLifecycleHooks,
  BiuNavigationLifecycle,
  BiuNotification,
  BiuLayoutUser,
  BiuMenuRecord,
  BiuMonitorEvent,
  BiuOverlayMode,
  BiuOverlayScope,
  BiuOverlayState,
  BiuPageCleanup,
  BiuPageContext,
  BiuPageLoader,
  BiuPortalSlots,
  BiuPortalToolbarAction,
  BiuRemoteAppConfig,
  BiuRemoteAppLifecycle,
  BiuRemoteAppLifecycleEvent,
  BiuRemoteAppLoader,
  BiuRemoteAppLoaderProps,
  BiuRemoteAppResolvedConfig,
  BiuRuntimeConfig,
  BiuRuntimeMenuConfig,
  BiuShellLifecycleEvent,
  BiuTheme,
  BiuTimezoneOption,
  BiuToolbarActionContext,
  LayoutContentProps,
  LayoutPreset,
  MenuNode,
  MenuTarget,
  RouteEntry,
} from "./types.js";
export { createI18n, defaultBiuLocales, i18n, normalizeBiuLocale } from "@biugle/biu-i18n";
export {
  useBiuStore,
  useBiuAuth,
  useBiuDirection,
  useBiuLocale,
  useBiuTheme,
  useBiuTimezone,
  useBiuPreferenceStore,
  useBiuAuthStore,
  useBiuMenuStore,
} from "@biugle/biu-store";
export type { BiuAuthState, BiuMenuMode, BiuPreferenceState } from "@biugle/biu-store";
export { iframeRemoteAppLoader, RemoteAppFrame } from "./remote.js";
export {
  BiuErrorBoundary,
  BiuErrorDetails,
  BiuStatusView,
  CopyButton,
  ErrorView,
  FrameworkPage,
  reportMonitorEvent,
} from "./components.js";
export type { BiuStatusCode } from "./components.js";
export { BiuDefaultHome } from "./default-home.js";
export { BiuAuthGate, BiuDefaultAuthPage } from "./auth-page.js";
export type { BiuLanguageResource, BiuLocale, BiuLocaleOption } from "@biugle/biu-i18n";
export {
  annotateMenuKeys,
  fetchDirectoryMenuTree,
  fetchPermissionCodes,
  fetchPortalMenuTree,
  filterMenus,
  findMenuByKey,
  findMenuByPath,
  findMenuTrail,
  findMenuTrailByKey,
  menuNodeKey,
  menuPath,
  menuRoutePath,
} from "@biugle/biu-router";
export {
  DEFAULT_BIU_TIMEZONE,
  isBiuTimezone,
  normalizeBiuDirection,
  normalizeBiuTheme,
  normalizeBiuTimezone,
} from "@biugle/biu-store";
export { createBiuUpdateChecker } from "./update-check.js";
export type { BiuUpdateChecker } from "./update-check.js";
export { resolveDocumentTitle } from "./title.js";
export type { BiuDocumentTitleInput } from "./title.js";
export {
  BiuContext,
  htmlAdapter,
  LinkByCode,
  useBiuAuthContext,
  useBiuContext,
  useBiuI18n,
  useBiuLayoutControl,
  useBiuOverlay,
  useBiuPermission,
} from "./context.js";
export { biuEventBus, createBiuEventBus } from "./events.js";
declare global {
  interface Window {
    __BIU_MONITOR__?: (event: BiuMonitorEvent) => void;
  }
}
function isEmbeddedApp(config: BiuRuntimeConfig) {
  return config.projectType === "APP" && typeof window !== "undefined" && window.parent !== window;
}

function FallbackLayout({ children }: LayoutContentProps) {
  return <div className="biu-fallback-layout">{children}</div>;
}

function defaultHomeMenu(config: BiuRuntimeConfig): MenuNode {
  return {
    code: "__BIU_DEFAULT_HOME__",
    type: "MENU",
    target: config.projectType === "APP" ? "APP" : "PORTAL",
    titleKey: "首页",
    path: "/",
    meta: { __BIU_DEFAULT_HOME: true, __BIU_MENU_KEY: "__BIU_DEFAULT_HOME__", __BIU_MENU_PATH: "/" },
  };
}

function removeRootHomeMenus(nodes: MenuNode[]): MenuNode[] {
  return nodes
    .filter((node) => !(node.type === "MENU" && node.path && normalizePath(node.path) === "/"))
    .map((node) => ({
      ...node,
      children: node.children ? removeRootHomeMenus(node.children) : node.children,
    }))
    .filter((node) => node.type !== "DIRECTORY" || Boolean(node.children?.length));
}

function menuForPath(nodes: MenuNode[], path: string, home: MenuNode) {
  return normalizePath(path) === "/" ? home : findMenuByPath(nodes, path);
}

function localeResourceFromResponse(
  value: unknown,
  locale: string,
  description: string,
): BiuLanguageResource | undefined {
  const source = value && typeof value === "object" && "data" in value ? (value as { data?: unknown }).data : value;
  const candidate =
    source &&
    typeof source === "object" &&
    locale in source &&
    typeof (source as Record<string, unknown>)[locale] === "object"
      ? (source as Record<string, unknown>)[locale]
      : source;
  if (!candidate || typeof candidate !== "object") return undefined;
  const record = candidate as Record<string, unknown>;
  const translationSource = record.translation ?? record.translations ?? record.messages ?? candidate;
  if (!translationSource || typeof translationSource !== "object") return undefined;
  const translation = Object.fromEntries(
    Object.entries(translationSource as Record<string, unknown>).filter(([, item]) => typeof item === "string"),
  ) as Record<string, string>;
  if (!Object.keys(translation).length) return undefined;
  return {
    key: typeof record.key === "string" ? record.key : locale,
    desc: typeof record.desc === "string" && record.desc.trim() ? record.desc : description,
    translation,
  };
}

function localeEndpoint(endpoint: string, locale: string) {
  const templated = endpoint.replaceAll("{locale}", encodeURIComponent(locale));
  const url = new URL(templated, window.location.origin);
  url.searchParams.set("locale", locale);
  return url.toString();
}

export function BiuShell({ config }: { config: BiuRuntimeConfig }) {
  const hostPortalCode =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("portalCode") || config.portalCode || undefined
      : config.portalCode;
  const initialStorageScope = `${hostPortalCode || config.portalCode || config.appId}:${config.environment || "local"}`;
  const hasRemoteNavigation = Boolean(config.menu?.portalTreeUrl || config.menu?.permissionCodesUrl);
  const [menus, setMenus] = useState<MenuNode[]>(
    hasRemoteNavigation ? [] : annotateMenuKeys(config.fallbackMenus ?? []),
  );
  const [selectedCode, setSelectedCode] = useState<string>();
  const [selectedMenuKey, setSelectedMenuKey] = useState<string>();
  const [history, setHistory] = useState<MenuNode[]>([]);
  const [tabsHydrated, setTabsHydrated] = useState(!config.layout?.tabs);
  const [permissionCodes, setPermissionCodes] = useState<Set<string>>();
  const [currentPath, setCurrentPath] = useState(() => normalizePath(window.location.pathname));
  const [error, setError] = useState<string>();
  const [hostOverlay, setHostOverlay] = useState<BiuHostOverlayState>();
  const [pageRefreshKey, setPageRefreshKey] = useState(0);
  const [menuReloadToken, setMenuReloadToken] = useState(0);
  const [localeReloadToken, setLocaleReloadToken] = useState(0);
  const [, setLocaleResourceRevision] = useState(0);
  const [layoutOverrides, setLayoutOverridesState] = useState<BiuLayoutOverrides>({});
  const updateCheckerRef = useRef<BiuUpdateChecker | undefined>(undefined);
  const preferences = useBiuStore();
  const { locale, theme, direction, timezone } = preferences;
  const setLocale = preferences.setLocale;
  const setTheme = preferences.setTheme;
  const setDirection = preferences.setDirection;
  const setTimezone = preferences.setTimezone;
  const setAuth = preferences.setAuth;
  const [hostContext, setHostContext] = useState<BiuHostContextPayload>();
  const [remoteAppVersions, setRemoteAppVersions] = useState<Record<string, string>>({});
  const [navigationLoading, setNavigationLoading] = useState(hasRemoteNavigation);
  const setMenuTree = useBiuMenuStore((state) => state.setTree);
  const setMenuMode = useBiuMenuStore((state) => state.setMenuMode);
  const setMenuStorageScope = useBiuMenuStore((state) => state.setStorageScope);
  const baseEventBus = config.eventBus ?? biuEventBus;
  const eventBus = useMemo(() => {
    if (!isEmbeddedApp(config)) return baseEventBus;
    const origin = parentOrigin(config.hostOrigins);
    return {
      publish<T>(name: string, payload: T, source?: string) {
        baseEventBus.publish(name, payload, source ?? config.appId);
        postBiuMessage(
          {
            TYPE: "APP_EVENT",
            APP_ID: config.appId,
            PAYLOAD: { name, payload, source: source ?? config.appId },
          },
          origin,
        );
      },
      subscribe: baseEventBus.subscribe.bind(baseEventBus),
      clear: baseEventBus.clear.bind(baseEventBus),
    };
  }, [baseEventBus, config.appId, config.hostOrigins, config.projectType]);

  useEffect(() => {
    preferences.initialize(
      {
        locale: normalizeBiuLocale(
          config.locale,
          config.locales?.map((item) => item.code) ?? defaultBiuLocales.map((item) => item.code),
        ),
        theme: normalizeBiuTheme(config.layout?.theme),
        direction: normalizeBiuDirection(config.layout?.direction),
        timezone: normalizeBiuTimezone(config.layout?.timezone),
        auth: authContextFor(config),
      },
      initialStorageScope,
    );
    // Establish the portal/app namespace before any menu preference action
    // persists. This prevents the first render from writing menu settings to
    // the shared fallback key before the scoped store is hydrated.
    setMenuStorageScope(initialStorageScope);
    setMenuMode(config.layout?.menuMode ?? "STANDARD");
    // Initialize once for this shell; live updates are handled by the store.
  }, [config.appId, config.layout?.menuMode, initialStorageScope, setMenuMode, setMenuStorageScope]);

  useEffect(() => {
    if (!isEmbeddedApp(config)) return;
    const onMessage = (event: MessageEvent) => {
      if (event.source !== window.parent || !isBridgeMessage(event.data)) return;
      if (event.data.APP_ID && event.data.APP_ID !== config.appId) return;
      const expectedOrigin = parentOrigin(config.hostOrigins);
      if (!expectedOrigin || event.origin !== expectedOrigin) return;
      if (event.data.TYPE === "APP_EVENT" && isAppEventPayload(event.data.PAYLOAD)) {
        eventBus.publish(event.data.PAYLOAD.name, event.data.PAYLOAD.payload, event.data.PAYLOAD.source);
        return;
      }
      if (event.data.TYPE !== "HOST_CONTEXT") return;
      if (isHostContextPayload(event.data.PAYLOAD)) {
        const payload = {
          ...event.data.PAYLOAD,
          AUTH: publicAuthContext(event.data.PAYLOAD.AUTH),
        };
        setHostContext(payload);
        if (payload.LOCALE) setLocale(payload.LOCALE);
        if (payload.THEME) setTheme(payload.THEME);
        if (payload.DIRECTION) setDirection(payload.DIRECTION);
        if (payload.TIMEZONE) setTimezone(payload.TIMEZONE);
        setAuth(payload.AUTH);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [
    config.appId,
    config.hostOrigins,
    config.projectType,
    eventBus,
    setAuth,
    setDirection,
    setLocale,
    setTheme,
    setTimezone,
  ]);

  useEffect(() => {
    const onAuthAction = config.onAuthAction;
    if (isEmbeddedApp(config) || !onAuthAction) return;
    const onMessage = (event: MessageEvent) => {
      if (
        !isBridgeMessage(event.data) ||
        event.data.TYPE !== "AUTH_ACTION" ||
        !isAuthAction((event.data.PAYLOAD as { ACTION?: unknown } | undefined)?.ACTION)
      )
        return;
      const allowedOrigins = Object.values(config.remoteApps ?? {}).flatMap((remote) => remote.ALLOWED_ORIGINS ?? []);
      if (allowedOrigins.length && !allowedOrigins.some((value) => normalizeOrigin(value) === event.origin)) return;
      onAuthAction((event.data.PAYLOAD as { ACTION: "LOGIN" | "LOGOUT" | "REFRESH" }).ACTION, event.origin);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [config]);

  const configuredLocales = config.locales?.length ? config.locales : [...defaultBiuLocales];
  const supportedLocales = configuredLocales.map((item) => item.code);
  const activeLocale = normalizeBiuLocale(hostContext?.LOCALE ?? locale, supportedLocales);
  const activeEnvironment = hostContext?.ENVIRONMENT ?? config.environment;
  const activePortalCode = hostContext?.PORTAL_CODE ?? hostPortalCode;
  const activeTheme = normalizeBiuTheme(hostContext?.THEME ?? theme);
  const activeDirection = normalizeBiuDirection(hostContext?.DIRECTION ?? direction);
  const activeTimezone = normalizeBiuTimezone(hostContext?.TIMEZONE ?? timezone);
  const storageScope = `${activePortalCode || config.portalCode || config.appId}:${activeEnvironment || config.environment || "local"}`;
  const activeAuth = hostContext?.AUTH ?? preferences.auth ?? authContextFor(config);
  const authEnabled = config.auth?.enabled !== false;
  const localeOptions = useMemo<BiuLocaleOption[]>(() => {
    return configuredLocales.filter(
      (item) =>
        typeof item.code === "string" && item.code.trim() && typeof item.label === "string" && item.label.trim(),
    );
  }, [configuredLocales, activeLocale]);

  const changeLocale = useCallback(
    (value: string) => {
      setLocale(normalizeBiuLocale(value, supportedLocales));
    },
    [setLocale, supportedLocales],
  );
  const reloadMenus = useCallback(
    (value?: string) => {
      if (value) changeLocale(value);
      setMenuReloadToken((current) => current + 1);
    },
    [changeLocale],
  );
  const reloadLocale = useCallback(
    (value?: string) => {
      if (value) changeLocale(value);
      setLocaleReloadToken((current) => current + 1);
    },
    [changeLocale],
  );

  const previousLocaleRef = useRef(activeLocale);
  useEffect(() => {
    if (previousLocaleRef.current !== activeLocale) config.onLocaleChange?.(activeLocale);
    previousLocaleRef.current = activeLocale;
  }, [activeLocale, config.onLocaleChange]);

  useEffect(() => {
    preferences.setStorageScope(storageScope);
  }, [preferences.setStorageScope, storageScope]);

  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = () => {
      const prefersDark = activeTheme === "system" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
      root.dataset.biuTheme = activeTheme === "dark" || prefersDark ? "dark" : "light";
      root.dir = activeDirection;
    };
    applyTheme();
    if (activeTheme !== "system" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    if (media.addEventListener) media.addEventListener("change", applyTheme);
    else media.addListener?.(applyTheme);
    return () => {
      if (media.removeEventListener) media.removeEventListener("change", applyTheme);
      else media.removeListener?.(applyTheme);
    };
  }, [activeDirection, activeTheme]);

  useEffect(() => {
    if (config.updateCheck?.enabled === false) return;
    const checker = createBiuUpdateChecker(config.updateCheck?.manifestUrl, () => {
      biuMessage.info(i18n.$t("检测到新版本，请刷新", undefined, activeLocale), {
        duration: 0,
        id: "biu-update-available",
      });
    });
    updateCheckerRef.current = checker;
    void checker.initialize();
    return () => {
      if (updateCheckerRef.current === checker) updateCheckerRef.current = undefined;
    };
  }, [activeLocale, config.updateCheck?.enabled, config.updateCheck?.manifestUrl]);

  useEffect(() => {
    // Keep the non-React `i18n.$t()` API in sync with the shell context. React
    // pages use the hook, while adapters and utility modules use this registry.
    i18n.setLocale(activeLocale);
  }, [activeLocale]);

  useEffect(() => {
    if (!config.localeUrl) return;
    let active = true;
    const loadLocale = async () => {
      try {
        const response = await fetch(localeEndpoint(config.localeUrl!, activeLocale), { credentials: "include" });
        if (!response.ok) return;
        const resource = localeResourceFromResponse(
          await response.json(),
          activeLocale,
          localeOptions.find((item) => item.code === activeLocale)?.label ?? activeLocale,
        );
        if (!active || !resource) return;
        i18n.addLocale(resource).setLocale(activeLocale);
        setLocaleResourceRevision((current) => current + 1);
      } catch {
        // Built-in English/Chinese fallback remains available when the optional business resource endpoint is unavailable.
      }
    };
    void loadLocale();
    return () => {
      active = false;
    };
  }, [activeLocale, config.localeUrl, localeOptions, localeReloadToken]);

  useEffect(() => {
    if (!isEmbeddedApp(config)) return;
    postBiuMessage(
      { TYPE: "BIU_READY", APP_ID: config.appId, VERSION: config.version },
      parentOrigin(config.hostOrigins),
    );
    return () =>
      postBiuMessage(
        {
          TYPE: "UI_OVERLAY_STATE",
          APP_ID: config.appId,
          PAYLOAD: { ID: "runtime", OPEN: false, SCOPE: "HOST_CHROME" },
        },
        parentOrigin(config.hostOrigins),
      );
  }, [config.appId, config.hostOrigins, config.projectType]);

  useEffect(() => {
    let active = true;
    const loadNavigation = async () => {
      const [menuResult, permissionResult] = await Promise.allSettled([
        fetchPortalMenuTree(config, activeLocale),
        fetchPermissionCodes(config, activeLocale),
      ]);
      if (!active) return;

      const menuError = menuResult.status === "rejected" ? menuResult.reason : undefined;
      const permissionError = permissionResult.status === "rejected" ? permissionResult.reason : undefined;
      const permissions = permissionResult.status === "fulfilled" ? permissionResult.value : undefined;
      const permissionEndpointConfigured = Boolean(config.menu?.permissionCodesUrl);

      // Never render a permission-bearing fallback after a configured
      // permission endpoint failed. Showing all local routes here would be a
      // privilege-escalation UX bug even if the API failure is temporary.
      if (permissionError && permissionEndpointConfigured) {
        setError(
          permissionError instanceof Error ? permissionError.message : i18n.$t("权限加载失败", undefined, activeLocale),
        );
        setNavigationLoading(false);
        return;
      }

      const menuData = menuResult.status === "fulfilled" ? menuResult.value : undefined;
      // A configured remote menu is authoritative by default. A local route
      // fallback must be opted into explicitly after a failed request, or a
      // transient API failure could expose routes that were not authorized.
      const allowMenuFallback = config.allowMenuFallback ?? !config.menu?.portalTreeUrl;
      if (!menuData && !allowMenuFallback) {
        setError(menuError instanceof Error ? menuError.message : i18n.$t("菜单加载失败", undefined, activeLocale));
        setNavigationLoading(false);
        return;
      }

      const sourceMenus = menuData
        ? mergeMenuMetadata(menuData, config.fallbackMenus ?? [])
        : (config.fallbackMenus ?? []);
      const keyedMenus = annotateMenuKeys(sourceMenus);
      const nextMenus = removeRootHomeMenus(filterMenus(keyedMenus, permissions));
      const requestedPath = normalizePath(window.location.pathname);
      setPermissionCodes(permissions);
      setMenus(nextMenus);
      setMenuTree(nextMenus);
      setNavigationLoading(false);
      const defaultHome = defaultHomeMenu(config);
      const current = menuForPath(nextMenus, window.location.pathname, defaultHome);
      const tabSession = config.layout?.tabs ? readBiuTabSession(storageScope) : { keys: [] };
      const restoredHistory = tabSession.keys
        .map((key) => findMenuByKey(nextMenus, key))
        .filter((item): item is MenuNode => Boolean(item && item.type === "MENU"));
      const initial = current ?? (requestedPath === "/" ? defaultHome : undefined);
      const homeKey = defaultHome ? menuNodeKey(defaultHome) : undefined;
      const restoredWithoutHome = restoredHistory.filter((item) => menuNodeKey(item) !== homeKey);
      const baseHistory = defaultHome ? [defaultHome, ...restoredWithoutHome] : restoredWithoutHome;
      const nextHistory =
        initial && !baseHistory.some((item) => menuNodeKey(item) === menuNodeKey(initial))
          ? [...baseHistory, initial]
          : baseHistory;
      setHistory(nextHistory);
      setTabsHydrated(true);
      setError(
        !initial && requestedPath !== "/"
          ? i18n.$t("未找到页面：{code}", { code: requestedPath }, activeLocale)
          : undefined,
      );
      if (initial) {
        setSelectedCode(initial.code);
        setSelectedMenuKey(menuNodeKey(initial));
        const path = menuPath(initial);
        const currentUrlPath = normalizePath(window.location.pathname);
        if (currentUrlPath !== path) {
          const suffix = `${window.location.search}${window.location.hash}`;
          window.history.replaceState({}, "", `${path}${suffix}`);
          setCurrentPath(path);
        }
      }
    };
    void loadNavigation().catch((reason) => {
      if (active) {
        setNavigationLoading(false);
        setError(reason instanceof Error ? reason.message : i18n.$t("菜单加载失败", undefined, config.locale));
      }
    });
    return () => {
      active = false;
    };
  }, [activeLocale, config, menuReloadToken, setMenuTree, storageScope]);

  useEffect(() => {
    if (!config.layout?.tabs || !tabsHydrated) return;
    writeBiuTabSession(storageScope, {
      keys: history.map((item) => menuNodeKey(item)),
      selectedKey: selectedMenuKey,
    });
  }, [config.layout?.tabs, history, selectedMenuKey, storageScope, tabsHydrated]);

  useEffect(() => {
    const onPopState = () => {
      const path = normalizePath(window.location.pathname + window.location.search);
      setCurrentPath(path);
      const current = menuForPath(menus, path, defaultHomeMenu(config));
      setSelectedCode(current?.code);
      setSelectedMenuKey(current ? menuNodeKey(current) : undefined);
      setError(
        !current && normalizePath(path) !== "/"
          ? i18n.$t("未找到页面：{code}", { code: normalizePath(path) }, activeLocale)
          : undefined,
      );
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [activeLocale, config, menus]);

  const menuMap = useMemo(() => {
    const map = new Map<string, MenuNode[]>();
    for (const node of flattenMenus(menus)) map.set(node.code, [...(map.get(node.code) ?? []), node]);
    return map;
  }, [menus]);
  const defaultHome = useMemo(() => defaultHomeMenu(config), [config]);
  const defaultHomeKey = defaultHome ? menuNodeKey(defaultHome) : undefined;
  const ensureDefaultHome = (items: MenuNode[]) => {
    if (!defaultHome) return items;
    return [defaultHome, ...items.filter((item) => menuNodeKey(item) !== defaultHomeKey)];
  };
  const selected =
    (selectedMenuKey === defaultHomeKey ? defaultHome : undefined) ??
    findMenuByKey(menus, selectedMenuKey) ??
    (selectedCode && menuMap.get(selectedCode)?.length === 1 ? menuMap.get(selectedCode)?.[0] : undefined);
  const breadcrumbItems = useMemo(
    () => findMenuTrailByKey(menus, selected ? menuNodeKey(selected) : undefined),
    [menus, selected],
  );
  const loader = selected ? config.pageRegistry[selected.code] : undefined;
  const isReactFramework = !config.framework || config.framework === "react";
  const Page = useMemo(
    () =>
      loader && isReactFramework ? lazy(loader as () => Promise<{ default: React.ComponentType<any> }>) : undefined,
    [isReactFramework, loader],
  );
  const portalContext = useMemo<BiuPageContext>(
    () => ({
      appId: config.appId,
      environment: activeEnvironment,
      locale: activeLocale,
      portalCode: activePortalCode,
      theme: activeTheme,
      direction: activeDirection,
      timezone: activeTimezone,
      auth: activeAuth,
      code: "__PORTAL_HOME__",
    }),
    [
      activeAuth,
      activeEnvironment,
      activeLocale,
      activePortalCode,
      activeDirection,
      activeTheme,
      activeTimezone,
      config.appId,
    ],
  );
  const pageContext = useMemo<BiuPageContext | undefined>(
    () =>
      selected
        ? {
            appId: config.appId,
            environment: activeEnvironment,
            locale: activeLocale,
            portalCode: activePortalCode,
            theme: activeTheme,
            direction: activeDirection,
            timezone: activeTimezone,
            auth: activeAuth,
            code: selected.code,
          }
        : undefined,
    [
      activeAuth,
      activeEnvironment,
      activeDirection,
      activeLocale,
      activePortalCode,
      activeTheme,
      activeTimezone,
      config.appId,
      selected?.code,
    ],
  );

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = activeLocale;
    const menuKey = selected?.titleKey?.trim();
    const menuTitle = menuKey ? i18n.$t(menuKey, undefined, activeLocale) : "";
    const systemTitle = config.layout?.systemOptions?.find((item) => item.code === config.layout?.activeSystem)?.label;
    document.title = resolveDocumentTitle({
      menuTitle,
      menuCode: selected?.code,
      systemTitle,
      brandLabel: config.layout?.brandLabel,
      portalCode: activePortalCode,
      appId: config.appId,
      fallback: i18n.$t("Biu 应用", undefined, activeLocale),
    });
  }, [
    activeLocale,
    activePortalCode,
    config.appId,
    config.layout?.activeSystem,
    config.layout?.brandLabel,
    config.layout?.systemOptions,
    selected?.code,
    selected?.titleKey,
  ]);

  useEffect(() => {
    config.lifecycle?.onShellLifecycle?.("MOUNT");
    eventBus.publish("biu:shell-mounted", { appId: config.appId }, config.appId);
    return () => {
      eventBus.publish("biu:shell-unmounted", { appId: config.appId }, config.appId);
      config.lifecycle?.onShellLifecycle?.("UNMOUNT");
    };
  }, [config.appId, config.lifecycle, eventBus]);

  const openDirectory = async (node: MenuNode) => {
    if (node.children || !config.menu?.directoryTreeUrl) return;
    try {
      const children = await fetchDirectoryMenuTree(config, node.code, activeLocale);
      setMenus((current) => {
        const next = replaceDirectoryChildren(current, node.code, filterMenus(children, permissionCodes));
        setMenuTree(next);
        return next;
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : i18n.$t("目录菜单加载失败", undefined, activeLocale));
    }
  };

  const requestAuth = useCallback(
    (action: "LOGIN" | "LOGOUT" | "REFRESH") => {
      if (isEmbeddedApp(config)) {
        postBiuMessage(
          {
            TYPE: "AUTH_ACTION",
            APP_ID: config.appId,
            PAYLOAD: { ACTION: action },
          },
          parentOrigin(config.hostOrigins),
        );
        return;
      }
      const url = action === "LOGIN" ? config.auth?.loginUrl : action === "LOGOUT" ? config.auth?.logoutUrl : undefined;
      if (url) window.location.assign(url);
    },
    [config.appId, config.auth?.loginUrl, config.auth?.logoutUrl, config.hostOrigins, config.projectType],
  );

  const enterAuthPage = (route: string) => {
    const path = normalizePath(route || "/Login");
    window.history.replaceState({}, "", path);
    setCurrentPath(path);
    setSelectedCode(undefined);
    setSelectedMenuKey(undefined);
    setHistory([]);
    setError(undefined);
    resetLayoutOverrides();
  };

  const setLayoutOverrides = useCallback((overrides: BiuLayoutOverrides) => {
    setLayoutOverridesState((current) => ({ ...current, ...overrides }));
  }, []);
  const resetLayoutOverrides = useCallback(() => setLayoutOverridesState({}), []);

  const navigateByNode = (
    node: MenuNode,
    options: {
      replace?: boolean;
      query?: string | Record<string, string>;
    } = {},
  ) => {
    if (!node || node.type !== "MENU") return false;
    const target = {
      code: node.code,
      key: menuNodeKey(node),
      path: menuPath(node),
    };
    const from = selected
      ? {
          code: selected.code,
          key: menuNodeKey(selected),
          path: menuPath(selected),
        }
      : undefined;
    const navigationEvent = {
      phase: "BEFORE" as const,
      from,
      to: target,
      query: typeof options.query === "string" ? options.query : undefined,
    };
    try {
      if (config.lifecycle?.onNavigation?.(navigationEvent) === false) return false;
    } catch (reason) {
      config.lifecycle?.onNavigation?.({
        ...navigationEvent,
        phase: "ERROR",
        error: reason,
      });
      setError(reason instanceof Error ? reason.message : i18n.$t("导航失败", undefined, activeLocale));
      return false;
    }
    void updateCheckerRef.current?.check();
    resetLayoutOverrides();
    const path = addQuery(menuPath(node), options.query);
    if (options.replace) window.history.replaceState({}, "", path);
    else window.history.pushState({}, "", path);
    setCurrentPath(normalizePath(path));
    setSelectedCode(node.code);
    setSelectedMenuKey(menuNodeKey(node));
    reportMonitorEvent(config, {
      TYPE: "NAVIGATION",
      APP_ID: config.appId,
      CODE: node.code,
      META: { path, menuKey: menuNodeKey(node), routePath: menuPath(node) },
    });
    setHistory((current) => {
      const next = ensureDefaultHome(current);
      return next.some((item) => menuNodeKey(item) === menuNodeKey(node)) ? next : [...next, node];
    });
    setError(undefined);
    config.lifecycle?.onNavigation?.({ ...navigationEvent, phase: "AFTER" });
    eventBus.publish("biu:navigation", { from, to: target }, config.appId);
    return true;
  };

  const navigateByCode = (
    code: string,
    options: {
      replace?: boolean;
      query?: string | Record<string, string>;
    } = {},
  ) => {
    const candidates = menuMap.get(code) ?? [];
    return candidates.length === 1 ? navigateByNode(candidates[0]!, options) : false;
  };

  const navigateByKey = (
    key: string,
    options: {
      replace?: boolean;
      query?: string | Record<string, string>;
    } = {},
  ) => {
    const node = findMenuByKey(menus, key);
    return node ? navigateByNode(node, options) : false;
  };

  const resolveMenuPath = (code: string, key?: string) => {
    const node = key ? findMenuByKey(menus, key) : menuMap.get(code)?.length === 1 ? menuMap.get(code)?.[0] : undefined;
    return node ? menuPath(node) : undefined;
  };

  const navigate = (
    path: string,
    options: {
      replace?: boolean;
      query?: string | Record<string, string>;
    } = {},
  ) => {
    const node = menuForPath(menus, path, defaultHome);
    return node ? navigateByNode(node, options) : false;
  };

  const handleUserAction = (action: "PROFILE" | "PASSWORD" | "LOGIN" | "REGISTER" | "LOGOUT") => {
    const hasCustomUserAction = Boolean(config.onUserAction);
    config.onUserAction?.(action, window.location.origin);
    if (!authEnabled && (action === "LOGIN" || action === "REGISTER" || action === "PROFILE" || action === "PASSWORD"))
      return;
    if (action === "LOGIN" || action === "REGISTER") {
      const route =
        action === "REGISTER"
          ? config.auth?.registerRoute || config.auth?.loginRoute || "/Login"
          : config.auth?.loginRoute || "/Login";
      if (!config.auth?.loginUrl) enterAuthPage(route);
      else requestAuth("LOGIN");
      return;
    }
    if (action === "LOGOUT") {
      setAuth({ mode: activeAuth.mode, authenticated: false });
      requestAuth("LOGOUT");
      enterAuthPage(config.auth?.loginRoute || "/Login");
      return;
    }
    if (hasCustomUserAction) return;
    const route =
      action === "PROFILE" ? config.auth?.profileRoute || "/Profile" : config.auth?.passwordRoute || "/ChangePassword";
    if (findMenuByPath(menus, route)) {
      navigate(route);
      return;
    }
    biuMessage.info(
      i18n.$t(action === "PROFILE" ? "个人信息由业务系统提供" : "修改密码请求已提交", undefined, activeLocale),
    );
  };

  const closeTab = (node: MenuNode) => {
    const key = menuNodeKey(node);
    if (key === defaultHomeKey) return;
    const index = history.findIndex((item) => menuNodeKey(item) === key);
    const next = ensureDefaultHome(history.filter((item) => menuNodeKey(item) !== key));
    setHistory(next);
    if (key !== (selected ? menuNodeKey(selected) : undefined)) return;
    const fallback = next[Math.max(0, index - 1)] ?? next[0];
    if (fallback) navigateByNode(fallback, { replace: true });
    else {
      setSelectedCode(undefined);
      setCurrentPath("/");
      window.history.replaceState({}, "", "/");
    }
  };

  const closeTabs = (action: "LEFT" | "RIGHT" | "OTHERS" | "ALL", node: MenuNode) => {
    const key = menuNodeKey(node);
    const currentHistory = ensureDefaultHome(history);
    const index = currentHistory.findIndex((item) => menuNodeKey(item) === key);
    const next = ensureDefaultHome(
      action === "LEFT"
        ? currentHistory.slice(index < 0 ? 0 : index)
        : action === "RIGHT"
          ? currentHistory.slice(0, index < 0 ? currentHistory.length : index + 1)
          : action === "OTHERS"
            ? currentHistory.filter((item) => menuNodeKey(item) === key)
            : [],
    );
    setHistory(next);
    if (selected && next.some((item) => menuNodeKey(item) === menuNodeKey(selected))) return;
    const fallback = next[next.length - 1];
    if (fallback) navigateByNode(fallback, { replace: true });
    else {
      setSelectedCode(undefined);
      setCurrentPath("/");
      window.history.replaceState({}, "", "/");
    }
  };

  const reorderTabs = (fromKey: string, toKey: string, position: "BEFORE" | "AFTER" = "BEFORE") => {
    setHistory((currentHistory) => {
      const from = currentHistory.findIndex((item) => menuNodeKey(item) === fromKey);
      const to = currentHistory.findIndex((item) => menuNodeKey(item) === toKey);
      if (from < 0 || to < 0 || from === to) return currentHistory;
      const next = [...currentHistory];
      const [item] = next.splice(from, 1);
      const target = next.findIndex((entry) => menuNodeKey(entry) === toKey);
      next.splice(position === "AFTER" ? target + 1 : target, 0, item);
      return next;
    });
  };

  const refreshTab = () => setPageRefreshKey((value) => value + 1);

  const authRoutes = new Set(
    [config.auth?.loginRoute || "/Login", config.auth?.registerRoute || config.auth?.loginRoute || "/Login"].map(
      normalizePath,
    ),
  );
  const isKnownAuthPath = authRoutes.has(normalizePath(currentPath));

  const Layout = config.layoutComponent ?? FallbackLayout;
  const portalVersion = config.projectType === "PORTAL" ? config.version : undefined;
  const appVersion =
    config.projectType === "APP"
      ? config.version
      : selected?.target === "APP"
        ? remoteAppVersions[selected.appId ?? ""]
        : undefined;
  const isUnknownPath = !selected && normalizePath(currentPath) !== "/" && !isKnownAuthPath;
  let content: React.ReactNode = isUnknownPath ? (
    <BiuStatusView
      status={404}
      message={i18n.$t("未找到页面：{code}", { code: currentPath }, activeLocale)}
      locale={activeLocale}
    />
  ) : selected?.meta?.__BIU_DEFAULT_HOME && config.homePage ? (
    <config.homePage />
  ) : selected?.meta?.__BIU_DEFAULT_HOME && config.homePageLoader && config.pageAdapter ? (
    <Suspense fallback={<div className="biu-loading">{i18n.$t("加载门户…", undefined, activeLocale)}</div>}>
      <FrameworkPage
        loader={config.homePageLoader}
        adapter={config.pageAdapter}
        context={portalContext}
        locale={activeLocale}
      />
    </Suspense>
  ) : (
    <BiuDefaultHome
      appName={config.layout?.brandLabel || config.appId}
      portalCode={activePortalCode}
      locale={activeLocale}
    />
  );
  if (selected?.meta?.__BIU_DEFAULT_HOME) {
    // The fixed root page is handled above, including its optional generated
    // source. It must never fall through to an APP iframe or a page registry.
  } else if (selected?.target === "APP" && !loader) {
    content = (
      <RemoteAppFrame
        key={`${selected.code}-${pageRefreshKey}`}
        node={selected}
        config={config}
        locale={activeLocale}
        theme={activeTheme}
        direction={activeDirection}
        timezone={activeTimezone}
        environment={activeEnvironment}
        onOverlayChange={setHostOverlay}
        onVersionChange={(version) => {
          const appId = selected?.appId;
          if (!appId) return;
          setRemoteAppVersions((current) => ({ ...current, [appId]: version }));
        }}
      />
    );
  } else if (Page && isReactFramework) {
    content = (
      <Suspense
        key={`${selected?.code}-${pageRefreshKey}`}
        fallback={
          <div className="biu-loading">{i18n.$t("加载 {code}…", { code: selected?.code ?? "" }, activeLocale)}</div>
        }
      >
        <Page />
      </Suspense>
    );
  } else if (loader && config.pageAdapter && pageContext) {
    content = (
      <Suspense
        key={`${selected?.code}-${pageRefreshKey}`}
        fallback={
          <div className="biu-loading">{i18n.$t("加载 {code}…", { code: selected?.code ?? "" }, activeLocale)}</div>
        }
      >
        <FrameworkPage loader={loader} adapter={config.pageAdapter} context={pageContext} locale={activeLocale} />
      </Suspense>
    );
  } else if (selected) {
    content = (
      <ErrorView locale={activeLocale} message={i18n.$t("未找到页面：{code}", { code: selected.code }, activeLocale)} />
    );
  }

  const body = error ? (
    <ErrorView locale={activeLocale} message={error} />
  ) : navigationLoading ? (
    <div className="biu-loading" role="status">
      {i18n.$t("正在加载菜单…", undefined, activeLocale)}
    </div>
  ) : (
    content
  );
  const shell = isEmbeddedApp(config) ? (
    <div className="biu-embedded-app">{body}</div>
  ) : (
    <Layout
      locale={activeLocale}
      localeOptions={localeOptions}
      menus={menus}
      selectedCode={selected?.code}
      selectedMenuKey={selected ? menuNodeKey(selected) : undefined}
      appName={config.appId}
      portalCode={activePortalCode}
      auth={activeAuth}
      currentTitle={selected ? i18n.$t(selected.titleKey ?? selected.code, undefined, activeLocale) : undefined}
      breadcrumbItems={breadcrumbItems}
      tabs={config.layout?.tabs}
      breadcrumb={config.layout?.breadcrumb}
      defaultHomeKey={defaultHomeKey}
      history={history}
      onSelect={navigateByNode}
      onCloseTab={closeTab}
      onRefreshTab={refreshTab}
      onCloseTabs={closeTabs}
      onReorderTabs={reorderTabs}
      onLocaleChange={changeLocale}
      onOpenDirectory={openDirectory}
      overlay={hostOverlay}
      portalSlots={config.portalSlots}
      layoutOverrides={layoutOverrides}
      layoutOptions={{
        ...config.layout,
        storageScope,
        activeTheme,
        activeDirection,
        activeTimezone,
        version: portalVersion,
        appVersion,
      }}
      onThemeChange={setTheme}
      onDirectionChange={setDirection}
      onTimezoneChange={setTimezone}
      onSystemChange={(option) => {
        if (option.url && option.code !== config.layout?.activeSystem)
          window.location.assign(new URL("/", option.url).toString());
      }}
      onUserAction={handleUserAction}
    >
      {body}
    </Layout>
  );
  const showAuthPage =
    authEnabled &&
    !isEmbeddedApp(config) &&
    (authRoutes.has(normalizePath(currentPath)) || (config.auth?.required === true && !activeAuth.authenticated));
  const authShell = showAuthPage ? <BiuAuthGate page={config.portalSlots?.authPage} /> : shell;
  return (
    <BiuErrorBoundary config={config} locale={activeLocale}>
      <BiuContext.Provider
        value={{
          appId: config.appId,
          environment: activeEnvironment,
          locale: activeLocale,
          portalCode: activePortalCode,
          theme: activeTheme,
          direction: activeDirection,
          timezone: activeTimezone,
          currentCode: selected?.code,
          currentTarget: selected?.target,
          currentPath,
          hostOrigin: isEmbeddedApp(config) ? parentOrigin(config.hostOrigins) || undefined : undefined,
          permissionCodes,
          auth: activeAuth,
          requestAuth,
          login: () => requestAuth("LOGIN"),
          logout: () => requestAuth("LOGOUT"),
          refreshAuth: () => requestAuth("REFRESH"),
          setAuth,
          navigateByCode,
          navigateByKey,
          resolveMenuPath,
          navigate,
          layoutOverrides,
          setLayoutOverrides,
          resetLayoutOverrides,
          setLocale: changeLocale,
          reloadMenus,
          reloadLocale,
          setTheme,
          setDirection,
          setTimezone,
          events: eventBus,
        }}
      >
        {authShell}
      </BiuContext.Provider>
    </BiuErrorBoundary>
  );
}

export function defineRoutes<T extends RouteEntry[]>(routes: T): T {
  return routes;
}
export function definePortal<T extends object>(portal: T): T {
  return portal;
}
