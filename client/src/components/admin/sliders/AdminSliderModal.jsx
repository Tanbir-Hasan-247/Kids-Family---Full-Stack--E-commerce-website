import React from 'react';
import { X, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { formatImageUrl } from '../../../api/axios';

const AdminSliderModal = ({
  isOpen,
  onClose,
  editingSlider,
  errorMsg,
  formData,
  setFormData,
  previewUrl,
  setImageFile,
  setMobileImageFile,
  showAdvanced,
  setShowAdvanced,
  isSubmitting,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <h3 className="text-lg font-black text-neutral-900">
            {editingSlider ? 'Edit Hero Slider' : 'Add Hero Slider'}
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {errorMsg}
          </div>
        )}

        <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/80 text-emerald-900 rounded-2xl text-xs space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>GhorerBazar স্টাইল সিঙ্গেল ব্যানার সিস্টেম:</span>
          </p>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            ব্যানার ইমেজের ভেতরেই আকর্ষণীয় ডিজাইন, অফার ও লেখা যুক্ত করে ১টি ইমেজ আপলোড করুন। সাইটের মোবাইল, ট্যাবলেট ও পিসি সব ডিভাইসে কোনো ক্রপিং বা লেখা কাটা ছাড়াই স্বয়ংক্রিয়ভাবে পারফেক্ট সাইজে অ্যাডজাস্ট হবে।
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          {/* 1. Primary Banner Image Upload */}
          <div className="space-y-2">
            <label className="block font-bold text-neutral-800">
              ব্যানার ইমেজ (Banner Image) <span className="text-rose-500">*</span>
            </label>

            {/* Image Preview Box */}
            {(previewUrl || editingSlider?.image) && (
              <div className="relative w-full aspect-[21/8] max-h-40 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-200 shadow-inner group">
                <img
                  src={previewUrl || formatImageUrl(editingSlider.image)}
                  alt="Banner Preview"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 right-2 bg-black/70 text-white font-semibold text-[10px] px-2 py-0.5 rounded backdrop-blur-xs">
                  {previewUrl ? 'নতুন সিলেক্ট করা ব্যানার' : 'বর্তমান ব্যানার'}
                </span>
              </div>
            )}

            <div className="relative">
              <input
                type="file"
                accept="image/*"
                id="banner-file-input"
                onChange={(e) => setImageFile(e.target.files[0])}
                className="w-full text-xs text-neutral-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#1b3b2b]/10 file:text-[#1b3b2b] hover:file:bg-[#1b3b2b]/20 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-neutral-500">
              💡 প্রস্তাবিত সাইজ: <strong>1000 × 400 px</strong> বা <strong>1600 × 640 px</strong> (Ghorer Bazar স্ট্যান্ডার্ড 2.5:1 রেশিও)। মোবাইলের জন্য আলাদা দিতে চাইলে 500 × 280 px (16:9 রেশিও)।
            </p>
          </div>

          {/* 2. Target Link URL */}
          <div>
            <label className="block font-bold text-neutral-800 mb-1">
              ক্লিক করলে কোন পেজে যাবে (Target Link URL)
            </label>
            <input
              type="text"
              value={formData.link_url}
              onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
              placeholder="/products (বা /products?category=panjabi)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b]"
            />
            <p className="text-[10px] text-neutral-400 mt-1">ডিফল্টভাবে <code>/products</code> পেজে যাবে। ভিজিটর ব্যানারে যেকোনো জায়গায় ক্লিক করলে এই লিংকে চলে যাবে।</p>
          </div>

          {/* 3. Title (Optional) */}
          <div>
            <label className="block font-bold text-neutral-800 mb-1">
              ব্যানারের নাম (Title - ঐচ্ছিক)
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="যেমন: ঈদ স্পেশাল কালেকশন (ফাঁকা রাখলে ব্যানার #১ স্বয়ংক্রিয়ভাবে হবে)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b]"
            />
          </div>

          {/* 4. Display Order & Status */}
          <div className="grid grid-cols-2 gap-4 items-center pt-1">
            <div>
              <label className="block font-bold text-neutral-800 mb-1">প্রদর্শনের ক্রম (Order)</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b]"
              />
            </div>
            <div className="pt-5">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-neutral-800">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded text-[#1b3b2b] focus:ring-[#1b3b2b] w-4 h-4"
                />
                <span>ওয়েবসাইটে লাইভ দেখাবে</span>
              </label>
            </div>
          </div>

          {/* 5. Collapsible Advanced Settings (Optional Subtitle, Badge, Mobile Image) */}
          <div className="border border-neutral-200/80 rounded-2xl overflow-hidden pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full px-4 py-2.5 bg-neutral-50/80 hover:bg-neutral-100 flex items-center justify-between text-neutral-700 font-bold text-xs transition cursor-pointer"
            >
              <span>অতিরিক্ত সেটিংস (ঐচ্ছিক)</span>
              {showAdvanced ? (
                <ChevronUp className="w-4 h-4 text-neutral-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-neutral-500" />
              )}
            </button>

            {showAdvanced && (
              <div className="p-4 space-y-3 bg-white border-t border-neutral-100">
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">সাবটাইটেল (Subtitle)</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="ট্যাগলাইন বা অফার ডেসক্রিপশন"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">ব্যাজ টেক্সট (Badge)</label>
                    <input
                      type="text"
                      value={formData.badge_text}
                      onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                      placeholder="যেমন: ৩০% ছাড়"
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b]"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">বাটন টেক্সট (CTA)</label>
                    <input
                      type="text"
                      value={formData.cta_text}
                      onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                      placeholder="যেমন: শপ নাও"
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-neutral-700 mb-1">
                    আলাদা মোবাইল ব্যানার (ঐচ্ছিক)
                  </label>
                  {editingSlider?.mobile_image && (
                    <div className="mb-2 w-16 h-16 rounded-lg overflow-hidden border border-neutral-200">
                      <img src={formatImageUrl(editingSlider.mobile_image)} alt="Current Mobile" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setMobileImageFile(e.target.files[0])}
                    className="w-full text-xs text-neutral-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-amber-100 file:text-amber-900 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Modal Buttons */}
          <div className="flex gap-3 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 font-bold hover:bg-neutral-50 transition cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-[#1b3b2b] hover:bg-[#142e22] text-amber-400 font-extrabold shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'সেভ হচ্ছে...' : editingSlider ? 'পরিবর্তন সংরক্ষণ করুন' : 'ব্যানার যোগ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSliderModal;
