import React from 'react';

export default function TrackMultiOrdersTabs({
  ordersFound,
  activeOrder,
  setActiveOrder,
}) {
  if (!ordersFound || ordersFound.length <= 1) return null;

  return (
    <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-2.5">
      <div className="flex items-center justify-between text-xs font-bold text-amber-950">
        <span>এই মোবাইল নম্বরে {ordersFound.length} টি অর্ডার পাওয়া গেছে:</span>
        <span className="text-[11px] text-amber-800">যেকোনো একটি নির্বাচন করুন</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {ordersFound.map((ord) => {
          const isSelected = activeOrder?.id === ord.id;
          return (
            <button
              key={ord.id}
              onClick={() => setActiveOrder(ord)}
              type="button"
              className={`text-left p-3 rounded-xl border transition-all text-xs cursor-pointer flex flex-col gap-1 ${
                isSelected
                  ? 'bg-[#1b3b2b] text-white border-[#1b3b2b] shadow-md ring-2 ring-amber-400'
                  : 'bg-white text-neutral-800 border-amber-200 hover:border-amber-400 hover:bg-amber-100/50'
              }`}
            >
              <div className="flex justify-between items-center font-extrabold">
                <span>{ord.order_number}</span>
                <span
                  className={`text-[10px] px-2 py-0.2 rounded-full uppercase ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-700'
                  }`}
                >
                  {ord.status_display || ord.status}
                </span>
              </div>
              <div
                className={`text-[11px] flex justify-between ${
                  isSelected ? 'text-emerald-200' : 'text-neutral-500'
                }`}
              >
                <span>{new Date(ord.created_at).toLocaleDateString()}</span>
                <span className="font-bold">৳{ord.total}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
