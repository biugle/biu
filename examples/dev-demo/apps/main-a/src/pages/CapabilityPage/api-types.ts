export interface CapabilityApiRow {
  component: string;
  name: string;
  type: string;
  defaultValue: string;
  /** Explicit allowed values or method parameters shown as a separate column. */
  options?: string;
  description: string;
  demo?: string;
  /** Optional per-property overrides for legacy grouped entries. */
  propertyDetails?: Record<
    string,
    Partial<Pick<CapabilityApiRow, "type" | "defaultValue" | "options" | "description" | "demo">>
  >;
}

export type CapabilityPropertyDetail = Partial<
  Pick<CapabilityApiRow, "type" | "defaultValue" | "options" | "description" | "demo">
>;
