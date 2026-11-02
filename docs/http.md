# `@biugle/http` 使用说明

`@biugle/http` 是框架无关的 Axios 传输包，以 `ts-xhttp` 的公开契约和实际运行行为为兼容基线。React、Vue、原生 HTML 和 iframe APP 都可以独立使用；它不依赖 Runtime、Preset、Router、Store、UI、认证策略或 Mock。

逐方法兼容矩阵见 [http-compatibility-matrix.md](./http-compatibility-matrix.md)。

## 安装与基本使用

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

默认导出和命名导出 `XHttp`/`http` 指向同一个默认实例。`new XHttpClass(options?, axiosConfig?)` 和 `create(options?, axiosConfig?)` 创建隔离实例。

## 公共类型逐项说明

以下类型示例与上方的 `api` 实例配合使用；按需导入类型：

```ts
import type { ErrorHandlerFunction, HandlerFunction, Header, RequestConfig, ResultFunction } from "@biugle/http";
```

以下类型是 `@biugle/http` 的公开契约，Demo 的 HTTP API 表也按同样粒度逐行展示。`XHttpOptions` 是实例级配置，`RequestConfig` 在继承 Axios `AxiosRequestConfig` 的基础上增加 XHttp 字段。

| 类型                      | 属性 / 签名               | 完整类型                                                                     | 默认值                 | 可选值 / 参数                                             | 功能说明                                              | 案例                                                                                                                    |
| ------------------------- | ------------------------- | ---------------------------------------------------------------------------- | ---------------------- | --------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `XHttpOptions`            | `baseURL`                 | `string \| undefined`                                                        | `undefined`            | 任意 Axios baseURL                                        | 设置实例默认请求前缀。                                | `new XHttpClass({ baseURL: "/api" })`                                                                                   |
| `XHttpOptions`            | `retryConfig`             | `AxiosRetryConfig \| undefined`                                              | `undefined`            | `{ retry: number; delay: number }`                        | 开启自动重试并配置次数与延迟。                        | `new XHttpClass({ retryConfig: { retry: 2, delay: 300 } })`                                                             |
| `XHttpOptions`            | `timeout`                 | `number \| undefined`                                                        | `30000`                | 非负有限毫秒数                                            | 设置实例默认超时。                                    | `new XHttpClass({ timeout: 10_000 })`                                                                                   |
| `XHttpOptions`            | `cancelDuplicatedRequest` | `boolean \| undefined`                                                       | `true`                 | `true \| false`                                           | 是否按稳定请求 Key 取消重复普通请求。                 | `new XHttpClass({ cancelDuplicatedRequest: false })`                                                                    |
| `XHttpOptions`            | `rejectErrorPromise`      | `boolean \| undefined`                                                       | `true`                 | `true \| false`                                           | 是否继续 reject 错误；关闭后允许 Handler 返回兜底值。 | `new XHttpClass({ rejectErrorPromise: false, errorHandler: () => [] })`                                                 |
| `XHttpOptions`            | `requestHandler`          | `HandlerFunction<RequestConfig> \| undefined`                                | `undefined`            | `(config: RequestConfig) => unknown`                      | 请求发送前执行的生命周期回调。                        | `new XHttpClass({ requestHandler: (config) => console.info(config.url) })`                                              |
| `XHttpOptions`            | `responseHandler`         | `HandlerFunction<AxiosResponse \| HttpResponse> \| undefined`                | `undefined`            | `(response) => unknown`                                   | 解包 `response.data` 前观察完整响应。                 | `new XHttpClass({ responseHandler: (response) => console.info(response.status) })`                                      |
| `XHttpOptions`            | `errorHandler`            | `ErrorHandlerFunction \| undefined`                                          | `undefined`            | `(error, config) => T \| void \| Promise<T \| void>`      | 接收归一化错误和最终配置。                            | `new XHttpClass({ errorHandler: (error, config) => console.error(config.url, error) })`                                 |
| `XHttpOptions`            | `requestFinally`          | `((requestConfig: RequestConfig) => void) \| undefined`                      | `undefined`            | 成功失败都会执行                                          | 清理 loading 或请求上下文。                           | `new XHttpClass({ requestFinally: (config) => console.info(config.url) })`                                              |
| `XHttpOptions`            | `setRequestHeaders`       | `((config: RequestConfig) => RequestConfig) \| undefined`                    | `undefined`            | 必须返回完整配置                                          | 统一补充认证、Trace 等 Header。                       | `new XHttpClass({ setRequestHeaders: (config) => ({ ...config, headers: { ...config.headers, "X-Trace": "demo" } }) })` |
| `XHttpOptions`            | `formatResultAdaptor`     | `ResultFunction<unknown, unknown> \| undefined`                              | `undefined`            | `(data: unknown) => unknown`                              | 将 `response.data` 转换成业务结果。                   | `new XHttpClass({ formatResultAdaptor: (data) => ({ result: data }) })`                                                 |
| `RequestConfig`           | Axios 配置字段            | `AxiosRequestConfig`                                                         | `{}`                   | `url`、`method`、`params`、`data`、`headers`、`signal` 等 | 保留全部 Axios 请求能力。                             | `api.axiosRequest({ url: "/users", method: "GET", params: { page: 1 } })`                                               |
| `RequestConfig`           | `rejectErrorPromise`      | `boolean \| undefined`                                                       | 继承实例配置           | `true \| false`                                           | 覆盖单个请求的错误传播策略。                          | `api.get("/users", {}, { rejectErrorPromise: false })`                                                                  |
| `RequestConfig`           | `isWhiteList`             | `boolean \| undefined`                                                       | `false`                | `true \| false`                                           | 将请求放入独立白名单取消组。                          | `api.axiosRequest({ url: "/users", isWhiteList: true })`                                                                |
| `RequestConfig`           | `formatResultAdaptor`     | `ResultFunction<unknown, unknown> \| undefined`                              | 继承实例配置           | `(data) => result`                                        | 覆盖单个请求的数据适配器。                            | `api.get("/users", {}, { formatResultAdaptor: (data) => ({ result: data }) })`                                          |
| `RequestConfig`           | `cancelRequest`           | `((message?: string) => void) \| undefined`                                  | 客户端注入             | 可选取消消息                                              | 在 Hook 中取消当前请求。                              | `new XHttpClass({ requestHandler: (config) => config.cancelRequest?.("cancelled") })`                                   |
| `RequestConfig`           | `[key: string]`           | `unknown`                                                                    | `undefined`            | 任意业务扩展字段                                          | 保留 ts-xhttp 的项目自定义字段兼容位。                | `api.get("/users", {}, { traceId: "demo-trace" })`                                                                      |
| `AxiosRetryConfig`        | `retry`                   | `number`                                                                     | `0`                    | 非负整数                                                  | 最大自动重试次数。                                    | `new XHttpClass({ retryConfig: { retry: 2, delay: 300 } })`                                                             |
| `AxiosRetryConfig`        | `delay`                   | `number`                                                                     | `0`                    | 非负毫秒数                                                | 第 n 次重试等待 `n * delay` 毫秒。                    | `new XHttpClass({ retryConfig: { retry: 2, delay: 500 } })`                                                             |
| `HandlerFunction<T>`      | 调用签名                  | `(data: T) => unknown`                                                       | `undefined`            | `T` 由 Hook 位置决定                                      | 通用请求/响应生命周期回调。                           | `const handler: HandlerFunction<RequestConfig> = (config) => console.info(config.url);`                                 |
| `ErrorHandlerFunction<T>` | 调用签名                  | `(error: unknown, config: RequestConfig) => T \| void \| Promise<T \| void>` | `undefined`            | 同步或异步兜底值                                          | 错误回调可读取最终请求配置。                          | `const handler: ErrorHandlerFunction<string> = async (_error, config) => config.url ?? "fallback";`                     |
| `ResultFunction<T, R>`    | 调用签名                  | `(data: T) => R`                                                             | `undefined`            | 调用方决定 `T`、`R`                                       | 将响应数据从 `T` 转换为 `R`。                         | `const adapt: ResultFunction<{ items: string[] }, string[]> = (data) => data.items;`                                    |
| `XHttpMethod`             | 方法值                    | `"GET" \| "POST" \| "PUT" \| "DELETE" \| "PATCH" \| "OPTIONS"`               | 未传 method 时为 `GET` | 大写常量及小写别名                                        | 统一的 HTTP 方法常量和联合类型。                      | `api.request(XHttpMethod.GET, "/users")`                                                                                |

