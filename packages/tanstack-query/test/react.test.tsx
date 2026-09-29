import assert from "node:assert/strict";
import test from "node:test";
import { createBiuReactQueryClient, BiuQueryClientProvider } from "../src/react.js";

test("React binding creates a QueryClient without requiring a DOM", () => {
  const client = createBiuReactQueryClient();
  assert.ok(client.getQueryCache());
  assert.equal(typeof BiuQueryClientProvider, "function");
});
