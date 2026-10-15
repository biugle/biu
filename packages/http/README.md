# @biugle/http

`@biugle/http` is the framework-neutral Axios transport package for Biu projects. It is the compatible successor to the client in `/Users/bexhe/WorkSpace/ts-xhttp/`: the legacy names, argument order, defaults and business-data return value remain available, while cancellation, stable duplicate-request keys, raw responses and safe error handling are additive improvements.

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

The exported types are part of the package API. `XHttpOptions` configures an
instance, while `RequestConfig` extends Axios' `AxiosRequestConfig` for one
request. The Demo API table and [`docs/http.md`](../../docs/http.md) list each
field separately with its default and runnable example.

| Type                      | Field                     | Type                                                                         | Default            | Meaning                                                                                 |
| ------------------------- | ------------------------- | ---------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------- |
| `XHttpOptions`            | `baseURL`                 | `string \| undefined`                                                        | `undefined`        | Default Axios URL prefix.                                                               |
| `XHttpOptions`            | `retryConfig`             | `AxiosRetryConfig \| undefined`                                              | `undefined`        | Enables retry with `retry` and `delay`.                                                 |
| `XHttpOptions`            | `timeout`                 | `number \| undefined`                                                        | `30000`            | Default timeout in milliseconds.                                                        |
| `XHttpOptions`            | `cancelDuplicatedRequest` | `boolean \| undefined`                                                       | `true`             | Cancels a pending ordinary request with the same stable key.                            |
| `XHttpOptions`            | `rejectErrorPromise`      | `boolean \| undefined`                                                       | `true`             | Keeps errors rejected unless explicitly disabled.                                       |
| `XHttpOptions`            | `requestHandler`          | `HandlerFunction<RequestConfig> \| undefined`                                | `undefined`        | Runs after request preparation.                                                         |
| `XHttpOptions`            | `responseHandler`         | `HandlerFunction<AxiosResponse \| HttpResponse> \| undefined`                | `undefined`        | Observes the response before data unwrapping.                                           |
| `XHttpOptions`            | `errorHandler`            | `ErrorHandlerFunction \| undefined`                                          | `undefined`        | Handles normalized errors and may return a fallback when rejection is disabled.         |
| `XHttpOptions`            | `requestFinally`          | `(config: RequestConfig) => void \| undefined`                               | `undefined`        | Runs after both success and failure.                                                    |
| `XHttpOptions`            | `setRequestHeaders`       | `(config: RequestConfig) => RequestConfig`                                   | `undefined`        | Returns the complete config after common headers are added.                             |
| `XHttpOptions`            | `formatResultAdaptor`     | `ResultFunction<unknown, unknown> \| undefined`                              | `undefined`        | Maps `response.data` to the business result.                                            |
| `RequestConfig`           | Axios fields              | `AxiosRequestConfig`                                                         | `{}`               | Supports `url`, `method`, `params`, `data`, `headers`, `signal` and other Axios fields. |
| `RequestConfig`           | `rejectErrorPromise`      | `boolean \| undefined`                                                       | Instance value     | Overrides rejection behavior for one request.                                           |
| `RequestConfig`           | `isWhiteList`             | `boolean \| undefined`                                                       | `false`            | Places the request in the independent whitelist cancellation group.                     |
| `RequestConfig`           | `formatResultAdaptor`     | `ResultFunction<unknown, unknown> \| undefined`                              | Instance value     | Overrides result mapping for one request.                                               |
| `RequestConfig`           | `cancelRequest`           | `(message?: string) => void \| undefined`                                    | Injected by client | Cancels the current request from a lifecycle hook.                                      |
| `RequestConfig`           | `[key: string]`           | `unknown`                                                                    | `undefined`        | Keeps project-specific Axios-compatible extension fields.                               |
| `AxiosRetryConfig`        | `retry`                   | `number`                                                                     | `0`                | Maximum retry count; must be non-negative.                                              |
| `AxiosRetryConfig`        | `delay`                   | `number`                                                                     | `0`                | Delay base in milliseconds; attempt n waits `n * delay`.                                |
| `HandlerFunction<T>`      | call signature            | `(data: T) => unknown`                                                       | `undefined`        | Generic request/response lifecycle callback.                                            |
| `ErrorHandlerFunction<T>` | call signature            | `(error: unknown, config: RequestConfig) => T \| void \| Promise<T \| void>` | `undefined`        | Error callback with the final request config.                                           |
| `ResultFunction<T, R>`    | call signature            | `(data: T) => R`                                                             | `undefined`        | Converts response data from `T` to `R`.                                                 |
| `XHttpMethod`             | values                    | `"GET" \| "POST" \| "PUT" \| "DELETE" \| "PATCH" \| "OPTIONS"`               | `GET` when omitted | Method constants; lower-case properties are aliases for the same upper-case values.     |

`Header` extends `Record<string, unknown>` and explicitly supports
`Origin?: string`, `Referer?: string`, `Cookie?: string | object`,
`Connection?: string`, `User-Agent?: string`, `Content-Type?: string` and
`Authorization?: string`. `HttpResponse<T>` exposes `data: T`, `status`,
`statusText`, `headers: Header`, `config: RequestConfig` and optional
`request: unknown`. `Response<T>` is an alias of `HttpResponse<T>`.

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

Duplicate ordinary requests are identified by a stable method/URL/params/data signature and the earlier request is aborted. Requests receive an `AbortSignal`; an incoming `config.signal` is merged with the client cancellation signal. `setRequestTimeout` rejects negative or non-finite values. Empty header values are valid and are not removed; pass `undefined` to remove a header.

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

Existing `XHttp`, `XHttpClass`, `XHttpMethod`, `XHttpUtils`, `Axios`, `CODE_MSG`, default methods, upload signatures and hook names remain available. `requestRaw`, `stableSerialize`, `http`, `HttpClient` and AbortController cancellation are additive. The only intentional safety fixes are that errors are not silently swallowed by a missing handler, duplicate keys are stable for reordered object keys, pending entries are cleaned reliably and legal empty headers are preserved. Valid legacy success calls keep their original data return semantics.

Chart, RichText, Editor and Preview Server are not part of this transport package or this delivery.

## License

MIT
