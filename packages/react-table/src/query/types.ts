import type { TableFilters, TablePagination, TableSorter } from "../ui/types.js";

export type QueryPagination = TablePagination;
export interface QueryTableContext<P = Record<string, unknown>> {
  pagination: QueryPagination;
  params: P;
  sorter?: TableSorter;
  filters: TableFilters;
  signal: AbortSignal;
  queryKey: readonly unknown[];
  queryParams?: Record<string, unknown>;
}
export interface QueryTableResponse<T> {
  items: T[];
  total: number;
}
export interface UseQueryTableOptions<T, P = Record<string, unknown>> {
  queryKey: readonly unknown[];
  params?: P;
  enabled?: boolean;
  initialPagination?: Partial<QueryPagination>;
  initialSorter?: TableSorter;
  initialFilters?: TableFilters;
  queryFn: (
    context: QueryTableContext<P>,
  ) => Promise<QueryTableResponse<T> | unknown> | QueryTableResponse<T> | unknown;
  selectResponse?: (response: unknown) => QueryTableResponse<T>;
  resetPaginationOnParamsChange?: boolean;
  keepPreviousData?: boolean;
  /** Re-run the current query at a fixed interval. Disabled by default. */
  refetchInterval?: number | false;
  /** The request is always aborted on unmount; this flag documents the local-state reset contract. */
  resetOnUnmount?: boolean;
  paginationParamNames?: { current?: string; pageSize?: string; total?: string };
  includePaginationInQueryKey?: boolean;
  onSuccess?: (response: QueryTableResponse<T>) => void;
  onError?: (error: unknown) => void;
}

export interface QueryRefetchOptions {
  resetCurrentPage?: boolean;
}
