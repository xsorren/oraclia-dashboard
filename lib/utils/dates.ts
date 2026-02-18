import { format, formatDistanceToNow, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatDate(date: string | Date | null | undefined, formatStr: string = 'dd/MM/yyyy'): string {
  if (!date) return '-';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(dateObj)) return 'Fecha inválida';
    return format(dateObj, formatStr, { locale: es });
  } catch {
    return 'Fecha inválida';
  }
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
}

export function formatRelativeTime(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(dateObj)) return 'Fecha inválida';
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: es });
  } catch {
    return 'Fecha inválida';
  }
}

export function getMonthName(monthIndex: number): string {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return months[monthIndex] || 'Mes inválido';
}

export function getCurrentMonth(): number {
  return new Date().getMonth() + 1; // 1-12
}

export function getCurrentYear(): number {
  return new Date().getFullYear();
}

/**
 * Format a date range for display.
 * Examples: formatDateRange('2026-01-01', '2026-01-31') → '01/01/2026 – 31/01/2026'
 *           formatDateRange(null, '2026-01-31')          → 'hasta 31/01/2026'
 *           formatDateRange('2026-01-01', null)           → 'desde 01/01/2026'
 */
export function formatDateRange(
  from: string | Date | null | undefined,
  to: string | Date | null | undefined,
): string {
  const fromStr = formatDate(from);
  const toStr = formatDate(to);
  if (fromStr === '-' && toStr === '-') return '-';
  if (fromStr === '-') return `hasta ${toStr}`;
  if (toStr === '-') return `desde ${fromStr}`;
  return `${fromStr} – ${toStr}`;
}
