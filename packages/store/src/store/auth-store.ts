import { create } from "zustand";
import type { BiuAuthContext } from "../types.js";

export interface BiuAuthState {
  context?: BiuAuthContext;
  setContext: (context?: BiuAuthContext) => void;
  clear: () => void;
}

/** Identity-only auth state. Credentials remain owned by the SSO provider. */
export const useBiuAuthStore = create<BiuAuthState>((set) => ({
  context: undefined,
  setContext: (context) => set((state) => (Object.is(state.context, context) ? state : { context })),
  clear: () => set((state) => (state.context === undefined ? state : { context: undefined })),
}));
