export const INPUT_NUMBER_MAX_VALUE = Number.MAX_SAFE_INTEGER;
export const INPUT_NUMBER_MAX_DECIMAL_PLACES = 15;

export type InputNumberLimitIssue = "invalid" | "range" | "precision";

const MAX_SAFE_DECIMAL_TEXT = String(Number.MAX_SAFE_INTEGER);

function decimalTextExceeds(left: string, right: string) {
  return left.length > right.length || (left.length === right.length && left > right);
}

export function decimalPlaces(value: number | string | undefined) {
  if (value === undefined || value === null || value === "") return 0;
  const source = String(value).trim().toLowerCase();
  if (!Number.isFinite(Number(source))) return 0;
  const [coefficient, exponentText] = source.split("e");
  const exponent = Number(exponentText ?? 0);
  return Math.max(0, (coefficient.split(".")[1]?.length ?? 0) - exponent);
}

/**
 * Guard InputNumber values to the range and precision its JavaScript Number
 * contract can safely support. stringMode changes the callback type only; it
 * does not turn InputNumber into an arbitrary-precision decimal field.
 */
export function getInputNumberLimitIssue(value: number | string | undefined): InputNumberLimitIssue | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "number" && Number.isNaN(value)) return "invalid";
  if (typeof value === "number" && !Number.isFinite(value)) return "range";

  const source = String(value).trim();
  if (!source || /^[-+]?\.?$/.test(source)) return undefined;
  if (source.length > 256) return "range";

  const match = source.match(/^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i);
  if (!match || (!match[2] && !match[3])) return "invalid";

  const whole = match[2] ?? "";
  const fraction = match[3] ?? "";
  const exponent = Number(match[4] ?? 0);
  if (!Number.isFinite(exponent)) return "invalid";
  if (!Number.isSafeInteger(exponent)) return exponent < 0 ? "precision" : "range";
  const scale = fraction.length - exponent;
  if (scale > INPUT_NUMBER_MAX_DECIMAL_PLACES) return "precision";

  let coefficient = `${whole}${fraction}`.replace(/^0+/, "");
  if (!coefficient) return undefined;

  const trailingZeroes = coefficient.match(/0+$/)?.[0].length ?? 0;
  if (trailingZeroes) coefficient = coefficient.slice(0, -trailingZeroes);
  const effectiveScale = scale - trailingZeroes;
  if (effectiveScale > INPUT_NUMBER_MAX_DECIMAL_PLACES) return "precision";

  if (effectiveScale > 0) {
    const maximumAtScale = MAX_SAFE_DECIMAL_TEXT + "0".repeat(effectiveScale);
    if (decimalTextExceeds(coefficient, maximumAtScale)) return "range";
  } else {
    if (coefficient.length - effectiveScale > MAX_SAFE_DECIMAL_TEXT.length) return "range";
    const magnitude = coefficient + "0".repeat(-effectiveScale);
    if (decimalTextExceeds(magnitude, MAX_SAFE_DECIMAL_TEXT)) return "range";
  }

  // The decimal text must survive conversion to Number and back to its canonical
  // decimal representation. A scaled coefficient can exceed MAX_SAFE_INTEGER
  // even when the numeric value itself is safe, so coefficient size alone is
  // not a valid precision test.
  if (!Number.isFinite(Number(source))) return "range";

  // In Number mode, some in-range decimals still lose significant digits when
  // converted to IEEE-754. Reject values whose canonical decimal changes after
  // a Number round trip.
  const exactInteger = BigInt(coefficient) * (effectiveScale < 0 ? 10n ** BigInt(-effectiveScale) : 1n);
  const exactText = decimalString(exactInteger, Math.max(0, effectiveScale));
  const roundTripParts = decimalInteger(String(Number(exactText)));
  if (!roundTripParts || decimalString(roundTripParts.digits, roundTripParts.scale) !== exactText) return "precision";
  return undefined;
}

export function decimalInteger(value: number | string | undefined) {
  const source = String(value ?? "")
    .trim()
    .toLowerCase();
  const match = source.match(/^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/);
  if (!match || (!match[2] && !match[3])) return undefined;
  const sign = match[1] === "-" ? -1 : 1;
  const whole = match[2] ?? "";
  const fraction = match[3] ?? "";
  const exponent = Number(match[4] ?? 0);
  let scale = fraction.length - exponent;
  let digits = BigInt(`${whole}${fraction}` || "0");
  if (scale < 0) {
    digits *= 10n ** BigInt(-scale);
    scale = 0;
  }
  return { digits: BigInt(sign) * digits, scale };
}

export function decimalString(integer: bigint, scale: number) {
  if (integer === 0n) return "0";
  const negative = integer < 0n;
  const digits = (negative ? -integer : integer).toString();
  const padded = digits.padStart(scale + 1, "0");
  const splitAt = padded.length - scale;
  const whole = padded.slice(0, splitAt) || "0";
  const fraction = padded.slice(splitAt).replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}

/** Round decimal text without multiplying a large Number by a decimal factor. */
export function roundDecimal(value: number | string, places: number) {
  const requestedPlaces = Number.isFinite(places) ? Math.floor(places) : 0;
  const safePlaces = Math.min(INPUT_NUMBER_MAX_DECIMAL_PLACES, Math.max(0, requestedPlaces));
  const parts = decimalInteger(value);
  if (!parts) return String(Number(value));
  if (parts.scale <= safePlaces) {
    return decimalString(parts.digits * 10n ** BigInt(safePlaces - parts.scale), safePlaces);
  }

  const divisor = 10n ** BigInt(parts.scale - safePlaces);
  const absolute = parts.digits < 0n ? -parts.digits : parts.digits;
  const rounded = (absolute + divisor / 2n) / divisor;
  return decimalString(parts.digits < 0n ? -rounded : rounded, safePlaces);
}

export function addDecimal(left: number | string, right: number | string, direction: 1 | -1) {
  const leftParts = decimalInteger(left);
  const rightParts = decimalInteger(right);
  if (!leftParts || !rightParts) return String(Number(left) + direction * Number(right));
  const scale = Math.max(leftParts.scale, rightParts.scale);
  const leftInteger = leftParts.digits * 10n ** BigInt(scale - leftParts.scale);
  const rightInteger = rightParts.digits * 10n ** BigInt(scale - rightParts.scale);
  return decimalString(leftInteger + BigInt(direction) * rightInteger, scale);
}
