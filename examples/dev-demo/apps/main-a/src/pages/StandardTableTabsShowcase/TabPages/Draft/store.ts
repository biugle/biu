import { createCatalogTabStore } from "../shared/store.js";
import { catalogRows } from "./mock.js";

export const useDraftCatalogStore = createCatalogTabStore("StandardTableTabsShowcase/Draft", catalogRows);
