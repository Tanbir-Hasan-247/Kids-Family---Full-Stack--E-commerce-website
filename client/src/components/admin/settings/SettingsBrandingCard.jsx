import React from 'react';
import { Store } from 'lucide-react';

const SettingsBrandingCard = ({ formData, onChange }) => {
  return (
    <div className="bg-white border border-neutral-200/80 rounded-3xl p-5 sm:p-7 shadow-xs space-y-5">
      <div className="flex items-center gap-2.5 border-b border-neutral-100 pb-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-700 flex items-center justify-center">
          <Store className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-neutral-900">
            শপের পরিচয় ও ব্র্যান্ডিং (Shop Branding)
          </h3>
          <p className="text-[11px] text-neutral-500">
            শপের নাম, স্লোগান এবং ফুটার বিবরণ
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1.5">
            শপের নাম (Shop Name) *
          </label>
          <input
            type="text"
            required
            value={formData.shop_name}
            onChange={(e) => onChange('shop_name', e.target.value)}
            placeholder="e.g. Kids & Family"
            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b] bg-white font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1.5">
            শপের স্লোগান / ট্যাগলাইন
          </label>
          <input
            type="text"
            value={formData.tagline}
            onChange={(e) => onChange('tagline', e.target.value)}
            placeholder="e.g. Premium Family Lifestyle & Outfits"
            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b] bg-white font-medium"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-neutral-700 mb-1.5">
            ফুটার এবাউট বিবরণ (About Description in Footer)
          </label>
          <textarea
            rows={2}
            value={formData.footer_about}
            onChange={(e) => onChange('footer_about', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b] bg-white font-medium"
          />
        </div>
      </div>
    </div>
  );
};

export default SettingsBrandingCard;
