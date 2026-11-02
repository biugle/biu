# `@biugle/http` guide

`@biugle/http` is the framework-neutral Axios transport package. Its compatibility baseline is the public contract and runtime behavior of `ts-xhttp`. It works in React, Vue, native HTML and iframe APPs without depending on Runtime, Preset, Router, Store, UI, authentication policy or Mock data.

See [http-compatibility-matrix.md](../http-compatibility-matrix.md) for the method-by-method compatibility matrix.

## Install and basic usage

```bash
pnpm add @biugle/http
```

```ts
import http, { XHttpClass, XHttpMethod } from "@biugle/http";

http.setBaseURL("/api").setAuthToken("Bearer <token>");
const user = await http.get<{ id: string }>("/me");

const api = new XHttpClass(
  {
    timeout: 10_000,
    cancelDuplicatedRequest: true,
    retryConfig: { retry: 2, delay: 300 },
    requestHandler: (config) => config,
    responseHandler: (response) => console.debug(response.status),
    requestFinally: (config) => console.debug(config.url),
  },
  { baseURL: "/api", validateStatus: () => true },
);

await api.request(XHttpMethod.GET, "/users", { params: { page: 1 } });
```

The default export and the named `XHttp`/`http` exports refer to the same default instance. `new XHttpClass(options?, axiosConfig?)` and `create(options?, axiosConfig?)` create isolated clients.

## Public Types, Field by Field

Type examples use the `api` instance above; import the required types as needed:

```ts
import type { ErrorHandlerFunction, HandlerFunction, Header, RequestConfig, ResultFunction } from "@biugle/http";
```

The following exported types are part of the `@biugle/http` contract and are
also rendered as individual rows in the HTTP Demo API table. `XHttpOptions`
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

## API, argument order and return values

The legacy names, argument order, defaults and whitelist position remain unchanged. Successful calls return business `response.data` rather than the full Axios response:

```ts
request(method, url, config?, isWhiteList?)
axiosRequest(urlOrConfig, config?)
allInRequest(config?) // deprecated compatibility alias
get(url, params = {}, config?, isWhiteList = false)
post(url, data = {}, config?, isWhiteList = false)
put(url, data = {}, config?, isWhiteList = false)
patch(url, data = {}, config?, isWhiteList = false)
delete(url, data = {}, config?, isWhiteList = false)
postForm(url, data = {}, hasBrackets = false, hasIndex = false, config?, isWhiteList = false)
postFile(url, files, name = "file", hasBrackets = false, hasIndex = false, config?, isWhiteList = false)
```

`requestRaw(method, url, config?, isWhiteList?)` is an additive explicit raw-response API returning `data`, `status`, `statusText`, `headers`, `config` and `request` without changing the legacy methods.

## Hooks, errors and retry

The order is `setRequestHeaders` → `requestHandler` → Axios → `responseHandler` or `errorHandler` → `requestFinally`. `formatResultAdaptor` receives `response.data`, and request-level configuration overrides instance-level configuration.

- `setRequestHeaders(config)` must return a config object and can add token or trace headers.
- `requestHandler(config)` runs before transport; `config.cancelRequest` cancels that request.
- `responseHandler(response)` receives the full Axios response; normal methods then return only `response.data`.
- `errorHandler(error, requestConfig)` receives the normalized error. Errors reject by default; only `rejectErrorPromise: false` uses the handler return value as a fallback.
- `requestFinally(requestConfig)` runs on both success and failure.
- `retryConfig: { retry, delay }` uses `axios-retry`; cancellation, `not-retry` and `custom-error` errors are not retried.

The default `validateStatus` accepts every HTTP status, matching the legacy client. Override it in the second `axiosConfig` argument when a 2xx-only policy is required.

## Duplicate requests, whitelist and defaults

Ordinary requests cancel the previous request with the same stable `method/url/params/data` key. Reordered object properties do not create a false difference. For a `FormData`, `Blob`, `ArrayBuffer` or buffer view (including `DataView` and TypedArray), the internal key uses identity within that client: distinct upload objects may run concurrently, while the same object with the same remaining signature replaces the earlier request. Public `stableSerialize` output stays compatible; internal keys do not read file content, traverse binary bytes or create persistent identity. `isWhiteList=true` requests do not cancel one another and can only be cancelled by `cancelWhiteListRequest`.

```ts
api.cancelRequest("route changed");
api.cancelWhiteListRequest("sign-out");
api.setBaseURL("/v2").setRequestTimeout(15_000);
api.setHeader("X-Trace", "demo");
api.setAuthToken("Bearer token");
api.getCancelToken();
api.isCancel(error);
```

`setRequestTimeout` throws for negative or non-finite values. An empty string is a valid header value; pass `undefined` to remove a header. A request `AbortSignal` is merged with the client cancellation signal.

## `postForm` and `postFile`

`postForm` keeps the legacy array and object serialization:

```ts
await http.postForm("/search", { tags: ["ui", "pro"], filter: { active: true } });
// tags, tags; filter = '{"active":true}'
await http.postForm("/search", { tags: ["ui", "pro"] }, true, false);
// tags[0], tags[1]
await http.postForm("/search", { tags: ["ui", "pro"] }, true, true);
// tags[], tags[]
```

The compatibility default header is exactly `application/x-www-form-urlencoded;charset=UTF-8;`; it must not be silently changed. `postFile` accepts one file or an array, defaults to field `file` and `multipart/form-data`, uses `file[0]` with brackets and `file[]` with brackets plus `hasIndex`. `config.headers` may explicitly override the default header.

## Exports and migration

`XHttpClass`, `XHttpMethod`, `XHttpUtils`, `RequestConfig`, `XHttpOptions`, `Response`, `Header`, `AxiosRetryConfig`, `HandlerFunction`, `ErrorHandlerFunction`, `ResultFunction`, `Axios`, `CODE_MSG`, `HttpClient`, `http` and the default `XHttp` remain available. `allInRequest` is retained for compatibility and should not be used in new code.

```diff
- import XHttp from "js-xhttp";
+ import XHttp from "@biugle/http";
```

Compatibility fixes include propagating errors when no handler exists, stable keys for reordered object keys and circular arrays, client-scoped binary upload identity, reliable pending cleanup, merged cancellation signals and preserved legal empty headers. Successful legacy calls keep their business-data return semantics. Chart, RichText, Editor and Preview Server are outside this package.
