type InputRule = "number" | "letter" | "alphanumeric";

/** Share typed, pasted and batch-input character constraints without changing their incremental semantics. */
export function createInputFilter(inputRule?: InputRule, inputPattern?: string | RegExp) {
  const rulePattern =
    inputRule === "number"
      ? /[0-9]/
      : inputRule === "letter"
        ? /[A-Za-z]/
        : inputRule === "alphanumeric"
          ? /[A-Za-z0-9]/
          : undefined;
  let customPattern: RegExp | undefined;
  try {
    if (inputPattern) customPattern = inputPattern instanceof RegExp ? inputPattern : new RegExp(inputPattern);
  } catch {
    // Preserve the TextField contract: invalid caller patterns impose no custom restriction.
  }
  return {
    pattern: customPattern?.source ?? (rulePattern ? `(?:${rulePattern.source})*` : undefined),
    filter(raw: string) {
      if (rulePattern)
        return Array.from(raw)
          .filter((character) => rulePattern.test(character))
          .join("");
      if (!customPattern) return raw;
      let next = "";
      for (const character of Array.from(raw)) {
        const candidate = next + character;
        customPattern.lastIndex = 0;
        if (customPattern.test(candidate)) next = candidate;
      }
      return next;
    },
  };
}
