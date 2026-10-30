import { JSDOM } from "jsdom";
import type { ReactNode } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

/** Keep each behavior family's original browser shims isolated in its test process. */
export function createTestDom(profile: "navigation" | "overlay" | "input") {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/" });
  const browserWindow = dom.window;
  Object.assign(globalThis, {
    window: browserWindow,
    document: browserWindow.document,
    HTMLElement: browserWindow.HTMLElement,
    HTMLButtonElement: browserWindow.HTMLButtonElement,
    HTMLInputElement: browserWindow.HTMLInputElement,
    HTMLTextAreaElement: browserWindow.HTMLTextAreaElement,
    HTMLSelectElement: browserWindow.HTMLSelectElement,
    DocumentFragment: browserWindow.DocumentFragment,
    KeyboardEvent: browserWindow.KeyboardEvent,
    MouseEvent: browserWindow.MouseEvent,
    PointerEvent: browserWindow.PointerEvent ?? browserWindow.MouseEvent,
    Node: browserWindow.Node,
    Event: browserWindow.Event,
    CustomEvent: browserWindow.CustomEvent,
    MutationObserver: browserWindow.MutationObserver,
    getComputedStyle: browserWindow.getComputedStyle,
    IS_REACT_ACT_ENVIRONMENT: true,
  });
  if (profile !== "overlay") Object.assign(globalThis, { Element: browserWindow.Element });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: browserWindow.navigator });
  if (profile !== "navigation") {
    Object.assign(globalThis, {
      HTMLIFrameElement: browserWindow.HTMLIFrameElement,
      NodeFilter: browserWindow.NodeFilter,
    });
    class TestResizeObserver {
      observe() {}
      disconnect() {}
    }
    Object.assign(browserWindow, { ResizeObserver: TestResizeObserver });
    Object.assign(globalThis, { ResizeObserver: TestResizeObserver });
    if (profile === "overlay") {
      for (const name of ["attachEvent", "detachEvent"])
        Object.defineProperty(browserWindow.HTMLElement.prototype, name, {
          configurable: true,
          value: () => undefined,
        });
    } else {
      Object.assign(browserWindow.HTMLElement.prototype, { attachEvent() {}, detachEvent() {} });
    }
  }
  const animationFrame = {
    requestAnimationFrame: (callback: FrameRequestCallback) => browserWindow.setTimeout(callback, 0),
    cancelAnimationFrame: (id: number) => browserWindow.clearTimeout(id),
  };
  Object.assign(browserWindow, animationFrame);
  if (profile !== "overlay") Object.assign(globalThis, animationFrame);

  async function mount(node: ReactNode) {
    const host = document.createElement("div");
    document.body.append(host);
    let root!: Root;
    await act(async () => {
      root = createRoot(host);
      root.render(node);
    });
    return { host, root };
  }
  async function unmount(rendered: { host: HTMLDivElement; root: Root }) {
    await act(async () => rendered.root.unmount());
    rendered.host.remove();
    document.body.replaceChildren();
  }
  return { dom, browserWindow, mount, unmount };
}
