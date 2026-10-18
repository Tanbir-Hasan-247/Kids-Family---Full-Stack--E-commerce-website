import React from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronRight } from 'lucide-react';

export default function TrackSearchBar({
  searchInput,
  setSearchInput,
  handleSearchSubmit,
  loading,
}) {
  return (
    <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm p-4 sm:p-6">
      <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="অর্ডার নাম্বার (KF...) বা মোবাইল নম্বর দিন (০১৮৭৬...)"
            className="w-full pl-11 pr-4 py-3.5 bg-neutral-50/90 rounded-2xl border border-neutral-200 text-sm font-medium focus:bg-white focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-neutral-400"
          />
          <Search className="w-5 h-5 text-neutral-400 absolute left-3.5 top-4 pointer-events-none" />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="absolute right-3.5 top-3.5 text-xs text-neutral-400 hover:text-neutral-700 p-1 rounded-full cursor-pointer"
            >
              মুছুন
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3.5 bg-[#1b3b2b] hover:bg-[#142e22] active:scale-98 text-white rounded-2xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>খোঁজা হচ্ছে...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>ট্র্যাক করুন</span>
            </>
          )}
        </button>
      </form>

      {/* Quick Help / Examples */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-500 pt-3 border-t border-neutral-100">
        <span>
          💡 টিপসঃ অর্ডার কনফার্মেশন এসএমএস বা চালানে প্রাপ্ত নম্বরটি ব্যবহার করুন।
        </span>
        <Link
          to="/orders"
          className="text-amber-700 font-bold hover:underline flex items-center gap-1"
        >
          <span>সব অর্ডারের ইতিহাস দেখুন</span>
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
