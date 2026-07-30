/** Threshold in minor units below which a balance is considered zero. */
export const EPSILON_MINOR_UNITS = 1;

/**
 * Convert a decimal string (e.g. "123.45") to integer minor units (12345).
 * Handles missing or malformed input gracefully.
 */
export function toMinorUnits(decimalStr: string | number): number {
  if (!decimalStr) return 0;

  const parsed = typeof decimalStr === "string" ? parseFloat(decimalStr) : decimalStr;
  if (isNaN(parsed)) return 0;

  return Math.round((parsed + Number.EPSILON) * 100);
}

/**
 * Convert integer minor units (12345) to a display string ("123.45").
 */
export function minorUnitsToDisplay(minorUnits: number): string {
  const negative = minorUnits < 0;
  const abs = Math.abs(minorUnits);
  const whole = Math.floor(abs / 100);
  const frac = abs % 100;
  const str = `${whole}.${frac.toString().padStart(2, "0")}`;
  return negative ? `-${str}` : str;
}

export const CURRENCIES = [
  { code: "INR", symbol: "₹" },
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
  { code: "JPY", symbol: "¥" },
  { code: "CAD", symbol: "C$" },
  { code: "AUD", symbol: "A$" },
];

/**
 * Get display symbol for a currency code.
 */
export function getCurrencySymbol(currencyCode?: string): string {
  switch (currencyCode?.toUpperCase()) {
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    case "JPY":
      return "¥";
    case "CAD":
      return "C$";
    case "AUD":
      return "A$";
    case "INR":
    default:
      return "₹";
  }
}
