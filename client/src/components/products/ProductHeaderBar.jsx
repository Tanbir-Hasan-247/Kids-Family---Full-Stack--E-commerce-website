import React from 'react';
import { ArrowUpDown, SlidersHorizontal } from 'lucide-react';

export default function ProductHeaderBar({
  saleOnly,
  currentCategoryName,
  totalCount,
  searchQuery,
  selectedCat,
  onOpenMobileFilter,
  activeFilterCount,
  currentSort,
  onSortChange,
}) {
  return (
    <div className="border-b border-neutral-200 pb-4 sm:pb-6 mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-neutral-900 tracking-tight">
          {saleOnly
            ? 'স্পেশাল অফার ও ডিসকাউন্ট (Offers & Sale)'
            : currentCategoryName || 'আমাদের সকল পণ্য (All Products)'}
        </h1>

        <p className="text-[11px] sm:text-xs text-neutral-500 mt-1">
          মোট {totalCount} টি পণ্য পাওয়া গেছে
          {searchQuery && ` ("${searchQuery}" এর জন্য)`}
          {selectedCat && currentCategoryName && ` (${currentCategoryName} ক্যাটাগরিতে)`}
        </p>
      </div>

      {/* Action Controls: Mobile Filter Button & Sort Dropdown */}
      <div className="flex items-center gap-2.5 self-end sm:self-auto w-full sm:w-auto justify-between sm:justify-end">
        {/* Mobile Filter Drawer Trigger Button */}
        <button
          type="button"
          onClick={onOpenMobileFilter}
          className="lg:hidden flex items-center gap-1.5 px-3.5 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-bold text-neutral-800 shadow-2xs active:scale-95 transition cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
          <span>ফিল্টার</span>
          {activeFilterCount > 0 && (
            <span className="bg-[#1b3b2b] text-white text-[10px] font-black rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-[11px] sm:text-xs font-semibold text-neutral-500 hidden xs:flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>সর্ট:</span>
          </label>

          <select
            value={currentSort}
            onChange={(e) => onSortChange(e.target.value)}
            className="text-xs font-semibold bg-white border border-neutral-300 rounded-xl px-2.5 py-2 text-neutral-800 focus:outline-none focus:border-amber-500 shadow-2xs cursor-pointer"
          >
            <option value="newest">সম্প্রতি যোগ করা (Newest)</option>
            <option value="price_asc">মূল্য: কম থেকে বেশি (Low to High)</option>
            <option value="price_desc">মূল্য: বেশি থেকে কম (High to Low)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
