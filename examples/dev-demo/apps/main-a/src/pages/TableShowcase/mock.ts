import dayjs from "dayjs";
import type { Row, EditableDemoRow } from "./types.js";
export const rows: Row[] = [
  { id: 1, name: "LayoutFrame", owner: "Foundation", status: "ready", version: "0.1.0" },
  { id: 2, name: "Form.Item", owner: "Form", status: "ready", version: "0.1.0" },
  { id: 3, name: "useQueryTable", owner: "Table", status: "beta", version: "0.1.0" },
  { id: 4, name: "XHttp", owner: "HTTP", status: "ready", version: "0.1.0" },
  { id: 5, name: "Biu I18n", owner: "i18n", status: "ready", version: "0.1.0" },
  { id: 6, name: "Biu Query", owner: "Query", status: "beta", version: "0.1.0" },
];
export function createEditableRows(): EditableDemoRow[] {
  return [
    {
      id: 1,
      name: "基础能力",
      status: "ready",
      budget: 128.5,
      note: "双击单元格编辑",
      date: dayjs("2026-10-09"),
      time: dayjs("2026-10-09 09:30"),
    },
    {
      id: 2,
      name: "扩展能力",
      status: "beta",
      budget: 256,
      note: "失焦后保存编辑",
      date: dayjs("2026-10-12"),
      time: dayjs("2026-10-12 14:00"),
    },
  ];
}
