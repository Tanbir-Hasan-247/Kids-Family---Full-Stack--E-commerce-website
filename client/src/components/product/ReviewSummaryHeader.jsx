import React from 'react';
import { Camera, Star } from 'lucide-react';

export default function ReviewSummaryHeader({
  currentAvg,
  currentCount,
  showForm,
  onToggleForm,
}) {
  return (
    <div className="bg-gradient-to-br from-amber-50/70 via-white to-emerald-50/40 rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black">
            <Camera className="w-3.5 h-3.5 text-amber-800" />
            <span>রিয়েল কাস্টমার ফটো রিভিউ</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            বাচ্চাদের পরিহিত পোশাক ও কাস্টমার রিভিউ
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 max-w-xl">
            যারা এই ড্রেসটি কিনেছেন তাদের আসল ছবি এবং সন্তুষ্টির রিভিউ দেখে নিশ্চিন্তে অর্ডার করুন।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6 bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
          <div className="text-center sm:text-left">
            <div className="text-3xl sm:text-4xl font-black text-[#1b3b2b] tracking-tight flex items-baseline gap-1">
              <span>{currentAvg}</span>
              <span className="text-xs text-neutral-400 font-semibold">/ 5.0</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(Number(currentAvg))
                      ? 'text-amber-500 fill-amber-500'
                      : 'text-neutral-200 fill-neutral-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] text-neutral-500 font-bold block mt-1">
              ({currentCount} টি ভেরিফাইড রিভিউ)
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleForm}
            className="px-5 py-3 rounded-xl bg-[#1b3b2b] hover:bg-[#142e22] text-amber-400 font-black text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Camera className="w-4 h-4 text-amber-400" />
            <span>{showForm ? 'ফর্ম বন্ধ করুন' : 'বাচ্চার ছবি ও রিভিউ দিন'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
