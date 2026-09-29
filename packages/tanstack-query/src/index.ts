import {
  QueryClient,
  type DefaultOptions,
  type QueryClientConfig,
  type QueryFunctionContext,
  type QueryKey,
} from "@tanstack/query-core";

export type {
  DefaultError,
  DefaultOptions,
  QueryClientConfig,
  QueryFunctionContext,
  QueryKey,
} from "@tanstack/query-core";
export { QueryClient } from "@tanstack/query-core";

export interface BiuQueryDefaults {
  staleTime?: number;
  gcTime?: number;
  retry?: NonNullable<DefaultOptions["queries"]>["retry"];
  retryDelay?: NonNullable<DefaultOptions["queries"]>["retryDelay"];
}

export interface BiuQueryClientOptions extends QueryClientConfig {
  defaults?: BiuQueryDefaults;
}

export class BiuQueryError extends Error {
  readonly cause: unknown;
  readonly code?: string;
  readonly status?: number;

  constructor(message: string, options: { cause?: unknown; code?: string; status?: number } = {}) {
    super(message);
    this.name = "BiuQueryError";
    this.cause = options.cause;
    this.code = options.code;
    this.status = options.status;
  }
}

export function isAbortError(error: unknown): boolean {
  if (!error) return false;
  if (typeof error === "object" && "name" in error && (error as { name?: unknown }).name === "AbortError") return true;
  return typeof error === "object" && "code" in error && (error as { code?: unknown }).code === "ERR_CANCELED";
}

export function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const value = error as { code?: unknown; request?: unknown; response?: unknown; isAxiosError?: unknown };
  if (isAbortError(error)) return false;
  if (value.isAxiosError && !value.response) return true;
  return (
    Boolean(value.request && !value.response) ||
    ["ECONNRESET", "ETIMEDOUT", "ENETUNREACH", "ENOTFOUND"].includes(String(value.code ?? ""))
  );
}

export function shouldRetryBiuQuery(failureCount: number, error: unknown) {
  return isNetworkError(error) && failureCount < 2;
}

export function createBiuQueryClientOptions(options: BiuQueryClientOptions = {}): QueryClientConfig {
  const { defaults, defaultOptions, ...rest } = options;
  const queryDefaults = {
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: shouldRetryBiuQuery,
    ...defaults,
    ...defaultOptions?.queries,
  };
  const mutationDefaults = {
    retry: 0,
    ...defaultOptions?.mutations,
  };
  return {
    ...rest,
    defaultOptions: {
      ...defaultOptions,
      queries: queryDefaults,
      mutations: mutationDefaults,
    },
  };
}

export function createBiuQueryClient(options: BiuQueryClientOptions = {}) {
  return new QueryClient(createBiuQueryClientOptions(options));
}

export interface BiuMutationController {
  signal: AbortSignal;
  cancel: (reason?: unknown) => void;
}

export function createBiuMutationController(): BiuMutationController {
  const controller = new AbortController();
  return {
    signal: controller.signal,
    cancel: (reason) => controller.abort(reason),
  };
}

export type BiuQueryKeyFactory = {
  readonly all: readonly [string];
  list: <T = unknown>(params?: T) => readonly [string, "list", T?];
  detail: <T extends string | number>(id: T) => readonly [string, "detail", T];
  scope: <T extends QueryKey>(...parts: T) => readonly [string, ...T];
};

export function createBiuQueryKeys(namespace: string): BiuQueryKeyFactory {
  const normalized = namespace.trim();
  if (!normalized) throw new Error("Query key namespace must not be empty");
  return {
    all: [normalized],
    list: <T>(params?: T) => (params === undefined ? [normalized, "list"] : [normalized, "list", params]),
    detail: <T extends string | number>(id: T) => [normalized, "detail", id],
    scope: <T extends QueryKey>(...parts: T) => [normalized, ...parts],
  };
}

export function mergeBiuQueryKeys(...parts: QueryKey[]): readonly unknown[] {
  return parts.flatMap((part) => [...part]);
}

export function stableSerialize(value: unknown, seen = new WeakSet<object>()): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean")
    return JSON.stringify(value);
  if (typeof value === "bigint") return `bigint:${value.toString()}`;
  if (value instanceof Date) return `date:${value.toISOString()}`;
  if (typeof FormData !== "undefined" && value instanceof FormData) return "[FormData]";
  if (typeof Blob !== "undefined" && value instanceof Blob) return `[Blob:${value.type}:${value.size}]`;
  if (Array.isArray(value)) return `[${value.map((item) => stableSerialize(item, seen)).join(",")}]`;
  if (typeof value === "object") {
    if (seen.has(value)) return "[Circular]";
    seen.add(value);
    const result = `{${Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize((value as Record<string, unknown>)[key], seen)}`)
      .join(",")}}`;
    seen.delete(value);
    return result;
  }
  return String(value);
}

export interface BiuQueryRequestContext<TQueryKey extends QueryKey = QueryKey> {
  signal: AbortSignal;
  queryKey: TQueryKey;
}

export function createBiuQueryOptions<TData, TQueryKey extends QueryKey = QueryKey>(options: {
  queryKey: TQueryKey;
  queryFn: (context: BiuQueryRequestContext<TQueryKey>) => Promise<TData> | TData;
  [key: string]: unknown;
}) {
  return {
    ...options,
    queryFn: ({ signal, queryKey }: QueryFunctionContext<TQueryKey>) => options.queryFn({ signal, queryKey }),
  };
}

export function createBiuMutationOptions<TData, TVariables>(options: {
  mutationFn: (variables: TVariables, context: { signal: AbortSignal }) => Promise<TData> | TData;
  signal?: AbortSignal;
  [key: string]: unknown;
}) {
  return {
    ...options,
    mutationFn: async (variables: TVariables) =>
      options.mutationFn(variables, { signal: options.signal ?? new AbortController().signal }),
  };
}

export function unwrapBiuResponse<T>(response: unknown): T {
  if (response && typeof response === "object" && "data" in response) return (response as { data: T }).data;
  return response as T;
}

export interface BiuListResponse<T> {
  items: T[];
  total: number;
}

export function normalizeBiuListResponse<T>(response: unknown): BiuListResponse<T> {
  const value = response as {
    items?: T[];
    records?: T[];
    results?: T[];
    data?: T[] | { items?: T[]; records?: T[]; results?: T[]; total?: number; totalResult?: number };
    total?: number;
    totalResult?: number;
    pagination?: { total?: number; totalResult?: number };
  };
  const nested = value?.data && !Array.isArray(value.data) ? value.data : undefined;
  const items =
    value?.items ??
    value?.records ??
    value?.results ??
    (Array.isArray(value?.data) ? value.data : undefined) ??
    nested?.items ??
    nested?.records ??
    nested?.results ??
    [];
  const total =
    value?.total ??
    value?.totalResult ??
    value?.pagination?.total ??
    value?.pagination?.totalResult ??
    nested?.total ??
    nested?.totalResult ??
    items.length;
  return {
    items: Array.isArray(items) ? items : [],
    total: Number.isFinite(Number(total)) ? Number(total) : items.length,
  };
}
