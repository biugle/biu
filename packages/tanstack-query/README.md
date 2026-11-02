# @biugle/tanstack-query

One package for Biu's TanStack Query conventions. The root entry is framework-neutral and the `./react` entry contains React bindings.

```ts
import { createBiuQueryKeys } from "@biugle/tanstack-query";
import { BiuQueryClientProvider, createBiuReactQueryClient, useBiuRequest } from "@biugle/tanstack-query/react";

const queryKeys = createBiuQueryKeys("users");
const client = createBiuReactQueryClient();
```

`@biugle/tanstack-query` does not depend on React, `@biugle/http`, Runtime, Router, Store or UI. Requests receive the standard `AbortSignal`; applications can pass `@biugle/http` or any other transport. Chart, RichText, Editor and Preview Server adapters are intentionally outside this package.

Common core helpers include `createBiuQueryClient`, `createBiuQueryKeys`, `createBiuQueryOptions`, `createBiuMutationOptions`, `createBiuMutationController`, `normalizeBiuListResponse`, `unwrapBiuResponse`, `isAbortError` and `shouldRetryBiuQuery`. Pass `signal` to `createBiuMutationOptions` to connect an external cancellation controller:

```ts
const controller = createBiuMutationController();
const options = createBiuMutationOptions({
  signal: controller.signal,
  mutationFn: (payload, { signal }) => request("/save", { payload, signal }),
});
controller.cancel("用户取消");
```

The `/react` entry provides `BiuQueryClientProvider`, `useBiuQuery`, `useBiuQueries`, `useBiuInfiniteQuery`, `useBiuMutation`, `useBiuRequest`, `useBiuMutationRequest` and `useBiuMutationController`. The mutation returned by `useBiuMutationRequest` adds `cancel(reason?)` to abort the current request. A new mutation automatically aborts the previous one, and unmounting also aborts the active request.
