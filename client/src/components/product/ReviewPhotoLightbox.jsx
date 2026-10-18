import React from 'react';
import { X, Star } from 'lucide-react';

export default function ReviewPhotoLightbox({
  zoomedImage,
  onClose,
}) {
  if (!zoomedImage) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="max-h-[70vh] bg-neutral-950 flex items-center justify-center overflow-hidden">
          <img
            src={zoomedImage.image_url || zoomedImage.image}
            alt="Enlarged review photo"
            className="max-h-[70vh] w-auto object-contain"
          />
        </div>

        <div className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-neutral-900">
                {zoomedImage.user_name}
              </h4>
              <span className="text-[11px] text-neutral-400">
                {zoomedImage.created_at
                  ? new Date(zoomedImage.created_at).toLocaleDateString()
                  : ''}
              </span>
            </div>
            <div className="flex items-center gap-0.5">
              {[...Array(Number(zoomedImage.rating || 5))].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />
              ))}
            </div>
          </div>
          <p className="text-xs text-neutral-700 leading-relaxed">
            {zoomedImage.comment}
          </p>
        </div>
      </div>
    </div>
  );
}
