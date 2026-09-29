import * as React from "react";
import {
  QueryClientProvider,
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQuery,
  type UseInfiniteQueryOptions,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { createBiuMutationController, createBiuQueryClient, type BiuQueryClientOptions } from "./index.js";

export * from "@tanstack/react-query";
export * from "./index.js";

export function BiuQueryClientProvider({
  client,
  children,
}: {
  client: ReturnType<typeof createBiuQueryClient>;
  children: React.ReactNode;
}) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

export function createBiuReactQueryClient(options: BiuQueryClientOptions = {}) {
  return createBiuQueryClient(options);
}

export const useBiuQuery = useQuery;
export const useBiuQueries = useQueries;
export const useBiuMutation = useMutation;
export const useBiuInfiniteQuery = useInfiniteQuery;

export interface BiuRequestQueryOptions<
  TData,
  TError = Error,
  TQueryKey extends readonly unknown[] = readonly unknown[],
> extends Omit<UseQueryOptions<TData, TError, TData, TQueryKey>, "queryFn"> {
  request: (context: { signal: AbortSignal; queryKey: TQueryKey }) => Promise<TData> | TData;
}

export function useBiuRequest<TData, TError = Error, TQueryKey extends readonly unknown[] = readonly unknown[]>(
  options: BiuRequestQueryOptions<TData, TError, TQueryKey>,
) {
  const { request, ...queryOptions } = options;
  return useQuery({
    ...queryOptions,
    queryFn: ({ signal, queryKey }) => request({ signal, queryKey: queryKey as TQueryKey }),
  });
}

export interface BiuRequestMutationOptions<TData, TVariables, TError = Error> extends Omit<
  UseMutationOptions<TData, TError, TVariables>,
  "mutationFn"
> {
  request: (variables: TVariables, context: { signal: AbortSignal }) => Promise<TData> | TData;
}

export function useBiuMutationRequest<TData, TVariables, TError = Error>(
  options: BiuRequestMutationOptions<TData, TVariables, TError>,
) {
  const controllerRef = React.useRef<AbortController | undefined>(undefined);
  React.useEffect(() => () => controllerRef.current?.abort(), []);
  const { request, ...mutationOptions } = options;
  const mutation = useMutation({
    ...mutationOptions,
    mutationFn: async (variables: TVariables) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      return request(variables, { signal: controller.signal });
    },
  });
  return React.useMemo(
    () => ({ ...mutation, cancel: (reason?: unknown) => controllerRef.current?.abort(reason) }),
    [mutation],
  );
}

export function useBiuMutationController() {
  return React.useMemo(() => createBiuMutationController(), []);
}

export type { UseInfiniteQueryOptions, UseMutationOptions, UseQueryOptions };
