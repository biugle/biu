import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useForm } from "react-hook-form";
import { JSDOM } from "jsdom";
import { Form, FormGroup, FormItem, type FormRenderContext } from "../src/index.js";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/" });
const hostDocument = dom.window.document;
Object.assign(globalThis, {
  document: hostDocument,
  window: dom.window,
  HTMLElement: dom.window.HTMLElement,
  Event: dom.window.Event,
  Node: dom.window.Node,
  IS_REACT_ACT_ENVIRONMENT: true,
});
Object.defineProperty(globalThis, "navigator", { configurable: true, value: dom.window.navigator });
Object.defineProperty(dom.window.HTMLElement.prototype, "attachEvent", { configurable: true, value: () => undefined });
Object.defineProperty(dom.window.HTMLElement.prototype, "detachEvent", { configurable: true, value: () => undefined });

type Values = { name: string };
type HarnessItemProps = {
  name: "name";
  label: string;
  required: boolean;
  tooltip?: React.ReactNode;
  children?: (context: FormRenderContext<Values, "name">) => React.ReactNode;
};
const TypedFormItem = FormItem as unknown as React.ComponentType<HarnessItemProps>;
const AnyForm = Form as unknown as React.ComponentType<any>;

type ListValues = { items: Array<{ value: string }> };
let listForm: ReturnType<typeof useForm<ListValues>> | undefined;

function FormListHarness() {
  const form = useForm<ListValues>({ defaultValues: { items: [{ value: "first" }] } });
  listForm = form;
  return React.createElement(
    AnyForm,
    { form },
    React.createElement((Form as unknown as { List: React.ComponentType<any> }).List, {
      name: "items",
      children: (
        fields: Array<{ key: string; name: number }>,
        operations: { add: (value: { value: string }) => void; remove: (index: number) => void },
      ) =>
        React.createElement(
          React.Fragment,
          null,
          fields.map((field) =>
            React.createElement("span", { key: field.key, "data-list-index": field.name }, field.name),
          ),
          React.createElement(
            "button",
            { id: "list-add", type: "button", onClick: () => operations.add({ value: "second" }) },
            "add",
          ),
          React.createElement(
            "button",
            { id: "list-remove", type: "button", onClick: () => operations.remove(0) },
            "remove",
          ),
        ),
    }),
  );
}

function FormHarness({ onInvalid }: { onInvalid: (errors: unknown) => void }) {
  const form = useForm<Values>({ defaultValues: { name: "" } });
  return React.createElement(
    AnyForm,
    { form, onInvalid },
    React.createElement(TypedFormItem, {
      name: "name",
      label: "名称",
      required: true,
      children: ({ field }: FormRenderContext<Values, "name">) =>
        React.createElement("input", { ...field, type: "text" }),
    }),
    React.createElement("button", { type: "submit" }, "提交"),
  );
}

