import React from 'react';
import { Star, Image as ImageIcon } from 'lucide-react';

export default function ReviewPhotoGallery({
  photoReviews,
  onZoomImage,
}) {
  if (!photoReviews || photoReviews.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-neutral-800 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-amber-600" />
          <span>কাস্টমারদের আপলোড করা ছবি ({photoReviews.length})</span>
        </h3>
        <span className="text-xs text-neutral-400">ছবিতে ট্যাপ করে বড় করে দেখুন</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth">
        {photoReviews.map((item) => {
          const img = item.image_url || item.image;
          return (
            <div
              key={item.id}
              onClick={() => onZoomImage(item)}
              className="group relative w-28 h-36 sm:w-36 sm:h-44 rounded-2xl overflow-hidden shrink-0 border border-neutral-200 shadow-2xs hover:shadow-lg transition cursor-pointer"
            >
              <img
                src={img}
                alt={item.user_name}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-2 text-white">
                <span className="text-[11px] font-bold truncate">{item.user_name}</span>
                <div className="flex items-center gap-0.5">
                  {[...Array(Number(item.rating || 5))].map((_, i) => (
                    <Star key={i} className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
