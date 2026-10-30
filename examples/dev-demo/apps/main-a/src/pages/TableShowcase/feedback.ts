import { useState } from "react";
import { useBiuI18n } from "@biugle/biu-runtime";
export function useLocalizedFeedback(initialKey: string) {
  const { $t } = useBiuI18n();
  const [feedback, setFeedback] = useState<{ key: string; params?: Record<string, string | number> }>({
    key: initialKey,
  });
  return [
    $t(feedback.key, feedback.params),
    (key: string, params?: Record<string, string | number>) => setFeedback({ key, params }),
  ] as const;
}
