import { createBiuStore } from "@biugle/biu-store";
import type { Key } from "react";
import { queryRegionRows } from "./api.js";
import type { RegionRow } from "./mock.js";

export type RegionQueryParams = {
  keyword: string;
  channel: string;
  manager: string;
  progress: string;
  cycle: string;
  segment: string;
  managerType: string;
  source: string;
  page: number;
  pageSize: number;
};

export type RegionStoreState = {
  records: RegionRow[];
  selected: Key[];
  columnWidths: Record<string, number | string>;
};

type RegionState = {
  queryParams: RegionQueryParams;
  storeState: RegionStoreState;
};

type RegionStoreStatePatch = Partial<RegionStoreState> | ((state: RegionStoreState) => Partial<RegionStoreState>);

const initialQueryParams = (): RegionQueryParams => ({
  keyword: "",
  channel: "all",
  manager: "all",
  progress: "all",
  cycle: "all",
  segment: "all",
  managerType: "all",
  source: "all",
  page: 1,
  pageSize: 20,
});

const initialStoreState = (): RegionStoreState => ({
  records: queryRegionRows("", "all"),
  selected: [],
  columnWidths: {},
});

const initialState = (): RegionState => ({
  queryParams: initialQueryParams(),
  storeState: initialStoreState(),
});

export const useRegionStore = createBiuStore<
  RegionState,
  {
    dispatcher: {
      setQueryParams: (patch: Partial<RegionQueryParams>) => void;
      resetQueryParams: () => void;
      setStoreState: (patch: RegionStoreStatePatch) => void;
      resetStoreState: () => void;
    };
  }
>({
  name: "StandardTablePageShowcase",
  initialState,
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
      resetQueryParams: () => set({ queryParams: initialQueryParams() }),
      setStoreState: (patch) =>
        set((state) => ({
          storeState: {
            ...state.storeState,
            ...(typeof patch === "function" ? patch(state.storeState) : patch),
          },
        })),
      resetStoreState: () => set({ storeState: initialStoreState() }),
    },
  }),
});
