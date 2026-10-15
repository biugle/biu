export interface EditableCatalogRow {
  id: number;
  name: string;
  category: string;
  stock: number;
  state: string;
  note: string;
}

const editableSeed: EditableCatalogRow[] = [
  { id: 1, name: "晨雾茶具", category: "家居", stock: 128, state: "ready", note: "可编辑名称和库存" },
  { id: 2, name: "北岸灯组", category: "家居", stock: 86, state: "review", note: "等待规格确认" },
  { id: 3, name: "远帆背包", category: "出行", stock: 214, state: "ready", note: "主推轻量款" },
  { id: 4, name: "星桥水杯", category: "户外", stock: 56, state: "paused", note: "补充图片后重新上架" },
  { id: 5, name: "青禾收纳盒", category: "家居", stock: 309, state: "ready", note: "库存充足" },
  { id: 6, name: "微光手账", category: "文创", stock: 72, state: "review", note: "文案待复核" },
];

export const editableRows: EditableCatalogRow[] = Array.from({ length: 110 }, (_, index) => {
  const seed = editableSeed[index % editableSeed.length];
  return {
    ...seed,
    id: index + 1,
    name: `${seed.name} ${String(index + 1).padStart(3, "0")}`,
    stock: Math.max(0, seed.stock + ((index * 17) % 91) - 30),
  };
});
