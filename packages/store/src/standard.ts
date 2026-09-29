import { create, type StateCreator, type StoreApi, type UseBoundStore } from "zustand";
import { devtools, persist, subscribeWithSelector, createJSONStorage, type PersistStorage } from "zustand/middleware";

export type BiuStoreSet<S extends object> = (
  partial: Partial<S> | ((state: S) => Partial<S>),
  replace?: boolean,
  action?: string,
) => void;

export interface BiuStoreActionsContext<S extends object> {
  set: BiuStoreSet<S>;
  get: () => S;
  reset: () => void;
}

export interface BiuStorePersistOptions<S extends object> {
  name: string;
  storage?: PersistStorage<Partial<S>>;
  version?: number;
  migrate?: (persisted: unknown, version: number) => Partial<S> | Promise<Partial<S>>;
  partialize?: (state: S) => Partial<S>;
}

export interface CreateBiuStoreOptions<S extends object, A extends object> {
  name?: string;
  initialState: S | (() => S);
  /** Actions are inferred from the returned object; the state setter remains typed to the durable state. */
  actions?: (context: BiuStoreActionsContext<S>) => A;
  devtools?: boolean;
  subscribeWithSelector?: boolean;
  persist?: BiuStorePersistOptions<S & A>;
}

function clone<T>(value: T): T {
  if (typeof structuredClone === "function") {
    try {
      return structuredClone(value);
    } catch {
      /* fall through for non-cloneable values */
    }
  }
  if (Array.isArray(value)) return value.map((item) => clone(item)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, child]) => [key, clone(child)]),
    ) as T;
  }
  return value;
}

const sensitiveKey = /(token|password|secret|cookie|sessionid|session_id|authorization)/i;

export function omitSensitiveState(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(omitSensitiveState);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key, child]) => !sensitiveKey.test(key) && typeof child !== "function")
      .map(([key, child]) => [key, omitSensitiveState(child)]),
  );
}

export function createBiuStore<S extends object, A extends object>(
  options: CreateBiuStoreOptions<S, A>,
): UseBoundStore<StoreApi<S & A>> & { getInitialState: () => S & A } {
  const initialState = () =>
    clone(typeof options.initialState === "function" ? (options.initialState as () => S)() : options.initialState);
  let creator: StateCreator<S & A, [], [], S & A> = ((set, get) => {
    const reset = () => set(initialState() as Partial<S & A>);
    const actions =
      options.actions?.({ set: set as BiuStoreSet<S>, get: get as () => S, reset: reset as () => void }) ?? ({} as A);
    return { ...initialState(), ...actions } as S & A;
  }) as StateCreator<S & A, [], [], S & A>;

  if (options.subscribeWithSelector !== false) creator = subscribeWithSelector(creator) as typeof creator;
  if (options.persist) {
    const persistOptions = options.persist;
    creator = persist(creator, {
      name: persistOptions.name,
      storage: (persistOptions.storage ??
        (typeof window !== "undefined" ? createJSONStorage(() => window.localStorage) : undefined)) as any,
      version: persistOptions.version,
      migrate: persistOptions.migrate,
      partialize: (state) => persistOptions.partialize?.(state) ?? (omitSensitiveState(state) as Partial<S & A>),
    }) as typeof creator;
  }
  if (options.devtools) creator = devtools(creator, { name: options.name ?? "BiuStore" }) as typeof creator;
  const store = create<S & A>()(creator) as UseBoundStore<StoreApi<S & A>> & { getInitialState: () => S & A };
  store.getInitialState = initialState as () => S & A;
  return store;
}

type WidenValue<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends object
        ? { [K in keyof T]: WidenValue<T[K]> }
        : T;
type WidenObject<T extends object> = WidenValue<T> & object;

export interface BiuTabStoreState<Tab extends string, Params extends object, Options extends object = object> {
  activeTab: Tab;
  tabState: Record<Tab, { queryParams: Params }>;
  counters: Record<string, number>;
  options: Options;
}

export interface BiuTabStoreActions<Tab extends string, Params extends object, Options extends object> {
  setActiveTab: (tab: Tab) => void;
  patchTabParams: (patch: Partial<WidenObject<Params>>, tab?: Tab) => void;
  resetTabParams: (tab?: Tab) => void;
  setCounter: (key: string, value: number) => void;
  setOptions: (options: Partial<Options>) => void;
}

export function createBiuTabStore<Tab extends string, Params extends object, Options extends object = object>(options: {
  name?: string;
  tabs: readonly Tab[];
  initialParams: Params | ((tab: Tab) => Params);
  initialOptions?: Options | (() => Options);
  persist?: BiuStorePersistOptions<BiuTabStoreState<Tab, Params, Options> & BiuTabStoreActions<Tab, Params, Options>>;
}) {
  if (!options.tabs.length) throw new Error("createBiuTabStore requires at least one tab");
  const first = options.tabs[0];
  const paramsFor = (tab: Tab) =>
    clone(typeof options.initialParams === "function" ? options.initialParams(tab) : options.initialParams) as Params;
  return createBiuStore<BiuTabStoreState<Tab, Params, Options>, BiuTabStoreActions<Tab, Params, Options>>({
    name: options.name,
    initialState: () => ({
      activeTab: first,
      tabState: Object.fromEntries(options.tabs.map((tab) => [tab, { queryParams: paramsFor(tab) }])) as Record<
        Tab,
        { queryParams: Params }
      >,
      counters: {},
      options: clone(
        typeof options.initialOptions === "function"
          ? options.initialOptions()
          : (options.initialOptions ?? ({} as Options)),
      ),
    }),
    persist: options.persist,
    actions: ({ set, get, reset }) =>
      ({
        setActiveTab: (tab) => {
          if (options.tabs.includes(tab)) set({ activeTab: tab });
        },
        patchTabParams: (patch, tab = get().activeTab) =>
          set((state) => ({
            tabState: { ...state.tabState, [tab]: { queryParams: { ...state.tabState[tab].queryParams, ...patch } } },
          })),
        resetTabParams: (tab = get().activeTab) =>
          set((state) => ({ tabState: { ...state.tabState, [tab]: { queryParams: paramsFor(tab) } } })),
        setCounter: (key, value) => set((state) => ({ counters: { ...state.counters, [key]: value } })),
        setOptions: (next) => set((state) => ({ options: { ...state.options, ...next } })),
        reset,
      }) as BiuTabStoreActions<Tab, Params, Options>,
  });
}
