import assert from "node:assert/strict";
import test from "node:test";
import { getBiuFormLocaleText } from "../src/locale/index.js";

test("form locale defaults to Chinese and supports custom text", () => {
  assert.equal(getBiuFormLocaleText()["请检查以下字段"], "请检查以下字段");
  assert.equal(getBiuFormLocaleText()["请输入此字段"], "请输入此字段");
  assert.equal(getBiuFormLocaleText()["重置"], "重置");
  assert.equal(getBiuFormLocaleText("en-US")["提交"], "Submit");
  assert.equal(getBiuFormLocaleText("en-US")["请检查以下字段"], "Please check the following fields");
  assert.equal(getBiuFormLocaleText("en-US", { 请检查以下字段: "Review fields" })["请检查以下字段"], "Review fields");
});
