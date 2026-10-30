import { useState } from "react";
import { useBiuContext, useBiuI18n } from "@biugle/biu-runtime";
import { CapabilityPage } from "../CapabilityPage/index.js";
import { CrudTableExample } from "./sections/crud-example.js";
import { QueryTableExample } from "./sections/query-example.js";
import { FilterLayoutExamples } from "./sections/filter-layout-examples.js";
import { EditableTableExample } from "./sections/editable-example.js";
import { TableResizeExample } from "./sections/resize-example.js";
import { StripedTableExample } from "./sections/striped-example.js";
import "@biugle/react-table/styles.css";
export default function TableShowcase() {
  const { locale } = useBiuContext();
  const { $t } = useBiuI18n();
  const [tableDirection, setTableDirection] = useState<"ltr" | "rtl">("ltr");
  return (
    <CapabilityPage
      title={$t("Table 能力展示")}
      description={$t(
        "统一展示 Table、ProTable、useQueryTable 的使用方式、交互能力和公开属性；筛选区、工具栏、表格区和分页区保持标准 CRUD 页面布局。",
      )}
    >
      <CrudTableExample locale={locale} tableDirection={tableDirection} setTableDirection={setTableDirection} />
      <FilterLayoutExamples />
      <EditableTableExample locale={locale} />
      <StripedTableExample dir={tableDirection} />
      <TableResizeExample />
      <QueryTableExample locale={locale} />
    </CapabilityPage>
  );
}
