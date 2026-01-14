'use client';

import { ChevronDown, Filter as FilterIcon } from 'lucide-react';
import { ReactNode, useState } from 'react';

interface FilterPanelProps {
  children: ReactNode;
  title?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export function FilterPanel({ children, title = 'Filtros', collapsible = true, defaultOpen = true }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!collapsible) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg p-4 sm:p-6">
        {title && (
          <div className="flex items-center gap-2 mb-4">
            <FilterIcon className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
        )}
        {children}
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-slate-800/30 transition lg:cursor-default"
      >
        <div className="flex items-center gap-2">
          <FilterIcon className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 transition-transform lg:hidden ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      
      <div
        className={`transition-all duration-300 ease-in-out lg:block ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 lg:max-h-none lg:opacity-100'
        }`}
      >
        <div className="p-4 pt-0 sm:p-6 sm:pt-0 lg:pt-0">
          {children}
        </div>
      </div>
    </div>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  className?: string;
}

export function FilterSelect({ label, value, onChange, options, className = '' }: FilterSelectProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-400 mb-2">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
