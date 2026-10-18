import React from 'react';
import { Sparkles } from 'lucide-react';

const AdminProductInfoForm = ({
  formData,
  onChange,
  categories,
  onGenerateAIDescription,
  isGeneratingDescription,
}) => {
  return (
    <div className="bg-neutral-50/80 p-4 sm:p-5 rounded-2xl border border-neutral-200/80 space-y-4">
      <h4 className="font-bold text-neutral-900 uppercase tracking-wider text-[11px]">
        1. Product Information
      </h4>

      <div>
        <label className="block font-bold text-neutral-700 mb-1">
          Product Name *
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => onChange({ ...formData, name: e.target.value })}
          placeholder="e.g. Royal Maroon Kids Panjabi & Pajama Set"
          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:border-[#1b3b2b] text-xs bg-white"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-bold text-neutral-700 mb-1">
            Category *
          </label>
          <select
            value={formData.category}
            onChange={(e) => onChange({ ...formData, category: e.target.value })}
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:border-[#1b3b2b] text-xs bg-white"
          >
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-bold text-neutral-700 mb-1">
            Base Price (৳) *
          </label>
          <input
            type="number"
            step="0.01"
            required
            value={formData.base_price}
            onChange={(e) => onChange({ ...formData, base_price: e.target.value })}
            placeholder="e.g. 1450"
            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:border-[#1b3b2b] text-xs bg-white"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block font-bold text-neutral-700">
            Description / পণ্যের বিবরণ
          </label>
          <button
            type="button"
            onClick={onGenerateAIDescription}
            disabled={isGeneratingDescription || !formData.name.trim()}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg text-[11px] font-bold shadow-xs hover:shadow transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="AI দিয়ে আকর্ষণীয় বাংলা ও ইংরেজি বিবরণ স্বয়ংক্রিয়ভাবে তৈরি করুন"
          >
            <Sparkles
              className={`w-3.5 h-3.5 text-amber-200 ${
                isGeneratingDescription ? 'animate-spin' : 'animate-pulse'
              }`}
            />
            <span>{isGeneratingDescription ? 'AI বিবরণ লিখছে...' : '✨ AI দিয়ে বিবরণ লিখুন'}</span>
          </button>
        </div>
        <textarea
          rows={5}
          value={formData.description}
          onChange={(e) => onChange({ ...formData, description: e.target.value })}
          placeholder="পোশাকের বিস্তারিত কাপড়ের কোয়ালিটি, সাইজ এবং ওয়াশ কেয়ার..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:border-[#1b3b2b] text-xs bg-white leading-relaxed font-normal"
        />
      </div>

      <div className="pt-1">
        <label className="flex items-center gap-2 cursor-pointer font-bold text-neutral-700">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => onChange({ ...formData, is_active: e.target.checked })}
            className="rounded text-[#1b3b2b] focus:ring-0"
          />
          <span>Active (Publicly visible in storefront)</span>
        </label>
      </div>
    </div>
  );
};

export default AdminProductInfoForm;
