import React from 'react';
import { Eye, EyeOff, Edit2, Trash2 } from 'lucide-react';
import { formatImageUrl } from '../../../api/axios';

const AdminSliderCard = ({ slide, onToggle, onEdit, onDelete }) => {
  const desktopImg = formatImageUrl(slide.image);
  const mobileImg = slide.mobile_image ? formatImageUrl(slide.mobile_image) : null;

  return (
    <div className="bg-white border border-neutral-200/80 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center gap-5 hover:border-neutral-300 transition">
      {/* Banner Preview Thumbnail */}
      <div className="relative w-full md:w-56 h-32 rounded-2xl overflow-hidden bg-neutral-900 shrink-0 border border-neutral-200">
        <img
          src={desktopImg}
          alt={slide.title}
          className="w-full h-full object-cover"
        />
        {slide.badge_text && (
          <span className="absolute top-2 left-2 bg-amber-400 text-neutral-950 font-bold text-[10px] px-2 py-0.5 rounded-md shadow-xs">
            {slide.badge_text}
          </span>
        )}
        {mobileImg && (
          <span className="absolute bottom-2 right-2 bg-black/70 text-white font-semibold text-[9px] px-1.5 py-0.5 rounded backdrop-blur-xs">
            +Mobile Img
          </span>
        )}
      </div>

      {/* Slide Info */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-neutral-400">
            Order #{slide.order}
          </span>
          <span
            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
              slide.is_active
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-neutral-200 text-neutral-600'
            }`}
          >
            {slide.is_active ? 'Live' : 'Hidden'}
          </span>
        </div>

        <h3 className="text-base font-bold text-neutral-900 leading-snug">
          {slide.title}
        </h3>

        {slide.subtitle && (
          <p className="text-xs text-neutral-500 line-clamp-2">{slide.subtitle}</p>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-neutral-400">
          <span>CTA: <strong className="text-neutral-700">{slide.cta_text}</strong></span>
          <span>Link: <strong className="text-neutral-700">{slide.link_url}</strong></span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 w-full md:w-auto pt-2 border-t border-neutral-100 md:border-t-0 md:pt-0 shrink-0">
        <button
          onClick={() => onToggle(slide.id)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition border cursor-pointer ${
            slide.is_active
              ? 'border-neutral-200 text-neutral-600 hover:bg-neutral-100'
              : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
          }`}
        >
          {slide.is_active ? (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>Hide</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>Show</span>
            </>
          )}
        </button>

        <button
          onClick={() => onEdit(slide)}
          className="p-2 rounded-full text-neutral-500 hover:text-[#1b3b2b] hover:bg-neutral-100 transition cursor-pointer"
          title="Edit Slide"
        >
          <Edit2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => onDelete(slide.id)}
          className="p-2 rounded-full text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
          title="Delete Slide"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AdminSliderCard;
