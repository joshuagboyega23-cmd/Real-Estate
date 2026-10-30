/**
 * Utility functions for currency and money handling.
 * All amounts are stored as integers in minor units (e.g., cents, pence).
 */

/**
 * Converts a major currency unit (e.g. 15.50) to integer minor units (e.g. 1550).
 */
export function toMinor(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Converts minor currency units (e.g. 1550) to major units (e.g. 15.50).
 */
export function fromMinor(minor: number): number {
  return minor / 100;
}

/**
 * Formats minor currency units into a localized currency string.
 */
export function formatMoney(
  minor: number,
  currency: string,
  locale: string = "en-US"
): string {
  const major = fromMinor(minor);
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(major);
  } catch {
    return `${currency.toUpperCase()} ${major.toFixed(2)}`;
  }
}

