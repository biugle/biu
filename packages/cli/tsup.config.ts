import { readFileSync } from "node:fs";
import { defineConfig } from "tsup";
import { templatePackages } from "./src/template-packages.js";

const versions = Object.fromEntries(
  templatePackages.map(([directory, name]) => {
    const manifest = JSON.parse(readFileSync(new URL(`../${directory}/package.json`, import.meta.url), "utf8")) as {
      version: string;
    };
    return [name, manifest.version];
  }),
);

const queryManifest = JSON.parse(readFileSync(new URL("../tanstack-query/package.json", import.meta.url), "utf8")) as {
  peerDependencies: Record<string, string>;
};

export default defineConfig({
  define: {
    "process.env.BIU_TEMPLATE_PACKAGE_VERSIONS": JSON.stringify(JSON.stringify(versions)),
    "process.env.BIU_TEMPLATE_REACT_QUERY_RANGE": JSON.stringify(
      queryManifest.peerDependencies["@tanstack/react-query"],
    ),
  },
});