test("Form.Item required creates validation and accessible field metadata", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  let root!: Root;
  let invalid: unknown;
  await act(async () => {
    root = createRoot(host);
    root.render(React.createElement(FormHarness, { onInvalid: (errors) => (invalid = errors) }));
  });
  try {
    const input = host.querySelector("input");
    assert.ok(input);
    assert.equal(input.getAttribute("aria-required"), "true");
    assert.equal(input.getAttribute("aria-describedby"), null);
    await act(async () => {
      host.querySelector("form")?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      await Promise.resolve();
    });
    assert.ok(invalid);
    assert.ok(host.querySelector('[role="alert"]'));
    assert.ok(input.getAttribute("aria-describedby"));
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Form.Item tooltip uses an icon trigger instead of duplicating the help text", async () => {
  function TooltipHarness() {
    const form = useForm<Values>({ defaultValues: { name: "" } });
    return React.createElement(
      AnyForm,
      { form },
      React.createElement(TypedFormItem, {
        name: "name",
        label: "名称",
        required: false,
        tooltip: "这里是字段说明",
        children: ({ field }: FormRenderContext<Values, "name">) =>
          React.createElement("input", { ...field, type: "text" }),
      }),
    );
  }
  const host = document.createElement("div");
  document.body.append(host);
  let root!: Root;
  await act(async () => {
    root = createRoot(host);
    root.render(React.createElement(TooltipHarness));
  });
  try {
    assert.equal(host.querySelectorAll(".biu-form-item__tooltip").length, 1);
    assert.equal(host.querySelector(".biu-form-item__tooltip")?.textContent, "");
    assert.equal(host.querySelector(".biu-form-item__label")?.textContent?.includes("这里是字段说明"), false);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

type DependencyValues = { source: string; target: string };
let dependencyTargetRenderCount = 0;

function DependencyHarness() {
  const form = useForm<DependencyValues>({ defaultValues: { source: "same", target: "same" } });
  return React.createElement(
    AnyForm,
    { form },
    React.createElement(FormItem as any, {
      name: "source",
      children: ({ field }: FormRenderContext<DependencyValues, "source">) =>
        React.createElement(
          React.Fragment,
          null,
          React.createElement("input", { ...field, id: "source", type: "text" }),
          React.createElement(
            "button",
            { id: "source-change", type: "button", onClick: () => field.onChange("changed") },
            "change",
          ),
        ),
    }),
    React.createElement(FormItem as any, {
      name: "target",
      dependencies: ["source"],
      shouldUpdate: (previous: DependencyValues, current: DependencyValues) => previous.source !== current.source,
      validateTrigger: "onChange",
      rules: { validate: (value: string, values: DependencyValues) => value === values.source || "两次输入不一致" },
      children: ({ field }: FormRenderContext<DependencyValues, "target">) => {
        dependencyTargetRenderCount += 1;
        return React.createElement("input", { ...field, id: "target", type: "text" });
      },
    }),
  );
}

test("Form.Item dependencies revalidate dependent fields and preserve is forwarded to Controller", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  let root!: Root;
  await act(async () => {
    root = createRoot(host);
    root.render(React.createElement(DependencyHarness));
  });
  try {
    const source = host.querySelector<HTMLInputElement>('[id="source"]');
    assert.ok(source);
    const initialTargetRenders = dependencyTargetRenderCount;
    await act(async () => {
      host.querySelector<HTMLButtonElement>("#source-change")?.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    assert.equal(host.querySelector('[role="alert"]')?.textContent, "两次输入不一致");
    assert.ok(dependencyTargetRenderCount > initialTargetRenders);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

type PreserveValues = { temporary: string };
let preserveForm: ReturnType<typeof useForm<PreserveValues>> | undefined;

function PreserveHarness() {
  const [visible, setVisible] = React.useState(true);
  const form = useForm<PreserveValues>({ defaultValues: { temporary: "temporary" } });
  preserveForm = form;
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      "button",
      { id: "toggle-preserved-field", type: "button", onClick: () => setVisible(false) },
      "hide",
    ),
    React.createElement(
      AnyForm,
      { form },
      visible
        ? React.createElement(FormItem as any, {
            name: "temporary",
            preserve: false,
            children: ({ field }: FormRenderContext<PreserveValues, "temporary">) =>
              React.createElement("input", { ...field, id: "temporary", type: "text" }),
          })
        : null,
    ),
  );
}

test("Form.Item preserve=false unregisters a conditional field", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  let root!: Root;
  await act(async () => {
    root = createRoot(host);
    root.render(React.createElement(PreserveHarness));
  });
  try {
    assert.equal(preserveForm?.getValues("temporary"), "temporary");
    await act(async () => {
      host.querySelector<HTMLButtonElement>("#toggle-preserved-field")?.click();
    });
    assert.equal(preserveForm?.getValues("temporary"), undefined);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
    preserveForm = undefined;
  }
});

test("Form.List exposes stable field keys and react-hook-form array operations", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  let root!: Root;
  await act(async () => {
    root = createRoot(host);
    root.render(React.createElement(FormListHarness));
  });
  try {
    assert.equal(host.querySelectorAll("[data-list-index]").length, 1);
    await act(async () => host.querySelector<HTMLButtonElement>("#list-add")?.click());
    assert.equal(host.querySelectorAll("[data-list-index]").length, 2);
    assert.deepEqual(listForm?.getValues("items"), [{ value: "first" }, { value: "second" }]);
    await act(async () => host.querySelector<HTMLButtonElement>("#list-remove")?.click());
    assert.deepEqual(listForm?.getValues("items"), [{ value: "second" }]);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
    listForm = undefined;
  }
});

test("Form.List columns renders one-row multi-field definitions and supports add/remove", async () => {
  type DynamicValues = { items: Array<{ name: string; quantity: number }> };
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () =>
    root.render(
      React.createElement(function DynamicListHarness() {
        const form = useForm<DynamicValues>({ defaultValues: { items: [{ name: "首项", quantity: 1 }] } });
        return React.createElement(
          AnyForm,
          { form },
          React.createElement((Form as unknown as { List: React.ComponentType<any> }).List, {
            name: "items",
            addValue: { name: "新项", quantity: 1 },
            columns: [
              {
                key: "name",
                label: "名称",
                name: "name",
                render: ({ fieldName }: { fieldName: string }) =>
                  React.createElement("input", { "data-field-name": fieldName, defaultValue: "" }),
              },
              {
                key: "quantity",
                label: "数量",
                name: "quantity",
                render: ({ fieldName }: { fieldName: string }) =>
                  React.createElement("input", { "data-field-name": fieldName, defaultValue: "1" }),
              },
            ],
          }),
        );
      }),
    ),
  );
  try {
    assert.equal(host.querySelectorAll(".biu-form-list__row").length, 1);
    assert.ok(host.querySelector('[data-field-name="items.0.name"]'));
    assert.ok(host.querySelector('[data-field-name="items.0.quantity"]'));
    await act(async () => host.querySelector<HTMLButtonElement>(".biu-form-list__actions button")?.click());
    assert.equal(host.querySelectorAll(".biu-form-list__row").length, 2);
    assert.ok(host.querySelector('[data-field-name="items.1.name"]'));
    await act(async () => host.querySelector<HTMLButtonElement>(".biu-form-list__remove")?.click());
    assert.equal(host.querySelectorAll(".biu-form-list__row").length, 1);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});

test("Form.List enforces row bounds and exposes first-column move controls", async () => {
  type DynamicValues = { items: Array<{ name: string }> };
  const host = document.createElement("div");
  document.body.append(host);
  let currentForm: ReturnType<typeof useForm<DynamicValues>> | undefined;
  const root = createRoot(host);
  await act(async () =>
    root.render(
      React.createElement(function BoundedListHarness() {
        const form = useForm<DynamicValues>({ defaultValues: { items: [{ name: "第一行" }] } });
        currentForm = form;
        return React.createElement(
          AnyForm,
          { form },
          React.createElement((Form as unknown as { List: React.ComponentType<any> }).List, {
            name: "items",
            addValue: { name: "新增行" },
            minRows: 1,
            maxRows: 2,
            showSort: true,
            columns: [
              {
                key: "name",
                label: "名称",
                name: "name",
                render: ({ fieldName }: { fieldName: string }) =>
                  React.createElement("input", { "data-field-name": fieldName }),
              },
            ],
          }),
        );
      }),
    ),
  );
  try {
    const add = host.querySelector<HTMLButtonElement>(".biu-form-list__actions button");
    assert.ok(add);
    await act(async () => add.click());
    assert.equal(host.querySelectorAll(".biu-form-list__row").length, 2);
    assert.equal(add.disabled, true);
    await act(async () => add.click());
    assert.equal(currentForm?.getValues("items").length, 2);
    const moveUp = host.querySelectorAll<HTMLButtonElement>('.biu-form-list__move[aria-label="上移"]')[1];
    assert.ok(moveUp);
    await act(async () => moveUp.click());
    assert.deepEqual(currentForm?.getValues("items"), [{ name: "新增行" }, { name: "第一行" }]);
    const removeButtons = host.querySelectorAll<HTMLButtonElement>(".biu-form-list__remove");
    assert.equal(removeButtons[0]?.classList.contains("biu-ui-button--only-icon"), true);
    assert.equal(removeButtons[0]?.querySelector("svg") !== null, true);
    await act(async () => removeButtons[0]?.click());
    assert.equal(host.querySelectorAll(".biu-form-list__row").length, 1);
    assert.equal(host.querySelector<HTMLButtonElement>(".biu-form-list__remove")?.disabled, true);
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
    currentForm = undefined;
  }
});

test("FormGroup renders a titled responsive section with stable slot class names", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () =>
    root.render(
      React.createElement(FormGroup, {
        title: "基本信息",
        description: "填写项目基础资料",
        columns: 2,
        gap: 20,
        className: "custom-group",
        classNames: {
          header: "custom-header",
          title: "custom-title",
          description: "custom-description",
          body: "custom-body",
        },
        children: React.createElement(
          React.Fragment,
          null,
          React.createElement("span", null, "姓名"),
          React.createElement("span", null, "邮箱"),
        ),
      }),
    ),
  );
  try {
    const group = host.querySelector<HTMLElement>('[data-biu-component="form-group"]');
    assert.ok(group);
    assert.equal(group.classList.contains("biu-form-group"), true);
    assert.equal(group.classList.contains("custom-group"), true);
    assert.equal(group.querySelector(".biu-form-group__title")?.textContent, "基本信息");
    assert.equal(group.querySelector(".biu-form-group__description")?.textContent, "填写项目基础资料");
    assert.equal(group.querySelector(".biu-form-group__header")?.classList.contains("custom-header"), true);
    assert.equal(group.querySelector(".biu-form-group__body")?.classList.contains("custom-body"), true);
    assert.equal(group.style.getPropertyValue("--biu-form-group-columns"), "2");
    assert.equal(group.style.getPropertyValue("--biu-form-group-gap"), "20px");
  } finally {
    await act(async () => root.unmount());
    host.remove();
    document.body.replaceChildren();
  }
});
