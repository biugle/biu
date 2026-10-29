import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { defaultBiuLocales, i18n, normalizeBiuLocale, type BiuLocaleOption } from "@biugle/biu-i18n";
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
  parentOrigin,
  postBiuMessage,
  publicAuthContext,
  type BiuHostContextPayload,
} from "@biugle/biu-bridge";
import { authContextFor, isAllowedAuthActionOrigin } from "./bridge.js";
import {
  annotateMenuKeys,
  fetchPermissionCodes,
  fetchPortalMenuTree,
  filterMenus,
  findMenuByKey,
  menuNodeKey,
  menuPath,
  mergeMenuMetadata,
  normalizePath,
} from "@biugle/biu-router";
import { biuMessage } from "@biugle/react-components";
import { createBiuUpdateChecker, type BiuUpdateChecker } from "./update-check.js";
import { biuEventBus } from "./events.js";
import type { BiuHostOverlayState, BiuLayoutOverrides, BiuRuntimeConfig, MenuNode } from "./types.js";
import {
  defaultHomeMenu,
  isEmbeddedApp,
  localeEndpoint,
  localeResourceFromResponse,
  menuForPath,
  removeRootHomeMenus,
} from "./runtime-shell-helpers.js";

export function useRuntimeShellState(config: BiuRuntimeConfig) {
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
      if (!isAllowedAuthActionOrigin(config, event.origin)) return;
      onAuthAction((event.data.PAYLOAD as { ACTION: "LOGIN" | "LOGOUT" | "REFRESH" }).ACTION, event.origin);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [config]);

  const configuredLocales = useMemo(
    () => (config.locales?.length ? config.locales : defaultBiuLocales),
    [config.locales],
  );
  const supportedLocales = useMemo(() => configuredLocales.map((item) => item.code), [configuredLocales]);
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
  }, [configuredLocales]);

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
      // Direction belongs to the foundation layout and to components that opt
      // in through an explicit `dir` prop. Applying it to <html> silently
      // changes every page-owned control and body-mounted overlay through
      // inheritance, even when that component does not support RTL.
      root.dir = "ltr";
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
  }, [activeTheme]);

  useEffect(() => {
    if (config.updateCheck?.enabled === false) return;
    const checker = createBiuUpdateChecker(config.updateCheck?.manifestUrl, () => {
      biuMessage.info(i18n.$t("检测到新版本，请刷新", undefined, activeLocale), {
        duration: 0,
        id: "biu-update-available",
        action: {
          label: i18n.$t("刷新页面", undefined, activeLocale),
          icon: "refresh",
          onClick: () => window.location.reload(),
        },
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
    const controller = new AbortController();
    const loadLocale = async () => {
      try {
        const response = await fetch(localeEndpoint(config.localeUrl!, activeLocale), {
          credentials: "include",
          signal: controller.signal,
        });
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
      controller.abort();
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
  return {
    menus,
    setMenus,
    selectedCode,
    setSelectedCode,
    selectedMenuKey,
    setSelectedMenuKey,
    history,
    setHistory,
    permissionCodes,
    currentPath,
    setCurrentPath,
    error,
    setError,
    hostOverlay,
    setHostOverlay,
    pageRefreshKey,
    setPageRefreshKey,
    layoutOverrides,
    setLayoutOverridesState,
    updateCheckerRef,
    setAuth,
    setTheme,
    setDirection,
    setTimezone,
    eventBus,
    remoteAppVersions,
    setRemoteAppVersions,
    navigationLoading,
    setMenuTree,
    activeLocale,
    activeEnvironment,
    activePortalCode,
    activeTheme,
    activeDirection,
    activeTimezone,
    storageScope,
    activeAuth,
    authEnabled,
    localeOptions,
    changeLocale,
    reloadMenus,
    reloadLocale,
  };
}
