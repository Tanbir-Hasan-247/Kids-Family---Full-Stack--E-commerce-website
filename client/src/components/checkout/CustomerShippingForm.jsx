import React from 'react';
import { User } from 'lucide-react';

export default function CustomerShippingForm({
  formData,
  handleChange,
  deliveryZone,
  handleZoneChange,
  feeInside,
  feeOutside,
}) {
  return (
    <div className="bg-white p-5 sm:p-7 rounded-3xl border border-neutral-200/80 shadow-xs space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
        <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
          <User className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
            ১. কাস্টমার ও ডেলিভারি তথ্য
          </h2>
          <p className="text-[11px] text-neutral-500">আপনার সঠিক তথ্য প্রদান করুন</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-neutral-800 mb-1">
            আপনার নাম (Full Name) *
          </label>
          <input
            type="text"
            name="full_name"
            required
            value={formData.full_name}
            onChange={handleChange}
            placeholder="যেমন: তানবীর হাসান"
            className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:outline-none focus:border-amber-600 bg-neutral-50/50 focus:bg-white transition"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-800 mb-1">
            মোবাইল নাম্বার (Mobile Number) *
          </label>
          <input
            type="tel"
            inputMode="numeric"
            name="phone"
            required
            value={formData.phone}
            onChange={handleChange}
            placeholder="যেমন: 01700000000"
            className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:outline-none focus:border-amber-600 bg-neutral-50/50 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Delivery Zone Selector */}
      <div>
        <label className="block text-xs font-bold text-neutral-800 mb-2">
          ডেলিভারি এলাকা নির্বাচন করুন *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleZoneChange('inside_dhaka')}
            className={`p-3.5 rounded-2xl border-2 text-left flex items-center justify-between transition cursor-pointer ${
              deliveryZone === 'inside_dhaka'
                ? 'border-[#1b3b2b] bg-emerald-50/60 shadow-xs'
                : 'border-neutral-200 hover:border-neutral-300 bg-white'
            }`}
          >
            <div>
              <span className="text-xs font-bold text-neutral-900 block">
                ঢাকা সিটির ভেতরে
              </span>
              <span className="text-[11px] text-neutral-500">হোম ডেলিভারি (২-৩ দিন)</span>
            </div>
            <span className="text-xs font-black text-[#1b3b2b] bg-white px-2.5 py-1 rounded-full border border-neutral-200">
              ৳{feeInside}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleZoneChange('outside_dhaka')}
            className={`p-3.5 rounded-2xl border-2 text-left flex items-center justify-between transition cursor-pointer ${
              deliveryZone === 'outside_dhaka'
                ? 'border-[#1b3b2b] bg-emerald-50/60 shadow-xs'
                : 'border-neutral-200 hover:border-neutral-300 bg-white'
            }`}
          >
            <div>
              <span className="text-xs font-bold text-neutral-900 block">
                ঢাকা সিটির বাইরে
              </span>
              <span className="text-[11px] text-neutral-500">সমগ্র বাংলাদেশ (৩-৫ দিন)</span>
            </div>
            <span className="text-xs font-black text-[#1b3b2b] bg-white px-2.5 py-1 rounded-full border border-neutral-200">
              ৳{feeOutside}
            </span>
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-neutral-800 mb-1">
          সম্পূর্ণ ঠিকানা (Full Delivery Address) *
        </label>
        <input
          type="text"
          name="address_line"
          required
          value={formData.address_line}
          onChange={handleChange}
          placeholder="বাসা/হোল্ডিং নম্বর, রোড, এলাকা/গ্রাম, থানা ও জেলা"
          className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:outline-none focus:border-amber-600 bg-neutral-50/50 focus:bg-white transition"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-neutral-800 mb-1">
            শহর / জেলা (City / District) *
          </label>
          <input
            type="text"
            name="city"
            required
            value={formData.city}
            onChange={handleChange}
            placeholder="যেমন: Dhaka / Chittagong / Sylhet"
            className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:outline-none focus:border-amber-600 bg-neutral-50/50 focus:bg-white transition"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-800 mb-1">
            ইমেইল এড্রেস (Email - ঐচ্ছিক)
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="অর্ডার রিসিপ্ট পাওয়ার জন্য"
            className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:outline-none focus:border-amber-600 bg-neutral-50/50 focus:bg-white transition"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-neutral-800 mb-1">
          অর্ডারের বিশেষ নোট (Optional)
        </label>
        <textarea
          name="notes"
          rows="2"
          value={formData.notes}
          onChange={handleChange}
          placeholder="যেমন: গেট নম্বর, ডেলিভারির আগে কল করবেন ইত্যাদি..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:outline-none focus:border-amber-600 bg-neutral-50/50 focus:bg-white transition"
        />
      </div>
    </div>
  );
}
