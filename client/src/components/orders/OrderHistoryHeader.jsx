import React from 'react';
import { Package, Search, Truck } from 'lucide-react';

const OrderHistoryHeader = ({
  trackSearchQuery,
  setTrackSearchQuery,
  onTrackSubmit,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/70 text-amber-900 text-xs font-bold mb-2">
          <Package className="w-3.5 h-3.5 text-amber-800" />
          <span>অর্ডার হিস্ট্রি ও ট্র্যাকিং</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
          আমার অর্ডারসমূহ
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          আপনার সকল অর্ডারের তালিকা দেখুন অথবা যেকোনো অর্ডারে ক্লিক করে বিস্তারিত লাইভ ট্র্যাকিং দেখুন।
        </p>
      </div>

      {/* Quick Track Input in Header */}
      <form onSubmit={onTrackSubmit} className="flex gap-2 max-w-sm w-full">
        <div className="relative flex-1">
          <input
            type="text"
            value={trackSearchQuery}
            onChange={(e) => setTrackSearchQuery(e.target.value)}
            placeholder="অর্ডার নাম্বার বা ফোন নম্বর দিন..."
            className="w-full pl-9 pr-3 py-2.5 text-xs bg-white rounded-xl border border-neutral-300 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500 shadow-2xs placeholder:text-neutral-400"
          />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3 pointer-events-none" />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 bg-[#1b3b2b] hover:bg-[#142e22] text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer whitespace-nowrap flex items-center gap-1.5"
        >
          <Truck className="w-3.5 h-3.5" />
          <span>ট্র্যাক</span>
        </button>
      </form>
    </div>
  );
};

export default OrderHistoryHeader;

