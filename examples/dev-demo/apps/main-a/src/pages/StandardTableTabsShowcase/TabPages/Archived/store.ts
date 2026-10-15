import { createCatalogTabStore } from "../shared/store.js";
import { catalogRows } from "./mock.js";

export const useArchivedCatalogStore = createCatalogTabStore("StandardTableTabsShowcase/Archived", catalogRows);
