import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function ProductVariantSelector({
  product,
  selectedColor,
  setSelectedColor,
  handleColorSelect,
  isColorAvailable,
  selectedSize,
  setSelectedSize,
  handleSizeSelect,
  isSizeAvailable,
}) {
  return (
    <div className="space-y-4">
      {/* Color Selector */}
      {product.colors && product.colors.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                কালার (Color):
              </label>
              {selectedColor && (
                <button
                  type="button"
                  onClick={() => setSelectedColor(null)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200 transition cursor-pointer"
                  title="কালার সিলেকশন মুছে ফেলুন"
                >
                  ✕ মুছে ফেলুন
                </button>
              )}
            </div>
            {product.colors.find((c) => c.id === selectedColor) && (
              <span className="text-xs font-bold text-[#1b3b2b] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {product.colors.find((c) => c.id === selectedColor)?.value}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2.5">
            {product.colors.map((c) => {
              const isAvailable = isColorAvailable(c.id);
              const isSelected = selectedColor === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => handleColorSelect(c.id)}
                  title={
                    !isAvailable
                      ? `নির্বাচিত সাইজের সাথে ${c.value} রঙটি প্রযোজ্য নয়`
                      : c.value
                  }
                  className={`relative px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-200 ${
                    !isAvailable
                      ? 'border-neutral-200 bg-neutral-100/70 text-neutral-400 opacity-35 cursor-not-allowed line-through select-none'
                      : isSelected
                      ? 'border-[#1b3b2b] bg-[#1b3b2b] text-white shadow-sm ring-2 ring-[#1b3b2b]/20 scale-[1.02]'
                      : 'border-neutral-300 bg-white text-neutral-800 hover:border-amber-500 hover:bg-amber-50/50 cursor-pointer'
                  }`}
                >
                  {c.value}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size Selector */}
      {product.sizes && product.sizes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                সাইজ (Size):
              </label>
              {selectedSize && (
                <button
                  type="button"
                  onClick={() => setSelectedSize(null)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200 transition cursor-pointer"
                  title="সাইজ সিলেকশন মুছে ফেলুন"
                >
                  ✕ মুছে ফেলুন
                </button>
              )}
            </div>
            {product.sizes.find((s) => s.id === selectedSize) && (
              <span className="text-xs font-bold text-[#1b3b2b] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {product.sizes.find((s) => s.id === selectedSize)?.value}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2.5">
            {product.sizes.map((s) => {
              const isAvailable = isSizeAvailable(s.id);
              const isSelected = selectedSize === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => handleSizeSelect(s.id)}
                  title={
                    !isAvailable
                      ? `নির্বাচিত রঙের সাথে ${s.value} সাইজটি প্রযোজ্য নয়`
                      : s.value
                  }
                  className={`relative px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-200 ${
                    !isAvailable
                      ? 'border-neutral-200 bg-neutral-100/70 text-neutral-400 opacity-35 cursor-not-allowed line-through select-none'
                      : isSelected
                      ? 'border-[#1b3b2b] bg-[#1b3b2b] text-white shadow-sm ring-2 ring-[#1b3b2b]/20 scale-[1.02]'
                      : 'border-neutral-300 bg-white text-neutral-800 hover:border-amber-500 hover:bg-amber-50/50 cursor-pointer'
                  }`}
                >
                  {s.value}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selection guidance prompt if not selected */}
      {((product.colors?.length > 0 && !selectedColor) ||
        (product.sizes?.length > 0 && !selectedSize)) && (
        <div className="p-3 bg-amber-50/90 border border-amber-200/80 rounded-xl text-xs font-bold text-amber-800 flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            {!selectedColor && !selectedSize
              ? 'অর্ডার করতে অনুগ্রহ করে পছন্দের কালার ও সাইজ নির্বাচন করুন'
              : !selectedColor
              ? 'অর্ডার করতে অনুগ্রহ করে কালার নির্বাচন করুন'
              : 'অর্ডার করতে অনুগ্রহ করে সাইজ নির্বাচন করুন'}
          </span>
        </div>
      )}
    </div>
  );
}
