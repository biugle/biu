import type * as React from "react";
import type { BiuComponentsLocale, BiuComponentsLocaleTextOverrides } from "../../provider.js";

export interface FileLocaleProps {
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
