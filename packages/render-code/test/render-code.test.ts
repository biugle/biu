import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM, VirtualConsole } from "jsdom";
import {
  barcode,
  barcodeDataUrl,
  downloadCode,
  qrcode,
  qrcodeImage,
  renderBarcodeImage,
  renderQRCode,
  renderQRCodeImage,
} from "../src/index.js";

test("renderQRCode returns a data URL without requiring a DOM target", async () => {
  const value = await renderQRCode("biu");
  assert.equal(typeof value, "string");
  assert.match(value, /^data:image\/png;base64,/);
});

test("public convenience namespaces expose the renderer contracts", () => {
  assert.equal(qrcode.render, renderQRCode);
  assert.equal(typeof qrcode.download, "function");
  assert.equal(typeof barcode.render, "function");
  assert.equal(barcode.image, renderBarcodeImage);
  assert.equal(qrcodeImage.render, renderQRCodeImage);
  assert.equal(typeof barcode.toDataUrl, "function");
  assert.equal(typeof barcode.download, "function");
  assert.equal(typeof barcodeDataUrl, "function");
  assert.equal(typeof downloadCode, "function");
});

test("image renderers return img-compatible data URLs and can mount an image target", async () => {
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", () => undefined);
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { virtualConsole });
  const previousDocument = globalThis.document;
  const previousWindow = globalThis.window;
  Object.assign(globalThis, { document: dom.window.document, window: dom.window });
  try {
    const image = document.createElement("img");
    const qr = await renderQRCodeImage("biu", { target: image, alt: "二维码" });
    assert.match(qr, /^data:image\/png;base64,/);
    assert.equal(image.src, qr);
    assert.equal(image.alt, "二维码");

    const barcodeImage = document.createElement("img");
    const barcodeUrl = renderBarcodeImage("890123456789", { target: barcodeImage, alt: "条形码" });
    assert.match(barcodeUrl, /^data:image\/(png|svg\+xml)/);
    assert.equal(barcodeImage.src, barcodeUrl);
    assert.equal(barcodeImage.alt, "条形码");
  } finally {
    if (previousDocument) Object.assign(globalThis, { document: previousDocument });
    else Reflect.deleteProperty(globalThis, "document");
    if (previousWindow) Object.assign(globalThis, { window: previousWindow });
    else Reflect.deleteProperty(globalThis, "window");
    dom.window.close();
  }
});
