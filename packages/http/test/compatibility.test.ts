import assert from "node:assert/strict";
import test from "node:test";
import { Axios, CODE_MSG, XHttpClass, XHttpMethod, XHttpUtils, type RequestConfig } from "../src/index.js";

function response(data: unknown, config: any, status = 200) {
  return { data, status, statusText: status === 200 ? "OK" : "Bad Request", headers: {}, config, request: {} };
}

test("preserves the original public exports and method defaults", async () => {
  assert.equal(XHttpMethod.GET, "GET");
  assert.equal(XHttpMethod.get, "GET");
  assert.equal(typeof Axios.get, "function");
  assert.equal(XHttpUtils.getInstance(), XHttpUtils.getInstance());
  assert.equal(XHttpUtils.typeof(null), "null");
  assert.equal(CODE_MSG[200], "服务器成功返回请求的数据。");
  const legacyConfig: RequestConfig = { legacyProjectField: true };
  assert.equal(legacyConfig.legacyProjectField, true);
  const calls: any[] = [];
  const client = new XHttpClass(
    {},
    {
      adapter: async (config) => {
        calls.push(config);
        return response({ ok: true }, config);
      },
    },
  );
  assert.deepEqual(await client.request("GET", "/request"), { ok: true });
  assert.deepEqual(await client.axiosRequest("/axios", { method: "POST", data: { value: 1 } }), { ok: true });
  assert.deepEqual(await client.allInRequest({ url: "/all", method: "PUT" }), { ok: true });
  assert.equal(calls[0]?.method, "get");
  assert.equal(calls[1]?.method, "post");
  assert.equal(calls[2]?.method, "put");
});

test("keeps the complete ts-xhttp instance method surface", () => {
  const client = new XHttpClass();
  const methods = [
    "request",
    "axiosRequest",
    "allInRequest",
    "get",
    "post",
    "put",
    "patch",
    "delete",
    "postForm",
    "postFile",
    "upload",
    "cancelRequest",
    "cancelWhiteListRequest",
    "getCancelToken",
    "getBaseURL",
    "setBaseURL",
    "getHeaders",
    "setHeaders",
    "getHeader",
    "setHeader",
    "setRequestTimeout",
    "getAuthToken",
    "setAuthToken",
    "isCancel",
    "getInstance",
    "create",
  ] as const;
  for (const method of methods) assert.equal(typeof client[method], "function", method);
});

test("calls lifecycle hooks in request/response/finally order and preserves adaptor data semantics", async () => {
  const order: string[] = [];
  const client = new XHttpClass(
    {
      requestHandler: (config) => {
        order.push(`request:${config.method}`);
      },
      responseHandler: (response) => {
        order.push(`response:${response.status}`);
      },
      requestFinally: (config) => {
        order.push(`finally:${config.url}`);
      },
      formatResultAdaptor: (data) => ({ wrapped: (data as { value: number }).value }),
    },
    {
      adapter: async (config) => {
        order.push("adapter");
        return response({ value: 3 }, config);
      },
    },
  );
  assert.deepEqual(await client.get("/hooks"), { wrapped: 3 });
  assert.deepEqual(order, ["request:GET", "adapter", "response:200", "finally:/hooks"]);
});

test("config adaptor overrides the instance adaptor and requestRaw stays a raw additive API", async () => {
  const client = new XHttpClass(
    { formatResultAdaptor: (data) => ({ source: "instance", data }) },
    { adapter: async (config) => response({ value: 1 }, config) },
  );
  assert.deepEqual(await client.get("/adaptor", {}, { formatResultAdaptor: (data) => ({ source: "request", data }) }), {
    source: "request",
    data: { value: 1 },
  });
  const raw = await client.requestRaw("GET", "/raw");
  assert.equal(raw.status, 200);
  assert.deepEqual(raw.data, { value: 1 });
});

test("preserves header preparation order and uses the prepared config for hooks", async () => {
  const order: string[] = [];
  const client = new XHttpClass(
    {
      setRequestHeaders: (config) => {
        order.push("headers");
        return { ...config, headers: { ...config.headers, "X-Test": "yes" } };
      },
      requestHandler: (config) => order.push(`request:${config.headers?.["X-Test"]}`),
      responseHandler: (response) => order.push(`response:${response.status}`),
      requestFinally: (config) => order.push(`finally:${config.headers?.["X-Test"]}`),
    },
    { adapter: async (config) => response({ ok: true }, config) },
  );
  assert.deepEqual(await client.get("/prepared"), { ok: true });
  assert.deepEqual(order, ["headers", "request:yes", "response:200", "finally:yes"]);
});

