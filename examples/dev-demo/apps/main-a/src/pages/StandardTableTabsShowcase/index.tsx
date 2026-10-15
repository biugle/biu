import { useMemo, type ComponentProps } from "react";
import { Archive, Copy, Download, Eye, Pencil, Trash2, Upload } from "@biugle/icons";
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
  Select,
  Tabs,
  TextField,
  Typography,
  biuMessage,
} from "@biugle/react-components";
import { Form, FormGroup, useForm } from "@biugle/react-form";
import { fire } from "@biugle/react-components";
import { ProTable, TableBox, type Column } from "@biugle/react-table";
import { useBiuI18n } from "@biugle/biu-runtime";
import type { CatalogRow, CatalogStatus } from "./api.js";
import { useCatalogTabsStore, type CatalogTab } from "./store.js";
import { catalogTabPages } from "./TabPages/index.js";
import activeCatalogTabPage from "./TabPages/Active/index.js";
import draftCatalogTabPage from "./TabPages/Draft/index.js";
import archivedCatalogTabPage from "./TabPages/Archived/index.js";
import "@biugle/react-components/styles.css";
import "@biugle/react-form/styles.css";
import "@biugle/react-table/styles.css";

const statusLabel: Record<CatalogStatus, string> = { active: "已上架", draft: "草稿", archived: "已归档" };

