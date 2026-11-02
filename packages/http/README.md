# @biugle/http

`@biugle/http` is the framework-neutral Axios transport package for Biu projects. It is the compatible successor to the `ts-xhttp` client: the legacy names, argument order, defaults and business-data return value remain available, while cancellation, stable duplicate-request keys, raw responses and safe error handling are additive improvements.

It does not depend on React, Runtime, Router, Store, UI, authentication policy or Mock data, so the same package can be used by React, Vue, HTML and iframe applications.

## Install

```bash
pnpm add @biugle/http
```

## Default and instance clients

```ts
import http, { XHttpClass, XHttpMethod } from "@biugle/http";

http.setBaseURL("/api").setAuthToken("Bearer <token>");
const user = await http.get<{ id: string }>("/me");

const api = new XHttpClass(
  {
    timeout: 10_000,
    cancelDuplicatedRequest: true,
    retryConfig: { retry: 2, delay: 300 },
    requestHandler: (config) => {
      console.debug("request", config.method, config.url);
      return config;
    },
    responseHandler: (response) => console.debug("response", response.status),
    requestFinally: (config) => console.debug("finished", config.url),
  },
  { baseURL: "/api", validateStatus: () => true },
);

await api.request(XHttpMethod.GET, "/users", { params: { page: 1 } });
```

## Public Type Contract

Type examples use the `api` instance above; import the required types as needed:

```ts
import type { ErrorHandlerFunction, HandlerFunction, Header, RequestConfig, ResultFunction } from "@biugle/http";
```

