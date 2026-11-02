import assert from "node:assert/strict";
import test from "node:test";
import { createBiuStore, createBiuTabStore, omitSensitiveState } from "../src/standard.js";

test("standard store creates isolated initial state and typed reset/actions", () => {
  const useStore = createBiuStore({
    initialState: () => ({ count: 0, nested: { value: 1 } }),
    actions: ({ set, reset }) => ({
      increment: () => set((state) => ({ count: state.count + 1 })),
      reset,
    }),
  });
  useStore.getState().increment();
  useStore.getState().nested.value = 9;
  assert.equal(useStore.getState().count, 1);
  useStore.getState().reset();
  assert.deepEqual(useStore.getState().nested, { value: 1 });
  assert.equal(useStore.getState().count, 0);
  assert.deepEqual(omitSensitiveState({ token: "secret", profile: { name: "Biu", password: "hidden" } }), {
    profile: { name: "Biu" },
  });
});

test("tab store keeps filters and counters isolated by active tab", () => {
  const useStore = createBiuTabStore({
    tabs: ["all", "pending"] as const,
    initialParams: (tab) => ({ keyword: tab }),
  });
  const state = useStore.getState();
  state.patchTabParams({ keyword: "first" });
  state.setActiveTab("pending");
  state.patchTabParams({ keyword: "second" });
  state.setCounter("pending", 3);
  assert.equal(useStore.getState().tabState.all.queryParams.keyword, "first");
  assert.equal(useStore.getState().tabState.pending.queryParams.keyword, "second");
  assert.equal(useStore.getState().counters.pending, 3);
});

test("initial snapshot is stable and retains actions after state updates", () => {
  const useStore = createBiuStore({
    initialState: () => ({ count: 0 }),
    actions: ({ set, reset }) => ({
      increment: () => set((state) => ({ count: state.count + 1 })),
      reset,
    }),
  });
  const initial = useStore.getInitialState();
  assert.strictEqual(useStore.getInitialState(), initial);
  assert.strictEqual(initial.increment, useStore.getState().increment);
  assert.strictEqual(initial.reset, useStore.getState().reset);
  initial.increment();
  assert.equal(useStore.getState().count, 1);
  assert.equal(initial.count, 0);
  assert.strictEqual(useStore.getInitialState(), initial);
});
