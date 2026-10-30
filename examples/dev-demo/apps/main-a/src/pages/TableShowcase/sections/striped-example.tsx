import { Table, type Column } from "@biugle/react-table";
import { useBiuI18n } from "@biugle/biu-runtime";
import { CapabilityActions, CapabilityCard } from "../../CapabilityPage/index.js";
import type { Row } from "../types.js";
import { rows } from "../mock.js";
export function StripedTableExample({ dir }: { dir: "ltr" | "rtl" }) {
  const { $t } = useBiuI18n();
  const stripedColumns: Column<Row>[] = [
    { key: "name", title: $t("能力名称"), dataIndex: "name", width: 220 },
    { key: "owner", title: $t("归属团队"), dataIndex: "owner", width: 180 },
    { key: "status", title: $t("状态"), dataIndex: "status", width: 140 },
    { key: "version", title: $t("版本"), dataIndex: "version", width: 140 },
  ];
  return (
    <CapabilityCard
      title={$t("斑马纹表格")}
      description={$t("striped 默认关闭；打开后偶数行使用比 hover 更浅的灰色底色，适合快速扫描长列表。")}
    >
      <Table<Row> dir={dir} columns={stripedColumns} dataSource={rows} rowKey="id" striped pagination={false} />
      <CapabilityActions>
        <span>{$t("偶数行浅灰，鼠标经过时统一切换为 hover 背景。")}</span>
      </CapabilityActions>
    </CapabilityCard>
  );
}
