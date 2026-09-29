import QRCode, { type QRCodeRenderersOptions, type QRCodeToDataURLOptions } from "qrcode";
import JsBarcode from "jsbarcode";

export interface RenderQRCodeOptions extends QRCodeRenderersOptions {
  type?: QRCodeToDataURLOptions["type"];
  target?: HTMLElement;
  clear?: boolean;
  alt?: string;
}

export interface RenderBarcodeOptions {
  target?: HTMLElement | SVGElement;
  document?: Document;
  format?: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  lineColor?: string;
  background?: string;
  margin?: number;
  fontSize?: number;
  text?: string;
  clear?: boolean;
  [key: string]: unknown;
}

export interface RenderImageOptions {
  target?: HTMLImageElement;
  clear?: boolean;
  alt?: string;
  document?: Document;
}

export interface DownloadCodeOptions {
  fileName?: string;
  document?: Document;
}

function resolveTarget(target?: HTMLElement | SVGElement) {
  if (!target) throw new Error("A target element is required");
  return target;
}

export async function renderQRCode(
  value: string,
  options: RenderQRCodeOptions & { target: HTMLElement },
): Promise<HTMLCanvasElement>;
export async function renderQRCode(value: string, options?: RenderQRCodeOptions): Promise<string>;
export async function renderQRCode(
  value: string,
  options: RenderQRCodeOptions = {},
): Promise<HTMLCanvasElement | string> {
  const target = options.target;
  if (target) {
    if (options.clear !== false) target.replaceChildren();
    const ownerDocument = target.ownerDocument ?? document;
    const canvas = ownerDocument.createElement("canvas");
    target.appendChild(canvas);
    const rendererOptions = { ...options };
    delete rendererOptions.target;
    delete rendererOptions.clear;
    delete rendererOptions.type;
    await QRCode.toCanvas(canvas, value, rendererOptions);
    return canvas;
  }
  const dataOptions = { ...options };
  delete dataOptions.target;
  delete dataOptions.clear;
  return QRCode.toDataURL(value, dataOptions as QRCodeToDataURLOptions);
}

export function renderBarcode(value: string, options: RenderBarcodeOptions = {}) {
  const target = resolveTarget(options.target);
  if (options.clear !== false) target.replaceChildren();
  const ownerDocument = target.ownerDocument ?? document;
  const node = ownerDocument.createElementNS("http://www.w3.org/2000/svg", "svg");
  target.appendChild(node);
  const barcodeOptions = { ...options };
  delete barcodeOptions.target;
  delete barcodeOptions.clear;
  delete barcodeOptions.document;
  JsBarcode(node, value, barcodeOptions);
  return node;
}

function setImageTarget(target: HTMLImageElement | undefined, dataUrl: string, alt?: string, clear = true) {
  if (!target) return;
  if (clear) target.removeAttribute("src");
  target.src = dataUrl;
  if (alt !== undefined) target.alt = alt;
}

/** Render a QR code as an image-compatible data URL for legacy printing integrations. */
export async function renderQRCodeImage(
  value: string,
  options: RenderQRCodeOptions & RenderImageOptions = {},
): Promise<string> {
  const { target, clear, alt, ...dataOptions } = options;
  delete dataOptions.document;
  const dataUrl = await QRCode.toDataURL(value, dataOptions as QRCodeToDataURLOptions);
  setImageTarget(target, dataUrl, alt, clear !== false);
  return dataUrl;
}

function encodeSvgDataUrl(markup: string) {
  const browserBase64 = typeof globalThis.btoa === "function" ? globalThis.btoa : undefined;
  if (browserBase64) {
    const bytes = new TextEncoder().encode(markup);
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return `data:image/svg+xml;base64,${browserBase64(binary)}`;
  }
  return `data:image/svg+xml,${encodeURIComponent(markup)}`;
}

