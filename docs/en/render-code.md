# Render Code

`@biugle/render-code` is a framework-neutral QR/barcode package built on `qrcode` and `jsbarcode`. It has no React, Vue, Runtime or Preset dependency.

## API

| API                               | Purpose                                                                                                            |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `renderQRCode(value, options?)`   | Returns an image data URL (PNG by default) without a target, or clears/appends a canvas when a target is provided. |
| `renderBarcode(value, options)`   | Creates a JsBarcode SVG in the target.                                                                             |
| `barcodeDataUrl(svg)`             | Converts a generated SVG to a downloadable/embeddable data URL.                                                    |
| `downloadCode(dataUrl, options?)` | Starts a browser download; the default file name is `biu-code.png`.                                                |
| `qrcode` / `barcode`              | Convenience namespaces for the same methods.                                                                       |

`clear` defaults to `true`, so changing a value does not leave an old code behind. QR renderer options and barcode configuration are passed through to the underlying libraries. `downloadCode` requires a browser `Document`; rendering itself does not require a mounted React component.

`renderBarcode` accepts optional options at the type level but requires a `target` at runtime; omission throws `A target element is required`. `renderQRCodeImage(value, options?)` and `renderBarcodeImage(value, options?)` return data URLs with optional image targets. Barcode images still need a browser `Document` or an explicit `document`. Untargeted QR rendering defaults to PNG and accepts the underlying library's image MIME types through `type`; targeted QR rendering returns a canvas.

## Example

```ts
import { barcodeDataUrl, downloadCode, renderBarcode, renderQRCode } from "@biugle/render-code";

const png = await renderQRCode("order:1001");
downloadCode(png, { fileName: "order-1001.png" });

const svg = renderBarcode("890123456789", { target: document.querySelector<HTMLElement>("#barcode")! });
downloadCode(barcodeDataUrl(svg), { fileName: "order-1001.svg" });
```

The Demo **Render Code** page covers live generation, canvas/SVG previews, data URL export and downloads.
