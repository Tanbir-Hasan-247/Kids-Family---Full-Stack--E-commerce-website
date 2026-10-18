import React from 'react';
import { Package, Edit2, Trash2 } from 'lucide-react';

const AdminCategoryMobileCards = ({ loading, categories, onEdit, onDelete }) => {
  return (
    <div className="md:hidden space-y-3">
      {loading ? (
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-8 text-center text-xs text-neutral-400">
          Loading categories...
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-8 text-center text-xs text-neutral-400">
          No categories found. Click "Add Category" to create one.
        </div>
      ) : (
        categories.map((c) => (
          <div
            key={c.id}
            className="bg-white border border-neutral-200/80 rounded-2xl p-3.5 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between gap-2 border-b border-neutral-100 pb-2.5">
              <div>
                <span className="font-bold text-neutral-900 text-sm block">
                  {c.name}
                </span>
                <span className="font-mono text-[11px] text-neutral-400 block mt-0.5">
                  /{c.slug}
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  c.parent_name
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                {c.parent_name ? c.parent_name : 'Root'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700">
                <Package className="w-3.5 h-3.5 text-neutral-400" />
                <span>{c.product_count || 0} product(s)</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEdit(c)}
                  className="py-1.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-[#1b3b2b] text-xs font-bold flex items-center gap-1 transition active:scale-98 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => onDelete(c.id)}
                  className="py-1.5 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold flex items-center gap-1 transition active:scale-98 cursor-pointer"
                  title="Delete Category"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default AdminCategoryMobileCards;
