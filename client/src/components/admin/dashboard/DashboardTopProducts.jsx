import React from 'react';
import { Award } from 'lucide-react';

const DashboardTopProducts = ({ topProducts }) => {
  return (
    <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-bold text-neutral-900">সেরা বিক্রয় পণ্য</h2>
        </div>
        <span className="text-xs text-neutral-400 font-semibold">By Quantity</span>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto">
        {topProducts.length === 0 ? (
          <div className="text-xs text-neutral-400 py-8 text-center">
            No products sold yet.
          </div>
        ) : (
          topProducts.map((p, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-neutral-50 transition border border-transparent hover:border-neutral-200/60"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                  idx === 0
                    ? 'bg-amber-100 text-amber-800'
                    : idx === 1
                      ? 'bg-neutral-200 text-neutral-800'
                      : idx === 2
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                  {p.product_name}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-black text-[#1b3b2b]">{p.total_qty}</p>
                <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold">
                  Sold
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DashboardTopProducts;
