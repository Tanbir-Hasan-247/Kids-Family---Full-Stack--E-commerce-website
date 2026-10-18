import React from 'react';
import { X } from 'lucide-react';

const AdminBannerModal = ({
  isOpen,
  onClose,
  errorMsg,
  formData,
  setFormData,
  setImageFile,
  isSubmitting,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <h3 className="text-lg font-black text-neutral-900">Add Promo Banner</h3>
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

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-neutral-700 mb-1">Banner Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Free Delivery on Orders Over ৳1500"
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-neutral-700 mb-1">Badge Text</label>
              <input
                type="text"
                value={formData.badge_text}
                onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                placeholder="e.g. SPECIAL OFFER"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b]"
              />
            </div>
            <div>
              <label className="block font-bold text-neutral-700 mb-1">Theme Color</label>
              <select
                value={formData.background_color}
                onChange={(e) =>
                  setFormData({ ...formData, background_color: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs bg-white focus:outline-none focus:border-[#1b3b2b]"
              >
                <option value="pinedeep">Deep Pine Green</option>
                <option value="pine">Pine Green</option>
                <option value="mustard">Mustard Gold</option>
                <option value="clay">Terracotta Clay</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-neutral-700 mb-1">Target Link</label>
              <input
                type="text"
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b]"
              />
            </div>
            <div>
              <label className="block font-bold text-neutral-700 mb-1">Order</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-neutral-700 mb-1">Optional Banner Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
              className="w-full text-xs text-neutral-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#1b3b2b]/10 file:text-[#1b3b2b] cursor-pointer"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 font-bold hover:bg-neutral-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-[#1b3b2b] hover:bg-[#142e22] text-amber-400 font-extrabold shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : 'Create Banner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminBannerModal;

