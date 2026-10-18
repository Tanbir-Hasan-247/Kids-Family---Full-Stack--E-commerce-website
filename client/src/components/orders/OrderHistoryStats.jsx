import React from 'react';
import { Package, Clock, CheckCircle2 } from 'lucide-react';

const OrderHistoryStats = ({ totalCount, pendingCount, deliveredCount }) => {
  if (totalCount === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      <div className="bg-white p-4 rounded-2xl border border-neutral-200/90 shadow-2xs flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-neutral-100 text-[#1b3b2b]">
          <Package className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[11px] text-neutral-400 font-medium block">মোট অর্ডার</span>
          <span className="text-base sm:text-lg font-black text-neutral-900">{totalCount} টি</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-neutral-200/90 shadow-2xs flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[11px] text-neutral-400 font-medium block">প্রসেসিংয়ে আছে</span>
          <span className="text-base sm:text-lg font-black text-amber-800">{pendingCount} টি</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-neutral-200/90 shadow-2xs flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[11px] text-neutral-400 font-medium block">ডেলিভারি সম্পন্ন</span>
          <span className="text-base sm:text-lg font-black text-emerald-800">{deliveredCount} টি</span>
        </div>
      </div>
    </div>
  );
};

export default OrderHistoryStats;