test("runs error and finally hooks when a request hook throws before Axios", async () => {
  const order: string[] = [];
  const client = new XHttpClass(
    {
      requestHandler: () => {
        order.push("request");
        throw new Error("request-hook-failed");
      },
      errorHandler: (error) => {
        order.push(`error:${(error as Error).message}`);
      },
      requestFinally: (config) => order.push(`finally:${config.url}`),
    },
    {
      adapter: async () => {
        order.push("adapter");
        return response({ ok: true }, {});
      },
    },
  );
  await assert.rejects(() => client.get("/request-hook"), /request-hook-failed/);
  assert.deepEqual(order, ["request", "error:request-hook-failed", "finally:/request-hook"]);
});

test("runs error and finally hooks when setRequestHeaders returns an invalid config", async () => {
  const order: string[] = [];
  const client = new XHttpClass({
    setRequestHeaders: () => undefined as never,
    errorHandler: (error) => order.push(`error:${(error as Error).message}`),
    requestFinally: (config) => order.push(`finally:${config.url}`),
  });
  await assert.rejects(
    () => client.get("/invalid-headers"),
    /XHttp Error: \[setRequestHeaders\] must be a function, and return a complete object value\(RequestConfig\)/,
  );
  assert.deepEqual(order, [
    "error:XHttp Error: [setRequestHeaders] must be a function, and return a complete object value(RequestConfig) without missing original attributes!",
    "finally:/invalid-headers",
  ]);
});

test("normalizes response errors for errorHandler while preserving rejection by default", async () => {
  let received: unknown;
  const client = new XHttpClass(
    {
      errorHandler: (error) => {
        received = error;
        return { fallback: true };
      },
    },
    {
      adapter: async (config) => {
        throw { response: response({ code: "INVALID" }, config, 422) };
      },
    },
  );
  await assert.rejects(() => client.get("/invalid"));
  assert.equal((received as { status: number }).status, 422);
  assert.deepEqual((received as { data: unknown }).data, { code: "INVALID" });
});

test("does not replace a caller CancelToken when duplicate cancellation is enabled", async () => {
  const client = new XHttpClass({}, { adapter: async (config) => response({ signal: config.cancelToken }, config) });
  const source = client.getCancelToken();
  const result = await client.get<{ signal: unknown }>("/cancel-token", {}, { cancelToken: source.token });
  assert.equal(result.signal, source.token);
});

test("legacy hooks can observe generated CancelToken and cancelRequest while AbortSignal remains available", async () => {
  let hookConfig: RequestConfig | undefined;
  const client = new XHttpClass(
    {
      requestHandler: (config) => {
        hookConfig = config;
      },
    },
    { adapter: async (config) => response({ ok: true }, config) },
  );
  await client.get("/legacy-cancel-surface");
  assert.ok(hookConfig?.cancelToken);
  assert.equal(typeof hookConfig?.cancelRequest, "function");
  assert.ok(hookConfig?.signal);
});

test("postForm preserves legacy array/object encoding and postFile brackets", async () => {
  const payloads: any[] = [];
  const client = new XHttpClass(
    {},
    {
      adapter: async (config) => {
        payloads.push(config);
        return response({ ok: true }, config);
      },
    },
  );
  await client.postForm("/form", { tags: ["a", "b"], meta: { source: "test" } }, false, false);
  assert.deepEqual(
    [...payloads[0].data.entries()].map(([key, value]: [string, unknown]) => [key, String(value)]),
    [
      ["tags", "a"],
      ["tags", "b"],
      ["meta", JSON.stringify({ source: "test" })],
    ],
  );
  assert.equal(payloads[0].headers["Content-Type"], "application/x-www-form-urlencoded;charset=UTF-8;");
  const file = new Blob(["demo"], { type: "text/plain" }) as File;
  await client.postFile("/file", [file, file], "files", true, false);
  assert.deepEqual(
    [...payloads[1].data.entries()].map(([key]: [string, unknown]) => key),
    ["files[0]", "files[1]"],
  );
});

