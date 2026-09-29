import * as React from "react";
import type { TableFilters, TablePagination, TableSorter } from "../ui/types.js";
import { normalizeQueryTableResponse, stableSerialize } from "./normalize-response.js";
import type { QueryPagination, QueryRefetchOptions, UseQueryTableOptions } from "./types.js";

export function useQueryTable<T, P = Record<string, unknown>>({
  queryKey,
  params: inputParams = {} as P,
  enabled = true,
  initialPagination,
  initialSorter,
  initialFilters = {},
  queryFn,
  selectResponse,
  resetPaginationOnParamsChange = true,
  keepPreviousData = true,
  refetchInterval = false,
  resetOnUnmount = false,
  onSuccess,
  onError,
  paginationParamNames,
  includePaginationInQueryKey = true,
}: UseQueryTableOptions<T, P>) {
  const [params, setParamsState] = React.useState<P>(inputParams);
  const [pagination, setPaginationState] = React.useState<QueryPagination>({
    current: initialPagination?.current ?? 1,
    pageSize: initialPagination?.pageSize ?? 20,
    total: 0,
  });
  const [dataSource, setDataSource] = React.useState<T[]>([]);
  const [loading, setLoading] = React.useState(enabled);
  const [isFetching, setIsFetching] = React.useState(enabled);
  const [error, setError] = React.useState<unknown>();
  const [sorter, setSorter] = React.useState<TableSorter | undefined>(initialSorter);
  const [filters, setFiltersState] = React.useState<TableFilters>(initialFilters);
  const [version, setVersion] = React.useState(0);
  const activeControllerRef = React.useRef<AbortController | undefined>(undefined);
  const requestRef = React.useRef(queryFn);
  const successRef = React.useRef(onSuccess);
  const errorRef = React.useRef(onError);
  requestRef.current = queryFn;
  successRef.current = onSuccess;
  errorRef.current = onError;
  const inputParamsKey = stableSerialize(inputParams);
  const lastInputParamsKey = React.useRef(inputParamsKey);
  const inputParamsChanged = lastInputParamsKey.current !== inputParamsKey;
  const effectiveParams = inputParamsChanged ? inputParams : params;
  const effectiveParamsKey = stableSerialize(effectiveParams);
  const queryKeyKey = stableSerialize(queryKey);
  const filtersKey = stableSerialize(filters);
  const sorterKey = stableSerialize(sorter);
  const setPagination = React.useCallback(
    (next: Partial<QueryPagination>) => setPaginationState((current) => ({ ...current, ...next })),
    [],
  );
  const refresh = React.useCallback((options: QueryRefetchOptions = {}) => {
    if (options.resetCurrentPage) setPaginationState((current) => ({ ...current, current: 1 }));
    setVersion((current) => current + 1);
  }, []);
  const cancel = React.useCallback((reason?: unknown) => {
    const controller = activeControllerRef.current;
    if (!controller) return;
    controller.abort(reason);
    if (activeControllerRef.current === controller) activeControllerRef.current = undefined;
    setLoading(false);
    setIsFetching(false);
  }, []);
  const resetState = React.useCallback(() => {
    setParamsState(inputParams);
    setSorter(initialSorter);
    setFiltersState(initialFilters);
    setPaginationState({
      current: initialPagination?.current ?? 1,
      pageSize: initialPagination?.pageSize ?? 20,
      total: 0,
    });
    setVersion((current) => current + 1);
  }, [initialFilters, initialPagination?.current, initialPagination?.pageSize, initialSorter, inputParams]);

  React.useEffect(() => {
    if (!inputParamsChanged) return;
    lastInputParamsKey.current = inputParamsKey;
    setParamsState(inputParams);
    if (resetPaginationOnParamsChange) setPagination({ current: 1 });
  }, [inputParams, inputParamsChanged, inputParamsKey, resetPaginationOnParamsChange, setPagination]);

  React.useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setIsFetching(false);
      return undefined;
    }
    const controller = new AbortController();
    activeControllerRef.current?.abort();
    activeControllerRef.current = controller;
    setIsFetching(true);
    setLoading((current) => current || !dataSource.length || !keepPreviousData);
    setError(undefined);
    Promise.resolve()
      .then(() =>
        requestRef.current({
          pagination,
          params: effectiveParams,
          sorter,
          filters,
          signal: controller.signal,
          queryKey: includePaginationInQueryKey ? [...queryKey, pagination.current, pagination.pageSize] : queryKey,
          queryParams: {
            [paginationParamNames?.current ?? "currentPage"]: pagination.current,
            [paginationParamNames?.pageSize ?? "showCount"]: pagination.pageSize,
            [paginationParamNames?.total ?? "total"]: pagination.total,
          },
        }),
      )
      .then((response) => {
        if (controller.signal.aborted) return;
        const normalized = selectResponse ? selectResponse(response) : normalizeQueryTableResponse<T>(response);
        setDataSource(normalized.items);
        setPaginationState((current) => ({ ...current, total: normalized.total }));
        successRef.current?.(normalized);
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setError(reason);
        errorRef.current?.(reason);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
          setIsFetching(false);
        }
      });
    return () => {
      controller.abort();
      if (activeControllerRef.current === controller) activeControllerRef.current = undefined;
    };
    // dataSource is intentionally read only to decide initial loading; it is not a request dependency.
  }, [
    enabled,
    effectiveParamsKey,
    filtersKey,
    pagination.current,
    pagination.pageSize,
    paginationParamNames?.current,
    paginationParamNames?.pageSize,
    paginationParamNames?.total,
    queryKeyKey,
    sorterKey,
    version,
  ]);

  React.useEffect(() => {
    if (!enabled || refetchInterval === false || refetchInterval <= 0) return undefined;
    const timer = window.setInterval(refresh, refetchInterval);
    return () => window.clearInterval(timer);
  }, [enabled, refetchInterval, refresh]);

  React.useEffect(() => {
    // Every request effect already aborts its controller. The option is kept
    // explicit so drawer/dialog callers can document that no query state is
    // expected to survive their unmount; state itself is component-local.
    if (!resetOnUnmount) return undefined;
    return () => undefined;
  }, [resetOnUnmount]);

  const paginationProps: TablePagination = React.useMemo(
    () => ({
      ...pagination,
      onChange: (current, pageSize = pagination.pageSize) => setPagination({ current, pageSize }),
      onShowSizeChange: (current, pageSize) => setPagination({ current, pageSize }),
    }),
    [pagination, setPagination],
  );
  const setParams = React.useCallback(
    (next: P | ((current: P) => P)) => {
      setParamsState((current) => (typeof next === "function" ? (next as (value: P) => P)(current) : next));
      setPagination({ current: 1 });
    },
    [setPagination],
  );
  const setFilters = React.useCallback(
    (next: TableFilters | ((current: TableFilters) => TableFilters)) => {
      setFiltersState((current) =>
        typeof next === "function" ? (next as (value: TableFilters) => TableFilters)(current) : next,
      );
      setPagination({ current: 1 });
    },
    [setPagination],
  );
  const tableProps = {
    dataSource,
    loading,
    error,
    pagination: paginationProps,
    sorter,
    filters,
    onSorterChange: (next?: TableSorter) => {
      setSorter(next);
      setPagination({ current: 1 });
    },
    onFilterChange: setFilters,
    onChange: (nextPagination: TablePagination | undefined, nextSorter?: TableSorter, nextFilters?: TableFilters) => {
      if (nextPagination) setPagination({ current: nextPagination.current, pageSize: nextPagination.pageSize });
      setSorter(nextSorter);
      if (nextFilters) setFiltersState(nextFilters);
    },
  };
  return {
    dataSource,
    loading,
    isFetching,
    error,
    pagination,
    paginationProps,
    tableProps,
    query: {
      data: dataSource,
      isLoading: loading,
      isFetching,
      error,
      refetch: refresh,
      cancel,
      status: error ? "error" : loading ? "pending" : ("success" as const),
    },
    params: effectiveParams,
    sorter,
    filters,
    setParams,
    resetParams: resetState,
    setSorter,
    setFilters,
    setPagination,
    resetPagination: () => setPagination({ current: 1 }),
    refresh,
    cancel,
  };
}

export { normalizeQueryTableResponse, stableSerialize } from "./normalize-response.js";
export type { QueryPagination, QueryTableResponse, QueryTableContext, UseQueryTableOptions } from "./types.js";
