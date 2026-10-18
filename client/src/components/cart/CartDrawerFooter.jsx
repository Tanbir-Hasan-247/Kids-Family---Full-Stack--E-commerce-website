import React from 'react';
import { ArrowRight } from 'lucide-react';

const CartDrawerFooter = ({
  parsedTotal,
  shippingFee,
  grandTotal,
  onCheckout,
}) => {
  return (
    <div
      className="border-t border-neutral-200 p-4 sm:p-5 space-y-3 bg-neutral-50/90 shrink-0 shadow-inner"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
    >
      <div className="space-y-1 text-xs text-neutral-600">
        <div className="flex justify-between">
          <span>সাবটোটাল</span>
          <span className="font-bold text-neutral-900">৳{parsedTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[11px] text-neutral-500">
          <span>ডেলিভারি চার্জ</span>
          <span className="font-semibold text-neutral-800">৳{shippingFee}</span>
        </div>
        <div className="flex justify-between text-sm font-black text-neutral-900 pt-1.5 border-t border-neutral-200">
          <span>মোট প্রদেয়</span>
          <span className="text-[#1b3b2b] text-base">৳{grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <button
        onClick={onCheckout}
        className="w-full py-3 px-4 bg-[#1b3b2b] hover:bg-[#142e22] active:scale-98 text-amber-400 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
      >
        <span>অর্ডার সম্পন্ন করতে এগিয়ে যান</span>
        <ArrowRight className="w-4 h-4" />
      </button>

      <p className="text-[10px] text-center text-neutral-400">
        🔒 ক্যাশ অন ডেলিভারি এবং সুরক্ষিত চেকআউট
      </p>
    </div>
  );
};

export default CartDrawerFooter;

