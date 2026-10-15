import { useMemo, type ComponentProps } from "react";
import { Copy, Download, Eye, Flag, Pencil, Trash2, Upload } from "@biugle/icons";
import {
  Button,
  ButtonGroup,
  ButtonList,
  Detail,
  Drawer,
  DropdownMenu,
  PageBox,
  PageFilter,
  PageFilterItem,
  ProTextField,
  Progress,
  Stack,
  Select,
  TextField,
  Typography,
  biuMessage,
  splitString,
} from "@biugle/react-components";
import { Form, FormGroup, useForm } from "@biugle/react-form";
import { fire } from "@biugle/react-components";
import { ProTable, TableBox, type Column } from "@biugle/react-table";
import { useBiuI18n } from "@biugle/biu-runtime";
import type { RegionRow } from "./api.js";
import { useRegionStore } from "./store.js";
import "@biugle/react-components/styles.css";
import "@biugle/react-form/styles.css";
import "@biugle/react-table/styles.css";

type RegionDrawerProps = Omit<ComponentProps<typeof Drawer>, "children" | "title" | "onOk" | "onSubmit">;
interface RegionEditValues {
  region: string;
  channel: string;
  manager: string;
  segment: string;
  tier: string;
  cycle: string;
}

function StandardRowActions({
  items,
  locale,
}: {
  items: ComponentProps<typeof ButtonList>["items"];
  locale: ComponentProps<typeof ButtonList>["locale"];
}) {
  return <ButtonList locale={locale} iconOnly items={items} />;
}

function RegionDetailDrawer({ row, ...props }: RegionDrawerProps & { row: RegionRow }) {
  const { $t } = useBiuI18n();
  return (
    <Drawer {...props} title={`${$t("区域详情")} · ${row.region}`}>
      <Detail
        data={row}
        columns={2}
        sections={[
          {
            title: $t("经营信息"),
            items: [
              {
                key: "region",
                title: $t("区域名称"),
                tooltip: $t("支持输入多个区域或负责人，换行和中英文逗号均可分隔。"),
              },
              { key: "channel", title: $t("业务渠道"), tooltip: $t("按区域所属业务渠道筛选。") },
              { key: "manager", title: $t("负责人") },
              { key: "quota", title: $t("目标额度"), render: (value) => `¥${Number(value).toLocaleString()}` },
              { key: "progress", title: $t("完成度"), render: (value) => `${String(value)}%` },
              { key: "updatedAt", title: $t("更新日期") },
            ],
          },
        ]}
      />
    </Drawer>
  );
}

function RegionEditDrawer({
  row,
  mode,
  onSubmit,
  ...props
}: RegionDrawerProps & { row?: RegionRow; mode: "create" | "edit"; onSubmit: (values: RegionEditValues) => void }) {
  const { $t } = useBiuI18n();
  const form = useForm<RegionEditValues>({
    defaultValues: {
      region: row?.region ?? "",
      channel: row?.channel ?? "直营",
      manager: row?.manager ?? "唐宁",
      segment: row?.segment ?? "常规区域",
      tier: row?.tier ?? "标准",
      cycle: row?.cycle ?? "月度",
    },
  });
  return (
    <Drawer
      {...props}
      title={`${$t(mode === "create" ? "新增区域" : "编辑区域")}${row ? ` · ${row.region}` : ""}`}
      onOk={async () => {
        if (!(await form.trigger())) return false;
        onSubmit(form.getValues());
      }}
    >
      <Form form={form} layout="vertical">
        <FormGroup columns={2} bordered={false}>
          <Form.Item name="region" label={$t("区域名称")} rules={{ required: $t("请输入区域名称") }}>
            {({ field }) => <TextField {...field} placeholder={$t("请输入区域名称")} />}
          </Form.Item>
          <Form.Item name="channel" label={$t("业务渠道")} rules={{ required: $t("请选择业务渠道") }}>
            {({ field }) => (
              <Select
                value={field.value}
                options={["直营", "合作", "线上", "服务商"].map((value) => ({ value, label: $t(value) }))}
                onChange={(value) => field.onChange(String(value ?? ""))}
                onBlur={field.onBlur}
              />
            )}
          </Form.Item>
          <Form.Item name="manager" label={$t("负责人")} rules={{ required: $t("请选择负责人") }}>
            {({ field }) => (
              <Select
                value={field.value}
                options={["唐宁", "沈禾", "顾言", "苏澄", "林简"].map((value) => ({ value, label: $t(value) }))}
                onChange={(value) => field.onChange(String(value ?? ""))}
                onBlur={field.onBlur}
              />
            )}
          </Form.Item>
          <Form.Item name="segment" label={$t("区域分层")} rules={{ required: $t("请选择区域分层") }}>
            {({ field }) => (
              <Select
                value={field.value}
                options={["重点区域", "成长区域", "常规区域"].map((value) => ({ value, label: $t(value) }))}
                onChange={(value) => field.onChange(String(value ?? ""))}
                onBlur={field.onBlur}
              />
            )}
          </Form.Item>
          <Form.Item name="tier" label={$t("服务等级")} rules={{ required: $t("请选择服务等级") }}>
            {({ field }) => (
              <Select
                value={field.value}
                options={["核心", "成长", "标准"].map((value) => ({ value, label: $t(value) }))}
                onChange={(value) => field.onChange(String(value ?? ""))}
                onBlur={field.onBlur}
              />
            )}
          </Form.Item>
          <Form.Item name="cycle" label={$t("复核周期")} rules={{ required: $t("请选择复核周期") }}>
            {({ field }) => (
              <Select
                value={field.value}
                options={["月度", "季度"].map((value) => ({ value, label: $t(value) }))}
                onChange={(value) => field.onChange(String(value ?? ""))}
                onBlur={field.onBlur}
              />
            )}
          </Form.Item>
        </FormGroup>
      </Form>
    </Drawer>
  );
}

