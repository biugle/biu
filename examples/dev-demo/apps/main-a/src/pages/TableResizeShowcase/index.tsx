import { useState, type Key } from "react";
import { Button, PageBox, Stack, Tag, Typography, biuMessage } from "@biugle/react-components";
import { Eye } from "@biugle/icons";
import { ProTable, type Column, type TableDensity } from "@biugle/react-table";
import { useBiuI18n } from "@biugle/biu-runtime";
import { CapabilityApiTable, type CapabilityApiRow } from "../CapabilityPage/index.js";
import "@biugle/react-components/styles.css";
import "@biugle/react-table/styles.css";

type ResizeRow = {
  id: string;
  name: string;
  module: string;
  owner: string;
  status: string;
  updatedAt: string;
};

const defaultColumnWidths = { name: 190, module: 150, owner: 120, status: 120, updatedAt: 180 };
const defaultOverflowColumnWidths = { name: 320, module: 260, owner: 220, status: 210, updatedAt: 260 };
const defaultBoundedColumnWidths = { name: 230, module: 220, owner: 180, status: 160, updatedAt: 240 };
const defaultFillColumnWidths = { name: 180, module: 200, updatedAt: 180 };
const defaultRowHeights: Record<string, number> = { "1": 48, "2": 72, "3": 48, "4": 48 };
const rows: ResizeRow[] = [
  { id: "1", name: "统一导航", module: "基座", owner: "林越", status: "已完成", updatedAt: "2026-10-08" },
  { id: "2", name: "筛选布局", module: "Table", owner: "周宁", status: "验证中", updatedAt: "2026-10-06" },
  { id: "3", name: "编辑单元格", module: "Table", owner: "沈妍", status: "已完成", updatedAt: "2026-10-03" },
  { id: "4", name: "详情展示", module: "Components", owner: "顾川", status: "待排期", updatedAt: "2026-09-28" },
];

