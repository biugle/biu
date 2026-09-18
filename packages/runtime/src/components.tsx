import React, { useEffect, useRef, useState } from "react";
import { i18n } from "@biugle/biu-i18n";
import { biuMessage } from "@biugle/biu-ui";
import type {
  BiuFrameworkAdapter,
  BiuMonitorEvent,
  BiuPageCleanup,
  BiuPageContext,
  BiuPageLoader,
  BiuRuntimeConfig,
} from "./types.js";
import type { BiuLocale } from "@biugle/biu-i18n";

export type BiuStatusCode = 400 | 401 | 403 | 404 | 500;

const statusCopy: Record<BiuStatusCode, { title: string; description: string }> = {
  400: { title: "请求无效", description: "请求参数无法被当前服务处理" },
  401: { title: "需要登录", description: "请登录后继续访问此页面" },
  403: { title: "没有访问权限", description: "当前账号没有访问此页面的权限" },
  404: { title: "页面不存在", description: "当前地址没有对应的页面" },
  500: { title: "服务暂不可用", description: "服务出现异常，请稍后重试" },
};

export function reportMonitorEvent(config: BiuRuntimeConfig, event: BiuMonitorEvent) {
  try {
    config.onMonitorEvent?.(event);
    if (typeof window !== "undefined") {
      const monitor = (window as Window & { __BIU_MONITOR__?: (value: BiuMonitorEvent) => void }).__BIU_MONITOR__;
      monitor?.(event);
    }
  } catch (reason) {
    if (typeof console !== "undefined") console.warn("[biu] monitor callback failed", reason);
  }
}

function safeErrorText(value: string) {
  return value.replace(/(authorization|cookie|token|session[_-]?id|password)\s*[:=]\s*[^\s,;]+/gi, "$1: [REDACTED]");
}

export function CopyButton({ value, locale }: { value: string; locale?: BiuLocale }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(safeErrorText(value));
      setCopied(true);
      biuMessage.success(i18n.$t("已复制错误详情", undefined, locale));
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      biuMessage.error(i18n.$t("复制失败，请手动复制", undefined, locale));
    }
  };
  return (
    <button type="button" className="biu-copy-button" onClick={copy}>
      {copied ? i18n.$t("已复制", undefined, locale) : i18n.$t("复制详情", undefined, locale)}
    </button>
  );
}

export function BiuErrorDetails({
  message,
  details,
  locale,
}: {
  message: string;
  details?: string;
  locale?: BiuLocale;
}) {
  const value = safeErrorText(details?.trim() || message);
  return (
    <div className="biu-error-details">
      <div className="biu-error-details-head">
        <strong>{i18n.$t("错误详情", undefined, locale)}</strong>
      </div>
      <pre>{value}</pre>
      <CopyButton value={value} locale={locale} />
    </div>
  );
}

export function ErrorView({
  message,
  details,
  status,
  locale,
}: {
  message: string;
  details?: string;
  status?: BiuStatusCode;
  locale?: BiuLocale;
}) {
  const copy = status ? statusCopy[status] : undefined;
  const fallback = copy ? i18n.$t(copy.description, undefined, locale) : i18n.$t("页面加载失败", undefined, locale);
  const detailMessage = message || fallback;
  return (
    <div className="biu-error" data-status={status}>
      {status ? <span className="biu-error-code">{status}</span> : null}
      <h2>
        {copy ? `${status} · ${i18n.$t(copy.title, undefined, locale)}` : i18n.$t("页面加载失败", undefined, locale)}
      </h2>
      <p>{detailMessage}</p>
      <BiuErrorDetails message={detailMessage} details={details} locale={locale} />
    </div>
  );
}

export function BiuStatusView({
  status,
  message,
  details,
  locale,
}: {
  status: BiuStatusCode;
  message?: string;
  details?: string;
  locale?: BiuLocale;
}) {
  return <ErrorView status={status} message={message || ""} details={details} locale={locale} />;
}

export class BiuErrorBoundary extends React.Component<
  {
    config: BiuRuntimeConfig;
    locale?: BiuLocale;
    children: React.ReactNode;
  },
  { error?: Error; componentStack?: string }
> {
  state: { error?: Error; componentStack?: string } = {};

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ componentStack: info.componentStack || undefined });
    reportMonitorEvent(this.props.config, {
      TYPE: "ERROR",
      APP_ID: this.props.config.appId,
      CODE: this.props.config.portalCode,
      MESSAGE: error.message,
      ERROR: error,
      META: { componentStack: info.componentStack },
    });
  }

  render() {
    if (!this.state.error) return this.props.children;
    const details = [this.state.error?.stack || this.state.error?.message, this.state.componentStack]
      .filter(Boolean)
      .join("\n\n");
    return (
      <div className="biu-error-boundary" role="alert">
        <div className="biu-error-boundary-card">
          <span className="biu-error-boundary-icon" aria-hidden="true">
            !
          </span>
          <h2>{i18n.$t("页面发生错误", undefined, this.props.locale)}</h2>
          <p>{i18n.$t("页面异常已被隔离，请刷新后重试", undefined, this.props.locale)}</p>
          <BiuErrorDetails
            message={this.state.error?.message || i18n.$t("页面发生错误", undefined, this.props.locale)}
            details={details}
            locale={this.props.locale}
          />
          <button type="button" onClick={() => window.location.reload()}>
            {i18n.$t("刷新页面", undefined, this.props.locale)}
          </button>
        </div>
      </div>
    );
  }
}

export function FrameworkPage({
  loader,
  adapter,
  context,
  locale,
}: {
  loader: BiuPageLoader;
  adapter: BiuFrameworkAdapter;
  context: BiuPageContext;
  locale?: BiuLocale;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    let cleanup: BiuPageCleanup | undefined;
    setError(undefined);
    loader()
      .then((module) => (adapter.loadPage ? adapter.loadPage(module, context) : module))
      .then((page) => {
        if (!active || !containerRef.current) return;
        return adapter.renderPage(containerRef.current, page, context);
      })
      .then((result) => {
        if (!result) return;
        if (active) cleanup = result;
        else void result();
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : String(reason));
      });
    return () => {
      active = false;
      void cleanup?.();
      if (containerRef.current) void adapter.unmountPage?.(containerRef.current, context);
    };
  }, [adapter, context, loader]);

  return error ? (
    <ErrorView locale={locale} message={error} />
  ) : (
    <div ref={containerRef} className="biu-framework-page" />
  );
}
