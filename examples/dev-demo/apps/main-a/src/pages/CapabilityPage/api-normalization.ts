import type { CapabilityApiRow, CapabilityPropertyDetail } from "./api-types.js";
import { commonApiPropertyDetails } from "./api-common-details.js";
import { componentApiPropertyDetails } from "./api-component-details.js";
import { serviceApiPropertyDetails } from "./api-service-details.js";
import { toolApiPropertyDetails } from "./api-tool-details.js";

const frameworkApiPropertyDetails = {
  ...componentApiPropertyDetails,
  ...serviceApiPropertyDetails,
  ...toolApiPropertyDetails,
};

function splitApiSegments(value: string) {
  return value
    .split(/\s+\/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitComponentSegments(value: string) {
  return splitApiSegments(value);
}

function inferredOptions(type: string) {
  const normalized = type.replace(/^\s*['"]|['"]\s*$/g, "");
  if (normalized.includes("|") && !normalized.includes("=>")) return normalized.replace(/"/g, "");
  if (type === "boolean") return "true | false";
  if (type.includes("=>") || type.toLowerCase().includes("callback")) return "按类型签名传入函数";
  if (type === "string") return "任意字符串";
  if (type === "number") return "任意数字（受组件边界约束）";
  if (type.includes("ReactNode")) return "任意 ReactNode";
  if (type.endsWith("[]")) return "数组元素由类型定义";
  return "见类型签名";
}

function describeCapabilityProperty(
  component: string,
  name: string,
  type: string,
  sourceDescription: string,
): CapabilityPropertyDetail {
  const detail = commonApiPropertyDetails[name];
  if (detail) return detail;
  return {
    options: inferredOptions(type),
    description: `${component}.${name} 接收 ${type} 类型值；${sourceDescription} 当前案例演示该字段在 ${component} 中的实际效果。`,
  };
}

/** Expand grouped authoring rows into one precise row per component property. */
export function normalizeCapabilityApiRows(rows: CapabilityApiRow[]) {
  return rows.flatMap((row) => {
    const components = splitComponentSegments(row.component);
    const names = splitApiSegments(row.name);
    return components.flatMap((component) => {
      if (names.length <= 1) {
        const common = commonApiPropertyDetails[row.name] ?? {};
        const specific = {
          ...frameworkApiPropertyDetails[`${component}.${row.name}`],
          ...frameworkApiPropertyDetails[`${row.component}.${row.name}`],
          ...row.propertyDetails?.[row.name],
        };
        return [
          {
            ...row,
            component,
            // Author-written or framework-specific metadata is authoritative;
            // common property guidance only fills a missing field. This keeps a
            // precise description from being replaced by a generic sentence.
            type: specific.type ?? row.type ?? common.type ?? "unknown",
            defaultValue: specific.defaultValue ?? row.defaultValue ?? common.defaultValue ?? "undefined",
            options: specific.options ?? row.options ?? common.options ?? inferredOptions(specific.type ?? row.type),
            description: specific.description ?? row.description ?? common.description ?? "",
            demo: specific.demo ?? row.demo,
            propertyDetails: undefined,
          },
        ];
      }
      const typeSegments = splitApiSegments(row.type);
      const defaultSegments = splitApiSegments(row.defaultValue);
      return names.map((name, index) => {
        const detail =
          row.propertyDetails?.[name] ??
          frameworkApiPropertyDetails[`${component}.${name}`] ??
          frameworkApiPropertyDetails[`${row.component}.${name}`] ??
          {};
        const type = detail.type ?? typeSegments[index] ?? row.type;
        const fallback = describeCapabilityProperty(component, name, type, row.description);
        return {
          ...row,
          component,
          name,
          type,
          defaultValue: detail.defaultValue ?? defaultSegments[index] ?? row.defaultValue,
          options: detail.options ?? row.options ?? fallback.options ?? inferredOptions(type),
          // For a real component row, the authored description is more useful
          // than the generic inferred sentence. The old order always selected
          // `fallback.description`, which made unrelated components inherit
          // text such as Progress/Tag/Table guidance.
          description: detail.description ?? row.description ?? fallback.description,
          demo: detail.demo ?? row.demo,
          propertyDetails: undefined,
        };
      });
    });
  });
}

export function dedupeCapabilityApiRows(rows: CapabilityApiRow[]) {
  const unique = new Map<string, CapabilityApiRow>();
  for (const row of rows) {
    // Explicit rows replace grouped shorthands so each component/property pair renders once.
    unique.set(`${row.component}::${row.name}`, row);
  }
  return [...unique.values()];
}
