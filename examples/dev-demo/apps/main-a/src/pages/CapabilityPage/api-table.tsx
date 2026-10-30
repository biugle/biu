import { memo, useMemo } from "react";
import { useBiuI18n } from "@biugle/biu-runtime";
import { Table, type Column } from "@biugle/react-table/ui";
import type { CapabilityApiRow } from "./api-types.js";
import { dedupeCapabilityApiRows, normalizeCapabilityApiRows } from "./api-normalization.js";

export const CapabilityApiTable = memo(function CapabilityApiTable({ rows }: { rows: CapabilityApiRow[] }) {
  const { $t } = useBiuI18n();
  const normalizedRows = useMemo(() => dedupeCapabilityApiRows(normalizeCapabilityApiRows(rows)), [rows]);
  const groupedRows = useMemo(() => {
    const groups = new Map<string, CapabilityApiRow[]>();
    normalizedRows.forEach((row) => {
      const group = groups.get(row.component) ?? [];
      group.push(row);
      groups.set(row.component, group);
    });
    return [...groups.entries()];
  }, [normalizedRows]);
  const columns = useMemo<Column<CapabilityApiRow>[]>(
    () => [
      {
        key: "component",
        title: $t("组件"),
        dataIndex: "component",
        width: 220,
        minWidth: 220,
        noWrap: true,
        fixed: "left",
      },
      { key: "name", title: $t("属性 / 方法"), dataIndex: "name", width: 200 },
      { key: "type", title: $t("类型"), dataIndex: "type", width: 200, ellipsis: true },
      { key: "defaultValue", title: $t("默认值"), dataIndex: "defaultValue", width: 140, ellipsis: true },
      { key: "options", title: $t("可选值 / 参数"), dataIndex: "options", width: 220, ellipsis: true },
      { key: "description", title: $t("效果与说明"), dataIndex: "description", width: 420, ellipsis: true },
      { key: "demo", title: $t("案例"), dataIndex: "demo", width: 140, ellipsis: true },
    ],
    [$t],
  );
  const localizedRows = useMemo(
    () =>
      new Map(
        groupedRows.map(([component, componentRows]) => [
          component,
          componentRows.map((row) => ({
            ...row,
            defaultValue: $t(row.defaultValue),
            options: row.options ? $t(row.options) : row.options,
            description: $t(row.description),
            demo: row.demo ? $t(row.demo) : row.demo,
          })),
        ]),
      ),
    [$t, groupedRows],
  );
  return (
    <>
      {groupedRows.map(([component, componentRows]) => (
        <section className="biu-capability-component-api" key={component}>
          <h4>{component}</h4>
          <Table<CapabilityApiRow>
            columns={columns}
            dataSource={localizedRows.get(component) ?? componentRows}
            rowKey={(row, index) => `${row.component}-${row.name}-${index}`}
            pagination={false}
            scroll={{ x: "max-content" }}
            // API tables are documentation, not an inner data grid. Let the page
            // own vertical scrolling so every region has one predictable scroll
            // context; keep only horizontal overflow for the wide contract.
          />
        </section>
      ))}
    </>
  );
});
CapabilityApiTable.displayName = "CapabilityApiTable";
