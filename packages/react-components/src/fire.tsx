import * as React from "react";
import { createRoot, type Root } from "react-dom/client";

export type FirePropsUpdater = Record<string, unknown> | ((props: Record<string, unknown>) => Record<string, unknown>);

export interface FireHandle {
  update: (props: FirePropsUpdater) => void;
  close: (animated?: boolean) => void;
  destroy: () => void;
}

export interface FireOptions {
  /** Property used to control visibility. Defaults to `open`. */
  openProp?: string;
  /** Callback property used by a mounted component to close itself. */
  closeProp?: string;
  defaultProps?: Record<string, unknown> | ((args: { destroy: () => void }) => Record<string, unknown>);
  /** Mount into a different body-like element when the page supplies one. */
  container?: HTMLElement | (() => HTMLElement | null | undefined);
  className?: string;
}

const instances = new Set<FireHandle>();

function resolveContainer(options?: FireOptions) {
  if (typeof document === "undefined") return undefined;
  const target = typeof options?.container === "function" ? options.container() : options?.container;
  return target ?? document.body;
}

function mount(
  render: (close: () => void, update: (props: FirePropsUpdater) => void) => React.ReactNode,
  options?: FireOptions,
): FireHandle {
  const host = resolveContainer(options);
  if (!host) return { update: () => undefined, close: () => undefined, destroy: () => undefined };

  const container = document.createElement("div");
  container.className = ["biu-fire-root", options?.className].filter(Boolean).join(" ");
  container.setAttribute("data-biu-fire-root", "true");
  host.appendChild(container);
  const root: Root = createRoot(container);
  let destroyed = false;

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    root.unmount();
    container.remove();
    instances.delete(handle);
  };
  const close = () => destroy();
  const update = (next: FirePropsUpdater) => {
    if (destroyed) return;
    void next;
    root.render(React.createElement(React.Fragment, null, render(close, update)));
  };
  const handle: FireHandle = { update, close, destroy };
  instances.add(handle);
  root.render(React.createElement(React.Fragment, null, render(close, update)));
  return handle;
}

export function fire<Props extends Record<string, unknown>>(
  Component: React.ComponentType<Props>,
  options: FireOptions = {},
) {
  return (props: Partial<Props> = {}) => {
    let currentProps: Props = { ...props } as Props;
    let visible = currentProps[options.openProp ?? "open"] !== false;
    const openProp = options.openProp ?? "open";
    const closeProp = options.closeProp ?? "onOpenChange";
    const suppliedClose = props[closeProp] as ((...args: unknown[]) => void) | undefined;
    let closeView: () => void = () => {};
    const render = (destroy: () => void) => {
      const defaults =
        typeof options.defaultProps === "function" ? options.defaultProps({ destroy }) : options.defaultProps;
      currentProps = {
        ...defaults,
        ...currentProps,
        [openProp]: visible,
        [closeProp]: (value?: unknown, ...args: unknown[]) => {
          suppliedClose?.(value, ...args);
          if (value === undefined || value === false) closeView();
        },
      } as Props;
      return <Component {...currentProps} />;
    };
    const handle = mount((close) => render(close), options);
    const initialUpdate = handle.update;
    handle.update = (next) => {
      const updated = (typeof next === "function" ? next(currentProps) : { ...currentProps, ...next }) as Props;
      currentProps = updated;
      if (Object.prototype.hasOwnProperty.call(updated, openProp)) visible = updated[openProp] !== false;
      initialUpdate({});
    };
    handle.close = (animated = true) => {
      void animated;
      visible = false;
      initialUpdate({});
    };
    closeView = () => handle.close();
    return handle;
  };
}

fire.node = (node: React.ReactNode, options?: FireOptions) => mount(() => node, options);

fire.render = (
  render: (args: { close: () => void; update: (props: FirePropsUpdater) => void }) => React.ReactNode,
  options?: FireOptions,
) => mount((close, update) => render({ close, update }), options);

fire.destroyAll = () => [...instances].forEach((instance) => instance.destroy());
