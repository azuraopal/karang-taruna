import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize = 5,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / pageSize);
  if (totalPages <= 1) return null;

  const firstItem = (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalItems);
  const pageItems: Array<number | 'ellipsis'> = (() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);

    const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
    const visiblePages = Array.from(pages).filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
    const items: Array<number | 'ellipsis'> = [];

    visiblePages.forEach((page, index) => {
      const previous = visiblePages[index - 1];
      if (previous && page - previous > 1) items.push('ellipsis');
      items.push(page);
    });

    return items;
  })();

  return (
    <div className="flex flex-col gap-3 border-t border-stone-100 bg-stone-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="whitespace-nowrap text-[11px] font-medium text-slate-500">
        Menampilkan <span className="font-bold text-slate-700">{firstItem}-{lastItem}</span> dari {totalItems} data
      </p>
      <nav className="flex items-center justify-between gap-2 sm:justify-end" aria-label="Navigasi halaman">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 bg-white text-slate-700 transition-colors hover:border-slate-300 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-amber-400"
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="hidden items-center gap-1 sm:flex">
          {pageItems.map((item, index) => item === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="inline-flex h-9 w-5 items-center justify-center text-xs font-bold text-slate-400" aria-hidden="true">...</span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              aria-current={item === currentPage ? 'page' : undefined}
              aria-label={`Halaman ${item}`}
              className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                item === currentPage
                  ? 'bg-slate-900 text-amber-400 shadow-sm'
                  : 'border border-stone-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-stone-100'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <span className="inline-flex h-9 min-w-16 items-center justify-center rounded-lg border border-stone-200 bg-white px-2 text-xs font-bold text-slate-700 sm:hidden" aria-label={`Halaman ${currentPage} dari ${totalPages}`}>
          {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 bg-white text-slate-700 transition-colors hover:border-slate-300 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-amber-400"
          aria-label="Halaman berikutnya"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </nav>
    </div>
  );
};
