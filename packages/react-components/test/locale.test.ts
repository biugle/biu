import assert from "node:assert/strict";
import test from "node:test";
import { getBiuComponentsLocaleText } from "../src/locale/index.js";

test("components locale defaults to Chinese, supports English and allows per-call overrides", () => {
  assert.equal(getBiuComponentsLocaleText()["确定"], "确定");
  assert.equal(getBiuComponentsLocaleText("en")["确定"], "Confirm");
  assert.equal(getBiuComponentsLocaleText("en-US", { 确定: "Continue" })["确定"], "Continue");
});
