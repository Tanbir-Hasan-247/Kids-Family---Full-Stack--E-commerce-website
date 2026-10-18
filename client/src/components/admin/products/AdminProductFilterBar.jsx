import React from 'react';
import { Search, Plus } from 'lucide-react';

const AdminProductFilterBar = ({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  totalCount,
  onAddProduct,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2 bg-white rounded-full border border-neutral-200 text-xs text-neutral-800 focus:outline-none focus:border-[#1b3b2b]"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex bg-neutral-200/70 p-1 rounded-full text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => onStatusFilterChange('all')}
            className={`px-3 py-1 rounded-full transition cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => onStatusFilterChange('active')}
            className={`px-3 py-1 rounded-full transition cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => onStatusFilterChange('inactive')}
            className={`px-3 py-1 rounded-full transition cursor-pointer ${
              statusFilter === 'inactive'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Inactive
          </button>
        </div>
      </div>

      <button
        onClick={onAddProduct}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1b3b2b] hover:bg-[#142e22] text-amber-400 font-extrabold text-xs rounded-full shadow-md transition shrink-0 cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>Add Product</span>
      </button>
    </div>
  );
};

export default AdminProductFilterBar;
