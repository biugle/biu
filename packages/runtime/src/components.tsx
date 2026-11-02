import React, { useEffect, useRef, useState } from "react";
import { i18n } from "@biugle/biu-i18n";
import { Alert, Button, Result, biuMessage } from "@biugle/react-components";
import { isChunkLoadError, recoverFromChunkLoadError } from "./chunk-recovery.js";
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
  const mountedRef = useRef(false);
  const resetTimerRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (resetTimerRef.current !== undefined) window.clearTimeout(resetTimerRef.current);
    };
  }, []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(safeErrorText(value));
      // Clipboard promises can settle after navigation; keep state updates
      // scoped to the mounted button and release any prior reset timer.
      if (!mountedRef.current) return;
      setCopied(true);
      biuMessage.success(i18n.$t("已复制错误详情", undefined, locale));
      if (resetTimerRef.current !== undefined) window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = window.setTimeout(() => {
        resetTimerRef.current = undefined;
        if (mountedRef.current) setCopied(false);
      }, 1600);
    } catch {
      if (mountedRef.current) biuMessage.error(i18n.$t("复制失败，请手动复制", undefined, locale));
    }
  };
  return (
    <Button type="default" variant="outlined" size="small" className="biu-copy-button" onClick={copy}>
      {copied ? i18n.$t("已复制", undefined, locale) : i18n.$t("复制详情", undefined, locale)}
    </Button>
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
  chunkLoadError,
  locale,
}: {
  message: string;
  details?: string;
  status?: BiuStatusCode;
  chunkLoadError?: boolean;
  locale?: BiuLocale;
}) {
  const copy = status ? statusCopy[status] : undefined;
  const fallback = copy ? i18n.$t(copy.description, undefined, locale) : i18n.$t("页面加载失败", undefined, locale);
  const detailMessage = chunkLoadError
    ? i18n.$t("页面资源加载失败，可能是页面版本已更新，请刷新后重试", undefined, locale)
    : message || fallback;
  return (
    <div className="biu-error" data-status={status}>
      {status ? <span className="biu-error-code">{status}</span> : null}
      <Result
        status="error"
        className="biu-error-result"
        title={
          copy ? `${status} · ${i18n.$t(copy.title, undefined, locale)}` : i18n.$t("页面加载失败", undefined, locale)
        }
        description={detailMessage}
      />
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
  { error?: Error; componentStack?: string; chunkLoadError?: boolean }
> {
  state: { error?: Error; componentStack?: string; chunkLoadError?: boolean } = {};

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const chunkLoadError = isChunkLoadError(error);
    this.setState({ componentStack: info.componentStack || undefined, chunkLoadError });
    reportMonitorEvent(this.props.config, {
      TYPE: "ERROR",
      APP_ID: this.props.config.appId,
      CODE: this.props.config.portalCode,
      MESSAGE: error.message,
      ERROR: error,
      META: { componentStack: info.componentStack, errorCategory: chunkLoadError ? "CHUNK_LOAD" : "APPLICATION" },
    });
    // A page reload can clear in-memory form state. Request it only for the
    // narrowly classified chunk case; application errors remain user-visible.
    if (chunkLoadError) recoverFromChunkLoadError(error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const details = [this.state.error?.stack || this.state.error?.message, this.state.componentStack]
      .filter(Boolean)
      .join("\n\n");
    return (
      <div className="biu-error-boundary">
        <div className="biu-error-boundary-card">
          <Alert
            status="error"
            bordered={false}
            className="biu-error-boundary-alert"
            title={i18n.$t("页面发生错误", undefined, this.props.locale)}
            description={i18n.$t(
              this.state.chunkLoadError
                ? "页面资源加载失败，可能是页面版本已更新，请刷新后重试"
                : "页面异常已被隔离，请刷新后重试",
              undefined,
              this.props.locale,
            )}
          />
          <BiuErrorDetails
            message={this.state.error?.message || i18n.$t("页面发生错误", undefined, this.props.locale)}
            details={details}
            locale={this.props.locale}
          />
          <Button type="primary" onClick={() => window.location.reload()}>
            {i18n.$t("刷新页面", undefined, this.props.locale)}
          </Button>
        </div>
      </div>
    );
  }
}

interface FrameworkPageProps {
  loader: BiuPageLoader;
  adapter: BiuFrameworkAdapter;
  context: BiuPageContext;
  locale?: BiuLocale;
}

function FrameworkPageView({
  containerRef,
  error,
  chunkLoadError,
  locale,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  error?: string;
  chunkLoadError: boolean;
  locale?: BiuLocale;
}) {
  return error ? (
    <ErrorView locale={locale} message={error} chunkLoadError={chunkLoadError} />
  ) : (
    <div ref={containerRef} className="biu-framework-page" />
  );
}

function RemountingFrameworkPage({ loader, adapter, context, locale }: FrameworkPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>();
  const [chunkLoadError, setChunkLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    let cleanup: BiuPageCleanup | undefined;
    const container = containerRef.current;
    if (!container) return;
    setError(undefined);
    setChunkLoadError(false);
    loader()
      .then((module) => (adapter.loadPage ? adapter.loadPage(module, context) : module))
      .then((page) => {
        if (!active) return;
        return adapter.renderPage(container, page, context);
      })
      .then((result) => {
        if (!result) return;
        if (active) cleanup = result;
        else void result();
      })
      .catch((reason) => {
        if (!active) return;
        const failedToLoadChunk = isChunkLoadError(reason);
        setChunkLoadError(failedToLoadChunk);
        setError(reason instanceof Error ? reason.message : String(reason));
        // Keep the retry inside this failed-page path and never reload for
        // unrelated adapter or business errors.
        if (failedToLoadChunk) recoverFromChunkLoadError(reason);
      });
    return () => {
      active = false;
      void cleanup?.();
      void adapter.unmountPage?.(container, context);
    };
  }, [adapter, context, loader]);

  return (
    <FrameworkPageView containerRef={containerRef} error={error} chunkLoadError={chunkLoadError} locale={locale} />
  );
}

function PersistentFrameworkPage({ loader, adapter, context, locale }: FrameworkPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contextRef = useRef(context);
  const pageRef = useRef<unknown>(undefined);
  const loadedPageRef = useRef(false);
  const appliedContextRef = useRef(context);
  const disposePageRef = useRef<(() => void) | undefined>(undefined);
  const updatePageRef = useRef<((page: unknown, context: BiuPageContext) => Promise<void>) | undefined>(undefined);
  const lifecycleActiveRef = useRef(false);
  const [error, setError] = useState<string>();
  const [chunkLoadError, setChunkLoadError] = useState(false);
  contextRef.current = context;

  useEffect(() => {
    let active = true;
    let pendingOperations = 0;
    let renderStarted = false;
    let disposeRequested = false;
    let disposed = false;
    let updateQueue = Promise.resolve();
    let cleanup: BiuPageCleanup | undefined;
    const container = containerRef.current;
    if (!container) return;
    lifecycleActiveRef.current = true;
    loadedPageRef.current = false;
    pageRef.current = undefined;
    setError(undefined);
    setChunkLoadError(false);
    const invokeSafely = (operation: (() => void | Promise<void>) | undefined) => {
      if (!operation) return;
      try {
        void Promise.resolve(operation()).catch(() => undefined);
      } catch {
        // Adapter cleanup must not create an unhandled rejection during route changes.
      }
    };
    const dispose = () => {
      disposeRequested = true;
      loadedPageRef.current = false;
      pageRef.current = undefined;
      if (pendingOperations > 0 || disposed) return;
      disposed = true;
      const pageCleanup = cleanup;
      cleanup = undefined;
      if (disposePageRef.current === dispose) disposePageRef.current = undefined;
      if (pageCleanup) invokeSafely(pageCleanup);
      if (renderStarted) invokeSafely(() => adapter.unmountPage?.(container, contextRef.current));
    };
    const update = async (page: unknown, nextContext: BiuPageContext) => {
      pendingOperations += 1;
      const operation = updateQueue.then(async () => {
        if (disposeRequested) return;
        try {
          await adapter.updatePage?.(container, page, nextContext);
        } catch (reason) {
          dispose();
          throw reason;
        }
      });
      updateQueue = operation.then(
        () => undefined,
        () => undefined,
      );
      try {
        await operation;
      } finally {
        pendingOperations -= 1;
        if (disposeRequested) dispose();
      }
    };
    disposePageRef.current = dispose;
    updatePageRef.current = update;

    void (async () => {
      try {
        const module = await loader();
        if (!active) return;
        const loadedPage = adapter.loadPage ? await adapter.loadPage(module, contextRef.current) : module;
        if (!active) return;
        const renderContext = contextRef.current;
        renderStarted = true;
        pendingOperations += 1;
        let result: void | BiuPageCleanup;
        try {
          result = await adapter.renderPage(container, loadedPage, renderContext);
          if (result) cleanup = result;
        } finally {
          pendingOperations -= 1;
          if (disposeRequested) dispose();
        }
        if (!active || disposeRequested) return;
        pageRef.current = loadedPage;
        loadedPageRef.current = true;
        appliedContextRef.current = renderContext;
        const latestContext = contextRef.current;
        if (latestContext !== renderContext) {
          await update(loadedPage, latestContext);
          if (!active || disposeRequested) return;
          appliedContextRef.current = latestContext;
        }
      } catch (reason) {
        dispose();
        if (!active) return;
        const failedToLoadChunk = isChunkLoadError(reason);
        setChunkLoadError(failedToLoadChunk);
        setError(reason instanceof Error ? reason.message : String(reason));
        if (failedToLoadChunk) recoverFromChunkLoadError(reason);
      }
    })();

    return () => {
      active = false;
      lifecycleActiveRef.current = false;
      if (disposePageRef.current === dispose) disposePageRef.current = undefined;
      if (updatePageRef.current === update) updatePageRef.current = undefined;
      dispose();
    };
  }, [adapter, loader]);

  useEffect(() => {
    const container = containerRef.current;
    const page = pageRef.current;
    const update = updatePageRef.current;
    if (!loadedPageRef.current || !container || page === undefined || !update || appliedContextRef.current === context)
      return;
    appliedContextRef.current = context;
    void update(page, context).catch((reason) => {
      disposePageRef.current?.();
      if (lifecycleActiveRef.current) setError(reason instanceof Error ? reason.message : String(reason));
    });
  }, [context]);

  return (
    <FrameworkPageView containerRef={containerRef} error={error} chunkLoadError={chunkLoadError} locale={locale} />
  );
}

export function FrameworkPage(props: FrameworkPageProps) {
  return props.adapter.updatePage ? <PersistentFrameworkPage {...props} /> : <RemountingFrameworkPage {...props} />;
}
