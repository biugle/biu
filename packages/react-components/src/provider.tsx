import * as React from "react";
import {
  getBiuComponentsLocaleText,
  type BiuComponentsLocale,
  type BiuComponentsLocaleText,
  type BiuComponentsLocaleTextOverrides,
} from "./locale/index.js";

export interface BiuComponentsConfig {
  locale?: BiuComponentsLocale;
  localeText?: BiuComponentsLocaleTextOverrides;
  theme?: string;
  direction?: "ltr" | "rtl";
}
const ComponentsConfigContext = React.createContext<BiuComponentsConfig>({});
export function ConfigProvider({ children, ...config }: BiuComponentsConfig & { children: React.ReactNode }) {
  return <ComponentsConfigContext.Provider value={config}>{children}</ComponentsConfigContext.Provider>;
}
/** @deprecated Use ConfigProvider. */
export const ComponentsProvider = ConfigProvider;
export function useComponentsConfig() {
  return React.useContext(ComponentsConfigContext);
}

export function useComponentsLocale(
  locale?: BiuComponentsLocale,
  localeText?: BiuComponentsLocaleTextOverrides,
): BiuComponentsLocaleText {
  const config = useComponentsConfig();
  return React.useMemo(
    () => getBiuComponentsLocaleText(locale ?? config.locale, { ...config.localeText, ...localeText }),
    [config.locale, config.localeText, locale, localeText],
  );
}

export type { BiuComponentsLocale, BiuComponentsLocaleText, BiuComponentsLocaleTextOverrides } from "./locale/index.js";
