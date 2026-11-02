import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cx } from "../../shared/utils.js";
import { BiuPortal } from "../overlay/portal.js";
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
  const listId = React.useId().replace(/:/g, "");
  const active = value ?? internal;
  const filtered = options.filter((option) => String(option.label).toLowerCase().includes(active.toLowerCase()));
  return (
    <div className={cx("biu-ui-autocomplete", className)}>
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Anchor asChild>
          <input
            {...props}
            ref={ref}
            value={active}
            role="combobox"
            aria-expanded={open}
            aria-controls={open ? `${listId}-options` : undefined}
            aria-activedescendant={open && filtered[highlighted] ? `${listId}-option-${highlighted}` : undefined}
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
        </PopoverPrimitive.Anchor>
        {open ? (
          <BiuPortal>
            <PopoverPrimitive.Content
              id={`${listId}-options`}
              role="listbox"
              className="biu-ui-autocomplete__list"
              side="bottom"
              align="start"
              sideOffset={4}
              collisionPadding={8}
              onOpenAutoFocus={(event) => event.preventDefault()}
              data-biu-overlay-interactive="true"
            >
              {filtered.length ? (
                filtered.map((option, index) => (
                  <div key={option.value}>
                    <button
                      id={`${listId}-option-${index}`}
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
                  </div>
                ))
              ) : (
                <div className="biu-ui-autocomplete__empty">{resolvedEmptyContent}</div>
              )}
            </PopoverPrimitive.Content>
          </BiuPortal>
        ) : null}
      </PopoverPrimitive.Root>
    </div>
  );
});
