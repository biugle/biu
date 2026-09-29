export type BiuLogType = "default" | "primary" | "success" | "warning" | "error";

export type ConsoleMethod = "log" | "info" | "debug" | "warn" | "error" | "table" | "group" | "groupEnd" | "dir";

export interface ConsoleOpenEvent {
  detectedAt: number;
  method: "probe" | "debugger" | "dimension";
  confidence: "low" | "medium" | "high";
}

export interface BiuLoggerOptions {
  prefix?: string;
  enabled?: boolean;
  console?: Console;
  disableConsole?: boolean | ConsoleMethod[];
  detectConsoleOpen?: boolean;
  onConsoleOpen?: (event: ConsoleOpenEvent) => void;
  debuggerMode?: "off" | "on-open" | "interval";
  debuggerInterval?: number;
  onWatermarkRefresh?: () => void;
  refreshThrottleMs?: number;
}

export interface BiuLoggerHandle {
  log(type: BiuLogType, ...data: unknown[]): void;
  debug(...data: unknown[]): void;
  info(...data: unknown[]): void;
  success(...data: unknown[]): void;
  warning(...data: unknown[]): void;
  error(...data: unknown[]): void;
  primary(...data: unknown[]): void;
  default(...data: unknown[]): void;
  start(): void;
  stop(): void;
  restoreConsole(): void;
  destroy(): void;
}

type ConsoleLike = Console & Partial<Record<ConsoleMethod, (...args: unknown[]) => void>>;

const DEFAULT_COLORS: Record<BiuLogType, string> = {
  default: "#475569",
  primary: "#2563eb",
  success: "#16a34a",
  warning: "#d97706",
  error: "#dc2626",
};

const CONSOLE_METHODS: ConsoleMethod[] = ["log", "info", "debug", "warn", "error", "table", "group", "groupEnd", "dir"];

function resolveConsole(candidate?: Console): ConsoleLike | undefined {
  if (candidate) return candidate as ConsoleLike;
  if (typeof globalThis !== "undefined" && globalThis.console) return globalThis.console as ConsoleLike;
  return undefined;
}

function asCallable(value: unknown): ((...args: unknown[]) => void) | undefined {
  return typeof value === "function" ? (value as (...args: unknown[]) => void) : undefined;
}

function normalizeMethods(value: boolean | ConsoleMethod[] | undefined): ConsoleMethod[] {
  if (value === true) return [...CONSOLE_METHODS];
  if (!Array.isArray(value)) return [];
  return [...new Set(value)].filter((method): method is ConsoleMethod => CONSOLE_METHODS.includes(method));
}

function isDocumentVisible() {
  return typeof document === "undefined" || document.visibilityState !== "hidden";
}

function runDebugger() {
  // This is intentionally a statement rather than a synchronous loop. The caller controls its lifecycle.
  // eslint-disable-next-line no-debugger
  debugger;
}

function safeCall(callback: (() => void) | undefined) {
  try {
    callback?.();
  } catch {
    // An optional watermark/telemetry callback must never break logging.
  }
}

