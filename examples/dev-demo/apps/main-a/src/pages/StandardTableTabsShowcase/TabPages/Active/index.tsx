import { getActiveCatalogTab } from "./api.js";
import { useActiveCatalogStore } from "./store.js";

export const activeCatalogTabPage = {
  key: getActiveCatalogTab(),
  labelKey: "已上架商品",
  useStore: useActiveCatalogStore,
} as const;

export default activeCatalogTabPage;
