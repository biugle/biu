import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight } from "@biugle/icons";
import { Ellipsis } from "../overlay/index.js";
import { cx } from "../../shared/utils.js";

export interface DropdownMenuItem {
  key: string;
  label?: React.ReactNode;
  disabled?: boolean;
  /** Optional action invoked after Radix accepts the item selection. */
  onClick?: () => void;
  icon?: React.ReactNode;
  shortcut?: React.ReactNode;
  type?: "item" | "checkbox" | "radio" | "separator" | "label";
  checked?: boolean;
  /** Radio items in the same group share one selected value. */
  radioGroup?: string;
  children?: DropdownMenuItem[];
}

interface DropdownRenderContext {
  checkedKeys: Set<string>;
  toggleChecked: (key: string, checked: boolean) => void;
  radioValues: Record<string, string | undefined>;
  selectRadio: (group: string, value: string) => void;
}

function renderDropdownLabel(label: React.ReactNode) {
  return (
    <Ellipsis tooltipContent={label} className="biu-ui-dropdown-menu__label-text" maxWidth="100%">
      {label}
    </Ellipsis>
  );
}

function collectDropdownState(items: DropdownMenuItem[], checked: string[], radios: Record<string, string>) {
  for (const item of items) {
    if (item.type === "checkbox" && item.checked) checked.push(item.key);
    if (item.type === "radio" && item.checked) radios[item.radioGroup ?? "default"] = item.key;
    if (item.children?.length) collectDropdownState(item.children, checked, radios);
  }
}

function collectDropdownRadioGroups(items: DropdownMenuItem[], groups: string[] = []) {
  for (const item of items) {
    if (item.type === "radio") {
      const group = item.radioGroup ?? "default";
      if (!groups.includes(group)) groups.push(group);
    }
    if (item.children?.length) collectDropdownRadioGroups(item.children, groups);
  }
  return groups;
}

function renderRadioItem(item: DropdownMenuItem, className?: string, onSelect?: (key: string) => void) {
  return (
    <DropdownMenuPrimitive.RadioItem
      key={item.key}
      value={item.key}
      disabled={item.disabled}
      onSelect={() => {
        onSelect?.(item.key);
        item.onClick?.();
      }}
      className={cx("biu-ui-dropdown-menu__item", className)}
    >
      {item.icon ? <span className="biu-ui-dropdown-menu__icon">{item.icon}</span> : null}
      {renderDropdownLabel(item.label)}
      {item.shortcut ? <kbd className="biu-ui-dropdown-menu__shortcut">{item.shortcut}</kbd> : null}
      <DropdownMenuPrimitive.ItemIndicator className="biu-ui-dropdown-menu__indicator">
        <Check size={14} aria-hidden="true" />
      </DropdownMenuPrimitive.ItemIndicator>
    </DropdownMenuPrimitive.RadioItem>
  );
}

