import React from 'react';
import { X } from 'lucide-react';

const AdminCategoryModal = ({
  isOpen,
  onClose,
  editingCategory,
  categories,
  errorMsg,
  formData,
  setFormData,
  isSubmitting,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <h3 className="text-lg font-black text-neutral-900">
            {editingCategory ? 'Edit Category' : 'Add New Category'}
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

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-neutral-700 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Winter Collection"
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b]"
            />
          </div>

          <div>
            <label className="block font-bold text-neutral-700 mb-1">
              Slug (Optional, auto-generated if blank)
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="e.g. winter-collection"
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b]"
            />
          </div>

          <div>
            <label className="block font-bold text-neutral-700 mb-1">
              Parent Category (Optional)
            </label>
            <select
              value={formData.parent}
              onChange={(e) => setFormData({ ...formData, parent: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs bg-white focus:outline-none focus:border-[#1b3b2b]"
            >
              <option value="">— None (Top-Level Category) —</option>
              {categories
                .filter((c) => !editingCategory || c.id !== editingCategory.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
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
              {isSubmitting
                ? 'Saving...'
                : editingCategory
                  ? 'Update Category'
                  : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminCategoryModal;
