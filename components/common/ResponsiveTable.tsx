import { ReactNode } from 'react';

interface ResponsiveTableProps {
  headers: string[];
  children: ReactNode;
  minWidth?: string;
}

export function ResponsiveTable({ headers, children, minWidth = '800px' }: ResponsiveTableProps) {
  return (
    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/50">
      <table className="w-full hidden md:table" style={{ minWidth }}>
        <thead className="bg-slate-800/50 border-b border-slate-700">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {children}
        </tbody>
      </table>
    </div>
  );
}

interface ResponsiveTableRowProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function ResponsiveTableRow({ children, onClick, className = '' }: ResponsiveTableRowProps) {
  return (
    <tr
      onClick={onClick}
      className={`hover:bg-slate-800/30 transition hidden md:table-row ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </tr>
  );
}

interface ResponsiveTableCellProps {
  children: ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export function ResponsiveTableCell({ children, align = 'left', className = '' }: ResponsiveTableCellProps) {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align];

  return (
    <td className={`px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap ${alignClass} ${className}`}>
      {children}
    </td>
  );
}

// Mobile Card Components
interface MobileCardListProps {
  children: ReactNode;
}

export function MobileCardList({ children }: MobileCardListProps) {
  return (
    <div className="md:hidden space-y-3 p-3">
      {children}
    </div>
  );
}

interface MobileCardProps {
  children: ReactNode;
  onClick?: () => void;
}

export function MobileCard({ children, onClick }: MobileCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3 ${onClick ? 'cursor-pointer hover:bg-slate-800/70 transition' : ''}`}
    >
      {children}
    </div>
  );
}

interface MobileCardHeaderProps {
  children: ReactNode;
}

export function MobileCardHeader({ children }: MobileCardHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      {children}
    </div>
  );
}

interface MobileCardFieldProps {
  label: string;
  value: ReactNode;
}

export function MobileCardField({ label, value }: MobileCardFieldProps) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

interface MobileCardActionsProps {
  children: ReactNode;
}

export function MobileCardActions({ children }: MobileCardActionsProps) {
  return (
    <div className="flex items-center gap-2 pt-2 border-t border-slate-700">
      {children}
    </div>
  );
}
