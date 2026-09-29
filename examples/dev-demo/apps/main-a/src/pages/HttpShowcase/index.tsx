import { useMemo, useState } from "react";
import { Button, Result, Tag } from "@biugle/react-components";
import { CODE_MSG, HttpMethod, XHttpClass, XHttpMethod, XHttpUtils, stableSerialize } from "@biugle/http";
import {
  CapabilityApiTable,
  CapabilityActions,
  CapabilityCard,
  CapabilityGrid,
  CapabilityPage,
} from "../CapabilityPage/index.js";

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
      className="biu-service-showcase-page"
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
          <div className="biu-capability-actions">
            <Tag color="success">client ready</Tag>
            <Tag color="info">timeout: {client.timeout}ms</Tag>
            <Tag color="warning">CODE_MSG[404]：{CODE_MSG[404]}</Tag>
          </div>
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
