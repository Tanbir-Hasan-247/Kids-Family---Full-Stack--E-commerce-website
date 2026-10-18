import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ProductPagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  getPageNumbers,
  handlePageChange,
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 sm:mt-12 pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Status text */}
      <p className="text-xs text-neutral-500 font-medium order-2 sm:order-1">
        মোট <span className="font-bold text-neutral-900">{totalCount}</span> টি পণ্যের মধ্যে{' '}
        <span className="font-bold text-neutral-900">
          {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalCount)}
        </span>{' '}
        টি প্রদর্শিত হচ্ছে
      </p>

      {/* Page Navigation Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2 order-1 sm:order-2">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-2 sm:px-3 sm:py-2 rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
          title="পূর্ববর্তী পেজ"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">পূর্ববর্তী</span>
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((p, idx) =>
            p === '...' ? (
              <span
                key={`dots-${idx}`}
                className="px-2 text-xs text-neutral-400 select-none"
              >
                ...
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => handlePageChange(p)}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs font-black transition flex items-center justify-center cursor-pointer ${
                  currentPage === p
                    ? 'bg-[#1b3b2b] text-white shadow-md scale-105 ring-2 ring-[#1b3b2b]/20'
                    : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-amber-50 hover:border-amber-300'
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-2 sm:px-3 sm:py-2 rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
          title="পরবর্তী পেজ"
        >
          <span className="hidden sm:inline">পরবর্তী</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
