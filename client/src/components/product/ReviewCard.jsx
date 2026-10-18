import React from 'react';
import { Star } from 'lucide-react';

export default function ReviewCard({ review, onZoomImage }) {
  const img = review.image_url || review.image;

  return (
    <div className="bg-white rounded-2xl p-5 border border-neutral-200/90 shadow-2xs hover:shadow-md transition space-y-3 flex flex-col justify-between">
      <div className="space-y-2.5">
        {/* Review Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#1b3b2b] to-emerald-700 text-amber-400 font-black text-xs flex items-center justify-center shrink-0 uppercase shadow-xs">
              {review.user_name ? review.user_name.charAt(0) : 'K'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-neutral-900">
                  {review.user_name || 'সম্মানিত কাস্টমার'}
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded-full font-bold">
                  Verified
                </span>
              </div>
              <span className="text-[10px] text-neutral-400 block">
                {review.created_at
                  ? new Date(review.created_at).toLocaleDateString('bn-BD')
                  : 'সম্প্রতি'}
              </span>
            </div>
          </div>

          {/* Stars */}
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((st) => (
              <Star
                key={st}
                className={`w-3.5 h-3.5 ${
                  st <= Number(review.rating || 5)
                    ? 'text-amber-500 fill-amber-500'
                    : 'text-neutral-200 fill-neutral-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Comment text */}
        <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed font-normal">
          {review.comment}
        </p>
      </div>

      {/* Customer Photo (if attached) */}
      {img && (
        <div className="pt-2 border-t border-neutral-100 flex items-center gap-3">
          <div
            onClick={() => onZoomImage(review)}
            className="group relative w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden border border-neutral-200 shrink-0 cursor-pointer shadow-xs hover:border-amber-500 transition"
          >
            <img
              src={img}
              alt="Customer photo"
              className="w-full h-full object-cover group-hover:scale-105 transition"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition" />
          </div>
          <div className="text-xs text-neutral-500">
            <span className="font-bold text-neutral-700 block">কাস্টমার আপলোড</span>
            <span className="text-[11px] text-neutral-400">ট্যাপ করে ছবি বড় করুন 🔍</span>
          </div>
        </div>
      )}
    </div>
  );
}
