import { useMemo, useState } from "react";
import { Button, Result, Stack, Tag } from "@biugle/react-components";
import { CODE_MSG, HttpMethod, XHttpClass, XHttpMethod, XHttpUtils, stableSerialize } from "@biugle/http";
import {
  CapabilityApiTable,
  CapabilityActions,
  CapabilityCard,
  CapabilityGrid,
  CapabilityPage,
} from "../CapabilityPage/index.js";

const httpTypeRows = [
  {
    component: "XHttpOptions",
    name: "baseURL",
    type: "string | undefined",
    defaultValue: "undefined",
    options: "任意 Axios baseURL",
    description: "设置实例默认请求前缀；请求级 url 仍可使用绝对地址覆盖它。",
    demo: "new XHttpClass({ baseURL: '/api' })",
  },
  {
    component: "XHttpOptions",
    name: "retryConfig",
    type: "AxiosRetryConfig | undefined",
    defaultValue: "undefined（不启用重试）",
    options: "{ retry: number; delay: number }",
    description: "配置失败请求的最大重试次数和按次数递增的延迟毫秒数；取消及明确标记为不可重试的错误不会重试。",
    demo: "{ retry: 2, delay: 300 }",
  },
  {
    component: "XHttpOptions",
    name: "timeout",
    type: "number | undefined",
    defaultValue: "30000 ms",
    options: "非负有限毫秒数",
    description: "设置实例默认超时；请求级 timeout 或 setRequestTimeout 可覆盖它。",
    demo: "{ timeout: 10000 }",
  },
  {
    component: "XHttpOptions",
    name: "cancelDuplicatedRequest",
    type: "boolean | undefined",
    defaultValue: "true",
    options: "true | false",
    description: "按稳定请求 Key 取消前请求；FormData、Blob、ArrayBuffer 和其视图仅同一实例去重，不同上传实例可并发。",
    demo: "{ cancelDuplicatedRequest: true }",
  },
  {
    component: "XHttpOptions",
    name: "rejectErrorPromise",
    type: "boolean | undefined",
    defaultValue: "true",
    options: "true | false",
    description: "错误是否继续以 rejected Promise 传播；设为 false 时允许 errorHandler 返回兜底值。",
    demo: "{ rejectErrorPromise: false }",
  },
  {
    component: "XHttpOptions",
    name: "requestHandler",
    type: "HandlerFunction<RequestConfig> | undefined",
    defaultValue: "undefined",
    options: "(config: RequestConfig) => unknown",
    description:
      "发送前接收已准备好的请求配置；可读取 cancelRequest、cancelToken 和 signal，但应返回原配置或自定义处理值。",
    demo: "(config) => config",
  },
  {
    component: "XHttpOptions",
    name: "responseHandler",
    type: "HandlerFunction<AxiosResponse | HttpResponse> | undefined",
    defaultValue: "undefined",
    options: "(response) => unknown",
    description: "收到响应后、解包 response.data 前执行；不改变默认请求方法返回业务 data 的行为。",
    demo: "(response) => response.status",
  },
  {
    component: "XHttpOptions",
    name: "errorHandler",
    type: "ErrorHandlerFunction | undefined",
    defaultValue: "undefined",
    options: "(error, requestConfig) => T | void | Promise<T | void>",
    description: "接收归一化错误和最终请求配置；仅在 rejectErrorPromise 为 false 时，返回值才会作为请求兜底结果。",
    demo: "(error, config) => console.error(error)",
  },
  {
    component: "XHttpOptions",
    name: "requestFinally",
    type: "(requestConfig: RequestConfig) => void | undefined",
    defaultValue: "undefined",
    options: "接收最终 RequestConfig",
    description: "在成功、失败或请求 Hook 异常后执行一次，适合清理 loading 或请求上下文。",
    demo: "(config) => console.debug(config.url)",
  },
  {
    component: "XHttpOptions",
    name: "setRequestHeaders",
    type: "(config: RequestConfig) => RequestConfig",
    defaultValue: "undefined",
    options: "必须返回完整 RequestConfig",
    description: "在 requestHandler 前统一补充 Authorization、Trace 等请求头；必须保留并返回原配置对象。",
    demo: "(config) => ({ ...config, headers: { ...config.headers } })",
  },
  {
    component: "XHttpOptions",
    name: "formatResultAdaptor",
    type: "ResultFunction<unknown, unknown> | undefined",
    defaultValue: "undefined（返回 response.data）",
    options: "(data: unknown) => unknown",
    description: "将 response.data 转换为业务层需要的结果；请求级配置优先于实例级配置。",
    demo: "(data) => data.items",
  },
  {
    component: "RequestConfig",
    name: "AxiosRequestConfig",
    type: "AxiosRequestConfig & { ...XHttp 扩展字段 }",
    defaultValue: "{}",
    options: "Axios 的 url、method、params、data、headers、signal 等字段",
    description: "继承 Axios 请求配置；同时允许通过索引签名保留项目自定义字段。",
    demo: "{ params: { page: 1 }, signal }",
  },
  {
    component: "RequestConfig",
    name: "rejectErrorPromise",
    type: "boolean | undefined",
    defaultValue: "继承 XHttpOptions",
    options: "true | false",
    description: "覆盖当前请求的错误传播策略，优先级高于实例配置。",
    demo: "{ rejectErrorPromise: false }",
  },
  {
    component: "RequestConfig",
    name: "isWhiteList",
    type: "boolean | undefined",
    defaultValue: "false",
    options: "true | false",
    description: "将请求放入白名单请求组；白名单请求互不因重复 Key 取消，并由 cancelWhiteListRequest 管理。",
    demo: "{ isWhiteList: true }",
  },
  {
    component: "RequestConfig",
    name: "formatResultAdaptor",
    type: "ResultFunction<unknown, unknown> | undefined",
    defaultValue: "继承 XHttpOptions",
    options: "(data: unknown) => unknown",
    description: "仅覆盖当前请求的响应 data 适配器。",
    demo: "{ formatResultAdaptor: (data) => data.items }",
  },
  {
    component: "RequestConfig",
    name: "cancelRequest",
    type: "(message?: string) => void | undefined",
    defaultValue: "由客户端注入",
    options: "可选取消消息",
    description: "由客户端在发送前注入到配置中；请求 Hook 或业务逻辑可用它取消当前请求。",
    demo: "config.cancelRequest?.('页面离开')",
  },
  {
    component: "RequestConfig",
    name: "[key: string]",
    type: "unknown",
    defaultValue: "undefined",
    options: "任意项目自定义字段",
    description: "保留 ts-xhttp 兼容扩展位，不改变 Axios 和 XHttp 内置字段的类型语义。",
    demo: "{ traceId: 'demo' }",
  },
  {
    component: "Header",
    name: "Origin",
    type: "string | undefined",
    defaultValue: "undefined",
    options: "任意请求来源",
    description: "设置请求来源 Header；Header 同时允许任意自定义键。",
    demo: "{ Origin: 'https://app.example' }",
  },
  {
    component: "Header",
    name: "Referer",
    type: "string | undefined",
    defaultValue: "undefined",
    options: "任意来源页面地址",
    description: "设置来源页面地址 Header。",
    demo: "{ Referer: '/users' }",
  },
  {
    component: "Header",
    name: "Connection",
    type: "string | undefined",
    defaultValue: "undefined",
    options: "任意连接控制值",
    description: "设置连接控制 Header。",
    demo: "{ Connection: 'keep-alive' }",
  },
  {
    component: "Header",
    name: "Cookie",
    type: "string | object | undefined",
    defaultValue: "undefined",
    options: "Cookie 字符串或兼容对象",
    description: "保存 Cookie 请求头值；仅在调用方明确提供时使用。",
    demo: "{ Cookie: 'session=demo' }",
  },
  {
    component: "Header",
    name: "User-Agent",
    type: "string | undefined",
    defaultValue: "undefined",
    options: "任意字符串；undefined 删除，空字符串保留",
    description: "设置客户端标识 Header。",
    demo: "{ 'User-Agent': 'biu-demo' }",
  },
  {
    component: "Header",
    name: "Content-Type",
    type: "string | undefined",
    defaultValue: "undefined",
    options: "任意媒体类型；undefined 删除，空字符串保留",
    description: "设置请求体媒体类型 Header。",
    demo: "{ 'Content-Type': 'application/json' }",
  },
  {
    component: "Header",
    name: "Authorization",
    type: "string | undefined",
    defaultValue: "undefined",
    options: "任意认证值；undefined 删除，空字符串保留",
    description: "设置认证凭证 Header。",
    demo: "{ Authorization: 'Bearer token' }",
  },
  {
    component: "Header",
    name: "[key: string]",
    type: "unknown",
    defaultValue: "undefined",
    options: "任意业务 Header 名称",
    description: "允许在内置字段之外扩展业务请求头。",
    demo: "{ 'X-Trace': 'demo' }",
  },
  {
    component: "HttpResponse<T>",
    name: "data",
    type: "T",
    defaultValue: "由服务端响应决定",
    options: "调用方传入泛型 T",
    description: "完整原始响应中的业务数据；普通请求方法默认直接返回这个字段。",
    demo: "requestRaw<User>() -> response.data",
  },
  {
    component: "HttpResponse<T>",
    name: "status",
    type: "number",
    defaultValue: "由 Axios 响应决定",
    options: "HTTP 状态码",
    description: "原始 HTTP 响应状态码。",
    demo: "response.status === 200",
  },
  {
    component: "HttpResponse<T>",
    name: "statusText",
    type: "string",
    defaultValue: "由 Axios 响应决定",
    options: "HTTP 状态文本",
    description: "原始 HTTP 响应状态文本。",
    demo: "response.statusText === 'OK'",
  },
  {
    component: "HttpResponse<T>",
    name: "headers",
    type: "Header",
    defaultValue: "由 Axios 响应决定",
    options: "Header 对象",
    description: "原始响应头，按公开 Header 类型暴露。",
    demo: "response.headers",
  },
  {
    component: "HttpResponse<T>",
    name: "config",
    type: "RequestConfig",
    defaultValue: "最终请求配置",
    options: "包含 Axios 与 XHttp 扩展字段",
    description: "发送本次请求时的最终配置，便于审计 URL、参数、取消和适配策略。",
    demo: "response.config.url",
  },
  {
    component: "HttpResponse<T>",
    name: "request",
    type: "unknown | undefined",
    defaultValue: "由 Axios 适配器决定",
    options: "可能为空",
    description: "底层传输请求对象；不同运行时和 Axios adapter 的具体类型可能不同。",
    demo: "response.request",
  },
  {
    component: "AxiosRetryConfig",
    name: "retry",
    type: "number",
    defaultValue: "0（未配置时不重试）",
    options: "非负整数",
    description: "一次请求允许的最大自动重试次数。",
    demo: "{ retry: 2, delay: 300 }",
  },
  {
    component: "AxiosRetryConfig",
    name: "delay",
    type: "number",
    defaultValue: "0",
    options: "非负毫秒数",
    description: "重试延迟基数；第 n 次重试使用 n * delay 毫秒。",
    demo: "delay: 300",
  },
  {
    component: "HandlerFunction<T>",
    name: "call signature",
    type: "(data: T) => unknown",
    defaultValue: "undefined",
    options: "T 由 Hook 位置决定",
    description: "请求和响应生命周期的通用回调签名；回调可观察数据，不强制改变原始请求/响应。",
    demo: "(config) => config",
  },
  {
    component: "ErrorHandlerFunction<T>",
    name: "call signature",
    type: "(error: unknown, requestConfig: RequestConfig) => T | void | Promise<T | void>",
    defaultValue: "undefined",
    options: "同步或异步兜底值",
    description: "错误回调同时获得错误和最终请求配置，支持同步或异步返回业务兜底结果。",
    demo: "async (error, config) => ({ retry: true })",
  },
  {
    component: "ResultFunction<T, R>",
    name: "call signature",
    type: "(data: T) => R",
    defaultValue: "undefined",
    options: "由调用方决定 T 与 R",
    description: "把 response.data 从输入类型 T 转换为业务结果 R。",
    demo: "(data: UserList) => data.items",
  },
  {
    component: "XHttpMethod",
    name: "method values",
    type: '"GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS"',
    defaultValue: "GET（请求未传 method 时）",
    options: "大写常量和 get/post/... 小写别名均可用",
    description: "HTTP 方法常量对象及其联合类型；小写属性映射到相同的大写值。",
    demo: "XHttpMethod.GET / HttpMethod.get",
  },
] as const;

