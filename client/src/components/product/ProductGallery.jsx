import React from 'react';
import { formatImageUrl } from '../../api/axios';

export default function ProductGallery({
  product,
  activeVariant,
  displayImage,
  onSelectVariant,
}) {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="aspect-3/4 rounded-2xl sm:rounded-3xl overflow-hidden bg-neutral-100 border border-neutral-200/80 shadow-md relative group">
        <img
          src={displayImage}
          alt={product.name}
          className="w-full h-full object-cover object-center"
        />
        {activeVariant?.is_on_sale && activeVariant.discount_percent > 0 && (
          <span className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-rose-600 text-white text-[11px] sm:text-xs font-black px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full shadow-md">
            {activeVariant.discount_percent}% OFF
          </span>
        )}
      </div>

      {/* Variant / Gallery Thumbnails */}
      {product.variants && product.variants.length > 1 && (
        <div className="flex gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar pt-1">
          {product.variants.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelectVariant(v)}
              className={`w-14 h-18 sm:w-16 sm:h-20 rounded-xl overflow-hidden border-2 shrink-0 transition cursor-pointer ${
                activeVariant?.id === v.id
                  ? 'border-[#1b3b2b] shadow-sm ring-2 ring-[#1b3b2b]/20'
                  : 'border-neutral-200 opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={formatImageUrl(v.image) || displayImage}
                alt={v.sku}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
