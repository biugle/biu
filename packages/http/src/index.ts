import axios, {
  type AxiosAdapter,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type Method as AxiosMethod,
} from "axios";
import axiosRetry from "axios-retry";

export const Axios = axios;

export interface Header extends Record<string, unknown> {
  Origin?: string;
  Referer?: string;
  Cookie?: string | object;
  Connection?: string;
  "User-Agent"?: string;
  "Content-Type"?: string;
  Authorization?: string;
}

export interface HttpResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Header;
  config: RequestConfig;
  request?: unknown;
}

export type Response<T = unknown> = HttpResponse<T>;
export interface AxiosRetryConfig {
  retry: number;
  delay: number;
}
/** Lifecycle hooks may return any value; request/response hooks keep the original config/response unchanged. */
export type HandlerFunction<T = unknown> = (data: T) => unknown;
export type ErrorHandlerFunction<T = unknown> = (
  error: unknown,
  requestConfig: RequestConfig,
) => T | void | Promise<T | void>;
/** Result adaptors receive response.data, matching the original js-xhttp runtime. */
export type ResultFunction<T = unknown, R = unknown> = (data: T) => R;

export interface RequestConfig extends AxiosRequestConfig {
  rejectErrorPromise?: boolean;
  isWhiteList?: boolean;
  formatResultAdaptor?: ResultFunction<unknown, unknown>;
  cancelRequest?: (message?: string) => void;
  /** Preserve ts-xhttp's escape hatch for project-specific Axios config fields. */
  [key: string]: unknown;
}

export interface XHttpOptions {
  baseURL?: string;
  retryConfig?: AxiosRetryConfig;
  timeout?: number;
  cancelDuplicatedRequest?: boolean;
  rejectErrorPromise?: boolean;
  requestHandler?: HandlerFunction<RequestConfig>;
  responseHandler?: HandlerFunction<AxiosResponse | HttpResponse>;
  errorHandler?: ErrorHandlerFunction;
  requestFinally?: (requestConfig: RequestConfig) => void;
  setRequestHeaders?: (config: RequestConfig) => RequestConfig;
  formatResultAdaptor?: ResultFunction<unknown, unknown>;
}

export const XHttpMethod = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
  PATCH: "PATCH",
  OPTIONS: "OPTIONS",
  get: "GET",
  post: "POST",
  put: "PUT",
  delete: "DELETE",
  patch: "PATCH",
  options: "OPTIONS",
} as const;
export type XHttpMethod = (typeof XHttpMethod)[keyof typeof XHttpMethod];
export const HttpMethod = XHttpMethod;

