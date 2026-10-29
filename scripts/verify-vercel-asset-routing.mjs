// Guard route order so missing hashed assets cannot be rewritten to a cached
// SPA document, which browsers would otherwise accept as a successful script.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

const config = JSON.parse(readFileSync(resolve(process.cwd(), "vercel.json"), "utf8"));
const routes = config.routes;
assert.ok(Array.isArray(routes), "vercel.json must use ordered routes for SPA asset protection");
assert.equal(routes[0]?.handle, "filesystem", "existing build files must be served before fallback routes");

const spaFallback = routes.find((route) => route.dest === "/index.html");
assert.ok(spaFallback, "extensionless client routes must fall back to index.html");
assert.ok(new RegExp(spaFallback.src).test("/ComponentUIShowcase"), "SPA fallback must match a normal client route");
assert.equal(spaFallback.headers?.["Cache-Control"], "no-cache, no-store, must-revalidate");

const missingAssetRoute = routes.find((route) => route.status === 404);
assert.ok(missingAssetRoute, "missing file-like paths must return 404 instead of the SPA document");
const missingAssetPattern = new RegExp(missingAssetRoute.src);
for (const path of ["/b46ebfbd.js", "/assets/page-chunk.mjs", "/assets/styles.css", "/assets/page.js.map"]) {
  assert.ok(missingAssetPattern.test(path), `missing asset route must catch ${path}`);
}
assert.equal(missingAssetRoute.headers?.["Cache-Control"], "no-store, max-age=0, must-revalidate");

const indexHeaders = config.headers?.find((entry) => entry.source === "/index.html")?.headers ?? [];
assert.ok(
  indexHeaders.some(
    (header) => header.key === "Cache-Control" && header.value === "no-cache, no-store, must-revalidate",
  ),
  "the SPA document must be revalidated so it cannot pin old chunk hashes",
);

console.log("[biu] Vercel routing guard passed: missing hashed assets cannot fall through to cached index.html.");
