import React from 'react';
import { Trash2, Image as ImageIcon } from 'lucide-react';

const AdminProductVariantRow = ({
  variant,
  index,
  totalVariants,
  colorType,
  sizeType,
  onChange,
  onImageChange,
  onRemove,
}) => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs space-y-3 relative group">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
        <span className="font-extrabold text-[#1b3b2b] text-xs">
          Variant #{index + 1}
        </span>
        {totalVariants > 1 && (
          <button
            type="button"
            onClick={() => onRemove(index, variant)}
            className="text-neutral-400 hover:text-rose-600 transition p-1 cursor-pointer"
            title="Remove Variant"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Variant fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-neutral-600 mb-1">
            SKU *
          </label>
          <input
            type="text"
            required
            value={variant.sku}
            onChange={(e) => onChange(index, 'sku', e.target.value)}
            placeholder="e.g. KP-RED-M"
            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b]"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-neutral-600 mb-1">
            Selling Price (৳) *
          </label>
          <input
            type="number"
            required
            value={variant.price}
            onChange={(e) => onChange(index, 'price', e.target.value)}
            placeholder="1450"
            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b]"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-neutral-600 mb-1">
            Original Price (৳)
          </label>
          <input
            type="number"
            value={variant.compare_at_price}
            onChange={(e) => onChange(index, 'compare_at_price', e.target.value)}
            placeholder="Optional (Sale)"
            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b]"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-neutral-600 mb-1">
            Stock Qty *
          </label>
          <input
            type="number"
            required
            value={variant.stock}
            onChange={(e) => onChange(index, 'stock', Number(e.target.value))}
            placeholder="30"
            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 text-xs focus:outline-none focus:border-[#1b3b2b]"
          />
        </div>
      </div>

      {/* Attributes (Color, Size) & Image */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 items-center">
        {/* Color */}
        <div>
          <label className="block text-[11px] font-bold text-neutral-600 mb-1">
            Color Attribute
          </label>
          <select
            value={variant.colorId}
            onChange={(e) => onChange(index, 'colorId', e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 text-xs bg-white focus:outline-none focus:border-[#1b3b2b]"
          >
            <option value="">— Select Color —</option>
            {colorType?.values?.map((v) => (
              <option key={v.id} value={v.id}>
                {v.value}
              </option>
            ))}
          </select>
        </div>

        {/* Size */}
        <div>
          <label className="block text-[11px] font-bold text-neutral-600 mb-1">
            Size Attribute
          </label>
          <select
            value={variant.sizeId}
            onChange={(e) => onChange(index, 'sizeId', e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 text-xs bg-white focus:outline-none focus:border-[#1b3b2b]"
          >
            <option value="">— Select Size —</option>
            {sizeType?.values?.map((v) => (
              <option key={v.id} value={v.id}>
                {v.value}
              </option>
            ))}
          </select>
        </div>

        {/* Variant Image Upload */}
        <div>
          <label className="block text-[11px] font-bold text-neutral-600 mb-1">
            Variant Image
          </label>
          <div className="flex items-center gap-2">
            {variant.imagePreview ? (
              <div className="w-9 h-9 rounded-lg overflow-hidden border border-neutral-200 shrink-0">
                <img
                  src={variant.imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400 shrink-0">
                <ImageIcon className="w-4 h-4" />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onImageChange(index, e.target.files[0])}
              className="w-full text-[11px] text-neutral-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-[#1b3b2b]/10 file:text-[#1b3b2b] cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProductVariantRow;
