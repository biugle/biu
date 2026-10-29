import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { generateEntry, shouldIncludeLayout } from "../src/project-generator.js";
import type { BiuConfig, DiscoveryResult } from "../src/types.js";

async function createFixture(config: BiuConfig) {
  const root = await mkdtemp(join(tmpdir(), "biu-layout-policy-test-"));
  await mkdir(join(root, "src/pages/PageA"), { recursive: true });
  await writeFile(join(root, "src/pages/PageA/index.tsx"), "export default function PageA() { return null; }\n");
  const discovery: DiscoveryResult = {
    config,
    routes: [{ code: "PageA", type: "MENU", target: config.projectType, source: config.projectType }],
    menus: [],
    fallbackMenus: [],
    selectedCodes: ["PageA"],
  };
  return { root, discovery };
}

test("APP layout is available in development and omitted from production when configured", async () => {
  const { root, discovery } = await createFixture({
    appId: "child-app",
    projectType: "APP",
    layout: { preset: "sidebar", includeInDevelopment: true, includeInBuild: false },
  });
  try {
    const devEntry = await readFile(generateEntry(root, discovery, "dev"), "utf8");
    const buildEntry = await readFile(generateEntry(root, discovery, "build"), "utf8");

    assert.match(devEntry, /@biugle\/biu-preset\/sidebar/);
    assert.match(devEntry, /@biugle\/biu-preset\/sidebar\.css/);
    assert.doesNotMatch(buildEntry, /@biugle\/biu-preset\/sidebar/);
    assert.doesNotMatch(buildEntry, /includeInDevelopment|includeInBuild/);
    assert.match(buildEntry, /layoutComponent: undefined/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("APP development and production layout inclusion can be selected independently", async () => {
  const { root, discovery } = await createFixture({
    appId: "child-app",
    projectType: "APP",
    layout: { preset: "sidebar", includeInDevelopment: false, includeInBuild: true },
  });
  try {
    assert.equal(shouldIncludeLayout(discovery, "dev"), false);
    assert.equal(shouldIncludeLayout(discovery, "build"), true);
    const devEntry = await readFile(generateEntry(root, discovery, "dev"), "utf8");
    const buildEntry = await readFile(generateEntry(root, discovery, "build"), "utf8");
    assert.doesNotMatch(devEntry, /@biugle\/biu-preset\/sidebar/);
    assert.match(buildEntry, /@biugle\/biu-preset\/sidebar/);
    assert.match(buildEntry, /@biugle\/biu-preset\/sidebar\.css/);
    assert.match(buildEntry, /layoutComponent: CustomLayout/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("legacy APP config without layout policy keeps its existing layout in both modes", async () => {
  const { root, discovery } = await createFixture({
    appId: "legacy-app",
    projectType: "APP",
    layout: { preset: "sidebar" },
  });
  try {
    assert.equal(shouldIncludeLayout(discovery, "dev"), true);
    assert.equal(shouldIncludeLayout(discovery, "build"), true);
    const buildEntry = await readFile(generateEntry(root, discovery, "build"), "utf8");
    assert.match(buildEntry, /@biugle\/biu-preset\/sidebar/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Portal always includes its configured layout, regardless of APP-only flags", async () => {
  const { root, discovery } = await createFixture({
    appId: "portal-main",
    projectType: "PORTAL",
    portal: { code: "portal-main" },
    layout: { preset: "sidebar", includeInDevelopment: false, includeInBuild: false },
  });
  try {
    assert.equal(shouldIncludeLayout(discovery, "dev"), true);
    assert.equal(shouldIncludeLayout(discovery, "build"), true);
    const buildEntry = await readFile(generateEntry(root, discovery, "build"), "utf8");
    assert.match(buildEntry, /@biugle\/biu-preset\/sidebar/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
