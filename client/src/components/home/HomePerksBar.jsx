import React from 'react';
import { Truck, RotateCcw, ShieldCheck, Headphones } from 'lucide-react';

const HomePerksBar = () => {
  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
        <div className="p-4 sm:p-6 bg-white rounded-2xl border border-neutral-200/80 shadow-2xs hover:shadow-md transition flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
          <div className="p-2.5 sm:p-3 bg-emerald-50 text-emerald-800 rounded-xl shrink-0">
            <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-neutral-900">
              ক্যাশ অন ডেলিভারি
            </h4>
            <p className="text-[10px] sm:text-xs text-neutral-500 mt-0.5">
              সারাদেশে পার্সেল খুলে চেক করে টাকা দিন
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-6 bg-white rounded-2xl border border-neutral-200/80 shadow-2xs hover:shadow-md transition flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
          <div className="p-2.5 sm:p-3 bg-amber-50 text-amber-800 rounded-xl shrink-0">
            <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-neutral-900">
              ৭ দিনের ফ্রি এক্সচেঞ্জ
            </h4>
            <p className="text-[10px] sm:text-xs text-neutral-500 mt-0.5">
              সাইজ বা কালার সহজেই পরিবর্তন করুন
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-6 bg-white rounded-2xl border border-neutral-200/80 shadow-2xs hover:shadow-md transition flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
          <div className="p-2.5 sm:p-3 bg-blue-50 text-blue-800 rounded-xl shrink-0">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-neutral-900">
              ১০০% কম্বড সুতি কাপড়
            </h4>
            <p className="text-[10px] sm:text-xs text-neutral-500 mt-0.5">
              শিশুর কোমল ত্বকের জন্য সম্পূর্ণ নিরাপদ
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-6 bg-white rounded-2xl border border-neutral-200/80 shadow-2xs hover:shadow-md transition flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
          <div className="p-2.5 sm:p-3 bg-purple-50 text-purple-800 rounded-xl shrink-0">
            <Headphones className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-neutral-900">
              ২৪/৭ কাস্টমার সাপোর্ট
            </h4>
            <p className="text-[10px] sm:text-xs text-neutral-500 mt-0.5">
              যেকোনো প্রয়োজনে সরাসরি কল বা হোয়াটসঅ্যাপ
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomePerksBar;
