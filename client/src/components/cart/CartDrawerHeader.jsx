import React from 'react';
import { ShoppingBag, X } from 'lucide-react';

const CartDrawerHeader = ({ totalItems, onClose }) => {
  return (
    <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/80 shrink-0">
      <div className="flex items-center gap-2">
        <ShoppingBag className="w-5 h-5 text-[#1b3b2b]" />
        <h2 className="text-sm sm:text-base font-extrabold text-neutral-900">
          শপিং ব্যাগ (Cart)
        </h2>
        <span className="text-[11px] sm:text-xs bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
          {totalItems}
        </span>
      </div>
      <button
        onClick={onClose}
        className="p-1.5 text-neutral-400 hover:text-neutral-700 active:scale-95 rounded-full hover:bg-neutral-100 transition cursor-pointer"
        title="Close Bag"
        aria-label="Close Shopping Bag"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export default CartDrawerHeader;