export function stableSerialize(value: unknown, seen = new WeakSet<object>()): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean")
    return JSON.stringify(value);
  if (typeof value === "bigint") return `bigint:${value.toString()}`;
  if (value instanceof Date) return `date:${value.toISOString()}`;
  if (typeof FormData !== "undefined" && value instanceof FormData) return "[FormData]";
  if (typeof Blob !== "undefined" && value instanceof Blob) return `[Blob:${value.type}:${value.size}]`;
  if (Array.isArray(value)) return `[${value.map((item) => stableSerialize(item, seen)).join(",")}]`;
  if (typeof value === "object") {
    if (seen.has(value)) return "[Circular]";
    seen.add(value);
    const result = `{${Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize((value as Record<string, unknown>)[key], seen)}`)
      .join(",")}}`;
    seen.delete(value);
    return result;
  }
  return String(value);
}

export class XHttpUtils {
  private static instance: XHttpUtils;
  private constructor() {}
  static getInstance() {
    this.instance ??= new XHttpUtils();
    return this.instance;
  }
  static typeof(value: unknown) {
    return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
  }
  static stableSerialize(value: unknown) {
    return stableSerialize(value);
  }
}

interface RequestController {
  controller: AbortController;
  cancel: (message?: string) => void;
  key?: string;
}
interface HandledResult {
  handled: true;
  value: unknown;
}

function toResponse<T>(response: AxiosResponse<T>): HttpResponse<T> {
  return {
    data: response.data,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers as unknown as Header,
    config: response.config as RequestConfig,
    request: response.request,
  };
}

function mergeSignal(controller: AbortController, signal: unknown) {
  if (!signal || typeof signal !== "object") return controller.signal;
  const source = signal as {
    aborted?: boolean;
    reason?: unknown;
    addEventListener?: (type: string, listener: () => void, options?: { once?: boolean }) => void;
  };
  if (source.aborted) controller.abort(source.reason);
  else source.addEventListener?.("abort", () => controller.abort(source.reason), { once: true });
  return controller.signal;
}

function appendLegacyFormValue(formData: FormData, key: string, value: unknown) {
  if (value !== null && typeof value === "object" && !(typeof Blob !== "undefined" && value instanceof Blob))
    formData.append(key, JSON.stringify(value));
  else formData.append(key, value as string | Blob);
}

function ensureFormData() {
  if (typeof FormData === "undefined") throw new Error("FormData is not available in this runtime");
  return new FormData();
}

export class XHttpClass {
  public readonly instance: AxiosInstance;
  public timeout = 30_000;
  private readonly cancelDuplicatedRequest: boolean;
  private readonly rejectErrorPromise: boolean;
  private readonly pendingRequests = new Map<string, RequestController>();
  private ordinaryRequests: RequestController[] = [];
  private whiteListRequests: RequestController[] = [];
  private readonly options: XHttpOptions;

  constructor(options: XHttpOptions = {}, axiosConfig: AxiosRequestConfig = {}) {
    this.options = options;
    this.cancelDuplicatedRequest = options.cancelDuplicatedRequest ?? true;
    this.rejectErrorPromise = options.rejectErrorPromise ?? true;
    this.timeout = options.timeout ?? this.timeout;
    this.instance = axios.create({
      baseURL: options.baseURL,
      timeout: this.timeout,
      validateStatus: () => true,
      ...axiosConfig,
    });
    if (options.retryConfig) {
      const retries = Math.max(0, options.retryConfig.retry);
      axiosRetry(this.instance, {
        retries,
        retryDelay: (count) => count * Math.max(0, options.retryConfig?.delay ?? 0),
        shouldResetTimeout: true,
        retryCondition: (error) => {
          const message = String(error?.message ?? "");
          if (this.isCancel(error) || message.includes("not-retry") || message.includes("custom-error")) return false;
          return (
            axiosRetry.isNetworkOrIdempotentRequestError(error) ||
            !error.code ||
            ["ECONNRESET", "ETIMEDOUT"].includes(String(error.code ?? "")) ||
            (String(error.code ?? "") === "ECONNABORTED" && message.includes("timeout"))
          );
        },
      });
    }
  }

  private requestKey(config: RequestConfig) {
    return [
      String(config.method ?? "GET").toUpperCase(),
      config.baseURL ?? "",
      config.url ?? "",
      stableSerialize(config.params),
      stableSerialize(config.data),
    ].join("&");
  }

  private track(entry: RequestController, whiteList: boolean) {
    if (entry.key) {
      const key = entry.key;
      const previous = this.pendingRequests.get(key);
      previous?.cancel("Duplicate request replaced");
      previous?.controller.abort("Duplicate request replaced");
      this.pendingRequests.set(key, entry);
    } else if (whiteList) this.whiteListRequests.push(entry);
    else this.ordinaryRequests.push(entry);
  }

  private clear(entry: RequestController, whiteList: boolean, key?: string) {
    if (key && this.pendingRequests.get(key)?.controller === entry.controller) this.pendingRequests.delete(key);
    const list = whiteList ? this.whiteListRequests : this.ordinaryRequests;
    const index = list.findIndex((item) => item.controller === entry.controller);
    if (index >= 0) list.splice(index, 1);
  }

  private normalizeError(reason: unknown) {
    return (reason as { response?: unknown })?.response ?? reason;
  }

  private async prepare(
    method: XHttpMethod | AxiosMethod | string | undefined,
    url: string | undefined,
    config: RequestConfig,
    isWhiteList: boolean,
  ) {
    const controller = new AbortController();
    const cancelSource = axios.CancelToken.source();
    const callerProvidedCancelToken = Boolean(config.cancelToken);
    const cancel = (message?: string) => {
      cancelSource.cancel(message);
      controller.abort(message);
    };
    const requestConfig: RequestConfig = {
      ...config,
      method: method ?? "GET",
      url,
      signal: mergeSignal(controller, config.signal),
      // ts-xhttp exposed a CancelToken and cancelRequest to request hooks.
      // Keep both surfaces while AbortSignal remains the internal cancellation
      // primitive for modern callers.
      cancelToken: config.cancelToken ?? cancelSource.token,
      cancelRequest: cancel,
    };
    requestConfig.rejectErrorPromise ??= this.rejectErrorPromise;
    requestConfig.formatResultAdaptor ??= this.options.formatResultAdaptor;
    // Keep the legacy positional flag authoritative for the low-level
    // `request` method. The original ts-xhttp implementation treated the
    // fourth argument as the whitelist switch; the higher-level overloads
    // explicitly forward `config.isWhiteList` when callers use that shape.
    requestConfig.isWhiteList = isWhiteList ?? config.isWhiteList ?? false;
    const configured = this.options.setRequestHeaders?.call(this, requestConfig);
    if (this.options.setRequestHeaders && (!configured || typeof configured !== "object"))
      throw new TypeError(
        "XHttp Error: [setRequestHeaders] must be a function, and return a complete object value(RequestConfig) without missing original attributes!",
      );
    const finalConfig = configured ?? requestConfig;
    const whiteList = finalConfig.isWhiteList === true;
    // Keep the ts-xhttp escape hatch: a caller-supplied CancelToken owns the
    // request lifecycle, so the duplicate-request manager must not replace it.
    const key =
      this.cancelDuplicatedRequest && !whiteList && !callerProvidedCancelToken
        ? this.requestKey(finalConfig)
        : undefined;
    const entry = { controller, cancel, key };
    this.track(entry, whiteList);
    try {
      if (finalConfig.signal !== requestConfig.signal) mergeSignal(controller, finalConfig.signal);
      const prepared = {
        ...finalConfig,
        signal: controller.signal,
        cancelToken: finalConfig.cancelToken ?? cancelSource.token,
        cancelRequest: finalConfig.cancelRequest ?? cancel,
      } as RequestConfig;
      this.options.requestHandler?.call(this, prepared);
      return { entry, whiteList, config: prepared };
    } catch (error) {
      // Axios runs request interceptors inside the promise chain. If a header
      // or request hook throws, the legacy implementation still reaches the
      // error/finally path and must not leave a stale pending request behind.
      this.clear(entry, whiteList, entry.key);
      throw error;
    }
  }

  private async execute<R>(
    method: XHttpMethod | AxiosMethod | string | undefined,
    url: string | undefined,
    config: RequestConfig = {},
    isWhiteList = false,
  ): Promise<HttpResponse<R> | HandledResult> {
    // `prepare` can fail before it returns (for example when
    // setRequestHeaders rejects an invalid return value). Keep a normalized
    // config for the same errorHandler/requestFinally contract as Axios.
    const fallbackConfig: RequestConfig = {
      ...config,
      method: method ?? "GET",
      url,
      rejectErrorPromise: config.rejectErrorPromise ?? this.rejectErrorPromise,
      formatResultAdaptor: config.formatResultAdaptor ?? this.options.formatResultAdaptor,
      isWhiteList: config.isWhiteList ?? isWhiteList,
    };
    let prepared: Awaited<ReturnType<XHttpClass["prepare"]>> | undefined;
    try {
      prepared = await this.prepare(method, url, config, isWhiteList);
      const response = await this.instance.request(prepared.config as AxiosRequestConfig);
      const normalized = toResponse(response as AxiosResponse<R>);
      this.options.responseHandler?.call(this, response as AxiosResponse);
      return normalized;
    } catch (reason) {
      const error = this.normalizeError(reason);
      const requestConfig = prepared?.config ?? fallbackConfig;
      const handled = await this.options.errorHandler?.call(this, error, requestConfig);
      if (requestConfig.rejectErrorPromise === false) return { handled: true, value: handled };
      throw error;
    } finally {
      if (prepared) this.clear(prepared.entry, prepared.whiteList, prepared.entry.key);
      this.options.requestFinally?.call(this, prepared?.config ?? fallbackConfig);
    }
  }

  async requestRaw<R = unknown>(
    method: XHttpMethod | AxiosMethod | string | undefined,
    url: string | undefined,
    config: RequestConfig = {},
    isWhiteList = false,
  ): Promise<HttpResponse<R>> {
    return this.execute<R>(method, url, config, isWhiteList) as Promise<HttpResponse<R>>;
  }

  async request<R = unknown>(
    method: XHttpMethod | AxiosMethod | string | undefined,
    url: string | undefined,
    config: RequestConfig = {},
    isWhiteList = false,
  ): Promise<R> {
    const result = await this.execute<R>(method, url, config, isWhiteList);
    if ("handled" in result) return result.value as R;
    const response = result;
    const adaptor =
      response.config.formatResultAdaptor ?? config.formatResultAdaptor ?? this.options.formatResultAdaptor;
    return (adaptor ? adaptor.call(this, response.data) : response.data) as R;
  }

  async axiosRequest<R = unknown>(urlOrConfig: string | RequestConfig, config: RequestConfig = {}) {
    if (typeof urlOrConfig === "string")
      return this.request<R>(config.method ?? "GET", urlOrConfig, config, config.isWhiteList);
    return this.request<R>(urlOrConfig.method ?? "GET", urlOrConfig.url, urlOrConfig, urlOrConfig.isWhiteList);
  }

  async allInRequest<R = unknown>(config: RequestConfig = {}) {
    return this.request<R>(config.method ?? "GET", config.url, config, config.isWhiteList);
  }
  get<R = unknown>(url: string, params: unknown = {}, config: RequestConfig = {}, isWhiteList = false) {
    return this.request<R>(XHttpMethod.GET, url, { ...config, params }, isWhiteList);
  }
  post<R = unknown>(url: string, data: unknown = {}, config: RequestConfig = {}, isWhiteList = false) {
    return this.request<R>(XHttpMethod.POST, url, { ...config, data }, isWhiteList);
  }
  put<R = unknown>(url: string, data: unknown = {}, config: RequestConfig = {}, isWhiteList = false) {
    return this.request<R>(XHttpMethod.PUT, url, { ...config, data }, isWhiteList);
  }
  patch<R = unknown>(url: string, data: unknown = {}, config: RequestConfig = {}, isWhiteList = false) {
    return this.request<R>(XHttpMethod.PATCH, url, { ...config, data }, isWhiteList);
  }
  delete<R = unknown>(url: string, data: unknown = {}, config: RequestConfig = {}, isWhiteList = false) {
    return this.request<R>(XHttpMethod.DELETE, url, { ...config, data }, isWhiteList);
  }

  async postForm<R = unknown>(
    url: string,
    data: Record<string, unknown> = {},
    hasBrackets = false,
    hasIndex = false,
    config: RequestConfig = {},
    isWhiteList = false,
  ) {
    const formData = ensureFormData();
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value))
        value.forEach((item, index) =>
          formData.append(hasBrackets ? (hasIndex ? `${key}[]` : `${key}[${index}]`) : key, item as string | Blob),
        );
      else appendLegacyFormValue(formData, key, value);
    }
    return this.post<R>(
      url,
      formData,
      {
        ...config,
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8;", ...config.headers },
      },
      isWhiteList,
    );
  }

  async postFile<R = unknown>(
    url: string,
    files: File | File[],
    name = "file",
    hasBrackets = false,
    hasIndex = false,
    config: RequestConfig = {},
    isWhiteList = false,
  ) {
    const formData = ensureFormData();
    (Array.isArray(files) ? files : [files]).forEach((file, index) =>
      formData.append(
        Array.isArray(files) && hasBrackets ? (hasIndex ? `${name}[]` : `${name}[${index}]`) : name,
        file,
      ),
    );
    return this.post<R>(
      url,
      formData,
      {
        ...config,
        headers: { "Content-Type": "multipart/form-data", ...config.headers },
      },
      isWhiteList,
    );
  }

  /** Additive alias for applications that call file upload simply `upload`. */
  upload<R = unknown>(
    url: string,
    files: File | File[],
    name = "file",
    hasBrackets = false,
    hasIndex = false,
    config: RequestConfig = {},
    isWhiteList = false,
  ) {
    return this.postFile<R>(url, files, name, hasBrackets, hasIndex, config, isWhiteList);
  }

  cancelRequest(message = "Request cancelled") {
    for (const pending of this.pendingRequests.values()) {
      pending.cancel(message);
      pending.controller.abort(message);
    }
    for (const pending of this.ordinaryRequests) {
      pending.cancel(message);
      pending.controller.abort(message);
    }
    this.pendingRequests.clear();
    this.ordinaryRequests = [];
    return this;
  }
  cancelWhiteListRequest(message = "White-list request cancelled") {
    for (const pending of this.whiteListRequests) {
      pending.cancel(message);
      pending.controller.abort(message);
    }
    this.whiteListRequests = [];
    return this;
  }
  getCancelToken() {
    return axios.CancelToken.source();
  }
  getBaseURL() {
    return this.instance.defaults.baseURL;
  }
  setBaseURL(url?: string) {
    this.instance.defaults.baseURL = url;
    return this;
  }
  getHeaders() {
    return this.instance.defaults.headers;
  }
  setHeaders(headers: Header) {
    this.instance.defaults.headers = headers as typeof this.instance.defaults.headers;
    return this;
  }
  getHeader(key: string) {
    const headers = this.instance.defaults.headers as unknown as Record<string, unknown>;
    const common = headers.common as Record<string, unknown> | undefined;
    return common?.[key] ?? headers[key];
  }
  setHeader(key: string, value?: string) {
    const headers = this.instance.defaults.headers as unknown as Record<string, unknown>;
    const common = (headers.common ??= {}) as Record<string, unknown>;
    if (value === undefined) delete common[key];
    else common[key] = value;
    return this;
  }
  setRequestTimeout(timeout: number) {
    if (!Number.isFinite(timeout) || timeout < 0) throw new RangeError("Request timeout must be a non-negative number");
    this.timeout = timeout;
    this.instance.defaults.timeout = timeout;
    return this;
  }
  getAuthToken() {
    return (this.getHeader("Authorization") as string | undefined) ?? null;
  }
  setAuthToken(token: string) {
    return this.setHeader("Authorization", token);
  }
  isCancel(error: unknown) {
    return (
      axios.isCancel(error) ||
      (typeof DOMException !== "undefined" && error instanceof DOMException && error.name === "AbortError")
    );
  }
  getInstance() {
    return this.instance;
  }
  create(options?: XHttpOptions, axiosConfig: AxiosRequestConfig = {}) {
    return new XHttpClass(options, axiosConfig);
  }
}

export const XHttp = new XHttpClass();
export const http = XHttp;
export const HttpClient = XHttpClass;
export const CODE_MSG: Record<number, string> = {
  200: "服务器成功返回请求的数据。",
  201: "新建或修改数据成功。",
  202: "一个请求已经进入后台排队（异步任务）。",
  204: "删除数据成功。",
  301: "资源永久移动，请求的资源已被永久的移动到新 URI，返回信息会包括新的 URI，浏览器会自动定向到新 URI。",
  302: "资源临时移动，只是临时被移动，客户端可继续使用原有 URI。",
  303: "查看其它地址，与 301 类似，使用 GET 和 POST 请求查看。",
  304: "资源未修改，所请求的资源未修改，服务器返回此状态码时，不会返回任何资源。客户端通常会缓存访问过的资源，通过提供一个头信息指出客户端希望只返回在指定日期之后修改的资源。",
  400: "发出的请求有错误，服务器没有进行新建或修改数据的操作。",
  401: "用户没有权限（令牌、用户名、密码错误）。",
  403: "用户得到授权，但是访问是被禁止的。",
  404: "发出的请求针对的是不存在的记录，服务器没有进行操作。",
  406: "请求的格式不可得。",
  410: "请求的资源被永久删除，且不会再得到的。",
  422: "当创建一个对象时，发生一个验证错误。",
  500: "服务器发生错误，请检查服务器。",
  502: "网关错误。",
  503: "服务不可用，服务器暂时过载或维护。",
  504: "网关超时。",
};

export type { AxiosAdapter, AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosMethod };
export default XHttp;