### Header

以下 Header 示例用于验证公开 TypeScript 类型。浏览器禁止或管理的请求头不会因类型允许而变得可写；Node 等环境仍须遵守服务端规则。

| 类型     | 属性            | 完整类型                        | 默认值      | 可选值 / 参数                  | 功能说明                                                        | 案例                                                           |
| -------- | --------------- | ------------------------------- | ----------- | ------------------------------ | --------------------------------------------------------------- | -------------------------------------------------------------- |
| `Header` | `Origin`        | `string \| undefined`           | `undefined` | HTTP(S) Origin                 | Origin 类型字段；浏览器请求的 Origin 由浏览器控制。             | `({ "Origin": "https://example.com" } satisfies Header)`       |
| `Header` | `Referer`       | `string \| undefined`           | `undefined` | URL                            | Referer 类型字段；浏览器按 referrer policy 管理。               | `({ "Referer": "https://example.com/page" } satisfies Header)` |
| `Header` | `Cookie`        | `string \| object \| undefined` | `undefined` | string, object                 | 兼容 Cookie 类型；浏览器管理 Cookie，不允许脚本直接设置请求头。 | `({ "Cookie": "demo=1" } satisfies Header)`                    |
| `Header` | `Connection`    | `string \| undefined`           | `undefined` | HTTP connection value          | 连接字段类型；浏览器管理真实连接请求头。                        | `({ "Connection": "keep-alive" } satisfies Header)`            |
| `Header` | `User-Agent`    | `string \| undefined`           | `undefined` | User agent string              | User-Agent 类型字段；实际请求是否允许覆盖由运行环境决定。       | `({ "User-Agent": "ExampleClient/1.0" } satisfies Header)`     |
| `Header` | `Content-Type`  | `string \| undefined`           | `undefined` | MIME type                      | 内容 MIME 类型；上传时保持正确的 multipart 边界。               | `({ "Content-Type": "application/json" } satisfies Header)`    |
| `Header` | `Authorization` | `string \| undefined`           | `undefined` | Authorization scheme and value | 认证 Header 类型；真实凭证由项目安全获取，不写入源码。          | `({ "Authorization": "Bearer <token>" } satisfies Header)`     |
| `Header` | `[key: string]` | `unknown`                       | `undefined` | 自定义 Header 名               | 保留扩展 Header 类型；实际发送遵守运行环境和 HTTP 规则。        | `({ "X-Trace": "demo" } satisfies Header)`                     |