function renderDropdownItems(
  items: DropdownMenuItem[],
  onSelect: ((key: string) => void) | undefined,
  context: DropdownRenderContext,
  className?: string,
): React.ReactNode {
  const result: React.ReactNode[] = [];
  let radioItems: DropdownMenuItem[] = [];
  let radioGroup = "";
  const flushRadioItems = () => {
    if (!radioItems.length) return;
    const group = radioGroup;
    const itemsForGroup = radioItems;
    result.push(
      <DropdownMenuPrimitive.RadioGroup
        key={`radio-group-${group}-${itemsForGroup.map((item) => item.key).join("-")}`}
        value={context.radioValues[group] ?? ""}
        onValueChange={(value) => context.selectRadio(group, value)}
      >
        {itemsForGroup.map((item) => renderRadioItem(item, className, onSelect))}
      </DropdownMenuPrimitive.RadioGroup>,
    );
    radioItems = [];
    radioGroup = "";
  };

  for (const item of items) {
    if (item.type === "radio") {
      const nextGroup = item.radioGroup ?? "default";
      if (radioItems.length && radioGroup !== nextGroup) flushRadioItems();
      radioGroup = nextGroup;
      radioItems.push(item);
      continue;
    }
    flushRadioItems();
    if (item.type === "separator") {
      result.push(<DropdownMenuPrimitive.Separator key={item.key} className="biu-ui-dropdown-menu__separator" />);
    } else if (item.type === "label") {
      result.push(
        <DropdownMenuPrimitive.Label key={item.key} className="biu-ui-dropdown-menu__label">
          {renderDropdownLabel(item.label)}
        </DropdownMenuPrimitive.Label>,
      );
    } else if (item.children?.length) {
      result.push(
        <DropdownMenuPrimitive.Sub key={item.key}>
          <DropdownMenuPrimitive.SubTrigger
            className={cx("biu-ui-dropdown-menu__item", className)}
            disabled={item.disabled}
          >
            {item.icon ? <span className="biu-ui-dropdown-menu__icon">{item.icon}</span> : null}
            {renderDropdownLabel(item.label)}
            <ChevronRight className="biu-ui-dropdown-menu__chevron" size={14} aria-hidden="true" />
          </DropdownMenuPrimitive.SubTrigger>
          <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.SubContent
              className="biu-ui-popover__content biu-ui-dropdown__content"
              sideOffset={4}
              collisionPadding={8}
              data-biu-overlay-interactive="true"
            >
              {renderDropdownItems(item.children, onSelect, context, className)}
            </DropdownMenuPrimitive.SubContent>
          </DropdownMenuPrimitive.Portal>
        </DropdownMenuPrimitive.Sub>,
      );
    } else if (item.type === "checkbox") {
      result.push(
        <DropdownMenuPrimitive.CheckboxItem
          key={item.key}
          checked={context.checkedKeys.has(item.key)}
          disabled={item.disabled}
          onCheckedChange={(checked) => context.toggleChecked(item.key, checked)}
          onSelect={() => {
            onSelect?.(item.key);
            item.onClick?.();
          }}
          className={cx("biu-ui-dropdown-menu__item", className)}
        >
          {item.icon ? <span className="biu-ui-dropdown-menu__icon">{item.icon}</span> : null}
          {renderDropdownLabel(item.label)}
          {item.shortcut ? <kbd className="biu-ui-dropdown-menu__shortcut">{item.shortcut}</kbd> : null}
          <DropdownMenuPrimitive.ItemIndicator className="biu-ui-dropdown-menu__indicator">
            <Check size={14} aria-hidden="true" />
          </DropdownMenuPrimitive.ItemIndicator>
        </DropdownMenuPrimitive.CheckboxItem>,
      );
    } else {
      result.push(
        <DropdownMenuPrimitive.Item
          key={item.key}
          disabled={item.disabled}
          onSelect={() => {
            onSelect?.(item.key);
            item.onClick?.();
          }}
          className={cx("biu-ui-dropdown-menu__item", className)}
        >
          {item.icon ? <span className="biu-ui-dropdown-menu__icon">{item.icon}</span> : null}
          {renderDropdownLabel(item.label)}
          {item.shortcut ? <kbd className="biu-ui-dropdown-menu__shortcut">{item.shortcut}</kbd> : null}
        </DropdownMenuPrimitive.Item>,
      );
    }
  }
  flushRadioItems();
  return result;
}

export interface DropdownMenuClassNames {
  root?: string;
  trigger?: string;
  content?: string;
  menu?: string;
  item?: string;
  label?: string;
  separator?: string;
  header?: string;
  footer?: string;
}