The following exported types are part of the `@biugle/http` contract. The [HTTP guide](https://github.com/biugle/biu/blob/main/docs/en/http.md) and Demo render the same fields individually. `XHttpOptions`
configures an instance; `RequestConfig` extends Axios `AxiosRequestConfig` with
XHttp fields.

| Type                      | Field / signature         | Complete type                                                                | Default                 | Values / parameters                                          | Effect                                                              | Example                                                                                                                 |
| ------------------------- | ------------------------- | ---------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `XHttpOptions`            | `baseURL`                 | `string \| undefined`                                                        | `undefined`             | Any Axios base URL                                           | Sets the instance URL prefix.                                       | `new XHttpClass({ baseURL: "/api" })`                                                                                   |
| `XHttpOptions`            | `retryConfig`             | `AxiosRetryConfig \| undefined`                                              | `undefined`             | `{ retry: number; delay: number }`                           | Enables retries and configures count/delay.                         | `new XHttpClass({ retryConfig: { retry: 2, delay: 300 } })`                                                             |
| `XHttpOptions`            | `timeout`                 | `number \| undefined`                                                        | `30000`                 | Non-negative finite milliseconds                             | Sets the instance timeout.                                          | `new XHttpClass({ timeout: 10_000 })`                                                                                   |
| `XHttpOptions`            | `cancelDuplicatedRequest` | `boolean \| undefined`                                                       | `true`                  | `true \| false`                                              | Cancels a duplicate pending ordinary request by stable key.         | `new XHttpClass({ cancelDuplicatedRequest: false })`                                                                    |
| `XHttpOptions`            | `rejectErrorPromise`      | `boolean \| undefined`                                                       | `true`                  | `true \| false`                                              | Keeps errors rejected unless explicitly disabled.                   | `new XHttpClass({ rejectErrorPromise: false, errorHandler: () => [] })`                                                 |
| `XHttpOptions`            | `requestHandler`          | `HandlerFunction<RequestConfig> \| undefined`                                | `undefined`             | `(config: RequestConfig) => unknown`                         | Runs before transport after request preparation.                    | `new XHttpClass({ requestHandler: (config) => console.info(config.url) })`                                              |
| `XHttpOptions`            | `responseHandler`         | `HandlerFunction<AxiosResponse \| HttpResponse> \| undefined`                | `undefined`             | `(response) => unknown`                                      | Observes the full response before unwrapping data.                  | `new XHttpClass({ responseHandler: (response) => console.info(response.status) })`                                      |
| `XHttpOptions`            | `errorHandler`            | `ErrorHandlerFunction \| undefined`                                          | `undefined`             | `(error, config) => T \| void \| Promise<T \| void>`         | Receives normalized errors and the final config.                    | `new XHttpClass({ errorHandler: (error, config) => console.error(config.url, error) })`                                 |
| `XHttpOptions`            | `requestFinally`          | `((requestConfig: RequestConfig) => void) \| undefined`                      | `undefined`             | Runs for success and failure                                 | Cleans loading or request context.                                  | `new XHttpClass({ requestFinally: (config) => console.info(config.url) })`                                              |
| `XHttpOptions`            | `setRequestHeaders`       | `((config: RequestConfig) => RequestConfig) \| undefined`                    | `undefined`             | Must return the complete config                              | Adds auth, trace and other common headers.                          | `new XHttpClass({ setRequestHeaders: (config) => ({ ...config, headers: { ...config.headers, "X-Trace": "demo" } }) })` |
| `XHttpOptions`            | `formatResultAdaptor`     | `ResultFunction<unknown, unknown> \| undefined`                              | `undefined`             | `(data: unknown) => unknown`                                 | Maps `response.data` to a business result.                          | `new XHttpClass({ formatResultAdaptor: (data) => ({ result: data }) })`                                                 |
| `RequestConfig`           | Axios fields              | `AxiosRequestConfig`                                                         | `{}`                    | `url`, `method`, `params`, `data`, `headers`, `signal`, etc. | Preserves the complete Axios request surface.                       | `api.axiosRequest({ url: "/users", method: "GET", params: { page: 1 } })`                                               |
| `RequestConfig`           | `rejectErrorPromise`      | `boolean \| undefined`                                                       | Inherits instance value | `true \| false`                                              | Overrides error propagation for one request.                        | `api.get("/users", {}, { rejectErrorPromise: false })`                                                                  |
| `RequestConfig`           | `isWhiteList`             | `boolean \| undefined`                                                       | `false`                 | `true \| false`                                              | Places the request in the independent whitelist cancellation group. | `api.axiosRequest({ url: "/users", isWhiteList: true })`                                                                |
| `RequestConfig`           | `formatResultAdaptor`     | `ResultFunction<unknown, unknown> \| undefined`                              | Inherits instance value | `(data) => result`                                           | Overrides data adaptation for one request.                          | `api.get("/users", {}, { formatResultAdaptor: (data) => ({ result: data }) })`                                          |
| `RequestConfig`           | `cancelRequest`           | `((message?: string) => void) \| undefined`                                  | Injected by client      | Optional cancellation message                                | Cancels the current request from a hook.                            | `new XHttpClass({ requestHandler: (config) => config.cancelRequest?.("cancelled") })`                                   |
| `RequestConfig`           | `[key: string]`           | `unknown`                                                                    | `undefined`             | Any project extension field                                  | Preserves ts-xhttp custom-field compatibility.                      | `api.get("/users", {}, { traceId: "demo-trace" })`                                                                      |
| `AxiosRetryConfig`        | `retry`                   | `number`                                                                     | `0`                     | Non-negative integer                                         | Maximum automatic retry count.                                      | `new XHttpClass({ retryConfig: { retry: 2, delay: 300 } })`                                                             |
| `AxiosRetryConfig`        | `delay`                   | `number`                                                                     | `0`                     | Non-negative milliseconds                                    | Attempt n waits `n * delay` milliseconds.                           | `new XHttpClass({ retryConfig: { retry: 2, delay: 500 } })`                                                             |
| `HandlerFunction<T>`      | call signature            | `(data: T) => unknown`                                                       | `undefined`             | `T` depends on hook location                                 | Generic request/response lifecycle callback.                        | `const handler: HandlerFunction<RequestConfig> = (config) => console.info(config.url);`                                 |
| `ErrorHandlerFunction<T>` | call signature            | `(error: unknown, config: RequestConfig) => T \| void \| Promise<T \| void>` | `undefined`             | Sync or async fallback                                       | Error callback with the final request config.                       | `const handler: ErrorHandlerFunction<string> = async (_error, config) => config.url ?? "fallback";`                     |
| `ResultFunction<T, R>`    | call signature            | `(data: T) => R`                                                             | `undefined`             | Caller chooses `T` and `R`                                   | Converts response data from `T` to `R`.                             | `const adapt: ResultFunction<{ items: string[] }, string[]> = (data) => data.items;`                                    |
| `XHttpMethod`             | method values             | `"GET" \| "POST" \| "PUT" \| "DELETE" \| "PATCH" \| "OPTIONS"`               | `GET` when omitted      | Upper-case constants and lower-case aliases                  | Shared HTTP method constants and union type.                        | `api.request(XHttpMethod.GET, "/users")`                                                                                |

### Header

Header examples demonstrate the public TypeScript shape. A type does not make browser-managed or forbidden request headers writable; Node and other runtimes must also follow server policies.

| Type     | Field           | Complete type                   | Default     | Values / parameters            | Effect                                                                                                  | Example                                                        |
| -------- | --------------- | ------------------------------- | ----------- | ------------------------------ | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `Header` | `Origin`        | `string \| undefined`           | `undefined` | HTTP(S) Origin                 | Origin field; browsers control the actual request Origin.                                               | `({ "Origin": "https://example.com" } satisfies Header)`       |
| `Header` | `Referer`       | `string \| undefined`           | `undefined` | URL                            | Referer field; browser requests follow the referrer policy.                                             | `({ "Referer": "https://example.com/page" } satisfies Header)` |
| `Header` | `Cookie`        | `string \| object \| undefined` | `undefined` | string, object                 | Compatibility Cookie field; browsers manage request cookies and forbid direct header assignment.        | `({ "Cookie": "demo=1" } satisfies Header)`                    |
| `Header` | `Connection`    | `string \| undefined`           | `undefined` | HTTP connection value          | Connection field; browsers manage the actual connection header.                                         | `({ "Connection": "keep-alive" } satisfies Header)`            |
| `Header` | `User-Agent`    | `string \| undefined`           | `undefined` | User agent string              | User-Agent field; runtime policy determines whether request overrides are accepted.                     | `({ "User-Agent": "ExampleClient/1.0" } satisfies Header)`     |
| `Header` | `Content-Type`  | `string \| undefined`           | `undefined` | MIME type                      | Content MIME type; multipart uploads must retain the correct boundary.                                  | `({ "Content-Type": "application/json" } satisfies Header)`    |
| `Header` | `Authorization` | `string \| undefined`           | `undefined` | Authorization scheme and value | Authorization field; applications obtain real credentials securely instead of embedding them in source. | `({ "Authorization": "Bearer <token>" } satisfies Header)`     |
| `Header` | `[key: string]` | `unknown`                       | `undefined` | Custom header name             | Allows extension header types; actual transport obeys runtime and HTTP rules.                           | `({ "X-Trace": "demo" } satisfies Header)`                     |

### HttpResponse

| Type              | Field        | Complete type   | Default        | Values / parameters    | Effect                                                                          | Example                                                                        |
| ----------------- | ------------ | --------------- | -------------- | ---------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `HttpResponse<T>` | `data`       | `T`             | Response value | Response payload       | Business payload in the full response, typed by T.                              | `const raw = await api.requestRaw(XHttpMethod.GET, "/users"); raw.data;`       |
| `HttpResponse<T>` | `status`     | `number`        | Response value | HTTP status            | HTTP status code; the default validateStatus does not reject non-2xx statuses.  | `const raw = await api.requestRaw(XHttpMethod.GET, "/users"); raw.status;`     |
| `HttpResponse<T>` | `statusText` | `string`        | Response value | HTTP status text       | Transport status text, which may be empty.                                      | `const raw = await api.requestRaw(XHttpMethod.GET, "/users"); raw.statusText;` |
| `HttpResponse<T>` | `headers`    | `Header`        | Response value | Header                 | Response headers, rather than client-default request headers.                   | `const raw = await api.requestRaw(XHttpMethod.GET, "/users"); raw.headers;`    |
| `HttpResponse<T>` | `config`     | `RequestConfig` | Response value | RequestConfig          | Final request configuration for tracing or diagnostics; do not log credentials. | `const raw = await api.requestRaw(XHttpMethod.GET, "/users"); raw.config;`     |
| `HttpResponse<T>` | `request`    | `unknown`       | Response value | Runtime request object | Optional transport request object; narrow its type for the runtime before use.  | `const raw = await api.requestRaw(XHttpMethod.GET, "/users"); raw.request;`    |

`Response<T>` aliases `HttpResponse<T>`. Empty header strings are preserved; pass `undefined` to remove a header.

The default `XHttp` instance is also exported as `http`; `XHttpClass.create(options?, axiosConfig?)` creates an isolated client. `getInstance()` exposes the underlying Axios instance for narrowly scoped Axios features, and `Axios` exposes the imported Axios module.

## Request API and return values

All of the following legacy methods return `response.data` on success. A configured `formatResultAdaptor` receives `response.data`, and its result becomes the returned value.

```ts
http.request(method, url, config?, isWhiteList?);
http.axiosRequest(urlOrConfig, config?);
http.allInRequest(config?); // deprecated compatibility alias
http.get(url, params?, config?, isWhiteList?);
http.post(url, data?, config?, isWhiteList?);
http.put(url, data?, config?, isWhiteList?);
http.patch(url, data?, config?, isWhiteList?);
http.delete(url, data?, config?, isWhiteList?);
```

`requestRaw(method, url, config?, isWhiteList?)` is additive and returns `{ data, status, statusText, headers, config, request }` without changing the legacy methods.

`isWhiteList` keeps same-signature requests from cancelling one another and puts them in the separate white-list cancellation group. `config.isWhiteList` may also be used when calling `request`, `axiosRequest` or `allInRequest`.

## Hooks and errors

The normal lifecycle is:

```text
setRequestHeaders → requestHandler → Axios request → responseHandler → requestFinally
                                                     ↘ errorHandler → requestFinally
```

- `setRequestHeaders(config)` must return a request config. It can add authorization or other common headers.
- `requestHandler(config)` runs after the config has been prepared and receives the cancellation function as `config.cancelRequest`.
- `responseHandler(response)` receives the Axios response before the normal method unwraps `response.data`.
- `formatResultAdaptor(data)` receives only `response.data`.
- `errorHandler(error, requestConfig)` receives the normalized Axios error. Errors still reject by default; set `rejectErrorPromise: false` on the client or request to use the handler's returned fallback value.
- `requestFinally(requestConfig)` runs for both success and failure.

The default Axios `validateStatus` accepts every HTTP status, matching `ts-xhttp`. Applications can override it in the second `axiosConfig` argument. Retry uses `axios-retry` and does not retry cancellation or explicitly marked `not-retry`/`custom-error` errors.

## Cancellation and request defaults

```ts
api.cancelRequest("route changed");
api.cancelWhiteListRequest("sign-out");
api.setBaseURL("/v2").setRequestTimeout(15_000);
api.setHeaders({ common: { "X-App": "portal" } });
api.setHeader("X-Trace", "demo");
api.setAuthToken("Bearer token");
api.getCancelToken(); // Axios CancelToken source, kept for compatibility
api.isCancel(error);
```

Duplicate ordinary requests are identified by a stable method/URL/params/data signature and the earlier request is aborted. For `FormData`, `Blob`, `ArrayBuffer` and buffer views (including `DataView` and TypedArray), identity is scoped to the client: distinct upload objects do not cancel one another, even with matching MIME/size/content; reusing the same object with the same remaining signature still replaces the preceding request. Public `stableSerialize` output stays compatible. Internal upload keys do not read file content or traverse binary bytes, and no identity is persisted. Requests receive an `AbortSignal`; an incoming `config.signal` is merged with the client cancellation signal. `setRequestTimeout` rejects negative or non-finite values. Empty header values are valid and are not removed; pass `undefined` to remove a header.

## Form and file uploads

The signatures and defaults match `ts-xhttp`:

```ts
http.postForm(url, data?, hasBrackets?, hasIndex?, config?, isWhiteList?);
http.postFile(url, files, name = "file", hasBrackets?, hasIndex?, config?, isWhiteList?);
http.upload(url, files, name = "file", hasBrackets?, hasIndex?, config?, isWhiteList?); // additive alias
```

`postForm` appends array values repeatedly when `hasBrackets` is false (`tags=a&tags=b`). With `hasBrackets=true`, it uses `tags[0]`/`tags[1]`, or `tags[]` when `hasIndex=true`. Object values are JSON strings. For compatibility, its default `Content-Type` is exactly `application/x-www-form-urlencoded;charset=UTF-8;`.

`postFile` accepts one `File` or an array. Arrays use the same field name by default, `files[0]`/`files[1]` with brackets, or `files[]` with brackets and `hasIndex=true`; its default header is `multipart/form-data`. Caller headers in `config` may override these defaults. The browser/runtime is responsible for providing `FormData`, `File` and `Blob`.

## Migration from ts-xhttp

```diff
- import XHttp from "js-xhttp";
+ import XHttp from "@biugle/http";
```

Existing `XHttp`, `XHttpClass`, `XHttpMethod`, `XHttpUtils`, `Axios`, `CODE_MSG`, default methods, upload signatures and hook names remain available. `requestRaw`, `stableSerialize`, `http`, `HttpClient` and AbortController cancellation are additive. Compatibility fixes include propagating errors when no handler exists, stable duplicate keys for reordered object keys and circular arrays, client-scoped binary upload identity, reliable pending-entry cleanup, merged cancellation signals and preserved legal empty headers. Valid legacy success calls keep their original data return semantics.

Chart, RichText, Editor and Preview Server are not part of this transport package or this delivery.

## License

MIT
