import { useLocalizedFeedback } from "../feedback.js";
import { useMemo, useState } from "react";
import { Table, useQueryTable, type BiuTableLocale, type Column } from "@biugle/react-table";
import { Button, Select, Stack, Tag, TextField } from "@biugle/react-components";
import { useBiuI18n } from "@biugle/biu-runtime";
import {
  CapabilityApiBlock,
  CapabilityApiRegion,
  CapabilityApiTable,
  CapabilityActions,
  CapabilityCard,
  CapabilityGrid,
} from "../../CapabilityPage/index.js";
import type { QueryRow, QueryMode } from "../types.js";
import { queryTableApiRows, queryLifecycleApiRows } from "../api-reference/index.js";
function waitForQuery(signal: AbortSignal, delay = 420) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, delay);
    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}
export function QueryTableExample({ locale }: { locale?: BiuTableLocale }) {
  const { $t } = useBiuI18n();
  const [keywordInput, setKeywordInput] = useState("");
  const [params, setParams] = useState({ keyword: "" });
  const [mode, setMode] = useState<QueryMode>("standard");
  const [lastAction, setLastAction] = useLocalizedFeedback("尚未执行取消或重试");
  const columns = useMemo<Column<QueryRow>[]>(
    () => [
      { key: "id", title: "ID", dataIndex: "id", width: 80 },
      { key: "name", title: $t("名称"), dataIndex: "name", sortable: true },
      { key: "category", title: $t("分类"), dataIndex: "category" },
      {
        key: "state",
        title: $t("状态"),
        dataIndex: "state",
        render: (value) => <Tag color="success">{String(value)}</Tag>,
      },
    ],
    [$t],
  );
  const table = useQueryTable<QueryRow, { keyword: string }>({
    queryKey: ["demo", "table-capabilities", mode],
    params,
    initialPagination: { pageSize: 5 },
    queryFn: async ({ pagination, signal }) => {
      await waitForQuery(signal);
      if (mode === "error") throw new Error($t("模拟接口返回 500"));
      const allItems = Array.from({ length: 17 }, (_, index) => ({
        id: index + 1,
        name: `Query Row ${index + 1}`,
        category: index % 2 ? "business" : "platform",
        state: "ready",
      }));
      const items = allItems.filter((item) =>
        params.keyword ? item.name.toLowerCase().includes(params.keyword.toLowerCase()) : true,
      );
      const start = (pagination.current - 1) * pagination.pageSize;
      const page = items.slice(start, start + pagination.pageSize);
      return mode === "legacy"
        ? { results: page, pagination: { totalResult: items.length } }
        : { data: { items: page, total: items.length } };
    },
  });

  return (
    <CapabilityGrid>
      <CapabilityCard
        title={$t("useQueryTable 查询示例")}
        description={$t("查询状态、取消、重试和响应归一化都在同一个 Table 能力页中展示。")}
      >
        <Stack align={"center"} gap={10} wrap="wrap">
          <TextField
            value={keywordInput}
            placeholder={$t("按名称筛选")}
            aria-label={$t("查询关键词")}
            onChange={(event) => setKeywordInput(event.target.value)}
            allowClear
            onClear={() => setKeywordInput("")}
          />
          <Select
            value={mode}
            aria-label={$t("响应模式")}
            options={[
              { value: "standard", label: $t("标准 data/items/total") },
              { value: "legacy", label: $t("兼容 results/pagination.totalResult") },
              { value: "error", label: $t("模拟错误") },
            ]}
            onChange={(value) => setMode(String(value ?? "standard") as QueryMode)}
          />
          <Button
            size="small"
            onClick={() => {
              setParams({ keyword: keywordInput });
              setLastAction("已应用查询参数");
            }}
          >
            {$t("应用参数")}
          </Button>
        </Stack>
        <Stack direction="column" style={{ marginTop: 12 }}>
          <Table<QueryRow> columns={columns} locale={locale} {...table.tableProps} />
        </Stack>
        <CapabilityActions>
          <Button
            size="small"
            variant="secondary"
            onClick={() => {
              void table.refresh({ resetCurrentPage: true });
              setLastAction("已重新查询");
            }}
          >
            {$t("重试 / 刷新")}
          </Button>
          <Button
            size="small"
            variant="ghost"
            disabled={!table.isFetching}
            onClick={() => {
              table.query.cancel();
              setLastAction("已取消当前请求");
            }}
          >
            {$t("取消请求")}
          </Button>
          <span>
            {table.isFetching
              ? $t("查询中…")
              : $t("当前 {current} 页，共 {total} 条", {
                  current: table.pagination.current,
                  total: table.pagination.total,
                })}
          </span>
          <span>{$t("最近动作：{action}", { action: lastAction })}</span>
        </CapabilityActions>
        <CapabilityApiRegion>
          <CapabilityApiBlock title={$t("useQueryTable 查询区域 API")}>
            <CapabilityApiTable rows={queryTableApiRows} />
          </CapabilityApiBlock>
        </CapabilityApiRegion>
      </CapabilityCard>
      <CapabilityCard
        title={$t("查询生命周期")}
        description={$t("请求函数可接入任意 HTTP 客户端，Table 只消费统一的 tableProps。")}
      >
        <dl>
          <div>
            <dt>queryKey</dt>
            <dd>{JSON.stringify(["demo", "table-capabilities", mode])}</dd>
          </div>
          <div>
            <dt>{$t("参数")}</dt>
            <dd>{params.keyword || $t("（空）")}</dd>
          </div>
          <div>
            <dt>{$t("状态")}</dt>
            <dd>
              <Tag color={table.error ? "danger" : table.isFetching ? "warning" : "success"}>
                {table.error ? "error" : table.isFetching ? "fetching" : "success"}
              </Tag>
            </dd>
          </div>
        </dl>
        <p>{$t("参数、排序、筛选或分页变化时会取消旧请求；组件卸载时也会释放 AbortController。")}</p>
        <CapabilityApiRegion>
          <CapabilityApiBlock title={$t("查询生命周期 API")}>
            <CapabilityApiTable rows={queryLifecycleApiRows} />
          </CapabilityApiBlock>
        </CapabilityApiRegion>
      </CapabilityCard>
    </CapabilityGrid>
  );
}
