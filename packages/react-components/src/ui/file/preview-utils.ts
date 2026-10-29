import * as React from "react";
import type { BiuFileItem, FilePreviewKind } from "./index.js";

export function resolveFilePreviewKind(
  item: Pick<BiuFileItem, "name" | "type" | "url">,
  requested: FilePreviewKind = "auto",
) {
  if (requested !== "auto") return requested;
  const type = item.type?.toLowerCase() ?? "";
  const name = item.name.toLowerCase();
  if (type.startsWith("image/") || /\.(png|jpe?g|gif|svg|webp|avif|bmp|ico)$/i.test(name)) return "image";
  if (type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (type.startsWith("video/") || /\.(mp4|webm|mov|m4v|ogv)$/i.test(name)) return "video";
  if (type.startsWith("audio/") || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(name)) return "audio";
  if (type.startsWith("text/") || /\.(txt|md|json|csv|log|xml|html|css|js|ts|tsx|vue)$/i.test(name)) return "text";
  return "unsupported";
}

function safeFileUrl(value?: string) {
  const candidate = value?.trim();
  if (!candidate) return undefined;
  try {
    const base = typeof window === "undefined" ? "http://localhost/" : window.location.href;
    const url = new URL(candidate, base);
    if (!["http:", "https:", "blob:"].includes(url.protocol) || url.username || url.password) return undefined;
    return candidate;
  } catch {
    return undefined;
  }
}

export function useFileSource(item: Pick<BiuFileItem, "file" | "url">) {
  const [source, setSource] = React.useState(() => safeFileUrl(item.url));
  React.useEffect(() => {
    if (item.url) {
      setSource(safeFileUrl(item.url));
      return undefined;
    }
    if (!item.file || typeof URL === "undefined" || typeof URL.createObjectURL !== "function") {
      setSource(undefined);
      return undefined;
    }
    const objectUrl = URL.createObjectURL(item.file);
    setSource(objectUrl);
    return () => URL.revokeObjectURL?.(objectUrl);
  }, [item.file, item.url]);
  return source;
}
