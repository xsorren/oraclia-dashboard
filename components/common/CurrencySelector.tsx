import { CURRENCY_NAMES, CURRENCY_ORDER, CURRENCY_SYMBOLS } from '@/lib/utils/currency';
import type { Currency } from '@/types/database';

interface CurrencySelectorProps {
  value: Currency;
  onChange: (currency: Currency) => void;
  className?: string;
  /** Show a leading label inside the control. Default: false */
  showLabel?: boolean;
}

export function CurrencySelector({ value, onChange, className = '', showLabel = false }: CurrencySelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Currency)}
      className={`px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${className}`}
    >
      {CURRENCY_ORDER.map((c) => (
        <option key={c} value={c}>
          {showLabel ? `${CURRENCY_NAMES[c]} (${CURRENCY_SYMBOLS[c]})` : `${c} (${CURRENCY_SYMBOLS[c]})`}
        </option>
      ))}
    </select>
  );
}
