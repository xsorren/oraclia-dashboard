import { type ReactNode } from 'react';

interface SectionCardProps {
  children: ReactNode;
  /** Extra Tailwind classes appended to the card */
  className?: string;
  /** Optional padding variant. 'none' skips the default p-6 so children control their own padding. Default: 'md' */
  padding?: 'none' | 'sm' | 'md';
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
} as const;

/**
 * Standardised card surface used throughout the dashboard.
 * Replaces the repetitive `bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg` class set.
 */
export function SectionCard({ children, className = '', padding = 'md' }: SectionCardProps) {
  return (
    <div
      className={`bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg ${paddingMap[padding]} ${className}`}
    >
      {children}
    </div>
  );
}
