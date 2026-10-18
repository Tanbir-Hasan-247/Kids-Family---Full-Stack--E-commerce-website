import React from 'react';
import { Sparkles } from 'lucide-react';

export default function ProductAiSearchBanner({
  searchQuery,
  isAiMatched,
  aiSearchSummary,
  onResetSearch,
}) {
  if (!searchQuery) return null;

  return (
    <div
      className={`mb-5 p-3.5 sm:p-4 rounded-2xl border transition shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isAiMatched
          ? 'bg-linear-to-r from-amber-50 via-emerald-50 to-amber-50 border-amber-300'
          : 'bg-white border-neutral-200'
      }`}
    >
      <div className="flex items-start sm:items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-[#1b3b2b] to-emerald-700 text-amber-300 flex items-center justify-center shrink-0 shadow-xs">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300">
              {isAiMatched ? '🤖 AI ন্যাচারাল সার্চ' : '🔎 সার্চ ফলাফল'}
            </span>
            <span className="text-xs font-bold text-neutral-800 italic">
              "{searchQuery}"
            </span>
          </div>
          <p className="text-xs text-neutral-600 mt-1">
            {aiSearchSummary || 'আপনার কাঙ্ক্ষিত চাহিদার প্রেক্ষিতে ফিল্টার করা পণ্যসমূহ:'}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onResetSearch}
        className="self-end sm:self-auto px-3 py-1.5 rounded-xl border border-neutral-300 bg-white text-xs font-bold text-neutral-700 hover:text-rose-600 hover:border-rose-300 transition shadow-2xs cursor-pointer"
      >
        ফিল্টার রিসেট
      </button>
    </div>
  );
}
