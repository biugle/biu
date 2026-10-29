import React from "react";
import type { BiuLanguageResource } from "@biugle/biu-i18n";
import { findMenuByPath, normalizePath } from "@biugle/biu-router";
import type { BiuRuntimeConfig, LayoutContentProps, MenuNode } from "./types.js";

export function isEmbeddedApp(config: BiuRuntimeConfig) {
  return config.projectType === "APP" && typeof window !== "undefined" && window.parent !== window;
}

export function FallbackLayout({ children }: LayoutContentProps) {
  return <div className="biu-fallback-layout">{children}</div>;
}

export function defaultHomeMenu(config: BiuRuntimeConfig): MenuNode {
  return {
    code: "__BIU_DEFAULT_HOME__",
    type: "MENU",
    target: config.projectType === "APP" ? "APP" : "PORTAL",
    titleKey: "首页",
    path: "/",
    meta: { __BIU_DEFAULT_HOME: true, __BIU_MENU_KEY: "__BIU_DEFAULT_HOME__", __BIU_MENU_PATH: "/" },
  };
}

export function removeRootHomeMenus(nodes: MenuNode[]): MenuNode[] {
  return nodes
    .filter((node) => !(node.type === "MENU" && node.path && normalizePath(node.path) === "/"))
    .map((node) => ({
      ...node,
      children: node.children ? removeRootHomeMenus(node.children) : node.children,
    }))
    .filter((node) => node.type !== "DIRECTORY" || Boolean(node.children?.length));
}

export function menuForPath(nodes: MenuNode[], path: string, home: MenuNode) {
  return normalizePath(path) === "/" ? home : findMenuByPath(nodes, path);
}

export function localeResourceFromResponse(
  value: unknown,
  locale: string,
  description: string,
): BiuLanguageResource | undefined {
  const source = value && typeof value === "object" && "data" in value ? (value as { data?: unknown }).data : value;
  const candidate =
    source &&
    typeof source === "object" &&
    locale in source &&
    typeof (source as Record<string, unknown>)[locale] === "object"
      ? (source as Record<string, unknown>)[locale]
      : source;
  if (!candidate || typeof candidate !== "object") return undefined;
  const record = candidate as Record<string, unknown>;
  const translationSource = record.translation ?? record.translations ?? record.messages ?? candidate;
  if (!translationSource || typeof translationSource !== "object") return undefined;
  const translation = Object.fromEntries(
    Object.entries(translationSource as Record<string, unknown>).filter(([, item]) => typeof item === "string"),
  ) as Record<string, string>;
  if (!Object.keys(translation).length) return undefined;
  return {
    key: typeof record.key === "string" ? record.key : locale,
    desc: typeof record.desc === "string" && record.desc.trim() ? record.desc : description,
    translation,
  };
}

export function localeEndpoint(endpoint: string, locale: string) {
  const templated = endpoint.replaceAll("{locale}", encodeURIComponent(locale));
  const url = new URL(templated, window.location.origin);
  url.searchParams.set("locale", locale);
  return url.toString();
}