function renderBarcodeSvg(ownerDocument: Document, value: string, barcodeOptions: Record<string, unknown>) {
  const svg = ownerDocument.createElementNS("http://www.w3.org/2000/svg", "svg");
  try {
    JsBarcode(svg, value, barcodeOptions);
  } catch {
    // Some old webviews expose SVG but not canvas text measurement. JsBarcode can still
    // encode the bars when the display label is rendered by this small SVG fallback.
    JsBarcode(svg, value, { ...barcodeOptions, displayValue: false });
    if (barcodeOptions.displayValue !== false) {
      const fontSize = Number(barcodeOptions.fontSize ?? 20);
      const textMargin = Number(barcodeOptions.textMargin ?? 2);
      const text = ownerDocument.createElementNS("http://www.w3.org/2000/svg", "text");
      text.textContent = String(barcodeOptions.text ?? value);
      text.setAttribute("x", String(Number(barcodeOptions.margin ?? 10)));
      text.setAttribute("y", String(Number(barcodeOptions.height ?? 100) + fontSize + textMargin));
      text.setAttribute("font-size", `${fontSize}px`);
      text.setAttribute("font-family", String(barcodeOptions.font ?? "monospace"));
      svg.appendChild(text);
      const currentHeight = Number(svg.getAttribute("height") ?? barcodeOptions.height ?? 100);
      svg.setAttribute("height", String(currentHeight + fontSize + textMargin));
    }
  }
  return svg;
}

/** Render a barcode as a PNG data URL where canvas is available, otherwise an img-safe SVG data URL. */
export function renderBarcodeImage(value: string, options: RenderBarcodeOptions & RenderImageOptions = {}): string {
  const ownerDocument = options.document ?? (typeof document === "undefined" ? undefined : document);
  if (!ownerDocument) throw new Error("A browser document is required to render a barcode image");
  const barcodeOptions = { ...options };
  delete barcodeOptions.target;
  delete barcodeOptions.clear;
  delete barcodeOptions.alt;
  delete barcodeOptions.document;

  let dataUrl: string | undefined;
  try {
    const canvas = ownerDocument.createElement("canvas");
    JsBarcode(canvas, value, barcodeOptions);
    if (typeof canvas.toDataURL === "function") dataUrl = canvas.toDataURL("image/png");
  } catch {
    dataUrl = undefined;
  }
  if (!dataUrl) {
    const svg = renderBarcodeSvg(ownerDocument, value, barcodeOptions);
    const serializer = ownerDocument.defaultView?.XMLSerializer ?? globalThis.XMLSerializer;
    if (!serializer) throw new Error("XMLSerializer is required to render a barcode image");
    dataUrl = encodeSvgDataUrl(new serializer().serializeToString(svg));
  }
  setImageTarget(options.target, dataUrl, options.alt, options.clear !== false);
  return dataUrl;
}

export function mountCodeImage(target: HTMLImageElement, dataUrl: string, options: { alt?: string } = {}) {
  setImageTarget(target, dataUrl, options.alt, false);
  return target;
}

/** Download a generated data URL in browser-based framework integrations. */
export function downloadCode(dataUrl: string, options: DownloadCodeOptions = {}) {
  const ownerDocument = options.document ?? (typeof document === "undefined" ? undefined : document);
  if (!ownerDocument) throw new Error("A browser document is required to download a rendered code");
  const anchor = ownerDocument.createElement("a");
  anchor.href = dataUrl;
  anchor.download = options.fileName ?? "biu-code.png";
  anchor.rel = "noopener";
  ownerDocument.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

/** Serialize a rendered SVG barcode so it can be downloaded or embedded. */
export function barcodeDataUrl(node: SVGElement) {
  const markup = new XMLSerializer().serializeToString(node);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
}

export const qrcode = { render: renderQRCode, download: downloadCode };
export const qrcodeImage = { render: renderQRCodeImage };
export const barcode = {
  render: renderBarcode,
  toDataUrl: barcodeDataUrl,
  image: renderBarcodeImage,
  download: downloadCode,
};
