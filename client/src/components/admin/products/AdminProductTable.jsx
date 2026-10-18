import React from 'react';
import { Package, Edit2, Trash2 } from 'lucide-react';
import { formatImageUrl } from '../../../api/axios';

const AdminProductTable = ({ loading, products, onEdit, onDelete }) => {
  return (
    <div className="hidden md:block bg-white border border-neutral-200/80 rounded-3xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50/50 text-[11px] text-neutral-400 uppercase tracking-wider">
              <th className="py-3.5 px-5 font-bold">Product</th>
              <th className="py-3.5 px-4 font-bold">Category</th>
              <th className="py-3.5 px-4 font-bold">Base Price</th>
              <th className="py-3.5 px-4 font-bold">Variants</th>
              <th className="py-3.5 px-4 font-bold">Status</th>
              <th className="py-3.5 px-5 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-xs text-neutral-400">
                  Loading products...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-xs text-neutral-400">
                  No products found. Click "Add Product" to create one.
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const thumb = p.thumbnail ? formatImageUrl(p.thumbnail) : '';

                return (
                  <tr key={p.id} className="hover:bg-neutral-50/70 transition">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-neutral-400" />
                          )}
                        </div>
                        <div className="min-w-0 max-w-xs">
                          <p className="font-bold text-neutral-900 text-xs sm:text-sm truncate">
                            {p.name}
                          </p>
                          {p.is_featured && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-sm">
                              FEATURED
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-neutral-700">
                      {p.category_name || p.category?.name || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-black text-xs sm:text-sm text-neutral-900">
                      ৳{Number(p.base_price || p.starting_price || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-neutral-600 font-medium">
                      {p.variants_count || p.variants?.length || 0} variant(s)
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          p.is_active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-neutral-200 text-neutral-600'
                        }`}
                      >
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => onEdit(p)}
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-[#1b3b2b] hover:bg-neutral-100 transition cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(p.id)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminProductTable;
