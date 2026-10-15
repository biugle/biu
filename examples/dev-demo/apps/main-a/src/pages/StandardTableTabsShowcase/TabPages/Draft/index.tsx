import { getDraftCatalogTab } from "./api.js";
import { useDraftCatalogStore } from "./store.js";

export const draftCatalogTabPage = {
  key: getDraftCatalogTab(),
  labelKey: "待发布商品",
  useStore: useDraftCatalogStore,
} as const;

export default draftCatalogTabPage;
