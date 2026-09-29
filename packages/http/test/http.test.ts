import assert from "node:assert/strict";
import test from "node:test";
import type { AxiosAdapter, InternalAxiosRequestConfig } from "axios";
import { XHttpClass, stableSerialize } from "../src/index.js";

function adapter(data: unknown, status = 200) {
  return async (config: Parameters<AxiosAdapter>[0]) => ({
    data,
    status,
    statusText: status === 200 ? "OK" : "Bad Request",
    headers: {},
    config,
    request: {},
  });
}

function response(data: unknown, config: InternalAxiosRequestConfig, status = 200) {
  return { data, status, statusText: status === 200 ? "OK" : "Bad Request", headers: {}, config, request: {} };
}

test("request returns typed data and runs the result adaptor", async () => {
  const client = new XHttpClass({ formatResultAdaptor: (data) => data }, { adapter: adapter({ value: 2 }) });
  assert.deepEqual(await client.get<{ value: number }>("/demo"), { value: 2 });
});

test("duplicate requests use stable object keys and cancel the previous request", async () => {
  assert.equal(stableSerialize({ b: 2, a: 1 }), stableSerialize({ a: 1, b: 2 }));
  let aborted = false;
  let calls = 0;
  const client = new XHttpClass(
    {},
    {
      adapter: async (config) => {
        calls += 1;
        if (calls > 1) {
          return {
            data: { ok: true },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
            request: {},
          };
        }
        await new Promise<void>((resolve) => {
          config.signal?.addEventListener?.(
            "abort",
            () => {
              aborted = true;
              resolve();
            },
            { once: true },
          );
        });
        throw new DOMException("Aborted", "AbortError");
      },
    },
  );
  const first = client.get("/same", { a: 1 }).catch(() => undefined);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(await client.get("/same", { a: 1 }), { ok: true });
  await first;
  assert.equal(aborted, true);
});

test("empty header values remain set and cancel is explicit", () => {
  const client = new XHttpClass();
  client.setHeader("X-Demo", "");
  assert.equal(client.getHeader("X-Demo"), "");
  client.setHeader("X-Demo");
  assert.equal(client.getHeader("X-Demo"), undefined);
  assert.equal(client.isCancel(new DOMException("Aborted", "AbortError")), true);
});

test("whitelist requests do not cancel each other but can be cancelled as a group", async () => {
  let aborted = 0;
  const client = new XHttpClass(
    {},
    {
      adapter: async (config) => {
        await new Promise<void>((resolve) => {
          config.signal?.addEventListener?.(
            "abort",
            () => {
              aborted += 1;
              resolve();
            },
            { once: true },
          );
        });
        throw new DOMException("Aborted", "AbortError");
      },
    },
  );
  const first = client.get("/parallel", { same: true }, {}, true).catch(() => undefined);
  const second = client.get("/parallel", { same: true }, {}, true).catch(() => undefined);
  await new Promise((resolve) => setTimeout(resolve, 0));
  client.cancelWhiteListRequest("leave");
  await Promise.all([first, second]);
  assert.equal(aborted, 2);
});

test("cancelRequest cancels non-duplicate requests and raw requests preserve response metadata", async () => {
  let captured: InternalAxiosRequestConfig | undefined;
  const client = new XHttpClass(
    { cancelDuplicatedRequest: false },
    {
      adapter: async (config) => {
        captured = config;
        return response({ ok: true }, config);
      },
    },
  );
  const raw = await client.requestRaw<{ ok: boolean }>("GET", "/raw");
  assert.equal(raw.data.ok, true);
  assert.equal(raw.status, 200);
  assert.equal(captured?.method, "get");

  let aborted = false;
  const pendingClient = new XHttpClass(
    { cancelDuplicatedRequest: false },
    {
      adapter: async (config) => {
        await new Promise<void>((resolve) =>
          config.signal?.addEventListener?.(
            "abort",
            () => {
              aborted = true;
              resolve();
            },
            { once: true },
          ),
        );
        throw new DOMException("Aborted", "AbortError");
      },
    },
  );
  const pending = pendingClient.get("/pending").catch(() => undefined);
  await new Promise((resolve) => setTimeout(resolve, 0));
  pendingClient.cancelRequest("route changed");
  await pending;
  assert.equal(aborted, true);
});

test("error handlers do not swallow errors unless explicitly configured", async () => {
  const rejecting = new XHttpClass(
    { errorHandler: () => ({ fallback: true }) },
    {
      adapter: async () => {
        throw new Error("boom");
      },
    },
  );
  await assert.rejects(() => rejecting.get("/error"), /boom/);

  const handled = new XHttpClass(
    { rejectErrorPromise: false, errorHandler: () => ({ fallback: true }) },
    {
      adapter: async () => {
        throw new Error("boom");
      },
    },
  );
  assert.deepEqual(await handled.get("/error"), { fallback: true });
});

test("form and file helpers preserve the original field names and headers", async () => {
  const requests: Array<{ data: unknown; headers: unknown }> = [];
  const client = new XHttpClass(
    {},
    {
      adapter: async (config) => {
        requests.push({ data: config.data, headers: config.headers });
        return response({ ok: true }, config);
      },
    },
  );
  await client.postForm("/form", { tags: ["a", "b"], meta: { source: "demo" } }, true, true);
  const form = requests[0]?.data as FormData;
  assert.deepEqual(
    [...form.entries()].map(([key, value]) => [key, String(value)]),
    [
      ["tags[]", "a"],
      ["tags[]", "b"],
      ["meta", JSON.stringify({ source: "demo" })],
    ],
  );
  assert.equal(
    (requests[0]?.headers as Record<string, unknown>)["Content-Type"],
    "application/x-www-form-urlencoded;charset=UTF-8;",
  );

  const file = new Blob(["demo"], { type: "text/plain" }) as File;
  await client.postFile("/file", [file, file], "files", true, true);
  const files = requests[1]?.data as FormData;
  assert.deepEqual(
    [...files.entries()].map(([key]) => key),
    ["files[]", "files[]"],
  );
});

test("instance helpers update base URL, timeout and authorization without dropping empty values", () => {
  const client = new XHttpClass();
  client.setBaseURL("/api").setRequestTimeout(1500).setAuthToken("Bearer demo").setHeader("X-Empty", "");
  assert.equal(client.getBaseURL(), "/api");
  assert.equal(client.timeout, 1500);
  assert.equal(client.getAuthToken(), "Bearer demo");
  assert.equal(client.getHeader("X-Empty"), "");
});
