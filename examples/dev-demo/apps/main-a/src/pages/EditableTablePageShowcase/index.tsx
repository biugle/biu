import { type ComponentProps } from "react";
import { Download, Eye, Trash2, Upload } from "@biugle/icons";
import {
  Button,
  ButtonGroup,
  ButtonList,
  Drawer,
  DropdownMenu,
  PageBox,
  PageFilter,
  PageFilterItem,
  PageToolbar,
  Stack,
  Select,
  TextField,
  Typography,
  biuMessage,
  fire,
} from "@biugle/react-components";
import { EditableTable, TableBox, type EditableColumn } from "@biugle/react-table";
import { Form, useForm } from "@biugle/react-form";
import { useBiuI18n } from "@biugle/biu-runtime";
import { type EditableCatalogRow } from "./api.js";
import { useEditableCatalogStore } from "./store.js";
import "@biugle/react-components/styles.css";
import "@biugle/react-table/styles.css";

type EditableCreateValues = {
  name: string;
  category: string;
  stock: string;
  state: string;
  note: string;
};

function CreateCatalogDrawer({
  onSubmit,
  ...props
}: ComponentProps<typeof Drawer> & { onSubmit?: (values: EditableCreateValues) => void }) {
  const { $t } = useBiuI18n();
  const form = useForm<EditableCreateValues>({
    defaultValues: { name: "", category: "家居", stock: "", state: "review", note: "" },
  });
  return (
    <Drawer
      {...props}
      title={$t("新增商品")}
      onOk={async () => {
        if (!(await form.trigger())) return false;
        onSubmit?.(form.getValues());
      }}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="name" label={$t("商品名称")} rules={{ required: $t("请输入商品名称") }}>
          {({ field }) => <TextField {...field} placeholder={$t("请输入商品名称")} />}
        </Form.Item>
        <Form.Item name="category" label={$t("分类")} rules={{ required: $t("请选择分类") }}>
          {({ field }) => (
            <Select
              value={field.value}
              options={["家居", "出行", "户外", "文创"].map((value) => ({ value, label: $t(value) }))}
              onChange={(value) => field.onChange(String(value ?? ""))}
              onBlur={field.onBlur}
            />
          )}
        </Form.Item>
        <Form.Item name="stock" label={$t("库存")}>
          {({ field }) => <TextField {...field} inputMode="numeric" placeholder={$t("请输入库存")} />}
        </Form.Item>
        <Form.Item name="state" label={$t("状态")} rules={{ required: $t("请选择状态") }}>
          {({ field }) => (
            <Select
              value={field.value}
              options={[
                { value: "ready", label: $t("可售") },
                { value: "review", label: $t("待复核") },
                { value: "paused", label: $t("已暂停") },
              ]}
              onChange={(value) => field.onChange(String(value ?? ""))}
              onBlur={field.onBlur}
            />
          )}
        </Form.Item>
        <Form.Item name="note" label={$t("备注")}>
          {({ field }) => <TextField {...field} placeholder={$t("请输入备注")} />}
        </Form.Item>
      </Form>
    </Drawer>
  );
}

function EditableRowActions({
  items,
  locale,
}: {
  items: ComponentProps<typeof ButtonList>["items"];
  locale: ComponentProps<typeof ButtonList>["locale"];
}) {
  return <ButtonList locale={locale} iconOnly items={items} />;
}

const openCreateCatalog = fire(CreateCatalogDrawer);