const openRegionDetail = fire(RegionDetailDrawer);
const openRegionEdit = fire(RegionEditDrawer);

export default function StandardTablePageShowcase() {
  const { $t, locale } = useBiuI18n();
  const store = useRegionStore();
  const queryParams = store.queryParams;
  const storeState = store.storeState;
  const rows = useMemo(() => {
    const keywords = splitString(queryParams.keyword, false, true).map((value) => value.toLowerCase());
    return storeState.records.filter((row) => {
      if (queryParams.channel !== "all" && row.channel !== queryParams.channel) return false;
      if (queryParams.manager !== "all" && row.manager !== queryParams.manager) return false;
      if (queryParams.progress === "high" && row.progress < 80) return false;
      if (queryParams.progress === "low" && row.progress >= 80) return false;
      if (queryParams.cycle === "recent" && row.cycle !== "月度") return false;
      if (queryParams.segment !== "all" && row.segment !== queryParams.segment) return false;
      if (queryParams.managerType === "internal" && row.manager === "林简") return false;
      if (queryParams.managerType === "partner" && row.manager !== "林简") return false;
      if (queryParams.source !== "all" && row.source !== queryParams.source) return false;
      return (
        keywords.length === 0 ||
        keywords.some((keyword) =>
          [row.region, row.channel, row.manager].some((value) => value.toLowerCase().includes(keyword)),
        )
      );
    });
  }, [queryParams, storeState.records]);
  const columns: Column<RegionRow>[] = [
    { key: "region", title: $t("区域名称"), dataIndex: "region", width: 180 },
    { key: "regionCode", title: $t("区域编码"), dataIndex: "regionCode", width: 120 },
    { key: "channel", title: $t("业务渠道"), dataIndex: "channel", width: 120 },
    { key: "manager", title: $t("负责人"), dataIndex: "manager", width: 120 },
    {
      key: "quota",
      title: $t("目标额度"),
      dataIndex: "quota",
      width: 140,
      align: "right",
      render: (value) => `¥${Number(value).toLocaleString()}`,
    },
    {
      key: "progress",
      title: $t("完成度"),
      dataIndex: "progress",
      render: (value) => (
        <Stack gap={8} align="center">
          <Progress percent={Number(value)} style={{ width: 80, minWidth: 0, flex: "0 0 80px" }} />
          <Typography muted>{String(value)}%</Typography>
        </Stack>
      ),
    },
    { key: "updatedAt", title: $t("更新日期"), dataIndex: "updatedAt", width: 130 },
    { key: "source", title: $t("数据来源"), dataIndex: "source", width: 120 },
    { key: "segment", title: $t("区域标签"), dataIndex: "segment", width: 120 },
    { key: "tier", title: $t("区域层级"), dataIndex: "tier", width: 110 },
    { key: "population", title: $t("服务人口"), dataIndex: "population", width: 120, align: "right" },
    { key: "coverage", title: $t("覆盖率"), dataIndex: "coverage", width: 100, render: (value) => `${String(value)}%` },
    { key: "risk", title: $t("风险等级"), dataIndex: "risk", width: 110 },
    { key: "lastAudit", title: $t("最近巡检"), dataIndex: "lastAudit", width: 130 },
    { key: "contact", title: $t("服务电话"), dataIndex: "contact", width: 140 },
    { key: "status", title: $t("启用状态"), dataIndex: "status", width: 110 },
    { key: "score", title: $t("运营评分"), dataIndex: "score", width: 110, align: "right" },
    { key: "cycle", title: $t("复核周期"), dataIndex: "cycle", width: 110 },
    { key: "note", title: $t("备注"), dataIndex: "note", width: 140 },
    {
      key: "actions",
      title: $t("操作"),
      actionColumn: true,
      fixed: "right",
      render: (_, record) => (
        <StandardRowActions
          locale={locale}
          items={[
            {
              key: "view",
              label: $t("查看"),
              icon: <Eye size={15} />,
              tooltip: `${$t("查看")} ${record.region}`,
              onClick: () => openRegionDetail({ row: record }),
            },
            {
              key: "edit",
              label: $t("编辑"),
              icon: <Pencil size={15} />,
              tooltip: `${$t("编辑")} ${record.region}`,
              onClick: () =>
                openRegionEdit({
                  row: record,
                  mode: "edit",
                  onSubmit: (values) =>
                    store.dispatcher.setStoreState((current) => ({
                      records: current.records.map((item) => (item.id === record.id ? { ...item, ...values } : item)),
                    })),
                }),
            },
            {
              key: "copy",
              label: $t("复制"),
              icon: <Copy size={15} />,
              tooltip: `${$t("复制")} ${record.region}`,
              onClick: () =>
                store.dispatcher.setStoreState((current) => ({
                  records: [
                    ...current.records,
                    {
                      ...record,
                      id: Math.max(...current.records.map((item) => item.id), 0) + 1,
                      region: `${record.region} 副本`,
                    },
                  ],
                })),
            },
            {
              key: "delete",
              label: $t("删除"),
              icon: <Trash2 size={15} />,
              tooltip: `${$t("删除")} ${record.region}`,
              onClick: () =>
                store.dispatcher.setStoreState((current) => ({
                  records: current.records.filter((item) => item.id !== record.id),
                })),
            },
            {
              key: "archive",
              label: $t("标记重点"),
              icon: <Flag size={15} />,
              tooltip: `${$t("标记重点")} ${record.region}`,
              onClick: () =>
                store.dispatcher.setStoreState((current) => ({
                  records: current.records.map((item) => (item.id === record.id ? { ...item, progress: 100 } : item)),
                })),
            },
          ]}
        />
      ),
    },
  ];
  return (
    <PageBox header={null}>
      <PageFilter
        moreLabel={$t("更多")}
        drawerTitle={$t("更多筛选条件")}
        maxRows={2}
        includeVisibleFieldsInDrawer
        actions={
          <ButtonGroup gap={8}>
            <Button
              size="small"
              type="secondary"
              variant="contained"
              onClick={() => {
                store.dispatcher.resetQueryParams();
              }}
            >
              {$t("重置")}
            </Button>
            <Button size="small" type="dark" onClick={() => biuMessage.success($t("查询完成"))}>
              {$t("查询")}
            </Button>
          </ButtonGroup>
        }
      >
        <PageFilterItem label={$t("区域或负责人")} tooltip={$t("支持输入多个区域或负责人，换行和中英文逗号均可分隔。")}>
          <ProTextField
            size="small"
            expandable
            separatorIncludesComma
            value={queryParams.keyword}
            placeholder={$t("输入关键词")}
            onChange={(value) => store.dispatcher.setQueryParams({ keyword: value })}
            allowClear
            onClear={() => store.dispatcher.setQueryParams({ keyword: "" })}
          />
        </PageFilterItem>
        <PageFilterItem label={$t("业务渠道")} tooltip={$t("按区域所属业务渠道筛选。")}>
          <Select
            size="small"
            value={queryParams.channel}
            options={[
              { value: "all", label: $t("全部渠道") },
              ...["直营", "合作", "线上", "服务商"].map((value) => ({ value, label: $t(value) })),
            ]}
            onChange={(value) => store.dispatcher.setQueryParams({ channel: String(value ?? "all") })}
          />
        </PageFilterItem>
        <PageFilterItem label={$t("负责人")}>
          <Select
            size="small"
            value={queryParams.manager}
            options={[
              { value: "all", label: $t("全部负责人") },
              ...["唐宁", "沈禾", "顾言", "苏澄"].map((value) => ({ value, label: $t(value) })),
            ]}
            onChange={(value) => store.dispatcher.setQueryParams({ manager: String(value ?? "all") })}
          />
        </PageFilterItem>
        <PageFilterItem label={$t("完成度")} tooltip={$t("按目标完成比例筛选，80% 为分界值。")}>
          <Select
            size="small"
            value={queryParams.progress}
            options={[
              { value: "all", label: $t("全部进度") },
              { value: "high", label: $t("已完成 80%+") },
              { value: "low", label: $t("低于 80%") },
            ]}
            onChange={(value) => store.dispatcher.setQueryParams({ progress: String(value ?? "all") })}
          />
        </PageFilterItem>
        <PageFilterItem label={$t("复核周期")}>
          <Select
            size="small"
            value={queryParams.cycle}
            options={[
              { value: "all", label: $t("全部周期") },
              { value: "recent", label: $t("最近更新") },
            ]}
            onChange={(value) => store.dispatcher.setQueryParams({ cycle: String(value ?? "all") })}
          />
        </PageFilterItem>
        <PageFilterItem label={$t("区域层级")}>
          <Select
            size="small"
            value={queryParams.segment}
            options={[
              { value: "all", label: $t("全部级别") },
              { value: "重点区域", label: $t("核心区域") },
              { value: "成长区域", label: $t("成长区域") },
            ]}
            onChange={(value) => store.dispatcher.setQueryParams({ segment: String(value ?? "all") })}
          />
        </PageFilterItem>
        <PageFilterItem label={$t("负责人")}>
          <Select
            size="small"
            value={queryParams.managerType}
            options={[
              { value: "all", label: $t("全部类型") },
              { value: "internal", label: $t("内部负责人") },
              { value: "partner", label: $t("合作负责人") },
            ]}
            onChange={(value) => store.dispatcher.setQueryParams({ managerType: String(value ?? "all") })}
          />
        </PageFilterItem>
        <PageFilterItem label={$t("数据来源")}>
          <Select
            size="small"
            value={queryParams.source}
            options={[
              { value: "all", label: $t("全部来源") },
              { value: "日常同步", label: $t("日常同步") },
              { value: "人工录入", label: $t("人工录入") },
            ]}
            onChange={(value) => store.dispatcher.setQueryParams({ source: String(value ?? "all") })}
          />
        </PageFilterItem>
      </PageFilter>
      <TableBox>
        <ProTable<RegionRow>
          columns={columns}
          dataSource={rows}
          locale={locale}
          rowKey="id"
          rowSelection={{
            selectedRowKeys: storeState.selected,
            onChange: (selected) => store.dispatcher.setStoreState({ selected }),
          }}
          pagination={{
            current: queryParams.page,
            pageSize: queryParams.pageSize,
            total: rows.length,
            showTotal: (total, range) =>
              $t("第 {start}-{end} 条，共 {total} 条", { start: range[0], end: range[1], total }),
            pageSizeOptions: [20, 40, 60],
            showSizeChanger: true,
            showQuickJumper: true,
            quickJumperWidth: 90,
            onChange: (page, size) => {
              store.dispatcher.setQueryParams({ page, pageSize: size });
            },
          }}
          scroll={{ x: "100%" }}
          toolbarLeft={
            <>
              <strong>{$t("区域经营概览")}</strong>
              <Typography muted>{$t("共 {count} 条记录", { count: rows.length })}</Typography>
              {storeState.selected.length ? (
                <Typography muted>{$t("已选 {count} 条", { count: storeState.selected.length })}</Typography>
              ) : null}
            </>
          }
          toolbarRight={
            <ButtonGroup gap={8}>
              <Button
                size="small"
                type="primary"
                variant="contained"
                onClick={() =>
                  openRegionEdit({
                    mode: "create",
                    onSubmit: (values) =>
                      store.dispatcher.setStoreState((current) => ({
                        records: [
                          ...current.records,
                          {
                            id: Math.max(...current.records.map((item) => item.id), 0) + 1,
                            regionCode: `RG-${String(Math.max(...current.records.map((item) => item.id), 0) + 1).padStart(4, "0")}`,
                            quota: 5000,
                            progress: 0,
                            updatedAt: "2026-10-10",
                            source: "人工录入",
                            population: 12000,
                            coverage: 62,
                            risk: "正常",
                            lastAudit: "2026-10-10",
                            contact: "400-801-2201",
                            status: "待复核",
                            score: 72,
                            note: "新建记录",
                            ...values,
                          },
                        ],
                      })),
                  })
                }
              >
                {$t("新增")}
              </Button>
              <Button
                size="small"
                type="secondary"
                variant="contained"
                icon={<Upload size={14} />}
                onClick={() => biuMessage.success($t("已导入 1 条区域记录"))}
              >
                {$t("导入")}
              </Button>
              <DropdownMenu
                trigger={
                  <Button size="small" type="secondary" variant="contained" icon={<Download size={14} />}>
                    {$t("导出")}
                  </Button>
                }
                items={[
                  {
                    key: "selected",
                    label: $t("选中导出"),
                    disabled: storeState.selected.length === 0,
                    onClick: () =>
                      biuMessage.success($t("已导出 {count} 条区域记录", { count: storeState.selected.length })),
                  },
                  {
                    key: "all",
                    label: $t("全选导出"),
                    onClick: () => biuMessage.success($t("已导出 {count} 条区域记录", { count: rows.length })),
                  },
                ]}
              />
            </ButtonGroup>
          }
          showDensity
          showColumnSettings
          showFullscreen
        />
      </TableBox>
    </PageBox>
  );
}
