import React from 'react';
import { Package, Edit2, Trash2 } from 'lucide-react';
import { formatImageUrl } from '../../../api/axios';

const AdminProductMobileCards = ({ loading, products, onEdit, onDelete }) => {
  return (
    <div className="md:hidden space-y-3">
      {loading ? (
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-8 text-center text-xs text-neutral-400">
          Loading products...
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-8 text-center text-xs text-neutral-400">
          No products found. Click "Add Product" to create one.
        </div>
      ) : (
        products.map((p) => {
          const thumb = p.thumbnail ? formatImageUrl(p.thumbnail) : '';

          return (
            <div
              key={p.id}
              className="bg-white border border-neutral-200/80 rounded-2xl p-3.5 shadow-xs space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 rounded-xl bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0 flex items-center justify-center">
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-6 h-6 text-neutral-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1.5">
                    <p className="font-bold text-neutral-900 text-xs line-clamp-2 leading-snug">
                      {p.name}
                    </p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        p.is_active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-neutral-200 text-neutral-600'
                      }`}
                    >
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-neutral-500 mt-1">
                    {p.category_name || p.category?.name || '—'}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100">
                    <span className="font-black text-sm text-[#1b3b2b]">
                      ৳{Number(p.base_price || p.starting_price || 0).toLocaleString()}
                    </span>
                    <span className="text-[11px] text-neutral-500 font-medium">
                      {p.variants_count || p.variants?.length || 0} variant(s)
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
                <button
                  onClick={() => onEdit(p)}
                  className="flex-1 py-2 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-[#1b3b2b] text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Product</span>
                </button>
                <button
                  onClick={() => onDelete(p.id)}
                  className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer"
                  title="Delete Product"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default AdminProductMobileCards;
