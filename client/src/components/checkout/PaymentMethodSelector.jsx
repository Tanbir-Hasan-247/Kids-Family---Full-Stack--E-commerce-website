import React from 'react';
import { Truck } from 'lucide-react';

export default function PaymentMethodSelector({
  paymentMethod,
  handleChange,
}) {
  return (
    <div className="bg-white p-5 sm:p-7 rounded-3xl border border-neutral-200/80 shadow-xs space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
        <div className="p-2 bg-emerald-100 text-emerald-900 rounded-xl">
          <Truck className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
            ২. পেমেন্ট পদ্ধতি নির্বাচন করুন
          </h2>
          <p className="text-[11px] text-neutral-500">নিরাপদ ও সহজ পেমেন্ট</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <label
          className={`p-4 rounded-2xl border-2 cursor-pointer flex items-start gap-3 transition ${
            paymentMethod === 'cod'
              ? 'border-[#1b3b2b] bg-emerald-50/50 shadow-xs'
              : 'border-neutral-200 hover:border-neutral-300 bg-white'
          }`}
        >
          <input
            type="radio"
            name="payment_method"
            value="cod"
            checked={paymentMethod === 'cod'}
            onChange={handleChange}
            className="mt-1 accent-[#1b3b2b]"
          />
          <div>
            <span className="text-xs sm:text-sm font-bold text-neutral-900 block">
              ক্যাশ অন ডেলিভারি (COD)
            </span>
            <span className="text-[11px] text-neutral-500 leading-tight block mt-1">
              পণ্য হাতে পেয়ে চেক করে ডেলিভারি ম্যানকে টাকা দিন
            </span>
          </div>
        </label>

        <label
          className={`p-4 rounded-2xl border-2 cursor-pointer flex items-start gap-3 transition ${
            paymentMethod === 'online'
              ? 'border-[#1b3b2b] bg-emerald-50/50 shadow-xs'
              : 'border-neutral-200 hover:border-neutral-300 bg-white'
          }`}
        >
          <input
            type="radio"
            name="payment_method"
            value="online"
            checked={paymentMethod === 'online'}
            onChange={handleChange}
            className="mt-1 accent-[#1b3b2b]"
          />
          <div>
            <span className="text-xs sm:text-sm font-bold text-neutral-900 block">
              বিকাশ / নগদ / কার্ড
            </span>
            <span className="text-[11px] text-neutral-500 leading-tight block mt-1">
              ইনস্ট্যান্ট ডিজিটাল পেমেন্ট ও দ্রুত প্রসেসিং
            </span>
          </div>
        </label>
      </div>
    </div>
  );
}
