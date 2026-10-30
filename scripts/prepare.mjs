// Root package lifecycle: CI builds once in verify/build:demo:all while local
// installs still build the public packages and enable the commit hook.
import { execFileSync } from "node:child_process";
import process from "node:process";

if (process.env.CI === "true" || process.env.CI === "1") {
  console.log(
    "[biu] CI prepare: package builds belong to the validation/build job; dependency scripts remain enabled.",
  );
} else {
  execFileSync("pnpm", ["build"], { stdio: "inherit" });
  execFileSync("pnpm", ["exec", "husky"], { stdio: "inherit" });
}
