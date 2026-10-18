import React from 'react';
import { DollarSign, TrendingUp, ShoppingBag, Clock, AlertTriangle } from 'lucide-react';

const DashboardStatCards = ({ metrics, lowStockCount }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Total Revenue */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:border-[#1b3b2b]/30 transition-all">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">
              Total Revenue
            </p>
            <p className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
              ৳{Number(metrics.total_revenue).toLocaleString()}
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#1b3b2b]/10 text-[#1b3b2b] flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <p className="text-[11px] text-neutral-400 mt-2 font-medium">মোট বিক্রয় (নন-ক্যান্সেলড)</p>
      </div>

      {/* Today's Revenue */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:border-amber-400/40 transition-all">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">
              Today's Revenue
            </p>
            <p className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
              ৳{Number(metrics.today_revenue).toLocaleString()}
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-700 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <p className="text-[11px] text-neutral-400 mt-2 font-medium">আজকের মোট বিক্রয়</p>
      </div>

      {/* Total Orders */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:border-[#1b3b2b]/30 transition-all">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">
              Total Orders
            </p>
            <p className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
              {metrics.total_orders}
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-neutral-100 text-neutral-700 flex items-center justify-center font-bold">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>
        <p className="text-[11px] text-neutral-400 mt-2 font-medium">সর্বমোট অর্ডার সংখ্যা</p>
      </div>

      {/* Pending Orders */}
      <div
        className={`bg-white border rounded-2xl p-5 shadow-xs relative overflow-hidden group transition-all ${
          metrics.pending_orders > 0
            ? 'border-amber-300 ring-2 ring-amber-400/20'
            : 'border-neutral-200/80'
        }`}
      >
        <div className="flex justify-between items-start">
          <div>
            <p
              className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${
                metrics.pending_orders > 0 ? 'text-amber-700' : 'text-neutral-400'
              }`}
            >
              Pending Orders
            </p>
            <p
              className={`text-2xl sm:text-3xl font-black tracking-tight ${
                metrics.pending_orders > 0 ? 'text-amber-700' : 'text-neutral-900'
              }`}
            >
              {metrics.pending_orders}
            </p>
          </div>
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
              metrics.pending_orders > 0
                ? 'bg-amber-100 text-amber-700'
                : 'bg-neutral-100 text-neutral-500'
            }`}
          >
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <p className="text-[11px] text-neutral-400 mt-2 font-medium">ভেরিফিকেশনের অপেক্ষায়</p>
      </div>

      {/* Low Stock Alert Card */}
      <div
        className={`bg-white border rounded-2xl p-5 shadow-xs relative overflow-hidden group transition-all ${
          lowStockCount > 0
            ? 'border-rose-300 ring-2 ring-rose-400/20 bg-rose-50/30'
            : 'border-neutral-200/80'
        }`}
      >
        <div className="flex justify-between items-start">
          <div>
            <p
              className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${
                lowStockCount > 0 ? 'text-rose-700' : 'text-neutral-400'
              }`}
            >
              Low Stock Alert
            </p>
            <p
              className={`text-2xl sm:text-3xl font-black tracking-tight ${
                lowStockCount > 0 ? 'text-rose-600' : 'text-neutral-900'
              }`}
            >
              {lowStockCount}
            </p>
          </div>
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
              lowStockCount > 0
                ? 'bg-rose-100 text-rose-700'
                : 'bg-neutral-100 text-neutral-500'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
        <p className="text-[11px] text-neutral-400 mt-2 font-medium">স্টক ≤ ৫ টি আইটেম</p>
      </div>
    </div>
  );
};

export default DashboardStatCards;
