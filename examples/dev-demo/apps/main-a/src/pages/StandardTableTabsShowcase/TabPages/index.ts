import { activeCatalogTabPage } from "./Active/index.js";
import { archivedCatalogTabPage } from "./Archived/index.js";
import { draftCatalogTabPage } from "./Draft/index.js";

export const catalogTabPages = [activeCatalogTabPage, draftCatalogTabPage, archivedCatalogTabPage] as const;
