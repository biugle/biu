import { useMemo, useState } from "react";
import {
  BiuQueryClientProvider,
  createBiuQueryKeys,
  createBiuReactQueryClient,
  normalizeBiuListResponse,
  shouldRetryBiuQuery,
  isAbortError,
  useBiuMutationRequest,
  useBiuQuery,
  useBiuRequest,
  useQueryClient,
} from "@biugle/tanstack-query/react";
import { Button, Loading, Pagination, Result, Tag } from "@biugle/react-components";
import { Table, type Column } from "@biugle/react-table/ui";
import "@biugle/react-table/styles.css";
import {
  CapabilityApiTable,
  CapabilityActions,
  CapabilityCard,
  CapabilityGrid,
  CapabilityPage,
} from "../CapabilityPage/index.js";

function QueryPanel() {
  const queryKeys = useMemo(() => createBiuQueryKeys("showcase"), []);
  const queryClient = useQueryClient();
  const [mutationResult, setMutationResult] = useState<string>();
  const [lastInvalidation, setLastInvalidation] = useState("尚未执行 invalidateQueries");
  const [listPage, setListPage] = useState(1);
  const [listMessage, setListMessage] = useState("分页查询尚未取消");
  const query = useBiuRequest({
    queryKey: ["demo", "query-summary"],
    staleTime: 10_000,
    request: async ({ signal }) => {
      await new Promise<void>((resolve, reject) => {
        const timer = window.setTimeout(resolve, 220);
        signal.addEventListener(
          "abort",
          () => {
            window.clearTimeout(timer);
            reject(new DOMException("Aborted", "AbortError"));
          },
          { once: true },
        );
      });
      return { users: 24, ready: true, source: "local adapter" };
    },
  });
  const mutation = useBiuMutationRequest({
    request: async (value: string, { signal }) => {
      await new Promise<void>((resolve, reject) => {
        const timer = window.setTimeout(resolve, 800);
        signal.addEventListener(
          "abort",
          () => {
            window.clearTimeout(timer);
            reject(new DOMException("Aborted", "AbortError"));
          },
          { once: true },
        );
      });
      return `已提交：${value}`;
    },
    onSuccess: (value) => setMutationResult(value),
  });
  const directQuery = useBiuQuery({
    queryKey: queryKeys.detail("demo"),
    queryFn: async () => ({ ready: true, value: 1 }),
    staleTime: 20_000,
  });
  const listQuery = useBiuRequest({
    queryKey: queryKeys.list({ page: listPage, pageSize: 5 }),
    request: async ({ signal }) => {
      await new Promise<void>((resolve, reject) => {
        const timer = window.setTimeout(resolve, 180);
        signal.addEventListener(
          "abort",
          () => {
            window.clearTimeout(timer);
            reject(new DOMException("Aborted", "AbortError"));
          },
          { once: true },
        );
      });
      const records = Array.from({ length: 12 }, (_, index) => ({
        id: index + 1,
        name: `业务记录 ${index + 1}`,
        status: index % 3 === 0 ? "审核中" : "已完成",
      }));
      return { records: records.slice((listPage - 1) * 5, listPage * 5), totalResult: records.length };
    },
  });
  const listResult = normalizeBiuListResponse<{ id: number; name: string; status: string }>(listQuery.data);
  const listColumns: Column<(typeof listResult.items)[number]>[] = [
    { key: "id", title: "编号", dataIndex: "id", width: 80 },
    { key: "name", title: "名称", dataIndex: "name" },
    { key: "status", title: "状态", dataIndex: "status", width: 100 },
  ];
  return (
    <CapabilityGrid>
      <CapabilityCard
        title="Core API 方法"
        description="Framework-neutral core 负责 QueryClient、queryKey、options、响应归一化和重试判断；React 方法只放在 /react 子路径。"
      >
        <ul className="biu-capability-list">
          <li>createBiuQueryClient / createBiuQueryClientOptions：默认 staleTime、gcTime、retry</li>
          <li>createBiuQueryKeys：all、list、detail、scope，避免业务手写 key</li>
          <li>createBiuQueryOptions / createBiuMutationOptions：标准化 AbortSignal 请求上下文</li>
          <li>normalizeBiuListResponse / unwrapBiuResponse：兼容 items、records、results、pagination.total</li>
        </ul>
        <pre className="biu-capability-code">
          {JSON.stringify(
            {
              all: queryKeys.all,
              list: queryKeys.list({ page: 1 }),
              detail: queryKeys.detail("demo"),
              normalized: normalizeBiuListResponse({ data: { records: [{ id: 1 }], totalResult: 1 } }),
              retryNetwork: shouldRetryBiuQuery(0, new TypeError("network")),
              abort: isAbortError(new DOMException("Aborted", "AbortError")),
            },
            null,
            2,
          )}
        </pre>
      </CapabilityCard>
      <CapabilityCard title="useBiuRequest">
        {query.isPending ? <Loading /> : null}
        {query.isError ? (
          <Result
            status="error"
            title="查询失败"
            action={
              <Button size="small" onClick={() => void query.refetch()}>
                重试
              </Button>
            }
          />
        ) : null}
        {query.data ? (
          <>
            <Tag color="success">{query.data.source}</Tag>
            <pre className="biu-capability-code">{JSON.stringify(query.data, null, 2)}</pre>
          </>
        ) : null}
        <CapabilityActions>
          <Button size="small" variant="secondary" onClick={() => void query.refetch()}>
            重新查询
          </Button>
          <span>{query.isFetching ? "请求中…" : `状态：${query.status}`}</span>
        </CapabilityActions>
      </CapabilityCard>
      <CapabilityCard title="useBiuMutationRequest">
        <CapabilityActions>
          <Button size="small" loading={mutation.isPending} onClick={() => mutation.mutate("Query 示例")}>
            发送 Mutation
          </Button>
          <Button
            size="small"
            variant="outlined"
            disabled={!mutation.isPending}
            onClick={() => {
              mutation.cancel("用户取消");
              setMutationResult("已取消当前 Mutation");
            }}
          >
            取消 Mutation
          </Button>
          <Button size="small" variant="ghost" onClick={() => mutation.reset()}>
            清空
          </Button>
        </CapabilityActions>
        {mutationResult ? (
          <Result status="success" title={mutationResult} />
        ) : (
          <p>Mutation 支持 AbortSignal，并在组件卸载时自动取消。</p>
        )}
      </CapabilityCard>
      <CapabilityCard
        title="useQuery 分页 / 取消"
        description="queryKey 随 page 变化自动缓存；请求读取 AbortSignal，分页切换和取消都走 QueryClient。"
      >
        {listQuery.isPending ? <Loading /> : null}
        {listQuery.isError && !isAbortError(listQuery.error) ? (
          <Result
            status="error"
            title="分页查询失败"
            action={<Button onClick={() => void listQuery.refetch()}>重试</Button>}
          />
        ) : null}
        <Table
          columns={listColumns}
          dataSource={listResult.items}
          rowKey="id"
          loading={listQuery.isFetching}
          pagination={{
            current: listPage,
            pageSize: 5,
            total: listResult.total || 12,
            showSizeChanger: false,
            onChange: (nextPage) => setListPage(nextPage),
          }}
          locale="zh-CN"
        />
        <CapabilityActions>
          <Pagination
            current={listPage}
            pageSize={5}
            total={listResult.total || 12}
            hideOnSinglePage
            onChange={(nextPage) => setListPage(nextPage)}
          />
          <Button
            size="small"
            variant="outlined"
            disabled={!listQuery.isFetching}
            onClick={() => {
              void queryClient.cancelQueries({ queryKey: queryKeys.list({ page: listPage, pageSize: 5 }) });
              setListMessage("已取消当前分页请求");
            }}
          >
            取消分页请求
          </Button>
          <span>{listMessage}</span>
        </CapabilityActions>
      </CapabilityCard>
      <CapabilityCard
        title="useBiuQuery / 状态"
        description="useQuery、useMutation、enabled、retry、refetch、invalidateQueries 和 mutation 状态均可直接使用 TanStack React API。"
      >
        <CapabilityActions>
          <Tag color={directQuery.isSuccess ? "success" : "info"}>status: {directQuery.status}</Tag>
          <Tag color="info">fetching: {String(directQuery.isFetching)}</Tag>
          <Button type="secondary" size="small" onClick={() => void directQuery.refetch()}>
            refetch
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              void queryClient.invalidateQueries({ queryKey: queryKeys.all });
              setLastInvalidation("已使 showcase 下的查询失效");
            }}
          >
            invalidateQueries
          </Button>
        </CapabilityActions>
        <p>{lastInvalidation}</p>
        <pre className="biu-capability-code">
          {JSON.stringify(
            {
              queryKey: queryKeys.detail("demo"),
              enabled: true,
              staleTime: 20000,
              retry: "network only",
              data: directQuery.data,
            },
            null,
            2,
          )}
        </pre>
      </CapabilityCard>
      <CapabilityCard title="边界说明">
        <ul className="biu-capability-list">
          <li>只发布一个 @biugle/tanstack-query 包。</li>
          <li>root/core 不依赖 React；React 能力从 /react 子路径引入。</li>
          <li>请求函数只接收标准 AbortSignal，不绑定 HTTP、Runtime 或 UI。</li>
          <li>Chart、RichText、Editor、Preview Server 本轮不进入基础包。</li>
        </ul>
      </CapabilityCard>
      <CapabilityCard
        title="TanStack Query 属性与方法"
        description="单包公开 root/core 和 /react 入口；表格列出业务页面最常用的查询方法。"
      >
        <CapabilityApiTable
          rows={[
            {
              component: "@biugle/tanstack-query",
              name: "createBiuQueryClient",
              type: "(options?) => QueryClient",
              defaultValue: "staleTime / gcTime / retry 预设",
              description: "创建 framework-neutral QueryClient 配置，不依赖 React。",
              demo: "Provider client",
            },
            {
              component: "@biugle/tanstack-query",
              name: "createBiuQueryKeys",
              type: "(scope) => { all, list, detail }",
              defaultValue: "-",
              description: "统一生成 all、list、detail、scope 查询 key。",
              demo: "showcase keys",
            },
            {
              component: "/react",
              name: "useBiuQuery / useBiuRequest",
              type: "UseQueryOptions / request context",
              defaultValue: "-",
              description: "分别兼容原生 useQuery 与带 AbortSignal 的标准请求函数。",
              demo: "查询状态 / 重新查询",
            },
            {
              component: "/react",
              name: "useBiuMutationRequest",
              type: "(variables, { signal }) => Promise + cancel()",
              defaultValue: "-",
              description: "标准化 mutation 请求、成功回调、错误状态和卸载取消。",
              demo: "发送 Mutation",
            },
            {
              component: "/react",
              name: "useBiuRequest + queryKey",
              type: "{ queryKey, request({ signal }) }",
              defaultValue: "请求自动取消",
              description: "通过 queryKey 驱动分页缓存，request 使用 AbortSignal 并可由 QueryClient 取消。",
              demo: "分页查询 / 取消",
            },
            {
              component: "/react",
              name: "useQueryClient().invalidateQueries",
              type: "({ queryKey }) => Promise",
              defaultValue: "-",
              description: "使指定 key 的缓存失效并触发重新获取，适合保存成功后的列表刷新。",
              demo: "invalidateQueries",
            },
            {
              component: "core",
              name: "createBiuMutationController",
              type: "{ signal, cancel }",
              defaultValue: "-",
              description: "为 framework-neutral mutation options 提供可控 AbortSignal。",
              demo: "core API",
            },
            {
              component: "core",
              name: "normalizeBiuListResponse",
              type: "(response) => { items, total }",
              defaultValue: "[] / 0",
              description: "兼容 items、records、results 和常见分页 total 字段。",
              demo: "normalized JSON",
            },
            {
              component: "core",
              name: "shouldRetryBiuQuery / isAbortError",
              type: "(failureCount, error) / (error) => boolean",
              defaultValue: "network only",
              description: "区分网络错误和业务/取消错误，避免无意义重试。",
              demo: "retryNetwork / abort",
            },
          ]}
        />
      </CapabilityCard>
    </CapabilityGrid>
  );
}

export default function TanstackQueryShowcase() {
  const client = useMemo(() => createBiuReactQueryClient({ defaults: { staleTime: 5_000 } }), []);
  return (
    <CapabilityPage
      className="biu-service-showcase-page"
      title="TanStack Query 能力展示"
      description="单一 @biugle/tanstack-query 包提供 framework-neutral core 和 /react 绑定，业务请求仍由页面决定。"
    >
      <BiuQueryClientProvider client={client}>
        <QueryPanel />
      </BiuQueryClientProvider>
    </CapabilityPage>
  );
}
