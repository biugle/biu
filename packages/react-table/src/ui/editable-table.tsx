import * as React from "react";
import {
  DatePicker,
  InputNumber,
  Select,
  TextField,
  Textarea,
  TimePicker,
  Button,
  type SelectOption,
} from "@biugle/react-components";
import { Check, RotateCcw, X } from "@biugle/icons";
import { Table } from "./table.js";
import type { Column, TableProps } from "./types.js";
import { getBiuTableLocaleText, type BiuTableLocaleText } from "../locale/index.js";

export type EditableCellType = "text" | "select" | "inputNumber" | "textarea" | "date" | "time";

export interface EditableCellContext<T extends object> {
  value: unknown;
  record: T;
  index: number;
  draft: unknown;
  setDraft: (value: unknown) => void;
  save: () => void;
  cancel: () => void;
  clear: () => void;
}

export interface EditableCellConfig<T extends object = object> {
  type?: EditableCellType;
  options?: SelectOption[];
  editorProps?: Record<string, unknown>;
  renderEditor?: (context: EditableCellContext<T>) => React.ReactNode;
  onDoubleClick?: (context: Pick<EditableCellContext<T>, "value" | "record" | "index">) => void;
}

export interface EditableColumn<T extends object> extends Column<T> {
  editable?: boolean | EditableCellConfig<T>;
}

export interface EditableCellChange<T extends object> {
  key: React.Key;
  column: string;
  value: unknown;
  record: T;
  index: number;
}

export type EditableEditAction = "start" | "save" | "cancel" | "clear" | "blur";

export interface EditableEditContext<T extends object> {
  action: EditableEditAction;
  key: React.Key;
  column: string;
  value: unknown;
  draft: unknown;
  record: T;
  index: number;
}

export interface EditableTableProps<T extends object> extends Omit<
  TableProps<T>,
  "columns" | "dataSource" | "onChange"
> {
  columns: EditableColumn<T>[];
  dataSource?: T[];
  onChange?: (data: T[], change: EditableCellChange<T>) => void;
  onEditAction?: (context: EditableEditContext<T>) => void;
  onEditStart?: (context: EditableEditContext<T>) => void;
  onEditSave?: (context: EditableEditContext<T>) => void;
  onEditCancel?: (context: EditableEditContext<T>) => void;
  onEditClear?: (context: EditableEditContext<T>) => void;
  onEditBlur?: (context: EditableEditContext<T>) => void;
}

interface EditableCellProps<T extends object> {
  value: unknown;
  record: T;
  index: number;
  column: EditableColumn<T>;
  editing: boolean;
  onStart: () => void;
  onSave: (value: unknown) => void;
  onCancel: () => void;
  onAction: (action: EditableEditAction, draft: unknown) => void;
  text: BiuTableLocaleText;
}

function editableConfig<T extends object>(column: EditableColumn<T>): EditableCellConfig<T> | undefined {
  if (!column.editable) return undefined;
  return column.editable === true ? {} : column.editable;
}

function displayValue<T extends object>(value: unknown, config?: EditableCellConfig<T>): React.ReactNode {
  if (value === null || value === undefined) return "";
  if (config?.type === "select") {
    const values = Array.isArray(value) ? value : [value];
    return values.map((item, index) => {
      const option = config.options?.find((candidate) => String(candidate.value) === String(item));
      return (
        <React.Fragment key={`${String(item)}-${index}`}>
          {index ? "，" : null}
          {option?.label ?? String(item)}
        </React.Fragment>
      );
    });
  }
  if (typeof value === "object" && "format" in value && typeof value.format === "function") {
    const format =
      typeof config?.editorProps?.format === "string"
        ? config.editorProps.format
        : config?.type === "date"
          ? "YYYY-MM-DD"
          : config?.type === "time"
            ? "HH:mm:ss"
            : "YYYY-MM-DD HH:mm:ss";
    return value.format(format);
  }
  return String(value);
}

function isNestedInteractiveTarget(target: EventTarget | null, cell: HTMLElement) {
  if (!(target instanceof Element)) return false;
  const interactive = target.closest("a, button, input, select, textarea, [role='button'], [role='link']");
  return interactive !== null && interactive !== cell;
}

