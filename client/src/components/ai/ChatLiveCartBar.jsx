import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

export default function ChatLiveCartBar({
  totalItems,
  totalPrice,
  onViewBag,
  onCheckout,
}) {
  if (!totalItems || totalItems <= 0) return null;

  return (
    <div className="bg-emerald-50/95 border-t border-b border-emerald-200/80 px-3.5 py-2 flex items-center justify-between text-xs shrink-0 select-none shadow-xs">
      <div className="flex items-center gap-1.5 text-emerald-950 font-bold">
        <ShoppingBag className="w-4 h-4 text-emerald-700" />
        <span>
          কার্টে {totalItems}টি পণ্য (৳{Number(totalPrice).toLocaleString()})
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={onViewBag}
          className="px-2.5 py-1 bg-[#1b3b2b] text-white rounded-lg font-bold text-[11px] hover:bg-[#285740] transition cursor-pointer shadow-xs"
        >
          ব্যাগ দেখুন
        </button>
        <Link
          to="/checkout"
          onClick={onCheckout}
          className="px-2.5 py-1 bg-amber-500 text-neutral-900 rounded-lg font-black text-[11px] hover:bg-amber-400 transition shadow-xs"
        >
          অর্ডার সম্পন্ন করুন ➔
        </Link>
      </div>
    </div>
  );
}