const apiRows: CapabilityApiRow[] = [
  ...["Table", "ProTable"].map((component) => ({
    component,
    name: "fillRemainingSpace",
    type: "boolean",
    defaultValue: "true",
    options: "true | false",
    description:
      "控制是否填充剩余空间；true 使用一个稳定动态普通列（显式 elasticColumn，未指定时默认最后一个可见普通叶子列）。拖动其他普通列时，以当前动态列作为唯一补偿列，从其当前提交宽度渐进调整；直接拖动动态列时，由它内侧最近的前置普通列反向补偿，两列任一到达 minWidth/maxWidth 就停止，避免留下新的填充空白。fixed、操作和辅助列不参与补偿；false 保留精确内容总宽并独立调整。",
    demo: "fillRemainingSpace={true} / fillRemainingSpace={false}",
  })),
  {
    component: "Table",
    name: "Column.resizable",
    type: "boolean",
    defaultValue: "false",
    options: "true | false",
    description:
      "只为显式开启的叶子列显示手柄；所有列的手柄统一在表头悬停或手柄聚焦时显示，触屏设备使用低对比度提示；普通列与动态列手柄均位于逻辑尾边界（LTR 右侧、RTL 左侧）。拖动动态列时由前一普通列反向补偿；拖动其他列时先由动态列吸收，动态列到达边界后再由前一普通列承接余量。fixed 列通过面向普通列的内边调整自身。",
    demo: 'fixed="right", resizable=true, minWidth=80, maxWidth=260',
  },
  ...["Table", "ProTable"].map((component) => ({
    component,
    name: "dir",
    type: '"ltr" | "rtl"',
    defaultValue: "ltr",
    options: "ltr | rtl",
    description:
      "显式设置 Table / ProTable 阅读方向；不会读取门户、Runtime 或 ConfigProvider 方向，未传时固定为 LTR。普通列拖动边界和默认文本起点随 dir 镜像。",
    demo: "手动切换 LTR / RTL",
  })),
  {
    component: "Table",
    name: "elasticColumn",
    type: "string | false",
    defaultValue: "最后一个普通叶子列",
    options: "普通叶子列 key | false",
    description:
      "指定稳定承担余量的普通列；省略时默认最后一个可见普通叶子列。拖动其他普通列时，以它作为唯一补偿列并从当前宽度渐进变化；直接拖动它时，内侧手柄由前置普通列反向补偿。补偿列达到边界后的剩余变化由表格填充槽或内容区承接。false 或 scroll.x=max-content 使用精确内容总宽和独立调整。",
    demo: "指定弹性列 / 自动填充 / 横向滚动",
  },
  {
    component: "Table",
    name: "Column.minWidth",
    type: "number",
    defaultValue: "48",
    description: "直接拖动时目标列遵守此最小宽度；动态列达到下限后，表格现有填充槽可继续吸收变化。",
    demo: "最小 120",
  },
  {
    component: "Table",
    name: "Column.maxWidth",
    type: "number",
    defaultValue: "Infinity",
    description: "直接拖动目标列的最大像素宽度；动态列参与自动填充或其他列的平衡补偿时可以超过此值。",
    demo: "最大 320",
  },
  {
    component: "Table",
    name: "columnWidths",
    type: "Record<string, number | string>",
    defaultValue: "undefined",
    description: "受控列宽映射；键为列 key，值为像素数字或 CSS 宽度字符串。",
    demo: "保存列宽",
  },
  {
    component: "Table",
    name: "defaultColumnWidths",
    type: "Record<string, number | string>",
    defaultValue: "{}",
    description: "非受控列宽的初始映射；未指定的列使用 Column.width。",
    demo: "默认列宽",
  },
  {
    component: "Table",
    name: "onColumnWidthsChange",
    type: "(widths: Record<string, number | string>) => void",
    defaultValue: "undefined",
    description: "列宽变化后返回完整映射，用于保存受控列宽。",
    demo: "列宽变化",
  },
  {
    component: "Table",
    name: "rowResizable",
    type: "boolean | (record, index) => boolean",
    defaultValue: "false",
    description: "启用行底部行高调整手柄；可按记录限制，并支持指针拖动和键盘方向键、Home/End。",
    demo: "全部数据行",
  },
  {
    component: "Table",
    name: "minRowHeight",
    type: "number",
    defaultValue: "40",
    description: "行高拖动时允许的最小像素高度。",
    demo: "最小 40",
  },
  {
    component: "Table",
    name: "maxRowHeight",
    type: "number",
    defaultValue: "Infinity",
    description: "行高拖动时允许的最大像素高度。",
    demo: "最大 96",
  },
  {
    component: "Table",
    name: "rowHeights",
    type: "Record<string, number>",
    defaultValue: "undefined",
    description: "受控的行键到像素高度映射。",
    demo: "保存行高",
  },
  {
    component: "Table",
    name: "defaultRowHeights",
    type: "Record<string, number>",
    defaultValue: "{}",
    description: "非受控行高的初始映射；重置表格时恢复此值。",
    demo: "默认行高",
  },
  {
    component: "Table",
    name: "onRowHeightsChange",
    type: "(heights: Record<string, number>) => void",
    defaultValue: "undefined",
    description: "行高变化后返回完整映射，用于保存受控行高。",
    demo: "行高变化",
  },
  {
    component: "Table",
    name: "onColumnResize",
    type: "(key: string, width: number) => void",
    defaultValue: "undefined",
    description: "单次列宽拖动完成后返回列 key 和最终像素宽度。",
    demo: "列宽回调",
  },
  {
    component: "Table",
    name: "onRowResize",
    type: "(key: string, height: number) => void",
    defaultValue: "undefined",
    description: "单次行高拖动完成后返回行 key 和最终像素高度。",
    demo: "行高回调",
  },
  {
    component: "ProTable",
    name: "showResetTable",
    type: "boolean",
    defaultValue: "true",
    description: "是否在密度菜单底部显示重置表格入口。",
    demo: "重置表格",
  },
  {
    component: "ProTable",
    name: "onResetTable",
    type: "(state: ProTableResetState) => void",
    defaultValue: "undefined",
    description: "重置后返回默认列宽、行高、列显示隐藏与顺序及密度，便于同步外部受控状态。",
    demo: "同步完整状态",
  },
];