function EditableCell<T extends object>({
  value,
  record,
  index,
  column,
  editing,
  onStart,
  onSave,
  onCancel,
  onAction,
  text,
}: EditableCellProps<T>) {
  const config = editableConfig(column);
  const type = config?.type ?? "text";
  const editorProps = config?.editorProps ?? {};
  const textRef = React.useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const editorRef = React.useRef<HTMLSpanElement>(null);
  const suppressBlurRef = React.useRef(false);
  const blurTimerRef = React.useRef<number | undefined>(undefined);
  const resetFrameRef = React.useRef<number | undefined>(undefined);
  const resetTimerRef = React.useRef<number | undefined>(undefined);
  const editGenerationRef = React.useRef(0);
  const touchTapPendingRef = React.useRef(false);
  const [draft, setDraft] = React.useState<unknown>(value);
  const clearedDraft = () => {
    if (type === "select") return Array.isArray(value) ? [] : undefined;
    if (type === "date" || type === "time") return Array.isArray(value) ? [null, null] : null;
    return type === "textarea" || type === "text" ? "" : undefined;
  };
  const clearDraft = () => {
    const next = clearedDraft();
    setDraft(next);
    onAction("clear", next);
  };
  const normalizedDraft = () => {
    if (type !== "inputNumber") return draft;
    const raw = String(draft ?? "").trim();
    if (!raw) return undefined;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return undefined;
    return editorProps.stringMode ? String(parsed) : parsed;
  };

  React.useEffect(() => {
    editGenerationRef.current += 1;
    if (blurTimerRef.current !== undefined) window.clearTimeout(blurTimerRef.current);
    if (resetFrameRef.current !== undefined) window.cancelAnimationFrame(resetFrameRef.current);
    if (resetTimerRef.current !== undefined) window.clearTimeout(resetTimerRef.current);
    blurTimerRef.current = undefined;
    resetFrameRef.current = undefined;
    resetTimerRef.current = undefined;
    if (!editing) {
      suppressBlurRef.current = false;
      return undefined;
    }
    const generation = editGenerationRef.current;
    setDraft(value);
    textRef.current?.focus();
    return () => {
      if (blurTimerRef.current !== undefined) window.clearTimeout(blurTimerRef.current);
      if (resetFrameRef.current !== undefined) window.cancelAnimationFrame(resetFrameRef.current);
      if (resetTimerRef.current !== undefined) window.clearTimeout(resetTimerRef.current);
      blurTimerRef.current = undefined;
      resetFrameRef.current = undefined;
      resetTimerRef.current = undefined;
      // Invalidate callbacks that were queued in this editing session before
      // the cell is cancelled, saved, replaced, or unmounted.
      if (editGenerationRef.current === generation) editGenerationRef.current += 1;
    };
  }, [editing, value]);

  React.useEffect(
    () => () => {
      if (blurTimerRef.current !== undefined) window.clearTimeout(blurTimerRef.current);
      if (resetFrameRef.current !== undefined) window.cancelAnimationFrame(resetFrameRef.current);
      if (resetTimerRef.current !== undefined) window.clearTimeout(resetTimerRef.current);
    },
    [],
  );

  if (!config || !editing) {
    const rendered = column.renderCell ?? column.render;
    const startEditing = (activation: "double-click" | "touch" | "keyboard") => {
      if (activation === "double-click") config?.onDoubleClick?.({ value, record, index });
      onAction("start", value);
      onStart();
    };
    return (
      <span
        className={config ? "biu-editable-table__cell" : undefined}
        role={config ? "button" : undefined}
        tabIndex={config ? 0 : undefined}
        onPointerDown={
          config
            ? (event) => {
                // Keep desktop activation on double-click; only a real touch
                // pointer may use the single-tap fallback below.
                touchTapPendingRef.current = event.pointerType === "touch" && event.isPrimary;
              }
            : undefined
        }
        onPointerCancel={
          config
            ? () => {
                touchTapPendingRef.current = false;
              }
            : undefined
        }
        onClick={
          config
            ? (event) => {
                const touchTapPending = touchTapPendingRef.current;
                touchTapPendingRef.current = false;
                // A cell can contain its own links or buttons; tapping those
                // actions must not also switch the row into edit mode.
                if (!touchTapPending || isNestedInteractiveTarget(event.target, event.currentTarget)) return;
                startEditing("touch");
              }
            : undefined
        }
        onKeyDown={
          config
            ? (event) => {
                if (event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) return;
                event.preventDefault();
                event.stopPropagation();
                startEditing("keyboard");
              }
            : undefined
        }
        onDoubleClick={
          config
            ? (event) => {
                if (isNestedInteractiveTarget(event.target, event.currentTarget)) return;
                startEditing("double-click");
              }
            : undefined
        }
      >
        {rendered ? rendered(value, record, index) : displayValue(value, config)}
      </span>
    );
  }

  const finishKey = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && type !== "textarea") {
      event.preventDefault();
      const next =
        event.currentTarget instanceof HTMLInputElement || event.currentTarget instanceof HTMLTextAreaElement
          ? event.currentTarget.value
          : draft;
      onAction("save", next);
      onSave(next);
    }
    if (event.key === "Escape") {
      event.preventDefault();
      onAction("cancel", draft);
      onCancel();
    }
  };
  const finishBlur = (event: React.FocusEvent) => {
    if (suppressBlurRef.current) return;
    if (type === "text" || type === "textarea" || type === "inputNumber") {
      const nextValue =
        event.currentTarget instanceof HTMLInputElement || event.currentTarget instanceof HTMLTextAreaElement
          ? event.currentTarget.value
          : draft;
      const generation = editGenerationRef.current;
      if (blurTimerRef.current !== undefined) window.clearTimeout(blurTimerRef.current);
      blurTimerRef.current = window.setTimeout(() => {
        blurTimerRef.current = undefined;
        if (generation !== editGenerationRef.current) return;
        const activeElement = document.activeElement;
        if (
          suppressBlurRef.current ||
          (activeElement instanceof HTMLElement && activeElement.closest(".biu-editable-table__actions")) ||
          (activeElement instanceof HTMLElement && editorRef.current?.contains(activeElement))
        ) {
          suppressBlurRef.current = false;
          return;
        }
        if (type === "inputNumber") {
          const raw = String(nextValue ?? "").trim();
          const parsed = raw === "" ? undefined : Number(raw);
          const normalized = editorProps.stringMode ? (parsed === undefined ? undefined : String(parsed)) : parsed;
          onAction("blur", normalized);
          onSave(normalized);
        } else {
          onAction("blur", nextValue);
          onSave(nextValue);
        }
      }, 0);
    }
  };

  const actionButton = (
    action: "cancel" | "reset" | "save",
    label: string,
    icon: React.ReactNode,
    runAction: () => void,
  ) => (
    <Button
      type={action === "cancel" ? "secondary" : action === "reset" ? "error" : "success"}
      variant="outlined"
      size="small"
      onlyIcon
      icon={icon}
      className="biu-editable-table__action-button"
      tooltip={label}
      aria-label={label}
      onPointerDown={(event) => {
        // The shared Button focuses itself on click; suppress the editor's
        // blur-save during that focus transition and restore the field after it.
        suppressBlurRef.current = true;
        event.preventDefault();
        event.stopPropagation();
      }}
      onMouseDown={(event) => {
        suppressBlurRef.current = true;
        event.preventDefault();
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        suppressBlurRef.current = true;
        if (action === "cancel") onAction("cancel", draft);
        runAction();
        if (action === "reset") {
          if (blurTimerRef.current !== undefined) window.clearTimeout(blurTimerRef.current);
          const generation = editGenerationRef.current;
          resetFrameRef.current = window.requestAnimationFrame(() => {
            resetFrameRef.current = undefined;
            if (generation !== editGenerationRef.current) return;
            editorRef.current?.querySelector<HTMLElement>("input, textarea, [role='combobox']")?.focus();
            resetTimerRef.current = window.setTimeout(() => {
              resetTimerRef.current = undefined;
              if (generation !== editGenerationRef.current) return;
              suppressBlurRef.current = false;
            }, 100);
          });
        }
      }}
    >
      {label}
    </Button>
  );

  const editorActions = (
    <span
      className="biu-editable-table__actions"
      role="group"
      aria-label={text["编辑操作"]}
      onPointerDownCapture={() => {
        suppressBlurRef.current = true;
      }}
      onMouseDownCapture={(event) => {
        suppressBlurRef.current = true;
        event.preventDefault();
      }}
    >
      {actionButton("cancel", text["取消编辑"], <X size={14} />, onCancel)}
      {actionButton("reset", text["清空编辑值"], <RotateCcw size={14} />, clearDraft)}
      {actionButton("save", text["保存编辑"], <Check size={14} />, () => {
        const next = normalizedDraft();
        onAction("save", next);
        onSave(next);
      })}
    </span>
  );

  const editor = (control: React.ReactNode, onEditorBlur?: () => void) => (
    <span ref={editorRef} className="biu-editable-table__editor" onBlur={onEditorBlur}>
      {control}
      {editorActions}
    </span>
  );

  if (config.renderEditor) {
    return editor(
      config.renderEditor({
        value,
        record,
        index,
        draft,
        setDraft,
        save: () => {
          const next = normalizedDraft();
          onAction("save", next);
          onSave(next);
        },
        cancel: () => {
          onAction("cancel", draft);
          onCancel();
        },
        clear: clearDraft,
      }),
    );
  }

  if (type === "select") {
    return editor(
      <Select
        {...editorProps}
        autoFocus
        size="small"
        value={draft as string | string[] | undefined}
        options={config.options ?? []}
        onChange={(next) => setDraft(next)}
        onKeyDown={finishKey}
      />,
    );
  }
  if (type === "inputNumber") {
    return editor(
      <InputNumber
        {...editorProps}
        ref={textRef as React.Ref<HTMLInputElement>}
        autoFocus
        value={draft as number | string | undefined}
        onChange={(next) => setDraft(next)}
        onKeyDown={finishKey}
        onBlur={finishBlur}
      />,
    );
  }
  if (type === "textarea") {
    return editor(
      <Textarea
        {...editorProps}
        ref={textRef as React.Ref<HTMLTextAreaElement>}
        autoFocus
        size="small"
        value={String(draft ?? "")}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={finishKey}
        onBlur={finishBlur}
      />,
    );
  }
  if (type === "date" || type === "time") {
    const Picker = type === "date" ? DatePicker : TimePicker;
    return editor(
      <Picker
        {...editorProps}
        value={draft as React.ComponentProps<typeof DatePicker>["value"]}
        onChange={(next) => setDraft(next)}
      />,
    );
  }
  return editor(
    <TextField
      {...editorProps}
      ref={textRef as React.Ref<HTMLInputElement>}
      autoFocus
      size="small"
      value={String(draft ?? "")}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={finishKey}
      onBlur={finishBlur}
    />,
  );
}

