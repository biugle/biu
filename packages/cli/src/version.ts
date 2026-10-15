import { readFileSync } from "node:fs";

const packageManifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  version: string;
};

/** Exact CLI package version, shared by source and built entry points. */
export const BIU_CLI_VERSION = packageManifest.version;

/** Stable semver baseline used for generated project dependencies. */
export const BIU_RELEASE_VERSION = "1.0.0";
