import React, { lazy, memo, Suspense, useCallback, useMemo } from "react";
import { i18n } from "@biugle/biu-i18n";
import { ErrorView, FrameworkPage } from "./components.js";
import { RemoteAppFrame } from "./remote.js";
import type { BiuPageContext, BiuRemoteAppLoaderProps, BiuRuntimeConfig, MenuNode } from "./types.js";

const KeepAliveRoutePage = memo(function KeepAliveRoutePage({
  node,
  config,
  active,
  refreshKey,
  locale,
  environment,
  portalCode,
  theme,
  direction,
  timezone,
  auth,
  hostActive,
}: {
  node: MenuNode;
  config: BiuRuntimeConfig;
  active: boolean;
  refreshKey: number;
  locale: BiuPageContext["locale"];
  environment?: string;
  portalCode?: string;
  theme: BiuPageContext["theme"];
  direction: BiuPageContext["direction"];
  timezone: BiuPageContext["timezone"];
  auth: BiuPageContext["auth"];
  hostActive?: boolean;
}) {
  const loader = Object.prototype.hasOwnProperty.call(config.pageRegistry, node.code)
    ? config.pageRegistry[node.code]
    : undefined;
  const isReactFramework = !config.framework || config.framework === "react";
  const Page = useMemo(
    () =>
      loader && isReactFramework
        ? memo(lazy(loader as () => Promise<{ default: React.ComponentType<any> }>))
        : undefined,
    [isReactFramework, loader],
  );
  const pageContext = useMemo<BiuPageContext>(
    () => ({
      appId: config.appId,
      environment,
      locale,
      portalCode,
      theme,
      direction,
      timezone,
      auth,
      hostActive,
      code: node.code,
    }),
    [auth, config.appId, direction, environment, hostActive, locale, node.code, portalCode, theme, timezone],
  );
  const fallback = <div className="biu-loading">{i18n.$t("加载 {code}…", { code: node.code }, locale)}</div>;
  const content = Page ? (
    <Suspense key={refreshKey} fallback={fallback}>
      <Page />
    </Suspense>
  ) : loader && config.pageAdapter ? (
    <Suspense key={refreshKey} fallback={fallback}>
      <FrameworkPage loader={loader} adapter={config.pageAdapter} context={pageContext} locale={locale} />
    </Suspense>
  ) : (
    <ErrorView locale={locale} message={i18n.$t("未找到页面：{code}", { code: node.code }, locale)} />
  );

  return (
    <div data-biu-page-keepalive={node.code} aria-hidden={!active} style={{ display: active ? "contents" : "none" }}>
      {content}
    </div>
  );
});

const KeepAliveRemoteAppRoute = memo(function KeepAliveRemoteAppRoute({
  node,
  config,
  active,
  refreshKey,
  locale,
  environment,
  theme,
  direction,
  timezone,
  onOverlayChange,
  setRemoteAppVersions,
}: {
  node: MenuNode;
  config: BiuRuntimeConfig;
  active: boolean;
  refreshKey: number;
  locale: BiuRemoteAppLoaderProps["locale"];
  environment?: string;
  theme: BiuRemoteAppLoaderProps["theme"];
  direction: BiuRemoteAppLoaderProps["direction"];
  timezone: string;
  onOverlayChange: React.ComponentProps<typeof RemoteAppFrame>["onOverlayChange"];
  setRemoteAppVersions: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  const onVersionChange = useCallback(
    (version: string) => {
      const appId = node.appId;
      if (!appId) return;
      setRemoteAppVersions((current) => ({ ...current, [appId]: version }));
    },
    [node.appId, setRemoteAppVersions],
  );

  return (
    <div
      data-biu-remote-keepalive={node.code}
      aria-hidden={!active}
      inert={!active}
      style={{ display: active ? "contents" : "none" }}
    >
      <RemoteAppFrame
        key={`${node.code}-${refreshKey}`}
        node={node}
        config={config}
        locale={locale}
        theme={theme}
        direction={direction}
        timezone={timezone}
        environment={environment}
        active={active}
        onOverlayChange={onOverlayChange}
        onVersionChange={onVersionChange}
      />
    </div>
  );
});

export function KeepAliveRouteHost({
  entries,
  activePageKey,
  pageRefreshKeys,
  config,
  locale,
  environment,
  portalCode,
  theme,
  direction,
  timezone,
  auth,
  hostActive,
  inactive,
  onOverlayChange,
  setRemoteAppVersions,
}: {
  entries: Map<string, MenuNode>;
  activePageKey?: string;
  pageRefreshKeys: Record<string, number>;
  config: BiuRuntimeConfig;
  locale: BiuRemoteAppLoaderProps["locale"];
  environment?: string;
  portalCode?: string;
  theme: BiuRemoteAppLoaderProps["theme"];
  direction: BiuRemoteAppLoaderProps["direction"];
  timezone: string;
  auth: BiuPageContext["auth"];
  hostActive?: boolean;
  inactive: boolean;
  onOverlayChange: React.ComponentProps<typeof RemoteAppFrame>["onOverlayChange"];
  setRemoteAppVersions: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  return (
    <>
      {[...entries.entries()].map(([key, node]) => {
        const active = key === activePageKey && !inactive;
        const refreshKey = pageRefreshKeys[key] ?? 0;
        if (node.target === "APP") {
          return (
            <KeepAliveRemoteAppRoute
              key={key}
              node={node}
              config={config}
              active={active}
              refreshKey={refreshKey}
              locale={locale}
              environment={environment}
              theme={theme}
              direction={direction}
              timezone={timezone}
              onOverlayChange={onOverlayChange}
              setRemoteAppVersions={setRemoteAppVersions}
            />
          );
        }
        return (
          <KeepAliveRoutePage
            key={key}
            node={node}
            config={config}
            active={active}
            refreshKey={refreshKey}
            locale={locale}
            environment={environment}
            portalCode={portalCode}
            theme={theme}
            direction={direction}
            timezone={timezone}
            auth={auth}
            hostActive={hostActive}
          />
        );
      })}
    </>
  );
}