function rowKeyOf<T extends object>(record: T, index: number, rowKey: TableProps<T>["rowKey"]): React.Key {
  if (!rowKey) return String(index);
  if (typeof rowKey === "function") return rowKey(record, index);
  const value = record[rowKey];
  return value === undefined || value === null ? String(index) : (value as React.Key);
}

export function EditableTable<T extends object>({
  columns,
  dataSource = [],
  rowKey,
  onChange,
  onEditAction,
  onEditStart,
  onEditSave,
  onEditCancel,
  onEditClear,
  onEditBlur,
  locale,
  localeText,
  ...props
}: EditableTableProps<T>) {
  const [data, setData] = React.useState(dataSource);
  const [editing, setEditing] = React.useState<{ key: React.Key; column: string }>();
  const text = getBiuTableLocaleText(locale, localeText);

  React.useEffect(() => setData(dataSource), [dataSource]);

  const updateCell = (record: T, index: number, column: EditableColumn<T>, value: unknown) => {
    const key = rowKeyOf(record, index, rowKey);
    setData((current) => {
      const next = current.map((item, itemIndex) =>
        rowKeyOf(item, itemIndex, rowKey) === key ? { ...item, [column.key]: value } : item,
      );
      onChange?.(next, { key, column: column.key, value, record: { ...record, [column.key]: value }, index });
      return next;
    });
    setEditing(undefined);
  };

  const emitEditAction = (
    action: EditableEditAction,
    record: T,
    index: number,
    column: EditableColumn<T>,
    draft: unknown,
  ) => {
    const context: EditableEditContext<T> = {
      action,
      key: rowKeyOf(record, index, rowKey),
      column: column.key,
      value: record[column.key as keyof T],
      draft,
      record,
      index,
    };
    onEditAction?.(context);
    if (action === "start") onEditStart?.(context);
    else if (action === "save") onEditSave?.(context);
    else if (action === "cancel") onEditCancel?.(context);
    else if (action === "clear") onEditClear?.(context);
    else if (action === "blur") onEditBlur?.(context);
  };

  const tableColumns = React.useMemo<Column<T>[]>(
    () =>
      columns.map((column) => ({
        ...column,
        renderCell: (value, record, index) => {
          const key = rowKeyOf(record, index, rowKey);
          return (
            <EditableCell
              value={value}
              record={record}
              index={index}
              column={column}
              editing={editing?.key === key && editing.column === column.key}
              onStart={() => setEditing({ key, column: column.key })}
              onSave={(next) => updateCell(record, index, column, next)}
              onCancel={() => setEditing(undefined)}
              onAction={(action, draft) => emitEditAction(action, record, index, column, draft)}
              text={text}
            />
          );
        },
      })),
    [columns, editing, onEditAction, onEditBlur, onEditCancel, onEditClear, onEditSave, onEditStart, rowKey],
  );

  return (
    <Table
      {...props}
      columns={tableColumns}
      dataSource={data}
      rowKey={rowKey}
      locale={locale}
      localeText={localeText}
    />
  );
}
