import React from 'react';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import { formatImageUrl } from '../../../api/axios';

const COLOR_MAP = {
  pine: 'bg-[#1b3b2b] text-white',
  pinedeep: 'bg-[#142e22] text-white',
  mustard: 'bg-amber-500 text-neutral-950',
  clay: 'bg-orange-700 text-white',
};

const AdminBannerCard = ({ banner, onToggle, onDelete }) => {
  return (
    <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <div
          className={`w-20 h-14 rounded-2xl shrink-0 flex items-center justify-center font-bold text-xs overflow-hidden ${
            COLOR_MAP[banner.background_color] || 'bg-neutral-800 text-white'
          }`}
        >
          {banner.image ? (
            <img
              src={formatImageUrl(banner.image)}
              alt={banner.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{banner.badge_text || 'Banner'}</span>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-neutral-900">{banner.title}</span>
            {banner.badge_text && (
              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                {banner.badge_text}
              </span>
            )}
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
            Order: {banner.order} &middot; Color: {banner.background_color} &middot; Link: {banner.link_url}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 w-full sm:w-auto pt-2 border-t border-neutral-100 sm:border-t-0 sm:pt-0">
        <span
          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
            banner.is_active
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-neutral-200 text-neutral-600'
          }`}
        >
          {banner.is_active ? 'Active' : 'Hidden'}
        </span>

        <button
          onClick={() => onToggle(banner.id)}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 transition cursor-pointer"
          title={banner.is_active ? 'Turn off' : 'Turn on'}
        >
          {banner.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>

        <button
          onClick={() => onDelete(banner.id)}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 transition cursor-pointer"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AdminBannerCard;