### HttpResponse

| 类型              | 属性         | 完整类型        | 默认值 | 可选值 / 参数        | 功能说明                                                | 案例                                                                           |
| ----------------- | ------------ | --------------- | ------ | -------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `HttpResponse<T>` | `data`       | `T`             | 响应值 | 响应业务数据         | 完整响应中的业务数据，类型由泛型 T 决定。               | `const raw = await api.requestRaw(XHttpMethod.GET, "/users"); raw.data;`       |
| `HttpResponse<T>` | `status`     | `number`        | 响应值 | HTTP status          | HTTP 响应状态码；默认 validateStatus 不自动拒绝非 2xx。 | `const raw = await api.requestRaw(XHttpMethod.GET, "/users"); raw.status;`     |
| `HttpResponse<T>` | `statusText` | `string`        | 响应值 | HTTP status text     | 传输层返回的状态文本，可为空。                          | `const raw = await api.requestRaw(XHttpMethod.GET, "/users"); raw.statusText;` |
| `HttpResponse<T>` | `headers`    | `Header`        | 响应值 | Header               | 响应 Header；不是客户端默认请求 Header。                | `const raw = await api.requestRaw(XHttpMethod.GET, "/users"); raw.headers;`    |
| `HttpResponse<T>` | `config`     | `RequestConfig` | 响应值 | RequestConfig        | 本次请求的最终配置，用于跟踪或诊断；不要记录凭证。      | `const raw = await api.requestRaw(XHttpMethod.GET, "/users"); raw.config;`     |
| `HttpResponse<T>` | `request`    | `unknown`       | 响应值 | 运行环境相关请求对象 | 可选底层请求对象，须按运行环境检查后使用。              | `const raw = await api.requestRaw(XHttpMethod.GET, "/users"); raw.request;`    |

`Response<T>` 是 `HttpResponse<T>` 的别名。空字符串 Header 会保留，传 `undefined` 才会删除。

## API、参数顺序和返回值

下面的旧 API 名称、参数顺序、默认值和白名单位置都保留。成功时默认返回业务 `response.data`，不是完整 Axios response：

```ts
request(method, url, config?, isWhiteList?)
axiosRequest(urlOrConfig, config?)
allInRequest(config?) // deprecated，保留兼容
get(url, params = {}, config?, isWhiteList = false)
post(url, data = {}, config?, isWhiteList = false)
put(url, data = {}, config?, isWhiteList = false)
patch(url, data = {}, config?, isWhiteList = false)
delete(url, data = {}, config?, isWhiteList = false)
postForm(url, data = {}, hasBrackets = false, hasIndex = false, config?, isWhiteList = false)
postFile(url, files, name = "file", hasBrackets = false, hasIndex = false, config?, isWhiteList = false)
```

`requestRaw(method, url, config?, isWhiteList?)` 是新增的显式原始响应 API，返回 `data`、`status`、`statusText`、`headers`、`config` 和 `request`，不会改变以上旧方法。

