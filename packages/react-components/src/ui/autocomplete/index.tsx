import * as React from "react";
import { cx } from "../../shared/utils.js";
import {
  useComponentsLocale,
  type BiuComponentsLocale,
  type BiuComponentsLocaleTextOverrides,
} from "../../provider.js";

export interface AutocompleteOption {
  label: React.ReactNode;
  value: string;
  disabled?: boolean;
}

export interface AutocompleteProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "defaultValue" | "onChange" | "onSelect"
> {
  options: AutocompleteOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onSelect?: (option: AutocompleteOption) => void;
  emptyContent?: React.ReactNode;
  locale?: BiuComponentsLocale;
  localeText?: BiuComponentsLocaleTextOverrides;
}

export const Autocomplete = React.forwardRef<HTMLInputElement, AutocompleteProps>(function Autocomplete(
  { options, value, defaultValue = "", onChange, onSelect, emptyContent, locale, localeText, className, ...props },
  ref,
) {
  const text = useComponentsLocale(locale, localeText);
  const resolvedEmptyContent = emptyContent ?? text["暂无匹配项"];
  const [internal, setInternal] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);
  const [highlighted, setHighlighted] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const active = value ?? internal;
  const filtered = options.filter((option) => String(option.label).toLowerCase().includes(active.toLowerCase()));
  React.useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);
  return (
    <div ref={rootRef} className={cx("biu-ui-autocomplete", className)}>
      <input
        {...props}
        ref={ref}
        value={active}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        onFocus={(event) => {
          setOpen(true);
          props.onFocus?.(event);
        }}
        onChange={(event) => {
          if (value === undefined) setInternal(event.target.value);
          setHighlighted(0);
          setOpen(true);
          onChange?.(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            setHighlighted((index) => Math.min(index + 1, Math.max(0, filtered.length - 1)));
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setHighlighted((index) => Math.max(0, index - 1));
          }
          if (event.key === "Enter" && open && filtered[highlighted] && !filtered[highlighted].disabled) {
            event.preventDefault();
            const option = filtered[highlighted];
            if (value === undefined) setInternal(option.value);
            onChange?.(option.value);
            onSelect?.(option);
            setOpen(false);
          }
          props.onKeyDown?.(event);
        }}
      />
      {open ? (
        <ul className="biu-ui-autocomplete__list" role="listbox">
          {filtered.length ? (
            filtered.map((option, index) => (
              <li key={option.value}>
                <button
                  type="button"
                  disabled={option.disabled}
                  role="option"
                  aria-selected={index === highlighted}
                  onMouseEnter={() => setHighlighted(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    if (value === undefined) setInternal(option.value);
                    onChange?.(option.value);
                    onSelect?.(option);
                    setOpen(false);
                  }}
                >
                  {option.label}
                </button>
              </li>
            ))
          ) : (
            <li className="biu-ui-autocomplete__empty">{resolvedEmptyContent}</li>
          )}
        </ul>
      ) : null}
    </div>
  );
});
