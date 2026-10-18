import React from 'react';
import { ShoppingBag, Zap } from 'lucide-react';

export default function ProductMobileStickyBar({
  displayPrice,
  handleAddToBag,
  handleDirectBuy,
  addingToBag,
  activeVariant,
}) {
  return (
    <div className="lg:hidden fixed bottom-14 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-neutral-200 px-4 py-2.5 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2">
      <div>
        <span className="text-[10px] text-neutral-400 block font-medium">মূল্য:</span>
        <span className="text-base font-black text-[#1b3b2b]">৳{displayPrice}</span>
      </div>

      <div className="flex items-center gap-2 flex-1 max-w-xs">
        <button
          onClick={handleAddToBag}
          disabled={addingToBag || (activeVariant && activeVariant.stock < 1)}
          className="p-2.5 rounded-xl border border-neutral-300 bg-neutral-50 hover:bg-neutral-100 text-[#1b3b2b] shrink-0 active:scale-95 transition cursor-pointer disabled:cursor-not-allowed"
          title="Add to Cart"
        >
          <ShoppingBag className="w-5 h-5" />
        </button>

        <button
          onClick={handleDirectBuy}
          disabled={addingToBag || (activeVariant && activeVariant.stock < 1)}
          className="flex-1 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer disabled:cursor-not-allowed"
        >
          <Zap className="w-4 h-4 fill-white shrink-0" />
          <span>সরাসরি অর্ডার করুন</span>
        </button>
      </div>
    </div>
  );
}
