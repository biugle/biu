import React, { lazy, startTransition, Suspense, useCallback, useEffect, useMemo, useState } from "react";
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
import { KeepAliveRouteHost } from "./keep-alive-routes.js";
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
export * from "./public.js";

declare global {
  interface Window {
    __BIU_MONITOR__?: (event: BiuMonitorEvent) => void;
  }
}

export function BiuShell({ config }: { config: BiuRuntimeConfig }) {
  const [pageRefreshKeys, setPageRefreshKeys] = useState<Record<string, number>>({});
  const [keptAlivePages, setKeptAlivePages] = useState<MenuNode[]>([]);
  const retainKeepAlivePage = useCallback(
    (node?: MenuNode) => {
      if (
        !node ||
        (!config.pageRegistry[node.code] && node.target !== "APP") ||
        !config.routes.some((route) => route.code === node.code && route.keepAlive === true)
      )
        return;
      const key = menuNodeKey(node);
      setKeptAlivePages((current) =>
        current.some((item) => menuNodeKey(item) === key) ? current : [...current, node],
      );
    },
    [config],
  );
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
    hostActive,
    storageScope,
    activeAuth,
    authEnabled,
    localeOptions,
    localeResourceRevision,
    changeLocale,
    reloadMenus,
    reloadLocale,
  } = useRuntimeShellState(config, retainKeepAlivePage);
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
      hostActive,
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
      hostActive,
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
            hostActive,
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
      hostActive,
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
    localeResourceRevision,
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
    setKeptAlivePages([]);
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
    retainKeepAlivePage(selected);
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
      setAuth({ mode: activeAuth?.mode ?? "NONE", authenticated: false });
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
    if (key !== (selected ? menuNodeKey(selected) : undefined)) {
      setKeptAlivePages((current) => current.filter((item) => menuNodeKey(item) !== key));
      setPageRefreshKeys((current) => {
        const remaining = { ...current };
        delete remaining[key];
        return remaining;
      });
      return;
    }
    const fallback = next[Math.max(0, index - 1)] ?? next[0];
    if (fallback) navigateByNode(fallback, { replace: true });
    else {
      setSelectedCode(undefined);
      setCurrentPath("/");
      window.history.replaceState({}, "", "/");
    }
    setKeptAlivePages((current) => current.filter((item) => menuNodeKey(item) !== key));
    setPageRefreshKeys((current) => {
      const remaining = { ...current };
      delete remaining[key];
      return remaining;
    });
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
    const retainedKeys = new Set(next.map(menuNodeKey));
    if (!selected || !retainedKeys.has(menuNodeKey(selected))) {
      const fallback = next[next.length - 1];
      if (fallback) navigateByNode(fallback, { replace: true });
      else {
        setSelectedCode(undefined);
        setCurrentPath("/");
        window.history.replaceState({}, "", "/");
      }
    }
    setKeptAlivePages((current) => current.filter((item) => retainedKeys.has(menuNodeKey(item))));
    setPageRefreshKeys((current) =>
      Object.fromEntries(Object.entries(current).filter(([key]) => retainedKeys.has(key))),
    );
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

  const refreshTab = (node: MenuNode) => {
    const key = menuNodeKey(node);
    setPageRefreshKeys((current) => ({ ...current, [key]: (current[key] ?? 0) + 1 }));
  };

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
  const keepAliveCodes = useMemo(
    () => new Set(config.routes.filter((route) => route.keepAlive === true).map((route) => route.code)),
    [config.routes],
  );
  const isKeepAliveRoute = (node: MenuNode) =>
    keepAliveCodes.has(node.code) && (node.target === "APP" || Boolean(config.pageRegistry[node.code]));
  const availableMenuKeys = useMemo(() => new Set(flattenMenus(menus).map(menuNodeKey)), [menus]);
  const keepAliveNodes = useMemo(() => {
    const nodes = new Map<string, MenuNode>();
    for (const node of [...keptAlivePages, ...(selected ? [selected] : [])]) {
      const key = menuNodeKey(node);
      if (availableMenuKeys.has(key) && isKeepAliveRoute(node)) nodes.set(key, node);
    }
    return nodes;
  }, [availableMenuKeys, config.pageRegistry, keepAliveCodes, keptAlivePages, selected]);
  const activePageKey = selected ? menuNodeKey(selected) : undefined;
  const activePageKeepAlive = Boolean(selected && isKeepAliveRoute(selected));
  const cachedPages = (
    <KeepAliveRouteHost
      entries={keepAliveNodes}
      activePageKey={activePageKey}
      pageRefreshKeys={pageRefreshKeys}
      config={config}
      locale={activeLocale}
      environment={activeEnvironment}
      portalCode={activePortalCode}
      theme={activeTheme}
      direction={activeDirection}
      timezone={activeTimezone}
      auth={activeAuth}
      hostActive={hostActive}
      inactive={Boolean(error) || navigationLoading}
      onOverlayChange={setHostOverlay}
      setRemoteAppVersions={setRemoteAppVersions}
    />
  );
  const selectedRefreshKey = activePageKey ? (pageRefreshKeys[activePageKey] ?? 0) : 0;
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
        key={`${selected.code}-${selectedRefreshKey}`}
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
        key={`${selected?.code}-${selectedRefreshKey}`}
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
        key={`${selected?.code}-${selectedRefreshKey}`}
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

  const body = (
    <>
      {cachedPages}
      {error ? (
        <ErrorView locale={activeLocale} message={error} />
      ) : navigationLoading ? (
        <div className="biu-loading" role="status">
          {i18n.$t("正在加载菜单…", undefined, activeLocale)}
        </div>
      ) : activePageKeepAlive ? null : (
        content
      )}
    </>
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
    (authRoutes.has(normalizePath(currentPath)) || (config.auth?.required === true && !activeAuth?.authenticated));
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
          hostActive,
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
