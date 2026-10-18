import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function MobileStickyBottomBar({
  total,
  loading,
}) {
  return (
    <div className="lg:hidden fixed bottom-14 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-neutral-200 px-4 py-2.5 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2">
      <div>
        <span className="text-[10px] text-neutral-400 block font-medium">সর্বমোট:</span>
        <span className="text-base font-black text-[#1b3b2b]">৳{total.toFixed(0)}</span>
      </div>

      <button
        type="submit"
        form="checkout-form"
        disabled={loading}
        className="flex-1 max-w-xs py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer disabled:opacity-50"
      >
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <span>{loading ? 'অর্ডার হচ্ছে...' : 'অর্ডার কনফার্ম করুন'}</span>
      </button>
    </div>
  );
}
