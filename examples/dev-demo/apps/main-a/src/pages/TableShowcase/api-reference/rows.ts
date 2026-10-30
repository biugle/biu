import type { CapabilityApiRow } from "../../CapabilityPage/index.js";
type ApiEntry = [name: string, type: string, defaultValue: string, description: string, demo: string, options?: string];
export const apiRows = (component: string, entries: ApiEntry[]): CapabilityApiRow[] =>
  entries.map(([name, type, defaultValue, description, demo, options]) => ({
    component,
    name,
    type,
    defaultValue,
    description,
    demo,
    options,
  }));
