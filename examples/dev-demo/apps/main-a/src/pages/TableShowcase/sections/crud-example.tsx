import { useMemo, useState } from "react";
import { ProTable, TableBox, type BiuTableLocale, type Column } from "@biugle/react-table";
import {
  Button,
  ButtonGroup,
  ButtonList,
  PageFilter,
  PageFilterItem,
  Select,
  Stack,
  Tabs,
  Tag,
  TextField,
  Typography,
  biuMessage,
} from "@biugle/react-components";
import { useBiuI18n } from "@biugle/biu-runtime";
import { Copy, Eye, Info, Trash2 } from "@biugle/icons";
import {
  CapabilityApiBlock,
  CapabilityApiRegion,
  CapabilityApiTable,
  CapabilityCard,
} from "../../CapabilityPage/index.js";
import type { Row } from "../types.js";
import { rows } from "../mock.js";
import { tableRegionApiRows, proTableRegionApiRows } from "../api-reference/index.js";
export function CrudTableExample({
  locale,
  tableDirection,
  setTableDirection,
}: {
  locale?: BiuTableLocale;
  tableDirection: "ltr" | "rtl";
  setTableDirection: (value: "ltr" | "rtl") => void;
}) {
  const { $t } = useBiuI18n();
  const [selected, setSelected] = useState<React.Key[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [advancedOwner, setAdvancedOwner] = useState("");
  const [advancedVersion, setAdvancedVersion] = useState("");
  const [advancedModule, setAdvancedModule] = useState("");
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(4);
  const [density, setDensity] = useState<"compact" | "default" | "comfortable">("default");
  const visibleRows = rows.filter((row) => {
    const matchesKeyword = !keyword || `${row.name} ${row.owner}`.toLowerCase().includes(keyword.toLowerCase());
    const matchesStatus = filterStatus === "all" || row.status === filterStatus;
    const matchesOwner = !advancedOwner || row.owner === advancedOwner;
    const matchesVersion = !advancedVersion || row.version === advancedVersion;
    const matchesModule = !advancedModule || row.owner === advancedModule;
    return matchesKeyword && matchesStatus && matchesOwner && matchesVersion && matchesModule;
  });
  const columns = useMemo<Column<Row>[]>(
    () => [
      {
        key: "name",
        title: $t("能力名称"),
        tooltip: $t("能力在组件库中的公开名称。"),
        dataIndex: "name",
        sortable: true,
        resizable: true,
        fixed: "left",
        width: 180,
        ellipsis: true,
      },
      {
        key: "ownerGroup",
        title: $t("归属信息"),
        children: [
          {
            key: "owner",
            title: $t("归属团队"),
            tooltip: $t("维护该能力的功能团队。"),
            dataIndex: "owner",
            resizable: true,
            width: 180,
            ellipsis: true,
          },
          {
            key: "version",
            title: $t("版本"),
            dataIndex: "version",
            align: "center",
            resizable: true,
            width: 110,
          },
        ],
      },
      {
        key: "status",
        title: $t("状态"),
        tooltip: $t("当前能力的发布状态。"),
        dataIndex: "status",
        resizable: true,
        width: 110,
        render: (value) => <Tag color={value === "ready" ? "success" : "warning"}>{String(value)}</Tag>,
      },
      {
        key: "action",
        title: $t("操作"),
        actionColumn: true,
        fixed: "right",
        render: (_value, record) => (
          <ButtonList
            iconOnly
            items={[
              {
                key: "view",
                label: $t("查看"),
                icon: <Eye size={15} />,
                onClick: () => biuMessage.info($t("查看：{name}", { name: record.name })),
              },
              {
                key: "copy",
                label: $t("复制"),
                icon: <Copy size={15} />,
                onClick: () => biuMessage.success($t("已复制：{name}", { name: record.name })),
              },
              {
                key: "remove",
                label: $t("移除"),
                icon: <Trash2 size={15} />,
                onClick: () => biuMessage.warning($t("移除：{name}", { name: record.name })),
              },
              {
                key: "detail",
                label: $t("详情"),
                icon: <Info size={15} />,
                onClick: () => biuMessage.info($t("详情：{name}", { name: record.name })),
              },
            ]}
          />
        ),
      },
    ],
    [$t],
  );
  return (
    <CapabilityCard
      plain
      title={$t("Table 页面使用")}
      description={$t(
        "一个完整页面同时展示筛选区、工具栏、Table/ProTable 组合、列设置显示隐藏与上移/下移、行操作收敛和独立分页；API 表紧跟在对应展示区域之后。",
      )}
    >
      <Stack direction="column" gap={8}>
        <Tabs
          width="100%"
          type="line"
          items={[
            { key: "all", label: $t("全部能力") },
            { key: "ready", label: $t("已完成") },
            { key: "beta", label: "Beta" },
          ]}
          value={activeTab}
          onChange={(next) => {
            setActiveTab(next);
            setFilterStatus(next);
            setCurrent(1);
          }}
        />
        <PageFilter
          moreLabel={$t("更多")}
          drawerTitle={$t("更多筛选条件")}
          maxRows={2}
          includeVisibleFieldsInDrawer
          actions={
            <ButtonGroup gap={8}>
              <Button
                type="secondary"
                variant="contained"
                size="small"
                onClick={() => {
                  setKeyword("");
                  setActiveTab("all");
                  setFilterStatus("all");
                  setAdvancedOwner("");
                  setAdvancedVersion("");
                  setAdvancedModule("");
                  setCurrent(1);
                }}
              >
                {$t("重置")}
              </Button>
              <Button
                type="dark"
                size="small"
                onClick={() => {
                  setCurrent(1);
                  setFilterStatus(activeTab);
                }}
              >
                {$t("查询")}
              </Button>
            </ButtonGroup>
          }
        >
          <PageFilterItem label={$t("关键字")} tooltip={$t("支持按能力名称或负责人搜索。")}>
            <TextField
              size="small"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              allowClear
              onClear={() => setKeyword("")}
              placeholder={$t("搜索能力名称或团队")}
            />
          </PageFilterItem>
          <PageFilterItem label={$t("状态")} tooltip={$t("按能力当前状态筛选结果。")}>
            <Select
              size="small"
              value={filterStatus}
              onChange={(value) => {
                const next = String(value ?? "all");
                setFilterStatus(next);
                setActiveTab(next);
                setCurrent(1);
              }}
              options={[
                { label: $t("全部状态"), value: "all" },
                { label: $t("已完成"), value: "ready" },
                { label: "Beta", value: "beta" },
              ]}
            />
          </PageFilterItem>
          <PageFilterItem label={$t("负责人")}>
            <TextField
              size="small"
              value={advancedOwner}
              placeholder={$t("负责人")}
              allowClear
              onChange={(event) => setAdvancedOwner(event.target.value)}
              onClear={() => setAdvancedOwner("")}
            />
          </PageFilterItem>
          <PageFilterItem label={$t("版本")}>
            <Select
              size="small"
              value={advancedVersion}
              placeholder={$t("选择版本")}
              options={[
                { label: "0.1.0", value: "0.1.0" },
                { label: "Beta", value: "beta" },
              ]}
              allowClear
              onChange={(value) => setAdvancedVersion(String(value ?? ""))}
            />
          </PageFilterItem>
          <PageFilterItem label={$t("归属团队")}>
            <Select
              size="small"
              value={advancedModule}
              placeholder={$t("选择团队")}
              options={[
                { label: "Foundation", value: "Foundation" },
                { label: "Form", value: "Form" },
                { label: "Table", value: "Table" },
                { label: "HTTP", value: "HTTP" },
              ]}
              allowClear
              onChange={(value) => setAdvancedModule(String(value ?? ""))}
            />
          </PageFilterItem>
        </PageFilter>
      </Stack>
      <Stack align="center" gap={6} wrap="wrap" role="group" aria-label={$t("方向")}>
        <Typography muted>{$t("方向")}</Typography>
        <Button
          type={tableDirection === "ltr" ? "primary" : "secondary"}
          variant="outlined"
          size="small"
          aria-pressed={tableDirection === "ltr"}
          onClick={() => setTableDirection("ltr")}
        >
          LTR
        </Button>
        <Button
          type={tableDirection === "rtl" ? "primary" : "secondary"}
          variant="outlined"
          size="small"
          aria-pressed={tableDirection === "rtl"}
          onClick={() => setTableDirection("rtl")}
        >
          RTL
        </Button>
      </Stack>
      <TableBox>
        <ProTable<Row>
          dir={tableDirection}
          columns={columns}
          dataSource={visibleRows}
          rowKey="id"
          rowSelection={{ selectedRowKeys: selected, onChange: setSelected }}
          columnStorageKey="biu-demo-table-columns-v3"
          density={density}
          onDensityChange={setDensity}
          showDensity
          showColumnSettings
          showFullscreen
          toolbarLeft={
            <>
              <Typography strong>{$t("能力清单")}</Typography>
              <Typography>{$t("共 {count} 条", { count: visibleRows.length })}</Typography>
              {selected.length ? <Tag color="info">{$t("已选 {count} 条", { count: selected.length })}</Tag> : null}
            </>
          }
          toolbarRight={
            <ButtonList
              maxCount={3}
              items={[
                {
                  key: "create",
                  label: $t("新增"),
                  icon: <Copy size={15} />,
                  onClick: () => biuMessage.success($t("已打开新增表单")),
                },
                {
                  key: "export",
                  label: $t("导出"),
                  icon: <Eye size={15} />,
                  onClick: () => biuMessage.success($t("已导出当前筛选结果")),
                },
                {
                  key: "refresh",
                  label: $t("刷新"),
                  icon: <Copy size={15} />,
                  onClick: () => biuMessage.info($t("已刷新")),
                },
                {
                  key: "batch",
                  label: $t("批量处理"),
                  onClick: () => biuMessage.info($t("已选择 {count} 条", { count: selected.length })),
                },
              ]}
            />
          }
          locale={locale}
          expandable={{
            expandedRowRender: (record) => (
              <p>{$t("展开内容：{name} 由 {owner} 维护。", { name: record.name, owner: record.owner })}</p>
            ),
          }}
          scroll={{ y: 360 }}
          stickyHeader
          footer={
            <>
              <span>{$t("footer 由调用方自定义，不混入 Toolbar 或 Pagination。")}</span>
              <Button size="small" type="secondary" variant="text" onClick={() => setSelected([])}>
                {$t("清空选择")}
              </Button>
            </>
          }
          pagination={{
            current,
            pageSize,
            total: visibleRows.length,
            pageSizeOptions: [4, 8, 12],
            showSizeChanger: true,
            showQuickJumper: true,
            quickJumperWidth: 90,
            showTotal: (total, range) =>
              $t("第 {start}-{end} 条，共 {total} 条", { start: range[0], end: range[1], total }),
            onChange: (next, size) => {
              setCurrent(next);
              setPageSize(size);
            },
          }}
        />
      </TableBox>
      <CapabilityApiRegion>
        <CapabilityApiBlock title={$t("Table / Column / Pagination 区域 API")}>
          <CapabilityApiTable rows={tableRegionApiRows} />
        </CapabilityApiBlock>
        <CapabilityApiBlock title={$t("ProTable / ButtonList 区域 API")}>
          <CapabilityApiTable rows={proTableRegionApiRows} />
        </CapabilityApiBlock>
      </CapabilityApiRegion>
    </CapabilityCard>
  );
}
