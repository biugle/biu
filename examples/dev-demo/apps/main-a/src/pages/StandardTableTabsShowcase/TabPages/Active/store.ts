import { createCatalogTabStore } from "../shared/store.js";
import { catalogRows } from "./mock.js";

export const useActiveCatalogStore = createCatalogTabStore("StandardTableTabsShowcase/Active", catalogRows);