上传字段名的兼容矩阵也已覆盖：`postForm` 的 `(hasBrackets, hasIndex)` 为
`(false, false)`/`(false, true)` 时重复使用原字段名，`(true, false)` 使用
`field[0]`，`(true, true)` 使用 `field[]`；`postFile` 对文件数组遵循同样规则。

## Hook、错误和重试

调用顺序为 `setRequestHeaders` → `requestHandler` → Axios → `responseHandler` 或 `errorHandler` → `requestFinally`。`formatResultAdaptor` 接收 `response.data`，请求级配置优先于实例级配置。

- `setRequestHeaders(config)` 必须返回配置对象，可统一写入 Token、Trace 等 Header。
- `requestHandler(config)` 在发送前执行；为保持 ts-xhttp 迁移兼容，Hook 配置同时提供 `config.cancelToken`、`config.cancelRequest` 和现代 `config.signal`。
- `responseHandler(response)` 接收完整 Axios response；普通方法随后只返回 `response.data`。
- `errorHandler(error, requestConfig)` 接收标准化错误。默认仍 reject；只有实例或请求配置显式设置 `rejectErrorPromise: false` 时，才使用 Handler 返回值作为兜底结果。
- `requestFinally(requestConfig)` 无论成功失败都会执行。
- `retryConfig: { retry, delay }` 使用 `axios-retry`；取消、`not-retry` 和 `custom-error` 不重试。

默认 `validateStatus` 接受所有 HTTP 状态，和旧版一致；需要标准 2xx 语义时在第二个 `axiosConfig` 中自行覆盖。

## 重复请求、白名单和默认配置

普通请求默认按稳定的 `method/url/params/data` Key 取消前一个同请求；对象属性顺序不会造成误判。body 为 `FormData`、`Blob`、`ArrayBuffer` 或其视图（包括 `DataView` 和 TypedArray）时，内部 Key 以该 client 内的对象 identity 区分上传：不同对象可以并发，相同对象且其余 signature 相同仍替换前请求。公开 `stableSerialize` 输出保持兼容，内部 Key 不读取文件内容、不遍历二进制字节或生成持久身份。`isWhiteList=true` 的请求互不取消，只能通过 `cancelWhiteListRequest` 取消。

```ts
api.cancelRequest("路由离开");
api.cancelWhiteListRequest("退出登录");
api.setBaseURL("/v2").setRequestTimeout(15_000);
api.setHeader("X-Trace", "demo");
api.setAuthToken("Bearer token");
api.getCancelToken();
api.isCancel(error);
```

`setRequestTimeout` 对负数和非有限值抛出错误。空字符串是合法 Header 值；传 `undefined` 才会删除 Header。请求配置中的 `AbortSignal` 会和客户端取消信号合并。

## `postForm` 与 `postFile`

`postForm` 的数组字段和对象序列化必须保持旧行为：

```ts
await http.postForm("/search", { tags: ["ui", "pro"], filter: { active: true } });
// tags、tags；filter = '{"active":true}'
await http.postForm("/search", { tags: ["ui", "pro"] }, true, false);
// tags[0]、tags[1]
await http.postForm("/search", { tags: ["ui", "pro"] }, true, true);
// tags[]、tags[]
```

兼容基线的默认 Header 是精确的 `application/x-www-form-urlencoded;charset=UTF-8;`，不能静默改成其它值。`postFile` 支持单文件和文件数组，默认字段名 `file`、默认 Header `multipart/form-data`；数组加 `hasBrackets` 后使用 `file[0]` 等，再加 `hasIndex` 使用 `file[]`。`config.headers` 可以显式覆盖默认 Header。

## 导出和迁移

保留 `XHttpClass`、`XHttpMethod`、`XHttpUtils`、`RequestConfig`、`XHttpOptions`、`Response`、`Header`、`AxiosRetryConfig`、`HandlerFunction`、`ErrorHandlerFunction`、`ResultFunction`、`Axios`、`CODE_MSG`、`HttpClient`、`http` 和默认 `XHttp`。`allInRequest` 仅为兼容保留，不建议新代码使用。

```diff
- import XHttp from "js-xhttp";
+ import XHttp from "@biugle/http";
```

兼容修复包括：错误不会因缺少 Handler 被静默吞掉、重排对象键和循环数组的重复请求 Key 稳定、二进制上传按 client 内对象 identity 区分、pending 状态可靠清理、外部与内部取消信号合并、合法空 Header 不会被误删。旧项目成功调用的业务数据返回语义保持不变。Chart、RichText、Editor、Preview Server 不属于本包范围。
