import { readFileSync } from "node:fs";
import { templatePackages } from "./template-packages.js";

const packageManifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  version: string;
};

/** Exact CLI package version, shared by source and built entry points. */
export const BIU_CLI_VERSION = packageManifest.version;

/** Initial version assigned to the generated business project itself. */
export const BIU_RELEASE_VERSION = "1.0.0";

// tsup embeds the current manifests at build time, so a published CLI never
// depends on sibling source directories. Running source tests uses the same
// version contract directly from the checkout after Changesets updates it.
const bundledTemplateVersions = process.env.BIU_TEMPLATE_PACKAGE_VERSIONS;
export const BIU_TEMPLATE_PACKAGE_VERSIONS: Record<string, string> = bundledTemplateVersions
  ? JSON.parse(bundledTemplateVersions)
  : Object.fromEntries(
      templatePackages.map(([directory, name]) => {
        const manifest = JSON.parse(
          readFileSync(new URL(`../../${directory}/package.json`, import.meta.url), "utf8"),
        ) as { version: string };
        return [name, manifest.version];
      }),
    );

/** React templates install the optional React Query peer used by the React entrypoint. */
export const BIU_TEMPLATE_REACT_QUERY_RANGE: string =
  process.env.BIU_TEMPLATE_REACT_QUERY_RANGE ??
  JSON.parse(readFileSync(new URL("../../tanstack-query/package.json", import.meta.url), "utf8")).peerDependencies[
    "@tanstack/react-query"
  ];
