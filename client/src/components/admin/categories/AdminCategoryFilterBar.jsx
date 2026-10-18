import React from 'react';
import { Search, Plus } from 'lucide-react';

const AdminCategoryFilterBar = ({ search, onSearchChange, onAddCategory }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search categories..."
          className="w-full pl-10 pr-4 py-2 bg-white rounded-full border border-neutral-200 text-xs text-neutral-800 focus:outline-none focus:border-[#1b3b2b]"
        />
      </div>

      <button
        onClick={onAddCategory}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1b3b2b] hover:bg-[#142e22] text-amber-400 font-extrabold text-xs rounded-full shadow-md transition shrink-0 cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>Add Category</span>
      </button>
    </div>
  );
};

export default AdminCategoryFilterBar;
