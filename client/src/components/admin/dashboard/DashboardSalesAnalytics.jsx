import React from 'react';
import { Calendar, Layers } from 'lucide-react';

const DashboardSalesAnalytics = ({ monthlySales, categorySales }) => {
  const maxMonthRevenue = Math.max(...monthlySales.map((m) => m.revenue || 0), 100);
  const totalCatRevenue = categorySales.reduce((sum, c) => sum + (c.revenue || 0), 0) || 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Sales Trend */}
      <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-bold text-neutral-900">মাসিক বিক্রয় রিপোর্ট (Monthly Sales)</h2>
          </div>
          <span className="text-xs font-bold text-neutral-400">গত ৬ মাস</span>
        </div>

        <div className="space-y-3">
          {monthlySales.length === 0 ? (
            <p className="text-xs text-neutral-400 py-6 text-center">এখনো পর্যাপ্ত তথ্য নেই</p>
          ) : (
            monthlySales.map((m, idx) => {
              const percent = Math.max(Math.round((m.revenue / maxMonthRevenue) * 100), 5);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-neutral-800">{m.month}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-neutral-500">{m.orders_count} টি অর্ডার</span>
                      <span className="font-mono font-black text-[#1b3b2b]">
                        ৳{Number(m.revenue).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${percent}%` }}
                      className="h-full bg-gradient-to-r from-[#1b3b2b] to-emerald-600 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Category Sales Breakdown */}
      <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-neutral-900">ক্যাটাগরি শেয়ার (Category Sales)</h2>
          </div>
          <span className="text-xs font-bold text-neutral-400">টপ ক্যাটাগরি</span>
        </div>

        <div className="space-y-3">
          {categorySales.length === 0 ? (
            <p className="text-xs text-neutral-400 py-6 text-center">এখনো কোনো বিক্রয় রেকর্ড নেই</p>
          ) : (
            categorySales.map((cat, idx) => {
              const percent = Math.min(Math.round((cat.revenue / totalCatRevenue) * 100), 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-neutral-800">{cat.category}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-neutral-500">{cat.quantity} টি আইটেম</span>
                      <span className="font-mono font-black text-amber-900">
                        ৳{Number(cat.revenue).toLocaleString()} ({percent}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${percent}%` }}
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardSalesAnalytics;
