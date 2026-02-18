export type Currency = 'USD' | 'ARS' | 'EUR';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  ARS: '$',
  EUR: '€',
};

export const CURRENCY_NAMES: Record<Currency, string> = {
  USD: 'Dólares',
  ARS: 'Pesos Argentinos',
  EUR: 'Euros',
};

/** Intl locale codes used for number formatting per currency. */
const CURRENCY_LOCALES: Record<Currency, string> = {
  USD: 'en-US',
  ARS: 'es-AR',
  EUR: 'de-DE',
};

/**
 * Format an amount with its currency symbol and code.
 * Examples: formatCurrency(1234.5, 'USD') → '$1,234.50 USD'
 *           formatCurrency(150000, 'ARS') → '$150.000 ARS'
 *           formatCurrency(99.9, 'EUR') → '€99,90 EUR'
 */
export function formatCurrency(amount: number, currency: Currency = 'USD'): string {
  if (!Number.isFinite(amount)) return '-';

  const decimals = currency === 'ARS' ? 0 : 2;
  const locale = CURRENCY_LOCALES[currency];
  const symbol = CURRENCY_SYMBOLS[currency];

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);

  return `${symbol}${formatted} ${currency}`;
}

/**
 * Format large amounts in compact notation.
 * Examples: formatCurrencyCompact(1450000, 'ARS') → '$1,45M ARS'
 *           formatCurrencyCompact(2500, 'USD') → '$2,50K USD'
 */
export function formatCurrencyCompact(amount: number, currency: Currency = 'USD'): string {
  if (!Number.isFinite(amount)) return '-';

  const locale = CURRENCY_LOCALES[currency];
  const symbol = CURRENCY_SYMBOLS[currency];

  const formatted = new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${symbol}${formatted} ${currency}`;
}

/**
 * Parse a formatted currency string back to a number.
 * Example: parseCurrencyAmount('$1,234.50 USD') → 1234.5
 */
export function parseCurrencyAmount(value: string): number {
  return parseFloat(value.replace(/[^0-9.-]+/g, ''));
}

/**
 * Canonical display order for currency selectors across the dashboard.
 * Use this instead of hardcoding ['USD', 'ARS', 'EUR'] inline.
 */
export const CURRENCY_ORDER = ['USD', 'ARS', 'EUR'] as const satisfies readonly Currency[];
