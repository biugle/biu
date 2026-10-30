import { Children, cloneElement, isValidElement, type ReactNode } from "react";

const localizedTextProps = new Set([
  "title",
  "description",
  "placeholder",
  "aria-label",
  "alt",
  "addonBefore",
  "addonAfter",
  "label",
  "emptyText",
  "resetText",
  "searchText",
  "okText",
  "cancelText",
  "loadingText",
]);

/** Translate readable demo JSX while preserving code, values and direct layout children. */
function localizeDemoNode(node: ReactNode, $t: (key: string) => string, code: boolean): ReactNode {
  const localizeList = (value: unknown[]): unknown[] =>
    value.map((item) => {
      if (Array.isArray(item)) return localizeList(item);
      if (!item || typeof item !== "object" || isValidElement(item)) return item;
      // Values such as Dayjs, Date and File must retain their prototype and
      // identity. Only plain option records contain translatable labels.
      const prototype = Object.getPrototypeOf(item);
      if (prototype !== Object.prototype && prototype !== null) return item;
      return Object.fromEntries(
        Object.entries(item).map(([entryKey, entryValue]) => {
          if (typeof entryValue === "string" && localizedTextProps.has(entryKey) && !code)
            return [entryKey, $t(entryValue)];
          if (Array.isArray(entryValue)) return [entryKey, localizeList(entryValue)];
          return [entryKey, entryValue];
        }),
      );
    });
  if (typeof node === "string") return code ? node : $t(node);
  // Cloning JSX's static child arrays removes their development-only key
  // validation. Children.map supplies stable keys while keeping each field
  // directly inspectable by PageFilter and other layout components.
  if (Array.isArray(node)) return Children.map(node, (item) => localizeDemoNode(item, $t, code));
  if (!isValidElement(node)) return node;
  const elementType = typeof node.type === "string" ? node.type : "";
  const nextCode = code || elementType === "pre" || elementType === "code";
  const props = { ...(node.props as Record<string, unknown>) } as Record<string, unknown>;
  for (const [key, value] of Object.entries(props)) {
    if (typeof value === "string" && localizedTextProps.has(key) && !nextCode) props[key] = $t(value);
    else if (Array.isArray(value)) props[key] = localizeList(value);
  }
  // Preserve direct child elements instead of inserting a wrapper component.
  // Layout components such as PageFilter need to inspect each child item to
  // calculate their grid and overflow capacity.
  if ("children" in props && typeof props.children !== "function") {
    props.children = localizeDemoNode(props.children as ReactNode, $t, nextCode);
  }
  return cloneElement(node, props);
}

export function LocalizedDemoTree({
  node,
  $t,
  code = false,
}: {
  node: ReactNode;
  $t: (key: string) => string;
  code?: boolean;
}) {
  return localizeDemoNode(node, $t, code);
}
