import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

const ORDER_STEPS = ['গৃহীত', 'কনফার্মড', 'প্রসেসিং', 'শিপড', 'ডেলিভারি'];

export default function ChatOrderCard({ order, onNavigate }) {
  if (!order) return null;

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-3.5 space-y-3 text-left shadow-xs">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
        <div>
          <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
            অর্ডার আইডি
          </span>
          <p className="font-mono font-black text-xs text-[#1b3b2b]">
            {order.order_number}
          </p>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            order.status === 'cancelled'
              ? 'bg-rose-100 text-rose-800'
              : order.status === 'delivered'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
          }`}
        >
          {order.status_title}
        </span>
      </div>

      {/* Progress Step Stepper */}
      <div className="py-1">
        <div className="grid grid-cols-5 gap-1 items-center text-center">
          {ORDER_STEPS.map((stepName, i) => {
            const stepIdx = i + 1;
            const isDone = order.step >= stepIdx;
            const isCurrent = order.step === stepIdx;

            return (
              <div key={stepName} className="flex flex-col items-center">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                        ? 'bg-amber-500 text-white animate-pulse'
                        : 'bg-neutral-200 text-neutral-500'
                  }`}
                >
                  {isDone ? '✓' : stepIdx}
                </div>
                <span className="text-[9px] mt-1 text-neutral-500 font-medium truncate w-full">
                  {stepName}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-[11px] text-neutral-600 bg-neutral-50 p-2.5 rounded-xl space-y-1">
        <div className="flex justify-between">
          <span>গ্রাহক:</span>
          <span className="font-bold text-neutral-800">{order.full_name}</span>
        </div>
        <div className="flex justify-between">
          <span>মোট বিল:</span>
          <span className="font-black text-[#1b3b2b]">
            ৳{Number(order.total).toLocaleString()} ({order.payment_method})
          </span>
        </div>
        <div className="flex justify-between">
          <span>ঠিকানা:</span>
          <span className="text-neutral-700 truncate max-w-[170px]">
            {order.address}
          </span>
        </div>
      </div>

      <Link
        to={`/track-order/${order.order_number}`}
        onClick={onNavigate}
        className="inline-flex items-center justify-center gap-1.5 w-full py-2 bg-[#1b3b2b] text-white rounded-xl font-bold text-xs hover:bg-[#234d38] transition shadow-xs"
      >
        <span>পূর্ণাঙ্গ ট্র্যাকিং পেজ দেখুন</span>
        <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
      </Link>
    </div>
  );
}