// Keep the regular resize cases on Table's default bounds; explicit min/max
// limits are demonstrated separately so they do not constrain elastic behavior.
const columns: Column<ResizeRow>[] = [
  {
    key: "name",
    title: "能力名称",
    dataIndex: "name",
    width: defaultColumnWidths.name,
    resizable: true,
  },
  {
    key: "module",
    title: "模块",
    dataIndex: "module",
    width: defaultColumnWidths.module,
    resizable: true,
  },
  {
    key: "owner",
    title: "负责人",
    dataIndex: "owner",
    width: defaultColumnWidths.owner,
    resizable: true,
  },
  {
    key: "status",
    title: "状态",
    dataIndex: "status",
    width: defaultColumnWidths.status,
    resizable: true,
    render: (value) => (
      <Tag color={value === "已完成" ? "success" : value === "验证中" ? "warning" : "default"}>{String(value)}</Tag>
    ),
  },
  {
    key: "updatedAt",
    title: "最近更新",
    dataIndex: "updatedAt",
    width: defaultColumnWidths.updatedAt,
    minWidth: 180,
    resizable: true,
  },
];

const boundedColumnRanges: Record<string, { minWidth: number; maxWidth: number }> = {
  name: { minWidth: 150, maxWidth: 230 },
  module: { minWidth: 110, maxWidth: 220 },
  owner: { minWidth: 96, maxWidth: 180 },
  status: { minWidth: 96, maxWidth: 180 },
  updatedAt: { minWidth: 120, maxWidth: 240 },
};

const boundedColumns: Column<ResizeRow>[] = columns.map((column) => ({
  ...column,
  resizable: true,
  ...boundedColumnRanges[column.key],
}));

const rowResizeColumns: Column<ResizeRow>[] = columns.map((column) => ({
  ...column,
  resizable: false,
}));

const defaultColumnKeys = ["name", "module", "owner", "status", "updatedAt"];

