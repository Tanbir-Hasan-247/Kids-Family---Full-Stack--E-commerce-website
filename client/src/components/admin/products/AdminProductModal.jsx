import React from 'react';
import { X, Check, Layers, Plus } from 'lucide-react';
import AdminProductInfoForm from './AdminProductInfoForm';
import AdminProductVariantRow from './AdminProductVariantRow';

const AdminProductModal = ({
  isOpen,
  onClose,
  editingProduct,
  formData,
  setFormData,
  categories,
  isGeneratingDescription,
  handleGenerateAIDescription,
  variantsList,
  handleAddVariantRow,
  handleRemoveVariantRow,
  handleVariantChange,
  handleVariantImageChange,
  colorType,
  sizeType,
  formError,
  formSuccess,
  formSubmitting,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2 sm:p-4 overflow-y-auto backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-3xl w-full space-y-6 shadow-2xl my-6 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4 sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-lg font-black text-neutral-900">
              {editingProduct ? 'Edit Product & Variants' : 'Add New Product'}
            </h3>
            <p className="text-[11px] text-neutral-400">
              Configure details and upload multiple variant images
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {formError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {formError}
          </div>
        )}
        {formSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{formSuccess}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6 text-xs">
          {/* SECTION 1: Product Basics */}
          <AdminProductInfoForm
            formData={formData}
            onChange={setFormData}
            categories={categories}
            onGenerateAIDescription={handleGenerateAIDescription}
            isGeneratingDescription={isGeneratingDescription}
          />

          {/* SECTION 2: Variants & Multiple Images */}
          <div className="bg-neutral-50/80 p-4 sm:p-5 rounded-2xl border border-neutral-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200/70 pb-3">
              <div>
                <h4 className="font-bold text-neutral-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#1b3b2b]" />
                  <span>2. Product Variants & Images ({variantsList.length})</span>
                </h4>
                <p className="text-[11px] text-neutral-500">
                  Add colors, sizes, inventory, and upload high-resolution images for each variant.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddVariantRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1b3b2b] hover:bg-[#142e22] text-amber-400 font-bold text-xs rounded-full shadow-xs transition self-start sm:self-auto cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Variant</span>
              </button>
            </div>

            {/* List of Variant Cards */}
            <div className="space-y-4">
              {variantsList.map((variant, index) => (
                <AdminProductVariantRow
                  key={variant.id || variant.tempId || index}
                  variant={variant}
                  index={index}
                  totalVariants={variantsList.length}
                  colorType={colorType}
                  sizeType={sizeType}
                  onChange={handleVariantChange}
                  onImageChange={handleVariantImageChange}
                  onRemove={handleRemoveVariantRow}
                />
              ))}
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex gap-3 pt-4 border-t border-neutral-100 sticky bottom-0 bg-white py-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-neutral-200 text-neutral-700 font-bold hover:bg-neutral-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="flex-1 py-3 rounded-xl bg-[#1b3b2b] hover:bg-[#142e22] text-amber-400 font-extrabold shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {formSubmitting
                ? 'Saving Product & Variants...'
                : editingProduct
                  ? 'Save Changes'
                  : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminProductModal;
