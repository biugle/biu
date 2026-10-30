import { onUnmounted, ref } from "vue";
import { i18n } from "@biugle/biu-i18n";

export function useDemoLocale(getLocale: () => string | undefined) {
  const revision = ref(0);
  const unsubscribe = i18n.subscribe(() => {
    revision.value += 1;
  });
  onUnmounted(unsubscribe);
  return (key: string, params?: Record<string, string | number>) => {
    // Track resource changes as well as the locale supplied by the shell.
    void revision.value;
    return i18n.$t(key, params, getLocale());
  };
}
