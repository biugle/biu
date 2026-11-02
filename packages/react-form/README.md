# @biugle/react-form

`react-hook-form` based form primitives. `Form.Item` uses children render props so any UI or business field can be controlled without cloning components. Form is intentionally published through one root entry; there are no `@biugle/react-form/ui` or `@biugle/react-form/pro` subpath packages.

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
    {({ field }) => <TextField {...field} />}
  </FormItem>
  <FormActions>
    <Button type="submit">保存</Button>
  </FormActions>
</Form>;
```

The root entry exports both the composable `Form` API and the higher-level
`ProForm`/`FormToolbar` helpers. `ProForm` is a feature in the same package,
not a second package boundary, so applications do not need to coordinate two
Form implementations or two style entry points.

The render context exposes `field`, `fieldState` and `formState`. `Form.Item` renders its field validation message once and sets `aria-invalid` through `field`; do not also pass the same message to a control's `error` prop, which renders its own message. Use `noStyle` when the application needs to render a custom validation message. `Form.Item.tooltip` accepts a `ReactNode` and renders a question-mark action immediately after the label; hovering or focusing it opens the shared Tooltip without changing the field control geometry. This is independent from `help` and `extra`, which remain the validation and label-adjacent text slots.

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

`add`, `remove`, `move` and `replace` operate on array fields. The caller's RHF form instance still owns array values, validation and submission.

For dynamic table-like rows, pass `columns` instead of a render-prop child. Each column declares `key`, `name`, optional `label`/`width`/`tooltip` and `render({ field, index, fieldName, value, operations })`; `tooltip` renders a question-mark Tooltip after that column header. `addValue` supplies the value for the generated add button; `addText`, `removeText`, `showAdd` and `showRemove` control the generated actions. `classNames.header/row/column/actions/remove` and `className` remain available for per-region styling, while nested `Form.Item` controls keep their normal field registration and full-width geometry.

Form's default visible text is Chinese. `Form` supports `locale="en-US"` and `localeText`; `FormErrorSummary` and `Form.List` also accept these props independently. `localeText` always uses Chinese source keys, for example `localeText={{ "新增": "Add" }}`. Built-in visible and accessible labels use the same resources, and an explicit `title` takes precedence. Default resources live in `src/locale/zh-CN.json` and `src/locale/en-US.json`.

## Demo contract

`FormShowcase` is the reference integration: fields use the normal Form registration path, default control sizes, two-column groups and explicit validation rules. The examples keep display text behind runtime `$t` resources and show both the displayed value and the submitted value where normalization matters. Business pages should keep request/mock data outside the package and use Zustand for shared form-page state; Form itself only owns field registration, validation and layout.