type CatalogDrawerProps = Omit<ComponentProps<typeof Drawer>, "children" | "title" | "onOk" | "onSubmit">;
interface CatalogEditValues {
  name: string;
  group: string;
  owner: string;
  status: CatalogStatus;
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

function CatalogDetailDrawer({ row, ...props }: CatalogDrawerProps & { row: CatalogRow }) {
  const { $t } = useBiuI18n();
  return (
    <Drawer {...props} title={`${$t("商品详情")} · ${row.name}`}>
      <Detail
        data={row}
        columns={2}
        sections={[
          {
            title: $t("基础信息"),
            items: [
              { key: "code", title: $t("编号") },
              { key: "name", title: $t("名称") },
              { key: "group", title: $t("分组") },
              { key: "owner", title: $t("负责人") },
              { key: "status", title: $t("状态"), render: (value) => $t(statusLabel[value as CatalogStatus]) },
              { key: "updatedAt", title: $t("更新时间") },
              { key: "amount", title: $t("额度"), render: (value) => `¥${Number(value).toLocaleString()}` },
            ],
          },
        ]}
      />
    </Drawer>
  );
}

function CatalogEditDrawer({
  row,
  mode,
  onSubmit,
  ...props
}: CatalogDrawerProps & {
  row?: CatalogRow;
  mode: "create" | "edit";
  onSubmit: (values: CatalogEditValues) => void;
}) {
  const { $t } = useBiuI18n();
  const form = useForm<CatalogEditValues>({
    defaultValues: {
      name: row?.name ?? "",
      group: row?.group ?? "基础服务",
      owner: row?.owner ?? "林越",
      status: row?.status ?? "draft",
    },
  });
  return (
    <Drawer
      {...props}
      title={`${$t(mode === "create" ? "新增商品" : "编辑商品")}${row ? ` · ${row.name}` : ""}`}
      onOk={async () => {
        if (!(await form.trigger())) return false;
        onSubmit(form.getValues());
      }}
    >
      <Form form={form} layout="vertical">
        <FormGroup columns={2} bordered={false}>
          <Form.Item name="name" label={$t("商品名称")} rules={{ required: $t("请输入商品名称") }}>
            {({ field }) => <TextField {...field} placeholder={$t("请输入商品名称")} />}
          </Form.Item>
          <Form.Item name="group" label={$t("所属分组")} rules={{ required: $t("请选择所属分组") }}>
            {({ field }) => (
              <Select
                value={String(field.value ?? "")}
                options={["基础服务", "运营工具", "数据资产", "客户应用"].map((value) => ({ value, label: $t(value) }))}
                onChange={(value) => field.onChange(String(value ?? ""))}
                onBlur={field.onBlur}
              />
            )}
          </Form.Item>
          <Form.Item name="owner" label={$t("负责人")} rules={{ required: $t("请选择负责人") }}>
            {({ field }) => (
              <Select
                value={String(field.value ?? "")}
                options={["林越", "周宁", "沈妍", "顾川"].map((value) => ({ value, label: $t(value) }))}
                onChange={(value) => field.onChange(String(value ?? ""))}
                onBlur={field.onBlur}
              />
            )}
          </Form.Item>
          <Form.Item name="status" label={$t("启用状态")} rules={{ required: $t("请选择状态") }}>
            {({ field }) => (
              <Select
                value={field.value}
                options={[
                  { value: "active", label: $t("已上架") },
                  { value: "draft", label: $t("待发布") },
                  { value: "archived", label: $t("已归档") },
                ]}
                onChange={(value) => field.onChange(value as CatalogStatus)}
                onBlur={field.onBlur}
              />
            )}
          </Form.Item>
        </FormGroup>
      </Form>
    </Drawer>
  );
}

const openCatalogDetail = fire(CatalogDetailDrawer);
const openCatalogEdit = fire(CatalogEditDrawer);

export default function StandardTableTabsShowcase() {
  const { $t, locale } = useBiuI18n();
  const tabsStore = useCatalogTabsStore();
  const activeStore = activeCatalogTabPage.useStore();
  const draftStore = draftCatalogTabPage.useStore();
  const archivedStore = archivedCatalogTabPage.useStore();
  const activeTab = tabsStore.storeState.activeTab;
  const store = activeTab === "active" ? activeStore : activeTab === "draft" ? draftStore : archivedStore;
  const queryParams = store.queryParams;
  const storeState = store.storeState;
  const tabStatus = activeTab as CatalogStatus;
  const rows = useMemo(
    () => storeState.records.filter((row) => row.status === tabStatus),
    [storeState.records, tabStatus],
  );
  const filteredRows = rows.filter((row) => {
    const keyword = queryParams.keyword.trim().toLowerCase();
    if (queryParams.status !== "all" && row.status !== queryParams.status) return false;
    if (queryParams.owner !== "all" && row.owner !== queryParams.owner) return false;
    if (queryParams.group !== "all" && row.group !== queryParams.group) return false;
    if (queryParams.updatedRange === "week" && row.id > 8) return false;
    if (queryParams.updatedRange === "month" && row.id > 30) return false;
    if (queryParams.amountRange === "small" && (row.amount < 1000 || row.amount > 5000)) return false;
    if (queryParams.amountRange === "large" && row.amount <= 5000) return false;
    if (queryParams.source !== "all" && row.source !== queryParams.source) return false;
    if (queryParams.versionType === "stable" && Number(row.version.slice(1, -2)) > 3) return false;
    if (queryParams.versionType === "preview" && Number(row.version.slice(1, -2)) <= 3) return false;
    if (!keyword) return true;
    return [row.code, row.name, row.group, row.owner].some((value) => value.toLowerCase().includes(keyword));
  });
  const columns: Column<CatalogRow>[] = [
    { key: "code", title: $t("编号"), dataIndex: "code", width: 118, fixed: "left" },
    { key: "name", title: $t("名称"), dataIndex: "name", width: 170 },
    { key: "group", title: $t("所属分组"), dataIndex: "group", width: 130 },
    { key: "owner", title: $t("负责人"), dataIndex: "owner", width: 100 },
    {
      key: "status",
      title: $t("启用状态"),
      dataIndex: "status",
      width: 100,
      render: (value) => $t(statusLabel[value as CatalogStatus]),
    },
    { key: "updatedAt", title: $t("最近更新"), dataIndex: "updatedAt", width: 170 },
    {
      key: "amount",
      title: $t("额度"),
      dataIndex: "amount",
      width: 110,
      align: "right",
      render: (value) => `¥${Number(value).toLocaleString()}`,
    },
    { key: "source", title: $t("数据来源"), dataIndex: "source", width: 120 },
    { key: "version", title: $t("版本"), dataIndex: "version", width: 100 },
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
              tooltip: `${$t("查看")} ${record.name}`,
              onClick: () => openCatalogDetail({ row: record }),
            },
            {
              key: "edit",
              label: $t("编辑"),
              icon: <Pencil size={15} />,
              tooltip: `${$t("编辑")} ${record.name}`,
              onClick: () =>
                openCatalogEdit({
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
              tooltip: `${$t("复制")} ${record.name}`,
              onClick: () =>
                store.dispatcher.setStoreState((current) => ({
                  records: [
                    ...current.records,
                    {
                      ...record,
                      id: Math.max(...current.records.map((item) => item.id), 0) + 1,
                      code: `${record.code}-副本`,
                      name: `${record.name} 副本`,
                    },
                  ],
                })),
            },
            {
              key: "delete",
              label: $t("删除"),
              icon: <Trash2 size={15} />,
              tooltip: `${$t("删除")} ${record.name}`,
              onClick: () =>
                store.dispatcher.setStoreState((current) => ({
                  records: current.records.filter((item) => item.id !== record.id),
                })),
            },
            {
              key: "archive",
              label: $t("归档"),
              icon: <Archive size={15} />,
              tooltip: `${$t("归档")} ${record.name}`,
              onClick: () =>
                store.dispatcher.setStoreState((current) => ({
                  records: current.records.map((item) =>
                    item.id === record.id ? { ...item, status: "archived" as CatalogStatus } : item,
                  ),
                })),
            },
          ]}
        />
      ),
    },
  ];
  const tabs = catalogTabPages.map((tab) => ({ key: tab.key, label: $t(tab.labelKey) }));
  return (
    <PageBox
      header={
        <Tabs
          items={tabs}
          value={activeTab}
          onChange={(key) => {
            tabsStore.dispatcher.setStoreState({ activeTab: key as CatalogTab });
          }}
          width="100%"
        />
      }
    >
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
            <Button size="small" type="dark" onClick={() => biuMessage.success($t("筛选条件已应用"))}>
              {$t("查询")}
            </Button>
          </ButtonGroup>
        }
      >
        <PageFilterItem label={$t("关键词")}>
          <TextField
            size="small"
            value={queryParams.keyword}
            placeholder={$t("编号、名称或负责人")}
            onChange={(event) => store.dispatcher.setQueryParams({ keyword: event.target.value })}
            allowClear
            onClear={() => store.dispatcher.setQueryParams({ keyword: "" })}
          />
        </PageFilterItem>
        <PageFilterItem label={$t("状态")}>
          <Select
            size="small"
            value={queryParams.status}
            options={[
              { value: "all", label: $t("全部状态") },
              { value: "active", label: $t("已上架") },
              { value: "draft", label: $t("草稿") },
              { value: "archived", label: $t("已归档") },
            ]}
            onChange={(value) =>
              store.dispatcher.setQueryParams({ status: String(value ?? "all") as CatalogStatus | "all" })
            }
          />
        </PageFilterItem>
        <PageFilterItem label={$t("所属分组")}>
          <Select
            size="small"
            value={queryParams.group}
            options={[
              { value: "all", label: $t("全部分组") },
              ...["基础服务", "运营工具", "数据资产", "客户应用"].map((value) => ({ value, label: $t(value) })),
            ]}
            onChange={(value) => store.dispatcher.setQueryParams({ group: String(value ?? "all") })}
          />
        </PageFilterItem>
        <PageFilterItem label={$t("负责人")}>
          <Select
            size="small"
            value={queryParams.owner}
            options={[
              { value: "all", label: $t("全部负责人") },
              ...["林越", "周宁", "沈妍", "顾川"].map((value) => ({ value, label: $t(value) })),
            ]}
            onChange={(value) => store.dispatcher.setQueryParams({ owner: String(value ?? "all") })}
          />
        </PageFilterItem>
        <PageFilterItem label={$t("最近更新")}>
          <Select
            size="small"
            value={queryParams.updatedRange}
            options={[
              { value: "all", label: $t("全部日期") },
              { value: "week", label: $t("最近一周") },
              { value: "month", label: $t("最近一月") },
            ]}
            onChange={(value) => store.dispatcher.setQueryParams({ updatedRange: String(value ?? "all") })}
          />
        </PageFilterItem>
        <PageFilterItem label={$t("额度范围")}>
          <Select
            size="small"
            value={queryParams.amountRange}
            options={[
              { value: "all", label: $t("全部额度") },
              { value: "small", label: $t("1,000 - 5,000") },
              { value: "large", label: $t("5,000 以上") },
            ]}
            onChange={(value) => store.dispatcher.setQueryParams({ amountRange: String(value ?? "all") })}
          />
        </PageFilterItem>
        <PageFilterItem label={$t("数据来源")}>
          <Select
            size="small"
            value={queryParams.source}
            options={[
              { value: "all", label: $t("全部来源") },
              { value: "自动同步", label: $t("自动同步") },
              { value: "人工录入", label: $t("人工录入") },
            ]}
            onChange={(value) => store.dispatcher.setQueryParams({ source: String(value ?? "all") })}
          />
        </PageFilterItem>
        <PageFilterItem label={$t("版本类型")}>
          <Select
            size="small"
            value={queryParams.versionType}
            options={[
              { value: "all", label: $t("全部版本") },
              { value: "stable", label: $t("稳定版") },
              { value: "preview", label: $t("预览版") },
            ]}
            onChange={(value) => store.dispatcher.setQueryParams({ versionType: String(value ?? "all") })}
          />
        </PageFilterItem>
      </PageFilter>
      <TableBox>
        <ProTable<CatalogRow>
          columns={columns}
          dataSource={filteredRows}
          locale={locale}
          rowKey="id"
          rowSelection={{
            selectedRowKeys: storeState.selected,
            onChange: (selected) => store.dispatcher.setStoreState({ selected }),
          }}
          pagination={{
            current: queryParams.page,
            pageSize: queryParams.pageSize,
            total: filteredRows.length,
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
              <strong>{$t("商品目录")}</strong>
              <Typography muted>{$t("共 {count} 条", { count: filteredRows.length })}</Typography>
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
                  openCatalogEdit({
                    mode: "create",
                    onSubmit: (values) =>
                      store.dispatcher.setStoreState((current) => ({
                        records: [
                          ...current.records,
                          {
                            id: Math.max(...current.records.map((item) => item.id), 0) + 1,
                            code: `CAT-${String(Math.max(...current.records.map((item) => item.id), 0) + 1).padStart(4, "0")}`,
                            updatedAt: "2026-10-10 09:30",
                            amount: 1280,
                            source: "人工录入",
                            version: "v1.0",
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
                onClick={() => biuMessage.success($t("已导入 1 条商品记录"))}
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
                      biuMessage.success($t("已导出 {count} 条商品记录", { count: storeState.selected.length })),
                  },
                  {
                    key: "all",
                    label: $t("全选导出"),
                    onClick: () => biuMessage.success($t("已导出 {count} 条商品记录", { count: filteredRows.length })),
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
