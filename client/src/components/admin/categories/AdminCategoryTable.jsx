import React from 'react';
import { Package, Edit2, Trash2 } from 'lucide-react';

const AdminCategoryTable = ({ loading, categories, onEdit, onDelete }) => {
  return (
    <div className="hidden md:block bg-white border border-neutral-200/80 rounded-3xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50/50 text-[11px] text-neutral-400 uppercase tracking-wider">
              <th className="py-3.5 px-5 font-bold">Category Name</th>
              <th className="py-3.5 px-4 font-bold">Slug</th>
              <th className="py-3.5 px-4 font-bold">Parent Category</th>
              <th className="py-3.5 px-4 font-bold">Products</th>
              <th className="py-3.5 px-5 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-xs text-neutral-400">
                  Loading categories...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-xs text-neutral-400">
                  No categories found. Click "Add Category" to create one.
                </td>
              </tr>
            ) : (
              categories.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-50/70 transition">
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-900 text-xs sm:text-sm">
                        {c.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-neutral-500">
                    {c.slug}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-neutral-600 font-medium">
                    {c.parent_name || '— Root Category —'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700">
                      <Package className="w-3 h-3 text-neutral-400" />
                      <span>{c.product_count || 0}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => onEdit(c)}
                        className="p-1.5 rounded-lg text-neutral-500 hover:text-[#1b3b2b] hover:bg-neutral-100 transition cursor-pointer"
                        title="Edit Category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(c.id)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCategoryTable;
