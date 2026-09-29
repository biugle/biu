# @biugle/react-form

`react-hook-form` based form primitives. `Form.Item` uses children render props so any UI or business field can be controlled without cloning components.

```bash
pnpm add @biugle/react-form react-hook-form
```

```tsx
import { Form, FormActions, FormItem, useForm } from "@biugle/react-form";
import { Button, TextField } from "@biugle/react-components";
import "@biugle/react-form/styles.css";

const form = useForm({ defaultValues: { name: "" } });
<Form form={form} onSubmit={(values) => save(values)}>
  <FormItem name="name" label="名称" rules={{ required: "请输入名称" }}>
    {({ field, fieldState }) => <TextField {...field} error={fieldState.error?.message} />}
  </FormItem>
  <FormActions>
    <Button type="submit">保存</Button>
  </FormActions>
</Form>;
```

The render context exposes `field`, `fieldState` and `formState`, so custom controls and validation messages remain explicit. `Form.Item.tooltip` accepts a `ReactNode` and renders a question-mark action immediately after the label; hovering or focusing it opens the shared Tooltip without changing the field control geometry. This is independent from `help` and `extra`, which remain the validation and label-adjacent text slots.

`Form.Group` provides a titled business section with a responsive two-column layout by default. It keeps the form regions visually consistent while preserving the same `Form.Item` render-props contract:

```tsx
<Form.Group title="基本信息" description="填写项目基础资料" columns={2} gap={16}>
  <Form.Item name="name" label="姓名">
    {({ field }) => <TextField {...field} />}
  </Form.Item>
  <Form.Item name="email" label="邮箱">
    {({ field }) => <TextField {...field} />}
  </Form.Item>
</Form.Group>
```

The standalone `FormGroup`/`Group` exports are aliases of `Form.Group`. `columns`, `gap`, `className` and `classNames.root/header/title/description/body` are available for layout and styling overrides. Groups collapse to one column on narrow screens; existing `Form.Section` and `Form.Grid` remain compatible.

`Form.List` provides dynamic array fields using `react-hook-form/useFieldArray` while keeping stable `key` and numeric `name` indexes for nested `Form.Item` fields:

```tsx
<Form.List name="contacts">
  {(fields, { add, remove }) => (
    <>
      {fields.map((field) => (
        <Form.Item key={field.key} name={`contacts.${field.name}.value`} label={`联系人 ${field.name + 1}`}>
          {({ field: input }) => <TextField {...input} />}
        </Form.Item>
      ))}
      <Button type="button" onClick={() => add({ value: "" })}>
        添加联系人
      </Button>
    </>
  )}
</Form.List>
```

`add`、`remove`、`move` 和 `replace` 均为数组操作；数组值、校验和提交仍由调用方传入的 RHF form 实例管理。

For dynamic table-like rows, pass `columns` instead of a render-prop child. Each column declares `key`, `name`, optional `label`/`width`/`tooltip` and `render({ field, index, fieldName, value, operations })`; `tooltip` renders a question-mark Tooltip after that column header. `addValue` supplies the value for the generated add button; `addText`, `removeText`, `showAdd` and `showRemove` control the generated actions. `classNames.header/row/column/actions/remove` and `className` remain available for per-region styling, while nested `Form.Item` controls keep their normal field registration and full-width geometry.

Form 的默认可见文案为中文。`Form` 支持 `locale="en-US"` 和 `localeText`，`FormErrorSummary`、`Form.List` 也可以单独传入这两个参数；`localeText` 的 key 始终使用中文原文，例如 `localeText={{ "新增": "Add" }}`，组件内部默认文案和无障碍文案也统一走资源。调用方显式传入的 `title` 优先级最高。中英文默认资源位于 `src/locale/zh-CN.json` 和 `src/locale/en-US.json`。
