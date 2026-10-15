export type CatalogStatus = "active" | "draft" | "archived";

export interface CatalogRow {
  id: number;
  code: string;
  name: string;
  group: string;
  owner: string;
  status: CatalogStatus;
  updatedAt: string;
  amount: number;
  source: string;
  version: string;
}

const names = ["云杉计划", "晨星方案", "远帆服务", "青禾目录", "微光项目", "长河资源", "星桥档案", "澄明产品"];
const groups = ["基础服务", "运营工具", "数据资产", "客户应用"];
const owners = ["林越", "周宁", "沈妍", "顾川"];

export const catalogRows: CatalogRow[] = Array.from({ length: 110 }, (_, index) => ({
  id: index + 1,
  code: `CAT-${String(index + 1).padStart(4, "0")}`,
  name: names[index % names.length],
  group: groups[index % groups.length],
  owner: owners[index % owners.length],
  status: index % 6 === 0 ? "archived" : index % 4 === 0 ? "draft" : "active",
  updatedAt: `2026-09-${String((index % 28) + 1).padStart(2, "0")}  ${String(9 + (index % 9)).padStart(2, "0")}:20`,
  amount: 1280 + index * 265,
  source: index % 2 === 0 ? "自动同步" : "人工录入",
  version: `v${(index % 5) + 1}.0`,
}));
