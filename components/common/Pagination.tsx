import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  /** Plural label for items, e.g. 'tarotistas'. Default: 'resultados' */
  itemLabel?: string;
}

/**
 * Standard pagination bar used across all list views.
 * Only renders when `pages > 1`.
 */
export function Pagination({
  page,
  pages,
  total,
  limit,
  onPageChange,
  itemLabel = 'resultados',
}: PaginationProps) {
  if (pages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  // Build the window of at most 5 page buttons centred around current page.
  const windowSize = Math.min(5, pages);
  let startPage: number;
  if (pages <= 5) {
    startPage = 1;
  } else if (page <= 3) {
    startPage = 1;
  } else if (page >= pages - 2) {
    startPage = pages - 4;
  } else {
    startPage = page - 2;
  }
  const pageNumbers = Array.from({ length: windowSize }, (_, i) => startPage + i);

  return (
    <div className="px-6 py-4 bg-slate-800/30 border-t border-slate-700">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-slate-400">
          Mostrando{' '}
          <span className="font-medium text-white">{from}</span>–
          <span className="font-medium text-white">{to}</span> de{' '}
          <span className="font-medium text-white">{total}</span> {itemLabel}
        </p>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            aria-label="Página anterior"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {pageNumbers.map((n) => (
            <button
              key={n}
              onClick={() => onPageChange(n)}
              aria-current={n === page ? 'page' : undefined}
              className={`min-w-[2.5rem] px-3 py-2 text-sm font-medium rounded-lg transition ${
                n === page
                  ? 'bg-purple-500 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {n}
            </button>
          ))}

          <button
            onClick={() => onPageChange(Math.min(pages, page + 1))}
            disabled={page === pages}
            aria-label="Página siguiente"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
