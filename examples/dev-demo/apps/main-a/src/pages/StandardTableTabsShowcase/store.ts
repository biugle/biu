import { createBiuStore } from "@biugle/biu-store";

export type CatalogTab = "active" | "draft" | "archived";

type CatalogTabsState = {
  storeState: {
    activeTab: CatalogTab;
  };
};

type CatalogTabsDispatcher = {
  setStoreState: (patch: Partial<CatalogTabsState["storeState"]>) => void;
  resetStoreState: () => void;
};

export const useCatalogTabsStore = createBiuStore<
  CatalogTabsState,
  {
    dispatcher: CatalogTabsDispatcher;
  }
>({
  name: "StandardTableTabsShowcase/Tabs",
  initialState: { storeState: { activeTab: "active" } },
  actions: ({ set }) => ({
    dispatcher: {
      setStoreState: (patch) => set((state) => ({ storeState: { ...state.storeState, ...patch } })),
      resetStoreState: () => set({ storeState: { activeTab: "active" } }),
    },
  }),
});
