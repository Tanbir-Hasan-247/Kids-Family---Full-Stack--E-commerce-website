import React from 'react';
import { Camera, Star } from 'lucide-react';

export default function ReviewFilterPills({
  activeFilter,
  setActiveFilter,
  totalReviewsCount,
  photoReviewsCount,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 pb-2">
      <button
        type="button"
        onClick={() => setActiveFilter('all')}
        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
          activeFilter === 'all'
            ? 'bg-[#1b3b2b] text-white shadow-xs'
            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
        }`}
      >
        সব রিভিউ ({totalReviewsCount})
      </button>
      <button
        type="button"
        onClick={() => setActiveFilter('with_photos')}
        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
          activeFilter === 'with_photos'
            ? 'bg-[#1b3b2b] text-white shadow-xs'
            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
        }`}
      >
        <Camera className="w-3.5 h-3.5" />
        <span>ছক ও ছবিসহ ({photoReviewsCount})</span>
      </button>
      <button
        type="button"
        onClick={() => setActiveFilter('5_star')}
        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
          activeFilter === '5_star'
            ? 'bg-[#1b3b2b] text-white shadow-xs'
            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
        }`}
      >
        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
        <span>৫ স্টার রিভিউ</span>
      </button>
    </div>
  );
}
