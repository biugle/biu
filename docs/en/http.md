# `@biugle/http` guide

`@biugle/http` is the framework-neutral Axios transport package. Its compatibility baseline is the runtime behavior of `/Users/bexhe/WorkSpace/ts-xhttp/`. It works in React, Vue, native HTML and iframe APPs without depending on Runtime, Preset, Router, Store, UI, authentication policy or Mock data.

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

Ordinary requests cancel the previous request with the same stable `method/url/params/data` key. Reordered object properties do not create a false difference. `isWhiteList=true` requests do not cancel one another and can only be cancelled by `cancelWhiteListRequest`.

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

The safety fixes are additive: errors are not silently swallowed by a missing handler, duplicate keys are stable, pending state is cleaned reliably, AbortController is supported and legal empty headers are preserved. Successful legacy calls keep their business-data return semantics. Chart, RichText, Editor and Preview Server are outside this package.
