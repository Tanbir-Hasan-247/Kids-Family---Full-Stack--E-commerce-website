import React from 'react';
import { X } from 'lucide-react';

export default function ProductActiveFiltersBar({
  activeFilterCount,
  selectedCat,
  currentCategoryName,
  minPrice,
  maxPrice,
  inStockOnly,
  onSaleOnly,
  saleOnly,
  searchQuery,
  updateParam,
  clearAllFilters,
}) {
  if (activeFilterCount <= 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap mb-5 p-2.5 bg-neutral-100/70 rounded-xl border border-neutral-200/60 text-xs">
      <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide">
        ফিল্টারসমূহ:
      </span>

      {selectedCat && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-neutral-200 text-neutral-800 text-[11px] font-semibold shadow-2xs">
          <span>ক্যাটাগরি: {currentCategoryName || selectedCat}</span>
          <button
            onClick={() => updateParam('cat', '')}
            className="hover:text-rose-600 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {(minPrice || maxPrice) && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-neutral-200 text-neutral-800 text-[11px] font-semibold shadow-2xs">
          <span>
            মূল্য: {minPrice ? `৳${minPrice}` : '৳০'} - {maxPrice ? `৳${maxPrice}` : 'সর্বোচ্চ'}
          </span>
          <button
            onClick={() => {
              updateParam('min_price', '');
              updateParam('max_price', '');
            }}
            className="hover:text-rose-600 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {inStockOnly && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold shadow-2xs">
          <span>ইন-স্টক শুধুমাত্র</span>
          <button
            onClick={() => updateParam('in_stock', '')}
            className="hover:text-rose-600 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {onSaleOnly && !saleOnly && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold shadow-2xs">
          <span>অফার শুধুমাত্র</span>
          <button
            onClick={() => updateParam('on_sale', '')}
            className="hover:text-rose-600 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {searchQuery && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-neutral-200 text-neutral-800 text-[11px] font-semibold shadow-2xs">
          <span>অনুসন্ধান: "{searchQuery}"</span>
          <button
            onClick={() => updateParam('q', '')}
            className="hover:text-rose-600 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      <button
        onClick={clearAllFilters}
        className="text-[11px] font-bold text-rose-600 hover:text-rose-800 underline ml-auto cursor-pointer"
      >
        সব ক্লিয়ার করুন
      </button>
    </div>
  );
}