export function DropdownMenu({
  trigger,
  items,
  onSelect,
  className,
  open,
  defaultOpen,
  onOpenChange,
  disabled = false,
  classNames,
  checkedKeys,
  defaultCheckedKeys,
  onCheckedChange,
  radioValue,
  defaultRadioValue,
  radioValues,
  defaultRadioValues,
  onRadioChange,
  dropdownRender,
  dropdownHeader,
  dropdownFooter,
}: {
  trigger: React.ReactNode;
  items: DropdownMenuItem[];
  onSelect?: (key: string) => void;
  className?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  classNames?: DropdownMenuClassNames;
  checkedKeys?: string[];
  defaultCheckedKeys?: string[];
  onCheckedChange?: (keys: string[]) => void;
  radioValue?: string;
  defaultRadioValue?: string;
  radioValues?: Record<string, string | undefined>;
  defaultRadioValues?: Record<string, string | undefined>;
  onRadioChange?: (value: string, group: string) => void;
  dropdownRender?: (menu: React.ReactNode) => React.ReactNode;
  dropdownHeader?: React.ReactNode;
  dropdownFooter?: React.ReactNode;
}) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen ?? false);
  const initialState = React.useMemo(() => {
    const checked: string[] = [];
    const radios: Record<string, string> = {};
    collectDropdownState(items, checked, radios);
    const groups = collectDropdownRadioGroups(items);
    if (defaultRadioValue !== undefined && groups.length && !Object.values(radios).length) {
      radios[groups[0]] = defaultRadioValue;
    }
    return { checked, radios };
  }, [defaultRadioValue, items]);
  const [internalCheckedKeys, setInternalCheckedKeys] = React.useState<string[]>(
    defaultCheckedKeys ?? initialState.checked,
  );
  const [internalRadioValues, setInternalRadioValues] = React.useState<Record<string, string | undefined>>(() => ({
    ...initialState.radios,
    ...defaultRadioValues,
    ...(defaultRadioValue === undefined ? {} : { default: defaultRadioValue }),
  }));
  const active = open ?? internalOpen;
  const activeCheckedKeys = checkedKeys ?? internalCheckedKeys;
  const activeRadioValues = radioValues ?? internalRadioValues;
  const setActive = (next: boolean) => {
    if (disabled) return;
    if (open === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  };
  const context: DropdownRenderContext = {
    checkedKeys: new Set(activeCheckedKeys),
    toggleChecked: (key, checked) => {
      const next = checked
        ? [...new Set([...activeCheckedKeys, key])]
        : activeCheckedKeys.filter((current) => current !== key);
      if (checkedKeys === undefined) setInternalCheckedKeys(next);
      onCheckedChange?.(next);
    },
    radioValues: {
      ...activeRadioValues,
      ...(radioValue === undefined ? {} : { default: radioValue }),
    },
    selectRadio: (group, value) => {
      const next = { ...activeRadioValues, [group]: value };
      if (radioValues === undefined) setInternalRadioValues(next);
      onRadioChange?.(value, group);
    },
  };
  const triggerNode = React.isValidElement(trigger) ? (
    React.cloneElement(
      trigger as React.ReactElement<{ className?: string; disabled?: boolean; "aria-disabled"?: boolean }>,
      {
        className: cx(
          (trigger.props as { className?: string }).className,
          "biu-ui-dropdown__trigger-control",
          classNames?.trigger,
        ),
        disabled: disabled || (trigger.props as { disabled?: boolean }).disabled,
        "aria-disabled": disabled || (trigger.props as { "aria-disabled"?: boolean })["aria-disabled"] || undefined,
      },
    )
  ) : (
    <button type="button" className={cx("biu-ui-dropdown__trigger-control", classNames?.trigger)} disabled={disabled}>
      {trigger}
    </button>
  );
  return (
    <DropdownMenuPrimitive.Root open={active} onOpenChange={setActive}>
      <div
        className={cx("biu-ui-popover biu-ui-dropdown", classNames?.root, className)}
        data-biu-component="dropdown-menu"
        data-state={active ? "open" : "closed"}
      >
        <DropdownMenuPrimitive.Trigger asChild>{triggerNode}</DropdownMenuPrimitive.Trigger>
        <DropdownMenuPrimitive.Portal container={typeof document === "undefined" ? undefined : document.body}>
          <DropdownMenuPrimitive.Content
            className={cx("biu-ui-popover__content biu-ui-dropdown__content", classNames?.content)}
            sideOffset={6}
            collisionPadding={8}
            align="start"
            data-biu-slot="dropdown-content"
            data-biu-overlay-interactive="true"
          >
            {dropdownHeader ? (
              <div className={cx("biu-ui-dropdown__header", classNames?.header)}>{dropdownHeader}</div>
            ) : null}
            {dropdownRender?.(
              <ul className={cx("biu-ui-dropdown-menu", classNames?.menu)}>
                {renderDropdownItems(items, onSelect, context, classNames?.item)}
              </ul>,
            ) ?? (
              <ul className={cx("biu-ui-dropdown-menu", classNames?.menu)}>
                {renderDropdownItems(items, onSelect, context, classNames?.item)}
              </ul>
            )}
            {dropdownFooter ? (
              <div className={cx("biu-ui-dropdown__footer", classNames?.footer)}>{dropdownFooter}</div>
            ) : null}
          </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
      </div>
    </DropdownMenuPrimitive.Root>
  );
}
