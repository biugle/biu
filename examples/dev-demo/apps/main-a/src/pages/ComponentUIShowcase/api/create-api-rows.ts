import type { CapabilityApiRow } from "../../CapabilityPage/index.js";

type ApiSpec = [name: string, type: string, defaultValue: string, options: string, description: string, demo: string];

export function createApiRows(component: string, specs: ApiSpec[]): CapabilityApiRow[] {
  return specs.map(([name, type, defaultValue, options, description, demo]) => ({
    component,
    name,
    type,
    defaultValue,
    options,
    description,
    demo,
  }));
}