export function createLogger(options: BiuLoggerOptions = {}): BiuLoggerHandle {
  const output = resolveConsole(options.console);
  const prefix = options.prefix?.trim() || "Biu";
  const enabled = options.enabled !== false;
  const refreshThrottleMs = Math.max(250, options.refreshThrottleMs ?? 1200);
  const debuggerInterval = Math.max(1000, options.debuggerInterval ?? 2500);
  const originalMethods = new Map<ConsoleMethod, (...args: unknown[]) => void>();
  let started = false;
  let destroyed = false;
  let detectTimer: ReturnType<typeof setInterval> | undefined;
  let debuggerTimer: ReturnType<typeof setInterval> | undefined;
  let lastDetection = 0;
  let lastRefresh = 0;

  const emitConsoleOpen = (method: ConsoleOpenEvent["method"], confidence: ConsoleOpenEvent["confidence"]) => {
    const detectedAt = Date.now();
    if (detectedAt - lastDetection < refreshThrottleMs) return;
    lastDetection = detectedAt;
    const event: ConsoleOpenEvent = { detectedAt, method, confidence };
    try {
      options.onConsoleOpen?.(event);
    } catch {
      // User callbacks are isolated from the logger lifecycle.
    }
    if (detectedAt - lastRefresh >= refreshThrottleMs) {
      lastRefresh = detectedAt;
      safeCall(options.onWatermarkRefresh);
    }
    if (options.debuggerMode === "on-open") runDebugger();
  };

  const probe = () => {
    if (destroyed || !started || !options.detectConsoleOpen || !output || !isDocumentVisible()) return;
    // DevTools may inspect this getter when it expands the logged object. This is a heuristic, not a browser event.
    const marker: Record<string, unknown> = {};
    Object.defineProperty(marker, "__biu_console_probe__", {
      configurable: true,
      get() {
        emitConsoleOpen("probe", "medium");
        return "";
      },
    });
    const log = asCallable(output.debug) ?? asCallable(output.log);
    try {
      log?.(`[${prefix}] console probe`, marker);
    } catch {
      // Console implementations can reject objects in restricted webviews.
    }
  };

  const patchConsole = () => {
    if (!output) return;
    for (const method of normalizeMethods(options.disableConsole)) {
      if (originalMethods.has(method)) continue;
      const current = asCallable(output[method]);
      if (!current) continue;
      originalMethods.set(method, current);
      output[method] = () => undefined;
    }
  };

  const restoreConsole = () => {
    if (!output) return;
    for (const [method, original] of originalMethods) output[method] = original;
    originalMethods.clear();
  };

  const stopTimers = () => {
    if (detectTimer !== undefined) clearInterval(detectTimer);
    if (debuggerTimer !== undefined) clearInterval(debuggerTimer);
    detectTimer = undefined;
    debuggerTimer = undefined;
  };

  const start = () => {
    if (destroyed || started) return;
    started = true;
    if (!enabled) return;
    patchConsole();
    if (options.detectConsoleOpen && typeof window !== "undefined") {
      detectTimer = setInterval(probe, Math.max(1000, debuggerInterval));
      probe();
    }
    if (options.debuggerMode === "interval" && typeof window !== "undefined") {
      debuggerTimer = setInterval(() => {
        if (isDocumentVisible()) runDebugger();
      }, debuggerInterval);
    }
  };

  const stop = () => {
    if (!started) return;
    started = false;
    stopTimers();
    restoreConsole();
  };

  const write = (type: BiuLogType, ...data: unknown[]) => {
    if (!enabled || destroyed || !output) return;
    const method: ConsoleMethod = type === "error" ? "error" : type === "warning" ? "warn" : "log";
    const target = asCallable(output[method]) ?? asCallable(output.log);
    if (!target) return;
    const color = DEFAULT_COLORS[type];
    try {
      target.call(output, `%c[${prefix}][${type}]%c`, `color:${color};font-weight:700`, "color:inherit", ...data);
    } catch {
      try {
        target.call(output, `[${prefix}][${type}]`, ...data);
      } catch {
        // A hostile console implementation should not break application code.
      }
    }
  };

  const handle: BiuLoggerHandle = {
    log: write,
    debug: (...data) => write("default", ...data),
    info: (...data) => write("primary", ...data),
    success: (...data) => write("success", ...data),
    warning: (...data) => write("warning", ...data),
    error: (...data) => write("error", ...data),
    primary: (...data) => write("primary", ...data),
    default: (...data) => write("default", ...data),
    start,
    stop,
    restoreConsole,
    destroy: () => {
      if (destroyed) return;
      stop();
      destroyed = true;
      stopTimers();
      restoreConsole();
    },
  };

  start();
  return handle;
}

export const biuLogger = createLogger();
