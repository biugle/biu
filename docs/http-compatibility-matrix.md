# `@biugle/http` / ts-xhttp 兼容矩阵

`/Users/bexhe/WorkSpace/ts-xhttp/src/index.ts` 是唯一兼容基线。当前包保留原有公开实例方法、参数顺序和默认值，并额外提供 `requestRaw` 作为向后兼容的原始响应能力。

| 基线能力                    | Biu 入口                                                                                       | 参数/默认值                                                               | 回归覆盖                                |
| --------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------- |
| `request`                   | `XHttpClass.request`                                                                           | `(method, url, config = {}, isWhiteList = false)`                         | 类型返回、adaptor、取消、Hook、异常     |
| `requestRaw`                | `XHttpClass.requestRaw`                                                                        | `(method, url, config = {}, isWhiteList = false)`                         | 新增原始 response metadata              |
| `axiosRequest`              | `XHttpClass.axiosRequest`                                                                      | `(urlOrConfig, config = {})`                                              | 字符串和完整 config 两种重载            |
| `allInRequest`              | `XHttpClass.allInRequest`                                                                      | `(config = {})`                                                           | method/url/白名单                       |
| `get/post/put/patch/delete` | 同名方法                                                                                       | `(url, paramsOrData = {}, config = {}, isWhiteList = false)`              | 默认参数和返回值                        |
| `postForm`                  | `XHttpClass.postForm`                                                                          | `hasBrackets = false`, `hasIndex = false`                                 | 数组、对象、字段名、Content-Type        |
| `postFile`                  | `XHttpClass.postFile`                                                                          | `name = "file"`, `hasBrackets = false`, `hasIndex = false`                | 单/多文件字段命名                       |
| `upload`                    | `XHttpClass.upload`                                                                            | `postFile` 的兼容签名，新增便捷别名                                       | 复用 `postFile` golden tests            |
| 取消                        | `cancelRequest` / `cancelWhiteListRequest`                                                     | 默认取消文案                                                              | 普通、重复、白名单分组、AbortSignal     |
| Hook                        | `setRequestHeaders` / `requestHandler` / `responseHandler` / `errorHandler` / `requestFinally` | 按旧顺序执行；请求 Hook 可观察 `cancelToken`、`cancelRequest` 和 `signal` | 成功、请求 Hook 异常、响应异常、finally |
| 重试                        | `retryConfig`                                                                                  | `{ retry, delay }`；取消、`not-retry`、`custom-error` 不重试              | 网络错误重试与显式不重试                |
| 实例设置                    | `get/setBaseURL`、`get/setHeaders`、`get/setHeader`                                            | 保留链式返回                                                              | 空 header 值、Authorization、timeout    |
| 工具                        | `getCancelToken`、`isCancel`、`getInstance`、`create`                                          | 保留 Axios 兼容对象                                                       | 导出和实例方法面                        |

## 有意的向后兼容修复

- 调用方显式传入 `cancelToken` 时，重复请求管理器不替换它；项目可以继续使用 ts-xhttp 的 CancelToken 逃生通道。
- `setHeader(key, "")` 保留空字符串；只有省略 value/传入 `undefined` 才删除 header，避免合法的空 header 被误删。
- 默认错误仍 reject；只有 `rejectErrorPromise: false` 且 `errorHandler` 处理时才返回处理结果。这样保留可诊断异常，同时兼容原有显式吞错配置。

当前兼容测试覆盖 30 个方法/行为场景；其中包含 `postForm` 四种 bracket/index 组合和 `postFile` 重复/索引/方括号三种字段命名。每次改变上述行为必须同时更新本矩阵、兼容测试、迁移说明和 changeset。真实 Axios adapter/浏览器网络环境仍建议作为发布前的补充 golden 运行，不能把它误写成已完成证据。
