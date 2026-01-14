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

export function formatCurrency(amount: number, currency: Currency = 'USD'): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  
  // Format with 2 decimals for USD/EUR, 0 for ARS
  const decimals = currency === 'ARS' ? 0 : 2;
  const formatted = amount.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  if (currency === 'ARS') {
    return `${symbol}${formatted} ARS`;
  }
  
  return `${symbol}${formatted} ${currency}`;
}

export function parseCurrencyAmount(value: string): number {
  return parseFloat(value.replace(/[^0-9.-]+/g, ''));
}