export default function HttpShowcase() {
  const client = useMemo(
    () =>
      new XHttpClass(
        { cancelDuplicatedRequest: true },
        {
          adapter: async (config) => ({
            data: {
              method: config.method,
              url: config.url,
              params: config.params,
              body: config.data instanceof FormData ? "FormData" : config.data,
            },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
            request: {},
          }),
        },
      ),
    [],
  );
  const [result, setResult] = useState("尚未运行方法");
  const [rawStatus, setRawStatus] = useState<number>();
  const key = stableSerialize({ method: "GET", url: "/demo", params: { b: 2, a: 1 } });
  const run = async (label: string, action: () => Promise<unknown>) => {
    try {
      const value = await action();
      setResult(`${label}: ${typeof value === "string" ? value : JSON.stringify(value)}`);
    } catch (error) {
      setResult(`${label}: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  return (
    <CapabilityPage
      title="HTTP 能力展示"
      description="@biugle/http 以 ts-xhttp 为兼容基线，逐方法保留参数顺序、默认值、Hook、返回值和上传/取消行为，并通过 raw、AbortSignal、稳定序列化做安全增强。"
    >
      <CapabilityGrid>
        <CapabilityCard
          title="核心请求方法"
          description="所有成功请求默认返回 response.data；requestRaw 才保留完整响应元数据。"
        >
          <ul className="biu-capability-list">
            <li>request / requestRaw：method、url、config、isWhiteList</li>
            <li>axiosRequest：支持 url + config 或完整 RequestConfig</li>
            <li>allInRequest：兼容旧项目的单 config 入口</li>
            <li>get / post / put / patch / delete：保持旧参数顺序</li>
          </ul>
          <CapabilityActions>
            <Button type="primary" size="small" onClick={() => void run("get", () => client.get("/demo", { page: 1 }))}>
              get
            </Button>
            <Button
              type="secondary"
              size="small"
              onClick={() => void run("post", () => client.post("/demo", { source: "showcase" }))}
            >
              post
            </Button>
            <Button type="secondary" size="small" onClick={() => void run("put", () => client.put("/demo", { id: 1 }))}>
              put
            </Button>
            <Button
              type="secondary"
              size="small"
              onClick={() => void run("patch", () => client.patch("/demo", { enabled: true }))}
            >
              patch
            </Button>
            <Button
              type="secondary"
              size="small"
              onClick={() => void run("delete", () => client.delete("/demo", { id: 1 }))}
            >
              delete
            </Button>
          </CapabilityActions>
        </CapabilityCard>

        <CapabilityCard
          title="兼容别名、上传和原始响应"
          description="这些是迁移 ts-xhttp 时最常用的入口，参数和默认值保持兼容。"
        >
          <CapabilityActions>
            <Button
              type="primary"
              size="small"
              onClick={() => void run("axiosRequest", () => client.axiosRequest("/demo", { method: HttpMethod.GET }))}
            >
              axiosRequest
            </Button>
            <Button
              type="secondary"
              size="small"
              onClick={() =>
                void run("allInRequest", () => client.allInRequest({ url: "/demo", method: XHttpMethod.GET }))
              }
            >
              allInRequest
            </Button>
            <Button
              type="secondary"
              size="small"
              onClick={async () => {
                const response = await client.requestRaw<{ method: string }>("POST", "/demo", {
                  data: { source: "raw" },
                });
                setRawStatus(response.status);
                setResult(`requestRaw: ${response.status} ${response.data.method}`);
              }}
            >
              requestRaw
            </Button>
            <Button
              type="secondary"
              size="small"
              onClick={() =>
                void run("postForm", () =>
                  client.postForm("/upload", { tags: ["ui", "pro"], meta: { source: "demo" } }, true, true),
                )
              }
            >
              postForm
            </Button>
            <Button
              type="secondary"
              size="small"
              onClick={() => {
                const file = new File(["demo"], "demo.txt", { type: "text/plain" });
                void run("postFile", () => client.postFile("/upload", file));
              }}
            >
              postFile
            </Button>
          </CapabilityActions>
          <p>最近 raw status：{rawStatus ?? "—"}</p>
        </CapabilityCard>

        <CapabilityCard
          title="Hooks / 取消 / 默认配置"
          description="requestHandler、responseHandler、errorHandler、requestFinally、setRequestHeaders、formatResultAdaptor 和 retry 都是 framework-neutral。"
        >
          <ul className="biu-capability-list">
            <li>重复普通请求按 method/url/params/data 稳定 key 自动取消，白名单请求独立分组。</li>
            <li>cancelRequest / cancelWhiteListRequest 取消对应请求组；请求接收 AbortSignal。</li>
            <li>setBaseURL、setHeaders、setHeader、setAuthToken、setRequestTimeout 都可链式调用。</li>
            <li>
              XHttpUtils.typeof：{XHttpUtils.typeof({ demo: true })}；XHttpMethod.GET：{XHttpMethod.GET}
            </li>
          </ul>
          <Stack align={"center"} gap={8} wrap="wrap">
            <Tag color="success">client ready</Tag>
            <Tag color="info">timeout: {client.timeout}ms</Tag>
            <Tag color="warning">CODE_MSG[404]：{CODE_MSG[404]}</Tag>
          </Stack>
          <pre className="biu-capability-code">request key: {key}</pre>
          <CapabilityActions>
            <Button type="default" variant="outlined" size="small" onClick={() => client.cancelRequest("demo")}>
              取消普通请求
            </Button>
            <Button
              type="default"
              variant="outlined"
              size="small"
              onClick={() => client.cancelWhiteListRequest("demo")}
            >
              取消白名单请求
            </Button>
          </CapabilityActions>
        </CapabilityCard>
        <CapabilityCard title="最近运行结果">
          <Result status="info" title={result} />
        </CapabilityCard>
      </CapabilityGrid>
      <CapabilityCard
        title="HTTP 属性与方法"
        description="迁移自 ts-xhttp 的公开入口和兼容别名集中列在这里；优化只增加向后兼容能力。"
      >
        <CapabilityApiTable
          rows={[
            ...httpTypeRows,
            {
              component: "XHttpClass",
              name: "constructor / config",
              type: "(options?, axiosConfig?)",
              defaultValue: "Axios，timeout=30000",
              description:
                "创建独立 Axios 客户端；options 配置生命周期、重试、超时和重复请求，axiosConfig 覆盖 Axios 默认配置。",
              demo: "client ready",
            },
            {
              component: "XHttpClass",
              name: "request / requestRaw",
              type: "(method, url, config?, isWhiteList?) => Promise",
              defaultValue: "data / raw response",
              description: "request 返回 data；requestRaw 保留 status、headers 和 config。",
              demo: "requestRaw",
            },
            {
              component: "XHttpClass",
              name: "get / post / put / patch / delete",
              type: "(url, paramsOrData?, config?) => Promise",
              defaultValue: "-",
              description: "保持 ts-xhttp 方法名、参数顺序和默认返回行为。",
              demo: "核心请求方法",
            },
            {
              component: "XHttpClass",
              name: "axiosRequest / allInRequest",
              type: "(url?, config?) / (config) => Promise",
              defaultValue: "-",
              description: "兼容旧项目的两个请求入口，支持完整 RequestConfig。",
              demo: "兼容别名",
            },
            {
              component: "XHttpClass",
              name: "postForm / postFile",
              type: "postForm(url, data, hasBrackets?, hasIndex?, config?, isWhiteList?) / postFile(url, files, name?, hasBrackets?, hasIndex?, config?, isWhiteList?)",
              defaultValue: "-",
              description: "保留 FormData、数组/对象序列化、单文件或多文件字段命名、Header 覆盖和白名单参数。",
              demo: "上传方法",
            },
            {
              component: "XHttpClass",
              name: "cancelRequest / cancelWhiteListRequest",
              type: "(key?) => void",
              defaultValue: "-",
              description: "按稳定请求 key 取消普通请求或白名单请求。",
              demo: "取消按钮",
            },
            {
              component: "XHttpClass",
              name: "setBaseURL / setHeaders / setAuthToken",
              type: "chainable setters",
              defaultValue: "-",
              description: "运行时调整客户端默认配置，不绑定 React 或 Runtime。",
              demo: "默认配置",
            },
            {
              component: "XHttpUtils",
              name: "stableSerialize / typeof",
              type: "(value) => string / string",
              defaultValue: "-",
              description: "稳定序列化请求 key 并提供兼容的类型判断工具。",
              demo: "request key",
            },
          ]}
        />
      </CapabilityCard>
    </CapabilityPage>
  );
}
