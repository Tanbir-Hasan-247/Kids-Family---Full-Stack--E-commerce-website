import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Truck } from 'lucide-react';

const OrderHistoryEmptyState = () => {
  return (
    <div className="py-16 text-center bg-white rounded-3xl border border-neutral-200/80 p-8 space-y-5 shadow-2xs">
      <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center mx-auto">
        <Package className="w-8 h-8" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-black text-neutral-900">আপনার কোনো অর্ডার পাওয়া যায়নি</h3>
        <p className="text-xs text-neutral-500 max-w-sm mx-auto">
          আপনি এখনো কোনো অর্ডার করেননি, অথবা পূর্বে কোনো ফোন নম্বর দিয়ে অর্ডার করে থাকলে সরাসরি ট্র্যাক অপশন ব্যবহার করুন।
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <Link
          to="/products"
          className="px-6 py-2.5 bg-[#1b3b2b] text-white rounded-full text-xs font-bold hover:bg-[#142e22] shadow-sm transition active:scale-95"
        >
          কেনাকাটা শুরু করুন
        </Link>
        <Link
          to="/track-order"
          className="px-6 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-full text-xs font-bold transition active:scale-95 flex items-center gap-1.5"
        >
          <Truck className="w-3.5 h-3.5" />
          <span>গেস্ট অর্ডার ট্র্যাক করুন</span>
        </Link>
      </div>
    </div>
  );
};

export default OrderHistoryEmptyState;

