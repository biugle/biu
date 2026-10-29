import * as React from "react";
import { File as FileIcon, FileAudio, FileImage, FileVideo, FileText, X } from "@biugle/icons";
import { Button } from "../button/index.js";
import { Ellipsis } from "../overlay/index.js";
import { resolveFilePreviewKind, useFileSource } from "./preview-utils.js";
import { cx } from "../../shared/utils.js";
import {
  useComponentsLocale,
  type BiuComponentsLocale,
  type BiuComponentsLocaleTextOverrides,
} from "../../provider.js";

interface FileLocaleProps {
  locale?: BiuComponentsLocale;
  localeText?: BiuComponentsLocaleTextOverrides;
}

export type BiuFileStatus = "ready" | "uploading" | "success" | "error" | "cancelled";

export interface BiuFileItem {
  uid: string;
  name: string;
  size?: number;
  type?: string;
  url?: string;
  file?: File;
  status?: BiuFileStatus;
  percent?: number;
  error?: React.ReactNode;
  uploadedAt?: number;
}

export interface FileClassNames {
  root?: string;
  icon?: string;
  main?: string;
  name?: string;
  meta?: string;
  progress?: string;
  actions?: string;
  preview?: string;
  download?: string;
  retry?: string;
  cancel?: string;
  remove?: string;
  list?: string;
  trigger?: string;
  empty?: string;
}

export type FilePreviewKind = "auto" | "image" | "pdf" | "video" | "audio" | "text" | "unsupported";

export interface FileListProps extends FileLocaleProps {
  items: BiuFileItem[];
  className?: string;
  onRemove?: (item: BiuFileItem) => void;
  onPreview?: (item: BiuFileItem) => void;
  onRetry?: (item: BiuFileItem) => void;
  onCancel?: (item: BiuFileItem) => void;
  showPreview?: boolean;
  showDownload?: boolean;
  classNames?: FileClassNames;
}

export interface FileUploadProps extends FileLocaleProps {
  fileList?: BiuFileItem[];
  defaultFileList?: BiuFileItem[];
  onFileListChange?: (items: BiuFileItem[]) => void;
  onFiles?: (files: File[]) => void;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onUpload?: (
    item: BiuFileItem,
    context: { signal: AbortSignal; onProgress: (percent: number) => void },
  ) => Promise<Partial<BiuFileItem> | void> | Partial<BiuFileItem> | void;
  /** Standard transport adapter. Returning an abort handle is optional. */
  customRequest?: (options: BiuUploadRequestOptions) => void | Promise<unknown> | (() => void) | { abort?: () => void };
  action?: string;
  filename?: string;
  data?: Record<string, unknown>;
  headers?: Record<string, string>;
  beforeUpload?: (file: File, current: BiuFileItem[]) => boolean | void | Promise<boolean | void>;
  onFileRejected?: (file: File, reason: "accept" | "maxSize") => void;
  onRemove?: (item: BiuFileItem) => void | boolean | Promise<void | boolean>;
  onPreview?: (item: BiuFileItem) => void;
  onCancel?: (item: BiuFileItem) => void;
  multiple?: boolean;
  accept?: string;
  maxSize?: number;
  maxCount?: number;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
  classNames?: FileClassNames;
  listClassName?: string;
  showFileList?: boolean;
  autoUpload?: boolean;
  drag?: boolean;
  onDrop?: (files: File[]) => void;
  onUploadStart?: (item: BiuFileItem) => void;
  onUploadProgress?: (item: BiuFileItem, percent: number) => void;
  onUploadSuccess?: (item: BiuFileItem) => void;
  onUploadError?: (item: BiuFileItem, error: unknown) => void;
}

export interface BiuUploadRequestOptions {
  file: File;
  filename: string;
  action?: string;
  data?: Record<string, unknown>;
  headers?: Record<string, string>;
  signal: AbortSignal;
  onProgress: (percent: number) => void;
  onSuccess: (response?: unknown) => void;
  onError: (error: unknown) => void;
}

