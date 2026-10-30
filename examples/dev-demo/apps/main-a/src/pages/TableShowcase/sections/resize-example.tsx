import { useLocalizedFeedback } from "../feedback.js";
import { useState } from "react";
import { ProTable, type Column, type TableDensity } from "@biugle/react-table";
import { Tag } from "@biugle/react-components";
import { useBiuI18n } from "@biugle/biu-runtime";
import { CapabilityActions, CapabilityCard } from "../../CapabilityPage/index.js";
import type { Row } from "../types.js";
import { rows } from "../mock.js";
export function TableResizeExample() {
  const { $t } = useBiuI18n();
  const [columnWidths, setColumnWidths] = useState<Record<string, number | string>>({
    name: 180,
    owner: 150,
    version: 110,
    status: 120,
  });
  const [rowHeights, setRowHeights] = useState<Record<string, number>>({ "1": 44, "2": 44, "3": 44, "4": 44 });
  const [density, setDensity] = useState<TableDensity>("default");
  const [lastEvent, setLastEvent] = useLocalizedFeedback("拖动列宽或行高后查看回调");
  const resizeRows = rows.slice(0, 4);
  const resizeColumns: Column<Row>[] = [
    {
      key: "name",
      title: $t("能力名称"),
      dataIndex: "name",
      width: 180,
      resizable: true,
      minWidth: 120,
      maxWidth: 320,
    },
    {
      key: "owner",
      title: $t("归属团队"),
      dataIndex: "owner",
      width: 150,
      resizable: true,
      minWidth: 100,
      maxWidth: 260,
    },
    {
      key: "version",
      title: $t("版本"),
      dataIndex: "version",
      width: 110,
      resizable: true,
      minWidth: 90,
      maxWidth: 220,
    },
    {
      key: "status",
      title: $t("状态"),
      dataIndex: "status",
      width: 120,
      resizable: true,
      minWidth: 90,
      maxWidth: 220,
      render: (value) => <Tag color={value === "ready" ? "success" : "warning"}>{String(value)}</Tag>,
    },
  ];
  return (
    <CapabilityCard
      title={$t("列宽与行高调整")}
      description={$t(
        "独立演示尺寸调整能力：只有配置 resizable 的列显示列宽手柄，开启 rowResizable 后可拖动行底部分隔线；拖动完成后提交，密度菜单底部可恢复默认尺寸。",
      )}
    >
      <ProTable<Row>
        columns={resizeColumns}
        dataSource={resizeRows}
        rowKey="id"
        columnWidths={columnWidths}
        defaultColumnWidths={{ name: 180, owner: 150, version: 110, status: 120 }}
        onColumnWidthsChange={(next) => {
          setColumnWidths(next);
          setLastEvent("列宽已更新");
        }}
        onColumnResize={(key, width) => setLastEvent("列 {key}：{width}px", { key, width })}
        rowHeights={rowHeights}
        defaultRowHeights={{ "1": 44, "2": 44, "3": 44, "4": 44 }}
        rowResizable
        minRowHeight={40}
        maxRowHeight={88}
        onRowHeightsChange={(next) => {
          setRowHeights(next);
          setLastEvent("行高已更新");
        }}
        onRowResize={(key, height) => setLastEvent("行 {key}：{height}px", { key, height })}
        density={density}
        onDensityChange={setDensity}
        showDensity
        showColumnSettings={false}
        showFullscreen={false}
        showResetTable
        onResetTable={(state) => {
          setColumnWidths({ ...state.columnWidths });
          setRowHeights({ ...state.rowHeights });
          setDensity(state.density);
          setLastEvent("已恢复列宽、行高和密度默认值");
        }}
        pagination={false}
      />
      <CapabilityActions>
        <span>{lastEvent}</span>
      </CapabilityActions>
    </CapabilityCard>
  );
}
