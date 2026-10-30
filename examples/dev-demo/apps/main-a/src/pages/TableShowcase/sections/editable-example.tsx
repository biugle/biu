import { useLocalizedFeedback } from "../feedback.js";
import { useMemo, useState } from "react";
import { EditableTable, type BiuTableLocale, type EditableColumn } from "@biugle/react-table";
import { Button } from "@biugle/react-components";
import { useBiuI18n } from "@biugle/biu-runtime";
import {
  CapabilityApiBlock,
  CapabilityApiRegion,
  CapabilityApiTable,
  CapabilityActions,
  CapabilityCard,
} from "../../CapabilityPage/index.js";
import type { EditableDemoRow } from "../types.js";
import { createEditableRows } from "../mock.js";
import { editableTableApiRows } from "../api-reference/index.js";
export function EditableTableExample({ locale }: { locale?: BiuTableLocale }) {
  const { $t } = useBiuI18n();
  const [data, setData] = useState<EditableDemoRow[]>(createEditableRows);
  const [lastChange, setLastChange] = useLocalizedFeedback("尚未编辑");
  const columns = useMemo<EditableColumn<EditableDemoRow>[]>(
    () => [
      { key: "name", title: $t("名称"), dataIndex: "name", editable: { type: "text" }, width: 140 },
      {
        key: "status",
        title: $t("状态"),
        dataIndex: "status",
        editable: {
          type: "select",
          options: [
            { label: $t("已完成"), value: "ready" },
            { label: "Beta", value: "beta" },
          ],
        },
        width: 130,
      },
      {
        key: "budget",
        title: $t("预算"),
        dataIndex: "budget",
        editable: { type: "inputNumber", editorProps: { decimal: 2, controls: false } },
        width: 140,
      },
      { key: "note", title: $t("备注"), dataIndex: "note", editable: { type: "textarea" }, width: 160 },
      {
        key: "date",
        title: $t("日期"),
        dataIndex: "date",
        editable: { type: "date", editorProps: { format: "YYYY-MM-DD" } },
        width: 150,
      },
      {
        key: "time",
        title: $t("时间"),
        dataIndex: "time",
        editable: { type: "time", editorProps: { format: "HH:mm" } },
        width: 120,
      },
    ],
    [$t],
  );
  return (
    <CapabilityCard
      title={$t("EditableTable 编辑表格")}
      description={$t(
        "双击单元格进入编辑，使用公共控件完成文本、下拉、数字、文本域、日期和时间编辑；Enter/失焦保存，Esc 退出编辑。",
      )}
    >
      <EditableTable<EditableDemoRow>
        columns={columns}
        dataSource={data}
        rowKey="id"
        locale={locale}
        onChange={(next, change) => {
          setData(next);
          setLastChange(change.value == null ? "已保存 {column}：空值" : "已保存 {column}：{value}", {
            column: change.column,
            value: String(change.value ?? ""),
          });
        }}
      />
      <CapabilityActions>
        <span>{$t("最近保存：{value}", { value: lastChange })}</span>
        <Button type="secondary" size="small" onClick={() => setData((current) => current.map((row) => ({ ...row })))}>
          {$t("保持当前数据")}
        </Button>
      </CapabilityActions>
      <CapabilityApiRegion>
        <CapabilityApiBlock title="EditableTable / EditableColumn / EditableCellChange API">
          <CapabilityApiTable rows={editableTableApiRows} />
        </CapabilityApiBlock>
      </CapabilityApiRegion>
    </CapabilityCard>
  );
}
