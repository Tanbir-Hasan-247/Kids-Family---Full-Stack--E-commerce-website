import React from 'react';
import { Search } from 'lucide-react';

export default function ProductEmptyState({ onReset, hasFilters = true }) {
  return (
    <div className="py-16 sm:py-24 text-center bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-8 space-y-4 shadow-xs">
      <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mx-auto">
        <Search className="w-6 h-6" />
      </div>
      <p className="text-base font-bold text-neutral-900">
        কোনো পণ্য খুঁজে পাওয়া যায়নি
      </p>
      <p className="text-xs text-neutral-500 max-w-sm mx-auto">
        {hasFilters
          ? 'আপনার নির্বাচিত ফিল্টারের সাথে মিলে এমন কোনো পণ্য নেই। অনুগ্রহ করে ফিল্টার পরিবর্তন করুন।'
          : 'স্টোরে বর্তমানে কোনো পণ্য যুক্ত করা নেই। শীঘ্রই আমাদের নতুন কালেকশন যুক্ত করা হবে।'}
      </p>
      {hasFilters && (
        <button
          type="button"
          onClick={onReset}
          className="px-6 py-2.5 bg-[#1b3b2b] text-white rounded-full text-xs font-bold hover:bg-[#153224] transition shadow-md cursor-pointer"
        >
          সকল ফিল্টার রিসেট করুন
        </button>
      )}
    </div>
  );
}
