# @biugle/render-code

`@biugle/render-code` is the framework-neutral code-rendering package for QR codes and barcodes. It wraps the mainstream `qrcode` and `jsbarcode` libraries without introducing React or Vue, so the same API works in React, Vue, HTML and iframe applications.

## Install

```bash
pnpm add @biugle/render-code
```

## QR code

Without a DOM target, `renderQRCode` returns a PNG data URL. With a target it appends a canvas and returns that canvas:

```ts
import { renderQRCode } from "@biugle/render-code";

const dataUrl = await renderQRCode("https://biugle.cn", {
  width: 180,
  margin: 2,
  color: { dark: "#172033", light: "#ffffff" },
});

const canvas = await renderQRCode("order:1001", {
  target: document.querySelector("#qrcode")!,
  clear: true,
});
```

`clear` defaults to `true`, preventing stale codes when a value changes. All renderer options supported by `qrcode` can be passed through.

## Barcode

`renderBarcode` creates an SVG using JsBarcode and appends it to the supplied target:

```ts
import { barcodeDataUrl, renderBarcode } from "@biugle/render-code";

const svg = renderBarcode("890123456789", {
  target: document.querySelector("#barcode")!,
  format: "CODE128",
  displayValue: true,
  lineColor: "#172033",
  height: 54,
});

const svgUrl = barcodeDataUrl(svg);
```

For legacy print plugins that only consume an image source, use the image helpers. They set an optional `<img>` target and return a data URL:

```ts
import { renderBarcodeImage, renderQRCodeImage } from "@biugle/render-code";

const qrDataUrl = await renderQRCodeImage("order:1001", {
  target: document.querySelector("#qr-image")!,
  alt: "订单二维码",
});
const barcodeDataUrl = renderBarcodeImage("890123456789", {
  target: document.querySelector("#barcode-image")!,
  format: "CODE128",
});
```

QR codes use PNG data URLs. Barcodes prefer PNG when the browser canvas can export it and fall back to a base64 SVG data URL when canvas is unavailable. Both forms work with an ordinary `img` element and can be passed to `downloadCode` or a print plugin.

## Downloads and exports

```ts
import { downloadCode } from "@biugle/render-code";

downloadCode(dataUrl, { fileName: "order-1001.png" });
```

`qrcode.render`, `barcode.render`, `barcode.toDataUrl` and `*.download` are convenience aliases. The download helper intentionally requires a browser `Document`; the render functions themselves can generate QR data URLs in non-React environments without a mounted component.

## Demo

The repository Demo menu contains **Render Code 能力展示**, including live QR/barcode generation, SVG/data URL export and download actions. The implementation is a normal page using this package's public entry and does not maintain a second renderer.

## License

MIT