export default function EditableTablePageShowcase() {
  const { $t, locale } = useBiuI18n();
  const store = useEditableCatalogStore();
  const queryParams = store.queryParams;
  const storeState = store.storeState;
  const keyword = queryParams.keyword.trim().toLowerCase();
  const filteredRows = storeState.rows.filter((row) => {
    if (keyword && ![row.name, row.category, row.note].some((value) => value.toLowerCase().includes(keyword)))
      return false;
    if (queryParams.category !== "all" && row.category !== queryParams.category) return false;
    if (queryParams.state !== "all" && row.state !== queryParams.state) return false;
    if (queryParams.stockRange === "low" && row.stock >= 100) return false;
    if (queryParams.stockRange === "high" && row.stock < 100) return false;
    if (queryParams.publishMethod === "manual" && row.id % 2 === 0) return false;
    if (queryParams.publishMethod === "sync" && row.id % 2 !== 0) return false;
    if (queryParams.updatedRange === "week" && row.id > 8) return false;
    if (queryParams.updatedRange === "month" && row.id > 30) return false;
    if (queryParams.warehouse === "north" && row.id % 2 === 0) return false;
    if (queryParams.warehouse === "south" && row.id % 2 !== 0) return false;
    if (
      queryParams.noteKeyword.trim() &&
      !row.note.toLowerCase().includes(queryParams.noteKeyword.trim().toLowerCase())
    )
      return false;
    return true;
  });
  const columns: EditableColumn<EditableCatalogRow>[] = [
    {
      key: "name",
      title: $t("名称"),
      dataIndex: "name",
      width: 190,
      editable: { type: "text" },
    },
    {
      key: "category",
      title: $t("分类"),
      dataIndex: "category",
      width: 120,
      editable: {
        type: "select",
        options: [
          { value: "家居", label: $t("家居") },
          { value: "出行", label: $t("出行") },
          { value: "户外", label: $t("户外") },
          { value: "文创", label: $t("文创") },
        ],
      },
    },
    {
      key: "stock",
      title: $t("库存"),
      dataIndex: "stock",
      width: 110,
      align: "right",
      editable: { type: "inputNumber", editorProps: { min: 0, precision: 0, controls: false } },
    },
    {
      key: "state",
      title: $t("状态"),
      dataIndex: "state",
      width: 120,
      editable: {
        type: "select",
        options: [
          { value: "ready", label: $t("可售") },
          { value: "review", label: $t("待复核") },
          { value: "paused", label: $t("已暂停") },
        ],
      },
      render: (value) => $t(value === "ready" ? "可售" : value === "review" ? "待复核" : "已暂停"),
    },
    {
      key: "note",
      title: $t("备注"),
      dataIndex: "note",
      width: 240,
      editable: { type: "textarea" },
    },
    {
      key: "actions",
      title: $t("操作"),
      fixed: "right",
      actionColumn: true,
      render: (_, record) => (
        <EditableRowActions
          locale={locale}
          items={[
            {
              key: "view",
              label: $t("查看"),
              icon: <Eye size={15} />,
              tooltip: `${$t("查看")} ${record.name}`,
              onClick: () => biuMessage.info(`${$t("查看")} ${record.name}`),
            },
            {
              key: "delete",
              label: $t("删除"),
              icon: <Trash2 size={15} />,
              tooltip: $t("删除"),
              onClick: () => biuMessage.warning($t("这里只演示操作入口")),
            },
          ]}
        />
      ),
    },
  ];
  return (
    <PageBox
      header={null}
      footer={
        <>
          <Typography muted>{$t("当前结果 {count} 条", { count: filteredRows.length })}</Typography>
          <Typography muted>
            {storeState.selected.length
              ? $t("已选 {count} 条", { count: storeState.selected.length })
              : $t("未选择记录")}
          </Typography>
        </>
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
            <Button size="small" type="dark" onClick={() => biuMessage.success($t("查询完成"))}>
              {$t("查询")}
            </Button>
          </ButtonGroup>
        }
      >
        <PageFilterItem label={$t("商品名称")}>
          <TextField
            size="small"
            value={queryParams.keyword}
            placeholder={$t("输入名称或备注")}
            onChange={(event) => store.dispatcher.setQueryParams({ keyword: event.target.value })}
            allowClear
            onClear={() => store.dispatcher.setQueryParams({ keyword: "" })}
          />
        </PageFilterItem>
        <PageFilterItem label={$t("分类")}>
          <Select
            size="small"
            value={queryParams.category}
            options={[
              { value: "all", label: $t("全部分类") },
              ...["家居", "出行", "户外", "文创"].map((value) => ({ value, label: $t(value) })),
            ]}
            onChange={(value) => store.dispatcher.setQueryParams({ category: String(value ?? "all") })}
          />
        </PageFilterItem>
        <PageFilterItem label={$t("状态")}>
          <Select
            size="small"
            value={queryParams.state}
            options={[
              { value: "all", label: $t("全部状态") },
              { value: "ready", label: $t("可售") },
              { value: "review", label: $t("待复核") },
              { value: "paused", label: $t("已暂停") },
            ]}
            onChange={(value) => store.dispatcher.setQueryParams({ state: String(value ?? "all") })}
          />
        </PageFilterItem>
        <PageFilterItem label={$t("备注关键词")}>
          <TextField
            size="small"
            value={queryParams.noteKeyword}
            placeholder={$t("筛选备注内容")}
            onChange={(event) => store.dispatcher.setQueryParams({ noteKeyword: event.target.value })}
            allowClear
            onClear={() => store.dispatcher.setQueryParams({ noteKeyword: "" })}
          />
        </PageFilterItem>
        <PageFilterItem label={$t("库存范围")}>
          <Select
            size="small"
            value={queryParams.stockRange}
            options={[
              { value: "all", label: $t("全部库存") },
              { value: "low", label: $t("低于 100") },
              { value: "high", label: $t("100 以上") },
            ]}
            onChange={(value) => store.dispatcher.setQueryParams({ stockRange: String(value ?? "all") })}
          />
        </PageFilterItem>
        <PageFilterItem label={$t("上架方式")}>
          <Select
            size="small"
            value={queryParams.publishMethod}
            options={[
              { value: "all", label: $t("全部方式") },
              { value: "manual", label: $t("人工上架") },
              { value: "sync", label: $t("批量同步") },
            ]}
            onChange={(value) => store.dispatcher.setQueryParams({ publishMethod: String(value ?? "all") })}
          />
        </PageFilterItem>
        <PageFilterItem label={$t("更新时间")}>
          <Select
            size="small"
            value={queryParams.updatedRange}
            options={[
              { value: "all", label: $t("全部时间") },
              { value: "week", label: $t("最近一周") },
              { value: "month", label: $t("最近一月") },
            ]}
            onChange={(value) => store.dispatcher.setQueryParams({ updatedRange: String(value ?? "all") })}
          />
        </PageFilterItem>
        <PageFilterItem label={$t("仓库")}>
          <Select
            size="small"
            value={queryParams.warehouse}
            options={[
              { value: "all", label: $t("全部仓库") },
              { value: "north", label: $t("北区仓") },
              { value: "south", label: $t("南区仓") },
            ]}
            onChange={(value) => store.dispatcher.setQueryParams({ warehouse: String(value ?? "all") })}
          />
        </PageFilterItem>
      </PageFilter>
      <PageToolbar>
        <Stack align="center" wrap="wrap" gap={10}>
          <strong>{$t("可编辑商品清单")}</strong>
          <Typography muted>{$t("双击单元格编辑，支持文本、下拉、数字、文本域、日期和时间类型")}</Typography>
        </Stack>
        <Stack align="center" wrap="wrap" gap={8}>
          <Typography muted>{$t("共 {count} 条", { count: filteredRows.length })}</Typography>
          <Button
            size="small"
            type="primary"
            variant="contained"
            onClick={() =>
              openCreateCatalog({
                onSubmit: (values: EditableCreateValues) => {
                  const nextId = Math.max(...storeState.rows.map((item) => item.id), 0) + 1;
                  store.dispatcher.setStoreState({
                    rows: [
                      ...storeState.rows,
                      {
                        id: nextId,
                        name: values.name || $t("新商品 {id}", { id: nextId }),
                        category: values.category,
                        stock: Number(values.stock || 0),
                        state: values.state,
                        note: values.note || $t("新增演示记录"),
                      },
                    ],
                  });
                  biuMessage.success($t("已新增 1 条记录"));
                },
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
            onClick={() => biuMessage.success($t("已导入 1 条记录"))}
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
                onClick: () => biuMessage.success($t("已导出 {count} 条记录", { count: storeState.selected.length })),
              },
              {
                key: "all",
                label: $t("全选导出"),
                onClick: () => biuMessage.success($t("已导出 {count} 条记录", { count: filteredRows.length })),
              },
            ]}
          />
        </Stack>
      </PageToolbar>
      <TableBox>
        <EditableTable<EditableCatalogRow>
          columns={columns}
          dataSource={filteredRows}
          rowKey="id"
          onChange={(_, change) => {
            store.dispatcher.setStoreState((state) => ({
              rows: state.rows.map((row) => (row.id === change.key ? { ...row, [change.column]: change.value } : row)),
            }));
          }}
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
        />
      </TableBox>
    </PageBox>
  );
}
