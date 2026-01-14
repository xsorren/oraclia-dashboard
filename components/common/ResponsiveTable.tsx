import { ReactNode } from 'react';

interface ResponsiveTableProps {
  headers: string[];
  children: ReactNode;
  minWidth?: string;
}

export function ResponsiveTable({ headers, children, minWidth = '800px' }: ResponsiveTableProps) {
  return (
    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/50">
      <table className="w-full" style={{ minWidth }}>
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
}

export function ResponsiveTableRow({ children, onClick }: ResponsiveTableRowProps) {
  return (
    <tr
      onClick={onClick}
      className={`hover:bg-slate-800/30 transition ${onClick ? 'cursor-pointer' : ''}`}
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
