import * as React from "react";
import { Copy } from "@biugle/icons";
import { cx } from "../../shared/utils.js";
import {
  useComponentsLocale,
  type BiuComponentsLocale,
  type BiuComponentsLocaleTextOverrides,
} from "../../provider.js";
import { Tooltip, Ellipsis } from "./tooltip.js";

export interface CopyTextClassNames {
  root?: string;
  text?: string;
  button?: string;
}

export interface CopyTextProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "content" | "onCopy"> {
  /** The exact string copied to the clipboard and used as fallback content. */
  text: string;
  /** Optional rendered value; the clipboard value always remains `text`. */
  content?: React.ReactNode;
  lines?: number;
  maxWidth?: number | string;
  alwaysTooltip?: boolean;
  /** Keep the copy action hidden until the row is hovered or focused. */
  copyOnHover?: boolean;
  copyLabel?: React.ReactNode;
  copiedLabel?: React.ReactNode;
  locale?: BiuComponentsLocale;
  localeText?: BiuComponentsLocaleTextOverrides;
  onCopy?: (text: string) => void | Promise<void>;
  classNames?: CopyTextClassNames;
}

async function writeClipboardText(value: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Fall through to the legacy DOM API for older printing/webview hosts.
    }
  }
  if (typeof document === "undefined") return false;
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand?.("copy") ?? false;
  textarea.remove();
  return copied;
}

export function CopyText({
  text,
  content,
  lines = 1,
  maxWidth,
  alwaysTooltip = false,
  copyOnHover = false,
  copyLabel,
  copiedLabel,
  locale,
  localeText,
  onCopy,
  className,
  classNames,
  ...props
}: CopyTextProps) {
  const textLocale = useComponentsLocale(locale, localeText);
  const resolvedCopyLabel = copyLabel ?? textLocale["复制文本"];
  const resolvedCopiedLabel = copiedLabel ?? textLocale["已复制"];
  const [copied, setCopied] = React.useState(false);
  const resetTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  React.useEffect(() => () => clearTimeout(resetTimer.current), []);
  const handleCopy = async () => {
    const success = await writeClipboardText(text);
    if (!success) return;
    setCopied(true);
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopied(false), 1600);
    await onCopy?.(text);
  };
  const activeLabel = copied ? resolvedCopiedLabel : resolvedCopyLabel;
  const accessibleLabel =
    typeof activeLabel === "string" ? activeLabel : copied ? textLocale["已复制"] : textLocale["复制文本"];
  return (
    <div
      {...props}
      className={cx("biu-ui-copy-text", copyOnHover && "biu-ui-copy-text--hover", classNames?.root, className)}
      data-biu-component="copy-text"
      data-biu-copy-state={copied ? "copied" : "idle"}
    >
      <Ellipsis
        content={content ?? text}
        tooltipContent={text}
        lines={lines}
        maxWidth={maxWidth}
        alwaysTooltip={alwaysTooltip}
        className={cx("biu-ui-copy-text__text", classNames?.text)}
      />
      <Tooltip content={activeLabel} onlyOverflow={false}>
        <button
          type="button"
          className={cx("biu-ui-copy-text__button", classNames?.button)}
          aria-label={accessibleLabel}
          onClick={handleCopy}
        >
          <Copy size={14} aria-hidden="true" />
        </button>
      </Tooltip>
    </div>
  );
}
