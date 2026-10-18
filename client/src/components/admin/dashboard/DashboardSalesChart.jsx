import React, { useState } from 'react';

const DashboardSalesChart = ({ chartData }) => {
  const [hoveredBar, setHoveredBar] = useState(null);
  const maxRevenue = Math.max(...chartData.map((d) => d.revenue || 0), 100);

  return (
    <div className="xl:col-span-2 bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-bold text-neutral-900">Revenue Trend (গত ১৪ দিন)</h2>
          <p className="text-xs text-neutral-500">প্রতিদিনের অর্ডারের মোট বিক্রয় ট্রেন্ড</p>
        </div>
        <span className="text-xs font-bold text-neutral-600 bg-neutral-100 px-3 py-1 rounded-full">
          Last 14 Days
        </span>
      </div>

      {/* Visual SVG / HTML Bar Chart */}
      <div className="h-64 sm:h-72 w-full flex items-end gap-1.5 sm:gap-3 pt-6 border-b border-neutral-100 pb-2 relative">
        {chartData.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">
            No sales recorded in this period yet.
          </div>
        ) : (
          chartData.map((item, index) => {
            const heightPercent = Math.max(Math.round((item.revenue / maxRevenue) * 100), 4);
            const isHovered = hoveredBar === index;

            return (
              <div
                key={item.iso_date || index}
                className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                onMouseEnter={() => setHoveredBar(index)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute -top-10 z-20 bg-neutral-900 text-white text-[11px] font-bold px-2 py-1 rounded-md shadow-lg whitespace-nowrap">
                    ৳{Number(item.revenue).toLocaleString()}
                  </div>
                )}

                {/* Bar */}
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full max-w-[28px] rounded-t-lg transition-all duration-300 ${
                    item.revenue > 0
                      ? isHovered
                        ? 'bg-amber-400'
                        : 'bg-[#1b3b2b]'
                      : 'bg-neutral-200'
                  }`}
                />
                {/* Date label */}
                <span className="text-[10px] text-neutral-400 font-medium mt-2 truncate w-full text-center">
                  {item.date.split(' ')[0]}
                </span>
              </div>
            );
          })
        )}
      </div>
      <div className="flex justify-between items-center pt-3 text-[11px] text-neutral-400">
        <span>0 ৳</span>
        <span>Max: ৳{Math.round(maxRevenue).toLocaleString()}</span>
      </div>
    </div>
  );
};

export default DashboardSalesChart;