function makeUid(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatFileSize(size?: number) {
  if (!Number.isFinite(size) || !size) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  return `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function formatUploadedAt(timestamp: number | undefined, locale?: string) {
  if (!timestamp) return "";
  try {
    return new Intl.DateTimeFormat(locale?.toLowerCase().startsWith("en") ? "en-US" : "zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(timestamp);
  } catch {
    return new Date(timestamp).toLocaleString();
  }
}

function toFileItem(file: File): BiuFileItem {
  return { uid: makeUid(file), name: file.name, size: file.size, type: file.type, file, status: "ready", percent: 0 };
}

export function fileMatchesAccept(file: Pick<File, "name" | "type">, accept?: string) {
  if (!accept?.trim()) return true;
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return accept
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .some((rule) => {
      if (rule.startsWith(".")) return name.endsWith(rule);
      if (rule.endsWith("/*")) return type.startsWith(rule.slice(0, -1));
      return type === rule;
    });
}

function FileKindIcon({ kind }: { kind: FilePreviewKind }) {
  const Icon =
    kind === "image"
      ? FileImage
      : kind === "video"
        ? FileVideo
        : kind === "audio"
          ? FileAudio
          : kind === "text" || kind === "pdf"
            ? FileText
            : FileIcon;
  return <Icon size={16} aria-hidden="true" />;
}

export function FileItem({
  item,
  className,
  onRemove,
  onPreview,
  onRetry,
  onCancel,
  showPreview = true,
  showDownload = true,
  locale,
  localeText,
  classNames,
}: {
  item: BiuFileItem;
  className?: string;
  showPreview?: boolean;
  showDownload?: boolean;
  onRemove?: () => void;
  onPreview?: () => void;
  onRetry?: () => void;
  onCancel?: () => void;
  classNames?: FileClassNames;
} & FileLocaleProps) {
  const text = useComponentsLocale(locale, localeText);
  const status = item.status ?? "ready";
  const source = useFileSource(item);
  const kind = resolveFilePreviewKind(item);
  const meta = [
    formatFileSize(item.size),
    status === "uploading" ? `${Math.round(item.percent ?? 0)}% ${text["上传中"]}` : "",
    status === "success" ? text["成功"] : "",
    status === "cancelled" ? text["已取消"] : "",
    status === "error" ? (item.error ?? text["失败"]) : "",
    item.uploadedAt ? formatUploadedAt(item.uploadedAt, locale) : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const canPreview = kind !== "unsupported" && Boolean(source);
  return (
    <div
      className={cx("biu-ui-file-item", `biu-ui-file-item--${status}`, classNames?.root, className)}
      data-file-uid={item.uid}
    >
      <span className={cx("biu-ui-file-item__icon", classNames?.icon)} aria-hidden="true">
        <FileKindIcon kind={kind} />
      </span>
      <span className={cx("biu-ui-file-item__main", classNames?.main)}>
        <Ellipsis content={item.name} maxWidth={240} className={cx("biu-ui-file-item__name", classNames?.name)} />
        {meta ? <span className={cx("biu-ui-file-item__meta", classNames?.meta)}>{meta}</span> : null}
        {status === "uploading" ? (
          <span className={cx("biu-ui-file-item__progress", classNames?.progress)}>
            <span style={{ width: `${Math.max(0, Math.min(100, item.percent ?? 0))}%` }} />
          </span>
        ) : null}
      </span>
      <span className={cx("biu-ui-file-item__actions", classNames?.actions)}>
        {showPreview && canPreview ? (
          <Button
            size="small"
            type="secondary"
            variant="text"
            className={classNames?.preview}
            onClick={() => {
              onPreview?.();
            }}
            aria-label={text["预览"]}
          >
            {text["预览"]}
          </Button>
        ) : null}
        {showDownload && source ? (
          <a
            className={cx(
              "biu-ui-button",
              "biu-ui-button--secondary",
              "biu-ui-button--type-secondary",
              "biu-ui-button--variant-text",
              "biu-ui-button--small",
              "biu-ui-file-item__download-link",
              classNames?.download,
            )}
            href={source}
            download={item.name}
            target="_blank"
            rel="noreferrer"
          >
            <span className="biu-ui-button__content">{text["下载"]}</span>
          </a>
        ) : null}
        {(status === "error" || status === "cancelled") && onRetry ? (
          <Button size="small" type="secondary" variant="text" className={classNames?.retry} onClick={onRetry}>
            {text["重试"]}
          </Button>
        ) : null}
        {status === "uploading" && onCancel ? (
          <Button size="small" type="secondary" variant="text" className={classNames?.cancel} onClick={onCancel}>
            {text["取消"]}
          </Button>
        ) : null}
        {onRemove ? (
          <Button
            size="small"
            type="secondary"
            variant="text"
            className={classNames?.remove}
            onClick={onRemove}
            aria-label={text["移除"]}
          >
            {text["移除"]}
          </Button>
        ) : null}
      </span>
    </div>
  );
}

export function FileList({
  items,
  className,
  onRemove,
  onPreview,
  onRetry,
  onCancel,
  classNames,
  showPreview = true,
  showDownload = true,
  locale,
  localeText,
}: FileListProps) {
  const text = useComponentsLocale(locale, localeText);
  if (!items.length) return null;
  return (
    <div className={cx("biu-ui-file-list", classNames?.list, className)} aria-label={text["文件列表"]}>
      {items.map((item) => (
        <FileItem
          key={item.uid}
          item={item}
          onRemove={() => onRemove?.(item)}
          onPreview={() => onPreview?.(item)}
          onRetry={() => onRetry?.(item)}
          onCancel={() => onCancel?.(item)}
          showPreview={showPreview}
          showDownload={showDownload}
          locale={locale}
          localeText={localeText}
          classNames={classNames}
        />
      ))}
    </div>
  );
}

export function Upload({
  fileList,
  defaultFileList = [],
  onFileListChange,
  onFiles,
  children,
  className,
  classNames,
  listClassName,
  multiple = false,
  accept,
  disabled = false,
  onChange,
  onUpload,
  beforeUpload,
  onRemove,
  onPreview,
  maxCount,
  showFileList = true,
  autoUpload = true,
  customRequest,
  action,
  filename,
  data,
  headers,
  maxSize,
  onFileRejected,
  onCancel,
  onDrop,
  onUploadStart,
  onUploadProgress,
  onUploadSuccess,
  onUploadError,
  drag = false,
  locale,
  localeText,
}: FileUploadProps) {
  const text = useComponentsLocale(locale, localeText);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const [internal, setInternal] = React.useState<BiuFileItem[]>(defaultFileList);
  const items = fileList ?? internal;
  const itemsRef = React.useRef(items);
  itemsRef.current = items;
  const controllersRef = React.useRef(new Map<string, AbortController>());
  const abortersRef = React.useRef(new Map<string, () => void>());
  const mountedRef = React.useRef(true);
  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      controllersRef.current.forEach((controller) => controller.abort());
      abortersRef.current.forEach((abort) => {
        try {
          abort();
        } catch {
          // One custom transport must not prevent the remaining uploads from
          // receiving their unmount cancellation signal.
        }
      });
      controllersRef.current.clear();
      abortersRef.current.clear();
    };
  }, []);
  const updateItems = React.useCallback(
    (next: BiuFileItem[]) => {
      // Keep async upload callbacks in sync with the next controlled/uncontrolled
      // snapshot before React schedules the render. Without this, autoUpload can
      // immediately update an item against the previous list and lose progress.
      itemsRef.current = next;
      if (fileList === undefined) setInternal(next);
      onFileListChange?.(next);
    },
    [fileList, onFileListChange],
  );

  const uploadItem = React.useCallback(
    async (item: BiuFileItem, force = false) => {
      if ((!onUpload && !customRequest) || !item.file || (!autoUpload && !force)) return;
      const controller = new AbortController();
      controllersRef.current.set(item.uid, controller);
      try {
        updateItems(
          itemsRef.current.map((current) =>
            current.uid === item.uid ? { ...current, status: "uploading", percent: 0 } : current,
          ),
        );
        onUploadStart?.(item);
        let result: Partial<BiuFileItem> | void;
        const onProgress = (percent: number) => {
          if (controller.signal.aborted || !mountedRef.current) return;
          const bounded = Math.max(0, Math.min(100, percent));
          updateItems(
            itemsRef.current.map((current) =>
              current.uid === item.uid ? { ...current, status: "uploading", percent: bounded } : current,
            ),
          );
          onUploadProgress?.(item, bounded);
        };
        if (customRequest) {
          let settled = false;
          let resolveRequest!: (response?: unknown) => void;
          let rejectRequest!: (error: unknown) => void;
          const response = new Promise<unknown>((resolve, reject) => {
            resolveRequest = resolve;
            rejectRequest = reject;
          });
          const onSuccess = (value?: unknown) => {
            if (settled) return;
            settled = true;
            resolveRequest(value);
          };
          const onError = (error: unknown) => {
            if (settled) return;
            settled = true;
            rejectRequest(error);
          };
          const abortListener = () => onError(new Error("Upload cancelled"));
          controller.signal.addEventListener("abort", abortListener, { once: true });
          try {
            const requestResult = customRequest({
              file: item.file,
              filename: filename ?? item.name,
              action,
              data,
              headers,
              signal: controller.signal,
              onProgress,
              onSuccess,
              onError,
            });
            if (typeof requestResult === "function") abortersRef.current.set(item.uid, requestResult);
            else if (requestResult && typeof requestResult === "object" && "abort" in requestResult)
              abortersRef.current.set(item.uid, () => requestResult.abort?.());
            if (requestResult && typeof requestResult === "object" && "then" in requestResult)
              void Promise.resolve(requestResult).then(onSuccess, onError);
          } catch (error) {
            onError(error);
          }
          const requestResponse = await response;
          controller.signal.removeEventListener("abort", abortListener);
          if (requestResponse && typeof requestResponse === "object" && !Array.isArray(requestResponse)) {
            const candidate = requestResponse as Partial<BiuFileItem>;
            if ("url" in candidate || "name" in candidate || "size" in candidate) result = candidate;
          }
        } else {
          result = await onUpload?.(item, { signal: controller.signal, onProgress });
        }
        if (!controller.signal.aborted) {
          const completed = itemsRef.current.map((current) =>
            current.uid === item.uid
              ? {
                  ...current,
                  ...result,
                  status: "success" as const,
                  percent: 100,
                  uploadedAt: Date.now(),
                  error: undefined,
                }
              : current,
          );
          updateItems(completed);
          onUploadSuccess?.(completed.find((current) => current.uid === item.uid) ?? item);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          const failed = itemsRef.current.map((current) =>
            current.uid === item.uid
              ? { ...current, status: "error" as const, error: error instanceof Error ? error.message : text["失败"] }
              : current,
          );
          updateItems(failed);
          onUploadError?.(failed.find((current) => current.uid === item.uid) ?? item, error);
        }
      } finally {
        controllersRef.current.delete(item.uid);
        abortersRef.current.delete(item.uid);
      }
    },
    [
      action,
      autoUpload,
      customRequest,
      data,
      filename,
      headers,
      onUpload,
      onUploadError,
      onUploadProgress,
      onUploadStart,
      onUploadSuccess,
      text["失败"],
      updateItems,
    ],
  );

  const handleFiles = async (files: File[]) => {
    const accepted: BiuFileItem[] = [];
    for (const file of files) {
      if (!mountedRef.current) return;
      // Validate candidates in order before applying maxCount. A rejected
      // candidate must not consume the available slot for a later valid file.
      if (maxCount !== undefined && itemsRef.current.length + accepted.length >= maxCount) break;
      if (!fileMatchesAccept(file, accept)) {
        onFileRejected?.(file, "accept");
        continue;
      }
      if (maxSize !== undefined && file.size > maxSize) {
        onFileRejected?.(file, "maxSize");
        continue;
      }
      if (beforeUpload && (await beforeUpload(file, itemsRef.current)) === false) continue;
      if (!mountedRef.current) return;
      accepted.push(toFileItem(file));
    }
    if (!mountedRef.current || !accepted.length) return;
    // A drag/drop event can contain several files even when the input is not
    // configured with `multiple`. Keep the visible queue and the upload queue
    // aligned so a non-multiple control never uploads hidden files.
    const acceptedForQueue = multiple ? accepted : accepted.slice(-1);
    const next = multiple ? [...itemsRef.current, ...acceptedForQueue] : acceptedForQueue;
    updateItems(next);
    onFiles?.(acceptedForQueue.map((item) => item.file as File));
    if ((onUpload || customRequest) && autoUpload) await Promise.all(acceptedForQueue.map((item) => uploadItem(item)));
  };

  const removeItem = async (item: BiuFileItem) => {
    const result = await onRemove?.(item);
    if (result === false) return;
    abortersRef.current.get(item.uid)?.();
    abortersRef.current.delete(item.uid);
    controllersRef.current.get(item.uid)?.abort();
    updateItems(itemsRef.current.filter((current) => current.uid !== item.uid));
  };

  const cancelItem = (item: BiuFileItem) => {
    if (item.status !== "uploading") return;
    abortersRef.current.get(item.uid)?.();
    abortersRef.current.delete(item.uid);
    controllersRef.current.get(item.uid)?.abort();
    const next = itemsRef.current.map((current) =>
      current.uid === item.uid ? { ...current, status: "cancelled" as const, error: undefined } : current,
    );
    updateItems(next);
    onCancel?.(next.find((current) => current.uid === item.uid) ?? item);
  };

  return (
    <div className={cx("biu-ui-upload-control", drag && "biu-ui-upload-control--drag", classNames?.root, className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        className={cx(
          "biu-ui-upload",
          disabled && "biu-ui-upload--disabled",
          dragging && "biu-ui-upload--dragging",
          classNames?.trigger,
        )}
        onClick={() => {
          if (!disabled) inputRef.current?.click();
        }}
        onKeyDown={(event) => {
          if (disabled || (event.key !== "Enter" && event.key !== " ")) return;
          event.preventDefault();
          inputRef.current?.click();
        }}
        onDragOver={(event) => {
          if (!drag || disabled) return;
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          if (!drag || disabled) return;
          event.preventDefault();
          setDragging(false);
          const dropped = Array.from(event.dataTransfer.files ?? []);
          onDrop?.(dropped);
          void handleFiles(dropped);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          disabled={disabled}
          hidden
          onChange={(event) => {
            void handleFiles(Array.from(event.target.files ?? []));
            onChange?.(event);
            event.currentTarget.value = "";
          }}
        />
        {children ?? text["选择文件"]}
      </div>
      {showFileList ? (
        <FileList
          items={items}
          className={cx(listClassName, classNames?.list)}
          onRemove={(item) => void removeItem(item)}
          onPreview={onPreview}
          onRetry={(item) => void uploadItem(item, true)}
          onCancel={cancelItem}
          locale={locale}
          localeText={localeText}
          classNames={classNames}
        />
      ) : null}
    </div>
  );
}

export function FileCard({
  name,
  size,
  onRemove,
  className,
  locale,
  localeText,
}: { name: string; size?: string; onRemove?: () => void; className?: string } & FileLocaleProps) {
  const text = useComponentsLocale(locale, localeText);
  return (
    <div className={cx("biu-ui-file-card", className)}>
      <span className="biu-ui-file-card__name">{name}</span>
      {size ? <small>{size}</small> : null}
      {onRemove ? (
        <button type="button" onClick={onRemove} aria-label={text["移除"]}>
          <X size={14} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

export { resolveFilePreviewKind } from "./preview-utils.js";
export { FilePreview, FileView, FileRender, ImagePreview, PdfPreview, FilePreviewDialog } from "./preview.js";
export type { FilePreviewProps } from "./preview.js";
