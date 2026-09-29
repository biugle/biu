import * as React from "react";

export type BiuClassNames = Record<string, string | undefined>;
export type BiuSize = "small" | "medium" | "large";

export function cx(...values: Array<React.ReactNode | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function mergeRefs<T>(...refs: Array<React.ForwardedRef<T> | undefined>) {
  return (value: T | null) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") ref(value);
      else ref.current = value;
    }
  };
}

export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: {
  value?: T;
  defaultValue: T;
  onChange?: (value: T) => void;
}) {
  const [internal, setInternal] = React.useState(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? value : internal;
  const set = React.useCallback(
    (next: T | ((value: T) => T)) => {
      const resolved = typeof next === "function" ? (next as (value: T) => T)(current as T) : next;
      if (!controlled) setInternal(resolved);
      onChange?.(resolved);
    },
    [controlled, current, onChange],
  );
  return [current as T, set] as const;
}

export function useIdPrefix(prefix: string) {
  return `${prefix}-${React.useId().replace(/:/g, "")}`;
}
