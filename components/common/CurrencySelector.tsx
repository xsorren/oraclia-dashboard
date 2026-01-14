import type { Currency } from '@/types/database';

interface CurrencySelectorProps {
  value: Currency;
  onChange: (currency: Currency) => void;
  className?: string;
}

export function CurrencySelector({ value, onChange, className = '' }: CurrencySelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Currency)}
      className={`px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${className}`}
    >
      <option value="USD">USD ($)</option>
      <option value="ARS">ARS ($)</option>
      <option value="EUR">EUR (€)</option>
    </select>
  );
}