test("legacy method wrappers preserve payload placement, defaults and whitelist semantics", async () => {
  const calls: any[] = [];
  const client = new XHttpClass(
    { cancelDuplicatedRequest: true },
    {
      adapter: async (config) => {
        calls.push(config);
        return response({ ok: true }, config, 201);
      },
    },
  );
  await client.get("/get", { page: 2 });
  await client.post("/post", { name: "Biu" });
  await client.put("/put", { enabled: true });
  await client.patch("/patch", { title: "new" });
  await client.delete("/delete", { id: 7 });
  await client.axiosRequest("/white", { method: "GET", isWhiteList: true });
  assert.deepEqual(
    calls.map((config) => [config.method, config.url, config.params, config.data]),
    [
      ["get", "/get", { page: 2 }, undefined],
      ["post", "/post", undefined, JSON.stringify({ name: "Biu" })],
      ["put", "/put", undefined, JSON.stringify({ enabled: true })],
      ["patch", "/patch", undefined, JSON.stringify({ title: "new" })],
      ["delete", "/delete", undefined, JSON.stringify({ id: 7 })],
      ["get", "/white", undefined, undefined],
    ],
  );
  assert.equal(calls.at(-1)?.isWhiteList, true);
});

test("low-level request keeps the positional whitelist flag authoritative", async () => {
  const observed: boolean[] = [];
  const client = new XHttpClass(
    {
      requestHandler: (config) => observed.push(config.isWhiteList === true),
    },
    { adapter: async (config) => response({ ok: true }, config) },
  );

  await client.request("GET", "/positional-default", { isWhiteList: true });
  await client.request("GET", "/positional-explicit", { isWhiteList: false }, true);
  assert.deepEqual(observed, [false, true]);
});

test("retry follows ts-xhttp network defaults and does not retry explicit custom errors", async () => {
  let attempts = 0;
  const client = new XHttpClass(
    { retryConfig: { retry: 1, delay: 0 } },
    {
      adapter: async (config) => {
        attempts += 1;
        if (attempts === 1) throw Object.assign(new Error("network"), { code: "ECONNRESET", config, request: {} });
        return response({ retried: true }, config);
      },
    },
  );
  assert.deepEqual(await client.get("/retry"), { retried: true });
  assert.equal(attempts, 2);

  let customAttempts = 0;
  const custom = new XHttpClass(
    { retryConfig: { retry: 2, delay: 0 } },
    {
      adapter: async () => {
        customAttempts += 1;
        throw new Error("custom-error");
      },
    },
  );
  await assert.rejects(() => custom.get("/custom-error"));
  assert.equal(customAttempts, 1);

  let abortedAttempts = 0;
  const aborted = new XHttpClass(
    { retryConfig: { retry: 2, delay: 0 } },
    {
      adapter: async (config) => {
        abortedAttempts += 1;
        throw Object.assign(new Error("aborted by policy"), { code: "ECONNABORTED", config });
      },
    },
  );
  await assert.rejects(() => aborted.get("/aborted-policy"));
  assert.equal(abortedAttempts, 1);
});

test("rejectErrorPromise false keeps the original error-handler fallback contract", async () => {
  const client = new XHttpClass(
    {
      rejectErrorPromise: false,
      errorHandler: (error) => ({ handled: true, status: (error as { status?: number }).status }),
    },
    {
      adapter: async (config) => {
        throw { response: response({ code: "BAD" }, config, 400) };
      },
    },
  );
  assert.deepEqual(await client.get("/fallback"), { handled: true, status: 400 });
});

test("cancelRequest and AbortSignal cancel requests without leaving pending entries", async () => {
  const client = new XHttpClass(
    { cancelDuplicatedRequest: false },
    {
      adapter: async (config) =>
        new Promise((_resolve, reject) => {
          const signal = config.signal;
          if (!signal) return reject(new Error("request signal missing"));
          if (typeof signal.addEventListener !== "function") return reject(new Error("abort listener missing"));
          signal.addEventListener("abort", () => reject(new Error("cancelled")), { once: true });
        }),
    },
  );
  const request = client.get("/cancel-all");
  client.cancelRequest("route changed");
  await assert.rejects(request);
  const controller = new AbortController();
  const signalRequest = client.get("/cancel-signal", {}, { signal: controller.signal });
  controller.abort("caller cancelled");
  await assert.rejects(signalRequest);
});

