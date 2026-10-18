import React from 'react';
import { Filter, RotateCcw, PackageCheck, Tag } from 'lucide-react';

export const PRICE_PRESETS = [
  { label: 'সকল মূল্য', min: '', max: '' },
  { label: '৳০ - ৳১,০০০', min: '0', max: '1000' },
  { label: '৳১,০০০ - ৳২,০০০', min: '1000', max: '2000' },
  { label: '৳২,০০০ - ৳৩,০০০', min: '2000', max: '3000' },
  { label: '৳৩,০০০ এর উপরে', min: '3000', max: '' },
];

export default function ProductFilterSidebar({
  categories,
  selectedCat,
  updateParam,
  minPrice,
  maxPrice,
  handlePricePreset,
  inputMinPrice,
  setInputMinPrice,
  inputMaxPrice,
  setInputMaxPrice,
  handleApplyCustomPrice,
  inStockOnly,
  onSaleOnly,
  saleOnly,
  activeFilterCount,
  clearAllFilters,
  onCloseMobile,
}) {
  return (
    <div className="space-y-6">
      {/* 1. Category Filter Module */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-neutral-100">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-amber-600" />
            <span>ক্যাটাগরি (Categories)</span>
          </span>
          {selectedCat && (
            <button
              type="button"
              onClick={() => updateParam('cat', '')}
              className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
            >
              রিসেট
            </button>
          )}
        </div>

        <div className="space-y-1 text-xs max-h-64 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => {
              updateParam('cat', '');
              onCloseMobile?.();
            }}
            className={`w-full text-left px-3 py-2 rounded-xl font-medium transition flex items-center justify-between cursor-pointer ${
              !selectedCat
                ? 'bg-[#1b3b2b] text-white font-bold'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <span>সব পণ্য (All Products)</span>
          </button>

          {categories.map((cat) => (
            <button
              type="button"
              key={cat.id}
              onClick={() => {
                updateParam('cat', cat.slug);
                onCloseMobile?.();
              }}
              className={`w-full text-left px-3 py-2 rounded-xl font-medium transition flex items-center justify-between cursor-pointer ${
                selectedCat === cat.slug
                  ? 'bg-[#1b3b2b] text-white font-bold'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              <span className="truncate">{cat.name}</span>
              {cat.product_count > 0 && (
                <span
                  className={`text-[10px] ml-2 shrink-0 ${
                    selectedCat === cat.slug ? 'text-amber-200' : 'text-neutral-400'
                  }`}
                >
                  ({cat.product_count})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Price Range Filter Module */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2.5 border-b border-neutral-100">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
            <span>মূল্য পরিসীমা (Price Range)</span>
          </span>
          {(minPrice || maxPrice) && (
            <button
              type="button"
              onClick={() => {
                updateParam('min_price', '');
                updateParam('max_price', '');
              }}
              className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
            >
              রিসেট
            </button>
          )}
        </div>

        {/* Quick Price Preset Chips */}
        <div className="flex flex-wrap gap-1.5">
          {PRICE_PRESETS.map((preset, idx) => {
            const isPresetActive = minPrice === preset.min && maxPrice === preset.max;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handlePricePreset(preset)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                  isPresetActive
                    ? 'border-[#1b3b2b] bg-[#1b3b2b] text-white font-bold shadow-2xs'
                    : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50 bg-white'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Min - Max Input Range Form */}
        <form onSubmit={handleApplyCustomPrice} className="space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-2 text-xs text-neutral-400 font-bold">
                ৳
              </span>
              <input
                type="number"
                placeholder="সর্বনিম্ন"
                value={inputMinPrice}
                onChange={(e) => setInputMinPrice(e.target.value)}
                className="w-full text-xs pl-6 pr-2 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:border-amber-600"
              />
            </div>
            <span className="text-xs text-neutral-400">-</span>
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-2 text-xs text-neutral-400 font-bold">
                ৳
              </span>
              <input
                type="number"
                placeholder="সর্বোচ্চ"
                value={inputMaxPrice}
                onChange={(e) => setInputMaxPrice(e.target.value)}
                className="w-full text-xs pl-6 pr-2 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            ফিল্টার করুন (Apply Price)
          </button>
        </form>
      </div>

      {/* 3. Availability & Special Offers */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 block pb-2.5 border-b border-neutral-100">
          প্রাপ্যতা ও অফার (Availability)
        </span>

        <div className="space-y-2 pt-1">
          {/* In Stock Only Checkbox */}
          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-neutral-700 hover:text-neutral-900 select-none">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => updateParam('in_stock', e.target.checked ? 'true' : '')}
              className="w-4 h-4 rounded-md accent-[#1b3b2b]"
            />
            <div className="flex items-center gap-1.5 font-medium">
              <PackageCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>শুধুমাত্র স্টকে থাকা পণ্য (In Stock Only)</span>
            </div>
          </label>

          {/* On Sale / Discount Checkbox */}
          {!saleOnly && (
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-neutral-700 hover:text-neutral-900 select-none">
              <input
                type="checkbox"
                checked={onSaleOnly}
                onChange={(e) => updateParam('on_sale', e.target.checked ? 'true' : '')}
                className="w-4 h-4 rounded-md accent-rose-600"
              />
              <div className="flex items-center gap-1.5 font-medium text-rose-700">
                <Tag className="w-3.5 h-3.5 text-rose-600" />
                <span>ডিসকাউন্ট ও অফার (On Sale)</span>
              </div>
            </label>
          )}
        </div>
      </div>

      {/* Reset All Filters Button */}
      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={() => {
            clearAllFilters();
            onCloseMobile?.();
          }}
          className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-rose-200 transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>সকল ফিল্টার রিসেট করুন ({activeFilterCount})</span>
        </button>
      )}
    </div>
  );
}
