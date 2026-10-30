import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import { test } from "node:test";
import { createDevManifestMiddleware } from "../src/dev-manifest.js";

test("dev update manifest is JSON for GET/HEAD and precedes the SPA fallback", async () => {
  const manifest = { buildId: "dev-test", appId: "standalone", environment: "local", selectedCodes: ["Welcome"] };
  const middleware = createDevManifestMiddleware(JSON.stringify(manifest));
  const server = createServer((request, response) =>
    middleware(request, response, () => {
      response.setHeader("Content-Type", "text/html");
      response.end("<!doctype html><title>SPA fallback</title>");
    }),
  );
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  try {
    for (const path of ["/manifest/routes.json", "/manifest/routes.json?navigation=1"]) {
      const response = await fetch(`${base}${path}`);
      assert.equal(response.status, 200);
      assert.match(response.headers.get("content-type") ?? "", /^application\/json/);
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.deepEqual(await response.json(), manifest);
    }
    const head = await fetch(`${base}/manifest/routes.json`, { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.match(head.headers.get("content-type") ?? "", /^application\/json/);
    assert.equal(await head.text(), "");
    const page = await fetch(`${base}/Dashboard`);
    assert.match(await page.text(), /SPA fallback/);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolveClose) => server.close(() => resolveClose()));
  }
});
