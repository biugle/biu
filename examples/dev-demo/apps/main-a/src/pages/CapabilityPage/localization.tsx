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
  "loadMoreText",
  "tooltip",
  "tooltipContent",
  "help",
  "content",
  "header",
  "footer",
]);

const localizedNodeProps = new Set([
  ...localizedTextProps,
  "content",
  "action",
  "actions",
  "header",
  "footer",
  "trigger",
  "dropdownHeader",
  "dropdownFooter",
]);

function localizeText(value: string, $t: (key: string) => string) {
  const text = value.trim();
  if (!text) return value;
  // JSX can keep spaces around inline code or dynamic values. Preserve those
  // spaces while looking up the same source-text key as a standalone label.
  const start = value.indexOf(text);
  return value.slice(0, start) + $t(text) + value.slice(start + text.length);
}

/** Translate readable demo JSX while preserving code, values and direct layout children. */
function localizeDemoNode(node: ReactNode, $t: (key: string) => string, code: boolean): ReactNode {
  const localizeList = (value: unknown[]): unknown[] =>
    value.map((item) => {
      if (Array.isArray(item)) return localizeList(item);
      if (isValidElement(item)) return localizeDemoNode(item, $t, code);
      if (!item || typeof item !== "object") return item;
      // Values such as Dayjs, Date and File must retain their prototype and
      // identity. Only plain option records contain translatable labels.
      const prototype = Object.getPrototypeOf(item);
      if (prototype !== Object.prototype && prototype !== null) return item;
      return Object.fromEntries(
        Object.entries(item).map(([entryKey, entryValue]) => {
          if (typeof entryValue === "string" && localizedTextProps.has(entryKey) && !code)
            return [entryKey, localizeText(entryValue, $t)];
          if (Array.isArray(entryValue)) return [entryKey, localizeList(entryValue)];
          if (isValidElement(entryValue) && (localizedNodeProps.has(entryKey) || entryKey === "children"))
            return [entryKey, localizeDemoNode(entryValue, $t, code)];
          return [entryKey, entryValue];
        }),
      );
    });
  if (typeof node === "string") return code ? node : localizeText(node, $t);
  // Cloning JSX's static child arrays removes their development-only key
  // validation. Children.map supplies stable keys while keeping each field
  // directly inspectable by PageFilter and other layout components.
  if (Array.isArray(node)) return Children.map(node, (item) => localizeDemoNode(item, $t, code));
  if (!isValidElement(node)) return node;
  const elementType = typeof node.type === "string" ? node.type : "";
  const nextCode = code || elementType === "pre" || elementType === "code";
  const props = { ...(node.props as Record<string, unknown>) } as Record<string, unknown>;
  for (const [key, value] of Object.entries(props)) {
    // Children have their own key-preserving traversal below. Visiting them
    // here first would translate twice and lose the current code boundary.
    if (key === "children") continue;
    if (typeof value === "string" && localizedTextProps.has(key) && !nextCode) props[key] = localizeText(value, $t);
    else if (isValidElement(value) && localizedNodeProps.has(key)) props[key] = localizeDemoNode(value, $t, nextCode);
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
