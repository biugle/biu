import { createBiuStore } from "@biugle/biu-store";
import type { Key } from "react";
import type { CatalogRow, CatalogStatus } from "../../mock.js";

export type CatalogTabQueryParams = {
  keyword: string;
  status: CatalogStatus | "all";
  owner: string;
  group: string;
  updatedRange: string;
  amountRange: string;
  source: string;
  versionType: string;
  page: number;
  pageSize: number;
};

export type CatalogTabState = {
  queryParams: CatalogTabQueryParams;
  storeState: {
    records: CatalogRow[];
    selected: Key[];
  };
};

type CatalogTabStoreStatePatch =
  | Partial<CatalogTabState["storeState"]>
  | ((state: CatalogTabState["storeState"]) => Partial<CatalogTabState["storeState"]>);

type CatalogTabActions = {
  dispatcher: {
    setQueryParams: (patch: Partial<CatalogTabQueryParams>) => void;
    resetQueryParams: () => void;
    setStoreState: (patch: CatalogTabStoreStatePatch) => void;
    resetStoreState: () => void;
  };
};

const initialState = (records: CatalogRow[]): CatalogTabState => ({
  queryParams: {
    keyword: "",
    status: "all",
    owner: "all",
    group: "all",
    updatedRange: "all",
    amountRange: "all",
    source: "all",
    versionType: "all",
    page: 1,
    pageSize: 20,
  },
  storeState: { records, selected: [] },
});

export function createCatalogTabStore(name: string, records: CatalogRow[]) {
  return createBiuStore<CatalogTabState, CatalogTabActions>({
    name,
    initialState: () => initialState(records),
    actions: ({ set }) => ({
      dispatcher: {
        setQueryParams: (patch) =>
          set((state) => ({
            queryParams: {
              ...state.queryParams,
              ...patch,
              ...(patch.page === undefined ? { page: 1 } : {}),
            },
          })),
        resetQueryParams: () => set({ queryParams: initialState(records).queryParams }),
        setStoreState: (patch) =>
          set((state) => ({
            storeState: {
              ...state.storeState,
              ...(typeof patch === "function" ? patch(state.storeState) : patch),
            },
          })),
        resetStoreState: () => set({ storeState: { records, selected: [] } }),
      },
    }),
  });
}
