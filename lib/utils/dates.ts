import { format, formatDistanceToNow, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatDate(date: string | Date | null | undefined, formatStr: string = 'dd/MM/yyyy'): string {
  if (!date) return '-';

  if (formatStr === 'short') {
    formatStr = 'dd/MM/yyyy';
  }

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
