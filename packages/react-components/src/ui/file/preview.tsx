import * as React from "react";
import { Button } from "../button/index.js";
import { Dialog, DialogBody, DialogClose, DialogContent, DialogHeader, DialogTitle } from "../dialog/index.js";
import { cx } from "../../shared/utils.js";
import { useComponentsLocale } from "../../provider.js";
import type { BiuFileItem, FilePreviewKind, FileLocaleProps } from "./types.js";
import { resolveFilePreviewKind, useFileSource } from "./preview-utils.js";

export interface FilePreviewProps extends FileLocaleProps {
  file: BiuFileItem | string;
  name?: string;
  kind?: FilePreviewKind;
  className?: string;
  height?: number | string;
  onDownload?: () => void;
  downloadName?: string;
}

export function FilePreview({
  file,
  name,
  kind = "auto",
  onDownload,
  className,
  height = 320,
  downloadName,
  locale,
  localeText,
}: FilePreviewProps) {
  const text = useComponentsLocale(locale, localeText);
  const item: BiuFileItem = typeof file === "string" ? { uid: file, name: name ?? text["文件"], url: file } : file;
  const fileName = name ?? item.name ?? text["文件"];
  const source = useFileSource(item);
  const resolved = resolveFilePreviewKind(item, kind);
  const style = { height: typeof height === "number" ? `${height}px` : height };
  return (
    <div className={cx("biu-ui-file-preview", className)} data-file-kind={resolved}>
      {source && resolved === "image" ? <img src={source} alt={fileName} style={style} /> : null}
      {/* PDF viewers may need scripts; omitting allow-same-origin keeps the frame isolated from the host. */}
      {source && resolved === "pdf" ? (
        <iframe src={source} title={fileName} style={style} sandbox="allow-scripts" referrerPolicy="no-referrer" />
      ) : null}
      {source && resolved === "video" ? <video controls src={source} style={style} /> : null}
      {source && resolved === "audio" ? <audio controls src={source} /> : null}
      {/* Uploaded text or HTML is untrusted, so the text frame receives no sandbox capabilities. */}
      {source && resolved === "text" ? (
        <iframe src={source} title={fileName} style={style} sandbox="" referrerPolicy="no-referrer" />
      ) : null}
      {!source || resolved === "unsupported" ? (
        <div className="biu-ui-file-preview__empty">{text["暂不支持预览此文件"]}</div>
      ) : null}
      {onDownload ? (
        <Button
          size="small"
          type="secondary"
          variant="text"
          className="biu-ui-file-preview__download-button"
          onClick={onDownload}
        >
          {text["下载"]}
        </Button>
      ) : source ? (
        <a
          className="biu-ui-button biu-ui-button--secondary biu-ui-button--type-secondary biu-ui-button--variant-text biu-ui-button--small biu-ui-file-preview__download-link"
          href={source}
          download={downloadName ?? fileName}
          target="_blank"
          rel="noreferrer"
        >
          <span className="biu-ui-button__content">{text["下载"]}</span>
        </a>
      ) : null}
    </div>
  );
}

export function FileView(props: FilePreviewProps) {
  return <FilePreview {...props} />;
}
export const ImagePreview = (props: Omit<FilePreviewProps, "kind">) => <FilePreview {...props} kind="image" />;
export const PdfPreview = (props: Omit<FilePreviewProps, "kind">) => <FilePreview {...props} kind="pdf" />;
export function FileRender({
  src,
  name,
  kind = "auto",
  onDownload,
  className,
  downloadName,
  locale,
  localeText,
}: {
  src: string;
  name?: string;
  kind?: FilePreviewKind;
  onDownload?: () => void;
  className?: string;
  downloadName?: string;
} & FileLocaleProps) {
  return (
    <FilePreview
      file={{ uid: src, name: name ?? src.split("/").pop() ?? "file", url: src }}
      name={name}
      kind={kind}
      onDownload={onDownload}
      className={className}
      downloadName={downloadName}
      locale={locale}
      localeText={localeText}
    />
  );
}

export function FilePreviewDialog({
  open,
  onOpenChange,
  file,
  title,
  locale,
  localeText,
  ...props
}: FilePreviewProps & { open: boolean; onOpenChange: (open: boolean) => void; title?: React.ReactNode }) {
  const text = useComponentsLocale(locale, localeText);
  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={(next) => onOpenChange(next)} layer="ui">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title ?? (typeof file === "string" ? text["文件"] : file.name)}</DialogTitle>
          <DialogClose aria-label={text["关闭预览"]} />
        </DialogHeader>
        <DialogBody>
          <FilePreview {...props} file={file} locale={locale} localeText={localeText} />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
