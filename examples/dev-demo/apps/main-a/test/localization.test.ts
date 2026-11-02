import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement, type ReactElement, type ReactNode } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import dayjs from "dayjs";
import ts from "typescript";
import { LocalizedDemoTree } from "../src/pages/CapabilityPage/localization.js";

const $t = (key: string) => ({ 标题: "Title", 选项: "Option", 示例: "Example" })[key] ?? key;

function localize(props: Record<string, unknown>) {
  return LocalizedDemoTree({ node: createElement("section", props), $t }) as ReactElement<Record<string, unknown>>;
}

test("localization preserves date range instances and methods", () => {
  const start = dayjs("2026-10-01");
  const end = dayjs("2026-10-29");
  const date = new Date("2026-10-29T00:00:00Z");
  const result = localize({ defaultValue: [start, end, date] });
  const values = result.props.defaultValue as [typeof start, typeof end, Date];
  assert.strictEqual(values[0], start);
  assert.strictEqual(values[1], end);
  assert.strictEqual(values[2], date);
  assert.equal(values[0].startOf("month").format("YYYY-MM-DD"), "2026-10-01");
});

test("plain nested option labels translate while identifiers and values remain", () => {
  const handleChange = () => undefined;
  const result = localize({
    title: "标题",
    options: [{ value: "ExampleCode", label: "选项", children: [{ value: "ChildCode", title: "标题" }] }],
    value: "选项",
    onChange: handleChange,
    children: createElement("code", null, "示例"),
  });
  assert.equal(result.props.title, "Title");
  assert.deepEqual(result.props.options, [
    { value: "ExampleCode", label: "Option", children: [{ value: "ChildCode", title: "Title" }] },
  ]);
  assert.equal(result.props.value, "选项");
  assert.strictEqual(result.props.onChange, handleChange);
  assert.equal((result.props.children as ReactElement<{ children: string }>).props.children, "示例");
});

test("inline JSX spacing and ReactNode slots translate without changing code or callbacks", () => {
  const renderContent = () => createElement("span", null, "示例");
  const result = localize({
    children: "  示例 \n",
    dropdownHeader: createElement("strong", null, "标题"),
    dropdownFooter: createElement("code", null, "示例"),
    items: [{ value: "ExampleCode", children: createElement("span", null, "示例") }],
    content: " 示例 ",
    renderContent,
  });
  assert.equal(result.props.children, "  Example \n");
  assert.equal((result.props.dropdownHeader as ReactElement<{ children: string }>).props.children, "Title");
  assert.equal((result.props.dropdownFooter as ReactElement<{ children: string }>).props.children, "示例");
  const item = (result.props.items as Array<{ value: string; children: ReactElement<{ children: string }> }>)[0];
  assert.equal(item.value, "ExampleCode");
  assert.equal(item.children.props.children, "Example");
  assert.equal(result.props.content, " Example ");
  assert.strictEqual(result.props.renderContent, renderContent);
});

test("static and mapped JSX children retain keys and code while translating text once", () => {
  const calls: string[] = [];
  const errors: unknown[][] = [];
  const originalError = console.error;
  function Box({ children }: { children?: ReactNode }) {
    return createElement("div", null, children);
  }
  function PlatformCapabilities() {
    const node = jsxs(Box, {
      children: [
        jsx("dl", {
          children: ["Portal", "APP ID"].map((label) =>
            jsxs("div", { children: [jsx("dt", { children: label }), jsx("dd", { children: "示例" })] }, label),
          ),
        }),
        jsxs("code", { children: [jsx("span", { children: "示例" }), jsx("span", { children: "示例" })] }),
        jsxs("pre", { children: [jsx("span", { children: "示例" }), jsx("span", { children: "示例" })] }),
        jsx("p", { children: "示例" }),
      ],
    });
    return LocalizedDemoTree({
      node,
      $t: (key) => {
        calls.push(key);
        return $t(key);
      },
    });
  }
  let markup: string;
  try {
    console.error = (...values: unknown[]) => errors.push(values);
    markup = renderToStaticMarkup(createElement(PlatformCapabilities));
  } finally {
    console.error = originalError;
  }
  assert.equal(
    markup,
    "<div><dl><div><dt>Portal</dt><dd>Example</dd></div><div><dt>APP ID</dt><dd>Example</dd></div></dl><code><span>示例</span><span>示例</span></code><pre><span>示例</span><span>示例</span></pre><p>Example</p></div>",
  );
  assert.deepEqual(calls, ["Portal", "示例", "APP ID", "示例", "示例"]);
  assert.deepEqual(errors, []);
});

function readResource(path: string) {
  const source = readFileSync(path, "utf8");
  const parsed = ts.createSourceFile(path, `const resource = ${source}`, ts.ScriptTarget.Latest, true);
  const visit = (node: ts.Node) => {
    if (ts.isObjectLiteralExpression(node)) {
      const names = node.properties.filter(ts.isPropertyAssignment).map((property) => property.name.getText(parsed));
      assert.equal(new Set(names).size, names.length, `Duplicate JSON keys in ${path}`);
    }
    ts.forEachChild(node, visit);
  };
  visit(parsed);
  return JSON.parse(source) as Record<string, unknown>;
}

function checkTranslations(zh: Record<string, string>, en: Record<string, string>, name: string) {
  assert.deepEqual(Object.keys(zh).sort(), Object.keys(en).sort(), `Locale key mismatch in ${name}`);
  for (const [key, value] of Object.entries(en)) {
    assert.match(key, /\p{Script=Han}/u, `Use a Chinese source key in ${name}: ${key}`);
    assert.doesNotMatch(value, /\p{Script=Han}/u, `Untranslated English value in ${name}: ${key}`);
    const parameters = (text: string) => [...new Set([...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]))].sort();
    assert.deepEqual(parameters(zh[key]), parameters(value), `Interpolation mismatch in ${name}: ${key}`);
  }
}

test("all Demo locale files have unique Chinese keys, complete English values and matching interpolation", () => {
  const apps = fileURLToPath(new URL("../../", import.meta.url));
  for (const app of readdirSync(apps)) {
    const path = join(apps, app, "public/demo-locale.json");
    // Custom uses the Runtime resource registry and has no business dictionary.
    if (!existsSync(path)) continue;
    const resource = readResource(path) as Record<string, { translation: Record<string, string> }>;
    checkTranslations(resource["zh-CN"].translation, resource["en-US"].translation, app);
  }
});

test("public component, form and table locale resources preserve key and interpolation parity", () => {
  const root = fileURLToPath(new URL("../../../../../", import.meta.url));
  for (const name of ["react-components", "react-form", "react-table"]) {
    const directory = join(root, "packages", name, "src/locale");
    checkTranslations(
      readResource(join(directory, "zh-CN.json")) as Record<string, string>,
      readResource(join(directory, "en-US.json")) as Record<string, string>,
      name,
    );
  }
});

test("Foundation Showcase lets Form.Item render its validation message once", () => {
  const source = readFileSync(new URL("../src/pages/FoundationShowcase/index.tsx", import.meta.url), "utf8");
  const keywordField = source.match(/<FormItem name="keyword"[\s\S]*?<\/FormItem>/)?.[0];
  assert.ok(keywordField);
  assert.match(keywordField, /rules=\{\{ required: \$t\("请输入关键词"\) \}\}/);
  assert.match(keywordField, /\{\(\{ field \}\) => <TextField \{\.\.\.field\}/);
  assert.doesNotMatch(keywordField, /fieldState\.error/);
  assert.doesNotMatch(keywordField, /\berror\s*=\s*\{/);
});
