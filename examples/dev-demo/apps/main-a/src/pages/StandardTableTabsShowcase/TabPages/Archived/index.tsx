import { getArchivedCatalogTab } from "./api.js";
import { useArchivedCatalogStore } from "./store.js";

export const archivedCatalogTabPage = {
  key: getArchivedCatalogTab(),
  labelKey: "已归档商品",
  useStore: useArchivedCatalogStore,
} as const;

export default archivedCatalogTabPage;
