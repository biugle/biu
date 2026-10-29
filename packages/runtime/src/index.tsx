import React, { lazy, startTransition, Suspense, useCallback, useEffect, useMemo } from "react";
import { i18n } from "@biugle/biu-i18n";
import { parentOrigin, postBiuMessage } from "@biugle/biu-bridge";
import {
  addQuery,
  fetchDirectoryMenuTree,
  filterMenus,
  findMenuByKey,
  findMenuByPath,
  findMenuTrailByKey,
  flattenMenus,
  menuNodeKey,
  menuPath,
  normalizePath,
  replaceDirectoryChildren,
} from "@biugle/biu-router";
import { RemoteAppFrame } from "./remote.js";
import { BiuErrorBoundary, BiuStatusView, ErrorView, FrameworkPage, reportMonitorEvent } from "./components.js";
import { biuMessage } from "@biugle/react-components";
import { BiuContext } from "./context.js";
import { resolveDocumentTitle } from "./title.js";
import { BiuDefaultHome } from "./default-home.js";
import { BiuAuthGate } from "./auth-page.js";
import type {
  BiuLayoutOverrides,
  BiuPageContext,
  BiuRuntimeConfig,
  BiuMonitorEvent,
  MenuNode,
  RouteEntry,
} from "./types.js";
import { FallbackLayout, defaultHomeMenu, isEmbeddedApp, menuForPath } from "./runtime-shell-helpers.js";
import { useRuntimeShellState } from "./use-runtime-shell-state.js";
export type {
  BiuAccountPanel,
  BiuAccountPanelSubmit,
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
  BiuWatermarkOptions,
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

export function BiuShell({ config }: { config: BiuRuntimeConfig }) {
  const {
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
  } = useRuntimeShellState(config);
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
        const next = replaceDirectoryChildren(current, menuNodeKey(node), filterMenus(children, permissionCodes));
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
    // Keep the current page visible while a first-time route chunk loads.
    // Updating the lazy page inside a transition lets React retain the
    // previous content instead of flashing the shell-wide Suspense fallback.
    startTransition(() => {
      setCurrentPath(normalizePath(path));
      setSelectedCode(node.code);
      setSelectedMenuKey(menuNodeKey(node));
    });
    reportMonitorEvent(config, {
      TYPE: "NAVIGATION",
      APP_ID: config.appId,
      CODE: node.code,
      META: { path, menuKey: menuNodeKey(node), routePath: menuPath(node) },
    });
    startTransition(() => {
      setHistory((current) => {
        const next = ensureDefaultHome(current);
        return next.some((item) => menuNodeKey(item) === menuNodeKey(node)) ? next : [...next, node];
      });
      setError(undefined);
    });
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
      onLayoutOverrideChange={setLayoutOverrides}
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