export default function TableResizeShowcase() {
  const { $t } = useBiuI18n();
  const [columnWidths, setColumnWidths] = useState<Record<string, number | string>>(defaultColumnWidths);
  const [isolatedWidths, setIsolatedWidths] = useState<Record<string, number | string>>(defaultColumnWidths);
  const [isolationSelection, setIsolationSelection] = useState<Key[]>([]);
  const [explicitElasticWidths, setExplicitElasticWidths] =
    useState<Record<string, number | string>>(defaultFillColumnWidths);
  const [fixedWidthMap, setFixedWidthMap] = useState<Record<string, number | string>>(defaultFillColumnWidths);
  const [overflowWidthMap, setOverflowWidthMap] =
    useState<Record<string, number | string>>(defaultOverflowColumnWidths);
  const [boundedWidths, setBoundedWidths] = useState<Record<string, number | string>>(defaultBoundedColumnWidths);
  const [rowHeights, setRowHeights] = useState(defaultRowHeights);
  const [rowOnlyHeights, setRowOnlyHeights] = useState(defaultRowHeights);
  const [columnKeys, setColumnKeys] = useState(defaultColumnKeys);
  const [density, setDensity] = useState<TableDensity>("default");
  const [tableDirection, setTableDirection] = useState<"ltr" | "rtl">("ltr");
  const [lastEvent, setLastEvent] = useState(() => $t("尚未调整"));
  const localizeColumns = (source: Column<ResizeRow>[]) =>
    source.map((column) => ({ ...column, title: typeof column.title === "string" ? $t(column.title) : column.title }));
  const localizedColumns = localizeColumns(columns);
  const localizedBoundedColumns = localizeColumns(boundedColumns);
  const localizedRowResizeColumns = localizeColumns(rowResizeColumns);
  const fillComparisonColumns: Column<ResizeRow>[] = [
    { ...localizedColumns[0], fixed: "left", resizable: false, width: 180, minWidth: 180, maxWidth: 180 },
    { ...localizedColumns[1], width: 200 },
    { ...localizedColumns[4], width: 180, minWidth: 180 },
    {
      key: "actions",
      title: $t("操作"),
      fixed: "right",
      actionColumn: true,
      resizable: true,
      minWidth: 80,
      maxWidth: 260,
      render: (_value, record) => (
        <Button size="small" onlyIcon icon={<Eye size={14} />} onClick={() => biuMessage.info(record.name)}>
          {$t("查看")}
        </Button>
      ),
    },
  ];
  const exactContentColumns: Column<ResizeRow>[] = fillComparisonColumns.map((column) =>
    column.key === "actions" ? { ...column, fixed: undefined } : column,
  );
  return (
    <PageBox
      title={$t("Table 尺寸调整")}
      description={$t(
        "只有显式配置 resizable 的列显示列宽手柄；开启 rowResizable 后，行底部显示行高调整区域。拖动完成后通过密度菜单重置完整表格状态。",
      )}
    >
      <Stack direction="column" gap={8} style={{ height: "100%", minHeight: 0, overflowY: "auto" }}>
        <ProTable<ResizeRow>
          columns={localizedColumns}
          dataSource={rows}
          rowKey="id"
          defaultColumnKeys={defaultColumnKeys}
          columnKeys={columnKeys}
          onColumnKeysChange={(next) => {
            setColumnKeys(next);
            setLastEvent($t("列状态已更新：{columns}", { columns: next.join("，") }));
          }}
          columnWidths={columnWidths}
          defaultColumnWidths={defaultColumnWidths}
          onColumnWidthsChange={(next) => {
            setColumnWidths(next);
            setLastEvent(
              $t("列宽已更新：{columns}", {
                columns: Object.entries(next)
                  .map(([key, value]) => `${key}=${value}`)
                  .join("，"),
              }),
            );
          }}
          onColumnResize={(key, width) => setLastEvent($t("列 {key} 完成调整：{width}px", { key, width }))}
          rowHeights={rowHeights}
          defaultRowHeights={defaultRowHeights}
          rowResizable
          minRowHeight={40}
          maxRowHeight={96}
          onRowHeightsChange={(next) => {
            setRowHeights(next);
            setLastEvent(
              $t("行高已更新：{rows}", {
                rows: Object.entries(next)
                  .map(([key, value]) => `${key}=${value}px`)
                  .join("，"),
              }),
            );
          }}
          onRowResize={(key, height) => setLastEvent($t("行 {key} 完成调整：{height}px", { key, height }))}
          density={density}
          onDensityChange={setDensity}
          showDensity
          showColumnSettings
          showFullscreen={false}
          onResetTable={(state) => {
            setColumnKeys(state.columnKeys);
            setColumnWidths({ ...state.columnWidths });
            setRowHeights({ ...state.rowHeights });
            setDensity(state.density);
            setLastEvent($t("已恢复列宽、行高、列状态和密度默认值"));
          }}
          pagination={false}
        />
        <Stack role="status" gap={8} wrap="wrap">
          <Typography as="strong" strong muted>
            {$t("最近回调")}
          </Typography>
          <Typography>{lastEvent}</Typography>
        </Stack>
        <Stack as="section" direction="column" gap={6}>
          <Typography as="strong" strong>
            {$t("固定列隔离与多级表头")}
          </Typography>
          <Typography muted>
            {$t("名称和操作列保持固定宽度，选择与展开列也不参与补偿；拖动普通列或末列验证边界。")}
          </Typography>
          <ProTable<ResizeRow>
            columns={[
              {
                ...localizedColumns[0],
                fixed: "left",
                resizable: false,
                tooltip: $t("固定列不会被普通列拖动或自动填充改变宽度。"),
              },
              { key: "businessInfo", title: $t("业务信息"), children: localizedColumns.slice(1) },
              {
                key: "actions",
                title: $t("操作"),
                fixed: "right",
                actionColumn: true,
                render: (_value, record) => (
                  <Button size="small" onlyIcon icon={<Eye size={14} />} onClick={() => biuMessage.info(record.name)}>
                    {$t("查看")}
                  </Button>
                ),
              },
            ]}
            dataSource={rows}
            rowKey="id"
            rowSelection={{ selectedRowKeys: isolationSelection, onChange: setIsolationSelection }}
            expandable={{ expandedRowRender: (record) => `${$t("能力名称")}：${record.name}` }}
            columnWidths={isolatedWidths}
            onColumnWidthsChange={setIsolatedWidths}
            showDensity
            defaultColumnWidths={defaultColumnWidths}
            onResetTable={(state) => setIsolatedWidths({ ...state.columnWidths })}
            showColumnSettings
            showFullscreen={false}
            pagination={false}
          />
        </Stack>
        <Stack as="section" direction="column" gap={6}>
          <Stack gap={10} align="baseline" wrap="wrap">
            <Typography as="strong" strong>
              {$t("最小/最大列宽案例")}
            </Typography>
            <Typography muted>
              {$t("每一列都可以调整，并分别限制最小/最大宽度；拖到任一边界后不会继续越界。")}
            </Typography>
          </Stack>
          <ProTable<ResizeRow>
            columns={localizedBoundedColumns}
            dataSource={rows}
            rowKey="id"
            elasticColumn={false}
            scroll={{ x: "max-content" }}
            columnWidths={boundedWidths}
            defaultColumnWidths={defaultColumnWidths}
            onColumnWidthsChange={(next) => {
              setBoundedWidths(next);
              setLastEvent($t("边界列宽已更新：{width}px", { width: next.name }));
            }}
            onColumnResize={(key, width) => setLastEvent($t("边界列 {key} 完成调整：{width}px", { key, width }))}
            showDensity={false}
            showColumnSettings={false}
            showFullscreen={false}
            pagination={false}
          />
        </Stack>
        <Stack as="section" direction="column" gap={6}>
          <Stack gap={10} align="baseline" wrap="wrap">
            <Typography as="strong" strong>
              {$t("仅行高调整案例")}
            </Typography>
            <Typography muted>
              {$t(
                "列宽手柄全部关闭；前 3 条记录可用指针调整行高，范围为 40 - 88px，也可聚焦手柄后按方向键、Home/End。",
              )}
            </Typography>
          </Stack>
          <ProTable<ResizeRow>
            columns={localizedRowResizeColumns}
            dataSource={rows}
            rowKey="id"
            rowHeights={rowOnlyHeights}
            defaultRowHeights={defaultRowHeights}
            rowResizable={(record) => record.id !== "4"}
            minRowHeight={40}
            maxRowHeight={88}
            onRowHeightsChange={(next) => {
              setRowOnlyHeights(next);
              setLastEvent(
                $t("行高已更新：{rows}", {
                  rows: Object.entries(next)
                    .map(([key, value]) => `${key}=${value}px`)
                    .join("，"),
                }),
              );
            }}
            onRowResize={(key, height) => setLastEvent($t("行 {key} 完成调整：{height}px", { key, height }))}
            showDensity={false}
            showColumnSettings={false}
            showFullscreen={false}
            pagination={false}
          />
        </Stack>
        <Stack as="section" direction="column" gap={6}>
          <Stack gap={10} align="baseline" wrap="wrap">
            <Typography as="strong" strong>
              {$t("默认填充剩余空间")}
            </Typography>
            <Typography muted>
              {$t(
                "fillRemainingSpace=true：拖动动态列时由其前一普通列等量反向补偿，两列任一到达边界后拖动停止；拖动其他普通列时由同一动态列渐进吸收，达到边界后再由其前一普通列补偿。fixed、操作和辅助列保持隔离。",
              )}
            </Typography>
          </Stack>
          <Stack align="center" gap={6} wrap="wrap" role="group" aria-label={$t("表格方向")}>
            <Typography muted>{$t("演示方向")}</Typography>
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
          <ProTable<ResizeRow>
            dir={tableDirection}
            columns={fillComparisonColumns}
            dataSource={rows}
            rowKey="id"
            elasticColumn="updatedAt"
            fillRemainingSpace
            columnWidths={explicitElasticWidths}
            defaultColumnWidths={defaultFillColumnWidths}
            onColumnWidthsChange={setExplicitElasticWidths}
            showDensity={false}
            showColumnSettings={false}
            showFullscreen={false}
            pagination={false}
          />
          <Typography muted>
            {$t(
              "调整最近更新列后改变窗口宽度：动态列保留提交宽度，视口余量由表格填充槽承接；之后拖动其他列仍由同一动态列渐进补偿。",
            )}
          </Typography>
          <Typography muted>
            {$t(
              "固定右侧操作列已开启独立调整：拖动靠近普通列的左侧内边，宽度范围为 80–260px；拖动其他列或自动填充不会改变它。",
            )}
          </Typography>
        </Stack>
        <Stack as="section" direction="column" gap={6}>
          <Stack gap={10} align="baseline" wrap="wrap">
            <Typography as="strong" strong>
              {$t("关闭剩余空间填充")}
            </Typography>
            <Typography muted>
              {$t(
                "fillRemainingSpace=false：按精确内容总宽独立调整；本例操作列随表格内容排列，固定列行为在其他案例演示。",
              )}
            </Typography>
          </Stack>
          <ProTable<ResizeRow>
            columns={exactContentColumns}
            dataSource={rows}
            rowKey="id"
            fillRemainingSpace={false}
            columnWidths={fixedWidthMap}
            defaultColumnWidths={defaultFillColumnWidths}
            onColumnWidthsChange={setFixedWidthMap}
            showDensity={false}
            showColumnSettings={false}
            showFullscreen={false}
            pagination={false}
          />
          <Typography muted>
            {$t("固定列只有显式 resizable=true 时可以直接调整自身宽度；左右固定列均使用面向普通列的内边手柄。")}
          </Typography>
        </Stack>
        <Stack as="section" direction="column" gap={6}>
          <Stack gap={10} align="baseline" wrap="wrap">
            <Typography as="strong" strong>
              {$t("无弹性列横向滚动案例")}
            </Typography>
            <Typography muted>
              {$t("关闭拖动补偿后，列宽总和超过容器时按配置宽度保留，并只在表格内容区横向滚动。")}
            </Typography>
          </Stack>
          <ProTable<ResizeRow>
            columns={localizedColumns}
            dataSource={rows}
            rowKey="id"
            elasticColumn={false}
            columnWidths={overflowWidthMap}
            defaultColumnWidths={defaultOverflowColumnWidths}
            onColumnWidthsChange={(next) => {
              setOverflowWidthMap(next);
              setLastEvent($t("横向滚动案例列宽已更新"));
            }}
            onColumnResize={(key, width) =>
              setLastEvent($t("横向滚动案例列 {key} 完成调整：{width}px", { key, width }))
            }
            showDensity={false}
            showColumnSettings={false}
            showFullscreen={false}
            pagination={false}
          />
        </Stack>
        <Stack as="section" direction="column" gap={6}>
          <Typography as="h2" strong>
            {$t("尺寸调整 API")}
          </Typography>
          <CapabilityApiTable rows={apiRows} />
        </Stack>
      </Stack>
    </PageBox>
  );
}
