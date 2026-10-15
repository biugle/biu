/** Split non-empty, trimmed items by line breaks and optional spaces or Chinese/English commas. */
export function splitString(str: string, separatorIncludesSpace = false, separatorIncludesComma = false): string[] {
  if (typeof str !== "string" || !str.trim()) return [];
  return str
    .split(new RegExp(stringSeparatorPattern(separatorIncludesSpace, separatorIncludesComma)))
    .map((item) => item.trim())
    .filter(Boolean);
}

/** @internal Keep direct-input character filtering and batch parsing on identical separator rules. */
export function stringSeparatorPattern(separatorIncludesSpace: boolean, separatorIncludesComma: boolean): string {
  return separatorIncludesSpace
    ? separatorIncludesComma
      ? "[\\s,，]+"
      : "\\s+"
    : separatorIncludesComma
      ? "[\\r\\n,，]+"
      : "[\\r\\n]+";
}
