import { createI18n, type BiuLanguageResource } from "@biugle/biu-i18n";

// Capture pristine built-ins independently of the mutable shared registry.
// Reloading a business resource must not retain removed business overrides.
const builtinI18n = createI18n("zh-CN");
const builtinResources = new Map(builtinI18n.getLocaleList().map(({ code }) => [code, builtinI18n.getResource(code)!]));

export function withBuiltinLocaleResource(resource: BiuLanguageResource): BiuLanguageResource {
  return {
    ...resource,
    translation: { ...builtinResources.get(resource.key)?.translation, ...resource.translation },
  };
}
