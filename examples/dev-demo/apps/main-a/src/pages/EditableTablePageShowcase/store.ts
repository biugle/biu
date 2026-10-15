import { createBiuStore } from "@biugle/biu-store";
import type { Key } from "react";
import { queryEditableRows } from "./api.js";
import type { EditableCatalogRow } from "./mock.js";

export type EditableQueryParams = {
  keyword: string;
  category: string;
  state: string;
  stockRange: string;
  publishMethod: string;
  updatedRange: string;
  warehouse: string;
  noteKeyword: string;
  page: number;
  pageSize: number;
};

export type EditableStoreState = {
  rows: EditableCatalogRow[];
  selected: Key[];
};

type EditableState = {
  queryParams: EditableQueryParams;
  storeState: EditableStoreState;
};

type EditableStoreStatePatch =
  Partial<EditableStoreState> | ((state: EditableStoreState) => Partial<EditableStoreState>);

const initialQueryParams = (): EditableQueryParams => ({
  keyword: "",
  category: "all",
  state: "all",
  stockRange: "all",
  publishMethod: "all",
  updatedRange: "all",
  warehouse: "all",
  noteKeyword: "",
  page: 1,
  pageSize: 20,
});

const initialStoreState = (): EditableStoreState => ({
  rows: queryEditableRows(""),
  selected: [],
});

const initialState = (): EditableState => ({
  queryParams: initialQueryParams(),
  storeState: initialStoreState(),
});

export const useEditableCatalogStore = createBiuStore<
  EditableState,
  {
    dispatcher: {
      setQueryParams: (patch: Partial<EditableQueryParams>) => void;
      resetQueryParams: () => void;
      setStoreState: (patch: EditableStoreStatePatch) => void;
      resetStoreState: () => void;
    };
  }
>({
  name: "EditableTablePageShowcase",
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
