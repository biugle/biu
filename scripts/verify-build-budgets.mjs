// Measure shipped, compressed JS/CSS after Demo builds and fail closed when a
// Demo has no assets; Preset is additionally constrained to one shared CSS.
import { gzipSync } from "node:zlib";
import { readdir, readFile } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const demoApps = ["main-a", "main-b", "child-app", "vue-child", "html-child", "layout-custom"];
const kib = 1024;
const limits = {
  singleJavaScriptGzip: 280 * kib,
  totalJavaScriptGzip: 900 * kib,
  totalCssGzip: 220 * kib,
  totalGzip: 1120 * kib,
  presetCssGzip: 128 * kib,
};

async function filesUnder(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = resolve(directory, entry.name);
      return entry.isDirectory() ? filesUnder(path) : [path];
    }),
  );
  return nested.flat();
}

const failures = [];
const presetCss = (await filesUnder(resolve(root, "packages/preset/dist"))).filter((path) => extname(path) === ".css");
if (presetCss.length !== 1 || relative(root, presetCss[0] ?? "") !== "packages/preset/dist/styles.css") {
  failures.push(
    `Preset must publish one shared CSS output at packages/preset/dist/styles.css; found ${
      presetCss.map((path) => relative(root, path)).join(", ") || "none"
    }`,
  );
}

if (presetCss[0]) {
  const compressed = gzipSync(await readFile(presetCss[0])).byteLength;
  if (compressed > limits.presetCssGzip) {
    failures.push(`Preset shared CSS is ${(compressed / kib).toFixed(1)} KiB gzip; limit is 128 KiB`);
  }
  console.log(`[biu] Preset CSS ${relative(root, presetCss[0])}: ${(compressed / kib).toFixed(1)} KiB gzip`);
}

for (const app of demoApps) {
  const directory = resolve(root, "examples/dev-demo/apps", app, "dist");
  const assets = (await filesUnder(directory)).filter((path) => [".js", ".css"].includes(extname(path)));
  if (!assets.length) {
    failures.push(`Missing built JS/CSS assets for Demo ${app}`);
    continue;
  }

  const measured = await Promise.all(
    assets.map(async (path) => ({
      path,
      extension: extname(path),
      gzipBytes: gzipSync(await readFile(path)).byteLength,
    })),
  );
  const js = measured.filter((asset) => asset.extension === ".js");
  const css = measured.filter((asset) => asset.extension === ".css");
  const totalJs = js.reduce((sum, asset) => sum + asset.gzipBytes, 0);
  const totalCss = css.reduce((sum, asset) => sum + asset.gzipBytes, 0);
  const total = totalJs + totalCss;
  const largestJs = js.reduce((largest, asset) => (asset.gzipBytes > largest.gzipBytes ? asset : largest), {
    path: "",
    gzipBytes: 0,
  });

  if (largestJs.gzipBytes > limits.singleJavaScriptGzip) {
    failures.push(`${app} largest JS asset is ${(largestJs.gzipBytes / kib).toFixed(1)} KiB gzip; limit is 280 KiB`);
  }
  if (totalJs > limits.totalJavaScriptGzip) {
    failures.push(`${app} JS total is ${(totalJs / kib).toFixed(1)} KiB gzip; limit is 900 KiB`);
  }
  if (totalCss > limits.totalCssGzip) {
    failures.push(`${app} CSS total is ${(totalCss / kib).toFixed(1)} KiB gzip; limit is 220 KiB`);
  }
  if (total > limits.totalGzip) {
    failures.push(`${app} JS + CSS total is ${(total / kib).toFixed(1)} KiB gzip; limit is 1120 KiB`);
  }

  console.log(
    `[biu] ${app}: JS ${(totalJs / kib).toFixed(1)} KiB gzip, CSS ${(totalCss / kib).toFixed(1)} KiB gzip, largest JS ${(largestJs.gzipBytes / kib).toFixed(1)} KiB (${relative(root, largestJs.path)})`,
  );
}

if (failures.length) {
  throw new Error(`Build budget exceeded:\n- ${failures.join("\n- ")}`);
}

console.log(`[biu] all Demo and Preset build budgets passed`);