test("white-list requests retain their independent cancellation group", async () => {
  const client = new XHttpClass(
    {},
    {
      adapter: async (config) =>
        new Promise((_resolve, reject) => {
          const signal = config.signal;
          if (signal?.addEventListener) {
            signal.addEventListener("abort", () => reject(new Error("white-list-cancelled")), { once: true });
          }
        }),
    },
  );
  const request = client.get("/white-list-cancel", {}, {}, true);
  client.cancelWhiteListRequest("route changed");
  await assert.rejects(request);
});

test("axiosRequest accepts both legacy overloads and allInRequest defaults the method", async () => {
  const calls: any[] = [];
  const client = new XHttpClass(
    {},
    {
      adapter: async (config) => {
        calls.push(config);
        return response({ ok: true }, config);
      },
    },
  );
  await client.axiosRequest({ url: "/object-config", method: "PATCH", data: { value: 1 } });
  await client.axiosRequest("/string-config", { method: "POST", data: { value: 2 } });
  await client.allInRequest({ url: "/default-get" });
  assert.deepEqual(
    calls.map((config) => [config.method, config.url]),
    [
      ["patch", "/object-config"],
      ["post", "/string-config"],
      ["get", "/default-get"],
    ],
  );
});

test("base URL, headers, auth and timeout setters preserve fluent instance behavior", () => {
  const client = new XHttpClass({ baseURL: "/api" });
  assert.equal(client.getBaseURL(), "/api");
  assert.equal(client.setBaseURL("/v2"), client);
  assert.equal(client.getBaseURL(), "/v2");
  assert.equal(client.setHeader("X-Debug", "yes"), client);
  assert.equal(client.getHeader("X-Debug"), "yes");
  assert.equal(client.setAuthToken("Bearer demo"), client);
  assert.equal(client.getAuthToken(), "Bearer demo");
  assert.equal(client.setRequestTimeout(1200), client);
  assert.equal(client.instance.defaults.timeout, 1200);
  assert.equal(client.setHeader("X-Debug"), client);
  assert.equal(client.getHeader("X-Debug"), undefined);
});

test("upload is an additive alias and form helpers preserve every bracket mode", async () => {
  const payloads: any[] = [];
  const client = new XHttpClass(
    {},
    {
      adapter: async (config) => {
        payloads.push(config);
        return response({ ok: true }, config);
      },
    },
  );
  await client.postForm("/brackets", { ids: [1, 2] }, true, true);
  await client.upload("/upload", new Blob(["file"], { type: "text/plain" }) as File, "asset");
  assert.deepEqual([...payloads[0].data.keys()], ["ids[]", "ids[]"]);
  assert.deepEqual([...payloads[1].data.keys()], ["asset"]);
});

test("postForm preserves the complete legacy bracket/index matrix", async () => {
  const payloads: FormData[] = [];
  const client = new XHttpClass(
    {},
    {
      adapter: async (config) => {
        payloads.push(config.data as FormData);
        return response({ ok: true }, config);
      },
    },
  );
  await client.postForm("/plain", { ids: ["a", "b"] }, false, false);
  await client.postForm("/plain-index-ignored", { ids: ["a", "b"] }, false, true);
  await client.postForm("/bracketed", { ids: ["a", "b"] }, true, false);
  await client.postForm("/bracketed-index", { ids: ["a", "b"] }, true, true);
  assert.deepEqual([...payloads[0].keys()], ["ids", "ids"]);
  assert.deepEqual([...payloads[1].keys()], ["ids", "ids"]);
  assert.deepEqual([...payloads[2].keys()], ["ids[0]", "ids[1]"]);
  assert.deepEqual([...payloads[3].keys()], ["ids[]", "ids[]"]);
});

test("postFile preserves repeated, indexed and bracketed field names", async () => {
  const payloads: FormData[] = [];
  const client = new XHttpClass(
    {},
    {
      adapter: async (config) => {
        payloads.push(config.data as FormData);
        return response({ ok: true }, config);
      },
    },
  );
  const file = new Blob(["demo"], { type: "text/plain" }) as File;
  await client.postFile("/same", [file, file], "files");
  await client.postFile("/indexed", [file, file], "files", true, false);
  await client.postFile("/bracketed", [file, file], "files", true, true);
  assert.deepEqual([...payloads[0].keys()], ["files", "files"]);
  assert.deepEqual([...payloads[1].keys()], ["files[0]", "files[1]"]);
  assert.deepEqual([...payloads[2].keys()], ["files[]", "files[]"]);
});
