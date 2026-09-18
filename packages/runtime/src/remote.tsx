import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { i18n } from "@biugle/biu-i18n";
import {
  isAppEventPayload,
  isBridgeMessage,
  isOverlayState,
  isSafeRemoteUrl,
  publicAuthContext,
} from "@biugle/biu-bridge";
import { remoteAppFor } from "./bridge.js";
import { biuEventBus } from "./events.js";
import { BiuErrorDetails, ErrorView, reportMonitorEvent } from "./components.js";
import type {
  BiuHostOverlayState,
  BiuRemoteAppLifecycleEvent,
  BiuRemoteAppLoader,
  BiuRemoteAppLoaderProps,
  BiuRuntimeConfig,
  MenuNode,
} from "./types.js";

function appendRemotePath(basePath: string, pagePath: string) {
  const base = basePath === "/" ? "" : basePath.replace(/\/+$/, "");
  const page = pagePath.replace(/^\/+/, "");
  return `/${[base.replace(/^\/+/, ""), page].filter(Boolean).join("/")}`;
}

function childPath(node: MenuNode) {
  const path = node.appPath ?? `/${node.code}`;
  const clean = path.split("?")[0].replace(/\/+$/, "");
  return clean || "/";
}

function IframeRemoteApp({
  node,
  config,
  locale,
  theme,
  direction,
  timezone,
  environment,
  remote,
  url,
  targetOrigin,
  onOverlayChange,
  onLifecycle,
  onVersionChange,
}: BiuRemoteAppLoaderProps & { onVersionChange?: (version: string) => void }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "timeout">("loading");

  useEffect(
    () => () => {
      onOverlayChange(undefined);
      onLifecycle("UNLOAD");
    },
    [onLifecycle, onOverlayChange],
  );

  const sendContext = useCallback(() => {
    if (!iframeRef.current?.contentWindow || !url) return;
    iframeRef.current.contentWindow.postMessage(
      {
        CHANNEL: "BIU",
        TYPE: "HOST_CONTEXT",
        APP_ID: node.appId,
        PAYLOAD: {
          PORTAL_CODE: config.portalCode,
          ENVIRONMENT: environment,
          LOCALE: locale,
          THEME: theme,
          DIRECTION: direction,
          TIMEZONE: timezone,
          CURRENT_CODE: node.code,
          AUTH: publicAuthContext(
            config.auth
              ? {
                  mode: config.auth.mode ?? "NONE",
                  authenticated: config.auth.authenticated ?? Boolean(config.auth.user),
                  user: config.auth.user,
                }
              : { mode: "NONE", authenticated: false },
          ),
        },
      },
      targetOrigin,
    );
  }, [
    config.auth,
    config.portalCode,
    direction,
    environment,
    locale,
    node.appId,
    node.code,
    targetOrigin,
    theme,
    timezone,
    url,
  ]);

  useEffect(() => {
    sendContext();
  }, [sendContext]);

  useEffect(() => {
    setStatus("loading");
    onOverlayChange(undefined);
    onLifecycle("LOAD_START");
  }, [node.code, onLifecycle, onOverlayChange, url, attempt]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!iframeRef.current?.contentWindow || event.source !== iframeRef.current.contentWindow) return;
      if (!targetOrigin || (event.origin !== targetOrigin && !remote.allowedOrigins?.includes(event.origin))) return;
      if (!isBridgeMessage(event.data) || event.data.APP_ID !== node.appId) return;
      if (event.data.TYPE === "BIU_READY") {
        if (typeof event.data.VERSION === "string" && event.data.VERSION.trim())
          onVersionChange?.(event.data.VERSION.trim());
        setStatus("ready");
        onLifecycle("READY");
        sendContext();
        return;
      }
      if (event.data.TYPE === "APP_EVENT" && isAppEventPayload(event.data.PAYLOAD)) {
        (config.eventBus ?? biuEventBus).publish(
          event.data.PAYLOAD.name,
          event.data.PAYLOAD.payload,
          event.data.PAYLOAD.source ?? node.appId,
        );
        return;
      }
      if (event.data.TYPE !== "UI_OVERLAY_STATE" || !isOverlayState(event.data.PAYLOAD)) return;
      const value = event.data.PAYLOAD;
      if (value.SCOPE === "IFRAME") {
        onOverlayChange(undefined);
        return;
      }
      onOverlayChange({
        APP_ID: node.appId ?? "",
        ACTIVE: value.OPEN,
        MODE: value.MODE ?? remote.overlayMode,
      });
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [
    node.appId,
    onLifecycle,
    onOverlayChange,
    onVersionChange,
    remote.allowedOrigins,
    remote.overlayMode,
    sendContext,
    targetOrigin,
  ]);

  useEffect(() => {
    if (status !== "loading") return;
    const timer = window.setTimeout(() => setStatus("timeout"), 15_000);
    return () => window.clearTimeout(timer);
  }, [status, url, attempt]);

  useEffect(() => {
    if (status === "error") onLifecycle("ERROR", "iframe error");
    if (status === "timeout") onLifecycle("ERROR", "iframe ready timeout");
  }, [onLifecycle, status]);

  if (!url || !isSafeRemoteUrl(url, remote.allowedOrigins)) {
    return (
      <ErrorView
        locale={locale}
        message={i18n.$t("远程应用地址不在当前环境允许范围：{url}", { url: url ?? "" }, locale)}
      />
    );
  }

  const failed = status === "error" || status === "timeout";
  return (
    <div className="biu-remote-frame-shell">
      <iframe
        key={`${node.code}-${attempt}-${url}`}
        ref={iframeRef}
        title={node.titleKey ?? node.code}
        src={url}
        className="biu-app-frame"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        referrerPolicy="strict-origin"
        onLoad={sendContext}
        onError={() => setStatus("error")}
      />
      {status === "loading" && (
        <div className="biu-frame-state" role="status">
          {i18n.$t("正在连接 {code}…", { code: node.code }, locale)}
        </div>
      )}
      {failed && (
        <div className="biu-frame-state biu-frame-state-error">
          <p>{i18n.$t("子应用加载失败", undefined, locale)}</p>
          <BiuErrorDetails
            message={
              status === "timeout"
                ? i18n.$t("子应用响应超时", undefined, locale)
                : i18n.$t("iframe 加载事件失败", undefined, locale)
            }
            locale={locale}
          />
          <div className="biu-frame-state-actions">
            <button type="button" onClick={() => setAttempt((value) => value + 1)}>
              {i18n.$t("重新加载", undefined, locale)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export const iframeRemoteAppLoader: BiuRemoteAppLoader = {
  mode: "IFRAME",
  Component: IframeRemoteApp,
};

export function RemoteAppFrame({
  node,
  config,
  locale,
  theme,
  direction,
  timezone,
  environment,
  onOverlayChange,
  onVersionChange,
}: {
  node: MenuNode;
  config: BiuRuntimeConfig;
  locale: BiuRemoteAppLoaderProps["locale"];
  theme: BiuRemoteAppLoaderProps["theme"];
  direction: BiuRemoteAppLoaderProps["direction"];
  timezone: string;
  environment?: string;
  onOverlayChange: (state?: BiuHostOverlayState) => void;
  onVersionChange?: (version: string) => void;
}) {
  const remote = remoteAppFor(config, node);
  const url = useMemo(() => {
    if (!remote.url) return undefined;
    try {
      const value = new URL(remote.url, window.location.origin);
      value.pathname = appendRemotePath(value.pathname, childPath(node));
      value.searchParams.set("code", node.code);
      value.searchParams.set("portalCode", config.portalCode ?? "");
      value.searchParams.set("hostAppId", config.appId);
      return value.toString();
    } catch {
      return undefined;
    }
  }, [config.appId, config.portalCode, node, remote.url]);
  const targetOrigin = useMemo(() => {
    try {
      return url ? new URL(url).origin : "";
    } catch {
      return "";
    }
  }, [url]);
  const loader = config.remoteAppLoader ?? iframeRemoteAppLoader;
  const onLifecycle = useCallback(
    (event: BiuRemoteAppLifecycleEvent, error?: string) => {
      config.onRemoteAppLifecycle?.({
        EVENT: event,
        MODE: loader.mode,
        APP_ID: node.appId,
        CODE: node.code,
        URL: url,
        ERROR: error,
      });
      if (event === "ERROR")
        reportMonitorEvent(config, {
          TYPE: "REMOTE_APP",
          APP_ID: config.appId,
          CODE: node.code,
          MESSAGE: error,
          META: { remoteAppId: node.appId, url },
        });
    },
    [config, loader.mode, node.appId, node.code, url],
  );
  if (!url || !isSafeRemoteUrl(url, remote.allowedOrigins)) {
    return (
      <ErrorView
        locale={locale}
        message={i18n.$t("远程应用地址不在当前环境允许范围：{url}", { url: url ?? "" }, locale)}
      />
    );
  }
  const LoaderComponent = loader.Component;
  return (
    <LoaderComponent
      node={node}
      config={config}
      locale={locale}
      theme={theme}
      direction={direction}
      timezone={timezone}
      environment={environment}
      remote={remote}
      url={url}
      targetOrigin={targetOrigin}
      onOverlayChange={onOverlayChange}
      onLifecycle={onLifecycle}
      onVersionChange={onVersionChange}
    />
  );
}
